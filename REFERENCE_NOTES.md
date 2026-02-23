# DuelingNetwork UI Pattern Reference

This document analyzes the DuelingNetwork V2 Client codebase to identify UI patterns we should adopt for Arcanum Duel.

## Repository
- Source: https://github.com/DuelingNetwork/DuelingNetworkV2Client
- Cloned to: `/workspace/group/dueling-network-ref/`

---

## Key UI Patterns to Adopt

### 1. Card Positioning System

**Pattern**: Absolute positioning with CSS classes for zones
- Uses combination of player class (`.p0`, `.p1`) and zone class (`.DECK`, `.HAND`, `.MONSTERZONE`, etc.)
- Each card position defined by specific pixel coordinates
- Opponent's field is rotated 180 degrees for mirror layout

**Example from animation.css:**
```css
.p0.DECK         {bottom : 10px; left: 632px; }
.p0.HAND         {bottom : -50px; left: 124px; }
.p0.MONSTERZONE.i0   {bottom :154px; left:190px;}
.p0.MONSTERZONE.i1   {bottom :154px; left:276px;}
/* ... */

.p1.DECK         {top : 10px; right: 639px; }
.p1.HAND         {top : -50px; right: 124px; }
```

**Why adopt this:**
- Clean separation of layout logic from game logic
- Easy to adjust spacing and positioning
- Supports multiple zones naturally (5 monster zones, 5 spell zones, etc.)

**Adaptation for Arcanum:**
- `.p0` = Player (bottom)
- `.p1` = AI opponent (top, rotated)
- Zones: `.FIELD`, `.HAND`, `.DECK`, `.DISCARD`, `.ARTIFACTS`
- Spirit positions: `.FIELD.i0` through `.FIELD.i4` (max 5 spirits)

---

### 2. Card Interaction Model

**Pattern**: Event delegation with hover and click handlers

**From gui.js:**
```javascript
$('div').on('hover', '.card', function displayCardOptions(cardElement) {
    // user is hovering over a card, display the information about it.
});

$('body').on('click', '.card', function displayCardOptions(cardElement) {
    var x = cardElement.pageX,
        y = cardElement.pageY,
        id = $(this).attr('src').split('/')[2].slice(0, -4),
        location = getLocation(cardElement),
        actions;

    $('#actions').css({
        'top': (y - 33),
        'left': (x - 33),
        'display': 'block'
    });
    // Show available actions for this card
});
```

**Why adopt this:**
- Centralized event handling (works even for dynamically created cards)
- Context menu appears at card position
- Clear separation between display and action logic

