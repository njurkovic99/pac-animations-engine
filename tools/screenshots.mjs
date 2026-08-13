#!/usr/bin/env node
/* pac-animations visual baseline tool.
 *
 * Renders every animation to PNG at five points across its trace (0%, 25%, 50%,
 * 75%, 100% of the steps) and diffs them against a BASELINE SET, so an engine or CSS
 * change that shifts a pixel anywhere is caught by name. Tooling only -- it never
 * touches engine/, content/, anim/ or the data; it loads each anim/<name>.html over a
 * local http server and drives the engine's own controls.
 *
 * Baselines are NOT committed. A baseline PNG set is a large binary blob that inflates
 * every diff and collides across branches; instead the baseline is the PREVIOUS CI
 * run's rendered frames, downloaded from its `screenshots` artifact and pointed at with
 * --baseline (or PAC_BASELINE_DIR). Each run renders fresh frames to the out dir (which
 * CI uploads as this run's artifact) and diffs them against that baseline dir.
 *
 *   node tools/screenshots.mjs                         # capture-only: render frames, no diff
 *   node tools/screenshots.mjs --baseline <dir>        # diff fresh frames vs <dir>
 *   PAC_BASELINE_DIR=<dir> node tools/screenshots.mjs  # same, via env (how CI passes it)
 *   node tools/screenshots.mjs --out <dir>             # where fresh frames are written
 *
 * With a baseline it exits 0 iff every frame matches; otherwise it prints the animations
 * that differ (frame + changed-pixel count) and exits 1. With NO baseline it is
 * capture-only: it writes the frames and exits 0 (nothing to compare against yet -- the
 * first run, or before CI wires the previous artifact in). The viewport is fixed,
 * transitions are disabled and only the .pac-stage element is captured, so a frame is
 * deterministic run to run. */

import { chromium } from 'playwright';
import http from 'node:http';
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VIEWPORT = { width: 1600, height: 1000 };   // fixed, so frames are deterministic
const PCTS = [0, 25, 50, 75, 100];                // where in the trace to capture

// A flag's value: `--baseline dir` or `--baseline=dir`.
const argVal = (flag) => {
  const i = process.argv.indexOf(flag);
  if (i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('-')) return process.argv[i + 1];
  const eq = process.argv.find(a => a.startsWith(`${flag}=`));
  return eq ? eq.slice(flag.length + 1) : undefined;
};

// Where the previous run's frames live (the baseline). No committed default -- when
// absent, the tool is capture-only.
const BASELINE = argVal('--baseline') ?? process.env.PAC_BASELINE_DIR ?? '';
// Where this run's frames are written. Defaults to the temp dir CI uploads as the
// `screenshots` artifact, so a bare `node tools/screenshots.mjs` in CI just works.
const OUT = argVal('--out') ?? path.join(ROOT, 'tools', '.screenshots-tmp');
const hasBaseline = BASELINE && existsSync(BASELINE) &&
  readdirSync(BASELINE).some(f => f.endsWith('.png'));

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

/* Compare two PNG buffers. Returns {same, reason, diff, image} -- diff is the
 * changed-pixel count, image is a PNG buffer visualising the changed pixels (null
 * when identical or when the sizes differ, since pixelmatch needs equal sizes).
 * Antialiasing pixels are not counted (pixelmatch default). */
function comparePng(aBuf, bBuf) {
  const a = PNG.sync.read(aBuf), b = PNG.sync.read(bBuf);
  if (a.width !== b.width || a.height !== b.height)
    return { same: false, reason: `size ${a.width}x${a.height} -> ${b.width}x${b.height}`, diff: -1, image: null };
  const out = new PNG({ width: a.width, height: a.height });
  const diff = pixelmatch(a.data, b.data, out.data, a.width, a.height, { threshold: 0.1 });
  return { same: diff === 0, reason: `${diff}px changed`, diff, image: diff ? PNG.sync.write(out) : null };
}

/* ---------------------------------------------------------------------- main */

async function main() {
  const { server, port } = await startServer();
  const base = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch({ executablePath: findChromium() });

  // Fresh renders always go to OUT (CI uploads it as this run's artifact). Clear it so
  // stale frames from a previous local run never linger.
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });

  const differing = [];      // {name, pct, reason}
  const missing = [];        // frames present now but absent from the baseline set
  let frames = 0;

  for (const name of animations) {
    process.stderr.write(`  … ${name}\r`);
    const rendered = await renderFrames(browser, base, name);
    for (const { pct, png } of rendered) {
      frames++;
      const file = frameName(name, pct);
      writeFileSync(path.join(OUT, file), png);       // this run's frame -> artifact
      if (!hasBaseline) continue;                     // capture-only: nothing to diff
      const baseFile = path.join(BASELINE, file);
      if (!existsSync(baseFile)) { missing.push(file); continue; }
      const cmp = comparePng(readFileSync(baseFile), png);
      if (!cmp.same) {
        differing.push({ name, pct, reason: cmp.reason });
        // Alongside the fresh render, drop a pixel-diff overlay (magenta = changed)
        // so the uploaded artifact shows WHERE a frame moved, not just that it did.
        if (cmp.image) writeFileSync(path.join(OUT, `${name}@${String(pct).padStart(3, '0')}.diff.png`), cmp.image);
      }
    }
  }
  process.stderr.write(' '.repeat(60) + '\r');
  await browser.close();
  server.close();

  const outRel = path.relative(ROOT, OUT);
  console.log(`\npac-animations screenshots — ${animations.length} animations, ${frames} frames, viewport ${VIEWPORT.width}×${VIEWPORT.height}\n`);

  // No baseline: capture-only. This is the first run, or CI has not yet wired the
  // previous run's `screenshots` artifact in via --baseline. Frames are written for
  // the NEXT run to compare against; there is nothing to fail on.
  if (!hasBaseline) {
    console.log(`  captured ${frames} frame(s) to ${outRel}/ — no baseline set given, so no diff was run.`);
    console.log(`  (pass a previous run's frames with --baseline <dir> or PAC_BASELINE_DIR to diff.)`);
    console.log(`\nPASS — capture-only (no baseline to compare against).`);
    process.exit(0);
  }

  const changedAnims = new Set(differing.map(d => d.name));
  const baseRel = path.relative(ROOT, path.resolve(BASELINE));
  console.log(`  baseline  ${baseRel}/`);
  console.log(`  matched   ${animations.length - changedAnims.size - new Set(missing.map(m => m.split('@')[0])).size}/${animations.length} animations`);

  if (missing.length) {
    console.log(`\n  NOT IN BASELINE (a new animation, or a baseline predating it):`);
    for (const m of missing) console.log(`    - ${m}`);
  }
  if (differing.length) {
    console.log(`\nDIFFER —\n`);
    const byName = {};
    for (const d of differing) (byName[d.name] ??= []).push(`${d.pct}% (${d.reason})`);
    for (const name of Object.keys(byName).sort())
      console.log(`  ${name}: ${byName[name].join(', ')}`);
    console.log(`\n${differing.length} frame(s) across ${changedAnims.size} animation(s) differ. Fresh renders in ${outRel}/.`);
    process.exit(1);
  }
  if (missing.length) { console.log(`\n${missing.length} frame(s) had no baseline counterpart.`); process.exit(1); }
  console.log(`\nPASS — every frame matches its baseline.`);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(2); });
