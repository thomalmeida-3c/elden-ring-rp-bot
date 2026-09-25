const { EmbedBuilder } = require('discord.js');
const { formatScaling } = require('./game-data');

function joinPairs(obj) {
  const entries = Object.entries(obj);
  if (entries.length === 0) return '*—*';
  return entries.map(([k, v]) => `**${k}:** ${v}`).join(' | ');
}

function buildWeaponEmbed(w) {
  return new EmbedBuilder()
    .setColor(0x8b6914)
    .setTitle(`⚔️ ${w.name}`)
    .setURL(w.link)
    .setThumbnail(w.imagem || null)
    .addFields(
      { name: 'Tipo', value: `*${w.weaponType || '—'}*`, inline: true },
      { name: 'Tipo de Ataque', value: `*${w.attackType || '—'}*`, inline: true },
      { name: 'Peso', value: `*${w.weight ?? '—'}*`, inline: true },
      { name: 'Escalonamento', value: formatScaling(w) },
      { name: 'Atributos Requeridos', value: joinPairs(w.attributesRequired) },
      { name: 'Poder de Ataque', value: joinPairs(w.attackPower) },
      { name: 'Negação Guardada', value: joinPairs(w.guardedDamageNegation) },
      { name: 'Cinza de Guerra padrão', value: `*${w.ashOfWar || '—'}*` }
    );
}

function buildArmorEmbed(a) {
  return new EmbedBuilder()
    .setColor(0x6b6b6b)
    .setTitle(`🛡️ ${a.name}`)
    .setURL(a.link)
    .setThumbnail(a.imagem || null)
    .addFields(
      { name: 'Slot', value: `*${a.slot || '—'}*`, inline: true },
      { name: 'Peso', value: `*${a.weight ?? '—'}*`, inline: true },
      { name: 'Poise', value: `*${a.poise ?? '—'}*`, inline: true },
      { name: 'Negação de Dano', value: joinPairs(a.damageNegation) },
      { name: 'Resistência', value: joinPairs(a.resistance) }
    );
}

function buildTalismanEmbed(t) {
  return new EmbedBuilder()
    .setColor(0xc9a227)
    .setTitle(`💍 ${t.name}`)
    .setURL(t.link)
    .setThumbnail(t.imagem || null)
    .addFields(
      { name: 'Peso', value: `*${t.weight ?? '—'}*`, inline: true },
      { name: 'Efeito', value: `*${t.efeito || '—'}*` }
    );
}

function buildSpellEmbed(s) {
  return new EmbedBuilder()
    .setColor(0x9b59b6)
    .setTitle(`📖 ${s.name}`)
    .setURL(s.link)
    .setThumbnail(s.imagem || null)
    .addFields(
      { name: 'Tipo', value: `*${s.tipo || '—'}*`, inline: true },
      { name: 'Slots de Memória', value: `*${s.slots ?? '—'}*`, inline: true },
      { name: 'Atributos Requeridos', value: joinPairs(s.atributosRequeridos) }
    );
}

function buildSpiritAshEmbed(s) {
  return new EmbedBuilder()
    .setColor(0x2ecc71)
    .setTitle(`👻 ${s.name}`)
    .setURL(s.link)
    .setThumbnail(s.imagem || null)
    .setDescription(`*${s.efeito || '—'}*`);
}

function buildAshOfWarEmbed(a) {
  return new EmbedBuilder()
    .setColor(0xe67e22)
    .setTitle(`🌀 ${a.name}`)
    .setURL(a.link)
    .setThumbnail(a.imagem || null)
    .setDescription('*Consulte o link acima para o efeito e as afinidades completas desta Cinza de Guerra.*');
}

module.exports = {
  buildWeaponEmbed,
  buildArmorEmbed,
  buildTalismanEmbed,
  buildSpellEmbed,
  buildSpiritAshEmbed,
  buildAshOfWarEmbed,
};
