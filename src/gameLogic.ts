import type { GameState, Player, Card } from './types';
import { CHAMPIONS, buildDeck, drawCard, dealDamage, destroySpirit, healChampion } from './cardData';

export const initGame = (playerArchetype: string): GameState => {
  const archetypes = ['Swarm Master', 'Blood Pact', 'Binder', 'Shaman'];
  const aiArchetype = archetypes.filter(a => a !== playerArchetype)[Math.floor(Math.random() * 3)];

  const playerChampion = JSON.parse(JSON.stringify(
    playerArchetype === 'Swarm Master' ? CHAMPIONS.swarmMaster :
    playerArchetype === 'Blood Pact' ? CHAMPIONS.bloodPact :
    playerArchetype === 'Binder' ? CHAMPIONS.binder :
    CHAMPIONS.shaman
  ));

  const aiChampionData = JSON.parse(JSON.stringify(
    aiArchetype === 'Swarm Master' ? CHAMPIONS.swarmMaster :
    aiArchetype === 'Blood Pact' ? CHAMPIONS.bloodPact :
    aiArchetype === 'Binder' ? CHAMPIONS.binder :
    CHAMPIONS.shaman
  ));

  const playerDeck = buildDeck(playerArchetype);
  const aiDeck = buildDeck(aiArchetype);

  const player: Player = {
    id: 0,
    champion: playerChampion,
    deck: playerDeck.slice(4),
    hand: playerDeck.slice(0, 4),
    field: [],
    artifacts: [],
    willpower: 2,
    maxWillpower: 2,
  };

  const ai: Player = {
    id: 1,
    champion: aiChampionData,
    deck: aiDeck.slice(4),
    hand: aiDeck.slice(0, 4),
    field: [],
    artifacts: [],
    willpower: 2,
    maxWillpower: 2,
  };

  return {
    players: [player, ai],
    currentPlayer: 0,
    phase: 'main',
    turn: 1,
    log: ['Game started!', `You are ${playerChampion.name}`, `AI is ${aiChampionData.name}`],
  };
};

export const canPlayCard = (game: GameState, playerId: number, card: Card): boolean => {
  const player = game.players[playerId];

  if (card.type === 'Spirit' && player.field.length >= 5) {
    return false;
  }

  // Check if player has enough willpower or HP (for Blood Pact)
  if (player.champion.archetype === 'Blood Pact') {
    const hpCost = card.cost * 2;
    return player.willpower >= card.cost || player.champion.hp > hpCost;
  }

  // Swarm Master discount
  if (player.champion.archetype === 'Swarm Master' && card.type === 'Spirit') {
    return player.willpower >= Math.max(0, card.cost - 1);
  }

  return player.willpower >= card.cost;
};

export const playCard = (game: GameState, playerId: number, cardIndex: number, targetId?: string): boolean => {
  const player = game.players[playerId];
  const card = player.hand[cardIndex];

  if (!card || !canPlayCard(game, playerId, card)) {
    return false;
  }

  // Calculate actual cost
  let actualCost = card.cost;
  if (player.champion.archetype === 'Swarm Master' && card.type === 'Spirit') {
    actualCost = Math.max(0, card.cost - 1);
  }

  // Pay cost (willpower or HP for Blood Pact)
  if (player.champion.archetype === 'Blood Pact' && player.willpower < actualCost) {
    const hpCost = actualCost * 2;
    player.champion.hp -= hpCost;
    game.log.push(`Paid ${hpCost} HP to play ${card.name}`);
  } else {
    player.willpower -= actualCost;
  }

  // Remove from hand
  player.hand.splice(cardIndex, 1);

  // Play the card
  if (card.type === 'Spirit') {
    card.summoningSick = true;
    card.canAttack = false;
    player.field.push(card);
    game.log.push(`Summoned ${card.name}`);

    // Battlecry effects
    if (card.name === 'Fire Imp' && targetId) {
      dealDamage(game, playerId, targetId, 1);
    } else if (card.name === 'Flame Djinn' && targetId) {
      dealDamage(game, playerId, targetId, 3);
    }
  } else if (card.type === 'Incantation') {
    if (card.effect) {
      card.effect(game, playerId, targetId);
    }
    game.log.push(`Cast ${card.name}`);
  } else if (card.type === 'Equipment') {
    if (targetId) {
      const spirit = player.field.find(s => s.id === targetId);
      if (spirit) {
        spirit.atk = (spirit.atk || 0) + (card.atkBuff || 0);
        spirit.hp = (spirit.hp || 0) + (card.hpBuff || 0);
        spirit.maxHp = (spirit.maxHp || 0) + (card.hpBuff || 0);
        spirit.equipmentId = card.id;

        // Binder bonus
        if (player.champion.archetype === 'Binder') {
          spirit.atk! += 1;
          spirit.hp! += 1;
          spirit.maxHp! += 1;
        }

        game.log.push(`Equipped ${card.name} to ${spirit.name}`);
      }
    }
  } else if (card.type === 'Artifact') {
    player.artifacts.push(card);
    game.log.push(`Played artifact ${card.name}`);
  }

  return true;
};

