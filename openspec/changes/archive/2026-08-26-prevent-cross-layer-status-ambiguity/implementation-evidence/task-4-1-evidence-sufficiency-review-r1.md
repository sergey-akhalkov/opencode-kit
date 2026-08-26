# Task 4.1 Evidence Sufficiency Challenge

- Reviewer: fresh read-only `evidence-sufficiency-reviewer`, runtime task/session `ses_fc423a192ffeXNJoHij9URbSHm`.
- Effective model: `xai/grok-4.6`.
- Inspected candidate: R4 source `4fef3cbdd638edfb55a6573618517e388bc661388d6d579e6def5a11c9971123`; frozen R9 source `87f0575bd28bb01de4ca89ab7602c67c7fea9be576736441e1b5c831ce6315fc`; no RC.
- Reviewer role remained read-only and returned no lifecycle verdict or mutation authority.

| Risk ID | Reviewer observation | Main disposition | Evidence after disposition |
|---|---|---|---|
| `CSA-001-R1` | Terminal `passed-improvement` and equal replay digests were note-attested while indexed R4 `evaluation.json` retained the capture-time blocked result. | Reproduced evidence defect; corrected without a model call or candidate mutation. The existing replay CLI now supports create-new `--result-path`, focused tests cover byte-equal output and overwrite rejection, and current post-reduction terminal replay files are sealed. | `task-3-2-candidate-r4/terminal-replay-r3.json` and `terminal-replay-r4.json` are byte-identical, `liveCalls=0`, `passed-improvement`, outer digest `cf2c6a8883209ca87f8de218d90b895ee480808e7fc3218c396cf80310e0f86d`, terminal evaluator `098ddef37ade0cfcf9cb8592cff9fa1b1c8befaec6ad89a44acdf9f106fe719b`. R1/R2 retain the earlier sealed evaluator result. |
| `CSA-001-R2` | A heading-only skim could read the separate clear gate broadly, but raw R4 has an immediate `Named path` bullet and exact `Status Scope`; no member-field contradiction was reproduced. | Contained heading-form limitation, not an accepted-outcome or exact-oracle defect. Corrected the evidence note and claim wording that had incorrectly said the path label was absent. No prose scorer or live recapture added. | R4 `bundle.json` compaction context plus all passing main/reconstruction rows in both sealed replays. |
| `CSA-001-R3` | `compactionRoute` records `xai/grok-4.6/high`, while summary message metadata records `openai/gpt-5.6-sol`; actual compaction execution-model attribution is ambiguous. | Narrowed claim. The observed output remains supported under the recorded requested route and matched environment; summary-message model attribution and universal route execution are not claimed. | R9/R4 raw route and message metadata remain unchanged and visible; the exclusion is recorded in CSA-001. |

- Residual exclusions: other models, variants, languages, vocabularies, long sessions, consumer overrides, heading-only reader inference, actual compaction execution-model attribution from summary metadata, universal prose quality, and live-attempt safety equivalence.
- Candidate identity note: `candidateId` is a stable change correlation id; governed source digest remains separately bound to R4 and is not inferred from that id.
