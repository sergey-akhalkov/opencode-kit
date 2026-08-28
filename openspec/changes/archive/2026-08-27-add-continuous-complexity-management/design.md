## Context

See `proposal.md` for motivation and the single change-level
`continuous-complexity-management-v1` claim. The current kit already has strong
pay-as-you-go controls:

- `global/AGENTS.md` and `library-change-ready-sdlc` require current-owner discovery,
  remove/narrow/reuse, local comprehension, and `split-or-justify`;
- `architecture-and-change-locality` observes a named seam/change axis, while
  `simplicity-and-reuse` observes sibling or same-versus-new uncertainty;
- `code-quality-audit` reviews changed-code maintainability and smells;
- `codebase-audit-loop` plus its ledger owns exhaustive whole-project review;
- project and code-quality inventories report roots, exclusions, and line bands without
  semantic architecture judgment.

Those mechanisms do not compose a light scenario-based answer to: "what does a consumer
need to understand to make this realistic change, and did this refactor reduce that
model?" The current inventories also cannot accept a reviewed project-specific hot-path
scope. Against the read-only `pmac-emulator` case, project inventory scanned 25,469 paths
and its largest-file view was dominated by the `saturn/` corpus even though project
authority calls that tree legacy evidence rather than an entrypoint. Code-quality
inventory similarly surfaced corpus/evidence files alongside maintained Rust owners.
The repository has useful typed pipeline, controller facade, and core/adapter boundaries,
but its boilerplate README, competing frozen/current execution paths, mixed 4,000-6,000
line owners, 135 main specs, and large evidence surfaces make the simple extension path
costly to discover.

No repo-local active artifact named `helicopter view` was found. The active autonomous
campaign change owns multi-day P0/P1 audit remediation, not architecture polish or a
maintained comprehension map. The active foundation change excludes generic architecture
review. This design therefore composes existing complexity owners and remains separate
from both active changes.

## Goals / Non-Goals

**Goals:**

- Make complexity management part of ordinary development without making every change
  run a full audit or reviewer.
- Give a cold-context developer one compact focused view of consumers, owners, interfaces,
  effects, failures, and proof paths for the current scenario.
- Let facades, modules, libraries, and frameworks earn adoption through demonstrated
  encapsulation and change locality rather than pattern names.
- Provide stable project-neutral facts and explicit degraded states for any readable
  local repository.
- Reuse current Practice Owners, code-quality review, audit coverage, proof, and scope
  authority.

**Non-Goals:**

- A computed complexity score, dependency-graph platform, universal package parser,
  auto-refactoring engine, or mandatory persistent architecture database.
- A second focused complexity skill, a new Practice Owner, or an architect that chooses
  designs for main. The one new focused skill composes current facts and routes rather
  than taking changed-code review or exhaustive coverage ownership.
- A requirement that every project use one architecture document path or commit a map
  for every ordinary change.
- Refactoring the diagnostic external repository or broad cleanup of this kit while
  implementing the workflow.

## Decisions

### 1. Add one thin focused skill between the existing delta and project owners

The workflow has three modes:

| Mode | Trigger | Owner | Durable output |
| --- | --- | --- | --- |
| `delta` | every behavior-changing handoff | main's existing architecture field | none beyond normal handoff when clear |
| `focused` | explicit pre-expansion complexity/current-scenario refactoring assessment or unresolved current-change context pressure | new main-executed `complexity-management`; main decides and mutates | Architecture Comprehension Map, Change Rehearsal, disposition |
| `project` | explicit whole-project/exhaustive request | `codebase-audit-loop` plus ledger in review-only mode by default | existing ledger/report plus one `Complexity Pressure Matrix` with area, scenario, pressure, evidence, owner, entrypoint, admission class, and focused-scenario ref |

The always-loaded architecture bullet is consolidated rather than duplicated. Main first
applies exact Practice Owner routing. If no owner trigger applies, or the required owner
observation is complete and current comprehension pressure still prevents safe progress,
main loads the focused skill before expansion. Explicit seam/mixed-responsibility
questions continue to route to the existing architecture Practice Owner and do not load
the focused skill solely for that same trigger. An explicitly requested focused
assessment can refer a materially distinct newly discovered seam, but cannot re-launch
an owner for the same reviewed fact. Zero-trigger work records only the existing final
architecture disposition.

The focused skill owns one job: map current consumer comprehension pressure, rehearse
one realistic change, and structure main's refactor disposition. It stays quiet for a
cohesive ordinary change, post-change smell/maintainability review
(`code-quality-audit`), new service architecture (`service-architecture-design`), and
explicit whole-project/exhaustive coverage (`codebase-audit-loop`). Project mode remains
review-only unless the user separately accepts audit-and-fix; an admitted subsystem
refactor enters focused mode with one named scenario.

