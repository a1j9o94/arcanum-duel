# Arcanum Duel — Game Audit Report
**Date:** 2026-04-03  
**Auditor:** Collie (sub-agent)  
**Scope:** Full code audit — types, game logic, card data, UI component  

---

## Step 1: Visual Inspection

**Dev server:** Running at `http://localhost:5174` (port 5173 was already in use).

**Champion selection screen:** Renders correctly. All four champions (Ezra the Swarmlord, Morgath the Bloodbound, Solomon the Wise, Keiko the Spiritwalker) display with proper hero power descriptions. UI is polished — dark fantasy purple/gold theme looks great.

**Game board (Swarm Master selected, Turn 1):**
- AI opponent (Morgath the Bloodbound) shown at top with HP bar
- Player champion (Ezra) shown in lower section with "Summon Swarm" and "Self-Attack" buttons
- Hand renders with 4 cards: Banishment, Iron Armor, Flame Whip, Scuttle Mite
- Log shows: "Game started!", "You are Ezra the Swarmlord", "AI is Morgath the Bloodbound"
- Turn 1 | Your Turn | MAIN phase shown correctly

**Hero Power click:** Clicking "Summon Swarm" immediately causes a **white screen / React crash**. Confirmed live.

---

## Step 2: Full Game Round Simulation

### 2.1 — `initGame('Swarm Master')` trace

1. `CHAMPIONS.swarmMaster` is retrieved and **deep-cloned via `JSON.parse(JSON.stringify(...))`**
   - ⚠️ **FATAL:** This strips the `heroPower.effect` function. The cloned champion has `heroPower.effect === undefined`.
2. `buildDeck('Swarm Master')` creates 20 cards (10 archetype + 5 incantations + 5 equipment), shuffled.
3. Player starts with `hand = deck.slice(0, 4)`, `deck = deck.slice(4)`.
4. Both players start with `willpower: 2, maxWillpower: 2`.
5. Returns a valid `GameState` — **except all champion `heroPower.effect` functions are undefined**.

### 2.2 — Playing Scuttle Mite (cost 1)

1. `canPlayCard(game, 0, scuttleMite)`:
   - Archetype is 'Swarm Master', card is 'Spirit': `return willpower >= Math.max(0, 1 - 1)` → `return 2 >= 0` → `true` ✓
2. `playCard(game, 0, cardIndex)`:
   - `actualCost = Math.max(0, 1 - 1) = 0` (free! Swarm Master discount) ✓
   - Willpower stays at 2
   - Card removed from hand, pushed to `player.field` with `summoningSick: true, canAttack: false`
   - No battlecry for Scuttle Mite ✓
3. State looks correct.

**Potential issue:** The card objects in hand were NOT deep-cloned during `initGame` — they're the same objects from `buildDeck`. But GameBoard does `JSON.parse(JSON.stringify(prev))` before every `playCard` call, which strips `card.effect` and `card.deathrattle` functions from **all cards in hand and field**. This means Banishment, Soul Drain, and Poison Mite's deathrattle are all broken after the first state update.

### 2.3 — Hero Power: "Summon Swarm" (cost 2)

1. `handleHeroPower()` in GameBoard.tsx:
   - `currentPlayer.champion.heroPower.name` is checked: it's NOT 'Binding Circle'
   - Falls through to: `setGame(prev => { const newGame = JSON.parse(JSON.stringify(prev)); useHeroPower(newGame, 0); return newGame; })`
2. `useHeroPower(game, 0)`:
   - `heroPower.cost = 2`, `player.willpower = 2` → cost check passes
   - `player.willpower -= 2` → willpower = 0
   - `heroPower.name` is NOT 'Binding Circle' → falls to `else` branch
   - **`heroPower.effect(game, playerId)`** — **`heroPower.effect` is `undefined`** (stripped by JSON clone in `initGame`)
   - **`TypeError: heroPower.effect is not a function`** → React error boundary → WHITE SCREEN 💥

### 2.4 — Attacking with a spirit

