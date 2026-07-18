## Context

The kit currently has three partial feedback mechanisms that do not form one learning loop:

- `complain` appends privacy-safe Markdown entries under `docs/feedbacks/` and intentionally does not block the current task.
- `instructions/leaf-reviewer-agent-contract.md` describes optional Prevention Feedback with recurrence, target, draft rule, and replay fields.
- `tools/instruction-feedback-ledger.ts` maintains a separate ignored JSON state machine with `open -> applied -> replayed -> resolved`, exact duplicate detection, routing hints, and a basic one-in-one-out check.

The current repository has eight concrete Markdown feedback entries and all are still open, while `.opencode/state/instruction-feedback-ledger.json` is absent and the machine CLI reports no entries. Reviewer and worker reports do not consistently emit a machine-consumable prevention signal, other repositories cannot safely write into this kit, and no background adapter imports or processes the feedback.

The desired outcome is fewer SDLC return loops, not more feedback prose. The portable kit must therefore treat a return from one stage to an earlier owner as the primary event, keep current-task correction binding, and send a separate future-prevention signal to a discovered adapter without making that adapter or Temporal mandatory.

The coordinated Dream Team change `add-background-sdlc-learning-operation` owns the strict `dream-team.sdlc-learning-signal.v1` wire schema, durable Temporal processing, raw event state, triage execution, target worktrees, and status/result APIs. This change owns portable semantics, instruction placement, fallback behavior, generalization, replay, and prompt-budget discipline.

## Goals / Non-Goals

**Goals:**

- Define a compact, canonical Prevention Signal that can be derived from reviewer, SDET, validation, delivery, production-worker, and orchestrator evidence.
- Emit one signal for every qualifying mandatory-gate or reproducible P0/P1 return without delaying correction of the current candidate.
- Discover a conforming background adapter and degrade to a local feedback candidate when none is available.
- Prefer reusable, technology-neutral prevention while retaining explicit repository-local specialization when required.
- Route unknown cause to investigation rather than guessed rule changes.
- Put mechanically enforceable prevention into validators/tools before adding prose.
- Keep global and role instruction context bounded through canonical placement, replacement, deduplication, and token budgets.
- Require isolated candidate production, existing Change-Ready qualification, replay evidence, and explicit activation outside the originating session.
- Reconcile existing Markdown feedback and the unused ignored JSON lifecycle without losing current entries.

**Non-Goals:**

- Require Dream Team, Temporal, a plugin, or a global feedback service in every project.
- Add a blocking retro stage to the critical path of every task.
- Automatically edit the active `OPENCODE_CONFIG_DIR`, merge, update a primary/user ref, commit to a user branch, push, install, reload, or activate an improvement. Machine-owned detached candidate commits inside isolated workspaces remain permitted.
- Treat severity alone, every product defect, every P2 note, or every tool error as a reusable instruction problem.
- Encode fuzzy root-cause, semantic grouping, priority scoring, or generalization judgment in deterministic helpers.
- Copy Dream Team's wire schema, Temporal logic, storage, or worktree implementation into this repository.

## Decisions

### 1. Continuous learning is an orthogonal plane

The existing Change-Ready lifecycle remains the critical path. A serious finding still routes synchronously to the correct current-task owner and invalidates affected proof/gates. In parallel, the orchestrator emits a Prevention Signal through the discovered learning adapter. Failure to submit future-prevention feedback does not waive the current correction and does not by itself block current Change-Ready unless project policy explicitly requires learning capture.

```text
current finding -> current correction -> affected gate replay
        |
        +-> prevention signal -> background adapter or local fallback
```

Alternative rejected: insert retro between final review and handoff. That would increase latency for every task and make improvement-system availability a delivery dependency.

### 2. Return edges are the primary observable event

The learning policy names `fromStage` and `toStage` for every signal. Qualifying sources are:

