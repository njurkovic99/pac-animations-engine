/* Shared Phase-2 animation — what a constructor is, and what writing one costs.
 *
 * THE LESSON, in three phases, each boundary a real executed line in main():
 *
 *   Phase 1 — the class has fields and a method but NO constructor. main creates
 *     a Rectangle anyway, and a constructor frame appears and returns. The point
 *     is not what the fields end up holding — it is that a FUNCTION RAN that you
 *     did not write and main did not call by name. The compiler supplied it.
 *
 *   Phase 2 — a Rectangle(double, double) is written. Creating with two arguments
 *     runs it, the frame shows the parameters bound, and the fields fill in. Then
 *     main tries the no-argument creation from phase 1 — and it NO LONGER COMPILES,
 *     because writing any constructor removes the free default one. That line is
 *     highlighted, no object is made, nothing changes. This is the payoff, and it
 *     sits on the real source line that fails — not a phantom step.
 *
 *   Phase 3 — a no-argument Rectangle() is written alongside the two-argument one.
 *     Now both creations work, and the CALLSTACK shows the argument list choosing
 *     which constructor runs: no arguments -> the no-arg constructor, two arguments
 *     -> the other. That is overloading.
 *
 * SHARED ACROSS cpp and java. A shared animation may only teach what is true in
 * EVERY language it serves, so it deliberately does NOT show phase 1's fields
 * taking a value: C++ leaves them indeterminate, Java's default constructor sets
 * 0.0, and that difference cannot be shown honestly in one build. The fields are
 * rendered UNSET (the single empty glyph) throughout phase 1, and the narration
 * says only that whatever they hold, you did not choose it. `?lang=` selects the
 * listing and never changes a single step's data.
 *
 * THREE panels (profile 'beginner' caps at 3):
 *   code  CODE — the class across its three versions and a main() that creates
 *         objects. C++ and Java are line-aligned to one grid, so `line` is a plain
 *         number; the per-course `?lang=` shows exactly one, with no tab bar.
 *   objs  "Objects" — each created object's length and width. Present but UNSET
 *         from the step the object is created, filling in only on the line that
 *         assigns them (an unset field is the empty glyph, never a value).
 *   calls "Function calls" — the CALLSTACK. A constructor frame appearing with its
 *         parameters bound is the whole lesson: a constructor is a function that
 *         runs by itself.
 */

/* One class, shown in three versions as it gains constructors, then a main() that
 * creates objects. C++ and Java are line-aligned to a single grid: every line
 * number means the same thing in both, so a step's `line` is a plain number. The
 * two listings differ only where the languages genuinely differ — the class-closing
 * brace (`};` vs `}`), main's signature, and object creation (`Rectangle r(3, 4)`
 * vs `new Rectangle(3, 4)`). The widest line is C++'s `area()` method (44 chars),
 * never a comment, so the code panel's width is set by real code (AUTHORING.md
 * "A comment must never be a listing's longest line"). */
