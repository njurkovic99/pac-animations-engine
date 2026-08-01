/* ds — A2 "A queue in an array" (front + rear representation)
 *
 * One array-based queue, stored with front + rear (the lecture's "alternative
 * representation"), traced by a main() driver — the same shape as A1
 * (lists-array-insert-delete): main calls the operations, a CALLSTACK panel
 * shows each call with its bound parameter, and the caller's line dims while the
 * callee runs. An earlier draft ran two representations side by side (a race);
 * that left no room to show what operation was running or where its values came
 * from, so this cuts to one representation and spends the space on the driver
 * and the stack.
 *
 * There is NO count variable anywhere — not in the code, not in the state strip,
 * not as a hidden value. Its absence is the entire subject: front + rear alone
 * cannot tell a full queue from an empty one. The queue is filled, drained to
 * empty, and then one more ADD is REFUSED — wrongly — because the fullness test
 * (line 8) and the emptiness test (line 15) are the SAME expression,
 * next_ix(rear) = front, which is true for both a full and an empty queue. The
 * final note introduces count as the fix.
 *
 * next_ix is the wraparound helper. It is treated as ATOMIC — never stepped
 * into (that would be noise), and it pushes no CALLSTACK frame; each call's
 * result is narrated where it is used.
 *
 * Two things that look like bugs and are NOT (task brief §6):
 *   - Lines 8 and 15 are the identical expression. Deliberate — that identity
 *     is the lesson.
 *   - The final refusal is WRONG, and the animation says so. It is the point,
 *     not a trace error; the test is not to be "fixed".
 *
 * DELETE only moves an index; the removed character stays in memory as a `stale`
 * cell (greyed, value still shown, no member outline). The array is never
 * blanked — blanking it would wrongly imply the program can see emptiness by
 * looking at the array. Nothing here corrupts memory, so there is NO
 * memory-danger marker anywhere: a stale cell is healthy.
 *
 * WATCH only: one trace, no gates. The misconception is taught by narration and
 * notes on normal steps; the final note is a post-watch challenge. Metrics
 * counter hidden. */

const MAX = 4;

/* One listing, three ds languages, all line-aligned to a single 30-line grid,
 * so `line` is a plain number 1..30 that resolves the same in every language.
 * Lines 8 and 15 are the deliberately identical fullness / emptiness test. */
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
    '        rear = next_ix(rear)',        // 11
    '        contents[rear] = value',      // 12
    '',                                    // 13
    'DELETE()',                            // 14
    '    if next_ix(rear) = front',        // 15
    '        print "queue is empty"',      // 16
    '    else',                            // 17
    '        ch = contents[front]',        // 18
    '        front = next_ix(front)',      // 19
    '',                                    // 20
    'main()',                              // 21
    "    ADD('d')",                        // 22
    '    DELETE()',                        // 23
    "    ADD('e')",                        // 24
    "    ADD('f')",                        // 25
    '    DELETE()',                        // 26
    '    DELETE()',                        // 27
    '    DELETE()',                        // 28
    '    DELETE()',                        // 29
    "    ADD('g')",                        // 30
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
    '        rear = next_ix(rear);',       // 11
    '        contents[rear] = value; } }', // 12
    '',                                    // 13
    'void delete() {',                     // 14
    '    if (next_ix(rear) == front)',     // 15
    '        out.println("queue is empty");',// 16
    '    else {',                          // 17
    '        ch = contents[front];',       // 18
    '        front = next_ix(front); } }', // 19
    '',                                    // 20
    'void main() {',                       // 21
    "    add('d');",                       // 22
    '    delete();',                       // 23
    "    add('e');",                       // 24
    "    add('f');",                       // 25
    '    delete();',                       // 26
    '    delete();',                       // 27
    '    delete();',                       // 28
    '    delete();',                       // 29
    "    add('g'); }",                     // 30
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
    '        rear = next_ix(rear);',       // 11
    '        contents[rear] = value; } }', // 12
    '',                                    // 13
    'void dequeue() {',                    // 14
    '    if (next_ix(rear) == front)',     // 15
    '        cout << "queue is empty";',   // 16
    '    else {',                          // 17
    '        ch = contents[front];',       // 18
    '        front = next_ix(front); } }', // 19
    '',                                    // 20
    'int main() {',                        // 21
    "    add('d');",                       // 22
    '    dequeue();',                      // 23
    "    add('e');",                       // 24
    "    add('f');",                       // 25
    '    dequeue();',                      // 26
    '    dequeue();',                      // 27
    '    dequeue();',                      // 28
    '    dequeue();',                      // 29
    "    add('g'); }",                     // 30
  ],
};

