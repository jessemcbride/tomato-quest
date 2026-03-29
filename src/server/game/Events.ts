export interface EventChoice {
  id: string;
  text: string;
  outcome: EventOutcome;
}

export interface EventOutcome {
  description: string;
  hpChange?: number;       // positive = heal, negative = damage
  goldChange?: number;
  addCard?: string;        // card id
  removeCard?: boolean;    // player chooses a card to remove
  addRelic?: boolean;      // grant a random relic
  maxHpChange?: number;
  energyNextCombat?: number;
}

export interface EventDefinition {
  id: string;
  title: string;
  description: string;
  choices: EventChoice[];
  ascii?: string[];
}

const eventDefinitions: EventDefinition[] = [
  {
    id: 'haunted_office',
    title: 'The Haunted Office',
    description:
      'You stumble into an abandoned cubicle. The ghost of a burned-out developer stares at you. ' +
      'A stack of unfinished tickets floats in the air.',
    choices: [
      {
        id: 'offer_help',
        text: 'Offer to finish the tickets (lose 10 HP, gain 50 gold)',
        outcome: {
          description: 'You toil through the tickets. The ghost nods gratefully and vanishes, leaving a pile of gold.',
          hpChange: -10,
          goldChange: 50,
        },
      },
      {
        id: 'flee',
        text: 'Quietly back away (nothing happens)',
        outcome: {
          description: 'You slowly retreat. The ghost resumes scrolling through infinite Jira tickets.',
        },
      },
      {
        id: 'absorb',
        text: 'Absorb the developer\'s knowledge (gain a random card, lose 15 HP)',
        outcome: {
          description: 'Ancient code wisdom flows into your mind. It hurts.',
          hpChange: -15,
          addCard: 'deep_flow',
        },
      },
    ],
  },

  {
    id: 'vending_machine',
    title: 'Mysterious Vending Machine',
    description:
      'A vending machine hums in the corridor. One button says "ENERGY DRINK", another says "MYSTERY SNACK".',
    choices: [
      {
        id: 'energy_drink',
        text: 'Energy Drink (spend 30 gold, gain 1 extra energy next combat)',
        outcome: {
          description: 'You chug the drink. Your heart races but your focus sharpens.',
          goldChange: -30,
          energyNextCombat: 1,
        },
      },
      {
        id: 'mystery_snack',
        text: 'Mystery Snack (free, heal 8 HP or take 5 damage, 50/50)',
        outcome: {
          description: 'You unwrap the snack. Either it heals you or it doesn\'t.',
          hpChange: Math.random() < 0.5 ? 8 : -5,
        },
      },
      {
        id: 'ignore',
        text: 'Walk past (nothing happens)',
        outcome: {
          description: 'You resist the temptation. Probably smart.',
        },
      },
    ],
  },

  {
    id: 'library',
    title: 'The Forbidden Library',
    description:
      'Rows of ancient documentation line the walls. Most of it is outdated. A single shimmering tome rests on a pedestal.',
    choices: [
      {
        id: 'read_tome',
        text: 'Read the shimmering tome (gain a rare card, lose max HP by 5)',
        outcome: {
          description: 'The forbidden knowledge is yours, but it takes its toll.',
          addCard: 'the_zone',
          maxHpChange: -5,
        },
      },
      {
        id: 'study_docs',
        text: 'Study the documentation (heal 12 HP)',
        outcome: {
          description: 'Surprisingly, reading the docs helps. You feel refreshed.',
          hpChange: 12,
        },
      },
      {
        id: 'burn_docs',
        text: 'Burn the outdated docs (remove a card from your deck)',
        outcome: {
          description: 'The flames consume the useless knowledge. Your deck grows leaner.',
          removeCard: true,
        },
      },
    ],
  },

  {
    id: 'productivity_shrine',
    title: 'Productivity Shrine',
    description:
      'A small altar adorned with tomatoes, hourglasses, and motivational posters. It pulses with orange energy.',
    choices: [
      {
        id: 'pray',
        text: 'Pray at the shrine (gain a relic)',
        outcome: {
          description: 'The shrine blesses you with a productivity artifact.',
          addRelic: true,
        },
      },
      {
        id: 'donate',
        text: 'Donate gold (spend 50 gold, heal 20 HP)',
        outcome: {
          description: 'The shrine accepts your offering. You feel renewed energy.',
          goldChange: -50,
          hpChange: 20,
        },
      },
    ],
  },

  {
    id: 'scrum_master',
    title: 'The Rogue Scrum Master',
    description:
      'A wild Scrum Master appears! "This will only take a minute!" they say. It has never taken only a minute.',
    choices: [
      {
        id: 'attend',
        text: 'Attend the standup (lose 1 turn in next combat, gain 40 gold)',
        outcome: {
          description: 'You suffer through it. At least the stipend was good.',
          goldChange: 40,
          energyNextCombat: -1,
        },
      },
      {
        id: 'decline',
        text: 'Decline firmly (take 12 damage from passive-aggressive aura)',
        outcome: {
          description: 'The Scrum Master radiates disappointment. It hurts.',
          hpChange: -12,
        },
      },
      {
        id: 'async',
        text: 'Suggest going async (nothing bad happens, gain 25 gold)',
        outcome: {
          description: 'A reasonable compromise! The Scrum Master reluctantly agrees.',
          goldChange: 25,
        },
      },
    ],
  },

  {
    id: 'cursed_keyboard',
    title: 'The Cursed Keyboard',
    description:
      'A mechanical keyboard glows with an eerie light. Each keystroke echoes ominously. The spacebar is sticky.',
    choices: [
      {
        id: 'type',
        text: 'Type on it (gain a card, take 10 damage)',
        outcome: {
          description: 'You type furiously. An idea manifests—but your fingers bleed.',
          hpChange: -10,
          addCard: 'brainstorm_plus',
        },
      },
      {
        id: 'smash',
        text: 'Smash it (gain 35 gold)',
        outcome: {
          description: 'Cathartic. Expensive to replace, but cathartic.',
          goldChange: 35,
        },
      },
      {
        id: 'clean',
        text: 'Clean the spacebar (heal 10 HP)',
        outcome: {
          description: 'Disgusting work, but oddly satisfying. You feel better.',
          hpChange: 10,
        },
      },
    ],
  },
];

