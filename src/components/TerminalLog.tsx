import React, { useRef, useEffect } from 'react';
import {
  ScrollView,
  Text,
  StyleSheet,
  View,
  Platform,
} from 'react-native';

interface Props {
  lines: string[];
}

function getLineColor(line: string): string {
  // Box-drawing chars
  if (/[╔╚║═╠╣╗╝]/.test(line)) return '#5bc0de';
  // Damage / hurt
  if (/damage|You take|DEFEATED|lose \d+ HP/i.test(line)) return '#ff4444';
  // Boss / critical
  if (/BOSS|CRITICAL|⚠️|procrastination demon/i.test(line)) return '#ff4444';
  // Heal
  if (/heal|Heal|\+HP|Healed|recover/i.test(line)) return '#28a745';
  // Gold
  if (/gold|Gold|reward|💰/i.test(line)) return '#ffb347';
  // Event
  if (/EVENT|\?\?\?|event/i.test(line)) return '#9d79d1';
  // Timer
  if (/🍅|timer|FOCUS SESSION|Pomodoro|Break over/i.test(line)) return '#ff6b35';
  // Default matrix green
  return '#00ff41';
}

function isBold(line: string): boolean {
  return /BOSS|CRITICAL|⚠️|DEFEATED|VICTORY|FLOOR \d+|COMBAT|REST SITE|SHOP|EVENT/i.test(line);
}

const MONO_FONT = Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' });

export const TerminalLog: React.FC<Props> = ({ lines }) => {
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new lines arrive
    const timeout = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: false });
    }, 50);
    return () => clearTimeout(timeout);
  }, [lines.length]);

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => {
          scrollRef.current?.scrollToEnd({ animated: false });
        }}
      >
        {lines.map((line, index) => (
          <Text
            key={index}
            style={[
              styles.line,
              { color: getLineColor(line) },
              isBold(line) && styles.bold,
            ]}
            selectable={false}
          >
            {line === '' ? ' ' : line}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d1117',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#1e2d3d',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 8,
    paddingBottom: 4,
  },
  line: {
    fontFamily: MONO_FONT,
    fontSize: 12,
    lineHeight: 18,
    color: '#00ff41',
  },
  bold: {
    fontWeight: 'bold',
  },
});
