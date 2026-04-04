import type { GameState } from '../types';

/**
 * Checks if either champion has reached 0 HP.
 * Returns 0 if player 0 wins, 1 if player 1 wins, undefined if game is ongoing.
 * Must be called inside the reducer after every DEAL_DAMAGE action.
 */
export function checkWinner(state: GameState): 0 | 1 | undefined {
  // TODO: implement
  // Check state.players[0].champion.hp <= 0 → player 1 wins
  // Check state.players[1].champion.hp <= 0 → player 0 wins
  throw new Error('Not implemented');
}
