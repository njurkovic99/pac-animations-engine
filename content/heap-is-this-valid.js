/* ds — "Is this a valid binary max heap?" (row 10 of the ds slate).
 *
 * NOT an algorithm trace. A DIAGNOSIS, run five times: five candidate
 * structures, examined one at a time, each asked the same question — is it a
 * valid binary max heap? It is the PREREQUISITE for `sorting-heapify`: a student
 * who cannot tell a valid heap from an invalid one gets little from watching one
 * being built. The final payoff note links forward to it.
 *
 * WATCH-only, confusion-first (AUTHORING.md Part 6). The slate once listed this
 * as `predict`, written under the deferred THINK plan; there are no gates here.
 * Where a misconception lives (the root-is-largest trap in C, the shape-vs-tree
 * surprise in B, the sibling instinct in E) it is NAMED in a note, shown to fail
 * or hold in the trace, and resolved in a payoff note.
 *
 * THE DUAL VIEW DOES A DIFFERENT JOB HERE than in `sorting-heapify`. There the
 * tree and array were shown to be the same data. Here the array REVEALS WHAT THE
 * TREE CONCEALS: a drawing can look like a reasonable tree and still not be a
 * heap, because the heap's shape rule is about the array. Both panels stay on
 * screen for every example, and the array settles the question the tree cannot —
 * most sharply in example B, where the tree looks fine and the array shows a hole.
 *
 * THE TWO RULES (the lecture's own words):
 *   1. SHAPE — no gaps in the array. Every position 0..size-1 holds a value.
 *   2. ORDER — every parent >= both of its children. Corollary the lecture states
 *      and students forget: THERE IS NO REQUIRED RELATIONSHIP BETWEEN SIBLINGS.
 *
 * THE FIVE EXAMPLES, presented A, C, B, D, E (reference, obvious violation,
 * surprising violation, violation-at-the-root, and the valid-but-looks-wrong
 * payoff). Arrays and trees verified against the slate:
 *   A  [9,6,8,4,3,0,2]      size 7  VALID    (the reference)
 *   C  [9,6,2,4,3,8,0]      size 7  INVALID  order: a[5]=8 > a[2]=2
 *   B  [9,6,8,4,3,0,2,_,1]  size 9  INVALID  shape: index 7 empty, index 8 filled
 *   D  [7,9,8,4,3,2,1]      size 7  INVALID  order: root 7 < left child 9
 *   E  [9,3,8,1,2]          size 5  VALID    (siblings out of order, and it does not matter)
 *
 * NO GREEN FILL ANYWHERE. Green (`sorted`) means "in its final sorted position",
 * which belongs to the heapsort animations; nothing here is being sorted. Nothing
 * corrupts memory, so no memory-danger marker. NO NEW ENGINE CAPABILITY: this
 * reuses `sorting-heapify`'s dual tree+array view, node layout, and 2i+1 / 2i+2
 * index formulas unchanged.
 *
 * FIXED SIZING (the master invariant), the two places it bites here:
 *   - THE ARRAY is NINE cells wide from step 0 and never resizes. Example B needs
 *     nine; the others leave the surplus cells `empty` (the dashed X). Nothing
 *     grows or shrinks as one example gives way to the next.
 *   - THE TREE lays out for the largest footprint and holds it. All nine node
 *     positions (indices 0..8) are present on EVERY step with a fixed parent
 *     structure, so the engine's tree layout resolves once and never moves.
 *     Positions the current example does not use render as faint `pending` ghosts
 *     (opacity .18) with no connecting edge — "unused node positions left blank".
 *     Example B's gap is what makes this matter: node 8 (value 1) hangs in the
 *     RIGHT-child slot of node 3 while the LEFT slot (index 7, the gap) is an empty
 *     ghost — the tree still "looks almost reasonable", and only the array exposes
 *     the hole.
 *
 * FOUR panels (profile 'standard'): the array and the tree share one row as two
 * structure panels (side by side, as in heapify); a compact Variables strip
 * [i][left][right][verdict] carries the running answer; and the code panel. There
 * is deliberately NO CALLSTACK panel — the call structure is trivial (main calls
 * isValidHeap five times) — but the main() call line is still shown DIMMED
 * (parked) while control is inside the function, so the return context is visible.
 *
 * TWO PASSES, deliberately (see the listing): shape first, then order. They are
 * independent — a structure can satisfy one and fail the other, which is exactly
 * example B. The checks are STEPPED THROUGH, not summarized, wherever a violation
 * is found (C's order pass, B's shape pass, D's root), because the point is WHERE
 * it is found and that the function returns immediately afterwards. A pass that
 * trivially succeeds with no gap (the shape pass in C/D/E) is shown as one brief
 * loop step; example A's shape pass is stepped per cell because A is the reference. */

