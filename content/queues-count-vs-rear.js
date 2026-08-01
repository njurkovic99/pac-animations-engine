/* ds — A2 "Queues: two representations, stepped side by side"
 *
 * The repo's FIRST race animation (AUTHORING.md "Race mode — lockstep
 * comparison"), and it drives a COMPARISON, not a competition: the same queue
 * of characters, stored two ways, advanced in lockstep. No winner, no timing,
 * no statement counter. Two capabilities debut here (HANDOFF.md): the race
 * driver (`traces.x = { racers, merge }`) and the index-pointer markers under a
 * CELLS row (`markers: [{label, index}]`). The `stale` CELLS role debuts too.
 *
 *   Representation A — front + count : stores how many elements there are.
 *   Representation B — front + rear  : stores where the rear element sits.
 *
 * Both hold an identical array and an identical `front`; they differ only in
 * the bookkeeping alongside it. The arrays evolve identically for 30 steps and
 * diverge exactly once, on the final ADD: with the queue empty, B's fullness
 * test — the same expression it uses to detect empty — reports the queue full
 * and refuses, while A, holding an explicit count, adds correctly. That single
 * divergence is the lesson: front and rear alone cannot tell a full queue from
 * an empty one; a count can.
 *
 * Two things that look like bugs and are NOT (see the task brief, §6):
 *   - Rep B has NO highlighted line on the 4th phase of every operation. That
 *     is the idle — B has no bookkeeping line to run. An idling racer yields
 *     {idle:true}: its panel state carries over unchanged and no line lights up.
 *   - Rep B's line 2 and line 10 are the identical expression. Deliberate — that
 *     identity is the whole lesson; it is not to be "improved".
 *
 * DELETE, in this build, only moves an index; the removed character stays in
 * memory as a `stale` cell (greyed, value still shown, no member outline).
 * Blanking it would wrongly imply the program can see emptiness by looking at
 * the array — the exact misconception this animation exists to kill. Nothing
 * here corrupts memory, so there is NO memory-danger ⚠ anywhere: a stale cell is
 * healthy.
 *
 * WATCH only: one (race) trace, no gates, no predict steps. The common
 * misconception is taught by NARRATION and NOTES on normal steps, and the final
 * note is a post-watch challenge (AUTHORING.md). No CALLSTACK panel (the lesson
 * is representation choice, not call structure), no STREAM (the two refusals are
 * narrated), no metrics counter. */

const MAX = 4;

/* next_ix is shown once, in a shared preamble panel above both columns. It is
 * treated as ATOMIC — never stepped into (stepping in would desynchronise the
 * racers), so its result is narrated where it is used. */
const PREAMBLE = {
  pseudo: [
    'next_ix(i)',                                        // 1
    '    if i = MAX - 1 then return 0 else return i + 1', // 2
  ],
  java: [
    'int next_ix(int i) {',                              // 1
    '    return (i == MAX - 1) ? 0 : i + 1; }',          // 2
  ],
  cpp: [
    'int next_ix(int i) {',                              // 1
    '    return (i == MAX - 1) ? 0 : i + 1; }',          // 2
  ],
};

/* The two operation listings. All six (A/B × pseudo/java/cpp) are 15 lines and
 * line-aligned to each ONE grid, so a `line` is a single number 1..15 that
 * resolves the same in every language of a rep. The blank lines in B are
 * meaningful and sit opposite A's extra statements: A's `count` update on line 7
 * (ADD) and line 15 (DELETE) faces a blank in B, because B has no bookkeeping
 * line there. Lines 2 and 10 of B are deliberately the identical expression. */
