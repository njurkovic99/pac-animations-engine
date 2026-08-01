/* pac-animations — engine
 *
 * Drives one or more generators in lockstep, renders declarative step
 * snapshots into registered panels, derives metrics from step tags.
 *
 * Core decisions (see PANEL-INVENTORY.md):
 *  - Steps are SNAPSHOTS, not deltas. render(step) is idempotent, so
 *    stepping backwards is just render(steps[i-1]). No undo stack.
 *  - A generator that yields literals IS a step array. Precomputed,
 *    live, and race animations share one driver.
 *  - Counters are DERIVED from step tags. Nothing increments by hand.
 *  - Exactly one setInterval, cleared in exactly one place.
 */

import * as codePanel      from './panels/code.js';
import * as cellsPanel     from './panels/cells.js';
import * as nodesPanel     from './panels/nodes.js';
import * as streamPanel    from './panels/stream.js';
import * as chartPanel     from './panels/chart.js';
import * as callstackPanel from './panels/callstack.js';
import { Overlay }         from './overlay/arrows.js';

const RENDERERS = {
  code: codePanel, cells: cellsPanel, nodes: nodesPanel,
  stream: streamPanel, chart: chartPanel, callstack: callstackPanel,
};

const MAX_STEPS = 5000;
const AUTOPLAY_MS = 900;

// Default student-facing panel titles per renderer (used when a panel declares
// no `title`). The CALLSTACK renderer displays as "Function calls" -- the
// internal name stays CALLSTACK everywhere in code and docs.
const DEFAULT_TITLES = { callstack: 'Function calls' };

export class Engine {
  constructor(root, spec) {
    this.root = root;
    this.spec = spec;
    this.lang = spec.languages?.[0] ?? null;
    this.timer = null;                 // the ONLY timer handle
    this.panels = new Map();
    this.overlay = null;
    this.trace = spec.initialTrace ?? 'correct';
    this.i = 0;
    this.steps = [];
    this._flashedAt = -1;              // last step index the narration pulsed on
    this._build();
    this.loadTrace(this.trace);
  }

  /* ---------- materialisation ---------- */

  /** Run a generator (or n of them, in lockstep) into a flat snapshot array. */
  materialise(traceName) {
    const t = this.spec.traces[traceName];
    if (!t) throw new Error(`no trace "${traceName}"`);

    // Single generator.
    if (typeof t === 'function') return take(t(), MAX_STEPS);

    // Race: { racers: {name: genFn}, merge(frames) -> step }
    const gens = Object.entries(t.racers).map(([k, g]) => [k, g()]);
    const out = [];
    while (out.length < MAX_STEPS) {
      const frame = {};
      let live = 0;
      for (const [k, g] of gens) {
        const r = g.next();
        if (!r.done) { frame[k] = r.value; live++; }
      }
      if (!live) break;
      out.push(t.merge(frame, out.length));
    }
    return out;
  }

  loadTrace(name) {
    this.stop();
    this.trace = name;
    this.steps = this.materialise(name);
    this.i = 0;
    this.reserveHeights();
    this.fitCodePanels();
    this.render();
  }

