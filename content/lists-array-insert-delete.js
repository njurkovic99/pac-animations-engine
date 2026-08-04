/* ds — A1 "Array-based list operations"
 *
 * The whole lesson is ONE invariant: contiguity. An array-based list packs its
 * elements from index 0 with no holes; `count` says how many are in use, and the
 * backing array has a fixed capacity MAX. Every operation must leave the list
 * contiguous, and that requirement is what makes the operations cost what they
 * cost.
 *
 * A `main` driver calls the operations in sequence — ADD(40); INSERT(1, 25);
 * INSERT(7, 99) [the invalid one]; DELETE(1); badINSERT(1, 25) [the buggy one] —
 * so every call has a visible origin. The CALLSTACK panel is a debugger's
 * locals/stack pane: frames push on call (newest on top, showing their BOUND
 * parameter values) and pop on return (the caller below is greyed but present).
 * This makes the ADD-is-INSERT lesson visible: ADD(40) calls INSERT(count,
 * value), and INSERT's frame appears already showing index = 3 (count's value)
 * and value = 40 — the parameters you could previously only infer from narration.
 *
 * Operations, in the instructor's framing:
 *   - ADD(value)          == INSERT(count, value)   -- append; no shift needed
 *   - INSERT(index, value) -- make room by shifting the tail RIGHT, then write
 *   - INSERT at a bad index -- range check fails; the write would leave holes
 *   - DELETE(index)        -- shift the tail LEFT to close the gap
 *   - badINSERT(index, value) -- the SAME insert, written with the shift going
 *     the WRONG way (front-first): it corrupts the data, and shows why the
 *     correct INSERT shifts from the far end first.
 *
 * A mid-run note bridges to linked lists: the shift cost -- up to n moves for a
 * middle insert/delete -- is the price paid for the array's simplicity, and it
 * is why linked lists exist.
 *
 * The closing section is a confusion-first demonstration (AUTHORING.md
 * "Pedagogical pattern — name the student's confusion first"): a note first
 * NAMES the nagging question — "why move the outermost item first? it seems
 * backwards" — then badINSERT runs the intuitive-but-wrong inside-out shift and
 * the student watches one value smear across the tail (each A[i+1] = A[i] reads a
 * cell the previous iteration already clobbered). A payoff note answers the
 * opening question. Because that IS data corruption (overwrite), every smear
 * step carries the red memory-danger ⚠ (AUTHORING.md "Memory-danger marker").
 *
 * WATCH only: one trace, no gates, no predict steps. Common mistakes (writing
 * before making room; inserting out of range; shifting the wrong way) are taught
 * with NARRATION and NOTES on normal steps, never a question. No arrows, no
 * STREAM, no metrics.
 *
 * The correct INSERT/DELETE section has no memory-integrity violation (an
 * out-of-range index is a logic/contract error, not corruption); only the buggy
 * badINSERT corrupts data, and only its smear steps carry the ⚠. Argument→
 * parameter flow animation and pass-by-value/reference are deferred (AUTHORING.md
 * "CALLSTACK panel"); this only shows frames appearing with bound values. */

const MAX = 5;

/* Listings are NOT line-aligned across languages (see AUTHORING.md "CODE"): the
 * `L` map below addresses each listing's own line numbers, so `line` is a
 * per-language object. `main` is included so each call has a highlightable
 * origin line and the CALLSTACK stays in sync with the code. */
