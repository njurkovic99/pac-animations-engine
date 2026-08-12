/* ds — A7 "Sorting" (second backer; the first is sorting-heapsort-dual).
 *
 * NOT a code trace. There is no algorithm being stepped through here: this
 * animation shows the RESULT of running two sorts at increasing sizes, which is
 * exactly what ds7 asks students to produce -- "Draw a graph of execution time
 * versus number of elements for both algorithms. What are your conclusions?" So
 * there is no CODE panel and no highlighted line; `line` is null on every step,
 * and each step plots one measurement rather than executing one statement.
 *
 * THE NUMBERS ARE MODELLED, NOT MEASURED, and the animation says so on screen
 * (step 0's note). They are computed from the growth curves, not timed on a real
 * machine:
 *
 *     bubble    t = 1.5e-9 * n^2           seconds   ->  1.5e-6 * n^2       ms
 *     heapsort  t = 9.0e-9 * n * log2(n)   seconds   ->  9.0e-6 * n log2 n  ms
 *
 *     n        bubble     heapsort   ratio
 *     5000      37 ms      0.55 ms     67x
 *     10000    150 ms      1.20 ms    125x
 *     15000    338 ms      1.87 ms    181x
 *     20000    600 ms      2.57 ms    233x
 *     25000    938 ms      3.29 ms    285x
 *     30000   1350 ms      4.01 ms    337x
 *
 * The formula positions the plotted points and the marker dots; the displayed
 * numbers at the six measured sizes are the canonical table above (so narration,
 * note, and readout agree to the digit). Between the measured sizes the slider
 * reads straight off the formula. Presenting these as timed measurements would
 * mislead a student comparing against their own experiment -- so the step-0 note
 * states plainly that these are modelled curves showing the SHAPE of the growth.
 *
 * TWO new capabilities debut here (both budgeted, neither a pure inherit):
 *   1. the CHART renderer (engine/panels/chart.js) -- fixed axes from step 0, one
 *      line per series, points added incrementally, a slider-driven marker.
 *   2. the SLIDER (engine/panels/slider.js) -- a narrow, deliberate exception to
 *      WATCH-only: it explores the same data without branching or judging. No
 *      question, no right answer, no alternate path; the step sequence is
 *      unaffected. THINK gates remain forbidden and deferred (PLANNED.md).
 *
 * The RATIO column is the payoff, not the chart. On a linear time axis heapsort
 * hugs zero and reads as "instant" rather than "growing slowly"; the ratio, which
 * itself climbs from 67x to 337x, is the n^2-versus-n-log-n signature made
 * legible. ds7 asks "What are your conclusions?", so the animation draws THREE --
 * at small, medium, and large n -- each attached to the step whose evidence is on
 * screen. WATCH only apart from the slider: one trace, no gates. Metrics hidden. */

/* ---- the two modelled curves (milliseconds) ---- */
const bubbleMs = n => 1.5e-6 * n * n;
const heapMs   = n => 9.0e-6 * n * Math.log2(n);

/* Fixed domain -- the axes are resolved to this from step 0 and never rescale as
 * points appear (the chart equivalent of a panel that never resizes). yMax = 1500
 * clears the bubble sort's 1350 ms at n = 30000 with a little headroom. */
const XMAX = 30000;
const YMAX = 1500;
const NS   = [5000, 10000, 15000, 20000, 25000, 30000];

const XTICKS = [0, 5000, 10000, 15000, 20000, 25000, 30000]
  .map(v => ({ v, label: v === 0 ? '0' : `${v / 1000}k` }));
const YTICKS = [0, 300, 600, 900, 1200, 1500].map(v => ({ v, label: String(v) }));

/* Series colours come from the existing design tokens -- no new colour values.
 * Amber for the slow n^2 curve, blue (the app accent) for the n log n curve. */
const BUB  = 'var(--warn)';
const HEAP = 'var(--accent)';

const BUB_PTS  = NS.map(n => ({ x: n, y: bubbleMs(n) }));
const HEAP_PTS = NS.map(n => ({ x: n, y: heapMs(n) }));

/* Canonical displayed values at the six measured sizes (the table above), so the
 * readout matches the narration and notes exactly. Between measured sizes the
 * slider computes from the formula. */
