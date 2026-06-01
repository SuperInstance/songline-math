/**
 * @module navigation
 * Pathfinding through knowledge graphs using songline algorithms.
 *
 * Unlike Dijkstra, songlines prefer paths through well-known territory
 * (high-weight nodes). Implements "singing your way home" — always finding
 * a path even in sparse graphs via dreamtime traversal.
 */
import type { KnowledgeGraph } from "./song.js";
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
export declare function singPath(graph: KnowledgeGraph, source: string, target: string, options?: {
    maxIterations?: number;
}): PathResult;
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
export declare function dreamtimeTraversal(graph: KnowledgeGraph, source: string, target: string): PathResult;
/**
 * Find all reachable nodes from a given source.
 * @param graph - The knowledge graph
 * @param source - Starting waypoint ID
 * @returns Set of reachable waypoint IDs
 */
export declare function reachableNodes(graph: KnowledgeGraph, source: string): Set<string>;
/**
 * Check if a path exists between source and target using normal edges.
 * @param graph - The knowledge graph
 * @param source - Source waypoint ID
 * @param target - Target waypoint ID
 * @returns True if a normal path exists
 */
export declare function pathExists(graph: KnowledgeGraph, source: string, target: string): boolean;
/**
 * Compute the navigability of the graph: fraction of node pairs
 * that have a path between them (not counting dreamtime).
 * @param graph - The knowledge graph
 * @returns Navigability score between 0 and 1
 */
export declare function navigability(graph: KnowledgeGraph): number;
//# sourceMappingURL=navigation.d.ts.map