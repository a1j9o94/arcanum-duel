import type { GameState } from '../types';
import type { Action } from '../actions';

/**
 * Resolves an attack from a spirit (by instanceId) against a target.
 * Target can be an enemy spirit (by instanceId) or 'champion' (enemy champion).
 *
 * Returns an array of Actions to dispatch:
 *   - DEAL_DAMAGE to target
 *   - DEAL_DAMAGE to attacker (retaliation, unless target is champion)
 *   - DESTROY_SPIRIT for any spirit that reaches 0 HP
 *
 * Preconditions (caller must verify before calling):
 *   - Attacker belongs to attackingPlayerId
 *   - Attacker is not summoning sick and canAttack === true
 *   - Attacker is not stunned
 *   - Target belongs to the opposing player
 *
 * Note: Does NOT modify state. Returns actions only.
 */
export function resolveSpiritAttack(
  state: GameState,
  attackingPlayerId: 0 | 1,
  attackerId: string,
  targetId: string
): Action[] {
  // TODO: implement
  // 1. Find attacker on attackingPlayerId's field
  // 2. Find target: either on opponent's field OR 'champion' = opponent's champion
  // 3. Compute damage in both directions
  // 4. Build DEAL_DAMAGE actions
  // 5. If attacker or target HP would reach 0, add DESTROY_SPIRIT action
  // 6. Mark attacker canAttack = false (return a SET_CAN_ATTACK action or handle inline)
  throw new Error('Not implemented');
}

/**
 * Resolves the champion directly attacking an enemy spirit or champion.
 * Champions deal their atk value to target; target does NOT retaliate to champion.
 *
 * Returns an array of Actions:
 *   - DEAL_DAMAGE to target
 *   - DESTROY_SPIRIT if target spirit reaches 0 HP
 */
export function resolveChampionAttack(
  state: GameState,
  attackingPlayerId: 0 | 1,
  targetId: string
): Action[] {
  // TODO: implement
  // 1. Get attackingPlayerId's champion ATK
  // 2. Determine target: opponent spirit or 'champion'
  // 3. Return DEAL_DAMAGE action(s)
  throw new Error('Not implemented');
}

/**
 * Applies damage to a single target and returns a new GameState.
 * Called inside the reducer for each DEAL_DAMAGE action.
 *
 * - If targetId is 'champion' (or isChampion === true): reduce champion.hp
 * - Otherwise: reduce spirit.hp on targetPlayer's field
 * - Does NOT destroy the spirit — caller checks HP and dispatches DESTROY_SPIRIT if needed
 * - Clamps HP at 0 (never goes negative)
 */
export function applyDamage(
  state: GameState,
  targetId: string,
  targetPlayer: 0 | 1,
  amount: number,
  isChampion?: boolean
): GameState {
  // TODO: implement (pure — return new state, never mutate)
  throw new Error('Not implemented');
}

/**
 * Applies healing to a target and returns a new GameState.
 * - Champions: hp increases by amount, capped at maxHp
 * - Spirits: hp increases by amount, capped at maxHp
 */
export function applyHeal(
  state: GameState,
  targetId: string,
  targetPlayer: 0 | 1,
  amount: number,
  isChampion?: boolean
): GameState {
  // TODO: implement (pure — return new state, never mutate)
  throw new Error('Not implemented');
}

/**
 * Removes a dead spirit from the field and fires its deathrattle (if any).
 * Returns [newState, deathrattleActions].
 *
 * - Looks up DEATHRATTLES registry for the spirit's card id
 * - If ownerPlayer has passive 'ancestral-bond' (Shaman), fires deathrattle TWICE
 * - Removes spirit from player.field
 */
export function destroySpirit(
  state: GameState,
  spiritId: string,
  ownerPlayerId: 0 | 1
): [GameState, Action[]] {
  // TODO: implement
  // 1. Find spirit on ownerPlayerId's field
  // 2. Remove from field (new array without that spirit)
  // 3. Check DEATHRATTLES[spirit.id] → collect returned actions
  // 4. If Shaman passive, fire deathrattle actions twice
  // 5. Return [newState, deathrattleActions]
  throw new Error('Not implemented');
}
