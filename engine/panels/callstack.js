/* CALLSTACK panel — a debugger's locals/stack pane.
 *
 * A vertical stack of call frames, newest on top (emphasized), callers below
 * greyed but present. Frames push on call and pop on return; `main` is the
 * bottom frame (the driver), so calls have a visible origin. This is what makes
 * parameter binding visible: when ADD calls INSERT(index, value), the INSERT
 * frame appears already showing index = 3 (count's value) and value = 40.
 *
 * A frame renders as ONE LINE — the call itself (AUTHORING.md "CALLSTACK panel —
 * frame layout"):
 *
 *     scan(expr = "a)(b")        push(c = '[')        main()
 *
 * function name, open paren, each PARAMETER as `name = value` comma-separated,
 * close paren. A frame with no parameters is just `main()` — no "no locals"
 * line, no empty rows. This keeps every frame a single line, so the panel's
 * height is the frame count, not padded slots.
 *
 * LOCALS (a loop `i`, a running `result`) are NOT part of the call, so they do
 * NOT go inside the parens. They render on continuation rows BELOW the call
 * line, and only for the frames that actually have them — a frame with no
 * locals stays one line tall. A var carries a local either as `kind: 'local'`
 * inside `vars`, or in a separate `locals` array (equivalent).
 *
 * Step data: { frames: [{fn, vars: [{name, value, role, kind}], locals?, active}] }
 *   - `frames` is ordered bottom-to-top: frames[0] is `main`, the last element
 *     is the currently-running (top) frame. Rendered newest-on-top and
 *     top-aligned within the panel's bounded cell, so the running frame is
 *     always visible and the pane scrolls internally if the stack outgrows the
 *     cell — the layout never reflows (AUTHORING.md "Stable layout").
 *   - `active: true` marks the running frame (emphasized); the rest are greyed.
 *   - a var's `role: 'active'` paints the blue activity fill — a value changing
 *     THIS step, the same colour rule as nodes/cells. `role: 'done'` greys a
 *     finished local (e.g. the loop `i` after the loop) so it stays visible in
 *     the frame until the function returns rather than vanishing mid-frame.
 *   - a var's `kind: 'local'` moves it out of the call parens onto a
 *     continuation row; the default (a parameter) renders inline in the call.
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

    const all = f.vars ?? [];
    // Parameters render inline in the call parens; locals drop to continuation
    // rows. A var is a local via `kind: 'local'`, or via the frame's `locals`.
    const params = all.filter(v => v.kind !== 'local');
    const locals = all.filter(v => v.kind === 'local').concat(f.locals ?? []);

    // The call line: fn(name = value, …). No parameters → fn().
    const args = params.map(v =>
      `<span class="pac-arg"${v.role ? ` data-role="${esc(v.role)}"` : ''}>` +
        `<span class="pac-arg-name">${esc(v.name)}</span>` +
        `<span class="pac-arg-eq"> = </span>` +
        `<span class="pac-arg-val">${esc(v.value)}</span>` +
      `</span>`
    ).join('<span class="pac-arg-sep">, </span>');

    let html =
      `<div class="pac-frame-call">` +
        `<span class="pac-frame-fn">${esc(f.fn)}</span>` +
        `<span class="pac-paren">(</span>` +
        args +
        `<span class="pac-paren">)</span>` +
      `</div>`;

    // Continuation rows — only when the frame has locals.
    if (locals.length) {
      html += `<div class="pac-frame-locals">` + locals.map(v =>
        `<div class="pac-frame-var"${v.role ? ` data-role="${esc(v.role)}"` : ''}>` +
          `<span class="pac-frame-var-name">${esc(v.name)}</span>` +
          `<span class="pac-frame-var-val">${esc(v.value)}</span>` +
        `</div>`
      ).join('') + `</div>`;
    }

    frame.innerHTML = html;
    wrap.appendChild(frame);
  }
}

const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
