import type { GameState, Player } from './types';
import { CHAMPION_TEMPLATES } from './championData';
import { buildDeckForArchetype } from './cardTemplates';

import { createCardInstance } from './instance';


export function initGameState(playerArchetype: string): GameState {
  const archetypes = Object.keys(CHAMPION_TEMPLATES);
  const playerChampionTemplate = CHAMPION_TEMPLATES[playerArchetype];
  
  let aiArchetype;
  do {
    aiArchetype = archetypes[Math.floor(Math.random() * archetypes.length)];
  } while (aiArchetype === playerArchetype);
  const aiChampionTemplate = CHAMPION_TEMPLATES[aiArchetype];

  const playerDeck = buildDeckForArchetype(playerArchetype).map(c => createCardInstance(c));
  const aiDeck = buildDeckForArchetype(aiArchetype).map(c => createCardInstance(c));

  // Shuffle decks
  for (let i = playerDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [playerDeck[i], playerDeck[j]] = [playerDeck[j], playerDeck[i]];
  }
  for (let i = aiDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [aiDeck[i], aiDeck[j]] = [aiDeck[j], aiDeck[i]];
  }
  
  const playerHand = playerDeck.splice(0, 4);
  const aiHand = aiDeck.splice(0, 4);

  const player: Player = {
    id: 0,
    champion: createCardInstance(playerChampionTemplate),
    deck: playerDeck,
    hand: playerHand,
    field: [],
    artifacts: [],
    willpower: 1,
    maxWillpower: 1,
    heroPowerUsed: false,
  };

  const ai: Player = {
    id: 1,
    champion: createCardInstance(aiChampionTemplate),
    deck: aiDeck,
    hand: aiHand,
    field: [],
    artifacts: [],
    willpower: 1,
    maxWillpower: 1,
    heroPowerUsed: false,
  };

  return {
    players: [player, ai],
    currentPlayer: 0,
    phase: 'main',
    turn: 1,
    log: ['Game started'],
    actionLog: [],
  };
}
