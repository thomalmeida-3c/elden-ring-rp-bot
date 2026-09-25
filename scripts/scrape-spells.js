// Scraper único (offline) para popular data/game/spells.json a partir do eip.gg.
// Pagina dinamicamente até a página vir vazia (não precisamos saber o total de antemão).
const fs = require('fs');
const path = require('path');

const UA = 'Mozilla/5.0 (compatible; EldenRingRPBot-DataBuild/1.0)';
const OUT_PATH = path.join(__dirname, '..', 'data', 'game', 'spells.json');
const DELAY_MS = 200;
const MAX_PAGES = 40;
const VIEW_COUNT = '95260-TCPID95257';

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
    const tipo = (row.match(/<strong>(Sorcery|Incantation)<\/strong>/) || [])[1] || null;

    const reqBlock = row.match(/data-mtr-content="Attributes Required"[\s\S]*?<\/td>/);
    const atributosRequeridos = {};
    if (reqBlock) {
      const pairRegex = /<strong>([A-Za-z]+):<\/strong>\s*(\d+)/g;
      let p;
      while ((p = pairRegex.exec(reqBlock[0]))) atributosRequeridos[p[1]] = Number(p[2]);
    }

    const slotsMatch = row.match(/data-mtr-content="Slots"[^>]*><div class="mtr-cell-content">\s*(\d+)/);

    rows.push({
      id,
      name: name.trim(),
      link,
      imagem: extractRowImage(row),
      tipo,
      atributosRequeridos,
      slots: slotsMatch ? Number(slotsMatch[1]) : null,
    });
  }
  return rows;
}

async function main() {
  console.log('Buscando listagem de spells (paginação dinâmica)...');
  const listing = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const url =
      page === 1
        ? 'https://eip.gg/elden-ring/db/spells/'
        : `https://eip.gg/elden-ring/db/spells/?wpv_view_count=${VIEW_COUNT}&wpv_paged=${page}`;
    const html = await fetchHtml(url);
    const rows = extractListingRows(html);
    console.log(`  página ${page}: ${rows.length} spells`);
    if (rows.length === 0) break;
    listing.push(...rows);
    await sleep(DELAY_MS);
  }

  const seen = new Set();
  const unique = listing.filter((s) => {
    if (seen.has(s.id)) return false;
    seen.add(s.id);
    return true;
  });

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(unique, null, 2), 'utf-8');
  console.log(`✅ Salvo em ${OUT_PATH} (${unique.length} spells)`);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
