import type { Card, Champion, GameState } from './types';

// Helper functions for card effects
export const dealDamage = (game: GameState, playerId: number, targetId: string, damage: number) => {
  const opponent = game.players[1 - playerId];
  const target = opponent.field.find(c => c.id === targetId);
  if (target && target.hp) {
    target.hp -= damage;
    game.log.push(`${target.name} takes ${damage} damage`);
    if (target.hp <= 0) {
      destroySpirit(game, 1 - playerId, targetId);
    }
  }
};

export const destroySpirit = (game: GameState, playerId: number, spiritId: string) => {
  const player = game.players[playerId];
  const spiritIndex = player.field.findIndex(c => c.id === spiritId);
  if (spiritIndex >= 0) {
    const spirit = player.field[spiritIndex];
    game.log.push(`${spirit.name} destroyed`);
    if (spirit.deathrattle) {
      spirit.deathrattle(game, playerId);
    }
    player.field.splice(spiritIndex, 1);
  }
};

export const drawCard = (game: GameState, playerId: number, count = 1) => {
  const player = game.players[playerId];
  for (let i = 0; i < count; i++) {
    if (player.deck.length > 0) {
      const card = player.deck.shift()!;
      player.hand.push(card);
      game.log.push(`Drew ${card.name}`);
    }
  }
};

export const healChampion = (game: GameState, playerId: number, amount: number) => {
  const player = game.players[playerId];
  const oldHp = player.champion.hp;
  player.champion.hp = Math.min(player.champion.hp + amount, player.champion.maxHp);
  const healed = player.champion.hp - oldHp;
  if (healed > 0) {
    game.log.push(`${player.champion.name} healed for ${healed}`);
  }
};

// Champions
export const CHAMPIONS: Record<string, Champion> = {
  swarmMaster: {
    name: 'Ezra the Swarmlord',
    archetype: 'Swarm Master',
    hp: 30,
    maxHp: 30,
    atk: 1,
    heroPower: {
      name: 'Summon Swarm',
      cost: 2,
      description: 'Summon two 1/1 Mites',
      effect: (game, playerId) => {
        const player = game.players[playerId];
        if (player.field.length >= 5) {
          game.log.push('Field is full!');
          return;
        }
        const mitesToSummon = Math.min(2, 5 - player.field.length);
        for (let i = 0; i < mitesToSummon; i++) {
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
          });
        }
        game.log.push(`Summoned ${mitesToSummon} Mite(s)`);
      },
    },
    passive: {
      name: 'Endless Horde',
      description: 'Spirits cost 1 less',
    },
  },
  bloodPact: {
    name: 'Morgath the Bloodbound',
    archetype: 'Blood Pact',
    hp: 35,
    maxHp: 35,
    atk: 2,
    heroPower: {
      name: 'Blood Sacrifice',
      cost: 0, // costs HP instead
      description: 'Pay 4 HP: Draw 2 cards',
      effect: (game, playerId) => {
        const player = game.players[playerId];
        if (player.champion.hp <= 4) {
          game.log.push('Not enough HP!');
          return;
        }
        player.champion.hp -= 4;
        drawCard(game, playerId, 2);
        game.log.push('Sacrificed 4 HP to draw 2 cards');
      },
    },
    passive: {
      name: 'Pact of Flesh',
      description: 'Can pay 2 HP instead of 1 Willpower',
    },
  },
  binder: {
    name: 'Solomon the Wise',
    archetype: 'Binder',
    hp: 28,
    maxHp: 28,
    atk: 1,
    heroPower: {
      name: 'Binding Circle',
      cost: 3,
      description: 'Stun an enemy spirit',
      effect: (game) => {
        // This requires targeting - handled in UI
        game.log.push('Select an enemy spirit to stun');
      },
    },
    passive: {
      name: 'Master Binder',
      description: 'Equipment gives +1/+1',
    },
  },
  shaman: {
    name: 'Keiko the Spiritwalker',
    archetype: 'Shaman',
    hp: 32,
    maxHp: 32,
    atk: 1,
    heroPower: {
      name: 'Spirit Communion',
      cost: 2,
      description: 'Heal 4 HP and draw a card',
      effect: (game, playerId) => {
        healChampion(game, playerId, 4);
        drawCard(game, playerId, 1);
      },
    },
    passive: {
      name: 'Ancestral Bond',
      description: 'Deathrattles trigger twice',
    },
  },
};

// Card generators
let cardIdCounter = 0;
const generateCardId = () => `card-${Date.now()}-${cardIdCounter++}`;

export const createCard = (template: Omit<Card, 'id'>): Card => ({
  ...template,
  id: generateCardId(),
});

