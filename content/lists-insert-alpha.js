/* ds — A9 "Inserting in order into a singly linked list"
 *
 * The PREQUEL to lists-doubly-insert-order (A10). A10 assumes the spot is already
 * found and asks only about the ORDER of four assignments; this one asks the prior
 * question -- how do you FIND the spot in a sorted list, and what must you be
 * holding when you get there?
 *
 * The lecture's own example: a sorted list 12 -> 37 -> 99, inserting 39. The trap,
 * in Neven's words: you walk with one pointer, stop at the first node LARGER than
 * the value (99), and discover you have gone one node too far -- the node whose
 * link must change is 37, one step BACK, and a singly linked list has no way back.
 * That is what trail_pt is for, and it is the whole lesson. The closing note links
 * forward to A10, whose doubly linked list is the lecture's answer to this clumsiness.
 *
 * Shares A10's NODES record template, its pointer-variable strip, and its arrow
 * overlay -- minus the backward prev links (this list points forward only). Adds
 * the Function calls (CALLSTACK) panel so the parameter binding is visible: 39
 * enters as insertAlpha(value = 39), and line 3 copies it out of the frame into the
 * node. The new node is ALLOCATED on line 2 with INDETERMINATE fields (the dashed X
 * box), which line 3 (number) and line 4 (link_pt = nil) then write -- an unset
 * pointer and a nil pointer are different things, the point pointers-address-model
 * makes. Every arrow is data resolved against a live DOM box; nothing is hand-placed. */

const HEAD = 'n12';

/* One listing, ds language tabs: pseudocode (default), Java, C++. Kept line-aligned
 * so a single `line` number addresses all three; pseudocode uses the CARET for
 * dereference (AUTHORING.md item 82). main() is shown so the call insertAlpha(39)
 * -- where 39 comes from -- has a highlightable origin, and the CALLSTACK stays in
 * sync. Line 13 as written crashes when the new value sorts first (trail_pt still
 * nil) -- the lecture's bug, deliberately NOT hidden; it is the closing challenge.
 * Referenced lines: 2,3,4,6,7,8,9,10,12,13,16. Blank lines 5/11/14 and the headers
 * 1/15 are never highlighted. */
const LISTINGS = {
  pseudo: [
    'insertAlpha(value)',                                    // 1
    '   new(ins_pt)',                                        // 2
    '   ins_pt^.number = value',                            // 3
    '   ins_pt^.link_pt = nil',                             // 4
    '',                                                      // 5
    '   temp_pt = head_pt',                                  // 6
    '   trail_pt = nil',                                     // 7
    '   while temp_pt <> nil and temp_pt^.number < value',  // 8
    '      trail_pt = temp_pt',                              // 9
    '      temp_pt = temp_pt^.link_pt',                     // 10
    '',                                                      // 11
    '   ins_pt^.link_pt = temp_pt',                         // 12
    '   trail_pt^.link_pt = ins_pt',                        // 13
    '',                                                      // 14
    'main()',                                                // 15
    '   insertAlpha(39)',                                    // 16
  ],
  java: [
    'void insertAlpha(int value) {',                         // 1
    '    Node ins_pt = new Node();',                         // 2
    '    ins_pt.number = value;',                            // 3
    '    ins_pt.link_pt = null;',                            // 4
    '',                                                      // 5
    '    temp_pt = head_pt;',                                // 6
    '    trail_pt = null;',                                  // 7
    '    while (temp_pt != null && temp_pt.number < value) {', // 8
    '        trail_pt = temp_pt;',                           // 9
    '        temp_pt = temp_pt.link_pt;',                    // 10
    '    }',                                                 // 11
    '    ins_pt.link_pt = temp_pt;',                         // 12
    '    trail_pt.link_pt = ins_pt;',                        // 13
    '}',                                                     // 14
    'void main() {',                                         // 15
    '    insertAlpha(39);',                                  // 16
  ],
  cpp: [
    'void insertAlpha(int value) {',                         // 1
    '    ins_pt = new Node;',                                // 2
    '    ins_pt->number = value;',                           // 3
    '    ins_pt->link_pt = nullptr;',                        // 4
    '',                                                      // 5
    '    temp_pt = head_pt;',                                // 6
    '    trail_pt = nullptr;',                               // 7
    '    while (temp_pt != nullptr && temp_pt->number < value) {', // 8
    '        trail_pt = temp_pt;',                           // 9
    '        temp_pt = temp_pt->link_pt;',                   // 10
    '    }',                                                 // 11
    '    ins_pt->link_pt = temp_pt;',                        // 12
    '    trail_pt->link_pt = ins_pt;',                       // 13
    '}',                                                     // 14
    'int main() {',                                          // 15
    '    insertAlpha(39);',                                  // 16
  ],
};

