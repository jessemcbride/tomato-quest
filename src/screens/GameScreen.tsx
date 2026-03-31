import React, { useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, Platform, Text, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useGameStore } from '../store/useGameStore';
import { StatusHeader } from '../components/StatusHeader';
import { TimerDisplay } from '../components/TimerDisplay';
import { TerminalLog } from '../components/TerminalLog';
import { CardHand } from '../components/CardHand';
import { QuickActions } from '../components/QuickActions';
import { EnemyPanel } from '../components/EnemyPanel';

type RootStackParamList = {
  Title: undefined;
  Game: undefined;
};

interface Props {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Game'>;
}

const MONO_FONT = Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' });

export const GameScreen: React.FC<Props> = ({ navigation }) => {
  const {
    hp, maxHp, gold, floor,
    phase, combat, map,
    currentEvent, shopItems, rewardCards,
    log, timerState, relics,
    handleCommand, resetRun,
  } = useGameStore();

  // Navigate back to title if reset
  useEffect(() => {
    if (phase === 'title') {
      navigation.navigate('Title');
    }
  }, [phase, navigation]);

  const handleBackToTitle = () => {
    resetRun();
    navigation.navigate('Title');
  };

  const showCardHand = phase === 'combat' && combat !== null;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Top bar with back button */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={handleBackToTitle} style={styles.backButton}>
            <Text style={styles.backText}>← Menu</Text>
          </TouchableOpacity>
          <StatusHeader
            hp={hp}
            maxHp={maxHp}
            gold={gold}
            floor={floor}
            phase={phase}
            energy={combat?.energy}
            maxEnergy={combat?.maxEnergy}
            relics={relics}
          />
        </View>

        {/* Timer */}
        <TimerDisplay timerState={timerState} />

        {/* Enemy sprite panel - combat only */}
        {showCardHand && combat && (
          <EnemyPanel combat={combat} />
        )}

        {/* Terminal log - main content area */}
        <TerminalLog lines={log} />

        {/* Context-sensitive quick actions */}
        <QuickActions
          phase={phase}
          map={map}
          combat={combat}
          currentEvent={currentEvent}
          shopItems={shopItems}
          onCommand={handleCommand}
        />

        {/* Card hand - combat only */}
        {showCardHand && (
          <CardHand
            combat={combat!}
            playerHp={hp}
            playerMaxHp={maxHp}
            onPlayCard={(index) => handleCommand(`play ${index}`)}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0d1117',
  },
  container: {
    flex: 1,
    backgroundColor: '#0d1117',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d1117',
    borderBottomWidth: 1,
    borderColor: '#1e2d3d',
  },
  backButton: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  backText: {
    fontFamily: MONO_FONT,
    color: '#636e72',
    fontSize: 12,
  },
});
