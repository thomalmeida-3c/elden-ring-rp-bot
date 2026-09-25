require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const { getAllowedChannel } = require('./storage');

const { DISCORD_TOKEN } = process.env;

if (!DISCORD_TOKEN) {
  console.error('❌ Defina DISCORD_TOKEN no arquivo .env');
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
for (const file of fs.readdirSync(commandsPath).filter((f) => f.endsWith('.js'))) {
  const command = require(path.join(commandsPath, file));
  client.commands.set(command.data.name, command);
}

client.once('ready', () => {
  console.log(`✅ Bot online como ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
  if (interaction.isAutocomplete()) {
    const command = client.commands.get(interaction.commandName);
    if (!command || !command.autocomplete) return;
    try {
      await command.autocomplete(interaction);
    } catch (error) {
      console.error(`Erro no autocomplete de /${interaction.commandName}:`, error);
    }
    return;
  }

  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  const allowedChannelId = interaction.guildId ? getAllowedChannel(interaction.guildId) : null;
  if (allowedChannelId && interaction.channelId !== allowedChannelId && !command.bypassChannelRestriction) {
    await interaction.reply({
      content: `❌ *Só respondo aos chamados feitos em* <#${allowedChannelId}>.`,
      ephemeral: true,
    });
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`Erro ao executar /${interaction.commandName}:`, error);
    const payload = { content: '💥 Ocorreu um erro ao executar este comando.', ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(payload);
    } else {
      await interaction.reply(payload);
    }
  }
});

client.login(DISCORD_TOKEN);