/* One listing, three ds languages, line-aligned to a single 19-line grid so
 * `line` is a plain number that resolves the same in every language (as in
 * `sorting-heapify`). The `empty(a, i)` check is the lecture's "gap at index i":
 * a heap array has a logical size, and a position below it can hold no value. */
const LISTINGS = {
  pseudo: [
    'isValidHeap(a, size)',                                //  1
    '    for i = 0 to size - 1',                           //  2
    '        if a[i] is empty',                            //  3
    '            return "gap at index i"',                 //  4
    '    for i = 0 to size - 1',                           //  5
    '        left = i * 2 + 1',                            //  6
    '        if left <= size - 1 and a[left] > a[i]',      //  7
    '            return "parent < left child"',            //  8
    '        right = i * 2 + 2',                           //  9
    '        if right <= size - 1 and a[right] > a[i]',    // 10
    '            return "parent < right child"',           // 11
    '    return "valid"',                                  // 12
    '',                                                    // 13
    'main()',                                              // 14
    '    isValidHeap(A, 7)',                               // 15
    '    isValidHeap(C, 7)',                               // 16
    '    isValidHeap(B, 9)',                               // 17
    '    isValidHeap(D, 7)',                               // 18
    '    isValidHeap(E, 5)',                               // 19
  ],
  cpp: [
    'string isValidHeap(int a[], int size) {',             //  1
    '    for (int i = 0; i <= size - 1; i++)',             //  2
    '        if (empty(a, i))',                            //  3
    '            return "gap at index i";',                //  4
    '    for (int i = 0; i <= size - 1; i++) {',           //  5
    '        int left = i * 2 + 1;',                       //  6
    '        if (left <= size - 1 && a[left] > a[i])',     //  7
    '            return "parent < left child";',           //  8
    '        int right = i * 2 + 2;',                       //  9
    '        if (right <= size - 1 && a[right] > a[i])',   // 10
    '            return "parent < right child"; }',        // 11
    '    return "valid"; }',                               // 12
    '',                                                    // 13
    'int main() {',                                        // 14
    '    isValidHeap(A, 7);',                              // 15
    '    isValidHeap(C, 7);',                              // 16
    '    isValidHeap(B, 9);',                              // 17
    '    isValidHeap(D, 7);',                              // 18
    '    isValidHeap(E, 5); }',                            // 19
  ],
  java: [
    'String isValidHeap(int[] a, int size) {',             //  1
    '    for (int i = 0; i <= size - 1; i++)',             //  2
    '        if (empty(a, i))',                            //  3
    '            return "gap at index i";',                //  4
    '    for (int i = 0; i <= size - 1; i++) {',           //  5
    '        int left = i * 2 + 1;',                       //  6
    '        if (left <= size - 1 && a[left] > a[i])',     //  7
    '            return "parent < left child";',           //  8
    '        int right = i * 2 + 2;',                       //  9
    '        if (right <= size - 1 && a[right] > a[i])',   // 10
    '            return "parent < right child"; }',        // 11
    '    return "valid"; }',                               // 12
    '',                                                    // 13
    'void main() {',                                       // 14
    '    isValidHeap(A, 7);',                              // 15
    '    isValidHeap(C, 7);',                              // 16
    '    isValidHeap(B, 9);',                              // 17
    '    isValidHeap(D, 7);',                              // 18
    '    isValidHeap(E, 5); }',                            // 19
  ],
};

