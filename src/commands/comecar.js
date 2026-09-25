const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
} = require('discord.js');
const { getAllCheckedInMembers, getGuildCheckpoint, getMember, startSession, setSessionStage } = require('../storage');
const { getClassById } = require('../classes');
const { STAGES, getStageById } = require('../game-stages');

const OUTLIER_THRESHOLD = 3; // chefes a mais que o resto do grupo pra virar suspeita
const COLLECTOR_TIME_MS = 15 * 60 * 1000;

function buildRosterEmbed(membros, checkpoint) {
  const bossCounts = membros.map((m) => m.latest.bossesKilled);
  const groupMin = Math.min(...bossCounts);

  const linhas = [];
  const suspeitos = [];

  for (const m of membros) {
    const classe = getClassById(m.classId);
    const { latest } = m;
    const motivos = [];

    if (latest.bossesKilled - groupMin >= OUTLIER_THRESHOLD) {
      motivos.push(`${latest.bossesKilled - groupMin} chefes à frente do resto do grupo`);
    }
    if (checkpoint !== null && latest.bossesKilled > checkpoint) {
      motivos.push(`passou do checkpoint (${latest.bossesKilled}/${checkpoint} chefes)`);
    }

    const flag = motivos.length > 0;
    linhas.push(
      `${flag ? '⚠️' : '•'} <@${m.userId}> — **${classe ? classe.nome : '?'}** | Nível ${latest.level} | ${latest.bossesKilled} chefes`
    );
    if (flag) suspeitos.push(`<@${m.userId}>: ${motivos.join('; ')}`);
  }

  const embed = new EmbedBuilder()
    .setColor(suspeitos.length > 0 ? 0xe74c3c : 0xc9a227)
    .setTitle('🔔 A jornada recomeça')
    .setDescription(
      '*Reúnam-se, Tarnished. Antes de seguirmos, deixem-me revisar o destino de cada um de vocês.*\n\n' +
        linhas.join('\n')
    );

  if (checkpoint !== null) {
    embed.addFields({ name: 'Checkpoint do Conselho', value: `${checkpoint} chefes esperados até agora` });
  }
  if (suspeitos.length > 0) {
    embed.addFields({ name: '🚨 Requer aprovação do Conselho', value: suspeitos.join('\n') });
  }

  return embed;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('comecar')
    .setDescription('Melina reúne o grupo, confirma quem está pronto e define a meta da sessão'),

  async execute(interaction) {
    const membros = getAllCheckedInMembers(interaction.guildId);

    if (membros.length === 0) {
      await interaction.reply(
        '*Ninguém ainda trouxe seu save para minha análise.* Rodem `/save` antes de começar.'
      );
      return;
    }

    const checkpoint = getGuildCheckpoint(interaction.guildId);
    const embed = buildRosterEmbed(membros, checkpoint);

    const readyRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('comecar_ready').setLabel('Todos prontos para a sessão?').setStyle(ButtonStyle.Success).setEmoji('✅')
    );

    await interaction.reply({ embeds: [embed], components: [readyRow] });
    const message = await interaction.fetchReply();

    const collector = message.createMessageComponentCollector({ time: COLLECTOR_TIME_MS });
    let session = null;

    collector.on('collect', async (i) => {
      const member = getMember(interaction.guildId, i.user.id);
      if (!member) {
        await i.reply({ content: '❌ Você precisa estar registrado na guilda (`/register`) para participar.', ephemeral: true });
        return;
      }

      if (i.customId === 'comecar_ready') {
        session = startSession(
          interaction.guildId,
          membros.map((m) => ({
            userId: m.userId,
            username: m.username,
            classId: m.classId,
            level: m.latest.level,
            bossesKilled: m.latest.bossesKilled,
          })),
          i.user.id
        );

        const stageMenu = new StringSelectMenuBuilder()
          .setCustomId('comecar_stage')
          .setPlaceholder('Até onde vamos nesta sessão?')
          .addOptions(STAGES.map((s) => ({ label: s.nome, value: s.id })));

        await i.update({
          embeds: [embed.setFooter({ text: `Prontidão confirmada por ${i.user.username}` })],
          components: [new ActionRowBuilder().addComponents(stageMenu)],
        });
        return;
      }

      if (i.customId === 'comecar_stage') {
        if (!session) {
          await i.reply({ content: '❌ Confirme a prontidão do grupo primeiro.', ephemeral: true });
          return;
        }
        const stageId = i.values[0];
        const stage = getStageById(stageId);
        setSessionStage(interaction.guildId, session.id, stageId, i.user.id);

        await i.update({
          embeds: [
            embed
              .setFooter({ text: `Sessão #${session.id} iniciada — meta escolhida por ${i.user.username}` })
              .addFields({ name: '🎯 Meta da sessão', value: `**${stage.nome}**` }),
          ],
          components: [],
        });
        collector.stop();
      }
    });

    collector.on('end', async (collected) => {
      if (collected.size === 0) {
        await interaction.editReply({ components: [] }).catch(() => {});
      }
    });
  },
};
