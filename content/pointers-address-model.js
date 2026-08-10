/* ds — "What a pointer actually holds" (pointers-address-model)
 *
 * Memory as one long array of numbered bytes, and what a pointer really is: an
 * integer stored in that array whose value happens to be an address. The lesson
 * is ONE CARET. The program builds two student records, then does the same copy
 * two ways:
 *
 *     s1_pt^ = s2_pt^     copies the RECORD  (line 15) — two records survive
 *     s1_pt   = s2_pt     copies the POINTER (line 16) — one record leaks
 *
 * Both compile; both look correct if you only print s1_pt^.name. The second
 * silently leaks the record at address 4 and aliases the two variables onto one.
 * In the lecture's words: "The record starting at location 4 is now permanently
 * lost, because no pointers are pointing to it."
 *
 * This is the memory-danger marker's FIRST real leak. It fires ONCE, on line 16,
 * and names the diagnosis — "leaked and unreachable" — not just "something is
 * wrong". Every earlier step is healthy and carries no marker (marking them would
 * dilute the signal, AUTHORING.md "Memory-danger marker").
 *
 * The 8-bit machine has 256 bytes, 0..255; we show the first eleven, 0..10, where
 * everything happens:
 *     [0] s1_pt   [1] s2_pt   [2][3] free
 *     [4][5] record A: name, grade      [6][7] record B: name, grade
 *     [8][9][10] free
 * ONE CELL PER FIELD, not per byte (the lecture allots a name two bytes and a
 * grade one; a name split across two cells would be unreadable and the addressing
 * logic is identical). The simplification is STATED, in the step-0 note.
 *
 * The arrows out of the pointer variables are OURS, drawn for the reader — memory
 * contains no arrows, only the numbers 4 and 6 sitting in cells 0 and 1 like any
 * other bytes. An arrow to a LEAKED record is never drawn: that is the whole point
 * of a leak (AUTHORING.md "Arrows always match the pointer values").
 *
 * WATCH only: one trace, no gates. Precomputed snapshots. */

/* Byte addresses in the shown window. A pointer VARIABLE lives at [0]/[1]; the two
 * records it can point at start at [4] and [6]. */
const S1 = 0, S2 = 1;                 // the pointer variables, as bytes in memory
const A_NAME = 4, A_GRADE = 5;        // record A
const B_NAME = 6, B_GRADE = 7;        // record B
const CELLS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const REC = { [A_NAME]: null, [A_GRADE]: null, [B_NAME]: null, [B_GRADE]: null };

/* One listing, three ds language variants. Pseudocode follows the lecture's
 * Pascal-flavoured notation, since the caret IS the subject. C++ uses * and ->.
 * Java has no caret and no *p = *q, so line 15 becomes a field-by-field copy with
 * a comment that says so honestly (AUTHORING.md "ds — language variants"; the Java
 * note makes the larger point). All three are line-aligned to 18 lines, so `line`
 * resolves the same number in every variant. */
const LISTINGS = {
  pseudo: [
    'type stud_record = record',       // 1
    '    name : string',               // 2
    '    grade : int',                 // 3
    'end',                             // 4
    '',                                // 5
    'var s1_pt, s2_pt : ^stud_record', // 6
    '',                                // 7
    'main()',                          // 8
    '    new(s1_pt)',                  // 9
    "    s1_pt^.name = 'John'",        // 10
    '    s1_pt^.grade = 90',           // 11
    '    new(s2_pt)',                  // 12
    "    s2_pt^.name = 'Mary'",        // 13
    '    s2_pt^.grade = 95',           // 14
    '    s1_pt^ = s2_pt^',             // 15
    '    s1_pt = s2_pt',               // 16
    "    s1_pt^.name = 'Bill'",        // 17
    '    print s2_pt^.name',           // 18
  ],
  cpp: [
    'struct stud_record {',            // 1
    '    string name;',                // 2
    '    int grade;',                  // 3
    '};',                              // 4
    '',                                // 5
    'stud_record *s1_pt, *s2_pt;',     // 6
    '',                                // 7
    'int main() {',                    // 8
    '    s1_pt = new stud_record;',    // 9
    '    s1_pt->name = "John";',       // 10
    '    s1_pt->grade = 90;',          // 11
    '    s2_pt = new stud_record;',    // 12
    '    s2_pt->name = "Mary";',       // 13
    '    s2_pt->grade = 95;',          // 14
    '    *s1_pt = *s2_pt;',            // 15
    '    s1_pt = s2_pt;',              // 16
    '    s1_pt->name = "Bill";',       // 17
    '    cout << s2_pt->name; }',      // 18
  ],
  java: [
    'class StudRecord {',                                   // 1
    '    String name;',                                     // 2
    '    int grade;',                                       // 3
    '}',                                                    // 4
    '',                                                     // 5
    'StudRecord s1, s2;',                                   // 6
    '',                                                     // 7
    'void main() {',                                        // 8
    '    s1 = new StudRecord();',                           // 9
    '    s1.name = "John";',                                // 10
    '    s1.grade = 90;',                                   // 11
    '    s2 = new StudRecord();',                           // 12
    '    s2.name = "Mary";',                                // 13
    '    s2.grade = 95;',                                   // 14
    '    s1.name = s2.name; s1.grade = s2.grade; // no *p = *q', // 15
    '    s1 = s2;',                                         // 16
    '    s1.name = "Bill";',                                // 17
    '    System.out.println(s2.name); }',                  // 18
  ],
};

