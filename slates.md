# Animation Slates — derived from the chapter-column subtopics

Method: every animation traces to a subtopic **named in the bracket list** of a
schedule row. Where a proposed animation has no bracket to point at, it is cut
or moved to the course whose bracket does name it.

Tier 1 = build. Tier 2 = worth having, cut first if the slate is too long.

Legend for Mode: **T**race · **P**redict/trap · **R**ace · **S**tructural ·
**M**emory · **G**rowth

---

## What the brackets overturned

Four of my earlier calls were wrong, and the brackets say so plainly.

| Earlier claim | What the bracket says |
|---|---|
| `cin` fail-state is `bCpp`'s best trap | No `bCpp` bracket mentions stream state. **`aCpp` 12.1–12.5 names "error testing."** Right animation, wrong course. |
| `==` vs `.equals()` at `bJava` 3.5–3.8 | That bracket is `[logical operators, conditional op, scope]`. **`aJava` 8.1–8.5 names "toString and equals method."** |
| `bCpp` and `bJava` are symmetric | `bCpp` 4.8–4.15 names **"comparing strings"**; `bJava` never does. `bCpp` names **reference vars** and **overloading**; in Java those are `aJava` topics. |
| `bJava` 4.10–4.12 is a files module | It is `[files, **random numbers**]`. Randomness is a prerequisite for `aJava` A1 (Coin Toss) and I ignored it. |

Also recovered, all named and none guessable from chapter titles: `flags`,
`sentinels`, `running totals`, `exit()`, `breaking from loops`, `inline member
functions`, `class specification`, `member-wise assignment`, `copy
constructors`, `command line`, `variable length arg. list`, `StringBuilder`.

---

## bCpp — Beginning C++

Gaddis. 15 modules. Note the ordering: **Ch. 13 (classes) is spliced between
Ch. 6 (functions) and Ch. 7 (arrays)**, so objects precede arrays.

| # | Module — bracket subtopics used | Animation | Mode | Backs | Tier |
|---|---|---|---|---|---|
| 1 | `1` — programming process; data representation | `intro-compile-run` | T | — | 1 |
| 2 | `2.1–2.9` — variables, data types | `types-variable-boxes` | T | — | 1 |
| 3 | `2.10–2.17` — assignment, constants *(+ video: "undefined and uninitialized variables")* | `types-uninitialized-garbage` | **P** | — | 1 |
| 4 | `2.10–2.17` — *(+ video: "comments and escape sequences")* | `io-single-cout-escapes` | T | **A1** | 1 |
| 5 | `3.1–3.11` — cin | `io-cin-prompt-pause` | T | A2 | 1 |
| 6 | `3.1–3.11` — conversions, type casting | `types-integer-division` | **P** | **A2** | 1 |
| 7 | `3.1–3.11` — formatting | `io-fixed-setprecision` | T | **A2** | 2 |
| 8 | `4.1–4.7` — relational operators, if statement | `control-flowchart-sync` | T | — | 1 |
| 9 | `4.1–4.7` — **flags** | `control-bool-flag` | T | — | 2 |
| 10 | `4.8–4.15` — switch, nested if | `control-case-coverage` | **P** | **A3 (KEY)** | 1 |
| 11 | `4.8–4.15` — logical operators | `control-short-circuit` | **P** | — | 2 |
| 12 | `4.8–4.15` — **comparing strings** | `strings-relational-compare` | T | — | 2 |
| 13 | `5.1–5.5` — while, do-while, counters | `loops-while-vs-dowhile` | **P** | A4 | 1 |
| 14 | `5.6–5.10` — for, nested loops, running totals | `loops-nested-odometer` | T | **A4** | 1 |
| 15 | `5.6–5.10` — **sentinels** | `loops-sentinel-vs-counter` | T | — | 2 |
| 16 | `5.11–5.12` — files, **breaking from loops** | `files-read-until-eof` | T | **A5** | 1 |
| 17 | `6.1–6.9` — functions, passing and returning data | `functions-call-return` | T | A5 | 1 |
| 18 | `6.10–6.13` — **reference vars** | `functions-value-vs-reference` | **P** | — | 1 |
| 19 | `6.10–6.13` — **overloading functions** | `functions-overload-resolution` | T | **A6** | 1 |
| 20 | `6.10–6.13` — local and global vars | `scope-shadowing` | **P** | — | 2 |
| 21 | `13.1–13.3` — classes, instances | `objects-three-from-one-class` | T | — | 1 |
| 22 | `13.4–13.8` — **class specification**, constructors | `objects-constructor-init` | T | **A7** | 1 |
| 23 | `7.1–7.5` — array elements, initialization | `arrays-index-vs-value` | **P** | — | 1 |
| 24 | `7.6–7.10` — **parallel arrays** | `arrays-parallel-lockstep` | T | **A8** | 1 |
| 25 | `7.6–7.10` — **arrays as function args** | `arrays-dont-copy` | **P** | A8 | 1 |

