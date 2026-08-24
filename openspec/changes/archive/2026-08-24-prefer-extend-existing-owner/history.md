# Strategy History

## 2026-08-24 - Local-Owner Fixture Must Be A New Mechanism

- **Objective**: Keep the triggered `local-owner` scenario distinct from known-owner `extend`.
- **Approach**: Remove the workspace `src/jsonc.ts` owner so adding JSONC parsing is a new parser boundary, then recapture the three-scenario baseline.
- **Evidence**: Baseline r1 `local-owner` already chose `extend` of `src/jsonc.ts` and loaded no `reuse-discovery` skill. The new always-loaded rule would make that the intended known-owner path, collapsing the triggered-scenario oracle.
- **Outcome**: Selected before task 1.4 tests and candidate instruction mutation.
- **Reason**: Proof Runner fixture identity, not Product Candidate wording, caused the oracle collision.
- **Do Not Repeat Until**: A recaptured baseline on the no-local-parser fixture still fails to distinguish triggered versus extend scenarios.
- **Evidence-Based Retry Condition**: New r2 bundles still name a current JSONC owner in the workspace or still omit the new-mechanism trigger for `local-owner`.



## 2026-08-24 - Preflight Temp Under Evidence Root

- **Objective**: Complete provider-free preflight including `extend-existing-owner` without a second runner.
- **Approach**: Keep the existing reuse-discovery capture/evaluate owner, but create disposable proof workspaces under the create-new evidence root instead of `os.tmpdir()`.
- **Evidence**: First preflight recorded green loader facts (`hasReuseDiscovery=true`, `permissionExact=true`, `modelCalls=0`) then failed in `finally` with `EPERM` deleting `C:\Users\noilw\AppData\Local\Temp\reuse-discovery-preflight-p5RVz3`.
- **Outcome**: Selected after the first attempt; retry uses a different workspace parent, not a wording-only rerun.
- **Reason**: The product/loader oracle already passed; the blocked layer is Proof Runner cleanup location on Windows, not instruction behavior.
- **Do Not Repeat Until**: A nested-under-evidence-root preflight still fails cleanup after the leftover `os.tmpdir()` tree is gone.
- **Evidence-Based Retry Condition**: New EPERM or missing loader facts on the nested workspace path.



## 2026-08-24 - New Practice Owner For Reuse

- **Objective**: Give reuse a responsible owner who constantly applies it.
- **Approach**: Consider adding a new Practice Owner or production agent dedicated to refactor-for-reuse.
- **Evidence**: `simplicity-and-reuse` is already registered to `code-quality-reviewer`. The Practice Owner contract forbids mutation and result decisions. A second owner would violate one-practice-per-owner and add Ordinary Small ceremony.
- **Outcome**: Rejected during planning.
- **Reason**: The missing behavior is main's default move, not a missing roster slot.
- **Do Not Repeat Until**: Current behavior evidence shows the existing owner cannot observe sibling/uncertainty cases and that failure cannot be corrected by trigger wording.
- **Evidence-Based Retry Condition**: A matched routing scenario reproduces a material reuse failure uniquely prevented by a new owner without adding an ordinary-work regression.

## 2026-08-24 - Mandatory Reviewer On Every Feature

- **Objective**: Stop sibling implementations by forcing a reuse review before production.
- **Approach**: Launch `code-quality-reviewer` on every new file or feature.
- **Evidence**: Zero-trigger Ordinary Small is an explicit kit invariant. The committed startup and delivery model treat owner fan-out as cost. The user's constraint was not to take reuse to an extreme.
- **Outcome**: Rejected during planning.
- **Reason**: It would invert proportionality and punish punctuation and selected-API glue.
- **Do Not Repeat Until**: Evidence shows the compact always-loaded default fails the known-owner scenario after candidate capture.
- **Evidence-Based Retry Condition**: The `extend-existing-owner` scenario still adds a sibling after the compact default is loaded, and a bounded owner launch is the smallest remaining correction.

## 2026-08-24 - Append Always-Loaded Reuse Text

- **Objective**: Make the name-current-owner / default-`extend` rule visible to every main session.
- **Approach**: Add a new bullet beside the current reuse paragraph.
- **Evidence**: Combined `principles-of-work.md` plus `global/AGENTS.md` token proxy is capped at 13,279. Prior instruction changes required replacement, not growth.
- **Outcome**: Rejected during planning.
- **Reason**: Append would breach or grandfather the ceiling and add overlapping policy.
- **Do Not Repeat Until**: The reviewed budget maximum is explicitly raised by a separate owner-authorized change.
- **Evidence-Based Retry Condition**: Instruction-budget evidence shows unused headroom after unrelated consolidation and replacement is impossible without deleting a protected marker.

## 2026-08-24 - Compact Default Plus Existing Proof Owner

- **Objective**: Increase same-responsibility extend without a new owner, ceremony, or proof framework.
- **Approach**: Replace the always-loaded reuse paragraph; define `extend` as reshape; keep the existing Practice Owner for sibling/uncertainty only; clarify production-role reshape versus unrelated refactor; add one `extend-existing-owner` scenario to `tools/proofs/reuse-discovery.ts`.
- **Evidence**: Explore-mode audit of current triggers, empty code-quality feedback ledger, cloned proof harnesses, and the confirmed increment forks.
- **Outcome**: Selected for this change.
- **Reason**: It is the smallest path that changes the default move while preserving AHA, architecture separation, and the token ceiling.
- **Do Not Repeat Until**: N/A - this is the selected strategy.
- **Evidence-Based Retry Condition**: Matched `EXT-001` evaluation shows the compact default does not change the extend scenario, or replacing the paragraph drops a protected marker; then narrow wording or restore the marker without adding an owner or runner.
