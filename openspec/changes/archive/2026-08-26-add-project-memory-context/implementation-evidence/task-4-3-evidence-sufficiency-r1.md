# Task 4.3 Evidence-Sufficiency Challenge R1

- Candidate: `29ba3b07623d31065236053e30d9d488650e900651d868b63d60b96d73aeed8b`.
- Freeze: `task-4-3-candidate-freeze-r1`.
- Fresh read-only reviewer session: `ses_fc4e69b05ffeAu65lFsJBWTXmr`; effective model `xai/grok-4.6`.
- Inspected state: the pre-review index had 22/22 rows stamped with one combined provider-free/loaded boundary, disposition `unknown`, and challenge `missing`.
- Reviewer conclusion: the combined-boundary population claim was not entailed; provider-free, full-envelope, loaded, and SDET evidence supported a narrower scenario-specific ceiling.
- Post-review identity check at `2026-08-25T22:55:04.4230394Z`: Product Candidate remained `29ba3b07623d31065236053e30d9d488650e900651d868b63d60b96d73aeed8b`; runner remained `98ca133f9b280b4c96661fc57f2a5d6e53a5334d629a2ada2ca4713535acfc6c`; tests remained `77cb93ef374e469a5022b8ffb793864ea6aa7f52d33f20f2425c2a0c4ef9df76` and `a98e27dcb9e385d1534d4643a22128b7de75fe3edccf9b564a06a1496220e3c8`. No production or test mutation occurred during the challenge.

## Main Disposition

| Risk | Disposition |
| --- | --- |
| `PMC-ES-1` combined boundary/environment stamp | Confirmed evidence-representation defect. Replace the combined runtime stamp with an evidence-package identity and `member-specific-recorded-boundaries`; each member is limited to its cited lane identities. |
| `PMC-ES-2` loaded exact scoring/admission and four provider-free-only members | Partially confirmed. Loaded raw contains two competing active results with exact path/symbol score evidence (`44.11349815918972` versus `10`), but the terminal loaded evaluator does not cover the 7-item/8-KiB result budget, disabled mode, or concurrent append. Keep those members provider-free and limit loaded R2 to its 25 checks. |
| `PMC-ES-3` explicit exclusion versus automatic omission | Confirmed as a claim-binding gap, not a product defect. Corpus explicit reason rows remain explicit; current focused/SDET tests support provider-free automatic candidate/stale/mismatch omission; loaded supports the named explicit and revalidation cases only. |
| `PMC-ES-4` aggregate hook boolean | Confirmed as a corpus granularity limit. Bind root/subagent/timeout/revalidation/compaction members to the member-specific loaded checks and current SDET where present; do not infer four independent loaded facts from one corpus process label. |
| `PMC-ES-5` runner drift | Confirmed. Corpus, boundary, package, and loaded lanes retain their recorded runner identities; the freeze is an evidence-package identity snapshot and does not claim one runner produced every lane. Production hashes are unchanged across selected lanes. |
| `PMC-ES-6` two seed hashes | Confirmed labeling ambiguity. `task-3-1-corpus-r5.md` now labels file-bytes SHA-256 `f4ef151a...` separately from parsed insertion-order canonical JSON SHA-256 `0c40fce1...`. |
| `PMC-ES-7` predecessor candidate refs | Confirmed. Remove task 1.2/2.1/2.2/2.3/2.4 predecessor lanes from current member rows; retain them only as causal/history lanes. |
| `PMC-ES-8` exhaustive partition prose | Confirmed. Narrow the partition rule to exactly 22 named maintained scenarios at their cited boundaries, not an exhaustive cartesian interaction cover. Uncited combinations remain residual. |
| `PMC-ES-9` allegedly vacuous corpus privacy substitution | Disproved. `substituteSeedText` recursively replaces `$PROJECT_ROOT`, `$PROJECT_ROOT_SLASH`, `$SUPPORTED_CREDENTIAL`, and `$HOME_PATH` at `project-memory-context.ts:313-323` before production `feature.manage`; task 2.5 and loaded R2 independently retain non-vacuous probes. |
| `PMC-ES-10` live freeze identity unverified | Closed by main's post-review live rehash above; all frozen product, runner, and test identities are unchanged. |

- Accepted evidence disposition: `narrowed`. This is an evidence ceiling, not a reduction of implemented behavior.
- Maximum supported claim: the frozen Product Candidate supports exactly the 22 named maintained scenarios at each row's cited provider-free, full-envelope, loaded, or SDET boundary. Loaded R2 supports only its 25 terminal checks. The evidence does not establish that every member ran loaded, that all interactions are covered, or any explicit residual exclusion.
- Explicit residuals: unpinned OpenCode versions; unknown secret formats; semantic-only vocabulary matches; concurrency beyond the observed process population; stores outside declared limits; cross-project recall as a feature; hosted/vector backends; uncited interactions among the 22 scenarios.
