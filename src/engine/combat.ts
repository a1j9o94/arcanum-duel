import type { GameState, CardData } from '../types';
import type { Action } from '../actions';
import { DEATHRATTLES } from '../effects';

export function resolveSpiritAttack(
  state: GameState,
  attackingPlayerId: 0 | 1,
  attackerId: string,
  targetId: string
): Action[] {
  const player = state.players[attackingPlayerId];
  const opponentId = (1 - attackingPlayerId) as 0 | 1;
  const opponent = state.players[opponentId];
  const attacker = player.field.find(s => s.id === attackerId);
  if (!attacker) return [];

  const atkPower = attacker.atk || 0;
  const actions: Action[] = [];

  if (targetId === 'champion') {
    // Attack enemy champion
    actions.push({ type: 'DEAL_DAMAGE', targetId: 'champion', targetPlayer: opponentId, amount: atkPower, isChampion: true });
    // Lifesteal
    if (attacker.keywords?.includes('Lifesteal')) {
      actions.push({ type: 'HEAL', targetId: 'champion', targetPlayer: attackingPlayerId, amount: atkPower, isChampion: true });
    }
  } else {
    // Attack enemy spirit
    const defender = opponent.field.find(s => s.id === targetId);
    if (!defender) return [];

    const defPower = defender.atk || 0;

    // Damage to defender
    actions.push({ type: 'DEAL_DAMAGE', targetId, targetPlayer: opponentId, amount: atkPower });
    // Retaliation damage to attacker
    actions.push({ type: 'DEAL_DAMAGE', targetId: attackerId, targetPlayer: attackingPlayerId, amount: defPower });

    // Lifesteal
    if (attacker.keywords?.includes('Lifesteal')) {
      actions.push({ type: 'HEAL', targetId: 'champion', targetPlayer: attackingPlayerId, amount: atkPower, isChampion: true });
    }

    // Check deaths after damage (use current HP minus damage to predict)
    if ((defender.hp || 0) - atkPower <= 0) {
      actions.push({ type: 'DESTROY_SPIRIT', spiritId: targetId, ownerPlayerId: opponentId });
    }
    if ((attacker.hp || 0) - defPower <= 0) {
      actions.push({ type: 'DESTROY_SPIRIT', spiritId: attackerId, ownerPlayerId: attackingPlayerId });
    }
  }

  return actions;
}

export function resolveChampionAttack(
  state: GameState,
  attackingPlayerId: 0 | 1,
  targetId: string
): Action[] {
  const player = state.players[attackingPlayerId];
  const opponentId = (1 - attackingPlayerId) as 0 | 1;
  const championAtk = player.champion.atk;
  const actions: Action[] = [];

  if (targetId === 'champion') {
    actions.push({ type: 'DEAL_DAMAGE', targetId: 'champion', targetPlayer: opponentId, amount: championAtk, isChampion: true });
  } else {
    const target = state.players[opponentId].field.find(s => s.id === targetId);
    if (!target) return [];
    actions.push({ type: 'DEAL_DAMAGE', targetId, targetPlayer: opponentId, amount: championAtk });
    if ((target.hp || 0) - championAtk <= 0) {
      actions.push({ type: 'DESTROY_SPIRIT', spiritId: targetId, ownerPlayerId: opponentId });
    }
  }

  return actions;
}

export function applyDamage(
  state: GameState,
  targetId: string,
  targetPlayer: 0 | 1,
  amount: number,
  isChampion?: boolean
): GameState {
  const players = state.players.map((p, i) => {
    if (i !== targetPlayer) return p;
    if (isChampion || targetId === 'champion') {
      return {
        ...p,
        champion: {
          ...p.champion,
          hp: Math.max(0, p.champion.hp - amount),
        },
      };
    }
    return {
      ...p,
      field: p.field.map(s =>
        s.id === targetId ? { ...s, hp: Math.max(0, (s.hp || 0) - amount) } : s
      ),
    };
  }) as [typeof state.players[0], typeof state.players[1]];

  return { ...state, players };
}

export function applyHeal(
  state: GameState,
  targetId: string,
  targetPlayer: 0 | 1,
  amount: number,
  isChampion?: boolean
): GameState {
  const players = state.players.map((p, i) => {
    if (i !== targetPlayer) return p;
    if (isChampion || targetId === 'champion') {
      return {
        ...p,
        champion: {
          ...p.champion,
          hp: Math.min(p.champion.maxHp, p.champion.hp + amount),
        },
      };
    }
    return {
      ...p,
      field: p.field.map(s =>
        s.id === targetId ? { ...s, hp: Math.min(s.maxHp || s.hp || 0, (s.hp || 0) + amount) } : s
      ),
    };
  }) as [typeof state.players[0], typeof state.players[1]];

  return { ...state, players };
}

export function destroySpirit(
  state: GameState,
  spiritId: string,
  ownerPlayerId: 0 | 1
): [GameState, Action[]] {
  const player = state.players[ownerPlayerId];
  const spirit = player.field.find(s => s.id === spiritId);
  if (!spirit) return [state, []];

  // Remove spirit from field
  const newField = player.field.filter(s => s.id !== spiritId);
  const players = state.players.map((p, i) =>
    i === ownerPlayerId ? { ...p, field: newField } : p
  ) as [typeof state.players[0], typeof state.players[1]];
  const newState = {
    ...state,
    players,
    log: [...state.log, `${spirit.name} was destroyed`],
  };

  // Check deathrattle
  let deathrattleActions: Action[] = [];
  // Match deathrattle by card name pattern — use the base card id
  // The spirit's id is a unique instance id like "card-12345-0"
  // We need to check against template keys. We can check spirit's name or hasDeathrattle flag.
  if (spirit.hasDeathrattle) {
    // Find the deathrattle handler by checking known deathrattle IDs
    // Since we need to match template id, find it by name mapping
    const deathrattleId = findDeathrattleId(spirit);
    if (deathrattleId && DEATHRATTLES[deathrattleId]) {
      const actions = DEATHRATTLES[deathrattleId](newState, ownerPlayerId, spirit);
      deathrattleActions.push(...actions);

      // Shaman double deathrattle
      if (player.champion.passive.id === 'ancestral-bond') {
        deathrattleActions.push(...actions);
      }
    }
  }

  return [newState, deathrattleActions];
}

// Maps spirit names to their deathrattle template IDs
function findDeathrattleId(spirit: CardData): string | undefined {
  const nameToId: Record<string, string> = {
    'Poison Mite': 'poison-mite',
  };
  return nameToId[spirit.name];
}
