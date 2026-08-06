/* ds — A7 "Heapsort", PART 2 of 2: emptying the heap (KEY material)
 *
 * Heapsort is split across two animations because one is too long. Part 1,
 * `sorting-heapify`, turned an unordered array into a valid binary MAX HEAP and
 * ended on the array [9,6,8,4,1,2]. This is part 2, and it OPENS on exactly that
 * heap. Where part 1 ended, this begins: the repeated extract-and-sink that
 * turns the heap into a sorted array.
 *
 * INHERITS PART 1 UNCHANGED — no new engine capability. Same five panels, same
 * tree ↔ array dual view, same markers, same CALLSTACK discipline, and the SAME
 * siftDown (lines 1–10 are byte-for-byte part 1's). The only genuinely new thing
 * is a lesson, not a mechanism: two ideas carried with equal weight —
 *   (a) the SORTED region grows from the RIGHT and is permanent (green fill), and
 *   (b) the HEAP SHRINKS as it grows: one array, one boundary (`end`) moving
 *       leftward, no second array. The lecture's word is "in-place".
 *
 * THE SHRINKING TREE is the visual part 1 could not show, and it is built from
 * existing capability only:
 *   - All six tree nodes are present in EVERY snapshot (as in part 1), so the
 *     layout is computed once over the whole tree and nothing ever jumps.
 *   - When a value is PLACED (swapped to a[end], then end decremented), its node
 *     LEAVES THE HEAP: it is rendered in the `pending` state — the panel's
 *     existing "present for layout, not an active member" treatment, greyed with
 *     its value still shown — and its edge to its parent is dropped from the
 *     per-step `edges` array (pure data). Fixed positions + dropped edges means
 *     the tree visibly thins out from the bottom-right, node by node, exactly as
 *     the lecture's diagrams show, while the array beside it stays six cells
 *     wide. That size difference IS the in-place lesson.
 *   - On the SAME step the array cell for that index takes GREEN FILL (`sorted`,
 *     final, permanent, never released). Node leaves the tree, cell turns green —
 *     one event, both panels.
 *
 * THE VERIFIED TRACE (the lecture's own numbers, checked frame by frame):
 *
 *   start heap: a = [9,6,8,4,1,2]  end = 5
 *   swap a0,a5 -> [2,6,8,4,1,9] end=4  9 placed[5]
 *     siftDown(0,4): 2 vs (6,8) -> swap 8 -> [8,6,2,4,1,9]  done
 *   swap a0,a4 -> [1,6,2,4,8,9] end=3  8 placed[4]
 *     siftDown(0,3): 1 vs (6,2) -> swap 6 -> [6,1,2,4,8,9]
 *                    1 vs (4)   -> swap 4 -> [6,4,2,1,8,9]  done   (only-child, end=3)
 *   swap a0,a3 -> [1,4,2,6,8,9] end=2  6 placed[3]
 *     siftDown(0,2): 1 vs (4,2) -> swap 4 -> [4,1,2,6,8,9]  done
 *   swap a0,a2 -> [2,1,4,6,8,9] end=1  4 placed[2]
 *     siftDown(0,1): 2 vs (1) -> 1>2 false -> return, no swap
 *   swap a0,a1 -> [1,2,4,6,8,9] end=0  2 placed[1]
 *     while end>0 is FALSE -> sort over.  a[0]=1 placed[0] by elimination.
 *   FINAL: [1,2,4,6,8,9] — all six green.
 *
 * GREEN accumulates [5],[4],[3],[2],[1],[0], right to left, and never reverts.
 * Nothing here corrupts memory — no memory-danger marker. WATCH only: one trace,
 * no gates. Metrics hidden. No assignment ID visible. */

/* One listing, three ds languages, line-aligned to a single 21-line grid so
 * `line` is a plain number that resolves the same in every language. Lines 1–10
 * are siftDown, IDENTICAL to part 1. Lines 12–18 are the sort loop, which is all
 * that is new: extract the root to the end, shrink the heap by one, sift the new
 * root down, repeat. heapify (line 13) is the whole of part 1, run here as ONE
 * step that produces the starting heap. */
