/* ds — "Inserting into a binary search tree" (A11 split, part 1). The PREQUEL to
 * trees-bst-delete.
 *
 * The lecture's claim: insertion is a search that fails. "How do you search the tree
 * for some content? ... If item is not in the tree, you will eventually run up
 * against a nil pointer. Tree insertion should follow from the above -- once you
 * 'find' the first nil pointer, replace it with the node being inserted." The walk
 * that FAILS to find something is the walk that finds where it belongs; a search and
 * an insert are the same journey, and only the last step differs.
 *
 * Shown, not asserted: three walks back to back on the lecture's own tree --
 * search(R) succeeds, search(T) fails on a nil pointer, and insert(T) walks the
 * identical route and puts T on exactly that nil. search is RECURSIVE (as the
 * lecture states), so the CALLSTACK shows the descent; insert mirrors search line
 * for line (lines 20-23 ARE lines 6-9). Each comparison throws away a whole subtree,
 * which DIMS -- the lecture's grey "nodes that cannot match the search key".
 *
 * Reuses trees-bst-delete's NODES tree with a FIXED all-positions layout, so nodes
 * never move. T's position is present from step 0 as an unremarkable empty ghost, so
 * nothing moves when T arrives. NO NEW ENGINE CAPABILITY. No memory-danger marker --
 * nothing here leaks or corrupts. The final note links forward to the delete. */

/* One listing, three ds languages, line-aligned to a single 28-line grid so `line`
 * is a plain number resolving the same in every language. Pseudocode uses the CARET
 * for dereference (AUTHORING.md item 82). NO COMMENT is the longest line in any
 * listing (item 88a) -- there are no comments at all. Blank lines: 10, 24. */
const LISTINGS = {
  pseudo: [
    'search(root_pt, key)',                                  //  1
    '   if root_pt = nil',                                   //  2
    '      return nil',                                      //  3
    '   if key = root_pt^.number',                           //  4
    '      return root_pt',                                  //  5
    '   if key < root_pt^.number',                           //  6
    '      return search(root_pt^.left_pt, key)',            //  7
    '   else',                                               //  8
    '      return search(root_pt^.right_pt, key)',           //  9
    '',                                                      // 10
    'insert(root_pt, key)',                                  // 11
    '   if root_pt^.left_pt = nil and key < root_pt^.number',// 12
    '      new(root_pt^.left_pt)',                           // 13
    '      root_pt^.left_pt^.number = key',                  // 14
    '      return',                                          // 15
    '   if root_pt^.right_pt = nil and key > root_pt^.number',// 16
    '      new(root_pt^.right_pt)',                          // 17
    '      root_pt^.right_pt^.number = key',                 // 18
    '      return',                                          // 19
    '   if key < root_pt^.number',                           // 20
    '      insert(root_pt^.left_pt, key)',                   // 21
    '   else',                                               // 22
    '      insert(root_pt^.right_pt, key)',                  // 23
    '',                                                      // 24
    'main()',                                                // 25
    "   search(root_pt, 'R')",                               // 26
    "   search(root_pt, 'T')",                               // 27
    "   insert(root_pt, 'T')",                               // 28
  ],
  cpp: [
    'Node* search(Node* root_pt, char key) {',               //  1
    '   if (root_pt == nullptr)',                            //  2
    '      return nullptr;',                                 //  3
    '   if (key == root_pt->number)',                        //  4
    '      return root_pt;',                                 //  5
    '   if (key < root_pt->number)',                         //  6
    '      return search(root_pt->left_pt, key);',           //  7
    '   else',                                               //  8
    '      return search(root_pt->right_pt, key); }',        //  9
    '',                                                      // 10
    'void insert(Node* root_pt, char key) {',                // 11
    '   if (root_pt->left_pt == nullptr && key < root_pt->number) {', // 12
    '      root_pt->left_pt = new Node;',                    // 13
    '      root_pt->left_pt->number = key;',                 // 14
    '      return; }',                                       // 15
    '   if (root_pt->right_pt == nullptr && key > root_pt->number) {', // 16
    '      root_pt->right_pt = new Node;',                   // 17
    '      root_pt->right_pt->number = key;',                // 18
    '      return; }',                                       // 19
    '   if (key < root_pt->number)',                         // 20
    '      insert(root_pt->left_pt, key);',                  // 21
    '   else',                                               // 22
    '      insert(root_pt->right_pt, key); }',               // 23
    '',                                                      // 24
    'int main() {',                                          // 25
    "   search(root_pt, 'R');",                              // 26
    "   search(root_pt, 'T');",                              // 27
    "   insert(root_pt, 'T'); }",                            // 28
  ],
  java: [
    'Node search(Node root_pt, char key) {',                 //  1
    '   if (root_pt == null)',                               //  2
    '      return null;',                                    //  3
    '   if (key == root_pt.number)',                         //  4
    '      return root_pt;',                                 //  5
    '   if (key < root_pt.number)',                          //  6
    '      return search(root_pt.left_pt, key);',            //  7
    '   else',                                               //  8
    '      return search(root_pt.right_pt, key); }',         //  9
    '',                                                      // 10
    'void insert(Node root_pt, char key) {',                 // 11
    '   if (root_pt.left_pt == null && key < root_pt.number) {', // 12
    '      root_pt.left_pt = new Node();',                   // 13
    '      root_pt.left_pt.number = key;',                   // 14
    '      return; }',                                       // 15
    '   if (root_pt.right_pt == null && key > root_pt.number) {', // 16
    '      root_pt.right_pt = new Node();',                  // 17
    '      root_pt.right_pt.number = key;',                  // 18
    '      return; }',                                       // 19
    '   if (key < root_pt.number)',                          // 20
    '      insert(root_pt.left_pt, key);',                   // 21
    '   else',                                               // 22
    '      insert(root_pt.right_pt, key); }',                // 23
    '',                                                      // 24
    'void main() {',                                         // 25
    "   search(root_pt, 'R');",                              // 26
    "   search(root_pt, 'T');",                              // 27
    "   insert(root_pt, 'T'); }",                            // 28
  ],
};

