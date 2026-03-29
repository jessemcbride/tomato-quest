import {
  Card,
  CardContext,
  CardResult,
  createCard,
  getCardBaseId,
  getCardDef,
  getUpgradedId,
  shuffleDeck,
} from './Cards';
import {
  EnemyInstance,
  spawnEnemy,
  getEnemyDef,
  getEnemyNextIntent,
  advanceEnemyIntent,
  renderHpBar,
} from './Enemies';
import { computeRelicEffects } from './Relics';

export interface CombatState {
  enemy: EnemyInstance;
  drawPile: Card[];
  hand: Card[];
  discardPile: Card[];
  exhaustPile: Card[];
  energy: number;
  maxEnergy: number;
  playerBlock: number;
  turnNumber: number;
  cardsPlayedThisTurn: number;
  firstAttackThisTurn: boolean;
  stunned: boolean;        // player stunned this turn
  burnoutStacks: number;   // player burnout (lose HP per turn)
  zoneModeActive: boolean; // The Zone - focus costs 0
  nextFocusFree: boolean;  // Deep Flow effect
  ended: boolean;
  victory: boolean;
  goldReward: number;
}

export interface CombatMessage {
  lines: string[];
  combatEnded?: boolean;
  victory?: boolean;
}

export function startCombat(
  enemyId: string,
  fullDeck: Card[],
  playerHp: number,
  playerMaxHp: number,
  relicIds: string[],
  goldMultiplier: number = 100,
): CombatState {
  const relics = computeRelicEffects(relicIds);
  const baseEnergy = 3 + (relics.startCombatEnergy ?? 0);
  const enemy = spawnEnemy(enemyId);

  const drawPile = shuffleDeck([...fullDeck]);
  const hand: Card[] = [];
  const discardPile: Card[] = [];
  const exhaustPile: Card[] = [];

  const state: CombatState = {
    enemy,
    drawPile,
    hand,
    discardPile,
    exhaustPile,
    energy: baseEnergy,
    maxEnergy: baseEnergy,
    playerBlock: relics.startCombatBlock ?? 0,
    turnNumber: 0,
    cardsPlayedThisTurn: 0,
    firstAttackThisTurn: true,
    stunned: false,
    burnoutStacks: 0,
    zoneModeActive: false,
    nextFocusFree: false,
    ended: false,
    victory: false,
    goldReward: 0,
  };

  // Draw starting hand (5 + relic bonus)
  const drawCount = 5 + (relics.startCombatDraw ?? 0);
  drawCards(state, drawCount, playerHp, playerMaxHp, relicIds);

  return state;
}

export function drawCards(
  state: CombatState,
  count: number,
  playerHp: number,
  playerMaxHp: number,
  relicIds: string[],
): string[] {
  const relics = computeRelicEffects(relicIds);
  const messages: string[] = [];

  for (let i = 0; i < count; i++) {
    if (state.drawPile.length === 0) {
      if (state.discardPile.length === 0) break;
      // Reshuffle discard into draw
      state.drawPile = shuffleDeck([...state.discardPile]);
      state.discardPile = [];
      messages.push('  (Reshuffled discard pile into draw pile.)');
    }
    const card = state.drawPile.shift()!;

    // Handle distraction card
    if (getCardBaseId(card) === 'distraction') {
      if (relics.immuneToDistraction) {
        messages.push('  [Headphones] Distraction card ignored!');
        state.exhaustPile.push(card);
        continue;
      }
      state.energy = Math.max(0, state.energy - 1);
      messages.push('  Distraction card drawn! Lose 1 energy. (Exhausted)');
      state.exhaustPile.push(card);
      continue;
    }

    state.hand.push(card);

    // Social Media Hydra effect
    if (state.enemy.defId === 'social_media_hydra') {
      const def = getEnemyDef(state.enemy.defId);
      def.onPlayerDraw?.(state.enemy, 1);
    }
  }

  return messages;
}

