const { SlashCommandBuilder } = require('discord.js');
const { searchAllItems, getItemByKey, CATEGORY_LABELS } = require('../game-data');
const {
  buildWeaponEmbed,
  buildArmorEmbed,
  buildTalismanEmbed,
  buildSpellEmbed,
  buildSpiritAshEmbed,
  buildAshOfWarEmbed,
} = require('../item-embeds');

const EMBED_BUILDERS = {
  arma: buildWeaponEmbed,
  armadura: buildArmorEmbed,
  talisma: buildTalismanEmbed,
  spell: buildSpellEmbed,
  invocacao: buildSpiritAshEmbed,
  cinza: buildAshOfWarEmbed,
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('item')
    .setDescription('Pesquisa qualquer item do jogo (arma, armadura, talismã, spell, invocação, cinza de guerra)')
    .addStringOption((option) =>
      option
        .setName('nome')
        .setDescription('Nome do item')
        .setRequired(true)
        .setAutocomplete(true)
    ),

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused();
    if (!focused) {
      await interaction.respond([]);
      return;
    }
    const matches = searchAllItems(focused, 25);
    await interaction.respond(
      matches.map(({ category, item }) => ({
        name: `${item.name} (${CATEGORY_LABELS[category]})`.slice(0, 100),
        value: `${category}:${item.id}`,
      }))
    );
  },

  async execute(interaction) {
    const key = interaction.options.getString('nome');
    const found = getItemByKey(key);

    if (!found) {
      await interaction.reply({
        content: '❌ Não encontrei esse item. Use o autocomplete pra escolher um da lista.',
        ephemeral: true,
      });
      return;
    }

    const builder = EMBED_BUILDERS[found.category];
    await interaction.reply({ embeds: [builder(found.item)] });
  },
};
