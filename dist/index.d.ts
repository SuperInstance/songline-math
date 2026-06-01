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
export type { Waypoint, Verse, Song, KnowledgeGraph, Coordinates } from "./song.js";
export { coordinateDistance, buildGraph, buildSongFromPath, extractSubSong, songCost, isValidSong, reverseSong, concatenateSongs, } from "./song.js";
export type { PathResult } from "./navigation.js";
export { singPath, dreamtimeTraversal, reachableNodes, pathExists, navigability } from "./navigation.js";
export type { Corroboree } from "./corroboree.js";
export { findCorroborees, clusterBySongs, songIntersection, findHubs, modularity, } from "./corroboree.js";
export type { BettiNumbers, PersistentCycle } from "./dreamtime.js";
export { distanceMatrix, bettiNumbers, persistentCycles, persistenceBarcode, } from "./dreamtime.js";
export type { EvolutionConfig, ScoredSong, Tradition } from "./tradition.js";
export { DEFAULT_CONFIG, createTradition, computeFitness, mutateSong, recombineSongs, evolveGeneration, recordUsage, fittestSong, } from "./tradition.js";
import type { Waypoint, Verse, Song, KnowledgeGraph } from "./song.js";
import type { Tradition, ScoredSong, EvolutionConfig, BettiNumbers, PersistentCycle, PathResult, Corroboree } from "./index.js";
/**
 * SonglineGraph: unified API for songline mathematics.
 *
 * Combines graph construction, navigation, corroboree analysis,
 * dreamtime topology, and tradition evolution into one interface.
 */
export declare class SonglineGraph {
    private _waypoints;
    private _verses;
    private _songs;
    /**
     * Add a waypoint to the knowledge graph.
     * @param id - Unique identifier
     * @param coordinates - Position in knowledge space
     * @param metadata - Optional metadata
     */
    addWaypoint(id: string, coordinates: number[], metadata?: Record<string, unknown>): void;
    /**
     * Add a verse (directed edge) between two waypoints.
     * @param from - Source waypoint ID
     * @param to - Target waypoint ID
     * @param weight - Traversal weight/cost
     * @param metadata - Optional metadata
     */
    addVerse(from: string, to: string, weight: number, metadata?: Record<string, unknown>): void;
    /**
     * Get the underlying knowledge graph.
     * @returns KnowledgeGraph
     */
    getGraph(): KnowledgeGraph;
    /**
     * Get all waypoint IDs.
     */
    get waypointIds(): string[];
    /**
     * Get all verses.
     */
    get verses(): Verse[];
    /**
     * Get a waypoint by ID.
     * @param id - Waypoint ID
     * @returns The waypoint or undefined
     */
    getWaypoint(id: string): Waypoint | undefined;
    /**
     * Register a song with this graph.
     * @param song - The song to register
     */
    addSong(song: Song): void;
    /**
     * Build and register a song from a path.
     * @param path - Ordered waypoint IDs
     * @param songId - Optional song ID
     * @returns The built song
     */
    buildSong(path: string[], songId?: string): Song;
    /**
     * Get all registered songs.
     */
    get songs(): Song[];
    /**
     * Sing your way from source to target.
     * Uses songline pathfinding with dreamtime fallback.
     *
     * @param source - Starting waypoint ID
     * @param target - Target waypoint ID
     * @returns PathResult
     */
    sing(source: string, target: string): PathResult;
    /**
     * Find all waypoints reachable from a source.
     * @param source - Source waypoint ID
     * @returns Set of reachable waypoint IDs
     */
    reachable(source: string): Set<string>;
    /**
     * Check if a path exists between two waypoints.
     * @param source - Source
     * @param target - Target
     * @returns True if reachable via normal edges
     */
    hasPath(source: string, target: string): boolean;
    /**
     * Compute overall navigability of this graph (0–1).
     */
    get navigabilityScore(): number;
    /**
     * Reverse a registered song.
     * @param songId - ID of the song to reverse
     * @returns Reversed song
     */
    reverseSong(songId: string): Song | null;
    /**
     * Extract a sub-song from a registered song.
     * @param songId - Parent song ID
     * @param start - Start index
     * @param end - End index
     * @returns Sub-song
     */
    subSong(songId: string, start: number, end: number): Song | null;
    /**
     * Get the cost of a registered song.
     * @param songId - Song ID
     * @returns Total cost, or null if not found
     */
    songCost(songId: string): number | null;
    /**
     * Find corroborees (convergence hubs) among registered songs.
     * @returns Array of corroborees
     */
    corroborees(): Corroboree[];
    /**
     * Cluster waypoints by shared songlines.
     * @param threshold - Minimum shared songs for clustering
     * @returns Array of clusters
     */
    clusters(threshold?: number): string[][];
    /**
     * Find intersection of two registered songs.
     * @param songIdA - First song ID
     * @param songIdB - Second song ID
     * @returns Shared waypoint IDs
     */
    songIntersection(songIdA: string, songIdB: string): string[];
    /**
     * Find knowledge hubs (high-degree nodes).
     * @param topN - Number of top hubs
     * @returns Array of hubs
     */
    hubs(topN?: number): Array<{
        waypoint: Waypoint;
        degree: number;
    }>;
    /**
     * Compute Betti numbers at a given scale threshold.
     * @param threshold - Distance threshold
     * @returns Betti numbers β₀ and β₁
     */
    topology(threshold: number): BettiNumbers;
    /**
     * Find persistent cycles in the knowledge space.
     * @param numSteps - Filtration resolution
     * @returns Array of persistent cycles
     */
    persistentCycles(numSteps?: number): PersistentCycle[];
    /**
     * Get persistence barcode across scales.
     * @param numSteps - Number of steps
     * @returns Barcode data
     */
    barcode(numSteps?: number): Array<{
        threshold: number;
        b0: number;
        b1: number;
    }>;
    /**
     * Compute the distance matrix.
     * @returns Distance matrix and node IDs
     */
    distances(): {
        ids: string[];
        distances: number[][];
    };
    /**
     * Create a tradition from registered songs and evolve it.
     * @param id - Tradition ID
     * @param generations - Number of generations to evolve
     * @param config - Evolution config
     * @returns Evolved tradition
     */
    evolve(id: string, generations?: number, config?: Partial<EvolutionConfig>): Tradition;
    /**
     * Get the fittest song from a tradition.
     * @param tradition - The tradition
     * @returns Fittest scored song
     */
    getFittest(tradition: Tradition): ScoredSong | null;
}
//# sourceMappingURL=index.d.ts.map