const LISTINGS = {
  pseudo: [
    'siftDown(a, root, end)',                                 //  1
    '    while root * 2 + 1 <= end',                          //  2
    '        child = root * 2 + 1',                           //  3
    '        if child + 1 <= end and a[child + 1] > a[child]', //  4
    '            child = child + 1',                          //  5
    '        if a[child] > a[root]',                          //  6
    '            swap a[root] and a[child]',                  //  7
    '            root = child',                               //  8
    '        else',                                           //  9
    '            return',                                     // 10
    '',                                                       // 11
    'sort(a, size)',                                          // 12
    '    heapify(a, size)',                                   // 13
    '    end = size - 1',                                     // 14
    '    while end > 0',                                      // 15
    '        swap a[0] and a[end]',                           // 16
    '        end = end - 1',                                  // 17
    '        siftDown(a, 0, end)',                            // 18
    '',                                                       // 19
    'main()',                                                 // 20
    '    sort(a, 6)',                                         // 21
  ],
  cpp: [
    'void siftDown(int a[], int root, int end) {',            //  1
    '    while (root * 2 + 1 <= end) {',                      //  2
    '        int child = root * 2 + 1;',                      //  3
    '        if (child + 1 <= end && a[child + 1] > a[child])', //  4
    '            child = child + 1;',                         //  5
    '        if (a[child] > a[root]) {',                      //  6
    '            swap(a[root], a[child]);',                   //  7
    '            root = child;',                              //  8
    '        } else',                                         //  9
    '            return; } }',                                // 10
    '',                                                       // 11
    'void sort(int a[], int size) {',                         // 12
    '    heapify(a, size);',                                  // 13
    '    int end = size - 1;',                                // 14
    '    while (end > 0) {',                                  // 15
    '        swap(a[0], a[end]);',                            // 16
    '        end = end - 1;',                                 // 17
    '        siftDown(a, 0, end); } }',                       // 18
    '',                                                       // 19
    'int main() {',                                           // 20
    '    sort(a, 6); }',                                      // 21
  ],
  java: [
    'void siftDown(int[] a, int root, int end) {',            //  1
    '    while (root * 2 + 1 <= end) {',                      //  2
    '        int child = root * 2 + 1;',                      //  3
    '        if (child + 1 <= end && a[child + 1] > a[child])', //  4
    '            child = child + 1;',                         //  5
    '        if (a[child] > a[root]) {',                      //  6
    '            swap(a, root, child);',                      //  7
    '            root = child;',                              //  8
    '        } else',                                         //  9
    '            return; } }',                                // 10
    '',                                                       // 11
    'void sort(int[] a, int size) {',                         // 12
    '    heapify(a, size);',                                  // 13
    '    int end = size - 1;',                                // 14
    '    while (end > 0) {',                                  // 15
    '        swap(a, 0, end);',                               // 16
    '        end = end - 1;',                                 // 17
    '        siftDown(a, 0, end); } }',                       // 18
    '',                                                       // 19
    'void main() {',                                          // 20
    '    sort(a, 6); }',                                      // 21
  ],
};

/* ---- teaching notes ---- */
const OPEN_NOTE =
  'Building this heap is the previous animation. What matters here is one fact: in a max heap the largest ' +
  'remaining value is ALWAYS at index 0. That is what makes the sort work — you never have to search for the ' +
  'maximum, you just take the root.';

const HEAPIFY_NOTE =
  'This one line is the whole of the previous animation — sifting the unordered array down into this max heap. ' +
  'Here it runs as a single move; all that matters is its result: 9, the largest value, is at the root.';

const END_NOTE =
  'end marks the last index still part of the heap. Everything to its right is finished. Right now nothing is ' +
  'finished, so end is at the last cell.';

const REUSE_NOTE =
  'This is the exact siftDown from the previous animation — the same function, unchanged. The only thing that ' +
  'differs is the end it is handed. heapify always passed the last index; the sort passes a smaller end each ' +
  'time, so siftDown rearranges only the shrinking heap and never touches the sorted values to its right.';

const SWAP1_NOTE =
  'This looks destructive: 2 was a leaf and now it is the root, which almost certainly breaks the heap. That is ' +
  'fine. The heap property only has to be restored, and sifting one value down costs about log n — much less than ' +
  'searching the whole array for the next maximum.';

