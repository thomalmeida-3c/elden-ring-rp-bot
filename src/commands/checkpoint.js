const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { setGuildCheckpoint } = require('../storage');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('checkpoint')
    .setDescription('(Conselho) Define até quantos chefes o grupo deveria ter derrotado nesta run')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addIntegerOption((option) =>
      option
        .setName('chefes')
        .setDescription('Quantidade de chefes que o grupo já deveria ter derrotado juntos')
        .setRequired(true)
        .setMinValue(0)
    ),

  async execute(interaction) {
    const chefes = interaction.options.getInteger('chefes');
    setGuildCheckpoint(interaction.guildId, chefes);

    const embed = new EmbedBuilder()
      .setColor(0x4a7fb5)
      .setTitle('🚩 Checkpoint do Conselho atualizado')
      .setDescription(
        `*Que fique registrado: nenhum Tarnished deveria estar além de **${chefes}** chefes derrotados por agora.*`
      )
      .setFooter({ text: `Definido por ${interaction.user.username}` });

    await interaction.reply({ embeds: [embed] });
  },
};
