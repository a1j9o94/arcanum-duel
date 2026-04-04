import type { GameState } from '../types';
import type { Action } from '../actions';

/**
 * Handles END_TURN logic. Returns [newState, nextTurnActions].
 *
 * Sequence (in order):
 * 1. Fire all ARTIFACT_PASSIVES for the current player's artifacts
 *    - Look up ARTIFACT_PASSIVES[artifact.id] → collect actions
 * 2. Fire all ARTIFACT_PASSIVES for the opponent's artifacts
 * 3. Clear summoning sickness on all spirits belonging to the NEXT player
 *    (the player who is ABOUT to take their turn — they can attack immediately)
 * 4. Decrement stun counters on all spirits (both sides); unstun if reaches 0
 *    Actually: stunned is boolean, simply clear stun on stunned spirits for current player
 *    (stunned for 1 turn only)
 * 5. Increment turn counter (state.turn++)
 * 6. Switch currentPlayer (0 → 1, 1 → 0)
 * 7. Ramp willpower for the new current player:
 *    newMaxWillpower = Math.min(state.turn + 1, 10)   // starts at 1, +1 per full round
 *    Actually: use Math.min(Math.floor(state.turn / 2) + 1, 10) to ramp once per full round
 *    See NOTE below for exact formula.
 * 8. Set player.willpower = player.maxWillpower (full refresh)
 * 9. Reset heroPowerUsed = false for new current player
 * 10. Reset canAttack = true for all non-stunned spirits belonging to new current player
 * 11. Return [newState, [{ type: 'DRAW_CARD', playerId: newCurrentPlayer, count: 1 }]]
 *
 * NOTE on willpower ramp:
 *   Turn 1 (player 0's first turn): maxWillpower = 1
 *   Turn 2 (player 1's first turn): maxWillpower = 1
 *   Turn 3 (player 0's second turn): maxWillpower = 2
 *   Turn 4 (player 1's second turn): maxWillpower = 2
 *   etc. (ramps by 1 each full round, capped at 10)
 *   Formula: maxWillpower = Math.min(Math.ceil(state.turn / 2), 10)
 *   where state.turn is the NEW turn number AFTER increment.
 */
export function processTurnEnd(
  state: GameState
): [GameState, Action[]] {
  // TODO: implement (pure)
  throw new Error('Not implemented');
}

/**
 * Fires artifact passives for a single player.
 * Returns array of Actions produced by each artifact's passive.
 * Does NOT modify state.
 */
export function fireArtifactPassives(
  state: GameState,
  playerId: 0 | 1
): Action[] {
  // TODO: implement
  // For each artifact in state.players[playerId].artifacts:
  //   Look up ARTIFACT_PASSIVES[artifact.id]
  //   If found, call it and collect resulting Actions
  // Return flat array of all actions
  throw new Error('Not implemented');
}

/**
 * Applies a hero power for a player.
 * Returns [newState, heroPowerActions].
 *
 * Rules:
 * - Deduct willpower cost (Blood Pact costs HP instead — handle in HERO_POWER_EFFECTS)
 * - Set player.heroPowerUsed = true
 * - Look up HERO_POWER_EFFECTS[champion.heroPower.id] → return those actions
 * - Precondition: player.heroPowerUsed === false (caller must check)
 */
export function applyHeroPower(
  state: GameState,
  playerId: 0 | 1,
  targetId?: string
): [GameState, Action[]] {
  // TODO: implement (pure)
  throw new Error('Not implemented');
}

/**
 * Stuns a spirit for 1 turn.
 * - Sets spirit.stunned = true, spirit.canAttack = false
 * - Returns new GameState
 */
export function stunSpirit(
  state: GameState,
  spiritId: string,
  ownerPlayerId: 0 | 1
): GameState {
  // TODO: implement (pure)
  throw new Error('Not implemented');
}
