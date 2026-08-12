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

// Indeterminate storage renders as the X ALONE (drawn in CSS across an `empty`
// cell). No character sits in the value slot: a dash there can read as a value --
// specifically as a minus sign next to the sorting animations' negative numbers
// (-1, -3). The empty string still reserves the value slot's height (min-height),
// so an empty cell keeps a member's dimensions. (A7 item 55.)
const PLACEHOLDER = '';

export function mount(body) { body.innerHTML = '<div class="pac-cells"></div>'; }

export function render(body, data, ctx) {
  const wrap = body.querySelector('.pac-cells');
  const mode = data?.render ?? 'box';
  wrap.dataset.render = mode;
  // Reserve every value slot to the WIDEST value this panel ever holds across the
  // whole trace, so a cell is the same width empty, stale, or filled -- the width
  // analogue of the reserved heights, and the AUTHORING "fixed cell sizes" rule the
  // engine previously enforced in column mode only. Resolved ONCE per panel from the
  // materialised trace (`--cell-cols`, read by .pac-cell-value's min-width in the
  // stylesheet). Grid cells are a fixed size already and opt out.
  if (mode === 'grid') wrap.style.removeProperty('--cell-cols');
  else wrap.style.setProperty('--cell-cols', cellCols(ctx));
  wrap.innerHTML = '';
  // Vertical stack column — a distinct layout from the horizontal box/bar/row
  // modes, so it is rendered by its own path (see renderColumn below).
  if (mode === 'column') { renderColumn(wrap, data, ctx); return; }
  // 2D grid / adjacency matrix — a rows x cols grid with index headers on the top
  // and left edges. Its own path (see renderGrid below).
  if (mode === 'grid') { renderGrid(wrap, data, ctx); return; }
  const cells = data?.cells ?? [];
  const max = Math.max(1, ...cells.map(c => +c.value || 0));

  // Marked mode: a `box` grid with index-pointer markers below the cell row.
  const markers = mode === 'box' && data?.markers ? data.markers : null;
  if (markers) { wrap.dataset.marked = ''; } else { delete wrap.dataset.marked; }
  // Markers on the same cell sit SIDE BY SIDE (AUTHORING.md "The index pointer"),
  // each caret directly under its cell. The jitter that used to come with that --
  // a cell widening when a second marker landed on it, shifting every later cell --
  // is killed by sizing the cell column ONCE, at load, for the MAXIMUM number of
  // markers that ever share a single cell ANYWHERE in the trace (`markerReserve`),
  // then holding it constant. An array whose markers never collide keeps a normal
  // column; one that reaches two (queues' front/rear) is sized for two from step 0;
  // one that reaches three (heapsort's root/child/end) is sized for three. Same
  // rule as every other dimension: resolve the max over the whole trace, once, then
  // hold -- so no cell ever moves. (A7 item 54, superseding the vertical stacking
  // of item 53.)
  if (markers) {
    const r = markerReserve(ctx);
    wrap.style.setProperty('--cell-col-min', `${r.cell}px`);
    wrap.style.setProperty('--parked-min', `${r.parked}px`);
  }

  // A row label names the whole row once, to the LEFT of the cells (marked mode).
  if (markers && data.rowLabel) {
    const name = document.createElement('div');
    name.className = 'pac-cells-name';
    name.textContent = data.rowLabel;
    wrap.appendChild(name);
  }

  // Parked markers (index < 0 or null): they point at nothing yet, so they sit to
  // the left of cell [0], dimmed, still labelled, side by side. The parked zone is
  // a full cell column with an INVISIBLE box and index band above its marker track,
  // so those bands reserve the exact same heights as a real cell -- the marker lane
  // then begins at the same y here as over any cell. A marker moving from -1 onto a
  // cell therefore travels laterally only, never vertically.
  // The parked lane is ALWAYS present in marked mode (not only when a marker is
  // currently parked), and its width is reserved ONCE for the most markers ever
  // parked at the same time (0 if none ever park), so the cells never shift left as
  // a marker leaves the -1 sentinel and the panel's width never changes across
  // steps -- the width analogue of the master invariant.
  if (markers) {
    const parked = markers.filter(m => m.index == null || m.index < 0);
    const col = document.createElement('div');
    col.className = 'pac-cell-col pac-cell-parked';
    const box = document.createElement('div');
    box.className = 'pac-cell';
    box.innerHTML = '<span class="pac-cell-value"></span>';    // hidden; reserves the box band height only
    const index = document.createElement('div');
    index.className = 'pac-cell-index';
    index.textContent = '[0]';                                 // reserves the index band height
    const track = document.createElement('div');
    track.className = 'pac-cell-markers';
    for (const m of parked) track.appendChild(marker(m));
    col.append(box, index, track);
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
    // ONE placeholder for indeterminate storage — an unwritten array cell and an
    // unassigned standalone variable are the same thing: an `empty` cell, drawn as
    // the dashed box + faint X from CSS with NOTHING in the value slot. A real
    // stored value (including a sentinel like -1) is NOT `empty` and renders
    // normally.
    const value = c.role === 'empty' ? PLACEHOLDER : c.value;
    cell.innerHTML = (!markers && c.label ? `<span class="pac-cell-label">${esc(c.label)}</span>` : '') +
                     `<span class="pac-cell-value">${esc(value)}</span>`;
    // Anchor the value glyph, not the whole cell: for a pointer variable that
    // value is the dot, so a cross-panel arrow starts from the dot itself --
    // matching the record-field pointers in the NODES panel.
    if (c.anchor) ctx.anchor(`${ctx.spec.id}.${c.anchor}`, cell.querySelector('.pac-cell-value'));

    if (!markers) { wrap.appendChild(cell); return; }

    // Marked mode: wrap the box in a column with a bracketed index label and a
    // marker track. The index label sits BELOW the box; markers whose index equals
    // this cell's position sit side by side beneath it, each caret over its own
    // labelled variable name. The column's fixed min-width (--cell-col-min, sized
    // for the busiest cell in the whole trace) means two markers landing here never
    // widen it, so no cell ever shifts.
    const col = document.createElement('div');
    col.className = 'pac-cell-col';
    col.appendChild(cell);

    const index = document.createElement('div');
    index.className = 'pac-cell-index';
    index.textContent = `[${c.label != null ? c.label : idx}]`;
    col.appendChild(index);

    const track = document.createElement('div');
    track.className = 'pac-cell-markers';
    for (const m of markers) {
      if (m.index === idx) track.appendChild(marker(m));
    }
    col.appendChild(track);
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

/* The reserved widths (px) for a marked array's cell columns and its parked lane,
 * resolved ONCE over the whole trace and cached on the ctx. The engine pins the
 * PANEL to its widest step, but that alone lets an individual CELL widen on the
 * step it holds two markers (shifting later cells); reserving every column for the
 * busiest cell in the trace makes each cell a constant width, so nothing shifts.
 *   cell   = room for the most markers that ever share ONE cell, side by side.
 *   parked = room for the most markers ever parked (index null / negative) at once
 *            -- 0 if none ever park, so the lane then takes no space left of [0].
 * A marker is ~`labelLen` mono chars wide (the caret is narrower than its label);
 * ~7px/char at the 10.5px marker font, +6px between side-by-side markers, +slack.
 * A cell column also never falls below the bare cell (~48px). */
function markerReserve(ctx) {
  if (ctx._markerReserve) return ctx._markerReserve;
  const id = ctx.spec?.id ?? ctx.spec?.type;
  const steps = ctx.engine?.steps ?? [];
  // The width a cluster actually needs is the SUM of its labels' widths plus the
  // gaps between them -- not (count x widest label), which over-reserves when the
  // clustered labels differ (heapsort's root+child+end is 12 chars, not 3x5). Track
  // the widest such cluster over the whole trace, for real cells and for the parked
  // sentinel separately.
  let cellChars = 0, parkChars = 0, cellCount = 0, parkCount = 0;
  for (const s of steps) {
    const ms = s.panels?.[id]?.markers;
    if (!ms) continue;
    const cellSum = {}, cellN = {};
    let parkSum = 0, parkN = 0;
    for (const m of ms) {
      const len = String(m.label).length;
      if (m.index == null || m.index < 0) { parkSum += len; parkN++; }
      else { cellSum[m.index] = (cellSum[m.index] || 0) + len; cellN[m.index] = (cellN[m.index] || 0) + 1; }
    }
    for (const k in cellSum) { cellChars = Math.max(cellChars, cellSum[k]); cellCount = Math.max(cellCount, cellN[k]); }
    if (parkSum) { parkChars = Math.max(parkChars, parkSum); parkCount = Math.max(parkCount, parkN); }
  }
  // ~6.3px per mono char at the 10.5px marker-label font, 6px between markers, a
  // little slack so nothing touches.
  const band = (chars, count) => chars ? Math.ceil(chars * 6.3 + (count - 1) * 6 + 8) : 0;
  return (ctx._markerReserve = {
    cell:   Math.max(48, band(cellChars, cellCount)),
    parked: band(parkChars, parkCount),
  });
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

/* 2D GRID / adjacency matrix (render: 'grid'). A rows x cols grid laid out with
 * CSS grid, with a header band of indices on the TOP edge (columns) and the LEFT
 * edge (rows), plus a blank corner. A data cell reads as "row j, column k".
 *
 * Step data:
 *   { render: 'grid', rows, cols,
 *     rowHeader?: [...], colHeader?: [...],   // default 0..rows-1 / 0..cols-1
 *     cells: [ {value, role?, anchor?}, ... ] }   // ROW-MAJOR, rows*cols entries
 *
 * Every cell is present from step 0 and fixed-size for every state, so the grid
 * never grows or shifts (the master invariant). `role` drives the shared cell
 * styling -- in particular `active` gives the blue "written this step" fill. The
 * DIAGONAL (row index == col index) is tagged `data-diagonal` for the faint mirror-
 * line wash (CSS); the tag is derived here from position, never authored per cell. */
function renderGrid(wrap, data, ctx) {
  const rows = data.rows ?? 0, cols = data.cols ?? 0;
  const cells = data.cells ?? [];
  const colHead = data.colHeader ?? [...Array(cols).keys()];
  const rowHead = data.rowHeader ?? [...Array(rows).keys()];

  const grid = document.createElement('div');
  grid.className = 'pac-matrix';
  // A leading auto column for the row-header band, then one fixed column per grid
  // column. Fixed tracks so every cell is the same width for every state.
  grid.style.gridTemplateColumns = `auto repeat(${cols}, 30px)`;

  // Header row: blank corner, then the column indices.
  const corner = document.createElement('div');
  corner.className = 'pac-matrix-corner';
  grid.appendChild(corner);
  for (const h of colHead) {
    const el = document.createElement('div');
    el.className = 'pac-matrix-head pac-matrix-colhead';
    el.textContent = h;
    grid.appendChild(el);
  }

  // One grid row per matrix row: the row index, then its cells.
  for (let r = 0; r < rows; r++) {
    const rh = document.createElement('div');
    rh.className = 'pac-matrix-head pac-matrix-rowhead';
    rh.textContent = rowHead[r];
    grid.appendChild(rh);
    for (let c = 0; c < cols; c++) {
      const cd = cells[r * cols + c] ?? {};
      const cell = document.createElement('div');
      cell.className = 'pac-cell pac-matrix-cell';
      if (cd.role) cell.dataset.role = cd.role;
      if (cd.value != null) cell.dataset.val = cd.value;   // F/T -> dim vs bright letter
      if (r === c) cell.dataset.diagonal = '';             // the mirror line
      cell.innerHTML = `<span class="pac-cell-value">${esc(cd.value ?? '')}</span>`;
      if (cd.anchor) ctx.anchor(`${ctx.spec.id}.${cd.anchor}`, cell.querySelector('.pac-cell-value'));
      grid.appendChild(cell);
    }
  }
  wrap.appendChild(grid);
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

/* The widest value (in characters) this CELLS panel holds anywhere in the trace.
 * The cells are monospace, so a character count reserves the value slot exactly via
 * `min-width: <n>ch`. Resolved once and cached on the ctx (the same pattern as
 * markerReserve). `empty` cells carry no value and never widen the reservation --
 * they INHERIT it, which is the whole point (an empty cell keeps a member's width). */
function cellCols(ctx) {
  const steps = ctx.engine?.steps ?? [];
  if (!steps.length) return 0;                         // rendered before materialise (a live slider panel) -- don't cache
  if (ctx._cellCols != null) return ctx._cellCols;
  const id = ctx.spec?.id ?? ctx.spec?.type;
  let cols = 0;
  for (const s of steps)
    for (const c of (s.panels?.[id]?.cells ?? [])) {
      if (c.role === 'empty') continue;
      const v = c.value == null ? '' : String(c.value);
      cols = Math.max(cols, [...v].length);            // count glyphs (● ∅ etc. are one)
    }
  return (ctx._cellCols = cols);
}

const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
