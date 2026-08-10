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
 * overlay -- minus the backward prev links (this list points forward only). Every
 * arrow on screen is data resolved against a live DOM box; nothing is hand-placed.
 * A nil link_pt renders as the crossed box (the record renderer's ∅). */

const VALUE = 39;
const HEAD  = 'n12';

/* One listing, ds language tabs: pseudocode (default), Java, C++. The three are
 * kept line-aligned so a single `line` number addresses all of them; pseudocode
 * uses the CARET for dereference (AUTHORING.md item 82 / notation rule). Line 13
 * as written crashes when the new value sorts first (trail_pt is still nil) -- that
 * bug is the lecture's, deliberately NOT hidden; it is the challenge in the closing
 * note. Referenced lines: 2,3,4,6,7,8,9,10,12,13,16. Blank lines 5/11/14 and the
 * headers 1/15 are never highlighted. */
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

/* The list nodes, plus the new node held by ins_pt. link_pt is an id or null; a
 * null link renders as the crossed box. The three list nodes sit on the main row
 * (row 0); the new node 39 sits BELOW it (row 1), off the list line, between the
 * 37 and 99 slots -- exactly as A10 places its node 25 off the main row. */
function fresh() {
  return {
    head: HEAD, ins: 'n39',
    temp: undefined,          // declared, unassigned -> placeholder (line 6 sets it)
    trail: undefined,         // declared, unassigned -> placeholder (line 7 sets it)
    n12: { value: 12, link: 'n37', slot: 0,    row: 0 },
    n37: { value: 37, link: 'n99', slot: 1,    row: 0 },
    n99: { value: 99, link: null,  slot: 2,    row: 0 },
    n39: { value: 39, link: null,  slot: 1.55, row: 1 },
  };
}

const NODE_IDS = ['n12', 'n37', 'n99', 'n39'];

/** The inserted node is a full MEMBER only when the insertion is COMPLETE: its own
 *  link_pt is set AND some list node's link_pt points back at it. Until then it is
 *  'unlinked' (amber outline). After line 12 (ins_pt^.link_pt = temp_pt) it points
 *  at 99 but 37 still points past it, so it is reachable-forward yet not a member;
 *  line 13 (trail_pt^.link_pt = ins_pt) makes 37 point at it and it turns green. */
function memberIns(m) {
  if (m[m.ins].link == null) return false;
  return NODE_IDS.some(id => id !== m.ins && m[id].link === m.ins);
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
  // Each node's link_pt -> the node it points at. All forward, so all bow ABOVE
  // the row (bend 'up'); the cross-row links to/from node 39 curve naturally.
  for (const id of NODE_IDS) {
    const link = m[id].link;
    if (link != null) out.push({ from: `list.${id}.link_pt`, to: `list.${link}`, bend: 'up' });
  }
  // Each pointer variable's cell -> the node it points at. A placeholder (undefined)
  // or a nil (null) pointer draws no arrow -- it points at nothing.
  out.push({ from: 'vars.head_pt', to: `list.${m.head}` });
  out.push({ from: 'vars.ins_pt',  to: `list.${m.ins}` });
  if (typeof m.temp === 'string')  out.push({ from: 'vars.temp_pt',  to: `list.${m.temp}` });
  if (typeof m.trail === 'string') out.push({ from: 'vars.trail_pt', to: `list.${m.trail}` });
  return out;
}

/* A pointer-variable cell. `val` is a node id (points -> dot + arrow), null (nil ->
 * ∅ at normal weight, a real stored value, no arrow), or undefined (declared but
 * unassigned -> the empty placeholder X). `active` paints the blue activity fill on
 * the step the variable is written. Anchored on the dot so its arrow starts there. */
function varCell(label, val, active) {
  if (val === undefined)
    return { label, value: '', anchor: label, role: 'empty' };
  const value = val === null ? '∅' : '●';
  return { label, value, anchor: label, role: active ? 'active' : undefined };
}

function snap(m, { line, tag, narrate, note, touchedNode, activeVar }) {
  return {
    tag, narrate, line, note,
    arrows: arrows(m),
    panels: {
      list: {
        layout: 'linear', template: 'record',
        nodes: NODE_IDS.map(id => ({
          id,
          label: String(m[id].value),
          fields: ['value', 'link_pt'],   // [ number | link_pt ] -- singly linked
          link_pt: m[id].link,            // null -> the crossed box ∅
          slot: m[id].slot, row: m[id].row,
          // OUTLINE = membership: node 39 is 'unlinked' (amber) until the insertion
          // is complete, then 'member' (green) on line 13. The list nodes are always
          // members. FILL = activity: the node whose contents change THIS step.
          state:  (id === m.ins && !memberIns(m)) ? 'unlinked' : 'member',
          active: id === touchedNode,
        })),
        edges: [],
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

/* --- Notes: setup, the walk's why, the order pitfall, THE TRAP, the two golden
 * rules, the read-back, and the closing challenge with the link forward to A10.
 * Kept out of the step flow (AUTHORING.md "Steps vs. notes"). --- */

const SETUP =
  'The node is allocated and ins_pt points at it, but its link_pt is nil and nothing ' +
  'in the list points at it — it is not part of the list yet. 39 belongs between 37 ' +
  'and 99. The work is finding that out, and being able to do something about it once ' +
  'you have.';

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

  // Step 0 (required): the initial state, before anything executes. The sorted list
  // 12 -> 37 -> 99, node 39 allocated and held by ins_pt (amber, link_pt nil, off the
  // main row); temp_pt and trail_pt are placeholders. Only head_pt -> 12, the list's
  // own forward links, and ins_pt -> 39 are drawn -- no linking arrows join 39 in yet.
  yield snap(m, {
    line: null, tag: 'init',
    narrate: 'A sorted list, and a new node holding 39 to put into it.',
    note: SETUP,
  });

  // Lines 2-4 -- the allocation, brisk (A-model / pointers-address-model material).
  // The node is already shown from step 0 (the required "before" picture holds the
  // allocated node); these steps light it blue as each field is formally set.
  yield snap(m, {
    line: 2, tag: 'alloc', touchedNode: 'n39',
    narrate: 'new(ins_pt) allocates a node, and ins_pt points at it.',
  });
  yield snap(m, {
    line: 3, tag: 'alloc', touchedNode: 'n39',
    narrate: 'ins_pt^.number is set to 39, the value being inserted.',
  });
  yield snap(m, {
    line: 4, tag: 'alloc', touchedNode: 'n39',
    narrate: 'ins_pt^.link_pt is set to nil — the new node points at nothing yet.',
  });

  // Lines 6-7 -- start the walk.
  m.temp = m.head;
  yield snap(m, {
    line: 6, tag: 'assign', activeVar: 'temp_pt',
    narrate: 'temp_pt now points where head_pt points — to 12, the first node.',
  });
  m.trail = null;
  yield snap(m, {
    line: 7, tag: 'assign', activeVar: 'trail_pt',
    narrate: 'trail_pt starts as nil, because at the first node there is nothing behind it.',
    note: WHY_TRAIL,
  });

  // The walk: test, then trail_pt = temp_pt, then temp_pt = temp_pt^.link_pt, repeated
  // until temp_pt lands on the first node NOT less than 39.
  // Iteration 1 -- temp_pt on 12.
  yield snap(m, {
    line: 8, tag: 'test',
    narrate: '12 is less than 39, so 39 goes somewhere after it. Keep walking.',
  });
  m.trail = m.temp;   // trail_pt = temp_pt (copy BEFORE temp_pt moves)
  yield snap(m, {
    line: 9, tag: 'assign', activeVar: 'trail_pt',
    narrate: 'trail_pt takes temp_pt’s place FIRST, while temp_pt is still here.',
    note: ORDER_PITFALL,
  });
  m.temp = m[m.temp].link;   // temp_pt = temp_pt^.link_pt -> 37
  yield snap(m, {
    line: 10, tag: 'assign', activeVar: 'temp_pt',
    narrate: 'temp_pt now points where temp_pt^.link_pt points — to 37. trail_pt stays on 12.',
  });

  // Iteration 2 -- temp_pt on 37. Same pattern, one sentence each.
  yield snap(m, {
    line: 8, tag: 'test',
    narrate: '37 is less than 39, so 39 goes somewhere after it. Keep walking.',
  });
  m.trail = m.temp;
  yield snap(m, {
    line: 9, tag: 'assign', activeVar: 'trail_pt',
    narrate: 'trail_pt takes temp_pt’s place again, moving up to 37.',
  });
  m.temp = m[m.temp].link;   // -> 99
  yield snap(m, {
    line: 10, tag: 'assign', activeVar: 'temp_pt',
    narrate: 'temp_pt follows its link_pt to 99. trail_pt stays on 37.',
  });

  // Iteration 3 -- temp_pt on 99: the test fails and the walk stops one node too far.
  yield snap(m, {
    line: 8, tag: 'test',
    narrate: '99 is NOT less than 39. The walk stops here.',
    note: TRAP,
  });

  // Line 12 -- ins_pt^.link_pt = temp_pt. 39's link swings to 99. It is now reachable
  // forward but NOT yet a member (37 still points past it), so it stays amber.
  m[m.ins].link = m.temp;
  yield snap(m, {
    line: 12, tag: 'assign', touchedNode: 'n39',
    narrate: 'ins_pt^.link_pt takes temp_pt’s value, so 39 now points at 99.',
    note: GOLDEN_NIL,
  });

  // Line 13 -- trail_pt^.link_pt = ins_pt. 37's link swings from 99 to 39. Both of 39's
  // membership conditions now hold, so it turns from amber to a green member.
  m[m.trail].link = m.ins;
  yield snap(m, {
    line: 13, tag: 'assign', touchedNode: 'n37',
    narrate: 'trail_pt^.link_pt now points at 39. The list is 12, 37, 39, 99.',
    note: READ_BACK,
  });

  // Final step -- control returns to main; the call completed. Nothing more executes,
  // so this lands on the call site (line 16) rather than a lineless step (which is
  // legitimate only at step 0). The closing challenge and the link to A10 live here.
  void walk(m);   // final order is 12, 37, 39, 99
  yield snap(m, {
    line: 16, tag: 'return',
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
    { type: 'code',  id: 'code', title: 'insertAlpha(value)',
      listings: LISTINGS, labels: { pseudo: 'pseudocode', java: 'Java', cpp: 'C++' } },
    { type: 'nodes', id: 'list', title: 'The list', structure: true },
    { type: 'cells', id: 'vars', title: 'Pointer variables', compact: true },
  ],

  initialTrace: 'correct',
  traces: {
    correct: trace,
  },
};
