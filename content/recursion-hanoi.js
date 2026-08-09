/* ds — Towers of Hanoi, three disks, seven moves, traced in full.
 *
 * PART 2 of two. Part 1 (recursion-hanoi-leap) established the recursive leap with
 * an abstract n−1 BUNDLE: it asked the student to accept that the top n−1 disks
 * could be moved, and showed that the rest was then easy — two moves of a pile and
 * one move of a disk. This animation discharges that assumption with REAL disks:
 * every bundle move from part 1 turns out to be another MoveTower call doing its
 * own three moves, until a call gets a single disk and just moves it.
 *
 * NO NEW ENGINE CAPABILITY BEYOND THE PEGS PANEL. The pegs panel (engine/panels/
 * pegs.js) is general — a peg holds an ordered list of items — so this animation
 * reuses it with three real disks and no bundle.
 *
 * THREE panels (profile 'standard'):
 *   pegs   the pegs panel — three real disks, widths clearly stepped so the
 *          no-larger-on-smaller rule reads at a glance. The disk moved on a step
 *          takes the blue activity fill. Peg role captions (source/dest/spare)
 *          update every step as the running call rebinds the pegs.
 *   calls  CALLSTACK ("Function calls") — reaches FOUR frames (main + three
 *          MoveTower), all visible, each showing its four bound arguments. The two
 *          MoveTower(2, …) calls carry DIFFERENT arguments — (A,B,C) and (B,C,A) —
 *          which is the argument exchange from part 1, now visible twice in one run.
 *   code   CODE — byte-identical to part 1 apart from line 10's argument.
 *
 * THE PAYOFF: seven moves for three disks, so the student can answer "how many for
 * four?" — the closing note poses exactly that, because doubling is what makes 64
 * disks absurd.
 *
 * CROSS-LINK TO PART 1: recursion-hanoi-leap is built and lives alongside this
 * file, so the step-0 note carries a link back to it ("See the assumption this
 * pays back"). Part 1's final note links forward here; the two seams close the
 * loop, as the design calls for.
 */

/* One listing, three ds languages, line-aligned to a single 10-line grid so `line`
 * is a plain number that resolves the same in every variant. Line meanings are
 * fixed: line 2 is the test, line 3 the base-case move, lines 5 and 7 the two
 * recursive calls, line 6 the direct move, line 10 the top-level call in main.
 * Byte-identical to part 1 apart from line 10's disk count. */
const LISTINGS = {
  pseudo: [
    'MoveTower(disk, source, dest, spare)',        // 1
    '    if disk == 1',                            // 2
    '        move disk from source to dest',       // 3
    '    else',                                    // 4
    '        MoveTower(disk - 1, source, spare, dest)', // 5
    '        move disk from source to dest',       // 6
    '        MoveTower(disk - 1, spare, dest, source)', // 7
    '',                                            // 8
    'main()',                                      // 9
    '    MoveTower(3, A, C, B)',                   // 10
  ],
  java: [
    'void moveTower(int disk, char source, char dest, char spare) {', // 1
    '    if (disk == 1)',                          // 2
    '        move(disk, source, dest);',           // 3
    '    else {',                                  // 4
    '        moveTower(disk - 1, source, spare, dest);', // 5
    '        move(disk, source, dest);',           // 6
    '        moveTower(disk - 1, spare, dest, source); } }', // 7
    '',                                            // 8
    'void main() {',                               // 9
    "    moveTower(3, 'A', 'C', 'B'); }",          // 10
  ],
  cpp: [
    'void moveTower(int disk, char source, char dest, char spare) {', // 1
    '    if (disk == 1)',                          // 2
    '        move(disk, source, dest);',           // 3
    '    else {',                                  // 4
    '        moveTower(disk - 1, source, spare, dest);', // 5
    '        move(disk, source, dest);',           // 6
    '        moveTower(disk - 1, spare, dest, source); } }', // 7
    '',                                            // 8
    'int main() {',                                // 9
    "    moveTower(3, 'A', 'C', 'B'); }",          // 10
  ],
};

/* ---- teaching notes ---- */
const SETUP_NOTE =
  'In the previous animation we assumed the top n−1 disks could be moved and found that the rest was easy ' +
  '— two moves of a pile and one move of a disk. Here that assumption gets paid back. Every pile move you ' +
  'are about to see is the same procedure again, on a smaller pile, until a pile is a single disk and there is ' +
  'nothing left to defer.';

