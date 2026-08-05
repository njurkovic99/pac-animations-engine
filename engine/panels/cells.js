/* CELLS panel — 1D/2D grid. Absorbs arrays, sorting bars, hash buckets,
 * matrices, memory blocks, variable tables, stack frames, vtables.
 * Step data: { render: 'box'|'bar'|'row'|'column', cells: [{value,label,role,anchor}] }
 *
 * A `box` grid may also carry index-pointer markers (AUTHORING.md "Planned
 * primitive — the index pointer"):
 *   { render: 'box', cells: [...], markers: [{label, index}], rowLabel? }
 * When `markers` is present each cell is rendered as a column — the box, its
 * bracketed index label beneath it ([0], [1], …; the cell's own `label`, or its
 * position), then a marker track holding any carets whose `index` points at this
 * cell. Each marker is a caret with its variable name LABELLED directly beneath
 * it. Two markers on the same cell sit side by side, neither overlapping the
 * other nor the neighbouring cells' labels.
 *
 * A marker whose `index` is negative (e.g. -1, "points at nothing yet") is
 * PARKED to the left of cell [0], dimmed, still showing its label — so it reads
 * as "not pointing at anything," not as missing. This is a general rule.
 *
 * `render: 'column'` is the VERTICAL analogue, for a stack (AUTHORING.md "The
 * one new capability"). Cell [0] is at the BOTTOM and the column grows UPWARD
 * (the pile-of-plates metaphor that makes LIFO intuitive). Bracketed index
 * labels sit to the RIGHT of the column in a fixed-WIDTH band; index-pointer
 * markers sit to the LEFT, each a right-pointing caret (▶) with its variable
 * name to the LEFT of the caret ("stack_ix ▶"). A marker at a negative sentinel
 * parks BELOW cell [0] (the vertical analogue of parking left of it), dimmed,
 * label still visible; leaving the sentinel is a purely VERTICAL move. The
 * parked lane is ALWAYS rendered so nothing shifts as the marker enters or
 * leaves it. Column width and row heights are fixed for every role — a member,
 * a stale cell, and an empty cell are the same size (master invariant).
 *
 * The bracketed index labels are a project-wide rule: `[0]` marks a cell's
 * position as an INDEX, not a value (a naked `1` under a cell holding `b` is the
 * index-vs-value confusion). An optional `rowLabel` names the row once, at the
 * left, so the array's name is present without repeating it under every cell.
 *
 * An optional per-cell `minCh` reserves a fixed minimum width (in `ch`), so a
 * cell whose value varies in length (e.g. an error name) never resizes the strip
 * as the value changes — the width analogue of the engine's reserved heights. */

const PLACEHOLDER = '—';   // em-dash: the value of indeterminate storage

export function mount(body) { body.innerHTML = '<div class="pac-cells"></div>'; }

