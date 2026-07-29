/* ds — A1 "Array-based list operations"
 *
 * The whole lesson is ONE invariant: contiguity. An array-based list packs its
 * elements from index 0 with no holes; `count` says how many are in use, and the
 * backing array has a fixed capacity MAX. Every operation must leave the list
 * contiguous, and that requirement is what makes the operations cost what they
 * cost.
 *
 * Four operations, in the instructor's framing:
 *   - ADD(value)          == INSERT(count, value)   -- append; no shift needed
 *   - INSERT(index, value) -- make room by shifting the tail RIGHT, then write
 *   - INSERT at a bad index -- range check fails; the write would leave holes
 *   - DELETE(index)        -- shift the tail LEFT to close the gap
 *
 * The payoff (final note) bridges to linked lists: the shift cost -- up to n
 * moves for a middle insert/delete -- is the price paid for the array's
 * simplicity, and it is why linked lists exist.
 *
 * WATCH only: one trace, no gates, no predict steps. A common mistake (writing
 * before making room; inserting out of range) is taught with NARRATION and
 * NOTES on normal steps, never a question. No arrows, no STREAM, no metrics.
 *
 * There is NO memory-integrity violation here (no pointers, no leak/dangling/
 * corruption), so nothing carries the red danger triangle -- an out-of-range
 * index is a logic/contract error, not memory corruption. */

const MAX = 5;

/* Listings are NOT line-aligned across languages (see AUTHORING.md "CODE"): the
 * `L` map below addresses each listing's own line numbers, so `line` is a
 * per-language object. */
const LISTINGS = {
  pseudo: [
    'ADD(value):',                                  // 1
    '    INSERT(count, value)',                      // 2
    '',                                              // 3
    'INSERT(index, value):',                         // 4
    '    if index < 0 or index > count:',            // 5
    '        report "invalid index"; return',        // 6
    '    for i = count down to index + 1:',          // 7
    '        A[i] = A[i - 1]',                        // 8
    '    A[index] = value',                           // 9
    '    count = count + 1',                          // 10
    '',                                              // 11
    'DELETE(index):',                                // 12
    '    if index < 0 or index >= count:',           // 13
    '        report "invalid index"; return',        // 14
    '    for i = index to count - 2:',               // 15
    '        A[i] = A[i + 1]',                        // 16
    '    count = count - 1',                          // 17
  ],
  java: [
    'void add(int value) {',                         // 1
    '    insert(count, value);',                     // 2
    '}',                                             // 3
    '',                                              // 4
    'void insert(int index, int value) {',           // 5
    '    if (index < 0 || index > count)',           // 6
    '        throw new IndexOutOfBoundsException();', // 7
    '    for (int i = count; i > index; i--)',        // 8
    '        A[i] = A[i - 1];',                       // 9
    '    A[index] = value;',                          // 10
    '    count++;',                                   // 11
    '}',                                             // 12
    '',                                              // 13
    'void delete(int index) {',                      // 14
    '    if (index < 0 || index >= count)',          // 15
    '        throw new IndexOutOfBoundsException();', // 16
    '    for (int i = index; i < count - 1; i++)',    // 17
    '        A[i] = A[i + 1];',                       // 18
    '    count--;',                                   // 19
    '}',                                             // 20
  ],
  cpp: [
    'void add(int value) {',                         // 1
    '    insert(count, value);',                     // 2
    '}',                                             // 3
    '',                                              // 4
    'void insert(int index, int value) {',           // 5
    '    if (index < 0 || index > count) {',         // 6
    '        cerr << "invalid index"; return;',      // 7
    '    }',                                         // 8
    '    for (int i = count; i > index; i--)',        // 9
    '        A[i] = A[i - 1];',                       // 10
    '    A[index] = value;',                          // 11
    '    count++;',                                   // 12
    '}',                                             // 13
    '',                                              // 14
    'void remove(int index) {',                      // 15
    '    if (index < 0 || index >= count) {',        // 16
    '        cerr << "invalid index"; return;',      // 17
    '    }',                                         // 18
    '    for (int i = index; i < count - 1; i++)',    // 19
    '        A[i] = A[i + 1];',                       // 20
    '    count--;',                                   // 21
    '}',                                             // 22
  ],
};

/* Semantic line keys -> per-language line numbers. */
const L = {
  addCall:  { pseudo: 2,  java: 2,  cpp: 2  },
  insCheck: { pseudo: 5,  java: 6,  cpp: 6  },
  insErr:   { pseudo: 6,  java: 7,  cpp: 7  },
  insFor:   { pseudo: 7,  java: 8,  cpp: 9  },
  insShift: { pseudo: 8,  java: 9,  cpp: 10 },
  insWrite: { pseudo: 9,  java: 10, cpp: 11 },
  insCount: { pseudo: 10, java: 11, cpp: 12 },
  delCheck: { pseudo: 13, java: 15, cpp: 16 },
  delFor:   { pseudo: 15, java: 17, cpp: 19 },
  delShift: { pseudo: 16, java: 18, cpp: 20 },
  delCount: { pseudo: 17, java: 19, cpp: 21 },
};

