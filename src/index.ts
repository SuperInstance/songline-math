/**
 * @module index
 * Unified API — SonglineGraph class combining all modules.
 *
 * Songlines are Australian Aboriginal navigation systems — songs that
 * encode geography. This package implements the mathematics of navigable
 * knowledge graphs: paths through information that you can sing (traverse)
 * to reach any destination.
 *
 * @example
 * ```typescript
 * import { SonglineGraph } from "songline-math";
 *
 * const sg = new SonglineGraph();
 * sg.addWaypoint("A", [0, 0]);
 * sg.addWaypoint("B", [1, 0]);
 * sg.addWaypoint("C", [1, 1]);
 * sg.addVerse("A", "B", 1.0);
 * sg.addVerse("B", "C", 1.5);
 *
 * const path = sg.sing("A", "C");
 * console.log(path.path); // ["A", "B", "C"]
 * ```
 */

// Re-export all types and functions from submodules
export type { Waypoint, Verse, Song, KnowledgeGraph, Coordinates } from "./song.js";
export {
  coordinateDistance,
  buildGraph,
  buildSongFromPath,
  extractSubSong,
  songCost,
  isValidSong,
  reverseSong,
  concatenateSongs,
} from "./song.js";

export type { PathResult } from "./navigation.js";
export { singPath, dreamtimeTraversal, reachableNodes, pathExists, navigability } from "./navigation.js";

export type { Corroboree } from "./corroboree.js";
export {
  findCorroborees,
  clusterBySongs,
  songIntersection,
  findHubs,
  modularity,
} from "./corroboree.js";

export type { BettiNumbers, PersistentCycle } from "./dreamtime.js";
export {
  distanceMatrix,
  bettiNumbers,
  persistentCycles,
  persistenceBarcode,
} from "./dreamtime.js";

export type { EvolutionConfig, ScoredSong, Tradition } from "./tradition.js";
export {
  DEFAULT_CONFIG,
  createTradition,
  computeFitness,
  mutateSong,
  recombineSongs,
  evolveGeneration,
  recordUsage,
  fittestSong,
} from "./tradition.js";

import type { Waypoint, Verse, Song, KnowledgeGraph } from "./song.js";
import { buildGraph, buildSongFromPath, extractSubSong, songCost, isValidSong, reverseSong, concatenateSongs } from "./song.js";
import { singPath, dreamtimeTraversal, reachableNodes, pathExists, navigability } from "./navigation.js";
import { findCorroborees, clusterBySongs, songIntersection, findHubs, modularity } from "./corroboree.js";
import { distanceMatrix, bettiNumbers, persistentCycles, persistenceBarcode } from "./dreamtime.js";
import {
  createTradition,
  evolveGeneration,
  recordUsage,
  fittestSong,
  computeFitness,
} from "./tradition.js";
import type { Tradition, ScoredSong, EvolutionConfig, BettiNumbers, PersistentCycle, PathResult, Corroboree } from "./index.js";

/**
 * SonglineGraph: unified API for songline mathematics.
 *
 * Combines graph construction, navigation, corroboree analysis,
 * dreamtime topology, and tradition evolution into one interface.
 */
export class SonglineGraph {
  private _waypoints: Map<string, Waypoint> = new Map();
  private _verses: Verse[] = [];
  private _songs: Song[] = [];

  // --- Graph Construction ---

  /**
   * Add a waypoint to the knowledge graph.
   * @param id - Unique identifier
   * @param coordinates - Position in knowledge space
   * @param metadata - Optional metadata
   */
  addWaypoint(id: string, coordinates: number[], metadata?: Record<string, unknown>): void {
    this._waypoints.set(id, { id, coordinates, metadata });
  }

  /**
   * Add a verse (directed edge) between two waypoints.
   * @param from - Source waypoint ID
   * @param to - Target waypoint ID
   * @param weight - Traversal weight/cost
   * @param metadata - Optional metadata
   */
  addVerse(from: string, to: string, weight: number, metadata?: Record<string, unknown>): void {
    this._verses.push({ from, to, weight, metadata });
  }

  /**
   * Get the underlying knowledge graph.
   * @returns KnowledgeGraph
   */
  getGraph(): KnowledgeGraph {
    return buildGraph(Array.from(this._waypoints.values()), this._verses);
  }

  /**
   * Get all waypoint IDs.
   */
  get waypointIds(): string[] {
    return Array.from(this._waypoints.keys());
  }

  /**
   * Get all verses.
   */
  get verses(): Verse[] {
    return [...this._verses];
  }

  /**
   * Get a waypoint by ID.
   * @param id - Waypoint ID
   * @returns The waypoint or undefined
   */
  getWaypoint(id: string): Waypoint | undefined {
    return this._waypoints.get(id);
  }

  // --- Song Management ---

  /**
   * Register a song with this graph.
   * @param song - The song to register
   */
  addSong(song: Song): void {
    this._songs.push(song);
  }

  /**
   * Build and register a song from a path.
   * @param path - Ordered waypoint IDs
   * @param songId - Optional song ID
   * @returns The built song
   */
  buildSong(path: string[], songId?: string): Song {
    const graph = this.getGraph();
    const song = buildSongFromPath(graph, path, songId);
    this._songs.push(song);
    return song;
  }

