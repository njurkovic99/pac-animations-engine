/* ds — Towers of Hanoi, PART 1 of 2: the recursive leap, rendered literally.
 *
 * THE LESSON is the induction hypothesis made into an OBJECT ON SCREEN. The
 * lecture's framing is verbatim: "Could you do this if you knew how to move n-1
 * rings? ... let's assume that you know how to move 4 rings. If you do, moving 5
 * rings is easy." This animation makes that assumption something the student can
 * SEE being used: the top n-1 disks are drawn as a BUNDLE that moves in a single
 * step, while the bottom disk is a real disk that moves on its own. So the whole
 * n-disk problem is reduced, on screen, to a TWO-disk problem in which one of the
 * "disks" is visibly a stack of many.
 *
 * THE HONESTY REQUIREMENT is the animation's main risk, and the notes carry it:
 * the bundle must read as "many disks, moved by machinery we have not explained
 * yet" — NEVER as one fat disk. Each bundle move hides an enormous amount of
 * work; part 2 (recursion-hanoi) is where that work is paid for, disk by disk.
 * That is why the count stays ABSTRACT — n disks, of which n-1 are bundled, with
 * no concrete number anywhere: a number would invite counting moves, which is
 * part 2's job, and there is deliberately no metrics counter here.
 *
 * THREE panels (profile 'standard'):
 *   pegs   the new PEGS structure view (panels/pegs.js) — three fixed pegs, the
 *          bundle and the one real disk moving between them. The bundle is the
 *          whole point of the panel: many tapered lines in a distinct colour, an
 *          "n − 1 disks" label, so it can never collapse into a single disk.
 *   calls  CALLSTACK ("Function calls") — each frame binds disk, source, dest and
 *          spare, and the whole point is watching those four take different values
 *          in the nested calls. main + MoveTower + the (briefly pushed) recursive
 *          MoveTower.
 *   code   CODE — the lecture's pseudocode, unchanged, with ds language tabs.
 *
 * Pegs are named A, B, C so the ARGUMENTS can be seen swapping in the recursive
 * calls, and each peg's on-screen label shows its current role — "A (source)" —
 * updating as the roles rotate. Lines 5 and 7 are the subject: "the most
 * important thing to notice is how cleverly arguments are exchanged in the
 * recursive calls," and with only three moves on screen that exchange is legible.
 */

/* One listing per ds language, line-aligned to a single 10-line grid so `line`
 * is a plain number that resolves the same in every variant. Fixed meanings:
 * line 2 the test, line 3 the base-case move (never reached here — n > 1), line 5
 * the FIRST recursive call, line 6 the one real disk move, line 7 the SECOND
 * recursive call, line 10 main's call. */
const LISTINGS = {
  pseudo: [
    'MoveTower(disk, source, dest, spare)',            // 1
    '    if disk == 1',                                // 2
    '        move disk from source to dest',           // 3
    '    else',                                        // 4
    '        MoveTower(disk - 1, source, spare, dest)',// 5
    '        move disk from source to dest',           // 6
    '        MoveTower(disk - 1, spare, dest, source)',// 7
    '',                                                // 8
    'main()',                                          // 9
    '    MoveTower(n, A, C, B)',                        // 10
  ],
  java: [
    'void moveTower(int disk, Peg source, Peg dest, Peg spare) {',  // 1
    '    if (disk == 1)',                                           // 2
    '        move(disk, source, dest);',                           // 3
    '    else {',                                                   // 4
    '        moveTower(disk - 1, source, spare, dest);',           // 5
    '        move(disk, source, dest);',                           // 6
    '        moveTower(disk - 1, spare, dest, source); }',         // 7
    '}',                                                            // 8
    'void main() {',                                                // 9
    '    moveTower(n, A, C, B); }',                                 // 10
  ],
  cpp: [
    'void moveTower(int disk, Peg source, Peg dest, Peg spare) {',  // 1
    '    if (disk == 1)',                                           // 2
    '        move(disk, source, dest);',                           // 3
    '    else {',                                                   // 4
    '        moveTower(disk - 1, source, spare, dest);',           // 5
    '        move(disk, source, dest);',                           // 6
    '        moveTower(disk - 1, spare, dest, source); }',         // 7
    '}',                                                            // 8
    'int main() {',                                                 // 9
    '    moveTower(n, A, C, B); }',                                 // 10
  ],
};

