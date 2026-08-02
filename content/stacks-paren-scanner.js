/* ds — A3 "Checking parentheses with a stack"
 *
 * Two parts, one continuous trace driven by main():
 *
 *   PART 1 — the stack itself. A stack holding 5 1 3 4; pop the top, push a new
 *   value. push and pop are STEPPED INTO here, so the student sees their bodies
 *   once (their line 2-3 / 6-7 executions, each with a frame on the call stack
 *   and main's call line dimmed).
 *
 *   PART 2 — the application: a parenthesis scanner over three short
 *   expressions, each isolating one error. push and pop are now SUMMARIZED to a
 *   single step (the call line 19 / 24), because Part 1 already showed their
 *   insides. On a summarized call the frame STILL appears in Function calls with
 *   its parameter bound -- only the body is folded away, never the binding.
 *
 * The lesson is error DETECTION, not evaluation. Three errors:
 *   scan("a)(b")  -> TOO_MANY_RIGHT  (a stray ')' while the stack is empty)
 *   scan("[a)")   -> MISMATCH        (popped '[' is not the type ')' closes)
 *   scan("((a)")  -> TOO_MANY_LEFT   (a '(' left on the stack when the loop ends)
 * The payoff is the third: the loop ends with error still NONE, and the error is
 * only found by looking at the stack AFTER the loop -- the one error no in-loop
 * event can catch.
 *
 * The one NEW capability this animation adds is the vertical CELLS `column`:
 * cell [0] at the bottom, the stack growing upward, index labels [0]..[3] in a
 * fixed band on the RIGHT, and the stack_ix marker on the LEFT (▶), parking
 * BELOW cell [0] at the -1 sentinel. Everything else -- the index-pointer
 * contract, stale cells, the CALLSTACK, caller-line dimming, the bounded stage
 * -- is inherited unchanged from queues-count-vs-rear.
 *
 * A stale cell here is HEALTHY: Part 1's 5 1 3 7 stay in the array, greyed,
 * through the scans until they are overwritten. Nothing corrupts memory; every
 * error is a syntax error in the student's input. NO memory-danger marker
 * anywhere. WATCH only: one trace, no gates; the insight is all narration/notes.
 *
 * matches() is NEVER stepped into -- its result is narrated. Line 13's three
 * initialisations run as ONE step. Lines 16 and 21 are isFull and isEmpty,
 * inlined; the narration names them as such (the lecture's vocabulary). */

const MAX = 4;

/* One listing, three ds languages, line-aligned to a single 37-line grid, so
 * `line` is a plain number that resolves the same in every language. */