1. After summoning Scuttle Mite on Turn 1, `spirit.summoningSick = true, spirit.canAttack = false`
2. Click on Scuttle Mite: `handleSpiritClick(spiritId, false)`:
   - `spirit.canAttack` is `false` → `setSelectedSpirit` never called → no action ✓
3. After `endTurn()`:
   - Player's spirits: `summoningSick = false`, `canAttack = true`
   - BUT: `endTurn()` also clears summoning sickness for the NEW player's existing spirits at start (double clear — see bug list)
4. On Turn 2, clicking Scuttle Mite: `canAttack = true, stunned = false` → enters attack mode ✓
5. `attackWithSpirit(game, attackerId, targetId)` — works correctly for basic combat ✓

### 2.5 — Ending the turn (AI takes over)

1. `handleEndTurn()` calls `endTurn(game)`:
   - Removes summoning sickness from player's spirits
   - Switches `game.currentPlayer` to 1
   - AI maxWillpower goes from 2 → 3, willpower = 3
   - Draws 1 card for AI
2. `useEffect` in GameBoard detects `game.currentPlayer === 1`:
   - Sets `isAiTurn = true`
   - After 1000ms: deep-clones state, calls `aiTurn(newGame)`
3. `aiTurn()` in gameLogic.ts:
   - Sorts hand by cost, plays greedily
   - **CRITICAL:** AI also calls `useHeroPower(game, 1)` — same crash if AI is Swarm Master, Shaman, or Binder (Blood Pact hero power is handled separately but still crashes because `heroPower.effect` is undefined after clone)
   - `endTurn()` called inside `setTimeout` at the END of aiTurn — **double setTimeout**: outer (1000ms from GameBoard) + inner (500ms from aiTurn). The inner setTimeout runs but the state is already the cloned `newGame` local variable. **The inner setTimeout's `endTurn(game)` mutates the local clone but that mutation is NEVER committed back to React state.** AI turn ends without actually calling endTurn in state.

---

## Step 3: White Screen Bug — Root Cause

### The Bug

**File:** `src/gameLogic.ts` — `useHeroPower()`, line 249:
```typescript
heroPower.effect(game, playerId);
```

**File:** `src/gameLogic.ts` — `initGame()`, lines 8–9:
```typescript
const playerChampion = JSON.parse(JSON.stringify(
  playerArchetype === 'Swarm Master' ? CHAMPIONS.swarmMaster : ...
));
```

**Root cause:** `JSON.parse(JSON.stringify(...))` strips all functions from objects. The champion's `heroPower.effect` function is a closure defined in `CHAMPIONS.swarmMaster` (and all other champions). After the JSON round-trip, `heroPower.effect` is `undefined`. When `useHeroPower` calls it, it throws `TypeError: heroPower.effect is not a function`.

**This crash affects ALL four champions' hero powers**, not just Swarm Master.

### Secondary (Systemic) Root Cause

The same `JSON.parse(JSON.stringify(prev))` pattern is used in **every single state update in GameBoard.tsx** (10 occurrences). This means:
- `card.effect` (Banishment, Soul Drain, Summoning Ritual) → stripped after first state update
- `card.deathrattle` (Poison Mite) → stripped
- `card.onEquip` → stripped (unused but defined in types)
- `champion.heroPower.effect` → stripped at init

The game is **fundamentally broken for any mechanic that relies on function references** stored in game state.

### Blood Pact Hero Power Check

`useHeroPower()` for Blood Pact (lines 232-234):
```typescript
if (player.champion.archetype === 'Blood Pact' && heroPower.name === 'Blood Sacrifice') {
  if (player.champion.hp <= 4) return false;
}
```
No willpower deduction (correct — cost is 0). BUT it still falls through to `heroPower.effect(game, playerId)` at line 249, which is still `undefined`. **Blood Pact crashes too.**

### Solomon the Wise (Binding Circle) Hero Power Check

