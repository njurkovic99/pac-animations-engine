/* ds — A7 "Heapsort", PART 1 of 2: building the heap (KEY material)
 *
 * Heapsort is split across two animations because one is too long. This is
 * part 1 — turning an unordered array into a valid binary MAX HEAP. Part 2,
 * `sorting-heapsort-dual`, starts exactly where this ends (the heap array
 * [9,6,8,4,1,2]) and does the repeated extract-and-sink that produces the
 * sorted order.
 *
 * THE CENTRAL IDEA, and the reason for the dual view: THERE IS NO TREE. The
 * lecture is explicit — we use a tree only to picture node movements, but we
 * are always manipulating one simple array. The tree and the array are the
 * SAME six values drawn two ways; the index formulas 2i+1 / 2i+2 are the only
 * thing connecting them. Every swap therefore changes BOTH panels on the same
 * step — that simultaneity is the whole lesson.
 *
 * The array and every intermediate state are the lecture's own worked example,
 * verified frame by frame (a = [1,9,2,4,6,8], size = 6, last parent index 2):
 *
 *   siftDown(2,5)  root 2 (2), only child 5 (8), 8>2 -> SWAP -> [1,9,8,4,6,2]
 *   siftDown(1,5)  root 1 (9), larger child 4 (6), 6>9 false -> no swap
 *   siftDown(0,5)  root 0 (1), larger child 1 (9), 9>1 -> SWAP -> [9,1,8,4,6,2]
 *                  root 1 (1), larger child 4 (6), 6>1 -> SWAP -> [9,6,8,4,1,2]
 *   FINAL HEAP: [9,6,8,4,1,2]   tree: 9 / 6,8 / 4,1,2
 *
 * NO GREEN FILL ANYWHERE. Heapify puts nothing in its final SORTED position —
 * the root merely holds the largest value. Green (`sorted`) belongs to part 2.
 * Nothing here corrupts memory — no memory-danger marker. WATCH only: one
 * trace, no gates. Metrics hidden.
 *
 * ON THE TREE'S ONLY CHILD (index 5). The lecture draws node 5 to the LEFT
 * under node 2, because 5 = 2*2+1 is a LEFT child. The engine's tree layout
 * (inherited unchanged — no new engine capability) centres a lone child
 * directly beneath its parent, exactly as the quicksort recursion tree already
 * draws its single-child nodes. Node 5 therefore hangs straight down from node
 * 2 rather than offset left; its small `[5]` index label and the narrated
 * 2*2+1 = 5 keep it unambiguous as the left child. */

/* One listing, three ds languages, line-aligned to a single 19-line grid so
 * `line` is a plain number that resolves the same in every language. Lines 4
 * and 5 make explicit what the lecture's prose leaves implicit ("the child with
 * the larger value"): with two children it takes a comparison, and
 * `child + 1 <= end` is what handles a node that has only a left child. Both are
 * where students get the index arithmetic wrong, so both are real steps. */
