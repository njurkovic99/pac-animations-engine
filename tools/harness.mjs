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
 *   6. FILE PAIRING -- every content/*.js has a matching anim/*.html AND a
 *      preview-*.html, and vice versa. Previews are generated artifacts (gitignored,
 *      not committed), so the harness BUILDS them first (node build-preview.mjs) and
 *      then asserts the pairing -- which verifies build-preview covers every animation,
 *      the guarantee this check exists for.
 *   7. NO COURSE REFERENCES -- no student-facing string (title, subtitle, narration,
 *      note) names an assignment, a course, or an assignment/course code. Scans the
 *      LOADED spec, so code comments and CODE listings are exempt, and the
 *      `assignment` rule fires only after the/your/this, so the CS sense is left alone.
 *   8. NO HORIZONTAL OVERFLOW -- the CODE panel and every STRUCTURE panel must fit
 *      their width at every step, INCLUDING the width a classic scrollbar would steal.
 *      A panel that scrolls vertically loses ~17px to its scrollbar on Windows (where
 *      every student and the instructor run these), but CI's headless Chromium renders
 *      0px OVERLAY scrollbars and never sees that loss -- so a raw scrollWidth >
 *      clientWidth test is blind to it (it passed while #51 shipped a 16px clearance
 *      that overflowed on Windows). This measures the UNCLAMPED content width and, for a
 *      vertically-scrolling panel, requires it to fit within clientWidth - SCROLLBAR;
 *      a non-scrolling panel keeps the plain clientWidth limit. A structure never
 *      scrolls sideways, and CODE takes all the width the other column leaves.
 *   9. COURSES COVERAGE -- courses.json parses; every content/*.js appears in at least
 *      one course and at most once per course (a shared Phase-2 animation may serve
 *      several courses) and every listed file exists; every ds assignment A1..A13 has a
 *      backer; and the ds/programming-course schema holds (ds has a `languages` array,
 *      each programming course a `lang` string).
 */

import { chromium } from 'playwright';
import http from 'node:http';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VIEWPORT = { width: 1600, height: 1000 };   // fixed, so results are deterministic
const EPS = 0.5;                                  // sub-pixel tolerance for layout drift
const px = n => (Math.round(n * 10) / 10);        // 1-decimal, so a real change never prints as "32->32"
// Classic (Windows) scrollbar width, in px. A panel that scrolls VERTICALLY shows a
// scrollbar that, on Windows -- where every student and the instructor actually run
// these -- eats this many px of the content width. CI's headless Chromium renders 0px
// OVERLAY scrollbars, so it never observes that loss; check 8 therefore models it
// ARITHMETICALLY (subtract SCROLLBAR from the available width for a scrolling panel)
// rather than measuring it. This MUST equal the engine's own reserve -- the constant
// `SCROLLBAR` in engine/engine.js (layoutStage), which widens the code panel by the same
// 17px so its widest line clears the scrollbar -- so the check and the engine agree by
// construction: the check flags exactly the clearance the engine is built to leave.
// Change one, change the other.
const SCROLLBAR = 17;

/* ------------------------------------------------------------------ discovery */

const animations = readdirSync(path.join(ROOT, 'content'))
  .filter(f => f.endsWith('.js'))
  .map(f => f.replace(/\.js$/, ''))
  .sort();

/* ------------------------------------------------------- static (no browser) */

// Previews (preview-<name>.html at the repo root) are GENERATED artifacts -- gitignored
// and never committed, because a committed preview is a 4000-line bundle that makes
// every diff unreadable and collides across branches. So the harness builds them itself
// before the pairing check, exactly as a developer would (`node build-preview.mjs`). A
// fresh checkout has zero previews; this fills them in, and the pairing check then
// verifies build-preview produced one for every animation.
function buildPreviews() {
  try {
    execFileSync('node', ['build-preview.mjs'], { cwd: ROOT, stdio: 'pipe' });
  } catch (e) {
    // A build failure is itself a signal -- surface it as a pairing failure, not a crash.
    return `build-preview.mjs failed: ${(e.stderr?.toString() || e.message).split('\n')[0]}`;
  }
  return null;
}

