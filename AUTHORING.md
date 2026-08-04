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

Five renderers plus CALLSTACK. If you want a seventh, check first whether it is one
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
- **A frame is ONE line — the call itself.** `fn(name = value, …)`, formed from the
  function name, its parameters as `name = value`, comma-separated, in parentheses.
  A frame with no parameters renders as just `main()` — no placeholder row, no
  "no locals" line. This keeps a frame one line tall, so the panel's height is the
  frame *count*, not padded slots.
- **Push on call**, already showing bound argument values — `ADD` calling
  `INSERT(count, value)` pushes a frame reading `INSERT(index = 3, value = 40)`.
  This is how the ADD-is-INSERT lesson becomes visible.
- **Pop on return.**
- **Locals are NOT part of the call**, so they do not go inside the parens. A frame
  that has locals (a loop `i`, a running `result`) shows them on **continuation rows
  below** the call line — and only frames that have them grow past one line. Author a
  local by tagging its var `kind: 'local'` (or listing it in the frame's `locals`);
  parameters are the default and render inline.
- A local that finishes (loop `i` after the loop) **stays greyed** in the frame
  until the function returns — it doesn't vanish mid-frame.
- The **active** parameter or local gets the blue activity fill on the step it changes.

**Author it whenever an animation steps into a function.** Show `main` as the driver
so calls have a visible origin. It is *the whole point* of several beginner-course
animations (functions-call-return, value-vs-reference, recursion).

The step's `line` highlight and the CALLSTACK stay in sync: when the highlight
enters a function body, that function's frame is the active one.

**Frame boxes size to content (width rules).** A frame box is as wide as its widest
row needs — the one-line call, or a local's continuation row — and never narrower.
**The call line never wraps**, and **a parameter value is an atomic token**: breaking
`"a)(b"` across two lines makes it unreadable and the frame taller, the opposite of
what the width rules are for. All frames in the panel share one width (the widest
frame's) so their edges are not ragged. A value genuinely too long for a reasonable
width **truncates with an ellipsis** rather than wrapping or dragging the whole panel
wide.

**The panel is never the tallest thing in its column.** With one-line frames and the
2-frame ceiling, "Function calls" is a small panel (~2 lines of frames plus the
2-row book floor); it does not stretch to fill, align to a neighbour, or reserve
empty frame slots. If a column has a taller panel it is the code, the structure
region, or a state strip — never the call stack.

**Height is CAPPED at a ceiling of 2 frames — the CALLSTACK scrolls; it does not
size to its maximum.** A call stack's depth has no natural upper bound (a deep
recursion is ten frames), and even a shallow trace's *typical* depth is usually 2
(`main → f`), reaching a third only briefly inside a nested call — reserving for that
exception wastes the space for most of the animation. The panel is fixed (master
invariant) at `min(deepest reached, 2 frames)`: below the ceiling it is the actual
depth (never empty frame slots); at or past it, it **scrolls to keep the running
(top) frame visible**, the same follow-the-highlight the structure region has. This
generalises: **any panel whose content has no natural upper bound gets a ceiling plus
internal scrolling** (structure region, CALLSTACK); panels with a genuinely known
maximum (a 4-cell array, a 4-box strip) size to that maximum. CALLSTACK was long
misfiled as the second kind.

Because the code panel receives *whatever the layout leaves it* (it has no height of
its own — see "Panels flow across both columns"), capping the CALLSTACK actually
shrinks the code panel and the stage: less height in the right column means the
balancing gives the code panel less, down to its 15-line floor. That is the point —
the CALLSTACK ceiling is one of the levers that keeps the whole screen compact.

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
| Panel breathed on every call and return | CALLSTACK sized to content | capped at its 2-frame ceiling, scrolls past it |
| Blank rows below the last line of code | code padded to 15 lines | floor is min(15, listing length); a short listing shows in full |
| Output panel swallowed the column | STREAM sized to its full 18-line max | capped at its line ceiling, scrolls past it |
| Panel stretched with an internal void | a panel grown to fill leftover column space | only code absorbs slack (up to its listing); leftover stays empty |

**When adding any renderer or panel, ask: can this change size between steps? If yes,
it is wrong.** Reserving space that is sometimes empty is always correct and always
cheap. Recalculating on an actual window *resize* is fine; recalculating because the
*content* changed is the bug.

Corollary, learned the same way: **unused space has no cost.** Where a panel can take
more room without pushing anything off screen, it should — a fixed size that leaves a
visible hole is as much a defect as one that overflows. **Floors and ceilings, not
fixed values.**

## Panels flow across both columns

The author declares panels in **reading order** — what the student watches first,
bookkeeping and machinery last — and the **engine places them** (`layoutStage`). It
resolves ONCE on load (and on a real window resize) and holds; nothing re-flows as
steps advance.

- Panels flow in declaration order down the **right** column. When the right column
  reaches the balanced height, the remainder continues in the **left** column,
  **beneath the code panel**.
- The **code panel** anchors the top of the left column and takes its **15-line
  floor**, never the full column height. Earlier builds pinned code to the full
  left-column height, so a five-panel right column stretched it to 37 lines, most of
  them dead weight — that is the bug this rule fixes.
- **Resolution order** (this is what makes the ceilings below bite): bookkeeping
  panels claim their sizes first (each sized to content, capped where noted); the
  structure region takes what it needs up to its ceiling; the code panel takes its
  floor; any slack left over in the left column goes to the code panel — the only
  panel that always has more listing it could usefully show (but never past the
  listing's own length: a short listing does not stretch).
- **No panel stretches to fill leftover space.** Only the code panel absorbs slack,
  and only up to its listing's length. Once every panel has taken its content size
  and the code panel has grown to show as much of its listing as fits, any space
  still left over stays **EMPTY at the bottom of the column**. Empty space below the
  last panel is correct; a panel stretched with an internal void is not. The two
  columns therefore usually have *ragged* bottoms, and that is fine — the stage is
  driven by the taller column's real content, and the shorter column simply ends
  where its content ends. (The structure region is bounded by its ceiling, never
  grown to fill; the STREAM is capped and scrolls, never grown to fill; the call
  stack is capped and scrolls, never grown to fill.)

### The structure region has a ceiling

**Structure panels** are the CELLS/NODES/CHART panels showing the data structure the
animation is about — the thing whose shape the student reads. They are the only
panels whose height cannot be predicted from the content file. A NODES/CHART panel is
a structure panel by default; a CELLS panel is bookkeeping by default (it is more
often an auxiliary strip) and opts in with `structure: true` — the array or stack it
*is* the structure of.

- The structure region occupies at most **half the stage height** — a share, not a
  pixel count, so it scales with the viewport.
- **Multiple structure panels share that region HORIZONTALLY, side by side — never
  stacked.** Two views of one structure (a heap's tree view and its array view) must
  stay side by side or the correspondence that is the whole lesson is lost. A single
  structure panel fills the region width; several are each sized to their own content
  width.
- A structure that does not fit its ceiling **scrolls internally** and **follows its
  active element** — the same "follow the highlight" the code panel has, so a student
  never hunts for the cell being modified. *Known limitation, accepted for now:*
  scrolling a large tree loses its shape; revisit at `heap-is-this-valid` /
  `trees-bst-operations`. The open-in-own-window link is the escape hatch until then.

### No panel may exceed the viewport width

Cut-off content is a hard failure — the student cannot scroll to it, pan to it, or
see it at all, unlike *scrolled* content which is always reachable. So:

- **The sum of a row's panel widths, plus gaps, never exceeds the stage width**,
  resolved on load. This is now achieved by giving the **structure** width priority
  and letting the code take what remains (see "Width rules") — not by capping the
  structure. A structure never scrolls horizontally.
- **When the row cannot fit side by side, it stacks — it never overflows.** If the
  widest non-code panel plus the code's char floor plus a gap exceed the stage, the
  two columns **collapse to one**: the code goes full width, then the structure
  region, then the bookkeeping panels, each stacked below the last. The page grows
  taller (always reachable), and no panel is pushed off the right edge or left
  overlapping its neighbour — off-screen is strictly worse than a taller page. This
  is resolved once, on load/resize, never mid-trace. The only case that no layout
  can rescue is a **single** panel wider than the whole stage (it overflows even at
  full width, on its own row); that is the too-wide content problem, reported not
  accommodated.
- **A panel claims the width of its content, not the space around it.** The width a
  panel reserves is measured at `max-content` — its widest rendered row — so a panel
  never demands blank space it will render empty (the code's floor is its widest
  *line*, not the wide empty column it happens to sit in).
- A **call tree** (or any NODES diagram) renders at its natural pixel size. It never
  scrolls **horizontally**; it may scroll **vertically** only if it is deeper than
  half the stage. It is never scaled to an unreadable smear or clipped at an edge. At
  **step 0**, with nothing active yet, a tree centres on its **root**.
- An **indexed array** (a non-compact CELLS box) does not wrap when narrowed — a
  wrapped `[0][1][2] / [3][4]` is the index-vs-position confusion drawn as a layout —
  and, sized at its natural width now, does not scroll either.

### The Variables strip flows horizontally

Variable boxes flow left to right, filling each row before starting a new one. A new
row starts **only when the next box will not fit** the available width; never stack
vertically by default, and never wrap while space remains on the current row. fib's
`n, level, depth, N` is four boxes on one row; a queue's `front, rear, ch` is three
on one row. This is the same for the `box` (label above value) and `row` (label
beside value) cell layouts — both flow horizontally.

**Only true variables belong in a Variables strip.** A derived expression — fib's
`n + level` — is not a variable and does not get a box; the relationship it expresses
(the invariant `n + level = N`) is taught in a note and in narration that points at
the values already on screen (the tree prints `level` and `depth` on every node), not
by adding a computed cell to a panel named Variables.

### Panel sizing policy — one table, not four call sites

Every panel body is **`flex: none` with an explicit height derived from its own
content**. The CSS default is `flex: none` (not `flex: 1`): a flex-grow default let
whichever panel had column space below it *stretch* to fill it, and that single
mechanism caused every "panel grew instead of sizing to content" regression — each
fixed one panel at a time. With `flex: none` no body can inflate past its assigned
height; `overflow: auto` still scrolls content that exceeds it.

The floor/ceiling for each panel type is **data**, in the engine's `SIZE_POLICY`
table, applied uniformly — not literals scattered across the layout code (which is
how the rule drifted). Adding a panel type is a new row in that table, not a new
branch:

| class | floor | ceiling | past ceiling |
|---|---|---|---|
| code | 15 rows | listing length (never more rows than the code has) | absorbs column slack |
| callstack | 2 rows | 2 frames | scrolls, running frame in view |
| stream | 2 rows | 8 rows | scrolls, newest line in view |
| structure | 2 rows | ½ the stage | scrolls, active element in view |
| strip (cells) | 2 rows | none (exact content) | — |

The 2-row floor keeps a panel from collapsing to a sliver; the floor is on the
content area (title + padding + ≥2 content rows). A **count** ceiling (2 frames, 8
rows) caps the body at that many rendered rows and scrolls the rest — one generic
mechanism, so `stream: {rows: 8}` was a one-line table change, not new behaviour.
The STREAM's ceiling exists because output is bounded but can still be large (fib
emits 18 lines); 8 rows shows a run of output as a block at a fraction of the cost,
and the newest line — the one the current step just printed — stays in view.

### STREAM is declared last

STREAM is what the program *emits*; every other non-code panel is state the student
*inspects*. Output reads as a continuation of the code that produced it, so declare
the STREAM panel **last** — after every structure and bookkeeping panel. The column
flow then places it at the end, which is the left column beneath the code panel once
the right column is full. This is a preference expressed through declaration order,
not a special case: where balancing puts it elsewhere, that is acceptable.

## Width rules — height is scarce, width is not

The height rules allocate vertical space strictly, because it costs the student
scrolling. Width is resolved the same way height is — **one pass, priority per panel
type declared as data in `SIZE_POLICY.width`** — not emergent grid behaviour. It
resolves ONCE on load (may change on a real resize) and holds; a panel's width never
changes as steps advance.

**The governing rule: a STRUCTURE PANEL NEVER SCROLLS HORIZONTALLY.** A student
reading a data structure must see its shape; a horizontally scrolled structure
teaches nothing. So structure has **width priority over the code**. (Vertically a
structure may still scroll — a deep tree past half the stage — but horizontally,
never, and never merely because the code took width it did not need.)

**Resolution order (`SIZE_POLICY.width`):**
1. `'natural'` — **structure panels** claim the width their content actually needs,
   uncompressed. Two structure panels in the region sit adjacent from the left, each
   at its natural width (not a 50/50 split), sharing the row's height.
2. `'natural'` — **fixed-content panels** (variable strips, CALLSTACK) claim their
   natural width — as wide as their widest content across the run, never the column.
3. `'content'` — **CODE** is bounded on BOTH sides by its own longest line. Its
   **ceiling** is that line (measured across *all* language tabs, plus a small
   allowance) — the panel is never wider than its widest line, so on a wide stage the
   leftover width falls **empty to its right**, the width analogue of the empty rows
   the 15-line height ceiling leaves below it (item "code needs a width ceiling").
   Its **floor** is `minCh` (~60) characters, applying only when the longest line is
   longer than that: a listing with lines past 60 chars is held at 60 and scrolls,
   because the structure has priority; a short listing takes only its own width,
   leaving the rest to the structure. Measuring across all tabs is the master
   invariant — switching pseudocode/Java/C++ must not change the panel's width.
4. `'column'` — **STREAM** matches the width of the column it sits in; sitting beneath
   the code, that is the code's width (capped to the same ceiling), so the two read
   as one column.

**The leftover is never redistributed.** Whatever width is left after the code takes
its longest line and the structure takes its natural width stays **empty at the right
of the row** — it is not handed to the code (that was the defect: a floor with no
ceiling let the code swallow it) nor to the structure (stretching it would undo the
"no panel off the viewport" fix). Empty at the right is correct, exactly as empty at
the foot of the shorter column is correct.

**If steps 1–3 cannot be satisfied side by side** — the widest non-code panel plus
`codeMin` plus a gap exceed the stage — the row **collapses to a single column**
(code, then the structure region, then the bookkeeping panels, stacked top to
bottom; each still at its own resolved width, the code still capped at its longest
line). Nothing is compressed and nothing overflows; the page just grows taller. This
is the resize-time fallback, resolved once on load, never mid-trace.

**Narrow viewports.** Two structure panels that will not fit side by side first
**stack vertically within their region** (each still at its natural width); if the
region is still too wide beside the code, the whole row collapses to the single
column above. A structure is never shrunk.

**The one unfixable case** — a **single** panel wider than the whole stage, which
overflows even at full width on its own row — is NOT a layout problem to accommodate.
It means the **animation is too wide** and must be redesigned (fewer cells, shorter
lines, a split view). The engine `console.warn`s it rather than compressing.
(No current animation trips this at the 1920×1080 target.)

## Panel count — a soft ceiling for `standard`

`beginner` caps at 3 panels, enforced in the engine. `standard` has a **soft ceiling
of 6** — not enforced, but an animation reaching for a 7th must justify it, and the
first two moves to try are **merging related state into one panel** or **cutting a
panel that is not earning its place**. A screen the student cannot hold in their head
teaches less than a smaller one, however correct each panel is. Never add a panel to
make a labelling point: a distinct row inside an existing panel, with a highlight, is
nearly always enough (the `n + level` invariant row lives inside Variables, not in a
panel of its own).

## Stable layout — bounded stage, internal scrolling, pinned footer

The animation must fit on screen and never reflow. Resolution-independent by
construction: bound the stage, divide it proportionally, let overflow scroll — never
grow the page. Design target is 1920×1080 at 100%.

**The stage has a bounded height.** It never grows past it regardless of panel
content. Do NOT hardcode to a screen resolution.

**Every panel scrolls internally within its grid cell.**

- **CODE: 15 lines is the FLOOR, and the floor is `min(15, listing length)`.** Show
  `min(listing length, lines that fit)` — as many whole lines as fit the left column
  once the other panels are placed. The 15-line floor applies **only when the listing
  is longer than 15**: a 9-line listing produces a 9-line panel (never padded to 15
  with blank rows), a 37-line listing shows at least 15 and as many more as fit. The
  panel never renders a blank row below the last line of code. `listing length` is the
  **currently displayed** language's line count, not the max across languages — a
  9-line pseudo listing is 9 rows even if the Java variant is 12. Switching the
  language tab **re-runs the layout** (a user action, like a resize), so a longer
  variant grows the panel *then*, never mid-trace; the panel WIDTH still measures
  across all languages so a long line never wraps and the width does not jump on
  switch. **Whole lines only** — never a
  half-height row clipped at the bottom edge, and never a sliver of the next line
  peeking in at the top. This is a sub-pixel trap: a *unitless* line-height (12.5px ×
  1.65 = 20.625px) is fractional, and scrollTop rounds to whole pixels, so no matter
  how the viewport is sized a fraction of a neighbouring line leaks in. The line
  height is therefore an **integer px** (`--code-line-h`), so the viewport
  (`lines × height`), the scroll boundaries, and the panel body all land on exact
  line edges; the follow-the-highlight scroll snaps its target to a whole-line
  multiple. **Resolve on load, hold constant**: switching
  language tabs or advancing steps must not change it. The highlighted line
  auto-scrolls into view, holding roughly the middle with context above and below —
  **and only when it would otherwise reach an edge.** Scrolling on every step is as
  disorienting as never scrolling. This matters most where a `main()` driver sits 20
  lines from the functions it calls.
- **STREAM: height is exactly its emitted line count.** An animation's output is
  fully determined by its trace, so the line count is *known* — size the panel to
  that many rows and fix it from step 0 (master invariant), derived from the content,
  never from the space available. fib emits 18 lines → an 18-row panel; A3 emits 3 →
  a 3-row panel. It does **not** cap-and-scroll, and it does **not** stretch to fill
  leftover column space (`flex:none` on a content height, not a `flex:1` min-height
  that would grab the space below it). If that makes the output the tallest thing in
  its column, the shorter column simply has empty space at its foot — correct, per
  "no panel stretches to fill." **Width is still full-column** (output line length is
  not predictable) — height is known and bounded, width is not; the two dimensions
  get different treatment deliberately.
- **CALLSTACK / any unbounded-depth panel:** fixed cell capped at its ceiling,
  internal scroll, newest content (the running frame) scrolled into view.

**Panels fill their grid cells; don't oversize a cell for little content.** A
two-value panel is a compact strip, not a tall boxed panel with a void. Content
top-aligns.

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
| `empty` | dashed/dim border, faint placeholder glyph | no meaningful value yet |

The member/stale distinction carries the weight — a student must read "no longer in the
queue" without effort. **Distinguish states by shape and outline, not brightness
alone**; two things differing only in opacity are hard to tell apart at a glance.

**One placeholder glyph, used everywhere.** The same mark serves an unwritten array cell
and a standalone variable with no meaningful value yet (`ch` before the first
assignment). There is no principled difference: both are declared storage holding an
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
- **Two markers on one cell** render side by side, overlapping neither each other, the
  index label above, nor the neighbouring labels. Common (a one-element queue has
  `front == rear`), not an edge case.
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
  title.
- **Iframe-aware** (`window.self !== window.top`): **embedded** → shown prominently, it's
  a lifeline ("⛶ Scrolling to see it all? Open in its own window"). **Standalone** →
  minimized or hidden.
- **Color: warn amber-orange (`--warn`)**, never error red, which would read as alarm.
  Styled clearly as a link.

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
