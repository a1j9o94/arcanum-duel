import type { CardData } from './types';

export type Action =
  | { type: 'PLAY_CARD'; playerId: 0 | 1; cardIndex: number; targetId?: string }
  | { type: 'ATTACK'; attackerId: string; targetId: string }
  | { type: 'CHAMPION_ATTACK'; attackingPlayerId: 0 | 1; targetId: string }
  | { type: 'USE_HERO_POWER'; playerId: 0 | 1; targetId?: string }
  | { type: 'END_TURN' }
  | { type: 'DRAW_CARD'; playerId: 0 | 1; count?: number }
  | { type: 'DEAL_DAMAGE'; targetId: string; targetPlayer: 0 | 1; amount: number; isChampion?: boolean }
  | { type: 'HEAL'; targetId: string; targetPlayer: 0 | 1; amount: number; isChampion?: boolean }
  | { type: 'DESTROY_SPIRIT'; spiritId: string; ownerPlayerId: 0 | 1 }
  | { type: 'SUMMON_TOKEN'; playerId: 0 | 1; card: CardData }
  | { type: 'STUN_SPIRIT'; spiritId: string; ownerPlayerId: 0 | 1 }
  | { type: 'GAIN_WILLPOWER'; playerId: 0 | 1; amount: number }
  | { type: 'INIT_GAME'; playerArchetype: string }
  | { type: 'AI_TURN' };