const LISTINGS = {
  pseudo: [
    'push(c)',                                       //  1
    '    stack_ix = stack_ix + 1',                   //  2
    '    stack[stack_ix] = c',                       //  3
    '',                                              //  4
    'pop()',                                         //  5
    '    popped = stack[stack_ix]',                  //  6
    '    stack_ix = stack_ix - 1',                   //  7
    '',                                              //  8
    'matches(open, close)',                          //  9
    '    return open and close are the same type',   // 10
    '',                                              // 11
    'scan(expr)',                                    // 12
    '    ix = 0,  stack_ix = -1,  error = NONE',     // 13
    '    while ix < length(expr) and error = NONE',  // 14
    '        if expr[ix] is one of  (  [  {',        // 15
    '            if stack_ix = MAX - 1',             // 16
    '                error = TOO_DEEP',              // 17
    '            else',                              // 18
    '                push(expr[ix])',                // 19
    '        else if expr[ix] is one of  )  ]  }',   // 20
    '            if stack_ix = -1',                  // 21
    '                error = TOO_MANY_RIGHT',        // 22
    '            else',                              // 23
    '                pop()',                         // 24
    '                if not matches(popped, expr[ix])', // 25
    '                    error = MISMATCH',          // 26
    '        ix = ix + 1',                           // 27
    '    if error = NONE and stack_ix > -1',         // 28
    '        error = TOO_MANY_LEFT',                 // 29
    '    report(error)',                             // 30
    '',                                              // 31
    'main()',                                        // 32
    '    pop()',                                     // 33
    "    push('7')",                                 // 34
    '    scan("a)(b")',                              // 35
    '    scan("[a)")',                               // 36
    '    scan("((a)")',                              // 37
  ],
  java: [
    'void push(char c) {',                           //  1
    '    stack_ix = stack_ix + 1;',                  //  2
    '    stack[stack_ix] = c; }',                    //  3
    '',                                              //  4
    'char pop() {',                                  //  5
    '    popped = stack[stack_ix];',                 //  6
    '    stack_ix = stack_ix - 1; }',                //  7
    '',                                              //  8
    'boolean matches(char open, char close) {',      //  9
    '    return sameType(open, close); }',           // 10
    '',                                              // 11
    'void scan(String expr) {',                      // 12
    '    ix = 0;  stack_ix = -1;  error = NONE;',    // 13
    '    while (ix < expr.length() && error == NONE) {', // 14
    '        if ("([{".indexOf(expr.charAt(ix)) >= 0) {', // 15
    '            if (stack_ix == MAX - 1)',          // 16
    '                error = TOO_DEEP;',             // 17
    '            else',                              // 18
    '                push(expr.charAt(ix));',        // 19
    '        } else if (")]}".indexOf(expr.charAt(ix)) >= 0) {', // 20
    '            if (stack_ix == -1)',               // 21
    '                error = TOO_MANY_RIGHT;',       // 22
    '            else {',                            // 23
    '                pop();',                        // 24
    '                if (!matches(popped, expr.charAt(ix)))', // 25
    '                    error = MISMATCH; } }',     // 26
    '        ix = ix + 1; }',                        // 27
    '    if (error == NONE && stack_ix > -1)',       // 28
    '        error = TOO_MANY_LEFT;',                // 29
    '    report(error); }',                          // 30
    '',                                              // 31
    'void main() {',                                 // 32
    '    pop();',                                    // 33
    "    push('7');",                                // 34
    '    scan("a)(b");',                             // 35
    '    scan("[a)");',                              // 36
    '    scan("((a)"); }',                           // 37
  ],
  cpp: [
    'void push(char c) {',                           //  1
    '    stack_ix = stack_ix + 1;',                  //  2
    '    stack[stack_ix] = c; }',                    //  3
    '',                                              //  4
    'char pop() {',                                  //  5
    '    popped = stack[stack_ix];',                 //  6
    '    stack_ix = stack_ix - 1; }',                //  7
    '',                                              //  8
    'bool matches(char open, char close) {',         //  9
    '    return sameType(open, close); }',           // 10
    '',                                              // 11
    'void scan(string expr) {',                      // 12
    '    ix = 0;  stack_ix = -1;  error = NONE;',    // 13
    '    while (ix < expr.length() && error == NONE) {', // 14
    '        if (strchr("([{", expr[ix])) {',        // 15
    '            if (stack_ix == MAX - 1)',          // 16
    '                error = TOO_DEEP;',             // 17
    '            else',                              // 18
    '                push(expr[ix]);',               // 19
    '        } else if (strchr(")]}", expr[ix])) {', // 20
    '            if (stack_ix == -1)',               // 21
    '                error = TOO_MANY_RIGHT;',       // 22
    '            else {',                            // 23
    '                pop();',                        // 24
    '                if (!matches(popped, expr[ix]))', // 25
    '                    error = MISMATCH; } }',     // 26
    '        ix = ix + 1; }',                        // 27
    '    if (error == NONE && stack_ix > -1)',       // 28
    '        error = TOO_MANY_LEFT;',                // 29
    '    report(error); }',                          // 30
    '',                                              // 31
    'int main() {',                                  // 32
    '    pop();',                                    // 33
    "    push('7');",                                // 34
    '    scan("a)(b");',                             // 35
    '    scan("[a)");',                              // 36
    '    scan("((a)"); }',                           // 37
  ],
};

/* ---- call-frame builders. `call` is the parked caller line (dimmed while a
 * callee runs). main has no locals; push binds c; pop and scan bind as shown. A
 * SUMMARIZED push/pop in Part 2 still pushes its frame (with c bound for push),
 * so the binding is never hidden -- only the body is folded to one step. ---- */
const mainF = call    => ({ fn: 'main',  vars: [],                          call });
const pushF = c       => ({ fn: 'push',  vars: [{ name: 'c', value: `'${c}'` }] });
const popF  = ()      => ({ fn: 'pop',   vars: [] });
const scanF = expr    => ({ fn: 'scan',  vars: [{ name: 'expr', value: `"${expr}"` }] });