export function playCard(
  state: CombatState,
  cardIndex: number, // 1-based
  playerHp: number,
  playerMaxHp: number,
  relicIds: string[],
): CombatMessage {
  const lines: string[] = [];
  const relics = computeRelicEffects(relicIds);

  if (state.ended) return { lines: ['Combat is already over.'] };
  if (state.stunned) return { lines: ['You are stunned! End your turn to recover.'] };

  const handIndex = cardIndex - 1;
  if (handIndex < 0 || handIndex >= state.hand.length) {
    return { lines: [`No card at position ${cardIndex}. Hand has ${state.hand.length} cards.`] };
  }

  const card = state.hand[handIndex];
  const baseId = getCardBaseId(card);
  const cardDef = getCardDef(baseId);
  if (!cardDef) return { lines: [`Unknown card base id: ${baseId}`] };

  // Determine effective cost
  let cost = card.cost;
  if (state.zoneModeActive && (baseId === 'focus' || baseId === 'focus_plus')) cost = 0;
  if (state.nextFocusFree && (baseId === 'focus' || baseId === 'focus_plus')) {
    cost = 0;
    state.nextFocusFree = false;
  }

  if (state.energy < cost) {
    return { lines: [`Not enough energy. Need ${cost}, have ${state.energy}.`] };
  }

  // Pay cost
  state.energy -= cost;

  // Remove from hand
  state.hand.splice(handIndex, 1);

  // Build context
  const ctx: CardContext = {
    playerHp,
    playerMaxHp,
    playerEnergy: state.energy,
    playerBlock: state.playerBlock,
    handSize: state.hand.length,
    discardSize: state.discardPile.length,
    exhaustSize: state.exhaustPile.length,
    relics: relicIds,
    turnNumber: state.turnNumber,
    cardsPlayedThisTurn: state.cardsPlayedThisTurn,
  };

  const result: CardResult = card.effect(ctx);

  lines.push(`You play ${card.name}...`);

  // Apply damage
  if (result.damage !== undefined && result.damage > 0) {
    let dmg = result.damage;
    // Focus Playlist: first attack bonus
    if (state.firstAttackThisTurn && relics.firstAttackBonus && relics.firstAttackBonus > 0) {
      dmg = Math.floor(dmg * (1 + relics.firstAttackBonus / 100));
      lines.push(`  [Focus Playlist] First attack bonus! ${result.damage} -> ${dmg} damage`);
      state.firstAttackThisTurn = false;
    } else if (card.type === 'attack') {
      state.firstAttackThisTurn = false;
    }

    // Vulnerable multiplier
    if (state.enemy.statuses.get('vulnerable')) {
      dmg = Math.floor(dmg * 1.5);
      lines.push(`  Enemy is Vulnerable! ${result.damage} -> ${dmg} damage`);
    }

    // Apply to enemy block first
    if (state.enemy.block > 0) {
      const blocked = Math.min(state.enemy.block, dmg);
      state.enemy.block -= blocked;
      dmg -= blocked;
      if (blocked > 0) lines.push(`  Enemy blocks ${blocked} damage.`);
    }

    state.enemy.hp = Math.max(0, state.enemy.hp - dmg);
    lines.push(`  Dealt ${dmg} damage. Enemy: ${state.enemy.hp}/${state.enemy.maxHp} HP`);

    if (state.enemy.hp <= 0) {
      state.ended = true;
      state.victory = true;
      const goldBase = getGoldReward(state.enemy);
      state.goldReward = Math.floor(goldBase * (relics.goldMultiplier ?? 100) / 100);
      lines.push('');
      lines.push(`*** ${state.enemy.name} is defeated! ***`);
      return { lines, combatEnded: true, victory: true };
    }
  }

  // Apply block
  if (result.block !== undefined && result.block > 0) {
    state.playerBlock += result.block;
    lines.push(`  Gained ${result.block} armor. Total: ${state.playerBlock}`);
  }

  // Apply vulnerable to enemy
  if (result.applyVulnerable) {
    state.enemy.statuses.set('vulnerable', 2);
    lines.push(`  ${state.enemy.name} is now Vulnerable for 2 turns!`);
  }

  // Apply weak to enemy
  if (result.applyWeak) {
    state.enemy.statuses.set('weak', 2);
    lines.push(`  ${state.enemy.name} is now Weak for 2 turns!`);
  }

  // Gain energy
  if (result.gainEnergy !== undefined && result.gainEnergy > 0) {
    state.energy += result.gainEnergy;
    lines.push(`  Gained ${result.gainEnergy} energy. Total: ${state.energy}`);
  }

  // Draw cards
  if (result.draw !== undefined && result.draw > 0) {
    const drawMsgs = drawCards(state, result.draw, playerHp, playerMaxHp, relicIds);
    lines.push(`  Drew ${result.draw} card(s).`);
    lines.push(...drawMsgs);
  }

  // Add cards to hand
  if (result.addToHand && result.addToHand.length > 0) {
    for (const cardId of result.addToHand) {
      const newCard = createCard(cardId);
      state.hand.push(newCard);
      lines.push(`  Added ${newCard.name} to hand.`);
    }
  }

  // Heal
  if (result.heal !== undefined && result.heal > 0) {
    lines.push(`  HEAL_${result.heal}`); // signal to GameSession to heal
  }

  // Special effects
  if (result.special) {
    switch (result.special) {
      case 'the_zone':
        state.zoneModeActive = true;
        lines.push('  You enter The Zone! Focus cards cost 0 until end of turn.');
        break;
      case 'context_switch': {
        // Remove all status cards from hand
        const statusCards = state.hand.filter(c => getCardBaseId(c) === 'distraction');
        for (const sc of statusCards) {
          state.hand.splice(state.hand.indexOf(sc), 1);
          state.exhaustPile.push(sc);
        }
        const statusDiscard = state.discardPile.filter(c => getCardBaseId(c) === 'distraction');
        for (const sc of statusDiscard) {
          state.discardPile.splice(state.discardPile.indexOf(sc), 1);
          state.exhaustPile.push(sc);
        }
        lines.push(`  Context Switch! Removed ${statusCards.length + statusDiscard.length} status card(s). Gained 2 energy.`);
        break;
      }
      case 'deep_flow':
        state.nextFocusFree = true;
        lines.push('  Deep Flow! Your next Focus card costs 0.');
        break;
      case 'distraction':
        // Already handled on draw - but if somehow played
        lines.push('  Distraction exhausted.');
        break;
      case 'add3distractions':
        // Enemy action special - won't be called from here
        break;
    }
  }

  // Exhaust card
  if (result.exhaustSelf || card.exhausts) {
    state.exhaustPile.push(card);
    lines.push(`  ${card.name} exhausted.`);
  } else {
    state.discardPile.push(card);
  }

  state.cardsPlayedThisTurn++;

  return { lines };
}