const LISTINGS = {
  pseudo: [
    'main():',                                       // 1
    '    ADD(40)',                                   // 2
    '    INSERT(1, 25)',                             // 3
    '    INSERT(7, 99)',                             // 4
    '    DELETE(1)',                                 // 5
    '    badINSERT(1, 25)',                          // 6
    '',                                              // 7
    'ADD(value):',                                   // 8
    '    INSERT(count, value)',                       // 9
    '',                                              // 10
    'INSERT(index, value):',                          // 11
    '    if index < 0 or index > count:',             // 12
    '        report "invalid index"; return',         // 13
    '    for i = count down to index + 1:',           // 14
    '        A[i] = A[i - 1]',                         // 15
    '    A[index] = value',                            // 16
    '    count = count + 1',                           // 17
    '',                                              // 18
    'DELETE(index):',                                 // 19
    '    if index < 0 or index >= count:',            // 20
    '        report "invalid index"; return',         // 21
    '    for i = index to count - 2:',                // 22
    '        A[i] = A[i + 1]',                         // 23
    '    count = count - 1',                           // 24
    '',                                              // 25
    'badINSERT(index, value):',                       // 26
    '    if index < 0 or index > count:',             // 27
    '        report "invalid index"; return',         // 28
    '    for i = index to count - 1:',                // 29
    '        A[i + 1] = A[i]',                         // 30
    '    A[index] = value',                            // 31
    '    count = count + 1',                           // 32
  ],
  java: [
    'void main() {',                                 // 1
    '    add(40);',                                   // 2
    '    insert(1, 25);',                             // 3
    '    insert(7, 99);',                             // 4
    '    delete(1);',                                 // 5
    '    badInsert(1, 25);',                          // 6
    '}',                                             // 7
    '',                                              // 8
    'void add(int value) {',                          // 9
    '    insert(count, value);',                      // 10
    '}',                                             // 11
    '',                                              // 12
    'void insert(int index, int value) {',            // 13
    '    if (index < 0 || index > count)',            // 14
    '        throw new IndexOutOfBoundsException();',  // 15
    '    for (int i = count; i > index; i--)',         // 16
    '        A[i] = A[i - 1];',                        // 17
    '    A[index] = value;',                           // 18
    '    count++;',                                    // 19
    '}',                                             // 20
    '',                                              // 21
    'void delete(int index) {',                       // 22
    '    if (index < 0 || index >= count)',           // 23
    '        throw new IndexOutOfBoundsException();',  // 24
    '    for (int i = index; i < count - 1; i++)',     // 25
    '        A[i] = A[i + 1];',                        // 26
    '    count--;',                                    // 27
    '}',                                             // 28
    '',                                              // 29
    'void badInsert(int index, int value) {',         // 30
    '    if (index < 0 || index > count)',            // 31
    '        throw new IndexOutOfBoundsException();',  // 32
    '    for (int i = index; i < count; i++)',         // 33
    '        A[i + 1] = A[i];',                        // 34
    '    A[index] = value;',                           // 35
    '    count++;',                                    // 36
    '}',                                             // 37
  ],
  cpp: [
    'int main() {',                                  // 1
    '    add(40);',                                   // 2
    '    insert(1, 25);',                             // 3
    '    insert(7, 99);',                             // 4
    '    remove(1);',                                 // 5
    '    badInsert(1, 25);',                          // 6
    '}',                                             // 7
    '',                                              // 8
    'void add(int value) {',                          // 9
    '    insert(count, value);',                      // 10
    '}',                                             // 11
    '',                                              // 12
    'void insert(int index, int value) {',            // 13
    '    if (index < 0 || index > count) {',          // 14
    '        cerr << "invalid index"; return;',       // 15
    '    }',                                          // 16
    '    for (int i = count; i > index; i--)',         // 17
    '        A[i] = A[i - 1];',                        // 18
    '    A[index] = value;',                           // 19
    '    count++;',                                    // 20
    '}',                                             // 21
    '',                                              // 22
    'void remove(int index) {',                       // 23
    '    if (index < 0 || index >= count) {',         // 24
    '        cerr << "invalid index"; return;',       // 25
    '    }',                                          // 26
    '    for (int i = index; i < count - 1; i++)',     // 27
    '        A[i] = A[i + 1];',                        // 28
    '    count--;',                                    // 29
    '}',                                             // 30
    '',                                              // 31
    'void badInsert(int index, int value) {',         // 32
    '    if (index < 0 || index > count) {',          // 33
    '        cerr << "invalid index"; return;',       // 34
    '    }',                                          // 35
    '    for (int i = index; i < count; i++)',         // 36
    '        A[i + 1] = A[i];',                        // 37
    '    A[index] = value;',                           // 38
    '    count++;',                                    // 39
    '}',                                             // 40
  ],
};