/* Semantic line keys. Because all three listings share one 30-line grid, each is
 * a plain number that resolves the same in every language. */
const L = {
  addTest: 8, addStore: 11, addWrite: 12,          // ADD: test | rear = next_ix(rear) | contents[rear] = value
  addFull: 9,                                       // the refusal print
  delTest: 15, delRead: 18, delAdvance: 19,         // DELETE: test | ch = contents[front] | front = next_ix(front)
  // main()'s call lines, one per operation, in order.
  mAdd_d: 22, mDel1: 23, mAdd_e: 24, mAdd_f: 25,
  mDel2: 26, mDel3: 27, mDel4: 28, mDel5: 29, mAdd_g: 30,
};

/* ---- call-frame builders (immutable: a fresh frame each step). `call` is the
 * line the frame is PARKED at while a callee runs — dimmed in the code panel
 * (AUTHORING.md "Line highlight — active line vs. parked caller lines"). Only
 * caller frames carry it; the running (top) frame's line is the bright one.
 * main has no params/locals; ADD binds value; DELETE has none (ch is global —
 * it lives in the state strip, as the lecture draws it). */
const mainF = call        => ({ fn: 'main',   vars: [],                         call });
const addF  = value       => ({ fn: 'ADD',    vars: [{ name: 'value', value }] });
const delF  = ()          => ({ fn: 'DELETE', vars: [] });

/* The contents array as a marked CELLS row: index-pointer markers (front, rear)
 * below the cells, [0]..[3] labels, the row named "contents". A cell is empty
 * (never held anything), a member (a live queue element), stale (removed, still
 * in memory — greyed), active (written this step, blue), or compared (read this
 * step). */
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

/* The compact state strip: the two indices and ch, as a HORIZONTAL row of three
 * labelled boxes, all visible at once. `hot` gives the box changing this step
 * the blue activity fill. There is deliberately no count box. */
function statePanel(front, rear, ch, hot) {
  return {
    render: 'box',
    cells: [
      { label: 'front', value: front,               role: hot === 'front' ? 'active' : undefined },
      { label: 'rear',  value: rear,                role: hot === 'rear'  ? 'active' : undefined },
      { label: 'ch',    value: ch == null ? '—' : ch, role: hot === 'ch'   ? 'active' : undefined },
    ],
  };
}

/* ---- teaching notes (each attaches to one step). None describe memory
 * corruption, so none is a danger segment. ---- */
const SETUP_NOTE =
  'Elements join a queue at the rear and leave from the front, like a line at a bank. This queue is ' +
  'an array called contents, plus two indices: front marks the element at the front, rear marks the ' +
  'element at the rear.';

const DELETE_NOTE =
  'The front of the queue is no longer at array position 0. One solution would be to move all the ' +
  'elements down one — but that is rejected as too expensive: every DELETE would touch every element. ' +
  'Instead we keep the index of the front element and move only that index. The greying is ours, for ' +
  'reading the picture. The program has no such marking — that character is still in the array.';

const WRAP_NOTE =
  'We use the array in a circular fashion: when we hit the end, we wrap around and use the beginning. ' +
  'next_ix is the one place that wrap is written down — without it, every line that advances an index ' +
  'would need its own test.';

const FULL_NOTE =
  'Read that test again: the cell after rear is front, so there is nowhere left to put anything. It is ' +
  'correct here. Keep that sentence in mind.';

