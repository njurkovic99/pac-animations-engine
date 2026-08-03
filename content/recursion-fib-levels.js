/* ds — A5 "Fibonacci trace"
 *
 * The lesson is NOT exponential recomputation. It is the invariant
 *
 *     n + level = N          (constant at every node)
 *
 * from which the calls follow:
 *     fib(n-1, level+1)   ->  (n-1)+(level+1) = n+level   ok
 *     fib(n-2, level+2)   ->  (n-2)+(level+2) = n+level   ok
 *     fib(n-2, level+1)   ->  n+level-1                   the common bug
 *
 * Root cause: level is NOT recursion depth. fib(2) and fib(3) both sit at
 * depth 1, but at levels 2 and 1. Students assume level == depth, so they
 * write level+1 on both calls. The animation puts level and depth side by
 * side on every node so they visibly diverge.
 *
 * Verified against the expected output in ds5.html: the level sequence is
 * 0, 2, 4, 3, 1, 3, 2, 4, 3 -- i.e. the n-2 branch is evaluated first. */

const N = 4;

const LISTINGS = {
  pseudo: [
    'function fib(n, level)',
    '    print indent(level), "Entering level", level',
    '    if n <= 1 then',
    '        result = n',
    '    else',
    '        result = fib(n - 2, level + 2)',
    '               + fib(n - 1, level + 1)',
    '    print indent(level), "Exiting level", level',
    '    return result',
  ],
  java: [
    'static int fib(int n, int level) {',
    '    print(level, "Entering level " + level);',
    '    int result;',
    '    if (n <= 1) {',
    '        result = n;',
    '    } else {',
    '        result = fib(n - 2, level + 2)',
    '               + fib(n - 1, level + 1);',
    '    }',
    '    print(level, "Exiting level " + level);',
    '    return result;',
    '}',
  ],
  cpp: [
    'int fib(int n, int level) {',
    '    print(level, "Entering level " + to_string(level));',
    '    int result;',
    '    if (n <= 1) {',
    '        result = n;',
    '    } else {',
    '        result = fib(n - 2, level + 2)',
    '               + fib(n - 1, level + 1);',
    '    }',
    '    print(level, "Exiting level " + to_string(level));',
    '    return result;',
    '}',
  ],
};

const L = {
  enter:  { pseudo: 2, java: 2,  cpp: 2  },
  base:   { pseudo: 4, java: 5,  cpp: 5  },
  callA:  { pseudo: 6, java: 7,  cpp: 7  },
  callB:  { pseudo: 7, java: 8,  cpp: 8  },
  exit:   { pseudo: 8, java: 10, cpp: 10 },
};

/* ---- build the whole call tree first, so layout never moves ---- */

function buildTree(N, dl2) {
  const nodes = [];
  const rec = (n, level, parent, depth) => {
    const id = 'c' + nodes.length;
    const node = { id, parent, n, level, depth, kids: [] };
    nodes.push(node);
    if (n > 1) {
      const left  = rec(n - 1, level + 1,   id, depth + 1); // drawn left
      const right = rec(n - 2, level + dl2, id, depth + 1); // drawn right
      node.kids = [left, right];
    }
    return id;
  };
  rec(N, 0, null, 0);
  return nodes;
}

/* ---- the trace ---- */