const PLACE1_NOTE =
  "Green means final. Not 'correct for now' — 9 is in the position it will occupy in the finished array, and " +
  'nothing will touch it again. Watch the tree: node 5 is gone. The heap is now five values, in the same array.';

const CASCADE_NOTE =
  'The same siftDown as before, and the same only-child case — except end is now 3, not 5. The heap has shrunk, ' +
  "so what counts as 'off the end' has moved inward. That single parameter is what keeps the sorted values " +
  'untouched.';

const NO_SWAP_NOTE =
  'A sift that does nothing is not a wasted step — it is the check that proves the value left at the root is ' +
  'already bigger than its children, so the shrunken heap is still valid.';

const DEGENERATE_NOTE =
  'The loop never places a[0] explicitly, and it does not need to. When everything else has been placed, whatever ' +
  'remains has nowhere else to go — so a[0] is sorted by elimination.';

const FINAL_NOTE =
  'Six values, six extractions, and each sift cost about log n — that is the n log n. Two things worth noticing. ' +
  'Nothing was ever copied to a second array: the heap and the sorted region shared one array the whole time, ' +
  'divided by end. And unlike quicksort, this cost is guaranteed — there is no arrangement of input that makes ' +
  "heapsort slow, because the tree's shape depends on the number of values, not on what they are. That is why a " +
  'real-time system uses heapsort even though quicksort is usually faster.';

/* The six tree nodes: a complete binary tree over indices 0..5. Node i's
 * children are 2i+1 and 2i+2, so 1,2 sit under 0; 3,4 under 1; 5 under 2. All
 * six are present in every snapshot and never move — a placed node stays in
 * position, greyed (`pending`) with its parent edge dropped, so the tree thins
 * out without anything jumping. */
const NODES = [
  { id: 'n0', parent: null, idx: 0 },
  { id: 'n1', parent: 'n0', idx: 1 },
  { id: 'n2', parent: 'n0', idx: 2 },
  { id: 'n3', parent: 'n1', idx: 3 },
  { id: 'n4', parent: 'n1', idx: 4 },
  { id: 'n5', parent: 'n2', idx: 5 },
];
// Each non-root node carries one edge from its parent; `childIdx` lets the trace
// drop that edge the moment the child leaves the heap.
const EDGES = NODES.filter(n => n.parent).map(n => ({ from: n.parent, to: n.id, childIdx: n.idx }));