const ONE_ELEMENT_NOTE =
  'front and rear on the same cell means exactly one element. That state is not ambiguous — the test ' +
  'reads it correctly.';

const EMPTY_NOTE =
  'Look at the two indices: front 1, rear 0. Click Back to the step where f was refused and compare — ' +
  'they were 1 and 0 there too, with the queue completely full. The queue is now completely empty and ' +
  'the stored state is identical.';

const PAYOFF_NOTE =
  'The same test that correctly reported a full queue a moment ago now reports a full queue that is ' +
  'empty. front and rear alone cannot tell those two states apart. This is not a reason to avoid ' +
  'tracking the rear — it is one piece of information short. Store a count alongside the array and both ' +
  'questions become trivial: empty is count = 0, full is count = MAX. The other common fix is to ' +
  'sacrifice one cell, never letting the queue hold more than MAX − 1 elements. What would the full ' +
  'test become then, and what would empty look like? Either representation is fine for your own queue — ' +
  'the count just hands you the answer for free.';

function* trace() {
  // Mutable model. cellChar persists a character even after it leaves the queue
  // (that is what `stale` shows); `members` is the set of live queue indices.
  const cellChar = ['a', 'b', 'c', null];
  const members = new Set([0, 1, 2]);
  let front = 0, rear = 2, ch = null;
  const stream = [];   // STREAM lines (out); exactly two "queue is full" over the run

  /* One snapshot. `frames` is bottom-to-top; the last is the running frame and
   * every frame below it is a parked caller whose `call` line dims. */
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

  /* ---------- Step 0 (required): initial state, nothing executed ---------- */
  yield snap({
    line: null, tag: 'init',
    narrate: 'A queue holding three characters. a is at the front, c is at the rear.',
    note: SETUP_NOTE,
    frames: [mainF()],
  });

  /* ===================== OP 1 — ADD 'd' (rear 2 -> 3; fills) ===================== */
  yield snap({ line: L.mAdd_d, tag: 'call', narrate: 'main calls ADD with the value d.', frames: [mainF()] });
  yield snap({
    line: L.addTest, tag: 'test',
    narrate: 'rear is 2, so next_ix(2) is 3; front is 0. They differ, so the queue is not full.',
    frames: [mainF(L.mAdd_d), addF('d')],
  });
  rear = 3;
  yield snap({
    line: L.addStore, tag: 'assign',
    narrate: 'rear = next_ix(2) = 3. The rear index moves to cell 3.',
    hot: 'rear', frames: [mainF(L.mAdd_d), addF('d')],
  });
  cellChar[3] = 'd'; members.add(3);
  yield snap({
    line: L.addWrite, tag: 'store',
    narrate: 'd is stored in cell 3. The queue now holds four characters — it is full.',
    active: 3, frames: [mainF(L.mAdd_d), addF('d')],
  });

  /* ===================== OP 2 — DELETE (removes 'a'; front 0 -> 1) ===================== */
  yield snap({ line: L.mDel1, tag: 'call', narrate: 'main calls DELETE.', frames: [mainF()] });
  yield snap({
    line: L.delTest, tag: 'test',
    narrate: 'DELETE tests whether the queue is empty. It is not, so DELETE removes the front element.',
    frames: [mainF(L.mDel1), delF()],
  });
  ch = cellChar[front];   // 'a'
  yield snap({
    line: L.delRead, tag: 'assign',
    narrate: 'ch takes contents[front] — the element at cell 0, which is a.',
    compared: front, hot: 'ch', frames: [mainF(L.mDel1), delF()],
  });
  members.delete(front); front = 1;
  yield snap({
    line: L.delAdvance, tag: 'assign',
    narrate: 'front advances to cell 1. a is no longer part of the queue, though it is still sitting in cell 0.',
    note: DELETE_NOTE, hot: 'front', frames: [mainF(L.mDel1), delF()],
  });

  /* ===================== OP 3 — ADD 'e' (WRAPAROUND; rear 3 -> 0; fills) ===================== */
  yield snap({ line: L.mAdd_e, tag: 'call', narrate: 'main calls ADD with the value e.', frames: [mainF()] });
  yield snap({
    line: L.addTest, tag: 'test',
    narrate: 'rear is 3, so next_ix(3) is 0; front is 1. They differ, so the queue is not full.',
    frames: [mainF(L.mAdd_e), addF('e')],
  });
  rear = 0;
  yield snap({
    line: L.addStore, tag: 'assign',
    narrate: 'rear is at the last cell, so next_ix(3) wraps to 0. rear moves to the beginning of the array.',
    note: WRAP_NOTE, hot: 'rear', frames: [mainF(L.mAdd_e), addF('e')],
  });
  cellChar[0] = 'e'; members.add(0);
  yield snap({
    line: L.addWrite, tag: 'store',
    narrate: 'e is stored in cell 0, over the a that was removed earlier.',
    active: 0, frames: [mainF(L.mAdd_e), addF('e')],
  });

  /* ===================== OP 4 — ADD 'f' (REFUSED, correctly) ===================== */
  yield snap({ line: L.mAdd_f, tag: 'call', narrate: 'main calls ADD with the value f.', frames: [mainF()] });
  yield snap({
    line: L.addTest, tag: 'test',
    narrate: 'rear is 0, so next_ix(0) is 1 — and front is 1. The cell after the rear is the front, so the queue is full.',
    frames: [mainF(L.mAdd_f), addF('f')],
  });
  stream.push('queue is full');
  yield snap({
    line: L.addFull, tag: 'refuse',
    narrate: 'ADD refuses. f is not added.',
    note: FULL_NOTE, streamNew: true, frames: [mainF(L.mAdd_f), addF('f')],
  });

  /* ===================== OP 5 — DELETE (removes 'b'; front 1 -> 2) ===================== */
  yield snap({ line: L.mDel2, tag: 'call', narrate: 'main calls DELETE.', frames: [mainF()] });
  yield snap({
    line: L.delTest, tag: 'test',
    narrate: 'The queue is not empty, so DELETE removes the front element.',
    frames: [mainF(L.mDel2), delF()],
  });
  ch = cellChar[front];   // 'b'
  yield snap({
    line: L.delRead, tag: 'assign', narrate: 'ch takes contents[front] = b.',
    compared: front, hot: 'ch', frames: [mainF(L.mDel2), delF()],
  });
  members.delete(front); front = 2;
  yield snap({
    line: L.delAdvance, tag: 'assign',
    narrate: 'front advances to cell 2. b is no longer part of the queue, though it remains in cell 1.',
    hot: 'front', frames: [mainF(L.mDel2), delF()],
  });

  /* ===================== OP 6 — DELETE (removes 'c'; front 2 -> 3) ===================== */
  yield snap({ line: L.mDel3, tag: 'call', narrate: 'main calls DELETE.', frames: [mainF()] });
  yield snap({
    line: L.delTest, tag: 'test',
    narrate: 'The queue is not empty, so DELETE removes the front element.',
    frames: [mainF(L.mDel3), delF()],
  });
  ch = cellChar[front];   // 'c'
  yield snap({
    line: L.delRead, tag: 'assign', narrate: 'ch takes contents[front] = c.',
    compared: front, hot: 'ch', frames: [mainF(L.mDel3), delF()],
  });
  members.delete(front); front = 3;
  yield snap({
    line: L.delAdvance, tag: 'assign',
    narrate: 'front advances to cell 3. c is no longer part of the queue, though it remains in cell 2.',
    hot: 'front', frames: [mainF(L.mDel3), delF()],
  });

  /* ===================== OP 7 — DELETE (removes 'd'; front 3 -> 0 wraps) ===================== */
  yield snap({ line: L.mDel4, tag: 'call', narrate: 'main calls DELETE.', frames: [mainF()] });
  yield snap({
    line: L.delTest, tag: 'test',
    narrate: 'The queue is not empty, so DELETE removes the front element.',
    frames: [mainF(L.mDel4), delF()],
  });
  ch = cellChar[front];   // 'd'
  yield snap({
    line: L.delRead, tag: 'assign', narrate: 'ch takes contents[front] = d.',
    compared: front, hot: 'ch', frames: [mainF(L.mDel4), delF()],
  });
  members.delete(front); front = 0;   // next_ix(3) wraps to 0; front and rear both 0 now
  yield snap({
    line: L.delAdvance, tag: 'assign',
    narrate: 'front is at the last cell, so it wraps to 0. One element is left: e, in cell 0. front and rear are both 0 now.',
    note: ONE_ELEMENT_NOTE, hot: 'front', frames: [mainF(L.mDel4), delF()],
  });

  /* ===================== OP 8 — DELETE (removes 'e'; queue empties; front 0 -> 1) ===================== */
  yield snap({ line: L.mDel5, tag: 'call', narrate: 'main calls DELETE.', frames: [mainF()] });
  yield snap({
    line: L.delTest, tag: 'test',
    narrate: 'One element remains, so DELETE removes it.',
    frames: [mainF(L.mDel5), delF()],
  });
  ch = cellChar[front];   // 'e'
  yield snap({
    line: L.delRead, tag: 'assign', narrate: 'ch takes contents[front] = e.',
    compared: front, hot: 'ch', frames: [mainF(L.mDel5), delF()],
  });
  members.delete(front); front = 1;   // queue now empty; front 1, rear 0
  yield snap({
    line: L.delAdvance, tag: 'assign',
    narrate: 'front advances to cell 1. Every cell is stale now — the characters are still there, but none of them belong to the queue. front is 1 and rear is 0.',
    note: EMPTY_NOTE, hot: 'front', frames: [mainF(L.mDel5), delF()],
  });

  /* ===================== OP 9 — ADD 'g' (REFUSED, WRONGLY — the payoff) ===================== */
  yield snap({ line: L.mAdd_g, tag: 'call', narrate: 'main calls ADD with the value g.', frames: [mainF()] });
  yield snap({
    line: L.addTest, tag: 'test',
    narrate: 'rear is 0, so next_ix(0) is 1 — and front is 1. The test says the queue is full.',
    frames: [mainF(L.mAdd_g), addF('g')],
  });
  stream.push('queue is full');
  yield snap({
    line: L.addFull, tag: 'refuse',
    narrate: 'ADD refuses. g is not added — but the queue is empty.',
    note: PAYOFF_NOTE, streamNew: true, frames: [mainF(L.mAdd_g), addF('g')],
  });
}