- mandatory-gate or reproducible P0/P1 final-review return;
- SDET-discovered production defect or test-boundary blocker that routes backward;
- validation failure that routes to production or test ownership;
- delivery/readiness blocker that returns to an earlier lifecycle stage;
- production worker `blocked` or `needs-review` caused by briefing, scope, permission, tool, validation-contract, or ownership defects;
- correction-budget exhaustion or repeated unchanged-candidate failure;
- explicit high-impact workflow friction captured through `complain`.

P2/note feedback remains residual unless it repeats or is explicitly promoted by a later retro. Severity alone is not enough; the signal must name the return or recurrence path.

### 3. One canonical Prevention Signal, minimal role deltas

`instructions/leaf-reviewer-agent-contract.md` remains the canonical reviewer source. Its existing optional Prevention Feedback block will become a compact canonical Prevention Signal with these semantic fields:

- `Source Event ID`
- `Source Role`
- `From Stage`
- `To Stage`
- `Trigger`
- `Severity`
- `Observed Failure`
- `Violated Invariant`
- `Root Cause Status` and evidence, or `unknown`
- `Recurrence Path Status` and explanation, or `unknown`
- `Scope Hint`: reusable, repository, both, unknown
- `Prevention Target`
- `Intervention Hint`
- `Replay Oracle Status` and procedure, or `unknown`
- privacy-safe evidence references

`Source Event ID` is a fixed collision-resistant identifier, never concatenated raw source ids. `tools/learning-signal-id.ts` computes:

```text
srcv1-<lowercase hex SHA-256>
```

The SHA-256 preimage is UTF-8 domain `opencode-kit:learning-source-event:v1\0` followed by length-framed components. Each frame is `<decimal UTF-8 byte length>:<exact UTF-8 bytes>`. The ordered preimage is event kind, original source role, decimal source-component count, each source identity component, `fromStage`, and `toStage`. Event kinds and source components are: reviewer `(report id, finding id)`, worker `(run id, attempt id, status code)`, validation `(package identity, check id, failure index)`, SDET `(report id, action/finding id)`, delivery `(report id, finding id)`, and explicit friction `(session-scoped correlation id, feedback id)`. Empty required components return `blocked`. Spaces, Unicode, colons, separators, and long valid source ids are hashed as bytes and never rejected or copied into the wire id. `Source Role` is the known lowercase kebab-case role that produced the finding, not the primary orchestrator; unsupported role identity blocks binding rather than being guessed.

The exhaustive qualifying-source identity matrix is:

| Qualifying source | Event kind | Ordered source identity components |
|---|---|---|
| final/specialist reviewer P0/P1 or mandatory gate | `reviewer` | report id, finding id |
| production worker blocked/needs-review | `worker` | run id, attempt id, status code |
| validation failure | `validation` | Package Identity, check id, failure index |
| SDET production defect or blocker | `sdet` | SDET report id, action or finding id |
| delivery/readiness blocker | `delivery` | delivery report id, finding id |
| correction budget exhausted | `correction-budget` | Semantic Candidate Identity, declared budget id, terminal iteration |
| unchanged-candidate repeated failure | `unchanged-candidate` | Package Identity, failed check or finding id, occurrence index |
| explicit high-impact friction | `explicit-friction` | session-scoped correlation id, feedback id |

No other event kind qualifies in v1. The deterministic helper rejects an unknown kind or missing component. Every row has valid fixtures containing safe, separator-containing, Unicode, and long source ids, plus a cross-row fixture proving domain separation.

The exact Dream Team v1 mapping is:

| Canonical Prevention Signal | Dream Team wire field |
|---|---|
| constant accepted version | `schemaVersion` |
| `Source Event ID` | `idempotencyKey` |
| `Source Role` | `sourceRole` |
| normalized stage names | `fromStage`, `toStage` |
| normalized serious-return reason | `trigger` |
| normalized P0/P1/P2/note | `severity` |
| same bounded semantic text | `observedFailure`, `violatedInvariant` |
| known/unknown plus confidence/evidence | `rootCause` |
| known/unknown plus expected preventer/why missed | `recurrencePath` |
| reusable/repository/both/unknown | `scopeHint` |
| normalized intervention kind | `interventionHint` |
| singular or multiple targets normalized to 0..8 records | `preventionTargets` |
| defined/unknown procedure and observation | `replayOracle` |
| bounded ids, relative paths, hashes, artifact/command ids | `evidenceRefs` |

