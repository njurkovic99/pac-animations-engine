# Authoring a pac-animation

Read this before writing a content file. It exists so nobody re-derives the
architecture from the twenty-five original animations.

Companion docs: `PANEL-INVENTORY.md` (why the engine is shaped this way),
`SLATES.md` (what to build, and which subtopic each animation answers to).

---

## The shape of a content file

```js
export default {
  title, subtitle,
  profile: 'beginner' | 'standard',
  columns: 2,
  languages: ['pseudo', 'java', 'cpp'],   // order = tab order; first is default
  panels: [ {type, id, title, ...panelOpts} ],
  initialTrace: 'correct',
  traces: { correct: function*(){...}, buggy: function*(){...} },
  hideTags: ['call'],                     // tags counted but not displayed
}
```

Nothing else. No HTML, no CSS, no DOM, no colors. If a content file contains a
`<div>`, it is wrong — that is precisely the mistake `oop5.html` (183 embedded
markup fragments) and `oop4.html` (128) made, and it is why those animations
could never be generalised.

---

## Steps are snapshots

Each `yield` returns the **complete state of every panel**, not a delta:

```js
yield {
  tag: 'swap',                    // counted; never increment a counter by hand
  line: {pseudo: 6, java: 7, cpp: 7},
  narrate: 'The n-2 branch is evaluated first.',
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

None of the original 25 files had a Back button. A beginner who missed a step
had to restart.

---

## Generators, not step arrays

A generator that yields literals *is* a step array. So one driver handles all
three execution models found in the original files:

| model | how |
|---|---|
| precomputed | generator yields hardcoded snapshots |
| live | generator yields as it computes |
| race | `traces.x = { racers: {a, b}, merge(frame, i) }` — *n* generators, `.next()` in lockstep |

`racebubsel.html` hand-rolled a resumable state machine (`bState`, `bI`, `bJ`,
a switch) to do what `function*` does natively. Do not do that again.

---

## Tags, not counters

Every step may carry `tag`. The engine counts tags and displays the totals. To
add a "comparisons" readout in year three, touch no algorithm.

`racebubsel` maintained `bStatements`, `bSwaps`, `sStatements`, `sSwaps` by
hand, with `bSwaps++` buried in a branch. Every mutation site was a bookkeeping
obligation.

Note the pedagogy: race on **statements** (total work), display **swaps**
alongside (where bubble and selection diverge). Both are right. Tags make it a
non-choice.

---

## Panels

Five renderers. If you find yourself wanting a sixth, check first whether it is
one of these with a different template — eleven things I had separately named
turned out to be NODES.

**CODE** — `{listings: {pseudo, java, cpp}, labels}`. Step gives `line`, either
a number or `{pseudo, java, cpp}`. Each trace addresses **its own** listing's
line numbers, so listings never need to stay line-aligned.

**CELLS** — `{render: 'box'|'bar'|'row', cells: [{value, label, role, anchor}]}`.
Roles: `active`, `compared`, `ok`, `error`, `empty`. Serves arrays, sorting bars,
hash buckets, matrices, memory blocks, variable tables, stack frames, vtables.

**NODES** — `{layout: 'tree'|'linear'|'graph', template: 'plain'|'record',
nodes: [{id, parent, label, meta[], state, slot, row}], edges?}`.
States: `pending`, `entering`, `active`, `exited`, `unlinked`. Snapshots include
not-yet-visited nodes as `pending`, so layout is computed over the whole
structure and nodes never jump. `unlinked` marks an allocated-but-not-yet-a-member
node (see "Node membership state").

`template: 'record'` draws `[ prev | value | next ]` — the shape of
`lists.9.gif` — and **publishes an anchor per field** (`list.n25.prev`,
`list.n25.next`, `list.n25`). That is what lets pointer links be arrows rather
than edges. In `linear` layout, `slot` and `row` place a node off the main row
(a freshly allocated node not yet in the list).

Serves linked lists, BSTs, heaps-as-trees, recursion trees, class hierarchies,
object graphs, GC reachability, UML, flowcharts, adjacency lists.

**STREAM** — `{lines: [{text, dir: 'in'|'out', indent}], cursor}`. `dir: 'in'`
renders a prompt, a visible pause, an echoed value. Every CS1 assignment from
A2 onward is prompt-driven and **no original file modelled input at all**.

**CHART** — `{series: [{name, color, points}], xLabel, yLabel, marker}`.
Required, not optional: `ds7` grades a plot of execution time vs. n.

---

## Arrows

Cross-panel, always. A pointer lives in CELLS; the node it points at lives in
NODES. Renderers publish named anchors; the overlay resolves them against live
DOM boxes at draw time.

```js
arrows: [ {from: 'vars.p', to: 'tree.c3', style: 'pointer'|'stale', bend: 'up'|'down'} ]
```

The overlay picks which edge of each box to leave from and enter, based on
geometry. `bend: 'down'` bows an arrow below the row, so backward `prev`
pointers never overlap forward `next` pointers. A pointer that references its
own node renders as a loop — not decoration: it is the failure mode of a
doubly-linked insertion done in the wrong order.

`cpoint1.html` faked this with four hand-tuned Bézier curves and colliding
`arrowhead2` marker ids. Change a font size and the arrows pointed at nothing.

---

## Predict gates

```js
yield {
  ...snapshot,
  type: 'predict',
  question: 'What level should it pass?',
  options: [
    {label: 'level + 1', feedback: '...', branch: 'buggy', banner: '...'},
    {label: 'level + 2', correct: true, feedback: '...'},
  ],
}
```

The engine stops. A wrong answer may `branch` into another trace, so the student
**watches their own bug run**. Then Reset shows the correct one.

This is the reward for the diligent student, and it inverts the misconception
trap: prediction is engagement; being shown you were wrong before you guessed is
discouragement.

---

## Profiles

`beginner` (bCpp, bJava) hides memory addresses and **caps panels at 3 —
enforced in the engine, not left to authorial restraint**. `standard` does not.

---

## Naming

`<domain>-<what-you-see>.html`, lowercase, hyphens. No course code, no chapter
number, no ordinal, no language suffix. Twelve animations serve two courses;
`courses.json` says which, and in what order.

Renamed a file? Leave a `<meta http-equiv="refresh">` stub at the old name.
Twenty-three Canvas wiki pages iframe the old filenames.

---

## Local preview

Browsers block ES modules over `file://`.

