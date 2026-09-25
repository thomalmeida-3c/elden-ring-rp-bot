// Exploração pontual do formato de save (.sl2) pra localizar o bloco PlayerGameData.
// Lógica de navegação da estrutura (ga_items walk) portada do projeto MIT
// CyberGiant7/Elden-Ring-Automatic-Checklist (script.js), com atribuição.
const fs = require('fs');

const buf = fs.readFileSync(process.argv[2] || 'ER0000.sl2');

function getSlots(dat) {
  const bounds = [
    [0x310, 0x28030f],
    [0x280320, 0x50031f],
    [0x500330, 0x78032f],
    [0x780340, 0xa0033f],
    [0xa00350, 0xc8034f],
    [0xc80360, 0xf0035f],
    [0xf00370, 0x118036f],
    [0x1180380, 0x140037f],
    [0x1400390, 0x168038f],
    [0x16803a0, 0x190039f],
  ];
  return bounds.map(([start, end]) => dat.subarray(start, end + 1));
}

function findGameDataOffset(slot) {
  let offset = 0;
  offset += 4 + 4 + 0x18; // ver + map_id + _0x18

  for (let i = 0; i < 0x1400; i++) {
    const itemId = slot.readUInt32LE(offset + 4);
    offset += 8;
    if (itemId !== 0 && (itemId & 0xf0000000) === 0) {
      offset += 13;
    } else if (itemId !== 0 && (itemId & 0xf0000000) === 0x10000000) {
      offset += 8;
    }
  }
  return offset; // início do PlayerGameData (432 bytes)
}

const slots = getSlots(buf);
const slot0 = slots[0];
const pgdOffset = findGameDataOffset(slot0);
console.log('PlayerGameData offset dentro do slot 0:', pgdOffset, '(0x' + pgdOffset.toString(16) + ')');

const pgd = slot0.subarray(pgdOffset, pgdOffset + 432);
console.log('--- primeiros 200 bytes do PlayerGameData (hex) ---');
console.log(pgd.subarray(0, 200).toString('hex').match(/.{1,32}/g).join('\n'));

console.log('--- procurando valores conhecidos (level=141, runas=999999999) ---');
for (let i = 0; i + 4 <= pgd.length; i += 1) {
  const v = pgd.readUInt32LE(i);
  if (v === 141) console.log('int32 == 141 no offset', i, '(0x' + i.toString(16) + ')');
  if (v === 999999999) console.log('int32 == 999999999 no offset', i, '(0x' + i.toString(16) + ')');
}
