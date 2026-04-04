// Game Types
export type SpiritTier = 'Mite' | 'Imp' | 'Foliot' | 'Djinn' | 'Afrit' | 'Marid';
export type CardType = 'Spirit' | 'Incantation' | 'Equipment' | 'Artifact';
export type Archetype = 'Swarm Master' | 'Blood Pact' | 'Binder' | 'Shaman';

export type GamePhase = 'main' | 'battle' | 'end';

export interface ChampionData {
  id: string;
  name: string;
  archetype: Archetype;
  hp: number;
  maxHp: number;
  atk: number;
  heroPower: {
    id: string;
    name: string;
    cost: number;
    description: string;
    requiresTarget?: boolean;
  };
  passive: {
    name: string;
    description: string;
    id: string;
  };
}

export interface CardData {
  id: string;
  name: string;
  type: CardType;
  cost: number;
  tier?: SpiritTier;
  atk?: number;
  hp?: number;
  maxHp?: number;
  text: string;
  keywords?: string[];
  atkBuff?: number;
  hpBuff?: number;
  requiresTarget?: boolean;
  hasBattlecry?: boolean;
  hasDeathrattle?: boolean;
  equipmentId?: string; // for spirits with equipment attached
  summoningSick?: boolean;
  stunned?: boolean;
  canAttack?: boolean;
}

export interface Player {
  id: 0 | 1;
  champion: ChampionData;
  deck: CardData[];
  hand: CardData[];
  field: CardData[];
  artifacts: CardData[];
  willpower: number;
  maxWillpower: number;
  mergeState?: {
    spiritId: string;
    turnsLeft: number;
    atkBonus: number;
  };
  heroPowerUsed: boolean;
}

export interface GameState {
  players: [Player, Player];
  currentPlayer: 0 | 1;
  phase: GamePhase;
  turn: number;
  winner?: 0 | 1;
  log: string[];
  actionLog?: unknown[];
}