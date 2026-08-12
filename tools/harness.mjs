#!/usr/bin/env node
/* pac-animations regression harness.
 *
 * Drives every animation headlessly and asserts, mechanically, the invariants we
 * have been checking by eye. Tooling only -- it never touches engine/, content/,
 * anim/ or the data; it just loads each anim/<name>.html over a local http server
 * (ES modules are blocked over file://) and steps it start-to-finish through the
 * engine's own Next control.
 *
 *   node tools/harness.mjs        # run all checks; exit 0 iff everything passes
 *
 * Checks, per animation:
 *   1. LAYOUT STABILITY -- the master invariant. Record the width and height of the
 *      stage, every panel, and every leaf box (cells, nodes) at step 0; re-measure
 *      at every step; any size that changes is a failure. Sizes only, so legitimate
 *      internal SCROLLING (the code panel following its highlight, a tree panning to
 *      its active node) is not mistaken for a reflow. This is the check that would
 *      have caught the column-cell drift: that bug left every panel's outer box
 *      unchanged and only resized the cells inside, which this measures.
 *   2. verifyHeights() -- call the engine's own height-accounting check; any nonzero
 *      delta is a failure, reported verbatim.
 *   3. CONSOLE CLEAN -- any console error or unhandled rejection during the whole
 *      traversal fails (favicon 404s from the test server are ignored).
 *   4. STEP INTEGRITY -- the trace reaches atEnd without throwing; Back from the last
 *      step returns to the previous one; Back from step 0 is a no-op, not an error.
 *   5. LINK TARGETS -- every note-link href across content/*.js resolves to a file in
 *      anim/.
 *   6. FILE PAIRING -- every content/*.js has a matching anim/*.html and vice versa.
 */

import { chromium } from 'playwright';
import http from 'node:http';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VIEWPORT = { width: 1600, height: 1000 };   // fixed, so results are deterministic
const EPS = 0.5;                                  // sub-pixel tolerance for layout drift
const px = n => (Math.round(n * 10) / 10);        // 1-decimal, so a real change never prints as "32->32"

/* ------------------------------------------------------------------ discovery */

const animations = readdirSync(path.join(ROOT, 'content'))
  .filter(f => f.endsWith('.js'))
  .map(f => f.replace(/\.js$/, ''))
  .sort();

/* ------------------------------------------------------- static (no browser) */

// 6. FILE PAIRING
function checkFilePairing() {
  const content = new Set(animations);
  const anim = new Set(readdirSync(path.join(ROOT, 'anim'))
    .filter(f => f.endsWith('.html')).map(f => f.replace(/\.html$/, '')));
  const fails = [];
  for (const c of content) if (!anim.has(c)) fails.push(`content/${c}.js has no anim/${c}.html`);
  for (const a of anim) if (!content.has(a)) fails.push(`anim/${a}.html has no content/${a}.js`);
  return { total: content.size + anim.size, fails };
}

// 5. LINK TARGETS -- every note-link href in content/*.js resolves to a real anim page.
function checkLinkTargets() {
  const re = /href:\s*(['"])([\w-]+\.html)\1/g;
  const refs = [];
  for (const name of animations) {
    const src = readFileSync(path.join(ROOT, 'content', `${name}.js`), 'utf8');
    let m;
    while ((m = re.exec(src))) refs.push({ from: `${name}.js`, href: m[2] });
  }
  const fails = [];
  for (const r of refs)
    if (!existsSync(path.join(ROOT, 'anim', r.href)))
      fails.push(`${r.from} links to ${r.href}, which does not exist in anim/`);
  return { total: refs.length, fails };
}

/* --------------------------------------------------------------- http server */

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.map': 'application/json',
};

function startServer() {
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent(req.url.split('?')[0]);
    const filePath = path.join(ROOT, path.normalize(urlPath));
    if (!filePath.startsWith(ROOT) || !existsSync(filePath) || readdirSyncSafe(filePath)) {
      res.writeHead(404); res.end('not found'); return;
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] ?? 'application/octet-stream' });
    res.end(readFileSync(filePath));
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () =>
    resolve({ server, port: server.address().port })));
}
const readdirSyncSafe = p => { try { readdirSync(p); return true; } catch { return false; } };

/* --------------------------------------------------------- browser plumbing */