const SAME_LINES_NOTE =
  'The same procedure as before. The only change from the previous animation is line 10’s disk count — ' +
  'now 3 instead of 2. The three lines that do the work did not change at all; the number of disks did.';

const ECHO_NOTE =
  'Exactly what you watched in part 1, except the pile is now a real pair of disks rather than a bundle, and ' +
  'moving it is a real problem we have to solve rather than assume.';

const BASE_NOTE =
  'THE BASE CASE, reached for the first time. Three MoveTower calls deep — four frames counting main — ' +
  'and this is the first move of the entire puzzle. Everything above it has been deferring.';

const ONLY_MOVE_NOTE =
  'This is the ONLY move the top-level call makes itself. Six of the seven moves belong to the two smaller ' +
  'calls around it.';

const EXCHANGE_NOTE =
  'Look at the arguments: (B, C, A). The other MoveTower(2, …) call was (A, B, C). Same function, same disk ' +
  'count, completely different pegs. Which peg is the source, which is the destination, and which is spare ' +
  'changes every time — that exchange is the entire difficulty of writing this function.';

const FINAL_NOTE =
  'Seven moves, and only one of them was made by the call you started. The other six were made by calls that ' +
  'call made — and by calls those made. Count what happened: to move 3 disks took two 2-disk jobs plus one ' +
  'move. A 2-disk job takes two 1-disk jobs plus one move. So moving n disks takes twice what moving n−1 ' +
  'takes, plus one: 1, 3, 7, 15, 31… That doubling is why the legend is what it is. The monks were given 64 ' +
  'disks — about eighteen quintillion moves. At one move a second it would take longer than the universe has ' +
  'existed. The procedure is three lines long and will finish; it just will not finish soon. One thing worth ' +
  'trying yourself: work out the seven moves for a fourth disk without running the code. You already know the ' +
  'shape — move three out of the way, move the fourth, move three back.';

/* ---- the trace ---- */

