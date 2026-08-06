/* ds — A6 "Quicksort" companion to sorting-quicksort-partition
 *
 * The SAME partition code, on data that is already sorted. Where
 * sorting-quicksort-partition showed the mechanism doing useful work, this shows
 * the mechanism doing the MOST work for the LEAST result — the O(n^2) worst case
 * the lecture warns about: "we chose '1' as pivot, and where does it end up —
 * exactly where it was originally, at the first position… there is no
 * partitioning to speak of… it turns into an O(n^2) sort, just like a bubble
 * sort."
 *
 * The payoff is a SHAPE, not a number. sorting-quicksort-partition built a
 * balanced four-level tree over thirteen values; this builds a straight line of
 * seven levels over seven values. The two trees side by side are the lesson.
 *
 * The array NEVER changes — it is [1,2,3,4,5,6,7] at every step. Green (role
 * `sorted`, permanent) fills strictly LEFT TO RIGHT, one cell per partition:
 * 0,1,2,3,4,5,6. Every partition peels off a single value (its pivot, already in
 * place) and hands the entire rest of the array to the next call.
 *
 * The FIRST partition is shown in full, verified against the trace:
 *
 *   a = [1,2,3,4,5,6,7],  l = 0, r = 6
 *   partition(0,6): pivot = a[0] = 1, i = 1, j = 6
 *     i-scan: a[1]=2 is NOT <= 1, i stops at once (index 1). ONE comparison.
 *     j-scan: 7>1 j=5; 6>1 j=4; 5>1 j=3; 4>1 j=2; 3>1 j=1; 2>1 j=0;
 *             a[0]=1 is NOT > 1, j stops at 0. SIX moves.
 *     i < j: 1 < 0 is FALSE — no swap.  while i <= j: 1 <= 0 FALSE — loop exits.
 *     swap a[0] with a[0] — the pivot swaps with ITSELF, nothing moves. return 0.
 *     Left = 0..-1 (EMPTY). Right = 1..6 (six values).
 *   Every later call repeats this: partition(1,6) pivot 2 stays at [1], empty
 *   left; partition(2,6)…partition(5,6) the same; then quicksort(a,6,6) is a
 *   single element, placed with no partition.
 *
 * Code listing: IDENTICAL to sorting-quicksort-partition — the partition routine
 * character for character; only the driver's bounds and the data differ. Said in
 * a note. Nothing here corrupts memory — no memory-danger marker. WATCH only:
 * one trace, no gates. Metrics hidden. The final note links forward to
 * sorting-heapify — a sort that cannot degenerate like this. */

/* One listing, three ds languages, line-aligned to a single 20-line grid, so
 * `line` is a plain number that resolves the same in every language. This is the
 * SAME code as sorting-quicksort-partition; only the main() driver names the
 * seven-element array's bounds (0..6 instead of 0..12). */
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
    '    quicksort(a, 0, 6)',                        // 20
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
    '    quicksort(a, 0, 6); }',                     // 20
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
    '    quicksort(a, 0, 6); }',                     // 20
  ],
};

/* ---- teaching notes ---- */
const OPEN_NOTE =
  'This is the same code you just watched partition a scrambled array. The only thing different is the ' +
  'data: seven values that are already in order. Quicksort does not know that. Watch how much work it ' +
  'does — and how much it accomplishes.';

const IDENTICAL_NOTE =
  'The partition routine here is character-for-character identical to sorting-quicksort-partition — the ' +
  'same pivot choice, the same two scans, the same swaps. Nothing about the algorithm changed. Only the ' +
  'data did, and that is enough to change everything.';

const WALK_NOTE =
  'j is checking every single value, and every one of them is bigger than the pivot. It will not stop ' +
  'until it reaches the pivot itself — at the very far end of the array.';

const PLACED_NOTE =
  '1 is now in its final position: index 0, exactly where it started. Because the pivot was the smallest ' +
  'value, everything else is larger — so the left side is EMPTY and the right side is all six remaining ' +
  'values. A good partition splits the work roughly in half; this one shaved off exactly one value and ' +
  'handed the rest, whole, to the next call.';

const SEAM_NOTE =
  'That is one partition. It placed one value and left the other six untouched, as a single block. ' +
  'Quicksort now runs on that block, and the same thing happens again — and again. From here each ' +
  'partition is shown as a single move, but each one still walks j all the way down, exactly as you just ' +
  'watched. Watch the green creep one cell to the right, and the tree grow one more level down.';

const FINAL_NOTE =
  'Now look at the tree: seven values, seven levels — a straight line, not a bush. In ' +
  'sorting-quicksort-partition, thirteen values made a balanced tree only four levels deep; here every ' +
  'partition peeled off a single value and passed the entire rest along, so the calls stack up n deep ' +
  'instead of about log n. n levels, each doing about n work, is O(n²) — no faster than the bubble sort ' +
  'quicksort is supposed to beat. And the input that caused it was the one you might have called easiest: ' +
  'an array already in order, with the first value always chosen as pivot.';

