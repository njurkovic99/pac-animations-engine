/* PEGS panel — pegs, each holding an ordered stack of items (disks).
 *
 * General by construction: a peg is an ORDERED LIST of items drawn bottom-to-top,
 * each item a slab whose width encodes its rank. A wider slab sitting above a
 * narrower one is therefore impossible to miss — which is the whole point of the
 * Towers of Hanoi rule the animation enforces. The renderer knows nothing about
 * Hanoi's legality rule itself; it only draws pegs and their ordered items, so the
 * same panel serves any "ordered piles on posts" structure. This is the panel part
 * 1 built general so part 2 could reuse it with real disks and no bundle.
 *
 * Step data:
 *   { pegs: [ { label, role, disks: [rank, …] }, … ],   // disks bottom-to-top
 *     active: { peg, rank } }                            // item modified THIS step
 *
 *   - `label`  the peg's name (A / B / C), drawn under its base.
 *   - `role`   a free caption under the label (source / dest / spare). It updates
 *              per step as the running call rebinds the pegs — the argument
 *              exchange made visible.
 *   - `disks`  ranks bottom-to-top; a rank is a positive number, wider = larger.
 *   - `active` names the one disk being placed THIS step; it takes the blue
 *              activity fill, the same "acted on now" channel as nodes/cells.
 *
 * Every dimension resolves ONCE from the whole trace — the most pegs, the largest
 * rank, and the tallest a stack ever gets — then holds, so no peg, disk, or label
 * moves as steps advance (master invariant). A peg drawn with fewer disks than the
 * reserved capacity is simply shorter; its post and base do not move. */

const DH = 22, GAPY = 2, GAPX = 16, PAD = 14;   // disk height, inter-disk gap, inter-peg gap, outer pad
const POSTW = 6, BASEH = 8, LABELH = 40;        // post width, base-plate height, label band below the base
const DW = r => 28 + r * 18;                     // a rank's slab width — clearly stepped so sizes read at a glance

export function mount(body) {
  body.innerHTML = `<svg class="pac-pegs" xmlns="http://www.w3.org/2000/svg"></svg>`;
}

export function render(body, data, ctx) {
  const svg = body.querySelector('svg');
  const pegs = data?.pegs ?? [];
  if (!pegs.length) { svg.innerHTML = ''; return; }

  // Capacity is resolved over the WHOLE trace, once, and held — so the SVG is the
  // same size on every step and nothing shifts (master invariant).
  const cap = capacity(ctx, data);
  const colW  = DW(cap.rank) + 26;
  const postH = cap.stack * (DH + GAPY) + 8;
  const baseY = PAD + postH;
  const W = PAD * 2 + cap.pegs * colW + (cap.pegs - 1) * GAPX;
  const H = baseY + BASEH + LABELH;

  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('width', W);
  svg.setAttribute('height', H);

  const parts = [];
  pegs.forEach((peg, i) => {
    const cx = PAD + colW / 2 + i * (colW + GAPX);

    // Post, then base plate (drawn before the disks so the disks sit in front).
    parts.push(`<rect class="pac-peg-post" x="${cx - POSTW / 2}" y="${PAD}" width="${POSTW}" height="${baseY - PAD}" rx="3"/>`);
    const baseW = colW - 14;
    parts.push(`<rect class="pac-peg-base" x="${cx - baseW / 2}" y="${baseY}" width="${baseW}" height="${BASEH}" rx="3"/>`);

    // Disks, bottom-to-top. index j = 0 is the bottom disk, resting on the base.
    (peg.disks ?? []).forEach((r, j) => {
      const w = DW(r);
      const y = baseY - (j + 1) * DH - j * GAPY;
      const hot = data?.active && data.active.peg === peg.label && data.active.rank === r;
      parts.push(
        `<g class="pac-disk" data-active="${!!hot}">` +
          `<rect x="${cx - w / 2}" y="${y}" width="${w}" height="${DH}" rx="5"/>` +
          `<text class="pac-disk-label" x="${cx}" y="${y + DH / 2 + 4}">${esc(r)}</text>` +
        `</g>`
      );
    });

    // Peg letter, then its role caption beneath (source / dest / spare).
    parts.push(`<text class="pac-peg-label" x="${cx}" y="${baseY + BASEH + 18}">${esc(peg.label)}</text>`);
    if (peg.role) parts.push(`<text class="pac-peg-role" x="${cx}" y="${baseY + BASEH + 33}">${esc(peg.role)}</text>`);
  });

  svg.innerHTML = parts.join('');
}

/* The reserved capacity (peg count, largest rank, tallest stack) over the whole
 * trace, resolved once and cached on the ctx — mirrors the marker-reserve pattern
 * in cells.js. Reading every step guarantees the geometry is identical on all of
 * them, so the pegs never resize or shift as disks move. Falls back to the current
 * step only when the trace is not yet available (first mount), and caches only once
 * it is. */
function capacity(ctx, data) {
  if (ctx._pegCap) return ctx._pegCap;
  const id = ctx.spec?.id ?? ctx.spec?.type;
  const steps = ctx.engine?.steps ?? [];
  let pegs = 0, rank = 0, stack = 0;
  const scan = d => {
    if (!d?.pegs) return;
    pegs = Math.max(pegs, d.pegs.length);
    for (const p of d.pegs) {
      stack = Math.max(stack, p.disks?.length ?? 0);
      for (const r of (p.disks ?? [])) rank = Math.max(rank, +r || 0);
    }
  };
  if (steps.length) for (const s of steps) scan(s.panels?.[id]);
  else scan(data);
  const cap = { pegs: Math.max(1, pegs), rank: Math.max(1, rank), stack: Math.max(1, stack) };
  if (steps.length) ctx._pegCap = cap;
  return cap;
}

const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