/* The lecture's tree (trees_3.jpg), a FIXED parent structure passed on every step so
 * the layout resolves once and nodes never move. Left child before right child so
 * the tree lays out left-to-right. T's position (pT, X's left child) is present from
 * step 0 as an empty ghost. */
const POS = [
  { id: 'pS', parent: null, home: 'S' },
  { id: 'pE', parent: 'pS', home: 'E' },
  { id: 'pX', parent: 'pS', home: 'X' },
  { id: 'pA', parent: 'pE', home: 'A' },
  { id: 'pR', parent: 'pE', home: 'R' },
  { id: 'pC', parent: 'pA', home: 'C' },  // A's right child (A < C)
  { id: 'pH', parent: 'pR', home: 'H' },  // R's left child  (H < R)
  { id: 'pM', parent: 'pH', home: 'M' },  // H's right child (H < M)
  { id: 'pT', parent: 'pX', home: null }, // X's left child, inserted (T < X)
];

/* Children of each node, for eliminating the subtree a comparison rules out. */
const KIDS = { pS: ['pE', 'pX'], pE: ['pA', 'pR'], pX: ['pT'], pA: ['pC'], pR: ['pH'], pH: ['pM'] };
const subtree = id => [id, ...(KIDS[id] ?? []).flatMap(subtree)];

/* ---- teaching notes (AUTHORING.md "Steps vs. notes"), the instructor's framing ---- */
const OPEN =
  'That one rule is what makes a search cheap: at every node you compare once and ' +
  'throw away half of what is left. Watch how much of the tree each comparison eliminates.';

const ELIMINATE =
  'One comparison and the entire right side is gone — not searched and rejected, never ' +
  'looked at. That is what the ordering buys.';

