const weapons = require('../data/game/weapons.json');
const armor = require('../data/game/armor.json');
const talismans = require('../data/game/talismans.json');
const spells = require('../data/game/spells.json');
const spiritAshes = require('../data/game/spirit-ashes.json');
const ashesOfWar = require('../data/game/ashes-of-war.json');

// Só estes 5 atributos escalam dano de arma/feitiço — Vigor/Endurance não entram aqui.
const ATTR_PT_TO_EN = {
  Força: 'Strength',
  Destreza: 'Dexterity',
  Inteligência: 'Intelligence',
  Fé: 'Faith',
  Arcano: 'Arcane',
};

const GRADE_RANK = { S: 6, A: 5, B: 4, C: 3, D: 2, E: 1 };

// Talismãs e Ashes of War não têm atributo estruturado na fonte de dados —
// usamos palavras-chave curadas por classe pra casar com o texto de efeito/nome.
const CLASS_HINTS = {
  paladino: { talismans: ['heal', 'faith', 'guard', 'shield'], aow: ['sacred', 'barricade', 'prayer', 'flame'] },
  sanguinario: { talismans: ['bleed', 'hemorrhage', 'blood loss', 'dexterity'], aow: ['bloody slash', 'seppuku', 'quickstep'] },
  feiticeiro_de_batalha: { talismans: ['sorcery', 'intelligence', 'magic', 'cast'], aow: ['glintblade', 'magic', 'carian'] },
  inquisidor: { talismans: ['faith', 'incantation', 'holy'], aow: ['sacred', 'flame', 'golden'] },
  barbaro: { talismans: ['strength', 'poise', 'stamina', 'heavy'], aow: ['stomp', 'warcry', 'braggart'] },
  cavaleiro_draconico: { talismans: ['dragon', 'faith', 'arcane'], aow: ['dragonclaw', 'dragonmaw', 'flame'] },
  mestre_de_armas: { talismans: ['strength', 'dexterity', 'attack power'], aow: ['storm blade', 'destruction', 'wave'] },
  cavaleiro_arcano: { talismans: ['intelligence', 'strength', 'spell'], aow: ['carian', 'magic', 'glintstone'] },
  necromante: { talismans: ['intelligence', 'faith', 'death'], aow: ['ghostflame', 'rotten'] },
  duelista: { talismans: ['dexterity', 'poise', 'guard counter'], aow: ['bloody slash', 'impaling thrust', 'parry'] },
  ocultista: { talismans: ['arcane', 'bleed', 'strength'], aow: ['seppuku', 'rotten', 'ruinous'] },
  profeta_de_guerra: { talismans: ['faith', 'heal', 'incantation'], aow: ['sacred', 'prayerful', 'golden'] },
};

function hashPick(list, seed) {
  if (list.length === 0) return null;
  const hash = [...seed].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return list[hash % list.length];
}

function suggestWeapons(atributosPt, limit = 5) {
  const attrsEn = atributosPt.map((a) => ATTR_PT_TO_EN[a]).filter(Boolean);
  if (attrsEn.length === 0) return [];

  const scored = weapons
    .map((w) => {
      const score = attrsEn.reduce((sum, attr) => sum + (GRADE_RANK[w.attributeScaling[attr]] || 0), 0);
      return { weapon: w, score };
    })
    .filter((entry) => entry.score > 0);

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (b.weapon.attackPower.Physical || 0) - (a.weapon.attackPower.Physical || 0);
  });

  return scored.slice(0, limit).map((entry) => entry.weapon);
}

function sumNegation(damageNegation) {
  return ['Physical', 'Magic', 'Fire', 'Lightning', 'Holy'].reduce(
    (sum, key) => sum + (damageNegation[key] || 0),
    0
  );
}

