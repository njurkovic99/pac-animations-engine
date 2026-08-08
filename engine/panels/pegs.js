/* PEGS panel — three pegs with disks (and bundles) stacked on them.
 *
 * The Towers of Hanoi structure view. Built GENERAL, because two animations
 * share it: recursion-hanoi-leap (part 1) shows ONE real disk plus a BUNDLE
 * standing in for the n-1 disks above it, and recursion-hanoi (part 2) shows
 * three real disks. So a peg holds an ordered list of ITEMS, each of which is
 * either a `disk` of a given size or a `bundle` — nothing about the renderer
 * knows which animation it serves.
 *
 * Step data:
 *   { pegs: [ { id, role, items: [ item, ... ] }, ... ] }
 * where an item is bottom-to-top on its peg:
 *   { kind: 'disk',   size, label?, active? }   // width VARIES with size
 *   { kind: 'bundle', label,        active? }   // several tapered lines = "many"
 *
 * `items[0]` is the BOTTOM of the peg; later entries sit on top. A bundle is
 * smaller than the real disk beneath it, so it is drawn ABOVE it when they share
 * a peg — the author just puts the bundle later in the list.
 *
 * Two things the animation turns on:
 *   - a DISK's width varies with `size`, because "never a larger disk on a
 *     smaller one" is the rule being enforced and it has to be visible;
 *   - a BUNDLE must read as MANY disks, never as one fat disk — so it is drawn
 *     as a set of thin, separated, upward-tapering lines (a miniature stack),
 *     with an "n − 1 disks" label. It is distinguished from the real disk by
 *     SHAPE ALONE, and wears the real disk's exact resting colour: --warn (amber)
 *     means `unlinked` in a structure panel, and the bundle is a member of the
 *     structure it sits on, so it must not be coloured with it (or with any other
 *     colour of its own — one difference, shape, does the one job).
 *
 * MASTER INVARIANT: every dimension here — peg spacing, peg height, each disk's
 * width, the bundle's size — is a FIXED constant or a pure function of the
 * item's `size`, never of how the pegs are arranged this step. The SVG is the
 * same width and height on every step; only the x/y of each item changes as
 * things move. So the engine measures one constant size for the panel and holds
 * it, and nothing resizes as a disk or bundle travels between pegs.
 *
 * A peg's on-screen label shows BOTH its fixed name and its current role —
 * "A (source)" — so the argument exchange in the recursive calls is visible as
 * the roles rotate while the letters stay put. A peg with no role (before any
 * call is active) shows the letter alone; the role line's height is always
 * reserved, so a role appearing never shifts anything. */

/* ---- fixed geometry (all constants; see the master-invariant note above) ---- */
const PAD = 18, COL_W = 144;               // outer margin; per-peg horizontal slot
const TOP = 16, POST_H = 132, POST_W = 6;  // post top margin, height, thickness
const BASE_W = 124, BASE_H = 10;           // base plate under each peg
const NAME_DY = 18, ROLE_DY = 32;          // peg label baselines below the base

const DISK_H = 22, DMIN = 44, DSTEP = 17;  // real-disk bar: height, width = f(size)
const DISK_CAP = COL_W - 20;               // widest a disk may get (never past its slot)
const STACK_GAP = 3;                        // gap between stacked items

/* Bundle: BARS thin lines, widest at the bottom and tapering UPWARD, plus a
 * label beneath the lines (which lands just above the real disk when they share
 * a peg). All fixed, so the bundle is the same size wherever it sits. Seven lines
 * read as "however many that is" better than a handful did; they are kept thin and
 * tight (4px lines, 2px gaps) so the lines block, and therefore BUNDLE_H, stays
 * the height it was with five — the bundle's overall size is unchanged and the
 * panel's dimensions, fixed from step 0, do not move. */
const B_BARS = 7, B_BAR_H = 4, B_BAR_GAP = 2;
const B_MAXW = 90, B_MINW = 46;            // bottom (widest) → top (narrowest) line
const B_BARS_H = B_BARS * B_BAR_H + (B_BARS - 1) * B_BAR_GAP;   // lines block height = 40
const B_LABEL_H = 15;                       // reserved for the "n − 1 disks" label
const BUNDLE_H = B_BARS_H + 5 + B_LABEL_H;  // whole bundle block height = 60 (as before)

