/* ds — A2 "A queue in an array" (front + rear, built from empty)
 *
 * One array-based queue, stored with front + rear, traced by a main() driver —
 * the same shape as A1 (lists-array-insert-delete): main calls the operations, a
 * CALLSTACK panel (displayed as "Function calls") shows each call with its bound
 * parameter, and the caller's line dims while the callee runs.
 *
 * The queue starts EMPTY, with front = rear = -1. -1 means "this index points at
 * nothing." It is the extra piece of information that lets front and rear
 * distinguish an empty queue from a full one — which is the animation's payoff:
 * the queue is filled to capacity (front 0, rear 3), drained back to empty, and
 * on the last DELETE both indices reset to -1. Without that reset front would be
 * 1 and rear 0 — one cell apart in exactly the way a FULL queue's indices are —
 * and front + rear alone could not tell the two states apart. The sentinel
 * breaks the tie, at the cost of a branch in ADD and a branch in DELETE. A queue
 * that stored a count instead would need neither (empty is count = 0, full is
 * count = MAX); the final note makes that trade explicit. There is deliberately
 * NO count variable anywhere — code, state strip, or hidden state.
 *
 * next_ix is the wraparound helper, treated as ATOMIC — never stepped into, and
 * it pushes no CALLSTACK frame. Note next_ix(-1) = 0 (since -1 is not MAX-1 and
 * -1 + 1 = 0), narrated explicitly the first time it happens.
 *
 * A marker whose index is -1 is PARKED to the left of cell [0], dimmed, still
 * labelled — "pointing at nothing yet," not missing. Both markers start parked.
 *
 * DELETE only moves an index; the removed character stays in memory as a `stale`
 * cell (greyed, value still shown). The array is never blanked. Nothing here
 * corrupts memory, so there is NO memory-danger marker anywhere.
 *
 * WATCH only: one trace, no gates. The misconception is taught by narration and
 * notes; the final DELETE's note is the post-watch payoff. Metrics hidden. */

const MAX = 4;
const nextIx = i => (i === MAX - 1 ? 0 : i + 1);   // next_ix; note nextIx(-1) === 0

/* One listing, three ds languages, all line-aligned to a single 39-line grid, so
 * `line` is a plain number that resolves the same in every language. Line 8 is
 * the fullness test; line 17 the emptiness test. */
