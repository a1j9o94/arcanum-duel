import type { GameState } from '../types';
import type { Action } from '../actions';

/**
 * Synchronous AI decision function.
 * Given the current GameState (where currentPlayer === 1), returns the FULL sequence
 * of actions the AI wants to take this turn, ending with END_TURN.
 *
 * GameBoard replays these with visual delays (400ms each):
 *   const aiActions = aiDecide(game);
 *   for (const action of aiActions) {
 *     await delay(400);
 *     dispatch(action);
 *   }
 *
 * Strategy (greedy, in priority order):
 *
 * PHASE 1 — Card Play:
 *   1. Play spirits if cost <= willpower (cheapest first, to fill the field)
 *   2. Play incantations if they have a valid target and cost <= willpower
 *      - Banishment: play if enemy has a spirit, target the highest-atk enemy spirit
 *      - Soul Drain: play if enemy has a spirit, target the highest-atk enemy spirit
 *      - Summoning Ritual: always play if willpower allows
 *   3. Play equipment on the highest-atk friendly spirit
 *   4. Play artifacts if willpower allows
 *   5. Repeat until no more cards can be played
 *
 * PHASE 2 — Hero Power:
 *   - Use hero power if NOT already used AND willpower allows (or HP cost for Blood Pact):
 *     - Swarm Master: always use (summons a token)
 *     - Blood Pact: only use if own HP > 5 (avoid self-kill)
 *     - Binder: use if enemy has a spirit that hasn't been stunned yet
 *     - Shaman: use if own HP < maxHp - 3 (healing is useful)
 *
 * PHASE 3 — Attacks:
 *   1. Attack with all available spirits (canAttack === true, not stunned):
 *      - If any enemy spirit has lethal ATK (would kill a friendly next turn), attack it
 *      - Otherwise attack the lowest-HP enemy target (champion or spirit)
 *      - Prefer face damage (champion) if no dangerous threats exist
 *   2. Champion attack: if champion.atk > 0, attack lowest-HP enemy target
 *      (Note: check current game for whether champion attack is supported)
 *
 * PHASE 4 — End Turn:
 *   Always push { type: 'END_TURN' } as the final action.
 *
 * Constraints:
 * - Do NOT mutate state. Read only.
 * - Do NOT use setTimeout or async. Pure sync function.
 * - Do NOT use randomness for targets — use deterministic selection (highest-atk, lowest-hp, etc.)
 * - The returned action array must be safe to replay on state via the reducer in sequence.
 *   (i.e. simulate state changes mentally to avoid impossible actions like playing a card twice)
 */
export function aiDecide(state: GameState): Action[] {
  // TODO: implement
  // Hint: simulate willpower spending as you build the action list
  // Use a local `willpower` variable starting at state.players[1].willpower
  // Decrement it as you add card play / hero power actions
  const actions: Action[] = [];

  // ... implement phases 1–4 here ...

  actions.push({ type: 'END_TURN' });
  return actions;
}
