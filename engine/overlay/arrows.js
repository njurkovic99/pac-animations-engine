/* Arrow overlay — the piece cpoint1.html faked with four hand-tuned Beziers
 * and four colliding `arrowhead2` marker ids. Change a font size there and the
 * arrows pointed at nothing.
 *
 * Renderers publish named anchors. Arrows are DATA:
 *     { from: 'vars.p', to: 'list.n3', style: 'pointer'|'stale'|'ok' }
 *
 * Anchors are global across panels, because a pointer variable lives in CELLS
 * while the node it points at lives in NODES. Coordinates are resolved against
 * live DOM boxes at draw time, so nothing is ever cached or hand-tuned.
 *
 * Self-referencing arrows (a corrupted node pointing at itself) get a loop.
 * That case is not decorative -- it is the failure mode of a doubly-linked
 * insertion performed in the wrong order. */

const NS = 'http://www.w3.org/2000/svg';

// Length of the straight run into a target edge, so the arrowhead lands square
// on the middle of the box edge instead of on a corner (see the band/port paths).
const STUB = 8;

export class Overlay {
  constructor(stage) {
    this.stage = stage;
    this.svg = document.createElementNS(NS, 'svg');
    this.svg.setAttribute('class', 'pac-overlay');
    this.svg.innerHTML = `<defs>
      <marker id="pac-arrowhead" viewBox="0 0 8 8" refX="7.5" refY="4"
              markerWidth="5.5" markerHeight="5.5" orient="auto">
        <path d="M 0 0 L 8 4 L 0 8 z" fill="context-stroke"/>
      </marker></defs>`;
    stage.appendChild(this.svg);
    this._ro = new ResizeObserver(() => this._redraw());
    this._ro.observe(stage);
    this._last = [[], new Map()];
  }

  draw(arrows, panels) { this._last = [arrows, panels]; this._redraw(); }