The on-demand skill consumes the exact enums and bounds from the accepted Dream Team contract and its fixture hash. It does not restate the Zod implementation. Unsupported values, bounds, or accepted versions fail binding validation and use fallback.

Role agents will not copy this block. Reviewers keep their existing contract reference. Non-reviewer roles add only a one-line route to the canonical learning skill or return a `Feedback Candidate` when their report shape needs it. The main orchestrator owns adapter submission after receiving a report.

Alternative rejected: require every leaf agent to invoke a side-effectful feedback tool. Leaf reviewers must remain read-only and must not own background orchestration.

### 4. The v1 adapter binding is exact and optional

An on-demand `continuous-sdlc-learning` skill owns adapter selection and submission semantics. The always-loaded global instructions and Change-Ready skill contain only a short routing hook. V1 does not infer capabilities from arbitrary tool descriptions. It trusts only an explicit kit-owned binding that names an accepted tool pair and contract version.

The initial optional binding is:

- submit: `dream_team_learning_submit`;
- status: `dream_team_learning_status`;
- retro: `dream_team_learning_retro`;
- wire versions: `dream-team.sdlc-learning-signal.v1`, `dream-team.sdlc-learning-ack.v1`, `dream-team.sdlc-learning-status.v1`, `dream-team.sdlc-learning-result.v1`, and `dream-team.sdlc-learning-retro-request.v1`;
- qualification version: `dream-team.learning-qualification-profile.v1`;
- trust source: the accepted Dream Team OpenSpec/runtime contract and the installed MCP tool schemas.

The binding is selected only when the exact tools are visible to the primary orchestrator and the accepted version is supported. Its normative guarantees are:

- accept a strict versioned signal through a tool schema;
- return after accepted durable submission rather than background completion;
- provide opaque correlation and status retrieval;
- own raw storage and cross-repository authority;
- avoid direct mutation of the active workspace;
- expose no remote or activation side effects by default.

When the exact Dream Team binding is available, the skill maps the canonical Prevention Signal into `dream_team_learning_submit`, retains its opaque learning id, and uses `dream_team_learning_status` for later bounded status. The MCP schemas remain the machine source of truth. The kit does not duplicate the TypeScript/Zod wire schema.

A terminal status embeds the bounded `dream-team.sdlc-learning-result.v1`; the kit does not expect a separate result tool. Retro uses `dream_team_learning_retro` with the accepted `dream-team.sdlc-learning-retro-request.v1` selector contract and is observed through the same status tool.

Supporting arbitrary third-party adapters requires a future versioned capability-descriptor change. V1 does not guess generic tool names, durability, storage ownership, or mutation guarantees.

The exact Dream Team qualification profile binds kit-owned agents `sdet-quality-engineer`, `instruction-artifact-reviewer`, `final-candidate-reviewer`, and `session-delivery-reviewer`. Their agent definitions retain native behavior and add one compact conditional: when input validates as `dream-team.learning-qualification-stage-input.v1`, follow its identity-bound return contract and emit the strict `<DREAM_TEAM_LEARNING_STAGE_RESULT>` envelope. Dream Team owns that machine schema and availability/permission check; the kit owns role semantics and installed assets. The SDET conditional preserves its native two-phase lifecycle and identities: provisional result keeps immutable pre-SDET and current pairs; the orchestrator inspects scope, recaptures current identities, reruns post-test proof/validation, then resumes the same session with required provisional report/session links; final output preserves the pre-SDET pair and reports the recaptured current pair. The Kit Binding Checkpoint proves all four agents are visible and their accepted native outcomes match the profile. Missing agents block Dream Team candidate readiness but do not affect proposal-only or local fallback behavior.

When the exact binding is unavailable, the orchestrator uses phase-safe `complain` fallback or returns a privacy-safe local `Feedback Candidate`. Before first mutation or after local handoff, `complain` may append to the repository fallback ledger. During candidate freeze, qualification, validation, or final review, it must not mutate the scoped workspace and returns a `Feedback Candidate` for later capture. It does not block the current task, invent a background session, or claim submission.

