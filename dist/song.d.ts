/**
 * @module song
 * Song data structure for songline navigation.
 *
 * A Song is a sequence of waypoints (nodes) connected by verses (edges).
 * Each waypoint has coordinates in knowledge space; each verse encodes
 * traversal instructions for navigating between waypoints.
 *
 * Songlines are Australian Aboriginal navigation systems — songs that
 * encode geography. This module builds songs from graphs and extracts
 * sub-songs for local navigation.
 */
/** Coordinates in knowledge space — an arbitrary-dimensional point. */
export type Coordinates = number[];
/** A waypoint: a node in the songline with a position in knowledge space. */
export interface Waypoint {
    /** Unique identifier for this waypoint. */
    id: string;
    /** Coordinates in knowledge space. */
    coordinates: Coordinates;
    /** Optional metadata (name, description, tags, etc.). */
    metadata?: Record<string, unknown>;
}
/** A verse: an edge encoding traversal instructions between two waypoints. */
export interface Verse {
    /** Source waypoint ID. */
    from: string;
    /** Target waypoint ID. */
    to: string;
    /** Traversal weight / cost (lower = easier). */
    weight: number;
    /** Optional traversal metadata. */
    metadata?: Record<string, unknown>;
}
/** A Song: an ordered sequence of waypoints connected by verses. */
export interface Song {
    /** Unique identifier for this song. */
    id: string;
    /** Ordered waypoints. */
    waypoints: Waypoint[];
    /** Verses connecting consecutive waypoints (and possibly branches). */
    verses: Verse[];
    /** Optional song metadata. */
    metadata?: Record<string, unknown>;
}
/** A simple weighted graph from which songs can be extracted. */
export interface KnowledgeGraph {
    /** All nodes in the graph. */
    nodes: Map<string, Waypoint>;
    /** Adjacency list: nodeId → list of outgoing edges. */
    edges: Map<string, Verse[]>;
}
/**
 * Compute Euclidean distance between two coordinate vectors.
 * @param a - First coordinate vector
 * @param b - Second coordinate vector
 * @returns Euclidean distance
 */
export declare function coordinateDistance(a: Coordinates, b: Coordinates): number;
/**
 * Build a KnowledgeGraph from arrays of waypoints and verses.
 * @param waypoints - Array of waypoints
 * @param verses - Array of verses (edges)
 * @returns A KnowledgeGraph
 */
export declare function buildGraph(waypoints: Waypoint[], verses: Verse[]): KnowledgeGraph;
/**
 * Build a Song by tracing a path through the graph.
 * @param graph - The knowledge graph
 * @param path - Ordered list of waypoint IDs to traverse
 * @param songId - Optional song identifier
 * @returns A Song following the given path
 */
export declare function buildSongFromPath(graph: KnowledgeGraph, path: string[], songId?: string): Song;
/**
 * Extract a sub-song covering only a range of waypoints.
 * @param song - The parent song
 * @param startIdx - Start index (inclusive)
 * @param endIdx - End index (exclusive)
 * @returns A sub-song
 */
export declare function extractSubSong(song: Song, startIdx: number, endIdx: number): Song;
/**
 * Compute the total traversal cost of a song (sum of verse weights).
 * @param song - The song
 * @returns Total cost
 */
export declare function songCost(song: Song): number;
/**
 * Check if a song is valid (all consecutive waypoints connected by verses).
 * @param song - The song to validate
 * @returns True if valid
 */
export declare function isValidSong(song: Song): boolean;
/**
 * Reverse a song — walk it backwards.
 * @param song - The song to reverse
 * @returns A new song traversed in reverse
 */
export declare function reverseSong(song: Song): Song;
/**
 * Concatenate two songs where the last waypoint of the first matches
 * the first waypoint of the second.
 * @param a - First song
 * @param b - Second song
 * @returns Combined song
 */
export declare function concatenateSongs(a: Song, b: Song): Song;
//# sourceMappingURL=song.d.ts.map