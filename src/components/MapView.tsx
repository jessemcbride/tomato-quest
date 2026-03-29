import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import { DungeonMap, MapNode, NodeType, NODE_LABELS, getAvailableNodes, getCurrentNode } from '../game/Map';

interface Props {
  map: DungeonMap;
  onNodePress?: (node: MapNode) => void;
}

function getNodeColor(node: MapNode, isCurrent: boolean): string {
  if (isCurrent) return '#ff6b35';
  if (node.visited) return '#444';
  if (node.available) {
    switch (node.type) {
      case 'boss': return '#ff4444';
      case 'elite': return '#e17055';
      case 'monster': return '#74b9ff';
      case 'event': return '#a29bfe';
      case 'shop': return '#fdcb6e';
      case 'rest': return '#55efc4';
      default: return '#dfe6e9';
    }
  }
  return '#222';
}

function getNodeSymbol(type: NodeType): string {
  switch (type) {
    case 'start': return 'S';
    case 'monster': return 'M';
    case 'elite': return 'E';
    case 'event': return '?';
    case 'shop': return '$';
    case 'rest': return 'R';
    case 'boss': return 'B';
    default: return '?';
  }
}

const MONO_FONT = Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' });

export const MapView: React.FC<Props> = ({ map, onNodePress }) => {
  const currentNode = getCurrentNode(map);
  const available = getAvailableNodes(map);

  // Group nodes by row
  const byRow = new Map<number, MapNode[]>();
  for (const n of map.nodes) {
    if (!byRow.has(n.row)) byRow.set(n.row, []);
    byRow.get(n.row)!.push(n);
  }

  const maxRow = Math.max(...map.nodes.map(n => n.row));
  const rows: MapNode[][] = [];
  for (let r = maxRow; r >= 0; r--) {
    const rowNodes = (byRow.get(r) ?? []).sort((a, b) => a.col - b.col);
    rows.push(rowNodes);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>FLOOR {map.floor} MAP</Text>
      {rows.map((rowNodes, ri) => (
        <View key={ri} style={styles.row}>
          {rowNodes.length === 1 ? (
            <View style={styles.singleNodeRow}>
              <NodeButton
                node={rowNodes[0]}
                isCurrent={currentNode?.id === rowNodes[0].id}
                onPress={onNodePress}
              />
            </View>
          ) : (
            <View style={styles.threeNodeRow}>
              {[0, 1, 2].map(col => {
                const node = rowNodes.find(n => n.col === col);
                if (!node) return <View key={col} style={styles.nodePlaceholder} />;
                return (
                  <NodeButton
                    key={node.id}
                    node={node}
                    isCurrent={currentNode?.id === node.id}
                    onPress={onNodePress}
                  />
                );
              })}
            </View>
          )}
        </View>
      ))}
      <View style={styles.legend}>
        <Text style={styles.legendText}>M=Monster  E=Elite  ?=Event  $=Shop  R=Rest  B=Boss</Text>
      </View>
    </ScrollView>
  );
};

interface NodeButtonProps {
  node: MapNode;
  isCurrent: boolean;
  onPress?: (node: MapNode) => void;
}

const NodeButton: React.FC<NodeButtonProps> = ({ node, isCurrent, onPress }) => {
  const color = getNodeColor(node, isCurrent);
  const symbol = getNodeSymbol(node.type);
  const isInteractable = node.available && !node.visited && onPress;

  return (
    <TouchableOpacity
      style={[
        styles.node,
        { borderColor: color },
        isCurrent && styles.currentNode,
        !node.available && !isCurrent && styles.unavailableNode,
      ]}
      onPress={() => isInteractable && onPress(node)}
      disabled={!isInteractable}
      activeOpacity={isInteractable ? 0.7 : 1}
    >
      <Text style={[styles.nodeSymbol, { color }]}>{symbol}</Text>
      {isCurrent && <Text style={styles.nodeLabel}>HERE</Text>}
      {node.available && !isCurrent && (
        <Text style={[styles.nodeLabel, { color }]}>{NODE_LABELS[node.type].slice(0, 4)}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0d1117',
    flex: 1,
  },
  content: {
    padding: 12,
  },
  title: {
    fontFamily: MONO_FONT,
    color: '#ff6b35',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  row: {
    marginBottom: 8,
  },
  singleNodeRow: {
    alignItems: 'center',
  },
  threeNodeRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  node: {
    width: 60,
    height: 60,
    borderWidth: 2,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a0e14',
  },
  currentNode: {
    backgroundColor: '#1a1a00',
  },
  unavailableNode: {
    opacity: 0.3,
  },
  nodePlaceholder: {
    width: 60,
    height: 60,
  },
  nodeSymbol: {
    fontFamily: MONO_FONT,
    fontSize: 20,
    fontWeight: 'bold',
  },
  nodeLabel: {
    fontFamily: MONO_FONT,
    fontSize: 8,
    color: '#888',
    marginTop: 2,
  },
  legend: {
    marginTop: 12,
    borderTopWidth: 1,
    borderColor: '#1e2d3d',
    paddingTop: 8,
  },
  legendText: {
    fontFamily: MONO_FONT,
    fontSize: 10,
    color: '#636e72',
    textAlign: 'center',
  },
});