const CANON = {
  5000:  { b: 37,   h: 0.55, r: 67 },
  10000: { b: 150,  h: 1.20, r: 125 },
  15000: { b: 338,  h: 1.87, r: 181 },
  20000: { b: 600,  h: 2.57, r: 233 },
  25000: { b: 938,  h: 3.29, r: 285 },
  30000: { b: 1350, h: 4.01, r: 337 },
};
function vals(n) {
  if (CANON[n]) return CANON[n];
  const b = bubbleMs(n), h = heapMs(n);
  return { b: Math.round(b), h: Math.round(h * 100) / 100, r: Math.round(b / h) };
}
const msBub   = v => `${v} ms`;
const msHeap  = h => `${h.toFixed(2)} ms`;
const ratioStr = r => `${r}×`;

const SLIDER_DEFAULT = 15000;

/* ---- chart data: the two series (first k points) + an optional marker ---- */
function chartData(k, markerN) {
  const series = [
    { name: 'bubble',   color: BUB,  points: BUB_PTS.slice(0, k) },
    { name: 'heapsort', color: HEAP, points: HEAP_PTS.slice(0, k) },
  ];
  let marker = null;
  if (markerN != null) {
    const v = vals(markerN);
    marker = {
      x: markerN,
      callouts: [
        { color: BUB,  y: bubbleMs(markerN), label: msBub(v.b) },
        { color: HEAP, y: heapMs(markerN),   label: msHeap(v.h) },
      ],
    };
  }
  return {
    series,
    xLabel: 'number of elements (n)',
    yLabel: 'time (ms)',
    xMax: XMAX, yMax: YMAX,
    xTicks: XTICKS, yTicks: YTICKS,
    marker,
  };
}

/* ---- readout: a compact [n] [bubble] [heapsort] [ratio] row ----
 * Fixed per-cell widths (minCh) so a value changing length as the slider sweeps
 * never resizes the strip (the width analogue of the engine's reserved heights). */
function readoutCells(n) {
  const v = vals(n);
  return {
    render: 'box',
    cells: [
      { label: 'n',        value: String(n),   minCh: 7 },
      { label: 'bubble',   value: msBub(v.b),  minCh: 8 },
      { label: 'heapsort', value: msHeap(v.h), minCh: 8 },
      { label: 'ratio',    value: ratioStr(v.r), minCh: 6 },
    ],
  };
}
function readoutPlaceholder() {
  return {
    render: 'box',
    cells: [
      { label: 'n',        value: '', role: 'empty', minCh: 7 },
      { label: 'bubble',   value: '', role: 'empty', minCh: 8 },
      { label: 'heapsort', value: '', role: 'empty', minCh: 8 },
      { label: 'ratio',    value: '', role: 'empty', minCh: 6 },
    ],
  };
}

/* ---- narration + notes (the instructor's framing, echoed) ---- */
const MODELLED_NOTE =
  'These curves are MODELLED, not measured — they are computed from n² for the bubble sort ' +
  'and n log n for the heapsort, so they show the SHAPE of the growth rather than what any particular ' +
  'machine would report. Your own program will give different absolute numbers. The shape is what ' +
  'matters, and the shape is what you are looking for.';

const SMALL_NOTE =
  'CONCLUSION AT SMALL SIZES. 37 ms is not a wait — a student testing on a few thousand elements ' +
  'might reasonably conclude both algorithms are fine, and for that array they would be right. The ratio ' +
  'is already 67 to 1, but neither number is big enough to hurt. This is exactly why slow algorithms ' +
  'survive testing: at the sizes people try first, everything works.';

const DOUBLE_NOTE =
  'That is the whole difference in one line. Double the input and an n² algorithm does four times the ' +
  'work, while an n log n algorithm does a little over twice as much. Watch the gap between the two curves.';

const MEDIUM_NOTE =
  'CONCLUSION AT MEDIUM SIZES. Tripling the input from 5000 tripled the heapsort’s work — but ' +
  'multiplied the bubble sort’s by NINE. That is n² in one sentence: three times the data, nine ' +
  'times the work. The bubble sort has crossed from ‘instant’ into ‘noticeable’, and the ' +
  'heapsort has not moved perceptibly. The ratio has gone from 67 to 181, and notice what that means — ' +
  'the gap is not a constant handicap, it is widening.';

const LARGE_NOTE =
  'CONCLUSION AT LARGE SIZES. Over a second against four milliseconds. At this point the difference is no ' +
  'longer about speed, it is about what is possible: the bubble sort’s curve keeps steepening, so ' +
  '300,000 elements would take it about two and a half MINUTES while the heapsort takes about 45 ms. This ' +
  'is the practical conclusion — a faster machine does not rescue an n² algorithm. Ten times the ' +
  'hardware buys you about three times the array size, and then you are stuck again. Choosing the algorithm ' +
  'is worth more than choosing the computer.';

