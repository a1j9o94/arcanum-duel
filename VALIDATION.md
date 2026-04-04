# Arcanum Duel — End-to-End Validation Criteria

**Purpose:** Gemma must pass ALL flows below before deployment is considered done.
**Rule:** If the deployed game crashes or gets stuck at any step, the work is NOT done.

---

## Flow 1: Game Start — Archetype Selection
1. User opens the app at the deployed URL
2. Sees DeckSelection screen (4 archetypes: Swarm Master, Blood Pact, Binder, Shaman)
3. Clicks any archetype → GameBoard renders with:
   - Player champion (correct archetype, full HP shown)
   - AI champion (different archetype, full HP shown)
   - Player hand: 4 cards
   - Player willpower: 1/1
   - Turn 1, player goes first
4. No console errors, no crash

## Flow 2: Basic Card Play
1. Player plays a 1-cost Spirit card (e.g. Scuttle Mite) from hand
2. Spirit appears on player's field
3. Spirit starts with summoning sickness (cannot attack this turn)
4. Hand decreases by 1
5. Willpower decreases by 1
6. No crash

## Flow 3: End Turn → AI Turn
1. Player clicks "End Turn"
2. Turn switches to AI
3. AI takes its turn (plays cards, attacks, ends turn automatically)
4. Turn counter increments
5. Willpower refreshes on new turn (player gets 2/2 on turn 2)
6. Player draws 1 card at start of their new turn
7. No crash, no hang (AI must complete its turn within ~5 seconds)

## Flow 4: Attack with Spirit
1. Player has a spirit on field that is NOT summoning sick (survived from previous turn)
2. Player clicks their spirit → it is selected (highlighted)
3. Player clicks an enemy spirit OR enemy champion
4. Combat resolves: damage applied to both sides
5. If either reaches 0 HP: it dies and is removed from the field
6. If a spirit dies with a deathrattle (e.g. Poison Mite), deathrattle fires correctly
7. No crash

## Flow 5: Win Condition — Champion Kill
1. Continue attacking enemy champion until HP reaches 0
2. Game ends immediately (does NOT wait until end of turn)
3. Win/loss screen appears OR a clear game-over state renders
4. "Play Again" or "Return to Menu" button works
5. No crash

## Flow 6: Hero Power Usage
1. Player clicks their champion's hero power
2. Hero power effect fires (each archetype):
   - **Swarm Master**: Summons a 1/1 Spirit token on field
   - **Blood Pact**: Deals damage to own champion (costs HP, not willpower); deals 3 damage to enemy
   - **Binder**: Stuns a target enemy spirit (target select required)
   - **Shaman**: Heals own champion for 4 HP
3. `heroPowerUsed` is set to true; hero power button grays out / disabled for rest of turn
4. Hero power resets at start of next turn

## Flow 7: Incantation (Targeted Spell)
1. Player plays Banishment (targeted destroy) — targets an enemy spirit
2. Target select mode activates (cursor/UI indicates targeting)
3. Player clicks enemy spirit → it is destroyed immediately
4. Player plays Soul Drain → deals 3 damage to target, heals player champion 3 HP
5. No crash, no ghost cards remaining on field

## Flow 8: Equipment Card
1. Player plays an Equipment card
2. Target select prompts for a friendly spirit
3. Player clicks own spirit → spirit gains ATK/HP buff (shown on card)
4. Equipment is tracked on the spirit (equipmentId field set)
5. No crash

## Flow 9: Artifact Card (Passive)
1. Player plays an Artifact card (e.g. Blood Altar, Swarm Totem)
2. Artifact appears in player's artifact zone
3. At end of EACH turn, the artifact's passive effect fires:
   - Blood Altar: 1 damage to enemy champion per turn
   - Swarm Totem: +1/+1 buff to all friendly spirits
4. Effect fires every turn (not just once)
5. No crash

## Flow 10: Draw Exhaustion (Edge Case)
1. Deck runs out of cards
2. Player can no longer draw — no crash, no infinite loop
3. Game continues; hand just stops growing

## Flow 11: AI Plays All 4 Archetypes
1. Start a game as each archetype at least once (or confirm AI gets each archetype randomly)
2. AI takes its turn without hanging for all 4 archetypes
3. AI hero power usage doesn't crash for Blood Pact (HP-cost hero power)

## Flow 12: Full Game to Completion
1. Play a complete game from start to win or loss
2. One champion reaches 0 HP
3. Game correctly identifies winner (player 0 or player 1)
4. Game over state renders with correct winner shown
5. Can return to menu and start a new game without refresh

---

## Technical Validation Checklist (run before deploy)

- [ ] `npx tsc --noEmit` — zero TypeScript errors
- [ ] `npm run build` — clean production build, zero errors
- [ ] No `console.error` or uncaught exceptions in browser during Flows 1–12
- [ ] `checkWinner` is called after EVERY `DEAL_DAMAGE` action (not just end of turn)
- [ ] AI turn completes within 5 seconds for all archetypes
- [ ] `heroPowerUsed` resets to `false` at start of each player's turn
- [ ] Summoning sickness clears at start of the spirit's controller's next turn
- [ ] Stun clears after 1 turn

---

## Definition of Done

**Gemma's task is complete when:**
1. All 12 flows above work in the **deployed Vercel URL** without crashing
2. TypeScript compiles clean
3. Build succeeds
4. Gemma has manually verified flows 1, 4, 5, and 12 by running the dev server and clicking through
