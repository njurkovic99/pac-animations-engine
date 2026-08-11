/* ds — "Deleting from a binary search tree" (part of the A11 split: insert /
 * traversals / delete; this is the hard one).
 *
 * Built around the instructor's reframing: "It helps to think of deletion as
 * 'replacement by another node', because what are you left with if you truly
 * 'delete' a node -- bunch of hanging pointers and a broken tree!" That sentence is
 * the animation. It is SHOWN, not asserted: the naive delete runs FIRST and breaks
 * the tree (the memory-danger marker on the orphaned subtree), and only then are the
 * two legitimate replacements traced -- BOTH of them, because the symmetry is the
 * point. A BST has exactly two nodes adjacent in value to the one removed, one on
 * each side: the rightmost of the left subtree (18) and the leftmost of the right
 * subtree (21). The lecture's text derives the first; its diagram takes the second.
 *
 * Reuses heap-is-this-valid's shape: a NODES tree whose EVERY position is present
 * from step 0 with a fixed parent structure, so the layout resolves once and nodes
 * never move (values move between fixed positions; a removed node's position becomes
 * an empty `pending` ghost). And its driver shape: main() calls the operation three
 * times, each on a freshly rebuilt tree, exactly as isValidHeap is called five
 * times. NO NEW ENGINE CAPABILITY.
 *
 * NOTE ON THE TREE: the lecture's diagram (section 2 of the build slate) has TWELVE
 * nodes, not eleven -- 10; 5,20; 3,8,18,25; 7,23,30; 21,24. Node 7 (8's left child,
 * in the left subtree) is context only; it plays no role in deleting 20. Built to
 * the diagram, since the tree states must match it.
 *
 * The deleted node is 20 (two children -- the hard case). Three passes:
 *   deleteNaive(20)      -- cut 10's right link; 20 and its whole subtree orphan (⚠)
 *   deleteUsingLeft(20)  -- rightmostOfLeft(20) = 18 (18 has no right child)
 *   deleteUsingRight(20) -- leftmostOfRight(20) = 21 (25 -> 23 -> 21, a leaf)
 * Lines 7 and 13 are mirror images (right_pt vs left_pt); detach is one step on
 * purpose (the re-linking is mechanical and is the closing challenge). */

/* One listing, three ds languages, line-aligned to a single 32-line grid so `line`
 * is a plain number resolving the same in every language. Pseudocode uses the CARET
 * for dereference (AUTHORING.md item 82). `find` (lines 2/18/24) and `detach` (lines
 * 20/26) are deliberately single abstracted operations -- the animation is about
 * WHICH node, not how to unhook it. Blank lines: 4, 10, 16, 22, 28. */
