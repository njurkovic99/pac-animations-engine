/* ds — A6 "Quicksort" (KEY)
 *
 * The COMPLETE sort, built in two grains. The FIRST partition of quicksort(0,12)
 * is shown in full detail (the mechanism — one index walking in from each end,
 * the crossing, the placing swap); the lecture calls partitioning "the most
 * complex part of quick sort," so it gets the room. The remaining SIX partitions
 * and the single-element base cases are SUMMARIZED — each partition a single move
 * — because they work identically and the detail teaches nothing new (the same
 * argument stacks-postfix-eval made for atomic push/pop after stacks-paren-scanner
 * showed their bodies). A recursion tree builds alongside, and the array fills in
 * with green until every value is in its final position.
 *
 * The array and every intermediate state are the lecture's worked example,
 * verified frame by frame:
 *
 *   a = [8,2,5,13,4,19,12,6,3,11,10,7,9]
 *   partition(0,12) -> 6 2 5 7 4 3 [8] 12 19 11 10 13 9        8  -> 6
 *   partition(0,5)  -> 4 2 5 3 [6] 7                           6  -> 4
 *   partition(0,3)  -> 3 2 [4] 5                               4  -> 2
 *   partition(0,1)  -> 2 [3]                                   3  -> 1
 *   partition(7,12) -> 10 9 11 [12] 13 19                      12 -> 10
 *   partition(7,9)  -> 9 [10] 11                               10 -> 8
 *   partition(11,12)-> [13] 19  (swaps a[11] with itself)      13 -> 11
 *   final: 2 3 4 5 6 7 8 9 10 11 12 13 19
 *
 * GREEN (role `sorted`, permanent) is taken in execution order, depth-first, left
 * before right: indices 6,4,2,1,0,3,5,10,8,7,9,11,12. Every cell ends green; a
 * cell never loses the role. Nothing here corrupts memory — no memory-danger
 * marker. WATCH only: one trace, no gates. Metrics hidden. */

/* One listing, three ds languages, line-aligned to a single 20-line grid, so
 * `line` is a plain number that resolves the same in every language. The recursive
 * quicksort wrapper sits above partition(); `if l < r` (line 2) is what stops the
 * recursion — a segment of one value or none needs no work. */
const LISTINGS = {
  pseudo: [
    'quicksort(a, l, r)',                            //  1
    '    if l < r',                                  //  2
    '        p = partition(a, l, r)',                //  3
    '        quicksort(a, l, p - 1)',                //  4
    '        quicksort(a, p + 1, r)',                //  5
    '',                                              //  6
    'partition(a, l, r)',                            //  7
    '    pivot = a[l]',                              //  8
    '    i = l + 1',                                 //  9
    '    j = r',                                     // 10
    '    while i <= j',                              // 11
    '        while i <= r and a[i] <= pivot:  i = i + 1', // 12
    '        while a[j] > pivot:  j = j - 1',        // 13
    '        if i < j',                              // 14
    '            swap a[i] and a[j]',                // 15
    '    swap a[l] and a[j]',                        // 16
    '    return j',                                  // 17
    '',                                              // 18
    'main()',                                        // 19
    '    quicksort(a, 0, 12)',                       // 20
  ],
  cpp: [
    'void quicksort(int a[], int l, int r) {',       //  1
    '    if (l < r) {',                              //  2
    '        int p = partition(a, l, r);',           //  3
    '        quicksort(a, l, p - 1);',               //  4
    '        quicksort(a, p + 1, r); } }',           //  5
    '',                                              //  6
    'int partition(int a[], int l, int r) {',        //  7
    '    int pivot = a[l];',                         //  8
    '    int i = l + 1;',                            //  9
    '    int j = r;',                                // 10
    '    while (i <= j) {',                          // 11
    '        while (i <= r && a[i] <= pivot)  i++;', // 12
    '        while (a[j] > pivot)  j--;',            // 13
    '        if (i < j)',                            // 14
    '            swap(a[i], a[j]); }',               // 15
    '    swap(a[l], a[j]);',                         // 16
    '    return j; }',                               // 17
    '',                                              // 18
    'int main() {',                                  // 19
    '    quicksort(a, 0, 12); }',                    // 20
  ],
  java: [
    'void quicksort(int[] a, int l, int r) {',       //  1
    '    if (l < r) {',                              //  2
    '        int p = partition(a, l, r);',           //  3
    '        quicksort(a, l, p - 1);',               //  4
    '        quicksort(a, p + 1, r); } }',           //  5
    '',                                              //  6
    'int partition(int[] a, int l, int r) {',        //  7
    '    int pivot = a[l];',                         //  8
    '    int i = l + 1;',                            //  9
    '    int j = r;',                                // 10
    '    while (i <= j) {',                          // 11
    '        while (i <= r && a[i] <= pivot)  i++;', // 12
    '        while (a[j] > pivot)  j--;',            // 13
    '        if (i < j)',                            // 14
    '            swap(a, i, j); }',                  // 15
    '    swap(a, l, j);',                            // 16
    '    return j; }',                               // 17
    '',                                              // 18
    'void main() {',                                 // 19
    '    quicksort(a, 0, 12); }',                    // 20
  ],
};