/* ---------------------------------------------------------------------------
 * Memory model. `s1`/`s2` are the values IN cells [0]/[1] — null (unreserved),
 * '?' (reserved but garbage), or a numeric address. `rec` holds the record
 * fields at [4][5][6][7]. Everything is read into concrete arrays at snap time,
 * so mutating the model after a yield never disturbs an already-captured step
 * (snapshots, not deltas).
 * ------------------------------------------------------------------------- */
function fresh() {
  return { s1: null, s2: null, rec: { ...REC } };
}

/** Value stored in a memory cell (null ⇒ nothing / free). */
function cellValue(st, i) {
  if (i === S1) return st.s1;
  if (i === S2) return st.s2;
  if (i in st.rec) return st.rec[i];
  return null;
}

/* The memory row: 11 cells, [0]..[10] beneath, rowLabel "memory". `markers: []`
 * turns on the bracketed index band under each cell (the marked-CELLS renderer)
 * without drawing any index-pointer marker — memory has none; the pointers'
 * arrows come from the `vars` strip instead. Every cell publishes an anchor
 * (memory.c<i>) so an arrow can LAND on it; the pointer variables are the arrow
 * SOURCES, never memory itself (memory holds no arrows).
 *
 * Roles: stale ⇒ leaked (greyed, value kept); active ⇒ written this step (blue);
 * compared ⇒ read this step; a real stored value ⇒ member; null ⇒ empty (the X
 * placeholder). A reserved-but-garbage pointer byte is '?', a REAL value, never
 * `empty` — the bytes are reserved and they do hold something. */
function memoryPanel(st, active, stale, compared) {
  return {
    render: 'box',
    rowLabel: 'memory',
    markers: [],
    cells: CELLS.map(i => {
      const v = cellValue(st, i);
      let role;
      if (stale.has(i))         role = 'stale';
      else if (active.has(i))   role = 'active';
      else if (compared.has(i)) role = 'compared';
      else if (v == null)       role = 'empty';
      return { value: v == null ? '' : v, role, anchor: `c${i}` };
    }),
  };
}

/* The pointer variables, compact strip: [s1_pt] [s2_pt], names + current values,
 * each anchored so its arrow starts from the value itself. This is the animation's
 * quiet point made visible — the same address that sits anonymously in memory
 * cell 0 is here given its name. A null value is indeterminate storage (the X);
 * a '?' or an address is a real value shown as itself. */
function varsPanel(st, activeVars) {
  const cell = (name, val, anchor) => (val == null)
    ? { label: name, value: '', anchor, role: 'empty' }
    : { label: name, value: String(val), anchor, role: activeVars.has(name) ? 'active' : undefined };
  return {
    render: 'row',
    cells: [cell('s1_pt', st.s1, 's1'), cell('s2_pt', st.s2, 's2')],
  };
}

/* Arrows are DATA, resolved against live boxes. One per pointer that currently
 * holds a real ADDRESS (a number): from its `vars` cell to the memory cell at
 * that address. A '?' (garbage) or null draws nothing — you cannot follow a
 * pointer that points nowhere meaningful. After the pointer copy both arrows hold
 * 6 and land on [6]; NOTHING points at the leaked record at [4] (AUTHORING.md
 * "An arrow to a leaked record is never drawn"). */
function pointerArrows(st) {
  const out = [];
  if (typeof st.s1 === 'number') out.push({ from: 'vars.s1', to: `memory.c${st.s1}`, style: 'pointer' });
  if (typeof st.s2 === 'number') out.push({ from: 'vars.s2', to: `memory.c${st.s2}`, style: 'pointer' });
  return out;
}

function snap(st, { line = null, tag, narrate, note,
                    active = [], stale = [], compared = [], activeVars = [] }) {
  return {
    tag, line, narrate, note,
    arrows: pointerArrows(st),
    panels: {
      memory: memoryPanel(st, new Set(active), new Set(stale), new Set(compared)),
      vars:   varsPanel(st, new Set(activeVars)),
    },
  };
}

/* ---------------------------------------------------------------------------
 * Teaching notes — the lecture's own framing, kept out of the step flow.
 * ------------------------------------------------------------------------- */