// A running peg state (ranks bottom-to-top; 3 is the largest disk) and a running
// call stack of frames. Snapshots copy both, so Back is free.
function* trace() {
  const state = { A: [3, 2, 1], B: [], C: [] };
  const move = (from, to) => { const d = state[from].pop(); state[to].push(d); return d; };

  // A frame. `call` is the source line it is currently SUSPENDED at (its pending
  // recursive call); it feeds the dimmed parked-line highlight while a callee runs.
  const mainF = { fn: 'main', call: 10, disk: null, argv: () => [] };
  const mtF = (disk, s, d, sp) => ({
    fn: 'MoveTower', call: null, disk, s, d, sp,
    argv: () => [
      { name: 'disk', value: disk }, { name: 'source', value: s },
      { name: 'dest', value: d },   { name: 'spare',  value: sp },
    ],
  });

  const stack = [mainF];

  // Peg role captions come from the running (top) MoveTower call's binding, so
  // they rebind every step exactly as the arguments do; main shows no roles.
  const rolesOf = top => (top && top.fn === 'MoveTower')
    ? { [top.s]: 'source', [top.d]: 'dest', [top.sp]: 'spare' } : {};

  const snap = ({ line, tag, narrate, note, active = null, bind = false }) => {
    const top = stack[stack.length - 1];
    const roles = rolesOf(top);
    return {
      line, tag, narrate, note,
      // Every caller's suspended call line, dimmed; code.js drops the active line
      // if it coincides, so the bright line always wins.
      parked: stack.slice(0, -1).map(f => f.call).filter(v => v != null),
      panels: {
        // The shared PEGS renderer (engine/panels/pegs.js, built general for part 1)
        // takes a peg as an ordered list of ITEMS bottom-to-top, each a disk of a
        // given `size` or a bundle. Part 2 uses real disks only: one item per rank,
        // its width carrying the rank, and the disk moved THIS step flagged `active`
        // (the blue fill) — the same per-item activity channel the bundle used.
        pegs: {
          pegs: ['A', 'B', 'C'].map(L => ({
            id: L,
            role: roles[L] ?? null,
            items: state[L].map(rank => ({
              kind: 'disk',
              size: rank,
              label: String(rank),
              active: !!(active && active.peg === L && active.rank === rank),
            })),
          })),
        },
        calls: {
          frames: stack.map((f, i) => {
            const isTop = i === stack.length - 1;
            let vars = f.argv();
            if (isTop && bind) vars = vars.map(v => ({ ...v, role: 'active' }));  // freshly bound args flash
            return { fn: f.fn, vars, active: isTop };
          }),
        },
      },
    };
  };

  /* ===================== STEP 0 — before anything runs ==================== */
  yield snap({
    line: null, tag: 'init',
    narrate: 'Three disks on peg A. Move them all to C, never putting a larger disk on a smaller one.',
    note: [SETUP_NOTE + ' ',
      { href: 'recursion-hanoi-leap.html', text: 'See the assumption this pays back' }],
  });

  /* main calls MoveTower(3, A, C, B) — frame pushed, arguments bound, roles set.
   * NOTHING MOVES. */
  mainF.call = 10;
  const mt3 = mtF(3, 'A', 'C', 'B'); stack.push(mt3);
  yield snap({
    line: 10, tag: 'call', bind: true,
    narrate: 'main calls MoveTower(3, A, C, B): move all three disks from A to C, using B as the spare.',
    note: SAME_LINES_NOTE,
  });

  // MoveTower(3): test, false.
  yield snap({ line: 2, tag: 'test', narrate: 'disk is 3, not 1, so this is the recursive case.' });

  // MoveTower(3) line 5 -> MoveTower(2, A, B, C).
  mt3.call = 5;
  const mt2abc = mtF(2, 'A', 'B', 'C'); stack.push(mt2abc);
  yield snap({
    line: 5, tag: 'call', bind: true,
    narrate: 'To move three disks to C, the top two must get out of the way — onto B, because C has to be clear for the big one.',
    note: ECHO_NOTE,
  });

  // MoveTower(2, A, B, C): test, false.
  yield snap({ line: 2, tag: 'test', narrate: 'disk is 2, not 1, so MoveTower(2, A, B, C) is the recursive case too.' });

  // MoveTower(2, A, B, C) line 5 -> MoveTower(1, A, C, B).  (deepest: four frames)
  mt2abc.call = 5;
  const b1 = mtF(1, 'A', 'C', 'B'); stack.push(b1);
  yield snap({
    line: 5, tag: 'call', bind: true,
    narrate: 'MoveTower(1, A, C, B): a single disk, to be moved from A to C.',
  });

  // MoveTower(1, A, C, B): test TRUE — the base case.
  yield snap({
    line: 2, tag: 'base',
    narrate: 'disk is 1. Nothing to defer — just move it.',
    note: BASE_NOTE,
  });

  // line 3 — MOVE 1: disk 1, A -> C.
  move('A', 'C');
  yield snap({ line: 3, tag: 'move', narrate: 'Move 1: disk 1 moves from A to C.', active: { peg: 'C', rank: 1 } });
  stack.pop();   // MoveTower(1, A, C, B) returns

  // Back in MoveTower(2, A, B, C), line 6 — MOVE 2: disk 2, A -> B.
  move('A', 'B');
  yield snap({
    line: 6, tag: 'move',
    narrate: 'Back in MoveTower(2, A, B, C): move 2 — disk 2 moves from A to B.',
    active: { peg: 'B', rank: 2 },
  });

  // MoveTower(2, A, B, C) line 7 -> MoveTower(1, C, B, A).
  mt2abc.call = 7;
  const b2 = mtF(1, 'C', 'B', 'A'); stack.push(b2);
  yield snap({
    line: 7, tag: 'call', bind: true,
    narrate: 'MoveTower(1, C, B, A): move the single disk from C onto B.',
  });

  // MoveTower(1, C, B, A): base case.
  yield snap({ line: 2, tag: 'base', narrate: 'disk is 1 again — the base case.' });

  // line 3 — MOVE 3: disk 1, C -> B.
  move('C', 'B');
  yield snap({
    line: 3, tag: 'move',
    narrate: 'Move 3: disk 1 moves from C to B. Two disks are stacked on B now — the pile is out of the way, and A holds only the largest disk.',
    active: { peg: 'B', rank: 1 },
  });
  stack.pop();   // MoveTower(1, C, B, A) returns
  stack.pop();   // MoveTower(2, A, B, C) returns — the pile is parked on B

  // Back in MoveTower(3, A, C, B), line 6 — MOVE 4: disk 3, A -> C.
  move('A', 'C');
  yield snap({
    line: 6, tag: 'move',
    narrate: 'The largest disk moves from A to C, once and for all.',
    note: ONLY_MOVE_NOTE,
    active: { peg: 'C', rank: 3 },
  });

  // MoveTower(3, A, C, B) line 7 -> MoveTower(2, B, C, A).
  mt3.call = 7;
  const mt2bca = mtF(2, 'B', 'C', 'A'); stack.push(mt2bca);
  yield snap({
    line: 7, tag: 'call', bind: true,
    narrate: 'Now bring the pile back: MoveTower(2, B, C, A), from B — where we parked it — to C.',
    note: EXCHANGE_NOTE,
  });

  // MoveTower(2, B, C, A): test, false.
  yield snap({ line: 2, tag: 'test', narrate: 'disk is 2, not 1, so MoveTower(2, B, C, A) is the recursive case.' });

  // MoveTower(2, B, C, A) line 5 -> MoveTower(1, B, A, C).
  mt2bca.call = 5;
  const b3 = mtF(1, 'B', 'A', 'C'); stack.push(b3);
  yield snap({
    line: 5, tag: 'call', bind: true,
    narrate: 'MoveTower(1, B, A, C): the small disk steps aside from B to A.',
  });

  // MoveTower(1, B, A, C): base case.
  yield snap({ line: 2, tag: 'base', narrate: 'disk is 1 — the base case.' });

  // line 3 — MOVE 5: disk 1, B -> A.
  move('B', 'A');
  yield snap({ line: 3, tag: 'move', narrate: 'Move 5: disk 1 moves from B to A.', active: { peg: 'A', rank: 1 } });
  stack.pop();   // MoveTower(1, B, A, C) returns

  // Back in MoveTower(2, B, C, A), line 6 — MOVE 6: disk 2, B -> C.
  move('B', 'C');
  yield snap({
    line: 6, tag: 'move',
    narrate: 'Move 6: disk 2 moves from B to C, onto the largest disk.',
    active: { peg: 'C', rank: 2 },
  });

  // MoveTower(2, B, C, A) line 7 -> MoveTower(1, A, C, B).
  mt2bca.call = 7;
  const b4 = mtF(1, 'A', 'C', 'B'); stack.push(b4);
  yield snap({
    line: 7, tag: 'call', bind: true,
    narrate: 'MoveTower(1, A, C, B): the last move, the small disk from A to C.',
  });

  // MoveTower(1, A, C, B): base case.
  yield snap({ line: 2, tag: 'base', narrate: 'disk is 1 — the base case, for the last time.' });

  // line 3 — MOVE 7: disk 1, A -> C.
  move('A', 'C');
  yield snap({ line: 3, tag: 'move', narrate: 'Move 7: disk 1 moves from A to C. The tower is rebuilt.', active: { peg: 'C', rank: 1 } });
  stack.pop();   // MoveTower(1, A, C, B) returns
  stack.pop();   // MoveTower(2, B, C, A) returns
  stack.pop();   // MoveTower(3, A, C, B) returns to main

  /* ========================= FINAL ======================================== */
  yield snap({
    line: null, tag: 'done',
    narrate: 'All three disks on C, in order. Seven moves.',
    note: FINAL_NOTE,
  });
}

export default {
  title: 'Hanoi: three disks, seven moves',
  subtitle: 'The same three lines, all the way down',
  profile: 'standard',
  columns: 2,
  languages: ['pseudo', 'java', 'cpp'],

  // Declared in reading order: the pegs (what the student watches), then the call
  // frames (bookkeeping), then the code (machinery). The engine places them.
  panels: [
    { type: 'pegs', id: 'pegs', title: 'Pegs', structure: true },
    { type: 'callstack', id: 'calls', title: 'Function calls' },
    { type: 'code', id: 'code', title: 'MoveTower',
      listings: LISTINGS, labels: { pseudo: 'pseudocode', java: 'Java', cpp: 'C++' } },
  ],

  // The move count IS the lesson (seven for three disks), so the counter is shown
  // and labelled in plain words — the one case AUTHORING.md allows a readout.
  metrics: { move: 'Moves' },

  initialTrace: 'run',
  traces: { run: trace },
};
