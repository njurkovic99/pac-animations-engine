/* STREAM panel — append-only text, two directions.
 * Step data: { lines: [{text, dir, indent, isNew}], cursor: bool }
 * `dir: 'in'` renders a prompt / visible pause / echoed input. No file in the
 * original 25 modelled input at all, yet every CS1 assignment is prompt-driven. */

export function mount(body) { body.innerHTML = '<div class="pac-stream"></div>'; }

export function render(body, data) {
  const lines = data?.lines ?? [];
  const html = lines.map(l =>
    `<div class="pac-stream-line dir-${l.dir ?? 'out'}${l.isNew ? ' is-new' : ''}">${
      ' '.repeat((l.indent ?? 0) * 4)}${esc(l.text)}</div>`).join('');
  const cur = data?.cursor ? '<div class="pac-stream-line dir-in"><span class="pac-stream-cursor">&#9608;</span></div>' : '';
  body.querySelector('.pac-stream').innerHTML = html + cur;
  body.scrollTop = body.scrollHeight;
}

const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
