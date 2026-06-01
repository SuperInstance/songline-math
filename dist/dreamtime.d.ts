/**
 * @module dreamtime
 * Dreamtime layer — the metaphysical topology beneath the graph.
 *
 * Implements persistent homology on knowledge graphs: identifies which
 * cycles are "real" (persistent) vs noise. Computes Betti numbers of
 * the knowledge space.
 */
import type { KnowledgeGraph } from "./song.js";
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
export declare function distanceMatrix(graph: KnowledgeGraph): {
    ids: string[];
    distances: number[][];
};
/**
 * Compute Betti numbers of the knowledge space using Vietoris-Rips
 * filtration at a given scale threshold.
 *
 * @param graph - The knowledge graph
 * @param threshold - Distance threshold for the filtration
 * @returns Betti numbers β₀ and β₁
 */
export declare function bettiNumbers(graph: KnowledgeGraph, threshold: number): BettiNumbers;
/**
 * Compute persistent cycles by sweeping through distance thresholds.
 * A cycle is "born" when enough edges form it and "dies" when it fills in.
 *
 * @param graph - The knowledge graph
 * @param numSteps - Number of filtration steps (default 20)
 * @returns Array of persistent cycles sorted by persistence
 */
export declare function persistentCycles(graph: KnowledgeGraph, numSteps?: number): PersistentCycle[];
/**
 * Compute the persistence barcode: for each scale, how many features exist.
 * @param graph - The knowledge graph
 * @param numSteps - Number of filtration steps
 * @returns Array of {threshold, b0, b1} values
 */
export declare function persistenceBarcode(graph: KnowledgeGraph, numSteps?: number): Array<{
    threshold: number;
    b0: number;
    b1: number;
}>;
//# sourceMappingURL=dreamtime.d.ts.map