# Authoring a pac-animation

Read this before writing a content file. It holds **only rules in force now** —
anything deferred lives in `PLANNED.md`, so nothing here needs filtering through
"is this actually built yet?"

Companion docs: `PANEL-INVENTORY.md` (why the engine is shaped this way),
`SLATES.md` (what to build), `HANDOFF.md` (build order, plus a designed-vs-built
capability table — **check it before estimating any animation**), `PLANNED.md`
(deferred capabilities, recorded in advance so they land consistently).

---

## Principles

Nine sentences. Everything below is an application of one of them.

1. **A step is an execution.** One Next-click = one real line running. Commentary
   is never a step.
2. **Steps are snapshots, not deltas.** That is what makes Back free.
3. **Content files are pure data.** No HTML, no CSS, no colors, no DOM.
4. **Nothing on screen may move because a step advanced.** Every dimension
   resolves once and holds.
5. **WATCH only.** No questions, no gates, no branches. Insight arrives as
   narration and notes.
6. **Precision over comfort in every word.** These animations teach mechanism; a
   smooth verb that blurs the mechanism teaches the wrong model.
7. **One name per thing**, matching the code panel exactly.
8. **Backstage stays backstage.** No assignment IDs, no tag names, no spoilers in
   student-visible text.
9. **The instructor's framing is the source.** Echo his words; don't paraphrase
   them into something blander.

---
---

# PART 1 — THE CONTENT FILE

## Shape

```js
export default {
  title, subtitle,
  profile: 'beginner' | 'standard',
  columns: 2,
  languages: ['pseudo', 'java', 'cpp'],   // order = tab order; first is default
  panels: [ {type, id, title, ...panelOpts} ],
  traces: { correct: function*(){...} },
  hideTags: ['call'],                     // tags counted but not displayed
}
```

Nothing else. If a content file contains a `<div>`, it is wrong — that is exactly
the mistake `oop5.html` (183 embedded markup fragments) and `oop4.html` (128)
made, and it is why those animations could never be generalised.

## Steps are snapshots

Each `yield` returns the **complete state of every panel**, not a delta:

```js
yield {
  tag: 'swap',                    // counted; never increment a counter by hand
  line: {pseudo: 6, java: 7, cpp: 7},
  narrate: 'The n-2 branch is evaluated first.',
  note: 'Optional commentary — see Part 3.',
  panels: {
    tree: { layout: 'tree', nodes: [...] },
    out:  { lines: [...] },
    inv:  { render: 'row', cells: [...] },
  },
  arrows: [ {from: 'vars.p', to: 'tree.node3', style: 'pointer'} ],
}
```

Why: `render(step)` is idempotent, so **Back** is `render(steps[i-1])`. No undo
stack, no replay. Copy state on yield; at these sizes it costs nothing.

None of the original 25 files had a Back button. A beginner who missed a step had
to restart.

## Generators, not step arrays

A generator that yields literals *is* a step array. So one driver handles all
three execution models found in the original files:

| model | how |
|---|---|
| precomputed | generator yields hardcoded snapshots |
| live | generator yields as it computes |
| race | `traces.x = { racers: {a, b}, merge(frame, i) }` — *n* generators, `.next()` in lockstep |

**Race is built but currently has NO USER.** It was built for
`queues-count-vs-rear`, which then dropped to a single representation, so the
driver is merged and working but nothing exercises it. First real user:
`sorting-race-statements` (Phase 2). Treat it as untested in production. Rules in
Part 6.

`racebubsel.html` hand-rolled a resumable state machine (`bState`, `bI`, `bJ`, a
switch) to do what `function*` does natively. Do not do that again.

## Tags, not counters

Every step may carry `tag`. The engine counts tags and displays totals. To add a
"comparisons" readout in year three, touch no algorithm.

`racebubsel` maintained `bStatements`, `bSwaps`, `sStatements`, `sSwaps` by hand,
with `bSwaps++` buried in a branch — every mutation site a bookkeeping obligation.

Note the pedagogy: race on **statements** (total work), display **swaps** alongside
(where bubble and selection diverge). Both are right. Tags make it a non-choice.

## Files, naming, preview

`<domain>-<what-you-see>.html`, lowercase, hyphens. No course code, no chapter
number, no ordinal, no language suffix. Twelve animations serve two courses;
`courses.json` says which, and in what order.

Renamed a file? Leave a `<meta http-equiv="refresh">` stub at the old name —
twenty-three Canvas wiki pages iframe the old filenames.

Browsers block ES modules over `file://`:

```
python3 -m http.server        # then open /anim/<name>.html
node build-preview.mjs <name> # or bundle to a single double-clickable file
```

## Profiles

`beginner` (bCpp, bJava) hides memory addresses and **caps panels at 3 — enforced
in the engine, not left to authorial restraint**. `standard` (aCpp, aJava, ds) does
not.

---
---

# PART 2 — PANELS

Six renderers plus CALLSTACK. If you want an eighth, check first whether it is one
of these with a different template — eleven things named separately during design
turned out to be NODES.

## CODE

`{listings: {...}, labels}`. Step gives `line`, a number or a per-language object.

**Tabs mean different things by course:**

- **ds** — the course is language-agnostic. Tabs = **language variants**:
  pseudocode / Java / C++.
- **bCpp, bJava, aCpp, aJava** — each course is a SINGLE language. **No language
  toggle.** Tabs are reserved for **multiple source files** in one program
  (`main.cpp` / `Student.h` / `Student.cpp`). A single-file program has no tabs.

The content file declares which by what it puts in the listings map (language keys
for ds, filename keys for the programming courses).

Each trace normally addresses **its own** listing's line numbers, so listings need
not stay line-aligned — *except* in race mode, where aligning them to each other is
the point (Part 6).

## CELLS

`{render: 'box'|'bar'|'row', cells: [{value, label, role, anchor}]}`.

Roles, grouped by meaning:

| Group | Roles |
|---|---|
| membership | `member`, `stale`, `empty` |
| this-step activity | `active`, `compared`, `swapped`, `probe` |
| outcome | `sorted`, `ok`, `error` |

> **Open item:** `AUTHORING.md` and `PANEL-INVENTORY.md` historically listed two
> different, non-overlapping role sets. The table above is the union as understood
> after `queues-count-vs-rear`. Verify against `engine/` and correct both docs. Do
> not add a role without checking whether an existing one already means it.

Serves arrays, sorting bars, hash buckets, matrices, memory blocks, variable
tables, stack frames, vtables. Full rendering rules in Part 5.

## NODES

`{layout: 'tree'|'linear'|'graph', template: 'plain'|'record', nodes: [{id, parent,
label, meta[], state, slot, row}], edges?}`.

