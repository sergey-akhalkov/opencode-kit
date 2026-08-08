## 1. Change Contract

- [x] 1.1 Create the proposal, cross-cutting design, new spec-workflow capability, and complete delta specs for instruction, config-loading, and tools behavior; evidence: artifacts are readable under this change and `openspec status` reports proposal/design/specs done.
- [x] 1.2 Run strict OpenSpec validation and a focused consistency review after the complete task graph exists; evidence: `openspec validate improve-spec-cycle-integrity --strict` exited zero and all four proposal capabilities have matching delta specs and implementation tasks.

## 2. Wave 1 - Spec Capsule And Evidence-Bound Operations

- [x] 2.1 Add compact portable context and per-artifact rules to `openspec/config.yaml` for the seven-field Spec Capsule, no actionable placeholders, current-increment scope, proof-before-completion, and proportional Ordinary Small/Material testing; evidence: `openspec instructions proposal --change improve-spec-cycle-integrity --json` exited zero and exposed the configured context and proposal rules.
- [x] 2.2 Update propose command/skill mirrors to run the propose operation check and strict OpenSpec validation before claiming implementation readiness; preserve current store selection and generated metadata; evidence: both mirrors contain the same maintained policy block and a fixture with missing required artifacts cannot claim ready.
- [x] 2.3 Update apply command/skill mirrors so each task runs its stated observable proof and focused validation before checkbox mutation, failed evidence leaves the task unchecked with raw diagnostics, and apply runs its gate before implementation; evidence: a disposable apply workflow demonstrates both success and failed-proof paths.
- [x] 2.4 Make complete archive fail closed on incomplete artifacts, unchecked tasks, required unsynchronized deltas, and missing/red applicable validation; define a distinct incomplete/abandoned preservation disposition that never claims completion; evidence: archive gate/caller fixtures observe both paths.
- [x] 2.5 Extend `tools/openspec-operation-gate.ts` only for explicit operation facts, integrate it into actual caller paths, and remove or make meaningful the prepush existence-only check; evidence: focused gate invocation returns blocking unchecked-task output and caller integration is observable.
- [x] 2.6 Run the Wave 1 local caller/component proof and preserve command, input fixture, exit status, stdout/stderr, side effects, and artifact paths; evidence: `implementation-evidence/wave1-component-proof.md` records current gate/config observations and the red legacy-fixture validation lane. Prompt-behavior MVP remains blocked until an owner-authorized same-model disposable workflow passes.

## 3. Wave 2 - Live Status And Normative Synchronization

- [x] 3.1 Remove manually maintained active roadmap, wave, commit, lockfile, and CI-run claims from `openspec/project.md`; retain durable guidance and live `openspec list/status` commands; evidence: no active change is inferred when live list is empty.
- [x] 3.2 Replace all six main-spec `TBD` Purpose fields with concise capability purposes derived from current requirements; evidence: main-spec scan returns zero archive-generated Purpose placeholders.
- [x] 3.3 Synchronize canonical UDL step count/sections across main spec, README, docs, templates, and current step-name drift check without introducing a second loop body; evidence: targeted duplicate fixture using all current 12 names fails outside the canonical file.
- [x] 3.4 Align `openspec-consistency-review` and related outputs with optional evidence authority rather than lifecycle approval; evidence: no optional reviewer output can set or block Development-Stage by itself.
- [x] 3.5 Run Wave 2 focused validation and live next-step discovery proof; evidence: current docs match `openspec list/status` and strict OpenSpec validation exits zero.

## 4. Wave 3 - Runtime Loading Truth And Local Preferences

