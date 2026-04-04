import type { GameState, CardData } from '../types';
import type { Action } from '../actions';
import { CARD_EFFECTS } from '../effects';

export function drawCards(
  state: GameState,
  playerId: 0 | 1,
  count: number = 1
): GameState {
  const player = state.players[playerId];
  if (player.deck.length === 0) return state;

  const drawCount = Math.min(count, player.deck.length);
  const drawnCards = player.deck.slice(0, drawCount);
  const newDeck = player.deck.slice(drawCount);

  const players = state.players.map((p, i) =>
    i === playerId ? { ...p, deck: newDeck, hand: [...p.hand, ...drawnCards] } : p
  ) as [typeof state.players[0], typeof state.players[1]];

  return { ...state, players };
}

/**
 * Validates if a card can be played and returns the side-effect actions (like battlecries).
 * It does NOT modify the state. The reducer is responsible for costs and moving the card.
 */
export function prepareCardPlay(
  state: GameState,
  playerId: 0 | 1,
  cardIndex: number,
  targetId?: string
): [Action[], CardData | null, number] {
  const player = state.players[playerId];
  const card = player.hand[cardIndex];
  if (!card) return [[], null, 0];

  // Calculate cost with passives
  let actualCost = card.cost;
  if (player.champion.archetype === 'Swarm Master' && card.type === 'Spirit') {
    actualCost = Math.max(0, card.cost - 1);
  }

  // Validate cost
  const canAfford = canPlayerAfford(player, actualCost);
  if (!canAfford) return [[], null, 0];

  // Validate target
  if (card.requiresTarget && !targetId) {
    return [[], null, 0];
  }

  let sideEffects: Action[] = [];
  if (card.type === 'Spirit' && card.hasBattlecry) {
    if (CARD_EFFECTS[card.id]) {
      sideEffects = CARD_EFFECTS[card.id](state, playerId, card, targetId);
    }
  } else if (card.type === 'Incantation') {
    if (CARD_EFFECTS[card.id]) {
      sideEffects = CARD_EFFECTS[card.id](state, playerId, card, targetId);
    }
  }

  return [sideEffects, card, actualCost];
}

function canPlayerAfford(player: GameState['players'][0], cost: number): boolean {
  if (player.willpower >= cost) return true;
  if (player.champion.archetype === 'Blood Pact') {
    const requiredHp = (cost - player.willpower) * 2;
    // Cannot pay with HP if it would be lethal, unless it's the only way
    if(player.champion.hp > requiredHp) return true;
  }
  return false;
}

export function summonToken(
  state: GameState,
  playerId: 0 | 1,
  card: CardData
): GameState {
  const player = state.players[playerId];
  if (player.field.length >= 5) return state;

  const tokenCard: CardData = {
    ...card,
    id: createCardInstance(card).id, // Give token a unique id
    summoningSick: true,
    canAttack: false,
  };

  const players = state.players.map((p, i) =>
    i === playerId ? { ...p, field: [...p.field, tokenCard] } : p
  ) as [typeof state.players[0], typeof state.players[1]];

  return { ...state, players, log: [...state.log, `Summoned ${card.name}`] };
}

// impure, should be handled by a factory in reducer
let cardInstanceCounter = 0;
export function createCardInstance(template: CardData): CardData {
  return {
    ...template,
    id: `${template.id}-${cardInstanceCounter++}`,
  };
}
