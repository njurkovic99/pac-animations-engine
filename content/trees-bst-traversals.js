/* ds — "Three ways to walk a tree" (A11 split). The three traversals, and the two
 * payoffs the lecture draws from them.
 *
 * PAYOFF 1 — in-order prints the tree SORTED. "Note the order in which nodes are
 * displayed in an in-order traversal ... we have just 'discovered' another sorting
 * algorithm!" Insert n keys, print in-order, and that is an n log n sort.
 *
 * PAYOFF 2 — post-order on an expression tree gives POSTFIX. "One of the unanswered
 * questions was how to convert infix expression to postfix ... Once you know the
 * different tree traversals, the answer becomes obvious." This closes the loop
 * stacks-postfix-eval (A4) opened, and links back to it.
 *
 * The shape of the lesson: all three traversals are the SAME THREE LINES in three
 * orders -- only the position of `visit` moves (line 3, 10, 17). The three bodies are
 * line-aligned in the listing so a student can see the whole lesson before anything
 * runs, and the difference in output does the arguing.
 *
 * Two trees. TREE 1 is the BST from trees-bst-insert with T in place; it is walked
 * pre-, in-, and post-order. TREE 2 is the lecture's algebraic tree (trees_2.gif),
 * walked post-order for the postfix payoff. The tree changes once, near the end,
 * driven by a real call from main (postorder(expr_pt)), narrated as a deliberate
 * switch. Reuses trees-bst-insert's NODES tree with a FIXED all-positions layout
 * (all nodes present every step, so nothing moves). NO NEW ENGINE CAPABILITY. No
 * memory-danger marker -- a traversal READS, it writes nothing.
 *
 * Node colour: a node takes the blue activity FILL on the step the walk sits on it,
 * and a green OUTLINE (member) once its value has been emitted, so the traversal's
 * progress -- which keys are already out -- is readable at a glance. Membership does
 * not vary here (every node is a permanent member), so the outline channel is free to
 * mark "emitted"; the fill marks "here now". Each traversal starts a fresh walk, so
 * the greening resets when the next traversal begins -- the SAME tree, walked again,
 * which is the lesson. */

/* One listing, three ds languages, line-aligned to a single 23-line grid so `line`
 * is a plain number and the ONLY difference between the three bodies is where `visit`
 * sits: line 3 (pre), line 10 (in), line 17 (post). Pseudocode uses the CARET for
 * dereference (AUTHORING.md item 82); C++ uses -> , Java the dot. No comment is the
 * longest line in any listing (item 88a) -- there are none. Blank lines: 6, 12, 18. */
