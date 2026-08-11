/* ds — A13 "Graphs", the adjacency-matrix representation.
 *
 * Storing a graph as a matrix of booleans, and what DIRECTION costs. The lecture
 * (graphs.html) makes one point with two matched diagrams on the same five nodes:
 *
 *   adMatrix.gif  — a DIRECTED graph, whose matrix is NOT symmetric
 *   symmetric.gif — an UNDIRECTED graph, whose matrix IS symmetric, with the
 *                   diagonal drawn in as a mirror line
 *
 * The instructor's sentence is the lesson: "If the graph is undirected, then the
 * matrix is symmetric, because the edge between nodes j and k conceptually runs
 * in both directions." And setEdge is what makes it visible — a directed edge
 * writes ONE cell, an undirected edge writes TWO. So we build the same five-node
 * shape twice, once each way, and watch the matrix fill differently.
 *
 * The two graphs sit in IDENTICAL fixed positions (positions are data, supplied
 * below), because the comparison is only honest if nothing but the edges moves.
 * The lecture's own point that "the layout of a graph is arbitrary" is true, but
 * here we hold it fixed on purpose.
 *
 * DATA, verified cell by cell against the lecture's diagrams:
 *
 *   DIRECTED edges (arrows):  0->2  0->4  1->0  1->3  2->3  3->1
 *     matrix (row=source, col=target), T where an edge runs:
 *          0 1 2 3 4
 *       0  F F T F T      row 4 is entirely F — node 4 has no outgoing edges, a
 *       1  T F F T F      dead end, which only a directed graph can have.
 *       2  F F F T F
 *       3  F T F F F
 *       4  F F F F F
 *
 *   UNDIRECTED edges (lines):  0-1  0-2  0-4  1-3  2-3
 *     matrix — every edge appears TWICE, so it is symmetric across the diagonal:
 *          0 1 2 3 4
 *       0  F T T F T
 *       1  T F F T F
 *       2  T F F T F
 *       3  F T T F F
 *       4  T F F F F
 *
 * WATCH only: one trace, no gates. Metrics hidden. No node links to itself here,
 * so the diagonal is all F in both graphs (a self-loop would set [k][k]); the
 * lecture notes that once, and so does step 0 — it is not animated. Edges cross,
 * and that is correct: a graph is not planar in general, so the lines stay
 * straight and are not routed around one another. */

/* One listing, three ds languages, line-aligned to a single 10-line grid so
 * `line` is a plain number that resolves the same in every language. Lines 2, 5
 * and 6 are the whole lesson: setUndirectedEdge is setEdge twice with the indices
 * swapped, and that swap IS the symmetry, written down. buildDirected and
 * buildUndirected are shown as the two main-line calls rather than every setter
 * call, so the code panel stays short and the matrix does the talking. */
const LISTINGS = {
  pseudo: [
    'setEdge(j, k)',                          //  1
    '    matrix[j][k] = true',                //  2
    '',                                       //  3
    'setUndirectedEdge(j, k)',                //  4
    '    matrix[j][k] = true',                //  5
    '    matrix[k][j] = true',                //  6
    '',                                       //  7
    'main()',                                 //  8
    '    buildDirected()',                    //  9
    '    buildUndirected()',                  // 10
  ],
  cpp: [
    'void setEdge(int j, int k) {',           //  1
    '    matrix[j][k] = true; }',             //  2
    '',                                       //  3
    'void setUndirectedEdge(int j, int k) {', //  4
    '    matrix[j][k] = true;',               //  5
    '    matrix[k][j] = true; }',             //  6
    '',                                       //  7
    'int main() {',                           //  8
    '    buildDirected();',                   //  9
    '    buildUndirected(); }',               // 10
  ],
  java: [
    'void setEdge(int j, int k) {',           //  1
    '    matrix[j][k] = true; }',             //  2
    '',                                       //  3
    'void setUndirectedEdge(int j, int k) {', //  4
    '    matrix[j][k] = true;',               //  5
    '    matrix[k][j] = true; }',             //  6
    '',                                       //  7
    'void main() {',                          //  8
    '    buildDirected();',                   //  9
    '    buildUndirected(); }',               // 10
  ],
};

/* ---- teaching notes ---- */
const OPEN_NOTE =
  'Twenty-five cells for five nodes — one for every ordered pair, including each node paired with itself. A T on ' +
  'the diagonal, cell [k][k], would mean a node with an edge to itself, a self-loop; there are none here, so the ' +
  'diagonal stays F throughout. That is what a matrix costs: n squared cells, whether the graph is dense or nearly ' +
  'empty. Watch how many stay F.';

const FIRST_EDGE_NOTE =
  'One edge, one cell. Row 0, column 2 — the row is where the edge starts, the column is where it ends. Nothing was ' +
  'written at [2][0], because there is no edge from 2 back to 0.';