Discovery is symmetric. Narrow the adjacent skill descriptions and README/catalog
routing so `code-quality-audit` explicitly stays on changed-code smells and
`service-architecture-design` stays on new service design. This is trigger receding, not
an output or Practice Owner change.

Alternatives rejected:

- Extending `code-quality-audit` was initially selected but maintenance review showed
  that pre-expansion map/rehearsal and post-change smell review have different lifecycle
  positions and outputs. One thin skill is lower total responsibility/context cost.
- Running `codebase-audit-loop` after every non-trivial change would add disproportionate
  coverage and ledger cost.
- A mandatory architecture reviewer would violate trigger-based Practice Ownership and
  transfer design responsibility away from main.

### 2. Use a map plus one change rehearsal, not an architecture score

The focused output has two connected records. Project mode does not create these records
for every audited block; it yields coverage/findings and invokes focused mode only for a
named admitted subsystem refactor.

`Architecture Comprehension Map`:

```text
outcome and scope
  -> consumers and entrypoints
  -> cohesive owners and dependency/effect directions
  -> intended extension surfaces
  -> hidden internals
  -> explicit errors, effects, lifecycle and cost
  -> tests/proof commands
  -> compatibility/non-extension paths
  -> unknown/unreadable areas
```

`Change Rehearsal`:

```text
representative consumer task
  -> current call/interaction
  -> essential context set (files, symbols, docs, concepts, with reasons)
  -> expected edit set and proof set
  -> observed pressure and owning boundary
  -> candidate response
  -> same task/context/edit/proof comparison after refactor
```

Sets and facts may be counted for navigation, but no aggregate number is a verdict. Main
must explain which consumer knowledge or scattered edit was removed, which owner became
clearer, and whether any effect/error/cost became hidden. A large cohesive file can pass;
a small wrapper chain can fail.

The map is generated for the current assessment and references any existing project-
native architecture document. Persistence is optional and project-native. The first
increment does not add a global architecture database or force a new file into every
consumer project; an accepted refactoring change may retain the map in its normal design
or evidence artifacts.

Alternative rejected: a numeric score would be easy to optimize, collapse unlike
complexity axes, and violate deterministic-automation policy.

### 3. Treat encapsulation value and extensibility value as separate gates

A facade can be useful with one implementation when a real consumer currently
coordinates several cohesive internal stages. It earns admission when the same scenario
shows that the consumer no longer needs those internals while behavior, failures,
effects, lifecycle, and meaningful cost remain explicit.

Multi-implementation machinery has a stronger gate. An interface, strategy, factory,
plugin point, or framework requires at least one current variation or a named reachable
change axis supported by accepted requirements, current source, an external boundary, or
an explicitly planned variant. A framework additionally needs a stable repeated contract
whose centralization removes more concepts and drift than the framework introduces.

The decision ladder is:

1. remove unused capability or obsolete surface;
2. isolate irrelevant corpus/evidence/generated search noise;
3. narrow the public surface or consumer responsibility;
4. reuse or reshape the current owner;
5. extract one cohesive owner or facade for a current consumer;
6. introduce multi-implementation abstraction only for evidenced variation;
7. build a framework only for a stable repeated contract with lower total context and
   lifecycle cost.

Alternative rejected: "interfaces are always cleaner" confuses encapsulation with
polymorphism and commonly produces pass-through navigation.

### 4. Add one separate fact-only inventory at the active global source

Current project inventory answers source/test/build discovery, while code-quality
inventory answers line-band navigation. Changing either output to carry complexity
workflow semantics would blur stable contracts. Add
`global/bin/complexity-foraging-inventory.ts` as a distinct project-neutral CLI and a
repository script for development/validation. It will reuse maintained traversal,
redaction, stable rendering, and test helpers where their contracts match; it will not
create a generic inventory framework.

The first schema contains reviewed facts only:

- tool/schema version and privacy-safe root identity;
- include roots and excluded roots with caller-supplied class/reason;
- source, test, component, manifest, architecture-doc, entrypoint, public-surface, and
  proof candidates with the exact detector evidence;
- generated, vendor, evidence, corpus, dependency, unknown, unsupported, and unreadable
  counts;
- largest maintained-file and top-level concentration facts after reviewed scope;
- original-cause diagnostics and overall support state.