/* ---- teaching notes ---- */
const SETUP_NOTE =
  'A stack is a pile: you can only take the top item off, and you can only add to the top. That is ' +
  'what LIFO means — last in, first out. stack_ix holds the index of the top element. The stack is ' +
  'full right now: stack_ix is 3 and MAX is 4.';

const POP_NOTE =
  'Popping does not remove anything. It moves stack_ix down, and everything above it stops being part ' +
  'of the stack. The greying is ours, for reading the picture; the program has only the array and ' +
  'stack_ix.';

const SCAN1_INIT_NOTE =
  'The characters from the demo are still in the array. Setting stack_ix to -1 is what makes the stack ' +
  'empty; nothing was erased. -1 means the index points at nothing.';

const HOOK_NOTE =
  'Count the parentheses in a)(b: one left, one right. Balanced. A program that just counted them would ' +
  'accept this expression, and it is plainly wrong. The stack rejected it at the second character, ' +
  "because a stack asks a harder question than 'how many?' — it asks 'is there something open for this " +
  "to close?'";

const SILENT_NOTE =
  'Nothing was printed while the loop ran. The error was recorded in a variable and reported here, after ' +
  "the loop — silent error reporting. The scanner's job is to scan; reporting is somebody else's job.";

const MISMATCH_NOTE =
  'This is why the pop has to store what it removed. Counting symbols, or even matching them by position, ' +
  'is not enough — you have to compare the type of the closing symbol against the type of the opening ' +
  'symbol it is closing. ([...]) and [{...}] are fine; [...) is not. You cannot mix and match.';

const SCAN3_ENDLOOP_NOTE =
  'The scanner is finished and it reported no error. Look at the stack before clicking on.';

const PAYOFF_NOTE =
  'Three kinds of parenthesis error, and only two of them can be caught inside the loop. A stray closing ' +
  'symbol is caught the moment it appears, because the stack is empty. A mismatched type is caught the ' +
  'moment it is popped. But an opening symbol that is never closed produces no event at all — the loop ' +
  'just ends, normally, with error still NONE. The only way to catch it is to look at the stack after the ' +
  'loop has finished. A non-empty stack at the end means something was opened and never closed.';

const CHALLENGE_NOTE =
  "One error never fired in any of these three scans: TOO_DEEP, on line 17. MAX is 4 here, so this stack " +
  'holds at most four unclosed symbols. What is the shortest expression that would trigger it — and what ' +
  "does a 'too many levels' error mean for a real compiler, which has to pick some limit?";

