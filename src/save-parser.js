// Parser de save do Elden Ring (.sl2), portado do projeto MIT
// arfipod/eldenring-savegame-analyzer (src/lib/save-parser.ts + binary-reader.ts)
// https://github.com/arfipod/eldenring-savegame-analyzer
const crypto = require('crypto');
const bosses = require('../data/game/bosses.json');
const eventflagBst = require('../data/game/eventflag_bst.json');

const PC_MAGIC = Buffer.from([0x42, 0x4e, 0x44, 0x34]); // BND4
const HEADER_SIZE = 0x2fc;
const SLOT_SIZE = 0x280010;
const SLOT_CHECKSUM_SIZE = 0x10;
const SLOT_DATA_SIZE = 0x280000;
const SLOTS_START = PC_MAGIC.length + HEADER_SIZE; // 0x300
const SLOT_COUNT = 10;
const USER_DATA_10_START = SLOTS_START + SLOT_SIZE * SLOT_COUNT;

const PLAYER_GAME_DATA_LENGTH = 0x1b0;
const EQUIP_SLOTS_LENGTH = 0x58;
const EQUIPPED_ARMAMENTS_AND_ITEMS_LENGTH = 0x9c;
const FACE_DATA_LENGTH = 0x12f;
const TROPHY_EQUIP_LENGTH = 0x34;
const GAITEM_GAME_DATA_LENGTH = 8 + 7000 * 16;
const PROFILE_LENGTH = 0x24c;
const PROFILE_LEVEL_OFFSET = 0x22;
const PROFILE_SECONDS_PLAYED_OFFSET = 0x26;
const EVENT_FLAGS_LENGTH = 0x1bf99f;

const PGD = {
  hp: 0x08,
  maxHp: 0x0c,
  fp: 0x14,
  maxFp: 0x18,
  stamina: 0x24,
  maxStamina: 0x28,
  vigor: 0x34,
  mind: 0x38,
  endurance: 0x3c,
  strength: 0x40,
  dexterity: 0x44,
  intelligence: 0x48,
  faith: 0x4c,
  arcane: 0x50,
  level: 0x60,
  runes: 0x64,
  runesMemory: 0x68,
  characterName: 0x94,
};

class Cursor {
  constructor(buf) {
    this.buf = buf;
    this.pos = 0;
  }

  skip(n) {
    this.pos += n;
  }

  u8() {
    const v = this.buf.readUInt8(this.pos);
    this.pos += 1;
    return v;
  }

  u32() {
    const v = this.buf.readUInt32LE(this.pos);
    this.pos += 4;
    return v;
  }

  i32() {
    const v = this.buf.readInt32LE(this.pos);
    this.pos += 4;
    return v;
  }

  f32() {
    const v = this.buf.readFloatLE(this.pos);
    this.pos += 4;
    return v;
  }

  u64String() {
    const v = this.buf.readBigUInt64LE(this.pos);
    this.pos += 8;
    return v.toString();
  }

  byteTuple4() {
    return [this.u8(), this.u8(), this.u8(), this.u8()];
  }

  bytesCopy(length) {
    const v = Buffer.from(this.buf.subarray(this.pos, this.pos + length));
    this.pos += length;
    return v;
  }

  utf16LeAt(pos, byteLength) {
    const raw = this.buf.subarray(pos, pos + byteLength);
    let end = 0;
    while (end + 1 < raw.length && !(raw[end] === 0 && raw[end + 1] === 0)) end += 2;
    return raw.subarray(0, end).toString('utf16le').trimEnd();
  }

  u32At(pos) {
    return this.buf.readUInt32LE(pos);
  }
}

function readGaItemsAndFindPgdStart(cursor, version) {
  const gaitemCount = version <= 81 ? 0x13fe : 0x1400;
  for (let i = 0; i < gaitemCount; i += 1) {
    const gaitemHandle = cursor.u32();
    cursor.u32(); // itemId
    if (gaitemHandle === 0) continue;

    const handleClass = (gaitemHandle & 0xf0000000) >>> 0;
    const weaponClass = handleClass === 0x80000000;
    if (handleClass !== 0xc0000000) cursor.skip(8);
    if (weaponClass) {
      cursor.skip(4); // gemGaitemHandle
      cursor.skip(1);
    }
  }
  return cursor.pos;
}