States: `pending`, `entering`, `active`, `exited`, `unlinked`. Snapshots include
not-yet-visited nodes as `pending`, so layout is computed over the whole structure
and nodes never jump.

`template: 'record'` draws `[ prev | value | next ]` and **publishes an anchor per
field** (`list.n25.prev`, `list.n25.next`, `list.n25`) — that is what lets pointer
links be arrows rather than edges. In `linear` layout, `slot` and `row` place a node
off the main row (a freshly allocated node not yet in the list).

Serves linked lists, BSTs, heaps-as-trees, recursion trees, class hierarchies,
object graphs, GC reachability, UML, flowcharts, adjacency lists.

**Node sizing — fit content, never clip.** A node box sizes to fit its label plus
any `meta` lines (`level 3` / `depth 2`). Either the box grows or the meta text is
constrained, but nothing overflows or gets cut off. All templates.

## STREAM

`{lines: [{text, dir: 'in'|'out', indent}], cursor}`. `dir: 'in'` renders a prompt,
a visible pause, an echoed value. Every CS1 assignment from A2 onward is
prompt-driven and **no original file modelled input at all**.

## CHART

`{series: [{name, color, points}], xLabel, yLabel, marker}`. Required, not optional:
`ds7` grades a plot of execution time vs. n.

## PEGS

`{pegs: [{label, role, disks: [rank, …]}], active: {peg, rank}}`. Pegs, each holding
an **ordered list of items** drawn bottom-to-top; a rank is a positive number and a
larger rank draws a **wider slab**, so a larger item resting on a smaller one is
impossible to miss. Built for Towers of Hanoi (`recursion-hanoi`), but the renderer
knows nothing about Hanoi's legality rule — it only draws pegs and their ordered
items, so it serves any "ordered piles on posts" structure.

- `role` is a free caption under the peg's label (`source` / `dest` / `spare`). It
  updates per step as the running call rebinds the pegs — the **argument exchange**
  made visible, alongside the same binding in the CALLSTACK.
- `active: {peg, rank}` names the one item placed **this step**; it takes the blue
  activity FILL, the same "acted on now" channel as nodes/cells.
- A **STRUCTURE** panel (kind `structure`, like NODES/CHART): natural pixel size,
  never horizontally scrolled. Every dimension — peg count, largest rank, tallest a
  stack ever gets — resolves ONCE over the whole trace and holds, so nothing resizes
  as items move. A peg holding fewer items than the reserved capacity is just
  shorter; its post and base do not move. No SIZE_POLICY row of its own: it uses the
  shared `structure` class.

Serves the Towers of Hanoi (three disks in `recursion-hanoi`), and any future
stack-of-ranked-items-on-posts structure.

## CALLSTACK

**Student-visible title: "Function calls."** Never "call stack" on screen — the ds
course animates an actual stack (A3, A4), and a panel labelled "call stack" beside
it invites exactly the confusion those animations exist to prevent. Internal name
stays CALLSTACK.

When an animation steps *into* a function, the student must see what it was called
with. Definitions alone (`INSERT(index, value)`) don't reveal the bound values on
this call — that's a comprehension hole.

**Model (debugger-faithful):**

- A vertical stack of **frames**, newest on top and emphasized; caller frames below
  greyed but visible. `main` is the bottom frame — the driver.
- Each frame shows the **function name**, its **bound parameters** with values, and
  its **active locals**.
- **Push on call**, already showing bound argument values — `ADD` calling
  `INSERT(count, value)` pushes an INSERT frame showing `index = 3` and
  `value = 40`. This is how the ADD-is-INSERT lesson becomes visible.
- **Pop on return.**
- A local that finishes (loop `i` after the loop) **stays greyed** in the frame
  until the function returns — it doesn't vanish mid-frame.
- The **active local** gets the blue activity fill on the step it changes.

**Author it whenever an animation steps into a function.** Show `main` as the driver
so calls have a visible origin. It is *the whole point* of several beginner-course
animations (functions-call-return, value-vs-reference, recursion).

The step's `line` highlight and the CALLSTACK stay in sync: when the highlight
enters a function body, that function's frame is the active one.

## Arrows (cross-panel overlay)

A pointer lives in CELLS; the node it points at lives in NODES. Renderers publish
named anchors; the overlay resolves them against live DOM boxes at draw time.

```js
arrows: [ {from: 'vars.p', to: 'tree.c3', style: 'pointer'|'stale', bend: 'up'|'down'} ]
```

The overlay picks which edge of each box to leave from and enter, based on geometry.
`bend: 'down'` bows an arrow below the row, so backward `prev` pointers never
overlap forward `next` pointers. A pointer referencing its own node renders as a
loop — not decoration: it is the failure mode of a doubly-linked insertion done in
the wrong order.

`cpoint1.html` faked this with four hand-tuned Bézier curves and colliding
`arrowhead2` marker ids. Change a font size and the arrows pointed at nothing.

**Arrows are cross-panel by design — so the layout keeps their endpoints ADJACENT.**
An arrow runs from a box in one panel to a box in another, and the overlay draws it
against live DOM; but the overlay has no say in *where* the panels sit. If two panels
wired together end up with a third between them, the arrow has to cross that third
panel — which reads as a mistake, because it is one. **A panel that is not an arrow
endpoint never sits between two that are.** The rule is enforced in the placement
pass, not left to declaration order: the arrow set is known from the trace before
layout resolves, so the panels it references form a group kept contiguous — the
arrow-endpoint book panels are ordered directly under the structure region (itself
usually an endpoint), non-endpoints after, and the column-split search is floored so
no non-endpoint book panel can fall between the region and an endpoint. Where the
height balancer would otherwise separate them, it takes the next-best split; a
slightly taller stage is a fair price for arrows that never cross unrelated content.
Still **declare arrow-connected panels adjacent** in reading order (the list, then its
pointer strip, *then* an unrelated panel) so the content reads the way it lays out.
This surfaced on `lists-insert-alpha`, whose Function calls panel sat between the list
and its pointer strip until the rule moved it after them.

---
---

# PART 3 — STEPS AND NOTES

## WATCH only — no gates, no questions

Every animation is a passive step-through. **Do not author predict gates, questions,
options, `branch` traces, or any interactive stopping point.** There is no `?mode=`
parameter, and a content file has exactly one trace. Interactive "THINK" mode is
deferred in full — see `PLANNED.md`.

**Teaching a common mistake, WATCH-style:** narration on a normal step, not a
question. State the mistake, then let the correct execution proceed. Example (fib
levels): "A common error is `fib(n-2, level+1)` — but n + level must stay constant,
so it must be `level+2`," after which the animation continues correctly. The insight
is delivered; nothing stops or branches.

The hidden assignment marker `?a=` is ignored by the animation entirely — it exists
only for the instructor. Animations read no URL parameters at all.

