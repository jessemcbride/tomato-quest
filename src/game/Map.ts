export type NodeType = 'monster' | 'elite' | 'event' | 'shop' | 'rest' | 'boss' | 'start';

export interface MapNode {
  id: string;
  type: NodeType;
  floor: number;
  col: number;   // 0-2 (left, center, right)
  row: number;   // row within floor
  connections: string[]; // ids of nodes reachable from here
  visited: boolean;
  available: boolean;
}

export interface DungeonMap {
  nodes: MapNode[];
  currentNodeId: string | null;
  floor: number;
}

let nodeCounter = 0;
function makeNode(type: NodeType, floor: number, row: number, col: number): MapNode {
  return {
    id: `n${++nodeCounter}`,
    type,
    floor,
    col,
    row,
    connections: [],
    visited: false,
    available: false,
  };
}

/**
 * Generate a floor map with branching paths (Slay the Spire style).
 * Structure:
 *   Row 0: Start node (single)
 *   Rows 1-3: Branching combat/event nodes (3 columns)
 *   Row 4: Convergence node (rest/shop)
 *   Row 5: Boss node (single)
 */
export function generateFloor(floor: number): DungeonMap {
  nodeCounter = 0;
  const nodes: MapNode[] = [];

  // Row 0: start (virtual - current position before floor begins)
  const startNode = makeNode('start', floor, 0, 1);
  startNode.visited = true;
  nodes.push(startNode);

  // Rows 1-3: branching paths
  // Each column = one path: left, center, right
  const rows: MapNode[][] = [];
  for (let row = 1; row <= 3; row++) {
    const rowNodes: MapNode[] = [];
    for (let col = 0; col < 3; col++) {
      const type = pickNodeType(floor, row, col);
      const n = makeNode(type, floor, row, col);
      rowNodes.push(n);
      nodes.push(n);
    }
    rows.push(rowNodes);
  }

  // Row 4: convergence (rest site or shop)
  const midType: NodeType = floor % 2 === 0 ? 'shop' : 'rest';
  const midNode = makeNode(midType, floor, 4, 1);
  nodes.push(midNode);

  // Row 5: Boss
  const bossNode = makeNode('boss', floor, 5, 1);
  nodes.push(bossNode);

  // Connect: start -> all row 1 nodes
  for (const n of rows[0]) {
    startNode.connections.push(n.id);
    n.available = false; // will be set when start is visited
  }

  // Connect row 1 -> row 2 (each col connects to same and adjacent)
  for (let col = 0; col < 3; col++) {
    const from = rows[0][col];
    // Connect to same col and one adjacent col in next row
    const targets = [col];
    if (col > 0) targets.push(col - 1);
    if (col < 2) targets.push(col + 1);
    for (const tc of targets) {
      const to = rows[1][tc];
      if (!from.connections.includes(to.id)) {
        from.connections.push(to.id);
      }
    }
  }

  // Connect row 2 -> row 3
  for (let col = 0; col < 3; col++) {
    const from = rows[1][col];
    const targets = [col];
    if (col > 0) targets.push(col - 1);
    if (col < 2) targets.push(col + 1);
    for (const tc of targets) {
      const to = rows[2][tc];
      if (!from.connections.includes(to.id)) {
        from.connections.push(to.id);
      }
    }
  }

  // Connect row 3 -> midNode
  for (const n of rows[2]) {
    n.connections.push(midNode.id);
  }

  // Connect midNode -> boss
  midNode.connections.push(bossNode.id);

  // Mark row 1 as available (from start)
  for (const n of rows[0]) {
    n.available = true;
  }

  return {
    nodes,
    currentNodeId: startNode.id,
    floor,
  };
}

function pickNodeType(floor: number, row: number, col: number): NodeType {
  // Row 1: mostly monsters, one event chance
  // Row 2: monsters, elite chance
  // Row 3: monsters, event, rest
  const rand = Math.random();
  if (row === 1) {
    if (col === 1 && rand < 0.3) return 'event';
    return 'monster';
  }
  if (row === 2) {
    if (floor >= 2 && rand < 0.2) return 'elite';
    if (rand < 0.2) return 'event';
    return 'monster';
  }
  if (row === 3) {
    if (rand < 0.2) return 'event';
    if (rand < 0.35) return 'shop';
    if (floor >= 2 && rand < 0.5) return 'elite';
    return 'monster';
  }
  return 'monster';
}