// Spirit Cards
export const SPIRIT_CARDS = {
  // Mites
  scuttleMite: (): Card => createCard({
    name: 'Scuttle Mite',
    type: 'Spirit',
    tier: 'Mite',
    cost: 1,
    atk: 1,
    hp: 2,
    maxHp: 2,
    text: '',
    keywords: [],
  }),

  poisonMite: (): Card => createCard({
    name: 'Poison Mite',
    type: 'Spirit',
    tier: 'Mite',
    cost: 2,
    atk: 1,
    hp: 1,
    maxHp: 1,
    text: 'Deathrattle: Deal 2 damage to enemy champion',
    deathrattle: (game, playerId) => {
      const opponent = game.players[1 - playerId];
      opponent.champion.hp -= 2;
      game.log.push(`${opponent.champion.name} takes 2 poison damage`);
    },
  }),

  // Imps
  fireImp: (): Card => createCard({
    name: 'Fire Imp',
    type: 'Spirit',
    tier: 'Imp',
    cost: 2,
    atk: 2,
    hp: 2,
    maxHp: 2,
    text: 'Battlecry: Deal 1 damage',
    keywords: [],
  }),

  shadowImp: (): Card => createCard({
    name: 'Shadow Imp',
    type: 'Spirit',
    tier: 'Imp',
    cost: 3,
    atk: 3,
    hp: 2,
    maxHp: 2,
    text: '',
    keywords: [],
  }),

  // Foliots
  dustFoliot: (): Card => createCard({
    name: 'Dust Foliot',
    type: 'Spirit',
    tier: 'Foliot',
    cost: 3,
    atk: 2,
    hp: 4,
    maxHp: 4,
    text: 'Taunt',
    keywords: ['Taunt'],
  }),

  windFoliot: (): Card => createCard({
    name: 'Wind Foliot',
    type: 'Spirit',
    tier: 'Foliot',
    cost: 4,
    atk: 4,
    hp: 3,
    maxHp: 3,
    text: '',
    keywords: [],
  }),

  // Djinn
  flameDjinn: (): Card => createCard({
    name: 'Flame Djinn',
    type: 'Spirit',
    tier: 'Djinn',
    cost: 5,
    atk: 5,
    hp: 4,
    maxHp: 4,
    text: 'Battlecry: Deal 3 damage',
    keywords: [],
  }),

  stormDjinn: (): Card => createCard({
    name: 'Storm Djinn',
    type: 'Spirit',
    tier: 'Djinn',
    cost: 5,
    atk: 4,
    hp: 5,
    maxHp: 5,
    text: 'Taunt',
    keywords: ['Taunt'],
  }),

  // Afrits
  infernoAfrit: (): Card => createCard({
    name: 'Inferno Afrit',
    type: 'Spirit',
    tier: 'Afrit',
    cost: 6,
    atk: 6,
    hp: 5,
    maxHp: 5,
    text: '',
    keywords: [],
  }),

  voidAfrit: (): Card => createCard({
    name: 'Void Afrit',
    type: 'Spirit',
    tier: 'Afrit',
    cost: 7,
    atk: 5,
    hp: 7,
    maxHp: 7,
    text: 'Taunt, Lifesteal',
    keywords: ['Taunt', 'Lifesteal'],
  }),

  // Marids
  titanMarid: (): Card => createCard({
    name: 'Titan Marid',
    type: 'Spirit',
    tier: 'Marid',
    cost: 8,
    atk: 8,
    hp: 8,
    maxHp: 8,
    text: 'Taunt',
    keywords: ['Taunt'],
  }),

  ancientMarid: (): Card => createCard({
    name: 'Ancient Marid',
    type: 'Spirit',
    tier: 'Marid',
    cost: 9,
    atk: 7,
    hp: 10,
    maxHp: 10,
    text: 'Taunt, Lifesteal',
    keywords: ['Taunt', 'Lifesteal'],
  }),
};

// Incantation Cards
export const INCANTATION_CARDS = {
  banishment: (): Card => createCard({
    name: 'Banishment',
    type: 'Incantation',
    cost: 4,
    text: 'Destroy target spirit',
    effect: (game, playerId, targetId) => {
      if (targetId) {
        destroySpirit(game, 1 - playerId, targetId);
      }
    },
  }),

  soulDrain: (): Card => createCard({
    name: 'Soul Drain',
    type: 'Incantation',
    cost: 3,
    text: 'Deal 3 damage, heal 3 HP',
    effect: (game, playerId, targetId) => {
      if (targetId) {
        dealDamage(game, playerId, targetId, 3);
        healChampion(game, playerId, 3);
      }
    },
  }),

  summoningRitual: (): Card => createCard({
    name: 'Summoning Ritual',
    type: 'Incantation',
    cost: 2,
    text: 'Draw 2 cards',
    effect: (game, playerId) => {
      drawCard(game, playerId, 2);
    },
  }),
};

