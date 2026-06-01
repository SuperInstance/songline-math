/**
 * @module dreamtime
 * Dreamtime layer — the metaphysical topology beneath the graph.
 *
 * Implements persistent homology on knowledge graphs: identifies which
 * cycles are "real" (persistent) vs noise. Computes Betti numbers of
 * the knowledge space.
 */

import type { Coordinates, KnowledgeGraph, Waypoint } from "./song.js";

/** Betti numbers: topological invariants of the knowledge space. */
export interface BettiNumbers {
  /** β₀: number of connected components. */
  b0: number;
  /** β₁: number of independent cycles (1-dimensional holes). */
  b1: number;
}

/** A persistent cycle: a topological feature that persists across scales. */
export interface PersistentCycle {
  /** Nodes forming the cycle. */
  nodes: string[];
  /** Birth distance (scale at which cycle appears). */
  birth: number;
  /** Death distance (scale at which cycle fills in). */
  death: number;
  /** Persistence = death - birth (higher = more significant). */
  persistence: number;
}

/**
 * Compute the distance matrix for all nodes in the graph.
 * Uses Euclidean distance between knowledge-space coordinates.
 *
 * @param graph - The knowledge graph
 * @returns Distance matrix and ordered node IDs
 */
export function distanceMatrix(
  graph: KnowledgeGraph,
): { ids: string[]; distances: number[][] } {
  const ids = Array.from(graph.nodes.keys());
  const waypoints = ids.map((id) => graph.nodes.get(id)!);
  const n = ids.length;

  const distances: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const d = euclidean(waypoints[i].coordinates, waypoints[j].coordinates);
      distances[i][j] = d;
      distances[j][i] = d;
    }
  }

  return { ids, distances };
}

/**
 * Compute Betti numbers of the knowledge space using Vietoris-Rips
 * filtration at a given scale threshold.
 *
 * @param graph - The knowledge graph
 * @param threshold - Distance threshold for the filtration
 * @returns Betti numbers β₀ and β₁
 */
export function bettiNumbers(graph: KnowledgeGraph, threshold: number): BettiNumbers {
  const { ids, distances } = distanceMatrix(graph);
  const n = ids.length;

  // Union-Find for connected components (β₀)
  const parent = new Array<number>(n);
  for (let i = 0; i < n; i++) parent[i] = i;

  const find = (x: number): number => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  };

  const union = (a: number, b: number): void => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[ra] = rb;
  };

  // Build simplicial complex at given threshold
  const edges: Array<[number, number]> = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (distances[i][j] <= threshold) {
        edges.push([i, j]);
        union(i, j);
      }
    }
  }

  // β₀ = number of connected components
  const roots = new Set<number>();
  for (let i = 0; i < n; i++) roots.add(find(i));
  const b0 = roots.size;

  // β₁ = cycles in the 1-skeleton (Euler characteristic approach)
  // V - E + F = 2 for planar, but for general: β₁ = E - V + β₀
  // More precisely: β₁ = E - V + number_of_components (for 1-complex)
  const V = n;
  const E = edges.length;
  const b1 = Math.max(0, E - V + b0);

  return { b0, b1 };
}

/**
 * Compute persistent cycles by sweeping through distance thresholds.
 * A cycle is "born" when enough edges form it and "dies" when it fills in.
 *
 * @param graph - The knowledge graph
 * @param numSteps - Number of filtration steps (default 20)
 * @returns Array of persistent cycles sorted by persistence
 */
