/* ds — A8 "Collision strategies in a hash table"
 *
 * One hash table, size 7, the lecture's own hash: H = (sum of letter values) mod 7,
 * with A=1, B=2, C=3. Five keys, all colliding hard: AAB->4, AA->2, C->3, BB->4,
 * B->2. Three phases, in one continuous trace driven by a menu-style main(), each
 * phase boundary sitting on a real clear() call:
 *
 *   1. LINEAR PROBING — a collision walks upward to the next free cell. FIND B then
 *      has to step past four stored keys before it reaches B. The readout counts them.
 *   2. COALESCED CHAINING — the SAME five keys, but every cell also carries a `next`
 *      link, so FIND B follows one link instead of walking four cells. The readout
 *      counts one skip, not four. The point: the saving is on the SEARCH; placing B
 *      still cost the same walk.
 *   3. THE DELETION TRAP — back on the probing table, delete AAB (its home cell 4
 *      empties), then FIND BB. BB hashes to 4, finds cell 4 empty, and reports NOT
 *      FOUND — even though BB is sitting in plain sight at cell 5. The trace ends on
 *      that failure, with no repair: implementing delete is the assignment.
 *
 * The two totals stay on screen together at the end (4 and 1), side by side, because
 * Engine.metrics() counts tags cumulatively from step 0 and is never reset — the
 * racebubsel two-tag pattern inside one animation. Only FIND steps tag a skip:
 * `probeSkip` in phase 1, `chainSkip` in phase 2. INSERT probes test OCCUPANCY, not
 * key equality, so they tag nothing.
 *
 * PANELS: the CODE listing; the hash table as a vertical CELLS column ([0] at the
 * bottom, the probe cursor `i` walking upward); a SECOND vertical column, `next`,
 * aligned row-for-row and present from step 0 (em dashes while probing, the links
 * once chaining begins); and Function calls (main -> the operation frame). WATCH
 * only: one trace, no gates; every insight is narration and notes. */

const N = 7;

/* One listing, three ds languages, line-aligned to a single 69-line grid so `line`
 * is a plain number that resolves the same in every language. hash() and value() are
 * never stepped into -- their result is narrated at the call site, exactly as
 * stacks-paren-scanner treats matches() -- so Function calls stays main -> the
 * operation, never a hash frame. */