```
python3 -m http.server        # then open /anim/<name>.html
node build-preview.mjs <name> # or bundle to a single double-clickable file
```

---

## Bugs that were fixed once, here, on purpose

- **Leaked timers.** Seven of thirteen repo files called `setInterval` and never
  `clearInterval`. There is now exactly one `setInterval` and one
  `clearInterval` in the codebase, both in `Engine`.
- **188 distinct colors.** Now 15 custom properties.
- **HTML in step data.** Structurally impossible now.
- **Duplicate SVG marker ids.** One marker, in the overlay.

---

## WATCH only — no gates, no questions

Every animation is a passive step-through. The student clicks Next/Back; the line
highlights, state updates, narration explains. **Do not author predict gates,
questions, options, `branch` traces, or any interactive stopping point.** There
is no `?mode=` parameter. Interactive "THINK" mode is deferred in full and will
be added later, per-animation, as a separate pass (see HANDOFF.md).

Every step is a plain step. A content file therefore has one trace (the correct
one); there are no `buggy`/alternate traces and no `type:'predict'` steps.

**Teaching a common mistake, WATCH-style.** When an animation should warn about a
frequent error, do it with **narration on a normal step**, not a question. State
the mistake, then let the correct execution proceed so the student sees the right
behavior. Example (fib levels): a step whose narration reads "A common error is
`fib(n-2, level+1)` — but n + level must stay constant, so it must be `level+2`,"
after which the animation continues correctly. The insight is delivered; nothing
stops or branches.

The hidden assignment marker `?a=` (e.g. `...html?a=bcpp-a7`) is ignored by the
animation entirely — it exists only for the instructor. Animations read no URL
parameters at all in this build.

---

## Line highlighting = the line about to execute

The code panel highlights the current line like a debugger's instruction
pointer: **the line about to execute**, not the one just executed. For a step
that describes running `ins.prev = temp.prev`, `line` is that assignment's line;
the highlight sits on it while the narration explains what it will do, then the
next step advances both the line and the state.

Put `line` at the **top level of the step object**, never inside `panels`:

```js
yield { line: 4, tag: 'assign', narrate: '...', panels: { list: {...} } };
```

`line` may be a plain number, or a per-language object `{pseudo, java, cpp}` when
the listings differ in length. Steps with no executing line — an intro, a
`predict` gate, a final summary — set `line: null` (or omit it), and no line is
highlighted. The engine passes top-level `step.line` to the code panel
automatically; authors never nest it under a panel id.

---

## Step granularity — one meaningful change per step

Do not bundle several state changes into one step. The student clicks Next to see
*one* thing happen. In particular:

