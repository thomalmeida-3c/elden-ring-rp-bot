const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { CLASSES, getClassById } = require('../classes');
const { getMember } = require('../storage');
const {
  suggestWeapons,
  suggestArmor,
  suggestTalismans,
  suggestSpells,
  suggestSpiritAsh,
  suggestAshOfWar,
  formatScaling,
} = require('../game-data');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('build')
    .setDescription('Mostra a build completa de uma classe (armas, armadura, talismãs, feitiços e mais)')
    .addStringOption((option) =>
      option
        .setName('classe')
        .setDescription('Classe para ver a build (padrão: sua classe atual)')
        .setRequired(false)
        .addChoices(...CLASSES.map((c) => ({ name: c.nome, value: c.id })))
    ),

  async execute(interaction) {
    const classeId = interaction.options.getString('classe');
    let classe;

    if (classeId) {
      classe = getClassById(classeId);
    } else {
      const member = getMember(interaction.guildId, interaction.user.id);
      if (!member || !member.classId) {
        await interaction.reply({
          content:
            '❌ Você ainda não tem uma classe sorteada. Use `/roll` ou informe a opção `classe` para ver a build de outra classe.',
          ephemeral: true,
        });
        return;
      }
      classe = getClassById(member.classId);
    }

    const armas = suggestWeapons(classe.atributos, 3);
    const armadura = suggestArmor(classe);
    const talismas = suggestTalismans(classe, 2);
    const feiticos = suggestSpells(classe, 2);
    const invocacao = suggestSpiritAsh(classe);
    const cinzaDeGuerra = suggestAshOfWar(classe);

    const embed = new EmbedBuilder()
      .setColor(0x4a7fb5)
      .setTitle(`${classe.emoji} Build: ${classe.nome}`)
      .setThumbnail(armas[0]?.imagem || null)
      .addFields(
        { name: 'Atributos principais', value: `**${classe.atributos.join(' + ')}**`, inline: true },
        { name: 'Estilo de jogo', value: `*${classe.estilo}*`, inline: true }
      );

    if (armas.length > 0) {
      embed.addFields({
        name: '⚔️ Armas sugeridas',
        value: armas
          .map((w) => `• **${w.name}** — *${w.weaponType || 'Arma'}, ${formatScaling(w)}*`)
          .join('\n'),
      });
    }

    if (armadura.length > 0) {
      embed.addFields({
        name: '🛡️ Armadura sugerida',
        value: armadura.map((a) => `• **${a.slot}:** ${a.name}`).join('\n'),
      });
    }

    if (talismas.length > 0) {
      embed.addFields({
        name: '💍 Talismãs sugeridos',
        value: talismas.map((t) => `• **${t.name}** — *${t.efeito}*`).join('\n'),
      });
    }

    if (feiticos.length > 0) {
      embed.addFields({
        name: '📖 Feitiços sugeridos',
        value: feiticos
          .map((s) => {
            const req = Object.entries(s.atributosRequeridos)
              .map(([a, v]) => `${a} ${v}`)
              .join(', ');
            return `• **${s.name}** *(${s.tipo})* — ${req}`;
          })
          .join('\n'),
      });
    }

    if (invocacao) {
      embed.addFields({
        name: '👻 Invocação sugerida',
        value: `• **${invocacao.name}** — *${invocacao.efeito || ''}*`,
      });
    }

    if (cinzaDeGuerra) {
      embed.addFields({
        name: '🌀 Cinza de Guerra sugerida',
        value: `**${cinzaDeGuerra.name}**`,
      });
    }

    embed.setFooter({ text: 'Use /item nome:<qualquer item> para ver os status completos de qualquer arma, armadura, talismã, spell, invocação ou cinza de guerra.' });

    await interaction.reply({ embeds: [embed] });
  },
};
