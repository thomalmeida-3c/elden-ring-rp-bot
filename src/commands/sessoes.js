const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getSessions } = require('../storage');
const { getStageById } = require('../game-stages');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sessoes')
    .setDescription('Mostra o histórico de sessões de jogatina e o progresso do grupo'),

  async execute(interaction) {
    const sessions = getSessions(interaction.guildId).slice(-10).reverse();

    if (sessions.length === 0) {
      await interaction.reply('*Nenhuma sessão foi registrada ainda.* Use `/comecar` para iniciar a primeira.');
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0x4a7fb5)
      .setTitle('📖 Crônicas das Sessões')
      .setDescription(`*Últimas ${sessions.length} sessões registradas, da mais recente à mais antiga.*`);

    for (const session of sessions) {
      const stage = session.targetStageId ? getStageById(session.targetStageId) : null;
      const data = new Date(session.startedAt).toLocaleDateString('pt-BR');
      const participantes = session.participants
        .map((p) => `${p.username} (Nível ${p.level}, ${p.bossesKilled} chefes)`)
        .join(', ');

      embed.addFields({
        name: `Sessão #${session.id} — ${data}`,
        value: `**Meta:** ${stage ? stage.nome : '*não definida*'}\n**Participantes:** ${participantes}`,
      });
    }

    await interaction.reply({ embeds: [embed] });
  },
};