/* Semantic line keys -> per-language line numbers. */
const L = {
  mainAdd:   { pseudo: 2,  java: 2,  cpp: 2  },
  mainIns25: { pseudo: 3,  java: 3,  cpp: 3  },
  mainIns99: { pseudo: 4,  java: 4,  cpp: 4  },
  mainDel:   { pseudo: 5,  java: 5,  cpp: 5  },
  mainBad:   { pseudo: 6,  java: 6,  cpp: 6  },
  addCall:   { pseudo: 9,  java: 10, cpp: 10 },
  insCheck:  { pseudo: 12, java: 14, cpp: 14 },
  insErr:    { pseudo: 13, java: 15, cpp: 15 },
  insFor:    { pseudo: 14, java: 16, cpp: 17 },
  insShift:  { pseudo: 15, java: 17, cpp: 18 },
  insWrite:  { pseudo: 16, java: 18, cpp: 19 },
  insCount:  { pseudo: 17, java: 19, cpp: 20 },
  delCheck:  { pseudo: 20, java: 23, cpp: 24 },
  delFor:    { pseudo: 22, java: 25, cpp: 27 },
  delShift:  { pseudo: 23, java: 26, cpp: 28 },
  delCount:  { pseudo: 24, java: 27, cpp: 29 },
  badCheck:  { pseudo: 27, java: 31, cpp: 33 },
  badFor:    { pseudo: 29, java: 33, cpp: 36 },
  badShift:  { pseudo: 30, java: 34, cpp: 37 },
  badWrite:  { pseudo: 31, java: 35, cpp: 38 },
  badCount:  { pseudo: 32, java: 36, cpp: 39 },
};

const EMPTY = '·';   // middot: a slot that exists but holds no element

/* ---- call-frame builders (immutable: a fresh frame each step, never mutated
 * in place, so earlier snapshots stay intact) ----
 * `call` is the call-site line this frame is PARKED at while a callee runs — the
 * line the code panel dims (AUTHORING.md "Line highlight — active line vs. parked
 * caller lines"). It is set only on frames acting as callers; the running (top)
 * frame's `call` is ignored, since its executing line is the bright active one. */
const vv    = (name, value, role) => (role ? { name, value, role } : { name, value });
const iVar  = (value, role) => ({ name: 'i', value, role, kind: 'local' });   // loop local, not a parameter
const mainF = (call)             => ({ fn: 'main',   vars: [], call });
const addF  = (value, call)      => ({ fn: 'ADD',    vars: [vv('value', value)], call });
const insF  = (index, value, i)  => ({ fn: 'INSERT', vars: [vv('index', index), vv('value', value), ...(i ? [i] : [])] });
const delF  = (index, i)         => ({ fn: 'DELETE', vars: [vv('index', index), ...(i ? [i] : [])] });
const badF  = (index, value, i)  => ({ fn: 'badINSERT', vars: [vv('index', index), vv('value', value), ...(i ? [i] : [])] });

/* One snapshot. The array is a fixed row of MAX indexed boxes; occupied cells
 * show their value, trailing free cells are dimmed (role 'empty') so capacity vs
 * count stays visible. The single cell modified THIS step gets role 'active' --
 * the blue activity fill (cells are always members here, so blue fill is the only
 * per-step signal). `phantom` appends the would-be holes / attempted write for
 * the invalid-index step, drawn in the error role beyond the real array. `frames`
 * is the call stack, bottom-to-top; the top (last) frame is the running one, and
 * every frame below it is a caller — its `call` line is dimmed in the code panel
 * as a parked caller line, mirroring the greyed CALLSTACK frames exactly. */
