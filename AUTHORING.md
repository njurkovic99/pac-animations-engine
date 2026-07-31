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

**Race is DESIGNED BUT NOT BUILT** (as of the third merged animation). It debuts on
`queues-count-vs-rear`, where it drives a *comparison*, not a competition: two
representations of the same queue, stepped side by side, no winner and no timing.
See "Race mode — lockstep comparison" below before authoring one.

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
structure and nodes never jump. `unlinked` is a **membership** state (see
"Node membership state" below), orthogonal to the traversal states.

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
- (queue) "What would the full test become if you gave up one cell?" — note that
  the older example here ("what if we tracked `rear` instead of `count`") is now
  *answered inside* `queues-count-vs-rear`, so it is no longer a challenge. A
  challenge must ask something the animation did NOT resolve.
- (linked list) "What breaks if we don't keep a `tail` pointer?"

It never waits for or checks an answer. It is the WATCH-safe way to capture some
of the value interactive questions would give, and it is where the eventual THINK
version would later attach.

Use a challenge wherever the animation has an obvious "what if you did it wrong /
differently" — which is most of the misconception-targeted ones. Skip it where
nothing interesting branches.

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
- On steps with no note, the note box is **empty and invisible** — nothing is
  painted (no border, background, or "note" label), so a note-less step reads as
  blank space. The box **keeps its reserved height** rather than collapsing, so
  a note appearing or disappearing never shifts the controls above it (see
  "Stable layout" — the controls must never move as steps advance). A note
  *appearing* is still meant to feel like the animation saying "pay attention to
  this," but it materializes in place without reflowing the page.
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

The note box shows that text only while this step is current, then goes blank
(its reserved space stays, so nothing above it moves).

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

#### Pointer vs. reference — language-aware vocabulary

C++ and Java have **different underlying models**, and the narration must respect
that rather than importing pointer vocabulary into Java:

- **pseudocode / C++**: a *pointer* **points to** an object. (`ins->prev`, `*p`.)
- **Java**: a *reference* **refers to** an object. Java has no pointers; saying a
  Java reference "points to" something is the exact kind of imprecision this
  course avoids.

So a few narration terms are **language-dependent**, swapped by the engine to
match the currently-selected listing. The author writes the canonical term; the
engine renders the language-appropriate word:

| meaning              | pseudocode / C++ | Java        |
|----------------------|------------------|-------------|
| the var→object bond  | points to        | refers to   |
| the variable         | pointer          | reference   |

Keep this map **minimal** — it is these one or two terms, not a translation
layer. Everything else in the narration is identical across languages. Mechanism:
a small marker in the note/narration text (e.g. a `⟨points-to⟩` / `⟨pointer⟩`
token) that the engine substitutes per selected language; if only pseudocode/C++
are shown, the C++ column is used. When neither term appears in a note, no
substitution happens and the note is language-neutral as usual.

This is the ONLY thing that varies in narration by language. Node names,
concepts, values, and structure are the same; only "points to / pointer" ↔
"refers to / reference" swaps. (Syntax like `->` vs `.` lives in the code panel,
never in prose.)

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

---

## Node membership state — "unlinked" (amber outline)

A node that is **not yet, or no longer, a stable member of its structure** renders
with an **amber outline** (rectangle border only — NOT a background fill). This is
the `unlinked` state. When the node becomes a full member — all of its own links
AND the structure's links back to it are set — it transitions to the normal
outline in a single change.

The amber signals membership status, and it teaches: the student sees at a glance
which nodes are "real members" versus "in transit."

Applies across the whole project, wherever nodes join or leave a structure:
- **Insertion** — the new node is `unlinked` (amber) from the initial state
  through every wiring step, resolving to normal only when the insertion is
  complete (all links in both directions set). In `lists-doubly-insert-order`,
  node 25 is `unlinked` on steps 0–4 and turns normal on the final step.
- **Deletion** — a node about to be removed becomes `unlinked` (amber) once the
  structure's links to it are being torn down.