function* trace() {
  const a = [9, 6, 8, 4, 1, 2];      // heapify's output — the heap this animation opens on
  let end = null;                    // sort's heap boundary (null = box empty, no marker)
  let root = null, child = null;     // siftDown's vars (null = absent)
  let zeroPlaced = false;            // a[0], placed by elimination on the very last step

  /* A cell/node index is PLACED — out of the heap for good — when it is past the
   * heap boundary (idx > end), plus the final a[0] by elimination. Monotonic:
   * end only decreases, so green never reverts. */
  const isPlaced = idx => (end != null && idx > end) || (zeroPlaced && idx === 0);

  /* The array-position markers: end (the heap boundary), root, child. A marker
   * only appears for a variable that is currently in scope and stored. */
  const markers = () => {
    const m = [];
    if (root != null)  m.push({ label: 'root',  index: root });
    if (child != null) m.push({ label: 'child', index: child });
    if (end != null)   m.push({ label: 'end',   index: end });
    return m;
  };

  /* The array. A PLACED cell is green (`sorted`) and wins over everything — it is
   * settled, never acted on again. Otherwise a cell acted on THIS step (`active`,
   * blue fill) beats the amber `compared` outline (a cell being examined). */
  const arrayPanel = (compared, active) => ({
    render: 'box',
    rowLabel: 'a',
    cells: a.map((v, idx) => {
      if (isPlaced(idx))          return { value: v, role: 'sorted' };
      if (active.includes(idx))   return { value: v, role: 'active' };
      if (compared.includes(idx)) return { value: v, role: 'compared' };
      return { value: v };
    }),
    markers: markers(),
  });

  /* The tree — the SAME data. A PLACED node leaves the heap: state `pending` (the
   * panel's greyed, present-for-layout treatment) and its parent edge dropped, so
   * the tree visibly thins out while its remaining nodes hold position. A node
   * still in the heap is `active` (blue fill) when this step touches it, amber
   * `unlinked` when it is being examined (matching the array's `compared`), else
   * the neutral `idle` outline — never green, which belongs to the array's
   * settled cells, not the tree. */
  const treePanel = (compared, active) => ({
    layout: 'tree',
    edges: EDGES.filter(e => !isPlaced(e.childIdx)),
    nodes: NODES.map(n => {
      if (isPlaced(n.idx)) {
        return { id: n.id, parent: n.parent, label: String(a[n.idx]), meta: [`[${n.idx}]`], state: 'pending', active: false };
      }
      return {
        id: n.id, parent: n.parent,
        label: String(a[n.idx]),
        meta: [`[${n.idx}]`],
        state: compared.includes(n.idx) ? 'unlinked' : 'idle',
        active: active.includes(n.idx),
      };
    }),
  });

  /* The compact Variables strip: end, root, child. A var with no value shows the
   * placeholder dash; the one changing this step takes the blue fill. */
  const varsPanel = hot => ({
    render: 'box',
    cells: [
      { label: 'end',   value: end   == null ? '' : end,   role: end   == null ? 'empty' : (hot === 'end'   ? 'active' : undefined) },
      { label: 'root',  value: root  == null ? '' : root,  role: root  == null ? 'empty' : (hot === 'root'  ? 'active' : undefined) },
      { label: 'child', value: child == null ? '' : child, role: child == null ? 'empty' : (hot === 'child' ? 'active' : undefined) },
    ],
  });

  /* The call frames, bottom-to-top: main -> sort -> siftDown. `a` is the shared
   * array, not shown as a value; each frame carries the bindings that make the
   * call concrete. sort's own local is `end`. A caller frame's `call` line is
   * dimmed (parked) in the code panel; the running top frame's is the bright
   * active line. */
  const mainF = () => ({ fn: 'main', vars: [], call: 21 });
  const sortF = hot => ({
    fn: 'sort',
    vars: [
      { name: 'size', value: 6 },
      ...(end == null ? [] : [{ name: 'end', value: end, kind: 'local', role: hot === 'end' ? 'active' : undefined }]),
    ],
    call: 18,
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
    if (level >= 1) f.push(sortF(hot));
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

  // STEP 0 — nothing has executed. The valid max heap heapify produced. The note
  // links BACK to part 1 here, at the opening — a student landing on part 2 first
  // needs the prerequisite when they arrive, not when they leave.
  yield snap({ line: null, tag: 'init',
    note: [OPEN_NOTE, ' ', { href: 'sorting-heapify.html', text: 'See how this heap was built' }],
    narrate: 'A valid max heap. The largest value, 9, is at the root — the same six values as a tree and as an array.' });

  // main calls sort (line 21). The call has a visible origin.
  yield snap({ line: 21, tag: 'call', level: 0,
    narrate: 'main calls sort on the whole array, passing size = 6.' });

  // heapify (line 13) — one step, run inside sort. The array is already the heap.
  yield snap({ line: 13, tag: 'call', level: 1, note: HEAPIFY_NOTE,
    narrate: 'Inside sort. heapify has already run — this heap is its result — so this line leaves the array exactly as it is.' });

  // end = size - 1 = 5.
  end = 5;
  yield snap({ line: 14, tag: 'assign', hot: 'end', level: 1, note: END_NOTE,
    narrate: 'end = size - 1 = 5 — the last index. The heap is the whole array for now, so end sits at the last cell.' });

  /* ===================== EXTRACTION 1 : root 9 -> [5], siftDown(0,4) ===================== */
  yield snap({ line: 15, tag: 'test', level: 1, compared: [5],
    narrate: 'end is 5, and 5 > 0, so the heap still holds more than one value — keep going.' });
  a[0] = 2; a[5] = 9;
  yield snap({ line: 16, tag: 'swap', level: 1, active: [0, 5], note: SWAP1_NOTE,
    narrate: '9 and 2 trade places. 9 lands at index 5, and the leaf value 2 is now at the root.' });
  end = 4;
  yield snap({ line: 17, tag: 'assign', hot: 'end', level: 1, note: PLACE1_NOTE,
    narrate: 'end moves to 4. 9 is out of the heap for good — its cell turns green and its node leaves the tree. It is in its final position.' });
  yield snap({ line: 18, tag: 'call', level: 1, note: REUSE_NOTE,
    narrate: 'sort calls siftDown for the root, index 0, but with end = 4 — the shrunken heap.' });

  root = 0;
  yield snap({ line: 2, tag: 'test', level: 2, compared: [0],
    narrate: "Inside siftDown. The root's left child is at 0*2+1 = 1, and 1 <= 4, so the root has a child to check." });
  child = 1;
  yield snap({ line: 3, tag: 'assign', hot: 'child', level: 2, compared: [1],
    narrate: 'child = 0*2+1 = 1 — the left child, holding 6.' });
  yield snap({ line: 4, tag: 'test', level: 2, compared: [1, 2],
    narrate: 'Both children exist: index 1 holds 6, index 2 holds 8. 8 > 6, so the right child is the larger one.' });
  child = 2;
  yield snap({ line: 5, tag: 'assign', hot: 'child', level: 2, compared: [2],
    narrate: 'child moves to index 2 — the larger child, holding 8.' });
  yield snap({ line: 6, tag: 'test', level: 2, compared: [0, 2],
    narrate: 'a[2] is 8 and a[root] = a[0] is 2. 8 > 2, so the root must sink.' });
  a[0] = 8; a[2] = 2;
  yield snap({ line: 7, tag: 'swap', level: 2, active: [0, 2],
    narrate: '8 and 2 trade places. 8 rises to the root; 2 sinks to index 2.' });
  root = 2;
  yield snap({ line: 8, tag: 'assign', hot: 'root', level: 2, compared: [2],
    narrate: 'root follows the 2 down to index 2.' });
  yield snap({ line: 2, tag: 'test', level: 2, compared: [2],
    narrate: "Index 2's left child would be at 2*2+1 = 5, which is past end = 4 — outside the heap. Node 2 has no children now, so siftDown is finished." });

  /* ===================== EXTRACTION 2 : root 8 -> [4], siftDown(0,3) cascade ===================== */
  root = null; child = null;
  yield snap({ line: 15, tag: 'test', level: 1, compared: [4],
    narrate: 'Back in sort. end is 4, still greater than 0 — extract again.' });
  a[0] = 1; a[4] = 8;
  yield snap({ line: 16, tag: 'swap', level: 1, active: [0, 4],
    narrate: '8 and 1 trade places. 8 lands at index 4.' });
  end = 3;
  yield snap({ line: 17, tag: 'assign', hot: 'end', level: 1,
    narrate: 'end moves to 3. 8 is placed — its cell turns green and its node leaves the tree. The heap is down to four values.' });
  yield snap({ line: 18, tag: 'call', level: 1,
    narrate: 'sort calls siftDown for the root with end = 3.' });

  root = 0;
  yield snap({ line: 2, tag: 'test', level: 2, compared: [0],
    narrate: "The root's left child is at 0*2+1 = 1, and 1 <= 3." });
  child = 1;
  yield snap({ line: 3, tag: 'assign', hot: 'child', level: 2, compared: [1],
    narrate: 'child = 1 — the left child, holding 6.' });
  yield snap({ line: 4, tag: 'test', level: 2, compared: [1, 2],
    narrate: 'Index 1 holds 6, index 2 holds 2. 2 > 6 is false, so the left child (6) is still the larger — child stays at 1.' });
  yield snap({ line: 6, tag: 'test', level: 2, compared: [0, 1],
    narrate: 'a[1] is 6 and a[root] = a[0] is 1. 6 > 1, so the root sinks.' });
  a[0] = 6; a[1] = 1;
  yield snap({ line: 7, tag: 'swap', level: 2, active: [0, 1],
    narrate: '6 rises to the root and 1 drops to index 1 — but 1 may keep falling.' });
  root = 1;
  yield snap({ line: 8, tag: 'assign', hot: 'root', level: 2, compared: [1],
    narrate: 'root follows the 1 down to index 1.' });
  yield snap({ line: 2, tag: 'test', level: 2, compared: [1],
    narrate: "Index 1's left child is at 1*2+1 = 3, and 3 <= 3 — 1 keeps going." });
  child = 3;
  yield snap({ line: 3, tag: 'assign', hot: 'child', level: 2, compared: [3],
    narrate: 'child = 1*2+1 = 3 — the left child, holding 4.' });
  yield snap({ line: 4, tag: 'test', level: 2, compared: [3], note: CASCADE_NOTE,
    narrate: 'There is no right child inside the heap: index 4 is past end = 3 (4 <= 3 is false). The only candidate is index 3.' });
  yield snap({ line: 6, tag: 'test', level: 2, compared: [1, 3],
    narrate: 'a[3] is 4 and a[root] = a[1] is 1. 4 > 1, so 1 sinks again.' });
  a[1] = 4; a[3] = 1;
  yield snap({ line: 7, tag: 'swap', level: 2, active: [1, 3],
    narrate: '1 keeps sinking. It swaps with 4 and lands at index 3.' });
  root = 3;
  yield snap({ line: 8, tag: 'assign', hot: 'root', level: 2, compared: [3],
    narrate: 'root follows the 1 down to index 3.' });
  yield snap({ line: 2, tag: 'test', level: 2, compared: [3],
    narrate: "Index 3's left child would be at 3*2+1 = 7, past end = 3. Node 3 has no children, so 1 has landed and siftDown is finished." });

  /* ===================== EXTRACTION 3 : root 6 -> [3], siftDown(0,2) ===================== */
  root = null; child = null;
  yield snap({ line: 15, tag: 'test', level: 1, compared: [3],
    narrate: 'Back in sort. end is 3, still > 0.' });
  a[0] = 1; a[3] = 6;
  yield snap({ line: 16, tag: 'swap', level: 1, active: [0, 3],
    narrate: '6 and 1 trade places. 6 lands at index 3.' });
  end = 2;
  yield snap({ line: 17, tag: 'assign', hot: 'end', level: 1,
    narrate: 'end moves to 2. 6 is placed — green in the array, gone from the tree. Three values left in the heap.' });
  yield snap({ line: 18, tag: 'call', level: 1,
    narrate: 'sort calls siftDown for the root with end = 2.' });

  root = 0;
  yield snap({ line: 2, tag: 'test', level: 2, compared: [0],
    narrate: "The root's left child is at index 1, and 1 <= 2." });
  child = 1;
  yield snap({ line: 3, tag: 'assign', hot: 'child', level: 2, compared: [1],
    narrate: 'child = 1, holding 4.' });
  yield snap({ line: 4, tag: 'test', level: 2, compared: [1, 2],
    narrate: 'Index 1 holds 4, index 2 holds 2. 2 > 4 is false, so child stays at the left child, 4.' });
  yield snap({ line: 6, tag: 'test', level: 2, compared: [0, 1],
    narrate: 'a[1] is 4 and a[root] = a[0] is 1. 4 > 1, so the root sinks.' });
  a[0] = 4; a[1] = 1;
  yield snap({ line: 7, tag: 'swap', level: 2, active: [0, 1],
    narrate: '4 and 1 trade places. 1 drops to index 1.' });
  root = 1;
  yield snap({ line: 8, tag: 'assign', hot: 'root', level: 2, compared: [1],
    narrate: 'root follows the 1 down to index 1.' });
  yield snap({ line: 2, tag: 'test', level: 2, compared: [1],
    narrate: "Index 1's left child would be at index 3, past end = 2. Node 1 has no children in the heap — siftDown is finished." });

  /* ===================== EXTRACTION 4 : root 4 -> [2], siftDown(0,1) NO SWAP ===================== */
  root = null; child = null;
  yield snap({ line: 15, tag: 'test', level: 1, compared: [2],
    narrate: 'Back in sort. end is 2, still > 0.' });
  a[0] = 2; a[2] = 4;
  yield snap({ line: 16, tag: 'swap', level: 1, active: [0, 2],
    narrate: '4 and 2 trade places. 4 lands at index 2.' });
  end = 1;
  yield snap({ line: 17, tag: 'assign', hot: 'end', level: 1,
    narrate: 'end moves to 1. 4 is placed. Only two values are left in the heap.' });
  yield snap({ line: 18, tag: 'call', level: 1,
    narrate: 'sort calls siftDown for the root with end = 1.' });

  root = 0;
  yield snap({ line: 2, tag: 'test', level: 2, compared: [0],
    narrate: "The root's left child is at 0*2+1 = 1, and 1 <= 1 — there is one child." });
  child = 1;
  yield snap({ line: 3, tag: 'assign', hot: 'child', level: 2, compared: [1],
    narrate: 'child = 1 — the only child, holding 1.' });
  yield snap({ line: 4, tag: 'test', level: 2, compared: [1],
    narrate: 'Index 2 is past end = 1, so there is no right child (2 <= 1 is false). The only candidate is index 1.' });
  yield snap({ line: 6, tag: 'test', level: 2, compared: [0, 1],
    narrate: 'a[1] is 1 and a[root] = a[0] is 2. 1 > 2 is false — the parent is already bigger.' });
  yield snap({ line: 10, tag: 'return', level: 2, compared: [0], note: NO_SWAP_NOTE,
    narrate: '2 is already bigger than its only child. Nothing moves, and siftDown returns.' });

  /* ===================== EXTRACTION 5 : root 2 -> [1], degenerate end -> 0 ===================== */
  root = null; child = null;
  yield snap({ line: 15, tag: 'test', level: 1, compared: [1],
    narrate: 'Back in sort. end is 1, and 1 > 0 — one more extraction.' });
  a[0] = 1; a[1] = 2;
  yield snap({ line: 16, tag: 'swap', level: 1, active: [0, 1],
    narrate: '2 and 1 trade places. 2 lands at index 1.' });
  end = 0;
  yield snap({ line: 17, tag: 'assign', hot: 'end', level: 1,
    narrate: 'end moves to 0. 2 is placed — green in the array, gone from the tree.' });

  // The loop test fails; a[0] is placed by elimination on this same step.
  zeroPlaced = true;
  yield snap({ line: 15, tag: 'test', level: 1, compared: [0], note: DEGENERATE_NOTE,
    narrate: 'end is 0, so end > 0 is false and the loop stops. One value is left in the heap, at index 0 — and if it is the only one left, it must be the smallest. It is already where it belongs, so 1 turns green and the last node leaves the tree.' });

  // FINAL — sort returns to main; the array is sorted.
  yield snap({ line: 21, tag: 'return', level: 0, note: FINAL_NOTE,
    narrate: 'The array is sorted: 1 2 4 6 8 9. The tree is empty — every value has been placed, and no second array was ever used.' });
}

export default {
  title: 'Heapsort: emptying the heap',
  subtitle: 'The sorted part grows as the heap shrinks',
  profile: 'standard',
  columns: 2,
  languages: ['pseudo', 'cpp', 'java'],

  // Same five panels as part 1. The array (6 cells) and the tree are BOTH
  // structure panels and both fit within a row, so the engine sits them SIDE BY
  // SIDE — that correspondence, and the tree shrinking while the array does not,
  // is the point. The code panel anchors the left column; the compact Variables
  // strip and the Function calls stack flow down beside/below. Everything
  // resolves once on load and holds, so nothing moves as steps advance
  // (pac.verifyHeights()).
  panels: [
    { type: 'code',      id: 'code',  title: 'heapsort',
      listings: LISTINGS, labels: { pseudo: 'pseudocode', cpp: 'C++', java: 'Java' } },
    { type: 'cells',     id: 'array', title: 'the array', structure: true },
    { type: 'nodes',     id: 'tree',  title: 'the heap as a tree', structure: true },
    { type: 'cells',     id: 'vars',  title: 'Variables', compact: true },
    { type: 'callstack', id: 'calls', title: 'Function calls' },
  ],

  initialTrace: 'run',
  traces: {
    run: trace,
  },
};