In `GameBoard.tsx` `handleHeroPower()` (line 129):
```typescript
if (currentPlayer.champion.heroPower.name === 'Binding Circle') {
  setTargetMode('heropower');
} else { ... }
```
This correctly avoids calling `useHeroPower` immediately and waits for target selection. But when the target is selected and `handleTargetSelect` calls `useHeroPower(newGame, game.currentPlayer, targetId)`, the logic in `useHeroPower` for Binding Circle (lines 241-247) directly manipulates the target without calling `heroPower.effect` — **this is actually correct** and would NOT crash. However, the willpower deduction and pre-check happen correctly only because they don't touch `heroPower.effect`.

**Solomon the Wise hero power is the ONLY one that would survive** — but it still won't work because `heroPower.cost` check (line 235) uses `heroPower.cost = 3`, but the `disabled` button check in GameBoard.tsx (line 225) also checks `currentPlayer.willpower < currentPlayer.champion.heroPower.cost`. This works correctly for Binder.

---

## Step 4: Full Bug Sweep

### BUG-01 — JSON Clone Destroys All Game Functions (SYSTEMIC)
**Severity: P0 — Crashes everything**

Every `setGame(prev => { const newGame = JSON.parse(JSON.stringify(prev)); ... })` call strips:
- `champion.heroPower.effect` — all 4 heroes
- `card.effect` — Banishment, Soul Drain, Summoning Ritual
- `card.deathrattle` — Poison Mite
- `card.deathrattle` — any future deathrattle cards

Fix: Don't store functions in game state. Use a lookup table (card name → effect function) and resolve at runtime. OR keep the original CHAMPIONS and card templates as a separate module-level registry and never JSON-clone them — only clone the data portions (hp, atk, hand, field arrays).

---

### BUG-02 — AI's `endTurn` Never Commits to React State
**Severity: P0 — Game softlocks on AI turn**

In `gameLogic.ts`, `aiTurn()` ends with:
```typescript
setTimeout(() => {
  endTurn(game);  // mutates local clone, never returned to React
}, 500);
```

In `GameBoard.tsx`, the AI turn is:
```typescript
setTimeout(() => {
  setGame(prev => {
    const newGame = JSON.parse(JSON.stringify(prev));
    aiTurn(newGame);  // aiTurn calls setTimeout inside — runs after React has already returned newGame
    return newGame;
  });
  setIsAiTurn(false);
}, 1000);
```

`aiTurn`'s inner `setTimeout` fires 500ms later, but by then `newGame` has already been committed to React state. The `endTurn(game)` call mutates the local `newGame` variable that is no longer connected to React state. **Turn never switches back to player.**

Fix: Remove the `setTimeout` from inside `aiTurn`. Make `aiTurn` synchronous. Handle the delay entirely in `GameBoard.tsx`.

---

### BUG-03 — Incantation Cards Require Target But UI Only Handles Two by Name
**Severity: P1 — Incantations silently fail**

In `handlePlayCard` (GameBoard.tsx line 43-44):
```typescript
if (card.type === 'Incantation' && (card.name === 'Banishment' || card.name === 'Soul Drain')) {
  setSelectedCard(cardIndex);
  setTargetMode('spell');
```
`Summoning Ritual` (draw 2) falls through to the else branch and plays immediately — this is correct behavior.

BUT: Any new incantation card added in the future that targets an enemy and doesn't match these exact names will play without prompting for a target. The target-checking is fragile string-matching. Should be `card.requiresTarget` boolean flag.

Also: Soul Drain targets an **enemy spirit** (deals damage + heals). But in `dealDamage()` in cardData.ts, it always targets `opponent.field` (1 - playerId side). This is correct as written, but the UI `handleTargetSelect` for `targetMode === 'spell'` only allows `isEnemy === true` targets, so player can't accidentally target their own spirits. Correct.

---

### BUG-04 — Shaman Deathrattle Double-Trigger Not Implemented
**Severity: P1 — Passive ability completely missing**

Keiko the Spiritwalker's passive:
```
Ancestral Bond: Deathrattles trigger twice
```

In `destroySpirit()` (cardData.ts lines 19-27):
```typescript
if (spirit.deathrattle) {
  spirit.deathrattle(game, playerId);  // triggers ONCE
}
player.field.splice(spiritIndex, 1);
```

