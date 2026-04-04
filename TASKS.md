# Arcanum Duel — Fix Tasks (Orchestrated)

Each task is a single, scoped fix. Do not fix anything outside the task scope.

---

## TASK-01: Set canAttack=false after spirit attacks

**File:** `src/reducer.ts`
**Problem:** In the `ATTACK` case, after calling `resolveSpiritAttack`, the attacker's `canAttack` flag is never set to `false`. This means a spirit can attack unlimited times per turn.
**Fix:** After the attack actions are resolved (after `actions.reduce(reducer, stateWithLog)`), find the attacker on `state.currentPlayer`'s field in the resulting state and set `canAttack: false` on it.
**Exact location:** `case 'ATTACK':` block in `src/reducer.ts`
**Constraint:** Do not change any other case. Do not change engine files.

---

## TASK-02: Fix AI card index drift

**File:** `src/engine/ai.ts`
**Problem:** The AI iterates over `aiPlayer.hand` and builds `PLAY_CARD` actions with the original array indices. But as the reducer replays these actions, playing card at index 0 removes it from the hand, so all subsequent indices are off by 1 (or more). This causes the AI to try to play the wrong cards.
**Fix:** Instead of using the original `index` from the `map`, the AI should always target index `0` for the first playable card, index `0` again for the next (since the hand shifts after each play), etc. 
Concretely: track a simulated hand as you build the action list. After deciding to play a card, remove it from the simulated hand. Use the index of the card in the CURRENT simulated hand (not the original).
**Exact location:** PHASE 1 loop in `src/engine/ai.ts`
**Constraint:** Do not change anything outside PHASE 1 card play logic.

---

## TASK-03: Fix AI hero power cost check for Blood Pact

**File:** `src/engine/ai.ts`
**Problem:** In PHASE 2, `heroPower.cost <= availableWillpower` will always be false for Blood Pact (whose hero power costs 0 willpower but 4 HP). The AI Blood Pact will never use its hero power.
**Fix:** For Blood Pact (`heroPower.id === 'blood-sacrifice'`), skip the `heroPower.cost <= availableWillpower` check — the cost is paid in HP, not willpower. Only check the HP threshold (`aiPlayer.champion.hp > 5`).
**Exact location:** PHASE 2 in `src/engine/ai.ts` — the `if (!aiPlayer.heroPowerUsed && heroPower.cost <= availableWillpower)` guard.
**Constraint:** Do not change PHASE 1 or PHASE 3.

---

## TASK-04: Summon token with canAttack=true (not summoningSick)

**File:** `src/engine/cards.ts`
**Problem:** In `summonToken`, the token is created with `summoningSick: true, canAttack: false`. Per the architecture spec, tokens summoned by hero powers can act immediately.
**Fix:** Change `summonToken` to set `summoningSick: false, canAttack: true` on the token.
**Exact location:** `summonToken` function in `src/engine/cards.ts`
**Constraint:** Do not change `drawCards` or `prepareCardPlay`.

---

## TASK-05: Fix ATTACK handler to also allow attacking champion directly

**File:** `src/components/GameBoard.tsx`
**Problem:** The UI needs to let the player click the enemy champion as an attack target when a spirit is selected in attack mode. Check that the enemy champion `div` dispatches `{ type: 'ATTACK', attackerId: selectedSpirit, targetId: 'champion' }` when `targetMode === 'attack'`.
**Fix:** In the enemy champion click handler, when `targetMode === 'attack'` and `selectedSpirit !== null`, dispatch `ATTACK` with `targetId: 'champion'`.
**Exact location:** Enemy champion area in `src/components/GameBoard.tsx`
**Constraint:** Do not change the card play or hero power handlers.

---

## TASK-06: Validate and fix GameBoard win state rendering

**File:** `src/components/GameBoard.tsx`
**Problem:** When `state.winner` is set (0 or 1), the game should show a win/loss message instead of the board. Verify this is implemented. If missing, add a check at the top of the render: if `winner !== undefined`, show "You Win!" (winner === 0) or "You Lose" (winner === 1) with a "Play Again" button that calls `onReturn`.
**Fix:** Add or verify the win condition UI block.
**Constraint:** Do not change any game logic or dispatch calls.
