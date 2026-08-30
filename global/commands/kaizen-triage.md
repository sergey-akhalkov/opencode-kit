---
description: Manually triage at most 25 Kaizen signals and contain proposal promotion to the configured owner root.
agent: build
---

Run one explicit bounded Kaizen triage pass. Treat `$ARGUMENTS` as optional scope intent, not shell flags.

1. Call `kaizen_status` with `limit: 25`, `details: false`, and `statuses: ["pending"]` to read the proposal-owner state. If maintained `docs/feedbacks/*.md` entries exist in the active project, import at most 25 stable-ordered `FB-*` entries through `kaizen_import_feedback` before the detailed read; do not rewrite or delete the Markdown files and do not trust their written status as current disposition.
2. If proposal-owner state is `current-root`, call `kaizen_status` with `limit: 25`, `details: true`, `scope: "cross-project"`, and `statuses: ["pending"]`. Otherwise use `scope: "current-project"`; never request cross-project details outside the configured owner root.
3. Process the returned stable order and no more than 25 signals. Inspect each signal's current repository-contained evidence where reachable. Append exactly one evidence-bounded `kaizen_decision` for each processed ref. Counts, recurrence, and `scopeHint` are navigation only and never establish ownership or semantic cohesion. Unknown ownership permits only `needs-investigation`. A `local-memory` decision recommends the separate explicit project-memory workflow and does not invoke it.
4. Outside proposal-owner state `current-root`, stop after decisions. Record `kit-candidate` or `needs-investigation` when appropriate, perform no cross-repository mutation, and do not create an OpenSpec proposal.
5. At proposal-owner state `current-root`, create at most one ordinary OpenSpec proposal only when current reviewed evidence establishes a cohesive kit-owned improvement. Load `openspec-propose` and follow its complete workflow; include the source signal refs and evidence ceiling in the proposal. Do not auto-apply, archive, commit, push, open a remote issue, mutate a source project, or create a proposal merely because a count threshold was reached. If the skill is unavailable or the evidence is not cohesive, retain the decisions and stop without recreating a partial proposal workflow.

Return processed signal refs, appended decision refs, proposal-owner state, truncation, and either the one created change id or the exact no-proposal reason.
