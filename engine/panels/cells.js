/* CELLS panel — 1D/2D grid. Absorbs arrays, sorting bars, hash buckets,
 * matrices, memory blocks, variable tables, stack frames, vtables.
 * Step data: { render: 'box'|'bar'|'row', cells: [{value,label,role,anchor}] }
 *
 * A `box` grid may also carry index-pointer markers (AUTHORING.md "Planned
 * primitive — the index pointer"):
 *   { render: 'box', cells: [...], markers: [{label, index}] }
 * When `markers` is present each cell is rendered as a column — the box, an
 * index label beneath it (the cell's own `label`, or its position), then a
 * marker track holding any carets whose `index` points at this cell. Two
 * markers on the same cell sit side by side, never overlapping. */

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

    // Marked mode: wrap the box in a column with an index label and a marker
    // track. The index label sits BELOW the box; markers whose index equals this
    // cell's position stack side by side beneath it.
    const col = document.createElement('div');
    col.className = 'pac-cell-col';
    col.appendChild(cell);

    const index = document.createElement('div');
    index.className = 'pac-cell-index';
    index.textContent = c.label != null ? c.label : idx;
    col.appendChild(index);

    const track = document.createElement('div');
    track.className = 'pac-cell-markers';
    for (const m of markers) {
      if (m.index !== idx) continue;
      const mk = document.createElement('span');
      mk.className = 'pac-marker';
      mk.innerHTML = `<span class="pac-marker-caret">&#9650;</span>` +
                     `<span class="pac-marker-label">${esc(m.label)}</span>`;
      track.appendChild(mk);
    }
    col.appendChild(track);
    wrap.appendChild(col);
  });
}

const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