function* trace() {
  const stack = ['5', '1', '3', '4'];   // the stack storage; never blanked
  let stackIx = 3;                       // top of stack; -1 means empty
  let exprChars = [null, null, null, null];
  let ix = -1;                           // scan's cursor; -1 = no scan (parked)
  let popped = null;                     // last value pop() removed
  let error = 'NONE';
  const stream = [];
  let curExpr = '';                      // the expression scan() is running now
  let curMLine = 0;                      // main's call line for the running scan

  /* The expression as a marked CELLS row: one character per cell, [0]..[3]
   * labels beneath, the ix marker (parked left of [0] when there is no scan).
   * The character under examination this step is `compared`. */
  const exprPanel = compared => ({
    render: 'box',
    rowLabel: 'expr',
    cells: exprChars.map((v, i) => {
      if (v == null)      return { value: '', role: 'empty' };
      if (i === compared) return { value: v, role: 'compared' };
      return { value: v };
    }),
    markers: [{ label: 'ix', index: ix }],
  });

  /* The stack as the NEW vertical column: cell [0] at the bottom, growing up.
   * A cell above stack_ix that still holds a character is `stale` (greyed); a
   * cell written THIS step is `active` (blue). The stack_ix marker sits on the
   * left and parks below cell [0] at the -1 sentinel. */
  const stackPanel = active => ({
    render: 'column',
    cells: stack.map((v, i) => {
      if (v == null)     return { value: '', role: 'empty' };
      if (i === active)  return { value: v, role: 'active' };
      if (i > stackIx)   return { value: v, role: 'stale' };
      return { value: v };                                  // member
    }),
    markers: [{ label: 'stack_ix', index: stackIx }],
  });

  /* The compact state strip: ix, stack_ix, popped, error. `hot` gives the
   * changing box the blue fill. stack_ix always shows its real value (the -1
   * sentinel included); ix and popped show the placeholder before they hold a
   * meaningful value. The error box reserves the width of the longest name
   * (TOO_MANY_RIGHT) so the strip never resizes. */
  const statePanel = hot => ({
    render: 'box',
    cells: [
      { label: 'ix',       value: ix < 0 ? '' : ix,           role: ix < 0 ? 'empty' : (hot === 'ix' ? 'active' : undefined) },
      { label: 'stack_ix', value: stackIx,                    role: hot === 'stack_ix' ? 'active' : undefined },
      { label: 'popped',   value: popped == null ? '' : popped, role: popped == null ? 'empty' : (hot === 'popped' ? 'active' : undefined) },
      { label: 'error',    value: error, minCh: 16,           role: hot === 'error' ? 'active' : undefined },
    ],
  });

  const snap = ({ line, tag, narrate, note, frames, compared = null, active = null, hot = null, streamNew = false }) => ({
    line, tag, narrate, note,
    parked: frames.slice(0, -1).map(f => f.call).filter(Boolean),
    panels: {
      expr:      exprPanel(compared),
      stack:     stackPanel(active),
      state:     statePanel(hot),
      callstack: { frames: frames.map((f, i) => ({ fn: f.fn, vars: f.vars, active: i === frames.length - 1 })) },
      out:       { lines: stream.map((t, i) => ({ text: t, dir: 'out', isNew: streamNew && i === stream.length - 1 })) },
    },
  });

  // Frames while the running scan's body executes: main (call line dimmed) then
  // scan (active). scan carries no `call`, so its own line is the bright one.
  const scanFrames = () => [mainF(curMLine), scanF(curExpr)];

  /* ---------- Part 2 character patterns (push/pop SUMMARIZED) ---------- */

  // Opening symbol with room: 14 / 15(true) / 16(false) / 19(push) / 27.
  function* charOpen(p, ch, n) {
    yield snap({ line: 14, tag: 'test', narrate: n.loop, frames: scanFrames() });
    yield snap({ line: 15, tag: 'test', narrate: n.isOpen, compared: p, frames: scanFrames() });
    yield snap({ line: 16, tag: 'test', narrate: n.isFull, compared: p, frames: scanFrames() });
    stackIx += 1; stack[stackIx] = ch;
    yield snap({ line: 19, tag: 'push', narrate: n.push, compared: p, active: stackIx, hot: 'stack_ix',
                 frames: [mainF(curMLine), scanF(curExpr), pushF(ch)] });
    ix = p + 1;
    yield snap({ line: 27, tag: 'inc', narrate: n.inc, hot: 'ix', frames: scanFrames() });
  }

  // Ignored character: 14 / 15(false) / 20(false) / 27.
  function* charIgnore(p, n) {
    yield snap({ line: 14, tag: 'test', narrate: n.loop, frames: scanFrames() });
    yield snap({ line: 15, tag: 'test', narrate: n.notOpen, compared: p, frames: scanFrames() });
    yield snap({ line: 20, tag: 'test', narrate: n.notClose, compared: p, frames: scanFrames() });
    ix = p + 1;
    yield snap({ line: 27, tag: 'inc', narrate: n.inc, hot: 'ix', frames: scanFrames() });
  }

  // Closing symbol, stack empty: 14 / 15(false) / 20(true) / 21(true) / 22 / 27.
  function* charCloseEmpty(p, n) {
    yield snap({ line: 14, tag: 'test', narrate: n.loop, frames: scanFrames() });
    yield snap({ line: 15, tag: 'test', narrate: n.notOpen, compared: p, frames: scanFrames() });
    yield snap({ line: 20, tag: 'test', narrate: n.isClose, compared: p, frames: scanFrames() });
    yield snap({ line: 21, tag: 'test', narrate: n.isEmpty, compared: p, frames: scanFrames() });
    error = 'TOO_MANY_RIGHT';
    yield snap({ line: 22, tag: 'error', narrate: n.setErr, note: n.errNote, compared: p, hot: 'error', frames: scanFrames() });
    ix = p + 1;
    yield snap({ line: 27, tag: 'inc', narrate: n.inc, hot: 'ix', frames: scanFrames() });
  }

  // Closing symbol, stack non-empty: 14 / 15(false) / 20(true) / 21(false) /
  // 24(pop) / 25 / [26 if mismatch] / 27.
  function* charClosePop(p, n, mismatch) {
    yield snap({ line: 14, tag: 'test', narrate: n.loop, frames: scanFrames() });
    yield snap({ line: 15, tag: 'test', narrate: n.notOpen, compared: p, frames: scanFrames() });
    yield snap({ line: 20, tag: 'test', narrate: n.isClose, compared: p, frames: scanFrames() });
    yield snap({ line: 21, tag: 'test', narrate: n.notEmpty, compared: p, frames: scanFrames() });
    popped = stack[stackIx]; stackIx -= 1;    // the popped cell becomes stale
    yield snap({ line: 24, tag: 'pop', narrate: n.pop, compared: p, hot: 'popped',
                 frames: [mainF(curMLine), scanF(curExpr), popF()] });
    yield snap({ line: 25, tag: 'test', narrate: n.matches, compared: p, frames: scanFrames() });
    if (mismatch) {
      error = 'MISMATCH';
      yield snap({ line: 26, tag: 'error', narrate: n.setErr, note: n.errNote, compared: p, hot: 'error', frames: scanFrames() });
    }
    ix = p + 1;
    yield snap({ line: 27, tag: 'inc', narrate: n.inc, hot: 'ix', frames: scanFrames() });
  }

  // scan() call: previous scan's locals are gone, so expr blanks, ix parks, and
  // error resets. The frame is not pushed yet (main only), like Part 1's calls.
  function* scanCall(mLine, expr) {
    curMLine = mLine; curExpr = expr;       // `expr` is the RAW expression, no quotes
    exprChars = [null, null, null, null]; ix = -1; error = 'NONE';
    yield snap({ line: mLine, tag: 'call', narrate: `main calls scan with the expression "${expr}".`, frames: [mainF()] });
  }

  // scan() line 13: the three initialisations as ONE step. expr loads, ix -> 0,
  // stack_ix -> -1 (every stack cell goes stale, the marker parks below [0]).
  function* scanInit(narrate, note) {
    exprChars = curExpr.split('').concat([null, null, null, null]).slice(0, 4);
    ix = 0; stackIx = -1; error = 'NONE';
    yield snap({ line: 13, tag: 'init', narrate, note, hot: 'stack_ix', frames: scanFrames() });
  }

  // Loop exit when error is set inside the loop: 14(false) / 28(skipped) / 30.
  function* exitWithError(report, reportNote) {
    yield snap({ line: 14, tag: 'test', narrate: 'error is no longer NONE, so the loop stops.', frames: scanFrames() });
    yield snap({ line: 28, tag: 'test', narrate: 'error is not NONE, so this post-loop check is skipped.', frames: scanFrames() });
    stream.push(report);
    yield snap({ line: 30, tag: 'report', narrate: 'report prints the error that was recorded.', note: reportNote, streamNew: true, frames: scanFrames() });
  }

  /* ================= STEP 0 — the initial stack, nothing executed ========= */
  yield snap({
    line: null, tag: 'init',
    narrate: 'A stack holding four characters. Only the top one, 4, can be reached — stack_ix points at it.',
    note: SETUP_NOTE,
    frames: [mainF()],
  });

  /* ================= PART 1 — pop, then push (stepped into) =============== */

  // OP A — main line 33: pop()  (removes the top, 4)
  yield snap({ line: 33, tag: 'call', narrate: 'main calls pop to take the top element off the stack.', frames: [mainF()] });
  popped = stack[stackIx];   // '4'
  yield snap({ line: 6, tag: 'assign', narrate: 'popped is assigned the top element, 4.', hot: 'popped', frames: [mainF(33), popF()] });
  stackIx -= 1;              // 3 -> 2; cell [3] becomes stale
  yield snap({ line: 7, tag: 'assign',
    narrate: 'stack_ix drops to 2. 3 is the top element now. The 4 is still sitting in the array — nothing erased it.',
    note: POP_NOTE, hot: 'stack_ix', frames: [mainF(33), popF()] });

  // OP B — main line 34: push('7')  (over the stale 4)
  yield snap({ line: 34, tag: 'call', narrate: "main calls push with the value '7'.", frames: [mainF()] });
  stackIx += 1;             // 2 -> 3
  yield snap({ line: 2, tag: 'assign', narrate: 'stack_ix rises to 3 — that is where the new element goes.', hot: 'stack_ix', frames: [mainF(34), pushF('7')] });
  stack[stackIx] = '7';    // cell [3] takes '7', member again
  yield snap({ line: 3, tag: 'store', narrate: "'7' is written over the 4 that used to be there.", active: 3, frames: [mainF(34), pushF('7')] });

  /* ================= PART 2 — the scanner =============================== */

  // ---- SCAN 1 — main line 35: scan("a)(b")  ->  TOO_MANY_RIGHT ----
  yield* scanCall(35, 'a)(b');
  yield* scanInit(
    'ix starts at the first character, stack_ix goes to -1 — the stack is empty — and error is set to NONE.',
    SCAN1_INIT_NOTE);
  yield* charIgnore(0, {
    loop:     'ix is 0, which is less than 4, and error is NONE, so the scanner reads the next character.',
    notOpen:  "'a' is not an opening symbol.",
    notClose: "'a' is neither an opening nor a closing symbol, so the scanner ignores it.",
    inc:      'ix advances to 1, the next character.',
  });
  yield* charCloseEmpty(1, {
    loop:     'ix is 1, still less than 4 and error is NONE, so the scan continues.',
    notOpen:  "')' is not an opening symbol.",
    isClose:  "')' is a closing symbol.",
    isEmpty:  'A closing symbol, and the stack is empty — there is no opening symbol for it to close. This test is isEmpty.',
    setErr:   'error is set to TOO_MANY_RIGHT.',
    errNote:  HOOK_NOTE,
    inc:      'ix advances to 2.',
  });
  yield* exitWithError('too many right parentheses', SILENT_NOTE);

  // ---- SCAN 2 — main line 36: scan("[a)")  ->  MISMATCH ----
  yield* scanCall(36, '[a)');
  yield* scanInit(
    'The next expression loads: [ a ) fills cells 0 to 2, and cell 3 stays empty. ix is 0, stack_ix is -1, error is NONE.');
  yield* charOpen(0, '[', {
    loop:   'ix is 0, less than 3, and error is NONE, so the scan begins.',
    isOpen: "'[' is an opening symbol.",
    isFull: 'stack_ix is -1, not 3, so the stack is not full. This test is isFull.',
    push:   "'[' is an opening symbol, so it goes on the stack. stack_ix moves from -1 to 0.",
    inc:    'ix advances to 1.',
  });
  yield* charIgnore(1, {
    loop:     'ix is 1, less than 3, and error is NONE.',
    notOpen:  "'a' is not an opening symbol.",
    notClose: "'a' is neither an opening nor a closing symbol, so it is ignored.",
    inc:      'ix advances to 2.',
  });
  yield* charClosePop(2, {
    loop:     'ix is 2, less than 3, and error is NONE.',
    notOpen:  "')' is not an opening symbol.",
    isClose:  "')' is a closing symbol.",
    notEmpty: 'stack_ix is 0, not -1, so the stack is not empty. This test is isEmpty.',
    pop:      "The stack is not empty, so pop it. popped holds '[' — the symbol this ')' is supposed to be closing.",
    matches:  "'[' and ')' are not the same type.",
    setErr:   'error is set to MISMATCH.',
    errNote:  MISMATCH_NOTE,
    inc:      'ix advances to 3.',
  }, true);
  yield* exitWithError('mismatched parentheses');

  // ---- SCAN 3 — main line 37: scan("((a)")  ->  TOO_MANY_LEFT (the payoff) ----
  yield* scanCall(37, '((a)');
  yield* scanInit(
    'The last expression loads: ( ( a ) fills all four cells. ix is 0, stack_ix is -1, error is NONE.');
  yield* charOpen(0, '(', {
    loop:   'ix is 0, less than 4, and error is NONE.',
    isOpen: "'(' is an opening symbol.",
    isFull: 'stack_ix is -1, not 3, so the stack is not full. This test is isFull.',
    push:   "'(' goes on the stack. stack_ix moves from -1 to 0.",
    inc:    'ix advances to 1.',
  });
  yield* charOpen(1, '(', {
    loop:   'ix is 1, less than 4, and error is NONE.',
    isOpen: "'(' is an opening symbol.",
    isFull: 'stack_ix is 0, not 3, so the stack is not full.',
    push:   "A second '(' goes on the stack. stack_ix moves from 0 to 1 — two opening symbols are on the stack now.",
    inc:    'ix advances to 2.',
  });
  yield* charIgnore(2, {
    loop:     'ix is 2, less than 4, and error is NONE.',
    notOpen:  "'a' is not an opening symbol.",
    notClose: "'a' is neither an opening nor a closing symbol, so it is ignored.",
    inc:      'ix advances to 3.',
  });
  yield* charClosePop(3, {
    loop:     'ix is 3, less than 4, and error is NONE.',
    notOpen:  "')' is not an opening symbol.",
    isClose:  "')' is a closing symbol.",
    notEmpty: 'stack_ix is 1, not -1, so the stack is not empty. This test is isEmpty.',
    pop:      "The stack is not empty, so pop it. popped holds '(' — the opening symbol this ')' should close.",
    matches:  "'(' and ')' are the same type. No error — this closing symbol is correct.",
    inc:      'ix advances to 4.',
  }, false);

  // Loop exit — the payoff. The test fails because ix ran out, NOT an error.
  yield snap({ line: 14, tag: 'test',
    narrate: 'The loop ends because we ran out of characters. error is still NONE — the scanner found nothing wrong.',
    note: SCAN3_ENDLOOP_NOTE, frames: scanFrames() });
  yield snap({ line: 28, tag: 'test',
    narrate: 'error is NONE, and stack_ix is 0, which is greater than -1 — so this test is true.',
    frames: scanFrames() });
  error = 'TOO_MANY_LEFT';
  yield snap({ line: 29, tag: 'error',
    narrate: 'There is still an opening symbol on the stack. Nothing ever closed it.',
    note: PAYOFF_NOTE, hot: 'error', frames: scanFrames() });
  stream.push('too many left parentheses');
  yield snap({ line: 30, tag: 'report',
    narrate: 'report prints the error that was recorded after the loop.',
    note: CHALLENGE_NOTE, streamNew: true, frames: scanFrames() });
}