export function persistentCycles(
  graph: KnowledgeGraph,
  numSteps = 20,
): PersistentCycle[] {
  const { ids, distances } = distanceMatrix(graph);
  const n = ids.length;
  if (n < 3) return [];

  // Find distance range
  let maxDist = 0;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      maxDist = Math.max(maxDist, distances[i][j]);
    }
  }

  const step = maxDist / numSteps;
  const results: PersistentCycle[] = [];

  // Track cycle birth/death across filtration
  let prevB1 = 0;
  const bornCycles: Array<{ birth: number; nodeSet: Set<number> }> = [];

  for (let stepIdx = 0; stepIdx <= numSteps; stepIdx++) {
    const threshold = stepIdx * step;
    const betti = bettiNumbersAtThreshold(ids, distances, n, threshold);
    const currentB1 = betti.b1;

    // New cycles born
    while (bornCycles.length + results.length < currentB1) {
      bornCycles.push({ birth: threshold, nodeSet: new Set() });
    }

    // Cycles dying
    while (bornCycles.length + results.length > currentB1 && bornCycles.length > 0) {
      const cycle = bornCycles.pop()!;
      if (threshold - cycle.birth > 0) {
        // Find actual cycle nodes at the birth threshold
        const cycleNodes = findCycleAtThreshold(ids, distances, n, cycle.birth);
        results.push({
          nodes: cycleNodes,
          birth: cycle.birth,
          death: threshold,
          persistence: threshold - cycle.birth,
        });
      }
    }

    prevB1 = currentB1;
  }

  // Remaining born cycles die at infinity
  const infinity = maxDist * 2;
  for (const cycle of bornCycles) {
    const cycleNodes = findCycleAtThreshold(ids, distances, n, cycle.birth);
    results.push({
      nodes: cycleNodes,
      birth: cycle.birth,
      death: infinity,
      persistence: infinity - cycle.birth,
    });
  }

  return results.sort((a, b) => b.persistence - a.persistence);
}

/**
 * Compute Betti numbers at a given threshold using distance matrix.
 */
function bettiNumbersAtThreshold(
  _ids: string[],
  distances: number[][],
  n: number,
  threshold: number,
): BettiNumbers {
  const parent = new Array<number>(n);
  for (let i = 0; i < n; i++) parent[i] = i;

  const find = (x: number): number => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  };

  const union = (a: number, b: number): boolean => {
    const ra = find(a);
    const rb = find(b);
    if (ra === rb) return false;
    parent[ra] = rb;
    return true;
  };

  let edgeCount = 0;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (distances[i][j] <= threshold) {
        if (union(i, j)) {
          // Edge connects different components
        }
        edgeCount++;
      }
    }
  }

  const roots = new Set<number>();
  for (let i = 0; i < n; i++) roots.add(find(i));

  return {
    b0: roots.size,
    b1: Math.max(0, edgeCount - n + roots.size),
  };
}

/**
 * Find a cycle in the graph at a given threshold.
 */
function findCycleAtThreshold(
  ids: string[],
  distances: number[][],
  n: number,
  threshold: number,
): string[] {
  // Build adjacency at threshold
  const adj = new Map<number, number[]>();
  for (let i = 0; i < n; i++) adj.set(i, []);

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (distances[i][j] <= threshold) {
        adj.get(i)!.push(j);
        adj.get(j)!.push(i);
      }
    }
  }

  // DFS to find a cycle
  const visited = new Set<number>();
  const stack: Array<{ node: number; parent: number; path: number[] }> = [];

  for (let start = 0; start < n; start++) {
    if (visited.has(start)) continue;
    stack.push({ node: start, parent: -1, path: [start] });

    while (stack.length > 0) {
      const { node, parent, path } = stack.pop()!;
      if (visited.has(node)) {
        // Found cycle
        const cycleStart = path.indexOf(node);
        if (cycleStart >= 0 && path.length - cycleStart >= 3) {
          return path.slice(cycleStart).map((i) => ids[i]);
        }
        continue;
      }
      visited.add(node);

      for (const neighbor of adj.get(node) ?? []) {
        if (neighbor !== parent) {
          stack.push({ node: neighbor, parent: node, path: [...path, neighbor] });
        }
      }
    }
  }

  return ids.slice(0, Math.min(3, ids.length));
}

/**
 * Compute the persistence barcode: for each scale, how many features exist.
 * @param graph - The knowledge graph
 * @param numSteps - Number of filtration steps
 * @returns Array of {threshold, b0, b1} values
 */
export function persistenceBarcode(
  graph: KnowledgeGraph,
  numSteps = 20,
): Array<{ threshold: number; b0: number; b1: number }> {
  const { ids, distances } = distanceMatrix(graph);
  const n = ids.length;

  let maxDist = 0;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      maxDist = Math.max(maxDist, distances[i][j]);
    }
  }

  const barcode: Array<{ threshold: number; b0: number; b1: number }> = [];
  const step = maxDist / numSteps;

  for (let s = 0; s <= numSteps; s++) {
    const threshold = s * step;
    const betti = bettiNumbersAtThreshold(ids, distances, n, threshold);
    barcode.push({ threshold, ...betti });
  }

  return barcode;
}

/** Euclidean distance helper. */
function euclidean(a: Coordinates, b: Coordinates): number {
  let sum = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}