## The core separation

- **Step 0 is the initial state, and it is REQUIRED.** Every animation opens on a
  step where **nothing has executed yet**. No line highlighted. Show the true
  starting state, including pointers that *already* hold things — a node about to be
  inserted is allocated and **held by its owning pointer**, with its own links still
  null and no linking arrows drawn yet. The owning pointer is part of the initial
  state (the node is allocated, not floating in the void); the links the algorithm
  will create are not. This is the "before" picture. Never open mid-execution.
- **A step is an execution.** After step 0, every Next-click advances one real
  executing line, with that line highlighted.
- **No mid-sequence phantom steps.** A step *between* executions whose only job is
  commentary is banned. A step with no highlighted line is legitimate ONLY as
  step 0. Anywhere else, that content is a note.
- **A note is commentary.** Setup framing, a common-mistake warning, the post-watch
  challenge, a danger observation — none are execution, none are steps.

## Line highlighting = the line about to execute

The code panel highlights **the line about to execute**, not the one just executed —
a debugger's instruction pointer. The highlight sits on the line while the narration
explains what it will do; the next step advances both line and state.

Put `line` at the **top level of the step object**, never inside `panels`:

```js
yield { line: 4, tag: 'assign', narrate: '...', panels: { list: {...} } };
```

`line` may be a number or `{pseudo, java, cpp}`. Steps with no executing line set
`line: null`.

### Active line vs. parked caller lines

When execution steps into a function, the line that *called* it must stay marked, so
the student always sees where control will return. A real debugger drops the caller
out of view; this tool keeps it, because "a function is a detour you return from" is
exactly what beginners miss.

- **Active line** — executing now. Bright blue highlight.
- **Parked caller line(s)** — the call site in each caller still on the stack.
  **Dimmed**, using the same greyed treatment CALLSTACK uses for caller frames.

**Dim the whole caller chain.** If main called ADD which called INSERT, then inside
INSERT *both* parked lines are dimmed. The code panel mirrors the CALLSTACK exactly.

**One visual language across both panels: bright = running now, dim = suspended.**
Same token, not a new color. On return, a frame pops, its line's dim clears, and the
caller becomes bright again.

## Step granularity — one meaningful change per step

The student clicks Next to see *one* thing happen.

- **One pointer rewire per step.** A `next`/`prev` reassignment, a `head` update, a
  link being broken — each is its own step, and the narration dwells on it. Pointer
  changes are the pedagogically dense moments. The four-line insertion in
  `lists-doubly-insert-order` is the model: one assignment, one step, one arrow
  moving.
- Grouping is fine only for genuinely simultaneous, uninteresting updates
  (initializing several counters to 0). Anything a student could get wrong gets its
  own step.
- **Prefer more small steps over fewer dense ones.** Twenty gentle clicks beat eight
  crowded ones.

## Notes

**Behavior:**

- A note **attaches to a specific step** — appears on arrival, disappears on
  leaving. Transient, not persistent.
- On steps with no note the box is **empty and invisible** (no border, background,
  or label) but **keeps its reserved height**, so a note appearing never shifts the
  controls (Part 5).
- An animation may have several notes across its run.

**Authoring:** a `note` field on the step. Plain string, or an array of segments so
it can carry a memory-danger segment.

```js
yield {
  line: 2, tag: 'assign',
  narrate: "ins.prev = temp.prev — ins.prev now points where temp.prev points, to 12.",
  note: "A common mistake is running temp.prev = ins first. Then ins.prev = " +
        "temp.prev copies a pointer that already points back at ins, so ins.prev " +
        "becomes ins itself, and line 4 dereferences a pointer that was never set.",
  panels: { ... }
};
```

**Note vs. narration:** if commentary is about the *statement executing*, it's
narration (the bar — what THIS line does, right now, one or two sentences, present
tense). If it's about the *algorithm, a pitfall, or a what-if*, it's a note (the
box).

## Links between animations

A note may carry a link to another animation, appearing only while that note shows:

```js
note: [
  "…challenge text…",
  { href: 'sorting-heapsort-dual.html',
    text: 'See how the values actually get sorted' }
]
```

A link segment is a **flat `{ href, text }`** — that is the canonical form, and all
seven note-links in the repo use it. Author it flat. As a safety net the engine's
`renderSegments` **also** accepts the nested `{ link: { href, text } }` shape (an
early version of this very doc showed it, and it silently rendered nothing for a
release), so a mis-shaped link can never vanish without a trace again. A segment that
is none of a string, `{ danger, text }`, a link in either shape, or `{ text }` is
**warned to the console** rather than dropped.

- **Opens in a new tab** (`target="_blank"`, `rel="noopener"`). Required, not
  optional: these are usually embedded in a Canvas iframe, and a plain link would load
  a full animation inside a small box with no way back.
- **Relative href**, so it works identically on GitHub Pages, in an iframe, and in a
  local preview. Never hardcode the Pages URL.
- The bundled preview builder must handle a target that is not alongside it — point at
  the live URL or render the link inert. Never emit a link that 404s.

**Each link is a pedagogical decision, not a cross-reference.** Add one where an
animation's own note raises a question that another animation answers, and put it at
the END of that note so the student meets the question first. A link at step 0 is for
a prerequisite the student may not have seen (heapsort-dual points back at heapify,
since it opens on a heap someone else built).

The sorting chain is the model: quicksort-partition asks what happens on sorted data →
worstcase; worstcase says the fix is a sort that cannot degenerate → heapify; heapify
asks how the heap gets used → heapsort-dual; and heapsort-dual points back to heapify.
Four animations, one lesson, each seam answering a question already posed.

## The post-watch challenge

An animation may end with a **challenge**: a "what if" posed to the student who
wants to go deeper, with no answer and no interaction. It is a note on the final
step — not a step, not a gate. The student who ignores it has still watched the
whole animation; the student who engages gets a reward.

Phrase it as a "what if" tied to what they just watched:

- (doubly-linked insertion) "What would have happened if line 4 ran before line 2?"
- (queue) "What would the full test become if you gave up one cell?"
- (linked list) "What breaks if we don't keep a `tail` pointer?"

**A challenge must ask something the animation did NOT resolve.** The older queue
example — "what if we tracked `rear` instead of `count`?" — stopped being a
challenge the moment `queues-count-vs-rear` answered it on screen.

Use one wherever the animation has an obvious "what if you did it differently,"
which is most of the misconception-targeted ones. Skip it where nothing interesting
branches.

---
---

# PART 4 — NARRATION AND LANGUAGE

## Precise CS language, not casual paraphrase

**Prefer the precise technical formulation over the comfortable informal one,
whenever a precise one exists.** These animations teach mechanism; a casual verb
that reads smoothly but blurs *what actually happens* teaches the wrong mental
model. Ask: "does this name the exact operation, or just gesture at it?"

