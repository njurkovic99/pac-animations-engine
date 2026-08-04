/* ds — A4 "Evaluating a postfix expression" (the lecture's "Stack application 2")
 *
 * One continuous trace over eval("12+34-*"): push values; on an operator, pop two,
 * compute, push the result; one value remains at the end. The whole animation is
 * built around a single spine — POP RETURNS THE OPERANDS IN REVERSE. The first pop
 * gives the SECOND operand.
 *
 *   at '+':  1 + 2 and 2 + 1 are both 3, so getting the order backwards is invisible.
 *   at '-':  3 - 4 = -1, but 4 - 3 = 1 — the same mistake now gives the wrong sign
 *            and no error message anywhere. The first operator conceals the bug; the
 *            second reveals it. Confusion-first, WATCH-only: no second trace, no
 *            buggy branch — the correct execution is narrated so the mistake cannot
 *            hide.
 *
 * THIS ANIMATION ADDS NO NEW ENGINE CAPABILITY. It inherits the vertical stack
 * `column`, the marked expression `box`, the compact Variables strip, the code
 * panel, and the stream — all shipped for A3 (stacks-paren-scanner). The only
 * differences are content: the stack holds NUMBERS (one of them negative, -1 and
 * -3, from the '-' onward), and push/pop are NEVER STEPPED INTO — A3 taught those
 * bodies, A4 uses them. Lines 1-8 (push and pop) never highlight; a call line is
 * ONE atomic step and the stack updates on it. Lines 16 and 17 are b-then-a on
 * purpose: that reversed order IS the lesson, so the listing must read that way.
 *
 * No CALLSTACK panel — nothing is stepped into, so there is nothing to show a frame
 * for. Five panels: expr, stack, vars, code, out. No memory-danger marker anywhere;
 * every value on screen is a healthy stored number or a healthy stale cell.
 * Infix-to-postfix CONVERSION is not animated (the lecture makes it extra credit);
 * it appears only in the post-watch challenge. */

const MAX = 4;

/* The expression, one character per cell, indices 0..6. Shown in full from step 0;
 * only the ix marker moves. */
const EXPR = ['1', '2', '+', '3', '4', '-', '*'];

/* One listing, three ds languages, line-aligned to a single 26-line grid, so `line`
 * is a plain number that resolves the same in every language. push and pop are shown
 * (so the student can see pop reads THEN decrements) but never stepped into. */
const LISTINGS = {
  pseudo: [
    'push(v)',                                //  1
    '    stack_ix = stack_ix + 1',            //  2
    '    stack[stack_ix] = v',                //  3
    '',                                       //  4
    'pop()',                                  //  5
    '    popped = stack[stack_ix]',           //  6
    '    stack_ix = stack_ix - 1',            //  7
    '    return popped',                      //  8
    '',                                       //  9
    'eval(expr)',                             // 10
    '    ix = 0,  stack_ix = -1',             // 11
    '    while ix < length(expr)',            // 12
    '        if expr[ix] is a digit',         // 13
    "            push(expr[ix] - '0')",       // 14
    '        else',                           // 15
    '            b = pop()',                  // 16
    '            a = pop()',                  // 17
    '            switch expr[ix]',            // 18
    "                case '+':  push(a + b)",  // 19
    "                case '-':  push(a - b)",  // 20
    "                case '*':  push(a * b)",  // 21
    '        ix = ix + 1',                     // 22
    '    print pop()',                         // 23
    '',                                        // 24
    'main()',                                  // 25
    '    eval("12+34-*")',                     // 26
  ],
  java: [
    'void push(int v) {',                                  //  1
    '    stack_ix = stack_ix + 1;',                        //  2
    '    stack[stack_ix] = v; }',                          //  3
    '',                                                    //  4
    'int pop() {',                                         //  5
    '    popped = stack[stack_ix];',                       //  6
    '    stack_ix = stack_ix - 1;',                        //  7
    '    return popped; }',                                //  8
    '',                                                    //  9
    'void eval(String expr) {',                            // 10
    '    ix = 0;  stack_ix = -1;',                         // 11
    '    while (ix < expr.length()) {',                    // 12
    '        if (Character.isDigit(expr.charAt(ix)))',     // 13
    "            push(expr.charAt(ix) - '0');",            // 14
    '        else {',                                      // 15
    '            b = pop();',                              // 16
    '            a = pop();',                              // 17
    '            switch (expr.charAt(ix)) {',              // 18
    "                case '+':  push(a + b);  break;",     // 19
    "                case '-':  push(a - b);  break;",     // 20
    "                case '*':  push(a * b);  break; } }", // 21
    '        ix = ix + 1; }',                              // 22
    '    print(pop()); }',                                 // 23
    '',                                                    // 24
    'void main() {',                                       // 25
    '    eval("12+34-*"); }',                              // 26
  ],
  cpp: [
    'void push(int v) {',                                  //  1
    '    stack_ix = stack_ix + 1;',                        //  2
    '    stack[stack_ix] = v; }',                          //  3
    '',                                                    //  4
    'int pop() {',                                         //  5
    '    popped = stack[stack_ix];',                       //  6
    '    stack_ix = stack_ix - 1;',                        //  7
    '    return popped; }',                                //  8
    '',                                                    //  9
    'void eval(string expr) {',                            // 10
    '    ix = 0;  stack_ix = -1;',                         // 11
    '    while (ix < expr.length()) {',                    // 12
    '        if (isdigit(expr[ix]))',                      // 13
    "            push(expr[ix] - '0');",                   // 14
    '        else {',                                      // 15
    '            b = pop();',                              // 16
    '            a = pop();',                              // 17
    '            switch (expr[ix]) {',                     // 18
    "                case '+':  push(a + b);  break;",     // 19
    "                case '-':  push(a - b);  break;",     // 20
    "                case '*':  push(a * b);  break; } }", // 21
    '        ix = ix + 1; }',                              // 22
    '    cout << pop(); }',                                // 23
    '',                                                    // 24
    'int main() {',                                        // 25
    '    eval("12+34-*"); }',                              // 26
  ],
};