/* The list nodes, plus the new node held by ins_pt. A field is INDETERMINATE when
 * its backing value is `undefined` (renders as the dashed X box): the new node's
 * number until line 3, its link_pt until line 4. `null` is a real nil (the crossed
 * box ∅); a string is a node id (a filled dot + an arrow). ins/temp/trail start
 * `undefined` (not yet assigned). The list nodes sit on the main row (row 0); the
 * new node 39, once allocated, sits BELOW it (row 1), between the 37 and 99 slots --
 * exactly as A10 places its node 25. */
function fresh() {
  return {
    head: HEAD,
    ins: undefined,           // set to 'n39' when new(ins_pt) runs (line 2)
    temp: undefined,          // placeholder until line 6
    trail: undefined,         // placeholder until line 7
    alloc: false,             // node 39 exists only after new(ins_pt)
    numberWritten: false,     // ins_pt^.number = value (line 3)
    n12: { value: 12, link: 'n37',      slot: 0,    row: 0 },
    n37: { value: 37, link: 'n99',      slot: 1,    row: 0 },
    n99: { value: 99, link: null,       slot: 2,    row: 0 },
    n39: { value: 39, link: undefined,  slot: 1.55, row: 1 },  // link_pt indeterminate until line 4
  };
}

const LIST_IDS = ['n12', 'n37', 'n99'];
function nodeIds(m) { return m.alloc ? [...LIST_IDS, 'n39'] : LIST_IDS; }

/** The inserted node is a full MEMBER only when the insertion is COMPLETE: its own
 *  link_pt points at a real node AND some list node's link_pt points back at it.
 *  After line 12 it points at 99 but 37 still points past it, so it is reachable-
 *  forward yet not a member (stays amber); line 13 makes 37 point at it -> green. */
function memberIns(m) {
  if (typeof m.n39.link !== 'string') return false;
  return LIST_IDS.some(id => m[id].link === 'n39');
}

/* Follow head_pt forward, for the "check the order" narration. Bounded. */
function walk(m) {
  const out = [];
  let cur = m.head, guard = 0;
  while (cur != null && guard++ < 8) { out.push(m[cur].value); cur = m[cur].link; }
  return out;
}

function arrows(m) {
  const out = [];
  // Each node's link_pt -> the node it points at, but ONLY when it holds a real id.
  // An indeterminate (undefined) or nil (null) link_pt points at nothing: no arrow.
  for (const id of nodeIds(m)) {
    if (typeof m[id].link === 'string')
      out.push({ from: `list.${id}.link_pt`, to: `list.${m[id].link}`, bend: 'up' });
  }
  // Each pointer variable's cell -> the node it points at, when it holds an id.
  out.push({ from: 'vars.head_pt', to: `list.${m.head}` });
  if (typeof m.ins   === 'string') out.push({ from: 'vars.ins_pt',   to: `list.${m.ins}` });
  if (typeof m.temp  === 'string') out.push({ from: 'vars.temp_pt',  to: `list.${m.temp}` });
  if (typeof m.trail === 'string') out.push({ from: 'vars.trail_pt', to: `list.${m.trail}` });
  return out;
}

/* A pointer-variable cell. `val` is a node id (points -> dot + arrow), null (nil ->
 * ∅ at normal weight, no arrow), or undefined (declared but unassigned -> the empty
 * placeholder X). `active` paints the blue activity fill the step it is written. */
function varCell(label, val, active) {
  if (val === undefined) return { label, value: '', anchor: label, role: 'empty' };
  return { label, value: val === null ? '∅' : '●', anchor: label, role: active ? 'active' : undefined };
}

/* One record node for the list panel. The new node's number field is indeterminate
 * (label undefined) until line 3, and its link_pt indeterminate until line 4 --
 * both drawn as the dashed X box. `fill` names the field being written THIS step,
 * which takes the blue activity fill. */
