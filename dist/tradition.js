/**
 * @module tradition
 * Tradition keeper — maintains a living collection of songlines with evolution.
 *
 * Songlines mutate (add waypoints), recombine (merge traditions), and decay
 * (forget unused paths). Fitness = navigability.
 */
/** Default evolution configuration. */
export const DEFAULT_CONFIG = {
    mutationRate: 0.3,
    decayFactor: 0.9,
    minFitness: 0.1,
    maxSongs: 100,
};
/**
 * Create a new tradition from initial songs.
 * @param id - Tradition identifier
 * @param songs - Initial songs
 * @param config - Optional evolution config
 * @returns A new Tradition
 */
export function createTradition(id, songs, config = {}) {
    const fullConfig = { ...DEFAULT_CONFIG, ...config };
    return {
        id,
        generation: 0,
        songs: songs.map((song) => ({
            song,
            fitness: computeFitness(song),
            generation: 0,
            usageCount: 0,
        })),
        config: fullConfig,
    };
}
/**
 * Compute fitness of a song: navigability score.
 * Fitness = 1 / (1 + cost) * length factor.
 *
 * @param song - The song to score
 * @returns Fitness between 0 and 1
 */
export function computeFitness(song) {
    if (song.waypoints.length === 0)
        return 0;
    if (song.verses.length === 0)
        return song.waypoints.length === 1 ? 1 : 0;
    let totalWeight = 0;
    for (const v of song.verses)
        totalWeight += v.weight;
    const avgWeight = totalWeight / song.verses.length;
    const costFactor = 1 / (1 + avgWeight);
    const lengthBonus = Math.min(1, song.waypoints.length / 10);
    return costFactor * 0.7 + lengthBonus * 0.3;
}
/**
 * Mutate a song by adding a random waypoint from the graph.
 * @param song - Song to mutate
 * @param graph - Source graph for new waypoints
 * @returns Mutated song (or original if mutation didn't apply)
 */
export function mutateSong(song, graph) {
    const allNodeIds = Array.from(graph.nodes.keys());
    if (allNodeIds.length === 0)
        return song;
    // Pick a random node to insert
    const insertIdx = Math.floor(Math.random() * (song.waypoints.length + 1));
    const randomNodeId = allNodeIds[Math.floor(Math.random() * allNodeIds.length)];
    const newWaypoint = graph.nodes.get(randomNodeId);
    const newWaypoints = [...song.waypoints];
    newWaypoints.splice(insertIdx, 0, newWaypoint);
    // Rebuild verses
    const newVerses = [];
    for (let i = 0; i < newWaypoints.length - 1; i++) {
        const from = newWaypoints[i].id;
        const to = newWaypoints[i + 1].id;
        const edges = graph.edges.get(from) ?? [];
        const existingEdge = edges.find((e) => e.to === to);
        const weight = existingEdge?.weight ?? euclidean(newWaypoints[i].coordinates, newWaypoints[i + 1].coordinates);
        newVerses.push({ from, to, weight });
    }
    return {
        id: `${song.id}-m${Date.now()}`,
        waypoints: newWaypoints,
        verses: newVerses,
    };
}
/**
 * Recombine two songs: merge their traditions by finding shared waypoints
 * and creating a new song that follows one then the other.
 *
 * @param a - First song
 * @param b - Second song
 * @param graph - Knowledge graph for edge weights
 * @returns Recombined song (or null if no shared waypoints)
 */
export function recombineSongs(a, b, graph) {
    const aIds = new Set(a.waypoints.map((wp) => wp.id));
    const sharedIdx = b.waypoints.findIndex((wp) => aIds.has(wp.id));
    if (sharedIdx === -1)
        return null;
    const sharedId = b.waypoints[sharedIdx].id;
    const aIdx = a.waypoints.findIndex((wp) => wp.id === sharedId);
    // Take a's prefix up to shared, then b's suffix from shared
    const newWaypoints = [
        ...a.waypoints.slice(0, aIdx),
        ...b.waypoints.slice(sharedIdx),
    ];
    const newVerses = [];
    for (let i = 0; i < newWaypoints.length - 1; i++) {
        const from = newWaypoints[i].id;
        const to = newWaypoints[i + 1].id;
        const edges = graph.edges.get(from) ?? [];
        const existingEdge = edges.find((e) => e.to === to);
        const weight = existingEdge?.weight ?? euclidean(newWaypoints[i].coordinates, newWaypoints[i + 1].coordinates);
        newVerses.push({ from, to, weight });
    }
    return {
        id: `${a.id}x${b.id}`,
        waypoints: newWaypoints,
        verses: newVerses,
    };
}
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
export function evolveGeneration(tradition, graph) {
    const { config } = tradition;
    const newSongs = [];
    // Carry forward existing songs with decay
    for (const scored of tradition.songs) {
        const decayedFitness = scored.fitness * config.decayFactor;
        newSongs.push({
            ...scored,
            fitness: decayedFitness,
            generation: tradition.generation + 1,
        });
    }
    // Mutations
    for (const scored of tradition.songs) {
        if (Math.random() < config.mutationRate) {
            const mutated = mutateSong(scored.song, graph);
            newSongs.push({
                song: mutated,
                fitness: computeFitness(mutated),
                generation: tradition.generation + 1,
                usageCount: 0,
            });
        }
    }
    // Recombination (pair top songs)
    const sorted = [...tradition.songs].sort((a, b) => b.fitness - a.fitness);
    for (let i = 0; i < Math.min(sorted.length - 1, 10); i += 2) {
        const child = recombineSongs(sorted[i].song, sorted[i + 1].song, graph);
        if (child) {
            newSongs.push({
                song: child,
                fitness: computeFitness(child),
                generation: tradition.generation + 1,
                usageCount: 0,
            });
        }
    }
    // Selection: keep top songs by fitness
    const survivors = newSongs
        .filter((s) => s.fitness >= config.minFitness)
        .sort((a, b) => b.fitness - a.fitness)
        .slice(0, config.maxSongs);
    return {
        ...tradition,
        generation: tradition.generation + 1,
        songs: survivors,
    };
}
/**
 * Record usage of a song (increases its fitness).
 * @param tradition - The tradition
 * @param songId - ID of the used song
 * @returns Updated tradition
 */
export function recordUsage(tradition, songId) {
    return {
        ...tradition,
        songs: tradition.songs.map((s) => s.song.id === songId
            ? { ...s, usageCount: s.usageCount + 1, fitness: Math.min(1, s.fitness + 0.05) }
            : s),
    };
}
/**
 * Get the fittest song from a tradition.
 * @param tradition - The tradition
 * @returns The fittest scored song, or null if empty
 */
export function fittestSong(tradition) {
    if (tradition.songs.length === 0)
        return null;
    return tradition.songs.reduce((best, s) => (s.fitness > best.fitness ? s : best));
}
/** Euclidean distance helper. */
function euclidean(a, b) {
    let sum = 0;
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) {
        sum += (a[i] - b[i]) ** 2;
    }
    return Math.sqrt(sum);
}
//# sourceMappingURL=tradition.js.map