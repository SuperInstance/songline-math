/**
 * @module navigation
 * Pathfinding through knowledge graphs using songline algorithms.
 *
 * Unlike Dijkstra, songlines prefer paths through well-known territory
 * (high-weight nodes). Implements "singing your way home" — always finding
 * a path even in sparse graphs via dreamtime traversal.
 */

import type { KnowledgeGraph, Verse, Waypoint } from "./song.js";

/** A path result: sequence of waypoint IDs with total cost. */
export interface PathResult {
  /** Ordered waypoint IDs from source to target. */
  path: string[];
  /** Total traversal cost. */
  cost: number;
  /** Whether dreamtime (fallback) traversal was used. */
  dreamtime: boolean;
}

/**
 * Sing your way home: find a path from source to target through the
 * knowledge graph, preferring well-known territory (nodes with many edges
 * or high connectivity).
 *
 * @param graph - The knowledge graph
 * @param source - Starting waypoint ID
 * @param target - Target waypoint ID
 * @param options - Optional configuration
 * @returns PathResult with the found path
 */
export function singPath(
  graph: KnowledgeGraph,
  source: string,
  target: string,
  options?: { maxIterations?: number },
): PathResult {
  const maxIter = options?.maxIterations ?? 10000;

  if (source === target) {
    return { path: [source], cost: 0, dreamtime: false };
  }

  // Priority queue (min-heap) using array for simplicity
  // Entry: [cost, nodeId, path[], dreamtime]
  const visited = new Set<string>();
  const queue: Array<{ cost: number; node: string; path: string[]; dreamtime: boolean }> = [];

  queue.push({ cost: 0, node: source, path: [source], dreamtime: false });

  let iterations = 0;
  while (queue.length > 0 && iterations < maxIter) {
    iterations++;
    // Sort to get cheapest first (simple priority queue)
    queue.sort((a, b) => a.cost - b.cost);
    const current = queue.shift()!;

    if (current.node === target) {
      return {
        path: current.path,
        cost: current.cost,
        dreamtime: current.dreamtime,
      };
    }

    if (visited.has(current.node)) continue;
    visited.add(current.node);

    const edges = graph.edges.get(current.node) ?? [];
    for (const edge of edges) {
      if (!visited.has(edge.to)) {
        // Prefer well-known territory: reduce cost for highly-connected nodes
        const targetEdges = graph.edges.get(edge.to) ?? [];
        const popularityBonus = Math.max(0, 1 - 1 / (targetEdges.length + 1));
        const adjustedWeight = edge.weight * (1 - popularityBonus * 0.3);

        queue.push({
          cost: current.cost + adjustedWeight,
          node: edge.to,
          path: [...current.path, edge.to],
          dreamtime: current.dreamtime,
        });
      }
    }
  }

  // No path found via normal traversal — use dreamtime fallback
  return dreamtimeTraversal(graph, source, target);
}

/**
 * Dreamtime traversal: when no path exists through normal edges,
 * create a "dreaming" path by hopping through knowledge-space proximity.
 * This always finds a path, even in disconnected graphs.
 *
 * @param graph - The knowledge graph
 * @param source - Starting waypoint ID
 * @param target - Target waypoint ID
 * @returns PathResult with dreamtime=true
 */
export function dreamtimeTraversal(
  graph: KnowledgeGraph,
  source: string,
  target: string,
): PathResult {
  if (source === target) {
    return { path: [source], cost: 0, dreamtime: true };
  }

  const allNodes = Array.from(graph.nodes.values());
  const sourceWp = graph.nodes.get(source)!;
  const targetWp = graph.nodes.get(target)!;

  if (!sourceWp || !targetWp) {
    return { path: [source], cost: Infinity, dreamtime: true };
  }

  // Greedy: at each step, hop to the node closest in knowledge space
  // that brings us nearer to the target
  const path = [source];
  const visited = new Set<string>([source]);
  let current = source;

  for (let i = 0; i < allNodes.length; i++) {
    if (current === target) break;

    const currentWp = graph.nodes.get(current)!;
    const currentDist = coordDist(currentWp.coordinates, targetWp.coordinates);

    let bestNode: string | null = null;
    let bestScore = Infinity;

    for (const node of allNodes) {
      if (visited.has(node.id)) continue;
      const nodeDist = coordDist(node.coordinates, targetWp.coordinates);
      // Score: prefer nodes that reduce distance to target
      const improvement = nodeDist - currentDist;
      // Add a small actual-distance cost
      const hopDist = coordDist(currentWp.coordinates, node.coordinates);
      const score = improvement + hopDist * 0.5;

      if (score < bestScore) {
        bestScore = score;
        bestNode = node.id;
      }
    }

    if (bestNode === null) break;
    visited.add(bestNode);
    path.push(bestNode);
    current = bestNode;
  }

  if (path[path.length - 1] !== target) {
    path.push(target);
  }

  // Compute cost based on knowledge-space distance
  let cost = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const a = graph.nodes.get(path[i])!;
    const b = graph.nodes.get(path[i + 1])!;
    cost += coordDist(a.coordinates, b.coordinates);
  }

  return { path, cost, dreamtime: true };
}

/**
 * Find all reachable nodes from a given source.
 * @param graph - The knowledge graph
 * @param source - Starting waypoint ID
 * @returns Set of reachable waypoint IDs
 */
export function reachableNodes(graph: KnowledgeGraph, source: string): Set<string> {
  const visited = new Set<string>();
  const queue = [source];

  while (queue.length > 0) {
    const node = queue.shift()!;
    if (visited.has(node)) continue;
    visited.add(node);

    const edges = graph.edges.get(node) ?? [];
    for (const edge of edges) {
      if (!visited.has(edge.to)) {
        queue.push(edge.to);
      }
    }
  }

  return visited;
}

/**
 * Check if a path exists between source and target using normal edges.
 * @param graph - The knowledge graph
 * @param source - Source waypoint ID
 * @param target - Target waypoint ID
 * @returns True if a normal path exists
 */
export function pathExists(graph: KnowledgeGraph, source: string, target: string): boolean {
  const reachable = reachableNodes(graph, source);
  return reachable.has(target);
}

/**
 * Compute the navigability of the graph: fraction of node pairs
 * that have a path between them (not counting dreamtime).
 * @param graph - The knowledge graph
 * @returns Navigability score between 0 and 1
 */
export function navigability(graph: KnowledgeGraph): number {
  const nodeIds = Array.from(graph.nodes.keys());
  if (nodeIds.length <= 1) return 1;

  let connected = 0;
  let total = 0;

  for (let i = 0; i < nodeIds.length; i++) {
    const reachable = reachableNodes(graph, nodeIds[i]);
    for (let j = i + 1; j < nodeIds.length; j++) {
      total++;
      if (reachable.has(nodeIds[j])) connected++;
    }
  }

  return total === 0 ? 1 : connected / total;
}

/** Euclidean distance helper. */
function coordDist(a: number[], b: number[]): number {
  let sum = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}
