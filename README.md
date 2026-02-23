# Arcanum Duel

A polished, playable trading card game inspired by the Bartimaeus book series, built as a single-page React app.

**Play Now:** https://arcanum-duel.vercel.app

## About

Arcanum Duel is a strategic card game where you play as a magician summoning spirits to battle. The game features:

- **4 Unique Champions** with distinct playstyles
- **Spirit Hierarchy**: Mites → Imps → Foliots → Djinn → Afrits → Marids
- **Willpower Resource System**: Starts at 2, gains +1 per turn (max 10)
- **Deep Mechanics**: Taunt, Lifesteal, Deathrattle, Stun, Equipment, Artifacts
- **Special Abilities**: Hero Powers, Merge mechanic, Champion self-attack
- **AI Opponent**: Smart threat assessment and card play

## Champions

### Ezra the Swarmlord (Swarm Master)
- Spirits cost 1 less
- Hero Power: Summon two 1/1 Mites
- Strategy: Overwhelm with numbers

### Morgath the Bloodbound (Blood Pact)
- Pay 2 HP instead of 1 Willpower
- Hero Power: Pay 4 HP to draw 2 cards
- Strategy: Sacrifice life for power

### Solomon the Wise (Binder)
- Equipment gives +1/+1
- Hero Power: Stun an enemy spirit
- Strategy: Control through binding

### Keiko the Spiritwalker (Shaman)
- Deathrattles trigger twice
- Hero Power: Heal 4 HP and draw a card
- Strategy: Balance and harmony

## Game Mechanics

- **Deck Size**: 20 cards (10 archetype-specific, 5 neutral, 5 equipment)
- **Starting Hand**: 4 cards, draw 1 per turn
- **Max Field**: 5 spirits
- **Summoning Sickness**: Can't attack the turn summoned
- **Equipment**: Binds to spirits, shatters on spirit death
- **Merge**: Sacrifice a spirit to fuse with champion for 3 turns
- **Win Condition**: Reduce opponent champion HP to 0

## Tech Stack

- React + TypeScript + Vite
- CSS with dark fantasy theme (Nintendo DS / Yu-Gi-Oh style)
- Deployed on Vercel

## Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Inspiration

Inspired by the Bartimaeus Sequence books by Jonathan Stroud, featuring a world where magicians summon and control spirits from the Other Place. This game uses original IP with similar themes of spirit hierarchy and magical duels.