function nodeObj(m, id, fill) {
  const n = m[id];
  const label = id === 'n39'
    ? (m.numberWritten ? '39' : undefined)   // undefined -> indeterminate number field
    : String(n.value);
  return {
    id,
    label,
    fields: ['value', 'link_pt'],            // [ number | link_pt ] -- singly linked
    link_pt: n.link,                         // undefined -> dashed X, null -> ∅, id -> ●
    slot: n.slot, row: n.row,
    // OUTLINE = membership: node 39 is 'unlinked' (amber) until the insertion is
    // complete, then 'member' (green) on line 13. FILL = activity, at FIELD level.
    state: (id === 'n39' && !memberIns(m)) ? 'unlinked' : 'member',
    activeFields: fill && fill.node === id ? fill.fields : undefined,
  };
}

/* Call-frame builders (immutable). `call` on a caller frame is the call-site line
 * the code panel dims while a callee runs (the parked caller line). */
const mainF = (call) => ({ fn: 'main', vars: [], call });
const insAF = (valueActive) => ({
  fn: 'insertAlpha',
  vars: [{ name: 'value', value: '39', role: valueActive ? 'active' : undefined }],
});

function snap(m, { line, tag, narrate, note, frames, fill = null, activeVar = null }) {
  const parked = frames.slice(0, -1).map(f => f.call).filter(Boolean);
  return {
    tag, narrate, line, note, parked,
    arrows: arrows(m),
    panels: {
      list: {
        layout: 'linear', template: 'record',
        nodes: nodeIds(m).map(id => nodeObj(m, id, fill)),
        edges: [],
      },
      calls: {
        frames: frames.map((f, idx) => ({ fn: f.fn, vars: f.vars, active: idx === frames.length - 1 })),
      },
      vars: {
        render: 'row',
        cells: [
          varCell('head_pt',  m.head,  activeVar === 'head_pt'),
          varCell('ins_pt',   m.ins,   activeVar === 'ins_pt'),
          varCell('temp_pt',  m.temp,  activeVar === 'temp_pt'),
          varCell('trail_pt', m.trail, activeVar === 'trail_pt'),
        ],
      },
    },
  };
}

/* --- Notes (AUTHORING.md "Steps vs. notes"): setup, the allocation, the parameter
 * copy, nil-vs-unset, the walk's why, the order pitfall, THE TRAP, the two golden
 * rules, the read-back, and the closing challenge with the link forward to A10. --- */

const SETUP =
  'A sorted singly linked list — 12, 37, 99 — and the value 39 to insert so it stays ' +
  'in order. The value comes in as insertAlpha’s parameter; the node to hold it does ' +
  'not exist yet. The work is finding WHERE 39 goes, and being able to change the ' +
  'right link once you are there.';

const ALLOC =
  'A freshly allocated record holds nothing meaningful. Its number and link_pt fields ' +
  'are indeterminate — the dashed boxes — until the next two lines write them. ins_pt ' +
  'points at this node, but nothing in the list does, so it is not part of the list yet.';

const COPY =
  '39 is not conjured here — it is the parameter value, bound when main called ' +
  'insertAlpha(39), copied out of the frame into the node. Watch value in the frame ' +
  'and the number field light together: one value, one movement.';

const NIL_VS_UNSET =
  'An unset pointer and a nil pointer are different things. A moment ago link_pt was ' +
  'indeterminate — allocated, never written. Now it holds nil: a real, definite value ' +
  'meaning “points at nothing.” The crossed box is that nil, not an absence.';

const WHY_TRAIL =
  'temp_pt walks the list. trail_pt follows exactly one node behind, and the reason ' +
  'will be obvious in about six steps.';

const ORDER_PITFALL =
  'The order of these two lines is the whole trick. trail_pt copies temp_pt before ' +
  'temp_pt moves — that is the second golden rule at work: if you want to point at ' +
  'some node and are not sure how, find a pointer already pointing at it and copy it. ' +
  'Swap these two lines and trail_pt would follow temp_pt to the same node instead of ' +
  'trailing it.';

const TRAP =
  'Look where temp_pt is: on 99, the first node bigger than 39. That is the node 39 ' +
  'must come BEFORE — so the node whose link_pt has to change is 37, one step back. ' +
  'And a singly linked list has no way back. Every node points forward and only forward; ' +
  'from 99 there is no route to 37. If temp_pt were your only pointer you would be stuck ' +
  'here, one node past everything you need. Now look at trail_pt: it is sitting on 37. ' +
  'That is what it has been for.';

