import type { GameState } from './types';
import type { Action } from './actions';
import { checkWinner } from './engine/win';
import { applyDamage, applyHeal, destroySpirit, resolveSpiritAttack, resolveChampionAttack } from './engine/combat';
import { drawCards, prepareCardPlay, summonToken } from './engine/cards';
import { processTurnEnd, applyHeroPower, stunSpirit } from './engine/turn';
import { initGameState } from './init';

function reduce(state: GameState, action: Action): GameState {
  // Action logging for replays
  const stateWithLog = { ...state, actionLog: [...(state.actionLog || []), action] };

  switch (action.type) {
    case 'INIT_GAME':
      return initGameState(action.playerArchetype);

    case 'PLAY_CARD': {
      const { playerId, cardIndex, targetId } = action;
      if (playerId !== state.currentPlayer) return state;

      const [sideEffects, card, cost] = prepareCardPlay(state, playerId, cardIndex, targetId);
      if (!card) return state;
      
      const player = state.players[playerId];

      // Pay cost & remove card from hand
      let willpowerCost = cost;
      let hpCost = 0;
      if (player.champion.archetype === 'Blood Pact' && player.willpower < cost) {
          willpowerCost = player.willpower;
          hpCost = (cost - player.willpower) * 2;
      }
      
      const newHand = player.hand.filter((_, i) => i !== cardIndex);
      let newState = { ...stateWithLog };
      
      newState.players = state.players.map((p, i) => i === playerId ? {
          ...p,
          hand: newHand,
          willpower: p.willpower - willpowerCost,
          champion: { ...p.champion, hp: p.champion.hp - hpCost }
      } : p) as [any, any];
      
      // Place card on field/artifacts
      if (card.type === 'Spirit') {
        const spiritInstance = { ...card, summoningSick: true, canAttack: false };
        newState.players[playerId].field.push(spiritInstance);
      } else if (card.type === 'Artifact') {
        newState.players[playerId].artifacts.push(card);
      } else if (card.type === 'Equipment' && targetId) {
         newState.players[playerId].field = newState.players[playerId].field.map(s => {
             if (s.id !== targetId) return s;
             return { ...s, equipmentId: card.id, atk: (s.atk ?? 0) + (card.atkBuff ?? 0), hp: (s.hp ?? 0) + (card.hpBuff ?? 0), maxHp: (s.maxHp ?? 0) + (card.hpBuff ?? 0) };
         });
      }

      return sideEffects.reduce(reducer, newState);
    }

    case 'ATTACK': {
      const { attackerId } = action;
      const player = state.players[state.currentPlayer];
      const attacker = player.field.find(s => s.id === attackerId);
      if (!attacker || !attacker.canAttack || attacker.stunned) return state;

      const actions = resolveSpiritAttack(state, state.currentPlayer, action.attackerId, action.targetId);
      return actions.reduce(reducer, stateWithLog);
    }
      
    case 'CHAMPION_ATTACK': {
        const actions = resolveChampionAttack(state, action.attackingPlayerId, action.targetId);
        return actions.reduce(reducer, stateWithLog);
    }

    case 'USE_HERO_POWER': {
      const { playerId, targetId } = action;
      if (playerId !== state.currentPlayer || state.players[playerId].heroPowerUsed) return state;
      
      const [newState, actions] = applyHeroPower(state, playerId, targetId);
      return actions.reduce(reducer, newState);
    }

    case 'END_TURN': {
      const [newState, actions] = processTurnEnd(state);
      const finalState = actions.reduce(reducer, newState);
      if (finalState.currentPlayer === 1) { // AI's turn
        return { ...finalState, phase: 'battle' };
      }
      return finalState;
    }

    case 'DRAW_CARD': {
      return drawCards(stateWithLog, action.playerId, action.count);
    }

    case 'DEAL_DAMAGE': {
      const newState = applyDamage(stateWithLog, action.targetId, action.targetPlayer, action.amount, action.isChampion);
      const winner = checkWinner(newState);
      if (winner !== undefined) {
        return { ...newState, winner, phase: 'end' };
      }
      return newState;
    }

    case 'HEAL':
      return applyHeal(stateWithLog, action.targetId, action.targetPlayer, action.amount, action.isChampion);

    case 'DESTROY_SPIRIT': {
      const [newState, deathrattleActions] = destroySpirit(state, action.spiritId, action.ownerPlayerId);
      return deathrattleActions.reduce(reducer, newState);
    }
      
    case 'SUMMON_TOKEN':
      return summonToken(stateWithLog, action.playerId, action.card);

    case 'STUN_SPIRIT':
      return stunSpirit(stateWithLog, action.spiritId, action.ownerPlayerId);
      
    case 'GAIN_WILLPOWER': {
      const { playerId, amount } = action;
      const players = state.players.map((p, i) => i === playerId ? { ...p, willpower: Math.min(p.maxWillpower, p.willpower + amount) } : p) as [any, any];
      return { ...stateWithLog, players };
    }
      
    case 'AI_TURN':
      return state; // No-op, handled by GameBoard

    default:
      return state;
  }
}

// Wrapper to prevent direct export and allow for middleware in the future
export const reducer = reduce;