export const attackWithSpirit = (game: GameState, attackerId: string, targetId?: string): boolean => {
  const player = game.players[game.currentPlayer];
  const opponent = game.players[1 - game.currentPlayer];

  const attacker = player.field.find(s => s.id === attackerId);
  if (!attacker || !attacker.canAttack || attacker.stunned) {
    return false;
  }

  // Check for taunts
  const hasTaunt = opponent.field.some(s => s.keywords?.includes('Taunt'));
  if (hasTaunt && targetId) {
    const target = opponent.field.find(s => s.id === targetId);
    if (!target?.keywords?.includes('Taunt')) {
      game.log.push('Must attack Taunt first!');
      return false;
    }
  }

  const atkPower = attacker.atk || 0;

  if (targetId) {
    // Attack spirit
    const defender = opponent.field.find(s => s.id === targetId);
    if (!defender) return false;

    const defPower = defender.atk || 0;

    // Deal damage
    defender.hp! -= atkPower;
    attacker.hp! -= defPower;

    game.log.push(`${attacker.name} attacks ${defender.name}`);

    // Lifesteal
    if (attacker.keywords?.includes('Lifesteal')) {
      healChampion(game, game.currentPlayer, atkPower);
    }

    // Check deaths
    if (defender.hp! <= 0) {
      destroySpirit(game, 1 - game.currentPlayer, targetId);
    }
    if (attacker.hp! <= 0) {
      destroySpirit(game, game.currentPlayer, attackerId);
    }
  } else {
    // Attack champion
    opponent.champion.hp -= atkPower;
    game.log.push(`${attacker.name} attacks ${opponent.champion.name} for ${atkPower}`);

    // Lifesteal
    if (attacker.keywords?.includes('Lifesteal')) {
      healChampion(game, game.currentPlayer, atkPower);
    }
  }

  attacker.canAttack = false;
  return true;
};

export const championSelfAttack = (game: GameState, playerId: number): boolean => {
  const player = game.players[playerId];
  const opponent = game.players[1 - playerId];

  const championAtk = player.champion.atk;

  // Deal damage to opponent champion
  opponent.champion.hp -= championAtk;
  game.log.push(`${player.champion.name} self-attacks for ${championAtk} damage!`);

  // Take retaliation damage from enemy champion
  const retaliation = opponent.champion.atk;
  player.champion.hp -= retaliation;
  game.log.push(`Takes ${retaliation} retaliation damage`);

  return true;
};

export const useHeroPower = (game: GameState, playerId: number, targetId?: string): boolean => {
  const player = game.players[playerId];
  const heroPower = player.champion.heroPower;

  // Check cost
  if (player.champion.archetype === 'Blood Pact' && heroPower.name === 'Blood Sacrifice') {
    if (player.champion.hp <= 4) return false;
  } else {
    if (player.willpower < heroPower.cost) return false;
    player.willpower -= heroPower.cost;
  }

  // Use power
  if (heroPower.name === 'Binding Circle' && targetId) {
    const opponent = game.players[1 - playerId];
    const target = opponent.field.find(s => s.id === targetId);
    if (target) {
      target.stunned = true;
      target.canAttack = false;
      game.log.push(`Stunned ${target.name}`);
    }
  } else {
    heroPower.effect(game, playerId);
  }

  return true;
};

