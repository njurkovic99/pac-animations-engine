# PAC Animations Engine — Handover (continue in a new chat)

This document lets a fresh chat pick up exactly where we left off. Read this first,
then the four reference docs in the repo (AUTHORING.md, panel-inventory.md,
HANDOFF.md, slates.md). Everything below reflects state as of the merge of PR #8.

---

## WHO / WHAT

**Neven Jurkovic** (GitHub: `njurkovic99`), CS instructor at Palo Alto College, is
building a unified JavaScript educational-animation engine to replace ~25 old HTML
animations. It serves 5 courses: **bCpp / bJava** (beginning C++/Java), **aCpp /
aJava** (advanced C++/Java), and **ds** (data structures). ~91 animations planned.

- **Repo:** https://github.com/njurkovic99/pac-animations-engine (public)
- **Live (GitHub Pages, serves `main`):**
  `https://njurkovic99.github.io/pac-animations-engine/anim/<name>.html`
  (root URL 404s — no index.html — cosmetic, parked)
- Works on Windows, PowerShell, path `C:\Users\User\projects\pac-animations-engine`.
  Windows text scaling 125%. Default browser Firefox.
- Doing this partly for fun; **NO hard deadline** (courses worked fine before).
- On **Claude Max 5x**; usage is a non-issue (checked: ~3-5% of limits used).

---

## THE WORKING RELATIONSHIP — STANDING INSTRUCTIONS TO THE NEXT CHAT

**These are behavioral instructions, not just description. Follow them by default.**

- **Division of labor:** design/pedagogy decisions + all `.md` doc edits happen in
  the **chat** (with you). Code/rendering happens in **Claude Code** (web version,
  works on GitHub branches). The `.md` docs are the seam both read.

- **Neven cognitively offloads the process to you — hold the checklist for him.**
  This is the core of how to help him. Concretely, ALWAYS:
  - Give **every action as a numbered, in-order sequence**, first thing first. He
    executes literally top-to-bottom, so order is load-bearing.
  - Put **all PowerShell commands, GitHub URLs, and Claude Code prompts in code
    blocks** (copy-boxes) so he can one-click copy. Never make him hand-type a
    command or hunt for a URL in prose.
  - **Lead with the branch/checkout step, THEN the download/file step** — never the
    reverse (see friction below).
  - After a Claude Code task, **remind him of the full merge sequence** including
    the return-to-main he forgets: review → merge → `git checkout main` + `git pull`.
  - When he says "next step," give the complete next step spelled out — don't assume
    he remembers where things were. He may have taken a break; re-orient him.
  - When he asks "where were we / what's left," read the state (git log/status or
    this doc) and tell him precisely, so he never redoes or misses something.
  - Keep **useful reference URLs in copy-boxes** whenever relevant:
    - Repo: `https://github.com/njurkovic99/pac-animations-engine`
    - Pull requests: `https://github.com/njurkovic99/pac-animations-engine/pulls`
    - Pages settings: `https://github.com/njurkovic99/pac-animations-engine/settings/pages`
    - Live animation: `https://njurkovic99.github.io/pac-animations-engine/anim/<name>.html`

- **His review instinct is the highest-value thing** — he catches the exact word or
  visual that misleads a student ("lost", "takes", "face", "stitched", "graded
  artifact"). Your job: turn each catch into a durable AUTHORING.md rule so it
  scales and Claude Code applies it on first draft. When he flags a *category* (not
  just an instance), write the rule; when it's a one-off, note it for the next
  fix-up. Distinguish the two.

- **Tone:** collaborative, direct, willing to push back on design (he values honest
  disagreement — e.g. talk him out of over-engineering, toward measuring before
  building). He reasons well about architecture; engage as a peer, not a yes-man.
  He often reaches the right answer himself while thinking out loud — sharpen his
  half-formed instinct rather than substituting your own. Present real trade-offs
  with a clear recommendation, not just options.

### Formatting he wants from me (learned preferences)
- **Prompts for Claude Code → in a copy-box (code block)** so he can one-click copy.
- **GitHub URLs → markdown links (clickable)**, with the bare URL alongside only when
  he needs to copy rather than click. PowerShell stays a plain code block — it gets
  pasted into a terminal, not clicked.
- **Every git block is SELF-CONTAINED and begins with fetch + checkout**, branch
  name included, so it works whether he is on `main` or already on the branch
  (`checkout` on the current branch is a harmless no-op). This cost three separate
  rounds during A2: after a merge he correctly returns to `main`, then Claude Code
  pushes again and he pulls without switching back, sees "Already up to date," and
  concludes nothing was built. Do not hand him a bare `git pull`. Same principle as
  "checkout FIRST, download SECOND" — the copy-box carries the whole operation and
  never assumes where he is standing.
- **Steps numbered, first-thing-first ordering.** Critically:
  **checkout/branch FIRST, download/place file SECOND** — never lead with
  "download" because he'll drop the file in before switching branches (this caused
  repeated "committed to wrong branch" / "nothing to commit" confusion).
