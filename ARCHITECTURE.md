# Arcanum Duel — Architecture Spec (v2)

**Status:** Approved. This doc is the source of truth for the refactor.  
**Goal:** Migrate from a broken mutable-state-with-embedded-functions pattern to a pure reducer architecture. Every mechanic in AUDIT.md should be fixed as a natural consequence of this design.

---

## Core Principle

**GameState is a plain serializable JSON object. It contains no functions, ever.**

All behavior — card effects, hero powers, deathrattles, passives — lives in a separate effects registry keyed by ID. The reducer pattern handles all state transitions. React dispatches actions; it contains no game logic.

---

## Directory Structure

```
src/
  types.ts              — Pure data types only. No functions. No methods.
  actions.ts            — Discriminated union of every possible game action.
  effects.ts            — Registry: cardId/championId → handler functions.
  reducer.ts            — (state, action) => GameState. Single source of truth.
  engine/
    combat.ts           — Attack resolution, damage calculation, death handling.
    cards.ts            — Play card, draw card, discard.
    turn.ts             — End turn, willpower ramp, summoning sickness, stun.
    win.ts              — checkWinner(state): 0 | 1 | undefined
    ai.ts               — AI decision: aiDecide(state): Action[]
  components/
    GameBoard.tsx        — useReducer hook. Dispatches actions. No game logic.
    Card.tsx             — Display only.
    DeckSelection.tsx    — Display only.
  cardData.ts           — Card templates (data only, no effect functions).
  championData.ts       — Champion templates (data only, no effect functions).
  main.tsx
  index.css
```

---

## types.ts — Data Model

All fields are serializable primitives, arrays, or nested objects. **No function fields.**

```typescript
export type SpiritTier = 'Mite' | 'Imp' | 'Foliot' | 'Djinn' | 'Afrit' | 'Marid';
export type CardType = 'Spirit' | 'Incantation' | 'Equipment' | 'Artifact';
export type Archetype = 'Swarm Master' | 'Blood Pact' | 'Binder' | 'Shaman';
export type GamePhase = 'main' | 'battle' | 'end';

export interface CardData {
  id: string;              // unique string id, e.g. "scuttle-mite", "banishment"
  name: string;
  type: CardType;
  cost: number;
  tier?: SpiritTier;
  atk?: number;
  hp?: number;
  maxHp?: number;
  text: string;
  keywords?: string[];
  requiresTarget?: boolean;  // true if playing this card needs a targetId
  hasBattlecry?: boolean;    // true if spirit has a battlecry effect
  hasDeathrattle?: boolean;  // true if spirit has a deathrattle
  atkBuff?: number;          // for equipment
  hpBuff?: number;           // for equipment
  // Runtime state (mutable during game)
  summoningSick?: boolean;
  canAttack?: boolean;
  stunned?: boolean;
  equipmentId?: string;      // id of equipment attached to this spirit
}

export interface HeroPowerData {
  id: string;              // e.g. "summon-swarm", "blood-sacrifice", "binding-circle", "ancestral-heal"
  name: string;
  cost: number;            // willpower cost (0 for Blood Pact — HP cost handled in effects)
  description: string;
  requiresTarget?: boolean; // true if hero power needs an enemy target (Binding Circle)
  usedThisTurn?: boolean;
}

export interface ChampionData {
  id: string;              // e.g. "ezra", "morgath", "solomon", "keiko"
  name: string;
  archetype: Archetype;
  hp: number;
  maxHp: number;
  atk: number;
  heroPower: HeroPowerData;
  passive: {
    id: string;            // e.g. "endless-horde", "blood-pact-passive", "binder-passive", "ancestral-bond"
    name: string;
    description: string;
  };
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
  heroPowerUsed: boolean;    // replaces usedThisTurn on HeroPowerData
  mergeState?: {
    spiritId: string;        // id of spirit merged with champion
    turnsLeft: number;
    atkBonus: number;
  };
}

export interface GameState {
  players: [Player, Player];
  currentPlayer: 0 | 1;
  phase: GamePhase;
  turn: number;
  winner?: 0 | 1;
  log: string[];
  // Action log for replay support (optional but free with this architecture)
  actionLog?: Action[];
}
```

---

## actions.ts — Action Discriminated Union

Every possible game event is a typed action. The reducer handles all of them.