function skipInventory(cursor, commonCapacity, keyCapacity) {
  const commonCount = cursor.u32();
  void commonCount;
  cursor.skip(commonCapacity * 12);
  const keyCount = cursor.u32();
  void keyCount;
  cursor.skip(keyCapacity * 12);
  cursor.skip(8);
}

function readProfiles(cursor) {
  cursor.pos = USER_DATA_10_START + SLOT_CHECKSUM_SIZE;
  cursor.skip(4); // version
  const globalSteamId = cursor.u64String();
  cursor.skip(0x140); // settings

  cursor.skip(4);
  const menuSize = cursor.u32();
  cursor.skip(menuSize);

  const active = [];
  for (let i = 0; i < SLOT_COUNT; i += 1) active.push(cursor.u8() !== 0);

  const profiles = [];
  for (let slotIndex = 0; slotIndex < SLOT_COUNT; slotIndex += 1) {
    const start = cursor.pos;
    profiles.push({
      slotIndex,
      active: active[slotIndex] ?? false,
      name: cursor.utf16LeAt(start, 0x20),
      level: cursor.u32At(start + PROFILE_LEVEL_OFFSET),
      secondsPlayed: cursor.u32At(start + PROFILE_SECONDS_PLAYED_OFFSET),
    });
    cursor.pos = start + PROFILE_LENGTH;
  }
  return { globalSteamId, profiles };
}

function readSlot(fullBuf, slotIndex) {
  const slotBlockStart = SLOTS_START + SLOT_SIZE * slotIndex;
  const dataStart = slotBlockStart + SLOT_CHECKSUM_SIZE;
  const storedDigest = fullBuf.subarray(slotBlockStart, slotBlockStart + SLOT_CHECKSUM_SIZE);
  const slotData = fullBuf.subarray(dataStart, dataStart + SLOT_DATA_SIZE);

  const storedMd5Hex = storedDigest.toString('hex');
  const computedMd5Hex = crypto.createHash('md5').update(slotData).digest('hex');

  const cursor = new Cursor(fullBuf);
  cursor.pos = dataStart;

  const version = cursor.u32();
  cursor.skip(4); // map_id
  cursor.skip(8); // unknown_header_0x8
  cursor.skip(0x10); // unknown_header_0x10

  const pgdStart = readGaItemsAndFindPgdStart(cursor, version);

  const player = {
    characterName: cursor.utf16LeAt(pgdStart + PGD.characterName, 32),
    level: cursor.u32At(pgdStart + PGD.level),
    runes: cursor.u32At(pgdStart + PGD.runes),
    runesMemory: cursor.u32At(pgdStart + PGD.runesMemory),
    attributes: {
      vigor: cursor.u32At(pgdStart + PGD.vigor),
      mind: cursor.u32At(pgdStart + PGD.mind),
      endurance: cursor.u32At(pgdStart + PGD.endurance),
      strength: cursor.u32At(pgdStart + PGD.strength),
      dexterity: cursor.u32At(pgdStart + PGD.dexterity),
      intelligence: cursor.u32At(pgdStart + PGD.intelligence),
      faith: cursor.u32At(pgdStart + PGD.faith),
      arcane: cursor.u32At(pgdStart + PGD.arcane),
    },
    hp: { current: cursor.u32At(pgdStart + PGD.hp), max: cursor.u32At(pgdStart + PGD.maxHp) },
    fp: { current: cursor.u32At(pgdStart + PGD.fp), max: cursor.u32At(pgdStart + PGD.maxFp) },
    stamina: { current: cursor.u32At(pgdStart + PGD.stamina), max: cursor.u32At(pgdStart + PGD.maxStamina) },
  };
  cursor.pos = pgdStart + PLAYER_GAME_DATA_LENGTH;

  // specialEffects: 13 * (i32 id + f32 remaining + skip 8) = 13 * 16
  cursor.skip(13 * 16);

  cursor.skip(EQUIP_SLOTS_LENGTH); // equipment.equip_indices
  cursor.skip(7 * 4); // activeWeaponSlots
  cursor.skip(EQUIP_SLOTS_LENGTH); // equipment.item_id_mirror

  // ChrAsm: 10 u32 armaments + skip8 + 4 u32 armor + skip4 + 4 u32 talismans + skip4
  cursor.skip(10 * 4 + 8 + 4 * 4 + 4 + 4 * 4 + 4);

  skipInventory(cursor, 0xa80, 0x180); // held inventory

  cursor.skip(14 * 8 + 4); // equippedSpells (14 * (u32+skip4)) + active slot

  cursor.skip(10 * 8); // quick slots (u32 + skip4 each)
  cursor.skip(4); // active slot
  cursor.skip(6 * 8); // pouch
  cursor.skip(8);

  cursor.skip(6 * 4); // equippedGestures

  const projectileCount = cursor.u32();
  cursor.skip(projectileCount * 8);

  cursor.skip(EQUIPPED_ARMAMENTS_AND_ITEMS_LENGTH);
  cursor.skip(8); // physickTearHandles
  cursor.skip(4);
  cursor.skip(FACE_DATA_LENGTH);

  skipInventory(cursor, 0x780, 0x80); // chest inventory

  cursor.skip(64 * 4); // unlockedGestures

  const regionCount = cursor.u32();
  cursor.skip(regionCount * 4);

  cursor.skip(3 * 4); // horseCoords
  cursor.skip(4); // horseMapId
  cursor.skip(16); // horse angle
  cursor.skip(4); // horseHp
  cursor.skip(4); // horseState

  cursor.skip(1);
  cursor.skip(3 * 4); // bloodstainCoords
  cursor.skip(16); // bloodstain angle
  cursor.skip(20); // bloodstain unknown
  cursor.skip(4);
  cursor.skip(4); // bloodstainRunes
  cursor.skip(4); // bloodstainMapId
  cursor.skip(8);

  cursor.skip(8);
  cursor.skip(4);
  const menuProfileSize = cursor.u32();
  cursor.skip(menuProfileSize);

  cursor.skip(TROPHY_EQUIP_LENGTH);
  cursor.skip(GAITEM_GAME_DATA_LENGTH);

  cursor.skip(4);
  const tutorialSize = cursor.u32();
  const tutorialCount = cursor.u32();
  if (tutorialCount !== 0) cursor.skip(tutorialSize - 4);

  cursor.skip(3);
  const deaths = cursor.u32();
  cursor.skip(4);
  cursor.skip(1);
  cursor.skip(4);
  cursor.skip(4); // lastRestedGraceEntityId
  cursor.skip(1);
  cursor.skip(4);
  cursor.skip(4);

  const eventFlags = cursor.bytesCopy(EVENT_FLAGS_LENGTH);
  const bossesKilled = getBossesKilled(eventFlags);

  return {
    slotIndex,
    version,
    player,
    deaths,
    bossesKilled,
    bossesTotal: Object.keys(bosses).length,
    integrity: { storedMd5Hex, computedMd5Hex, valid: storedMd5Hex === computedMd5Hex },
  };
}

