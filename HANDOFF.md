# HANDOFF — pac-animations

Brief for Claude Code sessions working in this repo. The engine and two
animations exist. Read `panel-inventory.md` (why the engine is shaped this way),
`slates.md` (what to build), and `AUTHORING.md` (how to author one content file)
first. This document is the delta on top of them and the source of truth for
build order and project-wide conventions.

**This revision supersedes the earlier temporal-ordering plan:**
- Build in **efficiency order** (below), not by teaching week.
- Every animation is authored **WATCH/THINK-capable**; mode is chosen at view
  time by a `?mode=` URL parameter, default WATCH.
- Line highlighting follows the line **about to execute**, driven by a top-level
  `step.line`. There is a known bug here to fix first (see below).

---

## State of the code

Built, rendered, merged to main:

- `engine/` — driver, five panel renderers, arrow overlay, styles (15 tokens).
- `content/recursion-fib-levels.js` — ds A5. Reproduces the ds5.html expected
  trace (level sequence 0,2,4,3,1,3,2,4,3). Predict gate branches into the
  students' real bug (`level+1` instead of `level+2`).
- `content/lists-doubly-insert-order.js` — ds A10. Four-line doubly-linked
  insertion; arrows fixed and merged.

Two reversible engine decisions:
- **Steps are snapshots, not deltas** — this is what makes Back free.
- **The n-2 branch is evaluated first** in `recursion-fib-levels`, matching
  ds5.html. Conflicts with `recurs2.gif` (left-to-right). Both orders may be
  wanted; flagged for Neven, unresolved.

---

## FIRST TASK — fix the line-highlight bug

The code panel's highlight never moves; it shows the same line regardless of
step. Cause: content files set `line` at the **top level** of each step object,
but the code renderer reads the line from `step.panels.<codePanelId>`, so it
always receives `undefined` and never advances.

Fix the **engine** (not the content) so a **top-level `step.line`** is passed to
the code panel automatically and drives the active-line highlight. Support both a
plain number and a per-language object `{pseudo, java, cpp}`. Content files then
write the natural `line: 4` at the top of a step and highlighting always works —
no per-file nesting to forget, and no re-editing the two existing content files.

Verify against `lists-doubly-insert-order`: the highlight must move to line 2, 3,
4, 5 as each assignment executes, and highlight no line on the intro / predict /
final steps where `line` is null. Render, screenshot, confirm, commit.

---

## WATCH / THINK mode (project-wide)

Two educational modes from **one** content file, selected at view time.

- **WATCH** — passive step-through. `predict` steps render as ordinary steps; the
  student just clicks Next. Debugger-style: current line highlighted, state
  updates, narration explains.
- **THINK** — `predict` steps render as gates: a question, options, and (where
  authored) a wrong-answer branch that runs the buggy version.

**Mechanism: a `?mode=` URL parameter, default WATCH.**

```
lists-doubly-insert-order.html?mode=watch   (or no param — WATCH is default)
lists-doubly-insert-order.html?mode=think
```

The engine reads `?mode=` at load. In WATCH, any `type:'predict'` step renders as
a normal step: skip the gate UI, do not stop, do not branch — show the snapshot
and let Next proceed. In THINK, gates behave as they do today.

This lets a Canvas page start with one default (WATCH) link and later add a
second `?mode=think` link — no rebuild, no second file:

```
List insertion animation                     -> ...insert-order.html
List insertion animation (Watch | Think)     -> two links: ?mode=watch  /  ?mode=think
```

**Authoring rule:** author the gate **now**, during the initial build, wherever
an animation has a meaningful predict moment — question, options, and buggy
branch all in the content file. They lie dormant under WATCH and activate under
THINK. Do NOT defer gates to a later pass: the THINK link must work the day it is
added, with no rebuild. Animations with no natural predict moment are WATCH-only
and never get a THINK link.

---

## Build order — EFFICIENCY (not temporal)

Mature the engine against the best-specified course (ds), then build shared
animations once, then finish single-course animations, and do aCpp last because
it already has live Canvas material and is a port-and-improve job. Within a
phase, order is flexible; across phases, go in order.

`●` = shared across courses (build once, reuse via the `courses.json` mapping).

