/* ds — A6 "Partitioning around a pivot" (KEY)
 *
 * ONE partition call, in full — not the recursion, not the whole sort. The
 * lecture calls partitioning "the most complex part of quick sort," and this
 * animation is exactly that part. The recursion is answered in the closing
 * challenge note, never animated.
 *
 * The array and every intermediate state are the lecture's own worked example,
 * verified frame by frame:
 *
 *   a = [8, 2, 5, 13, 4, 19, 12, 6, 3, 11, 10, 7, 9]   (13 elements, 0..12)
 *   l = 0, r = 12, pivot = a[0] = 8
 *
 *   phase  i stops at    j stops at    action
 *   1      3 (13)        11 (7)        swap -> 8 2 5 7 4 19 12 6 3 11 10 13 9
 *   2      5 (19)        8  (3)        swap -> 8 2 5 7 4 3 12 6 19 11 10 13 9
 *   3      6 (12)        7  (6)        swap -> 8 2 5 7 4 3 6 12 19 11 10 13 9
 *   4      7 (12)        6  (6)        NO SWAP — j has passed i
 *   final                             swap a[0],a[6] -> 6 2 5 7 4 3 [8] 12 19 11 10 13 9
 *   return j = 6
 *
 * The two inner scans (lines 6 and 7) are written as SINGLE-LINE while loops, so
 * one scanned element costs ONE step: the comparison is narrated on the same step
 * as the move. This halves the trace without hiding anything.
 *
 * ROLE MAPPING onto the engine's shipped CELLS roles (no new capability):
 *   pivot cell        -> `compared` (amber outline), held from line 2 to the very
 *                        end, so the student always knows which value is the pivot.
 *                        The l marker sits under it too.
 *   cell being scanned -> `compared` on its step only, released next step. It is
 *                        distinguished from the pivot by its i/j marker and by not
 *                        being at index 0.
 *   the two swapped cells -> `active` (blue activity fill), the step of the swap.
 *   the placed pivot   -> `ok` (green outline) on the final swap, kept thereafter —
 *                        the one value now in its FINAL sorted position.
 * swap is atomic: one step, both cells change, no temp variable shown.
 *
 * Four markers share one lane: l at [0] and r at [12] for the whole animation; i
 * and j move. In phase 4 they land on ADJACENT cells (j at 6, i at 7). Nothing
 * here corrupts memory — NO memory-danger marker anywhere. WATCH only: one trace,
 * no gates; every insight is narration and notes. Metrics hidden. */

/* One listing, three ds languages, line-aligned to a single 14-line grid, so
 * `line` is a plain number that resolves the same in every language. Lines 6 and
 * 7 are the single-line inner scans; line 10 is the final swap; line 11 returns
 * the split point. */
const LISTINGS = {
  pseudo: [
    'partition(a, l, r)',                            //  1
    '    pivot = a[l]',                              //  2
    '    i = l + 1',                                 //  3
    '    j = r',                                     //  4
    '    while i <= j',                              //  5
    '        while i <= r and a[i] <= pivot:  i = i + 1', //  6
    '        while a[j] > pivot:  j = j - 1',        //  7
    '        if i < j',                              //  8
    '            swap a[i] and a[j]',                //  9
    '    swap a[l] and a[j]',                        // 10
    '    return j',                                  // 11
    '',                                              // 12
    'main()',                                        // 13
    '    partition(a, 0, 12)',                       // 14
  ],
  cpp: [
    'int partition(int a[], int l, int r) {',        //  1
    '    int pivot = a[l];',                         //  2
    '    int i = l + 1;',                            //  3
    '    int j = r;',                                //  4
    '    while (i <= j) {',                          //  5
    '        while (i <= r && a[i] <= pivot)  i++;', //  6
    '        while (a[j] > pivot)  j--;',            //  7
    '        if (i < j)',                            //  8
    '            swap(a[i], a[j]); }',               //  9
    '    swap(a[l], a[j]);',                         // 10
    '    return j; }',                               // 11
    '',                                              // 12
    'int main() {',                                  // 13
    '    partition(a, 0, 12); }',                    // 14
  ],
  java: [
    'int partition(int[] a, int l, int r) {',        //  1
    '    int pivot = a[l];',                         //  2
    '    int i = l + 1;',                            //  3
    '    int j = r;',                                //  4
    '    while (i <= j) {',                          //  5
    '        while (i <= r && a[i] <= pivot)  i++;', //  6
    '        while (a[j] > pivot)  j--;',            //  7
    '        if (i < j)',                            //  8
    '            swap(a, i, j); }',                  //  9
    '    swap(a, l, j);',                            // 10
    '    return j; }',                               // 11
    '',                                              // 12
    'void main() {',                                 // 13
    '    partition(a, 0, 12); }',                    // 14
  ],
};