/* ---- teaching notes ---- */
const OPEN_NOTE =
  'A binary max heap has to satisfy TWO rules. RULE 1, SHAPE: the array has no gaps — every position from 0 up to ' +
  'the last one holds a value, and the tree fills in left to right, top to bottom, with no holes. RULE 2, ORDER: ' +
  'every parent is greater than or equal to BOTH of its children. That is all. In particular, nothing is required ' +
  'of siblings: a left child may be smaller or larger than its right sibling and the heap is still valid. Keep that ' +
  'in mind — it catches people.';

const A_LEAF_NOTE =
  "Index 3's left child would be at 3*2+1 = 7, and 7 <= 6 is false — past the end. A node with no children cannot " +
  'violate anything, so indices 3, 4, 5, 6 are leaves and are skipped. (After this it happens without comment.)';

const A_FINAL_NOTE =
  'Every parent beat both of its children, and there were no gaps. Note what was NOT checked: 6 against 8, or ' +
  '4 against 3. Siblings are never compared.';

const C_VIOLATION_NOTE =
  'Notice that the ROOT still holds 9 — the largest value in the whole array. Students check the top, see the ' +
  "biggest number, and conclude the heap is fine. The rule is not 'the largest value is at the root' — it is that " +
  'EVERY parent beats its children, all the way down. The root being right is a consequence, not the test.';

const B_ENTER_NOTE =
  'Look at the tree and it seems almost fine — every parent still beats its children, so the ORDER rule is ' +
  'satisfied everywhere. If the tree were the whole story, this would pass.';

const B_GAP_NOTE =
  'This is what the array shows and the drawing hides. A heap is not any tree — it is a COMPLETE tree, filled left ' +
  'to right with no gaps, and that is what makes the index formulas work. If position 7 is empty, then 2i+1 and ' +
  '2i+2 no longer land where they should for everything after it, and the whole array-as-a-tree scheme breaks ' +
  'down. The order rule was satisfied, and it still is not a heap.';

const D_NOTE =
  'Everything below the root is a perfectly good heap. Only the top is wrong — and it is wrong against BOTH ' +
  'children (7 is smaller than 9 and smaller than 8). A violation can be anywhere, so the check has to visit every ' +
  'parent, not just the ones near the leaves.';

const E_ENTER_NOTE =
  'This is the one that trips people. The left child (3) is much smaller than the right child (8) — the tree looks ' +
  'lopsided and wrong. Watch what the check actually does about it.';

const E_PAYOFF_NOTE =
  'Valid. 3 sits to the left of 8 and that breaks nothing, because a heap makes exactly one promise: a parent is ' +
  'at least as large as its children. It says nothing about left versus right, and nothing about which of two ' +
  'cousins is bigger. That is precisely why a heap is cheaper to maintain than a sorted array — it is a far weaker ' +
  'condition, and weaker conditions cost less to restore. A heap is not "nearly sorted": it is sorted along every ' +
  'path from the root down, and unordered across.';

/* The nine tree-node positions — a complete binary tree over indices 0..8. Node
 * i's children are 2i+1 and 2i+2, so this is the LARGEST footprint any example
 * reaches (example B's index 8 sits at depth 3, under node 3). All nine are
 * present on every step with this fixed parent structure, so the layout resolves
 * once and never moves; a position the current example does not fill renders as a
 * faint `pending` ghost with no edge. */