### Phase 1 — ds core (20) · proves every renderer
```
lists-array-insert-delete       ds A1
queues-count-vs-rear            ds A2   (race driver used for a non-race compare)
stacks-paren-scanner            ds A3   predict/trap
stacks-postfix-eval             ds A4
recursion-factorial-stack       ds
recursion-fib-levels            ds A5   BUILT
recursion-hanoi                 ds
sorting-quicksort-partition     ds A6 KEY
heap-is-this-valid              ds      predict
sorting-heapsort-dual           ds A7   array<->tree dual view
sorting-timing-chart            ds A7   CHART renderer
hashing-collision-strategies    ds A8
pointers-address-model          ds
lists-insert-alpha              ds A9   arrows
lists-doubly-insert-order       ds A10  BUILT
trees-bst-operations            ds A11
trees-recursive-height          ds A12
graphs-representations          ds A13
graphs-bfs-dfs                  ds
complexity-growth-curves        ● ds analysis (also aJava)
```

### Phase 2 — high-share animations (20) · each serves 2–3 courses
```
objects-constructor-init        ● bCpp A7 · bJava A7 · aJava A1
arrays-dont-copy                ● bCpp · bJava · aJava
functions-overload-resolution   ● bCpp A6 · aJava A1
random-pseudorandom-seed        ● bJava · aJava A1
types-integer-division          ● bCpp A2 · bJava A2
control-flowchart-sync          ● bCpp · bJava A2
control-case-coverage           ● bCpp A3 KEY · bJava A3 KEY (parallel problem)
control-short-circuit           ● bCpp · bJava
loops-while-vs-dowhile          ● bCpp · bJava
loops-nested-odometer           ● bCpp A4 · bJava A4
files-read-until-eof            ● bCpp A5 · bJava A5
functions-call-return           ● bCpp · bJava A5
scope-shadowing                 ● bCpp · bJava
objects-static-members          ● aCpp · aJava
objects-shallow-vs-deep-copy    ● aCpp · aJava
objects-aggregation             ● aCpp A7 · aJava A4
memory-reachability             ● aJava A4 · ds
sorting-race-statements         ● aCpp A1 · ds
intro-compile-run               ● bCpp · bJava   (WATCH-only; may not warrant building)
arrays-2d-row-col               ● aJava A3 · aCpp · bCpp   (closes aJava A3 gap)
```

### Phase 3 — bCpp / bJava singles (19)
```
types-variable-boxes         bCpp        io-single-println-escapes   bJava A1
io-single-cout-escapes       bCpp A1     types-string-concat-plus    bJava
types-uninitialized-garbage  bCpp        io-printf-format            bJava
io-cin-prompt-pause          bCpp        functions-menu-dispatch     bJava A6
io-fixed-setprecision        bCpp A2     objects-reference-vs-value  bJava
control-bool-flag            bCpp        arrays-accumulate-max-min   bJava A8
strings-relational-compare   bCpp        arrays-of-references        bJava
loops-sentinel-vs-counter    bCpp
functions-value-vs-reference bCpp
objects-three-from-one-class bCpp
arrays-index-vs-value        bCpp
arrays-parallel-lockstep     bCpp A8
```

### Phase 4 — aJava singles (13)
```
arrays-of-nulls-until-new     aJava A2      strings-immutability          aJava A5
arraylist-amortized-doubling  aJava         types-boxing-wrappers         aJava
functions-varargs             aJava         strings-tokenize-transform    aJava A5
objects-equals-vs-identity    aJava A2      inheritance-super-chain       aJava A6
types-enum                    aJava         inheritance-what-object-gives aJava
dispatch-which-method-runs    aJava A7 KEY  gui-event-dispatch            aJava A8
gui-panel-composition         aJava
```

### Phase 5 — aCpp (19) · port + improve; course already live
```
sorting-bubble-selection     port          structs-as-arguments        port struct2
searching-linear-vs-binary   port          structs-union-overlay       port enumuni
pointers-intro               port cpoint1   files-basic-operations      A4 · port file1/2
pointers-arithmetic          port cpoint2   files-stream-fail-state     error testing
pointers-new-delete-dangling A2 · cpoint3   files-random-access-seek    A5 KEY · port file3
strings-cstring-compare      port strcompare objects-intro-classes      port oop1
strings-shared-memory        port strshare   objects-ctor-dtor-lifetime A6 · port oop2
structs-array-of-records     A3              objects-operator-overload   port oop4
structs-and-pointers         port struct-ptr inheritance-base-derived    port oop3
                                             dispatch-vtable             A8 · port oop5
```

