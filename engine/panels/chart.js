/* CHART panel — series over n.
 * Required, not optional: ds7 grades a plot of execution time vs. n.
 * Step data: { series: [{name, color, points:[[x,y],..]}], xLabel, yLabel, marker: x } */

export function mount(body) {
  body.innerHTML = `<svg class="pac-chart" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200"></svg>`;
}

export function render(body, data) {
  const svg = body.querySelector('svg');
  if (!data?.series?.length) { svg.innerHTML = ''; return; }
  const W = 320, H = 200, L = 34, B = 24;
  const pts = data.series.flatMap(s => s.points);
  const mx = Math.max(...pts.map(p => p[0]), 1), my = Math.max(...pts.map(p => p[1]), 1);
  const X = x => L + (x / mx) * (W - L - 8);
  const Y = y => (H - B) - (y / my) * (H - B - 10);

  const paths = data.series.map(s =>
    `<path class="pac-chart-series" stroke="${s.color ?? 'var(--accent)'}"
       d="${s.points.map((p, k) => `${k ? 'L' : 'M'} ${X(p[0])} ${Y(p[1])}`).join(' ')}"/>
     <text class="pac-chart-tick" x="${X(s.points.at(-1)[0]) - 4}" y="${Y(s.points.at(-1)[1]) - 5}"
       fill="${s.color ?? 'var(--accent)'}" text-anchor="end">${s.name}</text>`).join('');

  const marker = data.marker != null
    ? `<line class="pac-chart-axis" x1="${X(data.marker)}" y1="10" x2="${X(data.marker)}" y2="${H - B}"
         stroke-dasharray="3 3"/>` : '';

  svg.innerHTML = `
    <line class="pac-chart-axis" x1="${L}" y1="10" x2="${L}" y2="${H - B}"/>
    <line class="pac-chart-axis" x1="${L}" y1="${H - B}" x2="${W - 8}" y2="${H - B}"/>
    <text class="pac-chart-tick" x="${W - 8}" y="${H - 8}" text-anchor="end">${data.xLabel ?? 'n'}</text>
    <text class="pac-chart-tick" x="4" y="14">${data.yLabel ?? ''}</text>
    ${marker}${paths}`;
}