```typescript
import type { CardData } from './types';

export type Action =
  // Player actions
  | { type: 'PLAY_CARD';         playerId: 0 | 1; cardIndex: number; targetId?: string }
  | { type: 'ATTACK';            attackerId: string; targetId: string }
  | { type: 'CHAMPION_ATTACK';   attackingPlayerId: 0 | 1; targetId: string }
  | { type: 'USE_HERO_POWER';    playerId: 0 | 1; targetId?: string }
  | { type: 'END_TURN' }

  // Internal engine actions (dispatched by reducer/ai, not directly by UI)
  | { type: 'DRAW_CARD';         playerId: 0 | 1; count?: number }
  | { type: 'DEAL_DAMAGE';       targetId: string; targetPlayer: 0 | 1; amount: number; isChampion?: boolean }
  | { type: 'HEAL';              targetId: string; targetPlayer: 0 | 1; amount: number; isChampion?: boolean }
  | { type: 'DESTROY_SPIRIT';    spiritId: string; ownerPlayerId: 0 | 1 }
  | { type: 'SUMMON_TOKEN';      playerId: 0 | 1; card: CardData }
  | { type: 'STUN_SPIRIT';       spiritId: string; ownerPlayerId: 0 | 1 }
  | { type: 'GAIN_WILLPOWER';    playerId: 0 | 1; amount: number }

  // Game lifecycle
  | { type: 'INIT_GAME';         playerArchetype: string }
  | { type: 'AI_TURN' }
```

---

## effects.ts — Effects Registry

Maps IDs to handler functions. **This is the only file that contains functions tied to game behavior.**

```typescript
import type { GameState, CardData } from './types';
import type { Action } from './actions';

// Card effect: called when a card is played
export type CardEffect = (state: GameState, playerId: 0 | 1, card: CardData, targetId?: string) => Action[];

// Deathrattle: called when a spirit dies
export type Deathrattle = (state: GameState, playerId: 0 | 1, card: CardData) => Action[];

// Artifact passive: called at end of turn
export type ArtifactPassive = (state: GameState, playerId: 0 | 1, card: CardData) => Action[];

// Hero power effect
export type HeroPowerEffect = (state: GameState, playerId: 0 | 1, targetId?: string) => Action[];

export const CARD_EFFECTS: Record<string, CardEffect> = {
  'banishment':       (state, playerId, _card, targetId) => [...],
  'soul-drain':       (state, playerId, _card, targetId) => [...],
  'summoning-ritual': (state, playerId, _card) => [...],
  'fire-imp':         (state, playerId, _card, targetId) => [...],
  'flame-djinn':      (state, playerId, _card, targetId) => [...],
  // ... all cards with effects
};

export const DEATHRATTLES: Record<string, Deathrattle> = {
  'poison-mite': (state, playerId, card) => [...],
  // ... all deathrattle cards
};

export const ARTIFACT_PASSIVES: Record<string, ArtifactPassive> = {
  'blood-altar':  (state, playerId, card) => [...],
  'swarm-totem':  (state, playerId, card) => [...],
};

export const HERO_POWER_EFFECTS: Record<string, HeroPowerEffect> = {
  'summon-swarm':    (state, playerId) => [...],
  'blood-sacrifice': (state, playerId) => [...],
  'binding-circle':  (state, playerId, targetId) => [...],
  'ancestral-heal':  (state, playerId) => [...],
};
```

Each handler **returns an array of Actions** rather than mutating state directly. The reducer processes them in sequence.

---

## reducer.ts — Single Source of Truth

```typescript
import type { GameState } from './types';
import type { Action } from './actions';

export function reducer(state: GameState, action: Action): GameState {
  // Produce a new state for each action
  // Call engine functions (combat.ts, cards.ts, turn.ts)
  // After any damage action, call checkWinner(newState)
  // Return new state — never mutate
}
```

**Rules:**
- Never mutate `state` directly — always create new objects/arrays (use spread or `structuredClone` for non-function objects only)
- After every `DEAL_DAMAGE` or `DESTROY_SPIRIT` action, call `checkWinner` and set `state.winner` if applicable
- Deathrattles fire inside `DESTROY_SPIRIT` handling — check effects registry, dispatch returned actions
- Shaman double-deathrattle: check `ownerPlayer.champion.passive.id === 'ancestral-bond'` and fire twice

