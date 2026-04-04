import type { GameState } from '../types';
import type { Action } from '../actions';

export function aiDecide(state: GameState): Action[] {
  const actions: Action[] = [];
  const aiPlayerId = state.currentPlayer;
  if (aiPlayerId !== 1) return [{ type: 'END_TURN' }];

  let availableWillpower = state.players[aiPlayerId].willpower;
  const aiPlayer = state.players[aiPlayerId];
  const opponentPlayer = state.players[0];

  // PHASE 1 — Card Play
  const playableCards = aiPlayer.hand
    .map((card, index) => ({ card, index }))
    .filter(({ card }) => card.cost <= availableWillpower)
    .sort((a, b) => a.card.cost - b.card.cost);

  for (const { card, index } of playableCards) {
    if (card.cost > availableWillpower) continue;

    let targetId: string | undefined = undefined;

    if (card.requiresTarget) {
      if (card.type === 'Equipment') {
        const friendlySpirits = aiPlayer.field.sort((a,b) => (b.atk ?? 0) - (a.atk ?? 0));
        if (friendlySpirits.length > 0) {
          targetId = friendlySpirits[0].id;
        }
      } else {
        const enemySpirits = opponentPlayer.field.sort((a,b) => (b.atk ?? 0) - (a.atk ?? 0));
        if (enemySpirits.length > 0) {
          targetId = enemySpirits[0].id;
        } else {
          // No valid target
          continue;
        }
      }
    }
    
    // Specific logic for some cards
    if(card.id === 'banishment' && opponentPlayer.field.length === 0) continue;
    if(card.id === 'soul-drain' && opponentPlayer.field.length === 0) continue;

    actions.push({ type: 'PLAY_CARD', playerId: aiPlayerId, cardIndex: index, targetId });
    availableWillpower -= card.cost;
  }

  // PHASE 2 — Hero Power
  const heroPower = aiPlayer.champion.heroPower;
  if (!aiPlayer.heroPowerUsed && heroPower.cost <= availableWillpower) {
    let usePower = false;
    let targetId: string | undefined = undefined;
    switch (heroPower.id) {
      case 'summon-swarm':
        usePower = true;
        break;
      case 'blood-sacrifice':
        if (aiPlayer.champion.hp > 5) {
          usePower = true;
        }
        break;
      case 'binding-circle':
        const validTargets = opponentPlayer.field.filter(s => !s.stunned);
        if (validTargets.length > 0) {
          usePower = true;
          targetId = validTargets.sort((a,b) => (b.atk ?? 0) - (a.atk ?? 0))[0].id;
        }
        break;
      case 'ancestral-heal':
        if (aiPlayer.champion.hp < aiPlayer.champion.maxHp - 3) {
          usePower = true;
        }
        break;
    }
    if (usePower) {
      actions.push({ type: 'USE_HERO_POWER', playerId: aiPlayerId, targetId });
      availableWillpower -= heroPower.cost;
    }
  }

  // PHASE 3 — Attacks
  for (const spirit of aiPlayer.field) {
    if (spirit.canAttack && !spirit.stunned) {
      // Simple strategy: attack champion if possible, otherwise attack highest attack spirit
      if (opponentPlayer.field.length === 0) {
        actions.push({ type: 'ATTACK', attackerId: spirit.id, targetId: 'champion' });
      } else {
        const target = opponentPlayer.field.sort((a,b) => (b.atk ?? 0) - (a.atk ?? 0))[0];
        actions.push({ type: 'ATTACK', attackerId: spirit.id, targetId: target.id });
      }
    }
  }

  // Champion attack
  if (aiPlayer.champion.atk > 0) {
     if (opponentPlayer.field.length === 0) {
        actions.push({ type: 'CHAMPION_ATTACK', attackingPlayerId: aiPlayerId, targetId: 'champion' });
      } else {
        const target = opponentPlayer.field.sort((a,b) => (b.hp ?? 0) - (a.hp ?? 0))[0];
        actions.push({ type: 'CHAMPION_ATTACK', attackingPlayerId: aiPlayerId, targetId: target.id });
      }
  }

  // PHASE 4 — End Turn
  actions.push({ type: 'END_TURN' });
  return actions;
}
