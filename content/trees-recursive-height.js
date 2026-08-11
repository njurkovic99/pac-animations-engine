/* ds — A12 "How tall is this tree?" — the height of a binary tree, computed
 * recursively. The lecture calls it "an extremely short piece of code," and that
 * IS the point: three lines, and the reason they work is the whole lesson.
 *
 * THE LESSON completes an arc the recursion block began. recursion-factorial-stack
 * showed the work happening on the way BACK, with ONE recursive call — each frame
 * multiplies as it returns. This does the same with TWO calls, where the returned
 * values must be COMPARED, not just combined: every node asks BOTH children how tall
 * they are, waits for both answers, takes the larger, and adds one for itself.
 *
 * Nothing is computed on the way down. A node cannot know its own height until both
 * its subtrees have reported — which is what makes the descent feel empty and the
 * ascent feel like everything happening at once. The tree fills in with numbers from
 * the bottom up (each node's height shown as a meta line, the way recursion-fib-levels
 * shows level/depth), and the student watches the answer assemble.
 *
 * Reuses trees-bst-insert's tree (fixed all-positions layout, nothing moves) and
 * recursion-factorial-stack's Function calls panel and returning-cascade style. NO NEW
 * ENGINE CAPABILITY. No memory-danger marker — this reads the tree and writes nothing.
 *
 * A nil call returns 0 and is the base case; it is shown (line 2 test, line 3 return)
 * but is NOT drawn as its own stack frame — the base case returns instantly and never
 * suspends, so the Function calls panel shows only the chain of real, deferred calls
 * (main + S + E + R + H + M, six deep at the deepest, inside the ceiling of 6). The
 * base case's 0 is shown landing in the waiting node's left_h / right_h instead. */

/* One listing, three ds languages, line-aligned to a single 9-line grid so `line`
 * is a plain number. Pseudocode uses the caret for dereference (item 82); no comment
 * is the longest line (item 88a) — there are none. Line meanings are fixed: line 2 is
 * the nil test, line 3 the base-case return, lines 4/5 the two recursive calls (where
 * every frame waits), line 6 where the work finally happens, line 9 the print. */
const LISTINGS = {
  pseudo: [
    'height(node_pt)',                            // 1
    '   if node_pt = nil',                        // 2
    '      return 0',                             // 3
    '   left_h = height(node_pt^.left_pt)',       // 4
    '   right_h = height(node_pt^.right_pt)',     // 5
    '   return 1 + max(left_h, right_h)',         // 6
    '',                                           // 7
    'main()',                                     // 8
    '   print height(root_pt)',                   // 9
  ],
  cpp: [
    'int height(Node* node_pt) {',                // 1
    '   if (node_pt == nullptr)',                 // 2
    '      return 0;',                            // 3
    '   int left_h = height(node_pt->left_pt);',  // 4
    '   int right_h = height(node_pt->right_pt);',// 5
    '   return 1 + max(left_h, right_h); }',      // 6
    '',                                           // 7
    'int main() {',                               // 8
    '   cout << height(root_pt); }',              // 9
  ],
  java: [
    'int height(Node node_pt) {',                 // 1
    '   if (node_pt == null)',                    // 2
    '      return 0;',                            // 3
    '   int left_h = height(node_pt.left_pt);',   // 4
    '   int right_h = height(node_pt.right_pt);', // 5
    '   return 1 + Math.max(left_h, right_h); }', // 6
    '',                                           // 7
    'void main() {',                              // 8
    '   print(height(root_pt)); }',               // 9
  ],
};

/* The lecture's tree (trees-bst-insert, with T in place). Nodes listed left-child
 * before right-child for every parent, so the NODES tree layout matches the lecture's
 * drawing and resolves once (nothing moves).
 *
 *                 S
 *           E           X
 *        A     R      T
 *          C  H
 *              M
 * Heights bottom-up: C=1 M=1 A=2 H=2 R=3 E=4 T=1 X=2 S=5.  ANSWER: height(S) = 5. */