  /**
   * Get all registered songs.
   */
  get songs(): Song[] {
    return [...this._songs];
  }

  // --- Navigation ---

  /**
   * Sing your way from source to target.
   * Uses songline pathfinding with dreamtime fallback.
   *
   * @param source - Starting waypoint ID
   * @param target - Target waypoint ID
   * @returns PathResult
   */
  sing(source: string, target: string): PathResult {
    return singPath(this.getGraph(), source, target);
  }

  /**
   * Find all waypoints reachable from a source.
   * @param source - Source waypoint ID
   * @returns Set of reachable waypoint IDs
   */
  reachable(source: string): Set<string> {
    return reachableNodes(this.getGraph(), source);
  }

  /**
   * Check if a path exists between two waypoints.
   * @param source - Source
   * @param target - Target
   * @returns True if reachable via normal edges
   */
  hasPath(source: string, target: string): boolean {
    return pathExists(this.getGraph(), source, target);
  }

  /**
   * Compute overall navigability of this graph (0–1).
   */
  get navigabilityScore(): number {
    return navigability(this.getGraph());
  }

  // --- Song Operations ---

  /**
   * Reverse a registered song.
   * @param songId - ID of the song to reverse
   * @returns Reversed song
   */
  reverseSong(songId: string): Song | null {
    const song = this._songs.find((s) => s.id === songId);
    return song ? reverseSong(song) : null;
  }

  /**
   * Extract a sub-song from a registered song.
   * @param songId - Parent song ID
   * @param start - Start index
   * @param end - End index
   * @returns Sub-song
   */
  subSong(songId: string, start: number, end: number): Song | null {
    const song = this._songs.find((s) => s.id === songId);
    return song ? extractSubSong(song, start, end) : null;
  }

  /**
   * Get the cost of a registered song.
   * @param songId - Song ID
   * @returns Total cost, or null if not found
   */
  songCost(songId: string): number | null {
    const song = this._songs.find((s) => s.id === songId);
    return song ? songCost(song) : null;
  }

  // --- Corroboree ---

  /**
   * Find corroborees (convergence hubs) among registered songs.
   * @returns Array of corroborees
   */
  corroborees(): Corroboree[] {
    return findCorroborees(this._songs);
  }

  /**
   * Cluster waypoints by shared songlines.
   * @param threshold - Minimum shared songs for clustering
   * @returns Array of clusters
   */
  clusters(threshold = 2): string[][] {
    return clusterBySongs(this._songs, threshold);
  }

  /**
   * Find intersection of two registered songs.
   * @param songIdA - First song ID
   * @param songIdB - Second song ID
   * @returns Shared waypoint IDs
   */
  songIntersection(songIdA: string, songIdB: string): string[] {
    const a = this._songs.find((s) => s.id === songIdA);
    const b = this._songs.find((s) => s.id === songIdB);
    if (!a || !b) return [];
    return songIntersection(a, b);
  }

  /**
   * Find knowledge hubs (high-degree nodes).
   * @param topN - Number of top hubs
   * @returns Array of hubs
   */
  hubs(topN = 5): Array<{ waypoint: Waypoint; degree: number }> {
    return findHubs(this.getGraph(), topN);
  }

  // --- Dreamtime ---

  /**
   * Compute Betti numbers at a given scale threshold.
   * @param threshold - Distance threshold
   * @returns Betti numbers β₀ and β₁
   */
  topology(threshold: number): BettiNumbers {
    return bettiNumbers(this.getGraph(), threshold);
  }

  /**
   * Find persistent cycles in the knowledge space.
   * @param numSteps - Filtration resolution
   * @returns Array of persistent cycles
   */
  persistentCycles(numSteps = 20): PersistentCycle[] {
    return persistentCycles(this.getGraph(), numSteps);
  }

  /**
   * Get persistence barcode across scales.
   * @param numSteps - Number of steps
   * @returns Barcode data
   */
  barcode(numSteps = 20): Array<{ threshold: number; b0: number; b1: number }> {
    return persistenceBarcode(this.getGraph(), numSteps);
  }

  /**
   * Compute the distance matrix.
   * @returns Distance matrix and node IDs
   */
  distances(): { ids: string[]; distances: number[][] } {
    return distanceMatrix(this.getGraph());
  }

  // --- Tradition ---

  /**
   * Create a tradition from registered songs and evolve it.
   * @param id - Tradition ID
   * @param generations - Number of generations to evolve
   * @param config - Evolution config
   * @returns Evolved tradition
   */
  evolve(
    id: string,
    generations = 10,
    config?: Partial<EvolutionConfig>,
  ): Tradition {
    let tradition = createTradition(id, this._songs, config);
    const graph = this.getGraph();
    for (let i = 0; i < generations; i++) {
      tradition = evolveGeneration(tradition, graph);
    }
    return tradition;
  }

  /**
   * Get the fittest song from a tradition.
   * @param tradition - The tradition
   * @returns Fittest scored song
   */
  getFittest(tradition: Tradition): ScoredSong | null {
    return fittestSong(tradition);
  }
}
