/* ds — A3 "Checking parentheses with a stack"
 *
 * A parenthesis scanner, built on a stack, in one continuous trace driven by
 * main() over three short expressions -- each isolating one error:
 *
 *   scan("a)(b")  -> TOO_MANY_RIGHT  (a stray ')' while the stack is empty)
 *   scan("[a)")   -> MISMATCH        (popped '[' is not the type ')' closes)
 *   scan("((a)")  -> TOO_MANY_LEFT   (a '(' left on the stack when the loop ends)
 *
 * The lesson is error DETECTION, not evaluation. The payoff is the third scan:
 * the loop ends with error still NONE, and the error is found only by looking at
 * the stack AFTER the loop -- the one error no in-loop event can catch.
 *
 * The stack starts EMPTY: step 0 is four empty cells, stack_ix at -1 with its
 * marker parked below cell [0]. push and pop are STEPPED INTO everywhere (never
 * summarized) -- every call shows its body (the call line, then lines 2-3 for
 * push or 6-7 for pop), with a push/pop frame on Function calls and BOTH callers
 * (main and scan) dimmed while it runs. Five stepped-into calls in all.
 *
 * The NEW capability this animation introduced is the vertical CELLS `column`
 * (the stack): cell [0] at the bottom, growing upward, index labels [0]..[3] in a
 * fixed band on the RIGHT, and the stack_ix marker on the LEFT (caret ▶), parking
 * BELOW cell [0] at the -1 sentinel. The expression and the stack are the two
 * structure panels; the engine places them side by side (structure region).
 *
 * A stale cell is HEALTHY: after scan 2 pops the '[', it stays greyed in the
 * array until scan 3 writes over it. Nothing corrupts memory; every error is a
 * syntax error in the student's input. NO memory-danger marker anywhere. WATCH
 * only: one trace, no gates; the insight is all narration and notes.
 *
 * matches() is NEVER stepped into -- its result is narrated. Line 13's three
 * initialisations run as ONE step. Lines 16 and 21 are isFull and isEmpty,
 * inlined; the narration names them as such (the lecture's vocabulary). Only two
 * symbol types, ( ) and [ ]; the { } case and the TOO_DEEP error are left to the
 * post-watch challenge. */

const MAX = 4;

/* One listing, three ds languages, line-aligned to a single 35-line grid, so
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
    '        if expr[ix] is one of  (  [',           // 15
    '            if stack_ix = MAX - 1',             // 16
    '                error = TOO_DEEP',              // 17
    '            else',                              // 18
    '                push(expr[ix])',                // 19
    '        else if expr[ix] is one of  )  ]',      // 20
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
    '    scan("a)(b")',                              // 33
    '    scan("[a)")',                               // 34
    '    scan("((a)")',                              // 35
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
    '        if ("([".indexOf(expr.charAt(ix)) >= 0) {',  // 15
    '            if (stack_ix == MAX - 1)',          // 16
    '                error = TOO_DEEP;',             // 17
    '            else',                              // 18
    '                push(expr.charAt(ix));',        // 19
    '        } else if (")]".indexOf(expr.charAt(ix)) >= 0) {', // 20
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
    '    scan("a)(b");',                             // 33
    '    scan("[a)");',                              // 34
    '    scan("((a)"); }',                           // 35
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
    '        if (strchr("([", expr[ix])) {',         // 15
    '            if (stack_ix == MAX - 1)',          // 16
    '                error = TOO_DEEP;',             // 17
    '            else',                              // 18
    '                push(expr[ix]);',               // 19
    '        } else if (strchr(")]", expr[ix])) {',  // 20
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
    '    scan("a)(b");',                             // 33
    '    scan("[a)");',                              // 34
    '    scan("((a)"); }',                           // 35
  ],
};

/* ---- call-frame builders. `call` is a parked caller line, dimmed while a
 * callee runs. push and pop are stepped into inside scan, so their frame sits on
 * top of main -> scan, and BOTH callers dim: main at its scan(...) line, scan at
 * its push/pop line (19 or 24). ---- */
const mainF = call        => ({ fn: 'main',  vars: [],                          call });
const scanF = (expr, call) => ({ fn: 'scan',  vars: [{ name: 'expr', value: `"${expr}"` }], call });
const pushF = c           => ({ fn: 'push',  vars: [{ name: 'c', value: `'${c}'` }] });
const popF  = ()          => ({ fn: 'pop',   vars: [] });