- "points to" / "is the same as" / "is assigned" / "→" — not "faces", "grabs",
  "hooks up", "takes", "stitched"
- "is copied" / "references the same object" — not "becomes", "turns into", where a
  copy or alias is what actually occurs
- "is unreachable" / "no pointer refers to it" — not "is lost", which wrongly
  implies an error
- name concrete on-screen values ("which is 12") rather than abstractions
- present tense, one idea per line

Informal phrasing is fine ONLY when no precision is sacrificed — "the loop runs
three times" blurs nothing. The rule is not "sound formal"; it is **never trade
precision for readability.** When both are available, precise wins; when a precise
term would be needlessly obscure and a plain one is exact, plain wins.

## Applied to pointers

Narrate pointer assignment as **aiming / following**, not with vague transfer verbs.
`p = q` is "p now points where q points," not "p takes q" — "takes" is ambiguous
(copies? moves? removes?) and hides the mechanism the animation exists to teach.
Pointers *point*, *aim at*, and are *followed* — one physical model, every animation.

- Assignment: "ins.prev now points where temp.prev points — to 12."
- Dereference: "Follow ins.prev to 12, then set its next to ins." (Read `a.b.c` as a
  motion: follow a to its target, then act on that target.)
- Retargeting, closing a step: "temp.prev now points to ins. 25 ↔ 37 is now linked
  in both directions."

Where aliasing matters pedagogically, say so: "now both ins.prev and temp.prev point
to 12."

## Pointer vs. reference — language-aware vocabulary

C++ and Java have **different underlying models**, and narration must respect that
rather than importing pointer vocabulary into Java.

| meaning | pseudocode / C++ | Java |
|---|---|---|
| the var→object bond | points to | refers to |
| the variable | pointer | reference |

The author writes a canonical token (e.g. `⟨points-to⟩`, `⟨pointer⟩`); the engine
substitutes per selected listing. Keep the map **minimal** — these one or two terms,
not a translation layer. **This is the ONLY thing that varies in narration by
language.** Node names, concepts, values, and structure are identical; syntax like
`->` vs `.` lives in the code panel, never in prose.

## Naming — one identifier per thing

A variable has exactly ONE name, used identically in the code panel, narration,
notes, and panels. **The code panel's name is canonical.** Code says `ins` →
narration says `ins`, never `ins_pt`. Two names for one thing silently makes students
wonder if they are two things.

## Reserved word — "step"

In student-facing text, **"step" means one Next-click / one execution**. For
indentation say "spaces" or "indent level"; for lines of code say "line"; for stages
of an algorithm say "stage" or name the operation. "Indented 0 steps" collides with
the execution-step meaning.

## Backstage stays backstage

- **No assignment references in student-visible text.** The assignment an animation
  backs is recorded ONLY in the hidden `?a=` marker. Printing "ds A10" anywhere
  defeats the entire design, which exists so students don't cherry-pick the
  assignment-backing animations. Titles describe the *topic*.
- **Subtitles orient, they don't spoil.** Plain orientation in terms the student
  understands *before* seeing the code. No line numbers, no punchline. Often the
  title alone suffices. Bad: "line 4 dereferences the pointer line 2 set." Good:
  "Inserting a node into a doubly linked list" — or nothing.
- **Metrics readout hidden by default.** The tag-derived counter is an internal
  mechanism, and the raw tag name (`assign`) is engine jargon. Show a counter ONLY
  when the count is itself the lesson (a sorting race), and then label it in plain
  words ("statements", "swaps"), never the raw tag.

---
---

# PART 5 — LAYOUT, COLOR, AND STATE

## THE MASTER INVARIANT — every dimension resolves once, then never changes

**No element's size may depend on the content of the current step.** Every height and
width is determined ONCE — at load, from the viewport and from the maximum content
the element will hold across the *entire* step sequence — then held constant. An
element that is empty or shallow at a given step renders as reserved empty space,
never as a smaller element.

This one rule subsumes a family of bugs that surfaced individually, and expensively,
during `queues-count-vs-rear` — every one caught in review rather than by the spec:

| Symptom | Cause | Rule |
|---|---|---|
| Index labels bounced as cells filled | empty cells rendered collapsed | cells are a fixed size for every role |
| Markers jumped down when leaving -1 | parked zone had no index label above it | the index band spans the parked zone at full height |
| Controls moved on the step that printed output | STREAM sized to content | STREAM has a fixed line count from step 0 |
| Panel breathed on every call and return | CALLSTACK sized to content | fixed to the deepest stack reached |
| Dead gap above the controls | code panel pinned to exactly 15 lines | 15 is a floor; the panel fills the column |

**When adding any renderer or panel, ask: can this change size between steps? If yes,
it is wrong.** Reserving space that is sometimes empty is always correct and always
cheap. Recalculating on an actual window *resize* is fine; recalculating because the
*content* changed is the bug.

### Reserve the maximum — UP TO A CEILING. Scroll beyond it.

The invariant above was originally written as "reserve the maximum," full stop, and
that half-statement caused its own round of defects: a trace emitting 18 output lines
reserved 18 rows from step 0 and ate most of a column, mostly empty, for most of the
animation. Reserving is right; reserving without a bound is not.

Every panel answers ONE question: **does its content have a known maximum?**

- **Yes** → size to that maximum (a 4-cell array, a 3-box variable strip, a listing).
- **No, or the maximum is large** → apply a ceiling, scroll beyond it, and keep the
  active element in view.

Both axes, same rule:

    height = min(rows needed, available)   with a floor and a per-type ceiling
    width  = min(content width, available) with a floor and a per-type ceiling

Leftover space in either axis stays **empty**. It is not distributed, and no panel
grows into it. Empty space at the foot of the shorter column, or to the right of the
last panel in a row, is the correct look — it reads as "this column has less in it,"
which is true.

### Standing practice: every engine change gets a before/after diff

Any change to layout, sizing, or placement logic is re-verified across **every**
animation in the repo before the PR opens, and the PR reports what CHANGED — panel
positions and resolved sizes before and after, stage height before and after, and one
line per changed animation saying whether it is an improvement, neutral, or a
regression. Say so plainly when something got worse.

A change that improves the animation being built while quietly degrading three others
is a net loss, and the only way to know is to look every time. Do not wait to be
asked. `pac.verifyHeights()` makes the height half of this one command.

### The sizing policy table

Policy is **data, in one table**, applied by **one resolver**. This is the most
important structural rule in this document, and it was learned the expensive way.