const LISTINGS = {
  pseudo: [
    'hash(key)                              // A=1  B=2  C=3',   //  1
    '    sum = 0',                                              //  2
    '    for each letter in key',                              //  3
    '        sum = sum + value(letter)',                       //  4
    '    return sum mod 7',                                    //  5
    '',                                                        //  6
    'insertProbe(key)                       // linear probing', //  7
    '    i = hash(key)',                                       //  8
    '    while table[i] is occupied',                          //  9
    '        i = (i + 1) mod 7',                               // 10
    '    table[i] = key',                                      // 11
    '',                                                        // 12
    'findProbe(key)                         // linear probing', // 13
    '    i = hash(key)',                                       // 14
    '    while table[i] is occupied',                          // 15
    '        if table[i] = key',                               // 16
    '            return "found at " + i',                      // 17
    '        i = (i + 1) mod 7',                               // 18
    '    return "not found"',                                  // 19
    '',                                                        // 20
    'delete(key)                            // probing table',  // 21
    '    i = hash(key)',                                       // 22
    '    while table[i] is occupied',                          // 23
    '        if table[i] = key',                               // 24
    '            table[i] = empty',                            // 25
    '            return',                                      // 26
    '        i = (i + 1) mod 7',                               // 27
    '    report("not found")',                                 // 28
    '',                                                        // 29
    'insertChain(key)                       // coalesced chaining', // 30
    '    i = hash(key)',                                       // 31
    '    if table[i] is empty',                                // 32
    '        table[i] = key,  next[i] = 0',                    // 33
    '        return',                                          // 34
    '    while next[i] != 0',                                  // 35
    '        i = next[i]',                                     // 36
    '    f = first empty cell above i',                        // 37
    '    table[f] = key,  next[f] = 0',                        // 38
    '    next[i] = f',                                         // 39
    '',                                                        // 40
    'findChain(key)                         // coalesced chaining', // 41
    '    i = hash(key)',                                       // 42
    '    while table[i] is occupied',                          // 43
    '        if table[i] = key',                               // 44
    '            return "found at " + i',                      // 45
    '        if next[i] = 0',                                  // 46
    '            return "not found"',                          // 47
    '        i = next[i]',                                     // 48
    '    return "not found"',                                  // 49
    '',                                                        // 50
    'clear()                                // start a fresh table', // 51
    '    empty every cell,  set every next = 0',               // 52
    '',                                                        // 53
    'main()',                                                  // 54
    '    // 1 - linear probing',                               // 55
    '    insertProbe("AAB");  insertProbe("AA");  insertProbe("C")', // 56
    '    insertProbe("BB");   insertProbe("B")',               // 57
    '    findProbe("B")',                                      // 58
    '    clear()',                                             // 59
    '    // 2 - coalesced chaining',                           // 60
    '    insertChain("AAB");  insertChain("AA");  insertChain("C")', // 61
    '    insertChain("BB");   insertChain("B")',               // 62
    '    findChain("B")',                                      // 63
    '    clear()',                                             // 64
    '    // 3 - delete, then search a displaced key',          // 65
    '    insertProbe("AAB");  insertProbe("AA");  insertProbe("C")', // 66
    '    insertProbe("BB");   insertProbe("B")',               // 67
    '    delete("AAB")',                                       // 68
    '    findProbe("BB")',                                     // 69
  ],
  java: [
    'int hash(String key) {                 // A=1  B=2  C=3',  //  1
    '    int sum = 0;',                                         //  2
    '    for (char letter : key.toCharArray())',               //  3
    '        sum += value(letter);',                            //  4
    '    return sum % 7; }',                                    //  5
    '',                                                         //  6
    'void insertProbe(String key) {         // linear probing', //  7
    '    int i = hash(key);',                                   //  8
    '    while (table[i] != null)',                             //  9
    '        i = (i + 1) % 7;',                                 // 10
    '    table[i] = key; }',                                    // 11
    '',                                                         // 12
    'String findProbe(String key) {         // linear probing', // 13
    '    int i = hash(key);',                                   // 14
    '    while (table[i] != null) {',                           // 15
    '        if (table[i].equals(key))',                        // 16
    '            return "found at " + i;',                      // 17
    '        i = (i + 1) % 7; }',                               // 18
    '    return "not found"; }',                                // 19
    '',                                                         // 20
    'void delete(String key) {              // probing table',  // 21
    '    int i = hash(key);',                                   // 22
    '    while (table[i] != null) {',                           // 23
    '        if (table[i].equals(key)) {',                      // 24
    '            table[i] = null;',                             // 25
    '            return; }',                                    // 26
    '        i = (i + 1) % 7; }',                               // 27
    '    print("not found"); }',                                // 28
    '',                                                         // 29
    'void insertChain(String key) {         // coalesced chaining', // 30
    '    int i = hash(key);',                                   // 31
    '    if (table[i] == null) {',                              // 32
    '        table[i] = key;  next[i] = 0;',                    // 33
    '        return; }',                                        // 34
    '    while (next[i] != 0)',                                 // 35
    '        i = next[i];',                                     // 36
    '    int f = firstEmptyAbove(i);',                          // 37
    '    table[f] = key;  next[f] = 0;',                        // 38
    '    next[i] = f; }',                                       // 39
    '',                                                         // 40
    'String findChain(String key) {         // coalesced chaining', // 41
    '    int i = hash(key);',                                   // 42
    '    while (table[i] != null) {',                           // 43
    '        if (table[i].equals(key))',                        // 44
    '            return "found at " + i;',                      // 45
    '        if (next[i] == 0)',                                // 46
    '            return "not found";',                          // 47
    '        i = next[i]; }',                                   // 48
    '    return "not found"; }',                                // 49
    '',                                                         // 50
    'void clear() {                         // start a fresh table', // 51
    '    emptyEveryCell();  setEveryNext(0); }',                // 52
    '',                                                         // 53
    'void main() {',                                            // 54
    '    // 1 - linear probing',                                // 55
    '    insertProbe("AAB");  insertProbe("AA");  insertProbe("C");', // 56
    '    insertProbe("BB");   insertProbe("B");',               // 57
    '    findProbe("B");',                                      // 58
    '    clear();',                                             // 59
    '    // 2 - coalesced chaining',                            // 60
    '    insertChain("AAB");  insertChain("AA");  insertChain("C");', // 61
    '    insertChain("BB");   insertChain("B");',               // 62
    '    findChain("B");',                                      // 63
    '    clear();',                                             // 64
    '    // 3 - delete, then search a displaced key',           // 65
    '    insertProbe("AAB");  insertProbe("AA");  insertProbe("C");', // 66
    '    insertProbe("BB");   insertProbe("B");',               // 67
    '    delete("AAB");',                                       // 68
    '    findProbe("BB"); }',                                   // 69
  ],
  cpp: [
    'int hash(string key) {                 // A=1  B=2  C=3',  //  1
    '    int sum = 0;',                                         //  2
    '    for (char letter : key)',                             //  3
    '        sum += value(letter);',                            //  4
    '    return sum % 7; }',                                    //  5
    '',                                                         //  6
    'void insertProbe(string key) {         // linear probing', //  7
    '    int i = hash(key);',                                   //  8
    '    while (!table[i].empty())',                            //  9
    '        i = (i + 1) % 7;',                                 // 10
    '    table[i] = key; }',                                    // 11
    '',                                                         // 12
    'string findProbe(string key) {         // linear probing', // 13
    '    int i = hash(key);',                                   // 14
    '    while (!table[i].empty()) {',                          // 15
    '        if (table[i] == key)',                             // 16
    '            return "found at " + i;',                      // 17
    '        i = (i + 1) % 7; }',                               // 18
    '    return "not found"; }',                                // 19
    '',                                                         // 20
    'void erase(string key) {               // probing table',  // 21
    '    int i = hash(key);',                                   // 22
    '    while (!table[i].empty()) {',                          // 23
    '        if (table[i] == key) {',                           // 24
    '            table[i] = "";',                               // 25
    '            return; }',                                    // 26
    '        i = (i + 1) % 7; }',                               // 27
    '    cout << "not found"; }',                               // 28
    '',                                                         // 29
    'void insertChain(string key) {         // coalesced chaining', // 30
    '    int i = hash(key);',                                   // 31
    '    if (table[i].empty()) {',                              // 32
    '        table[i] = key;  next[i] = 0;',                    // 33
    '        return; }',                                        // 34
    '    while (next[i] != 0)',                                 // 35
    '        i = next[i];',                                     // 36
    '    int f = firstEmptyAbove(i);',                          // 37
    '    table[f] = key;  next[f] = 0;',                        // 38
    '    next[i] = f; }',                                       // 39
    '',                                                         // 40
    'string findChain(string key) {         // coalesced chaining', // 41
    '    int i = hash(key);',                                   // 42
    '    while (!table[i].empty()) {',                          // 43
    '        if (table[i] == key)',                             // 44
    '            return "found at " + i;',                      // 45
    '        if (next[i] == 0)',                                // 46
    '            return "not found";',                          // 47
    '        i = next[i]; }',                                   // 48
    '    return "not found"; }',                                // 49
    '',                                                         // 50
    'void clear() {                         // start a fresh table', // 51
    '    emptyEveryCell();  setEveryNext(0); }',                // 52
    '',                                                         // 53
    'int main() {',                                             // 54
    '    // 1 - linear probing',                                // 55
    '    insertProbe("AAB");  insertProbe("AA");  insertProbe("C");', // 56
    '    insertProbe("BB");   insertProbe("B");',               // 57
    '    findProbe("B");',                                      // 58
    '    clear();',                                             // 59
    '    // 2 - coalesced chaining',                            // 60
    '    insertChain("AAB");  insertChain("AA");  insertChain("C");', // 61
    '    insertChain("BB");   insertChain("B");',               // 62
    '    findChain("B");',                                      // 63
    '    clear();',                                             // 64
    '    // 3 - delete, then search a displaced key',           // 65
    '    insertProbe("AAB");  insertProbe("AA");  insertProbe("C");', // 66
    '    insertProbe("BB");   insertProbe("B");',               // 67
    '    erase("AAB");',                                        // 68
    '    findProbe("BB"); }',                                   // 69
  ],
};

