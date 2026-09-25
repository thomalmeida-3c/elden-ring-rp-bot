const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { registerMember } = require('../storage');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('register')
    .setDescription('Registra você na guilda para esta run de Elden Ring'),

  async execute(interaction) {
    const { created, member } = registerMember(
      interaction.guildId,
      interaction.user.id,
      interaction.user.username
    );

    if (!created) {
      await interaction.reply({
        content: `⚠️ Você já está registrado na guilda desde ${new Date(
          member.registeredAt
        ).toLocaleDateString('pt-BR')}. Use \`/roll\` para sortear sua classe.`,
        ephemeral: true,
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0xc9a227)
      .setTitle('🕯️ Novo membro na guilda')
      .setDescription(`**${interaction.user.username}** entrou na jornada por Terras Intermédias.`)
      .addFields({ name: 'Próximo passo', value: 'Use `/roll` para sortear sua classe.' });

    await interaction.reply({ embeds: [embed] });
  },
};
