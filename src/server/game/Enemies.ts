export type EnemyStatus = 'vulnerable' | 'weak' | 'burning' | 'stunned';

export interface EnemyInstance {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  block: number;
  statuses: Map<EnemyStatus, number>;
  // AI state
  turnNumber: number;
  nextIntentIndex: number;
  drawCountThisTurn: number; // for Social Media Hydra
  // Definition reference
  defId: string;
}

export interface EnemyAction {
  name: string;
  description: string;
  execute: (enemy: EnemyInstance, playerHp: number, playerBlock: number, drawCount?: number) => EnemyActionResult;
}

export interface EnemyActionResult {
  damage?: number;
  block?: number;
  addStatusCard?: string;   // adds to player discard
  stun?: boolean;           // stun the player for 1 turn
  attackBoost?: number;     // permanent atk boost to enemy
  special?: string;
}

export interface EnemyDefinition {
  id: string;
  name: string;
  maxHp: number;
  isBoss: boolean;
  description: string;
  actions: EnemyAction[];
  onPlayerDraw?: (enemy: EnemyInstance, drawCount: number) => void;
}

// ---- Enemy Definitions ----

const enemyDefinitions: Record<string, EnemyDefinition> = {
  procrastination_blob: {
    id: 'procrastination_blob',
    name: 'Procrastination Blob',
    maxHp: 30,
    isBoss: false,
    description: 'A gelatinous mass of unfinished tasks.',
    actions: [
      {
        name: 'Slouch',
        description: 'Attacks for 8 damage',
        execute: () => ({ damage: 8 }),
      },
      {
        name: 'Distract',
        description: 'Adds Distraction to your discard pile',
        execute: () => ({ addStatusCard: 'distraction' }),
      },
      {
        name: 'Slouch',
        description: 'Attacks for 8 damage',
        execute: () => ({ damage: 8 }),
      },
      {
        name: 'Slobber',
        description: 'Attacks for 5 damage',
        execute: () => ({ damage: 5 }),
      },
    ],
  },

  social_media_hydra: {
    id: 'social_media_hydra',
    name: 'Social Media Hydra',
    maxHp: 45,
    isBoss: false,
    description: 'Grows stronger with each card you draw.',
    actions: [
      {
        name: 'Scroll',
        description: 'Attacks for 6 damage',
        execute: () => ({ damage: 6 }),
      },
      {
        name: 'Like Spam',
        description: 'Attacks for 6 damage',
        execute: () => ({ damage: 6 }),
      },
      {
        name: 'Trending',
        description: 'Attacks for 10 damage',
        execute: () => ({ damage: 10 }),
      },
    ],
    onPlayerDraw: (enemy) => {
      // Each draw boosts its future attacks by 2 (tracked as stacks)
      const current = enemy.statuses.get('burning') ?? 0;
      enemy.statuses.set('burning', current + 2);
    },
  },

  meeting_minotaur: {
    id: 'meeting_minotaur',
    name: 'Meeting Minotaur',
    maxHp: 60,
    isBoss: false,
    description: 'Will schedule a mandatory meeting to waste your turn.',
    actions: [
      {
        name: 'Charge',
        description: 'Attacks for 12 damage',
        execute: () => ({ damage: 12 }),
      },
      {
        name: 'Mandatory Meeting',
        description: 'Stuns you for 1 turn',
        execute: () => ({ stun: true }),
      },
      {
        name: 'Charge',
        description: 'Attacks for 12 damage',
        execute: () => ({ damage: 12 }),
      },
      {
        name: 'Charge',
        description: 'Attacks for 15 damage',
        execute: () => ({ damage: 15 }),
      },
    ],
  },

  deadline_demon: {
    id: 'deadline_demon',
    name: 'Deadline Demon',
    maxHp: 80,
    isBoss: true,
    description: 'Boss. Deals increasing damage each turn.',
    actions: [
      {
        name: 'Loom',
        description: 'Attacks for 10 damage',
        execute: (enemy) => ({ damage: 10 + enemy.turnNumber * 3 }),
      },
      {
        name: 'Loom',
        description: 'Attacks for 10 damage',
        execute: (enemy) => ({ damage: 10 + enemy.turnNumber * 3 }),
      },
      {
        name: 'Crunch Time',
        description: 'Attacks for 15 damage and blocks 10',
        execute: (enemy) => ({ damage: 15 + enemy.turnNumber * 2, block: 10 }),
      },
    ],
  },

  procrastination_demon: {
    id: 'procrastination_demon',
    name: 'Procrastination Demon',
    maxHp: 100,
    isBoss: true,
    description: 'The timer boss. Appears when the Pomodoro expires. VERY dangerous.',
    actions: [
      {
        name: 'Wasted Time',
        description: 'Attacks for 20 damage',
        execute: (enemy) => ({ damage: 20 + enemy.turnNumber * 5 }),
      },
      {
        name: 'Distract Wave',
        description: 'Adds 3 Distractions to discard and attacks',
        execute: (enemy) => ({ damage: 15 + enemy.turnNumber * 3, addStatusCard: 'distraction', special: 'add3distractions' }),
      },
      {
        name: 'Wasted Time',
        description: 'Attacks for 20 damage',
        execute: (enemy) => ({ damage: 20 + enemy.turnNumber * 5 }),
      },
      {
        name: 'Overwhelm',
        description: 'Attacks for 30 damage',
        execute: (enemy) => ({ damage: 30 + enemy.turnNumber * 4, block: 15 }),
      },
    ],
  },

  // Elite enemies
  burnout_boss: {
    id: 'burnout_boss',
    name: 'Burnout Specter',
    maxHp: 55,
    isBoss: false,
    description: 'Elite. Applies Burnout to drain your HP over time.',
    actions: [
      {
        name: 'Drain',
        description: 'Attacks for 10 and applies Burnout',
        execute: () => ({ damage: 10, special: 'apply_burnout' }),
      },
      {
        name: 'Drain',
        description: 'Attacks for 10 and applies Burnout',
        execute: () => ({ damage: 10, special: 'apply_burnout' }),
      },
      {
        name: 'Leech',
        description: 'Attacks for 14 damage',
        execute: () => ({ damage: 14 }),
      },
    ],
  },
};