/* ---- teaching notes ---- */
const SETUP_NOTE =
  'A stack is a pile: you can only take the top item off, and you can only add to the top. That is what ' +
  'LIFO means — last in, first out. stack_ix holds the index of the top element; -1 means the stack is ' +
  'empty. MAX is 4, so it can hold at most four symbols.';

const HOOK_NOTE =
  'Count the parentheses in a)(b: one left, one right. Balanced. A program that just counted them would ' +
  'accept this expression, and it is plainly wrong. The stack rejected it at the second character, ' +
  "because a stack asks a harder question than 'how many?' — it asks 'is there something open for this " +
  "to close?'";

const POP_NOTE =
  "Popping did not remove anything. stack_ix moved down, and the '[' stopped being part of the stack. " +
  'The character is still sitting in the array — the greying is ours, for reading the picture. The ' +
  'program has only the array and stack_ix.';

const SILENT_NOTE =
  'Nothing was printed while the loop ran. The error was recorded in a variable and reported here, after ' +
  "the loop — silent error reporting. The scanner's job is to scan; reporting is somebody else's job.";

const MISMATCH_NOTE =
  'This is why the pop has to store what it removed. Counting symbols, or even matching them by position, ' +
  'is not enough — you have to compare the type of the closing symbol against the type of the opening ' +
  'symbol it is closing. ([...]) and [(...)] are fine; [...) is not. You cannot mix and match.';

const SCAN3_ENDLOOP_NOTE =
  'The scanner is finished and it reported no error. Look at the stack before clicking on.';

const PAYOFF_NOTE =
  'Three kinds of parenthesis error, and only two of them can be caught inside the loop. A stray closing ' +
  'symbol is caught the moment it appears, because the stack is empty. A mismatched type is caught the ' +
  'moment it is popped. But an opening symbol that is never closed produces no event at all — the loop ' +
  'just ends, normally, with error still NONE. The only way to catch it is to look at the stack after the ' +
  'loop has finished. A non-empty stack at the end means something was opened and never closed.';

const CHALLENGE_NOTE =
  'This scanner handles ( ) and [ ]. Your assignment also allows { }. What changes in the code — and what ' +
  'does NOT change? Also: one error never fired in any of these three scans. MAX is 4 here, so this stack ' +
  'holds at most four unclosed symbols. What is the shortest expression that would trigger TOO_DEEP on ' +
  'line 17?';