const LISTINGS = {
  pseudo: [
    'next_ix(i)',                          // 1
    '    if i = MAX - 1',                  // 2
    '        return 0',                    // 3
    '    else',                            // 4
    '        return i + 1',                // 5
    '',                                    // 6
    'ADD(value)',                          // 7
    '    if next_ix(rear) = front',        // 8
    '        print "queue is full"',       // 9
    '    else',                            // 10
    '        if front = -1',               // 11
    '            front = 0',               // 12
    '        rear = next_ix(rear)',        // 13
    '        contents[rear] = value',      // 14
    '',                                    // 15
    'DELETE()',                            // 16
    '    if front = -1',                   // 17
    '        print "queue is empty"',      // 18
    '    else',                            // 19
    '        ch = contents[front]',        // 20
    '        if front = rear',             // 21
    '            front = -1',              // 22
    '            rear = -1',               // 23
    '        else',                        // 24
    '            front = next_ix(front)',  // 25
    '',                                    // 26
    'main()',                              // 27
    "    ADD('a')",                        // 28
    "    ADD('b')",                        // 29
    "    ADD('c')",                        // 30
    "    ADD('d')",                        // 31
    "    ADD('e')",                        // 32
    '    DELETE()',                        // 33
    "    ADD('e')",                        // 34
    '    DELETE()',                        // 35
    '    DELETE()',                        // 36
    '    DELETE()',                        // 37
    '    DELETE()',                        // 38
    '    DELETE()',                        // 39
  ],
  java: [
    'int next_ix(int i) {',                // 1
    '    if (i == MAX - 1)',               // 2
    '        return 0;',                   // 3
    '    else',                            // 4
    '        return i + 1; }',             // 5
    '',                                    // 6
    'void add(char value) {',              // 7
    '    if (next_ix(rear) == front)',     // 8
    '        out.println("queue is full");',// 9
    '    else {',                          // 10
    '        if (front == -1)',            // 11
    '            front = 0;',              // 12
    '        rear = next_ix(rear);',       // 13
    '        contents[rear] = value; } }', // 14
    '',                                    // 15
    'void delete() {',                     // 16
    '    if (front == -1)',                // 17
    '        out.println("queue is empty");',// 18
    '    else {',                          // 19
    '        ch = contents[front];',       // 20
    '        if (front == rear) {',        // 21
    '            front = -1;',             // 22
    '            rear = -1;',              // 23
    '        } else',                      // 24
    '            front = next_ix(front); } }',// 25
    '',                                    // 26
    'void main() {',                       // 27
    "    add('a');",                       // 28
    "    add('b');",                       // 29
    "    add('c');",                       // 30
    "    add('d');",                       // 31
    "    add('e');",                       // 32
    '    delete();',                       // 33
    "    add('e');",                       // 34
    '    delete();',                       // 35
    '    delete();',                       // 36
    '    delete();',                       // 37
    '    delete();',                       // 38
    '    delete(); }',                     // 39
  ],
  cpp: [
    'int next_ix(int i) {',                // 1
    '    if (i == MAX - 1)',               // 2
    '        return 0;',                   // 3
    '    else',                            // 4
    '        return i + 1; }',             // 5
    '',                                    // 6
    'void add(char value) {',              // 7
    '    if (next_ix(rear) == front)',     // 8
    '        cout << "queue is full";',    // 9
    '    else {',                          // 10
    '        if (front == -1)',            // 11
    '            front = 0;',              // 12
    '        rear = next_ix(rear);',       // 13
    '        contents[rear] = value; } }', // 14
    '',                                    // 15
    'void dequeue() {',                    // 16
    '    if (front == -1)',                // 17
    '        cout << "queue is empty";',   // 18
    '    else {',                          // 19
    '        ch = contents[front];',       // 20
    '        if (front == rear) {',        // 21
    '            front = -1;',             // 22
    '            rear = -1;',              // 23
    '        } else',                      // 24
    '            front = next_ix(front); } }',// 25
    '',                                    // 26
    'int main() {',                        // 27
    "    add('a');",                       // 28
    "    add('b');",                       // 29
    "    add('c');",                       // 30
    "    add('d');",                       // 31
    "    add('e');",                       // 32
    '    dequeue();',                      // 33
    "    add('e');",                       // 34
    '    dequeue();',                      // 35
    '    dequeue();',                      // 36
    '    dequeue();',                      // 37
    '    dequeue();',                      // 38
    '    dequeue(); }',                    // 39
  ],
};

/* ---- call-frame builders. `call` is the parked caller line (dimmed while a
 * callee runs). main has no params/locals; ADD binds value; DELETE has none
 * (ch is global — it lives in the state strip). ---- */
const mainF = call  => ({ fn: 'main',   vars: [],                         call });
const addF  = value => ({ fn: 'ADD',    vars: [{ name: 'value', value }] });
const delF  = ()    => ({ fn: 'DELETE', vars: [] });

/* The contents array as a marked CELLS row. A cell is empty (never held
 * anything), a member (a live queue element), stale (removed, still in memory —
 * greyed), active (written this step, blue), or compared (read this step).
 * Markers: front and rear; index -1 parks left of the array. */
function contentsPanel(cellChar, members, front, rear, activeIdx, comparedIdx) {
  return {
    render: 'box',
    rowLabel: 'contents',
    cells: cellChar.map((v, i) => {
      if (i === activeIdx)   return { value: v == null ? '' : v, role: 'active' };
      if (i === comparedIdx) return { value: v == null ? '' : v, role: 'compared' };
      if (v == null)         return { value: '', role: 'empty' };
      if (members.has(i))    return { value: v };
      return { value: v, role: 'stale' };
    }),
    markers: [{ label: 'front', index: front }, { label: 'rear', index: rear }],
  };
}

/* The compact state strip: front, rear, ch, as a horizontal row of three
 * labelled boxes. `hot` gives the changing box the blue fill. No count box.
 * front and rear always hold a real value the code tests against — including the
 * -1 sentinel, which renders at normal weight, NOT as a placeholder. ch, before
 * it is ever assigned, is indeterminate storage: the `empty` role gives it the
 * same placeholder glyph as an unwritten array cell. */
function statePanel(front, rear, ch, hot) {
  return {
    render: 'box',
    cells: [
      { label: 'front', value: front, role: hot === 'front' ? 'active' : undefined },
      { label: 'rear',  value: rear,  role: hot === 'rear'  ? 'active' : undefined },
      { label: 'ch',    value: ch,    role: ch == null ? 'empty' : (hot === 'ch' ? 'active' : undefined) },
    ],
  };
}

