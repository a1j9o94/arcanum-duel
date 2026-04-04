import type { GameState, CardData } from './types';
import type { Action } from './actions';
import { generateCardId } from './cardTemplates';

// ─── Effect Types ────────────────────────────────────────────

export type CardEffect = (state: GameState, playerId: 0 | 1, card: CardData, targetId?: string) => Action[];
export type Deathrattle = (state: GameState, playerId: 0 | 1, card: CardData) => Action[];
export type ArtifactPassive = (state: GameState, playerId: 0 | 1, card: CardData) => Action[];
export type HeroPowerEffect = (state: GameState, playerId: 0 | 1, targetId?: string) => Action[];

// ─── Card Effects ────────────────────────────────────────────

export const CARD_EFFECTS: Record<string, CardEffect> = {
  'banishment': (_state, playerId, _card, targetId) => {
    if (!targetId) return [];
    return [{ type: 'DESTROY_SPIRIT', spiritId: targetId, ownerPlayerId: (1 - playerId) as 0 | 1 }];
  },

  'soul-drain': (_state, playerId, _card, targetId) => {
    if (!targetId) return [];
    return [
      { type: 'DEAL_DAMAGE', targetId, targetPlayer: (1 - playerId) as 0 | 1, amount: 3 },
      { type: 'HEAL', targetId: 'champion', targetPlayer: playerId, amount: 3, isChampion: true },
    ];
  },

  'summoning-ritual': (_state, playerId) => {
    return [{ type: 'DRAW_CARD', playerId, count: 2 }];
  },

  'fire-imp': (_state, playerId, _card, targetId) => {
    if (!targetId) return [];
    return [{ type: 'DEAL_DAMAGE', targetId, targetPlayer: (1 - playerId) as 0 | 1, amount: 1 }];
  },

  'flame-djinn': (_state, playerId, _card, targetId) => {
    if (!targetId) return [];
    return [{ type: 'DEAL_DAMAGE', targetId, targetPlayer: (1 - playerId) as 0 | 1, amount: 3 }];
  },
};

// ─── Deathrattles ────────────────────────────────────────────

export const DEATHRATTLES: Record<string, Deathrattle> = {
  'poison-mite': (_state, playerId) => {
    return [{ type: 'DEAL_DAMAGE', targetId: 'champion', targetPlayer: (1 - playerId) as 0 | 1, amount: 2, isChampion: true }];
  },
};

// ─── Artifact Passives (fired at end of turn) ────────────────

export const ARTIFACT_PASSIVES: Record<string, ArtifactPassive> = {
  'blood-altar': (_state, playerId) => {
    return [
      { type: 'DEAL_DAMAGE', targetId: 'champion', targetPlayer: playerId, amount: 2, isChampion: true },
      { type: 'DRAW_CARD', playerId, count: 1 },
    ];
  },

  'swarm-totem': () => {
    // Passive buff — handled inline in combat resolution, not as actions
    return [];
  },
};

// ─── Hero Power Effects ──────────────────────────────────────

export const HERO_POWER_EFFECTS: Record<string, HeroPowerEffect> = {
  'summon-swarm': (state, playerId) => {
    const player = state.players[playerId];
    const spotsAvailable = 5 - player.field.length;
    if (spotsAvailable <= 0) return [];
    const count = Math.min(2, spotsAvailable);
    const actions: Action[] = [];
    for (let i = 0; i < count; i++) {
      actions.push({
        type: 'SUMMON_TOKEN',
        playerId,
        card: {
          id: generateCardId(),
          name: 'Mite',
          type: 'Spirit',
          tier: 'Mite',
          cost: 0,
          atk: 1,
          hp: 1,
          maxHp: 1,
          text: 'Token',
          summoningSick: true,
          canAttack: false,
          stunned: false,
        },
      });
    }
    return actions;
  },

  'blood-sacrifice': (_state, playerId) => {
    return [
      { type: 'DEAL_DAMAGE', targetId: 'champion', targetPlayer: playerId, amount: 4, isChampion: true },
      { type: 'DRAW_CARD', playerId, count: 2 },
    ];
  },

  'binding-circle': (_state, playerId, targetId) => {
    if (!targetId) return [];
    return [{ type: 'STUN_SPIRIT', spiritId: targetId, ownerPlayerId: (1 - playerId) as 0 | 1 }];
  },

  'spirit-communion': (_state, playerId) => {
    return [
      { type: 'HEAL', targetId: 'champion', targetPlayer: playerId, amount: 4, isChampion: true },
      { type: 'DRAW_CARD', playerId, count: 1 },
    ];
  },
};
