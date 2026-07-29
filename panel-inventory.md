# Panel Inventory & Engine Design

Consolidated across five courses: `bCpp`, `bJava`, `aCpp`, `aJava`, `ds`.
Derived from 25 existing animation files and five activity schedules.

---

## 1. The consolidation

Working course by course, I accumulated ~18 named panels. Most were the same
renderer under different names. The distinct renderers are **five**.

| Named during design | Actual renderer |
|---|---|
| code pane, class+main split view | **CODE** |
| array, sorting bars, hash buckets, 2D array, adjacency matrix, memory blocks, variable table, file bytes, union bytes, vtable | **CELLS** |
| linked list, doubly linked list, BST, heap-as-tree, recursion call tree, class hierarchy, object graph, GC reachability, UML class diagram, flowchart, adjacency list | **NODES** |
| console, file contents, event log | **STREAM** |
| growth curve, complexity comparison, ArrayList doubling | **CHART** |

Plus one **cross-panel overlay** (arrows/anchors) and one derived readout
(**METRICS**), which is not a panel so much as a projection of the step tags.

The reason NODES swallows so much: a flowchart, a UML diagram, a BST, and a
linked list are all *nodes with typed edges*. They differ in three parameters —
node template, edge template, layout algorithm — and in nothing else. Building
eleven renderers where one parameterized renderer suffices is exactly the
mistake the current 25 files make.

---

## 2. The five renderers

### CODE
- One or more listings; **language variants** (Java / C++) selected by a toggle.
  Step data says `line: 7`; the panel resolves 7 in whichever listing is shown.
  This is what lets one animation serve both `bCpp` and `bJava`.
- Multiple files (`Car.h` + `main.cpp`) as tabs or stacked, each independently
  line-highlightable. (`oop4.html` already needs this: `classLines` + `mainLines`.)
- Optional. Roughly a third of the `ds` animations have no code at all.

### CELLS
- A 1D or 2D grid of cells. Each cell: `value`, `label`, `role`.
- `role` drives color: `active`, `compared`, `swapped`, `sorted`, `probe`,
  `empty`, `stale`.
- `render` option: `box` | `bar` | `row`. A sorting bar chart and an array of
  boxes are the same data with different `render`.
- Named anchors on every cell, so arrows can point at them.
- **Serves:** arrays, parallel arrays, 2D arrays, hash tables, adjacency
  matrices, heaps-as-arrays, variable tables, stack frames, memory blocks,
  union byte views, vtables.

### NODES
- Nodes with typed edges. Parameters:
  - `layout`: `tree` | `flow` | `graph` | `linear` | `free`
  - node template: `plain` | `record` (a struct/node box with named fields) |
    `class` (UML compartments) | `shape` (flowchart rect/diamond)
  - edge template: `pointer` | `extends` | `aggregates` | `flow` | `weighted`
- Nodes carry named anchors (`node3.next`, `Person.name`).
- **Serves:** linked lists, doubly linked lists, BSTs, heaps-as-trees, recursion
  call trees, class hierarchies, object graphs, GC reachability, UML diagrams,
  flowcharts, adjacency lists.

### STREAM
- Append-only text. **Two directions**, which the current files get wrong:
  - `out` — program output
  - `in` — a prompt, a visible pause, a cursor, an echoed value
- The *pause* is a first-class visual event. Every `bCpp`/`bJava` assignment
  from A2 on is prompt-driven, and no existing file models input at all.
- A `fail` state for `cin`, which silently poisons every later read.
- **Serves:** console, file contents, event dispatch log.
- **Narration** (the prose bar under the stage, not STREAM itself) supports inline
  **danger segments**: a red ⚠ + `--error` color on any narration line describing a
  memory-integrity violation (leak, structural corruption, dangling/uninit/UAF/OOB
  write). Project-wide, cross-course. See AUTHORING.md "Memory-danger marker".
- **Teaching-note box** — a region near the narration, separate from the step
  flow, holding non-execution commentary (setup, common-mistake warnings,
  post-watch challenge, danger notes). A note attaches to a step, appears when
  that step is reached, and collapses when it isn't the current step. Steps stay
  purely executional; notes never advance the step counter. See AUTHORING.md
  "Steps vs. notes".

### CHART
- Series over n. Points, curves, a marker for current n.
- **Serves:** algorithm complexity (`ds` 3.1–3.7), ArrayList amortized doubling,
  linear-vs-binary comparison, heapsort vs quicksort.

### CALLSTACK
- A stack of **call frames** — a debugger's locals/stack pane. Each frame shows a
  function's name, its **bound parameters**, and its **active locals**, with live
  values. `main` is the bottom frame (the driver). Frames **push on call, pop on
  return**; the top (currently executing) frame is emphasized, callers below are
  greyed but present.