const LISTINGS = {
  pseudo: [
    'deleteNaive(target)',                                //  1
    '   find node_pt = target, parent_pt = its parent',   //  2
    '   parent_pt^.right_pt = nil',                        //  3
    '',                                                   //  4
    'rightmostOfLeft(node_pt)',                           //  5
    '   r_pt = node_pt^.left_pt',                         //  6
    '   while r_pt^.right_pt <> nil',                     //  7
    '      r_pt = r_pt^.right_pt',                        //  8
    '   return r_pt',                                     //  9
    '',                                                   // 10
    'leftmostOfRight(node_pt)',                           // 11
    '   l_pt = node_pt^.right_pt',                        // 12
    '   while l_pt^.left_pt <> nil',                      // 13
    '      l_pt = l_pt^.left_pt',                         // 14
    '   return l_pt',                                     // 15
    '',                                                   // 16
    'deleteUsingLeft(target)',                            // 17
    '   find node_pt = target',                           // 18
    '   repl_pt = rightmostOfLeft(node_pt)',              // 19
    '   detach repl_pt from its parent',                  // 20
    '   node_pt^.number = repl_pt^.number',               // 21
    '',                                                   // 22
    'deleteUsingRight(target)',                           // 23
    '   find node_pt = target',                           // 24
    '   repl_pt = leftmostOfRight(node_pt)',              // 25
    '   detach repl_pt from its parent',                  // 26
    '   node_pt^.number = repl_pt^.number',               // 27
    '',                                                   // 28
    'main()',                                             // 29
    '   deleteNaive(20)',                                 // 30
    '   deleteUsingLeft(20)',                             // 31
    '   deleteUsingRight(20)',                            // 32
  ],
  cpp: [
    'Node* deleteNaive(int target) {',                    //  1
    '   // find node_pt and its parent',                  //  2
    '   parent_pt->right_pt = nullptr;',                  //  3
    '',                                                   //  4
    'Node* rightmostOfLeft(Node* node_pt) {',             //  5
    '   r_pt = node_pt->left_pt;',                        //  6
    '   while (r_pt->right_pt != nullptr)',               //  7
    '      r_pt = r_pt->right_pt;',                       //  8
    '   return r_pt; }',                                  //  9
    '',                                                   // 10
    'Node* leftmostOfRight(Node* node_pt) {',             // 11
    '   l_pt = node_pt->right_pt;',                       // 12
    '   while (l_pt->left_pt != nullptr)',                // 13
    '      l_pt = l_pt->left_pt;',                        // 14
    '   return l_pt; }',                                  // 15
    '',                                                   // 16
    'void deleteUsingLeft(int target) {',                 // 17
    '   // find node_pt = target',                        // 18
    '   repl_pt = rightmostOfLeft(node_pt);',             // 19
    '   // detach repl_pt from its parent',               // 20
    '   node_pt->number = repl_pt->number; }',            // 21
    '',                                                   // 22
    'void deleteUsingRight(int target) {',                // 23
    '   // find node_pt = target',                        // 24
    '   repl_pt = leftmostOfRight(node_pt);',             // 25
    '   // detach repl_pt from its parent',               // 26
    '   node_pt->number = repl_pt->number; }',            // 27
    '',                                                   // 28
    'int main() {',                                       // 29
    '   deleteNaive(20);',                                // 30
    '   deleteUsingLeft(20);',                            // 31
    '   deleteUsingRight(20); }',                         // 32
  ],
  java: [
    'Node deleteNaive(int target) {',                     //  1
    '   // find node_pt and its parent',                  //  2
    '   parent_pt.right_pt = null;',                      //  3
    '',                                                   //  4
    'Node rightmostOfLeft(Node node_pt) {',               //  5
    '   r_pt = node_pt.left_pt;',                         //  6
    '   while (r_pt.right_pt != null)',                   //  7
    '      r_pt = r_pt.right_pt;',                        //  8
    '   return r_pt; }',                                  //  9
    '',                                                   // 10
    'Node leftmostOfRight(Node node_pt) {',               // 11
    '   l_pt = node_pt.right_pt;',                        // 12
    '   while (l_pt.left_pt != null)',                    // 13
    '      l_pt = l_pt.left_pt;',                         // 14
    '   return l_pt; }',                                  // 15
    '',                                                   // 16
    'void deleteUsingLeft(int target) {',                 // 17
    '   // find node_pt = target',                        // 18
    '   repl_pt = rightmostOfLeft(node_pt);',             // 19
    '   // detach repl_pt from its parent',               // 20
    '   node_pt.number = repl_pt.number; }',              // 21
    '',                                                   // 22
    'void deleteUsingRight(int target) {',                // 23
    '   // find node_pt = target',                        // 24
    '   repl_pt = leftmostOfRight(node_pt);',             // 25
    '   // detach repl_pt from its parent',               // 26
    '   node_pt.number = repl_pt.number; }',              // 27
    '',                                                   // 28
    'void main() {',                                      // 29
    '   deleteNaive(20);',                                // 30
    '   deleteUsingLeft(20);',                            // 31
    '   deleteUsingRight(20); }',                         // 32
  ],
};

/* The twelve tree positions -- a FIXED parent structure passed on every step, so
 * the layout resolves once and nodes never move (heap-is-this-valid's trick). Left
 * child is listed before right child so the tree lays out left-to-right. A position
 * whose value is null renders as a faint `pending` ghost with no edge. */
const POS = [
  { id: 'p10', parent: null,  home: 10 },
  { id: 'p5',  parent: 'p10', home: 5  },
  { id: 'p20', parent: 'p10', home: 20 },
  { id: 'p3',  parent: 'p5',  home: 3  },
  { id: 'p8',  parent: 'p5',  home: 8  },
  { id: 'p18', parent: 'p20', home: 18 },
  { id: 'p25', parent: 'p20', home: 25 },
  { id: 'p7',  parent: 'p8',  home: 7  },
  { id: 'p23', parent: 'p25', home: 23 },
  { id: 'p30', parent: 'p25', home: 30 },
  { id: 'p21', parent: 'p23', home: 21 },
  { id: 'p24', parent: 'p23', home: 24 },
];