No check for the owner's archetype. Deathrattles **always fire once** regardless of champion. Shaman passive is entirely unimplemented.

Fix: Pass the player context into `destroySpirit`, check if owner is Shaman, call deathrattle twice.

---

### BUG-05 — Merge Mechanic Not Implemented End-to-End
**Severity: P1 — Feature mentioned in types but no path to activate it**

`Player.mergeState` is defined in types.ts:
```typescript
mergeState?: {
  spirit: Card;
  turnsLeft: number;
};
```

And `endTurn()` decrements `turnsLeft` and removes ATK buff when it expires (lines 291-298). But:
- **There is no card, hero power, or UI button that initiates a merge.**
- No `initMerge()` function exists.
- No UI to trigger or display merge state.
- The REFERENCE_NOTES.md mentions a "Merge" mechanic for the champion as a future layout element.

The merge teardown logic in `endTurn` will never execute because `mergeState` is never set. Dead code.

---

### BUG-06 — Artifact Effects Not Implemented
**Severity: P1 — Artifacts do nothing**

Two artifacts are defined:
- `Blood Altar`: "At end of turn, pay 2 HP to draw a card"
- `Swarm Totem`: "Your Mites have +1/+1"

In `playCard()`, artifacts are pushed to `player.artifacts` array (line 141) and that's it. Neither effect is implemented anywhere:
- `endTurn()` has no code to check player artifacts.
- No passive scan of `player.artifacts` anywhere.
- AI never plays artifacts (only handles Spirit, Incantation, Equipment in `aiTurn()`).

Artifacts are in the deck but are completely inert.

---

### BUG-07 — Blood Pact `canPlayCard` Logic Has Edge Case
**Severity: P1 — Can play unaffordable cards**

In `canPlayCard()`:
```typescript
if (player.champion.archetype === 'Blood Pact') {
  const hpCost = card.cost * 2;
  return player.willpower >= card.cost || player.champion.hp > hpCost;
}
```

Then in `playCard()`:
```typescript
if (player.champion.archetype === 'Blood Pact' && player.willpower < actualCost) {
  const hpCost = actualCost * 2;
  player.champion.hp -= hpCost;
```

**Edge case:** If Blood Pact player has 1 willpower and a 3-cost card, `canPlayCard` returns `true` (because `hp > 6`). But in `playCard`, `player.willpower < 3` → pays HP: `player.champion.hp -= 6`. This is correct.

**BUT:** What if both willpower AND HP are used? The check `player.willpower < actualCost` means "if we can't pay in full willpower." But what if player has 2 willpower and a 3-cost card? willpower is not enough (2 < 3), so it falls to HP payment and charges 6 HP instead of 2 HP for the missing 1 willpower. The design says "Pay 2 HP instead of 1 Willpower" but the implementation charges `cost * 2` HP regardless of how much willpower the player has.

This is a **logic mismatch**: the passive description implies a partial conversion (each missing willpower costs 2 HP), but the implementation charges the entire HP cost (`actualCost * 2`) whenever willpower is insufficient.

---

### BUG-08 — Win Condition Only Checked at End of Turn
**Severity: P1 — Champion can go to 0 HP mid-turn with no game-over**

`checkWin` equivalent is only in `endTurn()` (lines 300-307). If a champion dies mid-combat:
- During player's attack on AI's champion → `opponent.champion.hp` goes to 0 → no `game.winner` is set
- Player can keep attacking the dead champion, keep ending turns
- The game continues indefinitely until the dead champion is the active player and hits end of turn

Fix: Check `game.winner` in `attackWithSpirit()` after dealing champion damage, and in `playCard()` / any card effect that deals damage.

---

### BUG-09 — `endTurn` Double-Clears Summoning Sickness
**Severity: P2 — Harmless but wrong logic**

