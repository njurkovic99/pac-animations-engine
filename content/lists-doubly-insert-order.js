/* ds — A10 "Doubly linked list operations"
 *
 * From lists2.html, the four lines that insert `ins` before `temp`:
 *
 *     ins^.prev       = temp^.prev
 *     ins^.next       = temp
 *     ins^.prev^.next = ins        <- dereferences what line 1 set
 *     temp^.prev      = ins
 *
 * Line 3 reads `ins^.prev`, which line 1 wrote. Do line 4 first and line 1
 * reads a pointer that already points at `ins`, so `ins^.prev` becomes `ins`
 * itself; line 3 then overwrites `ins^.next` with `ins`. The new node points at
 * itself in both directions, the front of the list never learns it exists, and
 * -- in Neven's words -- simply "losing it" is not an option.
 *
 * Every arrow on screen is data resolved against a live DOM box. Nothing here
 * is a hand-placed curve. */

const HEAD = 'n12';

const LISTINGS = {
  pseudo: [
    '// insert node ins before node temp',
    'ins^.prev = temp^.prev',
    'ins^.next = temp',
    'ins^.prev^.next = ins',
    'temp^.prev = ins',
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
  A: { line: 2, name: 'ins^.prev = temp^.prev',
       apply: m => { m[m.ins].prev = m[m.temp].prev; return m.ins; },
       say:   m => `ins^.prev now points where temp^.prev points — to ${label(m, m[m.temp].prev)}.` },
  B: { line: 3, name: 'ins^.next = temp',
       apply: m => { m[m.ins].next = m.temp; return m.ins; },
       say:   () => `ins^.next points forward at temp. The new node is now linked in from its own side.` },
  C: { line: 4, name: 'ins^.prev^.next = ins',
       apply: m => { const p = m[m.ins].prev; if (p == null) return null; m[p].next = m.ins; return p; },
       say:   m => `Follow ins^.prev to ${label(m, m[m.ins].prev)}, then set its next to ins. This line depends on line 2 having run.` },
  D: { line: 5, name: 'temp^.prev = ins',
       apply: m => { m[m.temp].prev = m.ins; return m.temp; },
       say:   () => `temp^.prev now points to ins. 25 ↔ 37 is now linked in both directions.` },
};

const ORDER = ['A', 'B', 'C', 'D'];

const label = (m, id) => (id == null ? 'null' : m[id].value);

/** A node is fully linked into the list only when the insertion is COMPLETE:
 *  it has both a prev and a next, AND both neighbours point back at it. Until
 *  then the inserted node is 'unlinked' (see AUTHORING.md "Node membership
 *  state"). This is stricter than mere forward reachability -- after
 *  ins^.prev^.next = ins the node is reachable, but temp^.prev still points past
 *  it, so it is not yet a full member. */
function linkedIn(m, id) {
  const n = m[id];
  return n.prev != null && n.next != null &&
         m[n.prev].next === id && m[n.next].prev === id;
}

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
          // Two INDEPENDENT color channels (AUTHORING.md "Node color channels").
          //
          // OUTLINE = membership. The node being inserted (m.ins) is 'unlinked'
          // (amber) until the insertion is COMPLETE -- all four links set AND
          // both neighbours pointing back (see linkedIn) -- at which point, on
          // the final step, it becomes a 'member' (green). Every already-settled
          // list node is a 'member' throughout. Partial linking and activity
          // never flip the outline green early; node 25 is HEALTHY the whole
          // time, never danger (AUTHORING.md "Memory-danger marker").
          //
          // FILL = activity. `active` flags the node modified on THIS step (the
          // one op.apply touched), painting a blue interior orthogonal to the
          // outline. So node 25 is amber-outline + blue-fill while its own links
          // are being set, and a settled green member shows a blue fill on the
          // step it is rewired.
          state:  (id === m.ins && !linkedIn(m, id)) ? 'unlinked' : 'member',
          active: id === touched,
        })),
        edges: [],
      },
      vars: {
        render: 'row',
        cells: [
          { label: 'head', value: '\u25cf', anchor: 'head' },
          { label: 'ins',  value: '\u25cf', anchor: 'ins', role: 'active' },
          { label: 'temp', value: '\u25cf', anchor: 'temp' },
        ],
      },
      walk: {
        render: 'box',
        cells: reach.map(v => ({ value: v, role: v === 25 ? 'ok' : undefined })),
      },
    },
  };
}

/* Three teaching notes, kept out of the step flow (AUTHORING.md "Steps vs.
 * notes"): a setup note on the initial-state step, the ordering-pitfall warning
 * on the assignment it concerns, and the post-watch challenge on the last step. */
const SETUP = [
  'A doubly linked list, 12 \u2194 37 \u2194 99, fully linked. A new node holding 25 has been ' +
  'allocated and ins points to it \u2014 and its own prev and next are still null, so it is ' +
  'not yet part of the list. We want it before 37 (temp); the four assignments below ' +
  'link it in. ',
  // Back-link to the prequel (A9), which finds the insertion spot this animation
  // takes as given -- the return leg of A9's forward link, so a student landing on
  // either meets the other (AUTHORING.md "Links between animations").
  { href: 'lists-insert-alpha.html', text: 'See how the position was found' },
];

const PITFALL =
  'A common mistake is to run temp^.prev = ins first: then ins^.prev = temp^.prev copies a ' +
  'pointer that already points back at ins, so ins^.prev points to ins itself.';

const CHALLENGE =
  'What if line 4 (ins^.prev^.next = ins) had run before line 2 (ins^.prev = temp^.prev)? Trace it ' +
  'yourself: which node would ins^.prev still point at, and what would line 4 then write through?';

/* A note per assignment, keyed by op letter. Only the ordering-critical first
 * assignment and the final one carry commentary. */
const NOTES = { A: PITFALL, D: CHALLENGE };

function makeTrace() {
  return function* () {
    const m = fresh();

    // Step 0 (required): the initial state, before anything executes -- no line
    // highlighted. The list is already linked 12 <-> 37 <-> 99; node 25 is
    // allocated and pointed to by ins (one arrow, ins -> 25) with its own prev
    // and next still null, so NO linking arrows join it to the list yet -- those
    // are exactly what the four assignments draw. The setup note lives here.
    yield snap(m, {
      line: null, tag: 'init', touched: null,
      narrate: 'The list before insertion. Node 25 is allocated and ins points to it, with its own prev and next still null.',
      note: SETUP,
    });

    // Every remaining step is a real execution: the four assignment lines, each
    // highlighted. The pitfall warning and the post-watch challenge are notes.
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
  subtitle: 'Inserting a node into a doubly linked list.',
  profile: 'standard',
  columns: 2,
  languages: ['pseudo', 'java', 'cpp'],

  panels: [
    { type: 'code',   id: 'code', title: 'insert ins before temp',
      listings: LISTINGS, labels: { pseudo: 'pseudocode', java: 'Java', cpp: 'C++' } },
    { type: 'nodes',  id: 'list', title: 'The list' },
    { type: 'cells',  id: 'vars', title: 'Pointer variables' },
    { type: 'cells',  id: 'walk', title: 'Walk forward from head' },
  ],

  initialTrace: 'correct',
  traces: {
    correct: makeTrace(),
  },
};