- [x] 4.1 Update README, global/project instruction mirrors, config specs, installer diagnostics, and doctor terminology from exclusive replacement to current additive loader semantics; evidence: no operative bypass/replacement claim remains without artifact-specific live proof.
- [x] 4.2 Add a privacy-safe read-only diagnostic for loader-visible config/instruction/skill/agent/command/plugin source kinds and collisions without printing content or secrets; evidence: current OpenCode 1.18.15 reports both host-default and custom plugin sources safely.
- [x] 4.3 Create and document a schema-supported gitignored machine-local instruction path and move personal language, availability, and authenticated-model facts out of committed portable authority; evidence: portable inventory has no personal anchors and local instructions remain discoverable in an isolated configured process.
- [x] 4.4 Resolve exact default/custom `AGENTS.md` precedence with an isolated disposable loader fixture before deleting or narrowing any authority source; evidence: raw debug/startup observations identify loaded instruction sources without provider calls.
- [x] 4.5 Run Wave 3 doctor, installer check, schema validation, and isolated loader proof; evidence: source diagnostics are accurate, privacy-safe, and no external/default-global state changed.

## 5. Wave 4 - Compaction, Proportional Routing, And Context

- [x] 5.1 Update compaction authority and prompt to always emit the compact six-cell quality/speed/token matrix for the working repository and `opencode-kit`, permit evidence-backed `none`, and admit only local reversible low-cost candidates; evidence: baseline/candidate workflow covers every cell without invented facts.
- [x] 5.2 Update next-session routing to verify candidates against `Original User Goal`, execute at most one highest-ROI goal-linked working-repository improvement, and keep non-blocking kit improvements parked while unrelated work is incomplete; evidence: goal-lock workflow rejects a kit distractor and selects no more than one action.
- [x] 5.3 Make `next-step` recommendation-only and serial by default, with execution/fan-out/review only on explicit request or concrete risk/policy; update Getting Started to teach proportional Ordinary Small versus Material behavior; evidence: single and multi-workstream disposable prompts do not launch workers without authorization.
- [x] 5.4 Narrow the TypeScript/JavaScript prohibition to fuzzy behavior scoring while preserving deterministic structural validators; evidence: instruction review distinguishes allowed exact checks from required disposable behavior evaluation.
- [x] 5.5 Apply only selective always-loaded reductions that pass all relevant material-safety, delegation, handoff, and compaction workflow oracles; evidence: instruction inventory shrinks and no quality oracle regresses. Broad lifecycle reduction remains rejected on any missed oracle.

## 6. Wave 5 - Focused And Low-Noise Validation

- [x] 6.1 Expose focused scripts for validator/contracts, OpenSpec gate, plugin, installer, and other independently owned suites; evidence: each script runs only its declared suite and preserves exact failure status.
- [x] 6.2 Replace per-case green `PASS` noise with stable suite/test-count summaries while retaining full failing-case diagnostics; evidence: full green output is materially smaller and a seeded failure preserves exact context.
- [x] 6.3 Remove the no-op prepush operation process when Wave 1 does not give it a meaningful unique check, and run focused checks during iteration plus one complete freeze validation; evidence: prepush plan has no ceremony-only process and retains all unique gates.
- [x] 6.4 Compare serial and bounded-concurrent full-suite execution on the same candidate and environment; retain concurrency only if wall time improves without timeout, flakes, resource contention, or diagnostic loss; evidence: immutable raw timings and outcomes, otherwise serial remains default.

## 7. Material Qualification And Handoff

- [x] 7.1 Complete all accepted production/instruction/config/tooling waves and their current local proof lanes without optional polish; evidence: no accepted task above remains unchecked and Candidate Reference covers every affected path.
- [x] 7.2 After accepted-scope completion and current representative proof, run one fresh test-only critical SDET with exact test write scope and no production paths; evidence: terminal `critical-risks-reported | no-critical-risk | blocked` report and main disposition.
- [x] 7.3 Run applicable focused checks, `npm run validate:strict`, complete repository tests, `npm run openspec:validate`, instruction inventory, and OpenSpec prepush validation on the current candidate; evidence: raw commands and exit statuses are preserved.
- [x] 7.4 Run owner-authorized same-model disposable prompt workflows for every behavior-affecting instruction lane; evidence: baseline/candidate inputs, environment identity, quality oracles, time/rework, and keep/discard decisions. Without external-call authorization the prompt-path candidate remains `development`.
- [x] 7.5 Complete the local handoff with Candidate Reference, proof/evaluator/environment identities, validation, SDET terminal reason, known non-critical limitations, rollback notes, and `External Operations: not performed`; evidence: the next monotonic RC is frozen only after every applicable gate is current.
