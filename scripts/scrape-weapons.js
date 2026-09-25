// Scraper único (offline) para popular data/game/weapons.json a partir do eip.gg.
// Não roda como parte do bot — é um script manual, executado uma vez (ou quando
// quisermos atualizar os dados). Resultado é salvo em JSON e lido pelo /build.
const fs = require('fs');
const path = require('path');

const UA = 'Mozilla/5.0 (compatible; EldenRingRPBot-DataBuild/1.0)';
const LIST_PAGES = 16;
const OUT_PATH = path.join(__dirname, '..', 'data', 'game', 'weapons.json');
const CONCURRENCY = 4;
const DELAY_MS = 150;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchHtml(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} em ${url}`);
  return res.text();
}

function extractRowImage(row) {
  const srcsetMatch = row.match(/<img[^>]+srcset="([^"]+)"/);
  if (srcsetMatch) {
    const candidates = srcsetMatch[1]
      .split(',')
      .map((s) => s.trim().split(/\s+/))
      .filter((c) => c[0]);
    candidates.sort((a, b) => (parseInt(b[1]) || 0) - (parseInt(a[1]) || 0));
    if (candidates[0]) return candidates[0][0];
  }
  const srcMatch = row.match(/<img[^>]+src="([^"]+)"/);
  return srcMatch ? srcMatch[1] : null;
}

function extractListingRows(html) {
  const rows = [];
  const trRegex = /<tr>([\s\S]*?)<\/tr>/g;
  let m;
  while ((m = trRegex.exec(html))) {
    const row = m[1];
    const nameMatch = row.match(
      /<a href="(https:\/\/eip\.gg\/elden-ring\/db\/[^"]+\/)" data-type="wiki-entry" data-id="(\d+)" data-key="\d+"[^>]*>([^<]+)<\/a>/
    );
    if (!nameMatch) continue;

    const [, link, id, name] = nameMatch;
    const weaponType = (row.match(/Weapon Type:\s*([^<]+)</) || [])[1] || null;
    const attackType = (row.match(/Attack Type:\s*([^<]+)</) || [])[1] || null;

    const apBlockMatch = row.match(/data-mtr-content="Attack Power"[\s\S]*?<\/td>/);
    const gdnBlockMatch = row.match(/data-mtr-content="Guarded Damage Negation"[\s\S]*?<\/td>/);

    const parseLabelPairs = (block) => {
      if (!block) return {};
      const out = {};
      const pairRegex = /<strong>(?:<span[^>]*>)?([A-Za-z]+):(?:<\/span>)?<\/strong>\s*(-?\d+)/g;
      let p;
      while ((p = pairRegex.exec(block[0]))) {
        out[p[1]] = Number(p[2]);
      }
      return out;
    };

    rows.push({
      id,
      name: name.replace(/&#8217;|’/g, "'").trim(),
      link,
      imagem: extractRowImage(row),
      weaponType: weaponType ? weaponType.trim() : null,
      attackType: attackType ? attackType.trim() : null,
      attackPower: parseLabelPairs(apBlockMatch),
      guardedDamageNegation: parseLabelPairs(gdnBlockMatch),
    });
  }
  return rows;
}

function extractDetail(html) {
  const scalingMatch = html.match(/Attribute Scaling:\s*<\/strong><\/span>([\s\S]*?)<br/);
  const requiredMatch = html.match(/Attributes Required:\s*<\/strong><\/span>([\s\S]*?)<br/);
  const weightMatch = html.match(/Weight:\s*<\/strong><\/span>\s*([\d.]+)/);
  const skillMatch = html.match(/Weapon Skill:<\/strong><\/span>&nbsp;<strong>([^<]+)<\/strong>/);

  const parseAttrPairs = (segment) => {
    if (!segment) return {};
    const out = {};
    const regex = /<strong>([A-Za-z]+)<\/strong>\s*([A-Za-z0-9-]+)/g;
    let m;
    while ((m = regex.exec(segment[0]))) {
      out[m[1]] = m[2];
    }
    return out;
  };

  return {
    attributeScaling: parseAttrPairs(scalingMatch),
    attributesRequired: Object.fromEntries(
      Object.entries(parseAttrPairs(requiredMatch)).map(([k, v]) => [k, Number(v)])
    ),
    weight: weightMatch ? Number(weightMatch[1]) : null,
    ashOfWar: skillMatch ? skillMatch[1].trim() : null,
  };
}

async function mapWithConcurrency(items, limit, fn) {
  const results = new Array(items.length);
  let idx = 0;
  async function worker() {
    while (idx < items.length) {
      const current = idx++;
      results[current] = await fn(items[current], current);
      await sleep(DELAY_MS);
    }
  }
  await Promise.all(Array.from({ length: limit }, worker));
  return results;
}

async function main() {
  console.log('Buscando listagem de armas (16 páginas)...');
  const listing = [];
  for (let page = 1; page <= LIST_PAGES; page++) {
    const url =
      page === 1
        ? 'https://eip.gg/elden-ring/db/weapons/'
        : `https://eip.gg/elden-ring/db/weapons/?wpv_view_count=89928-TCPID89932&wpv_paged=${page}`;
    const html = await fetchHtml(url);
    const rows = extractListingRows(html);
    console.log(`  página ${page}: ${rows.length} armas`);
    listing.push(...rows);
    await sleep(DELAY_MS);
  }

  const seen = new Set();
  const uniqueListing = listing.filter((w) => {
    if (seen.has(w.id)) return false;
    seen.add(w.id);
    return true;
  });
  console.log(`Total de armas únicas: ${uniqueListing.length}`);

  console.log('Buscando detalhes (escalonamento/requisitos) de cada arma...');
  let done = 0;
  const weapons = await mapWithConcurrency(uniqueListing, CONCURRENCY, async (w) => {
    try {
      const html = await fetchHtml(w.link);
      const detail = extractDetail(html);
      done++;
      if (done % 25 === 0) console.log(`  ${done}/${uniqueListing.length}`);
      return { ...w, ...detail };
    } catch (err) {
      console.warn(`  falha em ${w.name}: ${err.message}`);
      return { ...w, attributeScaling: {}, attributesRequired: {}, weight: null, ashOfWar: null };
    }
  });

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(weapons, null, 2), 'utf-8');
  console.log(`✅ Salvo em ${OUT_PATH} (${weapons.length} armas)`);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