  /**
   * Size each CODE panel to as many WHOLE lines as fit in its column, floored at
   * --code-lines (15 -- the Canvas-iframe minimum, never go below it) and capped
   * at the listing's own length (never show a slot past the last line; a shorter
   * listing pads to the floor). The last visible line is always whole.
   *
   * Resolved ONCE from the viewport -- on load and on a real window resize -- then
   * held constant. It must NOT respond to content: not as the step advances, as
   * frames push/pop, or as the language tab changes. A content-driven height is
   * the reflow bug fixed in STREAM/CALLSTACK. Measured by letting the body fill
   * its cell (it scrolls, so the listing's own length can't inflate the cell),
   * reading the available height, then pinning a whole-line height.
   */
  fitCodePanels() {
    const cs = getComputedStyle(this.root);
    const lineH  = parseFloat(cs.getPropertyValue('--code-line-h')) || 20.6;
    const floorL = parseFloat(cs.getPropertyValue('--code-lines'))  || 15;
    const padV   = parseFloat(cs.getPropertyValue('--body-pad'))     || 22;
    for (const [, p] of this.panels) {
      if (p.spec.type !== 'code') continue;
      const panel = p.el, body = panel.querySelector('.pac-panel-body');
      if (!body) continue;
      const maxLen = Math.max(1, ...Object.values(p.spec.listings ?? {}).map(l => l.length));
      // Measure the column height available to this panel by letting the body
      // fill its grid cell. The listing itself is HIDDEN during the measure, so
      // its length cannot inflate the cell -- the cell is sized purely by the
      // other column (the reserved panels), which is exactly the height the code
      // should match. Then restore and pin a whole-line height.
      const code = body.querySelector('.pac-code');
      const savedAlign = panel.style.alignSelf, savedFlex = body.style.flex, savedDisp = code ? code.style.display : '';
      if (code) code.style.display = 'none';
      panel.style.alignSelf = 'stretch';
      body.style.height = 'auto';
      body.style.flex = '1';
      void body.offsetHeight;                                  // force reflow
      const avail = body.clientHeight;                         // cell inner height (content-box + padding)
      const fit = Math.floor((avail - padV) / lineH);          // whole lines that fit
      const lines = Math.max(floorL, Math.min(maxLen, fit));
      if (code) code.style.display = savedDisp;
      panel.style.alignSelf = savedAlign;
      body.style.flex = savedFlex;
      // The body FILLS the column (its bottom lines up with the other column);
      // the listing is clipped to `lines` WHOLE lines, so the last line is never
      // a sliver and the sub-line remainder is blank space below it, not a gap.
      body.style.height = `${Math.round(avail)}px`;
      if (code) code.style.maxHeight = `${Math.round(lines * lineH)}px`;
    }
  }

  /**
   * Reserve every panel's height ONCE, from the maximum content it holds across
   * the ENTIRE step sequence, so a step that is empty or shallow renders as
   * reserved empty space rather than a smaller panel. Nothing below any panel
   * moves as steps advance -- no reflow, ever. Measured up front by rendering
   * each step's data for the panel and taking the tallest, then pinning the
   * body's min-height. Panels that manage their own fixed viewport (CODE = 15
   * lines, STREAM = 3 lines) are skipped -- their height is already constant.
   * This is the general cure for the height-change bug class (collapsed empty
   * cells, the parked-marker lane, an accumulating STREAM, a growing CALLSTACK).
   * See AUTHORING.md "Stable layout".
   */
  reserveHeights() {
    for (const [id, p] of this.panels) {
      if (p.spec.type === 'code' || p.spec.type === 'stream') continue;
      const bodyEl = p.el.querySelector('.pac-panel-body');
      if (!bodyEl) continue;
      bodyEl.style.minHeight = '';                 // reset before measuring
      let maxH = 0;
      for (const step of this.steps) {
        p.ctx.anchors.clear();
        p.renderer.render(bodyEl, step.panels?.[id], p.ctx, { lang: this.lang, step });
        if (bodyEl.scrollHeight > maxH) maxH = bodyEl.scrollHeight;
      }
      bodyEl.style.minHeight = `${maxH}px`;
    }
  }

  /* ---------- derived metrics ---------- */

  metrics(upTo = this.i) {
    const counts = {};
    for (let k = 0; k <= upTo && k < this.steps.length; k++) {
      const tag = this.steps[k].tag;
      if (tag) counts[tag] = (counts[tag] ?? 0) + 1;
    }
    return counts;
  }

  /* ---------- stepping ---------- */

  get step()   { return this.steps[this.i] ?? {}; }
  get atEnd()  { return this.i >= this.steps.length - 1; }

  next() {
    if (this.atEnd) return this.stop();
    this.i++;
    this.render();
  }

  prev() {
    this.stop();
    if (this.i > 0) { this.i--; this.render(); }
  }

  reset() {
    this.stop();
    this.i = 0;
    this.render();
  }

  play() {
    if (this.timer || this.atEnd) return;
    this.timer = setInterval(() => this.next(), AUTOPLAY_MS);
    this.render();
  }