const LISTING_A = {
  pseudo: [
    'ADD(value)',                                        // 1
    '    if count = MAX',                                // 2
    '        print "queue is full"',                     // 3
    '    else',                                          // 4
    '        pos = (front + count) MOD MAX',             // 5
    '        contents[pos] = value',                     // 6
    '        count = count + 1',                         // 7
    '',                                                  // 8
    'DELETE()',                                          // 9
    '    if count = 0',                                  // 10
    '        print "queue is empty"',                    // 11
    '    else',                                          // 12
    '        ch = contents[front]',                      // 13
    '        front = next_ix(front)',                    // 14
    '        count = count - 1',                         // 15
  ],
  java: [
    'void add(char value) {',                            // 1
    '    if (count == MAX)',                             // 2
    '        out.println("queue is full");',             // 3
    '    else {',                                        // 4
    '        int pos = (front + count) % MAX;',          // 5
    '        contents[pos] = value;',                    // 6
    '        count = count + 1; } }',                    // 7
    '',                                                  // 8
    'void delete() {',                                   // 9
    '    if (count == 0)',                               // 10
    '        out.println("queue is empty");',            // 11
    '    else {',                                        // 12
    '        ch = contents[front];',                     // 13
    '        front = next_ix(front);',                   // 14
    '        count = count - 1; } }',                    // 15
  ],
  cpp: [
    'void add(char value) {',                            // 1
    '    if (count == MAX)',                             // 2
    '        cout << "queue is full";',                  // 3
    '    else {',                                        // 4
    '        int pos = (front + count) % MAX;',          // 5
    '        contents[pos] = value;',                    // 6
    '        count = count + 1; } }',                    // 7
    '',                                                  // 8
    'void dequeue() {',                                  // 9
    '    if (count == 0)',                               // 10
    '        cout << "queue is empty";',                 // 11
    '    else {',                                        // 12
    '        ch = contents[front];',                     // 13
    '        front = next_ix(front);',                   // 14
    '        count = count - 1; } }',                    // 15
  ],
};

const LISTING_B = {
  pseudo: [
    'ADD(value)',                                        // 1
    '    if next_ix(rear) = front',                      // 2
    '        print "queue is full"',                     // 3
    '    else',                                          // 4
    '        rear = next_ix(rear)',                      // 5
    '        contents[rear] = value',                    // 6
    '',                                                  // 7
    '',                                                  // 8
    'DELETE()',                                          // 9
    '    if next_ix(rear) = front',                      // 10
    '        print "queue is empty"',                    // 11
    '    else',                                          // 12
    '        ch = contents[front]',                      // 13
    '        front = next_ix(front)',                    // 14
    '',                                                  // 15
  ],
  java: [
    'void add(char value) {',                            // 1
    '    if (next_ix(rear) == front)',                   // 2
    '        out.println("queue is full");',             // 3
    '    else {',                                        // 4
    '        rear = next_ix(rear);',                     // 5
    '        contents[rear] = value; } }',               // 6
    '',                                                  // 7
    '',                                                  // 8
    'void delete() {',                                   // 9
    '    if (next_ix(rear) == front)',                   // 10
    '        out.println("queue is empty");',            // 11
    '    else {',                                        // 12
    '        ch = contents[front];',                     // 13
    '        front = next_ix(front); } }',               // 14
    '',                                                  // 15
  ],
  cpp: [
    'void add(char value) {',                            // 1
    '    if (next_ix(rear) == front)',                   // 2
    '        cout << "queue is full";',                  // 3
    '    else {',                                        // 4
    '        rear = next_ix(rear);',                     // 5
    '        contents[rear] = value; } }',               // 6
    '',                                                  // 7
    '',                                                  // 8
    'void dequeue() {',                                  // 9
    '    if (next_ix(rear) == front)',                   // 10
    '        cout << "queue is empty";',                 // 11
    '    else {',                                        // 12
    '        ch = contents[front];',                     // 13
    '        front = next_ix(front); } }',               // 14
    '',                                                  // 15
  ],
};

/* One queue's array as a marked CELLS row. A cell is:
 *   - empty (never held anything): no value, dimmed  -> role 'empty'
 *   - member (a live queue element): value shown, member outline (default cell)
 *   - stale (removed, still in memory): value shown greyed, no outline -> 'stale'
 *   - active (written THIS step): blue activity fill  -> role 'active'
 * `markers` are the index pointers rendered below the row (front, and — B only —
 * rear). All markers are solid/stored; Rep A never shows a rear. */
function queue(cellChar, members, markers, activeIdx) {
  return {
    render: 'box',
    rowLabel: 'contents',
    cells: cellChar.map((v, i) => {
      // A non-breaking space keeps an empty cell the same height as a filled one
      // (so the index label and marker track stay aligned across the row) while
      // still showing no visible value.
      if (i === activeIdx) return { value: v == null ? ' ' : v, role: 'active' };
      if (v == null)       return { value: ' ', role: 'empty' };
      if (members.has(i))  return { value: v };
      return { value: v, role: 'stale' };
    }),
    markers,
  };
}