/* ---- teaching notes ---- */
const OPEN_NOTE =
  'Quicksort works by choosing one value as the PIVOT and rearranging the array so everything ≤ the pivot ' +
  'ends up to its left and everything > the pivot to its right. That rearranging is called partitioning, ' +
  'and it is the hard part of quicksort. After it, the pivot is in its final position for good — then ' +
  'quicksort repeats on each side.';

const WALK_NOTE =
  'i walks rightward looking for a value BIGGER than the pivot — one that is on the wrong side. j walks ' +
  'leftward looking for a value ≤ the pivot, also on the wrong side. When both have found one, they trade.';

const FIRST_SWAP_NOTE =
  'Neither value is in its final position — the array is not sorted. All the swap does is move each of ' +
  'them to the correct SIDE of the pivot.';

const CROSS_NOTE =
  'When j passes i, the partitioning is finished. Every value at or below index 6 is ≤ the pivot, and ' +
  'every value above it is > the pivot. The two indices met in the middle and the array is already ' +
  'divided — it just has the pivot sitting in the wrong place, at the far left.';

const PLACED_NOTE =
  '8 is now in its final position. Not its position for this pass — its position in the finished sorted ' +
  'array. Nothing will ever move it again, even though neither side is sorted yet. That is what ' +
  'partitioning buys: one value placed permanently, and two smaller problems left over.';

const SEAM_NOTE =
  'That is one partition. Quicksort now does the same thing to each side, and to each side of those, ' +
  'until every piece is a single value. The remaining partitions work exactly as this one did — from ' +
  'here each is shown as a single move, so you can watch the array fill in.';

const SINGLE_NOTE =
  'A single value is already in its final position, so quicksort stops here — l < r is false. The same ' +
  'test also catches EMPTY segments (l > r), like the right side of this call; they need no step at all.';

const FINAL_NOTE =
  'Each green cell was placed by one partition and never moved again. Count the levels in the tree: ' +
  'thirteen values, four levels. That is the log n in O(n log n) — each level does about n work, and ' +
  'there are only about log n levels because every partition roughly halves what is left. One warning, ' +
  'and it is the reason quicksort is not always the right choice. Try tracing an array that is ALREADY ' +
  'SORTED — 1 2 3 4 5 — with the first value as pivot. Where does the pivot end up? How big are the two ' +
  'sides? A tree with n levels instead of log n makes quicksort as slow as bubble sort.';

/* Simulate one partition on a copy of arr[l..r]; return the split index, the
 * resulting segment values, and the pivot value at its resting place. Pure — used
 * to precompute the recursion tree and each summarized partition's end state. */
function partitionPlan(arr, l, r) {
  const b = arr.slice();
  const pivot = b[l];
  let i = l + 1, j = r;
  while (i <= j) {
    while (i <= r && b[i] <= pivot) i += 1;
    while (b[j] > pivot) j -= 1;
    if (i < j) { const t = b[i]; b[i] = b[j]; b[j] = t; }
  }
  { const t = b[l]; b[l] = b[j]; b[j] = t; }
  return { p: j, seg: b.slice(l, r + 1), pivotVal: b[j] };
}

/* Build the whole recursion tree up front (all nodes laid out from step 0 as
 * `pending`, so nothing jumps). A node's LABEL is its range, not its values —
 * the values are already on screen in the array. Empty segments (l > r) get no
 * node; single elements are leaves. Children are pushed left-before-right so the
 * tree layout places lower ranges to the left. */
