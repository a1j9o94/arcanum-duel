import type { GameState } from '../types';
import type { Action } from '../actions';
import { ARTIFACT_PASSIVES, HERO_POWER_EFFECTS } from '../effects';

export function processTurnEnd(state: GameState): [GameState, Action[]] {
  const currentPlayerId = state.currentPlayer;
  const nextPlayerId = (1 - currentPlayerId) as 0 | 1;
  const newTurn = state.turn + 1;

  let actions: Action[] = [];
  actions.push(...fireArtifactPassives(state, currentPlayerId));
  actions.push(...fireArtifactPassives(state, nextPlayerId));

  const newPlayers = state.players.map((p, i) => {
    if (i === nextPlayerId) {
      // New player's turn starts
      const maxWillpower = Math.min(Math.ceil(newTurn / 2), 10);
      return {
        ...p,
        maxWillpower,
        willpower: maxWillpower,
        heroPowerUsed: false,
        field: p.field.map(s => ({
          ...s,
          summoningSick: false,
          canAttack: !s.stunned,
        })),
      };
    } else {
      // Current player's turn ends, clear stuns
      return {
        ...p,
        field: p.field.map(s => ({ ...s, stunned: false })),
      };
    }
  }) as [typeof state.players[0], typeof state.players[1]];

  const newState: GameState = {
    ...state,
    players: newPlayers,
    currentPlayer: nextPlayerId,
    turn: newTurn,
    phase: 'main',
    log: [...state.log, `Turn ${newTurn}`],
  };

  const finalActions: Action[] = [
    ...actions,
    { type: 'DRAW_CARD', playerId: nextPlayerId, count: 1 },
  ];

  return [newState, finalActions];
}

export function fireArtifactPassives(
  state: GameState,
  playerId: 0 | 1
): Action[] {
  const player = state.players[playerId];
  let allActions: Action[] = [];
  for (const artifact of player.artifacts) {
    if (artifact.id && ARTIFACT_PASSIVES[artifact.id]) {
      const actions = ARTIFACT_PASSIVES[artifact.id](state, playerId, artifact);
      allActions = [...allActions, ...actions];
    }
  }
  return allActions;
}

export function applyHeroPower(
  state: GameState,
  playerId: 0 | 1,
  targetId?: string
): [GameState, Action[]] {
  const player = state.players[playerId];
  if (player.heroPowerUsed) return [state, []];

  const heroPower = player.champion.heroPower;
  if (!heroPower) return [state, []];

  let newWillpower = player.willpower;
  let sideEffects: Action[] = [];

  if (player.champion.archetype !== 'Blood Pact') {
    if (player.willpower < heroPower.cost) return [state, []];
    newWillpower -= heroPower.cost;
  }

  const effectId = heroPower.id;
  if (effectId && HERO_POWER_EFFECTS[effectId]) {
    const newState = {
      ...state,
      players: state.players.map((p, i) =>
        i === playerId
          ? {
              ...p,
              willpower: newWillpower,
              heroPowerUsed: true,
            }
          : p
      ) as [typeof state.players[0], typeof state.players[1]],
    };
    sideEffects = HERO_POWER_EFFECTS[effectId](newState, playerId, targetId);
  }

  const finalState = {
    ...state,
    players: state.players.map((p, i) =>
      i === playerId
        ? {
            ...p,
            willpower: newWillpower,
            heroPowerUsed: true,
          }
        : p
    ) as [typeof state.players[0], typeof state.players[1]],
    log: [...state.log, `${player.champion.name} used ${heroPower.name}`],
  };

  return [finalState, sideEffects];
}

export function stunSpirit(
  state: GameState,
  spiritId: string,
  ownerPlayerId: 0 | 1
): GameState {
  const players = state.players.map((p, i) => {
    if (i !== ownerPlayerId) return p;
    return {
      ...p,
      field: p.field.map(s =>
        s.id === spiritId ? { ...s, stunned: true, canAttack: false } : s
      ),
    };
  }) as [typeof state.players[0], typeof state.players[1]];

  return { ...state, players };
}
