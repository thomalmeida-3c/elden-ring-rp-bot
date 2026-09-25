const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getServerMembers } = require('../storage');
const { getClassById } = require('../classes');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('guild')
    .setDescription('Mostra todos os membros da guilda e suas classes'),

  async execute(interaction) {
    const members = getServerMembers(interaction.guildId);
    const entries = Object.entries(members);

    if (entries.length === 0) {
      await interaction.reply({
        content: 'A guilda ainda não tem nenhum membro registrado. Use `/register` para começar.',
      });
      return;
    }

    const linhas = entries.map(([userId, member]) => {
      if (!member.classId) {
        return `🎲 <@${userId}> — ainda não sorteou classe`;
      }
      const classe = getClassById(member.classId);
      return `${classe.emoji} <@${userId}> — **${classe.nome}** (${classe.atributos.join(' + ')})`;
    });

    const embed = new EmbedBuilder()
      .setColor(0xc9a227)
      .setTitle('🏰 Guilda de Terras Intermédias')
      .setDescription(linhas.join('\n'))
      .setFooter({ text: `${entries.length} membro(s) registrado(s)` });

    await interaction.reply({ embeds: [embed] });
  },
};