  /** The single clearInterval in the codebase. Seven of the original
   *  thirteen files never called it at all. */
  stop() {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    this.render();
  }

  /* ---------- construction ---------- */

  _build() {
    const s = this.spec;
    this.root.className = 'pac-root';
    this.root.dataset.profile = s.profile ?? 'standard';

    this.root.innerHTML = `
      <h1 class="pac-title"></h1>
      <p class="pac-sub"></p>
      <a class="pac-openwin" target="_blank" rel="noopener" hidden></a>
      <div class="pac-stage"></div>
      <div class="pac-controls">
        <button class="pac-btn" data-act="prev">&larr; Back</button>
        <button class="pac-btn pac-btn-primary" data-act="next">Next Step &rarr;</button>
        <button class="pac-btn" data-act="play">Play</button>
        <button class="pac-btn" data-act="reset">Reset</button>
        <span class="pac-metrics"></span>
        <span class="pac-progress"></span>
      </div>
      <div class="pac-narrate"></div>
      <div class="pac-note pac-note-empty" role="note"></div>`;

    this.root.querySelector('.pac-title').textContent = s.title ?? '';
    this.root.querySelector('.pac-sub').textContent = s.subtitle ?? '';
    this._buildOpenWindowLink();
    this.stage    = this.root.querySelector('.pac-stage');
    this.narrate  = this.root.querySelector('.pac-narrate');
    this.noteBox  = this.root.querySelector('.pac-note');
    this.metricsEl= this.root.querySelector('.pac-metrics');
    this.progress = this.root.querySelector('.pac-progress');

    if (s.columns) this.stage.dataset.cols = s.columns;

    // A multi-row layout (more than the default two grid rows -- e.g. the race
    // comparison's code / queue / strip stack per column) declares its own row
    // proportions via `spec.stageRows` (a CSS grid-template-rows value). The
    // stage then relaxes its two-row bound and fills the viewport above the
    // pinned footer instead, still shrinking on a short viewport so the note is
    // never pushed off screen (see AUTHORING.md "Stable layout"). Absent, the
    // default bounded two-row grid is unchanged.
    if (s.stageRows) {
      this.stage.dataset.multirow = '';
      this.stage.style.gridTemplateRows = s.stageRows;
    }

    // Beginner profile is enforced here, not left to authorial restraint.
    const panels = (s.panels ?? []).slice();
    if (s.profile === 'beginner' && panels.length > 3) {
      console.warn(`beginner profile caps panels at 3; dropping ${panels.length - 3}`);
      panels.length = 3;
    }

    for (const p of panels) {
      const el = document.createElement('section');
      el.className = 'pac-panel';
      el.dataset.type = p.type;          // lets CSS give accumulating panels (STREAM) a stable, scrolling cell
      // A panel holding very little content (a two-value count/capacity strip)
      // opts out of stretching to fill its tall grid cell: `compact: true` makes
      // it top-align and size to content. See AUTHORING.md "Stable layout".
      if (p.compact) el.dataset.compact = '';
      // A full-width panel spans every column (grid-column: 1 / -1) -- e.g. a
      // shared preamble sitting above a two-column comparison.
      if (p.full) el.dataset.full = '';
      // A tall panel spans every row of the first column (grid-row: 1 / -1) --
      // e.g. a code listing beside a stack of smaller panels in the other column.
      if (p.tall) el.dataset.tall = '';
      // Default DISPLAY title per renderer when a panel gives none. The internal
      // renderer name stays CALLSTACK; only the student-facing label reads
      // "Function calls" (so it is not confused with an actual stack data
      // structure in the stacks animations).
      const title = p.title ?? DEFAULT_TITLES[p.type] ?? p.type;
      el.innerHTML = `<div class="pac-panel-head"><span>${title}</span>
                        <span class="pac-panel-tools"></span></div>
                      <div class="pac-panel-body"></div>`;
      this.stage.appendChild(el);
      const r = RENDERERS[p.type];
      if (!r) throw new Error(`unknown panel type "${p.type}"`);
      const ctx = {
        engine: this,
        spec: p,
        anchors: new Map(),
        anchor: (name, node) => ctx.anchors.set(name, node),
      };
      r.mount?.(el.querySelector('.pac-panel-body'), p, ctx,
                el.querySelector('.pac-panel-tools'));
      this.panels.set(p.id ?? p.type, { spec: p, el, renderer: r, ctx });
    }

    this.overlay = new Overlay(this.stage);

    this.root.querySelector('.pac-controls').addEventListener('click', e => {
      const act = e.target.dataset?.act;
      if (!act) return;
      if (act === 'play') this.timer ? this.stop() : this.play();
      else this[act]();
    });

    // Back-stepping via keyboard, because beginners miss steps.
    window.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') this.next();
      if (e.key === 'ArrowLeft')  this.prev();
    });

    // The CODE line count follows the VIEWPORT: recompute on a real window
    // resize (debounced), never on a content change. This is the only thing that
    // re-fits the panel; steps/frames/tabs leave it constant.
    window.addEventListener('resize', () => {
      clearTimeout(this._fitTimer);
      this._fitTimer = setTimeout(() => { this.fitCodePanels(); this.render(); }, 120);
    });
  }

  /**
   * The open-in-own-window escape hatch (AUTHORING.md "Open-in-own-window
   * link"). Canvas steals ~300px of chrome before an embedded animation even
   * begins; a self-link with target="_blank" opens the same page in a new tab
   * where it gets the whole window. It is iframe-aware: a lifeline shown
   * prominently when embedded, silent when the animation is already
   * full-window (standalone). Built into the engine, so every animation
   * inherits it -- no per-animation opt-in.
   */
  _buildOpenWindowLink() {
    const link = this.root.querySelector('.pac-openwin');
    if (!link) return;
    // The iframe's own URL, which is exactly what we want to open full-window.
    link.href = window.location.href;
    // window.self !== window.top is the embedding test. The identity comparison
    // is same-origin-safe: it never touches a cross-origin property, so it
    // cannot throw even when Canvas serves the page from another origin.
    const embedded = window.self !== window.top;
    if (embedded) {
      link.textContent = '⛶ Scrolling to see it all? Open in its own window';
      link.hidden = false;
    } else {
      // Already full-window -- the hint would just be noise, so stay silent.
      link.hidden = true;
    }
  }

  setLanguage(lang) { this.lang = lang; this.render(); }

  /* ---------- render ---------- */

  render() {
    const step = this.step;

    for (const [id, p] of this.panels) {
      let data = step.panels?.[id];
      // A step carries its active source line at the TOP level (`step.line`),
      // not inside `panels.<codeId>` -- one line drives every code panel and
      // every language variant. Thread it in so the highlight actually moves.
      // Supports a plain number or a per-language {pseudo, java, cpp} object;
      // a null/absent line means "highlight nothing" (intro, note, final).
      // `dangerLine` rides alongside: when set, the highlighted line is tinted
      // red instead of blue -- the code itself is the memory-integrity culprit.
      // `parked` also rides alongside: the call-site line of every caller still
      // on the stack, dimmed so the student keeps sight of where the call came
      // from (AUTHORING.md "Line highlight -- active line vs. parked caller
      // lines"). Bright = running now, dim = suspended.
      //
      // Race mode has TWO code panels that highlight DIFFERENT lines on the same
      // step (and one may highlight nothing while it idles). So a code panel
      // prefers a `line` supplied inside its own panel data (`panels.<codeId>`)
      // and only falls back to the single top-level `step.line` when it declares
      // none -- keeping the single-listing animations unchanged.
      if (p.spec.type === 'code') {
        const pLine = (data && 'line' in data) ? data.line : step.line;
        data = { ...data, line: pLine, dangerLine: step.dangerLine, parked: step.parked };
      }
      p.ctx.anchors.clear();
      p.renderer.render(p.el.querySelector('.pac-panel-body'),
                        data, p.ctx, { lang: this.lang, step });
    }

    this.overlay.draw(step.arrows ?? [], this.panels);

    // Narration and notes are both SEGMENTED content: a plain string, or an
    // array of segments where {danger:true, text} renders a leading red warning
    // triangle in --error. renderSegments handles both and returns whether any
    // content was written.
    renderSegments(this.narrate, step.narrate);

    // The teaching-note box holds non-execution commentary (setup, a common-
    // mistake aside, a post-watch challenge). A note attaches to a step and
    // shows only while that step is current; on steps without one the box
    // collapses to zero height (pac-note-empty -> display:none) and the layout
    // reflows. See AUTHORING.md "Steps vs. notes".
    const hasNote = renderSegments(this.noteBox, step.note);
    this.noteBox.classList.toggle('pac-note-empty', !hasNote);

    // Pulse narration (and a present note) only when the step index actually
    // changes, so a new explanation catches the eye but pausing/stopping in
    // place does not reflash. A note appearing should feel like the animation
    // saying "pay attention to this."
    if (this.i !== this._flashedAt) {
      this._flashedAt = this.i;
      flash(this.narrate, 'pac-narrate-flash');
      if (hasNote) flash(this.noteBox, 'pac-note-flash');
    }
    this.progress.textContent = `${Math.min(this.i + 1, this.steps.length)} / ${this.steps.length}`;

    // Metrics are HIDDEN BY DEFAULT (see AUTHORING.md "Metrics readout").
    // The tag-derived counter is an internal mechanism; the raw tag name
    // (`assign`) is engine jargon, not student-facing. An animation opts in
    // via `spec.metrics`, a map from tag -> plain student-facing label. Only
    // listed tags render, and always with the label, never the raw tag. No
    // opt-in -> no readout (an insertion or single walk-through shows none).
    const labels = this.spec.metrics ?? {};
    const counts = this.metrics();
    this.metricsEl.innerHTML = Object.entries(labels)
      .filter(([tag]) => counts[tag] != null)
      .map(([tag, label]) => `${label} <b>${counts[tag]}</b>`).join('');

    this.root.querySelector('[data-act="prev"]').disabled = this.i === 0;
    this.root.querySelector('[data-act="next"]').disabled = this.atEnd;
    this.root.querySelector('[data-act="play"]').textContent = this.timer ? 'Pause' : 'Play';
    this.root.querySelector('[data-act="play"]').disabled = this.atEnd;
  }
}

