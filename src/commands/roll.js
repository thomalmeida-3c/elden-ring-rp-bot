const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getMember, setMemberClass } = require('../storage');
const { getRandomClass, getClassById } = require('../classes');

function buildClassEmbed(title, color, user, classe) {
  return new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(`${classe.emoji} **${classe.nome}**`)
    .addFields(
      { name: '**Atributos principais**', value: classe.atributos.join(' + '), inline: true },
      { name: '**Estilo**', value: classe.estilo, inline: true },
      { name: '**Classe inicial do jogo**', value: `Comece criando um **${classe.classeInicial}**`, inline: true },
      { name: '**Equipamentos sugeridos**', value: classe.equipamentos.map((e) => `• ${e}`).join('\n') },
      {
        name: '**Próximo passo**',
        value: `Crie seu personagem como **${classe.classeInicial}** e rode \`/save\` enviando o save para vincular seu personagem à jornada.`,
      }
    )
    .setFooter({ text: `Classe de ${user.username} — vale até o fim do jogo` });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('roll')
    .setDescription('Sorteia sua classe de RP para esta run (só pode ser feito uma vez)'),

  async execute(interaction) {
    const member = getMember(interaction.guildId, interaction.user.id);

    if (!member) {
      await interaction.reply({
        content: '❌ Você ainda **não está registrado na guilda**. Use `/register` primeiro.',
        ephemeral: true,
      });
      return;
    }

    if (member.classId) {
      const classeAtual = getClassById(member.classId);
      await interaction.reply({
        embeds: [
          buildClassEmbed(
            '📜 **Você já tem uma classe**',
            0x6b6b6b,
            interaction.user,
            classeAtual
          ),
        ],
      });
      return;
    }

    const classe = getRandomClass();
    setMemberClass(interaction.guildId, interaction.user.id, classe.id);

    await interaction.reply({
      embeds: [
        buildClassEmbed(
          '🎲 **Classe Sorteada**!',
          0xc9a227,
          interaction.user,
          classe
        ),
      ],
    });
  },
};