| Panel | Floor | Ceiling | Beyond ceiling |
|---|---|---|---|
| CODE | 15 rows; ~60 chars wide | listing length; longest line | scroll |
| CALLSTACK | 2 rows | min(deepest stack, 6 frames) | scroll, active frame in view |
| STREAM | 2 rows | 8 rows | scroll, newest line in view |
| structure (CELLS/NODES) | content | half the stage (height only) | scroll vertically; **never horizontally** |
| strips | 2 rows | exact content | — |

**Adding a panel type means adding a row to this table, never a branch at a call
site.** The reason is the whole story of `stacks-paren-scanner`: the same rule
("size to content") was implemented independently in four places — stage, structure
region, callstack+stream, code — and the four drifted. Every fix corrected one branch,
so the same defect resurfaced from a different branch, again and again, for roughly
thirty review rounds. Centralising the resolver and making the clamps data ended it in
a single pass.

Two specific traps, both of which cost multiple rounds:

- **`flex: 1` was the default on panel bodies.** That made every panel stretch to fill
  its container, and `flex: none` was applied one panel at a time as each was
  reported. The default is now `flex: none`. Do not reintroduce a growing default.
- **A floor with no ceiling swallows all slack.** The code panel had a 15-row floor and
  no ceiling, so it absorbed every spare pixel — first vertically (padding a 9-line
  listing to 15 rows), later horizontally (a 50-character listing in a 1200px panel).
  Same defect, two axes, two separate discoveries.

Corollary, and it cuts both ways: **unused space has no cost, but unused space is not
a hole to fill.** A panel that leaves a visible gap because it was pinned too small is
a defect; a panel that grows past its content to close a gap is also a defect. Floors
and ceilings, not fixed values, and not stretching.

### Two exceptions to the capping rule

**The note box EXPANDS rather than scrolling.** It is the last element on the page,
so nothing sits below it and growing costs nothing. Its *reserved height* is
unchanged — that reservation is what stops the controls moving when a note appears —
but a note longer than the reservation extends BELOW it, into space nothing else
occupies. Every other panel is capped precisely because something below it would
move. The narration bar is not included: it sits above the note and is short by
design.

**A panel that fits in the width remaining on a row uses it**, rather than breaking
to a new row because an earlier panel broke. The flow rule originally only moved
panels *down*, so a wide structure panel breaking to its own row dragged every later
panel with it — leaving a small panel below while the space beside the code sat
empty. Re-test each panel against the space actually available.

### Column ends do not align, and that is correct

Panels are an integer number of rows times a row height, plus chrome. Different panel
types have different row heights, so two columns of "as much content as fits" land on
different pixel totals — a residual gap of less than one row at the foot of the
shorter column.

Making the columns end together would require giving some panel a fractional row,
which is the partial-line clipping this document forbids. **Whole rows and equal
column ends cannot both hold. Whole rows wins.**

Two measurement notes for anyone who investigates this again (it has been
investigated three times):
- `.pac-col` is `align-items: stretch`, so the column ELEMENT measures as the full
  stage height regardless of content. Verification must compare against the column's
  *content* height — last panel's bottom minus first panel's top.
- `pac.verifyHeights()` reports, per column, the sum of resolved panel heights plus
  declared gaps against the measured content height. Those must match exactly. A
  constant offset across every animation would be an accounting bug; gaps that vary
  per animation are just quantization. Run it before questioning any panel's size.

## Stable layout — bounded stage, internal scrolling, pinned footer

The animation must fit on screen and never reflow. Resolution-independent by
construction: bound the stage, divide it proportionally, let overflow scroll — never
grow the page. Design target is 1920×1080 at 100%.

**The stage has a bounded height.** It never grows past it regardless of panel
content. Do NOT hardcode to a screen resolution.

**Every panel scrolls internally within its grid cell.**

- **CODE:** `rows = min(listing length, rows that fit)`, with the 15-row floor
  applying **only when the listing is longer than 15**. A 9-line listing produces a
  9-row panel — it does NOT pad to 15. (An earlier revision of this document said
  "pads to 15"; that was wrong and produced a 9-line listing in a 15-row box.)
  **Whole rows only** — never a half-height row clipped at an edge. Width is
  `min(longest line across ALL language tabs, available)`, floor ~60 characters.
  **Resolve on load, hold constant**: switching language tabs or advancing steps must
  not change either dimension.
  The highlighted line auto-scrolls into view, holding roughly the middle with context
  above and below — **and only when it would otherwise reach an edge.** Scrolling on
  every step is as disorienting as never scrolling. This matters most where a `main()`
  driver sits 20 lines from the functions it calls.
- **STREAM / CALLSTACK:** ceiling from the policy table, internal scroll, newest
  content (or the active frame) kept in view.

**Panels fill their grid cells; don't oversize a cell for little content.** A
two-value panel is a compact strip, not a tall boxed panel with a void. Content
top-aligns.

### Where panels go — column flow and width priority

**Which panel goes in which column was never stated** until `stacks-paren-scanner`,
and in its absence the shape "code left, everything right" was copied from build
prompt to build prompt. It happened to balance with 3-4 right-hand panels and broke at
five: the code panel, pinned to the full height of the left column, was being sized by
the OTHER column's content and stretched to 37 rows, 22 of them dead.

- **The author declares panels in READING ORDER**; the engine places them. Reading
  order is: what the student watches first, then bookkeeping, then machinery. STREAM
  is declared last — it is what the program *emits*, and reads naturally as a
  continuation of the code that emitted it, which usually places it beneath the code
  panel.
- Panels flow down the right column in declaration order; when it is full, the
  remainder continues in the LEFT column beneath the code panel.
- **Resolution order (height):** bookkeeping panels claim their minimums → the
  structure region takes what it needs up to its ceiling → CODE takes its floor → any
  slack goes to CODE, up to its listing length.

**Width priority is the reverse, and this matters: a structure panel NEVER scrolls
horizontally.** A student reading a data structure must see its shape; a horizontally
scrolled structure teaches nothing.

- **Resolution order (width):** structure panels claim their natural width → fixed-
  content panels claim theirs → CODE takes what remains, down to ~60 characters →
  STREAM matches its column.
- **The sum of a row's widths plus gaps never exceeds the viewport.** No panel may be
  positioned partly outside it. Off-screen content is unreachable, which is strictly
  worse than any amount of wasted space.
- If a structure genuinely cannot fit beside the code minimum, **the animation is too
  wide and must be redesigned** — fewer cells, a different layout, a split view. It is
  never resolved by shrinking the structure or letting a panel overflow.

Structure panels sharing a row sit adjacent, each at its own natural width, sharing
the row's height (so tops and bottoms align). They do not split the row evenly and
they do not stretch. Two views of one structure — the heap's tree and its array — must
be side by side, never stacked, or the correspondence that is the lesson is lost.

