import { create } from 'zustand';
import { Card, getStartingDeck, getCardRewards, createCard, getUpgradedId, getCardBaseId } from '../game/Cards';
import { CombatState, startCombat, playCard, endPlayerTurn, enemyTurn, startPlayerTurn, renderCombatState } from '../game/Combat';
import { DungeonMap, generateFloor, getAvailableNodes, moveToNode, renderMap, getPathChoices, MapNode } from '../game/Map';
import { EventDefinition, getRandomEvent, resolveEventChoice, renderEvent } from '../game/Events';
import { getRandomRelic, getRelicDef } from '../game/Relics';
import { PomodoroTimer, TimerState, TimerPhase } from '../game/Timer';
import { getNormalEnemiesForFloor, getBossForFloor, getEliteEnemyForFloor } from '../game/Enemies';
import { computeRelicEffects } from '../game/Relics';

export interface ShopItem {
  id: string;
  type: 'card' | 'relic' | 'heal';
  name: string;
  description: string;
  cost: number;
  cardInstance?: Card;
}

export type GamePhase =
  | 'title'
  | 'navigating'
  | 'combat'
  | 'event'
  | 'shop'
  | 'rest'
  | 'card_reward'
  | 'card_remove'
  | 'card_upgrade'
  | 'break_idle'
  | 'game_over'
  | 'victory';

export interface GameState {
  // Player
  hp: number;
  maxHp: number;
  gold: number;
  deck: Card[];
  relics: string[];
  floor: number;
  bonusEnergyNextCombat: number;

  // Game phase
  phase: GamePhase;

  // Sub-states
  map: DungeonMap | null;
  combat: CombatState | null;
  currentEvent: EventDefinition | null;
  shopItems: ShopItem[];
  rewardCards: Card[];
  timerExpiredThisFloor: boolean;

  // Timer
  timerState: TimerState;
  timer: PomodoroTimer;

  // Log
  log: string[];

  // Public actions
  handleCommand: (cmd: string) => void;
  addLog: (lines: string[]) => void;
  startRun: () => void;
  resetRun: () => void;
  skipBreak: () => void;

  // Internal store methods (not exported but needed for typing get())
  setTimerState: (ts: TimerState) => void;
  handleTimerPhaseEnd: (phase: TimerPhase, count: number) => void;
  getStatusLines: () => string[];
  enterNode: (node: MapNode) => void;
  startCombatWithEnemy: (enemyId: string) => void;
  doPlayCard: (cardIndex: number) => void;
  doEndTurn: () => void;
  doEventChoice: (choiceIndex: number) => void;
  doShopBuy: (itemIndex: number) => void;
  renderShopLines: () => string[];
}

const MAX_LOG_LINES = 200;

function createInitialTimer(): PomodoroTimer {
  return new PomodoroTimer(
    (state: TimerState) => { useGameStore.getState().setTimerState(state); },
    (phase: TimerPhase, count: number) => { useGameStore.getState().handleTimerPhaseEnd(phase, count); }
  );
}

const initialTimerState: TimerState = {
  phase: 'idle',
  remaining: 0,
  total: 0,
  pomodoroCount: 0,
  running: false,
};

function generateShopItems(floor: number, existingRelics: string[]): ShopItem[] {
  const items: ShopItem[] = [];

  // 3 cards
  const cardRewards = getCardRewards(floor);
  for (const card of cardRewards) {
    items.push({
      id: `shop_card_${card.id}`,
      type: 'card',
      name: card.name,
      description: card.description,
      cost: 50 + Math.floor(Math.random() * 30),
      cardInstance: card,
    });
  }

  // 1 relic
  const relicId = getRandomRelic(existingRelics);
  const relicDef = getRelicDef(relicId);
  if (relicDef) {
    items.push({
      id: `shop_relic_${relicId}`,
      type: 'relic',
      name: relicDef.name,
      description: relicDef.description,
      cost: 100 + Math.floor(Math.random() * 50),
    });
  }

  // Heal option
  items.push({
    id: 'shop_heal',
    type: 'heal',
    name: 'Rest & Recover',
    description: 'Heal 20 HP',
    cost: 40,
  });

  return items;
}