const LISTINGS = {
  cpp: [
    '// Phase 1: no constructor',                       //  1
    'class Rectangle {',                                //  2
    '    double length, width;',                        //  3
    '    double area() { return length * width; }',     //  4
    '};',                                               //  5
    '',                                                 //  6
    'int main() {',                                     //  7
    '    Rectangle r;',                                 //  8
    '}',                                                //  9
    '',                                                 // 10
    '// Phase 2: add a constructor',                    // 11
    'class Rectangle {',                                // 12
    '    double length, width;',                        // 13
    '    Rectangle(double len, double wid) {',          // 14
    '        length = len;',                            // 15
    '        width = wid;',                             // 16
    '    }',                                            // 17
    '    double area() { return length * width; }',     // 18
    '};',                                               // 19
    '',                                                 // 20
    'int main() {',                                     // 21
    '    Rectangle r(3, 4);',                           // 22
    '    Rectangle s;',                                 // 23
    '}',                                                // 24
    '',                                                 // 25
    '// Phase 3: add a no-arg constructor',             // 26
    'class Rectangle {',                                // 27
    '    double length, width;',                        // 28
    '    Rectangle() {',                                // 29
    '        length = 1;',                              // 30
    '        width = 1;',                               // 31
    '    }',                                            // 32
    '    Rectangle(double len, double wid) {',          // 33
    '        length = len;',                            // 34
    '        width = wid;',                             // 35
    '    }',                                            // 36
    '    double area() { return length * width; }',     // 37
    '};',                                               // 38
    '',                                                 // 39
    'int main() {',                                     // 40
    '    Rectangle a;',                                 // 41
    '    Rectangle b(3, 4);',                           // 42
    '}',                                                // 43
  ],
  java: [
    '// Phase 1: no constructor',                       //  1
    'class Rectangle {',                                //  2
    '    double length, width;',                        //  3
    '    double area() { return length * width; }',     //  4
    '}',                                                //  5
    '',                                                 //  6
    'void main() {',                                    //  7
    '    Rectangle r = new Rectangle();',               //  8
    '}',                                                //  9
    '',                                                 // 10
    '// Phase 2: add a constructor',                    // 11
    'class Rectangle {',                                // 12
    '    double length, width;',                        // 13
    '    Rectangle(double len, double wid) {',          // 14
    '        length = len;',                            // 15
    '        width = wid;',                             // 16
    '    }',                                            // 17
    '    double area() { return length * width; }',     // 18
    '}',                                                // 19
    '',                                                 // 20
    'void main() {',                                    // 21
    '    Rectangle r = new Rectangle(3, 4);',           // 22
    '    Rectangle s = new Rectangle();',               // 23
    '}',                                                // 24
    '',                                                 // 25
    '// Phase 3: add a no-arg constructor',             // 26
    'class Rectangle {',                                // 27
    '    double length, width;',                        // 28
    '    Rectangle() {',                                // 29
    '        length = 1;',                              // 30
    '        width = 1;',                               // 31
    '    }',                                            // 32
    '    Rectangle(double len, double wid) {',          // 33
    '        length = len;',                            // 34
    '        width = wid;',                             // 35
    '    }',                                            // 36
    '    double area() { return length * width; }',     // 37
    '}',                                                // 38
    '',                                                 // 39
    'void main() {',                                    // 40
    '    Rectangle a = new Rectangle();',               // 41
    '    Rectangle b = new Rectangle(3, 4);',           // 42
    '}',                                                // 43
  ],
};

/* ---- teaching notes ---- */
const SETUP_NOTE =
  'A class describes what its objects have (fields) and what they can do (methods). This one has ' +
  'a length and a width and an area method — and no constructor. Watch what creating an object does anyway.';

const PHASE1_NOTE =
  'Something ran that you did not call. That is what makes a constructor different from every other ' +
  'function you have written: every other function runs because a line names it, but this one ran the ' +
  'instant the object was created. Whatever its fields hold right now, you did not choose it.';

const PHASE2_INTRO_NOTE =
  'A constructor is just a function that runs when an object is created. Give it parameters, and the ' +
  'arguments you pass become those parameters — which is how the object gets its starting values.';

const PHASE2_FAIL_NOTE =
  'Writing any constructor removes the free one. The moment Rectangle(double, double) was written, the ' +
  'no-argument creation that worked in phase 1 stopped compiling — there is no longer a constructor that ' +
  'takes no arguments. No object is made and nothing changes; the program simply will not build.';

const PHASE3_INTRO_NOTE =
  'Two constructors now share the name Rectangle, one taking no arguments and one taking two. The ' +
  'argument list you write decides which runs. That is overloading, and it is why both creations work again.';

const FINAL_NOTE =
  "A constructor's job is to leave the object in a usable state the moment it exists. A field nobody " +
  'passes in still needs a value — decide what it should be and set it in the constructor. That is exactly ' +
  'what the graded work needs, and none of it is done for you here.';

/* ---- panel builders ---- */

// One object field as a CELLS box: a labelled box (`r.length`) holding the value,
// or the empty glyph when the field is unset. `act` gives it the blue activity
// fill on the step it is written (AUTHORING.md "outline = membership, fill =
// activity"; an unset field is the `empty` role, drawn as the dashed X with no
// value in the slot).
const cell = (label, v, act) => v == null
  ? { label, value: '', role: 'empty' }
  : { label, value: v, role: act ? 'active' : undefined };

