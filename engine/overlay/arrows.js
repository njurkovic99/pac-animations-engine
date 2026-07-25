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

    const html = arrows.map(a => {
      const f = find(a.from), t = find(a.to);
      if (!f || !t) return '';
      const style = a.style ?? 'pointer';

      // Self-loop: a node whose next/prev has been made to reference its own
      // node -- the failure mode of a doubly-linked insert in the wrong order.
      // Route next above and prev below so the two loops never overlap.
      if (nodeId(a.from) === nodeId(a.to)) {
        const down = a.bend === 'down';
        const y = down ? f.b : f.t, d = down ? 30 : -30, tip = down ? 1 : -1;
        return path(`M ${f.cx} ${y} C ${f.cx + 26} ${y + d}, ${f.cx - 26} ${y + d}, ${f.cx - 1} ${y + tip}`, style);
      }

      // Same-row list pointers: next above the row, prev below it, each
      // anchored at the box top/bottom. They no longer share the mid-row
      // endpoints that turned next-over-prev into a diamond between nodes.
      const sameRow = Math.abs(f.cy - t.cy) < 26;
      if (sameRow && (a.bend === 'up' || a.bend === 'down')) {
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
        return path(`M ${f.cx} ${y1} C ${f.cx} ${yc}, ${t.cx} ${yc}, ${t.cx} ${yStub} L ${t.cx} ${y2}`, style);
      }

      // Everything else (pointer variables, cross-row links): leave and enter
      // through the box edge that faces the other box, with handles normal to
      // that edge. Short, monotonic curves that don't cut across the list.
      const s = port(f, t.cx, t.cy), e = port(t, f.cx, f.cy);
      const h = clamp(Math.hypot(e.x - s.x, e.y - s.y) * 0.4, 16, 66);
      // Same square-landing trick: a short straight run along the entry normal.
      const ex = e.x + e.nx * STUB, ey = e.y + e.ny * STUB;
      return path(`M ${s.x} ${s.y} C ${s.x + s.nx * h} ${s.y + s.ny * h},
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