// Equipment Cards
export const EQUIPMENT_CARDS = {
  flameWhip: (): Card => createCard({
    name: 'Flame Whip',
    type: 'Equipment',
    cost: 2,
    atkBuff: 2,
    hpBuff: 0,
    text: 'Equip: +2 Attack',
  }),

  ironArmor: (): Card => createCard({
    name: 'Iron Armor',
    type: 'Equipment',
    cost: 2,
    atkBuff: 0,
    hpBuff: 3,
    text: 'Equip: +3 Health',
  }),

  solomonRing: (): Card => createCard({
    name: "Solomon's Ring",
    type: 'Equipment',
    cost: 3,
    atkBuff: 2,
    hpBuff: 2,
    text: 'Equip: +2/+2',
  }),
};

// Artifact Cards
export const ARTIFACT_CARDS = {
  bloodAltar: (): Card => createCard({
    name: 'Blood Altar',
    type: 'Artifact',
    cost: 3,
    text: 'At end of turn, pay 2 HP to draw a card',
  }),

  swarmTotem: (): Card => createCard({
    name: 'Swarm Totem',
    type: 'Artifact',
    cost: 2,
    text: 'Your Mites have +1/+1',
  }),
};

// Deck builders
export const buildDeck = (archetype: string): Card[] => {
  const deck: Card[] = [];

  // Archetype-specific cards
  switch (archetype) {
    case 'Swarm Master':
      deck.push(...[
        SPIRIT_CARDS.scuttleMite(),
        SPIRIT_CARDS.scuttleMite(),
        SPIRIT_CARDS.poisonMite(),
        SPIRIT_CARDS.poisonMite(),
        SPIRIT_CARDS.fireImp(),
        SPIRIT_CARDS.fireImp(),
        SPIRIT_CARDS.shadowImp(),
        SPIRIT_CARDS.windFoliot(),
        SPIRIT_CARDS.flameDjinn(),
        SPIRIT_CARDS.infernoAfrit(),
      ]);
      break;
    case 'Blood Pact':
      deck.push(...[
        SPIRIT_CARDS.shadowImp(),
        SPIRIT_CARDS.shadowImp(),
        SPIRIT_CARDS.dustFoliot(),
        SPIRIT_CARDS.windFoliot(),
        SPIRIT_CARDS.flameDjinn(),
        SPIRIT_CARDS.stormDjinn(),
        SPIRIT_CARDS.infernoAfrit(),
        SPIRIT_CARDS.voidAfrit(),
        SPIRIT_CARDS.titanMarid(),
        SPIRIT_CARDS.ancientMarid(),
      ]);
      break;
    case 'Binder':
      deck.push(...[
        SPIRIT_CARDS.fireImp(),
        SPIRIT_CARDS.shadowImp(),
        SPIRIT_CARDS.dustFoliot(),
        SPIRIT_CARDS.dustFoliot(),
        SPIRIT_CARDS.windFoliot(),
        SPIRIT_CARDS.flameDjinn(),
        SPIRIT_CARDS.stormDjinn(),
        SPIRIT_CARDS.infernoAfrit(),
        SPIRIT_CARDS.voidAfrit(),
        SPIRIT_CARDS.titanMarid(),
      ]);
      break;
    case 'Shaman':
      deck.push(...[
        SPIRIT_CARDS.scuttleMite(),
        SPIRIT_CARDS.poisonMite(),
        SPIRIT_CARDS.fireImp(),
        SPIRIT_CARDS.dustFoliot(),
        SPIRIT_CARDS.windFoliot(),
        SPIRIT_CARDS.flameDjinn(),
        SPIRIT_CARDS.stormDjinn(),
        SPIRIT_CARDS.infernoAfrit(),
        SPIRIT_CARDS.voidAfrit(),
        SPIRIT_CARDS.ancientMarid(),
      ]);
      break;
  }

  // Neutral spells (5 cards)
  deck.push(
    INCANTATION_CARDS.banishment(),
    INCANTATION_CARDS.soulDrain(),
    INCANTATION_CARDS.summoningRitual(),
    INCANTATION_CARDS.summoningRitual(),
    INCANTATION_CARDS.soulDrain(),
  );

  // Equipment (5 cards)
  deck.push(
    EQUIPMENT_CARDS.flameWhip(),
    EQUIPMENT_CARDS.flameWhip(),
    EQUIPMENT_CARDS.ironArmor(),
    EQUIPMENT_CARDS.ironArmor(),
    EQUIPMENT_CARDS.solomonRing(),
  );

  // Shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
};