**Tier 1: 17. Tier 2: 8.**

### Two things the brackets exposed

**A2 (Pizza Pi) is the densest assignment in the course.** *"Divide the diameter
by 2 to get the radius"* — with an `int` diameter, that truncates. Then *"fixed
point notation, rounded to one decimal place"* and *"use a named constant for
pi."* Three separate subtopics from `3.1–3.11`, three animations, one assignment.
The integer-division trap is not incidental; it is latent in the problem
statement.

**`class specification` (13.4–13.8) means the `.h`/`.cpp` split.** The CODE panel
must show two files, in the *beginner* course. That is a real requirement, not
an advanced nicety — and it does not violate the 3-panel beginner cap, since two
listings live inside one CODE panel.

**`arrays as function args` is taught without pointers.** `bCpp` never covers
pointers at all. So the fact that an array argument doesn't copy is, to these
students, unexplained magic. `arrays-dont-copy` shows the behavior honestly and
defers the mechanism to `aCpp` — where `9.7–9.10` names *"pointers as function
parameters."*

---

## bJava — Beginning Java

Gaddis. 15 modules. Same object-before-array ordering.

| # | Module — bracket subtopics used | Animation | Mode | Backs | Tier |
|---|---|---|---|---|---|
| 1 | `1.1–1.7` — data representation, paradigms | `intro-compile-run` *(shared)* | T | — | 1 |
| 2 | `2.1–2.4` — basic I/O statements, data types | `io-single-println-escapes` | T | **A1** | 1 |
| 3 | `2.5–2.15` — **type conversions** | `types-integer-division` *(shared)* | **P** | **A2** | 1 |
| 4 | `2.5–2.15` — operators, **String type** | `types-string-concat-plus` | **P** | — | 1 |
| 5 | `3.1–3.4` — if, if-else-if, nested if | `control-flowchart-sync` *(shared)* | T | **A2** | 1 |
| 6 | `3.5–3.8` — logical operators, **conditional op** | `control-short-circuit` *(shared)* | **P** | — | 2 |
| 7 | `3.5–3.8` — **scope** | `scope-shadowing` *(shared)* | **P** | — | 2 |
| 8 | `3.9–3.12` — switch | `control-case-coverage` *(shared)* | **P** | **A3 (KEY)** | 1 |
| 9 | `3.9–3.12` — **printf** | `io-printf-format` | T | — | 2 |
| 10 | `4.1–4.4` — while, do-while | `loops-while-vs-dowhile` *(shared)* | **P** | A4 | 1 |
| 11 | `4.5–4.9` — for, nested loops, **break** | `loops-nested-odometer` *(shared)* | T | **A4** | 1 |
| 12 | `4.10–4.12` — files | `files-read-until-eof` *(shared)* | T | **A5** | 1 |
| 13 | `4.10–4.12` — **random numbers** | `random-pseudorandom-seed` | T | — | 1 |
| 14 | `5.1–5.2` — methods, **passing arguments** | `functions-call-return` *(shared)* | T | A5 | 1 |
| 15 | `5.3–5.6` — local variables, returning values | `functions-menu-dispatch` | T | **A6** | 1 |
| 16 | `6.1–6.3` — classes, objects, instances | `objects-reference-vs-value` | **P** | — | 1 |
| 17 | `6.4–6.5` — constructors, **passing objects** | `objects-constructor-init` *(shared)* | T | **A7** | 1 |
| 18 | `7.1–7.3` — arrays intro, **passing as arguments** | `arrays-dont-copy` *(shared)* | **P** | — | 1 |
| 19 | `7.4–7.6` — array algorithms, **returning arrays** | `arrays-accumulate-max-min` | T | **A8** | 1 |
| 20 | `7.4–7.6` — **string arrays** | `arrays-of-references` | **P** | A8 | 2 |

