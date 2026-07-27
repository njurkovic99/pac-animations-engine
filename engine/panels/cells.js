/* CELLS panel — 1D/2D grid. Absorbs arrays, sorting bars, hash buckets,
 * matrices, memory blocks, variable tables, stack frames, vtables.
 * Step data: { render: 'box'|'bar'|'row', cells: [{value,label,role,anchor}] } */

export function mount(body) { body.innerHTML = '<div class="pac-cells"></div>'; }

export function render(body, data, ctx) {
  const wrap = body.querySelector('.pac-cells');
  const mode = data?.render ?? 'box';
  wrap.dataset.render = mode;
  wrap.innerHTML = '';
  const max = Math.max(1, ...(data?.cells ?? []).map(c => +c.value || 0));

  for (const c of data?.cells ?? []) {
    const el = document.createElement('div');
    el.className = 'pac-cell';
    if (c.role) el.dataset.role = c.role;
    if (mode === 'bar') el.style.height = `${20 + 70 * (+c.value / max)}px`;
    el.innerHTML = (c.label ? `<span class="pac-cell-label">${esc(c.label)}</span>` : '') +
                   `<span class="pac-cell-value">${esc(c.value)}</span>`;
    wrap.appendChild(el);
    // Anchor the value glyph, not the whole cell: for a pointer variable that
    // value is the dot, so a cross-panel arrow starts from the dot itself --
    // matching the record-field pointers in the NODES panel.
    if (c.anchor) ctx.anchor(`${ctx.spec.id}.${c.anchor}`, el.querySelector('.pac-cell-value'));
  }
}

const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
