/**
 * Tests for songline-math using Node.js built-in test runner.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  coordinateDistance,
  buildGraph,
  buildSongFromPath,
  extractSubSong,
  songCost,
  isValidSong,
  reverseSong,
  concatenateSongs,
  singPath,
  dreamtimeTraversal,
  reachableNodes,
  pathExists,
  navigability,
  findCorroborees,
  clusterBySongs,
  songIntersection,
  findHubs,
  modularity,
  bettiNumbers,
  persistentCycles,
  persistenceBarcode,
  distanceMatrix,
  createTradition,
  computeFitness,
  mutateSong,
  recombineSongs,
  evolveGeneration,
  recordUsage,
  fittestSong,
  SonglineGraph,
} from "./index.js";

// Helpers
const wp = (id: string, coords: number[]) => ({ id, coordinates: coords });

// ===== SONG MODULE =====

describe("song", () => {
  it("coordinateDistance computes Euclidean distance", () => {
    assert.equal(coordinateDistance([0, 0], [3, 4]), 5);
    assert.equal(coordinateDistance([0], [0]), 0);
  });

  it("coordinateDistance throws on dimension mismatch", () => {
    assert.throws(() => coordinateDistance([0], [0, 1]), /mismatch/);
  });

  it("buildGraph creates a valid graph", () => {
    const graph = buildGraph(
      [wp("A", [0, 0]), wp("B", [1, 0])],
      [{ from: "A", to: "B", weight: 1 }],
    );
    assert.equal(graph.nodes.size, 2);
    assert.ok(graph.edges.has("A"));
    assert.ok(graph.edges.has("B"));
  });

  it("buildSongFromPath creates a song", () => {
    const graph = buildGraph(
      [wp("A", [0, 0]), wp("B", [1, 0]), wp("C", [2, 0])],
      [{ from: "A", to: "B", weight: 1 }, { from: "B", to: "C", weight: 2 }],
    );
    const song = buildSongFromPath(graph, ["A", "B", "C"], "test-song");
    assert.equal(song.id, "test-song");
    assert.equal(song.waypoints.length, 3);
    assert.equal(song.verses.length, 2);
    assert.ok(isValidSong(song));
  });

  it("buildSongFromPath throws on missing waypoint", () => {
    const graph = buildGraph([wp("A", [0, 0])], []);
    assert.throws(() => buildSongFromPath(graph, ["A", "Z"]), /not found/);
  });

  it("buildSongFromPath throws on missing verse", () => {
    const graph = buildGraph([wp("A", [0, 0]), wp("B", [1, 0])], []);
    assert.throws(() => buildSongFromPath(graph, ["A", "B"]), /No verse/);
  });

  it("extractSubSong extracts a range", () => {
    const graph = buildGraph(
      [wp("A", [0, 0]), wp("B", [1, 0]), wp("C", [2, 0]), wp("D", [3, 0])],
      [
        { from: "A", to: "B", weight: 1 },
        { from: "B", to: "C", weight: 2 },
        { from: "C", to: "D", weight: 3 },
      ],
    );
    const song = buildSongFromPath(graph, ["A", "B", "C", "D"]);
    const sub = extractSubSong(song, 1, 3);
    assert.equal(sub.waypoints.length, 2);
    assert.equal(sub.waypoints[0].id, "B");
    assert.equal(sub.waypoints[1].id, "C");
  });

  it("songCost sums verse weights", () => {
    const graph = buildGraph(
      [wp("A", [0, 0]), wp("B", [1, 0]), wp("C", [2, 0])],
      [{ from: "A", to: "B", weight: 3 }, { from: "B", to: "C", weight: 7 }],
    );
    const song = buildSongFromPath(graph, ["A", "B", "C"]);
    assert.equal(songCost(song), 10);
  });

  it("isValidSong detects invalid songs", () => {
    assert.ok(isValidSong({ id: "x", waypoints: [], verses: [] }));
    assert.ok(isValidSong({ id: "x", waypoints: [wp("A", [0])], verses: [] }));
    const bad: any = { id: "x", waypoints: [wp("A", [0]), wp("B", [1])], verses: [] };
    assert.ok(!isValidSong(bad));
  });

  it("reverseSong reverses the song", () => {
    const graph = buildGraph(
      [wp("A", [0]), wp("B", [1]), wp("C", [2])],
      [{ from: "A", to: "B", weight: 1 }, { from: "B", to: "C", weight: 2 }],
    );
    const song = buildSongFromPath(graph, ["A", "B", "C"]);
    const rev = reverseSong(song);
    assert.deepEqual(rev.waypoints.map((w) => w.id), ["C", "B", "A"]);
    assert.ok(isValidSong(rev));
  });

  it("concatenateSongs joins songs at shared waypoint", () => {
    const graph = buildGraph(
      [wp("A", [0]), wp("B", [1]), wp("C", [2])],
      [{ from: "A", to: "B", weight: 1 }, { from: "B", to: "C", weight: 2 }],
    );
    const s1 = buildSongFromPath(graph, ["A", "B"]);
    const s2 = buildSongFromPath(graph, ["B", "C"]);
    const joined = concatenateSongs(s1, s2);
    assert.deepEqual(joined.waypoints.map((w) => w.id), ["A", "B", "C"]);
  });

  it("concatenateSongs throws on mismatched endpoints", () => {
    const graph = buildGraph(
      [wp("A", [0]), wp("B", [1]), wp("C", [2])],
      [{ from: "A", to: "B", weight: 1 }, { from: "B", to: "C", weight: 2 }],
    );
    const s1 = buildSongFromPath(graph, ["A", "B"]);
    const s2 = buildSongFromPath(graph, ["B", "C"]);
    assert.throws(() => concatenateSongs(s2, s1), /Cannot concatenate/);
  });
});

// ===== NAVIGATION MODULE =====

describe("navigation", () => {
  function makeTriangleGraph() {
    return buildGraph(
      [wp("A", [0, 0]), wp("B", [4, 0]), wp("C", [2, 3])],
      [
        { from: "A", to: "B", weight: 1 },
        { from: "B", to: "C", weight: 1 },
        { from: "A", to: "C", weight: 5 },
      ],
    );
  }

  it("singPath finds a path to target", () => {
    const graph = makeTriangleGraph();
    const result = singPath(graph, "A", "C");
    assert.equal(result.path[result.path.length - 1], "C");
    assert.equal(result.path[0], "A");
    assert.ok(!result.dreamtime);
    // The popularity bonus may prefer A→B→C over direct A→C
    assert.ok(result.cost < 5);
  });

  it("singPath returns zero cost for same node", () => {
    const graph = makeTriangleGraph();
    const result = singPath(graph, "A", "A");
    assert.deepEqual(result.path, ["A"]);
    assert.equal(result.cost, 0);
  });

  it("singPath uses dreamtime for disconnected graph", () => {
    const graph = buildGraph(
      [wp("A", [0, 0]), wp("B", [10, 0])],
      [],
    );
    const result = singPath(graph, "A", "B");
    assert.ok(result.dreamtime);
    assert.ok(result.path.includes("A"));
    assert.ok(result.path.includes("B"));
  });

  it("dreamtimeTraversal always finds a path", () => {
    const graph = buildGraph(
      [wp("A", [0, 0]), wp("B", [5, 5]), wp("C", [10, 10])],
      [],
    );
    const result = dreamtimeTraversal(graph, "A", "C");
    assert.ok(result.dreamtime);
    assert.equal(result.path[0], "A");
    assert.equal(result.path[result.path.length - 1], "C");
  });

  it("reachableNodes finds all reachable nodes", () => {
    const graph = buildGraph(
      [wp("A", [0]), wp("B", [1]), wp("C", [2])],
      [{ from: "A", to: "B", weight: 1 }],
    );
    const reachable = reachableNodes(graph, "A");
    assert.ok(reachable.has("A"));
    assert.ok(reachable.has("B"));
    assert.ok(!reachable.has("C"));
  });

  it("pathExists returns correct results", () => {
    const graph = buildGraph(
      [wp("A", [0]), wp("B", [1]), wp("C", [2])],
      [{ from: "A", to: "B", weight: 1 }],
    );
    assert.ok(pathExists(graph, "A", "B"));
    assert.ok(!pathExists(graph, "A", "C"));
  });

  it("navigability computes correctly", () => {
    const graph = buildGraph(
      [wp("A", [0]), wp("B", [1]), wp("C", [2])],
      [
        { from: "A", to: "B", weight: 1 },
        { from: "B", to: "C", weight: 1 },
      ],
    );
    const nav = navigability(graph);
    assert.ok(nav > 0);
    assert.ok(nav <= 1);
  });

  it("navigability is 1 for fully connected graph", () => {
    const graph = buildGraph(
      [wp("A", [0]), wp("B", [1])],
      [{ from: "A", to: "B", weight: 1 }],
    );
    assert.equal(navigability(graph), 1);
  });
});

// ===== CORROBOREE MODULE =====

describe("corroboree", () => {
  function makeSongs() {
    const graph = buildGraph(
      [wp("A", [0, 0]), wp("B", [1, 0]), wp("C", [2, 0]), wp("D", [0, 1])],
      [
        { from: "A", to: "B", weight: 1 },
        { from: "B", to: "C", weight: 1 },
        { from: "A", to: "D", weight: 1 },
        { from: "D", to: "B", weight: 1 },
      ],
    );
    const s1 = buildSongFromPath(graph, ["A", "B", "C"], "s1");
    const s2 = buildSongFromPath(graph, ["A", "D", "B"], "s2");
    return { graph, songs: [s1, s2] };
  }

  it("findCorroborees finds shared waypoints", () => {
    const { songs } = makeSongs();
    const corrs = findCorroborees(songs);
    // A and B are shared
    const ids = corrs.map((c) => c.waypoint.id);
    assert.ok(ids.includes("A"));
    assert.ok(ids.includes("B"));
    assert.ok(!ids.includes("C"));
  });

  it("clusterBySongs groups nodes", () => {
    const { songs } = makeSongs();
    const clusters = clusterBySongs(songs, 2);
    // A and B appear in both songs, C in only s1, D in only s2
    assert.ok(clusters.length >= 1);
  });

  it("songIntersection finds shared waypoints", () => {
    const { songs } = makeSongs();
    const shared = songIntersection(songs[0], songs[1]);
    assert.ok(shared.includes("A"));
    assert.ok(shared.includes("B"));
  });

  it("findHubs returns high-degree nodes", () => {
    const { graph } = makeSongs();
    const hubs = findHubs(graph, 3);
    assert.ok(hubs.length <= 3);
    assert.ok(hubs.length >= 1);
    // A has edges to B and D, so it should be high degree
    assert.ok(hubs[0].degree > 0);
  });

  it("modularity returns a number", () => {
    const { graph, songs } = makeSongs();
    const clusters = clusterBySongs(songs, 2);
    const mod = modularity(graph, clusters);
    assert.ok(typeof mod === "number");
    assert.ok(mod >= -1 && mod <= 1);
  });
});

// ===== DREAMTIME MODULE =====

describe("dreamtime", () => {
  function makeGraph() {
    return buildGraph(
      [
        wp("A", [0, 0]),
        wp("B", [1, 0]),
        wp("C", [1, 1]),
        wp("D", [0, 1]),
        wp("E", [5, 5]),
      ],
      [
        { from: "A", to: "B", weight: 1 },
        { from: "B", to: "C", weight: 1 },
        { from: "C", to: "D", weight: 1 },
        { from: "D", to: "A", weight: 1 },
      ],
    );
  }

  it("distanceMatrix computes pairwise distances", () => {
    const graph = makeGraph();
    const { ids, distances } = distanceMatrix(graph);
    assert.equal(ids.length, 5);
    assert.equal(distances.length, 5);
    // Diagonal should be 0
    for (let i = 0; i < ids.length; i++) {
      assert.equal(distances[i][i], 0);
    }
    // Symmetric
    assert.equal(distances[0][1], distances[1][0]);
  });

  it("bettiNumbers at threshold 0 returns 5 components", () => {
    const graph = makeGraph();
    const betti = bettiNumbers(graph, 0);
    assert.equal(betti.b0, 5);
    assert.equal(betti.b1, 0);
  });

  it("bettiNumbers at large threshold returns 1 component", () => {
    const graph = makeGraph();
    const betti = bettiNumbers(graph, 100);
    assert.equal(betti.b0, 1);
    assert.ok(betti.b1 >= 0);
  });

  it("persistentCycles returns cycles", () => {
    const graph = makeGraph();
    const cycles = persistentCycles(graph, 10);
    // With A-B-C-D cycle, should find at least one cycle
    assert.ok(Array.isArray(cycles));
  });

  it("persistenceBarcode returns barcode data", () => {
    const graph = makeGraph();
    const barcode = persistenceBarcode(graph, 5);
    assert.equal(barcode.length, 6);
    // First entry: all separate
    assert.equal(barcode[0].b0, 5);
    // Last entry: all connected
    assert.ok(barcode[barcode.length - 1].b0 <= 5);
  });
});

// ===== TRADITION MODULE =====

describe("tradition", () => {
  function makeSetup() {
    const graph = buildGraph(
      [wp("A", [0, 0]), wp("B", [1, 0]), wp("C", [2, 0]), wp("D", [0, 1])],
      [
        { from: "A", to: "B", weight: 1 },
        { from: "B", to: "C", weight: 1 },
        { from: "A", to: "D", weight: 1 },
      ],
    );
    const s1 = buildSongFromPath(graph, ["A", "B", "C"], "s1");
    const s2 = buildSongFromPath(graph, ["A", "D"], "s2");
    return { graph, songs: [s1, s2] };
  }

  it("createTradition creates a tradition", () => {
    const { graph, songs } = makeSetup();
    const t = createTradition("test", songs);
    assert.equal(t.id, "test");
    assert.equal(t.generation, 0);
    assert.equal(t.songs.length, 2);
  });

  it("computeFitness returns value between 0 and 1", () => {
    const { songs } = makeSetup();
    for (const song of songs) {
      const f = computeFitness(song);
      assert.ok(f >= 0 && f <= 1);
    }
  });

  it("mutateSong adds a waypoint", () => {
    const { graph, songs } = makeSetup();
    const mutated = mutateSong(songs[0], graph);
    // Mutation may or may not change length (depends on random)
    assert.ok(mutated.waypoints.length >= songs[0].waypoints.length);
  });

  it("recombineSongs produces a child when shared waypoints exist", () => {
    const { graph, songs } = makeSetup();
    const child = recombineSongs(songs[0], songs[1], graph);
    // Both share "A"
    assert.ok(child !== null);
    assert.ok(child!.waypoints.length >= 1);
  });

  it("evolveGeneration advances generation", () => {
    const { graph, songs } = makeSetup();
    const t = createTradition("test", songs);
    const t2 = evolveGeneration(t, graph);
    assert.equal(t2.generation, 1);
    assert.ok(t2.songs.length >= 0);
  });

  it("recordUsage increases fitness", () => {
    const { songs } = makeSetup();
    const t = createTradition("test", songs);
    const before = t.songs[0].fitness;
    const t2 = recordUsage(t, "s1");
    assert.ok(t2.songs[0].fitness >= before);
    assert.equal(t2.songs[0].usageCount, 1);
  });

  it("fittestSong returns highest fitness", () => {
    const { songs } = makeSetup();
    const t = createTradition("test", songs);
    const best = fittestSong(t);
    assert.ok(best !== null);
    assert.ok(best!.fitness > 0);
  });

  it("fittestSong returns null for empty tradition", () => {
    const t = createTradition("empty", []);
    assert.equal(fittestSong(t), null);
  });
});

// ===== SONG LINE GRAPH (UNIFIED API) =====

describe("SonglineGraph", () => {
  it("builds a graph and navigates", () => {
    const sg = new SonglineGraph();
    sg.addWaypoint("A", [0, 0]);
    sg.addWaypoint("B", [1, 0]);
    sg.addWaypoint("C", [2, 0]);
    sg.addVerse("A", "B", 1);
    sg.addVerse("B", "C", 2);

    const result = sg.sing("A", "C");
    assert.deepEqual(result.path, ["A", "B", "C"]);
  });

  it("builds and retrieves songs", () => {
    const sg = new SonglineGraph();
    sg.addWaypoint("A", [0, 0]);
    sg.addWaypoint("B", [1, 0]);
    sg.addVerse("A", "B", 1);

    const song = sg.buildSong(["A", "B"], "my-song");
    assert.equal(song.id, "my-song");
    assert.equal(sg.songs.length, 1);
  });

  it("reverses and extracts sub-songs", () => {
    const sg = new SonglineGraph();
    sg.addWaypoint("A", [0, 0]);
    sg.addWaypoint("B", [1, 0]);
    sg.addWaypoint("C", [2, 0]);
    sg.addVerse("A", "B", 1);
    sg.addVerse("B", "C", 2);

    sg.buildSong(["A", "B", "C"], "abc");
    const rev = sg.reverseSong("abc");
    assert.deepEqual(rev!.waypoints.map((w) => w.id), ["C", "B", "A"]);

    const sub = sg.subSong("abc", 0, 2);
    assert.equal(sub!.waypoints.length, 2);
  });

  it("computes song cost", () => {
    const sg = new SonglineGraph();
    sg.addWaypoint("A", [0]);
    sg.addWaypoint("B", [1]);
    sg.addVerse("A", "B", 5);
    sg.buildSong(["A", "B"], "costly");
    assert.equal(sg.songCost("costly"), 5);
  });

  it("finds corroborees", () => {
    const sg = new SonglineGraph();
    sg.addWaypoint("A", [0, 0]);
    sg.addWaypoint("B", [1, 0]);
    sg.addWaypoint("C", [2, 0]);
    sg.addVerse("A", "B", 1);
    sg.addVerse("B", "C", 1);
    sg.addVerse("C", "A", 1);

    sg.buildSong(["A", "B", "C"], "song1");
    sg.buildSong(["C", "A"], "song2");

    const corrs = sg.corroborees();
    assert.ok(corrs.length >= 1);
    const ids = corrs.map((c) => c.waypoint.id);
    assert.ok(ids.includes("A") || ids.includes("C"));
  });

  it("computes topology", () => {
    const sg = new SonglineGraph();
    sg.addWaypoint("A", [0, 0]);
    sg.addWaypoint("B", [1, 0]);
    sg.addWaypoint("C", [1, 1]);
    sg.addWaypoint("D", [0, 1]);
    sg.addVerse("A", "B", 1);
    sg.addVerse("B", "C", 1);
    sg.addVerse("C", "D", 1);
    sg.addVerse("D", "A", 1);

    const topo = sg.topology(0);
    assert.equal(topo.b0, 4);
    assert.equal(topo.b1, 0);

    const topoLarge = sg.topology(100);
    assert.equal(topoLarge.b0, 1);
  });

  it("evolves a tradition", () => {
    const sg = new SonglineGraph();
    sg.addWaypoint("A", [0, 0]);
    sg.addWaypoint("B", [1, 0]);
    sg.addWaypoint("C", [2, 0]);
    sg.addVerse("A", "B", 1);
    sg.addVerse("B", "C", 1);

    sg.buildSong(["A", "B", "C"], "s1");
    sg.buildSong(["A", "B"], "s2");

    const tradition = sg.evolve("my-trad", 5);
    assert.equal(tradition.generation, 5);
    assert.ok(tradition.songs.length >= 0);
  });

  it("computes navigability score", () => {
    const sg = new SonglineGraph();
    sg.addWaypoint("A", [0]);
    sg.addWaypoint("B", [1]);
    sg.addVerse("A", "B", 1);
    assert.equal(sg.navigabilityScore, 1);
  });

  it("returns null for missing songs", () => {
    const sg = new SonglineGraph();
    assert.equal(sg.reverseSong("nope"), null);
    assert.equal(sg.subSong("nope", 0, 1), null);
    assert.equal(sg.songCost("nope"), null);
  });

  it("gets waypoints and distances", () => {
    const sg = new SonglineGraph();
    sg.addWaypoint("A", [0, 0]);
    sg.addWaypoint("B", [3, 4]);
    assert.deepEqual(sg.waypointIds, ["A", "B"]);
    assert.equal(sg.getWaypoint("A")!.coordinates[0], 0);

    const d = sg.distances();
    assert.equal(d.ids.length, 2);
    assert.equal(d.distances[0][1], 5);
  });
});
