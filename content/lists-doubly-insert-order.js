/* ds — A10 "Doubly linked list operations"
 *
 * From lists2.html, the four lines that insert `ins` before `temp`:
 *
 *     ins.prev      = temp.prev
 *     ins.next      = temp
 *     ins.prev.next = ins          <- dereferences what line 1 set
 *     temp.prev     = ins
 *
 * Line 3 reads `ins.prev`, which line 1 wrote. Do line 4 first and line 1
 * reads a pointer that already points at `ins`, so `ins.prev` becomes `ins`
 * itself; line 3 then overwrites `ins.next` with `ins`. The new node points at
 * itself in both directions, the front of the list never learns it exists, and
 * -- in Neven's words -- simply "losing it" is not an option.
 *
 * Every arrow on screen is data resolved against a live DOM box. Nothing here
 * is a hand-placed curve. */

const HEAD = 'n12';

const LISTINGS = {
  pseudo: [
    '// insert node ins before node temp',
    'ins.prev = temp.prev',
    'ins.next = temp',
    'ins.prev.next = ins',
    'temp.prev = ins',
  ],
  java: [
    '// insert node ins before node temp',
    'ins.prev = temp.prev;',
    'ins.next = temp;',
    'ins.prev.next = ins;',
    'temp.prev = ins;',
  ],
  cpp: [
    '// insert node ins before node temp',
    'ins->prev = temp->prev;',
    'ins->next = temp;',
    'ins->prev->next = ins;',
    'temp->prev = ins;',
  ],
};

/* The four assignments, as data. Both orderings reuse them. */
const OPS = {
  A: { line: 2, name: 'ins.prev = temp.prev',
       apply: m => { m[m.ins].prev = m[m.temp].prev; return m.ins; },
       say:   m => `ins.prev takes temp.prev, which is ${label(m, m[m.temp].prev)}.` },
  B: { line: 3, name: 'ins.next = temp',
       apply: m => { m[m.ins].next = m.temp; return m.ins; },
       say:   () => `ins.next points forward at temp. The new node is now linked in from its own side.` },
  C: { line: 4, name: 'ins.prev.next = ins',
       apply: m => { const p = m[m.ins].prev; if (p == null) return null; m[p].next = m.ins; return p; },
       say:   m => `Follow ins.prev to ${label(m, m[m.ins].prev)}, then set its next to ins. This line depends on line 2 having run.` },
  D: { line: 5, name: 'temp.prev = ins',
       apply: m => { m[m.temp].prev = m.ins; return m.temp; },
       say:   () => `temp.prev turns around to face ins. The list is now stitched on both sides.` },
};

const ORDERS = { correct: ['A', 'B', 'C', 'D'], buggy: ['D', 'A', 'B', 'C'] };

const label = (m, id) => (id == null ? 'null' : m[id].value);

function fresh() {
  return {
    ins: 'n25', temp: 'n37', head: HEAD,
    n12: { value: 12, prev: null,  next: 'n37', slot: 0,   row: 0 },
    n37: { value: 37, prev: 'n12', next: 'n99', slot: 1,   row: 0 },
    n99: { value: 99, prev: 'n37', next: null,  slot: 2,   row: 0 },
    n25: { value: 25, prev: null,  next: null,  slot: 0.55, row: 1 },
  };
}

const NODE_IDS = ['n12', 'n37', 'n99', 'n25'];

/** Walk forward from head. Bounded, because a corrupted list contains a cycle. */
function walk(m) {
  const seen = [];
  let cur = m.head, guard = 0;
  while (cur != null && guard++ < 8) {
    if (seen.includes(m[cur].value)) { seen.push('\u21bb'); break; }
    seen.push(m[cur].value);
    cur = m[cur].next;
  }
  return seen;
}

function arrows(m) {
  const out = [];
  for (const id of NODE_IDS) {
    const n = m[id];
    if (n.next != null)
      out.push({ from: `list.${id}.next`, to: `list.${n.next}`, bend: 'up',
                 style: n.next === id ? 'stale' : 'pointer' });
    if (n.prev != null)
      out.push({ from: `list.${id}.prev`, to: `list.${n.prev}`, bend: 'down',
                 style: n.prev === id ? 'stale' : 'pointer' });
  }
  out.push({ from: 'vars.head', to: `list.${m.head}` });
  out.push({ from: 'vars.ins',  to: `list.${m.ins}` });
  out.push({ from: 'vars.temp', to: `list.${m.temp}` });
  return out;
}

