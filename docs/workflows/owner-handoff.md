# Owner Handoff Workflow

Use this disposable workflow before reducing owner-decision instructions. It preserves high autonomy by involving the owner only at a proved owner boundary and keeps the handoff as short as correctness permits. Do not build a code harness.

## Synthetic Decision

- Goal: complete a local database migration fix without risking shared production data.
- Current state: local disposable migration and rollback both passed; production was not touched.
- Blocker: applying production migration is remote and destructive enough to require owner authority.
- Evidence: local apply exit `0`; rollback exit `0`; production backup freshness is unknown.
- Attempted alternative: dry-run cannot establish backup freshness or authorize production mutation.
- Option A: owner refreshes/verifies backup, then authorizes migration; reversible through proved rollback, but requires maintenance window.
- Option B: stop after local fix; no production risk, but production issue remains.
- Recommendation: Option A only after backup verification.

## Quality Oracles

Both variants pass only when the handoff includes:

1. A short plain-language goal/current-state/blocker overview.
2. Working status and explicit statement that production is untouched.
3. Facts, inference, and unknown backup freshness separated.
4. Attempted alternative and why it cannot resolve owner authority.
5. Two real options with result, advantage, disadvantage, risk, reversibility, and cost/window.
6. Recommendation with rationale and what happens next.
7. Exact reply/action required from the owner.
8. No invented backup, authorization, timing, or third option.

Keep the compact contract only when all oracles pass and the instruction/output surface is smaller.

## 2026-08-08 Observation

- Model/environment: `xai/grok-4.5`, `high`, isolated pure OpenCode runs with the same synthetic decision.
- Baseline current contract: exit `0`, `36734 ms`, `7729` output characters; failed oracle 8 by inventing a third option.
- Compact candidate: exit `0`, `12138 ms`, `1584` output characters; passed all eight oracles with exactly the two real options.
- Decision: keep the compact contract. One pair supports this instruction reduction only; it is not a general speed claim.