/* ---- teaching notes ---- */
const SETUP_NOTE =
  'Elements join a queue at the rear and leave from the front, like a line at a bank. This queue is ' +
  'an array called contents plus two indices. -1 is our way of saying an index points at nothing; ' +
  'watch for where that turns out to matter.';

const FIRST_NOTE =
  'An empty queue needs a special case: there is no front to follow, so front has to be set directly. ' +
  'A queue that tracked a count instead would not need this branch.';

const FULL_NOTE =
  'front 0, rear 3. Remember that pair — it is what a full queue looks like.';

const DELETE_NOTE =
  'The front of the queue is no longer at array position 0. One solution would be to move all the ' +
  'elements down one — but that is rejected as too expensive: every DELETE would touch every element. ' +
  'Instead we keep the index of the front element and move only that index. The greying is ours, for ' +
  'reading the picture. The program has no such marking — that character is still in the array.';

const WRAP_NOTE =
  'We use the array in a circular fashion: when we hit the end, we wrap around and use the beginning. ' +
  'next_ix is the one place that wrap is written down — without it, every line that advances an index ' +
  'would need its own test.';

const ONE_ELEMENT_NOTE =
  'front and rear on the same cell means exactly one element.';

const PAYOFF_NOTE =
  'Watch what that reset just prevented. Without it, front would be 1 and rear 0 — and click Back to ' +
  'the step where e was refused: front 0, rear 3, one cell apart in exactly the same way, with the ' +
  'queue completely full. front and rear alone cannot tell an empty queue from a full one. -1 is the ' +
  'extra piece of information that breaks the tie, and it costs a branch in ADD and a branch in DELETE. ' +
  'A queue that stores a count instead needs neither: empty is count = 0, full is count = MAX. Both ' +
  'representations work — the count just hands you the answers for free. Use whichever seems easiest ' +
  'for your own queue.';

const SENTINEL_NOTE =
  'The sentinel makes this test one comparison. What would you have had to check without it?';