function suggestArmor(classe) {
  const pesada = /tank|porrada|brutamontes|resistente/i.test(classe.estilo);
  const slots = ['Head', 'Body', 'Arm', 'Leg'];

  return slots
    .map((slot) => {
      const pecas = armor.filter((a) => a.slot === slot);
      if (pecas.length === 0) return null;
      const ordenadas = [...pecas].sort((a, b) => {
        if (pesada) {
          if (b.poise !== a.poise) return b.poise - a.poise;
          return sumNegation(b.damageNegation) - sumNegation(a.damageNegation);
        }
        // "leve" = melhor relação defesa/peso, não a peça mais fraca e mais leve possível
        const efA = sumNegation(a.damageNegation) / Math.max(a.weight, 0.1);
        const efB = sumNegation(b.damageNegation) / Math.max(b.weight, 0.1);
        return efB - efA;
      });
      return ordenadas[0];
    })
    .filter(Boolean);
}

function suggestTalismans(classe, limit = 2) {
  const hints = CLASS_HINTS[classe.id]?.talismans || [];
  const scored = talismans
    .map((t) => {
      const texto = t.efeito ? t.efeito.toLowerCase() : '';
      const score = hints.reduce((sum, kw) => sum + (texto.includes(kw) ? 1 : 0), 0);
      return { talisman: t, score };
    })
    .filter((e) => e.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length > 0) return scored.slice(0, limit).map((e) => e.talisman);
  // fallback determinístico se nenhuma palavra-chave bater
  const fallback = hashPick(talismans, classe.id);
  return fallback ? [fallback] : [];
}

function suggestSpells(classe, limit = 2) {
  const attrsEn = classe.atributos.map((a) => ATTR_PT_TO_EN[a]).filter(Boolean);
  const castingAttrs = attrsEn.filter((a) => ['Intelligence', 'Faith', 'Arcane'].includes(a));
  if (castingAttrs.length === 0) return [];

  const scored = spells
    .map((s) => {
      const reqAttrs = Object.keys(s.atributosRequeridos);
      const matches = reqAttrs.filter((a) => castingAttrs.includes(a)).length;
      const totalReq = Object.values(s.atributosRequeridos).reduce((sum, v) => sum + v, 0);
      return { spell: s, matches, totalReq };
    })
    .filter((e) => e.matches > 0)
    .sort((a, b) => {
      if (b.matches !== a.matches) return b.matches - a.matches;
      return a.totalReq - b.totalReq;
    });

  return scored.slice(0, limit).map((e) => e.spell);
}

function suggestSpiritAsh(classe) {
  return hashPick(spiritAshes, classe.id);
}

function suggestAshOfWar(classe) {
  const hints = CLASS_HINTS[classe.id]?.aow || [];
  const match = ashesOfWar.find((a) => hints.some((kw) => a.name.toLowerCase().includes(kw)));
  return match || hashPick(ashesOfWar, classe.id);
}

function formatScaling(weapon) {
  const entries = Object.entries(weapon.attributeScaling);
  if (entries.length === 0) return 'sem escalonamento';
  return entries.map(([attr, grade]) => `${attr} ${grade}`).join(', ');
}

const ITEM_CATEGORIES = {
  arma: weapons,
  armadura: armor,
  talisma: talismans,
  spell: spells,
  invocacao: spiritAshes,
  cinza: ashesOfWar,
};

const CATEGORY_LABELS = {
  arma: 'Arma',
  armadura: 'Armadura',
  talisma: 'Talismã',
  spell: 'Spell',
  invocacao: 'Invocação',
  cinza: 'Cinza de Guerra',
};

function searchAllItems(query, limit = 25) {
  const q = query.toLowerCase();
  const results = [];
  for (const [category, list] of Object.entries(ITEM_CATEGORIES)) {
    for (const item of list) {
      if (item.name.toLowerCase().includes(q)) results.push({ category, item });
    }
  }
  return results.slice(0, limit);
}

function getItemByKey(key) {
  const [category, id] = key.split(':');
  const list = ITEM_CATEGORIES[category];
  if (!list) return null;
  const item = list.find((i) => i.id === id);
  return item ? { category, item } : null;
}

module.exports = {
  suggestWeapons,
  suggestArmor,
  suggestTalismans,
  suggestSpells,
  suggestSpiritAsh,
  suggestAshOfWar,
  formatScaling,
  searchAllItems,
  getItemByKey,
  CATEGORY_LABELS,
  ATTR_PT_TO_EN,
};