const NOTE_INTRO =
  'A pointer is an unsigned integer — it cannot be negative, because a memory address cannot be. ' +
  'What makes it a pointer is not its type but what you DO with it: you use its value as an index ' +
  'into memory. One simplification here: the lecture allots two bytes to a name and one to a grade. ' +
  'We show one cell per field so the addresses stay readable. Nothing about the addressing changes.';

const NOTE_DECLARE =
  'Only the POINTERS are reserved at compile time, not the records. Compare that with declaring the ' +
  'records directly, which would reserve every byte of both, used or not, for the whole run. ' +
  'And notice what is in them: nobody knows. A generous compiler zeroes them; that is not guaranteed. ' +
  'Writing s1_pt^.name right now would put a string at whatever address happened to be sitting there ' +
  '— possibly on top of your own program.';

const NOTE_NEW =
  'This happens at RUN TIME, on demand. Until this line ran, no record existed anywhere. The arrow is ' +
  'ours, drawn so you can follow it; memory holds no arrows, only the number 4 in cell 0.';

const NOTE_TWO_RECORDS =
  'Two records, two pointers, each pointing at its own. Read the memory row and you can see everything ' +
  'the program has: two addresses in cells 0 and 1, two records at 4 and 6.';

const NOTE_CONTENT_COPY =
  'This is the version most people mean. Nothing moved except data: two records still exist, at 4 and ' +
  'at 6, and each pointer still points at its own. They just happen to hold the same values now. ' +
  'Keep that picture. The next line does what looks like the same thing.';

const NOTE_POINTER_COPY =
  'Two failures at once, from one missing caret. The record at 4 still occupies memory and always will: ' +
  'the program has no way to reach it, so it cannot free it either. Imagine this inside a loop running a ' +
  'few thousand times — that is a memory leak, and it is why you issue dispose the moment you no longer ' +
  'need what new gave you. And the two variables are now aliases. Writing through one changes what the ' +
  'other sees, which is almost never what anyone intended.';

const NOTE_PAYOFF =
  "You would expect Mary. You wrote 'Bill' through s1_pt and read through s2_pt, and they are the same " +
  'record. Look back at line 15 and line 16. One character apart, and the difference is not visible in ' +
  'the code — you have to know what the caret means. Line 15 copied a record and left two records. ' +
  'Line 16 copied an address and left one record plus one that nothing can reach. ' +
  'Java takes the caret away by removing the choice: every assignment is a reference copy, and a garbage ' +
  'collector cleans up what nothing points at. That solves the leak and keeps the aliasing — Java ' +
  'programmers hit exactly this surprise, just without the leak underneath it. ' +
  'One more thing worth knowing, since it is the case where copying pointers is the RIGHT move: to swap ' +
  'two records you can copy three records around, or you can swap the two pointers and touch no record ' +
  'at all. The second is far cheaper, and it is what sorting does. Try writing both.';

/* ---------------------------------------------------------------------------
 * The trace. Step 0 (required) is the initial state — nothing executed, no line
 * highlighted. Every step after is one executing line of main, highlighted; the
 * pointer-copy on line 16 is the one memory-danger moment.
 * ------------------------------------------------------------------------- */