// The pre-installed browser may not match the playwright build's default path, so
// discover a chromium executable under PLAYWRIGHT_BROWSERS_PATH; fall back to
// playwright's own default when none is found (a normal `npm install` layout).
function findChromium() {
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (!base || !existsSync(base)) return undefined;
  const subs = ['chrome-linux/chrome', 'chrome-linux64/chrome',
                'chrome-mac/Chromium.app/Contents/MacOS/Chromium', 'chrome-win/chrome.exe'];
  for (const d of readdirSync(base).filter(n => n.startsWith('chromium-')).sort().reverse())
    for (const s of subs) {
      const p = path.join(base, d, s);
      if (existsSync(p)) return p;
    }
  return undefined;
}

/* Measure the layout signature: the size (w,h) of the stage, every panel, and every
 * leaf box (cell, node), keyed stably so step N can be compared to step 0. Sizes
 * only -- position is deliberately not compared, so scrolling is not a false
 * positive. Widths and heights are UNROUNDED (compared with a sub-pixel epsilon
 * below), so a value that merely straddles a rounding boundary from font
 * antialiasing is not mistaken for a reflow. Runs in the page. */
const SIZE_SIG = () => {
  const r = el => { const b = el.getBoundingClientRect(); return [b.width, b.height]; };
  const sig = {};
  const stage = document.querySelector('.pac-stage');
  if (stage) sig['stage'] = r(stage);
  [...document.querySelectorAll('.pac-panel')].forEach((p, pi) => {
    const title = (p.querySelector('.pac-panel-head span')?.textContent ?? '').trim();
    sig[`panel[${pi}] ${p.dataset.type} "${title}"`] = r(p);
    [...p.querySelectorAll('.pac-cell')].forEach((c, i) => { sig[`  p${pi} cell[${i}]`] = r(c); });
    [...p.querySelectorAll('.pac-node')].forEach((c, i) => { sig[`  p${pi} node[${i}]`] = r(c); });
  });
  return sig;
};

/* Run all per-animation browser checks. Returns a per-check pass flag + failures. */
async function runAnimation(browser, base, name) {
  const fails = { layout: [], heights: [], console: [], integrity: [] };
  const page = await browser.newPage({ viewport: VIEWPORT });

  const consoleErrs = [];
  // A failed-resource console error carries its URL in location(), not text() ("Failed
  // to load resource: ... 404"), so the favicon 404 the browser fires on every page
  // must be filtered on BOTH -- the test server serves no favicon and the user asked
  // for those to be ignored.
  const isFavicon = m => /favicon\.ico/.test(m.text()) || /favicon\.ico/.test(m.location?.()?.url ?? '');
  page.on('console', m => { if (m.type() === 'error' && !isFavicon(m)) consoleErrs.push(m.text()); });
  page.on('pageerror', e => consoleErrs.push(`pageerror: ${e.message}`));
  page.on('requestfailed', req => { if (!/favicon\.ico/.test(req.url())) consoleErrs.push(`requestfailed: ${req.url()}`); });

  try {
    await page.goto(`${base}/anim/${name}.html`);
    await page.waitForFunction(() => window.pac && window.pac.steps && window.pac.steps.length > 0, { timeout: 15000 });
    await page.waitForTimeout(60);

    const nSteps = await page.evaluate(() => window.pac.steps.length);

    // 2. verifyHeights -- layout accounting.
    const vh = await page.evaluate(() => window.pac.verifyHeights());
    for (const row of vh) if (row.delta !== 0)
      fails.heights.push(`${name}: verifyHeights column "${row.column}" delta=${row.delta}px (${row.heights} vs content ${row.content})`);

    // 1. LAYOUT STABILITY -- signature at step 0, re-measured every step.
    const ref = await page.evaluate(SIZE_SIG);
    for (let step = 1; step < nSteps; step++) {
      const advanced = await page.evaluate(() => {
        const btn = document.querySelector('.pac-controls [data-act="next"]');
        if (!btn) return { ok: false, why: 'no Next control' };
        btn.click();                                   // the engine's own Next control
        return { ok: true, i: window.pac.i };
      });
      if (!advanced.ok) { fails.integrity.push(`${name}: ${advanced.why}`); break; }
      await page.waitForTimeout(8);
      const cur = await page.evaluate(SIZE_SIG);
      for (const key of Object.keys(ref)) {
        if (!(key in cur)) continue;                   // content added/removed -> not a resize
        const [w0, h0] = ref[key], [w1, h1] = cur[key];
        // Sub-pixel epsilon: ignore antialiasing jitter, flag anything a person
        // could see. Every real finding here is 3px or more, so this hides no reflow.
        if (Math.abs(w0 - w1) >= EPS || Math.abs(h0 - h1) >= EPS)
          fails.layout.push(`${name}: step ${step}: ${key.trim()} resized ${px(w0)}x${px(h0)} -> ${px(w1)}x${px(h1)}`);
      }
    }
    // dedupe layout failures (a size that drifts once tends to stay drifted for the
    // rest of the trace -- report the first occurrence of each key, not every step).
    fails.layout = dedupeFirst(fails.layout, l => l.replace(/step \d+/, 'step'));

    // 4. STEP INTEGRITY.
    const end = await page.evaluate(() => ({ i: window.pac.i, atEnd: window.pac.atEnd, n: window.pac.steps.length }));
    if (!end.atEnd || end.i !== end.n - 1)
      fails.integrity.push(`${name}: did not reach atEnd (i=${end.i} of ${end.n - 1}, atEnd=${end.atEnd})`);
    // Back from the final step -> previous step.
    const back = await page.evaluate(() => {
      document.querySelector('.pac-controls [data-act="prev"]').click();
      return window.pac.i;
    });
    if (back !== end.n - 2 && end.n > 1)
      fails.integrity.push(`${name}: Back from final step went to i=${back}, expected ${end.n - 2}`);
    // Back from step 0 -> no-op (not an error). Reset, then Back.
    const atZero = await page.evaluate(() => {
      document.querySelector('.pac-controls [data-act="reset"]').click();
      const before = window.pac.i;
      document.querySelector('.pac-controls [data-act="prev"]').click();
      return { before, after: window.pac.i };
    });
    if (atZero.before !== 0 || atZero.after !== 0)
      fails.integrity.push(`${name}: Back from step 0 changed i ${atZero.before} -> ${atZero.after} (expected 0 -> 0)`);
  } catch (e) {
    fails.integrity.push(`${name}: threw during traversal: ${e.message.split('\n')[0]}`);
  }

  // 3. CONSOLE CLEAN (collected across the whole traversal).
  for (const c of consoleErrs) fails.console.push(`${name}: ${c}`);

  await page.close();
  return fails;
}

