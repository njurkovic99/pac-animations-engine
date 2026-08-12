#!/usr/bin/env node
/* pac-animations visual baseline tool.
 *
 * Renders every animation to PNG at five points across its trace (0%, 25%, 50%,
 * 75%, 100% of the steps) and diffs them against committed baselines, so an engine
 * or CSS change that shifts a pixel anywhere is caught by name. Tooling only -- it
 * never touches engine/, content/, anim/ or the data; it loads each anim/<name>.html
 * over a local http server and drives the engine's own controls.
 *
 *   node tools/screenshots.mjs            # render to a temp dir, diff vs tools/baseline
 *   node tools/screenshots.mjs --update   # (re)write the baselines in tools/baseline
 *
 * Default mode exits 0 iff every frame matches its baseline; otherwise it prints the
 * animations that differ (with the frame and the changed-pixel count) and exits 1.
 * Update mode always exits 0. The viewport is fixed, transitions are disabled and
 * only the .pac-stage element is captured, so a frame is deterministic run to run.
 */

import { chromium } from 'playwright';
import http from 'node:http';
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE = path.join(ROOT, 'tools', 'baseline');
const VIEWPORT = { width: 1600, height: 1000 };   // fixed, so frames are deterministic
const PCTS = [0, 25, 50, 75, 100];                // where in the trace to capture
const UPDATE = process.argv.includes('--update');

const animations = readdirSync(path.join(ROOT, 'content'))
  .filter(f => f.endsWith('.js')).map(f => f.replace(/\.js$/, '')).sort();

/* --------------------------------------------------------------- http server */

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.map': 'application/json',
};
const isDir = p => { try { readdirSync(p); return true; } catch { return false; } };
function startServer() {
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent(req.url.split('?')[0]);
    const filePath = path.join(ROOT, path.normalize(urlPath));
    if (!filePath.startsWith(ROOT) || !existsSync(filePath) || isDir(filePath)) {
      res.writeHead(404); res.end('not found'); return;
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] ?? 'application/octet-stream' });
    res.end(readFileSync(filePath));
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () =>
    resolve({ server, port: server.address().port })));
}

/* Discover a chromium executable under PLAYWRIGHT_BROWSERS_PATH (the pre-installed
 * build may not match playwright's default path); fall back to playwright's own. */
function findChromium() {
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (!base || !existsSync(base)) return undefined;
  const subs = ['chrome-linux/chrome', 'chrome-linux64/chrome',
                'chrome-mac/Chromium.app/Contents/MacOS/Chromium', 'chrome-win/chrome.exe'];
  for (const d of readdirSync(base).filter(n => n.startsWith('chromium-')).sort().reverse())
    for (const s of subs) { const p = path.join(base, d, s); if (existsSync(p)) return p; }
  return undefined;
}

// Kill transitions/animations so a screenshot never lands mid-tween.
const NO_MOTION = `*,*::before,*::after{transition:none!important;animation:none!important;
  caret-color:transparent!important;scroll-behavior:auto!important;}`;

/* Render one animation's frames -- always one per entry in PCTS, in order, so the
 * baseline set is stable (a short trace may map two percentages onto the same step,
 * yielding identical frames; that is fine and deterministic). Returns [{pct, png}]. */
async function renderFrames(browser, base, name) {
  const page = await browser.newPage({ viewport: VIEWPORT });
  await page.addStyleTag({ content: NO_MOTION }).catch(() => {});
  await page.goto(`${base}/anim/${name}.html`);
  await page.waitForFunction(() => window.pac && window.pac.steps && window.pac.steps.length > 0, { timeout: 15000 });
  await page.addStyleTag({ content: NO_MOTION });        // re-add after the engine mounts
  const n = await page.evaluate(() => window.pac.steps.length);

  const out = [];
  await page.evaluate(() => document.querySelector('.pac-controls [data-act="reset"]').click());
  for (const pct of PCTS) {                               // ascending, so we only ever step forward
    const step = Math.round((pct / 100) * (n - 1));
    await page.evaluate((k) => { while (window.pac.i < k)
      document.querySelector('.pac-controls [data-act="next"]').click(); }, step);
    await page.waitForTimeout(40);
    const stage = await page.$('.pac-stage');
    out.push({ pct, png: await (stage ?? page).screenshot() });
  }
  await page.close();
  return out;
}