export const endTurn = (game: GameState): void => {
  const player = game.players[game.currentPlayer];

  // Remove summoning sickness and reset attacks
  player.field.forEach(spirit => {
    spirit.summoningSick = false;
    spirit.canAttack = true;
    if (spirit.stunned) {
      spirit.stunned = false;
      spirit.canAttack = false;
    }
  });

  // Switch player
  game.currentPlayer = 1 - game.currentPlayer;
  const newPlayer = game.players[game.currentPlayer];

  // Increment turn counter
  if (game.currentPlayer === 0) {
    game.turn++;
  }

  // Start of turn
  newPlayer.maxWillpower = Math.min(10, newPlayer.maxWillpower + 1);
  newPlayer.willpower = newPlayer.maxWillpower;
  drawCard(game, game.currentPlayer);

  // Remove summoning sickness for new player's spirits
  newPlayer.field.forEach(spirit => {
    spirit.summoningSick = false;
    spirit.canAttack = true;
  });

  game.phase = 'main';
  game.log.push(`Turn ${game.turn} - ${newPlayer.champion.name}'s turn`);

  // Check for merge state
  if (newPlayer.mergeState) {
    newPlayer.mergeState.turnsLeft--;
    if (newPlayer.mergeState.turnsLeft <= 0) {
      newPlayer.champion.atk -= newPlayer.mergeState.spirit.atk || 0;
      game.log.push('Merge ended');
      newPlayer.mergeState = undefined;
    }
  }

  // Check win condition
  if (player.champion.hp <= 0) {
    game.winner = game.currentPlayer;
    game.log.push(`${newPlayer.champion.name} wins!`);
  } else if (newPlayer.champion.hp <= 0) {
    game.winner = 1 - game.currentPlayer;
    game.log.push(`${player.champion.name} wins!`);
  }
};

// AI Logic
export const aiTurn = (game: GameState): void => {
  const aiPlayer = game.players[1];

  // Play cards greedily (most expensive first)
  const sortedHand = [...aiPlayer.hand].sort((a, b) => b.cost - a.cost);

  for (const card of sortedHand) {
    const cardIndex = aiPlayer.hand.findIndex(c => c.id === card.id);
    if (cardIndex === -1) continue;

    if (canPlayCard(game, 1, card)) {
      if (card.type === 'Spirit') {
        playCard(game, 1, cardIndex);
      } else if (card.type === 'Incantation') {
        // Target enemy spirits for damage spells
        const enemySpirits = game.players[0].field;
        if (enemySpirits.length > 0 && (card.name === 'Soul Drain' || card.name === 'Banishment')) {
          playCard(game, 1, cardIndex, enemySpirits[0].id);
        } else {
          playCard(game, 1, cardIndex);
        }
      } else if (card.type === 'Equipment') {
        // Equip to strongest spirit
        const strongest = aiPlayer.field.reduce((max, s) =>
          ((s.atk || 0) > (max.atk || 0) ? s : max), aiPlayer.field[0]);
        if (strongest) {
          playCard(game, 1, cardIndex, strongest.id);
        }
      }
    }
  }

  // Use hero power if affordable
  if (aiPlayer.willpower >= aiPlayer.champion.heroPower.cost) {
    const enemySpirits = game.players[0].field;
    if (aiPlayer.champion.heroPower.name === 'Binding Circle' && enemySpirits.length > 0) {
      // Stun strongest enemy spirit
      const strongest = enemySpirits.reduce((max, s) =>
        ((s.atk || 0) > (max.atk || 0) ? s : max), enemySpirits[0]);
      useHeroPower(game, 1, strongest.id);
    } else if (aiPlayer.champion.heroPower.name !== 'Binding Circle') {
      useHeroPower(game, 1);
    }
  }

  // Attack with all spirits
  const playerField = game.players[0].field;
  const hasTaunt = playerField.some(s => s.keywords?.includes('Taunt'));

  for (const spirit of aiPlayer.field) {
    if (spirit.canAttack && !spirit.stunned) {
      if (hasTaunt) {
        // Attack taunt
        const taunt = playerField.find(s => s.keywords?.includes('Taunt'));
        if (taunt) {
          attackWithSpirit(game, spirit.id, taunt.id);
        }
      } else if (playerField.length > 0) {
        // Attack weakest spirit for favorable trades
        const weakest = playerField.reduce((min, s) =>
          ((s.hp || 0) < (min.hp || 0) ? s : min), playerField[0]);
        attackWithSpirit(game, spirit.id, weakest.id);
      } else {
        // Attack champion
        attackWithSpirit(game, spirit.id);
      }
    }
  }

  // End turn
  setTimeout(() => {
    endTurn(game);
  }, 500);
};