**Tier 1: 15. Tier 2: 5. Twelve are shared with `bCpp`.**

### `random-pseudorandom-seed` earns its place twice

Named in the bracket, ignored in my first slate, and a hard prerequisite for
`aJava` A1 (*Coin Toss*: a no-arg constructor that randomly picks a side, then
twenty tosses with running counts). "Run it again, get a different answer" is one
of the few places where CS1 students' model of determinism genuinely breaks.

### `objects-reference-vs-value` is the contrast pair

`bCpp` 13.1–13.3 and `bJava` 6.1–6.3 have near-identical brackets, and the same
code produces opposite behavior. Build them as a deliberate pair. A student who
takes both courses should be shown the pair explicitly.

---

## aCpp — Advanced C++ (the existing course)

15 modules. **KEY assignment is A5 (Files — inventory program, random access).**

| # | Module — bracket subtopics used | Animation | Mode | Backs | Tier | Exists? |
|---|---|---|---|---|---|---|
| 1 | `7` — arrays *(refresher)* | *(none — refresher)* | — | — | — | |
| 2 | `8` — sorting and searching arrays | `sorting-bubble-selection` | S | A1 | 1 | `bubble` `selection` |
| 3 | `8` — **algorithm efficiency** | `sorting-race-statements` | **R** | **A1** | 1 | `racebubsel` |
| 4 | `8` — searching | `searching-linear-vs-binary` | **R** | — | 1 | `linear` `racelinbin` |
| 5 | `9.1–9.6` — pointers, **initializing, comparing** | `pointers-intro` | **M** | — | 1 | `cpoint1` |
| 6 | `9.1–9.6` — **pointer arithmetic** | `pointers-arithmetic` | **M** | — | 1 | `cpoint2` |
| 7 | `9.7–9.10` — pointers as function params, **dynamic memory allocation** | `pointers-new-delete-dangling` | **P** | **A2** | 1 | `cpoint3` |
| 8 | `10` — C-Strings, **character conversion** | `strings-cstring-compare` | **P** | A3 | 1 | `strcompare` |
| 9 | `10` — String lib | `strings-shared-memory` | **M** | — | 1 | `strshare` `strintcompare` |
| 10 | `11.1–11.6` — ADT, structures, **arrays of** | `structs-array-of-records` | S | **A3** | 1 | |
| 11 | `11.7–11.12` — **pointers to structs** | `structs-and-pointers` | **M** | — | 1 | `struct-ptr` |
| 12 | `11.7–11.12` — structure as args, returning a struct | `structs-as-arguments` | T | — | 1 | `struct2` |
| 13 | `11.7–11.12` — **unions, enumeration** | `structs-union-overlay` | **M** | — | 2 | `enumuni` |
| 14 | `12.1–12.5` — file operations, output formatting | `files-basic-operations` | T | **A4** | 1 | `file1` `file2` |
| 15 | `12.1–12.5` — **error testing** | `files-stream-fail-state` | **P** | — | 1 | ← *moved from `bCpp`* |
| 16 | `12.6–12.10` — **records from structures, random access files** | `files-random-access-seek` | T | **A5 (KEY)** | 1 | `file3` |
| 17 | `13.1–13.6` — classes, **inline member functions** | `objects-intro-classes` | T | — | 1 | `oop1` |
| 18 | `13.7–13.16` — constructors, **destructors**, overloading | `objects-ctor-dtor-lifetime` | **M** | **A6** | 1 | `oop2` |
| 19 | `14.1–14.5` — instance and **static members** | `objects-static-members` | T | — | 1 | `oop4` |
| 20 | `14.1–14.5` — **member-wise assignment, copy constructors** | `objects-shallow-vs-deep-copy` | **P** | — | 1 | |
| 21 | `14.1–14.5` — **operator overloading** | `objects-operator-overload` | T | — | 2 | `oop4` |
| 22 | `14.6–14.8` — object conversion, **aggregation** | `objects-aggregation` | **M** | **A7** | 1 | `oop6` |
| 23 | `15.1–15.4` — inheritance, protected members | `inheritance-base-derived` | S | — | 1 | `oop3` |
| 24 | `15.5–15.7` — polymorphism, **pure virtual functions** | `dispatch-vtable` | **M** | **A8** | 1 | `oop5` |

