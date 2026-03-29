import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useGameStore } from '../store/useGameStore';

type RootStackParamList = {
  Title: undefined;
  Game: undefined;
};

interface Props {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Title'>;
}

const MONO_FONT = Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' });

export const TitleScreen: React.FC<Props> = ({ navigation }) => {
  const startRun = useGameStore(s => s.startRun);

  const handleStart = () => {
    startRun();
    navigation.navigate('Game');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.tomato}>🍅</Text>
        <Text style={styles.title}>TOMATO QUEST</Text>
        <Text style={styles.subtitle}>A Pomodoro-Powered Dungeon Crawler</Text>

        <View style={styles.divider} />

        <View style={styles.descBlock}>
          <Text style={styles.desc}>
            Survive the dungeon before your focus session ends.
          </Text>
          <Text style={styles.desc}>
            Complete the floor boss before the 25-minute timer expires — or face the dreaded Procrastination Demon!
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.howTo}>
          <Text style={styles.howToTitle}>HOW TO PLAY</Text>
          <Text style={styles.howToLine}>⚔  Navigate the dungeon map</Text>
          <Text style={styles.howToLine}>🃏  Play cards to fight enemies</Text>
          <Text style={styles.howToLine}>🍅  Beat the boss before time runs out</Text>
          <Text style={styles.howToLine}>☕  Rest, shop, and upgrade your deck</Text>
          <Text style={styles.howToLine}>💤  Take breaks between floors</Text>
        </View>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.startButton} onPress={handleStart} activeOpacity={0.8}>
          <Text style={styles.startText}>▶  START QUEST</Text>
        </TouchableOpacity>

        <Text style={styles.version}>v1.0 • Expo {'\u00B7'} React Native</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0d1117',
  },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  tomato: {
    fontSize: 72,
    marginBottom: 8,
  },
  title: {
    fontFamily: MONO_FONT,
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ff4444',
    letterSpacing: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: MONO_FONT,
    fontSize: 13,
    color: '#636e72',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
    letterSpacing: 1,
  },
  divider: {
    width: '80%',
    height: 1,
    backgroundColor: '#1e2d3d',
    marginVertical: 16,
  },
  descBlock: {
    maxWidth: 320,
    gap: 8,
  },
  desc: {
    fontFamily: MONO_FONT,
    fontSize: 13,
    color: '#b2bec3',
    textAlign: 'center',
    lineHeight: 20,
  },
  howTo: {
    alignSelf: 'stretch',
    backgroundColor: '#0a0e14',
    borderWidth: 1,
    borderColor: '#1e2d3d',
    borderRadius: 8,
    padding: 16,
    gap: 8,
  },
  howToTitle: {
    fontFamily: MONO_FONT,
    fontSize: 13,
    color: '#ff6b35',
    fontWeight: 'bold',
    marginBottom: 4,
    letterSpacing: 2,
  },
  howToLine: {
    fontFamily: MONO_FONT,
    fontSize: 13,
    color: '#00ff41',
    lineHeight: 22,
  },
  startButton: {
    marginTop: 8,
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: '#28a745',
    borderRadius: 8,
    backgroundColor: '#0a0e14',
    shadowColor: '#28a745',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  startText: {
    fontFamily: MONO_FONT,
    fontSize: 18,
    color: '#28a745',
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  version: {
    fontFamily: MONO_FONT,
    fontSize: 10,
    color: '#333',
    marginTop: 24,
  },
});
