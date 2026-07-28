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

const ORDER = ['A', 'B', 'C', 'D'];

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

function snap(m, { line, tag, narrate, note, touched }) {
  const reach = walk(m);
  return {
    tag, narrate, line, note,
    arrows: arrows(m),
    panels: {
      list: {
        layout: 'linear', template: 'record',
        nodes: NODE_IDS.map(id => ({
          id, label: String(m[id].value),
          prev: m[id].prev, next: m[id].next,
          slot: m[id].slot, row: m[id].row,
          // The node just written is 'entering'; a node already reachable from
          // head is 'exited' (settled in the list); a freshly allocated node
          // not yet linked in -- node 25 before insertion -- is 'pending'. It
          // is HEALTHY, merely waiting; it is never marked as danger. (See
          // AUTHORING.md "Memory-danger marker": the correct order has no
          // danger moment.)
          state: id === touched ? 'entering'
                 : (reach.includes(m[id].value) ? 'exited' : 'pending'),
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
        cells: reach.map(v => ({ value: v, role: v === 25 ? 'ok' : undefined })),
      },
    },
  };
}

/* Two teaching notes, kept out of the step flow (AUTHORING.md "Steps vs.
 * notes"). Both were narration on phantom, non-executing steps in the original;
 * they are now commentary attached to real execution steps. */
const SETUP_AND_PITFALL =
  'Setup: a doubly linked list 12 \u2194 37 \u2194 99, with a new node holding 25 already ' +
  'allocated but not yet linked in \u2014 we want it before 37. A common mistake is to run ' +
  'temp.prev = ins first: then ins.prev = temp.prev copies a pointer that already points ' +
  'back at ins, so ins.prev becomes ins itself, and line 4 (ins.prev.next = ins) dereferences ' +
  'a pointer that was never set. Setting ins.prev and ins.next first, as here, avoids that.';

const CHALLENGE =
  'What if line 4 (ins.prev.next = ins) had run before line 2 (ins.prev = temp.prev)? Trace it ' +
  'yourself: which node would ins.prev still point at, and what would line 4 then write through?';

/* A note per operation, keyed by op letter. Only the ordering-critical first
 * assignment and the final one carry commentary. */
const NOTES = { A: SETUP_AND_PITFALL, D: CHALLENGE };

function makeTrace() {
  return function* () {
    const m = fresh();

    // Steps are executions only: the four assignment lines, each highlighted.
    // The setup framing and the common-mistake warning are notes, not steps;
    // the post-watch challenge is a note on the final step. No step exists
    // merely to display commentary.
    for (const key of ORDER) {
      const op = OPS[key];
      const say = op.say(m);
      const touched = op.apply(m);
      yield snap(m, {
        line: op.line, tag: 'assign',
        narrate: `${op.name} \u2014 ${say}`,
        note: NOTES[key],
        touched,
      });
    }
  };
}

export default {
  title: 'Doubly linked insertion: why the order of four lines matters',
  subtitle: 'ds A10 \u2014 line 4 dereferences the pointer line 2 set.',
  profile: 'standard',
  columns: 2,
  languages: ['pseudo', 'java', 'cpp'],
  hideTags: [],

  panels: [
    { type: 'code',   id: 'code', title: 'insert ins before temp',
      listings: LISTINGS, labels: { pseudo: 'pseudocode', java: 'Java', cpp: 'C++' } },
    { type: 'nodes',  id: 'list', title: 'The list' },
    { type: 'cells',  id: 'vars', title: 'Pointer variables' },
    { type: 'cells',  id: 'walk', title: 'Walk forward from head_pt' },
  ],

  initialTrace: 'correct',
  traces: {
    correct: makeTrace(),
  },
};