### 5. Raw events and curated repository artifacts have different owners

Raw adapter events, retries, grouping state, and workflow status remain adapter-owned and outside Git. This repository stores only:

- existing local fallback complaints;
- curated OpenSpec changes;
- accepted instruction/tool/validator candidates;
- replay fixtures and deterministic validation evidence;
- compact provenance through opaque signal ids where safe.

The ignored `.opencode/state/instruction-feedback-ledger.json` is removed as a competing source of truth. Compact curated lifecycle state lives in `docs/feedbacks/curated-prevention-ledger.json` with schema version `opencode-kit.curated-prevention-ledger.v1` and maximum serialized size 2 MiB. The strict root is `{schemaVersion, records}` with 0..2000 records sorted by id.

Every record has: `id` matching `prevent-[a-f0-9]{64}`; strict `owner {scope:reusable|repository,key:sha256:<64 lowercase hex>}`; `sourceRefs` 1..100 unique sorted strict `{kind:adapter|fallback|replay,id:1..256 safe opaque characters}`; strict `target {kind:instruction|agent|skill|validator|tool|workflow|test-harness|architecture|investigation,ref:1..256}`; RFC3339 `createdAt` and `updatedAt`; and one status variant:

- active: `status: open | applied | replayed | resolved`; optional `lineage` is allowed only for open and is strict `{kind:still-failing-successor,predecessorId:prevent-<64 hex>,replayEvidenceId:1..128}`; a successor created from still-failing requires lineage and a matching replay sourceRef; `appliedRef {artifactId:1..128,candidateIdentity:sha256}` forbidden for open and required otherwise; `replayRefs` forbidden for open/applied and 1..16 sorted strict `{result:passed|still-failing,evidenceId:1..128,replayedAt:RFC3339}` for replayed/resolved; resolved additionally requires `resolvedAt` and every replay result passed;
- duplicate: `status: duplicate`, required `duplicateOf`, no applied/replay/resolved fields;
- superseded: `status: superseded`, required `supersededBy`, no applied/replay/resolved fields.

`duplicateOf`, `supersededBy`, and lineage predecessor reference a different existing record. Duplicate/superseded links are mutually exclusive; lineage is forbidden on those variants. The complete directed linkage graph must be acyclic. A still-failing successor's predecessor must contain the referenced still-failing replay evidence. Unknown fields and invalid conditional combinations fail. Object order follows schema order; records/source/replay refs use the stated stable sorting. The ledger never contains raw complaints, prompts, transcripts, diffs, source contents, or secrets. Complete valid/invalid fixtures cover every status, transition, linkage/cycle, bound, ordering, duplicate id/ref, missing target, failed resolved replay, timestamp, and size rule.

`tools/instruction-feedback-ledger.ts` becomes a deterministic validator/import/report helper over this explicit curated ledger and Markdown fallback records, or is split under `tools/` if implementation analysis shows multiple concerns. Updates use stable ordering and failure-atomic replace. Allowed transitions are validated; restart reads the tracked curated record rather than hidden process state. Markdown import preserves current status and never synthesizes resolution, root cause, adapter submission, or replay.

Existing Markdown entries remain valid fallback records and receive a one-time inventory/report. They are not automatically marked resolved or converted into global rules.

### 6. Generalization uses a two-layer result

Every accepted prevention recommendation is evaluated as:

1. a technology-neutral invariant or ownership/evidence rule;
2. an optional repository-specific adapter that names commands, paths, schemas, or domain constraints.

Reusable promotion requires that the rule is understandable without the source project, avoids project identifiers, targets a recurrence class rather than one symptom, preserves known valid exceptions, and has at least one representative neutral replay. A single P0 may justify reusable promotion only when cause and broad invariant are supported; otherwise it becomes a proposal or investigation.

Deterministic helpers validate fields, paths, bounds, exact duplicates, references, and token counts. An analyst/reviewer judges root cause, semantic grouping, generalization, and exception quality.

