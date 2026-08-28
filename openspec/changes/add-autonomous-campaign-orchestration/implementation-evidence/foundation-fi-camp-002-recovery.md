# Foundation Recovery FI-CAMP-002

## Incident

- **Foundation Incident ID:** `FI-CAMP-002`.
- **Exact relation:** schema-v2 checked-task candidate/environment equality, the new
  task 3.2 campaign-to-mission candidate, its reachable campaign/mission source set,
  and the current evidence index previously bound to `task-3-1-final-r1`.
- **State transitions:** `observed -> confirmed -> correcting -> swept -> reviewed -> closed`.
- **Current state:** `closed`.
- **Reproduction disposition:** `confirmed`.

## Independent Reproduction

- `proofEnvelopeState` in `global/bin/openspec-change/evidence.ts` returns `stale`
  when a checked row candidate or environment differs from the index identity. Adding
  task 3.2 under `task-3-2-final-r1`, or changing only the aggregate id, therefore
  cannot produce a common current envelope.
- The first task 3.2 raw bundle named a candidate but no durable environment id. Its
  ten-path manifest also omitted the reachable `roadmap-mission/state.ts` owner used by
  `stopCampaign -> requestCampaignMissionStop -> recordMissionStopIntent`.
- The evidence inventory reported the first task 3.2 files as unindexed and over the
  default retained-file limit. Historical FI-CAMP-001 closure did not apply to this new
  candidate/relation/evidence tuple.

## Active Artifact Inventory

- `add-autonomous-campaign-orchestration`: `dependent-rebind`; its task rows, lanes,
  claim ceiling, history, and recovery evidence move to one current candidate.
- `add-specialist-team-advisor`, `add-cross-project-kaizen-loop`, and
  `add-roadmap-delivery-trajectory-loop`: `not-dependent`; no campaign candidate bind
  or current evidence is changed.
- Current canonical specs under `openspec/specs/**`: `not-dependent`; task 3.2 fulfills
  the existing delta without changing accepted behavior.
- Archived CCM change and every prior campaign/mission raw bundle: `not-dependent`
  historical evidence; candidate fields and current indexed digests retain historical
  ceilings and no archive is rewritten. No pre-correction immutable digest authority is
  available for the stronger claim that every historical byte is independently proven
  unchanged.
- `autonomous-work-campaign-v1`: `dependent-narrow`; add only the exact task 3.2
  component evidence and keep the broad partitioned claim `unknown`/blocked.
- Other active structured claims: `not-dependent`.
- Protected owner boundary: `not-applicable`; the correction is uniquely determined
  evidence identity/coverage work and adds no product, public API, persisted-data,
  security, privacy, authorization, host, remote, or legal-policy choice.

## Correction And Dependent Sweep

- Did not intentionally rewrite any `task-3-1-final-r1`, FI-CAMP-001, or first task 3.2
  raw bundle. Their embedded candidate fields remain historical; independent
  pre-correction byte equality is not claimed.
- Added explicit proof `environmentId=node-24.18.1-windows-local-proof-r2` and shared
  exact `WORK_CAMPAIGN_CONTROLLER_SOURCE_PATHS`; the evaluator compares exact ordered
  paths and capture hash syntax, including roadmap mission state/stop ownership.
- `foundation-fi-camp-002-source-readback.json` directly recomputes all `28` current
  workspace SHA-256 values against the integrated raw manifest; mismatch count is zero.
- Selected current common identity `task-3-2-final-r2` /
  `node-24.18.1-windows-local-proof-r2`.
- Recaptured campaign preflight, state/replay, materializer/replay, and integrated
  controller/replay lanes; all evaluations are complete and supported replays made
  zero live calls.
- Recaptured mission parent preflight/replay and parent controller/replay under the
  Node-24 aggregate. State, launcher, integrated, and Bun runtime-continue compatibility
  captures remain indexed as component evidence; the Bun `v26.3.0` capture is explicitly
  cross-profile and is not a current task-row aggregate artifact.
- Re-ran production contract preflight and the focused campaign suite successfully.
  Ownership inventory and apply gate are refreshed after the evidence-index rebind.

## Evidence Ceilings

- Prior evidence remains valid only for its recorded historical/component candidate and
  environment. Byte equality is not used to relabel a raw bundle.
- Corrected evidence supports the exact provider-free campaign core, mission parent
  correlation/compatibility, and one integrated disposable campaign-to-mission handoff.
- The broad installed campaign population, configured semantics, multi-wave closure,
  Windows supervisor, critical SDET, and evidence-sufficiency challenge remain unknown.

## Re-Review

- **Corrected candidate:** `task-3-2-final-r2`.
- **Fresh foundation review:** `findings-reported`, effective model
  `openai/gpt-5.6-sol`.
- **Main disposition `FI-CAMP-002-R2-ENV-01`:** confirmed. The Bun `v26.3.0`
  runtime-compatibility capture was removed from the Node-24 task-row artifact set and
  its lane was narrowed to `task-3-2-mission-compatibility-cross-profile-r1`.
- **Main disposition `FI-CAMP-002-R2-SOURCE-02`:** confirmed. The evaluator itself
  establishes capture-time path identity only; direct current byte readback now proves
  all `28/28` captured source hashes equal the workspace candidate.
- **Main disposition `FI-CAMP-002-R2-HISTORY-03`:** confirmed evidence ceiling. Current
  historical IDs/digests and non-relabeling are observable, but pre-correction byte
  equality is unavailable and is no longer claimed.
- **Terminal state:** `closed`; reproduction disposition `confirmed`. The uniquely
  determined corrections are swept into the index. Any later production-source change
  invalidates this source readback and requires a new candidate rather than relabeling.
- **Remaining material unknowns:** configured semantics, broader campaign population,
  later waves, Windows supervision, critical SDET, and evidence-sufficiency challenge
  remain future-rung limits, not FI-CAMP-002 closure conditions.