In `endTurn()` (lines 265-275):
```typescript
// 1. Clear summoning sickness for the player whose turn just ENDED
player.field.forEach(spirit => {
  spirit.summoningSick = false;
  spirit.canAttack = true;
  if (spirit.stunned) { spirit.stunned = false; spirit.canAttack = false; }
});

// [switch player]
// [increment willpower, draw card]

// 2. Clear summoning sickness AGAIN for the new player (same player!)
newPlayer.field.forEach(spirit => {
  spirit.summoningSick = false;
  spirit.canAttack = true;
});
```

Since `newPlayer = game.players[game.currentPlayer]` (after the switch), block 1 clears sickness for the old player, and block 2 clears it for the new player. These are different players, so this isn't a double-clear per se. BUT: block 1 is clearing sickness for the old player's spirits, meaning when it's the old player's turn again, their spirits will already be `canAttack = true` even if they were just summoned. The intent seems to be that spirits get `canAttack = true` at the **start of their next turn** — that should only be block 2. Block 1 is unnecessary and potentially incorrect (it also interferes with stunned logic — stunned spirits should remain `canAttack = false` for the new player's turn, but block 1 resets the old player's stunned state which nobody cares about).

---

### BUG-10 — Fire Imp and Flame Djinn Battlecries Need Enemy Target But UI Doesn't Prompt
**Severity: P2 — Battlecry effects silently skipped**

In `playCard()`:
```typescript
if (card.name === 'Fire Imp' && targetId) {
  dealDamage(game, playerId, targetId, 1);
} else if (card.name === 'Flame Djinn' && targetId) {
  dealDamage(game, playerId, targetId, 3);
}
```

In `handlePlayCard()` in GameBoard.tsx, Spirit cards that aren't Incantation/Equipment are played immediately without prompting for a target:
```typescript
} else {
  setGame(prev => {
    const newGame = JSON.parse(JSON.stringify(prev));
    playCard(newGame, game.currentPlayer, cardIndex);  // no targetId
    return newGame;
  });
}
```

Fire Imp and Flame Djinn will always play without their battlecry firing. The `targetId` is never passed for Spirit cards.

---

### BUG-11 — AI Never Uses Hero Power If Blood Pact (Cost Mismatch)
**Severity: P2 — AI Blood Pact passive useless**

In `aiTurn()`:
```typescript
if (aiPlayer.willpower >= aiPlayer.champion.heroPower.cost) {
  // ...
  useHeroPower(game, 1);
}
```

Blood Pact's `heroPower.cost = 0`. So `aiPlayer.willpower >= 0` is always true. But `useHeroPower` for Blood Pact checks `if (player.champion.hp <= 4) return false`. So the AI will always try to use Blood Sacrifice, which will crash (BUG-01) or silently fail if fixed but HP is low. The cost check is misleading — AI would use Blood Sacrifice every turn even at low HP.

---

### BUG-12 — `championSelfAttack` Has No Restrictions and No Win Check
**Severity: P2 — Design issue**

`handleChampionAttack()` in GameBoard.tsx can be clicked at any time on player's turn (no cooldown, no willpower cost). Champion self-attack deals `champion.atk` to opponent and `opponent.atk` back to self. This can trivially kill the player's own champion (Ezra has 1 ATK, AI has 2 ATK, so player takes 2 and AI takes 1). Also no win check after the attack.

---

### BUG-13 — Mite Tokens from Hero Power Have No `canAttack` Field
**Severity: P2 — Mites may not be attackable**

In `swarmMaster.heroPower.effect`:
```typescript
player.field.push({
  id: `mite-${Date.now()}-${i}`,
  name: 'Mite',
  type: 'Spirit',
  tier: 'Mite',
  cost: 0,
  atk: 1,
  hp: 1,
  maxHp: 1,
  text: 'Token',
  summoningSick: true,
  // canAttack: false  ← MISSING
});
```

`canAttack` defaults to `undefined`. In `attackWithSpirit()`: `if (!attacker || !attacker.canAttack || attacker.stunned)` — `undefined` is falsy, so the check `!attacker.canAttack` evaluates to `true`, blocking attacks. Mite tokens cannot attack even after summoning sickness wears off (since `endTurn` sets `canAttack = true`, this is eventually fixed — but only because endTurn explicitly sets it).

