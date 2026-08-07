/* ds — "the simplest example of recursion", traced through the call stack.
 *
 * THE LESSON is NOT the descent. Students watch a recursive function call
 * itself and assume the work happens on the way DOWN. It does not: going down,
 * every call DEFERS and nothing is computed. Every multiplication happens on the
 * way back UP, after the base case finally returns an actual value. The two
 * directions have to FEEL different, so the animation shows both in one place —
 * the call stack building to five frames with nothing multiplied, then unwinding
 * as each frame performs the product it has been holding.
 *
 * Line 5 (`return n * factorial(n - 1)`) is the whole animation: the
 * multiplication CANNOT happen until the call to its right has returned. Line 5
 * is highlighted on the DESCENT (as each frame defers) and again on the ASCENT
 * (as each frame finally multiplies) — the same line, two different times, which
 * is exactly the point.
 *
 * THREE panels (profile 'standard'):
 *   calls    CALLSTACK ("Function calls") — main + factorial(4..1) = FIVE frames,
 *            all visible. This animation is the reason the CALLSTACK ceiling was
 *            raised from 3 to min(deepest reached, 6): here the whole stack IS the
 *            lesson, so a scrolling call stack would hide the thing being taught.
 *            Each frame shows only its bound `n` — n lives in the frames, where it
 *            belongs, and seeing the same name bound to a different value in each
 *            frame is a large part of the point. No result locals: the arithmetic
 *            lives in the cascade, and keeping every frame one line tall is what
 *            makes "five frames, all visible" hold exactly.
 *   cascade  STREAM — the lecture's expansion, one line per step, accumulating
 *            downward. Written top-to-bottom on the DESCENT (each deferral), then
 *            continuing downward on the ASCENT (each multiplication): the same
 *            panel tells both halves of the story.
 *   code     CODE — the lecture's code, unchanged, ds language tabs.
 *
 * THE CASCADE is SEVEN lines — the lecture's factorial(4) expansion "minus the
 * f(0) level" (§ re-check). The lecture recurses to zero and shows `1 * f(0)`;
 * this code's test is `n <= 1`, so factorial(1) answers immediately and the two
 * f(0) lines never appear. Seven lines sit within STREAM's 8-row ceiling, so the
 * central display never scrolls with no exception required — the only sizing
 * policy this animation touches is the CALLSTACK ceiling (engine SIZE_POLICY).
 *
 * NO array, NO tree, NO variables strip: everything the student needs is the
 * stack, the expansion, and the code. factorial(0) is never called; nothing is
 * multiplied during the descent; five frames show the same parameter name with
 * five different values — all correct, and all the lesson.
 */

/* One listing, three ds languages, line-aligned to a single 8-line grid so `line`
 * is a plain number that resolves the same in every variant. The line meanings
 * are fixed: line 2 is the test, line 3 the base-case return, line 5 the recursive
 * call AND the multiplication that waits on it, line 8 the print in main. */
const LISTINGS = {
  pseudo: [
    'factorial(n)',                       // 1
    '    if n <= 1',                      // 2
    '        return 1',                   // 3
    '    else',                           // 4
    '        return n * factorial(n - 1)',// 5
    '',                                   // 6
    'main()',                             // 7
    '    print factorial(4)',             // 8
  ],
  java: [
    'int factorial(int n) {',                  // 1
    '    if (n <= 1)',                          // 2
    '        return 1;',                        // 3
    '    else',                                 // 4
    '        return n * factorial(n - 1); }',   // 5
    '',                                         // 6
    'void main() {',                            // 7
    '    print(factorial(4)); }',               // 8
  ],
  cpp: [
    'int factorial(int n) {',                  // 1
    '    if (n <= 1)',                          // 2
    '        return 1;',                        // 3
    '    else',                                 // 4
    '        return n * factorial(n - 1); }',   // 5
    '',                                         // 6
    'int main() {',                             // 7
    '    cout << factorial(4); }',              // 8
  ],
};

/* ---- teaching notes ---- */
const SETUP_NOTE =
  'A recursive function calls itself on a smaller problem, and keeps doing that until the problem is small ' +
  'enough to answer outright — the BASE CASE. Watch two things: how deep the stack gets before anything is ' +
  'actually computed, and when the multiplications happen.';

const SUSPEND_NOTE =
  'Nothing has been multiplied yet. The expression 4 * factorial(3) cannot be evaluated until the ' +
  'right-hand side returns a number, so this frame is SUSPENDED — it sits on the stack holding its n and ' +
  'waiting.';