export function enemyTurn(
  state: CombatState,
  playerHp: number,
  playerMaxHp: number,
): { lines: string[]; hpChange: number; combatEnded?: boolean } {
  const lines: string[] = [];
  let hpChange = 0;

  if (state.ended) return { lines: ['Combat already ended.'], hpChange: 0 };

  if (state.stunned) {
    lines.push(`${state.enemy.name} looks confused... You recover from stun.`);
    state.stunned = false;
    advanceEnemyIntent(state.enemy);
    return { lines, hpChange: 0 };
  }

  const action = getEnemyNextIntent(state.enemy);
  lines.push(`${state.enemy.name} uses ${action.name}!`);

  const result = action.execute(state.enemy, playerHp, playerMaxHp);

  // Enemy gains block
  if (result.block) {
    state.enemy.block += result.block;
    lines.push(`  ${state.enemy.name} gains ${result.block} block. (Total: ${state.enemy.block})`);
  }

  // Enemy attacks
  if (result.damage && result.damage > 0) {
    let dmg = result.damage;

    // Social Media Hydra draw bonus
    if (state.enemy.defId === 'social_media_hydra') {
      const bonus = state.enemy.statuses.get('burning') ?? 0;
      if (bonus > 0) {
        dmg += bonus;
        lines.push(`  [Enraged] +${bonus} from cards drawn this combat!`);
      }
    }

    // Apply player block
    if (state.playerBlock > 0) {
      const blocked = Math.min(state.playerBlock, dmg);
      state.playerBlock -= blocked;
      dmg -= blocked;
      lines.push(`  Your armor blocks ${blocked} damage.`);
    }

    if (dmg > 0) {
      hpChange = -dmg;
      lines.push(`  You take ${dmg} damage!`);
    } else {
      lines.push('  Fully blocked!');
    }
  }

  // Status card added to player discard
  if (result.addStatusCard) {
    const count = result.special === 'add3distractions' ? 3 : 1;
    for (let i = 0; i < count; i++) {
      const statusCard = createCard(result.addStatusCard);
      state.discardPile.push(statusCard);
    }
    lines.push(`  Added ${count} ${result.addStatusCard} card(s) to your discard pile!`);
  }

  // Stun player
  if (result.stun) {
    state.stunned = true;
    lines.push('  You are STUNNED! Your next turn is skipped.');
  }

  // Apply burnout special
  if (result.special === 'apply_burnout') {
    state.burnoutStacks++;
    lines.push(`  You are afflicted with Burnout! (${state.burnoutStacks} stack${state.burnoutStacks > 1 ? 's' : ''})`);
  }

  advanceEnemyIntent(state.enemy);

  // Check player death
  const newHp = playerHp + hpChange;
  if (newHp <= 0) {
    state.ended = true;
    state.victory = false;
    return { lines, hpChange, combatEnded: true };
  }

  return { lines, hpChange };
}

