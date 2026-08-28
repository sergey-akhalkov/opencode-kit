---
name: complexity-management
description: Use ONLY for a focused pre-expansion assessment of an existing project's architecture comprehension, current change pressure, useful abstractions, or refactoring change locality; stay quiet for cohesive deltas, changed-code review, new service design, seam-only Practice Owner routing, and exhaustive audits.
license: MIT
---

# Complexity Management

Main uses this focused workflow to understand one current consumer/change scenario, rehearse it, and decide whether the smallest remove, narrow, reuse, reshape, extraction, or facade response earns its cost. It is not an architecture score, exhaustive audit, automatic refactor, or new Practice Owner.

## Trigger

Use this skill only when either condition holds:

- the user explicitly asks for a focused pre-expansion complexity, architecture-comprehension, useful-interface, or current-scenario refactoring assessment of an existing project; or
- after targeted foraging and exact Practice Owner routing, the accepted change still cannot reach one understandable owner because of competing extension surfaces, required unrelated context, scattered ownership, hidden material effects/failures, or blocking search noise.

Stay quiet when the work is a cohesive ordinary delta, post-change smell/maintainability review (`code-quality-audit`), new service design (`service-architecture-design`), a seam-only architecture Practice Owner trigger, or explicit whole-project/exhaustive coverage. Route explicit exhaustive coverage to discovered `codebase-audit-loop` and `codebase-audit-ledger`; when unavailable, report project mode unavailable without approximating coverage.

## Authority And Scope

- Main owns semantic assessment, design, mutation, runtime proof, and disposition.
- A named new seam, mixed responsibility, or evidence-backed change axis routes only to the existing `architecture-and-change-locality` Practice Owner when triggered.
- An explicit sibling of a live owner or decision-changing same-versus-new uncertainty routes only to `simplicity-and-reuse` when triggered.
- Do not launch both owners for the same question or re-launch an owner for an already reviewed fact.
- Admit production work only as `current-dependency` or a separately accepted `accepted-refactor`. Record unrelated valid pressure as `deferred-debt`; discriminate or bound insufficient evidence as `unknown`.

## Fact Foraging

Resolve the active global source exactly. Use non-empty `OPENCODE_CONFIG_DIR` only when it contains `bin/complexity-foraging-inventory.ts`; otherwise use supported current runtime-source and collision evidence. Never strip a final `global` segment, guess a repository parent, or require a target-project package script. Prefer the direct helper invocation below over a separate shell availability probe; a failed direct resolution remains degraded evidence rather than permission to guess another source.

When available, run:

```sh
node "<resolved-global-source>/bin/complexity-foraging-inventory.ts" --root "<target-root>" --format json [--scope "<reviewed-scope.json>"]
```

Treat the output as navigation facts, not architecture judgment. Preserve reviewed exclusions, detector evidence, support state, and original causes. If the helper cannot be resolved, use bounded Glob/Grep/LSP foraging and label the inventory lane `degraded`; never claim the portable helper ran. Unknown, unreadable, unsupported, partial, or blocked facts cannot become a clean map.

## Focused Workflow

1. Name the accepted outcome, one realistic consumer/change scenario, affected root or subsystem, non-goals, and representative proof boundary.
2. Gather current source, manifest, test, schema, runtime, decision, and project-native architecture evidence. Separate observed facts, inference, and unknowns.
3. Build the Architecture Comprehension Map below around the consumer boundary, not the repository folder tree.
4. Rehearse the same scenario through the current entrypoint. Include only essential context and explain why each item is necessary.
5. Identify exact pressure: unrelated context, competing extension paths, scattered edits, hidden effects/failures, mixed ownership, or search noise. Line/file counts are navigation facts, never findings by themselves.
6. Apply the abstraction-value ladder and assign one admission class. Do not mutate automatically.
7. If a refactor is admitted and authorized, capture the before state, implement and prove the smallest complete happy path at the representative consumer boundary, and replay the same scenario plus risk-driven focused validation before claiming improvement.

## Architecture Comprehension Map

Record:

- accepted project/subsystem outcome and assessment scope;
- consumers and entrypoints;
- cohesive owners plus dependency/effect directions;
- intended extension surfaces and hidden internals;
- explicit errors, effects, lifecycle, and meaningful cost;
- tests and representative proof commands;
- compatibility or non-extension paths;
- unknown, unreadable, unsupported, or blocked areas;
- evidence references and which statements are inference.

Use an existing project-native architecture artifact when one exists. Do not require a fixed language, topology, framework, or durable map path.

## Change Rehearsal

Record:

- representative consumer task and current call/interaction;
- essential files, symbols, documents, and concepts, each with its reason;
- expected edit set and proof set;
- material effects, failures, lifecycle, and cost;
- observed pressure and owning boundary;
- candidate response or `none`;
- after an admitted refactor, label the before and after context/edit/proof sets; when an output schema has one `essentialContext` field, put only the post-refactor consumer essentials there and keep implementation evidence in the map.

## Abstraction-Value Ladder

Prefer, in order:

1. remove unused capability or obsolete surface;
2. isolate irrelevant corpus, evidence, generated, or vendor noise;
3. narrow public surface or consumer responsibility;
4. reuse or reshape the current owner;
5. extract one cohesive owner or facade for a current consumer;
6. introduce a multi-implementation abstraction only for current variation or a named reachable change axis;
7. build a framework only for a stable repeated contract whose centralization removes more concepts and drift than it adds.

A facade may earn value with one implementation when it hides several stable internal stages while preserving explicit behavior, failures, effects, lifecycle, and cost. Reject pass-through wrappers, option matrices, factories, plugin points, strategies, or frameworks justified only by pattern names or hypothetical flexibility.

## Same-Scenario Recheck

An admitted behavior-preserving refactor is improved only when the same representative invocation shows:

- consumer behavior and material effects remain preserved;
- original errors/causes and effect/lifecycle semantics remain visible;
- essential consumer context, public surface, scattered edits, or ownership is demonstrably smaller or clearer; and
- no affected in-envelope consumer receives an unexamined material cost.

Compilation, line reduction, file movement, or another wrapper alone is insufficient. A discovered behavior change needs its own accepted requirement and proof.

## Output

Return:

- `Mode`: focused | project-unavailable.
- `Outcome And Scope`: consumer/change scenario, non-goals, and proof boundary.
- `Inventory`: active-source identity, invocation or degraded route, support state, exclusions, and privacy-safe diagnostics.
- `Architecture Comprehension Map`: required fields above with facts/inferences/unknowns separated.
- `Change Rehearsal`: labeled before state and, when applicable, same-scenario after state with post-refactor consumer essentials distinct from hidden implementation evidence.
- `Pressure And Admission`: evidence, owning boundary, abstraction-value step, and `current-dependency | accepted-refactor | deferred-debt | unknown`.
- `Disposition`: remove | narrow | reuse | reshape | extract | facade | defer | unknown, with main-owned rationale.
- `Runtime Proof`: exact representative invocation, expected/actual behavior, effects/errors, validation, and cleanup, or `not run` with the exact reason.
- `Claim Ceiling`: what the exercised scenario supports and what remains unexamined.
