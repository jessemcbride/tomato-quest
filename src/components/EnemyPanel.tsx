import React from 'react';
import { View, Text, Image, StyleSheet, Platform } from 'react-native';
import { CombatState } from '../game/Combat';
import { getEnemyImage } from '../assets/enemyImages';

interface Props {
  combat: CombatState;
}

const MONO_FONT = Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' });

function renderHpBar(hp: number, maxHp: number, width: number = 14): string {
  const filled = Math.round((hp / maxHp) * width);
  const empty = width - filled;
  return '█'.repeat(Math.max(0, filled)) + '░'.repeat(Math.max(0, empty));
}

function getHpColor(hp: number, maxHp: number): string {
  const ratio = hp / maxHp;
  if (ratio > 0.6) return '#28a745';
  if (ratio > 0.3) return '#ffc107';
  return '#ff4444';
}

export const EnemyPanel: React.FC<Props> = ({ combat }) => {
  const { enemy } = combat;
  const enemyImg = getEnemyImage(enemy.defId);
  const hpColor = getHpColor(enemy.hp, enemy.maxHp);
  const hpBar = renderHpBar(enemy.hp, enemy.maxHp);

  const statusEntries = Array.from(enemy.statuses.entries()).filter(([, v]) => v > 0);

  return (
    <View style={styles.container}>
      {enemyImg ? (
        <Image source={enemyImg} style={styles.sprite} resizeMode="contain" />
      ) : (
        <View style={styles.spritePlaceholder}>
          <Text style={styles.placeholderEmoji}>👾</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.name}>{enemy.name}</Text>
        <View style={styles.hpRow}>
          <Text style={[styles.hpBar, { color: hpColor }]}>{hpBar}</Text>
          <Text style={[styles.hpText, { color: hpColor }]}> {enemy.hp}/{enemy.maxHp}</Text>
        </View>
        {enemy.block > 0 && (
          <Text style={styles.block}>🛡 {enemy.block} block</Text>
        )}
        {statusEntries.length > 0 && (
          <Text style={styles.statuses}>
            {statusEntries.map(([s, v]) => `${s}(${v})`).join(' ')}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d1117',
    borderBottomWidth: 1,
    borderColor: '#1e2d3d',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 12,
  },
  sprite: {
    width: 80,
    height: 80,
  },
  spritePlaceholder: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
    borderRadius: 8,
  },
  placeholderEmoji: {
    fontSize: 40,
  },
  info: {
    flex: 1,
  },
  name: {
    fontFamily: MONO_FONT,
    fontSize: 13,
    fontWeight: 'bold',
    color: '#ff6b6b',
    marginBottom: 4,
  },
  hpRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hpBar: {
    fontFamily: MONO_FONT,
    fontSize: 12,
  },
  hpText: {
    fontFamily: MONO_FONT,
    fontSize: 12,
    fontWeight: 'bold',
  },
  block: {
    fontFamily: MONO_FONT,
    fontSize: 11,
    color: '#74b9ff',
    marginTop: 2,
  },
  statuses: {
    fontFamily: MONO_FONT,
    fontSize: 10,
    color: '#a29bfe',
    marginTop: 2,
  },
});
