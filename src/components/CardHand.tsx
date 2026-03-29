import React from 'react';
import {
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  Platform,
} from 'react-native';
import { CombatState } from '../game/Combat';
import { Card, getCardBaseId, CardContext } from '../game/Cards';

interface Props {
  combat: CombatState;
  playerHp: number;
  playerMaxHp: number;
  onPlayCard: (index: number) => void;
}

function getEffectSummary(card: Card, combat: CombatState, hp: number, maxHp: number): string {
  const ctx: CardContext = {
    playerHp: hp,
    playerMaxHp: maxHp,
    playerEnergy: combat.energy,
    playerBlock: combat.playerBlock,
    handSize: combat.hand.length,
    discardSize: combat.discardPile.length,
    exhaustSize: combat.exhaustPile.length,
    relics: [],
    turnNumber: combat.turnNumber,
    cardsPlayedThisTurn: combat.cardsPlayedThisTurn,
  };
  const result = card.effect(ctx);
  if (result.damage) return `${result.damage} dmg`;
  if (result.block) return `${result.block} blk`;
  if (result.draw) return `draw ${result.draw}`;
  if (result.gainEnergy) return `+${result.gainEnergy}⚡`;
  if (result.heal) return `+${result.heal}hp`;
  if (result.addToHand) return `add ${result.addToHand.length}`;
  return 'effect';
}

function getCardEffectiveCost(card: Card, combat: CombatState): number {
  const baseId = getCardBaseId(card);
  let cost = card.cost;
  if (combat.zoneModeActive && (baseId === 'focus' || baseId === 'focus_plus')) cost = 0;
  if (combat.nextFocusFree && (baseId === 'focus' || baseId === 'focus_plus')) cost = 0;
  return cost;
}

function getTypeColor(type: string): string {
  switch (type) {
    case 'attack': return '#ff6b6b';
    case 'skill': return '#74b9ff';
    case 'power': return '#a29bfe';
    case 'status': return '#636e72';
    default: return '#dfe6e9';
  }
}

const MONO_FONT = Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' });

export const CardHand: React.FC<Props> = ({ combat, playerHp, playerMaxHp, onPlayCard }) => {
  if (combat.hand.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No cards in hand</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {combat.hand.map((card, index) => {
          const cost = getCardEffectiveCost(card, combat);
          const canAfford = combat.energy >= cost;
          const typeColor = getTypeColor(card.type);
          const effectStr = getEffectSummary(card, combat, playerHp, playerMaxHp);

          return (
            <TouchableOpacity
              key={card.id}
              style={[
                styles.card,
                { borderColor: canAfford ? typeColor : '#333' },
                !canAfford && styles.cardDisabled,
              ]}
              onPress={() => canAfford && onPlayCard(index + 1)}
              activeOpacity={canAfford ? 0.7 : 1}
            >
              <View style={[styles.costBadge, { backgroundColor: canAfford ? typeColor : '#333' }]}>
                <Text style={styles.costText}>{cost}</Text>
              </View>
              <Text style={[styles.cardName, !canAfford && styles.disabledText]} numberOfLines={2}>
                {card.name}
              </Text>
              <Text style={[styles.cardEffect, !canAfford && styles.disabledText]}>
                {effectStr}
              </Text>
              <Text style={[styles.cardIndex, !canAfford && styles.disabledText]}>
                [{index + 1}]
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0a0e14',
    borderTopWidth: 1,
    borderColor: '#1e2d3d',
    paddingVertical: 6,
  },
  emptyContainer: {
    backgroundColor: '#0a0e14',
    borderTopWidth: 1,
    borderColor: '#1e2d3d',
    paddingVertical: 10,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: MONO_FONT,
    color: '#444',
    fontSize: 12,
  },
  scrollContent: {
    paddingHorizontal: 8,
    gap: 6,
  },
  card: {
    width: 80,
    minHeight: 90,
    backgroundColor: '#0d1117',
    borderWidth: 1.5,
    borderRadius: 6,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardDisabled: {
    opacity: 0.4,
  },
  costBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  costText: {
    fontFamily: MONO_FONT,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  },
  cardName: {
    fontFamily: MONO_FONT,
    fontSize: 10,
    color: '#dfe6e9',
    textAlign: 'center',
    fontWeight: 'bold',
    flex: 1,
    textAlignVertical: 'center',
  },
  cardEffect: {
    fontFamily: MONO_FONT,
    fontSize: 10,
    color: '#b2bec3',
    textAlign: 'center',
    marginTop: 2,
  },
  cardIndex: {
    fontFamily: MONO_FONT,
    fontSize: 9,
    color: '#636e72',
    marginTop: 2,
  },
  disabledText: {
    color: '#444',
  },
});