/* ---- teaching notes ---- */
const SETUP_NOTE =
  'In postfix notation the operation is written after the values it applies to: a+b becomes ab+. It needs ' +
  'no parentheses — the position of each operator says what it applies to. This one is (1+2)*(3-4) written ' +
  'without them.';

const FIRST_DIGIT_NOTE =
  "You are reading characters, not numbers. '1' + '2' does not give you 3 — it is either undefined or it " +
  'glues the characters together. Convert to the numeric value first, then do arithmetic. Watch the offsets.';

const PLUS_NOTE =
  'Look closely at which value went into which variable. 2 came off first, but 2 is the second operand — 1 ' +
  'was pushed first, so it is deeper in the stack. Right now it does not matter: 1 + 2 and 2 + 1 are both ' +
  '3. Addition cannot tell you whether you got the order right. Keep watching.';

const MINUS_NOTE =
  'This is where the order bites. The expression is 34-, meaning 3 - 4 = -1. But the stack handed back 4 ' +
  'first. Compute in the order the values arrive and you get 4 - 3 = 1 — the right magnitude, the wrong ' +
  'sign, and no error message anywhere. The first pop is always the SECOND operand. Addition and ' +
  'multiplication will never catch this mistake for you; subtraction and division will, every time.';

const STAR_NOTE =
  'The values being combined here are not characters from the expression — they are results of earlier ' +
  'operations. That is what makes the stack the right structure: each result is waiting exactly where the ' +
  'next operator needs it.';

const CHALLENGE_NOTE =
  'Check it against the infix form: (1+2)*(3-4) = 3 * -1 = -3. Two things this version cannot do. It ' +
  'assumes every number is a single digit — what would you need to add to evaluate 12+7*, where 12 is one ' +
  'number? And it evaluates postfix but does not produce it: converting a+(b-c) into abc-+ is a separate ' +
  'algorithm, and also uses a stack.';

