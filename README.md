# songline-math

Mathematics of navigable knowledge graphs inspired by Australian Aboriginal songlines.

Songlines are Australian Aboriginal navigation systems — songs that encode geography. This package implements the **mathematics** of navigable knowledge graphs: paths through information that you can sing (traverse) to reach any destination.

## Installation

```bash
npm install songline-math
```

## Quick Start

```typescript
import { SonglineGraph } from "songline-math";

// Build a knowledge graph
const sg = new SonglineGraph();
sg.addWaypoint("home", [0, 0]);
sg.addWaypoint("mountain", [10, 0]);
sg.addWaypoint("river", [10, 5]);
sg.addWaypoint("ocean", [5, 10]);

sg.addVerse("home", "mountain", 1.0);
sg.addVerse("mountain", "river", 1.5);
sg.addVerse("river", "ocean", 2.0);
sg.addVerse("home", "ocean", 10.0); // long way around

// Navigate: "sing your way" from home to ocean
const path = sg.sing("home", "ocean");
console.log(path.path);   // ["home", "mountain", "river", "ocean"]
console.log(path.cost);   // 4.5
console.log(path.dreamtime); // false

// Build and register songs (paths through the graph)
sg.buildSong(["home", "mountain", "river"], "mountain-song");
sg.buildSong(["home", "ocean"], "coastal-song");

// Find corroborees — where multiple songlines converge
const hubs = sg.corroborees();
console.log(hubs); // convergence at "home"

// Dreamtime topology — persistent homology of knowledge space
const topology = sg.topology(5.0);
console.log(topology); // { b0: 1, b1: 0 }

// Evolve a tradition of songs
const tradition = sg.evolve("my-tradition", 10);
console.log(tradition.generation); // 10
```

## Modules

### Song (`song`)

Core data structures for songlines:

- **Waypoint**: A node with coordinates in knowledge space
- **Verse**: An edge encoding traversal instructions
- **Song**: An ordered sequence of waypoints connected by verses

```typescript
import { buildGraph, buildSongFromPath, reverseSong } from "songline-math";

const graph = buildGraph(waypoints, verses);
const song = buildSongFromPath(graph, ["A", "B", "C"], "my-song");
const reversed = reverseSong(song);
```

### Navigation (`navigation`)

Pathfinding through knowledge graphs using songline algorithms:

- **singPath**: Find paths preferring well-known territory (high-connectivity nodes)
- **dreamtimeTraversal**: Always finds a path, even in disconnected graphs
- **navigability**: Fraction of node pairs with paths between them

```typescript
import { singPath, dreamtimeTraversal, navigability } from "songline-math";

const path = singPath(graph, "start", "end");
// If no normal path exists, automatically uses dreamtime
```

### Corroboree (`corroboree`)

Song convergence and graph clustering:

- **findCorroborees**: Find waypoints where multiple songs converge
- **clusterBySongs**: Cluster nodes by shared songline membership
- **findHubs**: Find high-degree knowledge hubs
- **modularity**: Evaluate clustering quality

```typescript
import { findCorroborees, clusterBySongs } from "songline-math";

const hubs = findCorroborees(songs);
const clusters = clusterBySongs(songs, 2);
```

### Dreamtime (`dreamtime`)

Persistent homology on knowledge graphs:

- **bettiNumbers**: β₀ (components) and β₁ (cycles) at a given scale
- **persistentCycles**: Topological features that persist across scales
- **persistenceBarcode**: Filtration evolution of topology

```typescript
import { bettiNumbers, persistentCycles } from "songline-math";

const betti = bettiNumbers(graph, threshold);
const cycles = persistentCycles(graph, 20);
```

### Tradition (`tradition`)

Living collections of evolving songlines:

- **createTradition**: Initialize a tradition from songs
- **evolveGeneration**: Mutate, recombine, decay, and select
- **computeFitness**: Score songs by navigability

```typescript
import { createTradition, evolveGeneration } from "songline-math";

let tradition = createTradition("my-trad", songs);
tradition = evolveGeneration(tradition, graph);
```

## API: SonglineGraph

The unified `SonglineGraph` class combines all modules:

| Method | Description |
|--------|-------------|
| `addWaypoint(id, coords)` | Add a waypoint |
| `addVerse(from, to, weight)` | Add a directed edge |
| `sing(source, target)` | Navigate from source to target |
| `buildSong(path)` | Build and register a song |
| `corroborees()` | Find convergence hubs |
| `topology(threshold)` | Compute Betti numbers |
| `persistentCycles()` | Find persistent topological features |
| `evolve(id, generations)` | Evolve a tradition |
| `navigabilityScore` | Overall graph navigability (0–1) |

## Concepts

- **Songline**: A path through a knowledge graph, like a song that encodes geography
- **Waypoint**: A node with coordinates in abstract knowledge space
- **Verse**: An edge connecting waypoints with traversal cost
- **Corroboree**: A convergence point where multiple songlines meet
- **Dreamtime**: The metaphysical topology — persistent homology revealing true structure
- **Tradition**: A living collection of songlines that evolve over generations

## License

MIT
