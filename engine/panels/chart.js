/* CHART panel — a fixed-axis line plot of one or more series over n.
 *
 * Designed in panel-inventory §2, built here for `sorting-timing-chart` (ds A7).
 * ds7 grades a plot of execution time vs. number of elements; this renders it.
 *
 * MASTER INVARIANT, applied to a chart: the axes and their scale are FIXED from
 * step 0 to the final extent, so nothing rescales as points appear. The domain is
 * given by the STEP (`xMax`/`yMax`), not derived from the points currently shown —
 * a rescaling axis is the chart equivalent of a resizing panel and is forbidden.
 * The renderer never looks at the data to decide the scale; every step passes the
 * same domain, and points are simply added incrementally within it.
 *
 * A STRUCTURE panel: it never scrolls, in either axis. The SVG carries a fixed
 * viewBox and is sized to its region; the plot scales with the viewBox to fit.
 *
 * Step data:
 *   { series: [{ name, color, points: [{x, y}] }],
 *     xLabel, yLabel,
 *     xMax, yMax,                          // the FIXED domain (both axes)
 *     xTicks: [{v, label}], yTicks: [{v, label}],
 *     marker: { x, callouts: [{color, y, label}] } | null }
 *
 * `marker` draws a vertical line at x with each series' value called out — a dot
 * on the curve plus a labelled time. Driven by the slider (see slider.js). Colours
 * come from the design tokens the content file passes; the renderer invents none. */

const VB = { w: 460, h: 270 };            // viewBox — the plot's fixed coordinate space
const M  = { l: 54, r: 54, t: 14, b: 40 }; // margins: y-labels left, series names right, x-labels below
const PW = VB.w - M.l - M.r;              // plot width
const PH = VB.h - M.t - M.b;              // plot height

export function mount(body) {
  body.innerHTML =
    `<svg class="pac-chart" xmlns="http://www.w3.org/2000/svg" ` +
    `viewBox="0 0 ${VB.w} ${VB.h}" width="${VB.w}" height="${VB.h}" ` +
    `preserveAspectRatio="xMidYMid meet" role="img"></svg>`;
}

export function render(body, data) {
  const svg = body.querySelector('svg');
  if (!data) { svg.innerHTML = ''; return; }

  // Scale from the FIXED domain the step supplies — never from the points shown.
  const xMax = data.xMax || 1, yMax = data.yMax || 1;
  const X = x => M.l + (x / xMax) * PW;
  const Y = y => (M.t + PH) - (y / yMax) * PH;
  const val = t => (t && typeof t === 'object') ? t.v : t;
  const lab = t => (t && typeof t === 'object') ? t.label : t;

  const P = [];

  // --- axes (drawn at their final scale from step 0) ---
  P.push(`<line class="pac-chart-axis" x1="${M.l}" y1="${M.t}" x2="${M.l}" y2="${M.t + PH}"/>`);
  P.push(`<line class="pac-chart-axis" x1="${M.l}" y1="${M.t + PH}" x2="${M.l + PW}" y2="${M.t + PH}"/>`);

  // --- labelled ticks ---
  for (const t of data.xTicks ?? []) {
    const x = X(val(t));
    P.push(`<line class="pac-chart-axis" x1="${x}" y1="${M.t + PH}" x2="${x}" y2="${M.t + PH + 4}"/>`);
    P.push(`<text class="pac-chart-tick" x="${x}" y="${M.t + PH + 15}" text-anchor="middle">${esc(lab(t))}</text>`);
  }
  for (const t of data.yTicks ?? []) {
    const y = Y(val(t));
    P.push(`<line class="pac-chart-axis" x1="${M.l - 4}" y1="${y}" x2="${M.l}" y2="${y}"/>`);
    P.push(`<text class="pac-chart-tick" x="${M.l - 7}" y="${y + 3}" text-anchor="end">${esc(lab(t))}</text>`);
  }

  // --- axis captions ---
  if (data.xLabel)
    P.push(`<text class="pac-chart-axislabel" x="${M.l + PW / 2}" y="${VB.h - 3}" text-anchor="middle">${esc(data.xLabel)}</text>`);
  if (data.yLabel) {
    const cy = M.t + PH / 2;
    P.push(`<text class="pac-chart-axislabel" x="11" y="${cy}" text-anchor="middle" transform="rotate(-90 11 ${cy})">${esc(data.yLabel)}</text>`);
  }

  // --- marker: vertical line + a called-out value per series ---
  if (data.marker) {
    const mx = X(data.marker.x);
    P.push(`<line class="pac-chart-marker" x1="${mx}" y1="${M.t}" x2="${mx}" y2="${M.t + PH}"/>`);
    // Labels sit to the right of the line, unless the line is near the right edge.
    const right = data.marker.x <= xMax * 0.72;
    const tx = right ? mx + 6 : mx - 6;
    const anchor = right ? 'start' : 'end';
    for (const c of data.marker.callouts ?? []) {
      const cy = Y(c.y);
      P.push(`<circle class="pac-chart-dot" cx="${mx}" cy="${cy}" r="3.4" fill="${c.color}"/>`);
      P.push(`<text class="pac-chart-callout" x="${tx}" y="${cy - 5}" text-anchor="${anchor}" fill="${c.color}">${esc(c.label)}</text>`);
    }
  }

  // --- series: points joined by straight segments, added incrementally ---
  for (const s of data.series ?? []) {
    const pts = s.points ?? [];
    if (!pts.length) continue;
    const color = s.color ?? 'var(--accent)';
    const d = pts.map((p, k) => `${k ? 'L' : 'M'} ${X(p.x).toFixed(1)} ${Y(p.y).toFixed(1)}`).join(' ');
    P.push(`<path class="pac-chart-series" stroke="${color}" d="${d}"/>`);
    for (const p of pts)
      P.push(`<circle class="pac-chart-point" cx="${X(p.x).toFixed(1)}" cy="${Y(p.y).toFixed(1)}" r="2.6" fill="${color}"/>`);
    const last = pts[pts.length - 1];
    P.push(`<text class="pac-chart-name" x="${X(last.x) + 5}" y="${Y(last.y) - 6}" text-anchor="start" fill="${color}">${esc(s.name)}</text>`);
  }

  svg.innerHTML = P.join('');
}

const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
