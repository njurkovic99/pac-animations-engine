/* SLIDER panel — a narrow, deliberate exception to WATCH-only.
 *
 * Every animation in this project is WATCH-only: no gates, no questions, no
 * branches. A slider is a departure and stays a narrow one. The distinction that
 * keeps it WATCH-safe (AUTHORING.md / the build brief):
 *   - A GATE interrupts the trace, poses a question, and has a right answer.
 *     Still forbidden. THINK mode remains deferred (PLANNED.md).
 *   - A SLIDER explores the same data without branching or judging. No question,
 *     no right answer, no alternate path; the step sequence is unaffected.
 *
 * The control lives in its own compact panel, PRESENT FROM STEP 0 at its final
 * size so nothing moves when it becomes usable. It is INERT (visibly dimmed, not
 * interactive) until the trace reaches its last step, then goes live. Moving it
 * asks the engine to re-read the chart marker and the readout at the chosen n
 * (engine.onSlide → spec.slider.frame(n)); it changes neither the step, the
 * narration, nor the note. Back/Next keep working exactly as before.
 *
 * The n→(chart, readout) mapping is animation logic and lives in the content file
 * (spec.slider.frame); this renderer only reports the chosen value and reflects
 * the live/inert state. Config (min/max/step/default/labels) comes from
 * spec.slider. Step data: { live: bool }. */

export function mount(body, spec, ctx) {
  const cfg = ctx.engine.spec.slider ?? {};
  const fmt = cfg.format ?? (n => String(n));
  body.innerHTML =
    `<div class="pac-slider" data-live="false">
       <div class="pac-slider-value"><span class="pac-slider-n">${esc(fmt(cfg.default ?? cfg.min ?? 0))}</span></div>
       <input class="pac-slider-input" type="range"
              min="${cfg.min ?? 0}" max="${cfg.max ?? 100}" step="${cfg.step ?? 1}"
              value="${cfg.default ?? cfg.min ?? 0}"
              aria-label="${esc(cfg.label ?? 'value')}" disabled>
       <div class="pac-slider-scale"><span>${esc(fmt(cfg.min ?? 0))}</span><span>${esc(fmt(cfg.max ?? 100))}</span></div>
       <div class="pac-slider-hint"></div>
     </div>`;

  const input = body.querySelector('.pac-slider-input');
  const nEl   = body.querySelector('.pac-slider-n');
  // The value display updates on every drag; the engine re-renders only the chart
  // and readout (not this panel), so keep the readout of n current here directly.
  input.addEventListener('input', () => {
    const n = +input.value;
    nEl.textContent = fmt(n);
    ctx.engine.onSlide(n);
  });
}

export function render(body, data, ctx) {
  const wrap  = body.querySelector('.pac-slider');
  const input = body.querySelector('.pac-slider-input');
  const nEl   = body.querySelector('.pac-slider-n');
  const hint  = body.querySelector('.pac-slider-hint');
  if (!wrap) return;
  const cfg  = ctx.engine.spec.slider ?? {};
  const fmt  = cfg.format ?? (n => String(n));
  const live = !!(data && data.live);

  wrap.dataset.live = live ? 'true' : 'false';
  input.disabled = !live;
  // Reflect the engine's remembered value (so returning to the live step resumes
  // where the slider was left), and keep the input in sync with it.
  const n = ctx.engine.sliderN ?? cfg.default ?? cfg.min ?? 0;
  input.value = n;
  nEl.textContent = fmt(n);
  hint.textContent = live
    ? (cfg.liveHint ?? 'Live — drag to read the times at any size.')
    : (cfg.inertHint ?? 'Available once the graph is complete.');
}

const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