**Tier 1: 20. Tier 2: 2.** Sixteen have an existing file to port.

### The gap the bracket found

`14.1–14.5` names **member-wise assignment** and **copy constructors** — the
shallow-copy trap — and there is **no existing animation for it.** Every other
subtopic in that bracket has one. This is the single clearest hole in the
existing course, and it's the C++ twin of `aJava` 8.6–8.9's `copying objects`.

### A5 is the KEY, and it may be animated directly

The rubric grades correct output, readable code, and the design document. The
record-size arithmetic of `seekg`/`seekp` is machinery, not the assessed
insight. `file3.html` already covers it. Port and improve; no caution needed.

---

## aJava — Advanced Java

15 modules. **KEY is A7 (BankAccount/SavingsAccount).**

The chapter cell for the A7 module is **blank in the rendered page** — a
malformed span. The intended bracket is `[polymorphism, abstract classes,
interfaces]`.

| # | Module — bracket subtopics used | Animation | Mode | Backs | Tier |
|---|---|---|---|---|---|
| 1 | `6.1–6.5` — constructors, **overloading**, passing objects | `objects-constructor-init` *(shared)* | T | — | 1 |
| 2 | `6.6–6.10` — **overloading, scope**, class design | `functions-overload-resolution` *(shared w/ `bCpp`)* | T | **A1** | 1 |
| 3 | `6.6–6.10` — *(A1 needs it)* | `random-pseudorandom-seed` *(shared w/ `bJava`)* | T | **A1** | 1 |
| 4 | `7.1–7.6` — **passing and returning arrays** | `arrays-dont-copy` *(shared)* | **P** | — | 1 |
| 5 | `7.7–7.11` — **arrays of objects** | `arrays-of-nulls-until-new` | **P** | **A2** | 1 |
| 6 | `7.7–7.11` — **algorithm efficiency** | `complexity-growth-curves` *(shared w/ `ds`)* | **G** | — | 1 |
| 7 | `7.12–7.14` — **arrayList** | `arraylist-amortized-doubling` | **G** | — | 1 |
| 8 | `7.12–7.14` — command line, **variable length arg. list** | `functions-varargs` | T | — | 2 |
| 9 | `8.1–8.5` — **static members** | `objects-static-members` *(shared w/ `aCpp`)* | T | A3 | 1 |
| 10 | `8.1–8.5` — **toString and equals method** | `objects-equals-vs-identity` | **P** | **A2** | 1 |
| 11 | `8.6–8.9` — **copying objects** | `objects-shallow-vs-deep-copy` *(shared w/ `aCpp`)* | **P** | — | 1 |
| 12 | `8.6–8.9` — aggregation, **this ref. variable** | `objects-aggregation` *(shared)* | **M** | A4 | 1 |
| 13 | `8.6–8.9` — **enumerated types** | `types-enum` | T | — | 2 |
| 14 | `8.10–8.12` — **garbage collection**, class collaboration | `memory-reachability` *(shared w/ `ds`)* | **M** | **A4** | 1 |
| 15 | `9.1–9.4` — String methods, **StringBuilder class** | `strings-immutability` | **M** | A5 | 1 |
| 16 | `9.1–9.4` — **wrapper classes, Character class** | `types-boxing-wrappers` | T | — | 2 |
| 17 | `9.5–9.8` — **tokenizing** | `strings-tokenize-transform` | T | **A5** | 1 |
| 18 | `10.1–10.3` — **superclass constructor**, overriding | `inheritance-super-chain` | T | **A6** | 1 |
| 19 | `10.4–10.6` — protected members, **inheritance chains, object class** | `inheritance-what-object-gives-you` | S | — | 2 |
| 20 | `10.7–10.10` — **polymorphism, abstract classes, interfaces** | `dispatch-which-method-runs` | **M** | **A7 (KEY)** | 1 |
| 21 | `12.1–12.4` — GUI intro, buttons, checkboxes | `gui-event-dispatch` | T | **A8** | 1 |
| 22 | `12.5–12.9` — **JPanel derived classes** | `gui-panel-composition` | S | A8 | 2 |