export default {
  title: 'Checking parentheses with a stack',
  subtitle: 'A scanner that reads left to right',
  profile: 'standard',
  columns: 2,
  languages: ['pseudo', 'java', 'cpp'],

  // Left column: the code listing, spanning every row. Right column: five
  // stacked panels (expr, stack, state, Function calls, output). Every panel's
  // height is reserved by the engine to its per-run maximum (reserveHeights) --
  // the output stream to 3 lines, the state strip to its widest error name -- so
  // no panel changes height and nothing below shifts as steps advance. The STACK
  // row is PINNED (190px) so all four cells AND the parked -1 sentinel below cell
  // [0] are always visible: an `auto` row shrinks below its content when the
  // stage is tight, and clipping the sentinel would hide a core teaching point.
  // The other rows are `auto`: at the 1920x1080 design target all five panels fit
  // fully; on a short viewport the accumulating panels (Function calls, output)
  // yield first while the pinned stack and the pinned-height note stay visible,
  // with the open-in-own-window link as the escape hatch.
  stageRows: 'auto 190px auto auto auto',

  panels: [
    { type: 'code',      id: 'code',      title: 'checking parentheses', tall: true,
      listings: LISTINGS, labels: { pseudo: 'pseudocode', java: 'Java', cpp: 'C++' } },
    { type: 'cells',     id: 'expr',      title: 'the expression' },
    { type: 'cells',     id: 'stack',     title: 'the stack' },
    { type: 'cells',     id: 'state',     title: 'what we store', compact: true },
    { type: 'callstack', id: 'callstack', title: 'Function calls' },
    { type: 'stream',    id: 'out',       title: 'output', compact: true },
  ],

  initialTrace: 'run',
  traces: {
    run: trace,
  },
};
