export type CardType = 'attack' | 'skill' | 'power' | 'status';
export type CardRarity = 'starter' | 'common' | 'uncommon' | 'rare' | 'status';

export interface Card {
  id: string;
  name: string;
  cost: number;
  type: CardType;
  rarity: CardRarity;
  description: string;
  upgraded: boolean;
  exhausts?: boolean;
  // Effects evaluated at play time
  effect: (ctx: CardContext) => CardResult;
}

export interface CardContext {
  playerHp: number;
  playerMaxHp: number;
  playerEnergy: number;
  playerBlock: number;
  handSize: number;
  discardSize: number;
  exhaustSize: number;
  relics: string[];
  turnNumber: number;
  cardsPlayedThisTurn: number;
}

export interface CardResult {
  damage?: number;
  block?: number;
  draw?: number;
  addToHand?: string[];   // card ids to add to hand
  gainEnergy?: number;
  heal?: number;
  applyVulnerable?: boolean;
  applyWeak?: boolean;
  special?: string;
  exhaustSelf?: boolean;
}

// ---- Card Definitions ----

const cardDefinitions: Record<string, Omit<Card, 'id' | 'upgraded'>> = {
  focus: {
    name: 'Focus',
    cost: 1,
    type: 'attack',
    rarity: 'starter',
    description: 'Deal 6 damage.',
    effect: () => ({ damage: 6 }),
  },
  focus_plus: {
    name: 'Focus+',
    cost: 1,
    type: 'attack',
    rarity: 'starter',
    description: 'Deal 9 damage.',
    effect: () => ({ damage: 9 }),
  },
  block: {
    name: 'Block',
    cost: 1,
    type: 'skill',
    rarity: 'starter',
    description: 'Gain 5 armor.',
    effect: () => ({ block: 5 }),
  },
  block_plus: {
    name: 'Block+',
    cost: 1,
    type: 'skill',
    rarity: 'starter',
    description: 'Gain 8 armor.',
    effect: () => ({ block: 8 }),
  },
  deep_work: {
    name: 'Deep Work',
    cost: 2,
    type: 'attack',
    rarity: 'starter',
    description: 'Deal 15 damage.',
    effect: () => ({ damage: 15 }),
  },
  deep_work_plus: {
    name: 'Deep Work+',
    cost: 2,
    type: 'attack',
    rarity: 'starter',
    description: 'Deal 22 damage.',
    effect: () => ({ damage: 22 }),
  },
  brainstorm: {
    name: 'Brainstorm',
    cost: 1,
    type: 'skill',
    rarity: 'starter',
    description: 'Draw 2 cards.',
    effect: () => ({ draw: 2 }),
  },
  brainstorm_plus: {
    name: 'Brainstorm+',
    cost: 0,
    type: 'skill',
    rarity: 'starter',
    description: 'Draw 2 cards.',
    effect: () => ({ draw: 2 }),
  },
  // Uncommon cards
  flow_state: {
    name: 'Flow State',
    cost: 2,
    type: 'attack',
    rarity: 'uncommon',
    description: 'Deal 20 damage. Draw 1 card.',
    effect: () => ({ damage: 20, draw: 1 }),
  },
  flow_state_plus: {
    name: 'Flow State+',
    cost: 2,
    type: 'attack',
    rarity: 'uncommon',
    description: 'Deal 25 damage. Draw 1 card.',
    effect: () => ({ damage: 25, draw: 1 }),
  },
  hyperfocus: {
    name: 'Hyperfocus',
    cost: 3,
    type: 'attack',
    rarity: 'uncommon',
    description: 'Deal 30 damage. Apply Vulnerable.',
    effect: () => ({ damage: 30, applyVulnerable: true }),
  },
  hyperfocus_plus: {
    name: 'Hyperfocus+',
    cost: 3,
    type: 'attack',
    rarity: 'uncommon',
    description: 'Deal 40 damage. Apply Vulnerable.',
    effect: () => ({ damage: 40, applyVulnerable: true }),
  },
  time_block: {
    name: 'Time Block',
    cost: 2,
    type: 'skill',
    rarity: 'uncommon',
    description: 'Gain 15 armor.',
    effect: () => ({ block: 15 }),
  },
  time_block_plus: {
    name: 'Time Block+',
    cost: 2,
    type: 'skill',
    rarity: 'uncommon',
    description: 'Gain 20 armor.',
    effect: () => ({ block: 20 }),
  },
  pomodoro_technique: {
    name: 'Pomodoro Technique',
    cost: 0,
    type: 'skill',
    rarity: 'uncommon',
    description: 'Add a Focus+ to your hand.',
    effect: () => ({ addToHand: ['focus_plus'] }),
  },
  pomodoro_technique_plus: {
    name: 'Pomodoro Technique+',
    cost: 0,
    type: 'skill',
    rarity: 'uncommon',
    description: 'Add 2 Focus+ cards to your hand.',
    effect: () => ({ addToHand: ['focus_plus', 'focus_plus'] }),
  },
  second_wind: {
    name: 'Second Wind',
    cost: 1,
    type: 'skill',
    rarity: 'uncommon',
    description: 'Gain 4 armor per exhausted card.',
    effect: (ctx) => ({ block: 4 * ctx.exhaustSize }),
  },
  second_wind_plus: {
    name: 'Second Wind+',
    cost: 1,
    type: 'skill',
    rarity: 'uncommon',
    description: 'Gain 6 armor per exhausted card.',
    effect: (ctx) => ({ block: 6 * ctx.exhaustSize }),
  },
  // Rare cards
  the_zone: {
    name: 'The Zone',
    cost: 3,
    type: 'power',
    rarity: 'rare',
    description: 'Until end of turn, Focus costs 0.',
    effect: () => ({ special: 'the_zone' }),
  },
  the_zone_plus: {
    name: 'The Zone+',
    cost: 2,
    type: 'power',
    rarity: 'rare',
    description: 'Until end of turn, Focus costs 0.',
    effect: () => ({ special: 'the_zone' }),
  },
  context_switch: {
    name: 'Context Switch',
    cost: 1,
    type: 'skill',
    rarity: 'rare',
    description: 'Remove all status cards from hand. Gain 2 energy.',
    effect: () => ({ special: 'context_switch', gainEnergy: 2 }),
  },
  context_switch_plus: {
    name: 'Context Switch+',
    cost: 0,
    type: 'skill',
    rarity: 'rare',
    description: 'Remove all status cards from hand. Gain 2 energy.',
    effect: () => ({ special: 'context_switch', gainEnergy: 2 }),
  },
  deadline_rush: {
    name: 'Deadline Rush',
    cost: 0,
    type: 'attack',
    rarity: 'rare',
    description: 'Deal damage equal to missing HP.',
    exhausts: true,
    effect: (ctx) => ({ damage: ctx.playerMaxHp - ctx.playerHp, exhaustSelf: true }),
  },
  deadline_rush_plus: {
    name: 'Deadline Rush+',
    cost: 0,
    type: 'attack',
    rarity: 'rare',
    description: 'Deal damage equal to missing HP x1.5.',
    exhausts: true,
    effect: (ctx) => ({ damage: Math.floor((ctx.playerMaxHp - ctx.playerHp) * 1.5), exhaustSelf: true }),
  },
  deep_flow: {
    name: 'Deep Flow',
    cost: 2,
    type: 'attack',
    rarity: 'rare',
    description: 'Deal 25 damage. Your next Focus costs 0.',
    effect: () => ({ damage: 25, special: 'deep_flow' }),
  },
  deep_flow_plus: {
    name: 'Deep Flow+',
    cost: 2,
    type: 'attack',
    rarity: 'rare',
    description: 'Deal 35 damage. Your next Focus costs 0.',
    effect: () => ({ damage: 35, special: 'deep_flow' }),
  },
  // Status cards (negative)
  distraction: {
    name: 'Distraction',
    cost: 0,
    type: 'status',
    rarity: 'status',
    description: 'When drawn, lose 1 energy. Exhausts.',
    exhausts: true,
    effect: () => ({ special: 'distraction', exhaustSelf: true }),
  },
};