**Tier 1: 16. Tier 2: 6.**

`10.7–10.10` has **no video, no rendered chapter cell, and the KEY assignment.**
It remains the first `aJava` animation to build.

---

## ds — Data Structures (unchanged; grounded in twelve hints pages)

Retained from the previous pass, with the corrections already recorded.
Pseudocode canonical; Java and C++ as toggles.

| # | Topic | Animation | Mode | Backs |
|---|---|---|---|---|
| 1 | Array-based lists | `lists-array-insert-delete` | S | A1 |
| 2 | Queues — **two representations** | `queues-count-vs-rear` | **R** | **A2** |
| 3 | Stacks — parentheses, three error classes | `stacks-paren-scanner` | **P** | **A3** |
| 4 | Stacks — postfix evaluation | `stacks-postfix-eval` | T | **A4** |
| 5 | Recursion — factorial unwinding | `recursion-factorial-stack` | T | — |
| 6 | Recursion — **levels** | `recursion-fib-levels` | **P** | **A5** |
| 7 | Recursion — Hanoi | `recursion-hanoi` | S | — |
| 8 | Algorithm analysis | `complexity-growth-curves` | **G** | — |
| 9 | Quicksort partition | `sorting-quicksort-partition` | S | **A6 (KEY)** |
| 9a | Quicksort — **worst case** (already-sorted input) | `sorting-quicksort-worstcase` | **P** | A6 |
| 10 | Heap — validity | `heap-is-this-valid` | T | — |
| 11 | Heapsort — **build the heap** (part 1 of 2) | `sorting-heapify` | S | A7 (part 1) |
| 12 | Heapsort — array ↔ tree, extract & sink (part 2 of 2) | `sorting-heapsort-dual` | S | A7 (part 2) |
| 13 | Timing vs n | `sorting-timing-chart` | **G** | **A7** |
| 14 | Hashing — probing, chaining, **coalesced** | `hashing-collision-strategies` | S | **A8** |
| 15 | Pointers — 8-bit address model | `pointers-address-model` | **M** | — |
| 16 | Linked list — insert, trailing pointer | `lists-insert-alpha` | **M** | **A9** |
| 17 | Doubly linked — four-line insertion | `lists-doubly-insert-order` | **P** | **A10** |
| 18 | BST — insert, traverse, delete | `trees-bst-operations` | S | **A11** |
| 19 | Tree height | `trees-recursive-height` | T | **A12** |
| 20 | Graphs — matrix ↔ list | `graphs-representations` | S | **A13** |
| 21 | Graph traversal | `graphs-bfs-dfs` | S | — |