const SLIDER_NOTE =
  'Sweep it and watch the RATIO column rather than either time: 67× at 5000, 181× at 15000, ' +
  '337× at 30000. A ratio that itself keeps growing is what a difference in growth RATE looks like. ' +
  'Build this same graph yourself from real measurements. Your absolute numbers will differ from these ' +
  '— the two shapes will not.';

/* ---- the trace: eight plotted measurements, then the slider goes live ---- */
function* trace() {
  const slider = live => ({ live });

  // STEP 0 -- empty chart, axes drawn and labelled at their final scale, no points.
  yield {
    line: null, tag: 'setup', note: MODELLED_NOTE,
    narrate: 'Two sorting algorithms, timed on the same data at increasing sizes.',
    panels: { chart: chartData(0, null), readout: readoutPlaceholder(), slider: slider(false) },
  };

  // STEP 1 (n = 5000) -- SMALL.
  yield {
    line: null, tag: 'plot', note: SMALL_NOTE,
    narrate: 'At 5000 elements the bubble sort takes 37 ms and the heapsort 0.55 ms.',
    panels: { chart: chartData(1, null), readout: readoutCells(5000), slider: slider(false) },
  };

  // STEP 2 (n = 10000).
  yield {
    line: null, tag: 'plot', note: DOUBLE_NOTE,
    narrate: 'Doubling to 10000 elements roughly QUADRUPLES the bubble sort: 37 ms to 150 ms. ' +
             'The heapsort only about doubles.',
    panels: { chart: chartData(2, null), readout: readoutCells(10000), slider: slider(false) },
  };

  // STEP 3 (n = 15000) -- MEDIUM.
  yield {
    line: null, tag: 'plot', note: MEDIUM_NOTE,
    narrate: 'At 15000: 338 ms against 1.87 ms.',
    panels: { chart: chartData(3, null), readout: readoutCells(15000), slider: slider(false) },
  };

  // STEP 4 (n = 20000) -- one sentence, ratio named, no note.
  yield {
    line: null, tag: 'plot',
    narrate: 'At 20000: 600 ms against 2.57 ms — the bubble sort now takes 233 times as long.',
    panels: { chart: chartData(4, null), readout: readoutCells(20000), slider: slider(false) },
  };

  // STEP 5 (n = 25000) -- one sentence, ratio named, no note.
  yield {
    line: null, tag: 'plot',
    narrate: 'At 25000: 938 ms against 3.29 ms — 285 times as long.',
    panels: { chart: chartData(5, null), readout: readoutCells(25000), slider: slider(false) },
  };

  // STEP 6 (n = 30000) -- LARGE.
  yield {
    line: null, tag: 'plot', note: LARGE_NOTE,
    narrate: 'At 30000: 1350 ms against 4 ms. 337 times as long.',
    panels: { chart: chartData(6, null), readout: readoutCells(30000), slider: slider(false) },
  };

  // STEP 7 -- the slider goes live.
  yield {
    line: null, tag: 'read', note: SLIDER_NOTE,
    narrate: 'Drag the slider to read both times at any size.',
    panels: { chart: chartData(6, SLIDER_DEFAULT), readout: readoutCells(SLIDER_DEFAULT), slider: slider(true) },
  };
}

export default {
  title: 'Two sorts, one graph',
  subtitle: 'How execution time grows with the number of elements',
  profile: 'standard',
  columns: 2,

  // Three panels, in reading order: the chart the student watches fill in, the
  // readout that carries the lesson (the ratio), then the slider control. No CODE
  // panel -- this animation plots a result, it does not trace a statement, so no
  // line is ever highlighted. Everything resolves once on load and holds, so
  // nothing moves as steps advance or as the slider is dragged (pac.verifyHeights()).
  panels: [
    { type: 'chart',  id: 'chart',   title: 'Execution time vs. number of elements', structure: true },
    { type: 'cells',  id: 'readout', title: 'At this size', compact: true },
    { type: 'slider', id: 'slider',  title: 'Read the times at any size', compact: true },
  ],

  // The slider is a narrow WATCH-only exception (panels/slider.js). It is inert
  // until the last step (liveStep), then live; moving it re-reads the chart marker
  // and the readout at the chosen n via frame(n), changing neither step nor note.
  slider: {
    min: 1000, max: 30000, step: 1000, default: SLIDER_DEFAULT, liveStep: 7,
    label: 'number of elements',
    format: n => String(n),
    inertHint: 'Available once the graph is complete.',
    liveHint: 'Live — drag to read the times at any size.',
    frame: n => ({ chart: chartData(6, n), readout: readoutCells(n) }),
  },

  initialTrace: 'run',
  traces: {
    run: trace,
  },
};