/* The compact strip: what each rep stores alongside the array. A HORIZONTAL row
 * of three labelled boxes — [front][count/rear][ch] — all visible at once, no
 * scrolling. A and B differ in exactly one box (count vs rear); everything else —
 * order, widths, styling, the front and ch boxes — is identical. `hot` gives the
 * box changing this step the blue activity fill. */
function strip(a, b, c, hot) {
  return {
    render: 'box',
    cells: [
      { label: a.label, value: a.value, role: hot === a.label ? 'active' : undefined },
      { label: b.label, value: b.value, role: hot === b.label ? 'active' : undefined },
      { label: c.label, value: c.value, role: hot === c.label ? 'active' : undefined },
    ],
  };
}

const dash = v => (v == null ? '—' : v);   // em dash for "no value"

/* ---- Racer A: front + count ---------------------------------------------- */
function* racerA() {
  const ch = ['a', 'b', 'c', null];
  const mem = new Set([0, 1, 2]);
  let front = 0, count = 3, chVar = null;

  const q = active => queue(ch, mem, [{ label: 'front', index: front }], active);
  const s = hot => strip(
    { label: 'front', value: front },
    { label: 'count', value: count },
    { label: 'ch',    value: dash(chVar) }, hot);
  const yA = (line, active = null, hot = null) => ({ line, q: q(active), s: s(hot) });

  yield yA(null);                                   // 0  initial state, nothing executed

  // OP1 ADD d
  yield yA(2);                                       // 1  test fullness
  yield yA(5);                                       // 2  pos = (0+3) MOD 4 = 3
  ch[3] = 'd'; mem.add(3);
  yield yA(6, 3);                                    // 3  store d in cell 3
  count = 4;
  yield yA(7, null, 'count');                        // 4  count = 4

  // OP2 DELETE (removes a)
  yield yA(10);                                      // 5  test emptiness
  chVar = 'a';
  yield yA(13, null, 'ch');                          // 6  ch = a
  mem.delete(0); front = 1;
  yield yA(14, null, 'front');                       // 7  front advances; cell 0 stale
  count = 3;
  yield yA(15, null, 'count');                       // 8  count = 3

  // OP3 ADD e (wraparound)
  yield yA(2);                                       // 9  test fullness
  yield yA(5);                                       // 10 pos = (1+3) MOD 4 = 0
  ch[0] = 'e'; mem.add(0);
  yield yA(6, 0);                                    // 11 store e in cell 0
  count = 4;
  yield yA(7, null, 'count');                        // 12 count = 4 (full)

  // OP4 ADD f (refused)
  yield yA(2);                                       // 13 test fullness -> full
  yield yA(3);                                       // 14 refuse

  // OP5 DELETE (removes b)
  yield yA(10);                                      // 15 test emptiness
  chVar = 'b';
  yield yA(13, null, 'ch');                          // 16 ch = b
  mem.delete(1); front = 2;
  yield yA(14, null, 'front');                       // 17 front advances; cell 1 stale
  count = 3;
  yield yA(15, null, 'count');                       // 18 count = 3

  // OP6 DELETE (removes c)
  yield yA(10);                                      // 19
  chVar = 'c';
  yield yA(13, null, 'ch');                          // 20 ch = c
  mem.delete(2); front = 3;
  yield yA(14, null, 'front');                       // 21 front advances; cell 2 stale
  count = 2;
  yield yA(15, null, 'count');                       // 22 count = 2

  // OP7 DELETE (removes d; front wraps 3 -> 0)
  yield yA(10);                                      // 23
  chVar = 'd';
  yield yA(13, null, 'ch');                          // 24 ch = d
  mem.delete(3); front = 0;
  yield yA(14, null, 'front');                       // 25 front wraps to 0; cell 3 stale
  count = 1;
  yield yA(15, null, 'count');                       // 26 count = 1

  // OP8 DELETE (removes e; queue empties)
  yield yA(10);                                      // 27
  chVar = 'e';
  yield yA(13, null, 'ch');                          // 28 ch = e
  mem.delete(0); front = 1;
  yield yA(14, null, 'front');                       // 29 front advances; every cell stale
  count = 0;
  yield yA(15, null, 'count');                       // 30 count = 0 (empty)

  // OP9 ADD g (the divergence — A adds correctly)
  yield yA(2);                                       // 31 test fullness -> room
  yield yA(5);                                       // 32 pos = (1+0) MOD 4 = 1
  ch[1] = 'g'; mem.add(1);
  yield yA(6, 1);                                    // 33 store g in cell 1
  count = 1;
  yield yA(7, null, 'count');                        // 34 count = 1
}

