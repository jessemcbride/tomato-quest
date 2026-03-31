import React from 'react';
import { View, Text, Image, StyleSheet, Platform, ScrollView } from 'react-native';
import { getRelicImage } from '../assets/relicImages';

interface Props {
  hp: number;
  maxHp: number;
  gold: number;
  floor: number;
  energy?: number;
  maxEnergy?: number;
  phase: string;
  relics?: string[];
}

function renderHpBar(hp: number, maxHp: number, width: number = 12): string {
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

const MONO_FONT = Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' });

export const StatusHeader: React.FC<Props> = ({ hp, maxHp, gold, floor, energy, maxEnergy, phase, relics = [] }) => {
  const hpColor = getHpColor(hp, maxHp);
  const hpBar = renderHpBar(hp, maxHp);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.floor}>🍅 Floor {floor}</Text>
        <View style={styles.hpContainer}>
          <Text style={[styles.hpBar, { color: hpColor }]}>{hpBar}</Text>
          <Text style={[styles.hpText, { color: hpColor }]}> {hp}/{maxHp}</Text>
        </View>
        <Text style={styles.gold}>💰 {gold}g</Text>
      </View>
      {phase === 'combat' && energy !== undefined && maxEnergy !== undefined && (
        <View style={styles.energyRow}>
          <Text style={styles.energyLabel}>⚡ </Text>
          {Array.from({ length: maxEnergy }).map((_, i) => (
            <Text key={i} style={[styles.energyPip, { color: i < energy ? '#ffc107' : '#333' }]}>
              ●
            </Text>
          ))}
          <Text style={styles.energyText}> {energy}/{maxEnergy}</Text>
        </View>
      )}
      {relics.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.relicRow}>
          {relics.map((relicId) => {
            const img = getRelicImage(relicId);
            return img ? (
              <Image key={relicId} source={img} style={styles.relicIcon} resizeMode="contain" />
            ) : null;
          })}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0d1117',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderColor: '#1e2d3d',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  floor: {
    fontFamily: MONO_FONT,
    fontSize: 13,
    color: '#ff6b35',
    fontWeight: 'bold',
  },
  hpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
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
  gold: {
    fontFamily: MONO_FONT,
    fontSize: 13,
    color: '#ffb347',
    fontWeight: 'bold',
  },
  energyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  energyLabel: {
    fontFamily: MONO_FONT,
    fontSize: 12,
    color: '#ffc107',
  },
  energyPip: {
    fontSize: 14,
    marginHorizontal: 1,
  },
  energyText: {
    fontFamily: MONO_FONT,
    fontSize: 11,
    color: '#ffc107',
    marginLeft: 2,
  },
  relicRow: {
    marginTop: 4,
  },
  relicIcon: {
    width: 28,
    height: 28,
    marginRight: 4,
    borderRadius: 4,
  },
});
