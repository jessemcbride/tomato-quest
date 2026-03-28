export interface Relic {
  id: string;
  name: string;
  description: string;
  flavorText: string;
}

export interface RelicEffects {
  startCombatEnergy?: number;   // extra energy at start of combat
  startCombatBlock?: number;    // block at start of combat
  immuneToDistraction?: boolean;
  hpPerRoom?: number;           // heal per room completed
  firstAttackBonus?: number;    // multiplier (50 = 50% bonus = 1.5x)
  startCombatDraw?: number;     // extra cards drawn at start of combat
  goldMultiplier?: number;      // multiplier on gold rewards (100 = 100%, no bonus)
}

const relicDefinitions: Record<string, Relic & RelicEffects> = {
  coffee_mug: {
    id: 'coffee_mug',
    name: 'Coffee Mug',
    description: 'Start each combat with 1 extra energy.',
    flavorText: '"Freshly brewed motivation."',
    startCombatEnergy: 1,
  },
  standing_desk: {
    id: 'standing_desk',
    name: 'Standing Desk',
    description: 'Start each combat with 5 Block.',
    flavorText: '"Ergonomically defeating evil."',
    startCombatBlock: 5,
  },
  noise_canceling_headphones: {
    id: 'noise_canceling_headphones',
    name: 'Noise-Canceling Headphones',
    description: 'Immune to Distraction cards.',
    flavorText: '"The world fades away."',
    immuneToDistraction: true,
  },
  pomodoro_clock: {
    id: 'pomodoro_clock',
    name: 'Pomodoro Clock',
    description: 'Gain 1 HP per room completed.',
    flavorText: '"Tick tock. Every second counts."',
    hpPerRoom: 1,
  },
  focus_playlist: {
    id: 'focus_playlist',
    name: 'Focus Playlist',
    description: 'First attack each turn deals 50% more damage.',
    flavorText: '"Lo-fi beats to fight monsters to."',
    firstAttackBonus: 50,
  },
  lucky_tomato: {
    id: 'lucky_tomato',
    name: 'Lucky Tomato',
    description: 'Start combat drawing 1 extra card.',
    flavorText: '"A tomato? In a dungeon? Must be fate."',
    startCombatDraw: 1,
  },
  productivity_journal: {
    id: 'productivity_journal',
    name: 'Productivity Journal',
    description: 'Earn 25% more gold.',
    flavorText: '"Today I will achieve everything."',
    goldMultiplier: 25,
  },
};

export function getRelicDef(id: string): (Relic & RelicEffects) | undefined {
  return relicDefinitions[id];
}

export function getRelicPool(): string[] {
  return Object.keys(relicDefinitions);
}

export function getRandomRelic(excludeIds: string[] = []): string {
  const pool = getRelicPool().filter(id => !excludeIds.includes(id));
  if (pool.length === 0) return 'coffee_mug';
  return pool[Math.floor(Math.random() * pool.length)];
}

export function computeRelicEffects(relicIds: string[]): RelicEffects {
  const effects: RelicEffects = {
    startCombatEnergy: 0,
    startCombatBlock: 0,
    immuneToDistraction: false,
    hpPerRoom: 0,
    firstAttackBonus: 0,
    startCombatDraw: 0,
    goldMultiplier: 100,
  };

  for (const id of relicIds) {
    const def = getRelicDef(id);
    if (!def) continue;
    if (def.startCombatEnergy) effects.startCombatEnergy! += def.startCombatEnergy;
    if (def.startCombatBlock) effects.startCombatBlock! += def.startCombatBlock;
    if (def.immuneToDistraction) effects.immuneToDistraction = true;
    if (def.hpPerRoom) effects.hpPerRoom! += def.hpPerRoom;
    if (def.firstAttackBonus) effects.firstAttackBonus! += def.firstAttackBonus;
    if (def.startCombatDraw) effects.startCombatDraw! += def.startCombatDraw;
    if (def.goldMultiplier) effects.goldMultiplier! += def.goldMultiplier - 100; // add bonus
  }

  return effects;
}