const MISS =
  'The lecture’s words: if the item is not in the tree, you will eventually run up against ' +
  'a nil pointer. That is what a failed search always ends in — not a wrong answer, an ' +
  'absence. Now look at WHERE it stopped. Everything on the route said T belongs this way; ' +
  'the walk only stopped because there was nothing further to follow. Hold that thought for ' +
  'the next call.';

const PAYOFF =
  'This is the whole idea. The search for T walked to exactly the spot where T belongs, ' +
  'because the rule that guides a search is the same rule that decides where a node goes. A ' +
  'failed search does not waste the walk; it hands you the insertion point. And look at ' +
  'lines 20 to 23 against lines 6 to 9 — the recursive step is identical. insert IS search, ' +
  'with something to do when it falls off the end.';

const CLOSING = [
  'Check the tree still holds: everything left of S is smaller, everything right is larger, ' +
  'and the same at every node below. T sits left of X because T comes before X, and right of ' +
  'S because it comes after S — both true at once, which is exactly what its position means. ' +
  'Two things worth working out. What happens if you insert a key that is ALREADY in the ' +
  'tree — trace inserting R, and decide what your program should do about it. And build the ' +
  'whole tree yourself from an empty one: insert S, E, X, A, R, C, H, M in that order and see ' +
  'if you get this tree back. Then try inserting them in alphabetical order and see what you get. ',
  { href: 'trees-bst-delete.html', text: 'See how a node is removed' },
];