- **One pointer rewire per step.** When an arrow moves — a `next`/`prev`
  reassignment, a `head` update, a link being broken — that is its own step, and
  the narration dwells on it. Pointer changes are the pedagogically dense moments
  (this is exactly where the doubly-linked insertion trap lives), so they get
  room to breathe. The four-line insertion in `lists-doubly-insert-order` is the
  model: one assignment, one step, one arrow moving.
- Grouping is fine only for genuinely simultaneous, uninteresting updates (e.g.
  initializing several counters to 0 at once). Anything a student could get wrong
  gets its own step.
- Prefer more small steps over fewer dense ones. A WATCH animation that takes 20
  gentle clicks beats one that takes 8 crowded ones.

## The post-watch challenge (a note on the final step)

An animation may end with a **challenge**: a "what if" question posed to the
student who wants to go deeper, with no answer and no interaction. It is a
**teaching note** (see below) attached to the final step — NOT a step of its own,
and NOT a `predict` gate. The student who ignores it has still watched the whole
animation; the student who engages gets a reward.

Phrase it as a "what if" tied to what they just watched:
- (doubly-linked insertion) "What would have happened if line 4 ran before
  line 2?"
- (queue) "What if we tracked `rear` instead of `count` — how would you detect a
  full queue then?"
- (linked list) "What breaks if we don't keep a `tail` pointer?"

It never waits for or checks an answer. It is the WATCH-safe way to capture some
of the value interactive questions would give, and it is where the eventual THINK
version would later attach.

Use a challenge wherever the animation has an obvious "what if you did it wrong /
differently" — which is most of the misconception-targeted ones. Skip it where
nothing interesting branches.

---

## Node membership state

A NODES `state` is not only about traversal progress. Two "not settled yet"
states look different and mean different things — do not conflate them:

- **`pending`** — a node that is *part of the structure* but has not been
  **visited yet** by the current walk: a not-yet-recursed call in a tree, an
  unreached node in a list traversal. Rendered **dimmed** (low opacity). The
  structure owns it; the walk simply hasn't reached it.
- **`unlinked`** — a node that is *allocated and held by a pointer* but is **not
  yet a member** of the structure: a freshly created list node whose neighbours
  do not yet point back at it. Rendered as an **amber outline — border only, no
  background fill** — so it reads as clearly present yet visibly not settled. It
  is HEALTHY (never a danger triangle); it just hasn't been stitched in.

An `unlinked` node takes the **normal outline** the moment it becomes a full
member. For a doubly linked insertion that is when the insertion is **complete** —
all four links set and *both* neighbours pointing back — not merely when the node
first becomes reachable. (After `ins.prev.next = ins` the node is reachable going
forward, but `temp.prev` still points past it, so it is not yet a member.)

Concretely, in `lists-doubly-insert-order` node 25 is `unlinked` (amber) on the
initial state and through the first three assignments, and takes the normal
outline on the fourth and final assignment, `temp.prev = ins`, which sets the
last link. Do **not** use `unlinked` for a not-yet-visited traversal node (that
is `pending`), and do not use `pending`'s dimming for an allocated-but-unlinked
node — it is not faded; it is real and held.

---

## Memory-danger marker (red warning triangle)

A **red warning triangle (⚠)** marks any narration describing a **memory-integrity
violation**. This is a project-wide, cross-course convention — it appears in `ds`,
in both C++ courses, and anywhere memory is modeled. Its purpose is that students
learn to recognize a *category* of failure on sight: red ⚠ always means "memory
just went wrong," whether it is a dangling pointer in aCpp or a corrupted list in
ds.

### What qualifies (and what does NOT)

The triangle means specifically: **the program's memory is now in an invalid or
unrecoverable state.** Three distinct diagnoses, all red, but do not conflate them
— naming the right one is part of the lesson:

- **Leak / unreachable** — a node or object that NO pointer reaches anymore (e.g.
  an insertion that overwrites `head` before saving the old first node). The
  object still occupies memory but can never be used or freed.
- **Structural corruption** — links are internally inconsistent: a node points to
  itself, or one direction of a bidirectional link was updated and its partner
  was not. The object is still reachable, but the structure is broken.
- **Bad access** — dangling pointer (points at freed / out-of-scope memory), write
  through an uninitialized or null pointer, use-after-free, double-free,
  out-of-bounds write.

Do NOT mark (these are bugs, but not memory corruption — marking them dilutes the
signal): logic errors, off-by-one that reads the wrong value, integer-division
truncation, wrong output, a healthy pending node held by a pointer.