**The height placement is a GLOBAL balance, not a forward-only flow.** "Panels flow
down the right column, then the left" describes the *result*, not the mechanism. The
engine enumerates every split `k` — right column gets `book[0..k)`, left gets
`code` + `book[k..)`, declaration order preserved — and picks the `k` whose *taller*
column is shortest (ties broken toward the two columns ending closest together). So
**"why is this panel here" is nearly always "every alternative was taller"**: before
investigating a placement, compute the other splits. In `recursion-factorial-stack`
(code + two book panels, `calls` and `cascade`), putting the expansion beneath the
code is split `k=1` at a 445px stage; both book panels right is `k=2` at 428px — the
balancer tried both and chose 428. The empty space below an 8-line code panel is then
just the shorter-column foot gap (item 24), not a hole a later panel could fill: moving
`cascade` into it only relocates and enlarges the leftover.

**Book panels NEVER share a row — and that is a consequence of where the fit logic
lives, not a decision anyone made.** The horizontal first-fit that lets panels sit
side by side exists ONLY in the `singleCol` wide-structure packer, which an animation
enters only when a structure is too wide to sit beside the code. Two book panels in the
ordinary two-column path therefore always stack, however much width the row has spare —
`recursion-factorial-stack` stacks 541px of panels in a 1172px row, giving a 428px stage
where side by side would give roughly 208px. This is NOT the panel-count density rule
(that governs how *many* panels an animation has, not whether two short ones may share a
row), and it was never a deliberate call — it falls out of the fit logic's location.
**Do not add side-by-side book packing now:** it changes every animation's layout for a
benefit that is invisible whenever there is height to spare, and no built animation is
cramped by it. Revisit only if an animation is genuinely height-cramped with two short
book panels — and the fix is to let the height balancer *consider pairing them as one
row* among its splits, not a new placement rule bolted on beside the existing one.

### Panel count — soft ceiling of 6 for `standard`

`beginner` caps at 3, enforced. `standard` was documented as unbounded, which is how
one animation reached five panels without anything objecting. **Six is a soft ceiling**
— not enforced, but a seventh must be justified. The first two things to try are
merging related state into one panel, or cutting one that is not earning its place.
Do not add a panel to make a labelling point: a distinct row inside an existing panel,
with a highlight, is nearly always enough. A screen the student cannot hold in their
head teaches less than a smaller one, however correct each panel is.

**Controls and note are pinned below the stage, always visible.** They are never
pushed below the fold at any viewport size. On a short viewport panels show less and
scroll more, but the student can always step and always read the note. **Losing the
note off-screen is the one failure the layout must prevent.**

**The controls never move as steps advance.** The trap: the stage flexes to absorb the
viewport, so anything changing the footer's height would resize the stage and move the
controls. So the footer is held at **constant height** — the narration bar and note box
have fixed reserved heights (`--narrate-h`, `--note-h`), and longer content scrolls
inside them. A note appearing changes only what is painted inside its already-reserved
slot.

Degrades gracefully: tall viewport → roomy; short viewport → panels show less and
scroll, but nothing overflows and nothing falls off.

## CELLS rendering contract

Settled during `queues-count-vs-rear`. All renderer-level, so every animation inherits
it.

**Index labels are bracketed** — `[0] [1] [2] [3]`, in a fixed-height band under the
cells. A bare `1` under a cell holding `b` is the index-vs-value confusion rendered as
a design choice; brackets say "this is a position, not a value," and they echo
`contents[rear]` in the code panel. **Label the row once, at the left, with the array's
name.** The band spans the full array area *including* any parked-marker zone left of
cell `[0]`, so the marker lane below starts at the same height everywhere.

**Cells are a fixed size for every role.** Nothing below the array may move because a
cell's contents changed.

| Role | Renders as | Means |
|---|---|---|
| member | full border, value at normal weight | part of the structure now |
| `stale` | value still shown, greyed (~40%), no member outline | was written, no longer part of the structure |
| `empty` | dashed/dim border, faint corner-to-corner X | no meaningful value yet |

The member/stale distinction carries the weight — a student must read "no longer in the
queue" without effort. **Distinguish states by shape and outline, not brightness
alone**; two things differing only in opacity are hard to tell apart at a glance.

**One placeholder glyph, used everywhere: a thin X, and nothing else.** No dash, no
dot — the X alone. A hyphen inside a value slot reads as a value, and in the sorting
animations specifically it reads as a minus sign. The same mark serves an unwritten
array cell and a standalone variable with no meaningful value yet (`ch` before the
first assignment). There is no principled difference: both are declared storage holding an
indeterminate value. An early draft of this rule invented a distinction that does not
exist. Membership is carried by outline, greying, and markers — not by the glyph.

**A real value always shows itself.** A variable holding a sentinel renders that
sentinel at normal weight, never as a placeholder: `front -1` is a stored value the code
tests against, not an absence. Placehold it and the lesson that depends on it disappears.

**Compact strips stay horizontal.** A two- or three-value strip (`[front][rear][ch]`)
shows every box at once and never scrolls. Where the point of a strip is a comparison,
hold everything else identical — same widths, same order, same styling — so the one
differing box is what the eye lands on.

## The index pointer — labeled marker over a linear structure

A **labeled pointer that points at an array cell and moves as its index changes** — the
array-world analog of the linked-list pointer arrow.

**When it applies:**

- **Raw array + a loop counter → NO.** A `for i` that just walks the array is ephemeral
  bookkeeping, not novel. Drawing it as a pointer spatializes a throwaway variable.
  `lists-array-insert-delete`'s `i` is this case: the lesson is the shift cost, not the
  index.
- **Array-based STRUCTURE + semantic indices → YES.** When an index *defines the
  structure* — persists between operations, carries meaning, and manipulating it IS the
  algorithm — it deserves a labeled moving pointer. A queue *is* "an array + `front` +
  `rear` + wraparound"; a stack is "an array + `top`."

The unifying principle: **the index pointer visualizes the semantic indices that turn a
raw array into a data structure.**

**Rendering contract** (built and shipped on `queues-count-vs-rear`):

- **A marker ALWAYS shows its label**, directly beneath its caret, centered. The label is
  the variable name exactly as the code panel spells it. No decoration, no value. An
  unlabeled caret is a defect: two anonymous triangles on one array are unreadable, which
  is exactly what A2 shipped in its first draft.
- **A marker means a stored variable.** There is no "derived" or "computed" style. If a
  value is not stored by the representation shown, it gets no marker — its absence is
  information.
- **Markers on one cell render SIDE BY SIDE**, overlapping neither each other, the
  index label above, nor the neighbouring labels. Common (a one-element queue has
  `front == rear`), not an edge case.
