import type { GameState, CardData } from '../types';
import type { Action } from '../actions';

/**
 * Draws `count` cards from a player's deck into their hand.
 * Returns a new GameState with the deck/hand updated.
 *
 * Rules:
 * - If deck is empty, no cards are drawn (no crash, no fatigue damage for MVP)
 * - Max hand size is NOT enforced in MVP (allow up to 10 cards)
 * - Drawn card gets: summoningSick: false, canAttack: true, stunned: false (runtime defaults)
 */
export function drawCards(
  state: GameState,
  playerId: 0 | 1,
  count: number = 1
): GameState {
  // TODO: implement (pure)
  // Take count cards from front of deck, push to hand
  throw new Error('Not implemented');
}

/**
 * Plays a card from a player's hand.
 * Returns [newState, sideEffectActions].
 *
 * Rules by card type:
 *
 * SPIRIT:
 *   - Remove from hand, add to field with summoningSick:true, canAttack:false
 *   - Deduct willpower cost
 *   - If card has hasBattlecry, look up CARD_EFFECTS[card.id] → return those actions
 *
 * INCANTATION:
 *   - Remove from hand (incantations do not go to field — they are discarded)
 *   - Deduct willpower cost
 *   - Look up CARD_EFFECTS[card.id] → return those actions
 *
 * EQUIPMENT:
 *   - Remove from hand
 *   - Deduct willpower cost
 *   - Find targetId spirit on player's own field
 *   - Apply atkBuff and hpBuff to target spirit
 *   - Set spirit.equipmentId = card.id
 *
 * ARTIFACT:
 *   - Remove from hand
 *   - Deduct willpower cost
 *   - Add to player.artifacts array
 *   - Artifacts do NOT trigger CARD_EFFECTS on play (their effect fires end-of-turn via ARTIFACT_PASSIVES)
 *
 * Preconditions (caller must verify):
 *   - card.cost <= player.willpower
 *   - It is the player's turn
 *   - card exists in hand at cardIndex
 */
export function playCard(
  state: GameState,
  playerId: 0 | 1,
  cardIndex: number,
  targetId?: string
): [GameState, Action[]] {
  // TODO: implement (pure)
  throw new Error('Not implemented');
}

/**
 * Summons a token directly to the field (bypasses hand, no cost).
 * Used by Swarm Master hero power and card effects.
 * Token gets: summoningSick:false, canAttack:true (tokens can act immediately).
 */
export function summonToken(
  state: GameState,
  playerId: 0 | 1,
  card: CardData
): GameState {
  // TODO: implement (pure)
  // Give card a unique instanceId (e.g. `token-${Date.now()}-${Math.random()}`)
  // Add to player's field with canAttack:true, summoningSick:false
  throw new Error('Not implemented');
}

/**
 * Creates a unique instance of a card template by spreading it + assigning a fresh instanceId.
 * Use this whenever a card moves from deck/hand to field.
 */
export function createCardInstance(template: CardData): CardData {
  // TODO: implement
  // return { ...template, id: `${template.id}-${Date.now()}-${Math.random().toString(36).slice(2)}` }
  throw new Error('Not implemented');
}
