import './DeckSelection.css';

interface DeckSelectionProps {
  onSelect: (archetype: string) => void;
}

const ARCHETYPES = [
  {
    name: 'Swarm Master',
    champion: 'Ezra the Swarmlord',
    description: 'Overwhelm with numbers. Spirits cost 1 less.',
    power: 'Summon two 1/1 Mites',
  },
  {
    name: 'Blood Pact',
    champion: 'Morgath the Bloodbound',
    description: 'Sacrifice HP for power. Pay 2 HP instead of 1 Willpower.',
    power: 'Pay 4 HP: Draw 2 cards',
  },
  {
    name: 'Binder',
    champion: 'Solomon the Wise',
    description: 'Control through binding. Equipment gives +1/+1.',
    power: 'Stun an enemy spirit',
  },
  {
    name: 'Shaman',
    champion: 'Keiko the Spiritwalker',
    description: 'Balance and harmony. Deathrattles trigger twice.',
    power: 'Heal 4 HP and draw a card',
  },
];

export default function DeckSelection({ onSelect }: DeckSelectionProps) {
  return (
    <div className="deck-selection">
      <h1 className="title">ARCANUM DUEL</h1>
      <p className="subtitle">Choose Your Champion</p>

      <div className="archetype-grid">
        {ARCHETYPES.map((arch) => (
          <div
            key={arch.name}
            className="archetype-card"
            onClick={() => onSelect(arch.name)}
          >
            <h2>{arch.champion}</h2>
            <div className="archetype-type">{arch.name}</div>
            <p className="archetype-desc">{arch.description}</p>
            <div className="hero-power">
              <strong>Hero Power:</strong> {arch.power}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