/* The final note carries the forward link to sorting-heapify (a sort whose worst
 * case is still O(n log n) — it cannot degenerate like this). The link-in-note
 * mechanism is the same one sorting-heapify / sorting-heapsort-dual already use. */
const FINAL_NOTE_LINKED = [FINAL_NOTE, ' ', { href: 'sorting-heapify.html', text: 'See a sort that cannot degenerate like this' }];

/* Simulate one partition on a copy of arr[l..r]; return the split index, the
 * resulting segment values, and the pivot value at its resting place. Pure — used
 * to precompute the recursion tree and each summarized partition's end state.
 * IDENTICAL to sorting-quicksort-partition; on already-sorted data it returns
 * p == l and an unchanged segment every time. */
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
 * `pending`, so nothing jumps). On already-sorted data the left side of every
 * partition is empty (l > r, no node), so each node has exactly ONE child — the
 * tree degenerates into a single descending chain, seven nodes for seven values.
 * A node's LABEL is its range; the values are already on screen in the array. */
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
  const a = [1, 2, 3, 4, 5, 6, 7];
  const R0 = a.length - 1;                               // 6
  const tree = buildTree(a);
  const state = new Map(tree.map(n => [n.id, 'pending'])); // pending | active | exited
  const sorted = new Set();                              // indices in final position (green)
  const id = (l, r) => `n${l}_${r}`;

  let i = null, j = null;         // partition indices (first partition only); null = marker/box absent
  let pivot = null;               // pivot value for the Variables strip (null = placeholder)
  let pivotCell = null;           // the persistent amber pivot cell (first partition only)
  let markL = null, markR = null; // l and r marker positions (the current segment bounds)
  let curNode = null;             // node id whose step is showing now (blue fill)
  let firstSummaryDone = false;   // say "each partition is one move" exactly once

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
   * plus the persistent first-partition pivot cell. The values never change. */
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

  /* The recursion tree — a single descending chain. Node label is the range
   * ([l..r], or [l] for the leaf); once a partition's pivot is placed (green), the
   * node shows p=<pivot>. `active` (blue fill) marks the node whose step is
   * current; `state` is the outline — pending (dim), active (blue), exited
   * (green). */
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

  /* ============ the FIRST partition, in full detail (lines 8..17) ============
   * On already-sorted data the outer while runs exactly ONCE: i stops at the first
   * comparison, j trudges the whole way down to the pivot, they cross without ever
   * swapping, and the pivot swaps with itself. */
  function* firstPartition() {
    curNode = id(0, R0); state.set(curNode, 'active');
    markL = 0; markR = R0;
    // SETUP (lines 8, 9, 10)
    pivot = a[0]; pivotCell = 0;
    yield snap({ line: 8, tag: 'assign', hot: 'pivot', note: IDENTICAL_NOTE,
      narrate: 'The pivot is the first value: 1. It is also the smallest value in the array, which is the whole problem.' });
    i = 1;
    yield snap({ line: 9, tag: 'assign', hot: 'i', narrate: 'i starts just to the right of the pivot, at index 1.' });
    j = R0;
    yield snap({ line: 10, tag: 'assign', hot: 'j', narrate: 'j starts at the far right, index 6.' });
    // the single outer iteration
    yield snap({ line: 11, tag: 'test',
      narrate: 'i is 1, j is 6 — i is not past j, so there is a stretch between them to scan.' });
    // i-scan: ONE comparison, i stops at once
    yield snap({ line: 12, tag: 'compare', hot: 'i', compared: [i],
      narrate: 'a[1] is 2, which is bigger than the pivot. i stops at once — there is nothing to its left that belongs on the other side.' });
    // j-scan: six moves down the whole array, then the pivot stops it
    let moveNo = 0;
    while (a[j] > pivot) {
      moveNo += 1;
      yield snap({ line: 13, tag: 'compare', hot: 'j', compared: [j],
        note: moveNo === 3 ? WALK_NOTE : undefined,
        narrate: `${a[j]} is bigger, j moves on.` });
      j -= 1;
    }
    yield snap({ line: 13, tag: 'compare', hot: 'j', compared: [j],
      narrate: 'a[0] is 1 — the pivot itself, which is not bigger than the pivot. j finally stops, at index 0.' });
    // if i < j — FALSE, no swap. Neither cell is acted on: no blue fill.
    yield snap({ line: 14, tag: 'test',
      narrate: 'i is 1 and j is 0. i is not left of j — they crossed before they ever met a value worth swapping, so nothing is swapped.' });
    // loop exit (line 11 re-test)
    yield snap({ line: 11, tag: 'test',
      narrate: '1 ≤ 0 is false, so the loop is over. Not one value was swapped.' });
    // final swap (line 16): pivot -> index 0, GREEN. It swaps with itself.
    { const vl = a[0], vj = a[j]; a[0] = vj; a[j] = vl; }   // a[0] <-> a[0]: nothing moves
    pivotCell = null; sorted.add(0); i = null; j = null; pivot = 1;
    yield snap({ line: 16, tag: 'swap', note: PLACED_NOTE, active: [0],
      narrate: 'The pivot swaps with a[0] — with itself. Nothing moves. 1 is now green: its final position is index 0, exactly where it began.' });
    // return (line 17): the seam
    markL = null; markR = null; pivot = null;
    yield snap({ line: 17, tag: 'return', note: SEAM_NOTE,
      narrate: 'partition returns 0 — the index where the pivot ended up. The left side is empty; the right side is everything else.' });
    state.set(curNode, 'exited'); curNode = null;
  }

  /* ============ a SUMMARIZED partition — 3 steps (line 3) ============
   * Same three-step shape as sorting-quicksort-partition. On sorted data the pivot
   * is already in place every time: nothing moves, but j still had to walk the
   * whole segment to prove it. */
  function* summarizedPartition(l, r, ctx) {
    const nid = id(l, r);
    const plan = partitionPlan(a, l, r);
    curNode = nid; state.set(nid, 'active');
    markL = l; markR = r; i = null; j = null; pivot = a[l];
    const seg = []; for (let k = l; k <= r; k++) seg.push(k);
    const where = ctx ? ` — everything to the right of the ${ctx.pivotVal}` : '';
    const note = firstSummaryDone ? undefined
      : 'From here each partition is shown as a single move — but each one still walks j all the way down, ' +
        'exactly as you just watched. i and j are no longer tracked; they show as dashes. Watch the pivot ' +
        'of each segment turn green, one cell to the right, and the tree grow one more level down.';
    firstSummaryDone = true;
    // 1. the call — the segment is highlighted so it is clear WHICH part is worked on
    yield snap({ line: 3, tag: 'call', compared: seg, note,
      narrate: `quicksort now partitions indices ${l} to ${r}${where}.` });
    // 2. the segment does not rearrange — the pivot is already in place. The pivot
    // cell takes the blue fill; every other value stays put.
    const before = a.slice(l, r + 1);
    const moved = before.some((v, k) => v !== plan.seg[k]);
    for (let k = l; k <= r; k++) a[k] = plan.seg[k - l];
    pivot = plan.pivotVal;
    yield snap({ line: 3, tag: 'partition', compared: seg.filter(k => k !== plan.p), active: [plan.p],
      narrate: moved
        ? `The pivot is ${plan.pivotVal}. It moves to index ${plan.p} — everything smaller ends to its left, everything larger to its right.`
        : `The pivot is ${plan.pivotVal}. Every value to its right is larger, so it stays at index ${plan.p} — but j still had to walk the whole way down to prove it. Nothing moves.` });
    // 3. the pivot is placed for good — green
    sorted.add(plan.p);
    const done = sorted.size === a.length;
    yield snap({ line: 3, tag: 'sorted',
      narrate: done ? 'Every value is in its final position. The array is sorted.' : `${plan.pivotVal} is in its final position.`,
      note: done ? FINAL_NOTE_LINKED : undefined });
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
    yield snap({ line: 2, tag: 'base',
      narrate: done
        ? 'Every value is in its final position. The array is sorted.'
        : `quicksort(a, ${idx}, ${idx}) — one value, so l < r is false and there is nothing to do. It is already in its final position.`,
      note: done ? FINAL_NOTE_LINKED : undefined });
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
  // the first partition returns its split index (0) for the recursion
  function* firstPartitionAndReturn() { yield* firstPartition(); return 0; }

  /* ---------- STEP 0 — nothing has executed ---------- */
  curNode = id(0, R0); state.set(curNode, 'active'); markL = 0; markR = R0;
  yield snap({ line: null, tag: 'init', note: OPEN_NOTE,
    narrate: 'Seven values, already in order. l and r mark the part of the array we are working on — here, all of it. Quicksort does not know it is already sorted.' });

  yield* qsort(0, R0, null, true);
}

export default {
  title: 'When quicksort goes wrong',
  subtitle: 'The same code, on data that is already sorted',
  profile: 'standard',
  columns: 2,
  languages: ['pseudo', 'cpp', 'java'],

  // Four panels, the same four as sorting-quicksort-partition. The array is the
  // widest structure; the recursion tree is TALL and NARROW (a degenerate chain),
  // so it packs beside the code while the array keeps its own row. Everything
  // resolves once on load and holds, so nothing moves as steps advance
  // (pac.verifyHeights()).
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