const DIRECTED_DONE_NOTE =
  'Look at the matrix against the diagonal. [0][2] is T but [2][0] is F. [1][0] is T but [0][1] is F. Nothing ' +
  'mirrors, because in a directed graph an edge one way says nothing about the other way. And look at row 4: every ' +
  'cell F. Node 4 has no outgoing edges at all — you can reach it, but you cannot leave. The lecture calls that a ' +
  'dead end, and it can only happen in a directed graph.';

const SYMMETRY_NOTE =
  'This is where symmetry comes from. Nobody checks for it afterwards and nothing enforces it — the matrix is ' +
  'symmetric because setUndirectedEdge writes both matrix[j][k] and matrix[k][j]. An undirected edge simply IS two ' +
  'directed edges, and the code says so.';

const UNDIRECTED_DONE_NOTE =
  'Five edges, ten cells. An undirected graph costs exactly twice the writes and stores every fact twice.';

const FINAL_NOTE =
  'Fold the matrix along the diagonal and every T lands on a T. That is what the lecture means: the edge between j ' +
  'and k conceptually runs in both directions, so both cells are set. Two things worth thinking about. Half of this ' +
  'matrix is redundant — if it is symmetric, [k][j] tells you nothing [j][k] did not. Could you store only half? ' +
  'What would you give up? And the cost: twenty-five cells for five nodes, of which ten are T. For a thousand nodes ' +
  'that is a million cells, and if each node connects to only a handful of others, nearly all of them are F. When ' +
  'is a matrix the wrong choice — and what would you use instead?';

/* The five nodes, at FIXED positions supplied here (grid units, x = column,
 * y = row): 4 above 0; 0 with 1 to its right; 2 below 0; 3 right of 2. The same
 * positions serve both graphs — only the edges differ. */
const NODES = [
  { id: 'g4', label: '4', x: 0, y: 0 },
  { id: 'g0', label: '0', x: 0, y: 1 },
  { id: 'g1', label: '1', x: 1, y: 1 },
  { id: 'g2', label: '2', x: 0, y: 2 },
  { id: 'g3', label: '3', x: 1, y: 2 },
];

// Directed edges, in build order. j = source (row), k = target (column).
const DIRECTED = [
  { from: 'g0', to: 'g2', j: 0, k: 2 },
  { from: 'g0', to: 'g4', j: 0, k: 4 },
  { from: 'g1', to: 'g0', j: 1, k: 0 },
  { from: 'g1', to: 'g3', j: 1, k: 3 },
  { from: 'g2', to: 'g3', j: 2, k: 3 },
  { from: 'g3', to: 'g1', j: 3, k: 1 },
];

// Undirected edges, in build order. Each writes matrix[j][k] then matrix[k][j].
const UNDIRECTED = [
  { from: 'g0', to: 'g1', j: 0, k: 1 },
  { from: 'g0', to: 'g2', j: 0, k: 2 },
  { from: 'g0', to: 'g4', j: 0, k: 4 },
  { from: 'g1', to: 'g3', j: 1, k: 3 },
  { from: 'g2', to: 'g3', j: 2, k: 3 },
];