const LISTINGS = {
  pseudo: [
    'preorder(node_pt)',                    //  1
    '   if node_pt = nil then return',      //  2
    '   visit(node_pt)',                    //  3
    '   preorder(node_pt^.left_pt)',        //  4
    '   preorder(node_pt^.right_pt)',       //  5
    '',                                     //  6
    'inorder(node_pt)',                     //  7
    '   if node_pt = nil then return',      //  8
    '   inorder(node_pt^.left_pt)',         //  9
    '   visit(node_pt)',                    // 10
    '   inorder(node_pt^.right_pt)',        // 11
    '',                                     // 12
    'postorder(node_pt)',                   // 13
    '   if node_pt = nil then return',      // 14
    '   postorder(node_pt^.left_pt)',       // 15
    '   postorder(node_pt^.right_pt)',      // 16
    '   visit(node_pt)',                    // 17
    '',                                     // 18
    'main()',                               // 19
    '   preorder(root_pt)',                 // 20
    '   inorder(root_pt)',                  // 21
    '   postorder(root_pt)',                // 22
    '   postorder(expr_pt)',                // 23
  ],
  cpp: [
    'void preorder(Node* node_pt) {',        //  1
    '   if (node_pt == nullptr) return;',    //  2
    '   visit(node_pt);',                    //  3
    '   preorder(node_pt->left_pt);',        //  4
    '   preorder(node_pt->right_pt); }',     //  5
    '',                                      //  6
    'void inorder(Node* node_pt) {',         //  7
    '   if (node_pt == nullptr) return;',    //  8
    '   inorder(node_pt->left_pt);',         //  9
    '   visit(node_pt);',                    // 10
    '   inorder(node_pt->right_pt); }',      // 11
    '',                                      // 12
    'void postorder(Node* node_pt) {',       // 13
    '   if (node_pt == nullptr) return;',    // 14
    '   postorder(node_pt->left_pt);',       // 15
    '   postorder(node_pt->right_pt);',      // 16
    '   visit(node_pt); }',                  // 17
    '',                                      // 18
    'int main() {',                          // 19
    '   preorder(root_pt);',                 // 20
    '   inorder(root_pt);',                  // 21
    '   postorder(root_pt);',                // 22
    '   postorder(expr_pt); }',              // 23
  ],
  java: [
    'void preorder(Node node_pt) {',         //  1
    '   if (node_pt == null) return;',       //  2
    '   visit(node_pt);',                    //  3
    '   preorder(node_pt.left_pt);',         //  4
    '   preorder(node_pt.right_pt); }',      //  5
    '',                                      //  6
    'void inorder(Node node_pt) {',          //  7
    '   if (node_pt == null) return;',       //  8
    '   inorder(node_pt.left_pt);',          //  9
    '   visit(node_pt);',                    // 10
    '   inorder(node_pt.right_pt); }',       // 11
    '',                                      // 12
    'void postorder(Node node_pt) {',        // 13
    '   if (node_pt == null) return;',       // 14
    '   postorder(node_pt.left_pt);',        // 15
    '   postorder(node_pt.right_pt);',       // 16
    '   visit(node_pt); }',                  // 17
    '',                                      // 18
    'void main() {',                         // 19
    '   preorder(root_pt);',                 // 20
    '   inorder(root_pt);',                  // 21
    '   postorder(root_pt);',                // 22
    '   postorder(expr_pt); }',              // 23
  ],
};

/* TREE 1 — the BST from trees-bst-insert with T in place. Nodes are listed so that,
 * for every parent, its LEFT child appears before its RIGHT child; the NODES tree
 * layout assigns leaf columns left-to-right in that order, so the drawing matches the
 * lecture's tree and resolves once (nothing moves).
 *
 *                 S
 *           E           X
 *        A     R      T
 *          C  H
 *              M
 * pre  : S E A C R H M X T      in : A C E H M R S T X (SORTED)     post : C A M H R E T X S */
const TREE1 = {
  rootId: 'pS',
  order: ['pS', 'pE', 'pX', 'pA', 'pR', 'pC', 'pH', 'pM', 'pT'],
  node: {
    pS: { parent: null, label: 'S', left: 'pE', right: 'pX' },
    pE: { parent: 'pS', label: 'E', left: 'pA', right: 'pR' },
    pX: { parent: 'pS', label: 'X', left: 'pT', right: null },
    pA: { parent: 'pE', label: 'A', left: null, right: 'pC' },
    pR: { parent: 'pE', label: 'R', left: 'pH', right: null },
    pC: { parent: 'pA', label: 'C', left: null, right: null },
    pH: { parent: 'pR', label: 'H', left: null, right: 'pM' },
    pM: { parent: 'pH', label: 'M', left: null, right: null },
    pT: { parent: 'pX', label: 'T', left: null, right: null },
  },
};

/* TREE 2 — the lecture's algebraic tree (trees_2.gif).
 *
 *                 +
 *           -           *
 *        a     /      d   e
 *            b   c
 * in : a - b / c + d * e (infix, no parens)      post : a b c / - d e * + (POSTFIX) */
const TREE2 = {
  rootId: 'xPlus',
  order: ['xPlus', 'xMinus', 'xStar', 'xa', 'xSlash', 'xd', 'xe', 'xb', 'xc'],
  node: {
    xPlus:  { parent: null,    label: '+', left: 'xMinus', right: 'xStar' },
    xMinus: { parent: 'xPlus', label: '-', left: 'xa',     right: 'xSlash' },
    xStar:  { parent: 'xPlus', label: '*', left: 'xd',     right: 'xe' },
    xa:     { parent: 'xMinus', label: 'a', left: null,    right: null },
    xSlash: { parent: 'xMinus', label: '/', left: 'xb',    right: 'xc' },
    xd:     { parent: 'xStar', label: 'd', left: null,     right: null },
    xe:     { parent: 'xStar', label: 'e', left: null,     right: null },
    xb:     { parent: 'xSlash', label: 'b', left: null,    right: null },
    xc:     { parent: 'xSlash', label: 'c', left: null,    right: null },
  },
};