/* ---- Racer B: front + rear ----------------------------------------------- */
function* racerB() {
  const ch = ['a', 'b', 'c', null];
  const mem = new Set([0, 1, 2]);
  let front = 0, rear = 2, chVar = null;

  const q = active => queue(ch, mem,
    [{ label: 'front', index: front }, { label: 'rear', index: rear }], active);
  const s = hot => strip(
    { label: 'front', value: front },
    { label: 'rear',  value: rear },
    { label: 'ch',    value: dash(chVar) }, hot);
  const yB = (line, active = null, hot = null) => ({ line, q: q(active), s: s(hot) });
  const idle = () => ({ idle: true });

  yield yB(null);                                   // 0  initial state

  // OP1 ADD d
  yield yB(2);                                       // 1  test fullness
  rear = 3;
  yield yB(5, null, 'rear');                         // 2  rear = next_ix(2) = 3
  ch[3] = 'd'; mem.add(3);
  yield yB(6, 3);                                    // 3  store d in cell 3
  yield idle();                                      // 4  IDLE (no bookkeeping line)

  // OP2 DELETE (removes a)
  yield yB(10);                                      // 5  test emptiness
  chVar = 'a';
  yield yB(13, null, 'ch');                          // 6  ch = a
  mem.delete(0); front = 1;
  yield yB(14, null, 'front');                       // 7  front advances; cell 0 stale
  yield idle();                                      // 8  IDLE

  // OP3 ADD e (wraparound)
  yield yB(2);                                       // 9  test fullness
  rear = 0;
  yield yB(5, null, 'rear');                         // 10 rear = next_ix(3) = 0
  ch[0] = 'e'; mem.add(0);
  yield yB(6, 0);                                    // 11 store e in cell 0
  yield idle();                                      // 12 IDLE

  // OP4 ADD f (refused)
  yield yB(2);                                       // 13 test fullness -> full
  yield yB(3);                                       // 14 refuse

  // OP5 DELETE (removes b)
  yield yB(10);                                      // 15
  chVar = 'b';
  yield yB(13, null, 'ch');                          // 16 ch = b
  mem.delete(1); front = 2;
  yield yB(14, null, 'front');                       // 17 front advances; cell 1 stale
  yield idle();                                      // 18 IDLE

  // OP6 DELETE (removes c)
  yield yB(10);                                      // 19
  chVar = 'c';
  yield yB(13, null, 'ch');                          // 20 ch = c
  mem.delete(2); front = 3;
  yield yB(14, null, 'front');                       // 21 front advances; cell 2 stale
  yield idle();                                      // 22 IDLE

  // OP7 DELETE (removes d; front wraps 3 -> 0, meeting rear at 0)
  yield yB(10);                                      // 23
  chVar = 'd';
  yield yB(13, null, 'ch');                          // 24 ch = d
  mem.delete(3); front = 0;
  yield yB(14, null, 'front');                       // 25 front wraps to 0; front and rear both 0
  yield idle();                                      // 26 IDLE

  // OP8 DELETE (removes e; queue empties)
  yield yB(10);                                      // 27
  chVar = 'e';
  yield yB(13, null, 'ch');                          // 28 ch = e
  mem.delete(0); front = 1;
  yield yB(14, null, 'front');                       // 29 front advances; every cell stale
  yield idle();                                      // 30 IDLE (front 1, rear 0)

  // OP9 ADD g (the divergence — B refuses, then idles the last two phases)
  yield yB(2);                                       // 31 test fullness -> "full" (but empty!)
  yield yB(3);                                       // 32 refuse
  yield idle();                                      // 33 IDLE
  yield idle();                                      // 34 IDLE
}

