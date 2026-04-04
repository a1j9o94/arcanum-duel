import type { GameState, CardData } from './types';
import type { Action } from './actions';
import { checkWinner } from './engine/win';
import { applyDamage, applyHeal, destroySpirit, resolveSpiritAttack, resolveChampionAttack } from './engine/combat';
import { drawCards, playCard, summonToken } from './engine/cards';
import { processTurnEnd, applyHeroPower, stunSpirit } from './engine/turn';
import { CHAMPION_TEMPLATES } from './championData';
import { buildDeckForArchetype } from './cardTemplates';

/**
 * The single source of truth for all game state transitions.
 * (state, action) => GameState — always pure, never mutates.
 *
 * After every DEAL_DAMAGE action, call checkWinner and set state.winner if applicable.
 * After DESTROY_SPIRIT, fire deathrattles and process their returned actions in sequence.
 */
export function reducer(state: GameState, action: Action): GameState {
  // TODO: implement
  // Handle each action type in a switch statement.
  // Pattern for multi-step actions that produce sub-actions:
  //   const [newState, sideEffects] = someEngine(state, ...);
  //   return sideEffects.reduce(reducer, newState);

  switch (action.type) {
    case 'INIT_GAME': {
      // Initialize a fresh game for the given playerArchetype
      // Pick a random AI archetype (different from player's)
      // Build decks, deal 4 cards to each player, set turn=1, currentPlayer=0
      throw new Error('Not implemented');
    }

    case 'PLAY_CARD': {
      // Validate: card exists, cost <= willpower, it's action.playerId's turn
      // Call playCard engine function
      // Reduce side-effect actions through this reducer
      throw new Error('Not implemented');
    }

    case 'ATTACK': {
      // Validate: attacker belongs to currentPlayer, canAttack===true, not stunned
      // Call resolveSpiritAttack → get actions
      // Reduce those actions through this reducer
      throw new Error('Not implemented');
    }

    case 'CHAMPION_ATTACK': {
      // Validate: it's action.attackingPlayerId's turn
      // Call resolveChampionAttack → get actions
      // Reduce those actions through this reducer
      throw new Error('Not implemented');
    }

    case 'USE_HERO_POWER': {
      // Validate: player.heroPowerUsed === false, willpower sufficient (or HP available for Blood Pact)
      // Call applyHeroPower → get [newState, actions]
      // Reduce actions through this reducer
      throw new Error('Not implemented');
    }

    case 'END_TURN': {
      // Call processTurnEnd → get [newState, drawActions]
      // Reduce drawActions through this reducer
      // Return final state
      throw new Error('Not implemented');
    }

    case 'DRAW_CARD': {
      // Call drawCards engine function
      // Return new state (no winner check needed)
      throw new Error('Not implemented');
    }

    case 'DEAL_DAMAGE': {
      // Call applyDamage → new state
      // Call checkWinner(newState) → set state.winner if applicable
      // Return new state
      throw new Error('Not implemented');
    }

    case 'HEAL': {
      // Call applyHeal → return new state
      throw new Error('Not implemented');
    }

    case 'DESTROY_SPIRIT': {
      // Call destroySpirit → [newState, deathrattleActions]
      // Reduce deathrattleActions through this reducer
      // Return final state
      throw new Error('Not implemented');
    }

    case 'SUMMON_TOKEN': {
      // Call summonToken engine function
      throw new Error('Not implemented');
    }

    case 'STUN_SPIRIT': {
      // Call stunSpirit engine function
      throw new Error('Not implemented');
    }

    case 'GAIN_WILLPOWER': {
      // Increase player.willpower by amount, capped at player.maxWillpower
      throw new Error('Not implemented');
    }

    case 'AI_TURN': {
      // This action is dispatched by GameBoard when it's the AI's turn
      // The reducer itself does NOT run AI logic here (GameBoard does that)
      // This is a no-op placeholder — GameBoard drives AI actions individually
      return state;
    }

    default: {
      return state;
    }
  }
}

/**
 * Initializes a fresh GameState for the given playerArchetype.
 * Called as the initializer in GameBoard's useReducer:
 *   const [state, dispatch] = useReducer(reducer, undefined, () => initGameState('Swarm Master'));
 */
export function initGameState(playerArchetype: string): GameState {
  // TODO: implement
  // Pick AI archetype (random, different from player's)
  // Get champion templates from championData.ts
  // Build decks from cardTemplates.ts
  // Deal 4 cards to each player
  // Return initial GameState with turn=1, currentPlayer=0, willpower=1/1 for both
  throw new Error('Not implemented');
}