- **Fresh allocation (C++ `new`)** — a just-allocated node held by a pointer but
  not yet wired into anything is `unlinked` until connected.

Colour: amber, **outline only**. Distinct from the `--error` red (memory
corruption) and from the amber *note box* — here the amber is a node border, a
different visual channel, so the two ambers do not compete. (If in practice they
read as competing, the node-membership amber gets its own token; keep it a border,
never a fill, to stay clearly separate from the note box.)

Note the difference from the `pending` traversal state: `pending` means "not yet
reached by the current walk" (dimmed, used in tree/graph traversal); `unlinked`
means "not a structural member yet/anymore" (amber outline). A node can't be both
in a way that matters — use `unlinked` for membership, `pending` for traversal
frontier.

---

## Node color channels — outline = membership, fill = activity

Two **independent visual channels** on every node. They never compete; both are
always shown.

- **Outline (border) = membership.** Green = a stable member of the structure.
  Amber = `unlinked` (not yet, or no longer, a member). Slow/stable: it reflects
  a lasting state and changes rarely — e.g. an inserted node is amber for the
  whole insertion and turns green ONCE, on the final step, when it is fully linked
  in both directions. Never let activity or partial linking flip the outline to
  green early.
- **Fill (interior) = activity.** Blue fill = "this node's contents are being
  modified on THIS step." Transparent otherwise. Transient: it flicks on for the
  step a node is touched, off the next step.

Because they are different channels (border vs. interior), a node shows both at
once. A node being wired while still unlinked is **amber outline + blue fill**
("still not a member, being modified right now"). A stable member being modified
is **green outline + blue fill**. This is intended — do not treat one as
overriding the other.

Do not use fill color for membership or outline color for activity; keep the two
channels separate so the student reads two clear stories: "where are we in
joining/leaving the structure" (outline) and "which node is the current line
touching" (fill).

## Naming — one identifier per thing, matching the code panel

A variable has exactly ONE name, used identically in the code panel, the
narration, the notes, and the pointer/variable panels. The **code panel's name is
canonical** — narration and panels must match it exactly. Do not introduce a
parallel name (e.g. code says `ins`, narration must say `ins`, never `ins_pt`).
Pick the name that reads well in the code and use it everywhere. Two names for one
thing silently makes students wonder if they are two things.

## No assignment references in student-visible text

The assignment an animation backs is recorded ONLY in the hidden `?a=` URL marker
(for the instructor). It must NEVER appear in any student-visible text — not the
title, subtitle, narration, notes, or panels. Printing "ds A10" (or any
assignment id) defeats the entire hidden-marker design, which exists so students
don't cherry-pick the assignment-backing animations. Titles and subtitles
describe the *topic*, never the assignment.

## Subtitles orient, they don't spoil

A subtitle (if used at all) gives plain orientation — what the animation is about
— in terms the student understands *before* seeing the code. It must not reference
line numbers, give away the punchline, or restate the lesson cryptically. Often
the title alone orients well enough and no subtitle is needed. Bad: "line 4
dereferences the pointer line 2 set." Good: "Inserting a node into a doubly linked
list" — or nothing.

## Metrics readout — hidden by default, labeled when shown

The tag-derived counter (`assign`, `swap`, etc.) is an INTERNAL mechanism. By
default it is **not displayed** — most animations have no count worth showing, and
the raw tag name (`assign`) is engine jargon, not student-facing language. Show a
counter ONLY when the count is itself the lesson (e.g. a sorting race counting
statements vs. swaps), and then label it in plain student-facing words
("statements", "swaps"), never the raw tag. An insertion, a traversal, a single
algorithm walk-through shows no counter.

---

## Stable layout — bounded stage, panels scroll internally, note pinned

The animation must fit on screen and never reflow as steps advance. This is a
general engine behavior, resolution-independent by construction: bound the stage,
divide it proportionally, let overflow scroll — never grow the page.

