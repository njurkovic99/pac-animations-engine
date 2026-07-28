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

const NW = 74, NH = 40, HGAP = 16, VGAP = 62, PAD = 20;
const RW = 112, RH = 38, RGAP = 46, RROW = 84;   // record geometry

export function mount(body) {
  body.innerHTML = `<svg class="pac-nodes" xmlns="http://www.w3.org/2000/svg"></svg>`;
}

export function render(body, data, ctx) {
  const svg = body.querySelector('svg');
  if (!data?.nodes?.length) { svg.innerHTML = ''; return; }

  const record = data.template === 'record';
  const w = record ? RW : NW, h = record ? RH : NH;
  const pos = layout(data, record);

  const xs = [...pos.values()].map(p => p.x), ys = [...pos.values()].map(p => p.y);
  const W = Math.max(...xs) + w / 2 + PAD, H = Math.max(...ys) + h + PAD + 12;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('height', Math.min(H, 440));

  const edges = (data.edges ?? impliedEdges(data.nodes)).map(e => {
    const a = pos.get(e.from), b = pos.get(e.to);
    if (!a || !b) return '';
    return `<path class="pac-edge" data-state="${e.state ?? ''}" d="M ${a.x} ${a.y + h} L ${b.x} ${b.y}"/>`;
  }).join('');

  svg.innerHTML = edges + data.nodes.map(n => {
    const p = pos.get(n.id);
    return record ? recordNode(n, p) : plainNode(n, p);
  }).join('');

  const id = ctx.spec.id;
  svg.querySelectorAll('[data-anchor]').forEach(el => ctx.anchor(`${id}.${el.dataset.anchor}`, el));
}

function plainNode(n, p) {
  const meta = (n.meta ?? []).map((m, k) =>
    `<text class="pac-node-meta" x="${p.x}" y="${p.y + 31 + k * 11}">${esc(m)}</text>`).join('');
  return `<g class="pac-node" data-state="${n.state ?? 'pending'}" data-active="${!!n.active}" data-anchor="${n.id}">
    <rect class="pac-node-box" x="${p.x - NW / 2}" y="${p.y}" width="${NW}" height="${NH}" rx="4"/>
    <text class="pac-node-label" x="${p.x}" y="${p.y + 17}">${esc(n.label)}</text>
    ${meta}</g>`;
}

/** [ prev | value | next ] — the shape of lists.9.gif, made addressable. */
function recordNode(n, p) {
  const fields = n.fields ?? ['prev', 'value', 'next'];
  const x0 = p.x - RW / 2;
  let cx = x0;
  const cells = fields.map(f => {
    const fw = (f === 'value' ? 0.42 : 0.29) * RW;
    const val = f === 'value' ? n.label : (n[f] == null ? '\u2205' : '\u25cf');
    const g = `<g data-anchor="${n.id}.${f}">
        <rect class="pac-node-box" x="${cx}" y="${p.y}" width="${fw}" height="${RH}"/>
        <text class="pac-node-label" x="${cx + fw / 2}" y="${p.y + 24}">${esc(val)}</text></g>`;
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

  if (mode === 'graph') {
    const R = 30 + data.nodes.length * 13;
    data.nodes.forEach((n, k) => {
      const t = (k / data.nodes.length) * 2 * Math.PI - Math.PI / 2;
      pos.set(n.id, { x: R + PAD + R * Math.cos(t), y: R + PAD + R * Math.sin(t) });
    });
    return pos;
  }

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
