const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getMember, removeMember } = require('../storage');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reset')
    .setDescription('(Conselho) Remove um jogador da guilda para testar o fluxo do zero')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addUserOption((option) =>
      option.setName('usuario').setDescription('Jogador a ser resetado').setRequired(true)
    ),

  async execute(interaction) {
    const usuario = interaction.options.getUser('usuario');
    const member = getMember(interaction.guildId, usuario.id);

    if (!member) {
      await interaction.reply({
        content: `❌ ${usuario.username} não está registrado nesta guilda.`,
        ephemeral: true,
      });
      return;
    }

    removeMember(interaction.guildId, usuario.id);

    await interaction.reply(
      `🔄 *Que os fios do destino de* **${usuario.username}** *sejam desfeitos.* Registro, classe, saves e histórico apagados — pode rodar \`/register\` de novo.`
    );
  },
};