**The stage has a bounded height.** The stage (the panel grid) has a max-height
sized so a code panel shows roughly **12–15 lines** before scrolling. Below that
height everything fits; the stage never grows past it regardless of how much
content a panel holds. (The exact max-height and the row/column proportions are
tunable — start from "~15 code lines visible" and adjust. Do NOT hardcode to a
specific screen resolution; bound the stage and let proportion + scrolling handle
every viewport.)

**Every panel scrolls internally within its grid cell.** No panel grows the page.
A panel whose content exceeds its cell shows a scrollbar and auto-scrolls to the
relevant content:
- CODE: ~12–15 lines visible; the active (highlighted) line auto-scrolls into
  view as it moves. A 30-line listing scrolls; it does not stretch the cell.
- STREAM / call log / CALLSTACK / any accumulating panel: fixed cell, internal
  scroll, newest content auto-scrolled into view.

**Panels fill their grid cells; don't oversize a cell for little content.** A
two-value panel (e.g. count/capacity) should be a compact strip, not a tall boxed
panel with a void. Frames/content top-align within a cell — no large empty region
above or below.

**Controls and note are pinned below the stage, always visible.** The controls
(Back / Next / Play / Reset), the narration bar, and the note box sit below the
bounded stage and are ALWAYS on screen — they are never pushed below the fold by
panel content, at any viewport size. This is the safety net: on a short viewport
the panels show less and scroll more, but the student can always step and always
read the narration and note. Losing the note off-screen is the one failure the
layout must prevent.

**The controls never move as steps advance.** This is the most important
guarantee of the layout: a student clicking *Next* repeatedly must be able to
keep clicking the same spot without looking. The trap is that the stage is the
element that flexes to absorb the viewport (so it can shrink on a short viewport
and keep the note on screen) — which means anything that changes the height of
the footer *below* the controls would resize the stage and move the controls.
So the footer is held at a **constant height**: the narration bar and the note
box each have a fixed reserved height (`--narrate-h`, `--note-h`), and longer
content scrolls inside them rather than growing the box. A note appearing or
disappearing changes only what is painted inside its already-reserved slot, not
any height. With the footer constant, the stage no longer resizes step-to-step,
so the controls, narration bar, and note box stay put on every step — at every
viewport. (On the design viewport this reserved footer simply fills space that
was otherwise bottom slack; on a short viewport it trades a little stage height
for the no-jump guarantee, and the open-in-own-window link is the escape hatch
for anyone whose viewport is genuinely too short.)

The result degrades gracefully: tall viewport → everything roomy; short viewport
→ panels show less and scroll, but nothing overflows the page and nothing (least
of all the note) falls off. Design target is a 1920×1080 browser window at 100%;
the pinned note makes smaller viewports (and smaller Canvas iframes) degrade to
"cramped but complete" rather than "clean but truncated."

## Node sizing — fit content, never clip

A node box sizes to fit its content: the label plus any `meta` lines (e.g.
`level 3` / `depth 2`). Text must never be clipped by a too-small box. Either the
box grows to fit its meta lines, or meta text is constrained to fit — but nothing
overflows or gets cut off. Applies to all NODES templates (plain, record, class).

## Reserved word — "step"

In student-facing text, **"step" means one Next-click / one execution** — the
animation's own unit. Do not use "step" for anything else. For indentation say
"spaces" or "indent level"; for lines of code say "line"; for stages of an
algorithm say "stage" or name the operation. Saying "indented 0 steps" collides
with the execution-step meaning and confuses the student.

---

## ds course — source framing (use the instructor's own words)

The ds animations back a course with detailed lecture notes; narration and notes
should echo the instructor's actual framing, not paraphrase it. Key recurring
framings to reuse:

**Array-based lists (A1):**
- The invariant is **contiguity — no holes**. Every operation preserves it. This
  is the point of the whole assignment: an insert that would leave a gap (insert
  at index 7 when count is 5) is invalid precisely because it breaks contiguity.
- **ADD is INSERT at index = count** — not a separate operation. The instructor
  explicitly requires ADD to call INSERT. Show ADD as "insert at the end," which
  needs no shift because nothing follows.