---

## engine/ai.ts — Synchronous AI

```typescript
import type { GameState } from '../types';
import type { Action } from '../actions';

// Returns the full sequence of actions the AI wants to take this turn.
// No side effects. No setTimeout. Pure function.
export function aiDecide(state: GameState): Action[] {
  const actions: Action[] = [];
  // ... greedy card play logic
  // ... hero power logic
  // ... attack logic
  actions.push({ type: 'END_TURN' });
  return actions;
}
```

GameBoard replays these actions with visual delays:

```typescript
// In GameBoard.tsx useEffect for AI turn:
const aiActions = aiDecide(game);
for (const action of aiActions) {
  await delay(400);
  dispatch(action);
}
```

---

## GameBoard.tsx — UI Only

```typescript
const [state, dispatch] = useReducer(reducer, undefined, initGameState);
```

- Reads `state` to render
- Calls `dispatch(action)` on user interaction
- Contains **zero** game logic
- Target selection state (`targetMode`, `selectedCard`) stays in local React state — it's UI state, not game state

---

## cardData.ts / championData.ts — Pure Data

Card and champion templates. **No effect functions.** All effects are in `effects.ts`.

```typescript
// cardData.ts
export const CARD_TEMPLATES: Record<string, Omit<CardData, 'summoningSick' | 'canAttack' | 'stunned'>> = {
  'scuttle-mite': {
    id: 'scuttle-mite',
    name: 'Scuttle Mite',
    type: 'Spirit',
    tier: 'Mite',
    cost: 1,
    atk: 1,
    hp: 2,
    maxHp: 2,
    text: 'A skittering pest from the Other Place.',
  },
  // ...
};
```

Cards in `player.hand`/`player.field` are **instances** created by spreading a template + adding runtime state (`summoningSick: true`, `canAttack: false`).

---

## Key Bugs Fixed By This Architecture

| Bug | Fix |
|-----|-----|
| BUG-01: JSON clone destroys functions | Functions never in state — registry lookup instead |
| BUG-02: AI endTurn never commits | AI is synchronous, returns actions, GameBoard replays with delays |
| BUG-04: Shaman deathrattle fires once | `DESTROY_SPIRIT` handler checks `passive.id === 'ancestral-bond'`, fires twice |
| BUG-05: Merge is dead code | Implement `INIT_MERGE` action or remove cleanly |
| BUG-06: Artifact effects inert | `END_TURN` handler iterates `player.artifacts`, fires `ARTIFACT_PASSIVES[card.id]` |
| BUG-07: Blood Pact cost mismatch | Explicit partial willpower conversion in `USE_HERO_POWER` handler |
| BUG-08: Win only checked at end of turn | `checkWinner` called after every `DEAL_DAMAGE` in reducer |
| BUG-10: Battlecry target never passed | `requiresTarget: true` on card → UI prompts before dispatching `PLAY_CARD` |
| BUG-11: AI Blood Pact always uses hero power | `aiDecide` checks HP threshold before adding `USE_HERO_POWER` action |

---

## Implementation Order

Build and verify each step before moving to the next. Each step should be independently testable.

1. **`types.ts`** — new data model, no functions
2. **`actions.ts`** — full action union
3. **`cardData.ts` + `championData.ts`** — pure data only, assign stable `id` fields to all cards/champions
4. **`effects.ts`** — effects registry (port existing logic)
5. **`engine/win.ts`** — `checkWinner`
6. **`engine/combat.ts`** — attack resolution, damage
7. **`engine/cards.ts`** — play card, draw, deck management
8. **`engine/turn.ts`** — end turn, willpower, summoning sickness, artifact passives
9. **`engine/ai.ts`** — synchronous AI decision function
10. **`reducer.ts`** — wire everything together
11. **`GameBoard.tsx`** — replace all `setGame` with `dispatch`, add AI replay loop

---

## Invariants (Never Break These)

- `GameState` contains no function fields — ever
- The reducer is a pure function: same input always produces same output
- `effects.ts` is the only file that holds behavior logic tied to specific card/champion IDs
- React components dispatch actions — they never mutate state directly
- `checkWinner` is called inside the reducer after every damage event

---

*Spec written: 2026-04-03. Do not start coding until this doc is reviewed.*
