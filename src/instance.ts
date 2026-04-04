import type { CardData, ChampionData } from './types';

let cardInstanceCounter = 0;
export function createCardInstance<T extends Omit<CardData, 'id'> | Omit<ChampionData, 'id'>>(template: T): T & { id: string } {
    return {
        ...template,
        id: `${(template as any).name}-${cardInstanceCounter++}`,
    } as T & { id: string };
}
