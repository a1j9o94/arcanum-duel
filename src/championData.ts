import type { ChampionData } from './types';

export const CHAMPIONS: Record<string, ChampionData> = {
  swarmMaster: {
    id: 'ezra',
    name: 'Ezra the Swarmlord',
    archetype: 'Swarm Master',
    hp: 30,
    maxHp: 30,
    atk: 1,
    heroPower: {
      id: 'summon-swarm',
      name: 'Summon Swarm',
      cost: 2,
      description: 'Summon two 1/1 Mites',
    },
    passive: {
      id: 'endless-horde',
      name: 'Endless Horde',
      description: 'Spirits cost 1 less',
    },
  },
  bloodPact: {
    id: 'morgath',
    name: 'Morgath the Bloodbound',
    archetype: 'Blood Pact',
    hp: 35,
    maxHp: 35,
    atk: 2,
    heroPower: {
      id: 'blood-sacrifice',
      name: 'Blood Sacrifice',
      cost: 0,
      description: 'Pay 4 HP: Draw 2 cards',
    },
    passive: {
      id: 'pact-of-flesh',
      name: 'Pact of Flesh',
      description: 'Can pay 2 HP instead of 1 Willpower',
    },
  },
  binder: {
    id: 'solomon',
    name: 'Solomon the Wise',
    archetype: 'Binder',
    hp: 28,
    maxHp: 28,
    atk: 1,
    heroPower: {
      id: 'binding-circle',
      name: 'Binding Circle',
      cost: 3,
      description: 'Stun an enemy spirit',
      requiresTarget: true,
    },
    passive: {
      id: 'master-binder',
      name: 'Master Binder',
      description: 'Equipment gives +1/+1',
    },
  },
  shaman: {
    id: 'keiko',
    name: 'Keiko the Spiritwalker',
    archetype: 'Shaman',
    hp: 32,
    maxHp: 32,
    atk: 1,
    heroPower: {
      id: 'spirit-communion',
      name: 'Spirit Communion',
      cost: 2,
      description: 'Heal 4 HP and draw a card',
    },
    passive: {
      id: 'ancestral-bond',
      name: 'Ancestral Bond',
      description: 'Deathrattles trigger twice',
    },
  },
};
