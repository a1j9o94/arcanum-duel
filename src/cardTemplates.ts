import type { CardData } from './types';

// Card templates — pure data, no functions.
// Runtime instances are created by spreading template + adding runtime state.
export type CardTemplate = Omit<CardData, 'id' | 'summoningSick' | 'canAttack' | 'stunned'>;

// ─── Spirit Templates ────────────────────────────────────────

export const SPIRITS: Record<string, CardTemplate> = {
  'scuttle-mite': { name: 'Scuttle Mite', type: 'Spirit', tier: 'Mite', cost: 1, atk: 1, hp: 2, maxHp: 2, text: '' },
  'poison-mite': { name: 'Poison Mite', type: 'Spirit', tier: 'Mite', cost: 2, atk: 1, hp: 1, maxHp: 1, text: 'Deathrattle: Deal 2 damage to enemy champion', hasDeathrattle: true },
  'fire-imp': { name: 'Fire Imp', type: 'Spirit', tier: 'Imp', cost: 2, atk: 2, hp: 2, maxHp: 2, text: 'Battlecry: Deal 1 damage', hasBattlecry: true, requiresTarget: true },
  'shadow-imp': { name: 'Shadow Imp', type: 'Spirit', tier: 'Imp', cost: 3, atk: 3, hp: 2, maxHp: 2, text: '' },
  'dust-foliot': { name: 'Dust Foliot', type: 'Spirit', tier: 'Foliot', cost: 3, atk: 2, hp: 4, maxHp: 4, text: 'Taunt', keywords: ['Taunt'] },
  'wind-foliot': { name: 'Wind Foliot', type: 'Spirit', tier: 'Foliot', cost: 4, atk: 4, hp: 3, maxHp: 3, text: '' },
  'flame-djinn': { name: 'Flame Djinn', type: 'Spirit', tier: 'Djinn', cost: 5, atk: 5, hp: 4, maxHp: 4, text: 'Battlecry: Deal 3 damage', hasBattlecry: true, requiresTarget: true },
  'storm-djinn': { name: 'Storm Djinn', type: 'Spirit', tier: 'Djinn', cost: 5, atk: 4, hp: 5, maxHp: 5, text: 'Taunt', keywords: ['Taunt'] },
  'inferno-afrit': { name: 'Inferno Afrit', type: 'Spirit', tier: 'Afrit', cost: 6, atk: 6, hp: 5, maxHp: 5, text: '' },
  'void-afrit': { name: 'Void Afrit', type: 'Spirit', tier: 'Afrit', cost: 7, atk: 5, hp: 7, maxHp: 7, text: 'Taunt, Lifesteal', keywords: ['Taunt', 'Lifesteal'] },
  'titan-marid': { name: 'Titan Marid', type: 'Spirit', tier: 'Marid', cost: 8, atk: 8, hp: 8, maxHp: 8, text: 'Taunt', keywords: ['Taunt'] },
  'ancient-marid': { name: 'Ancient Marid', type: 'Spirit', tier: 'Marid', cost: 9, atk: 7, hp: 10, maxHp: 10, text: 'Taunt, Lifesteal', keywords: ['Taunt', 'Lifesteal'] },
};
export const INCANTATIONS: Record<string, CardTemplate> = {
  'banishment': { name: 'Banishment', type: 'Incantation', cost: 4, text: 'Destroy target spirit', requiresTarget: true },
  'soul-drain': { name: 'Soul Drain', type: 'Incantation', cost: 3, text: 'Deal 3 damage, heal 3 HP', requiresTarget: true },
  'summoning-ritual': { name: 'Summoning Ritual', type: 'Incantation', cost: 2, text: 'Draw 2 cards' },
};
export const EQUIPMENT: Record<string, CardTemplate> = {
  'flame-whip': { name: 'Flame Whip', type: 'Equipment', cost: 2, atkBuff: 2, hpBuff: 0, text: 'Equip: +2 Attack' },
  'iron-armor': { name: 'Iron Armor', type: 'Equipment', cost: 2, atkBuff: 0, hpBuff: 3, text: 'Equip: +3 Health' },
  'solomons-ring': { name: "Solomon's Ring", type: 'Equipment', cost: 3, atkBuff: 2, hpBuff: 2, text: 'Equip: +2/+2' },
};
export const ARTIFACTS: Record<string, CardTemplate> = {
  'blood-altar': { name: 'Blood Altar', type: 'Artifact', cost: 3, text: 'At end of turn, pay 2 HP to draw a card' },
  'swarm-totem': { name: 'Swarm Totem', type: 'Artifact', cost: 2, text: 'Your Mites have +1/+1' },
};
const ARCHETYPE_DECKS: Record<string, string[]> = {
  'Swarm Master': [ 'scuttle-mite', 'scuttle-mite', 'poison-mite', 'poison-mite', 'fire-imp', 'fire-imp', 'shadow-imp', 'wind-foliot', 'flame-djinn', 'inferno-afrit' ],
  'Blood Pact': [ 'shadow-imp', 'shadow-imp', 'dust-foliot', 'wind-foliot', 'flame-djinn', 'storm-djinn', 'inferno-afrit', 'void-afrit', 'titan-marid', 'ancient-marid' ],
  'Binder': [ 'fire-imp', 'shadow-imp', 'dust-foliot', 'dust-foliot', 'wind-foliot', 'flame-djinn', 'storm-djinn', 'inferno-afrit', 'void-afrit', 'titan-marid' ],
  'Shaman': [ 'scuttle-mite', 'poison-mite', 'fire-imp', 'dust-foliot', 'wind-foliot', 'flame-djinn', 'storm-djinn', 'inferno-afrit', 'void-afrit', 'ancient-marid' ],
};
const NEUTRAL_SPELLS: string[] = [ 'banishment', 'soul-drain', 'summoning-ritual', 'summoning-ritual', 'soul-drain' ];
const NEUTRAL_EQUIPMENT: string[] = [ 'flame-whip', 'flame-whip', 'iron-armor', 'iron-armor', 'solomons-ring' ];
const ALL_TEMPLATES: Record<string, CardTemplate> = { ...SPIRITS, ...INCANTATIONS, ...EQUIPMENT, ...ARTIFACTS };

export function buildDeckForArchetype(archetype: string): Omit<CardData, 'summoningSick' | 'canAttack' | 'stunned'>[] {
    const templateIds = [ ...(ARCHETYPE_DECKS[archetype] ?? []), ...NEUTRAL_SPELLS, ...NEUTRAL_EQUIPMENT ];
    return templateIds.map(id => ({ id, ...ALL_TEMPLATES[id] }));
}