/* ---- teaching notes ---- */
const SETUP_NOTE =
  'The hash of a key is the sum of its letter values, mod the table size 7 — with A=1, B=2, C=3. So ' +
  'AAB is 1+1+2 = 4, AA is 2, C is 3, BB is 4, B is 2. Five keys, and only three home cells between them: ' +
  'they collide. A collision strategy is the rule for what to do when the home cell is already taken. The ' +
  'second column, next, is empty for now — it belongs to the second strategy, and it is here from the start ' +
  'on purpose.';

const FIND1_NOTE =
  'B was found — but look what it cost. Its home is cell 2, and cells 2, 3, 4, 5 were all occupied by other ' +
  'keys, so the search stepped past four of them before reaching B at cell 6. The readout counts those four. ' +
  'That is the price of linear probing: a run of collisions turns every later search into a walk.';

const PHASE2_BOUNDARY_NOTE =
  'Same table, same seven cells, same five keys — but now every cell also carries a next link. The next ' +
  'column was there all along, sitting empty through the whole first phase. That is the space you pay to buy ' +
  'the time: one extra number per cell, spent up front, to make the searches short.';

const CHAIN_NOTE =
  'A collision no longer walks to the next free cell blindly. It follows the chain from the home cell to its ' +
  'end, drops the new key in the first free cell above, and links the two with next. The key still lands in ' +
  'a probed cell — placing it costs the same walk as before.';

