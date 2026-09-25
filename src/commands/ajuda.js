const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const COMANDOS = [
  {
    nome: '🕯️ /register',
    fala: 'Aceite-me como sua guia, e seu nome será gravado entre os membros desta guilda.',
  },
  {
    nome: '🎲 /roll',
    fala: 'Um lance de sorte selará sua classe a este corpo — para o bem ou para a desgraça, até o fim da jornada.',
  },
  {
    nome: '⚔️ /build',
    fala: 'Permita-me revelar o que seu destino exige: armas, armadura, talismãs, feitiços e mais, de acordo com sua classe.',
  },
  {
    nome: '🔍 /item',
    fala: 'Pergunte-me o nome de qualquer relíquia deste mundo — arma, armadura, talismã, feitiço, invocação ou cinza de guerra — e eu lhe direi tudo o que sei sobre ela.',
  },
  {
    nome: '🏰 /guild',
    fala: 'Contemple os nomes e os destinos dos que caminham ao seu lado nesta jornada.',
  },
  {
    nome: '📤 /save',
    fala: 'Traga-me seu save, e eu revelarei a verdade sobre seu nível, tempo de jornada, atributos e os chefes que caíram sob sua lâmina.',
  },
  {
    nome: '🔔 /comecar',
    fala: 'Reúnam-se antes de cada sessão. Confirmem que estão prontos, e juntos decidiremos até onde a jornada de hoje irá.',
  },
  {
    nome: '📖 /sessoes',
    fala: 'Que se leiam as crônicas de cada sessão já vivida por este grupo.',
  },
  {
    nome: '🚩 /checkpoint (Conselho)',
    fala: 'Que o Conselho registre até onde a jornada em grupo deveria ter chegado.',
  },
  {
    nome: '🔄 /reset (Conselho)',
    fala: 'Se necessário, posso desfazer os fios do destino de um Tarnished para que recomece do zero.',
  },
  {
    nome: '🔒 /canal (Conselho)',
    fala: 'Escolham um único salão onde eu deva ouvir seus chamados — não responderei em nenhum outro lugar.',
  },
  {
    nome: '👋 /saudacao',
    fala: 'Uma simples saudação, para quando desejar ouvir minha voz mais uma vez.',
  },
  {
    nome: '🔊 /falar',
    fala: 'Escolha um som guardado comigo, e eu o trarei até você.',
  },
  {
    nome: '📜 /ajuda',
    fala: 'Assim se revela, mais uma vez, o pacto que rege nossa jornada.',
  },
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ajuda')
    .setDescription('Melina explica todos os comandos disponíveis'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0xc9a227)
      .setTitle('📜 Os Pactos de Melina')
      .setDescription(
        `${interaction.user}, *aproxime-se. Vou lhe explicar os pactos que regem esta jornada.*`
      )
      .addFields(COMANDOS.map((c) => ({ name: c.nome, value: `*"${c.fala}"*` })))
      .setFooter({ text: 'Melina — vale até o fim do jogo' });

    await interaction.reply({ embeds: [embed] });
  },
};