- Data shape: `{frames: [{fn, vars: [{name, value, role}], active: bool}]}` where
  a frame near the top is the running one. A var's `role` can carry the blue
  activity highlight (a local changing this step). The data model should allow a
  future `kind: 'copy'|'reference'` per parameter (for pass-by-value vs.
  pass-by-reference animations) without requiring it now.
- **Serves — and this is a load-bearing panel for the beginner courses**, where
  the call stack IS the lesson: `functions-call-return` ("control returns to
  where it left"), `functions-value-vs-reference` (arguments are copies),
  pass-by-value/reference, recursion (fib etc. — frames pushing/popping with their
  n/level bindings). Introduced on `lists-array-insert-delete` (ds A1) as auxiliary
  support (main → ADD → INSERT), where parameter binding across frames needs to be
  visible.

---

## 3. The overlay: anchors and arrows

**Arrows are cross-panel.** A pointer variable lives in CELLS; the node it points
to lives in NODES. `cpoint1.html` faked this with four hand-tuned Bézier curves
and `id="arrowhead2"` collisions — frozen geometry that breaks if a font size
changes.

Correct model:
- Every renderer publishes named anchors (`p`, `node3.next`, `bucket[4]`).
- A single SVG overlay sits above all panels, resolves anchor → live coordinate
  at render time, and draws.
- Arrows are **data**: `{from: 'p', to: 'node3', style: 'pointer'}`.

Build once. Serves: every C++ pointer animation, every `ds` linked structure,
`aJava` garbage collection, `aCpp` aggregation. This is the single highest-value
piece of engine work, and nothing in the current 25 files has it.

---

## 4. Steps, drivers, and tags

### Steps are yielded, not stored

`racebubsel.html` hand-rolled a resumable state machine (`bState`, `bI`, `bJ`,
a switch) so it could advance one statement at a time. JavaScript generators do
this natively:

```js
function* bubble(a) {
  for (let i = 0; i < a.length - 1; i++)
    for (let j = 0; j < a.length - i - 1; j++) {
      yield {line: 4, tag: 'compare', cells: {[j]: 'compared', [j+1]: 'compared'}};
      if (a[j] > a[j+1]) {
        [a[j], a[j+1]] = [a[j+1], a[j]];
        yield {line: 5, tag: 'swap', cells: {[j]: 'swapped', [j+1]: 'swapped'}};
      }
    }
}
```

A generator that yields hardcoded literals *is* a step array. So one driver
handles all three execution models found in the existing files:

- **precomputed** — generator yields literals (the `file*` / `oop*` family)
- **live** — generator yields as it computes (`bubble`, `selection`, `cpoint*`)
- **race** — *n* generators, `.next()` in lockstep (`racebubsel`, `racelinbin`)

Race is not a feature. It is *n* generators instead of one.

### Metrics are derived, never incremented

`racebubsel` maintains `bStatements`, `bSwaps`, `sStatements`, `sSwaps` by hand,
with `bSwaps++` buried in a branch. Every counter is a bookkeeping obligation at
every mutation site.

Instead: each yielded step carries a `tag`. The engine counts tags. Statements,
comparisons, swaps, probes, node visits — all free, all consistent, and a new
counter in year three requires touching no algorithm.

Note: `racebubsel` decides its winner on **statements**, while `aCpp` A1 asks
students to return **exchanges**. Both are right and both should be displayed.
Tags make that a non-choice.

### Step types

- `step` — normal
- `predict` — pauses, asks "what happens next?", offers 2–3 choices, then runs.
  Replaces the misconception-trap framing for CS1. Prediction is engagement;
  being shown you were wrong before you guessed is discouragement.
- `checkpoint` — narration only, no state change

---

## 5. Profiles

Not tone. Enforced constraints, per animation.

| | `beginner` (`bCpp`, `bJava`) | `standard` (`aCpp`, `aJava`, `ds`) |
|---|---|---|
| Memory addresses | never shown | shown |
| Max panels | 3 | unbounded |
| Back button | required | required |
| Default step mode | manual | manual |
| `predict` gates | encouraged | optional |

**The Back button does not exist in any of the 25 current files.** All have
`nextStep()` and `resetDemo()`; none have `prevStep()`. A beginner who misses a
step must restart. Cheap fix, large affective payoff.

---

## 6. Coverage check

| Renderer | `bCpp` | `bJava` | `aCpp` | `aJava` | `ds` |
|---|:-:|:-:|:-:|:-:|:-:|
| CODE | ● | ● | ● | ● | ◐ |
| CELLS | ● | ● | ● | ● | ● |
| NODES | ◐ | ◐ | ● | ● | ● |
| STREAM | ● | ● | ● | ● | ◐ |
| CHART | ○ | ◐ | ○ | ◐ | ● |
| arrows | ○ | ○ | ● | ● | ● |
| `predict` | ● | ● | ◐ | ◐ | ◐ |

● required ◐ used ○ rare

Every renderer is used by at least three courses. None is a one-off. If any
renderer here is only ever used once, it should not be in the engine.

---

## 7. Design tokens

The 25 files contain **188 distinct color values**, including four blues doing
the same job (`#4a90e2`, `#3498db`, `#4fc1ff`, `#00d4ff`) and a purple gradient
that competes with the blue theme in some files and not others. CSS per file
ranges 210–357 lines, nearly all of it duplicated.

Target: ~15 custom properties in one `styles.css`.

---

## 8. Known bugs to fix once

- **Leaked timers.** Seven of thirteen repo files call `setInterval` /
  `setTimeout` and never `clearInterval`. Reset during autoplay leaves two step
  loops racing. Fixed once in the engine, fixed everywhere.
- **Duplicate SVG marker ids** (`arrowhead`, `arrowhead1`, `arrowhead2`) —
  disappears with the overlay.
- **HTML embedded in step data** — `oop5` carries 183 markup fragments inside
  its step objects, `oop4` carries 128. No engine can render that generically.
  This is why the OOP animations were the painful ones.

---

## 9. Reuse across courses

- `bCpp` and `bJava` are the **same course in two languages**, assignment for
  assignment. A1 and A3 are literally the same problem statement with `cout`
  swapped for `println`. With language variants in CODE, ~12 of ~15 animations
  serve both courses from one content file.
- `animation1.html` (Rectangle constructors) already serves `bJava` module 6.4
  and `aJava` module 1.
- Function overloading is `bCpp` A6 and `aJava` A1 — one animation, two courses.
- GC reachability (`aJava`) and linked-list traversal (`ds`) are the **same
  renderer** pointed at different data.

Five courses × ~15–18 = ~85 nominal. Distinct content files: **~65**.

Consequence for repo layout: content files must be addressable independently of
the course that ships them.

---

## 10. Resolved

- **Static routes.** One real file per animation, twelve lines each, linking a
  shared `engine/`. Generated from the manifest but committed, so a broken
  generator can't take down a live page mid-semester.
- **Naming.** Flat namespace, `<domain>-<what-you-see>`, no course code, no
  chapter, no ordinal, no language suffix. `courses.json` carries ordering,
  module, and which assignment each animation backs. Old filenames stay as
  `<meta refresh>` stubs so existing Canvas iframes don't go blank.
- **Two traces**, always, for consistency. Where they coincide, one generator is
  bound to both names. Each trace addresses its own listing's line numbers, so
  no cross-listing line-alignment discipline is needed.
- **`ds` listings: Java + C++ + true pseudocode.** The Pascal in the current
  notes (`ptr = ^num_rec`, `ins_pt^.back_pt`) is retired. Pseudocode is
  canonical; Java and C++ are toggles.
- **CHART is required.** `ds7.html` grades a plot of execution time vs. n.
- **Parens and postfix stay separate.** Postfix teaches evaluation; parens
  teaches error detection, and `a)(b` is a misconception trap that naive
  counting cannot catch.
- **`ds` A6 (quicksort, KEY) may be animated directly.** `qs.html` already
  publishes the full partition walkthrough in ten frames. Nothing is withheld.
- **Only `ds` has hints pages.** The other four courses' misconception targets
  are inferred from assignments and are correspondingly less certain.

## 11. Content note: `recursion-fib-levels`

The invariant is **`n + level = N`**, constant at every node.

- `fib(n-1, level+1)` → `(n-1)+(level+1) = n+level` ✓
- `fib(n-2, level+2)` → `(n-2)+(level+2) = n+level` ✓
- `fib(n-2, level+1)` → `n+level-1` ✗ — the common student bug

The root cause: **`level` is not recursion depth.** `fib(2)` and `fib(3)` both
sit at depth 1, but at levels 2 and 1. Students assume level == depth, so they
write `level+1` on both calls.

The animation shows `level` and `depth` on every node so they visibly diverge,
pins `n + level = N` as a readout, and puts a `predict` gate on the second
recursive call. Choosing `level+1` runs the buggy version: the invariant breaks
and the indented trace collides. Then it resets and runs the correct one.

Verified against the expected output in `ds5.html`: level sequence
`0, 2, 4, 3, 1, 3, 2, 4, 3`, with the `n-2` branch evaluated first.

## 12. Still open

1. **20 of 23 `aCpp` animation pages are marked `data-published="false"`.** Lead,
   not finding — the attribute may be stale. Two minutes in Canvas settles it.
2. **No Canvas wiki page HTML has been seen.** One would turn the
   filename ↔ page mapping from inference into fact.
3. **`index.html` in the repo has zero links.** Not a directory page. Unclear
   what it is.
4. **Density and slate sizes** (~15–18 per course, ~65 distinct) are proposed,
   not ratified.
5. **`aCpp` A5 (Files, inventory program) is the one KEY assignment never
   discussed.**
6. **The `predict` gate is invented, not observed.** Nothing in the 25 existing
   files does it. `invalid_heap.png` suggests it fits the material; whether
   students engage or click through is Neven's call.
