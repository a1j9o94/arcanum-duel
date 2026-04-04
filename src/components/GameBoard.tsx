import { useReducer, useState, useEffect, useMemo } from 'react';
import { reducer } from '../reducer';
import { initGameState } from '../init';
import { aiDecide } from '../engine/ai';
import CardComponent from './Card';
import './GameBoard.css';

interface GameBoardProps {
  archetype: string;
  onReturn: () => void;
}

type TargetMode = 'none' | 'spell' | 'equipment' | 'attack' | 'heropower';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export default function GameBoard({ archetype, onReturn }: GameBoardProps) {
  const [state, dispatch] = useReducer(reducer, archetype, initGameState);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [selectedSpirit, setSelectedSpirit] = useState<string | null>(null);
  const [targetMode, setTargetMode] = useState<TargetMode>('none');
  const [isAiTurn, setIsAiTurn] = useState(false);

  const { players, currentPlayer, winner, turn, phase, log } = state;
  const player = players[0];
  const opponent = players[1];

  useEffect(() => {
    if (currentPlayer === 1 && !winner && !isAiTurn) {
      const runAiTurn = async () => {
        setIsAiTurn(true);
        await delay(500);
        const actions = aiDecide(state);
        for (const action of actions) {
          dispatch(action);
          await delay(400);
        }
        setIsAiTurn(false);
      };
      runAiTurn();
    }
  }, [currentPlayer, winner, isAiTurn, state]);

  const canPlayCard = useMemo(() => {
    return (cardIndex: number) => {
      const card = player.hand[cardIndex];
      if (!card) return false;
      if(player.champion.archetype === 'Blood Pact') {
          return player.willpower >= card.cost || player.champion.hp > (card.cost - player.willpower) * 2
      }
      return player.willpower >= card.cost;
    }
  }, [player.willpower, player.hand, player.champion]);

  const handlePlayCard = (cardIndex: number) => {
    if (!canPlayCard(cardIndex)) return;
    const card = player.hand[cardIndex];
    if (card.requiresTarget) {
      setSelectedCard(cardIndex);
      setTargetMode(card.type === 'Equipment' ? 'equipment' : 'spell');
    } else {
      dispatch({ type: 'PLAY_CARD', playerId: 0, cardIndex });
    }
  };

  const handleTargetSelect = (targetId: string) => {
    if (selectedCard !== null) {
      dispatch({ type: 'PLAY_CARD', playerId: 0, cardIndex: selectedCard, targetId });
    } else if (selectedSpirit !== null) {
      dispatch({ type: 'ATTACK', attackerId: selectedSpirit, targetId });
    } else if (targetMode === 'heropower') {
      dispatch({ type: 'USE_HERO_POWER', playerId: 0, targetId });
    }
    cancelTarget();
  };

  const handleSpiritClick = (spiritId: string, isEnemy: boolean) => {
    if ((isEnemy && (targetMode === 'spell' || targetMode === 'attack' || targetMode === 'heropower')) || (!isEnemy && targetMode === 'equipment')) {
      handleTargetSelect(spiritId);
    } else if (!isEnemy && currentPlayer === 0) {
      const spirit = player.field.find(s => s.id === spiritId);
      if (spirit?.canAttack && !spirit.stunned) {
        setSelectedSpirit(spiritId);
        setTargetMode('attack');
      }
    }
  };

  const handleChampionClick = (isEnemy: boolean) => {
      if(isEnemy && targetMode === 'attack') {
          handleTargetSelect('champion');
      }
  }

  const handleEndTurn = () => {
    dispatch({ type: 'END_TURN' });
    cancelTarget();
  };

  const handleHeroPower = () => {
    if (player.champion.heroPower.requiresTarget) {
      setTargetMode('heropower');
    } else {
      dispatch({ type: 'USE_HERO_POWER', playerId: 0 });
    }
  };

  const cancelTarget = () => {
    setSelectedCard(null);
    setSelectedSpirit(null);
    setTargetMode('none');
  };

  if(!player) return <div>Loading...</div>

  return (
    <div className="game-board">
      {/* Enemy Field */}
      <div className="field enemy-field">
        <div className="champion-area" onClick={() => handleChampionClick(true)}>
          <div className={`champion-portrait ${winner === 1 ? 'winner' : ''} ${targetMode === 'attack' ? 'targetable': ''}`}>
            <div className="champion-name">{opponent.champion.name}</div>
            <div className="hp-bar">
              <div
                className="hp-fill"
                style={{ width: `${(opponent.champion.hp / opponent.champion.maxHp) * 100}%` }}
              />
              <span className="hp-text">{opponent.champion.hp}/{opponent.champion.maxHp}</span>
            </div>
            <div className="stats">ATK: {opponent.champion.atk} | WP: {opponent.willpower}/{opponent.maxWillpower}</div>
          </div>
        </div>

        <div className="spirit-row">
          {opponent.field.map(spirit => (
            <div
              key={spirit.id}
              onClick={() => handleSpiritClick(spirit.id, true)}
              className={targetMode === 'spell' || targetMode === 'attack' || targetMode === 'heropower' ? 'targetable' : ''}
            >
              <CardComponent card={spirit} inField isEnemy />
            </div>
          ))}
        </div>
      </div>

      {/* Action Log */}
      <div className="action-log">
        <h3>Log</h3>
        <div className="log-entries">
          {log.slice(-5).map((entry, i) => (
            <div key={i} className="log-entry">{entry}</div>
          ))}
        </div>
      </div>

      {/* Player Field */}
      <div className="field player-field">
        <div className="spirit-row">
          {player.field.map(spirit => (
            <div
              key={spirit.id}
              onClick={() => handleSpiritClick(spirit.id, false)}
              className={`${selectedSpirit === spirit.id ? 'selected' : ''} ${targetMode === 'equipment' ? 'targetable' : ''}`}
            >
              <CardComponent card={spirit} inField />
            </div>
          ))}
        </div>

        <div className="champion-area" onClick={() => handleChampionClick(false)}>
          <div className={`champion-portrait ${winner === 0 ? 'winner' : ''}`}>
            <div className="champion-name">{player.champion.name}</div>
            <div className="hp-bar">
              <div
                className="hp-fill player"
                style={{ width: `${(player.champion.hp / player.champion.maxHp) * 100}%` }}
              />
              <span className="hp-text">{player.champion.hp}/{player.champion.maxHp}</span>
            </div>
            <div className="stats">ATK: {player.champion.atk} | WP: {player.willpower}/{player.maxWillpower}</div>
            <div className="champion-actions">
              <button
                onClick={handleHeroPower}
                disabled={currentPlayer !== 0 || player.willpower < player.champion.heroPower.cost || player.heroPowerUsed}
                className="hero-power-btn"
              >
                {player.champion.heroPower.name}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hand */}
      <div className="hand">
        {player.hand.map((card, i) => (
          <div
            key={i}
            onClick={() => currentPlayer === 0 && handlePlayCard(i)}
            className={`hand-card ${selectedCard === i ? 'selected' : ''} ${canPlayCard(i) ? 'playable' : 'unplayable'}`}
          >
            <CardComponent card={card} />
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="controls">
        <div className="phase-indicator">
          {winner !== undefined ? (
            <strong>{winner === 0 ? 'YOU WIN!' : 'YOU LOSE!'}</strong>
          ) : (
            <>
              Turn {turn} | {currentPlayer === 0 ? 'Your Turn' : "AI's Turn"} | {phase.toUpperCase()}
            </>
          )}
        </div>

        {targetMode !== 'none' && (
          <div className="target-hint">
            {targetMode === 'spell' && 'Select an enemy spirit'}
            {targetMode === 'equipment' && 'Select your spirit to equip'}
            {targetMode === 'attack' && 'Select an enemy to attack'}
            {targetMode === 'heropower' && 'Select an enemy spirit to stun'}
            <button onClick={cancelTarget}>Cancel</button>
          </div>
        )}

        <div className="button-row">
          <button onClick={handleEndTurn} disabled={currentPlayer !== 0 || winner !== undefined}>
            End Turn
          </button>
          <button onClick={onReturn}>Return to Menu</button>
        </div>
      </div>
    </div>
  );
}