/* ---- teaching notes ---- */
const SETUP_NOTE =
  'Doing this directly is hard, and it gets hopeless fast — the original puzzle has 64 disks. So do not try ' +
  'to solve it directly. Ask a smaller question instead: IF you already knew how to move n−1 disks, could you ' +
  'move n? That is the assumption this animation makes. The bundle at the top is n−1 disks — however many that ' +
  'is — and for now we simply assume it can be moved. Watch what that assumption buys.';

const EXCHANGE_NOTE =
  'This is the exchange the whole algorithm turns on. To move n disks to C, the n−1 above the bottom one must ' +
  'get OUT OF THE WAY — and out of the way means B, because C has to be left clear for the bottom disk. So the ' +
  'arguments are handed over rotated: source stays, and dest and spare trade places.';

const HONESTY_NOTE =
  'That single step is the animation’s one deliberate omission, and the most important thing to see ' +
  'through. Moving n−1 disks is NOT one operation — it is a whole tower’s worth of individual disk moves, ' +
  'hidden inside this one arrow. The bundle is drawn as many thin, separate disks, not one, for exactly this ' +
  'reason: do not let it collapse in your mind into a single fat disk. How this move actually happens — every ' +
  'real disk, one at a time — is the entire subject of part 2.';

const SECOND_EXCHANGE_NOTE =
  'The same rotation as before, one line later. Now B is the source (the n−1 disks are there), C is the ' +
  'destination, and A — just emptied by the bottom disk — is the spare. Source, dest, spare rotate through the ' +
  'three pegs, and that rotation is the whole trick.';

const FINAL_NOTE = [
  'Look at what actually happened: two bundle moves and one real disk move solved the whole thing. MoveTower ' +
  'called itself twice on a smaller tower, with a single honest move in between — that is the recursive leap, ' +
  'n reduced to two copies of n−1. ' +
  'But the two bundle moves are still only assumptions: nothing here moved a real disk except the bottom one, ' +
  'and that debt is real. Part 2 pays it in full — a concrete tower, every move shown, nothing bundled. ' +
  'One thing to carry there: what if n were 1? Then line 2 is true, the bundle and the recursion vanish, and ' +
  'line 3 moves a single disk. That base case is what every bundle move here eventually bottoms out in. ',
  { link: { href: 'recursion-hanoi.html', text: 'Part 2: watch the bundles paid off, disk by disk' } },
];

/* ---- state builders ---------------------------------------------------------
 * A fresh item object per step (so `active` is set independently each snapshot),
 * and a pegs snapshot from the three pegs' contents plus their current roles. The
 * bundle stands for the n-1 disks; diskN is the single real bottom disk. */
const bundle = (active = false) => ({ kind: 'bundle', label: 'n − 1 disks', active });
const diskN  = (active = false) => ({ kind: 'disk', size: 5, label: 'disk n', active });

const pegState = (A, B, C, roles = {}) => ({
  pegs: [
    { id: 'A', role: roles.A, items: A },
    { id: 'B', role: roles.B, items: B },
    { id: 'C', role: roles.C, items: C },
  ],
});

// MoveTower(n, A, C, B): source=A, dest=C, spare=B. Held while the outer call runs.
const ROLES_N   = { A: 'source', C: 'dest', B: 'spare' };
// MoveTower(n-1, A, B, C): the FIRST recursive call — dest and spare trade places.
const ROLES_AB  = { A: 'source', B: 'dest', C: 'spare' };
// MoveTower(n-1, B, C, A): the SECOND recursive call — the roles rotate on.
const ROLES_BC  = { B: 'source', C: 'dest', A: 'spare' };