Actually on second look, `endTurn` does `spirit.canAttack = true` for all spirits on the new player's turn start — so after a turn passes, Mites will be attackable. But on the turn they were summoned, `!attacker.canAttack` is `true` (since it's `undefined`) which blocks attacks correctly. This works by accident.

---

### BUG-14 — Hand Size Not Capped / Deck Empty Not Handled
**Severity: P2 — Edge case crash potential**

`drawCard()` checks `player.deck.length > 0` and silently does nothing if deck is empty — no fatigue damage, no notification. Games could stall with empty decks and no fatigue.

Hand size is never capped. With Blood Sacrifice (draw 2) and Summoning Ritual (draw 2) available every turn, hand can grow arbitrarily large.

---

### BUG-15 — `Summon Swarm` Mite IDs Collide When Called Rapidly
**Severity: P3 — Minor**

```typescript
id: `mite-${Date.now()}-${i}`
```

If hero power is somehow called twice in the same millisecond (e.g., AI plays it), both Mites get the same ID. The `-${i}` suffix prevents collision within a single call (i=0 and i=1), but two separate calls at the same millisecond would produce `mite-X-0` and `mite-X-1` twice. Should use a proper `generateCardId()` counter like all other cards.

---

### BUG-16 — Opponent Hand Count Not Shown
**Severity: P3 — UX**

The opponent's hand count is not displayed. Player has no information about how many cards the AI is holding. Standard TCG design.

---

### BUG-17 — No Discard Pile / Graveyard UI
**Severity: P3 — UX**

Destroyed spirits and spent incantations disappear with no graveyard zone. REFERENCE_NOTES.md already calls this out.

---

### BUG-18 — `disabled` Check for Hero Power Button Uses Raw `heroPower.cost` (Wrong for Blood Pact)
**Severity: P3 — UX**

In GameBoard.tsx line 225:
```typescript
disabled={game.currentPlayer !== 0 || currentPlayer.willpower < currentPlayer.champion.heroPower.cost}
```

Blood Pact's `heroPower.cost = 0`, so the button is never disabled by willpower. The proper check would be "has enough HP (> 4)" but that's not checked. The button shows as enabled even when Blood Pact has only 4 HP left (and would fail the HP check inside `useHeroPower`).

---

## Step 5: Prioritized Bug List

### P0 — Crashes / White Screens

| # | Bug | File | Line(s) |
|---|-----|------|---------|
| BUG-01 | **JSON clone destroys all function references** — `heroPower.effect` is `undefined` after `JSON.parse(JSON.stringify(...))` in `initGame`. Calling it throws `TypeError` → white screen on any hero power use. Same issue affects `card.effect` and `card.deathrattle` after any state update. | `src/gameLogic.ts` | 8-9, 249 |
| BUG-02 | **AI `endTurn()` never commits to React state** — `aiTurn()` calls `setTimeout(() => endTurn(game), 500)` inside a state updater function. The `endTurn` runs on a stale local clone. Turn never switches back to player. Game softlocks. | `src/gameLogic.ts` | 382-384; `src/components/GameBoard.tsx` | 28-34 |

### P1 — Broken Mechanics

| # | Bug | What's Wrong | What It Should Do |
|---|-----|--------------|-------------------|
| BUG-04 | **Shaman deathrattle double-trigger missing** | `destroySpirit()` always fires deathrattle once. No archetype check. | Check if owner is Shaman → fire deathrattle twice. |
| BUG-05 | **Merge mechanic dead code** | `mergeState` in types and teardown in `endTurn`, but no way to initiate a merge. | Implement `initMerge()` + UI button, or remove the dead code. |
| BUG-06 | **Artifact effects not implemented** | Blood Altar and Swarm Totem do nothing when played. | Implement end-of-turn triggers for artifacts; scan `player.artifacts` in `endTurn()` and during passive checks. |
| BUG-07 | **Blood Pact HP cost logic mismatch** | Charges full `cost × 2` HP even when player has partial willpower. Passive says "2 HP per 1 willpower." | Charge only `missingWillpower × 2` HP, spend remaining willpower normally. |
| BUG-08 | **Win condition only checked at end of turn** | Champion can die mid-combat with no game-over. | Call a `checkWinner(game)` helper after every damage event in `attackWithSpirit`, `playCard` effects, etc. |
| BUG-10 | **Fire Imp and Flame Djinn battlecries silently skip** | UI plays Spirit cards without asking for a target; `targetId` never passed. | Add `requiresTarget: boolean` flag to cards; prompt for target before playing battlecry spirits. |
| BUG-11 | **AI Blood Pact always tries hero power** | `aiPlayer.willpower >= 0` always true; AI uses Blood Sacrifice every turn without HP check. | Add proper Blood Pact HP check in AI logic before using hero power. |