**Quicksort worst case (row 9a).** A companion to row 9, running the *same
partition code, character for character* on an already-sorted array
`[1,2,3,4,5,6,7]`. It answers the challenge `sorting-quicksort-partition` ends on
("trace an array that is already sorted") and the two are cross-linked in their
final notes. The payoff is a **shape**: where row 9's thirteen values build a
balanced four-level tree, row 9a's seven values build a straight descending chain
of seven levels — the recursion tree the lecture describes when it says the sort
"turns into an O(n²) sort, just like a bubble sort." The array never changes; the
green settled region fills strictly left-to-right, one cell per partition. Its
final note links forward to `sorting-heapify` — a sort whose worst case is still
O(n log n). Not a separate KEY; it deepens A6. The degenerate tree is *taller than
the structure ceiling by design* — it scrolls vertically within its panel (active
node kept in view), because shrinking the one shape that IS the lesson would defeat
it.

**Heapsort split (A7).** Heapsort was one animation (`sorting-heapsort-dual`); it
ran too long, so building the max heap is split off into `sorting-heapify` (part
1, row 11). Part 2 (`sorting-heapsort-dual`, row 12) starts exactly where part 1
ends — the heap array `[9,6,8,4,1,2]` — and does the repeated extract-and-sink,
where the `sorted` green region grows from the right. Part 1 uses **no green
fill**: heapify settles nothing into its final sorted position (the root only
holds the largest value). Both share the tree ↔ array dual view.

---

## Cross-course reuse

| Animation | Courses |
|---|---|
| `intro-compile-run` | `bCpp` `bJava` |
| `types-integer-division` | `bCpp` `bJava` |
| `control-flowchart-sync` | `bCpp` `bJava` |
| `control-case-coverage` | `bCpp` `bJava` — both KEY |
| `control-short-circuit` | `bCpp` `bJava` |
| `loops-while-vs-dowhile` | `bCpp` `bJava` |
| `loops-nested-odometer` | `bCpp` `bJava` |
| `files-read-until-eof` | `bCpp` `bJava` |
| `functions-call-return` | `bCpp` `bJava` |
| `scope-shadowing` | `bCpp` `bJava` |
| `objects-constructor-init` | `bCpp` `bJava` `aJava` |
| `arrays-dont-copy` | `bCpp` `bJava` `aJava` |
| `functions-overload-resolution` | `bCpp` `aJava` |
| `random-pseudorandom-seed` | `bJava` `aJava` |
| `objects-static-members` | `aCpp` `aJava` |
| `objects-shallow-vs-deep-copy` | `aCpp` `aJava` |
| `objects-aggregation` | `aCpp` `aJava` |
| `complexity-growth-curves` | `aJava` `ds` |
| `memory-reachability` | `aJava` `ds` |
| `sorting-race-statements` | `aCpp` `ds` |

**Totals.** Tier 1 across five courses: 17 + 15 + 20 + 16 + 20 = 88 nominal.
Twenty are shared. **Distinct Tier-1 content files: ~64.** Adding Tier 2 brings
it to ~85 distinct.

---

## Open

- `bCpp` A1 (*single `cout`*, four lines) needs escape sequences. The escape-
  sequence video is filed under `2.10–2.17`, one module after A1 is assigned.
  Possibly fine — Gaddis may cover escapes inside `2.1–2.9` — but worth a look.
- Tier 2 is a proposal, not a plan. Cut freely.
- `intro-compile-run` is the only animation with no assignment, no misconception,
  and no bracket subtopic beyond "programming process." It may not be worth
  building at all.