// The "Objects" panel: every object currently in scope, each contributing its two
// fields in order. An object descriptor is { name, length, width, hot } where a
// field is null (unset) or a number, and `hot` names the field written THIS step.
const objects = (list) => ({
  render: 'box',
  cells: list.flatMap(o => [
    cell(`${o.name}.length`, o.length, o.hot === 'length'),
    cell(`${o.name}.width`,  o.width,  o.hot === 'width'),
  ]),
});
const obj = (name, length, width, hot = null) => ({ name, length, width, hot });

// A call frame. `main()` is the driver at the bottom, carrying the line it is
// parked on while a constructor runs above it; a constructor frame shows its bound
// parameters (none for the no-arg constructor). A parameter takes the blue activity
// fill (`act`) on the step it is bound.
const mainF = (parked = null) => ({ fn: 'main', vars: [], call: parked });
const ctorF = (params = []) => ({ fn: 'Rectangle', vars: params, call: null });
const P = (name, value, act = false) => ({ name, value, role: act ? 'active' : undefined });

// A step snapshot. `parked` is the call line of every caller still suspended below
// the top frame (the code panel dims those lines); the top frame is the active one.
const snap = ({ line, tag, narrate, note, frames, objs }) => ({
  line, tag, narrate, note,
  parked: frames.slice(0, -1).map(f => f.call).filter(v => v != null),
  panels: {
    objs: objects(objs),
    calls: { frames: frames.map((f, i) => ({ fn: f.fn, vars: f.vars, active: i === frames.length - 1 })) },
  },
});

