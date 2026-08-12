/* STREAM panel — append-only text, two directions.
 * Step data: { lines: [{text, dir, indent, isNew}], cursor: bool }
 * `dir: 'in'` renders a prompt / visible pause / echoed input. No file in the
 * original 25 modelled input at all, yet every CS1 assignment is prompt-driven. */

export function mount(body) { body.innerHTML = '<div class="pac-stream"></div>'; }

export function render(body, data, ctx) {
  const lines = data?.lines ?? [];
  const html = lines.map(l =>
    `<div class="pac-stream-line dir-${l.dir ?? 'out'}${l.isNew ? ' is-new' : ''}">${
      ' '.repeat((l.indent ?? 0) * 4)}${esc(l.text)}</div>`).join('');
  const cur = data?.cursor ? '<div class="pac-stream-line dir-in"><span class="pac-stream-cursor">&#9608;</span></div>' : '';
  const el = body.querySelector('.pac-stream');
  // Reserve the width of the WIDEST line the trace ever produces, so the panel is
  // sized for its final content from step 0 and does not widen as the text grows
  // (recursion-factorial-stack's expansion grew 179 -> 348px). Monospace, so a
  // character count reserves it exactly; measured once and cached on the ctx.
  el.style.minWidth = streamCols(ctx) + 'ch';
  el.innerHTML = html + cur;
  body.scrollTop = body.scrollHeight;
}

/* The longest line (in characters, indent included) this STREAM panel ever shows
 * across the whole trace. */
function streamCols(ctx) {
  const steps = ctx?.engine?.steps ?? [];
  if (!steps.length) return 0;                         // rendered before materialise -- don't cache
  if (ctx._streamCols != null) return ctx._streamCols;
  const id = ctx?.spec?.id ?? ctx?.spec?.type;
  let cols = 0;
  for (const s of steps)
    for (const l of (s.panels?.[id]?.lines ?? []))
      cols = Math.max(cols, (l.indent ?? 0) * 4 + String(l.text ?? '').length);
  return ctx ? (ctx._streamCols = cols) : cols;
}

const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
