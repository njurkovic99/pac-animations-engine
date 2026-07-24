# HANDOFF — pac-animations

Written at the end of the design phase, for the first Claude Code session working
in the real repo. The engine and two animations exist in the tarball
`pac-animations-engine.tar.gz`. Unpack that as the baseline, commit it, then work
from here.

Read `PANEL-INVENTORY.md` (why the engine is shaped this way), `SLATES.md` (what
to build), and `AUTHORING.md` (how to author one content file) first. This
document is the delta on top of them: decisions taken after the engine was built,
and the order to build in.

---

## State of the code

Built and trace-verified in Node, **never rendered in a browser**:

- `engine/` — driver, five panel renderers, arrow overlay, styles (15 tokens).
- `content/recursion-fib-levels.js` — ds A5. Reproduces the ds5.html expected
  trace exactly (level sequence 0,2,4,3,1,3,2,4,3). Has a predict gate that
  branches into the students' real bug (`level+1` instead of `level+2`).
- `content/lists-doubly-insert-order.js` — ds A10. Four-line doubly-linked
  insertion; buggy order makes node 25 self-reference and go unreachable.
- `build-preview.mjs` — bundles one animation to a single double-clickable HTML
  (browsers block ES modules over file://). Deployed pages use the real modules.

**First task is visual and already specified:** the arrows in
`lists-doubly-insert-order` overlap badly (prev/next collide into diamond shapes
between nodes; the head→25 arrow crosses under the list). See the screenshot in
the chat. Fix `engine/overlay/arrows.js`: route next-pointers above the row and
prev-pointers below without shared midpoints, flatten the bows, keep self-loops
compact. This is the task that proves the screenshot→inspect→fix loop.

Two decisions baked into the engine, both reversible, both worth a look when
rendered:

- **Steps are snapshots, not deltas** — this is what makes Back free.
- **The n-2 branch is evaluated first** in `recursion-fib-levels`, matching
  ds5.html. Note this *conflicts* with `recurs2.gif`, which numbers a
  left-to-right walk. The hints page's own second exercise ("redo right-to-left")
  suggests both orders are wanted; the animation can toggle. Flagged for Neven.

---

## Decision 1 — temporal build order (build by teaching week, not by course)

One schedule row = one teaching week, and rows align across all five courses. So
build **week 1 of every course, then week 2**, etc. This buys every class a few
weeks of runway simultaneously instead of finishing one course while four are
empty. The first ~24 animations (about a third) cover week 1–4 of all five.

Shared animations are built the first week ANY course needs them, then reused —
and they naturally fall early, so reuse mostly takes care of itself.

Build order (● = shared across courses; build once, at first need):

```
WEEK 1   intro-compile-run ●            objects-constructor-init ●
         lists-array-insert-delete
WEEK 2   functions-overload-resolution ●  sorting-race-statements ●
         io-single-println-escapes   queues-count-vs-rear
         searching-linear-vs-binary  sorting-bubble-selection
         types-variable-boxes
WEEK 3   random-pseudorandom-seed ●   types-integer-division ●
         pointers-arithmetic  pointers-intro  stacks-paren-scanner
         stacks-postfix-eval  types-uninitialized-garbage
WEEK 4   arrays-dont-copy ●
         io-single-cout-escapes  pointers-new-delete-dangling
         recursion-factorial-stack  recursion-fib-levels  recursion-hanoi
         types-string-concat-plus
WEEK 5   complexity-growth-curves ●   control-flowchart-sync ●
         arrays-of-nulls-until-new  io-cin-prompt-pause
         strings-cstring-compare  strings-shared-memory
WEEK 6   control-short-circuit ●
         io-fixed-setprecision  sorting-quicksort-partition
         structs-array-of-records
WEEK 7   scope-shadowing ●
         arraylist-amortized-doubling  heap-is-this-valid
         sorting-heapsort-dual  sorting-timing-chart
         structs-and-pointers  structs-as-arguments  structs-union-overlay
WEEK 8   control-case-coverage ●
         functions-varargs  hashing-collision-strategies
WEEK 9   objects-static-members ●
         control-bool-flag  files-basic-operations  files-stream-fail-state
         io-printf-format  pointers-address-model
WEEK 10  loops-while-vs-dowhile ●   memory-reachability ●
         files-random-access-seek  lists-insert-alpha  objects-equals-vs-identity
WEEK 11  loops-nested-odometer ●   objects-shallow-vs-deep-copy ●
         lists-doubly-insert-order  objects-intro-classes
WEEK 12  files-read-until-eof ●   objects-aggregation ●
         objects-ctor-dtor-lifetime  strings-relational-compare
         trees-bst-operations  trees-recursive-height
WEEK 13  graphs-bfs-dfs  graphs-representations
         objects-operator-overload  types-enum
WEEK 14  functions-call-return ●
WEEK 15  dispatch-vtable  functions-menu-dispatch  inheritance-base-derived
         loops-sentinel-vs-counter  strings-immutability  types-boxing-wrappers
WEEK 16  objects-reference-vs-value  strings-tokenize-transform
WEEK 18  functions-value-vs-reference  inheritance-super-chain
WEEK 19  arrays-accumulate-max-min  inheritance-what-object-gives
WEEK 20  arrays-of-references  dispatch-which-method-runs
WEEK 21  gui-event-dispatch  objects-three-from-one-class
WEEK 22  gui-panel-composition
WEEK 23  arrays-index-vs-value
WEEK 24  arrays-parallel-lockstep     arrays-2d-row-col   (see Decision 3)
```

Weeks are mechanical row indices; a given film may be off by a week, and where a
row held several subtopics they were split across adjacent weeks. The ORDER is
sound; confirm specific placements against the schedules when convenient. Within
a week, build the shared (●) ones first, then the assignment-backers (below),
then the rest.

Total: **91 animations** (90 + the one added in Decision 3).

---

## Decision 2 — assignment markers (hidden, in the iframe query string)

Every assignment has **at least one** backing animation (the one that, if a
student works through it, makes the assignment materially easier). This is NOT
advertised — advertising it makes some students do only the backers. But it must
be identifiable, for two reasons: Neven answers "is there anything for A3?"
constantly, and wants an instant answer.

**Marker lives in the Canvas iframe query string, not the filename.** Reason: a
shared animation backs *different* assignments in different courses
(`objects-constructor-init` is bCpp A7, bJava A7, aJava A1). A filename can't
express that; a per-course iframe URL can. The animation ignores the param — it
is inert, a marker for Neven only. Students don't read URLs.

```
<iframe src="objects-constructor-init.html?a=bcpp-a7">   in the bCpp Canvas page
<iframe src="objects-constructor-init.html?a=ajava-a1">  in the aJava Canvas page
```

When an assignment has **more than one** backer, number them:

```
?a=bcpp-a2-1     types-integer-division
?a=bcpp-a2-2     io-fixed-setprecision
```

Two deliverables for Claude Code:

1. Emit these `?a=` params when generating the per-course iframe URLs, driven by
   `courses.json` (`{file, course, backs}`).
2. Generate a **private instructor index** — one page per course, unlisted or
   local, that reads `courses.json` and prints "A3 → <animation> → link." This is
   what Neven actually opens when a student asks. The URL marker is the backup;
   the index is the tool.

### Backer map (source of truth for `courses.json`)

```
bCpp   A1 io-single-cout-escapes
       A2 types-integer-division ; io-fixed-setprecision          (a2-1, a2-2)
       A3 control-case-coverage            (KEY — parallel problem, not quadratic)
       A4 loops-nested-odometer
       A5 files-read-until-eof
       A6 functions-overload-resolution
       A7 objects-constructor-init
       A8 arrays-parallel-lockstep
bJava  A1 io-single-println-escapes
       A2 types-integer-division ; control-flowchart-sync         (a2-1, a2-2)
       A3 control-case-coverage            (KEY — parallel problem)
       A4 loops-nested-odometer
       A5 files-read-until-eof ; functions-call-return            (a5-1, a5-2)
       A6 functions-menu-dispatch
       A7 objects-constructor-init
       A8 arrays-accumulate-max-min
aCpp   A1 sorting-race-statements
       A2 pointers-new-delete-dangling
       A3 structs-array-of-records
       A4 files-basic-operations
       A5 files-random-access-seek         (KEY — direct, machinery not assessed)
       A6 objects-ctor-dtor-lifetime
       A7 objects-aggregation
       A8 dispatch-vtable
aJava  A1 objects-constructor-init ; random-pseudorandom-seed     (a1-1, a1-2)
       A2 arrays-of-nulls-until-new ; objects-equals-vs-identity  (a2-1, a2-2)
       A3 arrays-2d-row-col                (NEW — see Decision 3)
       A4 objects-aggregation ; memory-reachability              (a4-1, a4-2)
       A5 strings-tokenize-transform
       A6 inheritance-super-chain
       A7 dispatch-which-method-runs       (KEY — direct; UML is what's graded)
       A8 gui-event-dispatch
ds     A1 lists-array-insert-delete        A8  hashing-collision-strategies
       A2 queues-count-vs-rear             A9  lists-insert-alpha
       A3 stacks-paren-scanner             A10 lists-doubly-insert-order
       A4 stacks-postfix-eval              A11 trees-bst-operations
       A5 recursion-fib-levels             A12 trees-recursive-height
       A6 sorting-quicksort-partition (KEY) A13 graphs-representations
       A7 sorting-heapsort-dual ; sorting-timing-chart            (a7-1, a7-2)
```

KEY assignments: the backer is deliberately adjacent, never the graded solution.
bCpp/bJava A3 point at leap-year case-coverage, not a quadratic walkthrough.

---

## Decision 3 — one animation added to close the last gap

`aJava` A3 (2D Array Operations: getRowTotal, getColumnTotal, getHighestInRow)
had no backer — the module bracket names static members and equals, but the
assignment is 2D indexing. There was NO 2D-array animation anywhere in the set.

**Add `arrays-2d-row-col`**: a CELLS grid where "row total" highlights a row,
"column total" a column, showing a[r][c] indexing. Backs aJava A3, and also
serves aCpp 7.6–7.10 (multi-dim arrays) and bCpp's 2D-array module. Shared across
three courses; placed at its earliest need. Takes the total to 91.

---

## Still open for Neven (cheap, not blocking)

- Are the 20 aCpp animation pages actually unpublished? (2 min in Canvas.)
- Send one Canvas wiki page's HTML — turns the filename↔page mapping from
  inference into fact.
- Fix the aJava schedule's malformed span (the polymorphism module's chapter
  cell renders blank — it's the KEY module).
- `recurs2.gif` vs ds5.html evaluation-order conflict (Decision 1 note).

## What stays a chat decision, not a Claude Code one

Anything that changes what an animation *teaches*, or edits a design `.md`:
the predict-vs-passive toggle question, new animations, pedagogical framing.
Design lands in the `.md` files (chat); implementation lands in code (Claude
Code); git keeps them coherent.