/* Left/right children of the intact tree, for driving the two walks. */
const LEFT  = { p10: 'p5', p5: 'p3', p20: 'p18', p8: 'p7', p25: 'p23', p23: 'p21' };
const RIGHT = { p10: 'p20', p5: 'p8', p20: 'p25', p25: 'p30', p23: 'p24' };

/* The subtree rooted at 20 -- everything the naive cut orphans. */
const SUBTREE_20 = ['p20', 'p18', 'p25', 'p23', 'p30', 'p21', 'p24'];

/* ---- teaching notes (AUTHORING.md "Steps vs. notes"), the instructor's framing ---- */
const OPEN = [
  'We are going to delete 20. It has two children — 18 on the left, 25 on the right — ' +
  'and that is what makes this hard. Before the algorithm, watch what happens if you do ' +
  'the obvious thing. ',
  { href: 'trees-bst-insert.html', text: 'See how this tree was built' },
];

const BREAK =
  'This is the lecture’s point, made concrete: what are you left with if you truly delete ' +
  'a node? A bunch of hanging pointers and a broken tree. 20 was not a value sitting in a ' +
  'box — it was a junction. Removing it removed the only route to everything below it. ' +
  'So deletion is not removal. It is REPLACEMENT: something else has to stand where 20 stood.';

const REQUIREMENTS =
  'What can stand there? Two things must hold. ONE: the ordering must survive. Whatever goes ' +
  'in 20’s place must still be larger than everything in its left subtree and smaller than ' +
  'everything in its right. TWO: taking that node out of ITS current place must not break ' +
  'anything either — or we have just moved the problem. Because a BST is symmetric, there ' +
  'are two answers, and we will trace both.';

const RIGHTMOST =
  '“Rightmost” means: go left once, then right as far as you can. Here the left subtree is a ' +
  'single node, so the walk is over immediately. Why RIGHTMOST? Because it must be the LARGEST ' +
  'value in the left subtree. Pick anything smaller and some left-subtree node would end up ' +
  'above its own parent — the ordering breaks. The largest node in any BST is the one you ' +
  'reach by going right until you cannot.';

const CHEAPEST =
  'And this is the second requirement, satisfied for free. Rightmost means we walked until a ' +
  'nil pointer — so this node has NO right child. It has at most one child, on the left, which ' +
  'is easy to reattach. That is why the extreme node is chosen: not just because it has the ' +
  'right value, but because it is the cheapest one to take.';

const LEFT_OK =
  'Check the ordering: 18 is larger than everything that was in 20’s left subtree — there is ' +
  'nothing left there — and smaller than 25, 23, 30, 21 and 24 on the right. Still a valid ' +
  'search tree.';

const MIRROR =
  'The mirror image of the other walk: go right once, then left as far as you can. Line 13 is ' +
  'line 7 with left and right swapped, and nothing else differs.';

const SYMMETRY =
  '21 is three levels down, on the opposite side of the tree from 18 — and both are correct. ' +
  'That is the symmetry: it is not about which is nearer, it is that a BST has exactly two ' +
  'nodes adjacent in value to the one being removed, one on each side. And look at 21: it is a ' +
  'LEAF. Nothing hangs off it at all, so detaching it costs nothing. The lecture asks why ' +
  'having at most one descendant is not a problem — this is the answer in the easiest form.';

const CLOSING =
  'Everything followed from one sentence: you cannot remove a node, you can only replace it. ' +
  'The rest was working out what is allowed to stand there. Two things worth doing yourself. ' +
  'The detach step was shown as a single move. Work out what it actually takes: the ' +
  'replacement’s parent needs a new link, and if the replacement has a child, that child needs ' +
  'somewhere to go. There are only two cases and both are short — but this is where the ' +
  'implementation actually lives. And what if the node being deleted has ONE child, or NONE? ' +
  'Neither needs a search at all. Trace deleting 30, and then deleting 5.';