  _redraw() {
    const [arrows, panels] = this._last;
    this._clear();
    if (!arrows?.length) return;

    const o = this.stage.getBoundingClientRect();
    this.svg.setAttribute('viewBox', `0 0 ${o.width} ${o.height}`);

    const find = name => {
      for (const p of panels.values()) {
        const el = p.ctx.anchors.get(name);
        if (el) {
          const r = el.getBoundingClientRect();
          return { l: r.left - o.left, r: r.right - o.left,
                   t: r.top - o.top, b: r.bottom - o.top,
                   cx: r.left + r.width / 2 - o.left,
                   cy: r.top + r.height / 2 - o.top };
        }
      }
      return null;
    };

    // Phase 1 -- resolve every arrow and classify how it meets its target,
    // recording which edge it lands on. Self-loops don't land on an edge.
    const items = arrows.map(a => {
      const f = find(a.from), t = find(a.to);
      if (!f || !t) return null;
      const selfLoop = nodeId(a.from) === nodeId(a.to);
      const band = Math.abs(f.cy - t.cy) < 26 && (a.bend === 'up' || a.bend === 'down');
      let edge = null;
      if (!selfLoop) {
        if (band) edge = a.bend === 'down' ? 'bottom' : 'top';
        else { const e = port(t, f.cx, f.cy);
               edge = e.ny > 0 ? 'bottom' : e.ny < 0 ? 'top' : e.nx > 0 ? 'right' : 'left'; }
      }
      return { a, f, t, selfLoop, band, edge, frac: 0.5 };
    });

    // Phase 2 -- when several arrows land on the SAME edge of the same node,
    // fan them across it (1/3, 2/3 for two; 1/4, 2/4, 3/4 for three) instead
    // of piling every arrowhead onto the edge midpoint. Order by source
    // position along the edge so the lines don't needlessly cross.
    const groups = new Map();
    for (const it of items) {
      if (!it || !it.edge) continue;
      const key = `${it.a.to}|${it.edge}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(it);
    }
    for (const g of groups.values()) {
      if (g.length < 2) continue;
      const horiz = g[0].edge === 'top' || g[0].edge === 'bottom';
      g.sort((p, q) => horiz ? p.f.cx - q.f.cx : p.f.cy - q.f.cy);
      g.forEach((it, i) => { it.frac = (i + 1) / (g.length + 1); });
    }

    // Phase 3 -- draw.
    const html = items.map(it => {
      if (!it) return '';
      const { a, f, t, selfLoop, band, edge, frac } = it;
      const style = a.style ?? 'pointer';

      // Self-loop: a node whose next/prev has been made to reference its own
      // node -- the failure mode of a doubly-linked insert in the wrong order.
      // Route next above and prev below so the two loops never overlap.
      if (selfLoop) {
        const down = a.bend === 'down';
        const ed = down ? f.b : f.t, apex = ed + (down ? 32 : -32);
        return path(`M ${f.cx} ${f.cy} C ${f.cx + 26} ${apex}, ${f.cx - 26} ${apex}, ${f.cx - 1} ${ed + (down ? 1 : -1)}`, style);
      }

      // Landing point on the target edge, fanned out across the box by `frac`
      // (0.5 = the old midpoint, for the common single-arrow case).
      const lx = t.l + frac * (t.r - t.l);
      const ly = t.t + frac * (t.b - t.t);

      // Same-row list pointers: next above the row, prev below it, each
      // anchored at the box top/bottom. They no longer share the mid-row
      // endpoints that turned next-over-prev into a diamond between nodes.
      if (band) {
        const down = a.bend === 'down';
        const y1 = down ? f.b : f.t, y2 = down ? t.b : t.t;
        const arc = Math.min(24, Math.max(14, Math.abs(t.cx - f.cx) * 0.32));
        const yc = (down ? Math.max(y1, y2) + arc : Math.min(y1, y2) - arc);
        // Finish with a short straight vertical stub into the target edge. The
        // curve's endpoint tangent is already vertical, but over the arrowhead's
        // length the arc still leans sideways -- enough to land the head on a
        // corner rather than the middle of its base. The stub makes the final
        // few px exactly vertical so the arrowhead sits square on the edge.
        const yStub = down ? y2 + STUB : y2 - STUB;
        return path(`M ${f.cx} ${f.cy} C ${f.cx} ${yc}, ${lx} ${yc}, ${lx} ${yStub} L ${lx} ${y2}`, style);
      }

      // Everything else (pointer variables, cross-row links): start at the
      // source's centre -- which is the dot, since both record fields and
      // pointer-variable cells now anchor their dot glyph -- and enter through
      // the target's facing edge with handles normal to it. The source handle
      // still leaves along the edge that faces the target, so the curve exits
      // cleanly. Short, monotonic curves that don't cut across the list.
      const s = port(f, t.cx, t.cy), e = port(t, f.cx, f.cy);
      if (edge === 'top' || edge === 'bottom') e.x = lx; else e.y = ly;
      const h = clamp(Math.hypot(e.x - f.cx, e.y - f.cy) * 0.4, 16, 66);
      // Same square-landing trick: a short straight run along the entry normal.
      const ex = e.x + e.nx * STUB, ey = e.y + e.ny * STUB;
      return path(`M ${f.cx} ${f.cy} C ${s.x + s.nx * h} ${s.y + s.ny * h},
                     ${ex + e.nx * h} ${ey + e.ny * h}, ${ex} ${ey} L ${e.x} ${e.y}`, style);
    }).join('');

    this.svg.insertAdjacentHTML('beforeend', html);
  }

  _clear() { this.svg.querySelectorAll('.pac-arrow').forEach(p => p.remove()); }
}

const path = (d, style) =>
  `<path class="pac-arrow" data-style="${style}" marker-end="url(#pac-arrowhead)" d="${d}"/>`;

/** The node an anchor belongs to: 'list.n25.next' -> 'list.n25', 'vars.head' -> 'vars.head'. */
const nodeId = anchor => anchor.split('.').slice(0, 2).join('.');

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/** The point on `box`'s perimeter facing (tx, ty), with the outward normal
 *  of that edge, so a curve can leave/arrive perpendicular to it. */
function port(box, tx, ty) {
  const dx = tx - box.cx, dy = ty - box.cy;
  if (Math.abs(dx) >= Math.abs(dy))
    return dx >= 0 ? { x: box.r, y: box.cy, nx: 1, ny: 0 }
                   : { x: box.l, y: box.cy, nx: -1, ny: 0 };
  return dy >= 0 ? { x: box.cx, y: box.b, nx: 0, ny: 1 }
                 : { x: box.cx, y: box.t, nx: 0, ny: -1 };
}
