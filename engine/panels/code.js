/* CODE panel — listings with per-language variants.
 *
 * Step data: { line: 7 }  or  { line: {pseudo: 5, java: 7, cpp: 7} }
 *
 * Because each trace addresses its OWN listing's line numbers, the listings
 * never need to stay line-aligned with each other. That constraint would have
 * been unmaintainable across ~64 files and five years. */

export function mount(body, spec, ctx, tools) {
  // The tab set is the engine's resolved language set (`?lang=` may have narrowed
  // it -- PLANNED.md "Per-course language selection"); it defaults to every listing
  // key, so a ds page is unaffected. A single entry means one listing resolved, so
  // the tab bar is not rendered at all (rule 2: a lone tab is an affordance that
  // does nothing).
  spec._langs = ctx.engine.langs?.length ? ctx.engine.langs : Object.keys(spec.listings);
  if (spec._langs.length > 1) {
    tools.innerHTML = `<span class="pac-lang-tabs">${spec._langs.map(l =>
      `<button class="pac-lang-tab" data-lang="${l}">${spec.labels?.[l] ?? l}</button>`
    ).join('')}</span>`;
    tools.addEventListener('click', e => {
      const l = e.target.dataset?.lang;
      if (l) ctx.engine.setLanguage(l);
    });
  }
  body.innerHTML = '<div class="pac-code"></div>';
}

export function render(body, data, ctx, { lang }) {
  const spec = ctx.spec;
  const use = spec.listings[lang] ? lang : spec._langs[0];

  ctx.engine.root.querySelectorAll('.pac-lang-tab').forEach(t =>
    t.setAttribute('aria-selected', String(t.dataset.lang === use)));

  const active = (data?.line && typeof data.line === 'object') ? data.line[use] : data?.line;
  // When the code line itself is the memory-integrity culprit, the step sets
  // `dangerLine: true` and the active line is tinted red instead of blue.
  const danger = !!data?.dangerLine;
  // Parked caller lines: the call site of every caller still on the stack, shown
  // DIMMED so the student keeps sight of where the call came from and where it
  // returns (AUTHORING.md "Line highlight — active line vs. parked caller lines").
  // Each entry is a plain number or a per-language {pseudo,java,cpp} object;
  // resolve to THIS language. The active line always wins if they coincide
  // (bright beats dim), so drop it from the parked set.
  const parked = new Set((data?.parked ?? [])
    .map(p => (p && typeof p === 'object') ? p[use] : p)
    .filter(n => n != null && n !== active));

  body.querySelector('.pac-code').innerHTML = spec.listings[use].map((src, k) => {
    const n = k + 1;
    const cls = n === active ? (danger ? ' is-active is-danger' : ' is-active')
              : parked.has(n) ? ' is-parked' : '';
    return `<div class="pac-code-line${cls}">` +
           `<span class="pac-code-num">${n}</span><span>${esc(src)}</span></div>`;
  }).join('');

  // Follow the highlight, with context. The CODE panel is a fixed 15-line
  // viewport (see styles.css) that scrolls internally, and this listing's main()
  // is far from ADD/DELETE, so every call and return jumps the highlight across a
  // wide gap. Rules:
  //   - the highlighted line is ALWAYS visible (never let it scroll off);
  //   - keep context around it -- when we do scroll, centre it so the student
  //     sees what comes before and after, not pinned to an edge;
  //   - do NOT scroll when it is already comfortably in view -- moving on every
  //     step is as disorienting as never moving. Only scroll when the line would
  //     otherwise sit within MARGIN lines of the top or bottom edge.
  // Only the listing's scrollTop changes -- the panel's height and the rest of
  // the page never move. The scroll container is `.pac-code` (clipped to a whole
  // number of lines by the engine), not the body.
  const scroller = body.querySelector('.pac-code');
  const activeEl = scroller?.querySelector('.pac-code-line.is-active');
  if (scroller && activeEl) {
    const viewRect = scroller.getBoundingClientRect();
    const lineRect = activeEl.getBoundingClientRect();
    const lineH  = lineRect.height || 1;
    const offset = lineRect.top - viewRect.top;      // active line's position in the viewport
    const viewH  = scroller.clientHeight;
    const MARGIN = 3 * lineH;                          // keep >= 3 lines of context each side
    if (offset < MARGIN || offset > viewH - MARGIN - lineH) {
      // Bring it to roughly the middle, then SNAP scrollTop to a whole-line
      // boundary: an unsnapped scrollTop leaves the top line half-scrolled (a
      // sliver of the line above bleeding in, the bottom line clipped), which is
      // the same partial-line defect the viewport height guards against. Rounding
      // the target to a multiple of the line height keeps every visible line whole.
      const target = scroller.scrollTop + offset - (viewH - lineH) / 2;
      scroller.scrollTop = Math.round(target / lineH) * lineH;
    }
  }
}

const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