export function getRandomEvent(): EventDefinition {
  return eventDefinitions[Math.floor(Math.random() * eventDefinitions.length)];
}

export function getEventById(id: string): EventDefinition | undefined {
  return eventDefinitions.find(e => e.id === id);
}

// Resolve random outcomes (mystery snack etc.) at choice time, not definition time
export function resolveEventChoice(event: EventDefinition, choiceId: string): EventOutcome | undefined {
  const choice = event.choices.find(c => c.id === choiceId);
  if (!choice) return undefined;

  const outcome = { ...choice.outcome };

  // Special: mystery snack random outcome
  if (event.id === 'vending_machine' && choiceId === 'mystery_snack') {
    outcome.hpChange = Math.random() < 0.5 ? 8 : -5;
    if (outcome.hpChange > 0) {
      outcome.description = 'It\'s delicious and nutritious! You heal 8 HP.';
    } else {
      outcome.description = 'It tastes like regret. You take 5 damage.';
    }
  }

  return outcome;
}

export function renderEvent(event: EventDefinition): string[] {
  const lines: string[] = [];
  lines.push('');
  lines.push('╔══════════════════════════════════════════╗');
  lines.push(`║  ??? EVENT: ${event.title.padEnd(29)}║`);
  lines.push('╠══════════════════════════════════════════╣');

  // Word wrap description
  const words = event.description.split(' ');
  let line = '║  ';
  for (const word of words) {
    if (line.length + word.length + 1 > 44) {
      lines.push(line.padEnd(44) + '║');
      line = '║  ' + word + ' ';
    } else {
      line += word + ' ';
    }
  }
  if (line.trim() !== '║') lines.push(line.padEnd(44) + '║');

  lines.push('╠══════════════════════════════════════════╣');
  for (let i = 0; i < event.choices.length; i++) {
    const choiceText = `${i + 1}. ${event.choices[i].text}`;
    lines.push(`║  ${choiceText.padEnd(42)}║`);
  }
  lines.push('╚══════════════════════════════════════════╝');
  lines.push('');
  lines.push('Type: event 1 / event 2 / event 3 to choose');
  return lines;
}
