const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const { listAudioFiles, getAudioPath } = require('../audio');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('falar')
    .setDescription('Melina envia um áudio da pasta assets/audio')
    .addStringOption((option) =>
      option
        .setName('arquivo')
        .setDescription('Qual áudio a Melina deve enviar')
        .setRequired(true)
        .setAutocomplete(true)
    ),

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused().toLowerCase();
    const matches = listAudioFiles()
      .filter((f) => f.toLowerCase().includes(focused))
      .slice(0, 25);
    await interaction.respond(matches.map((f) => ({ name: f, value: f })));
  },

  async execute(interaction) {
    const fileName = interaction.options.getString('arquivo');
    const filePath = getAudioPath(fileName);

    if (!filePath) {
      await interaction.reply({
        content: '❌ Não encontrei esse áudio. Use o autocomplete pra escolher um da lista.',
        ephemeral: true,
      });
      return;
    }

    await interaction.reply({
      content: `${interaction.user}, *escute com atenção.*`,
      files: [new AttachmentBuilder(filePath)],
    });
  },
};