function makeTrace() {
  return function* () {
    const dl2 = 2;
    const nodes = buildTree(N, dl2);
    const byId = new Map(nodes.map(n => [n.id, n]));
    const state = new Map(nodes.map(n => [n.id, 'pending']));
    const out = [];
    let trapShown = false;
    let divergeShown = false;   // narrate level != depth once, where it first happens

    const snap = (activeId, line, tag, narrate, extra = {}) => {
      const node = byId.get(activeId);
      return {
        tag, narrate, line,
        panels: {
          tree: {
            layout: 'tree',
            nodes: nodes.map(nd => ({
              id: nd.id, parent: nd.parent,
              label: `fib(${nd.n})`,
              meta: [`level ${nd.level}`, `depth ${nd.depth}`],
              state: state.get(nd.id),
            })),
          },
          out: { lines: out.map((l, k) => ({ ...l, isNew: k === out.length - 1 })) },
          // Variables holds only true variables -- n, level, depth, N -- as four
          // boxes on one row. `n + level` is a derived expression, not a variable,
          // so it does NOT live here; the invariant n + level = N is taught in the
          // step-0 note and in the narration at the step where level and depth
          // first diverge. The tree already prints level and depth on every node,
          // so the evidence is on screen -- the words point at it.
          inv: {
            render: 'box',
            cells: [
              { label: 'n',     value: node.n },
              { label: 'level', value: node.level },
              { label: 'depth', value: node.depth },
              { label: 'N',     value: N },
            ],
          },
        },
        ...extra,
      };
    };

    function* visit(id) {
      const node = byId.get(id);

      state.set(id, 'entering');
      out.push({ text: `Entering level ${node.level}`, indent: node.level, dir: 'out' });
      // At the FIRST node where level and depth disagree, name both numbers off the
      // screen -- this divergence IS the misconception (students read level as the
      // recursion depth). n + level still equals N, which is the invariant.
      let enterNarr =
        `fib(${node.n}) begins. It prints "Entering level ${node.level}" indented ${node.level} space${node.level === 1 ? '' : 's'}.`;
      if (!divergeShown && node.level !== node.depth) {
        divergeShown = true;
        enterNarr += ` Look at this node: level is ${node.level} but depth is ${node.depth} — they have `
          + `diverged. level is NOT the recursion depth. And n + level is ${node.n} + ${node.level} = `
          + `${node.n + node.level}, still equal to N.`;
      }
      yield snap(id, L.enter, 'enter', enterNarr);
      state.set(id, 'active');

      if (node.n <= 1) {
        yield snap(id, L.base, 'base', `Base case: fib(${node.n}) = ${node.n}. No further calls.`);
      } else {
        // The common-mistake warning is a NOTE on the real n-2 call step, not a
        // phantom step of its own (AUTHORING.md "Steps vs. notes"). It appears
        // once, on the first branching call, then collapses. This is a logic
        // error, not a memory-integrity violation, so it carries no red ⚠.
        let note;
        if (!trapShown) {
          trapShown = true;
          note = `A common error here is fib(n - 2, level + 1). But n + level must stay constant at ${N}: `
               + `if n drops by 2, level must rise by 2 — so it has to be level + 2. `
               + `Watch the "n + level" readout stay ${N} as the correct calls proceed.`;
        }

        yield snap(id, L.callA, 'call',
          `The n - 2 branch is evaluated first: fib(${node.n - 2}, ${node.level + dl2}).`,
          { note });
        yield* visit(node.kids[1]);   // n-2, drawn right, evaluated first

        yield snap(id, L.callB, 'call',
          `Now the n - 1 branch: fib(${node.n - 1}, ${node.level + 1}).`);
        yield* visit(node.kids[0]);   // n-1, drawn left
      }

      out.push({ text: `Exiting level ${node.level}`, indent: node.level, dir: 'out' });
      state.set(id, 'exited');
      // The post-watch challenge is a note on the final step -- the root's exit.
      // Final step (root exit): name the invariant explicitly as the payoff --
      // the relationship step 0 primed the student to watch is now revealed --
      // then pose the post-watch challenge. See AUTHORING.md "Steps vs. notes".
      const exitNote = id === 'c0'
        ? 'Notice n + level stayed 4 at every node. That invariant is what keeps '
          + 'each "Exiting" line at the same indent as its "Entering" line, so the '
          + 'indentation always matches the recursion level. '
          + 'What if "level" were the recursion depth instead? fib(2) and fib(3) both sit at '
          + 'depth 1 here — check the tree: are they at the same level? Following depth in place '
          + 'of level is exactly the bug this invariant guards against.'
        : undefined;
      yield snap(id, L.exit, 'exit',
        `fib(${node.n}) returns. Its "Exiting" line is printed at the same indent as its "Entering" line.`,
        { note: exitNote });
    }

    // Step 0 (required): the initial state, before anything executes -- no line
    // highlighted. The whole call tree is laid out (every node pending), the
    // program output is empty, and the Variables strip shows the starting call
    // fib(4, 0). The setup note lives here, and STATES the invariant plainly (the
    // `n + level` readout was removed from the Variables strip -- a derived
    // expression is not a variable -- so the invariant is taught in words here and
    // in the divergence narration, pointing at the level/depth the tree shows on
    // every node).
    yield snap('c0', null, 'init',
      'Before the first call. The call tree is laid out but nothing has run yet; we are about to evaluate fib(4, 0).',
      { note:
        'We trace fib(4, 0). The invariant is n + level = 4: at every node, n plus level equals N, the ' +
        'starting value of n. That is why each call raises level by exactly as much as it drops n. And ' +
        'level is NOT the recursion depth — both are printed on every node, and you will watch them diverge.' });

    yield* visit('c0');
  };
}

export default {
  title: 'Recursion: what "level" really counts',
  subtitle: 'Tracing a recursive Fibonacci function.',
  profile: 'standard',
  columns: 2,
  languages: ['pseudo', 'java', 'cpp'],

  panels: [
    { type: 'code',   id: 'code', title: 'fib(n, level)',
      listings: LISTINGS, labels: { pseudo: 'pseudocode', java: 'Java', cpp: 'C++' } },
    { type: 'nodes',  id: 'tree', title: 'Call tree' },
    { type: 'cells',  id: 'inv',  title: 'Variables', compact: true },
    // STREAM is declared LAST so the column flow puts it beneath the code panel
    // (it is what the program EMITS, reading as a continuation of the code).
    { type: 'stream', id: 'out',  title: 'Program output' },
  ],

  initialTrace: 'correct',
  traces: {
    correct: makeTrace(),
  },
};