export default {
  title: 'A queue in an array',
  subtitle: 'Adding at the rear, removing from the front.',
  profile: 'standard',
  columns: 2,
  languages: ['pseudo', 'java', 'cpp'],

  // Left column: the code listing, full height, spanning the right column's four
  // content-sized rows (it scrolls internally when the listing is taller than
  // that — the legitimate scrolling case). Right column: the array, the state
  // strip, the call stack, and a short output stream, each sized to its content.
  // See the engine's `tall` panel flag and `spec.stageRows`.
  // A fixed 160px call-stack row (fits its two frames without clipping and, being
  // fixed, keeps the panels below it from shifting as frames push/pop). The
  // trailing 1fr absorbs any slack below the output panel. Design target is
  // 1920x1080, where every panel is fully visible; a short embedded viewport
  // degrades to cramped-but-complete, with the open-in-own-window link as the
  // escape hatch.
  stageRows: 'auto auto 160px 1fr',

  panels: [
    { type: 'code',      id: 'code',      title: 'a queue, front + rear', tall: true,
      listings: LISTINGS, labels: { pseudo: 'pseudocode', java: 'Java', cpp: 'C++' } },
    { type: 'cells',     id: 'contents',  title: 'the array' },
    { type: 'cells',     id: 'state',     title: 'what we store', compact: true },
    { type: 'callstack', id: 'callstack', title: 'call stack' },
    { type: 'stream',    id: 'out',       title: 'output', compact: true },
  ],

  initialTrace: 'run',
  traces: {
    run: trace,
  },
};