export function startPlayerTurn(
  state: CombatState,
  playerHp: number,
  playerMaxHp: number,
  relicIds: string[],
): { lines: string[]; hpChange: number } {
  const lines: string[] = [];
  let hpChange = 0;

  state.turnNumber++;
  state.playerBlock = 0; // block resets each turn
  state.energy = state.maxEnergy;
  state.cardsPlayedThisTurn = 0;
  state.firstAttackThisTurn = true;
  state.zoneModeActive = false;

  // Burnout damage
  if (state.burnoutStacks > 0) {
    const burnDmg = state.burnoutStacks * 2;
    hpChange -= burnDmg;
    lines.push(`Burnout deals ${burnDmg} damage to you!`);
  }

  // Tick down enemy statuses
  const statuses = ['vulnerable', 'weak'] as const;
  for (const s of statuses) {
    const stacks = state.enemy.statuses.get(s);
    if (stacks && stacks > 0) {
      const newStacks = stacks - 1;
      if (newStacks <= 0) {
        state.enemy.statuses.delete(s);
        lines.push(`${state.enemy.name} is no longer ${s}.`);
      } else {
        state.enemy.statuses.set(s, newStacks);
      }
    }
  }

  // Draw 5 cards
  const drawMsgs = drawCards(state, 5, playerHp + hpChange, playerMaxHp, relicIds);
  lines.push(...drawMsgs);

  return { lines, hpChange };
}

export function endPlayerTurn(
  state: CombatState,
  playerHp: number,
  playerMaxHp: number,
): string[] {
  const lines: string[] = [];

  // Discard hand
  for (const card of state.hand) {
    state.discardPile.push(card);
  }
  state.hand = [];
  lines.push('Discarded hand.');

  return lines;
}

