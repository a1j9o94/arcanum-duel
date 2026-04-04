import type { GameState } from '../types';

/**
 * Checks if either champion has reached 0 HP.
 * Returns 0 if player 0 wins, 1 if player 1 wins, undefined if game is ongoing.
 */
export function checkWinner(state: GameState): 0 | 1 | undefined {
  if (state.players[1].champion.hp <= 0) return 0;
  if (state.players[0].champion.hp <= 0) return 1;
  return undefined;
}
