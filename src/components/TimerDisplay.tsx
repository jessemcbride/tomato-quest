import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { TimerState } from '../game/Timer';

interface Props {
  timerState: TimerState;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function getPhaseLabel(phase: string): string {
  switch (phase) {
    case 'work': return 'FOCUS';
    case 'break': return 'BREAK';
    case 'longbreak': return 'LONG BREAK';
    case 'idle': return 'IDLE';
    default: return phase.toUpperCase();
  }
}

function getTimerColor(timerState: TimerState): string {
  if (timerState.phase !== 'work') return '#28a745'; // green for break
  const remaining = timerState.remaining;
  if (remaining > 10 * 60) return '#28a745';   // >10 min: green
  if (remaining > 5 * 60) return '#ffc107';    // 5-10 min: yellow
  return '#ff4444';                             // <5 min: red
}

const MONO_FONT = Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' });

export const TimerDisplay: React.FC<Props> = ({ timerState }) => {
  const flashAnim = useRef(new Animated.Value(1)).current;
  const flashRef = useRef<Animated.CompositeAnimation | null>(null);
  const isFlashing = timerState.phase === 'work' && timerState.remaining < 5 * 60 && timerState.running;

  useEffect(() => {
    if (isFlashing) {
      flashRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(flashAnim, { toValue: 0.3, duration: 500, useNativeDriver: true }),
          Animated.timing(flashAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      );
      flashRef.current.start();
    } else {
      flashRef.current?.stop();
      flashAnim.setValue(1);
    }
    return () => {
      flashRef.current?.stop();
    };
  }, [isFlashing]);

  const color = getTimerColor(timerState);
  const progress = timerState.total > 0 ? 1 - timerState.remaining / timerState.total : 0;
  const timeStr = formatTime(timerState.remaining);
  const phaseLabel = getPhaseLabel(timerState.phase);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Animated.Text style={[styles.time, { color, opacity: flashAnim }]}>
          {timeStr}
        </Animated.Text>
        <Text style={[styles.phase, { color }]}>{phaseLabel}</Text>
        {timerState.pomodoroCount > 0 && (
          <Text style={styles.count}>
            {'🍅'.repeat(Math.min(timerState.pomodoroCount, 4))}
          </Text>
        )}
      </View>
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${Math.round(progress * 100)}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0d1117',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderColor: '#1e2d3d',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  time: {
    fontFamily: MONO_FONT,
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  phase: {
    fontFamily: MONO_FONT,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  count: {
    fontSize: 12,
    marginLeft: 4,
  },
  progressContainer: {
    height: 3,
    backgroundColor: '#1e2d3d',
    borderRadius: 2,
    marginTop: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
});
