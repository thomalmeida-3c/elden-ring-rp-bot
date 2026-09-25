const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { setAllowedChannel } = require('../storage');

module.exports = {
  // Este comando fica de fora da trava de canal — senão o Conselho poderia
  // ficar preso sem conseguir mudar o canal de novo.
  bypassChannelRestriction: true,

  data: new SlashCommandBuilder()
    .setName('canal')
    .setDescription('(Conselho) Define o único canal onde Melina responde comandos')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption((option) =>
      option
        .setName('canal')
        .setDescription('Canal de texto onde Melina deve responder')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    ),

  async execute(interaction) {
    const canal = interaction.options.getChannel('canal');
    setAllowedChannel(interaction.guildId, canal.id);

    await interaction.reply(
      `🔒 *Que fique registrado: só responderei aos chamados feitos em* ${canal}.`
    );
  },
};