const EMPTY = '·';   // middot: a slot that exists but holds no element

/* One snapshot. The array is a fixed row of MAX indexed boxes; occupied cells
 * show their value, trailing free cells are dimmed (role 'empty') so capacity vs
 * count stays visible. The single cell modified THIS step gets role 'active' --
 * the blue activity fill (AUTHORING.md "Node color channels": here, cells are
 * always members, so blue fill is the only per-step signal). `phantom` appends
 * the would-be holes / attempted write for the invalid-index step, drawn in the
 * error role beyond the real array. */
function snap({ line, tag, narrate, note, arr, count, active = null, countActive = false, phantom = null }) {
  const cells = [];
  for (let i = 0; i < MAX; i++) {
    const v = arr[i];
    const empty = v == null;
    let role;
    if (i === active) role = 'active';          // blue fill: modified this step
    else if (empty)   role = 'empty';           // dimmed: free trailing slot
    cells.push({ label: String(i), value: empty ? EMPTY : v, role });
  }
  if (phantom) for (const p of phantom) cells.push(p);

  return {
    tag, narrate, line, note,
    panels: {
      cells: { render: 'box', cells },
      size: {
        render: 'row',
        cells: [
          { label: 'count', value: count, role: countActive ? 'active' : undefined },
          { label: 'MAX',   value: MAX },
        ],
      },
    },
  };
}

/* ---- teaching notes (AUTHORING.md "Steps vs. notes"): each attaches to one
 * step and shows only there. None describe memory corruption, so none is a
 * danger segment. ---- */
const SETUP =
  'This is an array-based list. A fixed-capacity array (MAX = 5) holds the elements, and count ' +
  'tracks how many are in use. The elements must stay contiguous — packed from index 0 with ' +
  'no holes. Every operation below preserves that.';

const ADD_NOTE =
  'ADD is just INSERT at the end — nothing follows it, so no shifting is needed.';

const MAKE_ROOM_NOTE =
  'Make room before writing, or you overwrite. And update the count.';

const INVALID_NOTE =
  'A list must stay contiguous, so you may insert only at an index from 0 to count — here 0 to 5. ' +
  'Index 7 is out of range: writing there would leave indices 5 and 6 empty, breaking contiguity.';

const DELETE_NOTE =
  'Delete leaves a hole — close it by shifting left so the list stays contiguous.';

const PAYOFF_NOTE =
  'Inserting or deleting in the middle of an array-based list costs shifting everything after it ' +
  '— up to n moves. That shift cost is the price we pay for the array’s simplicity, and it ' +
  'is exactly why linked lists — the next topic — exist.';