const FIND2_NOTE =
  'One key skipped, not four. FIND B went to its home cell 2, saw AA, and followed AA’s next link straight ' +
  'to cell 6 — one hop instead of a four-cell walk. Compare the two readouts: 4 versus 1. The saving is on ' +
  'the SEARCH, not the insertion: placing B still cost the same four probes either way. You spent one number ' +
  'per cell to turn a four-step search into a one-step one.';

const FINAL_NOTE = [
  'BB hashes to 4. Cell 4 is empty — AAB used to be there — so findProbe stops at the first empty cell and ' +
  'reports NOT FOUND, while BB is sitting in plain view at cell 5. Deleting AAB broke the probe chain that ' +
  'led to BB. This is why deletion is the hard part of the assignment: you cannot simply empty a cell, or ' +
  'every key that had to probe past it becomes unreachable. It is worse in coalesced chaining, where removing ' +
  'a cell in the middle of a chain orphans every item linked behind it. The repair is left to you — ds8 asks ' +
  'you to implement delete, and this failure is the reason it is not a one-liner. One more trap: next = 0 ' +
  'means “end of chain,” yet cell 0 is a real slot, so a key that lands in cell 0 makes the marker ' +
  'ambiguous — the very problem the queue solved with a sentinel that can never be a valid index. ',
  { href: 'queues-count-vs-rear.html', text: 'See the sentinel that cannot be a real index' },
];