### 7. Prevention placement follows automation-first authority

Interventions are placed in this order:

1. validator, schema, hook, tool, generator, or deterministic helper for mechanically checkable behavior;
2. existing workflow/skill for orchestration or conditional judgment;
3. role agent for role-specific behavior;
4. `global/AGENTS.md` only for a short always-loaded routing or safety invariant;
5. local project instructions for repository-specific behavior;
6. new skill or agent only when trigger, responsibility, permissions, or output contract is genuinely distinct.

Incident narratives, examples, source dumps, and rule provenance stay out of runtime prompts. They belong in feedback evidence, fixtures, specs, or reports.

### 8. Instruction growth is a budgeted replacement transaction

The implementation first adds a deterministic scoped inventory mode that emits a complete stable JSON manifest for the runtime corpus:

- `global/AGENTS.md`
- `global/agents/**/*.md`
- `global/skills/**/*.md`
- `instructions/**/*.md`

The immutable baseline artifact is `openspec/changes/integrate-continuous-sdlc-learning/implementation-evidence/instruction-runtime-baseline.json`. It records the baseline Git ref, exact existing paths, per-file token proxy, total token proxy, algorithm version, content hash, and `authorizedAddedPaths`. This change predeclares exactly one runtime addition, `global/skills/continuous-sdlc-learning/SKILL.md`, with zero baseline contribution. It is captured after the scoped-inventory helper exists but before any runtime instruction artifact changes.

For this change, total token proxy for the union of baseline paths and declared additions must not increase relative to that manifest. `global/AGENTS.md` must not increase independently. New on-demand learning guidance must be paid for by removing or consolidating duplicated feedback, deterministic-helper, or role boilerplate. Validation uses the same algorithm version and path set plus exact declared additions. Any undeclared added runtime path, removed baseline path without a tracked deletion, algorithm change, or scope change fails comparison and requires explicit pre-mutation recapture rather than silent acceptance.

Future prevention candidates must report before/after token proxy for the changed runtime corpus and identify replaced or removed concepts. A candidate cannot satisfy one-in-one-out by deleting unrelated safety constraints or by splitting the same prose across files. Deterministic validation checks counts and duplicate text; `instruction-artifact-reviewer` judges semantic replacement and authority placement.

Alternative rejected: count only Markdown bullets or allow every P0 to append one rule. Both produce monotonic prompt growth and conflicting overrides.

### 9. Background candidates follow existing Change-Ready gates

The adapter may start candidate preparation immediately, but it must work in an isolated repository workspace. Loaded global files and the current task candidate are immutable inputs. A candidate that changes instructions, agents, skills, plugins, validators, or generated output follows the normal classification, proof, fresh SDET, validation, final review, and Material delivery/readiness requirements.

Ready means a retained local candidate or OpenSpec proposal with evidence. A machine-owned detached commit/object may retain that candidate inside its isolated workspace, but it must not update a primary/user ref. Ready does not mean integrated, installed, activated, or visible to already running sessions. Activation requires a separately accepted integration and a new/restarted OpenCode session.

### 10. Replay, decay, and retro are evidence-based

The prevention lifecycle remains `open -> applied -> replayed -> resolved`. `resolved` requires a fresh replay against the accepted rule/tool and its representative neutral cases. `still-failing` creates a new finding against the applied intervention rather than silently reopening history.

Retro may be triggered by reusable P0 evidence, repeated return identity, cross-project recurrence, stale applied entries, or explicit owner request. It reports exact counts and evidence instead of hidden scores. It returns only `candidate`, `openspec`, `local`, `investigation`, `duplicate`, or `no durable action` decisions.

Absence of later complaints is not proof of prevention. Decay review may remove or consolidate an instruction only when replay/eval evidence and remaining authority coverage support removal.

### 11. Metrics measure returns, not complaint volume

The learning report tracks first-pass acceptance, return edges by stage pair, replayed gates, repeated recurrence ids, affected project counts, instruction token budget, and prevention replay outcomes. Complaint count alone is not an optimization target.