function* trace() {
  const N = 5;
  const mat = Array.from({ length: N }, () => Array(N).fill(false));
  let edges = [];                     // graph edges present so far {from,to,directed,key,active}

  const graphPanel = () => ({
    layout: 'graph',
    nodes: NODES.map(n => ({ id: n.id, label: n.label, x: n.x, y: n.y, state: 'idle' })),
    edges: edges.map(e => ({ from: e.from, to: e.to, directed: e.directed, state: e.active ? 'active' : '' })),
  });

  // The 5x5 grid. `active` is a set of "r,c" keys taking the blue "written this
  // step" fill; every other cell shows its stored F/T. The diagonal wash is drawn
  // by the renderer from the cell position, not authored here.
  const matrixPanel = (active) => ({
    render: 'grid', rows: N, cols: N,
    rowHeader: [0, 1, 2, 3, 4], colHeader: [0, 1, 2, 3, 4],
    cells: mat.flatMap((row, r) => row.map((v, c) => ({
      value: v ? 'T' : 'F',
      role: active.has(`${r},${c}`) ? 'active' : undefined,
    }))),
  });

  const snap = ({ line, tag, narrate, note, parked, active = [] }) => ({
    line, tag, narrate, note, parked,
    panels: { graph: graphPanel(), matrix: matrixPanel(new Set(active)) },
  });

  /* ================================ the trace ================================ */

  // STEP 0 — nothing has executed. Five nodes, no edges, matrix all F.
  yield snap({ line: null, tag: 'init', note: OPEN_NOTE,
    narrate: 'Five nodes and no edges yet. The matrix holds one boolean for every possible edge: is there one from row j to column k?' });

  /* ---- building the DIRECTED graph ---- */
  yield snap({ line: 9, tag: 'call',
    narrate: 'main calls buildDirected. It will call setEdge once for each arrow in the directed graph.' });

  for (let i = 0; i < DIRECTED.length; i++) {
    const e = DIRECTED[i];
    // Clear last step's activity before this edge's call step.
    edges.forEach(x => (x.active = false));
    yield snap({ line: 1, tag: 'call', parked: [9],
      narrate: `buildDirected calls setEdge(${e.j}, ${e.k}) — an edge from ${e.j} to ${e.k}.` });

    // line 2: write matrix[j][k]; the arrow appears in the graph, both blue.
    mat[e.j][e.k] = true;
    edges.push({ from: e.from, to: e.to, directed: true, active: true });
    const last = i === DIRECTED.length - 1;
    yield snap({ line: 2, tag: 'assign', parked: [9], active: [`${e.j},${e.k}`],
      narrate: last
        ? `matrix[${e.j}][${e.k}] = true — the sixth and last directed edge.`
        : `matrix[${e.j}][${e.k}] = true. The arrow from ${e.j} to ${e.k} appears.`,
      note: i === 0 ? FIRST_EDGE_NOTE : undefined });
  }

  // buildDirected returns: six edges, six cells. The asymmetry and the dead end.
  edges.forEach(x => (x.active = false));
  yield snap({ line: 9, tag: 'return', note: DIRECTED_DONE_NOTE,
    narrate: 'Six edges, six cells. buildDirected is done.' });

  /* ---- reset, then building the UNDIRECTED graph — the payoff ---- */
  for (let r = 0; r < N; r++) mat[r].fill(false);
  edges = [];
  yield snap({ line: 10, tag: 'call',
    narrate: 'main now calls buildUndirected. The matrix is cleared — every cell back to F — and we build the same five nodes again, this time with undirected edges.' });

  for (let i = 0; i < UNDIRECTED.length; i++) {
    const e = UNDIRECTED[i];
    const last = i === UNDIRECTED.length - 1;
    edges.forEach(x => (x.active = false));

    // the call
    yield snap({ line: 4, tag: 'call', parked: [10],
      narrate: `buildUndirected calls setUndirectedEdge(${e.j}, ${e.k}) — an edge between ${e.j} and ${e.k}, with no direction, so it runs both ways.` });

    // line 5: matrix[j][k] = true; the plain line (no arrowhead) appears, blue.
    mat[e.j][e.k] = true;
    edges.push({ from: e.from, to: e.to, directed: false, active: true });
    yield snap({ line: 5, tag: 'assign', parked: [10], active: [`${e.j},${e.k}`],
      narrate: i === 0
        ? `matrix[${e.j}][${e.k}] = true. The line between ${e.j} and ${e.k} appears — a plain line, no arrowhead.`
        : `matrix[${e.j}][${e.k}] = true.` });

    // line 6: matrix[k][j] = true; BOTH cells lit together — the mirror is the point.
    mat[e.k][e.j] = true;
    yield snap({ line: 6, tag: 'assign', parked: [10], active: [`${e.j},${e.k}`, `${e.k},${e.j}`],
      narrate: i === 0
        ? `And the same edge again, backwards: matrix[${e.k}][${e.j}] = true. Two cells for one edge.`
        : `matrix[${e.k}][${e.j}] = true — the mirror cell.`,
      note: i === 0 ? SYMMETRY_NOTE : (last ? UNDIRECTED_DONE_NOTE : undefined) });
  }

  // buildUndirected returns: the matrix is symmetric across the diagonal.
  edges.forEach(x => (x.active = false));
  yield snap({ line: 10, tag: 'return', note: FINAL_NOTE,
    narrate: 'Five edges, and the matrix is symmetric across the diagonal.' });
}

export default {
  title: 'Storing a graph as a matrix',
  subtitle: 'One edge, one cell — or two',
  profile: 'standard',
  columns: 2,
  languages: ['pseudo', 'cpp', 'java'],

  // Three panels. The graph and the matrix are BOTH structure panels and sit SIDE
  // BY SIDE in the structure region — the whole animation is reading one against
  // the other, exactly as the lecture places its two diagrams. The code panel
  // anchors the left column. Everything resolves once on load and holds, so
  // nothing moves as steps advance (pac.verifyHeights()).
  panels: [
    { type: 'code',  id: 'code',   title: 'setEdge',
      listings: LISTINGS, labels: { pseudo: 'pseudocode', cpp: 'C++', java: 'Java' } },
    { type: 'nodes', id: 'graph',  title: 'the graph',  structure: true },
    { type: 'cells', id: 'matrix', title: 'the adjacency matrix', structure: true },
  ],

  initialTrace: 'run',
  traces: {
    run: trace,
  },
};
