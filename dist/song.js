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
/**
 * Compute Euclidean distance between two coordinate vectors.
 * @param a - First coordinate vector
 * @param b - Second coordinate vector
 * @returns Euclidean distance
 */
export function coordinateDistance(a, b) {
    if (a.length !== b.length) {
        throw new Error(`Coordinate dimension mismatch: ${a.length} vs ${b.length}`);
    }
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
        const diff = a[i] - b[i];
        sum += diff * diff;
    }
    return Math.sqrt(sum);
}
/**
 * Build a KnowledgeGraph from arrays of waypoints and verses.
 * @param waypoints - Array of waypoints
 * @param verses - Array of verses (edges)
 * @returns A KnowledgeGraph
 */
export function buildGraph(waypoints, verses) {
    const nodes = new Map();
    const edges = new Map();
    for (const wp of waypoints) {
        nodes.set(wp.id, wp);
        if (!edges.has(wp.id))
            edges.set(wp.id, []);
    }
    for (const v of verses) {
        if (!edges.has(v.from))
            edges.set(v.from, []);
        edges.get(v.from).push(v);
        // Also store reverse edge for undirected traversal
        if (!edges.has(v.to))
            edges.set(v.to, []);
        edges.get(v.to).push({ from: v.to, to: v.from, weight: v.weight, metadata: v.metadata });
    }
    return { nodes, edges };
}
/**
 * Build a Song by tracing a path through the graph.
 * @param graph - The knowledge graph
 * @param path - Ordered list of waypoint IDs to traverse
 * @param songId - Optional song identifier
 * @returns A Song following the given path
 */
export function buildSongFromPath(graph, path, songId) {
    const waypoints = [];
    const verses = [];
    for (const id of path) {
        const wp = graph.nodes.get(id);
        if (!wp)
            throw new Error(`Waypoint not found: ${id}`);
        waypoints.push(wp);
    }
    for (let i = 0; i < path.length - 1; i++) {
        const from = path[i];
        const to = path[i + 1];
        const edgeList = graph.edges.get(from);
        const edge = edgeList?.find((e) => e.to === to);
        if (!edge)
            throw new Error(`No verse from ${from} to ${to}`);
        verses.push({ from, to, weight: edge.weight, metadata: edge.metadata });
    }
    return {
        id: songId ?? `song-${Date.now()}`,
        waypoints,
        verses,
    };
}
/**
 * Extract a sub-song covering only a range of waypoints.
 * @param song - The parent song
 * @param startIdx - Start index (inclusive)
 * @param endIdx - End index (exclusive)
 * @returns A sub-song
 */
export function extractSubSong(song, startIdx, endIdx) {
    const waypoints = song.waypoints.slice(startIdx, endIdx);
    const verses = song.verses.slice(startIdx, endIdx - startIdx);
    return {
        id: `${song.id}-sub-${startIdx}-${endIdx}`,
        waypoints,
        verses,
    };
}
/**
 * Compute the total traversal cost of a song (sum of verse weights).
 * @param song - The song
 * @returns Total cost
 */
export function songCost(song) {
    let total = 0;
    for (const v of song.verses) {
        total += v.weight;
    }
    return total;
}
/**
 * Check if a song is valid (all consecutive waypoints connected by verses).
 * @param song - The song to validate
 * @returns True if valid
 */
export function isValidSong(song) {
    if (song.waypoints.length === 0)
        return true;
    if (song.verses.length !== song.waypoints.length - 1)
        return false;
    for (let i = 0; i < song.verses.length; i++) {
        const v = song.verses[i];
        if (v.from !== song.waypoints[i].id || v.to !== song.waypoints[i + 1].id) {
            return false;
        }
    }
    return true;
}
/**
 * Reverse a song — walk it backwards.
 * @param song - The song to reverse
 * @returns A new song traversed in reverse
 */
export function reverseSong(song) {
    return {
        id: `${song.id}-reverse`,
        waypoints: [...song.waypoints].reverse(),
        verses: [...song.verses].reverse().map((v) => ({ from: v.to, to: v.from, weight: v.weight, metadata: v.metadata })),
        metadata: song.metadata,
    };
}
/**
 * Concatenate two songs where the last waypoint of the first matches
 * the first waypoint of the second.
 * @param a - First song
 * @param b - Second song
 * @returns Combined song
 */
export function concatenateSongs(a, b) {
    if (a.waypoints.length === 0)
        return { ...b, id: `${a.id}+${b.id}` };
    if (b.waypoints.length === 0)
        return { ...a, id: `${a.id}+${b.id}` };
    const lastA = a.waypoints[a.waypoints.length - 1];
    const firstB = b.waypoints[0];
    if (lastA.id !== firstB.id) {
        throw new Error(`Cannot concatenate: last waypoint "${lastA.id}" !== first waypoint "${firstB.id}"`);
    }
    return {
        id: `${a.id}+${b.id}`,
        waypoints: [...a.waypoints, ...b.waypoints.slice(1)],
        verses: [...a.verses, ...b.verses],
    };
}
//# sourceMappingURL=song.js.map