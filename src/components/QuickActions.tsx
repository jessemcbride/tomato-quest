import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { GamePhase } from '../store/useGameStore';
import { DungeonMap, getPathChoices } from '../game/Map';
import { CombatState } from '../game/Combat';
import { EventDefinition } from '../game/Events';
import { ShopItem } from '../store/useGameStore';

interface Props {
  phase: GamePhase;
  map: DungeonMap | null;
  combat: CombatState | null;
  currentEvent: EventDefinition | null;
  shopItems: ShopItem[];
  onCommand: (cmd: string) => void;
}

interface ActionButton {
  label: string;
  cmd: string;
  color?: string;
}

function getButtons(
  phase: GamePhase,
  map: DungeonMap | null,
  combat: CombatState | null,
  currentEvent: EventDefinition | null,
  shopItems: ShopItem[]
): ActionButton[] {
  switch (phase) {
    case 'navigating': {
      const buttons: ActionButton[] = [{ label: '🗺 Map', cmd: 'map', color: '#5bc0de' }];
      if (map) {
        const choices = getPathChoices(map);
        const dirLabels: Record<string, string> = { left: '↙ Left', center: '⬇ Center', right: '↘ Right' };
        for (const choice of choices) {
          const typeEmoji: Record<string, string> = {
            monster: '⚔', elite: '💀', event: '?', shop: '$', rest: '💤', boss: '☠', start: '🚀'
          };
          const emoji = typeEmoji[choice.node.type] ?? '';
          buttons.push({
            label: `${dirLabels[choice.direction] ?? choice.direction} ${emoji}`,
            cmd: `go ${choice.direction}`,
            color: choice.node.type === 'boss' ? '#ff4444' : choice.node.type === 'elite' ? '#e17055' : '#28a745',
          });
        }
        buttons.push({ label: '📊 Status', cmd: 'status', color: '#636e72' });
      }
      return buttons;
    }

    case 'combat': {
      return [
        { label: '⚔ End Turn', cmd: 'end', color: '#ff6b35' },
        { label: '✋ Hand', cmd: 'hand', color: '#74b9ff' },
        { label: '🗺 Map', cmd: 'map', color: '#5bc0de' },
        { label: '📊 Status', cmd: 'status', color: '#636e72' },
      ];
    }

    case 'event': {
      if (!currentEvent) return [];
      return currentEvent.choices.map((c, i) => ({
        label: `${i + 1}. ${c.text.slice(0, 30)}${c.text.length > 30 ? '…' : ''}`,
        cmd: `${i + 1}`,
        color: '#9d79d1',
      }));
    }

    case 'shop': {
      const buttons: ActionButton[] = [
        { label: '📋 List', cmd: 'list', color: '#fdcb6e' },
        { label: '🚪 Leave', cmd: 'leave', color: '#636e72' },
      ];
      shopItems.forEach((item, i) => {
        buttons.push({
          label: `Buy ${i + 1}: ${item.name} (${item.cost}g)`,
          cmd: `buy ${i + 1}`,
          color: '#fdcb6e',
        });
      });
      return buttons;
    }

    case 'rest': {
      return [
        { label: '💤 Rest (heal 30%)', cmd: 'rest', color: '#55efc4' },
        { label: '⚒ Upgrade Card', cmd: 'smith', color: '#74b9ff' },
        { label: '🗑 Remove Card (50g)', cmd: 'remove', color: '#e17055' },
        { label: '🚪 Leave', cmd: 'leave', color: '#636e72' },
      ];
    }

    case 'card_reward': {
      return [
        { label: '⏭ Skip', cmd: 'skip', color: '#636e72' },
        { label: '1 Pick', cmd: '1', color: '#28a745' },
        { label: '2 Pick', cmd: '2', color: '#28a745' },
        { label: '3 Pick', cmd: '3', color: '#28a745' },
      ];
    }

    case 'card_remove':
    case 'card_upgrade': {
      return [
        { label: '↩ Cancel', cmd: 'cancel', color: '#636e72' },
        ...[1, 2, 3, 4, 5].map(i => ({ label: `${i}`, cmd: `${i}`, color: '#74b9ff' })),
      ];
    }

    case 'break_idle': {
      return [
        { label: '⏭ Skip Break', cmd: 'skip', color: '#ff6b35' },
      ];
    }

    case 'game_over':
    case 'victory': {
      return [
        { label: '▶ Play Again', cmd: 'restart', color: '#28a745' },
      ];
    }

    default:
      return [];
  }
}

const MONO_FONT = Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' });

export const QuickActions: React.FC<Props> = ({
  phase,
  map,
  combat,
  currentEvent,
  shopItems,
  onCommand,
}) => {
  const [inputText, setInputText] = useState('');
  const inputRef = useRef<TextInput>(null);
  const buttons = getButtons(phase, map, combat, currentEvent, shopItems);

  const submitInput = () => {
    const cmd = inputText.trim();
    if (cmd) {
      onCommand(cmd);
      setInputText('');
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      {buttons.length > 0 && (
        <View style={styles.buttonRow}>
          {buttons.map((btn, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.button, { borderColor: btn.color ?? '#444' }]}
              onPress={() => onCommand(btn.cmd)}
              activeOpacity={0.7}
            >
              <Text style={[styles.buttonText, { color: btn.color ?? '#dfe6e9' }]} numberOfLines={2}>
                {btn.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      <View style={styles.inputRow}>
        <Text style={styles.prompt}>&gt;</Text>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={submitInput}
          placeholder="type command..."
          placeholderTextColor="#444"
          returnKeyType="send"
          autoCapitalize="none"
          autoCorrect={false}
          blurOnSubmit={false}
        />
        <TouchableOpacity style={styles.sendButton} onPress={submitInput}>
          <Text style={styles.sendText}>⏎</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0a0e14',
    borderTopWidth: 1,
    borderColor: '#1e2d3d',
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 6,
    paddingTop: 6,
    gap: 4,
  },
  button: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: '#0d1117',
    minWidth: 60,
    maxWidth: 180,
  },
  buttonText: {
    fontFamily: MONO_FONT,
    fontSize: 11,
    textAlign: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  prompt: {
    fontFamily: MONO_FONT,
    color: '#00ff41',
    fontSize: 14,
    marginRight: 6,
  },
  input: {
    flex: 1,
    fontFamily: MONO_FONT,
    color: '#00ff41',
    fontSize: 13,
    backgroundColor: '#0d1117',
    borderWidth: 1,
    borderColor: '#1e2d3d',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    height: 34,
  },
  sendButton: {
    marginLeft: 6,
    padding: 6,
    borderWidth: 1,
    borderColor: '#28a745',
    borderRadius: 4,
  },
  sendText: {
    color: '#28a745',
    fontSize: 16,
  },
});
