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
    this.layoutStage();
    this.render();
  }

  /**
   * THE LAYOUT PASS. Resolves every panel's size AND its column ONCE -- on load
   * and on a real window resize -- then holds. This is the master invariant:
   * nothing on screen moves because a step advanced. See AUTHORING.md "Panels
   * flow across both columns", "The structure region has a ceiling",
   * "Bookkeeping panels get a 2-row floor".
   *
   * Resolution order (this is what makes the ceiling bite):
   *   1. Bookkeeping panels (callstack, stream, compact strips) size to content
   *      with a 2-row FLOOR so none collapses to a sliver.
   *   2. The structure region (the CELLS/NODES panels showing the data structure)
   *      takes what it needs up to a CEILING of half the stage height, its panes
   *      side by side; a pane that overflows scrolls and follows its active cell.
   *   3. The code panel takes a 15-line FLOOR in the left column.
   *   4. Any leftover slack goes to the CODE panel -- the only panel that always
   *      has more listing it could usefully show.
   *
   * Placement: the code panel anchors the top of the LEFT column; the structure
   * region sits at the top of the RIGHT column; bookkeeping panels flow down the
   * right column and the balancing overflow continues beneath the code panel in
   * the left, keeping declaration (reading) order within each column.
   */
  layoutStage() {
    const cs = getComputedStyle(this.root);
    const gap     = parseFloat(cs.getPropertyValue('--gap')) || 14;
    const lineH   = parseFloat(cs.getPropertyValue('--code-line-h')) || 20.6;
    const floorL  = parseFloat(cs.getPropertyValue('--code-lines')) || 15;
    const bodyPad = parseFloat(cs.getPropertyValue('--body-pad')) || 22;
    const BORDER  = 2;                          // a panel's 1px top + bottom border

    const items     = [...this.panels.values()];
    const code      = items.find(p => p.kind === 'code');
    const structure = items.filter(p => p.kind === 'structure');
    const book      = items.filter(p => p.kind === 'book');

    const H = this._availableStageHeight();

    // Reserve each panel's body to its per-step MAXIMUM content height, so it
    // never changes size as steps advance (the cure for the height-change bug
    // class: collapsed empty cells, a growing CALLSTACK, an accumulating STREAM).
    const measure = p => {
      const body = p.el.querySelector('.pac-panel-body');
      body.style.minHeight = ''; body.style.height = '';
      const codeEl = body.querySelector('.pac-code');
      if (codeEl) codeEl.style.maxHeight = '';
      const id = p.spec.id ?? p.spec.type;
      let m = 0;
      for (const step of this.steps) {
        p.ctx.anchors.clear();
        p.renderer.render(body, step.panels?.[id], p.ctx, { lang: this.lang, step });
        m = Math.max(m, body.scrollHeight);
      }
      p.headerH  = p.el.querySelector('.pac-panel-head').offsetHeight;
      p.contentH = m;
    };
    for (const p of [...structure, ...book]) measure(p);
    if (code) code.headerH = code.el.querySelector('.pac-panel-head').offsetHeight;

    const outer = (p, bodyH) => p.headerH + bodyH + BORDER;

    // (2) structure region -- capped at half the stage; panes share its height.
    const ceiling = Math.max(140, Math.floor(H / 2));
    let regionH = 0;
    for (const p of structure) regionH = Math.max(regionH, Math.min(outer(p, p.contentH), ceiling));

    // (1) bookkeeping floors -- 2 content rows minimum.
    const bookFloor = 2 * lineH + bodyPad;
    for (const p of book) p.outerH = outer(p, Math.max(p.contentH, bookFloor));

    // (3) code 15-line floor.
    const codeFloor = code ? outer(code, floorL * lineH + bodyPad) : 0;

    // Balance: right column = [region, book[0..k)], left = [code, book[k..)].
    // Pick the split k (keeping declaration order) that minimises the taller
    // column, so the stage is as short as the content allows.
    const bh = book.map(p => p.outerH);
    const sum = a => a.reduce((s, h) => s + h, 0);
    const colH = (base, arr, hasBase) => {
      const items = (hasBase ? 1 : 0) + arr.length;
      return base + sum(arr) + gap * Math.max(0, items - 1);
    };
    let bestK = 0, bestStage = Infinity;
    for (let k = 0; k <= book.length; k++) {
      const right = colH(regionH, bh.slice(0, k), regionH > 0);
      const left  = colH(codeFloor, bh.slice(k), !!code);
      const stage = Math.max(right, left);
      if (stage < bestStage) { bestStage = stage; bestK = k; }
    }
    const stageH = Math.min(bestStage, H);

    // Place bookkeeping panels into their columns (structure stays in the region,
    // code stays at the top of the left column).
    for (const p of book.slice(0, bestK)) this.colRight.appendChild(p.el);
    for (const p of book.slice(bestK))    this.colLeft.appendChild(p.el);

    // Apply heights. Structure panes fill the fixed-height region (flex), so they
    // stay constant and scroll internally; bookkeeping bodies pin a min-height.
    this.stage.style.height = `${Math.round(stageH)}px`;
    this.structureRegion.style.height = regionH > 0 ? `${Math.round(regionH)}px` : '';
    for (const p of book) {
      p.el.querySelector('.pac-panel-body').style.minHeight =
        `${Math.round(p.outerH - p.headerH - BORDER)}px`;
    }

    // (4) code absorbs the left column's leftover slack -- but only up to the
    // number of lines it actually HAS. It shows as many whole lines as fit the
    // available height, floored at 15 (the Canvas minimum) and never more than the
    // listing's length, so a short listing does not stretch into a tall panel of
    // empty rows. Any slack beyond that stays as empty column space below it.
    if (code) {
      const leftBook = book.slice(bestK);
      const leftUsed = sum(leftBook.map(p => p.outerH)) + gap * leftBook.length;
      const avail   = Math.max(codeFloor, Math.round(stageH - leftUsed));
      const maxLen  = Math.max(1, ...Object.values(code.spec.listings ?? {}).map(l => l.length));
      const fit     = Math.floor((avail - code.headerH - BORDER - bodyPad) / lineH);
      const lines   = Math.max(floorL, Math.min(maxLen, fit));
      const body    = code.el.querySelector('.pac-panel-body');
      body.style.height = `${Math.round(lines * lineH + bodyPad)}px`;
      const codeEl = body.querySelector('.pac-code');
      if (codeEl) codeEl.style.maxHeight = `${Math.round(lines * lineH)}px`;
    }
  }

  /** Height the stage may occupy: the root's inner height minus the fixed footer
   *  chrome (title, subtitle, open-window link, controls, narration, note) and
   *  the stage's own margins. The ceiling for the layout; the stage usually hugs
   *  a shorter balanced height and only reaches this on a short viewport. */
  _availableStageHeight() {
    const root = this.root, rp = getComputedStyle(root);
    let avail = root.clientHeight - parseFloat(rp.paddingTop) - parseFloat(rp.paddingBottom);
    for (const el of root.children) {
      if (el === this.stage) continue;
      const c = getComputedStyle(el);
      if (c.display === 'none') continue;
      avail -= el.offsetHeight + parseFloat(c.marginTop) + parseFloat(c.marginBottom);
    }
    const sm = getComputedStyle(this.stage);
    avail -= parseFloat(sm.marginTop) + parseFloat(sm.marginBottom);
    return Math.max(200, avail);
  }

  /** A structure pane that overflows its capped region scrolls to keep its active
   *  element in view -- the same "follow the highlight" behaviour the CODE panel
   *  has, so a student never hunts for the cell being modified (AUTHORING.md "The
   *  structure region has a ceiling"). A pane that fits does nothing. */
  _followActive() {
    for (const [, p] of this.panels) {
      if (p.kind !== 'structure') continue;
      const body = p.el.querySelector('.pac-panel-body');
      if (!body || body.scrollHeight <= body.clientHeight + 1) continue;
      const target = body.querySelector('[data-role="active"], [data-role="compared"], [data-active="true"], .pac-marker');
      if (!target) continue;
      const br = body.getBoundingClientRect(), tr = target.getBoundingClientRect();
      const offset = tr.top - br.top, margin = 24;
      if (offset < margin || offset > body.clientHeight - margin - tr.height) {
        body.scrollTop += offset - (body.clientHeight - tr.height) / 2;
      }
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

    // Two columns that panels FLOW across (AUTHORING.md "Panels flow across both
    // columns"). The code panel anchors the top of the LEFT column at its 15-line
    // floor; structure panels sit side by side in a height-capped region at the
    // top of the RIGHT column; bookkeeping panels flow down the right column and
    // the balancing overflow continues beneath the code panel in the left.
    // layoutStage() measures and places everything ONCE (the master invariant).
    // `columns`, `stageRows`, `tall`, and `full` are legacy grid hints, now
    // ignored -- placement is derived from each panel's kind.
    this.colLeft  = document.createElement('div');
    this.colRight = document.createElement('div');
    this.colLeft.className  = 'pac-col'; this.colLeft.dataset.side  = 'left';
    this.colRight.className = 'pac-col'; this.colRight.dataset.side = 'right';
    this.structureRegion = document.createElement('div');
    this.structureRegion.className = 'pac-structure';
    this.colRight.appendChild(this.structureRegion);
    this.stage.append(this.colLeft, this.colRight);

    // Beginner profile is enforced here, not left to authorial restraint.
    const panels = (s.panels ?? []).slice();
    if (s.profile === 'beginner' && panels.length > 3) {
      console.warn(`beginner profile caps panels at 3; dropping ${panels.length - 3}`);
      panels.length = 3;
    }

    for (const p of panels) {
      const el = document.createElement('section');
      el.className = 'pac-panel';
      el.dataset.type = p.type;
      if (p.compact) el.dataset.compact = '';
      const kind = panelKind(p);
      el.dataset.kind = kind;
      // Default DISPLAY title per renderer when a panel gives none. The internal
      // renderer name stays CALLSTACK; only the student-facing label reads
      // "Function calls" (so it is not confused with an actual stack data
      // structure in the stacks animations).
      const title = p.title ?? DEFAULT_TITLES[p.type] ?? p.type;
      el.innerHTML = `<div class="pac-panel-head"><span>${title}</span>
                        <span class="pac-panel-tools"></span></div>
                      <div class="pac-panel-body"></div>`;
      // Initial column by kind: code -> left, structure -> the shared region,
      // book -> right. layoutStage() moves the balancing overflow to the left.
      (kind === 'code' ? this.colLeft
        : kind === 'structure' ? this.structureRegion
        : this.colRight).appendChild(el);
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
      this.panels.set(p.id ?? p.type, { spec: p, el, renderer: r, ctx, kind });
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

    // The layout follows the VIEWPORT: re-resolve on a real window resize
    // (debounced), never on a content change. steps/frames/tabs leave it constant.
    window.addEventListener('resize', () => {
      clearTimeout(this._fitTimer);
      this._fitTimer = setTimeout(() => { this.layoutStage(); this.render(); }, 120);
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

    this._followActive();
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

/**
 * How a panel is placed and sized by layoutStage (AUTHORING.md "Panels flow
 * across both columns"):
 *   - 'code'      -- the listing; anchors the top of the left column, 15-line floor.
 *   - 'structure' -- a CELLS/NODES/CHART view of the data structure being watched;
 *                    shares the height-capped region, side by side, follows active.
 *   - 'book'      -- bookkeeping (callstack, stream, a compact strip): known-max
 *                    content, 2-row floor, flows and balances across the columns.
 * A panel may force its class with `structure: true|false`; otherwise a non-compact
 * CELLS/NODES/CHART panel is structure and everything else is bookkeeping.
 */
function panelKind(p) {
  if (p.type === 'code') return 'code';
  if (p.structure === true)  return 'structure';
  if (p.structure === false) return 'book';
  if (p.type === 'callstack' || p.type === 'stream' || p.compact) return 'book';
  // NODES/CHART draw the whole structure and default to structure; a CELLS panel
  // is more often an auxiliary strip (pointer variables, an invariant readout)
  // than the structure itself, so it defaults to bookkeeping and opts in with
  // `structure: true` (the array/stack it IS the structure of).
  if (p.type === 'nodes' || p.type === 'chart') return 'structure';
  return 'book';
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