**Total: 91** (two built). Phase 1 is the priority batch. Batch instruction to
Claude Code, e.g.: *"Build the next five Phase-1 animations from HANDOFF.md,
following AUTHORING.md. WATCH/THINK-capable, author gates where meaningful.
Render and screenshot each before committing."*

---

## Assignment markers (hidden, in the iframe query string)

Every assignment has at least one backing animation. NOT advertised. Identified
by a `?a=` param on the Canvas iframe, ignored by the animation — an inert marker
for Neven, invisible to students who don't read URLs. Composes with `?mode=`:

```
objects-constructor-init.html?a=bcpp-a7&mode=watch
objects-constructor-init.html?a=ajava-a1&mode=watch
```

A shared animation backs different assignments in different courses, which is why
the marker is per-iframe, not in the filename. Multiple backers of one assignment
number as `a2-1`, `a2-2`.

Later deliverables (not blocking): emit `?a=`/`?mode=` when generating per-course
iframe URLs from `courses.json`; and a private per-course **instructor index**
listing "A3 -> animation -> link" for instant answers to "anything for A3?".

### Backer map (source of truth for courses.json)
```
bCpp   A1 io-single-cout-escapes            A5 files-read-until-eof
       A2 types-integer-division;io-fixed-setprecision (a2-1,a2-2)
       A3 control-case-coverage (KEY,parallel)  A6 functions-overload-resolution
       A4 loops-nested-odometer              A7 objects-constructor-init
                                             A8 arrays-parallel-lockstep
bJava  A1 io-single-println-escapes          A5 files-read-until-eof;functions-call-return (a5-1,a5-2)
       A2 types-integer-division;control-flowchart-sync (a2-1,a2-2)
       A3 control-case-coverage (KEY,parallel)  A6 functions-menu-dispatch
       A4 loops-nested-odometer              A7 objects-constructor-init
                                             A8 arrays-accumulate-max-min
aCpp   A1 sorting-race-statements            A5 files-random-access-seek (KEY,direct)
       A2 pointers-new-delete-dangling       A6 objects-ctor-dtor-lifetime
       A3 structs-array-of-records           A7 objects-aggregation
       A4 files-basic-operations             A8 dispatch-vtable
aJava  A1 objects-constructor-init;random-pseudorandom-seed (a1-1,a1-2)
       A2 arrays-of-nulls-until-new;objects-equals-vs-identity (a2-1,a2-2)
       A3 arrays-2d-row-col                  A5 strings-tokenize-transform
       A4 objects-aggregation;memory-reachability (a4-1,a4-2)
       A6 inheritance-super-chain            A7 dispatch-which-method-runs (KEY,direct)
       A8 gui-event-dispatch
ds     A1 lists-array-insert-delete   A8  hashing-collision-strategies
       A2 queues-count-vs-rear        A9  lists-insert-alpha
       A3 stacks-paren-scanner        A10 lists-doubly-insert-order
       A4 stacks-postfix-eval         A11 trees-bst-operations
       A5 recursion-fib-levels        A12 trees-recursive-height
       A6 sorting-quicksort-partition (KEY)  A13 graphs-representations
       A7 sorting-heapsort-dual;sorting-timing-chart (a7-1,a7-2)
```
KEY backers are deliberately adjacent, never the graded solution.

---

## Still open for Neven (cheap, not blocking)

- Are the 20 aCpp animation pages actually unpublished in Canvas? (2 min.)
- Fix the aJava schedule's malformed span (polymorphism/KEY module cell is blank).
- `recurs2.gif` vs ds5.html evaluation-order conflict.
- THINK-mode link labels (a Canvas-side choice; never touches the repo).

## What stays a chat decision, not a Claude Code one

Anything that changes what an animation teaches, or edits a design `.md`: new
animations, pedagogical framing, mode design, build order. Design lands in the
`.md` files (chat); implementation lands in code (Claude Code); git keeps them
coherent.
