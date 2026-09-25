const CLASSES = [
  {
    id: 'paladino',
    classeInicial: 'Prophet',
    nome: 'Paladino',
    emoji: '🛡️',
    atributos: ['Força', 'Fé'],
    estilo: 'Tank / suporte',
    equipamentos: ['Escudo', 'Arma pesada', 'Encantamentos de buff', 'Encantamentos de cura'],
  },
  {
    id: 'sanguinario',
    classeInicial: 'Bandit',
    nome: 'Sanguinário',
    emoji: '🩸',
    atributos: ['Destreza', 'Arcano'],
    estilo: 'Assassino / sangramento',
    equipamentos: ['Katanas', 'Adagas', 'Twinblades', 'Armas com sangramento'],
  },
  {
    id: 'feiticeiro_de_batalha',
    classeInicial: 'Prisoner',
    nome: 'Feiticeiro de Batalha',
    emoji: '🔮',
    atributos: ['Inteligência', 'Destreza'],
    estilo: 'Mago DPS',
    equipamentos: ['Cajado', 'Arma rápida ou mágica de apoio'],
  },
  {
    id: 'inquisidor',
    classeInicial: 'Prophet',
    nome: 'Inquisidor',
    emoji: '🔥',
    atributos: ['Fé', 'Destreza'],
    estilo: 'DPS sagrado / elemental',
    equipamentos: ['Armas rápidas', 'Encantamentos ofensivos'],
  },
  {
    id: 'barbaro',
    classeInicial: 'Hero',
    nome: 'Bárbaro',
    emoji: '🪨',
    atributos: ['Força', 'Vigor'],
    estilo: 'Tank / porrada',
    equipamentos: ['Armas colossais', 'Armadura pesada', 'Empunhadura com as duas mãos'],
  },
  {
    id: 'cavaleiro_draconico',
    classeInicial: 'Prophet',
    nome: 'Cavaleiro Dracônico',
    emoji: '🐉',
    atributos: ['Fé', 'Arcano'],
    estilo: 'Caster híbrido',
    equipamentos: ['Feitiços de Dragon Communion', 'Armas de escalonamento em Arcano'],
  },
  {
    id: 'mestre_de_armas',
    classeInicial: 'Samurai',
    nome: 'Mestre de Armas',
    emoji: '⚔️',
    atributos: ['Força', 'Destreza'],
    estilo: 'Guerreiro versátil',
    equipamentos: ['Armas quality (STR/DEX)', 'Espadas', 'Lanças', 'Arcos'],
  },
  {
    id: 'cavaleiro_arcano',
    classeInicial: 'Prisoner',
    nome: 'Cavaleiro Arcano',
    emoji: '🌙',
    atributos: ['Força', 'Inteligência'],
    estilo: 'Spellblade pesado',
    equipamentos: ['Espadão', 'Feitiçaria de apoio'],
  },
  {
    id: 'necromante',
    classeInicial: 'Prophet',
    nome: 'Necromante',
    emoji: '☠️',
    atributos: ['Inteligência', 'Fé'],
    estilo: 'Mago sombrio',
    equipamentos: ['Death Sorceries', 'Feitiços de Golden Order'],
  },
  {
    id: 'duelista',
    classeInicial: 'Vagabond',
    nome: 'Duelista',
    emoji: '🗡️',
    atributos: ['Destreza', 'Vigor'],
    estilo: 'DPS corpo a corpo',
    equipamentos: ['Rapieiras', 'Curved swords', 'Foco em esquiva'],
  },
  {
    id: 'ocultista',
    classeInicial: 'Hero',
    nome: 'Ocultista',
    emoji: '🖤',
    atributos: ['Força', 'Arcano'],
    estilo: 'Brutamontes sombrio',
    equipamentos: ['Armas pesadas com sangramento ou Occult'],
  },
  {
    id: 'profeta_de_guerra',
    classeInicial: 'Prophet',
    nome: 'Profeta de Guerra',
    emoji: '⚡',
    atributos: ['Fé', 'Vigor'],
    estilo: 'Suporte resistente',
    equipamentos: ['Encantamentos', 'Armadura pesada', 'Buffs de grupo'],
  },
];

function getClassById(id) {
  return CLASSES.find((c) => c.id === id) || null;
}

function getRandomClass() {
  return CLASSES[Math.floor(Math.random() * CLASSES.length)];
}

module.exports = { CLASSES, getClassById, getRandomClass };