- When something is "always the same," offer it as a saved **"Instruction: do X"**
  he pastes into his own reference doc; then I refer to it by name.

### His saved reusable instructions (he keeps these in his own doc)
- **"cd first":** every PowerShell session starts `cd ~\projects\pac-animations-engine`
- **"pull a branch to view it":** `git fetch` → `git checkout BRANCH` → `git pull` →
  double-click the `preview-*.html`. (fetch FIRST or checkout fails on an unknown
  branch — this bit us; always fetch first.)
- **"merge a PR"** (browser): repo → Pull requests → the PR → Merge → Confirm
- **"sync main after a merge":** `git checkout main` → `git pull` (the LAST step of
  every merge — he repeatedly forgot this; it leaves him stranded on a branch)
- **"push doc changes":** `git status` (READ the "On branch" line!) → `git add .` →
  `git commit -m "..."` → `git push`
- **"move downloaded files into the repo" (PowerShell, replaces drag-and-drop):**
  one `move` with `-Force` overwrites silently — no Windows "Replace" prompt, and
  no risk of dropping a file into `anim\` or `content\` by mistake. Always
  followed by `git status` as the did-it-land check:
  ```
  cd ~\projects\pac-animations-engine
  move ~\Downloads\FILE1.md,~\Downloads\FILE2.md . -Force
  git status
  ```
  "nothing to commit, working tree clean" after this means the files did NOT
  land. Give him this form, not "drag the files in."

### Recurring friction (and the fix)
- The one persistent blind spot: **which branch he's on.** After reviewing a Claude
  Code branch he stays on it, then commits docs there instead of main. Fix he's
  adopting: **`git status` and READ the top "On branch" line before every commit**,
  and **return to main as the last step of every merge.**
- "nothing to commit, working tree clean" almost always means he hasn't physically
  dragged the downloaded file from Downloads into the repo folder yet (must
  overwrite — Windows "Replace" prompt is the signal it worked).
- When Git says something surprising, the definitive truth-check is
  `git status` + `git log --oneline -5` + `git grep -l "TERM" file` — read reality
  instead of guessing.

---

## ENGINE ARCHITECTURE (see panel-inventory.md for full detail)

**Renderers:** CODE (listings; tabs = languages for ds, source-files for the 4
programming courses), CELLS (arrays/grids), NODES (trees/lists/graphs/UML — one
renderer, params for layout/template/edges; `record` template = [prev|value|next]
with per-field anchors), STREAM (console I/O), CHART (series over n), **CALLSTACK**
(debugger call frames — built this session). Plus a cross-panel **arrow overlay**
(live-DOM anchor resolution).

- Steps are **full snapshots, not deltas** (Back is free).
- Content files are **pure data** (no HTML/CSS). ~15 CSS design tokens.
- **WATCH-only** — all interactivity/THINK/predict stripped. Insights delivered as
  narration + notes, never questions/gates. THINK fully deferred (see HANDOFF.md).

---

## WHAT'S DONE (5 animations, all merged to main + live)

1. **recursion-fib-levels** (ds A5) — recursion trace, `level`/`depth` node meta.
2. **lists-doubly-insert-order** (ds A10) — 4-line doubly-linked insertion; the
   pointer-arrow / record-node / `unlinked`-amber reference.
4. **queues-count-vs-rear** (ds A2) — array queue, `front` + `rear`, `-1` sentinel,
   built from empty. Debuts the **index-pointer primitive**; established the
   **CELLS rendering contract** and the **master layout invariant**. Renamed the
   CALLSTACK panel to **"Function calls"** (student-visible only) so it can't be
   confused with the actual stack in A3/A4.
5. **stacks-paren-scanner** (ds A3) — array stack + scanner, three expressions each
   isolating one error, ending on the post-loop check the lecture leaves as an open
   question. Added the **vertical CELLS mode** (column, [0] at bottom, markers left).
   Forced the engine's **layout rebuild**: one height resolver, one width resolver,
   sizing policy as a data table, `pac.verifyHeights()`.
4. **queues-count-vs-rear** (ds A2) — array queue, `front` + `rear`, `-1` sentinel,
   built from empty. Debuts the **index-pointer primitive**; established the
   **CELLS rendering contract** and the **master layout invariant**. Renamed the
   CALLSTACK panel to **"Function calls"** (student-visible only).
3. **lists-array-insert-delete** (ds A1) — THE big one. Array-based list menu
   (ADD/INSERT/DELETE, invalid-insert-at-7, badINSERT smear). It BUILT and proved,
   as reusable capabilities the whole project now inherits:
   - **CALLSTACK panel** (main→ADD→INSERT frames; parameter binding visible)
   - **Caller-line dimming** (whole caller chain dimmed while inside a function)
   - **Memory-danger ⚠ marker's first real firing** (badINSERT front-first shift
     smears one value across the tail — genuine overwrite corruption)
   - **Bounded-stage layout system** (stage max-height ~15 code lines, every panel
     scrolls internally, controls+note pinned, page never reflows)
   - **Open-in-own-window link** (iframe-aware: prominent amber `--warn` link when
     embedded in Canvas, minimal when standalone — the Canvas-fit escape hatch)
   - Surfaced + banked (NOT built): the **index-pointer primitive** and the
     **confusion-first pedagogical pattern**.

**Canvas embedding is SOLVED** end-to-end: bounded layout (fits reasonably) +
pinned note (never lost) + full-window escape-hatch link (covers the cramped case).
Embed code (HTML editor in Canvas), height is the main tuning knob:
```html
<iframe src="https://njurkovic99.github.io/pac-animations-engine/anim/lists-array-insert-delete.html"
        width="100%" height="1050" style="border:none; display:block;"></iframe>