**Adaptation for Arcanum:**
- Hover: Show card stats tooltip (attack/defense/abilities)
- Click: Show action menu (Attack, Equip, Use Ability, etc.)
- Menu positioned relative to clicked card
- Filter actions based on game state (can't attack if summoning sick)

---

### 3. Animation System

**Pattern**: CSS transitions for smooth card movement

**From animation.css:**
```css
.card, .overlayunit, .cardselectionzone {
    transform-style: preserve-3d;
    width: 63px;
    height: 86px;
    position: absolute;
    transition: all 500ms;
}

.card.DECK { transition: left 150ms; }
```

**Why adopt this:**
- Smooth visual feedback for all card movements
- CSS handles animation (offloads from JavaScript)
- Configurable timing per action type

**Adaptation for Arcanum:**
- 500ms default transition for card plays
- 150ms for draws from deck
- Add scale/fade effects for destruction
- Glow effect for valid attack targets

---

### 4. Card State Visualization

**Pattern**: CSS transforms for card orientation (face-up/down, attack/defense)

**From animation.css:**
```css
.p0[data-position=FaceDownDefence] {
    transform: rotate(90deg);
    content: url(http://ygopro.us/ygopro/pics/cover.jpg)
}
.p0[data-position=FaceUpDefence] {
    transform: rotate(90deg);
}
.p1[data-position=FaceDownAttack] {
    transform: rotate3d(0,0,1,180deg);
}
```

**Why adopt this:**
- Visual clarity for card states
- No need for multiple image assets
- Smooth rotation animations

**Adaptation for Arcanum:**
- No rotation needed (spirits don't have defense mode)
- Use `data-status` attribute: "summoned", "ready", "stunned", "equipped"
- Dimmed/greyed-out styling for summoning sickness
- Highlight glow for ready-to-attack spirits

---

### 5. Hover Feedback System

**Pattern**: Animated borders and shadows on hover

**From animation.css:**
```css
.cardselectionzone:hover {
    box-shadow: 0 0 0 2px rgba(255,0,0,1);
    animation: 1500ms animateBorder infinite linear;
}

@keyframes animateBorder {
    25% {
        outline-color: white;
        background: rgba(255,0,0,.8);
    }
    100% {
        outline-color: transparent;
        box-shadow: 0 0 0 0px rgba(255,0,0,0);
        outline-offset: 30px;
    }
}
```

**Why adopt this:**
- Clear visual feedback for interactive elements
- Pulsing animation draws attention
- Distinguishes valid targets from invalid ones

**Adaptation for Arcanum:**
- Green glow for valid play targets
- Red glow for valid attack targets
- Blue glow for equipment targets
- Pulse animation for hero power when available

---

### 6. Zone-Based Location System

**Pattern**: Hexadecimal zone identifiers

**From gui.js:**
```javascript
function getLocation(item) {
    if ($(item).hasClass('DECK'))        return 0x01;
    if ($(item).hasClass('HAND'))        return 0x02;
    if ($(item).hasClass('MONSTERZONE')) return 0x04;
    if ($(item).hasClass('SPELLZONE'))   return 0x08;
    if ($(item).hasClass('EXTRA'))       return 0x10;
    if ($(item).hasClass('GRAVE'))       return 0x20;
    if ($(item).hasClass('REMOVED'))     return 0x40;
}
```

**Why adopt this:**
- Fast location checks (bitwise operations)
- Easy to combine zones (e.g., FIELD | HAND)
- Clean game state management

**Adaptation for Arcanum:**
```typescript
enum Zone {
    DECK     = 0x01,
    HAND     = 0x02,
    FIELD    = 0x04,
    ARTIFACTS = 0x08,
    DISCARD  = 0x10,
    CHAMPION = 0x20, // For merge mechanic
}
```

---

### 7. Modal/Alert System

**Pattern**: Fixed overlay with centered modal box

**From main.css:**
```css
.modalContainer {
    position: fixed;
    z-index: 900;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, .5);
    color: white;
    text-align: center;
}

.modalBox {
    width: 25vw;
    margin: 25% auto;
    border: 5px solid white;
    padding: 1vh 1vw;
}
```

**Why adopt this:**
- Clean overlay for game decisions
- Focuses attention on choice
- Semi-transparent backdrop keeps context visible

**Adaptation for Arcanum:**
- Target selection (choose spirit to attack)
- Ability confirmations (pay 4 HP to draw 2?)
- Game over screen with winner
- Turn transition modal ("AI's Turn...")

---

### 8. Card Rendering

**Pattern**: Background images with absolute positioning

**From their approach:**
- Cards are `<img>` elements with class-based positioning
- Card back used for face-down cards
- Image source determined by card ID

**Adaptation for Arcanum:**
```tsx
interface CardProps {
    card: Card;
    zone: Zone;
    index: number;
    player: 0 | 1;
    onClick?: () => void;
}

const CardElement: React.FC<CardProps> = ({ card, zone, index, player, onClick }) => {
    return (
        <div
            className={`card p${player} ${zone} i${index} ${card.status}`}
            data-card-id={card.id}
            data-status={card.status}
            onClick={onClick}
            style={{
                backgroundImage: card.revealed ? `url(/cards/${card.id}.png)` : 'url(/cards/back.png)'
            }}
        >
            {/* Overlay stats/counters */}
        </div>
    );
};
```

---

## Visual Design Recommendations

### Color Scheme (Dark Fantasy)
- Background: Dark green/teal field (like Yu-Gi-Oh mat)
- Card frames: Gold borders with ornate designs
- Player HP: Red meter at top/bottom
- Willpower: Blue/purple crystal icons
- AI turn indicator: Red pulsing glow
- Player turn: Green/gold glow

### Typography
- Card names: Bold serif font (fantasy feel)
- Stats: Clean sans-serif for readability
- HP/Willpower: Large, clear numbers
- Tooltips: Small sans-serif with good contrast

### Card Design
- Size: ~80px x 110px (similar ratio to DuelingNetwork's 63x86)
- Hover: Scale to 1.1x
- Equipped spirits: Glowing golden border
- Stunned spirits: Greyed out with chain icon overlay
- Merged champion: Purple aura effect

---

## Layout Recommendations

```
┌─────────────────────────────────────────────────┐
│ AI HP: ████████░░  Willpower: ●●●○○○○○○○         │
├─────────────────────────────────────────────────┤
│   [DECK]  [DISCARD]  [ARTIFACTS]  [AI HAND: 5]  │
│                                                   │
│   [SPIRIT] [SPIRIT] [SPIRIT] [SPIRIT] [SPIRIT]  │
│   ─────────────── AI FIELD ─────────────────     │
│                                                   │
│   ─────────────── YOUR FIELD ───────────────     │
│   [SPIRIT] [SPIRIT] [SPIRIT] [SPIRIT] [SPIRIT]  │
│                                                   │
│   [YOUR HAND: Card Card Card Card Card]          │
│   [DECK]  [DISCARD]  [ARTIFACTS]                 │
├─────────────────────────────────────────────────┤
│ Your HP: ████████░░  Willpower: ●●●●●○○○○○       │
│ [HERO POWER] [END TURN] [MERGE]                  │
└─────────────────────────────────────────────────┘
```

---

## Implementation Priority

1. **Card positioning system** - Foundation for everything
2. **Hover feedback** - Makes game feel responsive
3. **Animation system** - Smooth transitions
4. **Click handlers** - Core interaction
5. **Modal system** - Target selection, confirmations
6. **Zone system** - Clean game state management
7. **Card state visualization** - Visual clarity
8. **Card rendering optimization** - Performance

---

## Technical Notes

### React Integration
DuelingNetwork uses jQuery, but we're using React. Adaptations:
- Use React state instead of DOM manipulation
- CSS classes still apply (they're framework-agnostic)
- Event handlers via React props instead of jQuery delegation
- Animation system works identically (pure CSS)

### Performance
- Use `transform` for animations (GPU-accelerated)
- Avoid layout thrashing (batch DOM reads/writes)
- Lazy load card images
- Use `will-change` CSS property for animated elements

---

## Next Steps

1. Update `/workspace/group/arcanum-duel/src/App.css` with position classes
2. Create `/workspace/group/arcanum-duel/src/components/Card.tsx` with hover/click handlers
3. Add animation keyframes to CSS
4. Implement zone-based positioning for game board
5. Test with current game implementation
6. Iterate on visual polish (shadows, glows, effects)

---

*Reference created: 2026-02-23*
*DuelingNetwork commit: latest from main branch*