// Lógica de leitura de bits portada de CyberGiant7/Elden-Ring-Automatic-Checklist (MIT).
function getBossesKilled(eventFlags) {
  const killed = [];
  for (const [flagIdStr, info] of Object.entries(bosses)) {
    const eventId = parseInt(flagIdStr, 10);
    const blockId = Math.floor(eventId / 1000);
    const bstVal = eventflagBst[String(blockId)];
    if (bstVal === undefined) continue;

    const blockOffset = bstVal * 125 + Math.floor((eventId % 1000) / 8);
    const bitIndex = 7 - (eventId % 8);
    const byte = eventFlags[blockOffset] || 0;
    if ((byte & (1 << bitIndex)) !== 0) killed.push(info.name);
  }
  return killed;
}

function parseEldenRingSave(buffer) {
  const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);

  if (buf.length < USER_DATA_10_START + 0x100) {
    throw new Error('Arquivo pequeno demais para ser um save válido do Elden Ring.');
  }
  if (!buf.subarray(0, 4).equals(PC_MAGIC)) {
    throw new Error('Assinatura BND4 não encontrada. Envie um arquivo .sl2 válido de PC.');
  }

  const cursor = new Cursor(buf);
  const { globalSteamId, profiles } = readProfiles(cursor);

  const slots = profiles
    .filter((p) => p.active)
    .map((profile) => ({ profile, ...readSlot(buf, profile.slotIndex) }));

  return { globalSteamId, profiles, slots };
}

module.exports = { parseEldenRingSave };
