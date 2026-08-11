/* NODES panel — nodes with typed edges.
 *
 * One renderer for: linked lists, doubly linked lists, BSTs, heaps-as-trees,
 * recursion call trees, class hierarchies, object graphs, GC reachability,
 * UML diagrams, flowcharts, adjacency lists. They differ in node template,
 * edge template, and layout -- and in nothing else.
 *
 * Step data:
 *   { layout:   'tree' | 'linear' | 'graph',
 *     template: 'plain' | 'record',
 *     nodes: [{id, parent, label, meta[], state, active, fields[], slot, row}],
 *     edges: [{from, to, state}] }       // implied by `parent` for trees
 *
 * Two INDEPENDENT color channels (AUTHORING.md "Node color channels"):
 *   - `state`  -> the OUTLINE (membership/traversal): green member, amber
 *                 `unlinked`, dim `pending`, blue traversal frontier.
 *   - `active` -> the FILL (activity): a truthy `active` flags "this node is
 *                 being modified on THIS step" and paints a blue interior,
 *                 orthogonal to `state`. An unlinked node can be amber-outline
 *                 + blue-fill at once; a settled member, green-outline +
 *                 blue-fill. Fill never changes the outline, and vice versa.
 *
 * Snapshots include not-yet-visited nodes as state 'pending', so layout is
 * computed over the whole structure and nodes never jump between steps.
 *
 * For `record` nodes, every field publishes its own anchor:
 *     list.n25.prev   list.n25.next   list.n25
 * which is what lets the arrow overlay draw pointer links as DATA. */

const NW = 74, HGAP = 16, VGAP = 62, PAD = 20;
const RW = 112, RH = 38, RGAP = 46, RROW = 84;   // record geometry

/* Graph geometry (layout 'graph'). Node positions are DATA -- the content file
 * supplies each node's `x`/`y` in abstract grid units, NOT a force layout or a
 * circle (AUTHORING.md graphs-representations §3: "positions are data"). Grid
 * units are scaled by GX/GY so a clean 2-column, 3-row lecture layout reads at a
 * comfortable size; every dimension is a constant times a fixed datum, so the
 * SVG's W/H are the same on every step and nothing moves as edges appear. */
const GR = 19, GX = 92, GY = 78, GPAD = 26;      // node radius, grid step x/y, margin
const GARROW = 8;                                 // arrowhead run + gap before the target border
const GOFF = 7;                                    // perpendicular offset for antiparallel edges

/* Plain-node vertical metrics. The box height is DERIVED from how many `meta`
 * lines a node carries so the label + every meta line (e.g. "level 3" /
 * "depth 2") sit inside the box and are never clipped -- see AUTHORING.md
 * "Node sizing". LABEL_Y / META_Y0 are text baselines from the box top. */
const LABEL_Y = 17, META_Y0 = 30, META_LH = 11, META_PAD = 8, NH_MIN = 24;
const plainH = metaMax =>
  metaMax > 0 ? META_Y0 + (metaMax - 1) * META_LH + META_PAD : NH_MIN;

export function mount(body) {
  body.innerHTML = `<svg class="pac-nodes" xmlns="http://www.w3.org/2000/svg"></svg>`;
}

export function render(body, data, ctx) {
  const svg = body.querySelector('svg');
  if (!data?.nodes?.length) { svg.innerHTML = ''; return; }

  // A GRAPH is a different shape from a tree/list: nodes at FIXED author-supplied
  // positions, edges as data with an explicit direction. It renders through its
  // own path so the tree/record logic below stays untouched.
  if (data.layout === 'graph') { renderGraph(svg, data, ctx); return; }

  const record = data.template === 'record';
  // Box height fits the tallest node's meta stack, so meta text never clips.
  const metaMax = Math.max(0, ...data.nodes.map(n => n.meta?.length ?? 0));
  const w = record ? RW : NW, h = record ? RH : plainH(metaMax);
  const pos = layout(data, record);

  const xs = [...pos.values()].map(p => p.x), ys = [...pos.values()].map(p => p.y);
  const W = Math.max(...xs) + w / 2 + PAD, H = Math.max(...ys) + h + PAD + 12;
  // Render at NATURAL size (1:1 with the viewBox), width AND height both set, so
  // a diagram wider or taller than its panel SCROLLS internally rather than
  // scaling down to a smear or clipping at the edge (AUTHORING.md "No panel may
  // exceed the viewport width"). The engine caps the panel to its column and the
  // body (overflow:auto) scrolls both axes; _followActive keeps the active node --
  // or the root, at step 0 -- in view. Never a fixed pixel cap here: capping the
  // height was what clipped the root off the top.
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('width', W);
  svg.setAttribute('height', H);

  const edges = (data.edges ?? impliedEdges(data.nodes)).map(e => {
    const a = pos.get(e.from), b = pos.get(e.to);
    if (!a || !b) return '';
    return `<path class="pac-edge" data-state="${e.state ?? ''}" d="M ${a.x} ${a.y + h} L ${b.x} ${b.y}"/>`;
  }).join('');

  svg.innerHTML = edges + data.nodes.map(n => {
    const p = pos.get(n.id);
    return record ? recordNode(n, p) : plainNode(n, p, h);
  }).join('');

  const id = ctx.spec.id;
  svg.querySelectorAll('[data-anchor]').forEach(el => ctx.anchor(`${id}.${el.dataset.anchor}`, el));
}

