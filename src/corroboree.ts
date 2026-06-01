/**
 * @module corroboree
 * Song convergence — when multiple songlines meet at a waypoint,
 * they create a corroboree (gathering).
 *
 * Implements graph clustering via songline intersection. Find knowledge
 * hubs where multiple traditions converge.
 */

import type { KnowledgeGraph, Song, Verse, Waypoint } from "./song.js";

/** A corroboree: a convergence point where multiple songs meet. */
export interface Corroboree {
  /** The waypoint where songs converge. */
  waypoint: Waypoint;
  /** IDs of songs that pass through this waypoint. */
  songIds: string[];
  /** Number of distinct traditions converging. */
  convergence: number;
  /** Average weight of incoming verses at this hub. */
  avgWeight: number;
}

/**
 * Find corroborees (convergence hubs) in a collection of songs.
 * A corroboree occurs where multiple songs share a waypoint.
 *
 * @param songs - Array of songs to analyze
 * @returns Array of corroborees sorted by convergence (descending)
 */
export function findCorroborees(songs: Song[]): Corroboree[] {
  const waypointSongs = new Map<string, Set<string>>();
  const waypointData = new Map<string, Waypoint>();
  const waypointWeights = new Map<string, number[]>();

  for (const song of songs) {
    for (let i = 0; i < song.waypoints.length; i++) {
      const wp = song.waypoints[i];
      if (!waypointSongs.has(wp.id)) {
        waypointSongs.set(wp.id, new Set());
        waypointData.set(wp.id, wp);
        waypointWeights.set(wp.id, []);
      }
      waypointSongs.get(wp.id)!.add(song.id);

      // Collect incoming verse weights
      if (i > 0) {
        const verse = song.verses[i - 1];
        waypointWeights.get(wp.id)!.push(verse.weight);
      }
      if (i < song.verses.length) {
        const verse = song.verses[i];
        waypointWeights.get(wp.id)!.push(verse.weight);
      }
    }
  }

  const corroborees: Corroboree[] = [];
  for (const [wpId, songSet] of waypointSongs) {
    if (songSet.size >= 2) {
      const weights = waypointWeights.get(wpId) ?? [];
      const avg = weights.length > 0
        ? weights.reduce((a, b) => a + b, 0) / weights.length
        : 0;

      corroborees.push({
        waypoint: waypointData.get(wpId)!,
        songIds: Array.from(songSet),
        convergence: songSet.size,
        avgWeight: avg,
      });
    }
  }

  return corroborees.sort((a, b) => b.convergence - a.convergence);
}

/**
 * Cluster nodes by songline intersection patterns.
 * Two nodes are in the same cluster if they share enough songs.
 *
 * @param songs - Array of songs
 * @param threshold - Minimum shared songs to be in same cluster (default 2)
 * @returns Array of clusters (each is an array of waypoint IDs)
 */
export function clusterBySongs(songs: Song[], threshold = 2): string[][] {
  // Build: nodeId → set of song IDs
  const nodeSongs = new Map<string, Set<string>>();
  for (const song of songs) {
    for (const wp of song.waypoints) {
      if (!nodeSongs.has(wp.id)) nodeSongs.set(wp.id, new Set());
      nodeSongs.get(wp.id)!.add(song.id);
    }
  }

  const nodeIds = Array.from(nodeSongs.keys());
  const parent = new Map<string, string>();
  for (const id of nodeIds) parent.set(id, id);

  const find = (x: string): string => {
    while (parent.get(x) !== x) {
      parent.set(x, parent.get(parent.get(x)!)!);
      x = parent.get(x)!;
    }
    return x;
  };

  const union = (a: string, b: string): void => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  };

  for (let i = 0; i < nodeIds.length; i++) {
    for (let j = i + 1; j < nodeIds.length; j++) {
      const setA = nodeSongs.get(nodeIds[i])!;
      const setB = nodeSongs.get(nodeIds[j])!;
      const shared = [...setA].filter((s) => setB.has(s)).length;
      if (shared >= threshold) {
        union(nodeIds[i], nodeIds[j]);
      }
    }
  }

  const clusters = new Map<string, string[]>();
  for (const id of nodeIds) {
    const root = find(id);
    if (!clusters.has(root)) clusters.set(root, []);
    clusters.get(root)!.push(id);
  }

  return Array.from(clusters.values()).sort((a, b) => b.length - a.length);
}

/**
 * Find the intersection of two songs: waypoints they share.
 * @param a - First song
 * @param b - Second song
 * @returns Array of shared waypoint IDs
 */
export function songIntersection(a: Song, b: Song): string[] {
  const bIds = new Set(b.waypoints.map((wp) => wp.id));
  return a.waypoints.filter((wp) => bIds.has(wp.id)).map((wp) => wp.id);
}

/**
 * Find knowledge hubs: nodes with the highest degree in the combined graph.
 * @param graph - The knowledge graph
 * @param topN - Number of top hubs to return (default 5)
 * @returns Array of {waypoint, degree} sorted by degree
 */
export function findHubs(
  graph: KnowledgeGraph,
  topN = 5,
): Array<{ waypoint: Waypoint; degree: number }> {
  const degrees = new Map<string, number>();
  for (const [nodeId, edges] of graph.edges) {
    degrees.set(nodeId, (degrees.get(nodeId) ?? 0) + edges.length);
  }

  const sorted = Array.from(degrees.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN);

  return sorted
    .map(([id, degree]) => {
      const wp = graph.nodes.get(id);
      return wp ? { waypoint: wp, degree } : null;
    })
    .filter((x): x is { waypoint: Waypoint; degree: number } => x !== null);
}

/**
 * Compute the modularity of a clustering partition.
 * Measures how well the clusters separate the graph into dense subgraphs.
 *
 * @param graph - The knowledge graph
 * @param clusters - Array of clusters (node ID arrays)
 * @returns Modularity score (-0.5 to 1.0)
 */
export function modularity(graph: KnowledgeGraph, clusters: string[][]): number {
  let totalEdges = 0;
  for (const edges of graph.edges.values()) totalEdges += edges.length;
  if (totalEdges === 0) return 0;

  const clusterMap = new Map<string, number>();
  clusters.forEach((cluster, idx) => {
    for (const id of cluster) clusterMap.set(id, idx);
  });

  let q = 0;
  for (const [nodeId, edges] of graph.edges) {
    const nodeDeg = edges.length;
    for (const edge of edges) {
      const sameCluster = clusterMap.get(nodeId) === clusterMap.get(edge.to);
      const targetDeg = (graph.edges.get(edge.to) ?? []).length;
      if (sameCluster) {
        q += 1 - (nodeDeg * targetDeg) / totalEdges;
      } else {
        q -= (nodeDeg * targetDeg) / totalEdges;
      }
    }
  }

  return q / totalEdges;
}
