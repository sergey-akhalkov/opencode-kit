# Repository Principles Alignment Audit

- Audit date: 2026-08-21
- Repository: `opencode-kit`
- Candidate: current workspace observed on 2026-08-21; dirty worktree, not `HEAD` alone
- Mode: review-only
- Canonical criteria: `global/principles-of-work.md`
- Verdict: `findings`
- Evidence priority: live output and source/tests/schemas/scripts over prose, task checkboxes, or archived summaries

## Goal And Scope

Assess whether the repository reliably improves work in unrelated projects while preserving the ordered principles: safety and quality, reversible autonomy, fast feedback, simplicity, and evidence-backed improvement. The audit covered committed and current workspace instruction/config artifacts, agents, skills, commands, plugins, portable tools, installers, tests, CI, canonical specs, four active OpenSpec changes, representative evidence indexes/bundles, runtime-source diagnostics, and installed provider-free proof boundaries.

Generated/vendor/cache trees were excluded. Secret-bearing machine-local config contents were not read; only privacy-safe source and permission facts were inspected. Repeated raw evidence bundles were reviewed by lane, index, terminal result, and history rather than treated as independent semantic documents.

## Coverage

- 1,427 tracked files; 1,149 under `openspec/`
- 167 code files inventoried; 24 split candidates at 800 or more lines
- 59 instruction artifacts, 29 global skills, 18 global agents
- 64 privacy-safe runtime sources inventoried
- 17 OpenSpec items initially validated: 16 passed, 1 failed
- Independent read-only reviews: instruction/runtime, tests, code reduction, deployment/portability, OpenSpec architecture, and performance/reliability
- Index coverage was checked for cited paths and repository scopes; no recorded parse gap existed in cited tracked source, while gitignored runtime config remained intentionally outside the graph

## Positive Evidence

- `npm.cmd run validate:strict` passed with 29 skills, 18 agents, no warnings.
- `npm.cmd test` passed.
- Installed permission proof passed with 189 explicit specialist denials and an all-false arbiter tool map.
- Provider-free doctor qualification, unrelated-project unattended readiness, roadmap mission preflight, and guard question composition proofs passed with cleanup complete.
- `global/principles-of-work.md` is concise, ordered, and internally coherent.
- Ordinary Small routing is separated from Material qualification.
- Proof tooling generally distinguishes static, provider-free, installed, and live evidence and exposes cleanup/effect contracts.

## Findings

### AUD-001: Completed change can be invalid and still appear qualified

- Severity: high
- Confidence: high
- Principle impact: Outcome over Output; Trust but Verify; Definition of Done
- Evidence: `openspec/changes/reduce-workflow-ceremony/tasks.md` records 17/17 and RC1, while `openspec validate --all` returns one failure because seven `MODIFIED` requirements omit canonical scenarios. `npm run validate:strict` and `doctor --require qualification` still pass.
- Consequence: maintainers and agents can act on a false ready/RC signal.
- Likely root cause: qualification and task-state gates do not compose selected strict delta validation, current candidate identity, and repository-wide OpenSpec consistency.
- Disposition: reopen and correct the existing `reduce-workflow-ceremony` owner; add prevention under `reconcile-openspec-ownership-and-evidence`.

### AUD-002: No maintained current-candidate consumer outcome gate

- Severity: high
- Confidence: high
- Principle impact: Working Software; Dogfooding; Goodhart's Law
- Evidence: CI runs structural validation, tests, inventory, and OpenSpec validation but no maintained matched baseline/candidate consumer proof. Provider-free proof runners exist and pass when invoked manually.
- Consequence: repository changes can optimize proxy counts while real unrelated-project outcomes regress or remain unchanged.
- Likely root cause: proof runners evolved per change without one accepted consumer outcome owner.
- Disposition: `establish-consumer-outcome-regression-gate`.

### AUD-003: Always-loaded and discovery surface is broad by default

- Severity: high
- Confidence: high for size/surface, medium for model-effect magnitude until matched capture
- Principle impact: Fast Feedback; Occam's Razor; KISS; Information Foraging
- Evidence: loader-visible inventory measured about 13,356 startup token-proxy, 2,246 discovery metadata, 66,537 on-demand body token-proxy, 55 on-demand artifacts, 29 skills, and 18 agents. Only `profiles/all.json` is available as an install surface. Current budget limits further growth but grandfathers the existing baseline.
- Consequence: every project pays routing/context cost for unrelated domains and has a larger false-trigger surface.
- Likely root cause: capabilities were added to one universal profile faster than default ownership was narrowed.
- Disposition: `minimize-default-runtime-surface`.

### AUD-004: Personal machine authority is committed into the portable runtime