**Important false-alarm to avoid:** a freshly allocated node held by a pointer and
waiting to be linked in is NOT in danger — it is healthy. In
`lists-doubly-insert-order` (correct order), node 25 is held by `ins_pt`
throughout and is inserted safely; it is never "lost." That animation's correct
WATCH trace has **no** danger moment and gets **no** triangle. (The corruption
only arises in the wrong insertion order — self-referential pointers, un-updated
neighbor — which belongs to the deferred THINK/buggy material, not the WATCH
build.)

### How to author it

Narration is normally a plain string. To mark danger, write narration as an array
of segments; any segment can carry `danger: true`:

```js
narrate: [
  "curr advances past the target node.",
  { danger: true, text: "Nothing points to that node now — it is leaked." }
]
```

The engine renders a danger segment with a leading red ⚠ and the danger-red
color (`--error`). Plain-string narration is unchanged and is what nearly every
step uses; reach for the segmented form only when a line describes a memory
violation.

Optionally, when the **code line itself** is the culprit (rare — usually the code
is valid C++ and only the runtime consequence is fatal), set `dangerLine: true`
on the step to tint the highlighted code line red instead of the normal blue.

### Diagnosis, not just alarm

Where practical, the danger narration should name *which* violation it is —
"leaked and unreachable", "the list now points to itself", "dangling: p refers to
freed memory" — so students learn to distinguish the three diagnoses above, not
just that "something is red."

---

## Steps vs. notes — the core authoring separation

Two different things, kept strictly apart — plus one required exception (step 0):

- **Step 0 is the initial state, and it is REQUIRED.** Every animation opens on a
  step where **nothing has executed yet**: the starting configuration, before line
  1 runs. No code line is highlighted (nothing has run). Show the true starting
  state, which includes pointers that *already* hold things — e.g. a node about to
  be inserted is allocated and **held by its owning pointer** (`ins_pt` → the new
  node), with the node's OWN links still null and no linking arrows into the list
  yet. The owning pointer is part of the initial state (the node is allocated, not
  floating in the void); the links the algorithm will create are NOT yet drawn.
  This is the "before" picture the student needs in order to see what later steps
  change. It is NOT a phantom step; it is the debugger's "stopped before the first
  line" state. Do not fold it into the first executing step — an animation must
  never open mid-execution.
- **A step is an execution.** After step 0, every Next-click advances one real
  executing line, with that line highlighted. Steps are the algorithm running.