const baseY = TOP + POST_H;                 // y of the top of each base plate
const W = 2 * PAD + 3 * COL_W;              // SVG width  (constant)
const H = baseY + BASE_H + ROLE_DY + 8;     // SVG height (constant)

const centerX = i => PAD + COL_W / 2 + i * COL_W;
const diskW = size => Math.min(DISK_CAP, DMIN + size * DSTEP);
const itemH = it => (it.kind === 'bundle' ? BUNDLE_H : DISK_H);

export function mount(body) {
  body.innerHTML = `<svg class="pac-pegs" xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"></svg>`;
}

export function render(body, data) {
  const svg = body.querySelector('svg');
  const pegs = data?.pegs ?? [];
  let out = '';

  pegs.forEach((peg, i) => {
    const cx = centerX(i);

    // Post + base plate: the fixed scaffolding, drawn first so disks sit over it.
    out += `<rect class="pac-peg-post" x="${cx - POST_W / 2}" y="${TOP}" width="${POST_W}" height="${POST_H}" rx="3"/>`;
    out += `<rect class="pac-peg-base" x="${cx - BASE_W / 2}" y="${baseY}" width="${BASE_W}" height="${BASE_H}" rx="2"/>`;

    // Items stack UPWARD from the base: items[0] sits on the plate, each next one
    // on top of it. `cursor` tracks the y of the bottom edge of the next item.
    let cursor = baseY;
    for (const it of peg.items ?? []) {
      const h = itemH(it);
      const top = cursor - h;
      out += it.kind === 'bundle' ? bundle(it, cx, top) : disk(it, cx, top);
      cursor = top - STACK_GAP;
    }

    // Label: the fixed letter, then the current role beneath it (role line's
    // height is always reserved, so a role appearing never moves anything).
    out += `<text class="pac-peg-name" x="${cx}" y="${baseY + BASE_H + NAME_DY}">${esc(peg.id)}</text>`;
    if (peg.role)
      out += `<text class="pac-peg-role" x="${cx}" y="${baseY + BASE_H + ROLE_DY}">(${esc(peg.role)})</text>`;
  });

  svg.innerHTML = out;
}

/* A single real disk: a rounded bar whose WIDTH encodes its size, centred on the
 * peg, with its size label inside. `active` paints the blue activity fill — the
 * same "being moved this step" signal the other panels use. */
function disk(it, cx, top) {
  const w = diskW(it.size);
  return `<g class="pac-disk" data-active="${!!it.active}">
      <rect class="pac-disk-box" x="${cx - w / 2}" y="${top}" width="${w}" height="${DISK_H}" rx="5"/>
      ${it.label != null ? `<text class="pac-disk-label" x="${cx}" y="${top + DISK_H / 2 + 4}">${esc(it.label)}</text>` : ''}
    </g>`;
}

/* A bundle: B_BARS thin lines, widest at the bottom and tapering upward so it
 * reads as a MINIATURE STACK — many disks, not one — plus the "n − 1 disks"
 * label beneath the lines. It wears the real disk's exact colour and is set apart
 * by SHAPE ALONE (thin stacked lines vs one solid bar); `active` gives it the
 * blue activity fill while it travels, identically to the real disk. */
function bundle(it, cx, top) {
  let bars = '';
  for (let k = 0; k < B_BARS; k++) {                 // k = 0 is the bottom (widest) line
    const w = B_MAXW - (B_MAXW - B_MINW) * (k / (B_BARS - 1));
    const y = top + B_BARS_H - B_BAR_H - k * (B_BAR_H + B_BAR_GAP);
    bars += `<rect class="pac-bundle-bar" x="${cx - w / 2}" y="${y}" width="${w}" height="${B_BAR_H}" rx="2"/>`;
  }
  const labelY = top + BUNDLE_H - 3;
  return `<g class="pac-bundle" data-active="${!!it.active}">
      ${bars}
      <text class="pac-bundle-label" x="${cx}" y="${labelY}">${esc(it.label)}</text>
    </g>`;
}

const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