- **The inter-cell gap is sized from the trace's worst case, once, at load.** Walk
  the trace, find the highest number of markers that will ever share a single cell,
  and set the gap wide enough for that many. Hold it constant. An animation whose
  markers never collide keeps a normal gap; one that reaches three is sized for three
  from step 0. Without this, cell spacing grows when markers cluster and every cell to
  the right shifts — the master invariant broken by the marker lane.
  *Stacking markers vertically was tried instead and reverted: it bounds the width
  cleanly but separates a marker from the cell it points at, which is worse. Do not
  re-propose it.*
- **A marker at a sentinel index** (-1, meaning "points at nothing") parks left of cell
  `[0]`, dimmed, label still visible. It must read as "not pointing yet," not as missing.
  It shares the marker lane with pointing markers, so leaving the sentinel is a purely
  lateral move.

Inherited by the stack animations (`top`), binary search (`low`/`mid`/`high`), and the
sorting animations (`i`/`j`).

## Node membership — `unlinked` (amber outline)

A node **not yet, or no longer, a stable member of its structure** renders with an
**amber outline** (border only — never a fill). When it becomes a full member — its own
links AND the structure's links back to it all set — it transitions to the normal outline
in a single change.

Applies wherever nodes join or leave:

- **Insertion** — the new node is `unlinked` from the initial state through every wiring
  step, resolving only when the insertion is complete in both directions. In
  `lists-doubly-insert-order`, node 25 is `unlinked` on steps 0–4 and turns normal on the
  final step.
- **Deletion** — a node becomes `unlinked` once the structure's links to it are being torn
  down.
- **Fresh allocation (C++ `new`)** — a just-allocated node held by a pointer but not yet
  wired in.

Distinct from `pending` (traversal): `pending` = "not yet reached by the current walk"
(dimmed); `unlinked` = "not a structural member" (amber outline). Use `unlinked` for
membership, `pending` for traversal frontier.

## Color channels — outline = membership, fill = activity

Two **independent channels** on every node. They never compete; both are always shown.

- **Outline = membership.** Green = stable member. Amber = `unlinked`. Slow and stable:
  an inserted node is amber for the whole insertion and turns green ONCE, on the final
  step. Never let partial linking flip it green early.
- **Fill = activity.** Blue = "this node's contents are being modified on THIS step."
  Transparent otherwise. Transient.

Because they are different channels, a node shows both: amber outline + blue fill is
"still not a member, being modified right now." Green + blue is "stable member being
modified." This is intended — neither overrides the other.

Do not use fill for membership or outline for activity. Two clear stories: "where are we
in joining/leaving" (outline) and "which node is this line touching" (fill).

### `sorted` — green FILL, "in its final position"

A third fill state, for sorting animations. **Green fill means this value is in the
position it will occupy in the finished sorted array.** Not "correct for this pass",
not "on the right side of the pivot" — permanent. A cell that takes it never loses it.

- Green **fill** = permanently placed (sorting). Green **outline** = stable member of
  the structure (linked lists). Different channels, so no ambiguity.
- Green and blue fill are mutually exclusive: a value being acted on this step is by
  definition not settled. A cell becoming `sorted` releases any activity fill on the
  same step.
- It accumulates in whatever order the algorithm places values — scattered and
  depth-first in quicksort, right-to-left in heapsort, strictly left-to-right in
  quicksort's worst case. **A finished sort ends with every cell green**, which is the
  correct terminal picture for all of them.

Why not amber for "not in the right place": amber means `unlinked`, i.e. *not a member
of the structure*, which is binary and structural. "Not in the right place" is a
gradient — mid-algorithm it is true of nearly every element, so the colour would stop
carrying information. Green marks the small, growing set of things that ARE settled,
which is the useful half.

## A token may be borrowed as a PIGMENT

`--warn` means `unlinked` in a structure panel, and it also colours the
open-in-own-window link, a STREAM input prompt, two focus rings, and one of
`sorting-timing-chart`'s two curves. That is not five meanings — it is one meaning
plus four borrowings.

**The test is whether the context HAS a colour channel the token would contradict.**
Structure panels do: outline means membership, fill means activity. A token carrying
one of those meanings must not appear there saying something else — which is exactly
why the amber bundle in `recursion-hanoi-leap` was wrong. A disk on a peg *is* a
member of the structure it sits on, so amber asserted the opposite of a fact, and the
bundle was recoloured to the real disk's treatment (shape alone distinguishes them).

A chart series, a link's focus ring, and a STREAM prompt have no such channel. A chart
needs two distinguishable series colours and which tokens supply them is arbitrary —
note that `--accent` is borrowed there too, despite meaning "active this step"
everywhere else. Borrowing paint where nothing is being said with colour is fine;
saying a second thing with it where colour already speaks is not.

Audited inventory, if this is ever questioned again: six `--warn` uses — `unlinked`
node outlines and the open-window link (its two jobs), plus two link focus rings, the
STREAM `dir: 'in'` prompt, and the bubble-sort series. Four borrowings, no collisions.

## Memory-danger marker (red ⚠)

A **red warning triangle** marks narration describing a **memory-integrity violation**.
Project-wide and cross-course, so students learn to recognize a *category* of failure on
sight.

**Three diagnoses, all red — name the right one, it's part of the lesson:**

- **Leak / unreachable** — no pointer reaches it anymore. Still occupies memory, can
  never be used or freed.
- **Structural corruption** — links internally inconsistent: a node points at itself, or
  one direction of a bidirectional link was updated and its partner was not. Reachable,
  but broken.
- **Bad access** — dangling pointer, write through an uninitialized or null pointer,
  use-after-free, double-free, out-of-bounds write.

**Do NOT mark** (bugs, but not memory corruption — marking them dilutes the signal):
logic errors, off-by-one reads, integer-division truncation, wrong output, a healthy
pending node held by a pointer.

**The false alarm to avoid:** a freshly allocated node held by a pointer and waiting to be
linked in is **healthy**, not in danger. In `lists-doubly-insert-order` node 25 is held by
`ins_pt` throughout and inserted safely; that trace has **no** danger moment and gets
**no** triangle. Likewise a `stale` array cell is healthy — nothing corrupted it.

**Authoring:** narration is normally a plain string; for danger, write it as segments.

```js
narrate: [
  "curr advances past the target node.",
  { danger: true, text: "Nothing points to that node now — it is leaked." }
]
```

Rare option: when the **code line itself** is the culprit (usually it is valid C++ and
only the runtime consequence is fatal), set `dangerLine: true` to tint the highlighted
line red.

**Diagnosis, not just alarm.** Name *which* violation it is — "leaked and unreachable",
"the list now points to itself", "dangling: p refers to freed memory" — so students learn
to distinguish the three, not just that "something is red."

## Open-in-own-window link (every animation, iframe-aware)

