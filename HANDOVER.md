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
- **GitHub URLs and PowerShell → in code blocks** (copiable).
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

## WHAT'S DONE (3 animations, all merged to main + live)

1. **recursion-fib-levels** (ds A5) — recursion trace, `level`/`depth` node meta.
2. **lists-doubly-insert-order** (ds A10) — 4-line doubly-linked insertion; the
   pointer-arrow / record-node / `unlinked`-amber reference.
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

## WHERE WE STOPPED — `queues-count-vs-rear` (ds A2) DESIGNED, ready to build

Design is settled (see "THE A2 DESIGN" below). The build prompt has been written.

**This is NOT the cheap throughput test the previous handover claimed.** That
claim said A2 "introduces only ONE new capability." Wrong — it introduces **two**,
and the second one was missed because it is buried in `slates.md` and `HANDOFF.md`
rather than in the animation's own notes:

1. **The index-pointer primitive** — labeled `front`/`rear` markers over array
   cells (designed in AUTHORING.md, never built).
2. **The race driver** — two generators stepped in lockstep and merged into one
   view (documented in AUTHORING.md's execution-model table and panel-inventory
   §4, **never built**). `slates.md` gives A2 Mode **R**, the only R in the ds
   slate, and HANDOFF Phase 1 annotates it *"race driver used for a non-race
   compare."*

So A2 is the race driver's debut as much as the index pointer's. **Do not read a
slow or nitty first draft as a throughput failure** — it is a two-capability
build. The genuine throughput test is the animation AFTER this one (stacks, A3),
which inherits both and adds nothing.

Pattern worth noticing: **CALLSTACK, the index pointer, and the race driver were
all designed early and built late.** When picking the next animation, check
`slates.md`'s Mode column and HANDOFF's parenthetical notes before estimating —
the capability cost is recorded there, not in AUTHORING.md.

**Source docs (in this handover folder): `ds2.html` (A2 assignment) and
`queues.html` (the lecture).** A2 asks for a menu queue: ADD (to rear), DELETE
(from front), SHOW, COUNT, CLEAR — array-based, fixed size.

---

## THE A2 DESIGN (settled)

**The lecture is the gold and it IS the structure.** `queues.html` walks two
competing representations and their trade-offs — literally what `count-vs-rear`
means:
- **Rep A:** array + `front` index + **`count`**
- **Rep B:** array + `front` index + **`rear`** index
- Neven tells students: use whichever is easiest. The animation is about the
  CHOICE, and must not portray either as broken.

**Resolved design decisions** (the previous handover left four pending; the
`slates.md`/`HANDOFF.md` Mode-R instruction settled the first one, and the rest
followed):

1. **Side by side, as a race** — two generators, two code panels, two arrays, two
   state strips. This deliberately REVERSES the "no side-by-side" preference from
   A1: there the second panel showed one thing twice, here the comparison *is* the
   subject. Rep A stores no rear and displays none anywhere; Rep B stores a real
   one. Nothing is derived or faked.
2. **Full-vs-empty is the climax** — YES.
3. **Wraparound shown explicitly** — YES, twice (ADD wraps `rear`/`pos`; a later
   DELETE wraps `front`).
4. **Animate ADD + DELETE only**; SHOW/COUNT/CLEAR are trivial context, as in A1.

**The listings are line-aligned across BOTH reps**, so the differences read as
horizontal gaps: Rep B has blank lines where Rep A updates `count`. Rep B's
fullness test (line 2) and emptiness test (line 10) are the **identical
expression** — `next_ix(rear) = front` — which is the whole lesson sitting in the
code panel from step 0.

**Trace** = the lecture verbatim (`a b c`, MAX 4, ADD d, DELETE, ADD e), extended
to empty, then one final ADD:

| op | contents | A: front,count | B: front,rear |
|---|---|---|---|
| — | `a b c ·` | 0, 3 | 0, 2 |
| ADD d | `a b c d` | 0, 4 | 0, 3 |
| DELETE→a | `a̶ b c d` | 1, 3 | 1, 3 |
| ADD e | `e b c d` | 1, 4 | 1, **0** ← wrap |
| ADD f | *both refuse* | 1, 4 | 1, 0 |
| DELETE ×4 | all stale | 1, **0** | **1, 0** |
| ADD g | **A accepts** | 1, 1 | **B refuses** |

30 steps of perfect agreement, then `ADD g` hits an empty queue: A checks
`count = 0` and proceeds; B evaluates `next_ix(0) = 1 = front` and reports **"queue
is full."** The two arrays diverge on the final step — which is what justifies
having drawn two of them all along.

**Corrections to the previous handover's pedagogical notes:**
- The ambiguous condition is **`front == next_ix(rear)`, NOT `front == rear`.**
  `front == rear` means exactly ONE element, and it occurs mid-trace where B reads
  it correctly. Getting this wrong would have taught a false rule.
- **The rejected "shift everything down" is a NOTE, not steps.** The lecture shows
  it as a diagram and rejects it; the code never executes it, so animating it
  would be a phantom step. It attaches to the DELETE where front leaves index 0,
  in his words ("too expensive").

**Two conventions the build introduces:**
- **Idle racer** — Rep B yields `{idle: true}` on the 4th phase of every operation
  (it has no bookkeeping line), keeping its state with no line highlighted. Every
  operation is 4 aligned phases in both reps so the merge stays frame-for-frame.
- **`stale` cells keep their characters, greyed.** The lecture blanks a deleted
  cell; the program cannot. Blanking would imply the program can see emptiness by
  looking at the array — the exact misconception the animation exists to kill. A
  note says the greying is ours, not the program's.

**Panels (6):** codeA/queueA/stripA | codeB/queueB/stripB. **No CALLSTACK** (the
lesson is representation choice, not call structure; two stacks would be noise)
and **no STREAM** (the refusals are narrated). `next_ix` is shown but never
stepped into — stepping in would desynchronise the racers. The strips
(`[front][count][ch]` vs `[front][rear][ch]`) differ in exactly one box; that
contrast is the thesis at a glance.

**Six panels is the main layout risk** — verify at 1920×1080 and in a short
viewport.

---

## DOC CONFLICT FOUND, NOT YET RESOLVED

`AUTHORING.md` lists CELLS roles as `active, compared, ok, error, empty`.
`panel-inventory.md` §2 lists `active, compared, swapped, sorted, probe, empty,
stale`. **Neither is a superset**; one is stale documentation and which one can
only be settled by reading `engine/`. The A2 build prompt asks Claude Code to use
the real set and report which doc is wrong; the doc fix itself is a chat decision
(pending). Note this also means **`stale` was already a designed role** — it is
not new work.

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

- **AUTHORING.md consolidation pass — DO AFTER animation #2.** The doc is ~970
  lines, grown chronologically. Reorganize topically (Layout / Panels / Narration /
  Color & state / Course-specific / Pedagogical patterns), add a short "principles"
  preamble, split deferred items (THINK, loop controls, index pointer) into a
  separate "planned" doc so the active doc holds only rules in force now. Purpose:
  keep it absorbable so Claude Code applies rules faithfully (dilution is a real
  risk at this size — some rule-slips have already happened).
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