function buildTree(arr) {
  const nodes = [];
  const work = arr.slice();
  const rec = (l, r, parent) => {
    if (l > r) return;                                   // empty segment: no node, no step
    const id = `n${l}_${r}`;
    if (l === r) { nodes.push({ id, parent, l, r, leaf: true }); return; }
    const plan = partitionPlan(work, l, r);
    for (let k = l; k <= r; k++) work[k] = plan.seg[k - l];
    nodes.push({ id, parent, l, r, leaf: false, p: plan.p, pivotVal: plan.pivotVal });
    rec(l, plan.p - 1, id);
    rec(plan.p + 1, r, id);
  };
  rec(0, arr.length - 1, null);
  return nodes;
}

function* trace() {
  const a = [8, 2, 5, 13, 4, 19, 12, 6, 3, 11, 10, 7, 9];
  const R0 = a.length - 1;                               // 12
  const tree = buildTree(a);
  const state = new Map(tree.map(n => [n.id, 'pending'])); // pending | active | exited
  const sorted = new Set();                              // indices in final position (green)
  const id = (l, r) => `n${l}_${r}`;

  let i = null, j = null;         // partition indices (first partition only); null = marker/box absent
  let pivot = null;               // pivot value for the Variables strip (null = placeholder)
  let pivotCell = null;           // the persistent amber pivot cell (first partition only)
  let markL = null, markR = null; // l and r marker positions (the current segment bounds)
  let curNode = null;             // node id whose step is showing now (blue fill)
  let firstSummaryDone = false;   // say "i and j are no longer tracked" exactly once
  let singleNoteDone = false;     // the empty/single explanation, once

  const markers = () => {
    const m = [];
    if (markL != null) m.push({ label: 'l', index: markL });
    if (i != null)     m.push({ label: 'i', index: i });
    if (j != null)     m.push({ label: 'j', index: j });
    if (markR != null) m.push({ label: 'r', index: markR });
    return m;
  };

  /* The array: green (`sorted`, permanent) wins, then a cell acted on this step
   * (`active`, blue fill), then the amber `compared` outline — the scanned cell in
   * the first partition, or the whole segment being partitioned in the summary,
   * plus the persistent first-partition pivot cell. */
  const arrayPanel = (compared, active) => ({
    render: 'box',
    rowLabel: 'a',
    cells: a.map((v, idx) => {
      if (sorted.has(idx))      return { value: v, role: 'sorted' };
      if (active.includes(idx)) return { value: v, role: 'active' };
      if (compared.includes(idx)) return { value: v, role: 'compared' };
      if (idx === pivotCell)    return { value: v, role: 'compared' };
      return { value: v };
    }),
    markers: markers(),
  });

  /* The recursion tree. Node label is the range ([l..r], or [l] for a leaf); once
   * a partition's pivot is placed (green), the node shows p=<pivot>. `active` (blue
   * fill) marks the node whose step is current; `state` is the outline — pending
   * (dim), active (blue), exited (green). */
  const treePanel = () => ({
    layout: 'tree',
    nodes: tree.map(nd => ({
      id: nd.id, parent: nd.parent,
      label: nd.l === nd.r ? `[${nd.l}]` : `[${nd.l}..${nd.r}]`,
      meta: (!nd.leaf && sorted.has(nd.p)) ? [`p=${nd.pivotVal}`] : [],
      state: state.get(nd.id),
      active: nd.id === curNode,
    })),
  });

  /* The compact Variables strip: pivot, i, j. During the summarized phase i and j
   * are not tracked, so they show the placeholder; pivot shows the value being
   * placed while a segment is partitioned. */
  const varsPanel = hot => ({
    render: 'box',
    cells: [
      { label: 'pivot', value: pivot == null ? '' : pivot, role: pivot == null ? 'empty' : (hot === 'pivot' ? 'active' : undefined) },
      { label: 'i',     value: i == null ? '' : i,         role: i == null ? 'empty' : (hot === 'i' ? 'active' : undefined) },
      { label: 'j',     value: j == null ? '' : j,         role: j == null ? 'empty' : (hot === 'j' ? 'active' : undefined) },
    ],
  });

  const snap = ({ line, tag, narrate, note, compared = [], active = [], hot = null }) => ({
    line, tag, narrate, note,
    panels: { array: arrayPanel(compared, active), tree: treePanel(), vars: varsPanel(hot) },
  });

  /* ============ the FIRST partition, in full detail (lines 8..17) ============ */

  function* scanI() {
    while (i <= R0 && a[i] <= pivot) {
      yield snap({ line: 12, tag: 'compare', hot: 'i', compared: [i],
        narrate: `a[${i}] is ${a[i]}, which is ≤ the pivot ${pivot}, so i moves on.` });
      i += 1;
    }
    yield snap({ line: 12, tag: 'compare', hot: 'i', compared: [i],
      narrate: `a[${i}] is ${a[i]}, which is bigger than the pivot ${pivot}. i stops here — ${a[i]} is on the wrong side.` });
  }
  function* scanJ() {
    while (a[j] > pivot) {
      yield snap({ line: 13, tag: 'compare', hot: 'j', compared: [j],
        narrate: `a[${j}] is ${a[j]}, which is bigger than the pivot, so j moves on.` });
      j -= 1;
    }
    yield snap({ line: 13, tag: 'compare', hot: 'j', compared: [j],
      narrate: `a[${j}] is ${a[j]}, which is ≤ the pivot ${pivot}. j stops here.` });
  }
  function* whileTop() {
    yield snap({ line: 11, tag: 'test',
      narrate: `i is ${i}, j is ${j} — i is not past j, so there is still a stretch between them to scan.` });
  }
  function* swapIJ(narrate, note) {
    yield snap({ line: 14, tag: 'test', active: [i, j],
      narrate: `i is ${i}, j is ${j}. i is left of j, so their two values are on the wrong sides — swap them.` });
    const vi = a[i], vj = a[j];
    a[i] = vj; a[j] = vi;
    yield snap({ line: 15, tag: 'swap', narrate, note, active: [i, j] });
  }

  function* firstPartition() {
    curNode = id(0, R0); state.set(curNode, 'active');
    markL = 0; markR = R0;
    // SETUP (lines 8, 9, 10)
    pivot = a[0]; pivotCell = 0;
    yield snap({ line: 8, tag: 'assign', hot: 'pivot', narrate: 'The simplest pivot is the first value: 8.' });
    i = 1;
    yield snap({ line: 9, tag: 'assign', hot: 'i', narrate: 'i starts just to the right of the pivot, at index 1.' });
    j = R0;
    yield snap({ line: 10, tag: 'assign', hot: 'j', note: WALK_NOTE, narrate: 'j starts at the far right, index 12.' });
    // ITERATION 1 (i:1->3, j:12->11, swap)
    yield* whileTop(); yield* scanI(); yield* scanJ();
    yield* swapIJ('13 and 7 trade places. Both are now on the side they belong on.', FIRST_SWAP_NOTE);
    // ITERATION 2 (i:3->5, j:11->8, swap)
    yield* whileTop(); yield* scanI(); yield* scanJ();
    yield* swapIJ('19 and 3 trade places.');
    // ITERATION 3 (i:5->6, j:8->7, swap)
    yield* whileTop(); yield* scanI(); yield* scanJ();
    yield* swapIJ('12 and 6 trade places.');
    // ITERATION 4 — the crossing, no swap
    yield* whileTop(); yield* scanI(); yield* scanJ();
    yield snap({ line: 14, tag: 'test', note: CROSS_NOTE,
      narrate: 'i is 7 and j is 6 — j has passed i. There is nothing left between them, so there is nothing to swap.' });
    // loop exit
    yield snap({ line: 11, tag: 'test', narrate: '7 ≤ 6 is false, so the scanning is over.' });
    // final swap (line 16): pivot -> index 6, GREEN
    { const vl = a[0], vj = a[j]; a[0] = vj; a[j] = vl; }
    pivotCell = null; sorted.add(6); i = null; j = null; pivot = 8;
    yield snap({ line: 16, tag: 'swap', note: PLACED_NOTE, active: [0],
      narrate: 'The pivot trades places with a[j]. 8 is now green — this is its final position in the sorted array, and nothing will move it again.' });
    // return (line 17): the seam
    markL = null; markR = null; pivot = null;
    yield snap({ line: 17, tag: 'return', note: SEAM_NOTE,
      narrate: 'partition returns 6 — the index where the pivot ended up.' });
    state.set(curNode, 'exited'); curNode = null;
  }

  /* ============ a SUMMARIZED partition — 3 steps (line 3) ============ */
  function* summarizedPartition(l, r, ctx) {
    const nid = id(l, r);
    const plan = partitionPlan(a, l, r);
    curNode = nid; state.set(nid, 'active');
    markL = l; markR = r; i = null; j = null; pivot = a[l];
    const seg = []; for (let k = l; k <= r; k++) seg.push(k);
    const where = ctx ? ` — everything ${ctx.side} of the ${ctx.pivotVal}` : '';
    const note = firstSummaryDone ? undefined
      : 'From here i and j are not tracked — they show as dashes. Watch the pivot of each segment turn green.';
    firstSummaryDone = true;
    // 1. the call — the segment is highlighted so it is clear WHICH part is worked on
    yield snap({ line: 3, tag: 'call', compared: seg, note,
      narrate: `quicksort now partitions indices ${l} to ${r}${where}.` });
    // 2. the segment rearranges in one move; the pivot cell takes the blue fill.
    // Some partitions move nothing — the pivot is already in place and every value
    // is already on the correct side (partition(11,12) swaps a[11] with itself).
    const before = a.slice(l, r + 1);
    const moved = before.some((v, k) => v !== plan.seg[k]);
    for (let k = l; k <= r; k++) a[k] = plan.seg[k - l];
    pivot = plan.pivotVal;
    yield snap({ line: 3, tag: 'partition', compared: seg.filter(k => k !== plan.p), active: [plan.p],
      narrate: moved
        ? `The pivot is ${plan.pivotVal}. It moves to index ${plan.p} — everything smaller ends to its left, everything larger to its right.`
        : `The pivot is ${plan.pivotVal}, already in place: everything here is on the correct side of it, so no value moves. It still takes its final position.` });
    // 3. the pivot is placed for good — green
    sorted.add(plan.p);
    const done = sorted.size === a.length;
    yield snap({ line: 3, tag: 'sorted',
      narrate: done ? 'Every value is in its final position. The array is sorted.' : `${plan.pivotVal} is in its final position.`,
      note: done ? FINAL_NOTE : undefined });
    state.set(nid, 'exited'); curNode = null; pivot = null;
    return plan.p;
  }

  /* ============ a SINGLE-element segment — 1 step (line 2, `if l < r` false) === */
  function* single(idx) {
    const nid = id(idx, idx);
    state.set(nid, 'exited'); curNode = nid;         // a single value is drawn already-settled
    markL = idx; markR = idx; i = null; j = null; pivot = null;
    sorted.add(idx);
    const done = sorted.size === a.length;
    const note = done ? FINAL_NOTE : (singleNoteDone ? undefined : SINGLE_NOTE);
    singleNoteDone = true;
    yield snap({ line: 2, tag: 'base',
      narrate: done
        ? 'Every value is in its final position. The array is sorted.'
        : `quicksort(a, ${idx}, ${idx}) — one value, so l < r is false and there is nothing to do. It is already in its final position.`,
      note });
    curNode = null;
  }

  /* ============ the recursion ============ */
  function* qsort(l, r, ctx, detailed) {
    if (l > r) return;                                // empty segment: caught by if l < r, no step
    if (l === r) { yield* single(l); return; }
    const p = detailed ? (yield* firstPartitionAndReturn()) : (yield* summarizedPartition(l, r, ctx));
    yield* qsort(l, p - 1, { pivotVal: a[p], side: 'left' }, false);
    yield* qsort(p + 1, r, { pivotVal: a[p], side: 'right' }, false);
  }
  // the first partition returns its split index (6) for the recursion
  function* firstPartitionAndReturn() { yield* firstPartition(); return 6; }

  /* ---------- STEP 0 — nothing has executed ---------- */
  curNode = id(0, R0); state.set(curNode, 'active'); markL = 0; markR = R0;
  yield snap({ line: null, tag: 'init', note: OPEN_NOTE,
    narrate: 'Thirteen values, unsorted. l and r mark the part of the array we are working on — here, all of it.' });

  yield* qsort(0, R0, null, true);
}

export default {
  title: 'Quicksort: sorting by repeated partitioning',
  subtitle: 'One partition in full, then the same move all the way down',
  profile: 'standard',
  columns: 2,
  languages: ['pseudo', 'cpp', 'java'],

  // Four panels. The array and the recursion tree are BOTH structure panels; the
  // array alone is ~1030px, so they cannot share a row — the engine stacks them
  // vertically (each on its own row, neither scrolling horizontally). The code and
  // the compact Variables strip share the row above. Everything resolves once on
  // load and holds, so nothing moves as steps advance (pac.verifyHeights()).
  panels: [
    { type: 'code',  id: 'code',  title: 'quicksort',
      listings: LISTINGS, labels: { pseudo: 'pseudocode', cpp: 'C++', java: 'Java' } },
    { type: 'cells', id: 'array', title: 'the array', structure: true },
    { type: 'nodes', id: 'tree',  title: 'Which segment is being sorted', structure: true },
    { type: 'cells', id: 'vars',  title: 'Variables', compact: true },
  ],

  initialTrace: 'run',
  traces: {
    run: trace,
  },
};