Canvas steals ~300px of vertical space before an embedded animation begins, at every
resolution. Rather than fight it, every animation carries a self-link opening it in its
own tab. This makes Canvas fit a non-problem: the embedded view can be a little cramped
because one click gives the full view.

- A small control links to itself with `target="_blank"`, placed in the header near the
  title. **Engine-rendered, always present** — never per-animation authored, so an
  animation built next year gets it without anyone remembering.
- **Same wording, same style, always visible — identical in every context.** No
  iframe-awareness: the link does not change by embedded vs standalone. Recorded verbatim
  so it is not invented again:
  - **wording:** `⛶ Scrolling to see it all? Open in its own window`
  - **colour:** `--warn` amber-orange, never error red (which would read as alarm)
  - **size:** 13px, weight 500
- Its line is reserved in the header from step 0, so its height never changes as steps
  advance and nothing moves.

**Why identical, not context-dependent.** Students meet this control *inside Canvas*, so
the amber lifeline is the real one; standalone is where **we** review, and a review that
shows something different from what a student sees is a review of the wrong thing. Keeping
them identical means every local preview and every directly-opened page shows the actual
control — the one thing that cannot be exercised inside Canvas is verified everywhere
else. (Two earlier rules failed this: "minimized or hidden" made *hidden* standalone,
invisible in every preview; a later muted-standalone variant made previews show a
different control than students get. Same style everywhere is what holds.)

This dissolves the "how far do I accommodate low-res screens" question: make the embedded
view fit reasonably for the majority; the link covers everyone else.

---
---

# PART 6 — PEDAGOGICAL PATTERNS

## Name the student's confusion first

When an animation demonstrates why a counterintuitive approach is correct, first **name
the confusion the student is already feeling**, then show why the intuitive-but-wrong way
fails. Validating the instinct ("yes, this seems backwards") before refuting it is far
stronger than presenting a bug cold: it connects to what they were quietly wondering and
makes them *want* to watch the failure.

1. A note naming the counterintuitive thing as a question: "Have you wondered why we make
   room by moving the outermost item first? It seems backwards. Watch what happens if we
   start from the inside instead."
2. Run the intuitive-but-wrong version; let them watch it fail (with ⚠ if it corrupts
   data).
3. A payoff note answering the opening question using what they just saw: "That is why we
   start from the far end — each value is copied before the next step overwrites it."

WATCH-safe, and the way to get the engagement a prediction question would give: curiosity
provoked by naming the confusion, satisfied by watching the consequence.

## Race mode — lockstep comparison

Two generators advanced together and merged into one view. Its use is a **non-race
compare**: two implementations of the same structure side by side, so the student reads
the difference rather than a winner.

- **The author aligns the racers, not the engine.** Every operation is broken into the
  same number of *phases* in both racers; the engine merges frame *i* with frame *i* and
  nothing more.
- **Idle steps.** A racer with nothing to do in a phase yields `{idle: true}`: state
  carries over, **no line highlighted**. Must read as "this side had no work here," never
  as a stall. Idles are pedagogically useful — a blank where the other side runs a
  statement is a visible cost difference.
- **Line-align the two listings to each other**, so differences appear as horizontal gaps
  at matching line numbers. Leave a blank line rather than closing up the listing.
- **Neither side is the villain.** A divergence between two valid approaches shows a
  *trade-off*, not a bug. Say what the losing side would need to work, so a student who
  chose it isn't told they chose wrong.
- **No metrics counter by default**, even here.
- **Give each racer its own panels**, visually identical in every respect except the thing
  being compared.

**A warning from A2, which tried race mode and abandoned it.** The comparison was
legitimate and the design sound on paper. It still failed: **two columns consumed the
space a driver panel needed.** With `main()` and the call-frames panel crowded out, the
student could see state changing but not what was changing it or where the values came
from. A comparison is worthless if the student cannot tell what operation is running.

So: **a race must leave room for the driver.** If showing two of something means cutting
`main()` and the call frames, show one thing and make the comparison sequential — a payoff
note contrasting the two approaches costs no space at all, and A2's single-representation
version teaches the trade-off better than its race version did.

Side-by-side is otherwise discouraged on density grounds. Reach for it only when the
*comparison itself* is the subject.

---
---

# PART 7 — COURSE-SPECIFIC

## ds — use the instructor's own words

The ds animations back a course with detailed lecture notes; narration and notes should
echo the instructor's actual framing, not paraphrase it.

**Array-based lists (A1):**

- The invariant is **contiguity — no holes.** Every operation preserves it. An insert that
  would leave a gap (insert at 7 when count is 5) is invalid precisely because it breaks
  contiguity.
- **ADD is INSERT at index = count** — not a separate operation. The instructor explicitly
  requires ADD to call INSERT. Show ADD as "insert at the end," which needs no shift
  because nothing follows.
- **"Make room before you write, or you overwrite."** Frame the shift as
  overwrite-avoidance, not just "move elements."
- **"Update the count!"** — the most-forgotten step. Show it explicitly on every
  operation.
- Range/border checking is the core misconception: "can you insert at index 6? index 7?"

**Queues (A2):**

- **"Too expensive to move everything down every time we remove an element"** — the shift
  is shown as a diagram and rejected. That rejection is the motivation for tracking
  `front` as a moving index. Direct A1→A2 bridge: A1's cost WAS the shift; the queue
  refuses to pay it again.
- **"Use the array in a circular fashion"** — wraparound, via `next_ix()`, his own
  suggested auxiliary.
- **"Use whichever representation seems easiest"** — count and rear are both valid. Never
  portray either as wrong; a divergence is a trade-off.
- The ambiguous condition is **`front == next_ix(rear)`, NOT `front == rear`.**
  `front == rear` means exactly ONE element.

**Linked lists — the two "golden rules" of pointer manipulation, echo verbatim:**

1. "First overwrite pointers where you could do the least damage — nil pointers."
2. "If you want to point to some node and you're not sure how, find a pointer already
   pointing to it and copy it."

**The array→list motivation** (payoff note bridging A1 to linked lists): a linked list is
"a dynamic analog to a static array"; the shift cost is "the price we pay" for the array's
simplicity, and it is why linked lists exist.

---
---

# PART 8 — BUGS FIXED ONCE, HERE, ON PURPOSE

- **Leaked timers.** Seven of thirteen repo files called `setInterval` and never
  `clearInterval`. There is now exactly one of each in the codebase, both in `Engine`.
- **188 distinct colors.** Now 15 custom properties.
- **HTML in step data.** Structurally impossible now.
- **Duplicate SVG marker ids.** One marker, in the overlay.
- **No Back button.** Free, because steps are snapshots.
- **Panels that resized as content changed.** See the master invariant — this one cost
  seven review rounds on a single animation before it was stated as a rule.