export const useGameStore = create<GameState>()((set, get) => ({
  // Player
  hp: 80,
  maxHp: 80,
  gold: 0,
  deck: [],
  relics: [],
  floor: 1,
  bonusEnergyNextCombat: 0,

  // Phase
  phase: 'title' as GamePhase,

  // Sub-states
  map: null,
  combat: null,
  currentEvent: null,
  shopItems: [],
  rewardCards: [],
  timerExpiredThisFloor: false,

  // Timer
  timerState: initialTimerState,
  timer: createInitialTimer(),

  // Log
  log: [],

  setTimerState: (ts: TimerState) => {
    set({ timerState: ts });
  },

  handleTimerPhaseEnd: (phase: TimerPhase, _count: number) => {
    const state = get();
    if (phase === 'work') {
      // Work phase ended - start break
      const isLong = state.timerState.pomodoroCount % 4 === 0 && state.timerState.pomodoroCount > 0;
      const breakDuration = isLong ? '15 minutes' : '5 minutes';
      if (state.phase === 'combat' || state.phase === 'navigating') {
        // Timer expired during active play - spawn procrastination demon next boss
        set({ timerExpiredThisFloor: true });
        get().addLog([
          '⚠️  FOCUS SESSION COMPLETE! ⚠️',
          `Time for a ${breakDuration} break.`,
          'The Procrastination Demon stirs...',
        ]);
      } else {
        get().addLog([
          '⏰ Focus session complete!',
          `Take a ${breakDuration} break.`,
        ]);
      }
      state.timer.startBreak(isLong);
      set({ phase: 'break_idle' });
    } else if (phase === 'break' || phase === 'longbreak') {
      // Break ended - start new work session, new floor
      get().addLog([
        '🍅 Break over! Back to work!',
        'Starting new focus session...',
        'A new dungeon floor awaits!',
      ]);
      const newFloor = state.floor + 1;
      const newMap = generateFloor(newFloor);
      state.timer.startNextWork();
      set({
        phase: 'navigating',
        floor: newFloor,
        map: newMap,
        timerExpiredThisFloor: false,
      });
      get().addLog([`=== FLOOR ${newFloor} ===`]);
      get().addLog(renderMap(newMap));
    }
  },

  addLog: (lines: string[]) => {
    set(state => {
      const newLog = [...state.log, ...lines];
      return { log: newLog.slice(-MAX_LOG_LINES) };
    });
  },

  startRun: () => {
    const state = get();
    const deck = getStartingDeck();
    const floor = 1;
    const map = generateFloor(floor);

    state.timer.reset();
    state.timer.start();

    set({
      hp: 80,
      maxHp: 80,
      gold: 0,
      deck,
      relics: [],
      floor,
      bonusEnergyNextCombat: 0,
      phase: 'navigating',
      map,
      combat: null,
      currentEvent: null,
      shopItems: [],
      rewardCards: [],
      timerExpiredThisFloor: false,
      log: [],
    });

    get().addLog([
      '╔══════════════════════════════════════════╗',
      '║         TOMATO QUEST BEGINS!             ║',
      '╚══════════════════════════════════════════╝',
      '',
      '🍅 Focus timer started! 25 minutes on the clock.',
      'Navigate the dungeon, defeat enemies, survive!',
      '',
      `=== FLOOR ${floor} ===`,
      ...renderMap(map),
      '',
      'Choose your path: tap a direction button or type go left/center/right',
    ]);
  },

  resetRun: () => {
    const state = get();
    state.timer.reset();
    set({
      hp: 80,
      maxHp: 80,
      gold: 0,
      deck: [],
      relics: [],
      floor: 1,
      bonusEnergyNextCombat: 0,
      phase: 'title',
      map: null,
      combat: null,
      currentEvent: null,
      shopItems: [],
      rewardCards: [],
      timerExpiredThisFloor: false,
      log: [],
    });
  },

  skipBreak: () => {
    const state = get();
    state.timer.skip();
    const newFloor = state.floor + 1;
    const newMap = generateFloor(newFloor);
    state.timer.startNextWork();
    set({
      phase: 'navigating',
      floor: newFloor,
      map: newMap,
      timerExpiredThisFloor: false,
    });
    get().addLog([
      'Break skipped.',
      `=== FLOOR ${newFloor} ===`,
      ...renderMap(newMap),
    ]);
  },

  handleCommand: (rawCmd: string) => {
    const state = get();
    const cmd = rawCmd.trim().toLowerCase();
    const parts = cmd.split(/\s+/);
    const verb = parts[0];

    if (state.phase === 'title') {
      if (verb === 'start' || verb === 'play' || verb === 'begin') {
        get().startRun();
      } else {
        get().addLog(['Type "start" to begin your quest!']);
      }
      return;
    }

    if (state.phase === 'game_over' || state.phase === 'victory') {
      if (verb === 'restart' || verb === 'play' || verb === 'start') {
        get().startRun();
      } else {
        get().addLog(['Type "restart" to play again.']);
      }
      return;
    }

    if (state.phase === 'break_idle') {
      if (verb === 'skip') {
        get().skipBreak();
      } else {
        get().addLog(['On break. Type "skip" to skip break, or wait for timer.']);
      }
      return;
    }

    // --- NAVIGATING ---
    if (state.phase === 'navigating') {
      if (verb === 'map' || verb === 'm') {
        if (state.map) {
          get().addLog(renderMap(state.map));
        }
        return;
      }

      if (verb === 'go' || verb === 'move' || verb === 'path') {
        const dir = parts[1];
        if (!state.map) return;
        const choices = getPathChoices(state.map);
        let chosen: { index: number; direction: string; node: MapNode } | undefined;
        if (dir === 'left' || dir === 'l' || dir === '1') {
          chosen = choices.find(c => c.direction === 'left') ?? choices[0];
        } else if (dir === 'center' || dir === 'c' || dir === '2') {
          chosen = choices.find(c => c.direction === 'center') ?? choices[1];
        } else if (dir === 'right' || dir === 'r' || dir === '3') {
          chosen = choices.find(c => c.direction === 'right') ?? choices[2];
        } else {
          get().addLog([`Available paths: ${choices.map(c => c.direction).join(', ')}`]);
          return;
        }

        if (!chosen) {
          get().addLog(['No path in that direction.']);
          return;
        }

        moveToNode(state.map, chosen.node.id);
        const node = chosen.node;
        get().addLog([`Moving ${chosen.direction} to [${node.type.toUpperCase()}]...`]);
        get().enterNode(node);
        return;
      }

      if (verb === 'status' || verb === 'stats') {
        get().addLog(get().getStatusLines());
        return;
      }

      if (verb === 'deck' || verb === 'd') {
        const { deck } = get();
        get().addLog([`Your deck (${deck.length} cards):`, ...deck.map((c, i) => `  ${i + 1}. [${c.cost}] ${c.name}`)]);
        return;
      }

      if (verb === 'relics') {
        const { relics } = get();
        if (relics.length === 0) {
          get().addLog(['No relics.']);
        } else {
          get().addLog(['Relics:', ...relics.map(r => {
            const def = getRelicDef(r);
            return `  - ${def?.name ?? r}: ${def?.description ?? ''}`;
          })]);
        }
        return;
      }

      get().addLog([`Unknown command: "${cmd}". Use: go [left/center/right], map, status, deck, relics`]);
      return;
    }

    // --- COMBAT ---
    if (state.phase === 'combat') {
      if (!state.combat) return;

      if (verb === 'hand' || verb === 'h') {
        get().addLog(renderCombatState(state.combat, state.hp, state.maxHp));
        return;
      }

      if (verb === 'status') {
        get().addLog(get().getStatusLines());
        return;
      }

      if (verb === 'map') {
        if (state.map) get().addLog(renderMap(state.map));
        return;
      }

      if (verb === 'end' || verb === 'e') {
        get().doEndTurn();
        return;
      }

      if (verb === 'play' || verb === 'p') {
        const idx = parseInt(parts[1]);
        if (isNaN(idx)) {
          get().addLog(['Usage: play [1-9]']);
          return;
        }
        get().doPlayCard(idx);
        return;
      }

      // Shorthand: p1, p2, etc.
      const shortMatch = cmd.match(/^p(\d+)$/);
      if (shortMatch) {
        get().doPlayCard(parseInt(shortMatch[1]));
        return;
      }

      // Just a number = play that card
      const numMatch = cmd.match(/^(\d+)$/);
      if (numMatch) {
        get().doPlayCard(parseInt(numMatch[1]));
        return;
      }

      get().addLog([`Commands: play [#], end, hand, status, map`]);
      return;
    }

    // --- EVENT ---
    if (state.phase === 'event') {
      if (verb === 'event' || verb === 'choice' || verb === 'choose') {
        const idx = parseInt(parts[1]);
        get().doEventChoice(idx);
        return;
      }
      const numMatch = cmd.match(/^(\d+)$/);
      if (numMatch) {
        get().doEventChoice(parseInt(numMatch[1]));
        return;
      }
      if (state.currentEvent) {
        get().addLog(renderEvent(state.currentEvent));
      }
      return;
    }

    // --- SHOP ---
    if (state.phase === 'shop') {
      if (verb === 'buy' || verb === 'b') {
        const idx = parseInt(parts[1]);
        get().doShopBuy(idx);
        return;
      }
      if (verb === 'list' || verb === 'ls' || verb === 'shop') {
        get().addLog(get().renderShopLines());
        return;
      }
      if (verb === 'leave' || verb === 'exit' || verb === 'done') {
        get().addLog(['You leave the shop.']);
        set({ phase: 'navigating' });
        if (state.map) get().addLog(renderMap(state.map));
        return;
      }
      const numMatch = cmd.match(/^(\d+)$/);
      if (numMatch) {
        get().doShopBuy(parseInt(numMatch[1]));
        return;
      }
      get().addLog(['Shop commands: list, buy [#], leave']);
      return;
    }

    // --- REST ---
    if (state.phase === 'rest') {
      if (verb === 'rest' || verb === 'r' || verb === 'heal') {
        const healAmt = Math.floor(state.maxHp * 0.3);
        const newHp = Math.min(state.hp + healAmt, state.maxHp);
        set({ hp: newHp });
        get().addLog([`You rest... Healed ${newHp - state.hp} HP. HP: ${newHp}/${state.maxHp}`]);
        set({ phase: 'navigating' });
        if (state.map) get().addLog(renderMap(state.map));
        return;
      }
      if (verb === 'smith' || verb === 'upgrade') {
        set({ phase: 'card_upgrade' });
        get().addLog(['Choose a card to upgrade:', ...get().deck.map((c, i) => `  ${i + 1}. [${c.cost}] ${c.name}${c.upgraded ? ' (already upgraded)' : ''}`)]);
        return;
      }
      if (verb === 'remove') {
        if (get().gold < 50) {
          get().addLog(['Card removal costs 50 gold. Not enough gold.']);
          return;
        }
        set({ phase: 'card_remove' });
        get().addLog(['Choose a card to REMOVE (costs 50 gold):', ...get().deck.map((c, i) => `  ${i + 1}. [${c.cost}] ${c.name}`)]);
        return;
      }
      if (verb === 'leave' || verb === 'exit' || verb === 'done') {
        get().addLog(['You leave the rest site.']);
        set({ phase: 'navigating' });
        if (state.map) get().addLog(renderMap(state.map));
        return;
      }
      get().addLog(['Rest site: rest (heal 30%), smith (upgrade card), remove (remove card, 50g), leave']);
      return;
    }

    // --- CARD REWARD ---
    if (state.phase === 'card_reward') {
      const numMatch = cmd.match(/^(\d+)$/);
      const skipCmd = verb === 'skip' || verb === 's';
      if (skipCmd) {
        get().addLog(['You skip the card reward.']);
        set({ rewardCards: [], phase: 'navigating' });
        if (state.map) get().addLog(renderMap(state.map));
        return;
      }
      if (numMatch || verb === 'pick' || verb === 'choose' || verb === 'take') {
        const idx = numMatch ? parseInt(numMatch[1]) : parseInt(parts[1]);
        if (isNaN(idx) || idx < 1 || idx > state.rewardCards.length) {
          get().addLog([`Pick 1-${state.rewardCards.length} or skip.`]);
          return;
        }
        const chosen = state.rewardCards[idx - 1];
        const newDeck = [...state.deck, chosen];
        set({ deck: newDeck, rewardCards: [], phase: 'navigating' });
        get().addLog([`Added ${chosen.name} to your deck!`]);
        if (state.map) get().addLog(renderMap(state.map));
        return;
      }
      get().addLog(['Card reward: type 1/2/3 to pick, or "skip"']);
      return;
    }

    // --- CARD REMOVE ---
    if (state.phase === 'card_remove') {
      const numMatch = cmd.match(/^(\d+)$/);
      const cancelCmd = verb === 'cancel' || verb === 'back';
      if (cancelCmd) {
        set({ phase: 'rest' });
        get().addLog(['Cancelled card removal.']);
        return;
      }
      if (numMatch) {
        const idx = parseInt(numMatch[1]) - 1;
        const deck = get().deck;
        if (idx < 0 || idx >= deck.length) {
          get().addLog([`Invalid card number.`]);
          return;
        }
        if (get().gold < 50) {
          get().addLog(['Not enough gold.']);
          return;
        }
        const removed = deck[idx];
        const newDeck = deck.filter((_, i) => i !== idx);
        set({ deck: newDeck, gold: get().gold - 50, phase: 'rest' });
        get().addLog([`Removed ${removed.name} from your deck. -50 gold.`]);
        return;
      }
      get().addLog(['Type the card number to remove, or "cancel".']);
      return;
    }

    // --- CARD UPGRADE ---
    if (state.phase === 'card_upgrade') {
      const numMatch = cmd.match(/^(\d+)$/);
      const cancelCmd = verb === 'cancel' || verb === 'back';
      if (cancelCmd) {
        set({ phase: 'rest' });
        get().addLog(['Cancelled upgrade.']);
        return;
      }
      if (numMatch) {
        const idx = parseInt(numMatch[1]) - 1;
        const deck = get().deck;
        if (idx < 0 || idx >= deck.length) {
          get().addLog([`Invalid card number.`]);
          return;
        }
        const card = deck[idx];
        if (card.upgraded) {
          get().addLog([`${card.name} is already upgraded.`]);
          return;
        }
        const upgradedBaseId = getUpgradedId(getCardBaseId(card));
        if (upgradedBaseId === getCardBaseId(card)) {
          get().addLog([`${card.name} cannot be upgraded.`]);
          return;
        }
        const newCard = createCard(upgradedBaseId);
        const newDeck = [...deck];
        newDeck[idx] = newCard;
        set({ deck: newDeck, phase: 'rest' });
        get().addLog([`Upgraded ${card.name} → ${newCard.name}!`]);
        return;
      }
      get().addLog(['Type the card number to upgrade, or "cancel".']);
      return;
    }

    get().addLog([`Unknown command: "${cmd}"`]);
  },

  // ---- Internal action methods ----

  getStatusLines(): string[] {
    const s = get();
    return [
      `HP: ${s.hp}/${s.maxHp}  Gold: ${s.gold}g  Floor: ${s.floor}`,
      `Deck: ${s.deck.length} cards  Relics: ${s.relics.length}`,
      s.relics.length > 0 ? `Relics: ${s.relics.map(r => getRelicDef(r)?.name ?? r).join(', ')}` : '',
    ].filter(l => l !== '');
  },

  enterNode(node: MapNode): void {
    const state = get();

    if (node.type === 'monster') {
      const enemies = getNormalEnemiesForFloor(state.floor);
      const enemyId = enemies[Math.floor(Math.random() * enemies.length)];
      get().startCombatWithEnemy(enemyId);
    } else if (node.type === 'elite') {
      const enemyId = getEliteEnemyForFloor(state.floor);
      get().startCombatWithEnemy(enemyId);
    } else if (node.type === 'boss') {
      const enemyId = getBossForFloor(state.floor, state.timerExpiredThisFloor);
      get().startCombatWithEnemy(enemyId);
    } else if (node.type === 'event') {
      const event = getRandomEvent();
      set({ currentEvent: event, phase: 'event' });
      get().addLog(renderEvent(event));
    } else if (node.type === 'shop') {
      const items = generateShopItems(state.floor, state.relics);
      set({ shopItems: items, phase: 'shop' });
      get().addLog(get().renderShopLines());
    } else if (node.type === 'rest') {
      set({ phase: 'rest' });
      get().addLog([
        '╔══════════════════════════════════════════╗',
        '║  REST SITE                               ║',
        '╠══════════════════════════════════════════╣',
        '║  rest   - Heal 30% max HP                ║',
        '║  smith  - Upgrade a card                 ║',
        '║  remove - Remove a card (50 gold)        ║',
        '║  leave  - Continue                       ║',
        '╚══════════════════════════════════════════╝',
      ]);
    }
  },

  startCombatWithEnemy(enemyId: string): void {
    const state = get();
    const relics = computeRelicEffects(state.relics);
    const bonusEnergy = state.bonusEnergyNextCombat;
    const combat = startCombat(enemyId, state.deck, state.hp, state.maxHp, state.relics, relics.goldMultiplier);

    // Apply bonus energy
    if (bonusEnergy !== 0) {
      combat.energy = Math.max(0, combat.energy + bonusEnergy);
      combat.maxEnergy = Math.max(1, combat.maxEnergy + bonusEnergy);
    }

    set({ combat, phase: 'combat', bonusEnergyNextCombat: 0 });
    get().addLog(renderCombatState(combat, state.hp, state.maxHp));
  },

  doPlayCard(cardIndex: number): void {
    const state = get();
    if (!state.combat) return;

    const result = playCard(state.combat, cardIndex, state.hp, state.maxHp, state.relics);
    get().addLog(result.lines);

    if (result.combatEnded && result.victory) {
      // Heal from relic
      const relics = computeRelicEffects(state.relics);
      let newHp = state.hp;
      if (relics.hpPerRoom && relics.hpPerRoom > 0) {
        newHp = Math.min(state.hp + relics.hpPerRoom, state.maxHp);
        if (newHp > state.hp) {
          get().addLog([`[Pomodoro Clock] Heal ${newHp - state.hp} HP.`]);
        }
      }

      const goldGained = state.combat.goldReward;
      const newGold = state.gold + goldGained;
      set({ hp: newHp, gold: newGold });
      get().addLog([`Gained ${goldGained} gold! Total: ${newGold}g`]);

      // Check if boss
      const currentNode = state.map?.nodes.find(n => n.id === state.map?.currentNodeId);
      if (currentNode?.type === 'boss') {
        // End of floor
        const ts = state.timer.getState();
        if (ts.phase === 'work' && ts.running) {
          state.timer.completeWork();
          const isLong = (ts.pomodoroCount + 1) % 4 === 0;
          state.timer.startBreak(isLong);
          const breakLen = isLong ? 'long break (15 min)' : 'short break (5 min)';
          get().addLog([
            `*** BOSS DEFEATED! Floor ${state.floor} complete! ***`,
            `🍅 Pomodoro complete! Take a ${breakLen}.`,
          ]);
          set({ phase: 'break_idle', combat: null });
        } else {
          // Timer not running (edge case)
          get().addLog([`*** BOSS DEFEATED! Floor ${state.floor} complete! ***`]);
          const newFloor = state.floor + 1;
          const newMap = generateFloor(newFloor);
          set({ phase: 'navigating', floor: newFloor, map: newMap, combat: null });
          get().addLog([`=== FLOOR ${newFloor} ===`, ...renderMap(newMap)]);
        }
        return;
      }

      // Offer card rewards
      const rewards = getCardRewards(state.floor);
      set({ rewardCards: rewards, phase: 'card_reward', combat: null });
      get().addLog([
        '',
        'Choose a card reward (or skip):',
        ...rewards.map((c, i) => `  ${i + 1}. [${c.cost}] ${c.name} - ${c.description}`),
        '  skip - Take no card',
      ]);
      return;
    }

    set({ combat: state.combat });

    // Handle heal signal in lines
    for (const line of result.lines) {
      const healMatch = line.match(/^  HEAL_(\d+)$/);
      if (healMatch) {
        const healAmt = parseInt(healMatch[1]);
        const newHp = Math.min(state.hp + healAmt, state.maxHp);
        set({ hp: newHp });
        get().addLog([`  Healed ${newHp - state.hp} HP. HP: ${newHp}/${state.maxHp}`]);
      }
    }
  },

  doEndTurn(): void {
    const state = get();
    if (!state.combat) return;

    const discardLines = endPlayerTurn(state.combat, state.hp, state.maxHp);
    get().addLog(discardLines);

    const enemyResult = enemyTurn(state.combat, state.hp, state.maxHp);
    get().addLog(enemyResult.lines);

    let newHp = state.hp + enemyResult.hpChange;

    if (enemyResult.combatEnded) {
      newHp = Math.max(0, newHp);
      set({ hp: newHp, combat: state.combat });
      get().addLog([
        '',
        '*** YOU HAVE BEEN DEFEATED ***',
        'Your quest ends here...',
        '',
        'Type "restart" to play again.',
      ]);
      set({ phase: 'game_over' });
      return;
    }

    // Handle burnout
    if (state.combat.burnoutStacks > 0) {
      newHp = Math.max(1, newHp); // clamp to 1 (burnout can't kill directly at start of turn)
    }

    set({ hp: Math.max(0, newHp), combat: state.combat });

    // Start player's next turn
    const turnResult = startPlayerTurn(state.combat, Math.max(0, newHp), state.maxHp, state.relics);
    get().addLog(turnResult.lines);

    let hpAfterTurn = Math.max(0, newHp) + turnResult.hpChange;
    if (hpAfterTurn <= 0) {
      set({ hp: 0 });
      get().addLog(['*** YOU HAVE BEEN DEFEATED ***', 'Type "restart" to play again.']);
      set({ phase: 'game_over' });
      return;
    }
    set({ hp: hpAfterTurn, combat: state.combat });
    get().addLog(renderCombatState(state.combat, hpAfterTurn, state.maxHp));
  },

  doEventChoice(choiceIndex: number): void {
    const state = get();
    if (!state.currentEvent) return;
    const event = state.currentEvent;

    if (choiceIndex < 1 || choiceIndex > event.choices.length) {
      get().addLog([`Choose 1-${event.choices.length}`]);
      return;
    }

    const choiceId = event.choices[choiceIndex - 1].id;
    const outcome = resolveEventChoice(event, choiceId);
    if (!outcome) {
      get().addLog(['Invalid choice.']);
      return;
    }

    get().addLog([`> ${event.choices[choiceIndex - 1].text}`, '', outcome.description]);

    let newHp = state.hp;
    let newMaxHp = state.maxHp;
    let newGold = state.gold;
    let newDeck = [...state.deck];
    let newRelics = [...state.relics];
    let newBonusEnergy = state.bonusEnergyNextCombat;

    if (outcome.hpChange) {
      newHp = Math.max(1, Math.min(state.hp + outcome.hpChange, newMaxHp));
      get().addLog([outcome.hpChange > 0 ? `  Healed ${outcome.hpChange} HP.` : `  Lost ${-outcome.hpChange} HP.`]);
    }
    if (outcome.maxHpChange) {
      newMaxHp = Math.max(20, state.maxHp + outcome.maxHpChange);
      newHp = Math.min(newHp, newMaxHp);
      get().addLog([`  Max HP changed by ${outcome.maxHpChange}. Now: ${newMaxHp}`]);
    }
    if (outcome.goldChange) {
      newGold = Math.max(0, state.gold + outcome.goldChange);
      get().addLog([outcome.goldChange > 0 ? `  Gained ${outcome.goldChange} gold.` : `  Lost ${-outcome.goldChange} gold.`]);
    }
    if (outcome.addCard) {
      const newCard = createCard(outcome.addCard);
      newDeck = [...newDeck, newCard];
      get().addLog([`  Added ${newCard.name} to your deck.`]);
    }
    if (outcome.addRelic) {
      const relicId = getRandomRelic(newRelics);
      newRelics = [...newRelics, relicId];
      const def = getRelicDef(relicId);
      get().addLog([`  Gained relic: ${def?.name ?? relicId} - ${def?.description ?? ''}`]);
    }
    if (outcome.energyNextCombat) {
      newBonusEnergy += outcome.energyNextCombat;
      if (outcome.energyNextCombat > 0) {
        get().addLog([`  Next combat: +${outcome.energyNextCombat} energy.`]);
      } else {
        get().addLog([`  Next combat: ${outcome.energyNextCombat} energy.`]);
      }
    }
    if (outcome.removeCard) {
      set({ hp: newHp, maxHp: newMaxHp, gold: newGold, deck: newDeck, relics: newRelics, bonusEnergyNextCombat: newBonusEnergy });
      set({ phase: 'card_remove', currentEvent: null });
      get().addLog(['Choose a card to remove from your deck:',
        ...newDeck.map((c, i) => `  ${i + 1}. [${c.cost}] ${c.name}`)]);
      return;
    }

    set({
      hp: newHp,
      maxHp: newMaxHp,
      gold: newGold,
      deck: newDeck,
      relics: newRelics,
      bonusEnergyNextCombat: newBonusEnergy,
      currentEvent: null,
      phase: 'navigating',
    });

    if (state.map) get().addLog(['', ...renderMap(state.map)]);
  },

  doShopBuy(itemIndex: number): void {
    const state = get();
    const items = state.shopItems;

    if (itemIndex < 1 || itemIndex > items.length) {
      get().addLog([`Choose 1-${items.length}`]);
      return;
    }

    const item = items[itemIndex - 1];
    if (state.gold < item.cost) {
      get().addLog([`Not enough gold. Need ${item.cost}g, have ${state.gold}g.`]);
      return;
    }

    let newGold = state.gold - item.cost;
    let newDeck = [...state.deck];
    let newRelics = [...state.relics];
    let newHp = state.hp;

    if (item.type === 'card' && item.cardInstance) {
      newDeck = [...newDeck, item.cardInstance];
      get().addLog([`Bought ${item.name}! Added to deck.`]);
    } else if (item.type === 'relic') {
      const relicId = item.id.replace('shop_relic_', '');
      newRelics = [...newRelics, relicId];
      get().addLog([`Bought ${item.name}!`]);
    } else if (item.type === 'heal') {
      newHp = Math.min(state.hp + 20, state.maxHp);
      get().addLog([`Rested and recovered! Healed ${newHp - state.hp} HP.`]);
    }

    // Remove bought item
    const newItems = items.filter((_, i) => i !== itemIndex - 1);
    set({ gold: newGold, deck: newDeck, relics: newRelics, hp: newHp, shopItems: newItems });
    get().addLog([`Remaining gold: ${newGold}g`]);
    get().addLog(get().renderShopLines());
  },

  renderShopLines(): string[] {
    const state = get();
    const lines: string[] = [
      '╔══════════════════════════════════════════╗',
      '║  SHOP                                    ║',
      '╠══════════════════════════════════════════╣',
    ];
    if (state.shopItems.length === 0) {
      lines.push('║  Nothing left for sale.                  ║');
    } else {
      state.shopItems.forEach((item, i) => {
        const line = `  ${i + 1}. ${item.name} (${item.cost}g) - ${item.description}`;
        lines.push(`║${line.padEnd(44)}║`);
      });
    }
    lines.push(`║  Your gold: ${state.gold}g`.padEnd(44) + '║');
    lines.push('╚══════════════════════════════════════════╝');
    lines.push('Commands: buy [#], list, leave');
    return lines;
  },
}));
