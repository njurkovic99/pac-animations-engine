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

      // Self-loop: a node whose pointer has been made to reference itself.
      if (Math.abs(f.cx - t.cx) < 3 && Math.abs(f.cy - t.cy) < 3 ||
          (a.from.split('.')[1] === a.to.split('.')[1] && a.from !== a.to && t.l <= f.cx && f.cx <= t.r)) {
        const x = f.cx, y = f.t;
        return path(`M ${x} ${y} C ${x + 26} ${y - 30}, ${x - 26} ${y - 30}, ${x - 1} ${y - 1}`, style);
      }

      // Leave from the side that faces the target; enter on the facing side.
      const goingRight = t.cx > f.cx;
      const x1 = goingRight ? f.r : f.l;
      const x2 = goingRight ? t.l : t.r;
      const y1 = f.cy, y2 = t.cy;

      // prev-pointers travel leftwards: bow them below, so they never overlap
      // the next-pointers travelling rightwards above.
      const bend = a.bend ?? (goingRight ? 'up' : 'down');
      const dx = Math.max(22, Math.abs(x2 - x1) * 0.35);
      const lift = Math.abs(y2 - y1) < 6 ? (bend === 'down' ? 26 : -26) : 0;

      return path(`M ${x1} ${y1} C ${x1 + (goingRight ? dx : -dx)} ${y1 + lift},
                     ${x2 - (goingRight ? dx : -dx)} ${y2 + lift}, ${x2} ${y2}`, style);
    }).join('');

    this.svg.insertAdjacentHTML('beforeend', html);
  }

  _clear() { this.svg.querySelectorAll('.pac-arrow').forEach(p => p.remove()); }
}

const path = (d, style) =>
  `<path class="pac-arrow" data-style="${style}" marker-end="url(#pac-arrowhead)" d="${d}"/>`;
