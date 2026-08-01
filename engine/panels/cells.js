/* CELLS panel — 1D/2D grid. Absorbs arrays, sorting bars, hash buckets,
 * matrices, memory blocks, variable tables, stack frames, vtables.
 * Step data: { render: 'box'|'bar'|'row', cells: [{value,label,role,anchor}] }
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
 * The bracketed index labels are a project-wide rule: `[0]` marks a cell's
 * position as an INDEX, not a value (a naked `1` under a cell holding `b` is the
 * index-vs-value confusion). An optional `rowLabel` names the row once, at the
 * left, so the array's name is present without repeating it under every cell. */

export function mount(body) { body.innerHTML = '<div class="pac-cells"></div>'; }

export function render(body, data, ctx) {
  const wrap = body.querySelector('.pac-cells');
  const mode = data?.render ?? 'box';
  wrap.dataset.render = mode;
  wrap.innerHTML = '';
  const cells = data?.cells ?? [];
  const max = Math.max(1, ...cells.map(c => +c.value || 0));

  // Marked mode: a `box` grid with index-pointer markers below the cell row.
  const markers = mode === 'box' && data?.markers ? data.markers : null;
  if (markers) { wrap.dataset.marked = ''; } else { delete wrap.dataset.marked; }

  // A row label names the whole row once, to the LEFT of the cells (marked mode).
  if (markers && data.rowLabel) {
    const name = document.createElement('div');
    name.className = 'pac-cells-name';
    name.textContent = data.rowLabel;
    wrap.appendChild(name);
  }

  // Parked markers (index < 0): they point at nothing yet, so they sit to the
  // left of cell [0], dimmed, still labelled.
  const parked = markers ? markers.filter(m => m.index == null || m.index < 0) : [];
  if (parked.length) {
    const zone = document.createElement('div');
    zone.className = 'pac-cell-parked';
    for (const m of parked) zone.appendChild(marker(m));
    wrap.appendChild(zone);
  }

  cells.forEach((c, idx) => {
    const cell = document.createElement('div');
    cell.className = 'pac-cell';
    if (c.role) cell.dataset.role = c.role;
    if (mode === 'bar') cell.style.height = `${20 + 70 * (+c.value / max)}px`;
    cell.innerHTML = (!markers && c.label ? `<span class="pac-cell-label">${esc(c.label)}</span>` : '') +
                     `<span class="pac-cell-value">${esc(c.value)}</span>`;
    // Anchor the value glyph, not the whole cell: for a pointer variable that
    // value is the dot, so a cross-panel arrow starts from the dot itself --
    // matching the record-field pointers in the NODES panel.
    if (c.anchor) ctx.anchor(`${ctx.spec.id}.${c.anchor}`, cell.querySelector('.pac-cell-value'));

    if (!markers) { wrap.appendChild(cell); return; }

    // Marked mode: wrap the box in a column with a bracketed index label and a
    // marker track. The index label sits BELOW the box; markers whose index
    // equals this cell's position sit side by side beneath it, each caret over
    // its own labelled variable name.
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

const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