function snap({ line, tag, narrate, note, arr, count, active = null, countActive = false, phantom = null, frames }) {
  const cells = [];
  for (let i = 0; i < MAX; i++) {
    const val = arr[i];
    const empty = val == null;
    let role;
    if (i === active) role = 'active';          // blue fill: modified this step
    else if (empty)   role = 'empty';           // free slot: dashed box + X + "—"
    // An empty cell is indeterminate storage; the renderer's `empty` role draws
    // the dashed box, the X, and the "—" placeholder glyph. (Phantom
    // invalid-index holes below use the `error` role and keep the middot.)
    cells.push({ label: String(i), value: empty ? '' : val, role });
  }
  if (phantom) for (const p of phantom) cells.push(p);

  // Parked caller lines = the call site of every frame BELOW the running (top)
  // one. Dimmed in the code panel; the whole caller chain at once.
  const parked = frames.slice(0, -1).map(f => f.call).filter(Boolean);

  return {
    tag, narrate, line, note, parked,
    panels: {
      cells: { render: 'box', cells },
      size: {
        render: 'row',
        cells: [
          { label: 'count', value: count, role: countActive ? 'active' : undefined },
          { label: 'MAX',   value: MAX },
        ],
      },
      stack: {
        frames: frames.map((f, idx) => ({ fn: f.fn, vars: f.vars, active: idx === frames.length - 1 })),
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
  'no holes. main calls the four operations in turn; watch the call stack at right.';

const ADD_NOTE =
  'ADD is just INSERT at the end — nothing follows it, so no shifting is needed. Notice INSERT’s ' +
  'frame binds index to count’s value (3), so ADD lands the new element at the first free slot.';

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

/* Confusion-first pattern (AUTHORING.md "Pedagogical pattern — name the
 * student's confusion first"): name the nagging question BEFORE showing the
 * intuitive-but-wrong version fail. */
const CONFUSION_NOTE =
  'Have you wondered why we make room by first moving the outermost item? It seems backwards. ' +
  'Watch what happens if we start from the inside instead.';

/* The payoff note that answers CONFUSION_NOTE using what the student just
 * watched smear across the tail. */
const BAD_PAYOFF_NOTE =
  'That is why we shift from the far end first — each value is copied before the next step ' +
  'overwrites it. Shift from the outside in.';

function makeTrace() {
  return function* () {
    // Mutable array model. null marks a free slot. `count` is the live count.
    const arr = [10, 20, 30, null, null];
    let count = 3;

    /* ---------- Step 0 (required): initial state, nothing executed ---------- */
    yield snap({
      line: null, tag: 'init',
      narrate: 'The array-based list before any operation. Three elements occupy indices 0–2; indices 3 and 4 are free. Only main is on the call stack.',
      note: SETUP,
      arr, count, frames: [mainF()],
    });

    /* ================= main calls ADD(40)  ==  INSERT(count, 40) ================= */
    yield snap({
      line: L.mainAdd, tag: 'call',
      narrate: 'main calls ADD(40). Control enters ADD next.',
      arr, count, frames: [mainF()],
    });
    yield snap({
      line: L.addCall, tag: 'call',
      narrate: 'Inside ADD: the parameter value is bound to 40. ADD’s whole job is to call INSERT(count, 40).',
      note: ADD_NOTE,
      arr, count, frames: [mainF(L.mainAdd), addF(40)],
    });
    // ADD calls INSERT: its frame appears with index bound to count's value (3).
    yield snap({
      line: L.insCheck, tag: 'check',
      narrate: 'Inside INSERT: index is bound to count, which is 3, and value to 40 — both now visible in the frame. Range check: 0 ≤ 3 ≤ 3, valid.',
      arr, count, frames: [mainF(L.mainAdd), addF(40, L.addCall), insF(3, 40)],
    });
    yield snap({
      line: L.insFor, tag: 'loop',
      narrate: 'The shift loop runs from count (3) down to index + 1 (4): an empty range, so it never executes and i is never set. Appending needs no room made.',
      arr, count, frames: [mainF(L.mainAdd), addF(40, L.addCall), insF(3, 40)],
    });
    arr[3] = 40;
    yield snap({
      line: L.insWrite, tag: 'write',
      narrate: 'A[3] = 40. The value is written into the first free slot, index 3.',
      arr, count, active: 3, frames: [mainF(L.mainAdd), addF(40, L.addCall), insF(3, 40)],
    });
    count = 4;
    yield snap({
      line: L.insCount, tag: 'count',
      narrate: 'count = 4. Update the count — the list now holds four elements, indices 0–3.',
      arr, count, countActive: true, frames: [mainF(L.mainAdd), addF(40, L.addCall), insF(3, 40)],
    });

    /* ================= main calls INSERT(1, 25) (shift the tail RIGHT) ================= */
    // INSERT returns to ADD, ADD returns to main: both frames pop, shown by the
    // stack collapsing back to [main] on this next call step.
    yield snap({
      line: L.mainIns25, tag: 'call',
      narrate: 'INSERT returns to ADD, and ADD — whose only job was that call — returns to main. Now main calls INSERT(1, 25).',
      arr, count, frames: [mainF()],
    });
    yield snap({
      line: L.insCheck, tag: 'check',
      narrate: 'Inside INSERT: index = 1, value = 25. Range check: is index (1) outside 0..count (0..4)? No, so it is valid.',
      arr, count, frames: [mainF(L.mainIns25), insF(1, 25)],
    });
    yield snap({
      line: L.insFor, tag: 'loop',
      narrate: 'Make room at index 1: the loop runs i from count (4) down to index + 1 (2), shifting the tail right.',
      note: MAKE_ROOM_NOTE,
      arr, count, frames: [mainF(L.mainIns25), insF(1, 25)],
    });
    arr[4] = arr[3];   // 40
    yield snap({
      line: L.insShift, tag: 'shift',
      narrate: 'i = 4. A[4] = A[3] = 40 — copy the last element into the free slot to its right.',
      arr, count, active: 4, frames: [mainF(L.mainIns25), insF(1, 25, iVar(4, 'active'))],
    });
    arr[3] = arr[2];   // 30
    yield snap({
      line: L.insShift, tag: 'shift',
      narrate: 'i = 3. A[3] = A[2] = 30.',
      arr, count, active: 3, frames: [mainF(L.mainIns25), insF(1, 25, iVar(3, 'active'))],
    });
    arr[2] = arr[1];   // 20
    yield snap({
      line: L.insShift, tag: 'shift',
      narrate: 'i = 2. A[2] = A[1] = 20. Index 1 is now safe to overwrite — its old value is already copied to index 2.',
      arr, count, active: 2, frames: [mainF(L.mainIns25), insF(1, 25, iVar(2, 'active'))],
    });
    arr[1] = 25;
    yield snap({
      line: L.insWrite, tag: 'write',
      narrate: 'The loop is finished. A[1] = 25 — write the new value into the room just made.',
      arr, count, active: 1, frames: [mainF(L.mainIns25), insF(1, 25, iVar(1, 'done'))],
    });
    count = 5;
    yield snap({
      line: L.insCount, tag: 'count',
      narrate: 'count = 5. Update the count — the list is now full: count = MAX = 5.',
      arr, count, countActive: true, frames: [mainF(L.mainIns25), insF(1, 25, iVar(1, 'done'))],
    });

    /* ================= main calls INSERT(7, 99) (INVALID; the key step) ================= */
    const holes = [
      { label: '5', value: EMPTY, role: 'error' },
      { label: '6', value: EMPTY, role: 'error' },
      { label: '7', value: 99,    role: 'error' },
    ];
    yield snap({
      line: L.mainIns99, tag: 'call',
      narrate: 'INSERT returns to main. Now main calls INSERT(7, 99) — an attempt to insert 99 at index 7.',
      arr, count, frames: [mainF()],
    });
    yield snap({
      line: L.insCheck, tag: 'check',
      narrate: 'Inside INSERT: index = 7, value = 99 — the arguments are now visible in the frame. Range check: is index (7) > count (5)? Yes. Index 7 is outside the valid range 0..5.',
      note: INVALID_NOTE,
      arr, count, phantom: holes, frames: [mainF(L.mainIns99), insF(7, 99)],
    });
    yield snap({
      line: L.insErr, tag: 'error',
      narrate: 'The index is invalid, so INSERT reports an error and returns without writing. The array is unchanged.',
      arr, count, phantom: holes, frames: [mainF(L.mainIns99), insF(7, 99)],
    });

    /* ================= main calls DELETE(1) (shift the tail LEFT) ================= */
    yield snap({
      line: L.mainDel, tag: 'call',
      narrate: 'INSERT returns to main without changing the array. Now main calls DELETE(1) — remove the element at index 1.',
      arr, count, frames: [mainF()],
    });
    yield snap({
      line: L.delCheck, tag: 'check',
      narrate: 'Inside DELETE: index = 1. Range check: is index (1) within 0..count − 1 (0..4)? Yes, so it is valid.',
      arr, count, frames: [mainF(L.mainDel), delF(1)],
    });
    yield snap({
      line: L.delFor, tag: 'loop',
      narrate: 'Removing index 1 would leave a hole there. To keep the list contiguous, the loop runs i from index (1) to count − 2 (3), shifting each later element one slot left.',
      note: DELETE_NOTE,
      arr, count, frames: [mainF(L.mainDel), delF(1)],
    });
    arr[1] = arr[2];   // 20 overwrites 25 -- the delete happens here
    yield snap({
      line: L.delShift, tag: 'shift',
      narrate: 'i = 1. A[1] = A[2] = 20. The element 25 at index 1 is overwritten — the delete happens here.',
      arr, count, active: 1, frames: [mainF(L.mainDel), delF(1, iVar(1, 'active'))],
    });
    arr[2] = arr[3];   // 30
    yield snap({
      line: L.delShift, tag: 'shift',
      narrate: 'i = 2. A[2] = A[3] = 30.',
      arr, count, active: 2, frames: [mainF(L.mainDel), delF(1, iVar(2, 'active'))],
    });
    arr[3] = arr[4];   // 40
    yield snap({
      line: L.delShift, tag: 'shift',
      narrate: 'i = 3. A[3] = A[4] = 40. The elements are packed contiguously again.',
      arr, count, active: 3, frames: [mainF(L.mainDel), delF(1, iVar(3, 'active'))],
    });
    count = 4;
    arr[4] = null;     // the trailing duplicate falls outside the list
    yield snap({
      line: L.delCount, tag: 'count',
      narrate: 'count = 4. Update the count — the duplicate left at index 4 now falls outside the list, which is contiguous again at indices 0–3.',
      note: PAYOFF_NOTE,
      arr, count, countActive: true, frames: [mainF(L.mainDel), delF(1, iVar(4, 'done'))],
    });

    /* ================= main calls badINSERT(1, 25) (WRONG shift direction) =================
     * The array is back to [10, 20, 30, 40], count 4 — the same shape the correct
     * INSERT(1, 25) faced. badINSERT is that insert with ONE thing changed: the
     * loop shifts front-first (A[i+1] = A[i], i from index up), so each iteration
     * reads a cell the previous one already overwrote. One value smears down the
     * tail. This is overwrite corruption, so every smear step carries the red ⚠
     * (AUTHORING.md "Memory-danger marker"). The confusion-first note runs first;
     * the payoff note answers it after the smear. */
    yield snap({
      line: L.mainBad, tag: 'call',
      narrate: 'main calls badINSERT(1, 25). It inserts the same way — range check, shift, write — but shifts in the opposite direction. Control enters badINSERT next.',
      note: CONFUSION_NOTE,
      arr, count, frames: [mainF()],
    });
    yield snap({
      line: L.badCheck, tag: 'check',
      narrate: 'Inside badINSERT: index = 1, value = 25. Range check: 0 ≤ 1 ≤ 4, valid — exactly as the correct INSERT checked.',
      arr, count, frames: [mainF(L.mainBad), badF(1, 25)],
    });
    yield snap({
      line: L.badFor, tag: 'loop',
      narrate: 'This loop shifts front-first: i runs from index (1) up to count − 1 (3), each iteration copying a cell into the one to its right — A[i + 1] = A[i]. Watch the tail.',
      arr, count, frames: [mainF(L.mainBad), badF(1, 25)],
    });
    arr[2] = arr[1];   // 20 overwrites 30 -- the first cell clobbered
    yield snap({
      line: L.badShift, tag: 'shift',
      narrate: [
        'i = 1. A[2] = A[1] copies 20 up into index 2. ',
        { danger: true, text: 'Index 2 held 30, but we overwrite it before it was ever copied — the 30 is destroyed.' },
      ],
      arr, count, active: 2, frames: [mainF(L.mainBad), badF(1, 25, iVar(1, 'active'))],
    });
    arr[3] = arr[2];   // 20 again -- reads the cell just clobbered
    yield snap({
      line: L.badShift, tag: 'shift',
      narrate: [
        'i = 2. A[3] = A[2], but A[2] was just overwritten with 20, so 20 copies again — index 3 becomes 20 and the 40 there is destroyed. ',
        { danger: true, text: 'Each step reads a cell we already clobbered, so one value smears down the tail.' },
      ],
      arr, count, active: 3, frames: [mainF(L.mainBad), badF(1, 25, iVar(2, 'active'))],
    });
    arr[4] = arr[3];   // 20 propagates once more
    yield snap({
      line: L.badShift, tag: 'shift',
      narrate: [
        'i = 3. A[4] = A[3] = 20 — the same 20 propagates once more, into index 4. ',
        { danger: true, text: 'The whole tail is now the single value 20; every element after index 1 has been clobbered.' },
      ],
      arr, count, active: 4, frames: [mainF(L.mainBad), badF(1, 25, iVar(3, 'active'))],
    });
    arr[1] = 25;
    yield snap({
      line: L.badWrite, tag: 'write',
      narrate: [
        'The loop is finished. A[1] = 25 writes the new value. ',
        { danger: true, text: 'But 30 and 40 are already gone — the list is [10, 25, 20, 20, 20], not [10, 25, 20, 30, 40]. The data is corrupted.' },
      ],
      arr, count, active: 1, frames: [mainF(L.mainBad), badF(1, 25, iVar(3, 'done'))],
    });
    count = 5;
    yield snap({
      line: L.badCount, tag: 'count',
      narrate: 'count = 5. The count claims five elements, but three of them are the smeared 20 — the shift direction, not the count, is what corrupted the data.',
      note: BAD_PAYOFF_NOTE,
      arr, count, countActive: true, frames: [mainF(L.mainBad), badF(1, 25, iVar(3, 'done'))],
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
    { type: 'code',      id: 'code',  title: 'list operations',
      listings: LISTINGS, labels: { pseudo: 'pseudocode', java: 'Java', cpp: 'C++' } },
    { type: 'cells',     id: 'cells', title: 'The array' },
    { type: 'callstack', id: 'stack', title: 'Function calls' },
    { type: 'cells',     id: 'size',  title: 'Variables', compact: true },
  ],

  initialTrace: 'correct',
  traces: {
    correct: makeTrace(),
  },
};
