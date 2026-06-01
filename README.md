# songline-math

> Australian Aboriginal songline navigation as graph theory — pathfinding, topological analysis, and evolving traditions.

## What This Does

`songline-math` implements navigable knowledge graphs inspired by Australian Aboriginal songlines — songs that encode geography so you can navigate by singing. It provides a `SonglineGraph` class that combines graph construction, pathfinding (with "dreamtime" fallback for disconnected graphs), convergence hub detection (corroborees), persistent homology (Betti numbers), and evolutionary optimization of routes. Use it for knowledge graph navigation, semantic routing, multi-agent pathfinding, or teaching topological data analysis.

## The Cultural Root

Australian Aboriginal songlines (also called song cycles or dreaming tracks) are routes through the landscape encoded in song, dance, and story. By singing the song in sequence, a person can navigate vast distances across the continent — each verse describing a landmark, water source, or geographical feature. The mathematical insight: **a songline is a weighted path through a knowledge graph** where nodes are waypoints (knowledge) and verses (edges) encode traversal instructions. When no direct path exists, "dreamtime" traversal hops through knowledge-space proximity — like finding a route by landmarks you can see, even without a marked trail.

## Install

```bash
npm install songline-math
```

## Quick Start

```typescript
import { SonglineGraph } from "songline-math";

// Build a knowledge graph
const sg = new SonglineGraph();
sg.addWaypoint("origin", [0, 0]);
sg.addWaypoint("river", [1, 0]);
sg.addWaypoint("mountain", [2, 1]);
sg.addWaypoint("coast", [3, 0]);
sg.addVerse("origin", "river", 1.0);
sg.addVerse("river", "mountain", 1.5);
sg.addVerse("mountain", "coast", 1.0);
sg.addVerse("origin", "coast", 4.0);  // Long way around

// Navigate by singing
const path = sg.sing("origin", "coast");
console.log(path.path);     // ["origin", "river", "mountain", "coast"]
console.log(path.cost);     // 3.5
console.log(path.dreamtime); // false

// Register songs (routes)
sg.buildSong(["origin", "river", "mountain"]);
sg.buildSong(["origin", "coast"]);

// Find corroborees (convergence hubs)
const corroborees = sg.corroborees();
const clusters = sg.clusters(2);
const hubs = sg.hubs(3);

// Topological analysis
const topo = sg.topology(1.5);
console.log(`β₀ = ${topo.b0}, β₁ = ${topo.b1}`);

// Evolutionary optimization
const tradition = sg.evolve("navigation-tradition", 20);
const fittest = sg.getFittest(tradition);
console.log(`Fittest song cost: ${fittest.score}`);
```

## API Reference

### Types

#### `Waypoint`
```typescript
interface Waypoint {
  id: string;
  coordinates: number[];
  metadata?: Record<string, unknown>;
}
```

#### `Verse`
```typescript
interface Verse {
  from: string;
  to: string;
  weight: number;
  metadata?: Record<string, unknown>;
}
```

#### `Song`
```typescript
interface Song {
  id: string;
  waypoints: Waypoint[];
  verses: Verse[];
  metadata?: Record<string, unknown>;
}
```

#### `PathResult`
```typescript
interface PathResult {
  path: string[];
  cost: number;
  dreamtime: boolean;  // True if fallback traversal was used
}
```

#### `Corroboree`
```typescript
interface Corroboree {
  waypoint: Waypoint;
  songIds: string[];
  convergence: number;
  avgWeight: number;
}
```

#### `BettiNumbers`
```typescript
interface BettiNumbers {
  b0: number;  // Connected components
  b1: number;  // Independent cycles
}
```

#### `Tradition`, `ScoredSong`, `EvolutionConfig`
Evolutionary optimization types for song evolution.

### `SonglineGraph` class

#### Construction
- `addWaypoint(id, coordinates, metadata?)` — Add a node
- `addVerse(from, to, weight, metadata?)` — Add a directed edge
- `getGraph()` → `KnowledgeGraph`

#### Navigation
- `sing(source, target)` → `PathResult` — Songline pathfinding with dreamtime fallback
- `reachable(source)` → `Set<string>` — All reachable waypoints
- `hasPath(source, target)` → `boolean`
- `navigabilityScore` → `number` (0–1) — Overall graph navigability

#### Songs
- `addSong(song)` / `buildSong(path, songId?)` — Register routes
- `reverseSong(songId)` / `subSong(songId, start, end)` — Song operations
- `songCost(songId)` → `number | null` — Total traversal cost

#### Corroboree Analysis
- `corroborees()` → `Corroboree[]` — Convergence hubs
- `clusters(threshold?)` → `string[][]` — Waypoint clusters by shared songs
- `songIntersection(idA, idB)` → `string[]` — Shared waypoints
- `hubs(topN?)` → `{waypoint, degree}[]` — High-degree nodes

#### Dreamtime (Topology)
- `topology(threshold)` → `BettiNumbers` — β₀ and β₁
- `persistentCycles(numSteps?)` → `PersistentCycle[]`
- `barcode(numSteps?)` → `{threshold, b0, b1}[]`
- `distances()` → `{ids, distances}`

#### Evolution
- `evolve(id, generations?, config?)` → `Tradition`
- `getFittest(tradition)` → `ScoredSong | null`

### Standalone Functions

All submodules export their functions directly:
- `singPath(graph, source, target)` — Core pathfinding
- `dreamtimeTraversal(graph, source, target)` — Always finds a path
- `findCorroborees(songs)`, `clusterBySongs(songs, threshold)`
- `bettiNumbers(graph, threshold)`, `persistenceBarcode(graph, steps)`
- `createTradition(id, songs, config?)`, `evolveGeneration(tradition, graph)`

## How It Works

**Pathfinding:** Uses Dijkstra-like traversal with a popularity bonus — nodes with more connections are preferred (like choosing well-known trails). When no path exists through normal edges, dreamtime traversal hops through knowledge-space proximity using greedy nearest-neighbor toward the target.

**Corroborees:** Points where multiple songs share a waypoint, sorted by convergence (number of songs meeting). Uses union-find for clustering.

**Persistent Homology:** Builds a Vietoris-Rips complex from waypoint coordinates at increasing distance thresholds. Tracks when connected components merge (β₀ decreases) and when cycles form/fill (β₁ changes). Persistent cycles that survive across many scales are "real" features, not noise.

**Evolution:** Creates a population of songs, mutates them (random waypoint swaps), and selects by fitness (lower cost = better). Uses tournament selection and recombination.

## The Math

**Betti Numbers:** β₀ counts connected components, β₁ counts independent cycles in the Vietoris-Rips complex at threshold ε.

**Persistent Homology:** A filtration of simplicial complexes K₀ ⊆ K₁ ⊆ ... ⊆ Kₙ tracks topological features across scales. A feature born at ε_b and dying at ε_d has persistence = ε_d − ε_b.

**Modularity:** Q = (1/2m) Σ_{ij} [A_{ij} − k_i·k_j/(2m)] δ(c_i, c_j) where m = total edges, k = degree, c = community.

**Navigability:** Fraction of node pairs that have a path between them.

## License

MIT