function* trace() {
  let table = new Array(N).fill(null);      // the seven cells; null = empty
  let nxt   = new Array(N).fill(null);       // the next links; null = no link (em dash while probing)
  let mode  = 'probe';                        // 'probe' -> next shows em dashes; 'chain' -> next shows links
  let probe = -1;                            // the i cursor (marker on the table); -1 parks below cell [0]
  let curFn = null;                          // the running operation frame, or null (main only)
  let mainLine = 0;                          // main's call line, dimmed while an operation runs

  const VAL     = ch => ch.charCodeAt(0) - 64;                 // 'A' -> 1
  const sumExpr = key => [...key].map(VAL).join(' + ');
  const rawSum  = key => [...key].reduce((s, c) => s + VAL(c), 0);
  const H       = key => rawSum(key) % N;
  const hashNarr = key => {
    const parts = key.length > 1 ? `${sumExpr(key)} = ${rawSum(key)}` : `${rawSum(key)}`;
    return `hash("${key}") = ${parts}, and ${rawSum(key)} mod 7 = ${H(key)} — so i is ${H(key)}.`;
  };

  /* The hash table as the vertical column: cell [0] at the bottom, growing up. The
   * `i` cursor is a left-hand marker that parks below cell [0] when idle. A cell
   * being examined this step is `compared`; a cell written this step is `active`. */
  const tablePanel = (active, compared) => ({
    render: 'column',
    cells: table.map((v, i) => {
      if (v == null)      return { value: '', role: 'empty' };
      if (i === active)   return { value: v, role: 'active' };
      if (i === compared) return { value: v, role: 'compared' };
      return { value: v };
    }),
    markers: [{ label: 'i', index: probe }],
  });

  /* The next column, aligned row-for-row with the table. While probing it is inert:
   * every cell an em dash, `stale`. While chaining each occupied cell shows its link
   * (0 = end of chain); an empty cell has no link, so it stays an em dash. */
  const nextPanel = active => ({
    render: 'column',
    cells: nxt.map((v, i) => {
      if (mode === 'probe' || table[i] == null) return { value: '—', role: 'stale' };
      const s = String(v == null ? 0 : v);
      return i === active ? { value: s, role: 'active' } : { value: s };
    }),
  });

  const buildFrames = () => curFn
    ? [{ fn: 'main', vars: [], active: false },
       { fn: curFn.fn, vars: [{ name: 'key', value: `"${curFn.key}"` }], active: true }]
    : [{ fn: 'main', vars: [], active: true }];

  const step = (line, tag, narrate, extra = {}) => ({
    line, tag, narrate, note: extra.note,
    parked: curFn ? [mainLine] : [],
    panels: {
      table:     tablePanel(extra.active ?? null, extra.compared ?? null),
      next:      nextPanel(extra.nextActive ?? null),
      callstack: { frames: buildFrames() },
    },
  });

  const enter = (mLine, fn, key) => { mainLine = mLine; curFn = { fn, key }; probe = H(key); };
  const leave = () => { curFn = null; probe = -1; };

  /* ---- linear probing INSERT (tags nothing: it tests occupancy, not equality) ---- */
  function* insertProbe(mLine, key, opts = {}) {
    enter(mLine, 'insertProbe', key);
    let i = H(key);
    yield step(8, 'hash', hashNarr(key));
    while (table[i] != null) {
      yield step(9, 'test', `cell ${i} is occupied by ${table[i]} — keep probing upward.`, { compared: i });
      i = (i + 1) % N; probe = i;
      yield step(10, 'probe', `i becomes ${i}.`);
    }
    yield step(9, 'test', `cell ${i} is empty — the loop stops. This is where ${key} lands.`);
    table[i] = key;
    yield step(11, 'place', `${key} is placed in cell ${i}.`, { active: i, note: opts.note });
    leave();
  }

  /* ---- linear probing FIND (each occupied non-match tags `probeSkip`) ---- */
  function* findProbe(mLine, key, opts = {}) {
    enter(mLine, 'findProbe', key);
    let i = H(key);
    yield step(14, 'hash', hashNarr(key));
    for (;;) {
      if (table[i] == null) {
        yield step(15, 'test', `cell ${i} is empty, so the probing search stops here and calls ${key} absent.`);
        yield step(19, 'notfound', 'the search returns "not found".', { note: opts.note });
        break;
      }
      yield step(15, 'test', `cell ${i} is occupied.`, { compared: i });
      if (table[i] === key) {
        yield step(16, 'test', `cell ${i} holds ${key} — a match.`, { compared: i });
        yield step(17, 'found', `${key} is found at cell ${i}.`, { compared: i, note: opts.note });
        break;
      }
      yield step(16, 'probeSkip', `cell ${i} holds ${table[i]}, not ${key} — skip it and keep looking.`, { compared: i });
      i = (i + 1) % N; probe = i;
      yield step(18, 'probe', `i becomes ${i}.`);
    }
    leave();
  }

  /* ---- probing DELETE (tags nothing) ---- */
  function* deleteProbe(mLine, key, opts = {}) {
    enter(mLine, 'delete', key);
    let i = H(key);
    yield step(22, 'hash', hashNarr(key));
    for (;;) {
      if (table[i] == null) {
        yield step(23, 'test', `cell ${i} is empty — ${key} is not here.`);
        yield step(28, 'notfound', 'nothing to delete.');
        break;
      }
      yield step(23, 'test', `cell ${i} is occupied.`, { compared: i });
      if (table[i] === key) {
        yield step(24, 'test', `cell ${i} holds ${key} — this is the one to remove.`, { compared: i });
        table[i] = null;
        yield step(25, 'delete', `cell ${i} is emptied.`, { active: i, note: opts.note });
        yield step(26, 'return', 'delete returns.');
        break;
      }
      yield step(24, 'test', `cell ${i} holds ${table[i]}, not ${key}.`, { compared: i });
      i = (i + 1) % N; probe = i;
      yield step(27, 'probe', `i becomes ${i}.`);
    }
    leave();
  }

  /* ---- coalesced chaining INSERT (tags nothing) ---- */
  function* insertChain(mLine, key, opts = {}) {
    enter(mLine, 'insertChain', key);
    let i = H(key);
    yield step(31, 'hash', hashNarr(key));
    if (table[i] == null) {
      yield step(32, 'test', `cell ${i} is empty — ${key} goes straight to its home cell.`, { compared: i });
      table[i] = key; nxt[i] = 0;
      yield step(33, 'place', `${key} is placed in cell ${i}, and its next is 0 — end of chain.`, { active: i, nextActive: i });
      yield step(34, 'return', 'insertChain returns.');
      leave();
      return;
    }
    yield step(32, 'test', `cell ${i} is occupied by ${table[i]} — a collision, so follow its chain.`, { compared: i });
    while (nxt[i] !== 0) {
      yield step(35, 'test', `next of cell ${i} is ${nxt[i]}, not 0 — follow the link.`, { compared: i });
      i = nxt[i]; probe = i;
      yield step(36, 'follow', `i becomes ${i}.`);
    }
    yield step(35, 'test', `next of cell ${i} is 0 — the end of the chain.`, { compared: i });
    let f = i + 1; while (table[f] != null) f++;
    yield step(37, 'free', `the first empty cell above cell ${i} is cell ${f}.`, { compared: f });
    table[f] = key; nxt[f] = 0;
    yield step(38, 'place', `${key} is placed in cell ${f}, its own next 0.`, { active: f, nextActive: f });
    nxt[i] = f;
    yield step(39, 'link', `cell ${i}'s next is set to ${f} — the chain now runs ${i} → ${f}.`, { active: i, nextActive: i, note: opts.note });
    leave();
  }

  /* ---- coalesced chaining FIND (each occupied non-match tags `chainSkip`) ---- */
  function* findChain(mLine, key, opts = {}) {
    enter(mLine, 'findChain', key);
    let i = H(key);
    yield step(42, 'hash', hashNarr(key));
    for (;;) {
      if (table[i] == null) {
        yield step(43, 'test', `cell ${i} is empty — ${key} is not in the table.`, { note: opts.note });
        yield step(49, 'notfound', 'the search returns "not found".');
        break;
      }
      yield step(43, 'test', `cell ${i} is occupied.`, { compared: i });
      if (table[i] === key) {
        yield step(44, 'test', `cell ${i} holds ${key} — a match.`, { compared: i });
        yield step(45, 'found', `${key} is found at cell ${i}.`, { compared: i, note: opts.note });
        break;
      }
      yield step(44, 'chainSkip', `cell ${i} holds ${table[i]}, not ${key} — skip it and follow the link.`, { compared: i });
      yield step(46, 'test', `next of cell ${i} is ${nxt[i]} — follow it.`, { compared: i });
      i = nxt[i]; probe = i;
      yield step(48, 'follow', `i becomes ${i}.`);
    }
    leave();
  }

  /* ---- clear(): the phase boundary, on a real executed line ---- */
  function* clearOp(mLine, newMode, note) {
    mainLine = mLine; curFn = null; probe = -1;
    table.fill(null); nxt.fill(null);
    mode = newMode;
    const tail = newMode === 'chain'
      ? ' The table is empty and every next is 0 — the next column wakes up now.'
      : ' Back to a plain probing table; the next column goes quiet again.';
    yield step(mLine, 'clear', `main calls clear — every cell is emptied.${tail}`, { note });
  }

  /* ================= STEP 0 — the empty table, nothing executed ============ */
  yield step(null, 'init',
    'An empty hash table, seven cells, cell [0] at the bottom. The i cursor is parked below [0] — no operation ' +
    'is running yet. The next column is present but idle.',
    { note: SETUP_NOTE });

  /* ================= PHASE 1 — linear probing ============================== */
  yield* insertProbe(56, 'AAB');
  yield* insertProbe(56, 'AA');
  yield* insertProbe(56, 'C');
  yield* insertProbe(57, 'BB');
  yield* insertProbe(57, 'B');
  yield* findProbe(58, 'B', { note: FIND1_NOTE });        // four probeSkip -> readout 4

  /* ================= PHASE 2 — coalesced chaining ========================== */
  yield* clearOp(59, 'chain', PHASE2_BOUNDARY_NOTE);
  yield* insertChain(61, 'AAB');
  yield* insertChain(61, 'AA');
  yield* insertChain(61, 'C');
  yield* insertChain(62, 'BB', { note: CHAIN_NOTE });
  yield* insertChain(62, 'B');
  yield* findChain(63, 'B', { note: FIND2_NOTE });        // one chainSkip -> readout 1

  /* ================= PHASE 3 — the deletion trap =========================== */
  yield* clearOp(64, 'probe', null);
  yield* insertProbe(66, 'AAB');
  yield* insertProbe(66, 'AA');
  yield* insertProbe(66, 'C');
  yield* insertProbe(67, 'BB');
  yield* insertProbe(67, 'B');
  yield* deleteProbe(68, 'AAB');
  yield* findProbe(69, 'BB', { note: FINAL_NOTE });       // END: reports NOT FOUND while BB sits at cell 5
}

