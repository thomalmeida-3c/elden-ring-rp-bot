// Curadoria manual da progressão principal do jogo (jogo base — sem DLC, que
// ainda não está no nosso banco de chefes). Usado por /comecar pra saber até
// onde o grupo pretende ir numa sessão.
const STAGES = [
  {
    id: 'inicio',
    nome: 'Início (Limgrave / Stormveil)',
    bosses: ['Margit, the Fell Omen', 'Godrick the Grafted'],
  },
  {
    id: 'meio',
    nome: 'Meio de Jogo (Liurnia / Caelid / Altus)',
    bosses: [
      'Rennala, Queen of the Full Moon',
      'Starscourge Radahn',
      'God-Devouring Serpent / Rykard, Lord of Blasphemy',
    ],
  },
  {
    id: 'avancado',
    nome: 'Fase Avançada (Leyndell / Mountaintops)',
    bosses: ['Morgott, the Omen King', 'Fire Giant', 'Mohg, Lord of Blood', 'Malenia, Blade of Miquella'],
  },
  {
    id: 'final',
    nome: 'Final (Farum Azula / Elden Throne)',
    bosses: [
      'Beast Clergyman / Maliketh, the Black Blade',
      'Godfrey, First Elden Lord (Hoarah Loux)',
      'Sir Gideon Ofnir, the All-Knowing',
      'Radagon of the Golden Order / Elden Beast',
    ],
  },
];

function getStageById(id) {
  return STAGES.find((s) => s.id === id) || null;
}

module.exports = { STAGES, getStageById };