- **No mid-sequence phantom steps.** The banned thing is a step *between*
  executions whose only job is to show commentary (e.g. a "here's a common
  mistake" screen sitting between line 2 and line 3, executing neither). A step
  with no highlighted line is legitimate ONLY as step 0 (nothing has run yet);
  anywhere in the middle, a no-execution step is wrong — that content is a note.
- **A note is commentary.** Setup framing, a common-mistake warning, the
  post-watch challenge, a memory-danger observation — none of these are execution,
  so none of them are steps. They live in the **teaching-note box**, a region near
  the narration bar, separate from the step flow. (The setup note belongs on
  step 0.)

This separation is what makes "Next Step" mean an actual next step, while still
giving the student the initial "before" state and one consistent home for all
non-execution commentary.

### How notes behave

- A note **attaches to a specific step**. When the student reaches that step, the
  note appears; when they leave it, the note disappears. Notes are **transient,
  not persistent** — synchronized to the moment they're relevant, then gone.
- On steps with no note, the note box is **empty and collapses** (takes no space;
  the layout reflows). A note *appearing* is meant to feel like the animation
  saying "pay attention to this."
- An animation may have **several** notes across its run — e.g. a setup note on
  step 1, a warning note on the tricky line, a challenge note on the final step.
  Each shows only on its own step.

### Authoring a note

Attach a note to a step via a `note` field on that step. Like narration, a note
may be a plain string or an array of segments so it can carry a memory-danger
segment (`{danger:true, text}` → red ⚠; see "Memory-danger marker"):

```js
// step where ins.prev = temp.prev executes; carries the ordering warning
yield {
  line: 2, tag: 'assign',
  narrate: "ins.prev = temp.prev — ins.prev takes temp.prev, which is 12.",
  note: "A common mistake is running temp.prev = ins first. Then ins.prev = " +
        "temp.prev copies a pointer that already points back at ins, so ins.prev " +
        "becomes ins itself, and line 4 dereferences a pointer that was never set. " +
        "Setting ins.prev and ins.next first (as here) avoids this.",
  panels: { ... }
};
```

The note box shows that text only while this step is current, then collapses.

### What goes in a note vs. narration

- **Narration** (the bar): describes what THIS line does, right now. One or two
  sentences, present tense, about the executing statement.
- **Note** (the box): framing or meta-commentary that isn't the line itself —
  the setup, a "common mistake" aside, a "what if" challenge, a danger diagnosis.

If commentary is about the *statement executing*, it's narration. If it's about
the *algorithm, a pitfall, or a what-if*, it's a note.

### Narration style — precise CS language, not casual paraphrase

**General rule: prefer the precise technical formulation over the comfortable
informal one, whenever a precise one exists.** These animations teach mechanism;
a casual verb that reads smoothly but blurs *what actually happens* teaches the
wrong mental model. When choosing a verb, ask "does this name the exact operation,
or just gesture at it?" — and pick the one that names it.

- "points to" / "is the same as" / "is assigned" / "→", not "faces", "grabs",
  "hooks up", "takes", "stitched"
- "is copied" / "references the same object", not "becomes", "turns into", where a
  copy or alias is what actually occurs
- "is unreachable" / "no pointer refers to it", not "is lost" (which wrongly
  implies an error)
- name concrete on-screen values ("which is 12") rather than abstractions
- present tense, one idea per line

Informal phrasing is acceptable ONLY when no precise formulation is being
sacrificed — e.g. "the loop runs three times" is fine; it is not blurring a
mechanism. The rule is not "sound formal"; it is "never trade precision for
readability." When both are available, precise wins; when a precise term would be
needlessly obscure and a plain one is exact, plain wins.

#### Applied to pointers

Narrate pointer assignment as **aiming / following**, not with vague transfer
verbs. `p = q` is "p now points where q points," not "p takes q" — "takes" is
ambiguous (copies? moves? removes?) and hides the mechanism the animation exists
to teach. Keep one consistent physical model across every animation: pointers
*point*, *aim at*, and are *followed*.

- Assignment: "ins.prev now points where temp.prev points — to 12."
  (NOT "ins.prev takes temp.prev.")
- Dereference: "Follow ins.prev to 12, then set its next to ins."
  (Read `a.b.c` as a motion: follow a to its target, then act on that target.)
- Retargeting: "temp.prev now points to ins" — and, on a closing step, name the
  completed invariant tightly: "temp.prev now points to ins. 25 ↔ 37 is now linked
  in both directions." Prefer precise pointer state ("points to", "is the same as",
  "→", "↔") over metaphor ("faces", "stitched", "hooks up").

Where pointer aliasing matters pedagogically (two names for one object), say so:
"now both ins.prev and temp.prev point to 12." Consistency of metaphor lets the
student build one mental model instead of switching between "assignment" and
"aiming."

Otherwise: present tense, one idea per line, name concrete values ("which is 12")
rather than abstractions where a real value is on screen.

---

## Loop controls — "step out" and "run to end" (deferred until first loop)

Some animations have loops, and stepping through all iterations one click at a
time is tedious. Two debugger-style jump controls help, and both reuse the
existing snapshot mechanism (every step is already a stored snapshot, so a "jump"
is just moving the step index to a marked target — the same primitive that makes
Back free).

- **Step out** — jump forward to the step where the current loop exits. A step
  inside a loop carries `exitTarget: <step index or label>`; when present, the
  engine shows a **"Step out ⤴"** button that advances the index straight to that
  step. The intervening iterations are skipped (the student can Back into them if
  curious).
- **Run to end** — jump to the final step. Trivial variant of the same primitive;
  offer it for students who have grasped the idea and don't want to keep clicking.

Both are optional per animation and only appear when applicable (Step out only on
steps that declare an `exitTarget`).

### Explicitly NOT built: "go to clicked line"

Do not implement click-a-line-to-jump-there. These animations are pre-computed
traces, not a live program with an execution engine: a source line may be visited
zero times, once, or many times (a loop body), so "go to line 14" has no
well-defined target — which of the visits? Defining it as "the next time this line
is reached" is buildable but adds real complexity and a clickable-code UI to
support a gesture that is ambiguous exactly inside loops, where beginners most
need clarity. It also works against the purpose: these are guided, can't-get-lost
walkthroughs for students who don't yet understand, not power-tools for students
who already do. Back/Next already let a student re-reach any line with full
context. Skip it.

### Timing

This is **deferred** — build the engine support when the first loop-containing
animation is authored (e.g. the bCpp/bJava loop modules, or stacks-postfix-eval),
not before. None of the early Phase-1 animations (list ops, recursion traces) need
it. The convention is recorded here so it is consistent when it does get built.