function* trace() {
  const stack = [null, null, null, null];   // the stack storage; starts empty
  let stackIx = -1;                          // top of stack; -1 means empty
  let exprChars = [null, null, null, null];
  let ix = -1;                               // scan's cursor; -1 = no scan (parked)
  let popped = null;                         // last value pop() removed
  let error = 'NONE';
  const stream = [];
  let curExpr = '';                          // the expression scan() is running now
  let curMLine = 0;                          // main's call line for the running scan

  /* The expression as a marked CELLS row: one character per cell, [0]..[3] labels
   * beneath, the ix marker (parked left of [0] when there is no scan). The panel
   * title names it, so the row carries no separate label. The character under
   * examination this step is `compared`. */
  const exprPanel = compared => ({
    render: 'box',
    cells: exprChars.map((v, i) => {
      if (v == null)      return { value: '', role: 'empty' };
      if (i === compared) return { value: v, role: 'compared' };
      return { value: v };
    }),
    markers: [{ label: 'ix', index: ix }],
  });

  /* The stack as the vertical column: cell [0] at the bottom, growing up. A cell
   * above stack_ix that still holds a character is `stale` (greyed); a cell
   * written THIS step is `active` (blue). The stack_ix marker sits on the left and
   * parks below cell [0] at the -1 sentinel. */
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

  /* The compact Variables strip: ix, stack_ix, popped, error. `hot` gives the
   * changing box the blue fill. stack_ix always shows its real value (the -1
   * sentinel included); ix and popped show the placeholder before they hold a
   * meaningful value. The error box reserves the width of the longest name
   * (TOO_MANY_RIGHT) so the strip never resizes. */
  const varsPanel = hot => ({
    render: 'box',
    cells: [
      { label: 'ix',       value: ix < 0 ? '' : ix,             role: ix < 0 ? 'empty' : (hot === 'ix' ? 'active' : undefined) },
      { label: 'stack_ix', value: stackIx,                      role: hot === 'stack_ix' ? 'active' : undefined },
      { label: 'popped',   value: popped == null ? '' : popped, role: popped == null ? 'empty' : (hot === 'popped' ? 'active' : undefined) },
      { label: 'error',    value: error, minCh: 16,             role: hot === 'error' ? 'active' : undefined },
    ],
  });

  const snap = ({ line, tag, narrate, note, frames, compared = null, active = null, hot = null, streamNew = false }) => ({
    line, tag, narrate, note,
    parked: frames.slice(0, -1).map(f => f.call).filter(v => v != null),
    panels: {
      expr:      exprPanel(compared),
      stack:     stackPanel(active),
      vars:      varsPanel(hot),
      callstack: { frames: frames.map((f, i) => ({ fn: f.fn, vars: f.vars, active: i === frames.length - 1 })) },
      out:       { lines: stream.map((t, i) => ({ text: t, dir: 'out', isNew: streamNew && i === stream.length - 1 })) },
    },
  });

  // Frames while scan's OWN body runs (scan active, main's call line dimmed).
  const scanFrames = () => [mainF(curMLine), scanF(curExpr)];
  // Frames while push/pop runs (that frame active; main AND scan both dimmed).
  const pushFrames = (ch) => [mainF(curMLine), scanF(curExpr, 19), pushF(ch)];
  const popFrames  = ()   => [mainF(curMLine), scanF(curExpr, 24), popF()];

  /* ---- stepped-into push and pop (shown in full, every time) ---- */

  // push(expr[ix]) -- the call line 19, then the body lines 2 and 3.
  function* doPush(p, ch, n) {
    yield snap({ line: 19, tag: 'call', narrate: n.call, compared: p, frames: scanFrames() });
    stackIx += 1;
    yield snap({ line: 2, tag: 'assign', narrate: n.raise, hot: 'stack_ix', frames: pushFrames(ch) });
    stack[stackIx] = ch;
    yield snap({ line: 3, tag: 'store', narrate: n.write, active: stackIx, frames: pushFrames(ch) });
  }

  // pop() -- the call line 24, then the body lines 6 and 7.
  function* doPop(p, n) {
    yield snap({ line: 24, tag: 'call', narrate: n.call, compared: p, frames: scanFrames() });
    popped = stack[stackIx];
    yield snap({ line: 6, tag: 'assign', narrate: n.read, hot: 'popped', frames: popFrames() });
    stackIx -= 1;                                            // the popped cell becomes stale
    yield snap({ line: 7, tag: 'assign', narrate: n.drop, note: n.dropNote, hot: 'stack_ix', frames: popFrames() });
  }

  /* ---- character patterns ---- */

  // Opening symbol with room: 14 / 15(true) / 16(false) / 19,2,3 (push) / 27.
  function* charOpen(p, ch, n) {
    yield snap({ line: 14, tag: 'test', narrate: n.loop, frames: scanFrames() });
    yield snap({ line: 15, tag: 'test', narrate: n.isOpen, compared: p, frames: scanFrames() });
    yield snap({ line: 16, tag: 'test', narrate: n.isFull, compared: p, frames: scanFrames() });
    yield* doPush(p, ch, n);
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
  // 24,6,7 (pop) / 25 / [26 if mismatch] / 27.
  function* charClosePop(p, n, mismatch) {
    yield snap({ line: 14, tag: 'test', narrate: n.loop, frames: scanFrames() });
    yield snap({ line: 15, tag: 'test', narrate: n.notOpen, compared: p, frames: scanFrames() });
    yield snap({ line: 20, tag: 'test', narrate: n.isClose, compared: p, frames: scanFrames() });
    yield snap({ line: 21, tag: 'test', narrate: n.notEmpty, compared: p, frames: scanFrames() });
    yield* doPop(p, n);
    yield snap({ line: 25, tag: 'test', narrate: n.matches, compared: p, frames: scanFrames() });
    if (mismatch) {
      error = 'MISMATCH';
      yield snap({ line: 26, tag: 'error', narrate: n.setErr, note: n.errNote, compared: p, hot: 'error', frames: scanFrames() });
    }
    ix = p + 1;
    yield snap({ line: 27, tag: 'inc', narrate: n.inc, hot: 'ix', frames: scanFrames() });
  }

  // scan() call: a fresh scan, so expr blanks, ix parks, error resets. The frame
  // is not pushed yet (main only), and stack_ix keeps whatever the last scan left.
  function* scanCall(mLine, expr) {
    curMLine = mLine; curExpr = expr;
    exprChars = [null, null, null, null]; ix = -1; error = 'NONE';
    yield snap({ line: mLine, tag: 'call', narrate: `main calls scan with the expression "${expr}".`, frames: [mainF()] });
  }

  // scan() line 13: the three initialisations as ONE step. expr loads, ix -> 0,
  // stack_ix -> -1 (the marker parks below cell [0]).
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

  /* ================= STEP 0 — the empty stack, nothing executed ========= */
  yield snap({
    line: null, tag: 'init',
    narrate: 'An empty stack. stack_ix is -1 — it points at nothing yet — so the stack holds no symbols.',
    note: SETUP_NOTE,
    frames: [mainF()],
  });

  /* ================= SCAN 1 — scan("a)(b")  ->  TOO_MANY_RIGHT ========== */
  yield* scanCall(33, 'a)(b');
  yield* scanInit(
    'ix starts at the first character, stack_ix is -1 — the stack is empty — and error is set to NONE.');
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

  /* ================= SCAN 2 — scan("[a)")  ->  MISMATCH ================= */
  yield* scanCall(34, '[a)');
  yield* scanInit(
    'The next expression loads: [ a ) fills cells 0 to 2, and cell 3 stays empty. ix is 0, stack_ix is -1, error is NONE.');
  yield* charOpen(0, '[', {
    loop:   'ix is 0, less than 3, and error is NONE, so the scan begins.',
    isOpen: "'[' is an opening symbol.",
    isFull: 'stack_ix is -1, not 3, so the stack is not full. This test is isFull.',
    call:   "'[' is an opening symbol, so scan calls push to put it on the stack.",
    raise:  'stack_ix rises from -1 to 0 — that is where the new symbol goes.',
    write:  "'[' is written into cell 0. It is on the stack now.",
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
    call:     'The stack is not empty, so scan calls pop.',
    read:     "popped takes the top symbol, '[' — the symbol this ')' is supposed to be closing.",
    drop:     "stack_ix drops back to -1. The '[' is no longer on the stack.",
    dropNote: POP_NOTE,
    matches:  "'[' and ')' are not the same type.",
    setErr:   'error is set to MISMATCH.',
    errNote:  MISMATCH_NOTE,
    inc:      'ix advances to 3.',
  }, true);
  yield* exitWithError('mismatched parentheses');

  /* ================= SCAN 3 — scan("((a)")  ->  TOO_MANY_LEFT (payoff) == */
  yield* scanCall(35, '((a)');
  yield* scanInit(
    'The last expression loads: ( ( a ) fills all four cells. ix is 0, stack_ix is -1, error is NONE.');
  yield* charOpen(0, '(', {
    loop:   'ix is 0, less than 4, and error is NONE.',
    isOpen: "'(' is an opening symbol.",
    isFull: 'stack_ix is -1, not 3, so the stack is not full. This test is isFull.',
    call:   "'(' is an opening symbol, so scan calls push.",
    raise:  'stack_ix rises from -1 to 0.',
    write:  "'(' is written into cell 0, over the '[' that scan 2 left behind.",
    inc:    'ix advances to 1.',
  });
  yield* charOpen(1, '(', {
    loop:   'ix is 1, less than 4, and error is NONE.',
    isOpen: "'(' is an opening symbol.",
    isFull: 'stack_ix is 0, not 3, so the stack is not full.',
    call:   'A second opening symbol, so scan calls push again.',
    raise:  'stack_ix rises from 0 to 1.',
    write:  "'(' is written into cell 1. Two opening symbols are on the stack now.",
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
    call:     'The stack is not empty, so scan calls pop.',
    read:     "popped takes the top symbol, '(' — the opening symbol this ')' should close.",
    drop:     "stack_ix drops from 1 to 0. One opening symbol is still on the stack.",
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

  // Placement is derived by the engine from each panel's kind (AUTHORING.md
  // "Panels flow across both columns"): the code listing anchors the left column
  // at its 15-line floor; the two structure panels -- the expression and the
  // stack -- sit side by side in the capped region at the top of the right
  // column; and the bookkeeping panels (Variables, Function calls, output) flow
  // down, the balancing overflow continuing beneath the code. Everything resolves
  // once on load and holds, so nothing moves as steps advance.
  panels: [
    { type: 'code',      id: 'code',      title: 'checking parentheses',
      listings: LISTINGS, labels: { pseudo: 'pseudocode', java: 'Java', cpp: 'C++' } },
    { type: 'cells',     id: 'expr',      title: 'the expression', structure: true },
    { type: 'cells',     id: 'stack',     title: 'the stack',      structure: true },
    { type: 'cells',     id: 'vars',      title: 'Variables', compact: true },
    { type: 'callstack', id: 'callstack', title: 'Function calls' },
    { type: 'stream',    id: 'out',       title: 'output', compact: true },
  ],

  initialTrace: 'run',
  traces: {
    run: trace,
  },
};
