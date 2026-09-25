const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const AdmZip = require('adm-zip');
const { parseEldenRingSave } = require('../save-parser');
const { getMember, addSaveCheckin } = require('../storage');

function extractSaveBuffer(rawBuffer, fileName) {
  if (!fileName.toLowerCase().endsWith('.zip')) return rawBuffer;

  const zip = new AdmZip(rawBuffer);
  const entry = zip.getEntries().find((e) => /\.(sl2|co2)$/i.test(e.entryName));
  if (!entry) {
    throw new Error('o zip não contém nenhum arquivo .sl2 dentro.');
  }
  return entry.getData();
}

function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h${minutes.toString().padStart(2, '0')}`;
}

function formatDelta(value, unit = '') {
  if (value === 0) return null;
  const sign = value > 0 ? '+' : '';
  return `${sign}${value}${unit}`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('save')
    .setDescription('Envie seu save (.sl2 ou .zip) para Melina analisar seu progresso real')
    .addAttachmentOption((option) =>
      option.setName('arquivo').setDescription('Seu ER0000.sl2, ou um .zip contendo ele').setRequired(true)
    ),

  async execute(interaction) {
    const member = getMember(interaction.guildId, interaction.user.id);
    if (!member) {
      await interaction.reply({
        content: '❌ Você ainda não está registrado na guilda. Use `/register` primeiro.',
        ephemeral: true,
      });
      return;
    }

    const attachment = interaction.options.getAttachment('arquivo');
    const fileName = attachment.name.toLowerCase();
    if (!fileName.endsWith('.sl2') && !fileName.endsWith('.zip')) {
      await interaction.reply({
        content: '❌ Envie um arquivo `.sl2` (ou um `.zip` contendo ele).',
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply();

    let parsed;
    try {
      const response = await fetch(attachment.url);
      const rawBuffer = Buffer.from(await response.arrayBuffer());
      const saveBuffer = extractSaveBuffer(rawBuffer, fileName);
      parsed = parseEldenRingSave(saveBuffer);
    } catch (err) {
      await interaction.editReply({
        content: `❌ Não consegui ler esse save: ${err.message}`,
      });
      return;
    }

    if (parsed.slots.length === 0) {
      await interaction.editReply({ content: '❌ Esse save não tem nenhum personagem ativo.' });
      return;
    }

    const slot = parsed.slots[0];
    const { player } = slot;
    const secondsPlayed = slot.profile.secondsPlayed;

    const { previous, identityMismatch } = addSaveCheckin(interaction.guildId, interaction.user.id, {
      characterName: player.characterName,
      steamId: parsed.globalSteamId,
      level: player.level,
      secondsPlayed,
      deaths: slot.deaths,
      bossesKilled: slot.bossesKilled.length,
      attributes: player.attributes,
      integrityValid: slot.integrity.valid,
    });

    const warnings = [];
    if (!slot.integrity.valid) {
      warnings.push('⚠️ *O checksum deste save não confere — os dados podem ter sido alterados.*');
    }
    if (identityMismatch) {
      warnings.push(
        '🚨 **Este save é de um personagem/conta diferente do que foi vinculado a você anteriormente.** O conselho deveria revisar isso.'
      );
    }

    const embed = new EmbedBuilder()
      .setColor(identityMismatch ? 0xe74c3c : 0xc9a227)
      .setTitle(`📜 Análise de ${player.characterName || interaction.user.username}`)
      .setDescription(
        `${interaction.user}, *deixe-me examinar os fios do seu destino.*${
          warnings.length > 0 ? '\n' + warnings.join('\n') : ''
        }`
      )
      .addFields(
        { name: 'Nível', value: `**${player.level}**`, inline: true },
        { name: 'Tempo de jogo', value: `**${formatDuration(secondsPlayed)}**`, inline: true },
        { name: 'Mortes', value: `**${slot.deaths}**`, inline: true },
        {
          name: 'Atributos',
          value: Object.entries(player.attributes)
            .map(([k, v]) => `**${k}:** ${v}`)
            .join(' | '),
        },
        {
          name: `Chefes derrotados (${slot.bossesKilled.length}/${slot.bossesTotal})`,
          value:
            slot.bossesKilled.length === 0
              ? '*nenhum ainda*'
              : slot.bossesKilled.slice(0, 15).join(', ') +
                (slot.bossesKilled.length > 15 ? ` *e mais ${slot.bossesKilled.length - 15}...*` : ''),
        }
      );

    if (previous) {
      const deltaLines = [
        formatDelta(player.level - previous.level, ' níveis'),
        formatDelta(Math.round((secondsPlayed - previous.secondsPlayed) / 360) / 10, 'h'),
        formatDelta(slot.deaths - previous.deaths, ' mortes'),
        formatDelta(slot.bossesKilled.length - previous.bossesKilled, ' chefes'),
      ].filter(Boolean);

      embed.addFields({
        name: `Desde o último check-in (${new Date(previous.checkedInAt).toLocaleDateString('pt-BR')})`,
        value: deltaLines.length > 0 ? deltaLines.join(', ') : '*nenhuma mudança*',
      });
    }

    await interaction.editReply({ embeds: [embed] });
  },
};