- Severity: medium; high when used by another owner or machine
- Confidence: high
- Principle impact: Least Authority; Zero Trust; Portability
- Evidence: `global/AGENTS.md` names Sergey and grants durable host/admin authorization; `global/opencode.json.template` and active global config use top-level `permission: allow`. The canonical spec already says personal runtime facts belong in a gitignored source.
- Consequence: the shipped global source is not owner-neutral and safety depends on prose rather than a portable least-authority default.
- Likely root cause: machine-local autonomy policy was placed in the same owner as reusable runtime policy.
- Disposition: `minimize-default-runtime-surface`, with machine-local authorization preserved in an official gitignored instruction/config layer.

### AUD-005: Skill discovery metadata is broader than the actual domain

- Severity: medium
- Confidence: high
- Principle impact: Least Surprise; Context Economy
- Evidence: `openspec-apply-change` discovery text matches generic implementation requests and `openspec-propose` matches generic build requests; OpenSpec specificity is stronger in bodies than descriptions. The validator accepts a trigger phrase anywhere in the file rather than proving description precision.
- Consequence: unrelated work can load OpenSpec ceremony and context.
- Likely root cause: body-level routing validation was used as a proxy for discovery metadata quality.
- Disposition: `minimize-default-runtime-surface`.

### AUD-006: OpenSpec and evidence dominate repository navigation

- Severity: high
- Confidence: high
- Principle impact: Information Foraging; Fast Feedback; Token Economy
- Evidence: 1,149 of 1,427 tracked files are under `openspec/`; 1,134 are change files. `add-autonomous-roadmap-mission-runtime` alone has 230 tracked files, a 551-line history, and no bounded evidence index while its product happy path remains incomplete.
- Consequence: indexing, review, change discovery, and agent context are dominated by process/evidence rather than current product owners.
- Likely root cause: each attempt retained a new tree without a mandatory active evidence topology and retention rule.
- Disposition: `reconcile-openspec-ownership-and-evidence`.

### AUD-007: Active changes can claim the same requirement owner

- Severity: high
- Confidence: high
- Principle impact: Single Responsibility; Safe Parallelism; Preserve the Worktree
- Evidence: `fix-workstation-restart-reliability` and `optimize-shared-opencode-runtime-resources` both modify Restart behavior with different process/listener sets.
- Consequence: valid individual deltas can merge into incompatible lifecycle semantics or concurrent writes.
- Likely root cause: no active-change requirement/file ownership conflict gate.
- Disposition: `reconcile-openspec-ownership-and-evidence`; current workstation changes must reconcile before another workstation delta begins.

### AUD-008: Checked tasks can use a weaker proof envelope than their wording

- Severity: high
- Confidence: high
- Principle impact: Evidence Is Not Authority; Definition of Done
- Evidence: `optimize-shared-opencode-runtime-resources/tasks.md` marks Desktop/tray Restart and actual-client workflow work complete while its history says the current server was intentionally not restarted and actual tray/Desktop paths were not exercised.
- Consequence: later sessions trust a checkbox that overstates the real boundary.
- Likely root cause: task checkoff validates artifact presence but not the task's named entrypoint/effect/identity envelope.
- Disposition: correct the current change before archive; add prevention under `reconcile-openspec-ownership-and-evidence`.

### AUD-009: Windows product behavior lacks Windows merge validation

- Severity: high
- Confidence: high
- Principle impact: Dogfooding; Test What You Ship
- Evidence: repository and consumer CI use Ubuntu only while installer/workstation behavior is Windows-specific. On the audited host, bare `npm` and `openspec` resolved to blocked PowerShell `.ps1` shims; `.cmd` entrypoints worked.
- Consequence: documented setup can fail before any kit logic runs, and Windows-only regressions merge without native execution.
- Likely root cause: cross-platform claims were tested primarily through fixtures and Linux CI.
- Disposition: `harden-cross-platform-bootstrap-validation`.

### AUD-010: MCP installer and machine-local path separation are under-tested

- Severity: medium
- Confidence: high
- Principle impact: Portability; Fail Fast; Reversibility
- Evidence: no automated test references `install-code-intelligence-mcps.ts`; committed workstation configuration contains host-specific absolute paths even though reusable config specs require machine-local separation.
- Consequence: bootstrap/install behavior and a clean checkout on another machine are not protected by regression gates.
- Likely root cause: host proof substituted for portable installer/config fixtures.
- Disposition: `harden-cross-platform-bootstrap-validation`; workstation config mutation waits for active workstation owner reconciliation.

### AUD-011: Completion evidence scans the entire session table before bounding output

- Severity: high
- Confidence: high
- Principle impact: Fast Feedback; Reliability; Load Isolation
- Evidence: `global/plugin/session-delivery-context/evidence.ts` executes `select * from session`; completion audit calls it before final request-byte enforcement.
- Consequence: one large session database can add global latency and memory pressure to every guarded root.
- Likely root cause: projection limits were added after database materialization rather than at the owning query boundary.
- Disposition: `bound-completion-runtime-hot-paths` after current `session-completion-guard` delta ownership closes.

