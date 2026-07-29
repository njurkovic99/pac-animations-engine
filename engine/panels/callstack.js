/* CALLSTACK panel — a debugger's locals/stack pane.
 *
 * A vertical stack of call frames, newest on top (emphasized), callers below
 * greyed but present. Each frame shows its function name, bound parameters, and
 * active locals with live values. Frames push on call and pop on return; `main`
 * is the bottom frame (the driver), so calls have a visible origin. This is what
 * makes parameter binding visible: when ADD calls INSERT(count, value), the
 * INSERT frame appears already showing index = 3 (count's value) and value = 40.
 *
 * Step data: { frames: [{fn, vars: [{name, value, role}], active}] }
 *   - `frames` is ordered bottom-to-top: frames[0] is `main`, the last element
 *     is the currently-running (top) frame. Rendered newest-on-top, and pinned
 *     to the bottom of the (fixed-height) cell so `main` never moves and the
 *     layout never reflows (AUTHORING.md "Stable layout").
 *   - `active: true` marks the running frame (emphasized); the rest are greyed.
 *   - a var's `role: 'active'` paints the blue activity fill — a local changing
 *     THIS step, the same colour rule as nodes/cells. `role: 'done'` greys a
 *     finished local (e.g. the loop `i` after the loop) so it stays visible in
 *     the frame until the function returns rather than vanishing mid-frame.
 *   - the data model tolerates a future per-var `kind: 'copy'|'reference'` for
 *     pass-by-value vs. pass-by-reference animations; not rendered yet (deferred
 *     per AUTHORING.md "CALLSTACK panel"). */

export function mount(body) { body.innerHTML = '<div class="pac-callstack"></div>'; }

export function render(body, data) {
  const wrap = body.querySelector('.pac-callstack');
  wrap.innerHTML = '';
  const frames = data?.frames ?? [];

  // Newest on top: walk from the top of the stack (end of the array) down to
  // `main` (index 0), so the DOM order is newest → main.
  for (let k = frames.length - 1; k >= 0; k--) {
    const f = frames[k];
    const frame = document.createElement('div');
    frame.className = 'pac-frame';
    frame.dataset.active = String(!!f.active);

    const vars = (f.vars ?? []).map(v =>
      `<div class="pac-frame-var"${v.role ? ` data-role="${esc(v.role)}"` : ''}>` +
        `<span class="pac-frame-var-name">${esc(v.name)}</span>` +
        `<span class="pac-frame-var-val">${esc(v.value)}</span>` +
      `</div>`
    ).join('');

    frame.innerHTML =
      `<div class="pac-frame-fn">${esc(f.fn)}</div>` +
      `<div class="pac-frame-vars">${vars || '<div class="pac-frame-empty">no locals</div>'}</div>`;
    wrap.appendChild(frame);
  }
}

const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
