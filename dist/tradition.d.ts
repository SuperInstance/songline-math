/**
 * @module tradition
 * Tradition keeper — maintains a living collection of songlines with evolution.
 *
 * Songlines mutate (add waypoints), recombine (merge traditions), and decay
 * (forget unused paths). Fitness = navigability.
 */
import type { KnowledgeGraph, Song } from "./song.js";
/** Configuration for tradition evolution. */
export interface EvolutionConfig {
    /** Probability of adding a waypoint (mutation). Default 0.3. */
    mutationRate: number;
    /** Decay factor per generation for unused songs. Default 0.9. */
    decayFactor: number;
    /** Minimum fitness to keep a song alive. Default 0.1. */
    minFitness: number;
    /** Maximum number of songs in the tradition. Default 100. */
    maxSongs: number;
}
/** A song with fitness score. */
export interface ScoredSong {
    song: Song;
    fitness: number;
    generation: number;
    usageCount: number;
}
/** A tradition: a living collection of evolving songlines. */
export interface Tradition {
    /** Unique tradition identifier. */
    id: string;
    /** Current generation number. */
    generation: number;
    /** Scored songs in the tradition. */
    songs: ScoredSong[];
    /** Evolution configuration. */
    config: EvolutionConfig;
}
/** Default evolution configuration. */
export declare const DEFAULT_CONFIG: EvolutionConfig;
/**
 * Create a new tradition from initial songs.
 * @param id - Tradition identifier
 * @param songs - Initial songs
 * @param config - Optional evolution config
 * @returns A new Tradition
 */
export declare function createTradition(id: string, songs: Song[], config?: Partial<EvolutionConfig>): Tradition;
/**
 * Compute fitness of a song: navigability score.
 * Fitness = 1 / (1 + cost) * length factor.
 *
 * @param song - The song to score
 * @returns Fitness between 0 and 1
 */
export declare function computeFitness(song: Song): number;
/**
 * Mutate a song by adding a random waypoint from the graph.
 * @param song - Song to mutate
 * @param graph - Source graph for new waypoints
 * @returns Mutated song (or original if mutation didn't apply)
 */
export declare function mutateSong(song: Song, graph: KnowledgeGraph): Song;
/**
 * Recombine two songs: merge their traditions by finding shared waypoints
 * and creating a new song that follows one then the other.
 *
 * @param a - First song
 * @param b - Second song
 * @param graph - Knowledge graph for edge weights
 * @returns Recombined song (or null if no shared waypoints)
 */
export declare function recombineSongs(a: Song, b: Song, graph: KnowledgeGraph): Song | null;
/**
 * Evolve a tradition for one generation.
 * - Mutate songs
 * - Recombine pairs
 * - Decay unused songs
 * - Remove songs below minimum fitness
 *
 * @param tradition - The tradition to evolve
 * @param graph - Knowledge graph context
 * @returns Evolved tradition
 */
export declare function evolveGeneration(tradition: Tradition, graph: KnowledgeGraph): Tradition;
/**
 * Record usage of a song (increases its fitness).
 * @param tradition - The tradition
 * @param songId - ID of the used song
 * @returns Updated tradition
 */
export declare function recordUsage(tradition: Tradition, songId: string): Tradition;
/**
 * Get the fittest song from a tradition.
 * @param tradition - The tradition
 * @returns The fittest scored song, or null if empty
 */
export declare function fittestSong(tradition: Tradition): ScoredSong | null;
//# sourceMappingURL=tradition.d.ts.map