function* trace() {
  // Live model. `val` is the value at each position (null = empty ghost); `cut` are
  // positions whose edge to their parent is not drawn; `amber` are positions
  // rendered `unlinked` (detached, not members). The three pointer variables carry
  // display values set explicitly, decoupled from the tree so a consumed node's
  // pointer still reads correctly.
  let val, cut, amber, vNode, vRepl, vParent;
  const reset = () => {
    val = {}; for (const p of POS) val[p.id] = p.home;
    cut = new Set(); amber = new Set();
    vNode = null; vRepl = null; vParent = null;
  };

  /* The tree: all twelve positions every step (fixed layout). A filled position is
   * a neutral `idle` node, amber `unlinked` when detached this pass, blue `active`
   * when touched this step. An emptied position is a faint `pending` ghost. Edges
   * are drawn only between two filled, still-linked positions. */
  const treePanel = (active) => {
    const nodes = POS.map(p => {
      if (val[p.id] == null) return { id: p.id, parent: p.parent, label: '', state: 'pending' };
      return {
        id: p.id, parent: p.parent, label: String(val[p.id]),
        state: amber.has(p.id) ? 'unlinked' : 'idle',
        active: active.includes(p.id),
      };
    });
    const edges = POS.filter(p => p.parent).flatMap(p =>
      (val[p.id] != null && val[p.parent] != null && !cut.has(p.id))
        ? [{ from: p.parent, to: p.id, state: '' }] : []);
    return { layout: 'tree', edges, nodes };
  };

  /* Compact pointer strip: node_pt, repl_pt, parent_pt. A pointer with no value
   * shows the placeholder X; the one written this step takes the blue fill. */
  const varsPanel = (hot) => ({
    render: 'row',
    cells: [
      { label: 'node_pt',   value: vNode   == null ? '' : vNode,   role: vNode   == null ? 'empty' : (hot === 'node'   ? 'active' : undefined), minCh: 3 },
      { label: 'repl_pt',   value: vRepl   == null ? '' : vRepl,   role: vRepl   == null ? 'empty' : (hot === 'repl'   ? 'active' : undefined), minCh: 3 },
      { label: 'parent_pt', value: vParent == null ? '' : vParent, role: vParent == null ? 'empty' : (hot === 'parent' ? 'active' : undefined), minCh: 3 },
    ],
  });

  const snap = ({ line, tag, narrate, note, active = [], hot = null, parked = [] }) => ({
    line, tag, narrate, note, parked,
    panels: { tree: treePanel(active), vars: varsPanel(hot) },
  });

  /* ================================ the trace ================================ */

  // STEP 0 — the full tree, nothing executed.
  reset();
  yield snap({ line: null, tag: 'init', note: OPEN,
    narrate: "A binary search tree. Every node's left subtree holds smaller values, every right subtree larger." });

  /* ---------- PASS 1: deleteNaive — the break ---------- */
  yield snap({ line: 30, tag: 'call',
    narrate: 'main calls deleteNaive(20). Control enters deleteNaive next.' });

  vNode = 20; vParent = 10;
  yield snap({ line: 2, tag: 'find', active: ['p20', 'p10'], hot: 'node', parked: [30],
    narrate: 'Find the node: from the root, 20 > 10 so go right — there it is. node_pt is 20, and parent_pt is its parent, 10.' });

  cut.add('p20'); SUBTREE_20.forEach(id => amber.add(id));
  yield snap({ line: 3, tag: 'cut', active: ['p20'], parked: [30], note: BREAK,
    narrate: [
      'One assignment, and 20 is gone from the tree. ',
      { danger: true, text: 'So are six other nodes — 18, 25, 23, 30, 21 and 24 are unreachable. Nothing points at them any more.' },
    ] });

  yield snap({ line: 30, tag: 'return', note: REQUIREMENTS,
    narrate: 'deleteNaive returns to main, leaving the tree broken. That is exactly why the real algorithm never does this.' });

  /* ---------- PASS 2: deleteUsingLeft — rightmost of the left subtree (18) ---------- */
  reset();
  yield snap({ line: 31, tag: 'call',
    narrate: 'The tree is rebuilt so we can try again — this is a demonstration, not a program you would write. main calls deleteUsingLeft(20).' });

  vNode = 20;
  yield snap({ line: 18, tag: 'find', active: ['p20'], hot: 'node', parked: [31],
    narrate: 'node_pt is 20 again — the node we want to delete.' });

  yield snap({ line: 19, tag: 'call', active: ['p20'], parked: [31],
    narrate: 'To find a legal replacement, call rightmostOfLeft on 20.' });

  yield snap({ line: 6, tag: 'walk', active: ['p18'], parked: [31, 19],
    narrate: "r_pt starts at 20's left child — 18." });

  yield snap({ line: 7, tag: 'test', active: ['p18'], parked: [31, 19], note: RIGHTMOST,
    narrate: '18 has no right child, so 18 is already the rightmost of this subtree. The walk ends before it starts.' });

  vRepl = 18;
  yield snap({ line: 9, tag: 'return', active: ['p18'], hot: 'repl', parked: [31],
    narrate: 'rightmostOfLeft returns 18. repl_pt is 18 — the value that will replace 20.' });

  cut.add('p18'); amber.add('p18');
  yield snap({ line: 20, tag: 'detach', active: ['p18'], parked: [31], note: CHEAPEST,
    narrate: "Detach 18 from its parent. 20's left link goes nil — and 18 had no children of its own, so nothing else has to move." });

  val.p20 = 18; val.p18 = null; vNode = 18;
  yield snap({ line: 21, tag: 'assign', active: ['p20'], hot: 'node', parked: [31], note: LEFT_OK,
    narrate: '18 moves up into 20’s place. Nothing else in the tree changes.' });

  yield snap({ line: 31, tag: 'return',
    narrate: 'deleteUsingLeft returns. 18 sits where 20 was, and it is still a valid search tree.' });

  /* ---------- PASS 3: deleteUsingRight — leftmost of the right subtree (21) ---------- */
  reset();
  yield snap({ line: 32, tag: 'call',
    narrate: 'The tree is rebuilt once more. main calls deleteUsingRight(20) — the mirror-image choice.' });

  vNode = 20;
  yield snap({ line: 24, tag: 'find', active: ['p20'], hot: 'node', parked: [32],
    narrate: 'node_pt is 20 again.' });

  yield snap({ line: 25, tag: 'call', active: ['p20'], parked: [32],
    narrate: 'This time call leftmostOfRight on 20.' });

  yield snap({ line: 12, tag: 'walk', active: ['p25'], parked: [32, 25],
    narrate: "l_pt starts at 20's right child — 25." });

  yield snap({ line: 13, tag: 'test', active: ['p25'], parked: [32, 25], note: MIRROR,
    narrate: '25 has a left child, 23, so the loop runs — keep going left.' });
  yield snap({ line: 14, tag: 'walk', active: ['p23'], parked: [32, 25],
    narrate: 'l_pt moves to 23.' });

  yield snap({ line: 13, tag: 'test', active: ['p23'], parked: [32, 25],
    narrate: '23 has a left child, 21. Not nil, so keep going.' });
  yield snap({ line: 14, tag: 'walk', active: ['p21'], parked: [32, 25],
    narrate: 'l_pt moves to 21.' });

  yield snap({ line: 13, tag: 'test', active: ['p21'], parked: [32, 25], note: SYMMETRY,
    narrate: '21 has no left child. The walk stops — 21 is the leftmost of 20’s right subtree.' });

  vRepl = 21;
  yield snap({ line: 15, tag: 'return', active: ['p21'], hot: 'repl', parked: [32],
    narrate: 'leftmostOfRight returns 21. repl_pt is 21.' });

  cut.add('p21'); amber.add('p21');
  yield snap({ line: 26, tag: 'detach', active: ['p21'], parked: [32],
    narrate: 'Detach 21 — and it is a leaf, so nothing hangs off it. The cheapest possible node to take.' });

  val.p20 = 21; val.p21 = null; vNode = 21;
  yield snap({ line: 27, tag: 'assign', active: ['p20'], hot: 'node', parked: [32],
    narrate: '21 moves up. The tree matches the lecture’s result exactly.' });

  yield snap({ line: 32, tag: 'return', note: CLOSING,
    narrate: 'Two replacements, both valid, both leaving a correct search tree.' });
}

export default {
  title: 'Deleting from a search tree',
  subtitle: 'You cannot remove a node — you can only replace it',
  profile: 'standard',
  columns: 2,

  languages: ['pseudo', 'cpp', 'java'],

  // Three panels. The tree is the structure and needs the room, so there is no
  // CALLSTACK — but main's call line is parked (dimmed) while control is inside a
  // function, and the whole caller chain dims when a helper is running. Everything
  // resolves once on load and holds (pac.verifyHeights()).
  panels: [
    { type: 'code',  id: 'code', title: 'BST delete',
      listings: LISTINGS, labels: { pseudo: 'pseudocode', cpp: 'C++', java: 'Java' } },
    { type: 'nodes', id: 'tree', title: 'The search tree', structure: true },
    { type: 'cells', id: 'vars', title: 'Pointer variables', compact: true },
  ],

  initialTrace: 'run',
  traces: {
    run: trace,
  },
};