const GOLDEN_NIL =
  'First golden rule: overwrite pointers where you could do the least damage — nil ' +
  'pointers. ins_pt^.link_pt is nil right now, so writing to it can destroy nothing. ' +
  'Being honest about this one: here you could do the two lines in either order and get ' +
  'away with it, because temp_pt is still holding 99. The rule earns itself when you have ' +
  'NOT kept a pointer to what comes next — write trail_pt^.link_pt first without it, ' +
  'and 99, and everything after it, is unreachable the instant you do.';

const READ_BACK =
  'Follow it from head_pt and check: 12, then 37, then 39, then 99, then nil. In order, ' +
  'and nothing was moved — only two pointers changed.';

const CLOSING = [
  'Notice what the walk cost. Nothing was copied and nothing shifted — compare that ' +
  'with an array, where inserting in the middle means moving every element after it. ' +
  'That is what the list buys, and the price is the walk and the extra pointer in every ' +
  'node. Two things worth working out for yourself. What happens if the new value ' +
  'belongs FIRST — say you insert 5 into this list? The walk stops immediately, ' +
  'trail_pt is still nil, and line 13 dereferences it. Trace what your program does. ' +
  'That case needs its own branch, and it is the one people forget. And the trailing ' +
  'pointer is clumsy — carrying a second pointer only so you can see one node ' +
  'backwards. It would be much nicer to have direct access to the previous node. ',
  { href: 'lists-doubly-insert-order.html',
    text: 'The next lecture’s answer: a list that points both ways' },
];

