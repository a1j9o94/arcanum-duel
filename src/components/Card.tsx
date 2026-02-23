import type { Card as CardType } from '../types';
import './Card.css';

interface CardProps {
  card: CardType;
  inField?: boolean;
  isEnemy?: boolean;
}

const TIER_COLORS: Record<string, string> = {
  Mite: '#8B4513',
  Imp: '#B8860B',
  Foliot: '#4682B4',
  Djinn: '#9370DB',
  Afrit: '#DC143C',
  Marid: '#FFD700',
};

export default function Card({ card, inField }: CardProps) {
  const tierColor = card.tier ? TIER_COLORS[card.tier] : '#555';

  return (
    <div
      className={`card ${inField ? 'in-field' : ''} ${card.summoningSick ? 'summoning-sick' : ''} ${card.stunned ? 'stunned' : ''}`}
      style={{ borderColor: tierColor }}
    >
      {/* Cost Badge */}
      {!inField && (
        <div className="cost-badge" style={{ backgroundColor: tierColor }}>
          {card.cost}
        </div>
      )}

      {/* Name */}
      <div className="card-name">{card.name}</div>

      {/* Tier */}
      {card.tier && (
        <div className="card-tier" style={{ color: tierColor }}>
          {card.tier}
        </div>
      )}

      {/* Stats (for spirits) */}
      {card.type === 'Spirit' && (
        <div className="card-stats">
          <span className="atk">{card.atk}</span>
          <span className="hp">{card.hp}/{card.maxHp}</span>
        </div>
      )}

      {/* Text */}
      <div className="card-text">{card.text}</div>

      {/* Keywords */}
      {card.keywords && card.keywords.length > 0 && (
        <div className="keywords">
          {card.keywords.map((kw, i) => (
            <span key={i} className="keyword">{kw}</span>
          ))}
        </div>
      )}

      {/* Equipment indicator */}
      {card.equipmentId && (
        <div className="equipped-badge">⚔️</div>
      )}

      {/* Status indicators */}
      {card.summoningSick && <div className="status-icon sick">💤</div>}
      {card.stunned && <div className="status-icon stunned">⚡</div>}
    </div>
  );
}