- **"Make room before you write, or you overwrite."** The shift exists to open a
  slot; writing before shifting clobbers data. Frame the shift as overwrite-
  avoidance, not just "move elements."
- **"Update the count!"** — the most-forgotten step. Show count change explicitly
  on every operation.
- Range/border checking is the core misconception: "can you insert at index 6?
  index 7?" Show an invalid insert and the holes it would create.

**Linked lists (later animations) — the instructor's two "golden rules" of
pointer manipulation, to echo verbatim in narration:**
1. "First overwrite pointers where you could do the least damage — nil pointers."
2. "If you want to point to some node and you're not sure how, find a pointer
   already pointing to it and copy it."

**The array→list motivation** (payoff note bridging A1 to linked lists): a linked
list is "a dynamic analog to a static array"; the shift cost of array insert/
delete is "the price we pay" for the array's simplicity, and it is why linked
lists exist. Use this to end the array-list animation and set up the linked ones.

---

## CALLSTACK panel — showing function calls and parameter binding

When an animation steps *into* a function, the student must see what that function
was called with. Definitions alone (`INSERT(index, value)`) don't reveal the
bound values on this call — that's a comprehension hole. The CALLSTACK panel is a
debugger-style locals/stack pane that fixes it.

**Model (debugger-faithful):**
- A vertical stack of **frames**, newest on top, most-recent emphasized; caller
  frames below are greyed but visible. `main` is the bottom frame — the driver
  that calls the operations.
- Each frame shows the **function name**, its **bound parameters** (with values),
  and its **active locals** (loop variables, etc.).