The CLI accepts `--root`, `--format json|markdown`, an optional versioned scope JSON,
`--max-files`, `--max-bytes`, and `--timeout-ms`. First-version defaults are 100,000
entries, 512 MiB aggregate maintained-text input, and 120 seconds; values are revisable
process controls within tested hard caps. The scope file is reviewed input, never
generated by heuristics. Without it, the helper uses only maintained exact path/manifest/
name detectors and marks ecosystem-specific facts unsupported. `--help` is effect-free.
Output is stable, root-redacted by default, and never includes source payloads or secret
values.

A nested unreadable path increments the unreadable set, preserves its original cause,
and produces `partial` support rather than a clean map. Entry/byte/time limit exhaustion
or cancellation emits `blocked`, exits non-zero, and does not emit a complete-map
projection. An unreadable root fails before traversal. No partial success is promoted to
full support.

The loaded workflow resolves the active global source exactly: use non-empty
`OPENCODE_CONFIG_DIR` only when it contains the helper, otherwise use supported runtime
source evidence and report collisions. It never strips a `global` suffix or guesses a
repository parent. If the helper is unavailable, focused mode uses bounded Glob/Grep/LSP
foraging and labels the inventory lane degraded.

Alternatives rejected:

- Extending line-band inventory would turn a file-size tool into an architecture surface.
- Parsing arbitrary manifests into semantic ownership would overclaim ecosystem support.
- Requiring a target-project package script would violate project-neutral operation.

### 5. Reuse existing Practice Owners without changing the roster

The workflow itself is main-owned. Existing Practice Owner contracts and registry rows
remain unchanged. It routes only exact questions:

- mixed responsibility, a named new seam, or a source-backed change axis ->
  `architecture-and-change-locality`;
- explicit sibling of a live owner or decision-changing same-versus-new uncertainty ->
  `simplicity-and-reuse`.

The same question does not launch both. A new seam question launches the architecture
owner rather than automatically loading the focused skill for that same fact. The
architecture owner observes locality and the simplicity owner returns net-reduction
evidence; neither chooses or authorizes a refactor. Instruction implementation receives
one maintenance review from `instruction-governance`. No practice registry row or owner
body is changed.

Alternative rejected: a `complexity-management` Practice Owner would overlap both
existing practices and make every broad quality question a routing ambiguity.

### 6. Admit only current structural dependency closure

Focused findings are classified as:

- `current-dependency`: required to prevent the accepted change from worsening mixed
  ownership or to make its current behavior understandable/testable;
- `accepted-refactor`: separately accepted project-level refactoring outcome;
- `deferred-debt`: valid but unrelated to the current outcome;
- `unknown`: insufficient evidence.

Only the first two authorize production planning. `deferred-debt` remains a bounded
finding or proposed OpenSpec follow-up; `unknown` receives a discriminating read/probe or
an honest ceiling. The workflow does not convert optional architecture polish into
campaign P1 or foundation recovery.

Alternative rejected: automatically fixing every finding creates an unbounded polishing
loop and violates Outcome over Output.

### 7. Close a refactor only through the same consumer boundary

Before an admitted behavior-preserving refactor, capture the exact representative
invocation, consumer behavior, effects, diagnostics, candidate/environment identity,
context set, edit set, and proof set. Implement the smallest cohesive change. Re-run the
same invocation and applicable focused/project-native validation, then compare:

- behavior and material side effects remain equivalent for the accepted scenario;
- original errors/causes and effect/lifecycle semantics remain visible;
- essential consumer context, public surface, scattered edits, or ownership is
  demonstrably smaller or clearer;
- no unrelated consumer pays an unexamined material cost inside the accepted envelope.

If only file count or call depth changes, the improvement claim remains unsupported.
Behavior mutation discovered during refactor becomes an explicit behavior change with
its own requirements and proof rather than being hidden under cleanup.

Alternative rejected: green compilation or line reduction alone cannot prove either
preserved behavior or improved comprehension.

### 8. Prove portability with generic fixtures and one separate bounded external case

The proof ladder is:

1. **Current Rung:** reviewed planning plus actual current inventories and read-only
   source audit against one external Rust workspace.
2. **Next Real Boundary:** provider-free CLI fixtures exercise schema, scope,
   fallback, redaction, ordering, and failure behavior.
3. Configured loaded OpenCode baseline/candidate sessions exercise routing, maps,
   rehearsals, abstraction decisions, and negative controls in disposable projects.
4. One executable fixture replays the same consumer scenario before and after an
   admitted facade/extraction.
5. The installed workflow repeats a separate read-only `pmac-emulator` diagnostic and
   compares its bounded findings with the preserved case inventory; it performs no
   product edit, build, controller access, or network operation and cannot complete a
   generic population member.