function* trace() {
  const cellChar = [null, null, null, null];   // nothing stored yet
  const members = new Set();                    // no live members
  let front = -1, rear = -1, ch = null;
  const stream = [];

  const snap = ({ line, tag, narrate, note, active = null, compared = null, hot = null, frames, streamNew = false }) => ({
    line, tag, narrate, note,
    parked: frames.slice(0, -1).map(f => f.call).filter(Boolean),
    panels: {
      contents: contentsPanel(cellChar, members, front, rear, active, compared),
      state:    statePanel(front, rear, ch, hot),
      callstack: { frames: frames.map((f, i) => ({ fn: f.fn, vars: f.vars, active: i === frames.length - 1 })) },
      out: { lines: stream.map((t, i) => ({ text: t, dir: 'out', isNew: streamNew && i === stream.length - 1 })) },
    },
  });

  /* ADD of the FIRST element into an empty queue (6 steps). */
  function* addFirst(value, mLine, n) {
    yield snap({ line: mLine, tag: 'call', narrate: `main calls ADD with the value ${value}.`, frames: [mainF()] });
    yield snap({ line: 8, tag: 'test', narrate: n.test, frames: [mainF(mLine), addF(value)] });
    yield snap({ line: 11, tag: 'test', narrate: n.emptyTrue, frames: [mainF(mLine), addF(value)] });
    front = 0;
    yield snap({ line: 12, tag: 'assign', narrate: n.setFront, note: n.setFrontNote, hot: 'front', frames: [mainF(mLine), addF(value)] });
    rear = nextIx(rear);   // -1 -> 0
    yield snap({ line: 13, tag: 'assign', narrate: n.moveRear, hot: 'rear', frames: [mainF(mLine), addF(value)] });
    cellChar[rear] = value; members.add(rear);
    yield snap({ line: 14, tag: 'store', narrate: n.write, active: rear, frames: [mainF(mLine), addF(value)] });
  }

  /* ADD of a normal element (5 steps): the front special-case is skipped. */
  function* addNormal(value, mLine, n) {
    const r0 = rear, nx = nextIx(rear);
    yield snap({ line: mLine, tag: 'call', narrate: `main calls ADD with the value ${value}.`, frames: [mainF()] });
    yield snap({ line: 8, tag: 'test', narrate: n.test ?? `rear is ${r0}, so next_ix(${r0}) is ${nx}, and front is ${front}. They differ, so the queue is not full.`, frames: [mainF(mLine), addF(value)] });
    yield snap({ line: 11, tag: 'test', narrate: n.notEmpty ?? `front is ${front}, not -1, so the queue already has a front — the special case is skipped.`, frames: [mainF(mLine), addF(value)] });
    rear = nextIx(rear);
    yield snap({ line: 13, tag: 'assign', narrate: n.moveRear ?? `rear = next_ix(${r0}) = ${rear}. The rear index moves to cell ${rear}.`, note: n.moveRearNote, hot: 'rear', frames: [mainF(mLine), addF(value)] });
    cellChar[rear] = value; members.add(rear);
    yield snap({ line: 14, tag: 'store', narrate: n.write ?? `${value} is stored in cell ${rear}.`, active: rear, frames: [mainF(mLine), addF(value)] });
  }

  /* ADD refused, correctly (3 steps). */
  function* addRefused(value, mLine, n) {
    yield snap({ line: mLine, tag: 'call', narrate: `main calls ADD with the value ${value}.`, frames: [mainF()] });
    yield snap({ line: 8, tag: 'test', narrate: n.test, frames: [mainF(mLine), addF(value)] });
    stream.push('queue is full');
    yield snap({ line: 9, tag: 'refuse', narrate: n.refuse ?? `ADD refuses. ${value} is not added.`, note: n.note, streamNew: true, frames: [mainF(mLine), addF(value)] });
  }

  /* DELETE of a normal (not last) element (5 steps). */
  function* delNormal(mLine, n) {
    yield snap({ line: mLine, tag: 'call', narrate: 'main calls DELETE.', frames: [mainF()] });
    yield snap({ line: 17, tag: 'test', narrate: n.emptyTest ?? `front is ${front}, not -1, so the queue is not empty.`, frames: [mainF(mLine), delF()] });
    ch = cellChar[front]; const f0 = front;
    yield snap({ line: 20, tag: 'assign', narrate: n.read ?? `ch takes contents[front] = ${ch}.`, compared: f0, hot: 'ch', frames: [mainF(mLine), delF()] });
    yield snap({ line: 21, tag: 'test', narrate: n.lastTest ?? `front (${front}) and rear (${rear}) differ, so more than one element remains.`, frames: [mainF(mLine), delF()] });
    members.delete(f0); front = nextIx(f0);
    yield snap({ line: 25, tag: 'assign', narrate: n.advance ?? `front advances to cell ${front}. ${ch} is no longer part of the queue, though it remains in cell ${f0}.`, note: n.note, hot: 'front', frames: [mainF(mLine), delF()] });
  }

  /* DELETE of the LAST element (6 steps): both indices reset to -1. */
  function* delLast(mLine, n) {
    yield snap({ line: mLine, tag: 'call', narrate: 'main calls DELETE.', frames: [mainF()] });
    yield snap({ line: 17, tag: 'test', narrate: n.emptyTest ?? `front is ${front}, not -1, so the queue is not empty.`, frames: [mainF(mLine), delF()] });
    ch = cellChar[front]; const f0 = front;
    yield snap({ line: 20, tag: 'assign', narrate: n.read ?? `ch takes contents[front] = ${ch}.`, compared: f0, hot: 'ch', frames: [mainF(mLine), delF()] });
    yield snap({ line: 21, tag: 'test', narrate: n.lastTest, frames: [mainF(mLine), delF()] });
    members.delete(f0); front = -1;
    yield snap({ line: 22, tag: 'assign', narrate: n.resetFront ?? 'front is reset to -1.', hot: 'front', frames: [mainF(mLine), delF()] });
    rear = -1;
    yield snap({ line: 23, tag: 'assign', narrate: n.resetRear ?? 'rear is reset to -1. The queue is empty again.', note: n.note, hot: 'rear', frames: [mainF(mLine), delF()] });
  }

  /* DELETE refused, correctly (3 steps). */
  function* delRefused(mLine, n) {
    yield snap({ line: mLine, tag: 'call', narrate: 'main calls DELETE.', frames: [mainF()] });
    yield snap({ line: 17, tag: 'test', narrate: n.emptyTest ?? 'front is -1, so the queue is empty.', frames: [mainF(mLine), delF()] });
    stream.push('queue is empty');
    yield snap({ line: 18, tag: 'refuse', narrate: n.refuse ?? 'DELETE refuses. The queue is empty.', note: n.note, streamNew: true, frames: [mainF(mLine), delF()] });
  }

  /* ---------- Step 0 (required): the empty queue, nothing executed ---------- */
  yield snap({
    line: null, tag: 'init',
    narrate: 'An empty queue. Neither index points at a cell yet — both hold -1.',
    note: SETUP_NOTE,
    frames: [mainF()],
  });

  // OP 1 — ADD 'a' (first element; front -1->0, rear -1->0)
  yield* addFirst('a', 28, {
    test:      'rear is -1, so next_ix(rear) is 0, and front is -1. They differ, so the queue is not full.',
    emptyTrue: 'front is -1 — the queue is empty, so this is the first element and front must start at cell 0.',
    setFront:  'front is set to cell 0.',
    setFrontNote: FIRST_NOTE,
    moveRear:  'next_ix(-1) is 0, so rear moves to cell 0 as well.',
    write:     'a is stored in cell 0. The queue now holds one element.',
  });

  // OP 2 — ADD 'b' (normal; front is no longer -1, so the special case is skipped)
  yield* addNormal('b', 29, {
    notEmpty: 'front is 0, not -1, so the queue already has a front — the special case is skipped.',
  });

  // OP 3 — ADD 'c' (normal; kept brief)
  yield* addNormal('c', 30, {});

  // OP 4 — ADD 'd' (normal; queue becomes full)
  yield* addNormal('d', 31, {
    write: 'd is stored in cell 3. All four cells are in use.',
  });

  // OP 5 — ADD 'e' (refused, correctly)
  yield* addRefused('e', 32, {
    test:  'rear is 3, so next_ix(3) wraps to 0 — and front is 0. The cell after the rear is the front, so there is nowhere to put anything.',
    note:  FULL_NOTE,
  });

  // OP 6 — DELETE (removes 'a'; front 0->1)
  yield* delNormal(33, {
    advance: 'front advances to cell 1. a is no longer part of the queue, though it is still sitting in cell 0.',
    note:    DELETE_NOTE,
  });

  // OP 7 — ADD 'e' (wraparound; rear 3->0, over the stale a)
  yield* addNormal('e', 34, {
    moveRear:     'rear is at the last cell, so next_ix(3) wraps to 0.',
    moveRearNote: WRAP_NOTE,
    write:        'e is stored in cell 0, over the a that was removed earlier.',
  });

  // OP 8 — DELETE (removes 'b'; front 1->2)
  yield* delNormal(35, {
    advance: 'front advances to cell 2. b is no longer part of the queue, though it remains in cell 1.',
  });

  // OP 9 — DELETE (removes 'c'; front 2->3)
  yield* delNormal(36, {
    advance: 'front advances to cell 3. c is no longer part of the queue, though it remains in cell 2.',
  });

  // OP 10 — DELETE (removes 'd'; front wraps 3->0, meeting rear; one element left)
  yield* delNormal(37, {
    advance: 'front wraps to cell 0. One element is left, and front and rear are both 0.',
    note:    ONE_ELEMENT_NOTE,
  });

  // OP 11 — DELETE (removes 'e'; last element; both indices reset to -1) — THE PAYOFF
  yield* delLast(38, {
    lastTest: 'front and rear are the same cell, so this is the last element. Both indices go back to -1.',
    resetRear: 'rear is reset to -1. The queue is empty again.',
    note:     PAYOFF_NOTE,
  });

  // OP 12 — DELETE (refused, correctly)
  yield* delRefused(39, {
    emptyTest: 'front is -1, so the queue is empty.',
    note:      SENTINEL_NOTE,
  });
}