function* trace() {
  const stack = [null, null, null, null];   // the stack storage; starts empty
  let stackIx = -1;                          // top of stack; -1 means empty
  let ix = -1;                               // eval's cursor; -1 = not started (parked)
  let a = null, b = null;                    // the two operands pop() hands back
  const stream = [];

  /* The expression as a marked CELLS row: one character per cell, [0]..[6] labels
   * beneath, the ix marker (parked left of [0] before the loop starts). Every
   * character is present from step 0 — only the marker moves. The character under
   * examination this step is `compared`. */
  const exprPanel = compared => ({
    render: 'box',
    cells: EXPR.map((v, i) => (i === compared ? { value: v, role: 'compared' } : { value: v })),
    markers: [{ label: 'ix', index: ix }],
  });

  /* The stack as the vertical column: cell [0] at the bottom, growing up. A cell
   * written THIS step is `active` (blue); a cell above stack_ix that still holds a
   * value is `stale` (greyed — popped, but never blanked). The stack_ix marker sits
   * on the left and parks below cell [0] at the -1 sentinel. */
  const stackPanel = active => ({
    render: 'column',
    cells: stack.map((v, i) => {
      if (v == null)    return { value: '', role: 'empty' };
      if (i === active) return { value: v, role: 'active' };
      if (i > stackIx)  return { value: v, role: 'stale' };
      return { value: v };                                  // member
    }),
    markers: [{ label: 'stack_ix', index: stackIx }],
  });

  /* The compact Variables strip: ix, stack_ix, a, b. `hot` gives the changing box
   * the blue fill. stack_ix always shows its real value (the -1 sentinel included);
   * ix, a, and b show the placeholder before they hold a meaningful value. */
  const varsPanel = hot => ({
    render: 'box',
    cells: [
      { label: 'ix',       value: ix < 0 ? '' : ix,      role: ix < 0 ? 'empty' : (hot === 'ix' ? 'active' : undefined) },
      { label: 'stack_ix', value: stackIx,               role: hot === 'stack_ix' ? 'active' : undefined },
      { label: 'a',        value: a == null ? '' : a,    role: a == null ? 'empty' : (hot === 'a' ? 'active' : undefined) },
      { label: 'b',        value: b == null ? '' : b,    role: b == null ? 'empty' : (hot === 'b' ? 'active' : undefined) },
    ],
  });

  const snap = ({ line, tag, narrate, note, compared = null, active = null, hot = null, streamNew = false }) => ({
    line, tag, narrate, note,
    panels: {
      expr:  exprPanel(compared),
      stack: stackPanel(active),
      vars:  varsPanel(hot),
      out:   { lines: stream.map((t, i) => ({ text: t, dir: 'out', isNew: streamNew && i === stream.length - 1 })) },
    },
  });

  /* ---- character patterns. push and pop are ATOMIC: the call line is one step and
   * the stack updates on it; lines 1-8 never highlight. ---- */

  // Digit: 12 / 13(true) / 14 (push) / 22.
  function* doDigit(p, ch, n) {
    yield snap({ line: 12, tag: 'test', narrate: n.loop });
    yield snap({ line: 13, tag: 'test', narrate: n.isDigit, compared: p });
    stackIx += 1; stack[stackIx] = +ch;                     // push(expr[ix] - '0')
    yield snap({ line: 14, tag: 'push', narrate: n.push, note: n.pushNote, compared: p, active: stackIx, hot: 'stack_ix' });
    ix = p + 1;
    yield snap({ line: 22, tag: 'inc', narrate: n.inc, hot: 'ix' });
  }

  // Operator: 12 / 13(false) / 16 (b=pop) / 17 (a=pop) / 18 (switch) / 19|20|21 (push) / 22.
  function* doOp(p, ch, opLine, compute, n) {
    yield snap({ line: 12, tag: 'test', narrate: n.loop });
    yield snap({ line: 13, tag: 'test', narrate: n.notDigit, compared: p });
    b = stack[stackIx]; stackIx -= 1;                       // b = pop() — the top
    yield snap({ line: 16, tag: 'pop', narrate: n.popB, compared: p, hot: 'b' });
    a = stack[stackIx]; stackIx -= 1;                       // a = pop() — the next one down
    yield snap({ line: 17, tag: 'pop', narrate: n.popA, compared: p, hot: 'a' });
    yield snap({ line: 18, tag: 'test', narrate: n.sw, compared: p });
    stackIx += 1; stack[stackIx] = compute(a, b);           // push(a OP b)
    yield snap({ line: opLine, tag: 'push', narrate: n.push, note: n.pushNote, compared: p, active: stackIx, hot: 'stack_ix' });
    ix = p + 1;
    yield snap({ line: 22, tag: 'inc', narrate: n.inc, hot: 'ix' });
  }

  /* ================= STEP 0 — the empty stack, nothing executed ========= */
  yield snap({
    line: null, tag: 'init',
    narrate: 'A postfix expression. The operators come after their operands.',
    note: SETUP_NOTE,
  });

  /* ================= INIT (line 11) ==================================== */
  ix = 0; stackIx = -1;
  yield snap({ line: 11, tag: 'init',
    narrate: 'ix starts at the first character and stack_ix is -1 — the stack is empty.',
    hot: 'ix' });

  /* ================= '1' — first digit, conversion narrated ============= */
  yield* doDigit(0, '1', {
    loop:     'ix is 0, which is less than 7, so there is another character to read.',
    isDigit:  "expr[0] is '1', which is a digit.",
    push:     "The character '1' is not the number 1. Subtracting the character '0' converts it: '1' - '0' is 1. That value goes on the stack.",
    pushNote: FIRST_DIGIT_NOTE,
    inc:      'ix advances to 1, the next character.',
  });

  /* ================= '2' — second digit ================================ */
  yield* doDigit(1, '2', {
    loop:    'ix is 1, still less than 7, so there is another character.',
    isDigit: "expr[1] is '2', a digit.",
    push:    "'2' - '0' is 2. It goes on the stack, on top of the 1.",
    inc:     'ix advances to 2.',
  });

  /* ================= '+' — the order is introduced, and does not matter yet */
  yield* doOp(2, '+', 19, (x, y) => x + y, {
    loop:     'ix is 2, less than 7.',
    notDigit: "expr[2] is '+', which is not a digit.",
    popB:     'b takes the top of the stack: 2.',
    popA:     'a takes the next one down: 1. The FIRST pop gave the SECOND operand — the stack hands them back in reverse.',
    sw:       "The operator is '+', so the '+' case runs.",
    push:     'a + b is 1 + 2, which is 3. The result goes back on the stack.',
    pushNote: PLUS_NOTE,
    inc:      'ix advances to 3.',
  });

  /* ================= '3' — digit ======================================= */
  yield* doDigit(3, '3', {
    loop:    'ix is 3, less than 7.',
    isDigit: "expr[3] is '3', a digit.",
    push:    "'3' - '0' is 3. It goes on the stack, above the 3 the last result left there.",
    inc:     'ix advances to 4.',
  });

  /* ================= '4' — digit ======================================= */
  yield* doDigit(4, '4', {
    loop:    'ix is 4, less than 7.',
    isDigit: "expr[4] is '4', a digit.",
    push:    "'4' - '0' is 4. It goes on the stack. The stack now holds 3, 3, 4.",
    inc:     'ix advances to 5.',
  });

  /* ================= '-' — the order NOW matters. The payoff. ========== */
  yield* doOp(5, '-', 20, (x, y) => x - y, {
    loop:     'ix is 5, less than 7.',
    notDigit: "expr[5] is '-', not a digit.",
    popB:     'b takes the top: 4.',
    popA:     'a takes the next one down: 3.',
    sw:       "The operator is '-', so the '-' case runs.",
    push:     'a - b is 3 - 4, which is -1.',
    pushNote: MINUS_NOTE,
    inc:      'ix advances to 6.',
  });

  /* ================= '*' — combining earlier results =================== */
  yield* doOp(6, '*', 21, (x, y) => x * y, {
    loop:     'ix is 6, less than 7.',
    notDigit: "expr[6] is '*', not a digit.",
    popB:     'b takes the top: -1.',
    popA:     'a takes the next one down: 3.',
    sw:       "The operator is '*', so the '*' case runs.",
    push:     'a * b is 3 * -1, which is -3.',
    pushNote: STAR_NOTE,
    inc:      'ix advances to 7.',
  });

  /* ================= END — loop test fails, then print ================= */
  yield snap({ line: 12, tag: 'test',
    narrate: 'Every character has been read. One value is left on the stack.' });

  const result = stack[stackIx];                            // print pop()
  stream.push(String(result));
  stackIx -= 1;                                             // the stack empties; stack_ix parks at -1
  yield snap({ line: 23, tag: 'print',
    narrate: 'That last value is the answer: -3.',
    note: CHALLENGE_NOTE, hot: 'stack_ix', streamNew: true });
}

export default {
  title: 'Evaluating a postfix expression',
  subtitle: 'Push the values, apply the operators',
  profile: 'standard',
  columns: 2,
  languages: ['pseudo', 'java', 'cpp'],

  // Declared in reading order; the engine places them (AUTHORING.md "Panels flow
  // across both columns"). The two structure panels — the expression and the stack
  // — sit side by side in the capped region at the top of the right column; the code
  // listing anchors the left column; the Variables strip and the output flow down
  // and balance across the columns. Everything resolves once on load and holds, so
  // nothing moves as steps advance. No CALLSTACK panel — nothing is stepped into.
  panels: [
    { type: 'cells',  id: 'expr',  title: 'the expression', structure: true },
    { type: 'cells',  id: 'stack', title: 'the stack',      structure: true },
    { type: 'cells',  id: 'vars',  title: 'Variables', compact: true },
    { type: 'code',   id: 'code',  title: 'evaluating postfix',
      listings: LISTINGS, labels: { pseudo: 'pseudocode', java: 'Java', cpp: 'C++' } },
    { type: 'stream', id: 'out',   title: 'output', compact: true },
  ],

  initialTrace: 'run',
  traces: {
    run: trace,
  },
};
