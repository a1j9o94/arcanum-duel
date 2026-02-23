import { useState, useEffect } from 'react';
import type { GameState } from '../types';
import { initGame, playCard, attackWithSpirit, endTurn, aiTurn, useHeroPower, canPlayCard, championSelfAttack } from '../gameLogic';
import CardComponent from './Card';
import './GameBoard.css';

interface GameBoardProps {
  archetype: string;
  onReturn: () => void;
}

type TargetMode = 'none' | 'spell' | 'equipment' | 'attack' | 'heropower';

export default function GameBoard({ archetype, onReturn }: GameBoardProps) {
  const [game, setGame] = useState<GameState>(() => initGame(archetype));
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [selectedSpirit, setSelectedSpirit] = useState<string | null>(null);
  const [targetMode, setTargetMode] = useState<TargetMode>('none');
  const [isAiTurn, setIsAiTurn] = useState(false);

  const currentPlayer = game.players[game.currentPlayer];
  const opponent = game.players[1 - game.currentPlayer];

  // AI turn automation
  useEffect(() => {
    if (game.currentPlayer === 1 && !game.winner && !isAiTurn) {
      setIsAiTurn(true);
      setTimeout(() => {
        setGame(prev => {
          const newGame = JSON.parse(JSON.stringify(prev));
          aiTurn(newGame);
          return newGame;
        });
        setIsAiTurn(false);
      }, 1000);
    }
  }, [game.currentPlayer, game.winner, isAiTurn]);

  const handlePlayCard = (cardIndex: number) => {
    const card = currentPlayer.hand[cardIndex];
    if (!card || !canPlayCard(game, game.currentPlayer, card)) return;

    if (card.type === 'Incantation' && (card.name === 'Banishment' || card.name === 'Soul Drain')) {
      setSelectedCard(cardIndex);
      setTargetMode('spell');
    } else if (card.type === 'Equipment') {
      setSelectedCard(cardIndex);
      setTargetMode('equipment');
    } else {
      setGame(prev => {
        const newGame = JSON.parse(JSON.stringify(prev));
        playCard(newGame, game.currentPlayer, cardIndex);
        return newGame;
      });
    }
  };

  const handleTargetSelect = (targetId: string, isEnemy: boolean) => {
    if (targetMode === 'spell' && selectedCard !== null && isEnemy) {
      setGame(prev => {
        const newGame = JSON.parse(JSON.stringify(prev));
        playCard(newGame, game.currentPlayer, selectedCard, targetId);
        return newGame;
      });
      setSelectedCard(null);
      setTargetMode('none');
    } else if (targetMode === 'equipment' && selectedCard !== null && !isEnemy) {
      setGame(prev => {
        const newGame = JSON.parse(JSON.stringify(prev));
        playCard(newGame, game.currentPlayer, selectedCard, targetId);
        return newGame;
      });
      setSelectedCard(null);
      setTargetMode('none');
    } else if (targetMode === 'attack' && selectedSpirit && isEnemy) {
      setGame(prev => {
        const newGame = JSON.parse(JSON.stringify(prev));
        attackWithSpirit(newGame, selectedSpirit, targetId);
        return newGame;
      });
      setSelectedSpirit(null);
      setTargetMode('none');
    } else if (targetMode === 'heropower' && isEnemy) {
      setGame(prev => {
        const newGame = JSON.parse(JSON.stringify(prev));
        useHeroPower(newGame, game.currentPlayer, targetId);
        return newGame;
      });
      setTargetMode('none');
    }
  };

  const handleSpiritClick = (spiritId: string, isEnemy: boolean) => {
    if (targetMode !== 'none') {
      handleTargetSelect(spiritId, isEnemy);
    } else if (!isEnemy && game.currentPlayer === 0) {
      const spirit = currentPlayer.field.find(s => s.id === spiritId);
      if (spirit?.canAttack && !spirit.stunned) {
        setSelectedSpirit(spiritId);
        setTargetMode('attack');
      }
    }
  };

  const handleAttackChampion = () => {
    if (selectedSpirit && targetMode === 'attack') {
      setGame(prev => {
        const newGame = JSON.parse(JSON.stringify(prev));
        attackWithSpirit(newGame, selectedSpirit);
        return newGame;
      });
      setSelectedSpirit(null);
      setTargetMode('none');
    }
  };

  const handleEndTurn = () => {
    setGame(prev => {
      const newGame = JSON.parse(JSON.stringify(prev));
      endTurn(newGame);
      return newGame;
    });
    setSelectedCard(null);
    setSelectedSpirit(null);
    setTargetMode('none');
  };

  const handleHeroPower = () => {
    if (currentPlayer.champion.heroPower.name === 'Binding Circle') {
      setTargetMode('heropower');
    } else {
      setGame(prev => {
        const newGame = JSON.parse(JSON.stringify(prev));
        useHeroPower(newGame, game.currentPlayer);
        return newGame;
      });
    }
  };

  const handleChampionAttack = () => {
    if (game.currentPlayer === 0) {
      setGame(prev => {
        const newGame = JSON.parse(JSON.stringify(prev));
        championSelfAttack(newGame, game.currentPlayer);
        return newGame;
      });
    }
  };

  const cancelTarget = () => {
    setSelectedCard(null);
    setSelectedSpirit(null);
    setTargetMode('none');
  };

  return (
    <div className="game-board">
      {/* Enemy Field */}
      <div className="field enemy-field">
        <div className="champion-area">
          <div className={`champion-portrait ${game.winner === 1 ? 'winner' : ''}`}>
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
          {game.log.slice(-5).map((entry, i) => (
            <div key={i} className="log-entry">{entry}</div>
          ))}
        </div>
      </div>

      {/* Player Field */}
      <div className="field player-field">
        <div className="spirit-row">
          {currentPlayer.field.map(spirit => (
            <div
              key={spirit.id}
              onClick={() => handleSpiritClick(spirit.id, false)}
              className={`${selectedSpirit === spirit.id ? 'selected' : ''} ${targetMode === 'equipment' ? 'targetable' : ''}`}
            >
              <CardComponent card={spirit} inField />
            </div>
          ))}
        </div>

        <div className="champion-area">
          <div className={`champion-portrait ${game.winner === 0 ? 'winner' : ''}`}>
            <div className="champion-name">{currentPlayer.champion.name}</div>
            <div className="hp-bar">
              <div
                className="hp-fill player"
                style={{ width: `${(currentPlayer.champion.hp / currentPlayer.champion.maxHp) * 100}%` }}
              />
              <span className="hp-text">{currentPlayer.champion.hp}/{currentPlayer.champion.maxHp}</span>
            </div>
            <div className="stats">ATK: {currentPlayer.champion.atk} | WP: {currentPlayer.willpower}/{currentPlayer.maxWillpower}</div>
            <div className="champion-actions">
              <button
                onClick={handleHeroPower}
                disabled={game.currentPlayer !== 0 || currentPlayer.willpower < currentPlayer.champion.heroPower.cost}
                className="hero-power-btn"
              >
                {currentPlayer.champion.heroPower.name}
              </button>
              <button
                onClick={handleChampionAttack}
                disabled={game.currentPlayer !== 0}
                className="self-attack-btn"
              >
                Self-Attack
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hand */}
      <div className="hand">
        {currentPlayer.hand.map((card, i) => (
          <div
            key={card.id}
            onClick={() => game.currentPlayer === 0 && handlePlayCard(i)}
            className={`hand-card ${selectedCard === i ? 'selected' : ''} ${canPlayCard(game, game.currentPlayer, card) ? 'playable' : 'unplayable'}`}
          >
            <CardComponent card={card} />
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="controls">
        <div className="phase-indicator">
          {game.winner ? (
            <strong>{game.winner === 0 ? 'YOU WIN!' : 'YOU LOSE!'}</strong>
          ) : (
            <>
              Turn {game.turn} | {game.currentPlayer === 0 ? 'Your Turn' : "AI's Turn"} | {game.phase.toUpperCase()}
            </>
          )}
        </div>

        {targetMode !== 'none' && (
          <div className="target-hint">
            {targetMode === 'spell' && 'Select an enemy spirit'}
            {targetMode === 'equipment' && 'Select your spirit to equip'}
            {targetMode === 'attack' && (
              <>
                Select enemy target or{' '}
                <button onClick={handleAttackChampion}>Attack Champion</button>
              </>
            )}
            {targetMode === 'heropower' && 'Select an enemy spirit to stun'}
            <button onClick={cancelTarget}>Cancel</button>
          </div>
        )}

        <div className="button-row">
          <button onClick={handleEndTurn} disabled={game.currentPlayer !== 0 || game.winner !== undefined}>
            End Turn
          </button>
          <button onClick={onReturn}>Return to Menu</button>
        </div>
      </div>
    </div>
  );
}