export function getEnemyDef(id: string): EnemyDefinition {
  const def = enemyDefinitions[id];
  if (!def) throw new Error(`Unknown enemy: ${id}`);
  return def;
}

export function spawnEnemy(defId: string): EnemyInstance {
  const def = getEnemyDef(defId);
  return {
    id: defId,
    name: def.name,
    hp: def.maxHp,
    maxHp: def.maxHp,
    block: 0,
    statuses: new Map(),
    turnNumber: 0,
    nextIntentIndex: 0,
    drawCountThisTurn: 0,
    defId,
  };
}

export function getEnemyNextIntent(enemy: EnemyInstance): EnemyAction {
  const def = getEnemyDef(enemy.defId);
  return def.actions[enemy.nextIntentIndex % def.actions.length];
}

export function advanceEnemyIntent(enemy: EnemyInstance): void {
  const def = getEnemyDef(enemy.defId);
  enemy.nextIntentIndex = (enemy.nextIntentIndex + 1) % def.actions.length;
  enemy.turnNumber++;
}

export function getNormalEnemiesForFloor(floor: number): string[] {
  if (floor === 1) return ['procrastination_blob', 'procrastination_blob'];
  if (floor === 2) return ['procrastination_blob', 'social_media_hydra', 'meeting_minotaur'];
  if (floor === 3) return ['social_media_hydra', 'meeting_minotaur', 'burnout_boss'];
  return ['meeting_minotaur', 'burnout_boss', 'social_media_hydra'];
}

export function getBossForFloor(floor: number, timerExpired: boolean): string {
  if (timerExpired) return 'procrastination_demon';
  return 'deadline_demon';
}

export function getEliteEnemyForFloor(_floor: number): string {
  return 'burnout_boss';
}

export function renderHpBar(hp: number, maxHp: number, width: number = 20): string {
  const filled = Math.round((hp / maxHp) * width);
  const empty = width - filled;
  return '[' + '█'.repeat(filled) + '░'.repeat(empty) + ']';
}
