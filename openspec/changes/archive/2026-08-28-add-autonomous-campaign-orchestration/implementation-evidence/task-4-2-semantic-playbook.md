# Task 4.2 Semantic Playbook Evidence

## Implementation And Ownership

- `global/bin/work-campaign/semantic-playbook.ts` is the current execution coordinator
  between the bounded semantic executor and the existing deterministic phase-input gate.
  It does not classify scenario, severity, materiality, cause, or grouping.
- Discovery jobs must partition every maintained inventory block exactly once, use
  unique assignment ids and isolated result paths, and settle together through
  `Promise.allSettled`. A rejected root is reported only after every launched root has
  terminally settled.
- Reconciliation, investigation, and synthesis are serialized. Discovery producers may
  not reconcile their own candidate; unknown reconciliation receives exactly one fresh
  source-correlated investigation. Model-call budget is checked before each launch.
- Deterministic projection maps semantic dispositions to record statuses. Confirmed
  P0/P1 becomes eligible, confirmed P2/P3 remains `report-only`, false/duplicate remains
  terminal and excluded, and `still-unknown`/`owner-required` returns a blocking result
  before synthesis.
- The existing `phase-input.ts` remains the sole wave-admission owner. It independently
  validates fresh producers, exact partitions/items/reconciliations/investigations,
  current source digest, complete eligible assignment, allowed effects/paths, and one
  unexecuted report seed before the controller records findings freeze or wave admission.

## Provider-Free Proof

- `tools/test-work-campaign-semantic-playbook.ts` runs two disjoint discovery jobs with
  measured overlap (`maximumDiscovery=2`), serialized downstream roots
  (`maximumSerialized=1`), one confirmed P1, one P3 report-only negative control, and one
  unknown P1 that a fresh investigation confirms. Only the two eligible P1 ids appear in
  the synthesis wave.
- A `still-unknown` variant consumes one investigation, retains `unknown-material`, makes
  zero synthesis calls, and returns blocked. Overlapping source partitions/shared result
  paths fail before execution. A concurrent discovery failure waits for both launched
  roots to settle.
- The controller suite independently proves a confirmed investigation clears findings
  freeze, `still-unknown` blocks, and discovery self-reconciliation fails. The existing
  provider-free fixture proves P2 report-only exclusion through actual phase admission.

## Configured Component Boundary

- `foundation-fi-camp-003-playbook-r5` executes configured discovery, fresh
  reconciliation, and synthesis through three parentless production executor sessions,
  then passes their exact records through the actual controller phase-input gate to one
  frozen `wave-admitted` and intentional `paused-external` mission boundary.
- Effective config digest is preserved; configured MCP/plugin inventories and exact Git
  worktree status remain empty throughout; source bytes, sessions, server, and fixture
  are terminal. `foundation-fi-camp-003-playbook-replay-r5` is complete with
  `liveCalls: 0`.
- This configured lane is component evidence for orchestration/admission only. It does
  not satisfy task 4.3's mission propose/apply/archive/checkpoint, changed-block re-review,
  P2 configured population, fixed-and-verified closure, generated terminal report, or
  campaign `complete` requirements.

## Validation And Claim Ceiling

- `npm run test:focused:work-campaign` is green with five semantic-executor and four
  semantic-playbook cases plus campaign/controller regression suites.
- Common source manifest candidate `foundation-fi-camp-003-r5` covers `43` campaign,
  semantic, mission, proof, profile, package, and focused-test paths; direct current
  readback reports `43/43`, zero mismatch.
- Maximum supported claim: reviewed provider-free partitions can safely fan out, fan in,
  reconcile, investigate, block unresolved material unknowns, synthesize only eligible
  P0/P1, and pass deterministic frozen-wave admission; one configured P1 component path
  reaches that admission boundary without project mutation. Full configured campaign
  remediation/completion, multiple waves, final challenge, population closure, host
  supervision, deployment, release, and remote effects remain unproved.