/* ---- Shared narration + notes, indexed by step ---------------------------- */
const N = [
  // 0
  { n: 'A queue holding three characters. a is at the front, c is at the rear. Both sides hold the same three characters in the same array — they differ only in what they store alongside it.',
    note: 'Elements join a queue at the rear and leave from the front, like a line at a bank. Both representations store the array and the index of the front. Where they part company: A stores how many elements there are, B stores where the rear is.' },

  // OP1 ADD d
  { n: 'A checks count against MAX: 3 is not 4. B checks whether the cell after rear is the front: cell 3 is not cell 0. Neither queue is full.' },
  { n: 'A computes pos = (0 + 3) MOD 4 = 3. B sets rear = next_ix(2) = 3. Both arrive at cell 3 by different arithmetic.' },
  { n: 'd is stored in cell 3 on both sides.' },
  { n: 'A increments count to 4. B has nothing left to do — it moved rear in the same line that found the destination.',
    note: "This is A's standing obligation: the count must be updated on every operation or the queue silently lies about its own size. B pays nothing here — but watch what it costs B later." },

  // OP2 DELETE a
  { n: 'A checks whether count is 0: it is not, so the queue is not empty. B runs its emptiness test. Both go on to remove the element at the front.' },
  { n: 'ch is assigned a, the element at the front, on both sides.' },
  { n: 'front advances to cell 1 on both sides. a is no longer part of the queue, though it is still sitting in cell 0.',
    note: 'The front of the queue is no longer at array position 0. One solution would be to move all the elements down one — but that is rejected as too expensive: every DELETE would touch every element. Instead both representations keep the index of the front element and move only that index. The greying is ours, for reading the picture. Neither program marks those cells in any way.' },
  { n: 'A decrements count to 3. B, again, has nothing to update.' },

  // OP3 ADD e (wraparound)
  { n: 'front is 1, rear is 3. Neither queue is full.' },
  { n: 'A computes (1 + 3) MOD 4 = 4 MOD 4 = 0. B computes next_ix(3) = 0, because 3 is the last cell. Both wrap to the beginning.',
    note: 'We use the array in a circular fashion: when we hit the end, we wrap around and use the beginning. A gets there with MOD, B gets there with next_ix. Same destination, two spellings.' },
  { n: 'e is stored in cell 0, over the a that was removed earlier.' },
  { n: "A increments count to 4 — the queue is full. B's rear is now 0, one cell behind its front." },

  // OP4 ADD f (both refuse)
  { n: 'A: count is 4, which is MAX. B: the cell after rear is next_ix(0) = 1, which is exactly front. Both say full.' },
  { n: 'Both refuse. f is not added.',
    note: "Both tests are right, and they agree. Remember what B's test says: the cell after rear is the front. Keep an eye on that sentence." },

  // OP5 DELETE b
  { n: 'A checks count: 4 is not 0. B runs its emptiness test. Neither queue is empty; both remove the front element, b.' },
  { n: 'ch is assigned b, the element at the front, on both sides.' },
  { n: 'front advances to cell 2. b is no longer part of the queue, though it remains in cell 1.' },
  { n: 'A decrements count to 3. B has nothing to update.' },

  // OP6 DELETE c
  { n: 'A checks count: 3 is not 0. B runs its emptiness test. Both remove the front element, c.' },
  { n: 'ch is assigned c, the element at the front, on both sides.' },
  { n: 'front advances to cell 3. c is no longer part of the queue, though it remains in cell 2.' },
  { n: 'A decrements count to 2. B has nothing to update.' },

  // OP7 DELETE d (front wraps)
  { n: 'A checks count: 2 is not 0. B runs its emptiness test. Both remove the front element, d.' },
  { n: 'ch is assigned d, the element at the front, on both sides.' },
  { n: 'front is at the last cell, so next_ix wraps it to cell 0. One element is left: e, in cell 0. front and rear are now both 0.',
    note: 'front and rear on the same cell means exactly one element. That state is not ambiguous — B reads it correctly.' },
  { n: 'A decrements count to 1. B has nothing to update — its front and rear now sit on the same cell.' },

  // OP8 DELETE e (empties)
  { n: 'A checks count: 1 is not 0. B runs its emptiness test. One element remains; both remove it.' },
  { n: 'ch is assigned e, the last element, on both sides.' },
  { n: 'front advances to cell 1. Every cell is now stale — the characters are still there, but none of them belong to the queue.' },
  { n: "A sets count to 0. The queue is empty. B has nothing to update — and B's front and rear are now 1 and 0.",
    note: "Look at B's two boxes: front 1, rear 0. Click Back to the step where f was refused and compare — they were 1 and 0 there too, with the queue completely full. B's stored state is identical in both situations. A tells them apart with one number: 4 against 0." },

  // OP9 ADD g (the divergence)
  { n: 'A checks count: 0 is not 4, so there is room. B checks whether the cell after rear is front: next_ix(0) is 1, and front is 1. B says the queue is full.',
    note: 'The same expression that correctly reported a full queue four operations ago now reports a full queue that is empty. front and rear alone cannot tell those two states apart.' },
  { n: 'A computes cell 1 as the destination. B refuses.' },
  { n: 'A stores g. The two arrays now hold different things for the first time.' },
  { n: "A's queue holds one element. B's queue rejected it.",
    note: 'B is not the wrong choice — it is one piece of information short. Give it any way to distinguish those two states and it works: a full/empty flag, or the common trick of sacrificing one cell so the queue never holds more than MAX − 1 elements. What would the full test become if you gave up one cell — and what would empty look like then? Either representation is fine for your own queue; the count just hands you the answer for free.' },
];