export default {
  title: 'A queue in an array',
  subtitle: 'Adding at the rear, removing from the front.',
  profile: 'standard',
  columns: 2,
  languages: ['pseudo', 'java', 'cpp'],

  // Every row sizes to its content, and every panel's height is RESERVED to its
  // maximum across the whole run by the engine (reserveHeights) -- the
  // "Function calls" stack to its deepest depth, the "output" stream to 3 lines
  // -- so no panel ever changes height and nothing below shifts as steps advance.
  // The stage hugs the taller (right) column, so the fixed 15-line code panel
  // sits at the top of the left column with no stray bottom slack. Design target
  // 1920x1080; a short embedded viewport degrades to cramped-but-complete with
  // the open-in-own-window escape hatch.
  stageRows: 'auto auto auto auto',

  panels: [
    { type: 'code',      id: 'code',      title: 'a queue, front + rear', tall: true,
      listings: LISTINGS, labels: { pseudo: 'pseudocode', java: 'Java', cpp: 'C++' } },
    { type: 'cells',     id: 'contents',  title: 'the array' },
    { type: 'cells',     id: 'state',     title: 'what we store', compact: true },
    { type: 'callstack', id: 'callstack', title: 'Function calls' },
    { type: 'stream',    id: 'out',       title: 'output', compact: true },
  ],

  initialTrace: 'run',
  traces: {
    run: trace,
  },
};