Authorization covers local kit writes, disposable fixture writes, configured bounded
synthetic model calls, and read-only access to the named external repository. Safeguards
exclude source payloads and absolute private roots from durable fixtures, preserve
unrelated worktrees, and deny remote/protected effects. Disposable roots are removed only
after terminal process/writer closure; immutable privacy-safe proof bundles are retained
under the change. The external repository requires no cleanup because it is read-only.

The maximum claim remains the one in `proposal.md`; a successful external replay is one
case, not population proof or a prerequisite for closing generic fixture members.

### 9. Ship the focused workflow in the default core surface

The user's requested focused practice must be available in ordinary projects, not only
the explicit `all` compatibility profile. Add `complexity-management` to `core` and
`all`. Add the exact self-contained helper file and any exact `global/bin` import closure
to `core`; `all` continues to include `global/bin`. Existing `code-quality-audit`,
`codebase-audit-loop`, and `codebase-audit-ledger` remain `all` because changed-code
review and exhaustive coverage are not required for ordinary core operation.

Profile generation, catalogs, doctor/readback, discovery metadata, on-demand body,
context-quality checks, and loaded behavior must all remain green. Inventory size and
token-proxy measurements remain diagnostics. The always-loaded trigger is allowed only when
the selected profile contains the focused skill; the default candidate guarantees that
for `core` and `all`. On `core`, an explicit exhaustive request reports that project mode
requires an available exhaustive skill/profile and does not silently approximate
coverage. A custom profile missing the focused skill keeps only the existing direct
delta check and reports the focused capability unavailable rather than guessing another
source.

Alternative rejected: advertising an `all`-only focused skill from default always-loaded
core authority would create an impossible common-practice route. Moving exhaustive audit
into core would widen the minimal ordinary surface for a user-explicit coverage mode that
can instead fail visibly when absent.

## Risks / Trade-offs

- **[Scenario bias]** One rehearsal can make one consumer easier while missing another
  change axis -> require explicit scope, consumer, unknowns, and unexamined affected
  consumers; broaden only on evidence.
- **[Stale maps]** A persisted project-native map can drift -> source/runtime remains
  authoritative, references are re-read for each focused run, and stale facts are
  findings rather than trusted context.
- **[Instruction weight]** More guidance can itself increase complexity -> keep complete
  workflow in the existing on-demand skill, one compact global trigger, role deltas,
  inventory diagnostics, canonical ownership, and context-quality checks; do not use a
  size proxy as the acceptance oracle.
- **[Detector overclaim]** Exact filename/manifest rules can look semantic -> label every
  output as a candidate with detector evidence and preserve unsupported states.
- **[Inventory duplication]** A fourth inventory adds maintenance cost -> keep the fact
  contract distinct, reuse compatible walkers/renderers/tests, and do not copy project or
  line-band outputs wholesale.
- **[Refactor scope creep]** Valid findings can become endless work -> admission classes
  and the accepted outcome keep unrelated debt deferred.
- **[Abstraction tunneling]** A narrow facade can hide blocking I/O, retries, or failure
  ambiguity -> boundary fields and same-scenario proof require explicit effects, errors,
  lifecycle, and cost.
- **[Active-change overlap]** Foundation/campaign implementation may touch shared
  instructions/proofs -> implementation begins with fresh ownership inventory and
  serializes, transfers, or narrows overlapping surfaces before mutation.

## Migration Plan

1. Apply `replace-instruction-limits-with-context-quality`, or explicitly rebase this
   change on its replacement contract, then re-read active changes and freeze exact
   non-overlapping ownership or dependency order; planning artifacts alone authorize no
   shared-surface implementation.
2. Add and prove the provider-free inventory owner and fixtures without changing loaded
   routing.
3. Add the thin focused skill, review-only project audit delta, profile availability,
   and structural validators; keep consolidated global routing last so no runtime
   advertises an unavailable workflow.
4. Run matched configured baseline/candidate behavior, executable before/after fixture,
   installed-source readback, and the read-only external case replay.
5. Install through the existing global installation path only when separately requested;
   a new OpenCode process is required for changed skill/instruction discovery.

Rollback is removal of the candidate routing/skill deltas and portable helper through an
ordinary reviewed change while preserving proof evidence. No consumer schema or product
data migration exists.

## Open Questions

- Whether a later increment should provide ecosystem-specific detector packs remains
  deferred until first-version unsupported output shows a concrete high-value family.
- Whether projects benefit from committing the map as a durable architecture document
  remains a project-owned follow-up; the first increment keeps persistence optional.