/* ---- GRAPH: fixed-position nodes with directed/undirected edges ----
 *
 * The general graph renderer (AUTHORING.md graphs-representations §3): serves an
 * adjacency-matrix animation now, and any later state diagram, flow graph, or
 * traversal (graphs-bfs-dfs). Three things it does that a tree does not:
 *
 *   - POSITIONS ARE DATA. Each node carries `x`/`y` (abstract grid units); the
 *     renderer never computes a layout. Two graphs drawn on the same node set
 *     therefore sit in identical positions, which is what makes an honest
 *     directed-vs-undirected comparison possible.
 *   - EDGES CARRY A DIRECTION. `{from, to, directed}`. A directed edge draws an
 *     arrowhead at its target; an undirected edge is a plain line with no head --
 *     the lecture's own distinction, visible at a glance.
 *   - EDGES MAY CROSS, and are kept straight (a graph is not planar in general).
 *     The one exception to "straight between centres" is an ANTIPARALLEL pair
 *     (both u->v and v->u present, as in the lecture's directed graph): each is
 *     shifted a few px to the right of its own travel direction so the two
 *     arrowheads are both visible instead of colliding on one line.
 *
 * An edge with `state: 'active'` takes the blue activity stroke on the step
 * setEdge creates it -- the same "being modified now" channel cells and nodes
 * use. All nodes are present from step 0; only the edge list grows, so the SVG's
 * fixed W/H never change and nothing moves (the master invariant). */
function renderGraph(svg, data, ctx) {
  const pos = new Map();
  for (const n of data.nodes) pos.set(n.id, { x: GPAD + GR + n.x * GX, y: GPAD + GR + n.y * GY });
  const xs = [...pos.values()].map(p => p.x), ys = [...pos.values()].map(p => p.y);
  const W = Math.max(...xs) + GR + GPAD, H = Math.max(...ys) + GR + GPAD;

  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('width', W);
  svg.setAttribute('height', H);

  // Which (from,to) pairs exist, so an antiparallel partner can be detected and
  // both members of the pair offset to opposite sides.
  const present = new Set((data.edges ?? []).map(e => `${e.from}>${e.to}`));

  const edges = (data.edges ?? []).map(e => {
    const a = pos.get(e.from), b = pos.get(e.to);
    if (!a || !b) return '';
    const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len;                  // unit along the edge
    // Antiparallel pair -> shift right of travel by GOFF so both arrows show.
    const off = present.has(`${e.to}>${e.from}`) ? GOFF : 0;
    const px = -uy * off, py = ux * off;                 // perpendicular (right of travel)
    const ax = a.x + ux * GR + px, ay = a.y + uy * GR + py;
    // A directed edge stops short of the border so its arrowhead lands ON the
    // border; an undirected line runs right to the border.
    const back = GR + (e.directed ? GARROW : 0);
    const bx = b.x - ux * back + px, by = b.y - uy * back + py;
    const head = e.directed ? ' marker-end="url(#pac-graph-arrow)"' : '';
    return `<path class="pac-edge pac-graph-edge" data-state="${e.state ?? ''}"${head} d="M ${r2(ax)} ${r2(ay)} L ${r2(bx)} ${r2(by)}"/>`;
  }).join('');

  // The arrowhead marker lives in THIS svg (the overlay's marker is a different
  // svg). `context-stroke` makes the head take the edge's own colour, so an
  // active edge's blue arrowhead comes for free.
  const defs = `<defs><marker id="pac-graph-arrow" viewBox="0 0 8 8" refX="7" refY="4"
      markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 8 4 L 0 8 z" fill="context-stroke"/></marker></defs>`;

  const nodes = data.nodes.map(n => {
    const p = pos.get(n.id);
    return `<g class="pac-node pac-graph-node" data-state="${n.state ?? 'idle'}" data-active="${!!n.active}" data-anchor="${n.id}">
      <circle class="pac-node-box" cx="${p.x}" cy="${p.y}" r="${GR}"/>
      <text class="pac-node-label" x="${p.x}" y="${p.y + 4}">${esc(n.label)}</text></g>`;
  }).join('');

  // Edges first so nodes paint over the line ends; the arrowhead already stops at
  // the border, but layering keeps a stray pixel from showing through a node.
  svg.innerHTML = defs + edges + nodes;

  const id = ctx.spec.id;
  svg.querySelectorAll('[data-anchor]').forEach(el => ctx.anchor(`${id}.${el.dataset.anchor}`, el));
}

const r2 = v => Math.round(v * 10) / 10;