function* trace() {
  const m = fresh();

  // Step 0 (required): initial state, nothing executed. The sorted list 12 -> 37 ->
  // 99; no ins node yet (new(ins_pt) allocates it on line 2); temp_pt/trail_pt/
  // ins_pt are placeholders. Only main is on the call stack.
  yield snap(m, {
    line: null, tag: 'init', frames: [mainF()],
    narrate: 'A sorted list, and a value — 39 — to insert so it stays in order.',
    note: SETUP,
  });

  // Line 16 -- main calls insertAlpha(39). main is the running frame; the callee is
  // pushed on the next step, when control enters its body (the A1 call convention).
  yield snap(m, {
    line: 16, tag: 'call', frames: [mainF()],
    narrate: 'main calls insertAlpha(39). Control enters insertAlpha next.',
  });

  // Line 2 -- new(ins_pt). The node is allocated and appears (amber), its number and
  // link_pt fields INDETERMINATE (dashed X). insertAlpha's frame is pushed, already
  // binding value = 39; main's call line 16 is now parked (dimmed).
  m.alloc = true; m.ins = 'n39';
  yield snap(m, {
    line: 2, tag: 'alloc', frames: [mainF(16), insAF()], activeVar: 'ins_pt',
    narrate: 'new(ins_pt) allocates a node and ins_pt points at it. Its number and link_pt fields hold nothing meaningful yet.',
    note: ALLOC,
  });

  // Line 3 -- ins_pt^.number = value. Copy the bound parameter (39) into the number
  // field: value in the frame and the number cell take the blue fill together.
  m.numberWritten = true;
  yield snap(m, {
    line: 3, tag: 'assign', frames: [mainF(16), insAF(true)], fill: { node: 'n39', fields: ['value'] },
    narrate: 'ins_pt^.number = value copies the bound parameter — 39 — into the new node’s number field.',
    note: COPY,
  });

  // Line 4 -- ins_pt^.link_pt = nil. The link goes from indeterminate to nil (∅).
  m.n39.link = null;
  yield snap(m, {
    line: 4, tag: 'assign', frames: [mainF(16), insAF()], fill: { node: 'n39', fields: ['link_pt'] },
    narrate: 'ins_pt^.link_pt = nil — the link goes from indeterminate to nil, pointing at nothing.',
    note: NIL_VS_UNSET,
  });

  // Lines 6-7 -- start the walk.
  m.temp = m.head;
  yield snap(m, {
    line: 6, tag: 'assign', frames: [mainF(16), insAF()], activeVar: 'temp_pt',
    narrate: 'temp_pt now points where head_pt points — to 12, the first node.',
  });
  m.trail = null;
  yield snap(m, {
    line: 7, tag: 'assign', frames: [mainF(16), insAF()], activeVar: 'trail_pt',
    narrate: 'trail_pt starts as nil, because at the first node there is nothing behind it.',
    note: WHY_TRAIL,
  });

  // The walk: test, then trail_pt = temp_pt, then temp_pt = temp_pt^.link_pt, until
  // temp_pt lands on the first node NOT less than 39.
  // Iteration 1 -- temp_pt on 12.
  yield snap(m, {
    line: 8, tag: 'test', frames: [mainF(16), insAF()],
    narrate: '12 is less than 39, so 39 goes somewhere after it. Keep walking.',
  });
  m.trail = m.temp;
  yield snap(m, {
    line: 9, tag: 'assign', frames: [mainF(16), insAF()], activeVar: 'trail_pt',
    narrate: 'trail_pt takes temp_pt’s place FIRST, while temp_pt is still here.',
    note: ORDER_PITFALL,
  });
  m.temp = m[m.temp].link;   // -> 37
  yield snap(m, {
    line: 10, tag: 'assign', frames: [mainF(16), insAF()], activeVar: 'temp_pt',
    narrate: 'temp_pt now points where temp_pt^.link_pt points — to 37. trail_pt stays on 12.',
  });

  // Iteration 2 -- temp_pt on 37.
  yield snap(m, {
    line: 8, tag: 'test', frames: [mainF(16), insAF()],
    narrate: '37 is less than 39, so 39 goes somewhere after it. Keep walking.',
  });
  m.trail = m.temp;
  yield snap(m, {
    line: 9, tag: 'assign', frames: [mainF(16), insAF()], activeVar: 'trail_pt',
    narrate: 'trail_pt takes temp_pt’s place again, moving up to 37.',
  });
  m.temp = m[m.temp].link;   // -> 99
  yield snap(m, {
    line: 10, tag: 'assign', frames: [mainF(16), insAF()], activeVar: 'temp_pt',
    narrate: 'temp_pt follows its link_pt to 99. trail_pt stays on 37.',
  });

  // Iteration 3 -- temp_pt on 99: the test fails, the walk stops one node too far.
  yield snap(m, {
    line: 8, tag: 'test', frames: [mainF(16), insAF()],
    narrate: '99 is NOT less than 39. The walk stops here.',
    note: TRAP,
  });

  // Line 12 -- ins_pt^.link_pt = temp_pt. 39's link swings to 99. Reachable forward
  // but NOT yet a member (37 still points past it), so it stays amber.
  m.n39.link = m.temp;
  yield snap(m, {
    line: 12, tag: 'assign', frames: [mainF(16), insAF()], fill: { node: 'n39', fields: ['link_pt'] },
    narrate: 'ins_pt^.link_pt takes temp_pt’s value, so 39 now points at 99.',
    note: GOLDEN_NIL,
  });

  // Line 13 -- trail_pt^.link_pt = ins_pt. 37's link swings from 99 to 39; both of
  // 39's membership conditions now hold, so it turns from amber to a green member.
  m[m.trail].link = m.ins;
  yield snap(m, {
    line: 13, tag: 'assign', frames: [mainF(16), insAF()], fill: { node: 'n37', fields: ['link_pt'] },
    narrate: 'trail_pt^.link_pt now points at 39. The list is 12, 37, 39, 99.',
    note: READ_BACK,
  });

  // Final step -- control returns to main; insertAlpha's frame pops. The call site
  // (line 16) is the active line again; nothing else executes. The closing challenge
  // and the link to A10 live here.
  void walk(m);
  yield snap(m, {
    line: 16, tag: 'return', frames: [mainF()],
    narrate: 'Back in main: insertAlpha(39) has returned. One insertion, two pointer ' +
             'assignments, and a walk to find where.',
    note: CLOSING,
  });
}

export default {
  title: 'Inserting in order',
  subtitle: 'Finding the spot is the hard part',
  profile: 'standard',
  columns: 2,
  languages: ['pseudo', 'java', 'cpp'],

  panels: [
    { type: 'code',      id: 'code',  title: 'insertAlpha(value)',
      listings: LISTINGS, labels: { pseudo: 'pseudocode', java: 'Java', cpp: 'C++' } },
    { type: 'nodes',     id: 'list',  title: 'The list', structure: true },
    { type: 'callstack', id: 'calls', title: 'Function calls' },
    { type: 'cells',     id: 'vars',  title: 'Pointer variables', compact: true },
  ],

  initialTrace: 'correct',
  traces: {
    correct: trace,
  },
};
