/**
 * @module corroboree
 * Song convergence — when multiple songlines meet at a waypoint,
 * they create a corroboree (gathering).
 *
 * Implements graph clustering via songline intersection. Find knowledge
 * hubs where multiple traditions converge.
 */
import type { KnowledgeGraph, Song, Waypoint } from "./song.js";
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
export declare function findCorroborees(songs: Song[]): Corroboree[];
/**
 * Cluster nodes by songline intersection patterns.
 * Two nodes are in the same cluster if they share enough songs.
 *
 * @param songs - Array of songs
 * @param threshold - Minimum shared songs to be in same cluster (default 2)
 * @returns Array of clusters (each is an array of waypoint IDs)
 */
export declare function clusterBySongs(songs: Song[], threshold?: number): string[][];
/**
 * Find the intersection of two songs: waypoints they share.
 * @param a - First song
 * @param b - Second song
 * @returns Array of shared waypoint IDs
 */
export declare function songIntersection(a: Song, b: Song): string[];
/**
 * Find knowledge hubs: nodes with the highest degree in the combined graph.
 * @param graph - The knowledge graph
 * @param topN - Number of top hubs to return (default 5)
 * @returns Array of {waypoint, degree} sorted by degree
 */
export declare function findHubs(graph: KnowledgeGraph, topN?: number): Array<{
    waypoint: Waypoint;
    degree: number;
}>;
/**
 * Compute the modularity of a clustering partition.
 * Measures how well the clusters separate the graph into dense subgraphs.
 *
 * @param graph - The knowledge graph
 * @param clusters - Array of clusters (node ID arrays)
 * @returns Modularity score (-0.5 to 1.0)
 */
export declare function modularity(graph: KnowledgeGraph, clusters: string[][]): number;
//# sourceMappingURL=corroboree.d.ts.map