function snap(m, { line, tag, narrate, touched, extra = {} }) {
  const reach = walk(m);
  const orphan = !reach.includes(25);
  return {
    tag, narrate, line,
    arrows: arrows(m),
    panels: {
      list: {
        layout: 'linear', template: 'record',
        nodes: NODE_IDS.map(id => ({
          id, label: String(m[id].value),
          prev: m[id].prev, next: m[id].next,
          slot: m[id].slot, row: m[id].row,
          state: id === touched ? 'entering' : (m[id].prev === id || m[id].next === id ? 'pending' : 'exited'),
        })),
        edges: [],
      },
      vars: {
        render: 'row',
        cells: [
          { label: 'head_pt', value: '\u25cf', anchor: 'head' },
          { label: 'ins_pt',  value: '\u25cf', anchor: 'ins', role: 'active' },
          { label: 'temp_pt', value: '\u25cf', anchor: 'temp' },
        ],
      },
      walk: {
        render: 'box',
        cells: reach.map(v => ({ value: v, role: v === 25 ? 'ok' : undefined }))
          .concat(orphan ? [{ value: '25 lost', role: 'error' }] : []),
      },
    },
    ...extra,
  };
}

function makeTrace(orderName, gate) {
  return function* () {
    const m = fresh();

    yield snap(m, {
      tag: 'setup', line: 1,
      narrate: 'A doubly linked list: 12 \u2194 37 \u2194 99. A new node holding 25 has been allocated but is not yet part of the list. We want it before 37.',
    });

    if (gate) {
      yield {
        ...snap(m, { line: 1, narrate: 'The four assignments must run in some order. Not every order works.' }),
        type: 'predict',
        question: 'Which of these four assignments must happen first?',
        options: [
          { label: 'temp.prev = ins',
            feedback: 'This is the tempting one, and it destroys the list. Watch.',
            branch: 'buggy',
            banner: 'Running the wrong order: temp.prev = ins goes first. Watch node 25.' },
          { label: 'ins.prev = temp.prev', correct: true,
            feedback: 'Correct. Nothing else can run first: line 4 reads ins.prev, and line 5 overwrites temp.prev.' },
          { label: 'ins.prev.next = ins',
            feedback: 'This dereferences ins.prev before anything has set it. In C++ that is a null dereference; in Java, a NullPointerException.' },
        ],
      };
    }

    for (const key of ORDERS[orderName]) {
      const op = OPS[key];
      const say = op.say(m);
      const touched = op.apply(m);
      yield snap(m, { line: op.line, tag: 'assign', narrate: `${op.name} \u2014 ${say}`, touched });
    }

    const reach = walk(m);
    const ok = reach.includes(25) && !reach.includes('\u21bb');
    yield snap(m, {
      tag: ok ? 'done' : 'corrupt', line: null, touched: null,
      narrate: ok
        ? 'Walking forward from head_pt: 12, 25, 37, 99. Every prev and next agree. The insertion is sound.'
        : 'Walking forward from head_pt never reaches 25. Node 25 points at itself in both directions, and nothing points at it. It is unreachable and unfreeable \u2014 simply "losing it" is not an option.',
    });
  };
}

export default {
  title: 'Doubly linked insertion: why the order of four lines matters',
  subtitle: 'ds A10 \u2014 line 4 dereferences the pointer line 2 set.',
  profile: 'standard',
  columns: 2,
  languages: ['pseudo', 'java', 'cpp'],
  hideTags: ['setup'],

  panels: [
    { type: 'code',   id: 'code', title: 'insert ins before temp',
      listings: LISTINGS, labels: { pseudo: 'pseudocode', java: 'Java', cpp: 'C++' } },
    { type: 'nodes',  id: 'list', title: 'The list' },
    { type: 'cells',  id: 'vars', title: 'Pointer variables' },
    { type: 'cells',  id: 'walk', title: 'Walk forward from head_pt' },
  ],

  initialTrace: 'correct',
  traces: {
    correct: makeTrace('correct', true),
    buggy:   makeTrace('buggy', false),
  },
};
