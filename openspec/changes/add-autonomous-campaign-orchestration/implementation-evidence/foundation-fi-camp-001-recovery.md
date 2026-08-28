# Foundation Incident FI-CAMP-001

## Relation And Reproduction

- **Candidate:** `task-3-1-final-r1`.
- **Exact relation:** current campaign task evidence and task 3.1 mission evidence must
  correlate to the one candidate/environment pair enforced by schema-v2
  `proofEnvelopeState` without relabeling historical proof.
- **Reproduction:** `npm run openspec:change-inventory -- --root . --mode all`
  reported tasks `1.1`, `1.1.1`, `1.2`, `2.1`, `2.2`, and `2.3` stale because their
  task rows differed from the top-level task 2.4 candidate/environment. The mismatch
  was confirmed independently and by fresh foundation review.
- **Original accepted outcome:** continue the bounded campaign increment through exact
  mission parent correlation while retaining one writer, current proof identities,
  historical evidence, and the broad campaign claim at `unknown`.

## State

- `observed -> confirmed -> correcting -> swept -> re-reviewed -> closed`
- `terminalState=closed`; `reproductionDisposition=confirmed`.

## Active Artifact Inventory

| Artifact | Disposition | Reason |
| --- | --- | --- |
| Campaign `evidence-index.json` task rows and top identity | `dependent-rebind` | Strict equality made six checked rows stale; each counted boundary is recaptured under the common identity. |
| Campaign broad claim row | `dependent-narrow` | It may add the separately exercised mission parent-correlation component but must continue to exclude campaign launch/consumption and remain unknown. |
| Campaign `tasks.md` task 3.1 | `dependent-rebind` | It may be checked only after common-identity proof, strict validation, and apply gate. |
| Campaign `history.md` and this incident record | `dependent-rebind` | Preserve the contradiction, correction, proof, and terminal review result. |
| Campaign proposal/design/delta spec/ownership | `not-dependent` | Accepted behavior and source ownership did not change. |
| Historical campaign evidence bundles | `not-dependent` | Preserve their exact rung-specific identities and narrower historical ceilings. |
| Current task 3.1 and FI-CAMP-001 bundles | `dependent-rebind` | These are the new common-identity proof inputs. |
| Canonical library workflow-integrity spec | `not-dependent` | Its strict candidate/environment rule is retained, not weakened. |
| Active specialist-advisor change and claim | `not-dependent` | Planning-only, different candidate and outcome. |
| Active cross-project-kaizen change and claim | `not-dependent` | Planning-only, different candidate and outcome. |
| Active roadmap-trajectory change and claim | `not-dependent` | Planning-only, different candidate and outcome. |
| Archived changes, including continuous complexity management | `not-dependent` | Historical archives are immutable and receive no write. |

## Correction And Proof

- Historical files remain unchanged. Current campaign contract-preflight, provider-free
  preflight, state restart/replay, materializer/readback, and controller boundaries were
  rerun under `task-3-1-final-r1`; each capture completed and each supported offline
  replay completed with `liveCalls: 0`.
- Current task 2.4 source paths first matched its preserved source manifest byte for
  byte, and the focused campaign suite passed. This observation selected recapture
  instead of unsupported relabeling; it was not used as a substitute for the exact
  task boundaries.
- Task 3.1 preflight/controller captures, both zero-live replays, and state/runtime/
  launcher/integrated compatibility evaluations already use `task-3-1-final-r1`.
- No campaign-to-mission launch/consumption, semantic campaign, Windows supervisor,
  installation, activation, remote action, deployment, or release is claimed.
- The corrected index parses as schema v2, binds eight task rows to the common candidate
  and environment, retains 62 indexed files within default limits, and reports no
  incomplete, stale, mismatched, unknown, or unindexed task evidence. Strict OpenSpec
  validation passed; the apply gate passed with only the intentionally retained broad
  claim warning.

## Evidence Ceilings

- Historical bundles retain their original component and rung-specific ceilings.
- Current aggregate evidence supports the recaptured campaign boundaries plus the
  separately exercised mission parent-correlation/handoff component only.
- The integrated campaign-to-mission path, host boundary, and broad campaign population
  remain `unknown`.

## Terminal Re-Review

- Fresh corrected-candidate foundation review inspected candidate
  `task-3.1-final-r1-corrected-fi-camp-001` and returned
  `Practice Observation: no-material-finding`.
- Effective Model: `openai/gpt-5.6-sol`.
- The review found no current material contradiction in the corrected incident relation.
  Historical identities remain historical; all eight current task envelopes align; the
  campaign controller still records `missionCalls: 0` and `missionRef: null`; the broad
  population claim and later task 3.2 integration remain explicitly unknown/unrun.
- Remaining protected owner boundary: none for incident closure. Remaining material
  unknowns are the deliberately unobserved later campaign, semantic, host, and broad-
  claim boundaries, not a foundation mismatch.
