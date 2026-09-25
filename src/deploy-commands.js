require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;

if (!DISCORD_TOKEN || !CLIENT_ID) {
  console.error('❌ Defina DISCORD_TOKEN e CLIENT_ID no arquivo .env');
  process.exit(1);
}

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
for (const file of fs.readdirSync(commandsPath).filter((f) => f.endsWith('.js'))) {
  const command = require(path.join(commandsPath, file));
  commands.push(command.data.toJSON());
}

const rest = new REST().setToken(DISCORD_TOKEN);

(async () => {
  try {
    const route = GUILD_ID
      ? Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID)
      : Routes.applicationCommands(CLIENT_ID);

    console.log(`Registrando ${commands.length} comando(s)${GUILD_ID ? ' no servidor de teste' : ' globalmente'}...`);
    await rest.put(route, { body: commands });
    console.log('✅ Comandos registrados com sucesso.');
  } catch (error) {
    console.error(error);
  }
})();