const dedupeFirst = (arr, keyOf) => {
  const seen = new Set(), out = [];
  for (const x of arr) { const k = keyOf(x); if (!seen.has(k)) { seen.add(k); out.push(x); } }
  return out;
};

/* ---------------------------------------------------------------------- main */

async function main() {
  const pairing = checkFilePairing();
  const links = checkLinkTargets();

  const { server, port } = await startServer();
  const base = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch({ executablePath: findChromium() });

  const layout = [], heights = [], console_ = [], integrity = [];
  for (const name of animations) {
    process.stderr.write(`  … ${name}\r`);
    const f = await runAnimation(browser, base, name);
    layout.push(...f.layout); heights.push(...f.heights);
    console_.push(...f.console); integrity.push(...f.integrity);
  }
  process.stderr.write(' '.repeat(60) + '\r');

  await browser.close();
  server.close();

  // A check "passes" for an animation if it produced no failure for it.
  const failedAnims = arr => new Set(arr.map(l => l.split(':')[0])).size;
  const N = animations.length;
  const rows = [
    ['file pairing',     pairing.fails.length ? null : pairing.total, pairing.total, pairing.fails],
    ['link targets',     links.fails.length ? null : links.total, links.total, links.fails],
    ['layout stability', N - failedAnims(layout), N, layout],
    ['verifyHeights',    N - failedAnims(heights), N, heights],
    ['console clean',    N - failedAnims(console_), N, console_],
    ['step integrity',   N - failedAnims(integrity), N, integrity],
  ];

  console.log(`\npac-animations regression harness — ${N} animations, viewport ${VIEWPORT.width}×${VIEWPORT.height}\n`);
  for (const [label, pass, total, fails] of rows) {
    const count = fails.length ? `${label === 'file pairing' || label === 'link targets' ? (total - fails.length) : pass}/${total}` : `${total}/${total}`;
    console.log(`  ${label.padEnd(18)} ${count.padStart(7)}   ${fails.length ? '✗' : '✓'}`);
  }

  const allFails = [
    ['LAYOUT STABILITY', layout], ['verifyHeights', heights],
    ['CONSOLE', console_], ['STEP INTEGRITY', integrity],
    ['LINK TARGETS', links.fails], ['FILE PAIRING', pairing.fails],
  ].filter(([, f]) => f.length);

  if (allFails.length) {
    console.log('\nFAIL —\n');
    for (const [section, fs_] of allFails) {
      console.log(`  ${section}:`);
      for (const f of fs_) console.log(`    - ${f}`);
      console.log('');
    }
    console.log(`${allFails.reduce((s, [, f]) => s + f.length, 0)} failure(s).`);
    process.exit(1);
  }
  console.log('\nPASS — all checks green.');
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(2); });