export function render(body, data, ctx) {
  const wrap = body.querySelector('.pac-cells');
  const mode = data?.render ?? 'box';
  wrap.dataset.render = mode;
  wrap.innerHTML = '';
  // Vertical stack column — a distinct layout from the horizontal box/bar/row
  // modes, so it is rendered by its own path (see renderColumn below).
  if (mode === 'column') { renderColumn(wrap, data, ctx); return; }
  const cells = data?.cells ?? [];
  const max = Math.max(1, ...cells.map(c => +c.value || 0));

  // Marked mode: a `box` grid with index-pointer markers below the cell row.
  const markers = mode === 'box' && data?.markers ? data.markers : null;
  if (markers) { wrap.dataset.marked = ''; } else { delete wrap.dataset.marked; }
  // The marker LANE has one fixed ROW per declared marker, in a stable order, and
  // markers on the same (or adjacent) cell STACK VERTICALLY rather than sitting
  // side by side (AUTHORING.md "The index pointer" — this supersedes the old
  // side-by-side rule, written when two markers was the maximum). Two consequences
  // that kill a whole class of jitter: a marker always occupies the SAME row for
  // the entire animation (whether or not others share its cell), and — crucially —
  // CELL SPACING NO LONGER DEPENDS ON MARKER COUNT, because each row holds at most
  // one caret under its cell. `order` is the fixed row assignment: the labels in
  // the order they first appear across the whole trace. `curr` is this step's
  // label -> index. (Fixes A7 item 53.)
  const order = markers ? markerOrder(ctx) : null;
  const curr = {};
  if (markers) for (const m of markers) curr[m.label] = m.index;

  // A row label names the whole row once, to the LEFT of the cells (marked mode).
  if (markers && data.rowLabel) {
    const name = document.createElement('div');
    name.className = 'pac-cells-name';
    name.textContent = data.rowLabel;
    wrap.appendChild(name);
  }

  // Parked markers (index < 0 or null): they point at nothing yet, so they sit to
  // the left of cell [0], dimmed, still labelled. The parked zone is a full cell
  // column with an INVISIBLE box and index band above its marker track, so those
  // bands reserve the exact same heights as a real cell -- the marker lane then
  // begins at the same y here as over any cell. A marker moving from -1 onto a
  // cell therefore travels laterally only, never vertically, AND stays in its own
  // fixed row while doing so.
  // The parked lane is ALWAYS present in marked mode (not only when a marker is
  // currently parked), so the cells never shift left as a marker leaves the -1
  // sentinel and the panel's width never changes across steps -- the width
  // analogue of the master invariant. Its box and index bands are invisible (they
  // only reserve height); the marker track is the same fixed-row lane as every
  // cell's, holding a caret in each row whose marker is currently parked.
  if (markers) {
    const col = document.createElement('div');
    col.className = 'pac-cell-col pac-cell-parked';
    // The parked lane's WIDTH is reserved ONCE from the whole trace, not hugged to
    // the current step: if any marker EVER parks, hold room for the widest parked
    // label on every step (markers right-aligned, hugging cell [0]); if none ever
    // parks, the lane collapses to nothing. Either way the width is constant, so a
    // marker parking or leaving -1 never shifts cell [0] -- the same jitter the
    // vertical stacking removed on the cell side, removed here on the parked side.
    const parkW = parkedReserve(ctx);
    col.style.width = col.style.minWidth = parkW ? `${parkW}px` : '0px';
    const box = document.createElement('div');
    box.className = 'pac-cell';
    box.innerHTML = '<span class="pac-cell-value">—</span>';   // reserves the box band height
    const index = document.createElement('div');
    index.className = 'pac-cell-index';
    index.textContent = '[0]';                                 // reserves the index band height
    col.append(box, index, markerLane(order, curr, 'parked'));
    wrap.appendChild(col);
  }

  cells.forEach((c, idx) => {
    const cell = document.createElement('div');
    cell.className = 'pac-cell';
    if (c.role) cell.dataset.role = c.role;
    // Reserve a fixed width for a cell whose value changes length across steps
    // (e.g. the error name), so the strip never resizes -- the width analogue of
    // the engine's reserved heights (master invariant).
    if (c.minCh) cell.style.minWidth = `${c.minCh}ch`;
    if (mode === 'bar') cell.style.height = `${20 + 70 * (+c.value / max)}px`;
    // ONE placeholder glyph for indeterminate storage — an unwritten array cell
    // and an unassigned standalone variable are the same thing. An `empty` cell
    // always shows the em-dash "—" (over the dashed box + faint X from CSS),
    // never a real value. A real stored value (including a sentinel like -1) is
    // NOT `empty` and renders normally.
    const value = c.role === 'empty' ? PLACEHOLDER : c.value;
    cell.innerHTML = (!markers && c.label ? `<span class="pac-cell-label">${esc(c.label)}</span>` : '') +
                     `<span class="pac-cell-value">${esc(value)}</span>`;
    // Anchor the value glyph, not the whole cell: for a pointer variable that
    // value is the dot, so a cross-panel arrow starts from the dot itself --
    // matching the record-field pointers in the NODES panel.
    if (c.anchor) ctx.anchor(`${ctx.spec.id}.${c.anchor}`, cell.querySelector('.pac-cell-value'));

    if (!markers) { wrap.appendChild(cell); return; }

    // Marked mode: wrap the box in a column with a bracketed index label and the
    // fixed-row marker lane. The index label sits BELOW the box; the lane below it
    // reserves one row per declared marker, and this cell's row k holds a caret
    // only when marker `order[k]` currently points here -- so two markers that
    // land on this cell occupy two DIFFERENT rows (stacked), never widening it.
    const col = document.createElement('div');
    col.className = 'pac-cell-col';
    col.appendChild(cell);

    const index = document.createElement('div');
    index.className = 'pac-cell-index';
    index.textContent = `[${c.label != null ? c.label : idx}]`;
    col.appendChild(index);

    col.appendChild(markerLane(order, curr, idx));
    wrap.appendChild(col);
  });
}

/* One index-pointer marker: a caret with its variable name labelled beneath. */
function marker(m) {
  const mk = document.createElement('span');
  mk.className = 'pac-marker';
  mk.innerHTML = `<span class="pac-marker-caret">&#9650;</span>` +
                 `<span class="pac-marker-label">${esc(m.label)}</span>`;
  return mk;
}

/* The fixed row assignment for a panel's markers: every label the trace EVER
 * shows, in first-appearance order, so each marker keeps one row for the whole
 * animation. Computed once from the full step list (via ctx.engine.steps) and
 * cached on the ctx -- the renderer sees one step at a time, but the lane's row
 * count and order must be resolved over ALL of them (master invariant: the lane
 * is as tall as the marker count from load, and never reflows). */
function markerOrder(ctx) {
  if (ctx._markerOrder) return ctx._markerOrder;
  const id = ctx.spec?.id ?? ctx.spec?.type;
  const steps = ctx.engine?.steps ?? [];
  const seen = [];
  for (const s of steps) {
    const ms = s.panels?.[id]?.markers;
    if (!ms) continue;
    for (const m of ms) if (!seen.includes(m.label)) seen.push(m.label);
  }
  return (ctx._markerOrder = seen);
}