let cardInstanceCounter = 0;

export function createCard(cardId: string): Card {
  const def = cardDefinitions[cardId];
  if (!def) throw new Error(`Unknown card id: ${cardId}`);
  return {
    ...def,
    id: `${cardId}_${++cardInstanceCounter}`,
    upgraded: cardId.endsWith('_plus'),
  };
}

export function getUpgradedId(cardId: string): string {
  // Strip instance suffix first
  const baseId = cardId.replace(/_\d+$/, '');
  if (baseId.endsWith('_plus')) return baseId; // already upgraded
  const upgradedId = baseId + '_plus';
  if (cardDefinitions[upgradedId]) return upgradedId;
  return baseId; // no upgrade exists
}

export function getStartingDeck(): Card[] {
  const cards: Card[] = [];
  // 4x Focus, 2x Block, 2x Deep Work, 2x Brainstorm
  for (let i = 0; i < 4; i++) cards.push(createCard('focus'));
  for (let i = 0; i < 2; i++) cards.push(createCard('block'));
  for (let i = 0; i < 2; i++) cards.push(createCard('deep_work'));
  for (let i = 0; i < 2; i++) cards.push(createCard('brainstorm'));
  return cards;
}

export function getUncommonCardPool(): string[] {
  return ['flow_state', 'hyperfocus', 'time_block', 'pomodoro_technique', 'second_wind'];
}

export function getRareCardPool(): string[] {
  return ['the_zone', 'context_switch', 'deadline_rush', 'deep_flow'];
}

export function getCardRewards(floor: number): Card[] {
  const rewards: Card[] = [];
  const rareChance = Math.min(0.1 + floor * 0.05, 0.4);
  for (let i = 0; i < 3; i++) {
    if (Math.random() < rareChance) {
      const pool = getRareCardPool();
      rewards.push(createCard(pool[Math.floor(Math.random() * pool.length)]));
    } else {
      const pool = getUncommonCardPool();
      rewards.push(createCard(pool[Math.floor(Math.random() * pool.length)]));
    }
  }
  return rewards;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function getCardBaseId(card: Card): string {
  // Extract base definition key from instance id
  return card.id.replace(/_\d+$/, '');
}

export function getCardDescription(cardId: string): string {
  const baseId = cardId.replace(/_\d+$/, '');
  return cardDefinitions[baseId]?.description ?? 'Unknown card';
}

export function getAllCardIds(): string[] {
  return Object.keys(cardDefinitions);
}

export function getCardDef(baseId: string) {
  return cardDefinitions[baseId];
}
