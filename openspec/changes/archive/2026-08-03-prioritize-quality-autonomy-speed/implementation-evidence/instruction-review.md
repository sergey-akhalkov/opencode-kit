# Instruction Artifact Review

## Attribution

- Candidate Reference: `qas-candidate-post-sdet-2026-08-03-1`
- Inspected stage: MVP; no RC assigned
- Effective Model: `xai/grok-4.5`
- Reviewer role: fresh read-only `instruction-artifact-reviewer`

## Risk Matrix And Main Disposition

| Risk ID | Reviewer evidence | Main disposition |
| --- | --- | --- |
| QAS-R01 | Global `allow` is permissive access, not a managed sandbox. | Contained material limitation explicitly selected by the owner and documented in README/spec/evidence. Protected-boundary instructions and unrelated-config warnings remain; no hidden enforcement claim. |
| QAS-R02 | Static markers and one runtime sample cannot guarantee all future model behavior. | Inherent instruction-system residual. Current representative proof, never-waive authority, SDET oracles, and honest validator wording are sufficient for the accepted envelope. |
| QAS-R03 | Main config spec remains pre-change until active delta is archived. | Normal OpenSpec delta lifecycle, not conflicting active implementation authority. Production, active delta, docs, and tests agree; main spec sync belongs to archive. |
| QAS-R04 | Global runtime does not name optional `rtk`/Headroom helpers. | Not a current-change regression: baseline diff confirms those names were not removed from `global/AGENTS.md`. They remain project/maintainer-local optional mechanisms and are not required for correctness. |
| QAS-R05 | Pre-SDET evidence IDs differ from the post-SDET candidate label. | Resolved by `implementation-evidence/candidate-continuity.md`, which records every post-proof delta and scoped invalidation result. |
| QAS-R06 | Continuous learning could be misread as a fourth priority. | No defect reproduced. Global has only three labels; UDL and continuous-learning dependency explicitly keep improvement subordinate to the ordered contract. |

## Review Conclusions

- No fourth peer priority was introduced.
- No complete priority-policy duplication was found outside contracts/tests.
- Speed cannot be read as permission to skip proof, validation, safety, ownership, or cleanup.
- No unrelated safety authority deletion was found in the inspected current source. Main baseline diff confirmed protected boundaries, missing-evidence honesty, root-cause discipline, concise handoff, and dirty-work protections remain elsewhere in global authority.
- Exact global permission INFO narrowing matches production source and test evidence; unrelated broad allow remains warning-class.
- No reviewer row establishes a reachable critical or non-deferrable defect in the accepted envelope.

The source reviewer returned evidence only and did not authorize mutation or lifecycle state.