function makeTrace() {
  return function* () {
    // Mutable model. null marks a free slot.
    const arr = [10, 20, 30, null, null];
    let count = 3;

    /* ---------- Step 0 (required): initial state, nothing executed ---------- */
    yield snap({
      line: null, tag: 'init',
      narrate: 'The array-based list before any operation. Three elements occupy indices 0–2; indices 3 and 4 are free.',
      note: SETUP,
      arr, count,
    });

    /* ---------- ADD 40  ==  INSERT(count, 40)  ==  INSERT(3, 40) ---------- */
    yield snap({
      line: L.addCall, tag: 'call',
      narrate: 'ADD(40) is defined as INSERT(count, 40) — insert at index = count, which is 3, the first free slot.',
      note: ADD_NOTE,
      arr, count,
    });
    yield snap({
      line: L.insCheck, tag: 'check',
      narrate: 'Range check: is index (3) outside 0..count? 0 ≤ 3 ≤ 3, so it is valid. Inserting at index = count appends to the end.',
      arr, count,
    });
    yield snap({
      line: L.insFor, tag: 'loop',
      narrate: 'The shift loop runs from count (3) down to index + 1 (4): an empty range, so nothing shifts. Appending needs no room made.',
      arr, count,
    });
    arr[3] = 40;
    yield snap({
      line: L.insWrite, tag: 'write',
      narrate: 'A[3] = 40. The value is written into the first free slot, index 3.',
      arr, count, active: 3,
    });
    count = 4;
    yield snap({
      line: L.insCount, tag: 'count',
      narrate: 'count = 4. Update the count — the list now holds four elements, indices 0–3.',
      arr, count, countActive: true,
    });

    /* ---------- INSERT 25 at index 1 (valid; shift the tail RIGHT) ---------- */
    yield snap({
      line: L.insCheck, tag: 'check',
      narrate: 'INSERT(25, index 1): range check — is index (1) outside 0..count (0..4)? No, so it is valid.',
      arr, count,
    });
    yield snap({
      line: L.insFor, tag: 'loop',
      narrate: 'Make room at index 1: the loop shifts the tail right, from count (4) down to index + 1 (2).',
      note: MAKE_ROOM_NOTE,
      arr, count,
    });
    arr[4] = arr[3];   // 40
    yield snap({
      line: L.insShift, tag: 'shift',
      narrate: 'A[4] = A[3] = 40. Copy the last element into the free slot to its right.',
      arr, count, active: 4,
    });
    arr[3] = arr[2];   // 30
    yield snap({
      line: L.insShift, tag: 'shift',
      narrate: 'A[3] = A[2] = 30.',
      arr, count, active: 3,
    });
    arr[2] = arr[1];   // 20
    yield snap({
      line: L.insShift, tag: 'shift',
      narrate: 'A[2] = A[1] = 20. The slot at index 1 is now safe to overwrite — its old value is already copied to index 2.',
      arr, count, active: 2,
    });
    arr[1] = 25;
    yield snap({
      line: L.insWrite, tag: 'write',
      narrate: 'A[1] = 25. Write the new value into the room just made.',
      arr, count, active: 1,
    });
    count = 5;
    yield snap({
      line: L.insCount, tag: 'count',
      narrate: 'count = 5. Update the count — the list is now full: count = MAX = 5.',
      arr, count, countActive: true,
    });

    /* ---------- INSERT at index 7 (INVALID; the key teaching step) ----------
     * The array is full and, more to the point, index 7 is outside 0..count.
     * Phantom cells 5, 6, 7 (beyond the real MAX=5 array) show the attempted
     * write at 7 and the holes it would leave at 5 and 6 -- a clear invalid
     * state, NOT a real write. Nothing in `arr`/`count` changes. */
    const holes = [
      { label: '5', value: EMPTY, role: 'error' },
      { label: '6', value: EMPTY, role: 'error' },
      { label: '7', value: 99,    role: 'error' },
    ];
    yield snap({
      line: L.insCheck, tag: 'check',
      narrate: 'INSERT(99, index 7): range check — is index (7) > count (5)? Yes. Index 7 is outside the valid range 0..5.',
      note: INVALID_NOTE,
      arr, count, phantom: holes,
    });
    yield snap({
      line: L.insErr, tag: 'error',
      narrate: 'The index is invalid, so INSERT reports an error and returns without writing. The array is unchanged.',
      arr, count, phantom: holes,
    });

    /* ---------- DELETE at index 1 (shift the tail LEFT to close the gap) ---------- */
    yield snap({
      line: L.delCheck, tag: 'check',
      narrate: 'DELETE(index 1): range check — is index (1) within 0..count − 1 (0..4)? Yes, so it is valid.',
      arr, count,
    });
    yield snap({
      line: L.delFor, tag: 'loop',
      narrate: 'Removing index 1 would leave a hole there. To keep the list contiguous, shift each later element one slot left, from index (1) to count − 2 (3).',
      note: DELETE_NOTE,
      arr, count,
    });
    arr[1] = arr[2];   // 20 overwrites 25 -- the delete happens here
    yield snap({
      line: L.delShift, tag: 'shift',
      narrate: 'A[1] = A[2] = 20. The element 25 at index 1 is overwritten — the delete happens here.',
      arr, count, active: 1,
    });
    arr[2] = arr[3];   // 30
    yield snap({
      line: L.delShift, tag: 'shift',
      narrate: 'A[2] = A[3] = 30.',
      arr, count, active: 2,
    });
    arr[3] = arr[4];   // 40
    yield snap({
      line: L.delShift, tag: 'shift',
      narrate: 'A[3] = A[4] = 40. The elements are packed contiguously again.',
      arr, count, active: 3,
    });
    count = 4;
    arr[4] = null;     // the trailing duplicate falls outside the list
    yield snap({
      line: L.delCount, tag: 'count',
      narrate: 'count = 4. Update the count — the duplicate left at index 4 now falls outside the list, which is contiguous again at indices 0–3.',
      note: PAYOFF_NOTE,
      arr, count, countActive: true,
    });
  };
}

export default {
  title: 'Array-based list: keeping it contiguous through insert and delete',
  subtitle: 'Adding, inserting, and deleting in a fixed-capacity array.',
  profile: 'standard',
  columns: 2,
  languages: ['pseudo', 'java', 'cpp'],

  panels: [
    { type: 'code',  id: 'code', title: 'list operations',
      listings: LISTINGS, labels: { pseudo: 'pseudocode', java: 'Java', cpp: 'C++' } },
    { type: 'cells', id: 'cells', title: 'The array' },
    { type: 'cells', id: 'size',  title: 'count / capacity' },
  ],

  initialTrace: 'correct',
  traces: {
    correct: makeTrace(),
  },
};