const THREE_FRAMES_NOTE =
  'Three frames now, each holding a different n, each waiting on the one above it. This is what the call ' +
  'stack is FOR — every suspended call keeps its own copy of n, and they do not interfere.';

const BASE_NOTE =
  'Everything up to this point was deferral. The base case is what stops the recursion and starts the ' +
  'arithmetic. Without it, or with it written wrong, the calls never stop — that is what a stack overflow is.';

const ASCENT_NOTE =
  'Here is the point of the whole animation. Going DOWN, nothing was computed — every call just deferred to ' +
  'a smaller one. Coming back UP, each frame performs the multiplication it has been holding. The work ' +
  'happens on the return, in reverse order of the calls.';

const FINAL_NOTE =
  'Four multiplications, and every one of them happened after the deepest call had already returned. Read ' +
  'the cascade from the top down and you are watching the descent; read it from the bottom up and you are ' +
  'watching the arithmetic. ' +
  "Two things worth knowing. The lecture's own expansion goes one level further than this code does — it " +
  'shows 1 * f(0) — because it recurses to zero, while the test here is n <= 1 and so factorial(1) answers ' +
  'immediately. Both give 24; the base case is a choice, and it has to match the test. ' +
  'And factorial is a bad reason to use recursion. A loop does the same job with one frame instead of five. ' +
  'The lecture says as much: it is here to be understood, not to be copied.';

/* The cascade is written under a 13-space hang so every `=` lines up beneath the
 * `=` in `factorial(4) = ...` (STREAM lines are `white-space: pre`, so the leading
 * spaces are preserved). Each string is appended on the step that computes it. */
const HANG = '             '; // 13 spaces: aligns with the `=` after "factorial(4) "