export function getNode(map: DungeonMap, id: string): MapNode | undefined {
  return map.nodes.find(n => n.id === id);
}

export function getCurrentNode(map: DungeonMap): MapNode | undefined {
  if (!map.currentNodeId) return undefined;
  return getNode(map, map.currentNodeId);
}

export function getAvailableNodes(map: DungeonMap): MapNode[] {
  const current = getCurrentNode(map);
  if (!current) return [];
  return current.connections
    .map(id => getNode(map, id))
    .filter((n): n is MapNode => n !== undefined && !n.visited);
}

export function moveToNode(map: DungeonMap, nodeId: string): boolean {
  const current = getCurrentNode(map);
  if (!current) return false;
  if (!current.connections.includes(nodeId)) return false;
  const target = getNode(map, nodeId);
  if (!target || target.visited) return false;
  target.visited = true;
  map.currentNodeId = nodeId;
  // Mark new available nodes
  for (const connId of target.connections) {
    const conn = getNode(map, connId);
    if (conn && !conn.visited) conn.available = true;
  }
  return true;
}

export const NODE_SYMBOLS: Record<NodeType, string> = {
  start: 'S',
  monster: 'M',
  elite: 'E',
  event: '?',
  shop: '$',
  rest: 'R',
  boss: 'B',
};

export const NODE_LABELS: Record<NodeType, string> = {
  start: 'Start',
  monster: 'Monster',
  elite: 'Elite',
  event: 'Event',
  shop: 'Shop',
  rest: 'Rest Site',
  boss: 'Boss',
};

/**
 * Render the dungeon map as ASCII art.
 * Shows current position with [] brackets, visited with (.), available with [ ].
 */
export function renderMap(map: DungeonMap): string[] {
  const lines: string[] = [];
  const current = getCurrentNode(map);

  lines.push('╔══════════════════════════════╗');
  lines.push(`║  FLOOR ${map.floor} MAP                  ║`);
  lines.push('╠══════════════════════════════╣');

  // Group nodes by row
  const byRow = new Map<number, MapNode[]>();
  for (const n of map.nodes) {
    if (!byRow.has(n.row)) byRow.set(n.row, []);
    byRow.get(n.row)!.push(n);
  }

  const maxRow = Math.max(...map.nodes.map(n => n.row));

  for (let row = maxRow; row >= 0; row--) {
    const rowNodes = byRow.get(row) ?? [];
    rowNodes.sort((a, b) => a.col - b.col);

    if (rowNodes.length === 1) {
      // Single node (start, mid, boss)
      const n = rowNodes[0];
      const sym = getNodeDisplay(n, current);
      lines.push(`║         ${sym}                   ║`);
    } else {
      // 3 columns
      const cols = [0, 1, 2].map(c => rowNodes.find(n => n.col === c));
      const displays = cols.map(n => n ? getNodeDisplay(n, current) : '   ');
      lines.push(`║  ${displays[0]}  ${displays[1]}  ${displays[2]}           ║`);
    }

    // Show connections going down (between rows)
    if (row > 0) {
      lines.push('║                              ║');
    }
  }

  lines.push('╚══════════════════════════════╝');

  // Legend
  lines.push('');
  lines.push('Legend: [X]=current  .X.=visited  (X)=available  X=future');
  lines.push('M=Monster E=Elite ?=Event $=Shop R=Rest B=Boss');

  return lines;
}

function getNodeDisplay(n: MapNode, current: MapNode | undefined): string {
  const sym = NODE_SYMBOLS[n.type];
  if (current && n.id === current.id) return `[${sym}]`;
  if (n.visited) return `.${sym}.`;
  if (n.available) return `(${sym})`;
  return ` ${sym} `;
}

export function getPathChoices(map: DungeonMap): { index: number; direction: string; node: MapNode }[] {
  const available = getAvailableNodes(map);
  const directions = ['left', 'center', 'right'];
  return available.map((node, i) => ({
    index: i + 1,
    direction: directions[i] ?? `path${i + 1}`,
    node,
  }));
}