### AUD-012: Guard status persistence can spin without a deadline

- Severity: high
- Confidence: high
- Principle impact: Fail Closed; Bounded Recovery; Isolation
- Evidence: `GuardStatusReporter.persistConverged` uses `while (true)` without iteration or wall-clock bound.
- Consequence: continuously changing state or failed convergence can repeatedly update one session and starve other work.
- Likely root cause: convergence correctness has no explicit overload/failure contract.
- Disposition: `bound-completion-runtime-hot-paths`.

### AUD-013: Global runtime lacks complete backpressure and timeout ownership

- Severity: medium-high
- Confidence: high for missing bounds, medium for incident likelihood
- Principle impact: Reliability; Causally Different Recovery
- Evidence: multiple guard instances can start one arbiter each without a global scheduler; several roadmap controller `runPortableCommand` calls omit timeout values.
- Consequence: provider saturation, queue growth, or hung child processes can delay unrelated projects.
- Likely root cause: limits are per root/slice while the shared process lacks a global resource owner.
- Disposition: `bound-completion-runtime-hot-paths`.

### AUD-014: Project inventory misclassifies this repository

- Severity: medium
- Confidence: high
- Principle impact: Information Foraging; Determinism
- Evidence: `project:inventory` reports `Test Roots: none` and only `tools/proofs/lib` as source roots despite `tools/test*.ts` and production roots. The focused test does not assert `testRoots`.
- Consequence: humans and agents start broad work from a false map and can miss tests or production owners.
- Likely root cause: root detection recognizes only conventional directory names and tests fixtures that do not represent the kit layout.
- Disposition: `repair-project-inventory-and-maintenance-debt`.

### AUD-015: Maintainability debt has proven deletion and reuse candidates

- Severity: medium
- Confidence: high for named candidates
- Principle impact: Occam's Razor; Single Responsibility
- Evidence: 24 split candidates; `tools/windows/opencode-workstation.ts` has 2,479 lines and 96 functions; completion controller has 1,348 lines; a candidate subset of `kdco-primitives` has no imports while notify/cmux-referenced modules remain live; graph similarity found repeated exact proof/parser/hash helpers.
- Consequence: change locality and review confidence decline; new proof work tends to copy helpers.
- Likely root cause: feature/evidence expansion outpaced responsibility extraction and dead-owner removal.
- Disposition: `repair-project-inventory-and-maintenance-debt`; only evidence-proven deletion/reuse is accepted, while workstation/controller splits remain owner-blocked or `split-or-justify`.

## Redundancy Matrix

| ID | Candidate | Class | Disposition | Required proof |
|---|---|---|---|---|
| RED-001 | Candidate unreferenced primitives: `index.ts`, `get-project-id.ts`, `log-warn.ts`, `mutex.ts`, `shell.ts`, `temp.ts`, `terminal-detect.ts` | dead-code candidates; notify/cmux-referenced modules excluded | delete only the subset that remains zero-consumer after loader/source inventory | installed plugin inventory and full tests unchanged |
| RED-002 | Local `hashRef`, `dataOf`, `record`, `exactKeys` copies | exact/near duplicate | reuse existing owner when contracts match | focused behavior and import-boundary tests |
| RED-003 | Repeated proof `stableValue`, `required`, `writeNew`, option parsers | overlapping responsibility | extract only repeated exact contracts; avoid generic framework | each unique proof oracle retained |
| RED-004 | Active OpenSpec raw attempt trees | duplicate evidence topology | keep one bounded active set plus causal/terminal indexes | replay and traceability remain complete |
| RED-005 | Large workstation and guard owners | mixed responsibility | split only inside owning behavior change or record `split-or-justify` | same real entrypoint and rollback proof |

## Test Gap Matrix

| ID | Behavior | Existing evidence | Missing gate | Owner |
|---|---|---|---|---|
| TEST-001 | Consumer workflow benefit | optional proof runners | maintained current-candidate matched gate | `establish-consumer-outcome-regression-gate` |
| TEST-002 | Windows install/workstation | fixtures and host proofs | Windows CI and `.ps1`/`.cmd` invocation | `harden-cross-platform-bootstrap-validation` |
| TEST-003 | MCP installer | implementation and docs | missing/existing/dry-run/check regression tests | `harden-cross-platform-bootstrap-validation` |
| TEST-004 | Completion runtime scale | component correctness proofs | long database, concurrent roots, convergence, timeout/load tests | `bound-completion-runtime-hot-paths` |
| TEST-005 | Active change ownership | selected validation | multi-change requirement/file conflict gate | `reconcile-openspec-ownership-and-evidence` |
| TEST-006 | Task proof envelope | task text/history | named entrypoint/effect/candidate correlation | `reconcile-openspec-ownership-and-evidence` |
| TEST-007 | Project inventory | conventional fixture | root-level `tools/test*.ts` and production-root cases | `repair-project-inventory-and-maintenance-debt` |
| TEST-008 | Skill trigger precision | shape/marker checks | description false-positive/false-negative fixtures and matched workflow | `minimize-default-runtime-surface` |

