// Scraper único (offline) para popular data/game/armor.json a partir do eip.gg.
// Diferente de armas, a listagem já traz todos os dados (peso, defesas, resistências),
// então não precisamos visitar a página individual de cada peça — só as 29 páginas de listagem.
const fs = require('fs');
const path = require('path');

const UA = 'Mozilla/5.0 (compatible; EldenRingRPBot-DataBuild/1.0)';
const LIST_PAGES = 29;
const OUT_PATH = path.join(__dirname, '..', 'data', 'game', 'armor.json');
const DELAY_MS = 200;

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

function parseLabelPairs(block) {
  if (!block) return {};
  const out = {};
  const pairRegex = /<strong>(?:<span[^>]*>)?([A-Za-z ]+):(?:<\/span>)?<\/strong>\s*(-?[\d.]+)/g;
  let p;
  while ((p = pairRegex.exec(block[0]))) {
    out[p[1].trim()] = Number(p[2]);
  }
  return out;
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
    const slot = (row.match(/Slot:<\/span><\/strong>\s*([^<]+)</) || [])[1] || null;
    const weight = (row.match(/Weight:<\/span><\/strong>\s*([\d.]+)/) || [])[1];
    const poise = (row.match(/<strong><span>Poise:<\/span><\/strong>\s*([\d.]+)/) || [])[1];

    const dmgBlock = row.match(/data-mtr-content="Damage Negation"[\s\S]*?<\/td>/);
    const resBlock = row.match(/data-mtr-content="Resistance"[\s\S]*?<\/td>/);

    rows.push({
      id,
      name: name.trim(),
      link,
      imagem: extractRowImage(row),
      slot: slot ? slot.trim() : null,
      weight: weight ? Number(weight) : null,
      poise: poise ? Number(poise) : null,
      damageNegation: parseLabelPairs(dmgBlock),
      resistance: parseLabelPairs(resBlock),
    });
  }
  return rows;
}

async function main() {
  console.log(`Buscando listagem de armaduras (${LIST_PAGES} páginas)...`);
  const listing = [];
  for (let page = 1; page <= LIST_PAGES; page++) {
    const url =
      page === 1
        ? 'https://eip.gg/elden-ring/db/armor/'
        : `https://eip.gg/elden-ring/db/armor/?wpv_view_count=89764-TCPID89767&wpv_paged=${page}`;
    const html = await fetchHtml(url);
    const rows = extractListingRows(html);
    console.log(`  página ${page}: ${rows.length} peças`);
    listing.push(...rows);
    await sleep(DELAY_MS);
  }

  const seen = new Set();
  const unique = listing.filter((a) => {
    if (seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  });

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(unique, null, 2), 'utf-8');
  console.log(`✅ Salvo em ${OUT_PATH} (${unique.length} peças de armadura)`);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
