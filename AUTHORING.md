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
States: `pending`, `entering`, `active`, `exited`. Snapshots include
not-yet-visited nodes as `pending`, so layout is computed over the whole
structure and nodes never jump.

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