## Risks / Trade-offs

- **Risk: adapter-specific wording leaks into portable global policy.** Mitigation: one on-demand adapter binding, generic always-loaded hook, fallback contract, and validation that portable requirements do not make Dream Team mandatory.
- **Risk: submission becomes another blocking gate.** Mitigation: current correction remains independent, submission returns after accepted start, and adapter absence degrades to a phase-safe local record or non-mutating Feedback Candidate without blocking readiness.
- **Risk: agents overproduce Prevention Signals.** Mitigation: qualifying return criteria, current-versus-future separation, no automatic P2 promotion, and exact report validation.
- **Risk: useful instructions are deleted merely to meet a token cap.** Mitigation: semantic replacement review, preserved authority coverage, replay fixtures, and prohibition on unrelated deletion.
- **Risk: local fallback Markdown continues to grow.** Mitigation: it is used only without an adapter, raw adapter events remain external, and retro groups records without copying narratives into runtime prompts.
- **Risk: Dream Team wire contract changes independently.** Mitigation: versioned adapter binding, strict unknown-version failure, coordinated cross-repository smoke, and no copied schema.
- **Trade-off: candidate activation is not immediate.** Immediate analysis and candidate production are preserved; unsafe self-installation is intentionally excluded.

## Migration Plan

1. Capture current instruction inventory, feedback record inventory, and validator baselines without changing runtime behavior.
2. Add canonical Prevention Signal semantics and focused fixtures while retaining current `complain` behavior.
3. Add the on-demand learning skill, exact Dream Team binding selection, and phase-safe unavailable-binding fallback tests.
4. Add the Dream Team binding only after receiving the **Dream Team Contract Checkpoint**: all wire/tool/qualification-profile versions, exact valid/invalid fixture hashes, Dream Team Semantic Candidate Identity, Package Identity, Identity Recipe, complete local proof, final SDET, and local validation with no unresolved P0/P1. Cross-repository smoke, final review, and delivery remain pending at that checkpoint.
5. Replace duplicated role/global prose and enforce the non-growth budget.
6. Create the versioned curated lifecycle ledger and rework the instruction feedback helper so hidden JSON is no longer a competing source of truth; inventory existing Markdown entries without changing their status.
7. Freeze a **Kit Binding Checkpoint** containing the bound Dream Team checkpoint, kit Semantic Candidate Identity, Package Identity, Identity Recipe, proof, final SDET, instruction-artifact review, local validation, and no unresolved P0/P1.
8. Run one cross-repository smoke against the exact Dream Team and Kit checkpoints in a synthetic external project and isolated `opencode-kit` target.
9. Run independent final reviews and required delivery/readiness gates in each repository against the smoke-bound identities.
10. Enable normal emission only after both candidates are separately accepted and integrated by their repository owners.

Rollback removes the adapter binding and emission hook while retaining `complain` fallback and existing feedback records. It must not delete raw adapter state or mark unresolved entries complete. Because no automatic integration or activation exists, rollback does not require mutating external projects.

## Validation Plan

- Fixture tests for each qualifying and non-qualifying return edge.
- Contract tests for known and unknown cause/recurrence/replay fields.
- Exact binding available/unavailable, unknown accepted version, rejection, timeout, duplicate-submission, status-tool, and phase-safe fallback tests.
- Generalization fixtures covering reusable, repository, both, investigation, product-only, and over-generalized outputs.
- Instruction inventory tests proving `global/AGENTS.md` and total runtime corpus do not grow.
- Duplicate and authority-placement checks across global instructions, agents, skills, and canonical contracts.
- Replay lifecycle tests for applied, replayed, resolved, and still-failing transitions.
- Loader/schema tests for every changed skill, agent, plugin binding, and permission surface.
- Cross-repository Dream Team smoke with immediate acknowledgement, later terminal status, no source/global primary mutation, and a retained isolated result.
- Full `npm run validate:strict` and `npm test` after focused checks.

## Open Questions

None. Automatic integration, periodic scheduling policy, candidate cleanup, and additional background adapters are separate future changes.
