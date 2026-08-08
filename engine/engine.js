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
import * as sliderPanel    from './panels/slider.js';
import * as callstackPanel from './panels/callstack.js';
import * as pegsPanel      from './panels/pegs.js';
import { Overlay }         from './overlay/arrows.js';

const RENDERERS = {
  code: codePanel, cells: cellsPanel, nodes: nodesPanel,
  stream: streamPanel, chart: chartPanel, slider: sliderPanel,
  callstack: callstackPanel, pegs: pegsPanel,
};

const MAX_STEPS = 5000;
const AUTOPLAY_MS = 900;

/* Panel body sizing policy -- DATA, one row per size-class, NOT code at the call
 * site. layoutStage reads floor/ceiling from here instead of hardcoding 15 / 2 /
 * half-stage / 2-frames in four separate branches (which is how the "size to
 * content" rule drifted and regressed one panel at a time). Each row:
 *   floorRows : minimum body height, in content rows (× the panel's line height)
 *   ceiling   : height maximum -- null (none), 'listing' (never more rows than the
 *               code has), 'halfStage' (≤ half the stage), or a COUNT {frames:N}/{rows:N}
 *   scroll    : true if content past the HEIGHT ceiling scrolls rather than being cut
 *   width     : how the panel claims WIDTH, in resolution priority --
 *                 'natural' : its content's full width, NEVER compressed or
 *                             horizontally scrolled (structure, strips, callstack)
 *                 'content' : the code's longest line (measured across ALL language
 *                             tabs, plus a small allowance) is both its FLOOR and its
 *                             CEILING -- floored at `minCh` characters when that line
 *                             is longer, capped there when the column is wider, so the
 *                             panel never grows past its widest line and leftover
 *                             width stays empty to its right, like the code's height
 *                             ceiling leaves empty rows below it (code)
 *                 'column'  : matches the width of the column it sits in (stream)
 * A count ceiling ({frames:N}/{rows:N}) is applied generically in _panelContentH.
 * Width is resolved by one pass too (see the WIDTH phase in layoutStage): the
 * natural panels claim their width first, code fills what remains. Adding a panel
 * type -- or a ceiling/width rule to one -- is a NEW ROW here, not a new branch.
 * (AUTHORING.md "Panel sizing policy".) */
