# Strategy History

## 2026-08-25 - Direct base-spec edit rejected

- **Objective:** Correct the scenario wording immediately after detecting the post-archive mismatch.
- **Approach:** Edit `openspec/specs/local-opencode-workstation/spec.md` directly.
- **Evidence:** The canonical archive contract forbids manual main-spec edits and requires official delta merge for delivered requirements.
- **Outcome:** Rejected before mutation.
- **Reason:** A direct edit would remove traceability and bypass the same merge boundary being corrected.
- **Do-not-repeat condition:** Do not patch the base spec manually while an official corrective delta can express the accepted semantics.
- **Evidence-based retry condition:** Only if the official OpenSpec merge mechanism is unavailable and the owner explicitly authorizes a non-canonical recovery.

## 2026-08-25 - Complete corrective MODIFIED delta selected

- **Objective:** Restore dual-service scenario consistency without changing product behavior.
- **Approach:** Create one spec-only change containing all three complete affected requirement blocks, then validate and archive canonically.
- **Evidence:** Post-archive diff shows the parent SHALL clauses retain OpenCode and Graphify while scenario rows use single-server, single-listener, or steady-green wording.
- **Outcome:** Selected.
- **Reason:** It is the smallest traceable mechanism that repairs the official merged specification and prevents partial-block loss.
- **Do-not-repeat condition:** Do not use a partial MODIFIED block or rerun workstation lifecycle proof for this wording-only correction.
- **Evidence-based retry condition:** If strict validation or official merge identifies another exact current-base scenario that must be preserved, expand only the complete affected requirement before archive.