export function renderCombatState(
  state: CombatState,
  playerHp: number,
  playerMaxHp: number,
): string[] {
  const lines: string[] = [];
  const enemy = state.enemy;

  lines.push('');
  lines.push('╔══════════════════════════════════════════╗');
  lines.push(`║  COMBAT - Turn ${String(state.turnNumber).padEnd(25)}║`);
  lines.push('╠══════════════════════════════════════════╣');

  // Enemy section
  const enemyHpBar = renderHpBar(enemy.hp, enemy.maxHp, 20);
  lines.push(`║  ENEMY: ${enemy.name.padEnd(33)}║`);
  lines.push(`║  HP: ${enemyHpBar} ${String(enemy.hp).padStart(3)}/${enemy.maxHp}  ║`);
  if (enemy.block > 0) {
    lines.push(`║  Block: ${enemy.block}                              ║`);
  }

  // Enemy statuses
  const enemyStatuses: string[] = [];
  enemy.statuses.forEach((stacks, status) => {
    if (stacks > 0) enemyStatuses.push(`${status}(${stacks})`);
  });
  if (enemyStatuses.length > 0) {
    lines.push(`║  Status: ${enemyStatuses.join(', ').padEnd(33)}║`);
  }

  // Enemy intent
  const intent = getEnemyNextIntent(enemy);
  lines.push(`║  Next: ${intent.name} - ${intent.description}`.padEnd(44) + '║');

  lines.push('╠══════════════════════════════════════════╣');

  // Player section
  const playerHpBar = renderHpBar(playerHp, playerMaxHp, 20);
  lines.push(`║  YOU: HP ${playerHpBar} ${String(playerHp).padStart(3)}/${playerMaxHp}    ║`);
  lines.push(`║  Energy: ${'⚡'.repeat(state.energy)}${' '.repeat(Math.max(0, state.maxEnergy - state.energy))} (${state.energy}/${state.maxEnergy})`.padEnd(55) + '║');
  if (state.playerBlock > 0) {
    lines.push(`║  Block: ${state.playerBlock}                               ║`);
  }
  if (state.burnoutStacks > 0) {
    lines.push(`║  Burnout: ${state.burnoutStacks} stacks (${state.burnoutStacks * 2} dmg/turn)          ║`);
  }
  if (state.stunned) {
    lines.push('║  *** STUNNED - skip next turn ***         ║');
  }

  lines.push('╠══════════════════════════════════════════╣');

  // Hand
  lines.push(`║  HAND (${state.hand.length} cards):                         ║`);
  for (let i = 0; i < state.hand.length; i++) {
    const card = state.hand[i];
    const baseId = getCardBaseId(card);
    let cost = card.cost;
    if (state.zoneModeActive && (baseId === 'focus' || baseId === 'focus_plus')) cost = 0;
    if (state.nextFocusFree && (baseId === 'focus' || baseId === 'focus_plus')) cost = 0;
    const canPlay = state.energy >= cost;
    const mark = canPlay ? '>' : ' ';
    const cardLine = `  ${i + 1}. ${mark}[${cost}] ${card.name} - ${card.effect({
      playerHp,
      playerMaxHp,
      playerEnergy: state.energy,
      playerBlock: state.playerBlock,
      handSize: state.hand.length,
      discardSize: state.discardPile.length,
      exhaustSize: state.exhaustPile.length,
      relics: [],
      turnNumber: state.turnNumber,
      cardsPlayedThisTurn: state.cardsPlayedThisTurn,
    }).damage ? `${card.effect({ playerHp, playerMaxHp, playerEnergy: state.energy, playerBlock: state.playerBlock, handSize: state.hand.length, discardSize: state.discardPile.length, exhaustSize: state.exhaustPile.length, relics: [], turnNumber: state.turnNumber, cardsPlayedThisTurn: state.cardsPlayedThisTurn }).damage} dmg` : card.effect({ playerHp, playerMaxHp, playerEnergy: state.energy, playerBlock: state.playerBlock, handSize: state.hand.length, discardSize: state.discardPile.length, exhaustSize: state.exhaustPile.length, relics: [], turnNumber: state.turnNumber, cardsPlayedThisTurn: state.cardsPlayedThisTurn }).block ? `${card.effect({ playerHp, playerMaxHp, playerEnergy: state.energy, playerBlock: state.playerBlock, handSize: state.hand.length, discardSize: state.discardPile.length, exhaustSize: state.exhaustPile.length, relics: [], turnNumber: state.turnNumber, cardsPlayedThisTurn: state.cardsPlayedThisTurn }).block} block` : 'skill'}`;
    lines.push(`║${cardLine.padEnd(44)}║`);
  }

  lines.push(`║  Draw: ${state.drawPile.length} | Discard: ${state.discardPile.length} | Exhaust: ${state.exhaustPile.length}         ║`);
  lines.push('╚══════════════════════════════════════════╝');
  lines.push('');
  lines.push('Commands: play [1-9] (p#)  |  hand  |  end  |  status');

  return lines;
}

function getGoldReward(enemy: EnemyInstance): number {
  const def = getEnemyDef(enemy.defId);
  if (def.isBoss) return 80 + Math.floor(Math.random() * 40);
  if (enemy.defId === 'burnout_boss') return 50 + Math.floor(Math.random() * 20);
  return 15 + Math.floor(Math.random() * 15);
}

export function renderHandSimple(state: CombatState, playerHp: number, playerMaxHp: number): string[] {
  const lines: string[] = [];
  lines.push(`Your hand (Energy: ${state.energy}/${state.maxEnergy}, Block: ${state.playerBlock}):`);
  for (let i = 0; i < state.hand.length; i++) {
    const card = state.hand[i];
    const baseId = getCardBaseId(card);
    let cost = card.cost;
    if (state.zoneModeActive && (baseId === 'focus' || baseId === 'focus_plus')) cost = 0;
    const ctx: CardContext = {
      playerHp,
      playerMaxHp,
      playerEnergy: state.energy,
      playerBlock: state.playerBlock,
      handSize: state.hand.length,
      discardSize: state.discardPile.length,
      exhaustSize: state.exhaustPile.length,
      relics: [],
      turnNumber: state.turnNumber,
      cardsPlayedThisTurn: state.cardsPlayedThisTurn,
    };
    const result = card.effect(ctx);
    const effectDesc = result.damage ? `${result.damage} dmg`
      : result.block ? `${result.block} block`
      : result.draw ? `draw ${result.draw}`
      : result.gainEnergy ? `+${result.gainEnergy} energy`
      : 'effect';
    const canPlay = state.energy >= cost ? '*' : ' ';
    lines.push(`  ${canPlay}${i + 1}. [${cost}] ${card.name.padEnd(22)} ${effectDesc}`);
  }
  return lines;
}