/* ---- teaching notes ---- */
const OPEN_NOTE =
  'Quicksort works by choosing one value as the PIVOT and rearranging the array so everything ≤ the pivot ' +
  'ends up to its left and everything > the pivot to its right. That rearranging is called partitioning, ' +
  'and it is the hard part of quicksort. After it, the pivot is in its final position for good.';

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

const CHALLENGE_NOTE =
  'Quicksort now calls itself on the two sides: indices 0 to 5, and 8 to 12. Each of those picks its own ' +
  'pivot and partitions again, until the pieces are single values. Two questions worth thinking about. ' +
  'Line 6 has a guard, i ≤ r, which never fired here — what array would make i run off the end without ' +
  'it? And what happens if the array is ALREADY SORTED, say 1 2 3 4 5, and the pivot is 1? Trace where ' +
  'the pivot ends up and how big the two sides are.';

function* trace() {
  const a = [8, 2, 5, 13, 4, 19, 12, 6, 3, 11, 10, 7, 9];   // 13 elements
  const L = 0, R = 12;
  let pivot = null;        // display value; a[L] is captured at line 2 (stays 8)
  let i = null, j = null;  // marker indices; null = the marker is not shown yet
  let pivotCell = null;    // index carrying the persistent pivot treatment (compared)
  let sortedCell = null;   // index of the placed pivot (ok); set on the final swap

  /* The array as a marked CELLS row: one value per cell, [0]..[12] beneath, and
   * the four markers l, i, j, r. l and r are always present (so the marker count
   * never drops below 2 and the column width never changes); i and j appear once
   * set. Role priority per cell: the placed pivot (`sorted`, green FILL) wins and
   * is permanent — a settled value is never "active", so green beats blue; then a
   * cell swapped THIS step (`active`, blue fill); then the amber `compared` outline
   * shared by the pivot (displaced, not where it belongs) and the cell being
   * scanned this step. */
  const arrayPanel = ({ compared = null, active = [] }) => {
    const markers = [{ label: 'l', index: L }];
    if (i != null) markers.push({ label: 'i', index: i });
    if (j != null) markers.push({ label: 'j', index: j });
    markers.push({ label: 'r', index: R });
    return {
      render: 'box',
      rowLabel: 'a',
      cells: a.map((v, idx) => {
        if (idx === sortedCell)   return { value: v, role: 'sorted' };
        if (active.includes(idx)) return { value: v, role: 'active' };
        if (idx === compared)     return { value: v, role: 'compared' };
        if (idx === pivotCell)    return { value: v, role: 'compared' };
        return { value: v };
      }),
      markers,
    };
  };

  /* The compact Variables strip: pivot, i, j. `hot` gives the changing box the
   * blue fill. Each shows the placeholder before it holds a meaningful value. i
   * and j show the value they currently point at alongside the index — "3 (13)" —
   * so a marker far out on the 13-cell row is tied to the number the narration is
   * talking about; the pivot box already shows its value, so all three read the
   * same way. (i and j never leave [0..12] in this trace, so a[i]/a[j] are always
   * in range.) */
  const varsPanel = hot => ({
    render: 'box',
    cells: [
      { label: 'pivot', value: pivot == null ? '' : pivot,          role: pivot == null ? 'empty' : (hot === 'pivot' ? 'active' : undefined) },
      { label: 'i',     value: i == null ? '' : `${i} (${a[i]})`,   role: i == null ? 'empty' : (hot === 'i' ? 'active' : undefined) },
      { label: 'j',     value: j == null ? '' : `${j} (${a[j]})`,   role: j == null ? 'empty' : (hot === 'j' ? 'active' : undefined) },
    ],
  });

  const snap = ({ line, tag, narrate, note, compared = null, active = [], hot = null }) => ({
    line, tag, narrate, note,
    panels: {
      array: arrayPanel({ compared, active }),
      vars:  varsPanel(hot),
    },
  });

  /* Line 6 — i walks right while a[i] ≤ pivot. Each element examined is ONE step;
   * the marker sits on the cell under test (compared) and steps right on the next
   * click. The `i <= R` guard is faithful but never fires in this trace. */
  function* scanI() {
    while (i <= R && a[i] <= pivot) {
      yield snap({ line: 6, tag: 'compare', hot: 'i', compared: i,
        narrate: `a[${i}] is ${a[i]}, which is ≤ the pivot ${pivot}, so i moves on.` });
      i += 1;
    }
    yield snap({ line: 6, tag: 'compare', hot: 'i', compared: i,
      narrate: `a[${i}] is ${a[i]}, which is bigger than the pivot ${pivot}. i stops here — ${a[i]} is on the wrong side.` });
  }

  /* Line 7 — j walks left while a[j] > pivot. The mirror of scanI, comparison
   * reversed. */
  function* scanJ() {
    while (a[j] > pivot) {
      yield snap({ line: 7, tag: 'compare', hot: 'j', compared: j,
        narrate: `a[${j}] is ${a[j]}, which is bigger than the pivot, so j moves on.` });
      j -= 1;
    }
    yield snap({ line: 7, tag: 'compare', hot: 'j', compared: j,
      narrate: `a[${j}] is ${a[j]}, which is ≤ the pivot ${pivot}. j stops here.` });
  }

  /* Line 5 — the outer test, evaluated at the top of every iteration. */
  function* whileTop() {
    yield snap({ line: 5, tag: 'test',
      narrate: `i is ${i}, j is ${j} — i is not past j, so there is still a stretch between them to scan.` });
  }

  /* Lines 8 + 9 — i < j is true, so the two wrong-side values trade (one step,
   * both cells change). The pair takes the blue ACTIVITY fill on the line-8 test
   * (a visual antecedent for the swap), keeps it through the exchange on line 9,
   * and releases it on the next step. Fill = activity, not membership — the pivot
   * keeps its amber outline (membership channel) untouched. On the phase-4 step
   * where i < j is FALSE (handled separately, below), neither cell gets the fill,
   * and that absence is itself the signal that nothing will be swapped. */
  function* swapIJ(narrate, note) {
    yield snap({ line: 8, tag: 'test', active: [i, j],
      narrate: `i is ${i}, j is ${j}. i is left of j, so their two values are on the wrong sides — swap them.` });
    const vi = a[i], vj = a[j];
    a[i] = vj; a[j] = vi;
    yield snap({ line: 9, tag: 'swap', narrate, note, active: [i, j] });
  }

  /* ================= STEP 0 — nothing has executed ===================== */
  yield snap({
    line: null, tag: 'init',
    narrate: 'Thirteen values, unsorted. l and r mark the part of the array we are working on — here, all of it.',
    note: OPEN_NOTE,
  });

  /* ================= SETUP — lines 2, 3, 4 ============================= */
  pivot = a[L];  pivotCell = L;                        // 8; the pivot cell now holds the amber outline for good
  yield snap({ line: 2, tag: 'assign', hot: 'pivot', narrate: 'The simplest pivot is the first value: 8.' });
  i = L + 1;                                           // 1
  yield snap({ line: 3, tag: 'assign', hot: 'i', narrate: 'i starts just to the right of the pivot, at index 1.' });
  j = R;                                               // 12
  yield snap({ line: 4, tag: 'assign', hot: 'j', note: WALK_NOTE,
    narrate: 'j starts at the far right, index 12.' });

  /* ================= ITERATION 1 (i:1->3, j:12->11, swap) ============== */
  yield* whileTop();
  yield* scanI();                                      // 2 advance, 5 advance, 13 stop
  yield* scanJ();                                      // 9 advance, 7 stop
  yield* swapIJ('13 and 7 trade places. Both are now on the side they belong on.', FIRST_SWAP_NOTE);

  /* ================= ITERATION 2 (i:3->5, j:11->8, swap) =============== */
  yield* whileTop();
  yield* scanI();                                      // 7 advance, 4 advance, 19 stop
  yield* scanJ();                                      // 13 advance, 10 advance, 11 advance, 3 stop
  yield* swapIJ('19 and 3 trade places.');

  /* ================= ITERATION 3 (i:5->6, j:8->7, swap) ================ */
  yield* whileTop();
  yield* scanI();                                      // 3 advance, 12 stop
  yield* scanJ();                                      // 19 advance, 6 stop
  yield* swapIJ('12 and 6 trade places.');

  /* ================= ITERATION 4 — THE PAYOFF (indices cross) ========== */
  yield* whileTop();
  yield* scanI();                                      // 6 advance to 7, 12 stop
  yield* scanJ();                                      // 12 advance to 6, 6 stop
  yield snap({ line: 8, tag: 'test', note: CROSS_NOTE,
    narrate: 'i is 7 and j is 6 — j has passed i. There is nothing left between them, so there is nothing to swap.' });

  /* ================= LOOP EXIT — line 5 is now false =================== */
  yield snap({ line: 5, tag: 'test',
    narrate: '7 ≤ 6 is false, so the scanning is over.' });

  /* ================= THE FINAL SWAP — line 10 ========================= */
  {
    const vl = a[L], vj = a[j];
    a[L] = vj; a[j] = vl;                              // 8 -> index 6, 6 -> index 0
    pivotCell = null; sortedCell = j;                 // the pivot leaves [0] (amber); [6] flips to green FILL for good
    yield snap({ line: 10, tag: 'swap', note: PLACED_NOTE, active: [L],
      narrate: 'The pivot trades places with a[j]. 8 is now green — this is its final position in the sorted array, and nothing will move it again.' });
  }

  /* ================= RETURN — line 11 ================================= */
  yield snap({ line: 11, tag: 'return', note: CHALLENGE_NOTE,
    narrate: 'partition returns 6 — the index where the pivot ended up.' });
}

export default {
  title: 'Quicksort: partitioning around a pivot',
  subtitle: 'One index walks in from each end',
  profile: 'standard',
  columns: 2,
  languages: ['pseudo', 'cpp', 'java'],

  // Three panels only. The array is the sole STRUCTURE panel; the engine gives it
  // its natural width FIRST (13 marked cells, ~1030px, never scrolled sideways),
  // and the code panel takes what remains down to its ~60-character floor — its
  // longest line is well under that, so it sits narrow beside the array and the
  // whole row fits inside 1920px with room to spare. The compact Variables strip
  // is bookkeeping and balances beneath. Every dimension resolves once on load and
  // holds, so nothing moves as steps advance (verify with pac.verifyHeights()).
  panels: [
    { type: 'code',  id: 'code',  title: 'partition',
      listings: LISTINGS, labels: { pseudo: 'pseudocode', cpp: 'C++', java: 'Java' } },
    { type: 'cells', id: 'array', title: 'the array', structure: true },
    { type: 'cells', id: 'vars',  title: 'Variables', compact: true },
  ],

  initialTrace: 'run',
  traces: {
    run: trace,
  },
};