### P2 — Incomplete Features

| # | Feature | Current State | What's Needed |
|---|---------|---------------|---------------|
| BUG-09 | Summoning sickness / stun logic in `endTurn` | Block 1 unnecessarily clears old player's spirit states. Minor but confusing. | Remove block 1 (clearing old player's spirits); only clear/set for new player at turn start. |
| BUG-12 | Champion self-attack | No cooldown, no willpower cost, no win check, no clear design intent. | Add once-per-turn flag or remove the button; add win check after damage. |
| BUG-13 | Mite tokens missing `canAttack: false` | Works by coincidence (falsy `undefined`). | Explicitly set `canAttack: false` on all summoned tokens. |
| BUG-14 | Empty deck / hand size | No fatigue damage on empty deck; no hand size cap. | Add fatigue (1 damage per draw on empty deck), cap hand at 10. |
| BUG-15 | Mite ID collision risk | `Date.now()` based IDs could collide under rapid calls. | Use `generateCardId()` (counter-based) for token creation. |

### P3 — Polish / UX

| # | Issue | Impact |
|---|-------|--------|
| BUG-16 | Opponent hand count not shown | Player has zero information on AI card count. Standard TCG info. |
| BUG-17 | No graveyard / discard pile | Destroyed cards vanish. Players can't track what's been played. REFERENCE_NOTES already calls this out. |
| BUG-18 | Hero Power button disabled check wrong for Blood Pact | Blood Pact button never grays out even at dangerous HP. |
| — | No card animations | REFERENCE_NOTES has full animation spec. Cards just appear/disappear. |
| — | No visual distinction for stunned vs. summoning-sick spirits | Both show icons but no strong visual language (color, overlay). |
| — | `Incantation` target UI: hardcoded name strings | Fragile — any new incantation card needs a code change in GameBoard.tsx. Should use `card.requiresTarget` flag. |
| — | AI thinking delay feels wrong | AI plays instantly then waits 1000ms. Should show "AI is thinking..." then play card-by-card with delays. |
| — | Port conflict on startup | Dev server on 5174 instead of 5173 because 5173 was still occupied. Minor dev experience issue. |

---

## Fix Priority Order

1. **BUG-01 (P0):** Refactor state management to not store functions in game state. Use a card/champion registry pattern. This is the foundational fix — everything else depends on it.
2. **BUG-02 (P0):** Make `aiTurn()` synchronous; remove its internal `setTimeout`. Move delay handling entirely to GameBoard's `useEffect`.
3. **BUG-08 (P1):** Add `checkWinner()` helper called after every damage event.
4. **BUG-10 (P1):** Add `requiresTarget` flag to cards; update `handlePlayCard` to prompt for target.
5. **BUG-06 (P1):** Implement artifact passive effects in `endTurn` and passive scans.
6. **BUG-04 (P1):** Implement Shaman double-deathrattle in `destroySpirit`.
7. **BUG-07 (P1):** Fix Blood Pact cost calculation to partial willpower conversion.
8. **BUG-05 (P1):** Either implement Merge fully or remove dead code.
9. **BUG-11 (P2) + BUG-12 (P2):** Fix AI hero power logic; fix self-attack restrictions.
10. **P3 items:** UI polish, animations, graveyard.

---

*Audit complete. No code was written — this is a read-only analysis.*