```
Hidden assignment marker (instructor-only, engine ignores it, emit machinery
deferred): append `?a=ds-a1` to the src.

---

## WHERE WE STOPPED — A3 SHIPPED. NEXT UP: `stacks-postfix-eval` (ds A4)

**5 animations** built, reviewed, merged, live. `stacks-paren-scanner` (ds A3) came
with a substantial engine rebuild — see "WHAT A3 COST" below before estimating A4.

**A4 is now the throughput test.** A3 was supposed to be, and wasn't: it added a
vertical CELLS mode and then exposed that the layout rules were written from one
animation's needs and applied where they didn't fit. A4 inherits a settled engine and
should be genuinely cheap. If it isn't, the resolvers didn't hold.

**Source docs for A4: `stacks.htm` (the lecture — Application 2, evaluating a postfix
expression) and `ds4.html` (the assignment, not yet seen).** The lecture already walks
`12+34-*` through a stack in a table, and gives the algorithm in three lines: push
values, on an operator pop two and push the result, one value left at the end. It also
flags the character-vs-ASCII trap and the switch-on-operator point. Infix→postfix
conversion is explicitly NOT part of the project (extra credit), so the animation
should not spend steps on it.

---

## WHAT A3 COST, AND WHY (read before estimating A4)

Roughly 44 review items. Almost none were about the animation. The content needed one
design pass and two changes (drop the push/pop demo, drop `{ }`). Everything else was
**one bug wearing different clothes**, and the shape is worth remembering:

- **"Size to content" was implemented in four separate places** — stage, structure
  region, callstack+stream, code — which had drifted independently. Fixing one branch
  left the others, so the same defect reappeared from a different direction ~30 times.
  Centralising it into one resolver with the clamps as a **data table** ended it in a
  single pass.
- **`flex: 1` was the default on panel bodies**, so every panel stretched, and
  `flex: none` was being applied one panel at a time as each was noticed.
- **Floors with no ceilings swallow slack** — discovered separately for height (a
  9-line listing padded to 15 rows) and width (a 50-character listing in a 1200px
  panel).
- **Rules stated for one animation don't generalise.** "Code left, everything right"
  was never a rule; it was a shape copied through three build prompts that happened to
  balance until it didn't.

Two of my own reports were wrong and cost rounds: I read a *scrollable* call tree as
clipped content, and a *legitimately shorter* column as a misalignment (three times).
`pac.verifyHeights()` now exists precisely so that question is one command instead of
an investigation — **run it before questioning any panel's size.**

The lesson for planning: the expensive part was never pedagogy or trace design, both
of which went in one pass. It was unstated layout invariants that Claude Code had to
guess at, differently each time.

---

## (superseded) A2 notes — kept for the design record

`queues-count-vs-rear` is built, reviewed, merged and live. That makes **4
animations** done. The four reference docs are current as of this handover.

**Next: `stacks-paren-scanner` (ds A3), then `stacks-postfix-eval` (A4).**
These are the honest throughput test — A2 turned out to be a two-capability build
(see below), so nothing before now has measured what a pure-inherit animation
costs. A3 inherits everything and should add nothing new.

---

## WHAT A2 COST, AND WHY (read before estimating A3)

The previous handover called A2 "the throughput test — inherits everything, adds
ONE new capability." That was wrong twice over, and both errors are worth keeping.

**Error 1: it was two capabilities, not one.** The index pointer AND the race
driver, the latter buried in `slates.md`'s Mode column (A2 is the only **R** in the
ds slate) and a HANDOFF parenthetical. Neither doc said "unbuilt" — AUTHORING
describes unbuilt capabilities in the present tense, which is what made the build
look cheap. **HANDOFF.md now carries a designed-vs-built capability table**; check
it before estimating anything.

**Error 2: the race was designed, built, and then thrown away.** Two
representations side by side left no room for a `main()` driver or the call-frames
panel, so the student could see state changing but not what was changing it. Neven
caught it on first render. The fix was to drop to ONE representation (front + rear)
with a `main()` driver, exactly like A1 — and the single version teaches the
trade-off better than the race did. The race driver is merged and working but has
**no user in the repo**; its first will be `sorting-race-statements` (Phase 2).

**Then ~7 rounds of layout defects**, every one caught by Neven in review, every
one the same underlying bug: *something sized itself to the current step's content*.
Anonymous markers, collapsed empty cells, a jumping marker lane, panels that grew
when output appeared, a code panel pinned so rigidly it left a dead gap. These are
now **one rule** in AUTHORING (the "master invariant" — every dimension resolves
once, then never changes) plus a **CELLS rendering contract**. All renderer-level,
so A3 inherits the lot.

**The lesson for planning:** the expensive part was never the pedagogy or the
trace design — those went in one pass each. It was layout invariants that no doc
had stated, so Claude Code had to guess, and guessed differently each time. If A3
also takes 7 rounds of layout nits, the rules did not take and the docs need
another pass, not the process.

---

## WHAT A2 ENDED UP BEING (for reference)

Single representation: array + `front` + `rear`, no count. MAX 4, characters,
`ch` for the removed element, `next_ix()` as the wrap helper — all the lecture's
own names. Builds from an **empty queue with `-1` as the empty sentinel**;
`main()` drives ADD/DELETE calls with the "Function calls" panel showing frames and
parameter binding. 59 steps.

**The payoff:** on the last DELETE, `front` and `rear` reset to `-1`. Without that
reset they would read `1` and `0` — which is what they read when the queue was
FULL. The note asks the student to click Back and compare. `front` and `rear` alone
cannot distinguish empty from full; the sentinel is the extra bit of information,
and it costs a branch in ADD and a branch in DELETE. A `count` needs neither. That
resolves the open question the lecture leaves hanging, in his own framing, without
portraying either representation as wrong.

Two pedagogical corrections made along the way, both worth not re-deriving:
- The ambiguous condition is **`front == next_ix(rear)`, NOT `front == rear`.**
  `front == rear` means exactly ONE element and occurs mid-trace, read correctly.
- **The rejected "shift everything down" is a NOTE, not steps.** The lecture shows
  it as a diagram and rejects it; the code never executes it, so animating it would
  be a phantom step.

---

## THE INDEX-POINTER PRIMITIVE (designed, recorded, debuts on the queue)

A labeled pointer that points at an array cell and moves as its index changes.
**When it applies:** raw array + loop counter → NO (not novel, just a `for` index);
array-BASED structure + semantic index → YES (the index defines the structure).
Queue `front`/`rear` are semantic and ARE the lesson → this is its debut. Full rule
in AUTHORING.md ("Planned primitive — the index pointer").

In A2 it appears on both arrays: Rep A carries only a `front` marker (it stores no
rear), Rep B carries `front` and `rear`. **Two markers must render side by side on
one cell** — this happens in Rep B when `front` and `rear` both sit on cell 0.
There is no "derived" marker style: a marker means a stored variable.

---

## BANKED / SCHEDULED (don't do now)

- **AUTHORING.md consolidation pass — DONE.** Reorganised topically into 8 parts
  (content file / panels / steps & notes / narration / layout, color & state /
  pedagogical patterns / course-specific / bugs-fixed-once), with a nine-line
  principles preamble at the top. 1137 → 863 lines. Deferred material split into a
  new **`PLANNED.md`** (THINK, loop controls, go-to-line's rejection, CALLSTACK
  extensions, the Python tab, `?a=` emit machinery, the root index), so the active
  doc contains only rules in force. Three real contradictions were resolved in the
  process: a "Predict gates" section that flatly contradicted "WATCH only"; a code
  panel documented as both "12–15 lines" and "15 is a floor"; and an index-pointer
  section that ended with "deferred — do not build it" after being marked BUILT.
  One conflict is flagged but NOT resolved: the CELLS role list differs between
  AUTHORING and panel-inventory, and only `engine/` can settle it.
- **Root 404 / instructor-index page** — cosmetic, parked. A simple index.html at
  repo root listing all animations would fix it and give an instructor directory.
- **THINK mode** — fully deferred (rationale + known bug in HANDOFF.md).
- **Loop controls** ("step out"/"run to end" as jump-to-marked-step; NO clickable
  go-to-line) — deferred until the first loop animation. Rule in AUTHORING.md.
- **`?a=` emit/read machinery** and courses.json wiring — deferred.

---

## BUILD ORDER (efficiency, not temporal — full detail in HANDOFF.md + slates.md)

Phase 1 = ds core (proves every renderer). We're in it. Next: `queues-count-vs-rear`
(A2 — index pointer + race driver, two new capabilities), then stacks (A3/A4,
which inherit both and are the real throughput test), etc. Phase 2 = high-share animations (serve 2-3 courses).
Phases 3-5 = per-course singles; aCpp last (already live). ~91 total.

---

## PEDAGOGICAL / STYLE RULES DISTILLED (all in AUTHORING.md — the spirit)

- **Steps are executions.** Every Next-click = one real highlighted line. Step 0 =
  required initial state (nothing executed; a held-but-unlinked node shows its
  owning pointer — allocated, not void). No mid-sequence phantom comment-steps.
- **Notes** (amber box) carry all commentary; attach to a step, appear when reached,
  collapse otherwise. Confusion-first pattern: name the student's confusion as a
  question, show the intuitive-wrong way fail, answer in a payoff note.
- **All visible text is student-facing only** — no assignment IDs, no "graded
  artifact", no raw tag names, no spoiler subtitles. Backstage stays backstage.
- **Narration: precise CS over casual.** Pointers point/aim/are-followed (never
  "takes"/"held"/"face"/"stitched"). "unreachable" not "lost". Language-aware:
  ds pointer→"points to"/(C++), reference→"refers to"/(Java). "step" reserved for
  the execution unit (use "spaces"/"line"/"level" elsewhere).
- **Color channels (independent):** outline = membership (green member / amber
  `unlinked`); fill = activity (blue = modified this step). They coexist.
- **Memory-danger ⚠** (red) only for real memory-integrity violations (leak,
  corruption, bad access) — NOT logic errors. A held-but-unlinked node is healthy.
- **Layout:** bounded stage, panels scroll internally, controls+note pinned, page
  never reflows. Node boxes fit content. Metrics counter hidden by default.
- **Naming:** one identifier per thing, matching the code panel (code says `ins` →
  narration says `ins`, never `ins_pt`).

---

## FILES IN THIS HANDOVER FOLDER
- `HANDOVER.md` (this file)
- `AUTHORING.md`, `panel-inventory.md`, `HANDOFF.md`, `slates.md` (the 4 reference
  docs — current)
- `ds2.html`, `queues.html` (A2 source for the next build)
- `content/` and `anim/` for the 3 built animations (reference implementations)

To resume: paste HANDOVER.md into a new chat, attach AUTHORING.md + panel-inventory.md
+ ds2.html + queues.html, and say "continue — let's design queues-count-vs-rear."