const SIZE_POLICY = {
  code:      { floorRows: 15, ceiling: 'listing',     width: 'content', minCh: 60 }, // ≥15 rows; width = longest line (≥60 chars floor, capped there ceiling), leftover empty
  callstack: { floorRows: 2,  ceiling: { frames: 6 }, scroll: true, width: 'natural' }, // ≤ min(deepest stack the trace reaches, 6 frames); natural width. The panel already sizes to min(content, ceiling) via the max-across-steps pass, so this cap only bites past 6: a 2-deep trace still gets a 2-frame panel, factorial(4) (main→4 calls) gets 5, and recursion deeper than 6 scrolls with the active frame in view — where the repetitive middle frames are the right thing to hide
  stream:    { floorRows: 2,  ceiling: { rows: 8 },   scroll: true, width: 'column' },  // ≤8 rows; matches its column
  structure: { floorRows: 2,  ceiling: 'halfStage',   scroll: true, width: 'natural' }, // ≤half stage (v-scroll ok); natural width, never h-scrolls
  strip:     { floorRows: 2,  ceiling: null,          width: 'natural' },  // exact content; natural width
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
    // Optional slider (a narrow WATCH-only exception -- see panels/slider.js). Its
    // remembered value drives the chart marker + readout via spec.slider.frame(n)
    // when live; null when the animation declares no slider.
    this.sliderCfg = spec.slider ?? null;
    this.sliderN   = this.sliderCfg ? (this.sliderCfg.default ?? this.sliderCfg.min ?? 0) : 0;
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

    // The code panel is rendered once here to capture: its WIDEST line (so short
    // lines are shown in full without demanding more), the ACTUAL line height
    // (font-size x line-height = 20.625, a sub-pixel value the --code-line-h token
    // only approximates; that 0.025px/line drift is what clips the last line once
    // the panel is a dozen lines tall), the font's CHAR width, and the line-number
    // gutter -- so the code's width floor is a real character count, not a guess.
    let codeLineH = lineH, codeCharW = 7.5, codeGutterW = 40, codeWidestW = 0;
    if (code) {
      const bodyEl = code.el.querySelector('.pac-panel-body');
      // Measure at max-content so the WIDEST LINE is read, not the empty column the
      // code currently sits in. scrollWidth on a wide panel clamps UP to the panel's
      // clientWidth -- reporting blank space as content (item "natural width means
      // content's width"). Pinning max-content makes clientWidth hug the widest line.
      //
      // First CLEAR the width bounds this same pass set LAST time (min-width,
      // max-width on the panel; the fixed body height and the listing's max-height):
      // a stale max-width would clamp `max-content` back to the previous layout's
      // width, so every language would measure that same clamped value instead of
      // its own longest line, and the cross-language max below would be wrong on
      // every re-layout after the first (e.g. a language-tab switch).
      code.el.style.minWidth = '';
      code.el.style.maxWidth = '';
      bodyEl.style.height = ''; bodyEl.style.minHeight = '';
      const codeElReset = bodyEl.querySelector('.pac-code');
      if (codeElReset) codeElReset.style.maxHeight = '';
      code.el.style.width = 'max-content';
      // The widest line is measured across EVERY language tab, not just the current
      // one (master invariant): switching pseudocode/Java/C++ must not change the
      // panel's width. pseudo may be 9 short lines while Java has a longer one -- the
      // panel reserves the widest across all, so no variant wraps and the width never
      // jumps on a tab switch.
      const listings = code.spec.listings ?? {};
      const langs = Object.keys(listings).length ? Object.keys(listings) : [this.lang];
      for (const lang of langs) {
        code.ctx.anchors.clear();
        code.renderer.render(bodyEl, { line: null }, code.ctx, { lang, step: this.steps[0] });
        const cel = bodyEl.querySelector('.pac-code');
        if (cel) codeWidestW = Math.max(codeWidestW, cel.scrollWidth + bodyPad + BORDER);
      }
      // Re-render the CURRENT language for the per-line metrics below (line height,
      // char width, gutter) and leave the panel showing what the student will see.
      code.ctx.anchors.clear();
      code.renderer.render(bodyEl, { line: null }, code.ctx, { lang: this.lang, step: this.steps[0] });
      code.el.style.width = '';
      const codeEl = bodyEl.querySelector('.pac-code');
      const lineEl = codeEl?.querySelector('.pac-code-line');
      if (lineEl) codeLineH = lineEl.getBoundingClientRect().height || lineH;
      // char width from any non-empty text span (monospace, so uniform).
      const txt = codeEl && [...codeEl.querySelectorAll('.pac-code-line')]
        .map(l => l.querySelector('span:not(.pac-code-num)')).find(s => s && s.textContent.length);
      if (txt) codeCharW = txt.getBoundingClientRect().width / txt.textContent.length;
      const num = codeEl?.querySelector('.pac-code-num');
      if (num) codeGutterW = num.getBoundingClientRect().width + (parseFloat(getComputedStyle(num).marginRight) || 12);
    }
    // Code's CEILING width (item "code needs a width ceiling"): its widest line plus
    // a small right-hand allowance so the last glyph never touches the border. This
    // is the MAX the panel ever takes -- like the 'listing' height ceiling caps its
    // rows, this caps its columns, so on a wide stage the panel is exactly as wide as
    // its longest line and the leftover stays EMPTY to its right (not distributed,
    // not handed to the structure -- that would undo item 39).
    const codeContentW = code ? Math.round(codeWidestW + Math.ceil(codeCharW)) : 0;
    // Code's FLOOR width: its widest line uncompressed, but never DEMANDING more than
    // `minCh` characters -- a short listing needs only its own width (structure gets
    // the rest); a listing with lines longer than minCh is held at minCh and scrolls,
    // because the structure has width priority. min(widest line, minCh chars + gutter).
    const codeMinCh = code ? SIZE_POLICY.code.minCh * codeCharW + codeGutterW + bodyPad + BORDER : 0;
    const codeMinW  = code ? Math.round(Math.min(codeContentW, codeMinCh)) : 0;

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

    // WIDTH priority (SIZE_POLICY.width): the natural panels -- structure, strips,
    // callstack -- claim their FULL content width; the code takes what remains, down
    // to its `minCh` floor. A structure panel is never compressed and never
    // horizontally scrolled: a scrolled data structure teaches nothing. So no
    // right-column budget caps them any more -- each `natural` panel is applied at
    // its own contentW below, and the code (flex, min-width codeMinW) absorbs the
    // rest. If the natural panels genuinely need more than `stageW - codeMinW - gap`,
    // that is a CONTENT problem (the animation is too wide), reported at the end of
    // this pass -- not a compression to hide.

    // PASS 2 -- content HEIGHT at each panel's NATURAL width (the width it will get).
    // Measuring at the applied width matters because a strip could wrap if narrowed,
    // but nothing is narrowed now, so a strip stays one row and reserves that height.
    const measureH = p => {
      const body = p.el.querySelector('.pac-panel-body');
      const id = p.spec.id ?? p.spec.type;
      let mH = 0;
      for (const step of this.steps) {
        p.ctx.anchors.clear();
        p.el.style.width = `${Math.round(p.contentW)}px`;   // its natural width
        p.renderer.render(body, step.panels?.[id], p.ctx, { lang: this.lang, step });
        mH = Math.max(mH, this._panelContentH(p, body));
      }
      p.el.style.width = '';
      body.style.minHeight = ''; body.style.height = '';
      p.contentH = mH;
    };
    for (const p of [...structure, ...book]) measureH(p);

    // Structure region orientation (rule 5): panes sit side by side unless that
    // would push the code below its char floor; then they stack vertically (their
    // natural widths still honoured -- a stacked pane is full width). Resolved once.
    const structW = structure.length ? sum(structure.map(p => p.contentW)) + gap * (structure.length - 1) : 0;
    const stacked = structure.length > 1 && (structW + gap + codeMinW > stageW);
    // The region's natural WIDTH: the panes side by side, or the widest pane stacked.
    const regionW = structure.length ? (stacked ? Math.max(...structure.map(p => p.contentW)) : structW) : 0;

    // WIDTH MUST FIT THE ROW (item "no panel off the viewport, ever"). The two
    // side-by-side columns need the code's char floor on the left and the WIDEST
    // non-code panel on the right, plus one gap. If that sum exceeds the stage the
    // row cannot fit -- and a panel shoved off the right edge (or overlapping its
    // neighbour) is strictly worse than a taller page -- so the layout collapses
    // to a SINGLE column: code full width, then the structure region, then the
    // bookkeeping panels, each stacked below the last. Nothing overlaps and no
    // right edge leaves the viewport. Resolved once, at load/resize -- never a
    // mid-trace change (this is the fallback item 36 named: "either the row stacks
    // vertically, or the animation is redesigned; it is never resolved by letting
    // a panel overflow the viewport").
    const widestOther = Math.max(0, regionW, ...book.map(p => p.contentW));
    const singleCol   = !!code && (widestOther + gap + codeMinW > stageW);
    // In a single column a multi-pane structure must stack vertically too (each
    // pane full width, one above the next) -- side by side would only re-create
    // the overflow the single column exists to avoid.
    const regionStacked = stacked || (singleCol && structure.length > 1);

    // (2) structure region -- each pane floored (2 rows) then capped at its ceiling
    // (SIZE_POLICY.structure = 'halfStage'), scrolling beyond. Values from the table.
    const ceiling = SIZE_POLICY.structure.ceiling === 'halfStage'
      ? Math.max(140, Math.floor(H / 2)) : Infinity;
    const paneH   = p => Math.min(Math.max(outer(p, p.contentH), outer(p, floorPx('structure'))), ceiling);
    let regionH = 0;
    if (structure.length) {
      regionH = regionStacked
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
    // Code's whole-panel height. In a single column it shows its FULL listing
    // (vertical space is not the constraint there); side by side it floors at
    // min(15, length) and grows to absorb the left column's slack (resolved in the
    // code-fit block below). Its single-column height feeds the stage total.
    const codeSingleH = code ? outer(code, Math.ceil(maxLen * codeLineH) + bodyPad) : 0;

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

    // WIDE-STRUCTURE ROW PACKING (AUTHORING.md "a panel that fits in remaining
    // width uses it"). When a structure is too wide to sit beside the code, the old
    // fallback stacked EVERYTHING in one column -- so a small bookkeeping panel was
    // pushed below the wide structure even though it would have fit in the empty
    // width beside the code. Instead, pack panels into rows by FIRST FIT, in
    // declaration order: each panel lands in the earliest row with room for it, and
    // only a panel that fits nowhere opens a new row. A panel that had to break (the
    // wide structure) does not drag later panels down with it -- they are re-tested
    // against the space actually available, so a small panel returns to the code's
    // row. Panels sharing a row share that row's height (tops and bottoms aligned)
    // and take their natural width; leftover width at a row's right stays empty. The
    // two-column layout (the `else` below) is unchanged -- only this path packs, and
    // only animations whose structure cannot fit beside the code ever reach it.
    if (singleCol) {
      this.colLeft.style.display = 'none';
      this.colRight.style.display = 'none';
      this.rowStack.style.display = '';
      // One packing block per PANEL, in declaration order. Each structure is its own
      // block (so two structures share a row only if they genuinely fit; otherwise
      // each lands on its own row). Every block carries a natural height `h` and a
      // `floor` it can shrink to when the stage would otherwise overflow: the code to
      // its 15-line floor (scrolling beyond), a structure to a fraction of the stage
      // (scrolling vertically, active element kept in view), a book panel not at all.
      const structFloor = Math.max(160, Math.floor(H / 4));
      const blocks = [];
      for (const p of this.panels.values()) {
        if (p.kind === 'code') {
          blocks.push({ el: code.el, w: codeContentW, h: codeSingleH, floor: codeFloor, kind: 'code' });
        } else if (p.kind === 'structure') {
          const nat = outer(p, p.contentH);
          blocks.push({ el: p.el, w: p.contentW, h: nat, floor: Math.min(nat, structFloor), kind: 'structure', p });
        } else {
          blocks.push({ el: p.el, w: p.contentW, h: p.outerH, floor: p.outerH, kind: 'book', p });
        }
      }
      // First-fit into rows bounded by the stage width.
      const rows = [];
      for (const blk of blocks) {
        let row = rows.find(r => r.w + blk.w + (r.blocks.length ? gap : 0) <= stageW + 0.5);
        if (!row) { row = { blocks: [], w: 0 }; rows.push(row); }
        row.w += blk.w + (row.blocks.length ? gap : 0);
        row.blocks.push(blk);
      }
      for (const row of rows) {
        row.h     = Math.max(...row.blocks.map(b => b.h));
        row.floor = Math.max(...row.blocks.map(b => b.floor));
      }
      // If the rows overflow the available stage height, shrink so the footer
      // (controls + note) stays on screen -- losing the note off-screen is the one
      // failure the layout must prevent. Code rows give back to their floor first
      // (the code scrolls beyond its 15 lines), then structure rows give back,
      // tallest first (they scroll vertically; _followActive keeps the active node in
      // view). Book rows never shrink. Structures never scroll HORIZONTALLY.
      const gapsTotal = gap * Math.max(0, rows.length - 1);
      let over = sum(rows.map(r => r.h)) + gapsTotal - H;
      const isCode = r => r.blocks.some(b => b.kind === 'code');
      const isStruct = r => r.blocks.some(b => b.kind === 'structure');
      if (over > 0) for (const row of rows) {
        if (over <= 0) break;
        if (!isCode(row)) continue;
        const give = Math.min(over, row.h - row.floor); row.h -= give; over -= give;
      }
      if (over > 0) for (const row of rows.filter(r => isStruct(r) && !isCode(r)).sort((a, b) => b.h - a.h)) {
        if (over <= 0) break;
        const give = Math.min(over, row.h - row.floor); row.h -= give; over -= give;
      }

      // Rebuild the row DOM: appendChild MOVES each element into its row (out of the
      // structure region or a stale row), then the now-empty stale rows are dropped.
      const rowEls = rows.map(row => {
        const rd = document.createElement('div');
        rd.className = 'pac-row';
        for (const blk of row.blocks) rd.appendChild(blk.el);
        return rd;
      });
      [...this.rowStack.children].forEach(c => c.remove());
      rowEls.forEach(rd => this.rowStack.appendChild(rd));

      // Widths (natural, never compressed) + heights (stretched to the row height,
      // tops and bottoms aligned). A shrunk code shows as many whole lines as fit and
      // scrolls; a shrunk structure scrolls vertically.
      for (const row of rows) for (const blk of row.blocks) {
        if (blk.kind === 'code') {
          code.el.style.minWidth = ''; code.el.style.maxWidth = '';
          code.el.style.width = `${Math.round(codeContentW)}px`;
          const body = code.el.querySelector('.pac-panel-body');
          body.style.height = `${Math.round(row.h - code.headerH - BORDER)}px`;
          const codeEl = body.querySelector('.pac-code');
          if (codeEl) codeEl.style.maxHeight = `${Math.max(codeLineH, Math.floor((row.h - code.headerH - BORDER - bodyPad) / codeLineH) * codeLineH)}px`;
        } else {
          blk.el.style.width = SIZE_POLICY[this._sizeClass(blk.p)].width === 'column' ? '' : `${Math.round(blk.p.contentW)}px`;
          blk.el.querySelector('.pac-panel-body').style.height = `${Math.round(row.h - blk.p.headerH - BORDER)}px`;
        }
      }
      this.stage.style.height = `${Math.round(Math.min(sum(rows.map(r => r.h)) + gapsTotal, H))}px`;

      // CONTENT-PROBLEM check: a lone block wider than the whole stage overflows even
      // on its own row -- genuinely too wide (redesign, never compress). Unreachable
      // at the design width; the 13-cell array fits the 1172px stage with room.
      const widest = Math.max(codeMinW, ...blocks.map(b => b.w));
      if (widest > stageW + 1) {
        console.warn(`[pac] "${this.spec?.title ?? ''}" has a panel ${Math.round(widest)}px wide, `
          + `past the ${Math.round(stageW)}px stage -- redesign (fewer cells, shorter lines, split view).`);
      }
      if (typeof window !== 'undefined' && window.__PAC_VERIFY) this.verifyHeights();
      return;
    }

    // ---- narrow two-column layout (unchanged) ----
    this.colLeft.style.display = '';
    this.rowStack.style.display = 'none';
    let stageH;
    {
      this.colRight.style.display = '';
      // Restore the structure region to the top of the RIGHT column (a prior
      // row-packed layout, from a narrower resize, may have moved code and pulled the
      // structure panels out of the region into row divs).
      if (code && code.el.parentElement !== this.colLeft) this.colLeft.insertBefore(code.el, this.colLeft.firstChild);
      for (const p of structure) this.structureRegion.appendChild(p.el);   // back into the region, in declaration order
      if (structure.length) this.colRight.insertBefore(this.structureRegion, this.colRight.firstChild);
      // Place bookkeeping panels into their columns (structure stays in the region,
      // code stays at the top of the left column).
      for (const p of book.slice(0, bestK)) this.colRight.appendChild(p.el);
      for (const p of book.slice(bestK))    this.colLeft.appendChild(p.el);
      stageH = Math.min(bestStage, H);
    }

    // ---- apply HEIGHTS ----
    // Every body is now `flex: none` by DEFAULT (styles.css) -- no code sets flex
    // inline anymore. So every panel body is given an EXPLICIT height and cannot
    // stretch: the flex:1 default that used to inflate whichever panel had column
    // space below it is gone, and with it the per-panel `flex:none` suppressions
    // that were only there to fight it (items 19/23/24/30). overflow:auto still
    // scrolls a body whose content exceeds its height (callstack, a capped tree).
    //
    // NOTE on verifying these heights (items 37/40/41): `.pac-col` is
    // `align-items: stretch` on the stage, so BOTH columns' *elements* measure the
    // full stage height regardless of how much content each holds -- the shorter
    // column's box is stretched to match the taller one. Any future height check
    // must therefore compare the resolved panel heights against the column's
    // CONTENT height (last panel's bottom minus first panel's top), NOT the column
    // element's height, or it will "find" a phantom discrepancy equal to the
    // shorter column's foot gap. `verifyHeights()` below does exactly this.
    //
    // WHY the two columns end at different heights (item 43): the residual foot gap
    // is ROW QUANTIZATION, not imbalance and not an error. Every panel is sized as
    // an INTEGER number of rows x that panel type's row height, plus fixed chrome
    // (header + border + padding) -- and the row heights differ by type: code lines
    // (~20.6px), output lines, callstack frames, and cell rows are all different.
    // Two columns each holding "as many whole rows as fit" therefore sum to
    // different pixel totals; there is no shared grid they could land on together.
    // Forcing the ends to align would mean giving some panel a FRACTIONAL row -- the
    // partial-line clipping deliberately removed in items 21 and 29. Whole rows and
    // equal column ends cannot both hold, and whole rows wins: the leftover pixels
    // stay as empty space at the shorter column's foot (item 24), never a sliver of
    // a clipped line. This is expected and correct -- do not "fix" it.
    this.stage.style.height = `${Math.round(stageH)}px`;
    if (structure.length) {
      this.structureRegion.toggleAttribute('data-stacked', regionStacked);
      this.structureRegion.style.height = regionStacked ? '' : `${Math.round(regionH)}px`;
      // Each pane fills the height it is allotted (its capped paneH when stacked,
      // the shared region height side by side); content past it scrolls.
      for (const p of structure) {
        const allot = regionStacked ? paneH(p) : regionH;
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

    // ---- apply WIDTHS from SIZE_POLICY.width, one rule per class, no per-panel
    // branches. 'natural' panels (structure, strips, callstack) take their full
    // content width and left-align -- never compressed, never horizontally scrolled.
    // 'column' (stream) fills its column via CSS. 'content' (code) is bounded on BOTH
    // sides: min-width >= codeMinW (the char floor) and max-width = codeContentW (its
    // widest line + allowance), so it stretches to fill its column but never past its
    // longest line -- leftover column width stays empty to its right, mirroring the
    // empty rows the height ceiling leaves below it. ----
    for (const p of [...structure, ...book]) {
      const w = SIZE_POLICY[this._sizeClass(p)].width;
      p.el.style.width = w === 'column' ? '' : `${Math.round(p.contentW)}px`;
    }
    if (code) {
      code.el.style.minWidth = `${codeMinW}px`;
      code.el.style.maxWidth = `${codeContentW}px`;
    }
    // STREAM reads as a continuation of the code beneath it, so when it sits in the
    // SAME column it matches the code's width -- capped at codeContentW too, never
    // wider than the code it continues. (A stream balanced into the other column
    // keeps its own column width; it is not tied to the code there.) This is the
    // 'column' rule refined by placement, not a per-animation clamp.
    if (code) for (const p of book) {
      if (p.spec.type === 'stream' && p.el.parentElement === code.el.parentElement) {
        p.el.style.maxWidth = `${codeContentW}px`;
      } else if (p.spec.type === 'stream') {
        p.el.style.maxWidth = '';
      }
    }

    // CONTENT-PROBLEM check (item "the animation is too wide"): the single-column
    // fallback already rescues any row that will not fit side by side -- it stacks
    // instead of overflowing. So the ONE case left that no layout can fix is a
    // LONE panel wider than the whole stage: it overflows even at full width, on
    // its own row. That means the animation itself is too wide (too many cells,
    // too long a code line) and must be redesigned -- never silently compressed.
    const widest = Math.max(codeMinW,
      ...structure.map(p => p.contentW), ...book.map(p => p.contentW));
    if (widest > stageW + 1) {
      console.warn(`[pac] "${this.spec?.title ?? ''}" has a panel ${Math.round(widest)}px wide, `
        + `past the ${Math.round(stageW)}px stage -- it overflows even at full width. Redesign the `
        + `animation (fewer cells, shorter lines, or a split view) -- panels are not compressed.`);
    }

    // (4) code height. In a SINGLE column it shows its FULL listing -- vertical
    // space is not the constraint, so there is nothing to clip. Side by side it
    // absorbs the left column's leftover slack, up to the number of lines it HAS:
    // as many whole lines as fit, floored at min(15, length), never more than the
    // listing's length (a short listing shows in full, no blank rows; a long one
    // shows >= 15 and as many more as fit). Any slack beyond that stays empty at
    // the column's foot -- the body is sized to the lines shown, never stretched.
    if (code) {
      let lines;
      if (singleCol) {
        lines = maxLen;
      } else {
        const leftBook = book.slice(bestK);
        const leftUsed = sum(leftBook.map(p => p.outerH)) + gap * leftBook.length;
        const avail    = Math.max(codeFloor, Math.round(stageH - leftUsed));
        const fit      = Math.floor((avail - code.headerH - BORDER - bodyPad) / codeLineH);
        lines = Math.max(codeFloorLines, Math.min(maxLen, fit));
      }
      // viewH is the whole-line height (ceil so no line is a sliver -- "whole lines
      // only"); the body is exactly that plus its padding, nothing more.
      const viewH  = Math.ceil(lines * codeLineH);
      const body   = code.el.querySelector('.pac-panel-body');
      body.style.height = `${viewH + bodyPad}px`;
      const codeEl = body.querySelector('.pac-code');
      if (codeEl) codeEl.style.maxHeight = `${viewH}px`;
    }

    // Height-accounting regression check (opt-in). Set `window.__PAC_VERIFY = true`
    // before load to have every layout pass assert its column arithmetic; leave it
    // off and call `pac.verifyHeights()` from the console on demand.
    if (typeof window !== 'undefined' && window.__PAC_VERIFY) this.verifyHeights();
  }

  /** Height-accounting regression check (items 37/40/41). For every VISIBLE column
   *  it compares `Σ(resolved panel heights + declared inter-panel gaps)` against the
   *  column's CONTENT height, and asserts they are equal (Δ = 0). A non-zero Δ is a
   *  real bug -- a gap, border, or header height counted in the resolve path but not
   *  the render path (or vice versa). It is NOT the per-animation foot gap between
   *  the two columns: that is genuine column imbalance (the shorter column ends
   *  higher, by design -- item 24), and this check does not see it because it never
   *  compares one column against the other.
   *
   *  Content height is `last panel bottom − first panel top`, NOT the `.pac-col`
   *  element height: the column is `align-items: stretch`, so its element always
   *  measures the full stage height and comparing against it would manufacture a
   *  phantom discrepancy (see the NOTE in layoutStage). This is the Σ-vs-measured
   *  table that closed the item 37 investigation in one pass; kept callable so the
   *  next size question is one command, not an investigation.
   *
   *  Prints a table and returns the rows. `Δ` (`delta`) must be 0 for every row. */
  verifyHeights() {
    const gap  = parseFloat(getComputedStyle(this.root).getPropertyValue('--gap')) || 14;
    // In the wide-structure layout the rowStack is the visible container and its
    // children are ROW divs; each row's height is the max of its panels, and the
    // per-column Σ-vs-content check applies to it exactly as to a column of panels.
    const cols = [this.colLeft, this.colRight, this.rowStack].filter(c => c && c.style.display !== 'none');
    const rows = cols.map(col => {
      const kids    = [...col.children].filter(el => el.getBoundingClientRect().height > 0);
      const heights = kids.map(el => Math.round(el.getBoundingClientRect().height));
      const summed  = Math.round(heights.reduce((a, h) => a + h, 0) + gap * Math.max(0, kids.length - 1));
      const content = kids.length
        ? Math.round(kids[kids.length - 1].getBoundingClientRect().bottom - kids[0].getBoundingClientRect().top)
        : 0;
      return { column: col.dataset.side, panels: kids.length, heights: heights.join('+'),
               summed, content, delta: summed - content };
    });
    const bad = rows.filter(r => r.delta !== 0);
    console.log(`[pac] height accounting -- "${this.spec?.title ?? ''}" (Δ must be 0):`);
    console.table?.(rows) ?? console.log(rows);
    if (bad.length) {
      console.error(`[pac] HEIGHT ACCOUNTING BUG in "${this.spec?.title ?? ''}": `
        + bad.map(r => `${r.column} Δ=${r.delta}px`).join(', ')
        + ' -- a gap, border, or header is counted in one path but not the other.');
    }
    return rows;
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
      // The note box is the one footer element allowed to GROW past its reservation
      // to fit a long closing note (it is the last element on the page, so growing
      // pushes nothing). Charge the stage only its RESERVED --note-h, never its
      // grown height, so a long note spills into the bottom slack instead of
      // shrinking the stage -- which is what keeps the controls fixed as steps
      // advance regardless of note length. Every other child uses its live height.
      const h = el === this.noteBox
        ? (parseFloat(getComputedStyle(root).getPropertyValue('--note-h')) || el.offsetHeight)
        : el.offsetHeight;
      avail -= h + parseFloat(c.marginTop) + parseFloat(c.marginBottom);
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

  /* ---------- slider (WATCH-only exception, see panels/slider.js) ---------- */

  /** The slider is live only once the trace has reached the step it is declared to
   *  go live on (its last step by default). Inert everywhere else. */
  _sliderLive() {
    if (!this.sliderCfg) return false;
    const live = this.sliderCfg.liveStep ?? (this.steps.length - 1);
    return this.i >= live;
  }

  /** The student moved the slider. Remember the value and re-read ONLY the panels
   *  the slider drives (spec.slider.frame(n) -> {panelId: data}); the step, the
   *  narration, and the note are untouched. Ignored while the slider is inert. */
  onSlide(n) {
    if (!this._sliderLive()) return;
    this.sliderN = n;
    this._applySliderFrame();
  }

  /** Render the slider-driven panels (the chart marker + the readout) at the
   *  remembered slider value, over whatever the current step painted. No step
   *  change, no re-layout -- the panels were sized once for the whole trace, so
   *  nothing moves as the slider is dragged. */
  _applySliderFrame() {
    if (!this.sliderCfg?.frame) return;
    const frame = this.sliderCfg.frame(this.sliderN) ?? {};
    for (const [id, data] of Object.entries(frame)) {
      const p = this.panels.get(id);
      if (!p) continue;
      p.ctx.anchors.clear();
      p.renderer.render(p.el.querySelector('.pac-panel-body'), data, p.ctx, { lang: this.lang, step: this.step });
    }
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
      <div class="pac-note pac-note-empty" role="note"></div>
      <div class="pac-attribution">Designed by Dr. Neven Jurkovic with help from Claude AI</div>`;

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
    // A THIRD placement container, hidden by default: the row stack, used only when
    // a structure is too wide to sit beside the code (layoutStage's wide-structure
    // path). It flows panels into rows that PACK horizontally -- a small panel fills
    // the width a wide structure left empty rather than being pushed below it
    // (AUTHORING.md "a panel that fits in remaining width uses it"). The two-column
    // layout above is unchanged; only the old single-column fallback now packs.
    this.rowStack = document.createElement('div');
    this.rowStack.className = 'pac-col pac-rowstack'; this.rowStack.dataset.side = 'rows';
    this.rowStack.style.display = 'none';
    this.stage.append(this.colLeft, this.colRight, this.rowStack);

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

    // Back-stepping via keyboard, because beginners miss steps. A focused form
    // control (the slider) owns its own arrow keys -- adjusting the thumb must not
    // also advance the step -- so ignore arrows aimed at an input.
    window.addEventListener('keydown', e => {
      if (e.target && e.target.tagName === 'INPUT') return;
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
   * where it gets the whole window. SAME wording, SAME style, ALWAYS visible --
   * identical in every context. Students meet this inside Canvas, so the amber
   * lifeline is the real control; standalone is where WE review, and a review
   * that shows something different from what a student sees is a review of the
   * wrong thing. So there is no iframe-awareness here: keeping it identical means
   * every preview shows the actual control. Built into the engine, so every
   * animation inherits it -- no per-animation opt-in, and one built next year
   * gets it without anyone remembering. Its line is in the header above the
   * stage, reserved from step 0, so nothing moves.
   */
  _buildOpenWindowLink() {
    const link = this.root.querySelector('.pac-openwin');
    if (!link) return;
    // The page's own URL, which is exactly what we want to open full-window.
    link.href = window.location.href;
    link.hidden = false;                       // always present
    link.textContent = '⛶ Scrolling to see it all? Open in its own window';
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

    // When the slider is live, re-read its driven panels (chart marker + readout)
    // at the remembered value AFTER the step painted, so landing on the live step
    // -- or stepping back onto it -- resumes where the slider was left rather than
    // snapping to the step-authored default. A no-op on every other step.
    if (this._sliderLive()) this._applySliderFrame();

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
  // NODES/CHART/PEGS draw the whole structure and default to structure; a CELLS
  // panel is more often an auxiliary strip (pointer variables, an invariant
  // readout) than the structure itself, so it defaults to bookkeeping and opts in
  // with `structure: true` (the array/stack it IS the structure of).
  if (p.type === 'nodes' || p.type === 'chart' || p.type === 'pegs') return 'structure';
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
 * or an array of segments. A segment is a string, or an object:
 *   - `{ danger: true, text }` renders a leading red ⚠ and the danger-red colour
 *     (--error), naming a memory-integrity violation.
 *   - `{ href, text }` renders an inline link (opens in a new tab) -- used to
 *     bridge related animations, e.g. part 2's opening note back to part 1.
 * Returns true iff anything was written, so the caller can collapse an empty note.
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
    } else if (typeof seg.href === 'string') {
      const a = document.createElement('a');
      a.className = 'pac-seg-link';
      a.href = seg.href;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = seg.text ?? seg.href;
      el.appendChild(a);
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
  const eng = new Engine(el, spec);
  // Expose the instance for console-driven debugging -- e.g. `pac.verifyHeights()`
  // to print the column height-accounting table (items 37/40/41). Last mount wins.
  if (typeof window !== 'undefined') window.pac = eng;
  return eng;
}