// 6. FILE PAIRING -- every content/*.js pairs with anim/<name>.html AND with a freshly
// built preview-<name>.html, and vice versa. The preview direction verifies
// build-preview.mjs covers every animation (a new animation that never got a preview is
// caught here); previews are built by buildPreviews() just above the harness run.
function checkFilePairing(buildErr) {
  const content = new Set(animations);
  const anim = new Set(readdirSync(path.join(ROOT, 'anim'))
    .filter(f => f.endsWith('.html')).map(f => f.replace(/\.html$/, '')));
  const preview = new Set(readdirSync(ROOT)
    .filter(f => /^preview-.+\.html$/.test(f)).map(f => f.replace(/^preview-/, '').replace(/\.html$/, '')));
  const fails = [];
  if (buildErr) fails.push(buildErr);
  for (const c of content) if (!anim.has(c)) fails.push(`content/${c}.js has no anim/${c}.html`);
  for (const a of anim) if (!content.has(a)) fails.push(`anim/${a}.html has no content/${a}.js`);
  for (const c of content) if (!preview.has(c)) fails.push(`content/${c}.js has no preview-${c}.html (run: node build-preview.mjs)`);
  for (const p of preview) if (!content.has(p)) fails.push(`preview-${p}.html has no content/${p}.js`);
  return { total: content.size + anim.size + preview.size, fails };
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

// 7. NO COURSE REFERENCES -- no STUDENT-FACING string (title, subtitle, narration,
// note) may name an assignment, a course, or an assignment/course code. An animation
// teaches a concept and must read correctly in ANY course; a shared Phase-2 animation
// would be wrong for at least one. Code comments and the CODE listings are
// instructor-/code-facing and exempt, which is why this reads the LOADED spec (title,
// subtitle, every step's narrate + note across every trace) rather than the raw file:
// only student-facing text is ever scanned. The `assignment` rule fires only when the
// word is preceded by the/your/this, so the CS sense ("every assignment is a reference
// copy", "the four pointer assignments") is left alone.
const COURSE_RULES = [
  { name: 'assignment',   re: /\b(?:the|your|this)\s+assignments?\b/gi },
  { name: 'ds<n> code',   re: /\bds\d+\b/gi },
  { name: 'A<n> code',    re: /\bA\d{1,2}\b/g },
  { name: 'project <n>',  re: /\bproject\s+\d+\b/gi },
  { name: 'homework',     re: /\bhomework\b/gi },
];

// Flatten a narrate/note value -- a string, or a segmented array mixing strings and
// {href,text} link objects -- to the student-facing strings inside it.
function segStrings(v) {
  if (v == null) return [];
  if (typeof v === 'string') return [v];
  if (Array.isArray(v)) return v.flatMap(segStrings);
  if (typeof v === 'object' && typeof v.text === 'string') return [v.text];
  return [];
}

async function checkCourseRefs() {
  const fails = [];
  for (const name of animations) {
    const file = path.join(ROOT, 'content', `${name}.js`);
    let spec;
    try { spec = (await import(pathToFileURL(file).href)).default; }
    catch (e) { fails.push(`${name}: could not load to scan (${e.message.split('\n')[0]})`); continue; }

    const strings = [];
    if (spec.title) strings.push(spec.title);
    if (spec.subtitle) strings.push(spec.subtitle);
    for (const key of Object.keys(spec.traces ?? {})) {
      const t = spec.traces[key];
      let steps;
      try { steps = typeof t === 'function' ? [...t()] : []; }
      catch { continue; }                              // a trace that needs a driver -- skip, don't crash
      for (const s of steps) { strings.push(...segStrings(s.narrate), ...segStrings(s.note)); }
    }

    const src = readFileSync(file, 'utf8').split('\n');
    const lineOf = txt => {                            // first raw line holding the matched phrase (for a place to look)
      const n = txt.toLowerCase();
      const i = src.findIndex(l => l.toLowerCase().includes(n));
      return i < 0 ? '?' : i + 1;
    };
    const seen = new Set();
    for (const str of strings) {
      for (const rule of COURSE_RULES) {
        rule.re.lastIndex = 0;
        let m;
        while ((m = rule.re.exec(str))) {
          const key = `${m[0]}@${m.index}@${str.slice(0, 12)}`;
          if (seen.has(key)) continue; seen.add(key);
          fails.push(`${name}.js:${lineOf(m[0])}: student-facing text names a course/assignment: "${m[0]}" (${rule.name})`);
        }
      }
    }
  }
  return fails;
}

// 9. COURSES COVERAGE -- courses.json maps animations to course modules and assignment
// backers, and nothing else checks it: a module can vanish (as the ds Hashing module
// did) while every other check stays green and student links quietly break. This
// asserts the file parses and that its coverage is complete and consistent -- every
// file appears in at least one course and at most once per course (a shared Phase-2
// animation may back several courses off one build).
function checkCoursesCoverage() {
  const fails = [];
  const file = path.join(ROOT, 'courses.json');
  let data;
  try { data = JSON.parse(readFileSync(file, 'utf8')); }
  catch (e) { return [`courses.json: does not parse — ${e.message.split('\n')[0]}`]; }

  // Course objects = top-level values carrying a `modules` array (skips _comment and
  // redirects). `ds` is the language-agnostic course; every other is a single-language
  // programming course.
  const courseKeys = Object.keys(data).filter(k =>
    data[k] && typeof data[k] === 'object' && Array.isArray(data[k].modules));

  // Every animation entry across every course, with where it came from.
  const entries = [];
  for (const ck of courseKeys)
    for (const m of data[ck].modules)
      for (const a of (m.animations ?? []))
        entries.push({ file: a.file, course: ck, topic: m.topic });

  const content = new Set(animations);   // content/*.js basenames

  // (a) every file referenced in courses.json exists in content/.
  for (const e of entries)
    if (!content.has(e.file))
      fails.push(`courses.json: ${e.course} module "${e.topic}" lists "${e.file}", which has no content/${e.file}.js`);

  // (b) A content file may appear in MULTIPLE courses but at most ONCE PER COURSE.
  //     Phase 2 is built on shared animations: one build serves 2-3 courses through
  //     per-course `?a=`/`?lang=` iframe URLs (objects-constructor-init backs bCpp A7,
  //     bJava A7 and aJava A1 off a single content file). So appearing in more than one
  //     course is correct, not a duplicate; a duplicate is the SAME file listed twice
  //     within ONE course, which is a real authoring mistake. Every content file must
  //     still appear in at least one course.
  const where = {};
  for (const e of entries) (where[e.file] ??= []).push(e.course);
  for (const [f, cs] of Object.entries(where)) {
    const dup = cs.find((c, i) => cs.indexOf(c) !== i);   // a course this file is listed in twice
    if (dup)
      fails.push(`courses.json: "${f}" appears more than once in course "${dup}" — a file may serve multiple courses, but at most once per course`);
  }
  for (const c of content)
    if (!where[c])
      fails.push(`courses.json: content/${c}.js appears in no course's modules — every animation must appear in at least one course`);

  // (c) every ds assignment A1..A13 has at least one animation whose `backs` names it.
  const ds = data.ds;
  if (!ds || !Array.isArray(ds.modules)) {
    fails.push('courses.json: there is no "ds" course with a modules array');
  } else {
    const backed = new Set();
    for (const m of ds.modules) for (const a of (m.animations ?? [])) if (a.backs) backed.add(a.backs);
    for (let i = 1; i <= 13; i++)
      if (!backed.has(`A${i}`))
        fails.push(`courses.json: ds assignment A${i} has no backing animation (no ds entry with "backs": "A${i}")`);
  }

  // (d) schema: `ds` carries a `languages` ARRAY and no `lang`; every programming course
  //     carries a `lang` STRING and no `languages` array. An empty `modules` array is
  //     fine (the four programming courses are empty until Phase 2), so it is not checked.
  for (const ck of courseKeys) {
    const c = data[ck];
    if (ck === 'ds') {
      if (!Array.isArray(c.languages)) fails.push('courses.json: ds must carry a "languages" array (its student-visible tabs)');
      if ('lang' in c) fails.push('courses.json: ds must not carry a "lang" field — it uses the "languages" array');
    } else {
      if (typeof c.lang !== 'string') fails.push(`courses.json: course "${ck}" must carry a "lang" string`);
      if ('languages' in c) fails.push(`courses.json: course "${ck}" must not carry a "languages" array — it uses the single "lang" string`);
    }
  }

  return fails;
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

/* Horizontal overflow of the CODE panel and every STRUCTURE panel -- INCLUDING the
 * overflow a classic scrollbar would cause but CI's 0px overlay scrollbar hides. A
 * student reading a structure must never scroll it sideways, and the width policy
 * (AUTHORING.md "Where panels go") gives CODE all the width the other column does not
 * need, so its widest line must fit too.
 *
 * The naive test is scrollWidth > clientWidth. Two problems it does NOT catch:
 *   - scrollWidth CLAMPS to clientWidth the moment content fits, so it cannot tell a
 *     panel with 1px to spare from one with 200px; and
 *   - a panel that scrolls VERTICALLY loses `scrollbar` px to its scrollbar on Windows,
 *     which CI (0px overlay scrollbars) never renders.
 * So this measures the UNCLAMPED content width (the rightmost leaf-element edge --
 * scrollWidth is exact only while it overflows) and, for a vertically-scrolling panel,
 * requires that width to fit within clientWidth - `scrollbar`. A non-scrolling panel
 * keeps the plain clientWidth limit. Book panels are exempt (the policy names structure
 * + CODE). Runs in the page. */
const H_OVERFLOW = (scrollbar) => {
  // Unclamped content width: the rightmost LEAF-element edge relative to the scroller's
  // content-box left. scrollWidth would report clientWidth back once content fits;
  // measuring leaves (elements with no element children) skips the wrappers that stretch
  // to fill the scroller -- a code line, a flex row -- which are what make scrollWidth
  // clamp, and reads the actual text/box extent underneath them.
  const contentWidth = el => {
    const base = el.getBoundingClientRect().left + el.clientLeft - el.scrollLeft;
    let max = 0;
    for (const c of el.querySelectorAll('*')) {
      if (c.firstElementChild) continue;                 // leaves only
      const r = c.getBoundingClientRect();
      if (r.width || r.height) max = Math.max(max, r.right - base);
    }
    return max;
  };
  const out = [];
  [...document.querySelectorAll('.pac-panel')].forEach((p, pi) => {
    const kind = p.dataset.kind;
    if (kind !== 'code' && kind !== 'structure') return;
    const title = (p.querySelector('.pac-panel-head span')?.textContent ?? '').trim();
    const els = [p.querySelector('.pac-panel-body')];
    if (kind === 'code') els.push(p.querySelector('.pac-code'));
    for (const el of els) {
      if (!el) continue;
      const vScroll = el.scrollHeight - el.clientHeight > 1;     // a vertical scrollbar will be present on Windows
      const limit   = el.clientWidth - (vScroll ? scrollbar : 0);
      const content = el.scrollWidth > el.clientWidth ? el.scrollWidth : contentWidth(el);
      if (content > limit + 0.5)                                 // +0.5: ignore sub-pixel measurement noise
        out.push({ key: `panel[${pi}] ${kind} "${title}"`, content, cw: el.clientWidth, limit, vScroll });
    }
  });
  return out;
};

/* Run all per-animation browser checks. Returns a per-check pass flag + failures. */
async function runAnimation(browser, base, name) {
  const fails = { layout: [], heights: [], console: [], integrity: [], overflow: [] };
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
    // 8. NO HORIZONTAL OVERFLOW -- measured at the same points.
    const ref = await page.evaluate(SIZE_SIG);
    const recordOverflow = (arr, step) => {
      for (const o of arr)
        fails.overflow.push(`${name}: step ${step}: ${o.key} overflows horizontally: content ${px(o.content)}px > ${px(o.limit)}px available` +
          (o.vScroll ? ` (clientWidth ${px(o.cw)}px − ${SCROLLBAR}px classic scrollbar)` : ` (clientWidth ${px(o.cw)}px)`));
    };
    recordOverflow(await page.evaluate(H_OVERFLOW, SCROLLBAR), 0);
    for (let step = 1; step < nSteps; step++) {
      const advanced = await page.evaluate(() => {
        const btn = document.querySelector('.pac-controls [data-act="next"]');
        if (!btn) return { ok: false, why: 'no Next control' };
        btn.click();                                   // the engine's own Next control
        return { ok: true, i: window.pac.i };
      });
      if (!advanced.ok) { fails.integrity.push(`${name}: ${advanced.why}`); break; }
      await page.waitForTimeout(8);
      recordOverflow(await page.evaluate(H_OVERFLOW, SCROLLBAR), step);
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
    // dedupe overflow the same way -- first step per panel that scrolls.
    fails.overflow = dedupeFirst(fails.overflow, l => l.replace(/step \d+/, 'step'));

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
  const buildErr = buildPreviews();               // generate previews (gitignored) before pairing
  const pairing = checkFilePairing(buildErr);
  const links = checkLinkTargets();
  const courseRefs = await checkCourseRefs();
  const coursesCov = checkCoursesCoverage();

  const { server, port } = await startServer();
  const base = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch({ executablePath: findChromium() });

  const layout = [], heights = [], console_ = [], integrity = [], overflow = [];
  for (const name of animations) {
    process.stderr.write(`  … ${name}\r`);
    const f = await runAnimation(browser, base, name);
    layout.push(...f.layout); heights.push(...f.heights);
    console_.push(...f.console); integrity.push(...f.integrity);
    overflow.push(...f.overflow);
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
    ['no course refs',   N - failedAnims(courseRefs), N, courseRefs],
    ['no h-overflow',    N - failedAnims(overflow), N, overflow],
    ['courses coverage', coursesCov.length ? 0 : 1, 1, coursesCov],
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
    ['NO COURSE REFERENCES', courseRefs],
    ['NO HORIZONTAL OVERFLOW', overflow],
    ['COURSES COVERAGE', coursesCov],
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
