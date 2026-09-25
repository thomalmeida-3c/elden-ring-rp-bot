const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const { findAudioFile } = require('../audio');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('saudacao')
    .setDescription('Melina te recebe com uma saudação'),

  async execute(interaction) {
    const audioPath = findAudioFile('saudacao');

    await interaction.reply({
      content: `${interaction.user}, _saudações. Viajante de além da névoa.\nEu sou Melina. Proponho-lhe um acordo_.`,
      files: audioPath ? [new AttachmentBuilder(audioPath)] : [],
    });
  },
};
