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

    const snap = (activeId, line, tag, narrate, extra = {}) => {
      const node = byId.get(activeId);
      const sum = node.n + node.level;
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
          inv: {
            render: 'row',
            cells: [
              { label: 'n',         value: node.n },
              { label: 'level',     value: node.level },
              { label: 'depth',     value: node.depth },
              { label: 'n + level', value: sum, role: sum === N ? 'ok' : 'error' },
              { label: 'N',         value: N },
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
      yield snap(id, L.enter, 'enter',
        `fib(${node.n}) begins. It prints "Entering level ${node.level}" indented ${node.level} space${node.level === 1 ? '' : 's'}.`);
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
    // program output is empty, and the invariant panel shows the starting call
    // fib(4, 0). The setup note lives here.
    // Step 0 note primes the student to watch the n/level relationship WITHOUT
    // stating the invariant equation -- that reveal is the payoff on the final
    // step. See AUTHORING.md "Steps vs. notes".
    yield snap('c0', null, 'init',
      'Before the first call. The call tree is laid out but nothing has run yet; we are about to evaluate fib(4, 0).',
      { note:
        'We trace fib(4, 0). As this runs, watch how n and level change together at each call. ' +
        'Crucially, level is NOT the recursion depth; both are shown on every node so you can see ' +
        'them diverge.' });

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
    { type: 'cells',  id: 'inv',  title: 'Variables' },
    // STREAM is declared LAST so the column flow puts it beneath the code panel
    // (it is what the program EMITS, reading as a continuation of the code).
    { type: 'stream', id: 'out',  title: 'Program output' },
  ],

  initialTrace: 'correct',
  traces: {
    correct: makeTrace(),
  },
};