const frameName = (name, pct) => `${name}@${String(pct).padStart(3, '0')}.png`;

/* Compare two PNG buffers. Returns {same, reason, diff} -- diff is the changed-pixel
 * count. Antialiasing pixels are not counted (pixelmatch default). */
function comparePng(aBuf, bBuf) {
  const a = PNG.sync.read(aBuf), b = PNG.sync.read(bBuf);
  if (a.width !== b.width || a.height !== b.height)
    return { same: false, reason: `size ${a.width}x${a.height} -> ${b.width}x${b.height}`, diff: -1 };
  const diff = pixelmatch(a.data, b.data, null, a.width, a.height, { threshold: 0.1 });
  return { same: diff === 0, reason: `${diff}px changed`, diff };
}

/* ---------------------------------------------------------------------- main */

async function main() {
  const { server, port } = await startServer();
  const base = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch({ executablePath: findChromium() });

  if (UPDATE) mkdirSync(BASELINE, { recursive: true });
  const tmp = path.join(ROOT, 'tools', '.screenshots-tmp');
  if (!UPDATE) { rmSync(tmp, { recursive: true, force: true }); mkdirSync(tmp, { recursive: true }); }

  const differing = [];      // {name, pct, reason}
  const missing = [];        // frames with no baseline to compare against
  let frames = 0;

  for (const name of animations) {
    process.stderr.write(`  … ${name}\r`);
    const rendered = await renderFrames(browser, base, name);
    for (const { pct, png } of rendered) {
      frames++;
      const file = frameName(name, pct);
      if (UPDATE) { writeFileSync(path.join(BASELINE, file), png); continue; }
      writeFileSync(path.join(tmp, file), png);
      const baseFile = path.join(BASELINE, file);
      if (!existsSync(baseFile)) { missing.push(file); continue; }
      const cmp = comparePng(readFileSync(baseFile), png);
      if (!cmp.same) differing.push({ name, pct, reason: cmp.reason });
    }
  }
  process.stderr.write(' '.repeat(60) + '\r');
  await browser.close();
  server.close();

  if (UPDATE) {
    console.log(`\nscreenshots — wrote ${frames} baseline frame(s) for ${animations.length} animations to tools/baseline/`);
    process.exit(0);
  }

  const changedAnims = new Set(differing.map(d => d.name));
  console.log(`\npac-animations screenshots — ${animations.length} animations, ${frames} frames, viewport ${VIEWPORT.width}×${VIEWPORT.height}\n`);
  console.log(`  matched   ${animations.length - changedAnims.size - new Set(missing.map(m => m.split('@')[0])).size}/${animations.length} animations`);

  if (missing.length) {
    console.log(`\n  NO BASELINE (run with --update to create):`);
    for (const m of missing) console.log(`    - ${m}`);
  }
  if (differing.length) {
    console.log(`\nDIFFER —\n`);
    const byName = {};
    for (const d of differing) (byName[d.name] ??= []).push(`${d.pct}% (${d.reason})`);
    for (const name of Object.keys(byName).sort())
      console.log(`  ${name}: ${byName[name].join(', ')}`);
    console.log(`\n${differing.length} frame(s) across ${changedAnims.size} animation(s) differ. Temp renders in tools/.screenshots-tmp/.`);
    process.exit(1);
  }
  if (missing.length) { console.log(`\n${missing.length} frame(s) had no baseline.`); process.exit(1); }
  console.log(`\nPASS — every frame matches its baseline.`);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(2); });