const LISTINGS = {
  pseudo: [
    'siftDown(a, root, end)',                             //  1
    '    while root * 2 + 1 <= end',                      //  2
    '        child = root * 2 + 1',                       //  3
    '        if child + 1 <= end and a[child + 1] > a[child]', //  4
    '            child = child + 1',                      //  5
    '        if a[child] > a[root]',                      //  6
    '            swap a[root] and a[child]',              //  7
    '            root = child',                           //  8
    '        else',                                       //  9
    '            return',                                 // 10
    '',                                                   // 11
    'heapify(a, size)',                                   // 12
    '    start = (size - 2) / 2',                         // 13
    '    while start >= 0',                               // 14
    '        siftDown(a, start, size - 1)',               // 15
    '        start = start - 1',                          // 16
    '',                                                   // 17
    'main()',                                             // 18
    '    heapify(a, 6)',                                  // 19
  ],
  cpp: [
    'void siftDown(int a[], int root, int end) {',        //  1
    '    while (root * 2 + 1 <= end) {',                  //  2
    '        int child = root * 2 + 1;',                  //  3
    '        if (child + 1 <= end && a[child + 1] > a[child])', //  4
    '            child = child + 1;',                     //  5
    '        if (a[child] > a[root]) {',                  //  6
    '            swap(a[root], a[child]);',               //  7
    '            root = child;',                          //  8
    '        } else',                                     //  9
    '            return; } }',                            // 10
    '',                                                   // 11
    'void heapify(int a[], int size) {',                  // 12
    '    int start = (size - 2) / 2;',                    // 13
    '    while (start >= 0) {',                           // 14
    '        siftDown(a, start, size - 1);',              // 15
    '        start = start - 1; } }',                     // 16
    '',                                                   // 17
    'int main() {',                                       // 18
    '    heapify(a, 6); }',                               // 19
  ],
  java: [
    'void siftDown(int[] a, int root, int end) {',        //  1
    '    while (root * 2 + 1 <= end) {',                  //  2
    '        int child = root * 2 + 1;',                  //  3
    '        if (child + 1 <= end && a[child + 1] > a[child])', //  4
    '            child = child + 1;',                     //  5
    '        if (a[child] > a[root]) {',                  //  6
    '            swap(a, root, child);',                  //  7
    '            root = child;',                          //  8
    '        } else',                                     //  9
    '            return; } }',                            // 10
    '',                                                   // 11
    'void heapify(int[] a, int size) {',                  // 12
    '    int start = (size - 2) / 2;',                    // 13
    '    while (start >= 0) {',                           // 14
    '        siftDown(a, start, size - 1);',              // 15
    '        start = start - 1; } }',                     // 16
    '',                                                   // 17
    'void main() {',                                      // 18
    '    heapify(a, 6); }',                               // 19
  ],
};

/* ---- teaching notes ---- */
const OPEN_NOTE =
  'There is no tree in memory. There is one array, and the tree is how we picture it: the value at index 0 is ' +
  'the root, and for any index i its children live at 2i+1 and 2i+2. A BINARY MAX HEAP requires every parent to ' +
  'be greater than or equal to both of its children. Right now that is badly violated — 1 sits above 9. Fixing ' +
  'that is called heapifying.';

const SETUP_NOTE =
  'Heapify works from the LAST parent backwards to the root. Doing it in that order means that when a node is ' +
  'sifted down, everything below it is already a valid heap.';

const ONLY_CHILD_NOTE =
  'This is the case that catches people. A node can have one child or two, and the code has to check ' +
  'child + 1 <= end before it reads a[child + 1] — otherwise it reads past the end of the array.';

const SWAP_TREE_NOTE =
  'Look at both panels: the two array cells and the two tree nodes take the blue fill on this one step. There is ' +
  'still no tree in memory — the tree is a picture of the array, and both change together because they are the ' +
  'same value in two views. The 2i+1 / 2i+2 formulas are the only thing joining them.';

const LARGER_CHILD_NOTE =
  'Only the LARGER child matters. If the parent beats the larger one it beats both, and the heap property holds ' +
  'for this node.';

const NO_SWAP_NOTE =
  'A sift that does nothing is not a wasted step — it is the check that proves this subtree is already correct.';

const SIFT_NOTE =
  "This is what 'sift down' means. One value can fall through several levels in a single call, swapping with the " +
  'larger child each time, until it is bigger than both its children or it runs out of children.';

const FINAL_NOTE =
  'Check it yourself: 9 over 6 and 8; 6 over 4 and 1; 8 over 2. Note what heapifying did NOT do — the array is ' +
  'not sorted, and only the root is where it will finally belong. Two things worth thinking about. Why start at ' +
  'the last parent instead of the root — what would go wrong sifting the root first, while the subtrees below it ' +
  'are still unheaped? And now that the largest value is at index 0, how would you use that to actually sort the ' +
  'array?';