/* Merge frame i of both racers into one step: both columns' panels, one shared
 * narration, one shared note. An idling racer keeps its previous panel state
 * (remembered here) and highlights no line. Top-level `line` is null — each code
 * panel reads its own line from its panel data (`codeA` / `codeB`). */
const merge = (() => {
  let lastA = null, lastB = null;
  const resolve = (fr, last) => fr.idle
    ? { line: null, q: last.q, s: last.s }
    : { line: fr.line, q: fr.q, s: fr.s };
  return (frame, i) => {
    if (i === 0) { lastA = lastB = null; }
    const A = resolve(frame.a, lastA); lastA = A;
    const B = resolve(frame.b, lastB); lastB = B;
    const step = N[i] ?? { n: '' };
    return {
      tag: 'step',
      line: null,
      narrate: step.n,
      note: step.note,
      panels: {
        pre:    { line: null },
        codeA:  { line: A.line },
        queueA: A.q,
        stripA: A.s,
        codeB:  { line: B.line },
        queueB: B.q,
        stripB: B.s,
      },
    };
  };
})();

export default {
  title: 'Two ways to track a queue',
  subtitle: 'The same queue, stored two different ways.',
  profile: 'standard',
  columns: 2,
  languages: ['pseudo', 'java', 'cpp'],

  // Four rows: a shared preamble and the two arrays and strips all size to their
  // content (never scroll — a 4-cell array and a 3-box strip don't need the
  // bounded-stage treatment); only the code panels (`1fr`) absorb the remaining
  // height and scroll internally when the viewport is short. See "spec.stageRows".
  stageRows: 'auto 1fr auto auto',

  panels: [
    { type: 'code',  id: 'pre',    title: 'next_ix — the wraparound helper · MAX = 4',
      full: true, listings: PREAMBLE, labels: { pseudo: 'pseudocode', java: 'Java', cpp: 'C++' } },

    { type: 'code',  id: 'codeA',  title: 'Representation A — front + count',
      listings: LISTING_A, labels: { pseudo: 'pseudocode', java: 'Java', cpp: 'C++' } },
    { type: 'code',  id: 'codeB',  title: 'Representation B — front + rear',
      listings: LISTING_B, labels: { pseudo: 'pseudocode', java: 'Java', cpp: 'C++' } },

    { type: 'cells', id: 'queueA', title: 'A · the array' },
    { type: 'cells', id: 'queueB', title: 'B · the array' },

    { type: 'cells', id: 'stripA', title: 'A stores', compact: true },
    { type: 'cells', id: 'stripB', title: 'B stores', compact: true },
  ],

  initialTrace: 'compare',
  traces: {
    compare: { racers: { a: racerA, b: racerB }, merge },
  },
};