/* Which listing line each traversal's parts live on -- the whole point is that only
 * `visit` moves (3 / 10 / 17). */
const VISIT = { pre: 3, in: 10, post: 17 };
const LEFT  = { pre: 4, in: 9,  post: 15 };
const RIGHT = { pre: 5, in: 11, post: 16 };
const FN    = { pre: 'preorder', in: 'inorder', post: 'postorder' };

/* ---------------------------------------------------------------------------
 * Teaching notes -- the lecture's own framing (AUTHORING.md "Steps vs. notes").
 * ------------------------------------------------------------------------- */
const INTRO_NOTE =
  'Look at the three procedures before anything runs. They are the same three lines — visit this node, ' +
  'walk the left subtree, walk the right subtree — in three different orders. Nothing else differs. The ' +
  'names say where visit sits: PRE-order visits before the subtrees, IN-order between them, POST-order ' +
  'after both. That one difference is about to produce three completely different outputs from the same tree.';

const PRE_NOTE =
  'Pre-order visits a node on the way DOWN, before it knows anything about what is below. Notice the root ' +
  'came out first, and that each subtree’s root comes out before its contents — that is a shape you can ' +
  'rebuild the tree from, which is why pre-order is what you use to copy or serialise a tree.';

const IN_NOTE =
  'Read that again: it is in alphabetical order. Nothing sorted it — the traversal just walked the tree in ' +
  'the order the tree was already built in. And that is a sorting algorithm you now have for free: insert ' +
  'your n elements into a BST, then print in-order. Each insertion costs about log n, and there are n of ' +
  'them, so building the tree is n log n; the walk is n. An n log n sort, discovered rather than designed. ' +
  'It works because of what a BST IS: everything left is smaller, everything right is larger, at every ' +
  'node. Walk left-node-right and you cannot come out in any order but sorted.';

const POST1_NOTE =
  'Post-order visits a node only after BOTH its subtrees are done — the root comes out last. That is the ' +
  'order you need whenever a node’s work depends on its children being finished first: freeing a tree, ' +
  'computing sizes or heights, evaluating an expression.';

const POST2_NOTE =
  'That is postfix. The same procedure that gave C A M H R E T X S on the search tree gives ' +
  'a b c / - d e * + here — because a post-order walk emits every operator only after both its operands, ' +
  'which is exactly what postfix means. So the question stacks-postfix-eval left open is answered: to ' +
  'convert infix to postfix, build the expression tree and walk it post-order. And walking the SAME tree ' +
  'in-order gives back the infix form — a - b / c + d * e — except for one thing. The parentheses are ' +
  'gone. In-order cannot tell you that b / c binds tighter than the subtraction; the tree knows, the flat ' +
  'string does not. That is precisely why infix needs parentheses and postfix does not.';

const FINAL_NOTE = [
  'One thing worth doing: take the algebraic tree and walk it PRE-order. You will get + - a / b c * d e, ' +
  'which is prefix — the same expression written a third way, and equally unambiguous without ' +
  'parentheses. And a harder one: given only the in-order and post-order sequences of a tree, can you ' +
  'reconstruct the tree? Given only the in-order, can you? ',
  { href: 'trees-bst-delete.html', text: 'See what it takes to remove a node' },
];