const TREE = {
  root: 'pS',
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

/* ---------------------------------------------------------------------------
 * Teaching notes — the instructor's framing (AUTHORING.md "Steps vs. notes").
 * ------------------------------------------------------------------------- */
const INTRO_NOTE =
  'Height is the longest path from the root down to a leaf. You could try to eyeball it — but watch how ' +
  'little each individual node needs to know. No node can answer for itself. It has to ask both children first.';

const FIRST_CALL_NOTE =
  'height(S) cannot return anything yet. Before it can, it needs the height of the left subtree — so it ' +
  'calls itself on E and waits. Nothing has been computed. That is the whole descent: a queue of frames, ' +
  'each suspended on line 4, none of them able to answer.';

const NIL_NOTE =
  'A nil subtree has height 0. That is what stops the recursion, and it is also the first value anything ' +
  'has returned. Everything from here is arithmetic on the way back up.';

const A_NOTE =
  'A is two levels tall: itself, plus the taller of its two subtrees. It did not need to know anything ' +
  'about the rest of the tree — only what its own two children said.';

const E_NOTE =
  'Here max finally does something. A came back with 2 and R with 3, and E takes the larger — because ' +
  'height is the LONGEST path, and a path down through R is longer than one through A. The shorter side ' +
  'is not wrong, it just does not determine the height.';

const S_NOTE =
  'Count it down the longest path: S, E, R, H, M — five nodes. The tree fills in from the bottom because ' +
  'that is the only direction the information can travel. A leaf knows its own height; nothing else does ' +
  'until its children have told it. ' +
  'Notice what the code never does: no counter, no variable outside the function, no tracking of where ' +
  'it is. Each call’s return value IS the answer its parent needs.';

const FINAL_NOTE = [
  'The assignment hint suggests a different route — carry the depth DOWN as a parameter, the way ' +
  'recursion-fib-levels carries level, and keep a running maximum. That works too, and it is worth writing ' +
  'both. The difference: the downward version needs an extra parameter and somewhere outside the function ' +
  'to hold the max; this one needs neither, because every call hands its answer straight to whoever asked. ' +
  'Two things to try. What does this code return for an EMPTY tree, and is that the answer you want? And a ' +
  'harder one: the tree you just measured is 5 tall with 9 nodes. What is the smallest height 9 nodes could ' +
  'have, and what is the largest? That gap is the difference between a balanced tree and the degenerate ' +
  'one the lecture warns about. ',
  { href: 'trees-bst-insert.html', text: 'See the tree being built one node at a time' },
];

function* trace() {
  const heights = {};                 // id -> height, once the node has returned
  let activeId = null;
  let frames = [{ fn: 'main', node: null, call: null }];
  let nilSeen = false;

  /* The tree: every position, every step (fixed layout). Each node reserves ONE meta
   * line from step 0 (empty until the node returns, then its height) so the box height
   * never changes and nothing moves as answers arrive. A node that has returned takes
   * the green `member` outline; the node the recursion sits on this step takes the blue
   * `active` fill. */
  const treePanel = () => ({
    layout: 'tree',
    edges: TREE.order.filter(id => TREE.node[id].parent != null)
      .map(id => ({ from: TREE.node[id].parent, to: id, state: '' })),
    nodes: TREE.order.map(id => ({
      id, parent: TREE.node[id].parent, label: TREE.node[id].label,
      meta: [heights[id] != null ? `h = ${heights[id]}` : ''],
      state: heights[id] != null ? 'member' : 'idle',
      active: id === activeId,
    })),
  });

  /* Function calls: the chain of deferred height() calls, each bound to its node_pt.
   * A nil (base-case) call is NOT a frame — it returns instantly. main is the driver. */
  const callsPanel = () => ({
    frames: frames.map((f, i) => ({
      fn: f.fn,
      vars: f.fn === 'main' ? [] : [{ name: 'node_pt', value: f.node }],
      active: i === frames.length - 1,
    })),
  });

  /* The current call's working values: node_pt, left_h, right_h. Empty until each is
   * computed; `hot` gives the blue fill to the one that changed this step. On a return,
   * the larger of the two is hot — the side that actually determined the height. */
  const varsPanel = (hot) => {
    const top = frames[frames.length - 1];
    const isH = top && top.fn === 'height';
    const cell = (label, val, key) => (!isH || val == null)
      ? { label, value: '', role: 'empty' }
      : { label, value: String(val), role: hot === key ? 'active' : undefined };
    return {
      render: 'row',
      cells: [
        cell('node_pt', isH ? top.node : null, 'node_pt'),
        cell('left_h',  isH ? top.leftH : null, 'left_h'),
        cell('right_h', isH ? top.rightH : null, 'right_h'),
      ],
    };
  };

  const snap = ({ line = null, tag, narrate, note, hot = null }) => ({
    line, tag, narrate, note,
    // Every frame's call line is parked (dim) except the active line itself. On a nil
    // step the waiting node's own call line (4 or 5) is dim while the base case runs
    // at line 2/3; on a call step the active line 4/5 wins over the parent's dim copy.
    parked: frames.map(f => f.call).filter(v => v != null && v !== line),
    panels: { tree: treePanel(), calls: callsPanel(), vars: varsPanel(hot) },
  });

  /* A nil (base-case) call: two terse steps, no frame. The returned 0 lands in the
   * waiting node's left_h / right_h, shown in the vars strip. */
  function* nilCall(parentId, side, parentFrame) {
    const first = !nilSeen; nilSeen = true;
    const p = TREE.node[parentId].label;
    yield snap({ line: 2, tag: 'nil-test',
      narrate: first
        ? `${p} has no ${side} child, so height is called on nil.`
        : `${p}’s ${side} child is nil.` });
    if (side === 'left') parentFrame.leftH = 0; else parentFrame.rightH = 0;
    yield snap({ line: 3, tag: 'nil-return', hot: side === 'left' ? 'left_h' : 'right_h',
      narrate: first
        ? 'height(nil) is 0 — the base case, and the first actual number in the whole run.'
        : 'height(nil) returns 0.',
      note: first ? NIL_NOTE : undefined });
  }

  /* Process one child slot (line 4 = left, line 5 = right): recurse into a real child,
   * or evaluate the nil base case. Returns the child's height. */
  function* childHeight(parentId, side, parentFrame) {
    const childId = TREE.node[parentId][side];
    if (childId == null) { yield* nilCall(parentId, side, parentFrame); return 0; }
    return yield* height(childId, side === 'left' ? 4 : 5, side, TREE.node[parentId].label);
  }

  /* height(node) — the recursion. `entryLine` is the call site that reached it (9 for
   * the root, 4 for a left child, 5 for a right child); `dir` and `parentLabel` frame
   * the descent narration. Nothing is computed until line 6, on the way back. */
  function* height(id, entryLine, dir, parentLabel) {
    const lab = TREE.node[id].label;
    const frame = { fn: 'height', node: lab, leftH: null, rightH: null, call: null };
    frames.push(frame);
    activeId = id;
    yield snap({ line: entryLine, tag: 'call', hot: 'node_pt',
      narrate: dir === 'root'
        ? 'main calls height(root_pt). To print the answer, height(S) has to be evaluated first.'
        : `height(${parentLabel}) goes ${dir}, calling height(${lab}). Nothing is computed yet.`,
      note: id === 'pE' ? FIRST_CALL_NOTE : undefined });

    // line 4: left subtree. The frame is now suspended at line 4, waiting.
    frame.call = 4;
    frame.leftH = yield* childHeight(id, 'left', frame);
    // line 5: right subtree. Suspended at line 5.
    frame.call = 5;
    frame.rightH = yield* childHeight(id, 'right', frame);

    // line 6: NOW the work happens — take the larger, add one for this node.
    frame.call = null;
    const h = 1 + Math.max(frame.leftH, frame.rightH);
    heights[id] = h;
    activeId = id;
    yield snap({ line: 6, tag: 'return',
      hot: frame.leftH >= frame.rightH ? 'left_h' : 'right_h',
      narrate: returnNarrate(id, frame, h),
      note: id === 'pA' ? A_NOTE : id === 'pE' ? E_NOTE : id === 'pS' ? S_NOTE : undefined });
    frames.pop();
    return h;
  }

  function returnNarrate(id, f, h) {
    if (id === 'pS') return 'The root reports 5. That is the height of the whole tree.';
    if (id === 'pR') return `1 + max(${f.leftH}, ${f.rightH}) is ${h} — R has no right child, so the left side alone decides.`;
    const lab = TREE.node[id].label;
    return `1 + max(${f.leftH}, ${f.rightH}) is ${h}. ${lab} reports ${h}.`;
  }

  /* ================================ the trace ================================ */

  // STEP 0 — the tree, no heights anywhere, nothing executed.
  yield snap({ line: null, tag: 'init', note: INTRO_NOTE,
    narrate: 'A tree with nine nodes. How tall is it?' });

  // main calls height(root_pt); the whole recursion runs inside.
  frames[0].call = 9;
  yield* height('pS', 9, 'root', null);

  // FINAL — height(S) has returned 5 to main, which prints it.
  frames[0].call = null;
  activeId = null;
  yield snap({ line: 9, tag: 'print', note: FINAL_NOTE,
    narrate: 'Nine nodes, six lines of code, one number.' });
}

export default {
  title: 'How tall is this tree?',
  subtitle: 'Every node waits for both its children',
  profile: 'standard',
  columns: 2,
  languages: ['pseudo', 'cpp', 'java'],

  // Four panels. The tree is the structure and it carries the answers (each node's
  // height as a meta line); the Function calls (CALLSTACK) panel shows the deferred
  // recursion, six deep at the deepest; the compact vars strip shows the current
  // call's node_pt / left_h / right_h; the code anchors the listing. No arrows, so no
  // adjacency constraint. Everything resolves once (verifyHeights).
  panels: [
    { type: 'code',      id: 'code',  title: 'height(node_pt)',
      listings: LISTINGS, labels: { pseudo: 'pseudocode', cpp: 'C++', java: 'Java' } },
    { type: 'nodes',     id: 'tree',  title: 'The tree', structure: true },
    { type: 'callstack', id: 'calls', title: 'Function calls' },
    { type: 'cells',     id: 'vars',  title: 'This call', compact: true },
  ],

  initialTrace: 'run',
  traces: {
    run: trace,
  },
};
