/* CODE panel — listings with per-language variants.
 *
 * Step data: { line: 7 }  or  { line: {pseudo: 5, java: 7, cpp: 7} }
 *
 * Because each trace addresses its OWN listing's line numbers, the listings
 * never need to stay line-aligned with each other. That constraint would have
 * been unmaintainable across ~64 files and five years. */

export function mount(body, spec, ctx, tools) {
  spec._langs = Object.keys(spec.listings);
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

  // Stable layout: the CODE panel shows ~12–15 lines and scrolls internally, so
  // the active line must be scrolled into view as it moves (a jump into a
  // function body far down the listing would otherwise sit off-screen). Scroll
  // only THIS panel body (the overflow:auto container), never the page — centre
  // the active line in the visible area. See AUTHORING.md "Stable layout".
  const activeEl = body.querySelector('.pac-code-line.is-active');
  if (activeEl) {
    const bodyRect = body.getBoundingClientRect();
    const lineRect = activeEl.getBoundingClientRect();
    const delta = (lineRect.top - bodyRect.top) - (body.clientHeight - lineRect.height) / 2;
    body.scrollTop += delta;
  }
}

const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