function* trace() {
  let tree = TREE1;
  let activeId = null;
  let visited = new Set();
  let frames = [{ fn: 'main', node: null, call: null }];
  const outLines = [];            // { label, seq } — one accumulating line per traversal
  let curOut = -1;

  /* The tree: every position, every step (fixed layout, nothing moves). A visited
   * node carries the green `member` outline ("its value is out"); the node the walk
   * sits on this step carries the blue activity fill (`active`); everything else is
   * neutral `idle`. Edges are always present (all nodes hold a value). */
  const treePanel = () => ({
    layout: 'tree',
    edges: tree.order.filter(id => tree.node[id].parent != null)
      .map(id => ({ from: tree.node[id].parent, to: id, state: '' })),
    nodes: tree.order.map(id => ({
      id, parent: tree.node[id].parent, label: tree.node[id].label,
      state: visited.has(id) ? 'member' : 'idle',
      active: id === activeId,
    })),
  });

  /* CALLSTACK ("Function calls"): the traversal recurses, so the frames show the
   * descent (post-order on tree 1 reaches six frames deep: main + S E R H M). Each
   * frame binds node_pt; main is the driver with no parameters. */
  const callsPanel = () => ({
    frames: frames.map((f, i) => ({
      fn: f.fn,
      vars: f.fn === 'main' ? [] : [{ name: 'node_pt', value: f.node }],
      active: i === frames.length - 1,
    })),
  });

  /* STREAM ("output"): one line per traversal, each accumulating its visit sequence
   * as the walk emits — nine characters at most, one line that grows, not one line
   * per visit, so it stays well inside the panel. Prior traversals’ lines stay
   * visible, so the three outputs of the same tree can be compared at a glance. */
  const outPanel = (grew) => ({
    lines: outLines.map((l, i) => ({
      text: l.label + l.seq, dir: 'out', isNew: grew && i === outLines.length - 1,
    })),
  });

  const snap = ({ line = null, tag, narrate, note, grew = false }) => ({
    line, tag, narrate, note,
    parked: frames.slice(0, -1).map(f => f.call).filter(v => v != null),
    panels: { tree: treePanel(), out: outPanel(grew), calls: callsPanel() },
  });

  const visitsImmediately = (order, id) => {
    const n = tree.node[id];
    if (order === 'pre')  return true;
    if (order === 'in')   return n.left == null;
    return n.left == null && n.right == null;   // post: only a leaf visits on arrival
  };

  /* One VISIT: emit the node, paint it, grow the output line. `entryDir` is set when
   * this visit is folded into the step that arrived here (a node that visits the
   * moment it is reached — every pre-order node, an in-order node with no left child,
   * a post-order leaf); null when the visit is its own step, after the subtree work. */
  function* visitStep(order, id, entryDir, opts, parentLabel) {
    visited.add(id);
    activeId = id;
    const lab = tree.node[id].label;
    outLines[curOut].seq += (outLines[curOut].seq ? ' ' : '') + lab;
    const last = visited.size === tree.order.length;
    let narrate;
    if (last && opts.endNarrate)   narrate = opts.endNarrate;
    else if (entryDir === 'root')  narrate = opts.rootVisitNarrate;
    else if (entryDir)             narrate = `From ${parentLabel}, go ${entryDir} to ${lab} — visit it.`;
    else                           narrate = `Visit ${lab}.`;
    yield snap({ line: VISIT[order], tag: 'visit', grew: true, narrate,
                 note: last ? opts.endNote : undefined });
  }

  /* One DESCEND: a recursive call that arrives at a node whose visit is not yet due
   * (an internal node in in-/post-order). The node becomes the current position (blue
   * fill) but is not emitted; its visit comes later, as its own step. */
  function* descendStep(order, id, entryDir, opts, parentLabel) {
    const lab = tree.node[id].label;
    activeId = id;
    const narrate = entryDir === 'root'
      ? opts.rootNarrate
      : `From ${parentLabel}, go ${entryDir} to ${lab}.`;
    const line = entryDir === 'root' ? opts.mainLine : (entryDir === 'left' ? LEFT : RIGHT)[order];
    yield snap({ line, tag: 'descend', narrate });
  }

  /* The recursive walk. `dir` is how we reached this node ('root' | 'left' | 'right'),
   * which sets the caller’s parked line and the arrival narration. The three orders
   * differ only in WHERE the visit sits relative to the two child walks — exactly the
   * listing’s three shapes. */
  function* walk(order, id, dir, opts) {
    const n = tree.node[id];
    const parentLabel = n.parent != null ? tree.node[n.parent].label : null;

    // Park the caller (main, or the parent frame) at the line of the call it is making.
    frames[frames.length - 1].call = dir === 'root' ? opts.mainLine : (dir === 'left' ? LEFT : RIGHT)[order];
    frames.push({ fn: FN[order], node: n.label, call: null });

    const immediate = visitsImmediately(order, id);
    if (immediate) yield* visitStep(order, id, dir, opts, parentLabel);
    else           yield* descendStep(order, id, dir, opts, parentLabel);

    if (order === 'pre') {
      if (n.left)  yield* walk(order, n.left, 'left', opts);
      if (n.right) yield* walk(order, n.right, 'right', opts);
    } else if (order === 'in') {
      if (n.left)  yield* walk(order, n.left, 'left', opts);
      if (!immediate) yield* visitStep(order, id, null, opts, parentLabel);
      if (n.right) yield* walk(order, n.right, 'right', opts);
    } else {
      if (n.left)  yield* walk(order, n.left, 'left', opts);
      if (n.right) yield* walk(order, n.right, 'right', opts);
      if (!immediate) yield* visitStep(order, id, null, opts, parentLabel);
    }

    frames.pop();
  }

  function* runTraversal(order, mainLine, label, opts) {
    outLines.push({ label: label.padEnd(11), seq: '' });
    curOut = outLines.length - 1;
    visited = new Set();                       // a fresh walk: the greening resets
    yield* walk(order, tree.rootId, 'root', { ...opts, mainLine });
  }

  /* ================================ the trace ================================ */

  // STEP 0 — tree 1, nothing visited, nothing executed.
  yield snap({ line: null, tag: 'init', note: INTRO_NOTE,
    narrate: 'One tree, three ways to walk it.' });

  // PRE-ORDER (tree 1): every node visits on arrival, so each step is a go-and-visit.
  yield* runTraversal('pre', 20, 'pre-order', {
    rootVisitNarrate: 'main calls preorder(root_pt). Pre-order visits a node the instant it arrives, so S comes out first.',
    endNote: PRE_NOTE,
  });

  // IN-ORDER (tree 1) — PAYOFF 1: visit fires between the subtrees.
  yield* runTraversal('in', 21, 'in-order', {
    rootNarrate: 'The pre-order walk returns. main calls inorder(root_pt) — the same tree, but visit now waits until after the left subtree.',
    endNarrate: 'A C E H M R S T X.',
    endNote: IN_NOTE,
  });

  // POST-ORDER (tree 1): visit fires after BOTH subtrees; the root comes out last.
  yield* runTraversal('post', 22, 'post-order', {
    rootNarrate: 'main calls postorder(root_pt) — the same tree once more, but now visit waits until both subtrees are done.',
    endNote: POST1_NOTE,
  });

  // POST-ORDER (tree 2) — PAYOFF 2: a different tree, the same procedure -> postfix.
  tree = TREE2;
  activeId = null;
  yield* runTraversal('post', 23, 'post-order', {
    rootNarrate: 'main calls postorder(expr_pt) — a different tree, the same procedure. This one is an arithmetic expression.',
    endNarrate: 'a b c / - d e * +.',
    endNote: [POST2_NOTE, { href: 'stacks-postfix-eval.html', text: 'See postfix actually evaluated' }],
  });

  // FINAL — back in main, everything walked.
  frames = [{ fn: 'main', node: null, call: null }];
  activeId = null;
  yield snap({ line: 23, tag: 'return', note: FINAL_NOTE,
    narrate: 'Three orders, one tree, three answers.' });
}

export default {
  title: 'Three ways to walk a tree',
  subtitle: 'The same three lines, in three orders',
  profile: 'standard',
  columns: 2,
  languages: ['pseudo', 'cpp', 'java'],

  // Four panels. The tree is the structure; STREAM ("output") accumulates the visit
  // sequence; the Function calls (CALLSTACK) panel shows the recursive descent
  // (reaching six frames deep on tree 1’s post-order); the code anchors the listing.
  // No arrows, so no adjacency constraint. Everything resolves once (verifyHeights).
  panels: [
    { type: 'code',      id: 'code',  title: 'preorder / inorder / postorder',
      listings: LISTINGS, labels: { pseudo: 'pseudocode', cpp: 'C++', java: 'Java' } },
    { type: 'nodes',     id: 'tree',  title: 'The tree', structure: true },
    { type: 'callstack', id: 'calls', title: 'Function calls' },
    { type: 'stream',    id: 'out',   title: 'output', compact: true },
  ],

  initialTrace: 'run',
  traces: {
    run: trace,
  },
};
