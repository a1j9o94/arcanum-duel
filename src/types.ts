// Game Types
export type SpiritTier = 'Mite' | 'Imp' | 'Foliot' | 'Djinn' | 'Afrit' | 'Marid';
export type CardType = 'Spirit' | 'Incantation' | 'Equipment' | 'Artifact';
export type Archetype = 'Swarm Master' | 'Blood Pact' | 'Binder' | 'Shaman';

export interface Champion {
  name: string;
  archetype: Archetype;
  hp: number;
  maxHp: number;
  atk: number;
  heroPower: {
    name: string;
    cost: number;
    description: string;
    effect: (game: GameState, playerId: number) => void;
  };
  passive: {
    name: string;
    description: string;
  };
}

export interface Card {
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
  effect?: (game: GameState, playerId: number, targetId?: string) => void;
  deathrattle?: (game: GameState, playerId: number) => void;
  onEquip?: (game: GameState, playerId: number, targetId: string) => void;
  equipmentId?: string; // for spirits with equipment attached
  summoningSick?: boolean;
  stunned?: boolean;
  canAttack?: boolean;
}

export interface Player {
  id: number;
  champion: Champion;
  deck: Card[];
  hand: Card[];
  field: Card[];
  artifacts: Card[];
  willpower: number;
  maxWillpower: number;
  mergeState?: {
    spirit: Card;
    turnsLeft: number;
  };
}

export interface GameState {
  players: [Player, Player];
  currentPlayer: number;
  phase: 'main' | 'battle' | 'end';
  turn: number;
  winner?: number;
  log: string[];
}