/* ---- call frames ------------------------------------------------------------
 * main is the driver at the bottom (call site line 10). A MoveTower frame binds
 * disk, source, dest, spare — shown swapping between calls, which is the lesson.
 * `hot` gives all four params the blue activity fill on the step they are bound.
 * `call` is the line a CALLER frame is parked on (dropped for the active top
 * frame); parked lines are dimmed in the code panel. */
const mainF = () => ({ fn: 'main', vars: [], call: 10 });
const mtF = (disk, source, dest, spare, { hot = false, call } = {}) => ({
  fn: 'MoveTower',
  vars: [
    { name: 'disk',   value: disk,   role: hot ? 'active' : undefined },
    { name: 'source', value: source, role: hot ? 'active' : undefined },
    { name: 'dest',   value: dest,   role: hot ? 'active' : undefined },
    { name: 'spare',  value: spare,  role: hot ? 'active' : undefined },
  ],
  call,
});

function* trace() {
  const snap = ({ line, tag, narrate, note, frames, pegs }) => ({
    line, tag, narrate, note,
    // Caller call-sites are dimmed in the code panel; the active top frame's line
    // is the bright one and code.js drops it from the parked set if they coincide.
    parked: frames.slice(0, -1).map(f => f.call).filter(v => v != null),
    panels: {
      pegs,
      calls: { frames: frames.map((f, i) => ({ fn: f.fn, vars: f.vars, active: i === frames.length - 1 })) },
    },
  });

  /* ===================== STEP 0 — before anything runs ===================== */
  // A holds the bundle (n-1 disks) on top of the real bottom disk; B and C empty.
  // No line highlighted. main is the driver, so the call has a visible origin.
  yield snap({
    line: null, tag: 'init', frames: [mainF()],
    pegs: pegState([diskN(), bundle()], [], []),
    narrate: 'n disks on peg A. The goal is to get them all to peg C, never putting a larger disk on a smaller one.',
    note: SETUP_NOTE,
  });

  /* ========================= main calls MoveTower ========================== */
  // Line 10. The outer call is made and its frame is pushed, already bound:
  // disk = n, source = A, dest = C, spare = B. The peg roles light up to match.
  yield snap({
    line: 10, tag: 'call',
    frames: [mainF(), mtF('n', 'A', 'C', 'B', { hot: true })],
    pegs: pegState([diskN(), bundle()], [], [], ROLES_N),
    narrate: 'Move n disks from A to C, using B as the spare.',
  });

  // Line 2. The test. disk is n, not 1, so the base case does not apply.
  yield snap({
    line: 2, tag: 'test',
    frames: [mainF(), mtF('n', 'A', 'C', 'B')],
    pegs: pegState([diskN(), bundle()], [], [], ROLES_N),
    narrate: 'More than one disk, so this is the recursive case.',
  });

  /* ==================== MOVE 1 — the first recursive call ================== */
  // Line 5. MoveTower(disk - 1, source, spare, dest) → MoveTower(n-1, A, B, C).
  // The frame is pushed with the ARGUMENTS EXCHANGED: dest for this smaller job
  // is B, the spare; C, the real destination, becomes the spare.
  yield snap({
    line: 5, tag: 'call',
    frames: [mainF(), mtF('n', 'A', 'C', 'B', { call: 5 }), mtF('n − 1', 'A', 'B', 'C', { hot: true })],
    pegs: pegState([diskN(), bundle()], [], [], ROLES_AB),
    narrate: 'MoveTower(disk − 1, source, spare, dest). Read the arguments: the destination for this smaller ' +
             'job is B — the SPARE — not C. And C, the real destination, becomes the spare.',
    note: EXCHANGE_NOTE,
  });

  // The bundle moves A → B, in ONE step, by assumption. The frame pops; control
  // is back in MoveTower(n) at line 5, its recursive call returned.
  yield snap({
    line: 5, tag: 'leap',
    frames: [mainF(), mtF('n', 'A', 'C', 'B', { call: 5 })],
    pegs: pegState([diskN()], [bundle(true)], [], ROLES_N),
    narrate: 'And by assumption, it is done. All n−1 disks are now on B.',
    note: HONESTY_NOTE,
  });

  /* ==================== MOVE 2 — the one real disk ======================== */
  // Line 6. move disk from source to dest → the bottom disk, A → C. This is the
  // only genuine single-disk move in the whole animation, and C was left clear
  // for exactly it.
  yield snap({
    line: 6, tag: 'move',
    frames: [mainF(), mtF('n', 'A', 'C', 'B', { call: 6 })],
    pegs: pegState([], [bundle()], [diskN(true)], ROLES_N),
    narrate: 'Now the bottom disk — the only real, single disk in this whole picture — moves from A to C. ' +
             'Peg C was kept clear for exactly this.',
  });

  /* ==================== MOVE 3 — the second recursive call ================= */
  // Line 7. MoveTower(disk - 1, spare, dest, source) → MoveTower(n-1, B, C, A).
  // The roles rotate on: B is now the source, C the destination, A the spare.
  yield snap({
    line: 7, tag: 'call',
    frames: [mainF(), mtF('n', 'A', 'C', 'B', { call: 7 }), mtF('n − 1', 'B', 'C', 'A', { hot: true })],
    pegs: pegState([], [bundle()], [diskN()], ROLES_BC),
    narrate: 'MoveTower(disk − 1, spare, dest, source). The n−1 disks are on B; move them to C, on top of the ' +
             'bottom disk, using A — now empty — as the spare. The arguments rotate again.',
    note: SECOND_EXCHANGE_NOTE,
  });

  // The bundle moves B → C, in ONE step, by assumption. The frame pops; every
  // disk is on C now — the bundle resting on the bottom disk.
  yield snap({
    line: 7, tag: 'leap',
    frames: [mainF(), mtF('n', 'A', 'C', 'B', { call: 7 })],
    pegs: pegState([], [], [diskN(), bundle(true)], ROLES_N),
    narrate: 'And by assumption, done again. All n−1 disks are now on C, resting on the bottom disk. Every disk ' +
             'is on C.',
  });

  /* ========================= MoveTower returns ============================= */
  // MoveTower(n) has run all three of its steps and returns to main. The whole
  // tower is on C.
  yield snap({
    line: 10, tag: 'return',
    frames: [mainF()],
    pegs: pegState([], [], [diskN(), bundle()], ROLES_N),
    narrate: 'MoveTower(n) returns to main. The whole tower is on C — reached by solving the smaller problem ' +
             'twice, with one real move in between.',
    note: FINAL_NOTE,
  });
}

export default {
  title: 'Hanoi: the recursive leap',
  subtitle: 'If you could move n−1 disks, moving n would be easy',
  profile: 'standard',
  columns: 2,
  languages: ['pseudo', 'java', 'cpp'],

  // Declared in reading order: the pegs are what the student watches, the call
  // frames are the bookkeeping that makes the argument exchange legible, and the
  // code is the machinery. The engine places the code in the left column and the
  // pegs structure at the top of the right; the callstack balances between them.
  panels: [
    { type: 'pegs', id: 'pegs', title: 'Pegs — n disks, of which n − 1 are bundled' },
    { type: 'callstack', id: 'calls', title: 'Function calls' },
    { type: 'code', id: 'code', title: 'MoveTower(disk, source, dest, spare)',
      listings: LISTINGS, labels: { pseudo: 'pseudocode', java: 'Java', cpp: 'C++' } },
  ],

  // No metrics counter: the whole point is to keep the count ABSTRACT (n disks,
  // n-1 bundled). A move counter would invite counting moves, which is part 2's job.

  initialTrace: 'run',
  traces: {
    run: trace,
  },
};