const NODES = [
  { id: 'n0', parent: null, idx: 0 },
  { id: 'n1', parent: 'n0', idx: 1 },
  { id: 'n2', parent: 'n0', idx: 2 },
  { id: 'n3', parent: 'n1', idx: 3 },
  { id: 'n4', parent: 'n1', idx: 4 },
  { id: 'n5', parent: 'n2', idx: 5 },
  { id: 'n6', parent: 'n2', idx: 6 },
  { id: 'n7', parent: 'n3', idx: 7 },
  { id: 'n8', parent: 'n3', idx: 8 },
];
const IDX_OF = Object.fromEntries(NODES.map(n => [n.id, n.idx]));

/* The five candidates, as 9-slot arrays (null = no value at that position). The
 * gap in B is a null at index 7 WITH a value at index 8 — a hole in the middle. */
const EX = {
  A: { arr: [9, 6, 8, 4, 3, 0, 2, null, null], size: 7, call: 15 },
  C: { arr: [9, 6, 2, 4, 3, 8, 0, null, null], size: 7, call: 16 },
  B: { arr: [9, 6, 8, 4, 3, 0, 2, null, 1],    size: 9, call: 17 },
  D: { arr: [7, 9, 8, 4, 3, 2, 1, null, null], size: 7, call: 18 },
  E: { arr: [9, 3, 8, 1, 2, null, null, null, null], size: 5, call: 19 },
};