## Failure Mode Matrix

| ID | Scenario | Expected behavior | Current evidence/gap |
|---|---|---|---|
| FAIL-001 | Active delta is invalid but tasks say complete | qualification and archive stop | currently not composed; reproduced |
| FAIL-002 | Unrelated project loads all domain artifacts | minimal default, explicit domain enable | only `all` profile exists |
| FAIL-003 | PowerShell blocks npm/OpenSpec shims | documented/validated native entrypoint works | `.cmd` workaround observed, no native CI |
| FAIL-004 | Long session database reaches completion audit | bounded indexed query and explicit truncation | full table materialized first |
| FAIL-005 | Guard status never converges | bounded attempts/deadline and terminal diagnostic | unbounded loop |
| FAIL-006 | Many roots audit concurrently | global bounded queue/fairness | per-root only |
| FAIL-007 | Sync child command hangs | finite timeout and cause-preserving termination | optional timeout omitted by callers |
| FAIL-008 | Evidence change grows hundreds of files | bounded index/retention gate | no mandatory topology |
| FAIL-009 | Inventory scans this repository | production/tests discovered accurately | reproduced false map |

## Validation Record

- `npm.cmd run validate:strict`: pass
- `npm.cmd test`: pass
- `openspec.cmd validate --all`: one reproducible failure, `reduce-workflow-ceremony`
- `npm.cmd run instruction:inventory -- --source-scope loader-visible --project . --format markdown`: completed
- `npm.cmd run instruction:budget -- --format markdown`: maintained committed budget passed; loader-visible project surface exceeded the maintained discovery/on-demand seed and was recorded separately
- `npm.cmd run code-quality:inventory -- --root . --format markdown --attention-lines 400 --split-lines 800`: 24 split candidates
- `npm.cmd run proof:doctor-qualification ...`: complete, cleanup complete
- `npm.cmd run proof:project-unattended ...`: complete, cleanup complete
- `npm.cmd run proof:roadmap-mission -- --mode preflight ...`: complete, no project mutation
- `npm.cmd run proof:permissions`: pass
- `npm.cmd run proof:guard-question`: pass
- `git diff --check`: no whitespace error; line-ending warnings only
- `jscpd`: unavailable; duplicate discovery used graph similarity, literal search, source review, and an independent reduction review

## Change Map

| Change | Outcome | Findings |
|---|---|---|
| `establish-consumer-outcome-regression-gate` | matched consumer baseline/candidate capture and provider-free gate | AUD-002, partial AUD-006 |
| `minimize-default-runtime-surface` | slim portable default, machine-local authority, precise discovery | AUD-003, AUD-004, AUD-005 |
| `harden-cross-platform-bootstrap-validation` | Windows-native bootstrap/CI and MCP/config portability proof | AUD-009, AUD-010 |
| `bound-completion-runtime-hot-paths` | bounded query/convergence/concurrency/process execution | AUD-011, AUD-012, AUD-013 |
| `reconcile-openspec-ownership-and-evidence` | truthful task/qualification state, active owner conflicts, bounded evidence | AUD-001, AUD-006, AUD-007, AUD-008 |
| `repair-project-inventory-and-maintenance-debt` | accurate inventory plus evidence-proven deletion/reuse | AUD-014, AUD-015 |
| existing `reduce-workflow-ceremony` | restore its complete modified requirement scenarios and honest current stage | AUD-001 |

## Residual Risks

- The exact magnitude of default-context harm remains a hypothesis until the consumer outcome gate captures matched behavior.
- One host and one loaded OpenCode/model environment were observed; portability outside Windows plus Ubuntu CI remains unproved.
- `jscpd` was unavailable, so clone coverage is strong for named candidates but not exhaustive for every lexical clone.
- Gitignored machine-local config contents were intentionally not inspected; runtime source and permission behavior were validated through redacted diagnostics and installed proof.
- Active changes can continue to mutate after this audit; every implementation change must bind to a fresh candidate identity and re-run affected evidence.

## Stop Line

The audit is complete when every finding is preserved with evidence, confidence, consequence, root cause or explicit unknown, and one owner disposition. This document does not claim the findings are fixed. Each owning OpenSpec change must independently implement and prove its bounded outcome; unrelated optional polish does not enter those changes.