/* The parked lane's reserved width (px), resolved once over the whole trace: 0 if
 * no marker ever parks (index null / negative) -- the lane then takes no space
 * left of cell [0] -- else enough for the widest label that ever parks, plus its
 * caret, so the reserved width is constant across every step. Cached on the ctx. */
function parkedReserve(ctx) {
  if (ctx._parkW != null) return ctx._parkW;
  const id = ctx.spec?.id ?? ctx.spec?.type;
  const steps = ctx.engine?.steps ?? [];
  let maxLen = 0;
  for (const s of steps) {
    const ms = s.panels?.[id]?.markers;
    if (!ms) continue;
    for (const m of ms) if (m.index == null || m.index < 0) maxLen = Math.max(maxLen, String(m.label).length);
  }
  return (ctx._parkW = maxLen ? Math.ceil(maxLen * 6.6 + 12) : 0);
}

/* One cell's (or the parked lane's) marker track: a vertical stack of one ROW per
 * declared marker, in `order`. A row holds this marker's caret only when it
 * currently points at this column -- `colIdx` is a cell index, or 'parked' for
 * the negative-sentinel lane left of [0]. Every other row is empty but keeps its
 * height, so the lane is the same height over every cell and on every step, and a
 * marker moving between cells (or on/off the parked lane) travels purely
 * horizontally within its own row. Cell width is therefore independent of how
 * many markers point at the cell. */
function markerLane(order, curr, colIdx) {
  const lane = document.createElement('div');
  lane.className = 'pac-cell-markers';
  for (const label of order) {
    const row = document.createElement('div');
    row.className = 'pac-marker-row';
    const has = Object.prototype.hasOwnProperty.call(curr, label);
    const idx = curr[label];
    const here = colIdx === 'parked'
      ? (has && (idx == null || idx < 0))
      : (has && idx === colIdx);
    if (here) row.appendChild(marker({ label, index: idx }));
    lane.appendChild(row);
  }
  return lane;
}

/* VERTICAL stack column (render: 'column'). Cell [0] is at the BOTTOM and the
 * column grows UPWARD, so the cells are emitted top-to-bottom in REVERSE index
 * order ([3] first … [0] last). Each cell is a row of three fixed-width bands:
 *   [ marker lane (left) | box | index label (right) ]
 * so index labels sit to the RIGHT and index-pointer markers to the LEFT, each
 * lane keeping the same width and x across every row. A negative-index marker
 * parks in a lane BELOW cell [0] (always rendered, so the cells never shift as
 * the marker enters or leaves it); moving off the sentinel is therefore a purely
 * vertical step up onto cell [0]. See AUTHORING.md "The one new capability". */
function renderColumn(wrap, data, ctx) {
  delete wrap.dataset.marked;
  const cells = data?.cells ?? [];
  const markers = data?.markers ?? [];

  // Optional row name, once, above the column (the array's name).
  if (data?.rowLabel) {
    const name = document.createElement('div');
    name.className = 'pac-cells-name';
    name.textContent = data.rowLabel;
    wrap.appendChild(name);
  }

  const row = (idx, c, rowMarkers, parked = false) => {
    const r = document.createElement('div');
    r.className = 'pac-col-row' + (parked ? ' pac-col-parked' : '');

    const left = document.createElement('div');
    left.className = 'pac-col-markers';
    for (const m of rowMarkers) left.appendChild(colMarker(m));

    const cell = document.createElement('div');
    cell.className = 'pac-cell';
    if (c?.role) cell.dataset.role = c.role;
    const value = c == null ? '' : (c.role === 'empty' ? PLACEHOLDER : c.value);
    cell.innerHTML = `<span class="pac-cell-value">${esc(value)}</span>`;
    if (c?.anchor) ctx.anchor(`${ctx.spec.id}.${c.anchor}`, cell.querySelector('.pac-cell-value'));

    const index = document.createElement('div');
    index.className = 'pac-col-index';
    index.textContent = `[${c && c.label != null ? c.label : idx}]`;

    r.append(left, cell, index);
    return r;
  };

  // Cells top-to-bottom = highest index first, so [0] lands at the bottom.
  for (let idx = cells.length - 1; idx >= 0; idx--) {
    wrap.appendChild(row(idx, cells[idx], markers.filter(m => m.index === idx)));
  }

  // The parked lane, ALWAYS present (its box + index are invisible, reserving
  // the exact row height), sits below cell [0]. It holds any marker whose index
  // is a negative sentinel; empty otherwise.
  const parked = markers.filter(m => m.index == null || m.index < 0);
  wrap.appendChild(row(0, { value: '', role: 'empty' }, parked, true));
}

/* One column marker: the variable name to the LEFT of a right-pointing caret
 * (▶), so it reads "stack_ix ▶" pointing at the cell to its right. */
function colMarker(m) {
  const mk = document.createElement('span');
  mk.className = 'pac-marker pac-col-marker';
  mk.innerHTML = `<span class="pac-marker-label">${esc(m.label)}</span>` +
                 `<span class="pac-marker-caret">&#9654;</span>`;
  return mk;
}

const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