function* trace() {
  let cur = [], size = 0, callLine = 15;    // the current candidate
  let i = null, left = null, right = null;  // isValidHeap's loop vars / child indices
  let verdict = '?', verdictRole;           // the running answer + its cell colour

  const load = ex => {
    cur = ex.arr.slice(); size = ex.size; callLine = ex.call;
    i = null; left = null; right = null; verdict = '?'; verdictRole = undefined;
  };

  /* The array — nine fixed cells. A cell with a value is a member; a cell the
   * current example does not fill (index >= size, or the gap at 7 in B) is
   * `empty` (dashed X). `active` (blue fill) wins over `compared` (amber outline)
   * wins over `empty`, so the gap cell can be highlighted blue on the step the
   * shape check lands on it. The `i` marker is the only index pointer. */
  const arrayPanel = (compared, active) => ({
    render: 'box',
    rowLabel: 'a',
    cells: cur.map((v, idx) => {
      const present = v != null;
      let role;
      if (active.includes(idx)) role = 'active';
      else if (compared.includes(idx)) role = 'compared';
      else if (!present) role = 'empty';
      return { value: present ? v : '', role };
    }),
    markers: i == null ? [] : [{ label: 'i', index: i }],
  });

  /* The tree — the SAME data, all nine positions always present so the layout is
   * fixed. A filled position is a neutral `idle` node (value label + `[idx]`
   * meta), amber `unlinked` when examined this step, blue `active` when it is one
   * of the two cells a violation is read from. An unfilled position is a faint
   * `pending` ghost (empty label, no meta) with no connecting edge. */
  const treePanel = (compared, active) => {
    const nodes = NODES.map(n => {
      const v = cur[n.idx];
      if (v == null) return { id: n.id, parent: n.parent, label: '', state: 'pending' };
      return {
        id: n.id, parent: n.parent,
        label: String(v),
        meta: [`[${n.idx}]`],
        state: compared.includes(n.idx) ? 'unlinked' : 'idle',
        active: active.includes(n.idx),
      };
    });
    // Edges only between two filled positions, so ghosts float unconnected and
    // the gap in B reads as a missing left child rather than a drawn empty slot.
    const edges = NODES.filter(n => n.parent).flatMap(n =>
      (cur[n.idx] != null && cur[IDX_OF[n.parent]] != null)
        ? [{ from: n.parent, to: n.id, state: '' }] : []);
    return { layout: 'tree', edges, nodes };
  };

  /* The compact Variables strip: i, left, right, verdict. A var with no value
   * shows the placeholder X; the one changing this step takes the blue fill. The
   * verdict box holds the running answer — '?' while checking, then 'valid' /
   * 'NOT a heap' — and reserves width (minCh) so the strip never resizes. */
  const varsPanel = hot => ({
    render: 'box',
    cells: [
      { label: 'i',       value: i == null ? '' : i,       role: i == null ? 'empty' : (hot === 'i' ? 'active' : undefined),       minCh: 3 },
      { label: 'left',    value: left == null ? '' : left, role: left == null ? 'empty' : (hot === 'left' ? 'active' : undefined), minCh: 5 },
      { label: 'right',   value: right == null ? '' : right, role: right == null ? 'empty' : (hot === 'right' ? 'active' : undefined), minCh: 5 },
      { label: 'verdict', value: verdict, role: verdictRole, minCh: 11 },
    ],
  });

  const snap = ({ line, tag, narrate, note, compared = [], active = [], hot = null }) => {
    // Park the caller's main() line while control is inside isValidHeap (lines
    // 1..12), dimmed, so the return context stays visible without a callstack
    // panel. On the call step itself (line 15..19) the main line is the bright
    // active line, so nothing is parked.
    const parked = (line != null && line >= 1 && line <= 12) ? [callLine] : [];
    return {
      line, tag, narrate, note, parked,
      panels: {
        array: arrayPanel(compared, active),
        tree:  treePanel(compared, active),
        vars:  varsPanel(hot),
      },
    };
  };

  /* ================================ the trace ================================ */

  // STEP 0 — example A loaded, nothing checked.
  load(EX.A);
  yield snap({ line: null, tag: 'init', note: OPEN_NOTE,
    narrate: 'A binary max heap has to satisfy two rules. This structure looks plausible — but looking plausible is not the test.' });

  /* ---------- EXAMPLE A — VALID, the reference, checked in full ---------- */
  yield snap({ line: 15, tag: 'call',
    narrate: 'main calls isValidHeap on structure A, with size 7.' });

  // Shape pass, per cell (A is the reference, so it is stepped through).
  for (let k = 0; k < 7; k++) {
    i = k;
    yield snap({ line: 3, tag: 'test', hot: 'i', compared: [k],
      narrate: (k === 0 ? 'The first loop checks every position for a gap. ' : '') +
               `Index ${k} holds ${cur[k]} — not empty.` });
  }

  // Order pass.
  i = 0; left = null; right = null;
  yield snap({ line: 5, tag: 'test', hot: 'i',
    narrate: 'No position was empty — no gaps. Now the order rule. The second loop runs the same indices, and for each parent compares it against its children.' });

  left = 1;
  yield snap({ line: 7, tag: 'test', hot: 'left', compared: [0, 1],
    narrate: 'Index 0, the root (9). Its left child is at 0*2+1 = 1, holding 6. Is 6 > 9? No — the parent wins.' });
  right = 2;
  yield snap({ line: 10, tag: 'test', hot: 'right', compared: [0, 2],
    narrate: 'Its right child is at 0*2+2 = 2, holding 8. Is 8 > 9? No — fine.' });

  i = 1; left = 3; right = null;
  yield snap({ line: 7, tag: 'test', hot: 'left', compared: [1, 3],
    narrate: 'Index 1 (6). Left child at index 3 holds 4. Is 4 > 6? No.' });
  right = 4;
  yield snap({ line: 10, tag: 'test', hot: 'right', compared: [1, 4],
    narrate: 'Right child at index 4 holds 3. Is 3 > 6? No — fine.' });

  i = 2; left = 5; right = null;
  yield snap({ line: 7, tag: 'test', hot: 'left', compared: [2, 5],
    narrate: 'Index 2 (8). Left child at index 5 holds 0. Is 0 > 8? No.' });
  right = 6;
  yield snap({ line: 10, tag: 'test', hot: 'right', compared: [2, 6],
    narrate: 'Right child at index 6 holds 2. Is 2 > 8? No — fine.' });

  i = 3; left = 7; right = null;
  yield snap({ line: 7, tag: 'test', hot: 'left', note: A_LEAF_NOTE,
    narrate: "Index 3. Its left child would be at 3*2+1 = 7, but 7 <= 6 is false — past the end. Index 3 has no children, and neither do 4, 5, or 6." });

  i = null; left = null; right = null; verdict = 'valid'; verdictRole = 'ok';
  yield snap({ line: 12, tag: 'return', note: A_FINAL_NOTE,
    narrate: 'The loop finishes with no violation. Every parent is greater than or equal to both of its children, and there are no gaps. Structure A is a valid max heap.' });

  /* ---------- EXAMPLE C — INVALID, order, found at i = 2 ---------- */
  load(EX.C);
  yield snap({ line: 16, tag: 'call',
    narrate: 'Next, structure C. main calls isValidHeap on it, size 7.' });
  yield snap({ line: 2, tag: 'test',
    narrate: 'The shape check scans every index for an empty slot. All seven positions hold a value — no gaps, so the shape rule holds. On to order.' });

  i = 0;
  yield snap({ line: 5, tag: 'test', hot: 'i',
    narrate: 'The order rule: for each parent, is either child larger than it?' });
  left = 1;
  yield snap({ line: 7, tag: 'test', hot: 'left', compared: [0, 1],
    narrate: 'Root (9). Left child (index 1) holds 6. Is 6 > 9? No.' });
  right = 2;
  yield snap({ line: 10, tag: 'test', hot: 'right', compared: [0, 2],
    narrate: 'Right child (index 2) holds 2. Is 2 > 9? No — the root is fine.' });

  i = 1; left = 3; right = null;
  yield snap({ line: 7, tag: 'test', hot: 'left', compared: [1, 3],
    narrate: 'Index 1 (6). Left child (index 3) holds 4. Is 4 > 6? No.' });
  right = 4;
  yield snap({ line: 10, tag: 'test', hot: 'right', compared: [1, 4],
    narrate: 'Right child (index 4) holds 3. Is 3 > 6? No — fine.' });

  i = 2; left = 5; right = null;
  verdict = 'NOT a heap'; verdictRole = 'error';
  yield snap({ line: 7, tag: 'test', hot: 'left', active: [2, 5], note: C_VIOLATION_NOTE,
    narrate: 'Index 2 holds 2. Its left child (index 5) holds 8. Is 8 > 2? Yes — a parent smaller than its child. This is not a heap.' });
  yield snap({ line: 8, tag: 'return', active: [2, 5],
    narrate: 'The function returns right here. Indices 3, 4, 5, 6 are never examined — one violation is enough.' });

  /* ---------- EXAMPLE B — INVALID, shape, the surprising one ---------- */
  load(EX.B);
  yield snap({ line: 17, tag: 'call', note: B_ENTER_NOTE,
    narrate: 'Now structure B. This one has nine positions — look at the tree first.' });

  for (let k = 0; k < 7; k++) {
    i = k;
    yield snap({ line: 3, tag: 'test', hot: 'i', compared: [k],
      narrate: `Shape check: index ${k} holds ${cur[k]} — not empty.` });
  }
  i = 7;
  yield snap({ line: 3, tag: 'test', hot: 'i', active: [7, 8], note: B_GAP_NOTE,
    narrate: 'Index 7 — is it empty? Yes. Index 7 holds no value, yet index 8, just past it, holds 1. There is a hole in the middle of the array.' });

  verdict = 'NOT a heap'; verdictRole = 'error';
  yield snap({ line: 4, tag: 'return', active: [7, 8],
    narrate: 'return: there is a gap at index 7. The function stops here — the order pass never runs. The order rule was satisfied everywhere, and it still is not a heap.' });

  /* ---------- EXAMPLE D — INVALID, order at the root ---------- */
  load(EX.D);
  yield snap({ line: 18, tag: 'call',
    narrate: 'Structure D. isValidHeap on it, size 7.' });
  yield snap({ line: 2, tag: 'test',
    narrate: 'Shape check: all seven positions hold a value — no gaps. On to order.' });

  i = 0;
  yield snap({ line: 5, tag: 'test', hot: 'i',
    narrate: 'The order rule, starting at the root.' });
  left = 1;
  verdict = 'NOT a heap'; verdictRole = 'error';
  yield snap({ line: 7, tag: 'test', hot: 'left', active: [0, 1], note: D_NOTE,
    narrate: 'The very first comparison fails. The root holds 7; its left child (index 1) holds 9. Is 9 > 7? Yes — the root is smaller than its child.' });
  yield snap({ line: 8, tag: 'return', active: [0, 1],
    narrate: 'return at the root — the first parent checked. It never reaches the subtrees below, which happen to be fine.' });

  /* ---------- EXAMPLE E — VALID, the sibling case, the payoff ---------- */
  load(EX.E);
  yield snap({ line: 19, tag: 'call', note: E_ENTER_NOTE,
    narrate: "Last, structure E — five values. The root's left child is 3, its right child is 8." });
  yield snap({ line: 2, tag: 'test',
    narrate: 'Shape check: all five positions hold a value — no gaps.' });

  i = 0;
  yield snap({ line: 5, tag: 'test', hot: 'i',
    narrate: 'The order rule.' });
  left = 1;
  yield snap({ line: 7, tag: 'test', hot: 'left', compared: [0, 1],
    narrate: 'Root (9). Left child (index 1) holds 3. Is 3 > 9? No.' });
  right = 2;
  yield snap({ line: 10, tag: 'test', hot: 'right', compared: [0, 2],
    narrate: 'Right child (index 2) holds 8. Is 8 > 9? No — fine. Notice: the check compared 9 with 3 and 9 with 8, but never 3 with 8. They are siblings, and no rule mentions siblings.' });

  i = 1; left = 3; right = null;
  yield snap({ line: 7, tag: 'test', hot: 'left', compared: [1, 3],
    narrate: 'Index 1 (3). Left child (index 3) holds 1. Is 1 > 3? No.' });
  right = 4;
  yield snap({ line: 10, tag: 'test', hot: 'right', compared: [1, 4],
    narrate: 'Right child (index 4) holds 2. Is 2 > 3? No — fine. (And again, 1 versus 2 — two siblings — is never compared.)' });

  i = 2; left = 5; right = null;
  yield snap({ line: 7, tag: 'test', hot: 'left',
    narrate: "Index 2's left child would be at 2*2+1 = 5, past the end. Indices 2, 3, 4 are leaves — skipped." });

  i = null; left = null; right = null; verdict = 'valid'; verdictRole = 'ok';
  yield snap({ line: 12, tag: 'return',
    note: [E_PAYOFF_NOTE, ' ', { href: 'sorting-heapify.html', text: 'See an unordered array turned into a heap' }],
    narrate: 'No violation, no gaps. Structure E is a valid max heap — even though the left child is smaller than the right.' });
}

export default {
  title: 'Is this a heap?',
  subtitle: 'Two rules, and where they break',
  profile: 'standard',
  columns: 2,
  languages: ['pseudo', 'cpp', 'java'],

  // Four panels. The array (nine cells) and the tree are BOTH structure panels
  // and share one row side by side — the array reveals what the tree conceals,
  // which is the point. The compact Variables strip carries the running verdict,
  // and the code panel anchors the listing. No CALLSTACK: the call structure is
  // trivial, but the main() call line is parked (dimmed) while inside the
  // function. Everything resolves once on load and holds (pac.verifyHeights()).
  panels: [
    { type: 'code',  id: 'code',  title: 'isValidHeap',
      listings: LISTINGS, labels: { pseudo: 'pseudocode', cpp: 'C++', java: 'Java' } },
    { type: 'cells', id: 'array', title: 'the array', structure: true },
    { type: 'nodes', id: 'tree',  title: 'the same data as a tree', structure: true },
    { type: 'cells', id: 'vars',  title: 'Variables', compact: true },
  ],

  initialTrace: 'run',
  traces: {
    run: trace,
  },
};