function* trace() {
  // Live model. `val` is the letter at each position (null = empty ghost); `dim` are
  // positions ruled out by a comparison (rendered faint, the lecture's grey nodes);
  // `tState` tracks the inserted node: 'ghost' (empty, no edge), 'alloc' (allocated,
  // value indeterminate -- amber outline, empty), 'filled' ('T', settled).
  let val, dim, tState;
  const reset = () => {
    val = {}; for (const p of POS) val[p.id] = p.home;
    dim = new Set(); tState = 'ghost';
  };

  /* The tree: all nine positions every step (fixed layout). A live node is neutral
   * `idle`, blue `active` when the walk sits on it, faint `pending` when ruled out.
   * pT is a `pending` ghost until allocated, an amber `unlinked` empty box while its
   * value is indeterminate (line 13), then `idle` 'T' (line 14). Edges are drawn
   * only between two positions that both hold a value (pT's edge appears when it is
   * allocated), so a ghost floats unconnected and nothing moves when T arrives. */
  const treePanel = (active) => {
    const nodes = POS.map(p => {
      if (p.id === 'pT') {
        if (tState === 'ghost') return { id: 'pT', parent: 'pX', label: '', state: 'pending' };
        if (tState === 'alloc') return { id: 'pT', parent: 'pX', label: '', state: 'unlinked', active: active === 'pT' };
        return { id: 'pT', parent: 'pX', label: 'T', state: 'idle', active: active === 'pT' };
      }
      return {
        id: p.id, parent: p.parent, label: String(val[p.id]),
        state: dim.has(p.id) ? 'pending' : 'idle',
        active: active === p.id,
      };
    });
    const filled = id => id === 'pT' ? tState !== 'ghost' : val[id] != null;
    const edges = POS.filter(p => p.parent).flatMap(p =>
      (filled(p.id) && filled(p.parent)) ? [{ from: p.parent, to: p.id, state: '' }] : []);
    return { layout: 'tree', edges, nodes };
  };

  /* CALLSTACK ("Function calls"): search/insert recurse, so the frames show the
   * descent. Each frame binds root_pt (the node this call is looking at, or nil) and
   * key. `call` is the call-site line a caller frame is parked at while a deeper call
   * runs. The running (top) frame is emphasized. */
  const callsPanel = (frames) => ({
    frames: frames.map((f, i) => ({
      fn: f.fn,
      // main is the bottom driver -- no parameters, so it renders as `main()`.
      vars: f.fn === 'main' ? [] : [
        { name: 'root_pt', value: f.node, role: f.hot ? 'active' : undefined },
        { name: 'key', value: f.key },
      ],
      active: i === frames.length - 1,
    })),
  });

  const snap = ({ line, tag, narrate, note, active = null, frames = [] }) => ({
    line, tag, narrate, note,
    parked: frames.slice(0, -1).map(f => f.call).filter(v => v != null),
    panels: { tree: treePanel(active), calls: callsPanel(frames) },
  });

  // Frame builders. `node` is the letter the call is looking at (or 'nil'); `call` is
  // the line it is parked at while a callee runs (set on caller frames only).
  const S = (node, key, call, hot) => ({ fn: 'search', node, key, call, hot });
  const I = (node, key, call, hot) => ({ fn: 'insert', node, key, call, hot });

  /* ================================ the trace ================================ */

  reset();
  // STEP 0 — the tree, T's position an unremarkable ghost, nothing executed.
  yield snap({ line: null, tag: 'init', note: OPEN, frames: [{ fn: 'main', node: '', key: '', call: null }],
    narrate: 'A binary search tree. Every left subtree holds smaller keys, every right subtree larger.' });

  /* ---------- WALK 1: search(R) — the successful search ---------- */
  yield snap({ line: 26, tag: 'call', frames: [{ fn: 'main', node: '', key: '', call: null }],
    narrate: "main calls search(root_pt, 'R'). Control enters search at the root." });

  // search(S, R)
  let fr = [{ fn: 'main', node: '', key: '', call: 26 }, S('S', 'R')];
  yield snap({ line: 4, tag: 'test', active: 'pS', frames: fr,
    narrate: 'At S. Is R equal to S? No.' });
  dim = new Set(subtree('pX'));
  yield snap({ line: 6, tag: 'test', active: 'pS', frames: fr, note: ELIMINATE,
    narrate: 'Is R less than S? Yes — so R can only be to the left. Look left, and the entire right side is out.' });

  // search(E, R)
  fr = [{ fn: 'main', node: '', key: '', call: 26 }, S('S', 'R', 7), S('E', 'R')];
  yield snap({ line: 4, tag: 'test', active: 'pE', frames: fr,
    narrate: 'The recursive call lands at E. Is R equal to E? No.' });
  dim = new Set([...dim, ...subtree('pA')]);
  yield snap({ line: 6, tag: 'test', active: 'pE', frames: fr,
    narrate: 'Is R less than E? No — so R is to the right. Look right, and E’s left subtree (A and C) is out.' });

  // search(R, R) — found
  fr = [{ fn: 'main', node: '', key: '', call: 26 }, S('S', 'R', 7), S('E', 'R', 9), S('R', 'R')];
  yield snap({ line: 5, tag: 'found', active: 'pR', frames: fr,
    narrate: 'The recursive call lands at R. R equals R. Found, in three comparisons out of eight nodes.' });

  /* ---------- WALK 2: search(T) — the unsuccessful search ---------- */
  reset();
  yield snap({ line: 27, tag: 'call', frames: [{ fn: 'main', node: '', key: '', call: null }],
    narrate: "The search returns. Now main calls search(root_pt, 'T') — a key that is not in the tree." });

  // search(S, T)
  fr = [{ fn: 'main', node: '', key: '', call: 27 }, S('S', 'T')];
  yield snap({ line: 4, tag: 'test', active: 'pS', frames: fr,
    narrate: 'At S. Is T equal to S? No.' });
  dim = new Set(subtree('pE'));
  yield snap({ line: 6, tag: 'test', active: 'pS', frames: fr,
    narrate: 'Is T less than S? No — so T is to the right. Look right; the whole left subtree is out.' });

  // search(X, T)
  fr = [{ fn: 'main', node: '', key: '', call: 27 }, S('S', 'T', 9), S('X', 'T')];
  yield snap({ line: 4, tag: 'test', active: 'pX', frames: fr,
    narrate: 'The recursive call lands at X. Is T equal to X? No.' });
  yield snap({ line: 6, tag: 'test', active: 'pX', frames: fr,
    narrate: 'Is T less than X? Yes — look to the left of X.' });

  // search(nil) — miss
  fr = [{ fn: 'main', node: '', key: '', call: 27 }, S('S', 'T', 9), S('X', 'T', 7), S('nil', 'T')];
  yield snap({ line: 2, tag: 'test', frames: fr, note: MISS,
    narrate: 'X has no left child. The recursive call arrives with root_pt = nil — the walk has run out of tree. T is not here.' });
  yield snap({ line: 3, tag: 'return', frames: fr,
    narrate: 'return nil. A failed search does not end in a wrong answer — it ends on a nil pointer.' });

  /* ---------- WALK 3: insert(T) — the payoff ---------- */
  reset();
  yield snap({ line: 28, tag: 'call', frames: [{ fn: 'main', node: '', key: '', call: null }],
    narrate: "Now main calls insert(root_pt, 'T') — the same journey, one more time." });

  // insert(S, T)
  fr = [{ fn: 'main', node: '', key: '', call: 28 }, I('S', 'T')];
  yield snap({ line: 12, tag: 'test', active: 'pS', frames: fr,
    narrate: 'At S. Is S’s left child nil? No — E is there. This is not the spot.' });
  yield snap({ line: 16, tag: 'test', active: 'pS', frames: fr,
    narrate: 'Is S’s right child nil? No — X is there. Not here either.' });
  dim = new Set(subtree('pE'));
  yield snap({ line: 22, tag: 'test', active: 'pS', frames: fr,
    narrate: 'Is T less than S? No — so recurse to the right. Lines 20 to 23 are lines 6 to 9: the same step as the search.' });

  // insert(X, T) — the nil is the answer
  fr = [{ fn: 'main', node: '', key: '', call: 28 }, I('S', 'T', 23), I('X', 'T')];
  yield snap({ line: 12, tag: 'found', active: 'pX', frames: fr, note: PAYOFF,
    narrate: 'The recursive call lands at X. Is X’s left child nil AND T less than X? Yes to both. Same two comparisons, same route — and this time the nil is not a failure. It is the answer.' });

  tState = 'alloc';
  yield snap({ line: 13, tag: 'alloc', active: 'pT', frames: fr,
    narrate: 'new(root_pt^.left_pt) allocates a node as X’s left child. It has a place, but no value yet.' });

  tState = 'filled';
  yield snap({ line: 14, tag: 'assign', active: 'pT', frames: fr,
    narrate: 'root_pt^.left_pt^.number = key. T takes its place as X’s left child.' });

  /* ---------- FINAL ---------- */
  yield snap({ line: 28, tag: 'return', note: CLOSING, frames: [{ fn: 'main', node: '', key: '', call: null }],
    narrate: 'Three comparisons to find where T belongs, and one link to put it there.' });
}

export default {
  title: 'Finding where a node belongs',
  subtitle: 'A search that fails tells you where to insert',
  profile: 'standard',
  columns: 2,

  languages: ['pseudo', 'cpp', 'java'],

  // Three panels. The tree is the structure; the Function calls (CALLSTACK) panel
  // shows the recursive descent (search and insert recurse, reaching 3-4 frames
  // deep); the code anchors the listing. main's call line parks (dims) while control
  // is inside a function, and the whole caller chain dims when a deeper call runs.
  // No arrows, so no adjacency constraint. Everything resolves once (verifyHeights).
  panels: [
    { type: 'code',      id: 'code',  title: 'search / insert',
      listings: LISTINGS, labels: { pseudo: 'pseudocode', cpp: 'C++', java: 'Java' } },
    { type: 'nodes',     id: 'tree',  title: 'The search tree', structure: true },
    { type: 'callstack', id: 'calls', title: 'Function calls' },
  ],

  initialTrace: 'run',
  traces: {
    run: trace,
  },
};