function take(gen, max) {
  const out = [];
  for (const v of gen) { out.push(v); if (out.length >= max) break; }
  return out;
}

/** Restart a one-shot CSS pulse: drop the class, force reflow, re-add. */
function flash(el, cls) {
  el.classList.remove(cls);
  void el.offsetWidth;               // force reflow so the animation restarts
  el.classList.add(cls);
}

/* The red warning triangle for a memory-integrity violation. Project-wide,
 * cross-course convention -- red ⚠ always means "memory just went wrong". */
const DANGER_MARK = '⚠';

/**
 * Render segmented content (narration or a note) into `el`.
 *
 * `content` is either a plain string (the common case -- nearly every step),
 * or an array of segments. A segment is a string, or an object; an object with
 * `danger: true` renders a leading red ⚠ and the danger-red colour (--error),
 * naming a memory-integrity violation. Returns true iff anything was written,
 * so the caller can collapse an empty note box.
 */
function renderSegments(el, content) {
  el.textContent = '';
  if (content == null || content === '') return false;
  const segs = Array.isArray(content) ? content : [content];
  let wrote = false;
  for (const seg of segs) {
    if (seg == null || seg === '') continue;
    if (typeof seg === 'string') {
      el.appendChild(document.createTextNode(seg));
      wrote = true;
    } else if (seg.danger) {
      const span = document.createElement('span');
      span.className = 'pac-danger';
      span.textContent = `${DANGER_MARK} ${seg.text ?? ''}`;
      el.appendChild(span);
      wrote = true;
    } else if (typeof seg.text === 'string') {
      el.appendChild(document.createTextNode(seg.text));
      wrote = true;
    }
  }
  return wrote;
}

/** Mount an animation from its content module. */
export function mount(spec, el = document.getElementById('pac')) {
  return new Engine(el, spec);
}