function plainNode(n, p, h) {
  const meta = (n.meta ?? []).map((m, k) =>
    `<text class="pac-node-meta" x="${p.x}" y="${p.y + META_Y0 + k * META_LH}">${esc(m)}</text>`).join('');
  return `<g class="pac-node" data-state="${n.state ?? 'pending'}" data-active="${!!n.active}" data-anchor="${n.id}">
    <rect class="pac-node-box" x="${p.x - NW / 2}" y="${p.y}" width="${NW}" height="${h}" rx="4"/>
    <text class="pac-node-label" x="${p.x}" y="${p.y + LABEL_Y}">${esc(n.label)}</text>
    ${meta}</g>`;
}

/** [ prev | value | next ] — the shape of lists.9.gif, made addressable.
 *
 * A field's backing value drives its glyph: the `value` field shows the node's
 * label; a pointer field shows a filled dot (points at something) or the nil
 * glyph. A field whose backing value is `undefined` -- as opposed to `null` -- is
 * INDETERMINATE STORAGE: a freshly allocated record cell not yet written. An unset
 * pointer is a different thing from a nil one, so it renders differently: the
 * dashed dimmed box with a thin X and no glyph, the SVG analogue of a CELLS
 * `empty` cell (AUTHORING.md "empty = indeterminate storage"). `activeFields`
 * lists field names that take the blue activity fill THIS step -- the field-
 * granular analogue of the node-level `active` fill, for a value copied into a
 * single cell. */
function recordNode(n, p) {
  const fields = n.fields ?? ['prev', 'value', 'next'];
  const activeF = new Set(n.activeFields ?? []);
  const x0 = p.x - RW / 2;
  let cx = x0;
  const cells = fields.map(f => {
    const fw = (f === 'value' ? 0.42 : 0.29) * RW;
    const src = f === 'value' ? n.label : n[f];
    const isEmpty = src === undefined;                  // indeterminate (undefined) vs nil (null)
    const val = isEmpty ? '' : (f === 'value' ? n.label : (src === null ? '\u2205' : '\u25cf'));
    const cls = 'pac-node-box' + (isEmpty ? ' pac-field-empty' : '')
              + (activeF.has(f) ? ' pac-field-active' : '');
    const x = cx, ix = 7;                               // X inset from the field-box edges
    const xMark = isEmpty
      ? `<path class="pac-field-x" d="M ${x + ix} ${p.y + ix} L ${x + fw - ix} ${p.y + RH - ix} `
        + `M ${x + fw - ix} ${p.y + ix} L ${x + ix} ${p.y + RH - ix}"/>`
      : '';
    const g = `<g data-anchor="${n.id}.${f}" data-empty="${isEmpty}">
        <rect class="${cls}" x="${x}" y="${p.y}" width="${fw}" height="${RH}"/>
        ${xMark}
        <text class="pac-node-label" x="${x + fw / 2}" y="${p.y + 24}">${esc(val)}</text></g>`;
    cx += fw;
    return g;
  }).join('');
  const meta = (n.meta ?? []).map((m, k) =>
    `<text class="pac-node-meta" x="${p.x}" y="${p.y + RH + 13 + k * 11}">${esc(m)}</text>`).join('');
  return `<g class="pac-node" data-state="${n.state ?? 'exited'}" data-active="${!!n.active}" data-anchor="${n.id}">${cells}${meta}</g>`;
}

/* ---- layout ---- */

function layout(data, record) {
  const mode = data.layout ?? 'tree';
  const pos = new Map();
  const w = record ? RW : NW;

  if (mode === 'linear') {
    const gap = record ? RGAP : 34;
    data.nodes.forEach((n, k) => pos.set(n.id, {
      x: PAD + w / 2 + (n.slot ?? k) * (w + gap),
      y: PAD + (n.row ?? 0) * RROW,
    }));
    return pos;
  }

  // 'graph' is handled entirely by renderGraph (fixed author positions); it never
  // reaches this layout() helper.

  const kids = new Map();
  for (const n of data.nodes) {
    if (n.parent == null) continue;
    if (!kids.has(n.parent)) kids.set(n.parent, []);
    kids.get(n.parent).push(n.id);
  }
  let leaf = 0;
  const walk = (id, d) => {
    const cs = kids.get(id) ?? [];
    if (!cs.length) { pos.set(id, { x: PAD + NW / 2 + leaf++ * (NW + HGAP), y: PAD + d * VGAP }); return; }
    cs.forEach(c => walk(c, d + 1));
    const cx = cs.map(c => pos.get(c).x);
    pos.set(id, { x: (Math.min(...cx) + Math.max(...cx)) / 2, y: PAD + d * VGAP });
  };
  data.nodes.filter(n => n.parent == null).forEach(r => walk(r.id, 0));
  return pos;
}

function impliedEdges(nodes) {
  return nodes.filter(n => n.parent != null)
    .map(n => ({ from: n.parent, to: n.id, state: n.state === 'pending' ? '' : 'taken' }));
}

const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