function* trace() {
  const casc = [];   // the expansion, accumulated one line per step

  // A factorial frame shows only its bound n. `hot` gives n the blue activity fill
  // on the step it is bound (a frame's entry). main() is the driver at the bottom.
  // Every caller frame carries the line it is parked on (main → 8, a suspended
  // factorial → its line-5 recursive call); the active top frame's own call line is
  // dropped from `parked` because it is the bright active line.
  const mainF = () => ({ fn: 'main', vars: [], call: 8 });
  const facF  = (n, hot = false) => ({
    fn: 'factorial',
    vars: [{ name: 'n', value: n, role: hot ? 'active' : undefined }],
    call: 5,
  });

  const snap = ({ line, tag, narrate, note, frames, cascNew = false }) => ({
    line, tag, narrate, note,
    parked: frames.slice(0, -1).map(f => f.call).filter(v => v != null),
    panels: {
      calls: { frames: frames.map((f, i) => ({ fn: f.fn, vars: f.vars, active: i === frames.length - 1 })) },
      cascade: { lines: casc.map((text, i) => ({ text, dir: 'out', isNew: cascNew && i === casc.length - 1 })) },
    },
  });

  /* ===================== STEP 0 — before anything runs ===================== */
  // main is the driver, shown so the calls have a visible origin; the cascade is
  // empty. No line highlighted.
  yield snap({
    line: null, tag: 'init', frames: [mainF()],
    narrate: 'factorial(4). The definition is n! = n * (n-1)! — the function is written in terms of itself.',
    note: SETUP_NOTE,
  });

  /* ========================= THE DESCENT ==================================== */
  // main calls factorial(4). main is still the active frame; factorial(4) is
  // entered on the next step.
  yield snap({
    line: 8, tag: 'call', frames: [mainF()],
    narrate: 'main calls factorial(4). To print the result, factorial(4) has to be evaluated first.',
  });

  // factorial(4): test, false. The frame is pushed with n = 4 bound.
  yield snap({
    line: 2, tag: 'test', frames: [mainF(), facF(4, true)],
    narrate: '4 is not <= 1, so this is not the base case.',
  });

  // factorial(4): line 5 — defer. It cannot multiply yet; it calls factorial(3).
  casc.push('factorial(4) = 4 * factorial(3)');
  yield snap({
    line: 5, tag: 'defer', frames: [mainF(), facF(4)], cascNew: true,
    narrate: 'To compute 4 * factorial(3), factorial(3) has to be computed first. The multiplication waits.',
    note: SUSPEND_NOTE,
  });

  // factorial(3): test, false.
  yield snap({
    line: 2, tag: 'test', frames: [mainF(), facF(4), facF(3, true)],
    narrate: '3 is not <= 1 either, so factorial(3) is not the base case.',
  });

  // factorial(3): line 5 — defer, calls factorial(2).
  casc.push(HANG + '= 4 * (3 * factorial(2))');
  yield snap({
    line: 5, tag: 'defer', frames: [mainF(), facF(4), facF(3)], cascNew: true,
    narrate: 'factorial(3) defers the same way: 3 * factorial(2) has to wait for factorial(2). Two frames are suspended now.',
  });

  // factorial(2): test, false.
  yield snap({
    line: 2, tag: 'test', frames: [mainF(), facF(4), facF(3), facF(2, true)],
    narrate: '2 is not <= 1, so factorial(2) is not the base case either.',
  });

  // factorial(2): line 5 — defer, calls factorial(1). Three factorial frames now
  // suspended, each waiting on the one above it.
  casc.push(HANG + '= 4 * (3 * (2 * factorial(1)))');
  yield snap({
    line: 5, tag: 'defer', frames: [mainF(), facF(4), facF(3), facF(2)], cascNew: true,
    narrate: 'factorial(2) defers too: 2 * factorial(1) waits for factorial(1). This is as deep as the recursion goes.',
    note: THREE_FRAMES_NOTE,
  });

  /* ========================= THE BASE CASE ================================= */
  // factorial(1): test — TRUE. Five frames on the stack now, and still nothing
  // has been multiplied.
  yield snap({
    line: 2, tag: 'base', frames: [mainF(), facF(4), facF(3), facF(2), facF(1, true)],
    narrate: '1 is <= 1. This is the base case — the first call that can answer without asking anything else.',
  });

  // factorial(1): line 3 — return 1. The first actual number.
  casc.push(HANG + '= 4 * (3 * (2 * 1))');
  yield snap({
    line: 3, tag: 'return', frames: [mainF(), facF(4), facF(3), facF(2), facF(1)], cascNew: true,
    narrate: 'factorial(1) returns 1. An actual number, at last.',
    note: BASE_NOTE,
  });

  /* ========================= THE ASCENT ==================================== */
  // Each return pops a frame and performs the multiplication that was waiting, in
  // reverse order of the calls. factorial(1) has popped; factorial(2) resumes.
  casc.push(HANG + '= 4 * (3 * 2)');
  yield snap({
    line: 5, tag: 'mul', frames: [mainF(), facF(4), facF(3), facF(2)], cascNew: true,
    narrate: 'factorial(2) was waiting on that 1. Now it can finish: 2 * 1 is 2.',
    note: ASCENT_NOTE,
  });

  // factorial(2) has popped; factorial(3) resumes: 3 * 2 = 6.
  casc.push(HANG + '= 4 * 6');
  yield snap({
    line: 5, tag: 'mul', frames: [mainF(), facF(4), facF(3)], cascNew: true,
    narrate: 'factorial(3) was waiting on factorial(2). Now 3 * 2 is 6.',
  });

  // factorial(3) has popped; factorial(4) resumes: 4 * 6 = 24.
  casc.push(HANG + '= 24');
  yield snap({
    line: 5, tag: 'mul', frames: [mainF(), facF(4)], cascNew: true,
    narrate: 'The last frame finishes: 4 * 6 is 24.',
  });

  // factorial(4) has popped; main receives 24 and prints it.
  yield snap({
    line: 8, tag: 'print', frames: [mainF()],
    narrate: 'factorial(4) returns 24 to main, which prints it.',
    note: FINAL_NOTE,
  });
}

export default {
  title: 'Recursion: the work happens on the way back',
  subtitle: 'Tracing factorial(4) through the call stack',
  profile: 'standard',
  columns: 2,
  languages: ['pseudo', 'java', 'cpp'],

  // Declared in reading order; the engine places them. The call stack (what the
  // student watches change frame by frame) and the expansion it produces flow down
  // the right column; the code anchors the left. STREAM is declared last — it is
  // what the program builds up, reading as a continuation of the code beside it.
  panels: [
    { type: 'callstack', id: 'calls', title: 'Function calls' },
    { type: 'code', id: 'code', title: 'factorial(n)',
      listings: LISTINGS, labels: { pseudo: 'pseudocode', java: 'Java', cpp: 'C++' } },
    { type: 'stream', id: 'cascade', title: 'The expansion' },
  ],

  initialTrace: 'run',
  traces: {
    run: trace,
  },
};