function* trace() {
  const st = fresh();

  // STEP 0 — the empty window. All 11 bytes empty; both pointers placeholders.
  yield snap(st, {
    line: null, tag: 'init',
    narrate: 'Memory is one long array of numbered bytes. These are the first eleven.',
    note: NOTE_INTRO,
  });

  // LINE 6 — the declaration reserves two bytes, holding GARBAGE. They are shown
  // as a real value '?', not `empty`: the bytes ARE reserved and they DO hold
  // something (just nothing anyone chose).
  st.s1 = '?'; st.s2 = '?';
  yield snap(st, {
    line: 6, tag: 'declare',
    narrate: 'Two pointer variables are declared. That reserves two bytes — at addresses 0 and 1 — and nothing else.',
    note: NOTE_DECLARE,
    active: [S1, S2], activeVars: ['s1_pt', 's2_pt'],
  });

  // LINE 9 — new(s1_pt): address 4 goes INTO s1_pt (cell 0), and the record at
  // [4][5] is allocated but not yet written. The first arrow appears.
  st.s1 = 4;
  yield snap(st, {
    line: 9, tag: 'alloc',
    narrate: 'new asks the operating system for space. It finds room at address 4 and puts that number — 4 — into s1_pt.',
    note: NOTE_NEW,
    active: [S1], activeVars: ['s1_pt'],
  });

  // LINE 10 — dereference read as MOTION: follow s1_pt to 4, write into the name.
  st.rec[A_NAME] = 'John';
  yield snap(st, {
    line: 10, tag: 'write',
    narrate: "Follow s1_pt to address 4, and write 'John' into the name field there.",
    active: [A_NAME],
  });

  // LINE 11 — the grade field, the next cell.
  st.rec[A_GRADE] = 90;
  yield snap(st, {
    line: 11, tag: 'write',
    narrate: 'Follow s1_pt to address 4 again — the grade field is the next cell, 5 — and write 90.',
    active: [A_GRADE],
  });

  // LINE 12 — new(s2_pt): the same for the second record. Address 6 into s2_pt,
  // record allocated at [6][7], the second arrow appears.
  st.s2 = 6;
  yield snap(st, {
    line: 12, tag: 'alloc',
    narrate: 'new again: the operating system hands back address 6, and 6 goes into s2_pt.',
    active: [S2], activeVars: ['s2_pt'],
  });

  // LINE 13 — 'Mary' into s2_pt's name field.
  st.rec[B_NAME] = 'Mary';
  yield snap(st, {
    line: 13, tag: 'write',
    narrate: "Follow s2_pt to 6 and write 'Mary' into its name field.",
    active: [B_NAME],
  });

  // LINE 14 — 95 into the grade field. The picture is now symmetric.
  st.rec[B_GRADE] = 95;
  yield snap(st, {
    line: 14, tag: 'write',
    narrate: 'Follow s2_pt to the grade field at 7 and write 95.',
    note: NOTE_TWO_RECORDS,
    active: [B_GRADE],
  });

  // LINE 15 — s1_pt^ = s2_pt^ — the CONTENT copy. Cells 4 and 5 are overwritten
  // with Mary and 95. BOTH pointers are unchanged, both arrows stay, both records
  // still exist. This is the healthy version.
  st.rec[A_NAME] = 'Mary'; st.rec[A_GRADE] = 95;
  yield snap(st, {
    line: 15, tag: 'copy',
    narrate: 'The carets say: take the record s2_pt points at, and copy it into the record s1_pt points at. Cells 4 and 5 are overwritten.',
    note: NOTE_CONTENT_COPY,
    active: [A_NAME, A_GRADE],
  });

  // LINE 16 — s1_pt = s2_pt — the POINTER copy, the payoff. Cell 0 changes from 4
  // to 6; s1_pt's arrow SWINGS from [4] to [6]; both arrows now land on [6]. The
  // record at [4][5] becomes stale AND unreachable — the memory-danger marker's
  // first real leak, named as the diagnosis it is.
  st.s1 = 6;
  yield snap(st, {
    line: 16, tag: 'ptr-copy',
    narrate: [
      'No carets. This copies the pointer itself: s1_pt now holds 6, the same address s2_pt holds. Both variables point at the same record.',
      { danger: true, text: 'The record at address 4 is leaked and unreachable — no pointer holds 4 any more, so it can never be read, written, or given back.' },
    ],
    note: NOTE_POINTER_COPY,
    active: [S1], activeVars: ['s1_pt'],
    stale: [A_NAME, A_GRADE],
  });

  // LINE 17 — s1_pt^.name = 'Bill'. s1_pt now leads to 6, so 'Bill' lands in the
  // record at [6]. The leaked cells keep their greyed values, no arrow.
  st.rec[B_NAME] = 'Bill';
  yield snap(st, {
    line: 17, tag: 'write',
    narrate: "Follow s1_pt — which now leads to 6 — and write 'Bill'.",
    active: [B_NAME],
    stale: [A_NAME, A_GRADE],
  });

  // LINE 18 — print s2_pt^.name. s2_pt was never touched; it still holds 6, the
  // same record 'Bill' was just written into. So it prints Bill, not Mary.
  yield snap(st, {
    line: 18, tag: 'print',
    narrate: 's2_pt was never touched. It still holds 6. So this prints Bill.',
    note: NOTE_PAYOFF,
    compared: [B_NAME],
    stale: [A_NAME, A_GRADE],
  });
}

export default {
  title: 'What a pointer actually holds',
  subtitle: 'Memory is one long array of numbered bytes.',
  profile: 'standard',
  columns: 2,
  languages: ['pseudo', 'cpp', 'java'],   // order = tab order; pseudo is the default

  panels: [
    { type: 'code',  id: 'code',   title: 'main: build two records, then copy two ways',
      listings: LISTINGS, labels: { pseudo: 'pseudocode', cpp: 'C++', java: 'Java' } },
    // The memory row IS the structure being watched (structure: true), so it sits
    // at its natural 11-cell width and never scrolls horizontally.
    { type: 'cells', id: 'memory', title: 'Memory', structure: true },
    // The pointer variables: a compact bookkeeping strip, and the SOURCE of the
    // arrows into memory.
    { type: 'cells', id: 'vars',   title: 'Pointer variables', compact: true },
  ],

  initialTrace: 'run',
  traces: {
    run: trace,
  },
};