/* The six tree nodes: a complete binary tree over indices 0..5. Node i's
 * children are 2i+1 and 2i+2, so 1,2 sit under 0; 3,4 under 1; 5 under 2. All
 * six are present from step 0 and never move — only their values change. */
const NODES = [
  { id: 'n0', parent: null, idx: 0 },
  { id: 'n1', parent: 'n0', idx: 1 },
  { id: 'n2', parent: 'n0', idx: 2 },
  { id: 'n3', parent: 'n1', idx: 3 },
  { id: 'n4', parent: 'n1', idx: 4 },
  { id: 'n5', parent: 'n2', idx: 5 },
];
// Neutral parent edges (state '' = grey), so the tree's structure lines never
// read as "active" — only nodes carry the per-step amber/blue treatments.
const EDGES = NODES.filter(n => n.parent).map(n => ({ from: n.parent, to: n.id, state: '' }));

function* trace() {
  const a = [1, 9, 2, 4, 6, 8];      // the lecture's worked example
  let start = null;                  // heapify's loop var  (null = box empty, no marker)
  let root = null, child = null, end = null; // siftDown's vars (null = absent)

  /* ---- the array-position markers: start (heapify), root, child (siftDown) ---- */
  const markers = () => {
    const m = [];
    if (start != null) m.push({ label: 'start', index: start });
    if (root != null)  m.push({ label: 'root',  index: root });
    if (child != null) m.push({ label: 'child', index: child });
    return m;
  };

  /* The array. A cell acted on THIS step (`active`, blue fill) wins over the
   * amber `compared` outline (a cell being examined). No green anywhere. */
  const arrayPanel = (compared, active) => ({
    render: 'box',
    rowLabel: 'a',
    cells: a.map((v, idx) => {
      if (active.includes(idx))   return { value: v, role: 'active' };
      if (compared.includes(idx)) return { value: v, role: 'compared' };
      return { value: v };
    }),
    markers: markers(),
  });

  /* The tree — the SAME data. A node's label is its VALUE (a[idx], prominent);
   * its `[idx]` meta (small) ties it to the array cell below. `active` (blue
   * fill) marks a node changing this step — the same indices as the array, so
   * the two panels can never disagree. A node being examined takes the amber
   * outline via `unlinked` (the only amber-outline node treatment the engine
   * has; here there is no membership question, so amber reads purely as "being
   * looked at", matching the array's amber `compared` cells). Everything else
   * is the neutral `idle` outline — never green, which would wrongly say
   * "settled in its final sorted place". */
  const treePanel = (compared, active) => ({
    layout: 'tree',
    edges: EDGES,
    nodes: NODES.map(n => ({
      id: n.id, parent: n.parent,
      label: String(a[n.idx]),
      meta: [`[${n.idx}]`],
      state: compared.includes(n.idx) ? 'unlinked' : 'idle',
      active: active.includes(n.idx),
    })),
  });

  /* The compact Variables strip: start, root, child, end. A var with no value
   * shows the placeholder dash; the one changing this step takes the blue fill. */
  const varsPanel = hot => ({
    render: 'box',
    cells: [
      { label: 'start', value: start == null ? '' : start, role: start == null ? 'empty' : (hot === 'start' ? 'active' : undefined) },
      { label: 'root',  value: root  == null ? '' : root,  role: root  == null ? 'empty' : (hot === 'root'  ? 'active' : undefined) },
      { label: 'child', value: child == null ? '' : child, role: child == null ? 'empty' : (hot === 'child' ? 'active' : undefined) },
      { label: 'end',   value: end   == null ? '' : end,   role: end   == null ? 'empty' : (hot === 'end'   ? 'active' : undefined) },
    ],
  });

  /* The call frames, bottom-to-top. `a` is the shared array, not shown as a
   * value; each frame carries the bindings that make the call concrete — the
   * lecture's "heapify -> siftDown with root and end bound". A caller frame's
   * `call` line is dimmed in the code panel (parked); the running top frame's is
   * ignored (it is the bright active line). */
  const mainF = () => ({ fn: 'main', vars: [], call: 19 });
  const heapifyF = hot => ({
    fn: 'heapify',
    vars: [
      { name: 'size', value: 6 },
      { name: 'start', value: start, kind: 'local', role: hot === 'start' ? 'active' : undefined },
    ],
    call: 15,
  });
  const siftF = hot => ({
    fn: 'siftDown',
    vars: [
      { name: 'root', value: root, role: hot === 'root' ? 'active' : undefined },
      { name: 'end',  value: end },
      ...(child == null ? [] : [{ name: 'child', value: child, kind: 'local', role: hot === 'child' ? 'active' : undefined }]),
    ],
  });
  const buildFrames = (level, hot) => {
    const f = [mainF()];
    if (level >= 1) f.push(heapifyF(hot));
    if (level >= 2) f.push(siftF(hot));
    return f;
  };

  const snap = ({ line, tag, narrate, note, compared = [], active = [], hot = null, level = 0 }) => {
    const frames = buildFrames(level, hot);
    const parked = frames.slice(0, -1).map(f => f.call).filter(Boolean);
    return {
      line, tag, narrate, note, parked,
      panels: {
        array: arrayPanel(compared, active),
        tree:  treePanel(compared, active),
        vars:  varsPanel(hot),
        calls: { frames: frames.map((f, k) => ({ fn: f.fn, vars: f.vars, active: k === frames.length - 1 })) },
      },
    };
  };

  /* ================================ the trace ================================ */

  // STEP 0 — nothing has executed.
  yield snap({ line: null, tag: 'init', note: OPEN_NOTE,
    narrate: 'Six values, in no particular order. The tree and the array hold the same data — the tree is only a way of seeing it.' });

  // main calls heapify (line 19). The call has a visible origin.
  yield snap({ line: 19, tag: 'call', level: 0,
    narrate: 'main calls heapify on the whole array, passing size = 6.' });

  // SETUP (line 13): start = (6 - 2) / 2 = 2.
  start = 2;
  yield snap({ line: 13, tag: 'assign', hot: 'start', level: 1, compared: [2], note: SETUP_NOTE,
    narrate: 'Inside heapify. start = (6 - 2) / 2 = 2 — the last parent. Everything after it is a leaf, and a leaf with no children is already a heap of one.' });

  /* ---- iteration start = 2 : siftDown(2, 5), the only-child case ---- */
  yield snap({ line: 14, tag: 'test', level: 1, compared: [2],
    narrate: 'start is 2, which is >= 0, so there is a parent here to sift down.' });
  yield snap({ line: 15, tag: 'call', level: 1, compared: [2],
    narrate: 'heapify calls siftDown for the subtree rooted at index 2, with end = 5 (the last index).' });

  root = 2; end = 5;
  yield snap({ line: 2, tag: 'test', level: 2, compared: [2],
    narrate: 'Inside siftDown. Index 2’s left child is at 2*2+1 = 5, and 5 <= 5, so there is a child to check.' });
  child = 5;
  yield snap({ line: 3, tag: 'assign', hot: 'child', level: 2, compared: [5],
    narrate: 'child = 2*2+1 = 5 — the index of the left child.' });
  yield snap({ line: 4, tag: 'test', level: 2, compared: [5], note: ONLY_CHILD_NOTE,
    narrate: 'There is no right child: index 6 is past the end (6 <= 5 is false). So the only candidate is index 5, the left child.' });
  yield snap({ line: 6, tag: 'test', level: 2, compared: [2, 5],
    narrate: 'a[5] is 8 and a[root] = a[2] is 2. 8 > 2, so the child is bigger — the parent must sink.' });
  a[2] = 8; a[5] = 2;
  yield snap({ line: 7, tag: 'swap', level: 2, active: [2, 5], note: SWAP_TREE_NOTE,
    narrate: '8 and 2 trade places. The same swap happens in the array and in the tree, because they are the same thing.' });
  root = 5; child = 5;
  yield snap({ line: 8, tag: 'assign', hot: 'root', level: 2, compared: [5],
    narrate: 'root follows the value down to index 5. The 2 we just moved is now there, and we check whether it must sink further.' });
  yield snap({ line: 2, tag: 'test', level: 2, compared: [5],
    narrate: 'Index 5’s left child would be at 5*2+1 = 11, past the end. Index 5 has no children, so this branch is finished.' });

  // back in heapify: start = 1
  root = null; child = null; end = null; start = 1;
  yield snap({ line: 16, tag: 'assign', hot: 'start', level: 1, compared: [1],
    narrate: 'Back in heapify. start = start - 1 = 1 — the previous parent.' });

  /* ---- iteration start = 1 : siftDown(1, 5), the no-swap case ---- */
  yield snap({ line: 14, tag: 'test', level: 1, compared: [1],
    narrate: 'start is 1, still >= 0 — another parent to sift down.' });
  yield snap({ line: 15, tag: 'call', level: 1, compared: [1],
    narrate: 'heapify calls siftDown for the subtree rooted at index 1, with end = 5.' });

  root = 1; end = 5;
  yield snap({ line: 2, tag: 'test', level: 2, compared: [1],
    narrate: 'Inside siftDown. Index 1’s left child is at 1*2+1 = 3, and 3 <= 5, so node 1 has children.' });
  child = 3;
  yield snap({ line: 3, tag: 'assign', hot: 'child', level: 2, compared: [3],
    narrate: 'child = 1*2+1 = 3 — the left child, holding 4.' });
  yield snap({ line: 4, tag: 'test', level: 2, compared: [3, 4], note: LARGER_CHILD_NOTE,
    narrate: 'Both children exist: index 3 holds 4, index 4 holds 6. 6 > 4, so the right child is the larger one.' });
  child = 4;
  yield snap({ line: 5, tag: 'assign', hot: 'child', level: 2, compared: [4],
    narrate: 'child moves to index 4 — the larger child, holding 6.' });
  yield snap({ line: 6, tag: 'test', level: 2, compared: [1, 4],
    narrate: 'a[4] is 6 and a[root] = a[1] is 9. 6 > 9 is false — the parent is already bigger than its larger child.' });
  yield snap({ line: 10, tag: 'return', level: 2, compared: [1], note: NO_SWAP_NOTE,
    narrate: '9 is already bigger than 6, so nothing moves. This part of the tree is already a valid heap.' });

  // back in heapify: start = 0
  root = null; child = null; end = null; start = 0;
  yield snap({ line: 16, tag: 'assign', hot: 'start', level: 1, compared: [0],
    narrate: 'Back in heapify. start = 0 — the root of the whole tree.' });

  /* ---- iteration start = 0 : siftDown(0, 5), the cascade ---- */
  yield snap({ line: 14, tag: 'test', level: 1, compared: [0],
    narrate: 'start is 0, still >= 0 — the last parent to fix is the root itself.' });
  yield snap({ line: 15, tag: 'call', level: 1, compared: [0],
    narrate: 'heapify calls siftDown for the root, index 0, with end = 5.' });

  root = 0; end = 5;
  yield snap({ line: 2, tag: 'test', level: 2, compared: [0],
    narrate: 'Inside siftDown. The root’s left child is at 0*2+1 = 1, and 1 <= 5.' });
  child = 1;
  yield snap({ line: 3, tag: 'assign', hot: 'child', level: 2, compared: [1],
    narrate: 'child = 0*2+1 = 1 — the left child, holding 9.' });
  yield snap({ line: 4, tag: 'test', level: 2, compared: [1, 2],
    narrate: 'The right child at index 2 holds 8. 8 > 9 is false, so the left child (9) is still the larger — child stays at 1.' });
  yield snap({ line: 6, tag: 'test', level: 2, compared: [0, 1],
    narrate: 'a[1] is 9 and a[root] = a[0] is 1. 9 > 1, so the root must sink.' });
  a[0] = 9; a[1] = 1;
  yield snap({ line: 7, tag: 'swap', level: 2, active: [0, 1],
    narrate: '9 rises to the root and 1 drops to index 1. But 1 is not finished falling — it now has children of its own.' });
  root = 1;
  yield snap({ line: 8, tag: 'assign', hot: 'root', level: 2, compared: [1],
    narrate: 'root follows the 1 down to index 1.' });
  yield snap({ line: 2, tag: 'test', level: 2, compared: [1],
    narrate: 'Index 1’s left child is at 1*2+1 = 3, and 3 <= 5 — 1 keeps going.' });
  child = 3;
  yield snap({ line: 3, tag: 'assign', hot: 'child', level: 2, compared: [3],
    narrate: 'child = 1*2+1 = 3 — index 1’s left child, holding 4.' });
  yield snap({ line: 4, tag: 'test', level: 2, compared: [3, 4],
    narrate: 'Index 3 holds 4, index 4 holds 6. 6 > 4, so the right child is larger.' });
  child = 4;
  yield snap({ line: 5, tag: 'assign', hot: 'child', level: 2, compared: [4],
    narrate: 'child moves to index 4, holding 6 — the larger child.' });
  yield snap({ line: 6, tag: 'test', level: 2, compared: [1, 4],
    narrate: 'a[4] is 6 and a[root] = a[1] is 1. 6 > 1, so 1 sinks again.' });
  a[1] = 6; a[4] = 1;
  yield snap({ line: 7, tag: 'swap', level: 2, active: [1, 4], note: SIFT_NOTE,
    narrate: '1 keeps sinking. It swaps with 6 and lands at index 4.' });
  root = 4;
  yield snap({ line: 8, tag: 'assign', hot: 'root', level: 2, compared: [4],
    narrate: 'root follows the 1 down to index 4.' });
  yield snap({ line: 2, tag: 'test', level: 2, compared: [4],
    narrate: 'Index 4’s left child would be at 4*2+1 = 9, past the end. Index 4 has no children, so 1 has landed and siftDown is finished.' });

  // back in heapify: start = -1
  root = null; child = null; end = null; start = -1;
  yield snap({ line: 16, tag: 'assign', hot: 'start', level: 1,
    narrate: 'Back in heapify. start = start - 1 = -1.' });

  // FINAL — the loop test fails, heapify returns, the heap is complete.
  yield snap({ line: 14, tag: 'test', level: 1, note: FINAL_NOTE,
    narrate: 'start is -1, so start >= 0 is false: heapify’s loop ends and it returns. Every parent is now greater than or equal to both of its children — the array is a valid max heap.' });
}

export default {
  title: 'Building a heap',
  subtitle: 'The same data as a tree and as an array',
  profile: 'standard',
  columns: 2,
  languages: ['pseudo', 'cpp', 'java'],

  // Five panels. The array (~6 cells) and the tree are BOTH structure panels and
  // both fit within a row, so the engine sits them SIDE BY SIDE in the structure
  // region — that correspondence is the point of the animation. The code panel
  // anchors the left column; the compact Variables strip and the Function calls
  // stack flow down beside/below. Everything resolves once on load and holds, so
  // nothing moves as steps advance (pac.verifyHeights()).
  panels: [
    { type: 'code',      id: 'code',  title: 'heapify',
      listings: LISTINGS, labels: { pseudo: 'pseudocode', cpp: 'C++', java: 'Java' } },
    { type: 'cells',     id: 'array', title: 'the array', structure: true },
    { type: 'nodes',     id: 'tree',  title: 'the same data as a tree', structure: true },
    { type: 'cells',     id: 'vars',  title: 'Variables', compact: true },
    { type: 'callstack', id: 'calls', title: 'Function calls' },
  ],

  initialTrace: 'run',
  traces: {
    run: trace,
  },
};