function* trace() {
  /* ===================== STEP 0 — before anything runs ===================== */
  yield snap({
    line: null, tag: 'init', frames: [mainF()], objs: [obj('r', null, null)],
    narrate: 'The starting point: a Rectangle class with fields length and width and an area method, ' +
             'and no constructor. Nothing has run yet.',
    note: SETUP_NOTE,
  });

  /* ========================= PHASE 1 — no constructor ====================== */
  yield snap({
    line: 8, tag: 'create', frames: [mainF()], objs: [obj('r', null, null)],
    narrate: 'main creates a Rectangle named r. No constructor is written in the class — watch anyway.',
  });
  yield snap({
    line: 8, tag: 'ctor', frames: [mainF(8), ctorF()], objs: [obj('r', null, null)],
    narrate: 'A constructor frame appears. A function ran — one you did not write, and one main did not ' +
             'name. The compiler supplied a default constructor and it ran by itself.',
    note: PHASE1_NOTE,
  });
  yield snap({
    line: 8, tag: 'return', frames: [mainF()], objs: [obj('r', null, null)],
    narrate: 'It returns at once. r exists, but its fields hold something you never chose — and choosing ' +
             "what a new object's fields hold is a constructor's job.",
  });

  /* ================ PHASE 2 — a constructor with parameters ================ */
  yield snap({
    line: 22, tag: 'create', frames: [mainF()], objs: [obj('r', null, null)],
    narrate: 'Now the class has a constructor that takes two arguments. main creates r with 3 and 4.',
    note: PHASE2_INTRO_NOTE,
  });
  yield snap({
    line: 14, tag: 'ctor', frames: [mainF(22), ctorF([P('len', 3, true), P('wid', 4, true)])],
    objs: [obj('r', null, null)],
    narrate: 'The constructor frame appears with len = 3 and wid = 4 already bound — the arguments you ' +
             'passed became its parameters. r exists now; its fields are not set yet.',
  });
  yield snap({
    line: 15, tag: 'set', frames: [mainF(22), ctorF([P('len', 3), P('wid', 4)])],
    objs: [obj('r', 3, null, 'length')],
    narrate: "length = len runs: r's length is now 3, the value that was passed in.",
  });
  yield snap({
    line: 16, tag: 'set', frames: [mainF(22), ctorF([P('len', 3), P('wid', 4)])],
    objs: [obj('r', 3, 4, 'width')],
    narrate: "width = wid runs: r's width is now 4.",
  });
  yield snap({
    line: 22, tag: 'return', frames: [mainF()], objs: [obj('r', 3, 4)],
    narrate: 'The constructor returns. r now exists in a usable state — length 3, width 4 — chosen by ' +
             'the values you passed.',
  });
  yield snap({
    line: 23, tag: 'fail', frames: [mainF()], objs: [obj('r', 3, 4)],
    narrate: 'main tries to create another Rectangle with no arguments, exactly as in phase 1. This ' +
             'line does not compile.',
    note: PHASE2_FAIL_NOTE,
  });

  /* ================= PHASE 3 — write your own no-arg one ==================== */
  yield snap({
    line: 41, tag: 'create', frames: [mainF()], objs: [obj('a', null, null)],
    narrate: 'A no-argument constructor is now written alongside the two-argument one. main creates a ' +
             'with no arguments.',
    note: PHASE3_INTRO_NOTE,
  });
  yield snap({
    line: 29, tag: 'ctor', frames: [mainF(41), ctorF()], objs: [obj('a', null, null)],
    narrate: 'No arguments, so the no-argument constructor runs — its frame has no parameters. The ' +
             'argument list chose it.',
  });
  yield snap({
    line: 30, tag: 'set', frames: [mainF(41), ctorF()], objs: [obj('a', 1, null, 'length')],
    narrate: "length = 1 runs: a's length is now 1 — a value the constructor sets, not one passed in.",
  });
  yield snap({
    line: 31, tag: 'set', frames: [mainF(41), ctorF()], objs: [obj('a', 1, 1, 'width')],
    narrate: "width = 1 runs: a's width is now 1.",
  });
  yield snap({
    line: 41, tag: 'return', frames: [mainF()], objs: [obj('a', 1, 1)],
    narrate: 'a now exists with length 1 and width 1 — values the constructor chose, so a is usable the ' +
             'moment it is created.',
  });
  yield snap({
    line: 42, tag: 'create', frames: [mainF()], objs: [obj('a', 1, 1), obj('b', null, null)],
    narrate: 'main creates b with 3 and 4.',
  });
  yield snap({
    line: 33, tag: 'ctor', frames: [mainF(42), ctorF([P('len', 3, true), P('wid', 4, true)])],
    objs: [obj('a', 1, 1), obj('b', null, null)],
    narrate: 'Two arguments this time, so the two-argument constructor runs instead — same name, ' +
             'chosen by the argument list. Its frame shows len = 3 and wid = 4.',
  });
  yield snap({
    line: 34, tag: 'set', frames: [mainF(42), ctorF([P('len', 3), P('wid', 4)])],
    objs: [obj('a', 1, 1), obj('b', 3, null, 'length')],
    narrate: "length = len: b's length is now 3.",
  });
  yield snap({
    line: 35, tag: 'set', frames: [mainF(42), ctorF([P('len', 3), P('wid', 4)])],
    objs: [obj('a', 1, 1), obj('b', 3, 4, 'width')],
    narrate: "width = wid: b's width is now 4.",
  });
  yield snap({
    line: 42, tag: 'return', frames: [mainF()], objs: [obj('a', 1, 1), obj('b', 3, 4)],
    narrate: 'Both objects exist and both are usable the moment they were created. Each constructor left ' +
             'its object in a state its code chose.',
    note: FINAL_NOTE,
  });
}

export default {
  title: 'Constructors: the function that runs when an object is made',
  subtitle: 'Creating a Rectangle, before and after writing a constructor',
  profile: 'beginner',
  columns: 2,
  languages: ['cpp', 'java'],   // order = fallback order; first is the default

  // Declared in reading order: the code the student reads, then the objects it
  // creates, then the call frames that create them. Exactly three panels — the
  // beginner profile caps at 3, and this is the whole story: code, state, machinery.
  panels: [
    { type: 'code', id: 'code', title: 'Rectangle',
      listings: LISTINGS, labels: { cpp: 'C++', java: 'Java' } },
    { type: 'cells', id: 'objs', title: 'Objects' },
    { type: 'callstack', id: 'calls', title: 'Function calls' },
  ],

  initialTrace: 'run',
  traces: {
    run: trace,
  },
};