- **Push on call:** calling a function adds its frame on top, already showing the
  bound argument values — e.g. `ADD` calling `INSERT(count, value)` pushes an
  INSERT frame showing `index = 3` (count's value) and `value = 40`. This is how
  the ADD-is-INSERT lesson becomes visible: the student sees count's value bind to
  index.
- **Pop on return:** finishing a function removes its frame; control returns to
  the caller's frame below.
- A local that finishes (e.g. loop `i` after the loop) **stays greyed** in the
  frame until the function returns — it doesn't vanish mid-frame.
- The **active local** gets the blue activity fill (same color rule as nodes/
  cells) on the step it changes.

**Author it whenever an animation steps into a function** — which is most of the
code-tracing animations, and it is *the whole point* of several beginner-course
animations (functions-call-return, value-vs-reference, recursion). Show `main` as
the driver so calls have a visible origin.

**Deferred (not now):** animated argument→parameter *flow* (a value visibly moving
from caller into callee) is polish; ship "frame appears with bound values" first.
And pass-by-value vs. pass-by-reference (a parameter that is a *copy* vs. an
*alias* of the caller's variable) is a later capability for the C++/Java courses —
the data model allows it, but don't build it until those animations need it.

The step's `line` highlight and the CALLSTACK stay in sync: when the highlight
enters a function's body, that function's frame is the active (top) one.

---

## Line highlight — active line vs. parked caller lines

When execution steps into a function, the line that *called* it must stay marked,
so the student always sees where the call originated and where control will
return. A real debugger drops the caller out of view; this tool keeps it, because
"a function is a detour you return from" is exactly what beginners miss.

This means the code panel has **two highlight states**, and they must be visually
distinct so "executing now" is never confused with "waiting to resume":

- **Active line** — the line executing now. The existing bright blue highlight.
- **Parked caller line(s)** — the call site in each caller still on the stack,
  waiting for the call to return. Rendered **dimmed**, using the **same greyed
  treatment the CALLSTACK panel uses for inactive (caller) frames**. Not the
  bright active highlight.

**Dim the whole caller chain.** If main called ADD which called INSERT, then while
inside INSERT *both* parked lines are dimmed: main's `ADD(40)` line and ADD's
`INSERT(count, value)` line. The code panel thus mirrors the CALLSTACK panel
exactly — every frame on the stack has its parked line dimmed in the code, and the
one active frame has its line bright.

**One consistent visual language across both panels: bright = running now, dim =
suspended, waiting to resume.** The dim style is the same token as the CALLSTACK's
greyed frames — not a new color. On return, a frame pops, its line's dim clears,
and the caller it returned to becomes bright/active again.

---

## CODE panel tabs — meaning differs by course

The CODE panel's tabs mean different things depending on the course, and a build
must use the right one:

- **Data structures (ds):** the course is language-agnostic — it teaches concepts
  shown in multiple languages. Tabs = **language variants** of the same logic:
  pseudocode / Java / C++. (The two reference ds animations do this.)

- **The four programming courses (bCpp, bJava, aCpp, aJava):** each course is a
  SINGLE language. There is NO pseudocode/Java/C++ toggle — a bCpp animation is
  C++ only, a bJava animation is Java only, etc. Do not add language tabs to these.
  Instead, tabs are reserved for **multiple source files** in one program:
  `main.cpp` vs `Student.h` vs `Student.cpp`, or `Main.java` vs `Account.java`.
  When a program spans files (common in the OOP animations — class definition in
  one file, driver in another), tabs let the student flip between source files.
  A single-file program has no tabs at all.

So: ds tabs = languages; programming-course tabs = source files (same language).
The CODE renderer supports both — the content file declares which by what it puts
in the listings map (language keys for ds; filename keys for the programming
courses).

---

## Pedagogical pattern — name the student's confusion first

When an animation demonstrates why a correct approach is correct — especially when
the correct way is counterintuitive — first **name the confusion the student is
already feeling**, then show why the intuitive-but-wrong way fails. Validating the
instinct ("yes, this seems backwards") before refuting it is far stronger than
presenting a bug cold: it connects to what the student was quietly wondering and
makes them *want* to watch the failure.

Structure:
1. A note that names the counterintuitive thing as a question: e.g. "Have you
   wondered why we make room by moving the outermost item first? It seems
   backwards. Watch what happens if we start from the inside instead."
2. Run the intuitive-but-wrong version; let the student watch it fail (with the
   memory-danger ⚠ if it corrupts data).
3. A payoff note that answers the opening question using what they just saw: "That
   is why we start from the far end — each value is copied before the next step
   overwrites it."

This is WATCH-safe (no gate, no interaction) and is the WATCH-mode way to get the
engagement a prediction question would give: curiosity is provoked by naming the
confusion, and satisfied by watching the consequence. Use it wherever a correct
method has a natural "why not the obvious way?" behind it.

---

## Race mode — lockstep comparison (debuts on `queues-count-vs-rear`)

Two (or more) generators advanced together and merged into one view. Its first use
is a **non-race compare**: two implementations of the same structure, side by side,
so the student reads the difference rather than a winner. Conventions:

- **The author aligns the racers, not the engine.** Every operation is broken into
  the same number of *phases* in both racers, and phase *i* in one lines up with
  phase *i* in the other. The engine merges frame *i* with frame *i* and nothing
  more.
- **Idle steps.** When one racer has nothing to do in a phase, it yields
  `{idle: true}`: its panel state carries over unchanged and **no line is
  highlighted in its code panel**. An idle must read as "this side had no work
  here," never as a stall. Idles are pedagogically useful — a blank where the other
  side runs a statement is a visible cost difference.
- **Line-align the two listings to each other**, not just across languages, so the
  differences appear as horizontal gaps at matching line numbers. Where one racer
  needs a statement the other doesn't, leave the other's line blank rather than
  closing up the listing.
- **Neither side is the villain.** When comparing two valid approaches, a
  divergence shows a *trade-off*, not a bug. Say what the losing side would need to
  work (a flag, a sacrificed cell), so a student who chose it isn't told they chose
  wrong.
- **No metrics counter by default**, even here. Show a count only where the count is
  itself the lesson (the sorting race), not merely because two things are running.
- **Shared vs. per-racer panels:** give each racer its own panels and keep them
  visually identical in every respect except the thing being compared. The
  comparison lands because everything else is held constant.

Side-by-side layout is otherwise discouraged on density grounds — reach for race
mode only when the *comparison itself* is the subject of the animation.

---

## Planned primitive — the index pointer (labeled marker over a linear structure)

A **labeled pointer that points at an array cell and moves as its index changes** —
the array-world analog of the linked-list pointer arrows. E.g. a marker labeled
`first` under cell 0 and `rear` under cell 3, tracking as they change.

**When it applies — the key distinction (index as loop mechanic vs. semantic
pointer):**

- **Raw array + a loop counter** → NO index pointer. A `for i = ...` counter that
  just walks the array to shift/scan elements is ephemeral bookkeeping, not novel
  (students saw it in the beginning course). Drawing it as a pointer would be
  hollow — it spatializes a throwaway variable. `lists-array-insert-delete`'s `i`
  is this case: the lesson is the shift cost, not the index. No pointer.
- **Array-based STRUCTURE + semantic indices** → YES, this is what the pointer is
  for. When an index *defines the structure* — persists between operations, carries
  meaning, and manipulating it IS the algorithm — it deserves a labeled moving
  pointer. A queue *is* "an array + `first` + `rear` + wraparound"; those indices
  are the structure. A stack is "an array + `top`."

The unifying principle: **the index pointer visualizes the semantic indices that
turn a raw array into a data structure.** It belongs to array-*based structures*,
not to the raw array.

**Debut: `queues-count-vs-rear` (ds A2)** — where `front`/`rear` are semantic,
persistent, and are the whole lesson (including the full-vs-empty ambiguity two
indices create, and count-vs-computed-from-indices). Note that A2 debuts the race
driver at the same time; it is a two-capability build, not a pure inherit. Build and prove the primitive
there, where it is load-bearing. The stack animations (`top`) inherit it. Also
useful later for binary search (`low`/`mid`/`high` converging) and the sorting
animations (`i`/`j`), where moving index markers are central.

**Deferred until then** — do not build it on the raw-array animation. Recorded so
the queue animation introduces it deliberately as its natural new capability.

---

## Open-in-own-window link (every animation, iframe-aware)

Canvas steals a large fixed band of vertical space (nav, page title, chrome —
~300px) before an embedded animation even begins, at every resolution. Rather than
fight this, every animation carries a self-link that opens it in its own browser
tab, where there is no Canvas chrome and the animation gets the whole window
(roomy even at 1366×768). This is the escape hatch that makes Canvas fit a
non-problem: the embedded view can be a little cramped because one click gives the
full view.

**Behavior (built into the engine — every animation inherits it):**
- A small control links the animation to **itself** with `target="_blank"` (opens
  in a new tab). Placement: the animation **header**, near the title.
- **Iframe-aware.** The animation detects whether it is embedded
  (`window.self !== window.top`):
  - **Embedded (in Canvas):** the link is shown **prominently** — it's a lifeline.
    Text e.g. "⛶ Scrolling to see it all? Open in its own window".
  - **Standalone (already full-window):** the link is minimized or hidden — you're
    already full-window, no need to shout.
- **Color:** use the **warn amber-orange (`--warn`, #e0a33a)** so it stands out and
  doesn't blend into the body text — but NOT the error red (`--error`), which would
  read as alarm. Style it clearly as a link (icon + underline on hover) so it reads
  as a helpful clickable hint, not a warning about the content. (If in practice the
  amber reads as related to the danger/unlinked amber, give the link its own token;
  keep it in the amber-orange family, not red.)

**Why iframe-aware matters:** the prominent hint is only useful when the animation
is cramped inside Canvas. Standalone, it's noise. Detecting the iframe lets the
same animation be a lifeline when embedded and clean when opened directly.

This dissolves the "how far do I accommodate low-res screens" question: make the
embedded view fit reasonably for the majority, and the full-window link covers
everyone whose viewport is too short — at any resolution.
