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

/* Panel body sizing policy -- DATA, one row per size-class, NOT code at the call
 * site. layoutStage reads floor/ceiling from here instead of hardcoding 15 / 2 /
 * half-stage / 2-frames in four separate branches (which is how the "size to
 * content" rule drifted and regressed one panel at a time). Each row:
 *   floorRows : minimum body height, in content rows (× the panel's line height)
 *   ceiling   : maximum -- null (none), 'listing' (never more rows than the code
 *               has), 'halfStage' (≤ half the stage), or a COUNT {frames:N}/{rows:N}
 *   scroll    : true if content past the ceiling scrolls rather than being cut
 * A count ceiling ({frames:N}/{rows:N}) is applied generically in _panelContentH:
 * cap the body at N rendered rows, scroll the rest, newest in view. Adding a panel
 * type -- or a ceiling to one -- is a NEW ROW here, not a new branch. See
 * _sizeClass and _panelContentH. (AUTHORING.md "Panel sizing policy".) */
const SIZE_POLICY = {
  code:      { floorRows: 15, ceiling: 'listing'                 },  // ≥15 rows, never more than the listing; absorbs column slack
  callstack: { floorRows: 2,  ceiling: { frames: 2 }, scroll: true }, // ≤2 frames, scroll beyond
  stream:    { floorRows: 2,  ceiling: { rows: 8 },   scroll: true }, // ≤8 output rows, scroll beyond (newest line in view)
  structure: { floorRows: 2,  ceiling: 'halfStage',   scroll: true }, // ≤half the stage, scroll beyond
  strip:     { floorRows: 2,  ceiling: null                      },  // exact content
};

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
    const bodyPad = parseFloat(cs.getPropertyValue('--body-pad')) || 22;
    const BORDER  = 2;                          // a panel's 1px top + bottom border
    // Floor/ceiling values come from SIZE_POLICY (data), never inline literals.
    const floorPx = cls => SIZE_POLICY[cls].floorRows * lineH + bodyPad;

    const items     = [...this.panels.values()];
    const code      = items.find(p => p.kind === 'code');
    const structure = items.filter(p => p.kind === 'structure');
    const book      = items.filter(p => p.kind === 'book');

    const H = this._availableStageHeight();
    const stageW = this.stage.clientWidth;

    // PASS 1 -- natural WIDTH. Read with the panel forced to `max-content`, as wide
    // as the content wants with nothing wrapping. HEIGHT is deferred to pass 2,
    // because a panel capped narrower than this (below) may WRAP, and its wrapped
    // height -- not this unwrapped one -- is what must be reserved (else it grows
    // mid-trace, breaking the master invariant).
    const measureW = p => {
      const body = p.el.querySelector('.pac-panel-body');
      body.style.minHeight = ''; body.style.height = ''; p.el.style.width = '';
      const codeEl = body.querySelector('.pac-code');
      if (codeEl) codeEl.style.maxHeight = '';
      const id = p.spec.id ?? p.spec.type;
      let mW = 0;
      for (const step of this.steps) {
        p.ctx.anchors.clear();
        p.el.style.width = 'max-content';
        p.renderer.render(body, step.panels?.[id], p.ctx, { lang: this.lang, step });
        // getBoundingClientRect + ceil, not offsetWidth: offsetWidth ROUNDS DOWN a
        // sub-pixel width, so the pinned panel ends up a pixel short of its content
        // and the last cell wraps. Ceiling the true width keeps everything on one
        // row.
        mW = Math.max(mW, Math.ceil(p.el.getBoundingClientRect().width));
      }
      p.el.style.width = '';
      p.headerH  = p.el.querySelector('.pac-panel-head').offsetHeight;
      p.contentW = mW;
    };
    for (const p of [...structure, ...book]) measureW(p);
    if (code) code.headerH = code.el.querySelector('.pac-panel-head').offsetHeight;

    // The code panel's WIDEST line (across every language tab) is its minimum
    // width -- a long line must never wrap or scroll horizontally (rule 4). While
    // it is rendered, capture the ACTUAL rendered line height: font-size x
    // line-height resolves to a sub-pixel value (12.5 x 1.65 = 20.625) that the
    // --code-line-h token (20.6) only approximates, and that 0.025px-per-line
    // drift is exactly what clips the last line once the panel is a dozen lines
    // tall. Sizing off the measured height keeps the viewport an INTEGER number of
    // whole lines, so no line is ever a sliver (AUTHORING.md "whole lines only").
    let codeMinW = 0, codeLineH = lineH;
    if (code) {
      const codeEl = code.el.querySelector('.pac-panel-body .pac-code');
      for (const lang of Object.keys(code.spec.listings ?? {})) {
        code.ctx.anchors.clear();
        code.renderer.render(code.el.querySelector('.pac-panel-body'), { line: null }, code.ctx, { lang, step: this.steps[0] });
        if (codeEl) codeMinW = Math.max(codeMinW, codeEl.scrollWidth);
      }
      codeMinW += bodyPad + BORDER;
      const lineEl = codeEl?.querySelector('.pac-code-line');
      if (lineEl) codeLineH = lineEl.getBoundingClientRect().height || lineH;
    }

    // The code panel shows min(listing length, lines that fit) -- the 15-line
    // FLOOR applies ONLY when the listing is longer than 15 (AUTHORING.md "CODE:
    // 15 lines is the FLOOR"). A 9-line listing yields a 9-ROW panel: the floor
    // never pads a short listing with blank rows.
    //
    // `listing length` is the CURRENTLY DISPLAYED language's line count, NOT the
    // max across languages: recursion's pseudo listing is 9 lines even though its
    // Java variant is 12, and it must render 9 rows, not 12 with 3 blank. Switching
    // the language tab re-runs layoutStage (setLanguage), so a longer variant grows
    // the panel then -- a deliberate user action, never a mid-trace change. The
    // panel WIDTH still measures across all languages (below), so a long line in any
    // variant never wraps and the width does not jump on switch; only the row count
    // tracks the visible listing.
    const curListing = code ? (code.spec.listings?.[this.lang] ?? Object.values(code.spec.listings ?? {})[0] ?? []) : [];
    const maxLen   = code ? Math.max(1, curListing.length) : 0;
    const codeFloorLines = Math.min(SIZE_POLICY.code.floorRows, maxLen);

    const outer = (p, bodyH) => p.headerH + bodyH + BORDER;
    const sum   = a => a.reduce((s, h) => s + h, 0);

    // Width budget for the RIGHT column: what is left of the stage once the code
    // keeps its widest line (never wraps) and the gap is paid. Every right-column
    // panel is capped at this so the two columns' widths + gap never exceed the
    // stage -- no panel runs past the viewport edge (AUTHORING.md "No panel may
    // exceed the viewport width"). A structure panel wider than the budget is not
    // clipped: it scrolls internally. Floored so the region is never invisible on a
    // very narrow embed (the code then gives up a little width instead).
    const rightBudget = Math.max(160, stageW - codeMinW - gap);

    // PASS 2 -- content HEIGHT at the width the panel will actually GET. A panel
    // narrowed to the budget wraps there (an array reflowing to a second row, a
    // variables strip wrapping when full), and that wrapped height is what must be
    // reserved so it never grows as steps advance. Measured at the applied width,
    // the reservation already includes the wrap. The STREAM fills a wide left
    // column, so it is measured at its natural width, not the right-column budget.
    const measureH = p => {
      const body = p.el.querySelector('.pac-panel-body');
      const id = p.spec.id ?? p.spec.type;
      const appliedW = p.spec.type === 'stream' ? p.contentW : Math.min(p.contentW, rightBudget);
      let mH = 0;
      for (const step of this.steps) {
        p.ctx.anchors.clear();
        p.el.style.width = `${Math.round(appliedW)}px`;
        p.renderer.render(body, step.panels?.[id], p.ctx, { lang: this.lang, step });
        mH = Math.max(mH, this._panelContentH(p, body));
      }
      p.el.style.width = '';
      body.style.minHeight = ''; body.style.height = '';
      p.contentH = mH;
    };
    for (const p of [...structure, ...book]) measureH(p);

    // Structure region orientation (rule 5): panes sit side by side unless that
    // would leave the code panel narrower than its widest line; then they stack
    // vertically. Resolved once, here -- it never changes as steps advance.
    const structW = structure.length ? sum(structure.map(p => p.contentW)) + gap * (structure.length - 1) : 0;
    const stacked = structure.length > 1 && (structW + gap + codeMinW > stageW);

    // (2) structure region -- each pane floored (2 rows) then capped at its ceiling
    // (SIZE_POLICY.structure = 'halfStage'), scrolling beyond. Values from the table.
    const ceiling = SIZE_POLICY.structure.ceiling === 'halfStage'
      ? Math.max(140, Math.floor(H / 2)) : Infinity;
    const paneH   = p => Math.min(Math.max(outer(p, p.contentH), outer(p, floorPx('structure'))), ceiling);
    let regionH = 0;
    if (structure.length) {
      regionH = stacked
        ? sum(structure.map(paneH)) + gap * (structure.length - 1)
        : Math.max(...structure.map(paneH));
    }

    // (1) bookkeeping floors -- each panel's own floor from the table (2 rows).
    for (const p of book) p.outerH = outer(p, Math.max(p.contentH, floorPx(this._sizeClass(p))));

    // (3) code floor -- min(15, listing length) whole lines, measured (ceil so the
    // last line's sub-pixel remainder is inside the box, never clipped). A short
    // listing floors at its own length, not 15 (item "15-line FLOOR is min").
    const codeFloor = code ? outer(code, Math.ceil(codeFloorLines * codeLineH) + bodyPad) : 0;

    // Balance HEIGHT: right column = [region, book[0..k)], left = [code,
    // book[k..)]. Pick the split k (keeping declaration order) that minimises the
    // taller column, so the stage is as short as the content allows -- and, among
    // splits that tie on stage height, the one whose two columns are the CLOSEST in
    // height, so their bottom edges land as together as the panels allow (item
    // "bottom alignment after the height fixes"). No panel is stretched to force it;
    // any residual is empty space at the shorter column's foot (item "no panel
    // stretches to fill").
    const bh = book.map(p => p.outerH);
    const colH = (base, arr, hasBase) => {
      const n = (hasBase ? 1 : 0) + arr.length;
      return base + sum(arr) + gap * Math.max(0, n - 1);
    };
    let bestK = 0, bestStage = Infinity, bestGap = Infinity;
    for (let k = 0; k <= book.length; k++) {
      const right = colH(regionH, bh.slice(0, k), regionH > 0);
      const left  = colH(codeFloor, bh.slice(k), !!code);
      const stage = Math.max(right, left);
      const diff  = Math.abs(right - left);
      if (stage < bestStage - 0.5 || (stage <= bestStage + 0.5 && diff < bestGap)) {
        bestStage = stage; bestGap = diff; bestK = k;
      }
    }
    const stageH = Math.min(bestStage, H);

    // Place bookkeeping panels into their columns (structure stays in the region,
    // code stays at the top of the left column).
    for (const p of book.slice(0, bestK)) this.colRight.appendChild(p.el);
    for (const p of book.slice(bestK))    this.colLeft.appendChild(p.el);

    // ---- apply HEIGHTS ----
    // Every body is now `flex: none` by DEFAULT (styles.css) -- no code sets flex
    // inline anymore. So every panel body is given an EXPLICIT height and cannot
    // stretch: the flex:1 default that used to inflate whichever panel had column
    // space below it is gone, and with it the per-panel `flex:none` suppressions
    // that were only there to fight it (items 19/23/24/30). overflow:auto still
    // scrolls a body whose content exceeds its height (callstack, a capped tree).
    this.stage.style.height = `${Math.round(stageH)}px`;
    if (structure.length) {
      this.structureRegion.toggleAttribute('data-stacked', stacked);
      this.structureRegion.style.height = stacked ? '' : `${Math.round(regionH)}px`;
      // Each pane fills the height it is allotted (its capped paneH when stacked,
      // the shared region height side by side); content past it scrolls.
      for (const p of structure) {
        const allot = stacked ? paneH(p) : regionH;
        p.el.querySelector('.pac-panel-body').style.height = `${Math.round(allot - p.headerH - BORDER)}px`;
      }
    }
    // Every bookkeeping panel is a fixed height derived from its own content
    // (p.contentH, resolved once in _panelContentH: the stream's emitted row count,
    // the callstack's capped frame count, a strip's measured rows).
    for (const p of book) {
      const body = p.el.querySelector('.pac-panel-body');
      body.style.height = `${Math.round(p.outerH - p.headerH - BORDER)}px`;
    }

    // ---- apply WIDTHS (rules 1-3): every non-code panel takes its own natural
    // width and left-aligns, CAPPED at the right-column budget so no panel runs
    // past the viewport (item "No panel may exceed the viewport width"). A panel
    // wider than its cap keeps its natural content and scrolls internally (the body
    // is overflow:auto). CODE and STREAM are the exceptions -- output has no
    // predictable width, so like the code it FILLS its column (via CSS), matching
    // the code's width when it sits below it. ----
    for (const p of [...structure, ...book]) {
      if (p.spec.type === 'stream') { p.el.style.width = ''; continue; }
      p.el.style.width = `${Math.round(Math.min(p.contentW, rightBudget))}px`;
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
      // The code is the ONE panel that absorbs the left column's slack, and only
      // up to its listing's length (item "no panel stretches to fill"). It shows
      // min(listing length, lines that fit), floored at min(15, listing length) --
      // a short listing shows in full (no blank rows), a long one shows >= 15 and
      // as many more as fit. Any space still left after that stays EMPTY at the
      // bottom of the column; the body is sized to the lines shown, never stretched.
      const fit     = Math.floor((avail - code.headerH - BORDER - bodyPad) / codeLineH);
      const lines   = Math.max(codeFloorLines, Math.min(maxLen, fit));
      // viewH is the whole-line height (ceil so no line is a sliver -- "whole lines
      // only"); the body is exactly that plus its padding, nothing more.
      const viewH   = Math.ceil(lines * codeLineH);
      const body    = code.el.querySelector('.pac-panel-body');
      body.style.height = `${viewH + bodyPad}px`;
      const codeEl = body.querySelector('.pac-code');
      if (codeEl) codeEl.style.maxHeight = `${viewH}px`;
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

  /** Map a panel to its SIZE_POLICY row. One classifier, so every floor/ceiling
   *  lookup keys off the same rule. */
  _sizeClass(p) {
    const t = p.spec.type;
    if (t === 'code' || t === 'callstack' || t === 'stream') return t;
    return p.kind === 'structure' ? 'structure' : 'strip';
  }

  /** The single place a non-code panel's content height is resolved. A COUNT
   *  ceiling in SIZE_POLICY ({frames:N} or {rows:N}) is applied GENERICALLY here:
   *  if the panel renders more than N rows, cap the body at the Nth row's bottom
   *  and let the rest scroll (overflow:auto), newest in view. This is one code
   *  path for the CALLSTACK (frames) and the STREAM (output rows) alike -- adding
   *  a count ceiling to a panel type is a table row, not a branch. Without such a
   *  ceiling the body is its full rendered height (scrollHeight): a strip's cells,
   *  a structure's SVG/boxes (whose halfStage ceiling is applied later in paneH),
   *  or a stream shorter than its ceiling. flex:none keeps that from stretching.
   *  (The code panel resolves its own height in the fill block, from its line
   *  count and the column slack it alone absorbs -- the reference implementation.) */
  _panelContentH(p, body) {
    const ceil = SIZE_POLICY[this._sizeClass(p)].ceiling;
    const N = ceil && (ceil.frames ?? ceil.rows);              // a count ceiling, if any
    if (N != null) {
      const sel = ceil.frames != null ? '.pac-frame' : '.pac-stream-line';
      const rows = [...body.querySelectorAll(sel)];
      if (rows.length > N) {                                    // past the ceiling: cap at N, scroll beyond
        const padB = parseFloat(getComputedStyle(body).paddingBottom) || 11;
        const top  = body.getBoundingClientRect().top;
        return Math.round(rows[N - 1].getBoundingClientRect().bottom - top + padB);
      }
    }
    return body.scrollHeight;                                   // under any ceiling / none: rendered content
  }

  /** A structure pane that overflows its capped panel -- or a CALLSTACK past its
   *  frame ceiling -- scrolls to keep its ACTIVE element in view: the cell being
   *  modified, the running (top) frame, or the active tree node. Scrolls in BOTH
   *  axes (a wide call tree overflows horizontally), the same "follow the
   *  highlight" the CODE panel has, so a student never hunts for it. When nothing
   *  is active (e.g. step 0), a tree centres on its ROOT so the origin of execution
   *  -- what the opening note points at -- is visible from the start. A panel that
   *  fits does nothing. */
  _followActive() {
    for (const [, p] of this.panels) {
      // Structure panes, the callstack, and any cells panel (an array may scroll
      // horizontally when narrowed) follow their active element; the stream
      // self-scrolls to its newest line in its own renderer.
      if (p.kind !== 'structure' && p.spec.type !== 'callstack' && p.spec.type !== 'cells') continue;
      const body = p.el.querySelector('.pac-panel-body');
      if (!body) continue;
      const overY = body.scrollHeight > body.clientHeight + 1;
      const overX = body.scrollWidth  > body.clientWidth  + 1;
      if (!overX && !overY) continue;
      let target = body.querySelector('[data-role="active"], [data-role="compared"], [data-active="true"], .pac-marker');
      // Nothing active in a tree (step 0): centre on the root (first node), so the
      // student sees where execution is about to start, never a clipped-off root.
      if (!target && p.spec.type === 'nodes') target = body.querySelector('.pac-node');
      if (!target) continue;
      const br = body.getBoundingClientRect(), tr = target.getBoundingClientRect();
      const margin = 24;
      if (overY) {
        const off = tr.top - br.top;
        if (off < margin || off > body.clientHeight - margin - tr.height)
          body.scrollTop += off - (body.clientHeight - tr.height) / 2;
      }
      if (overX) {
        const off = tr.left - br.left;
        if (off < margin || off > body.clientWidth - margin - tr.width)
          body.scrollLeft += off - (body.clientWidth - tr.width) / 2;
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
    // `standard` has a SOFT ceiling of 6 (AUTHORING.md "Panel count"): not
    // enforced, but a 7th panel should be justified -- try merging related state
    // into one panel or cutting one that isn't earning its place first.
    if ((s.profile ?? 'standard') === 'standard' && panels.length > 6) {
      console.warn(`standard profile: ${panels.length} panels exceeds the soft ceiling of 6 — consider merging or cutting a panel`);
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

  // Switching language relayouts (not just re-renders): a shorter/longer listing
  // resizes the code panel to its new row count (item "code sizes to its own
  // content"). This is a user action, like a resize -- the master invariant only
  // forbids size changes as STEPS advance, which still holds within a language.
  setLanguage(lang) { this.lang = lang; this.layoutStage(); this.render(); }

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