export default {
  title: 'Collision strategies in a hash table',
  subtitle: 'Linear probing, coalesced chaining, and the deletion trap',
  profile: 'standard',
  columns: 2,
  languages: ['pseudo', 'java', 'cpp'],

  // Two cumulative counters, never reset (racebubsel two-tag pattern): the probing
  // search skipped four stored keys, the chaining search one, and both totals stay on
  // screen together at the end so 4 and 1 sit side by side.
  metrics: {
    probeSkip: 'keys skipped — probing',
    chainSkip: 'keys skipped — chaining',
  },

  // The code listing anchors the left column; the two vertical structure panels -- the
  // hash table and its next column -- sit side by side in the capped region of the
  // right column; Function calls flows below. PR #38 reserves every cell's size from
  // the whole trace, so the two columns align row-for-row with no special handling.
  panels: [
    { type: 'code',      id: 'code',      title: 'a hash table with collisions',
      listings: LISTINGS, labels: { pseudo: 'pseudocode', java: 'Java', cpp: 'C++' } },
    { type: 'cells',     id: 'table',     title: 'Hash table', structure: true },
    { type: 'cells',     id: 'next',      title: 'next',       structure: true },
    { type: 'callstack', id: 'callstack', title: 'Function calls' },
  ],

  initialTrace: 'run',
  traces: {
    run: trace,
  },
};
