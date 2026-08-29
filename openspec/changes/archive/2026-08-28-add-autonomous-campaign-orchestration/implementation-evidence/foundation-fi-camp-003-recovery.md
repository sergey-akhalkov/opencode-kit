# Foundation Recovery FI-CAMP-003

## Incident Binding

- Foundation Incident ID: `FI-CAMP-003`.
- Relation: configured semantic workload `discovery` under repository-global OpenCode
  configuration was bound to the task 4.1 oracle `worktree unchanged`, but that oracle
  observed only SDK session diffs and `src/main.ts` bytes.
- Historical candidate/environment: `task-4-1-semantic-r1` /
  `node-24.18.1-windows-configured-semantic-r1`, configured capture r4 and replay r5.
- Reproducing candidate/environment: `task-4-3-playbook-r6` /
  `node-24.18.1-windows-configured-playbook-r6`.
- Main reproduction: r6 starts with empty exact Git porcelain status. Immediately after
  the first configured discovery assignment, status contains only
  `?? .serena/.gitignore` and `?? .serena/project.yml`; the same paths persist through
  reconciliation and synthesis. The SDK reports zero diffs and the source hash is
  unchanged, proving the historical oracle omitted reachable untracked project writes.
- Negative controls: preflight r4 shows fixture creation, ignored evidence creation,
  and configured server session create/delete produce empty Git status with zero model
  calls. Offline-admission r5 shows record materialization also leaves status empty.
- Reviewer: fresh `foundation-integrity-reviewer` task
  `ses_fbac8e2a7ffewqvxlGzKEVb8q4`, Effective Model `openai/gpt-5.6-sol`, reported
  `FOUNDATION-INTEGRITY-001` (confirmed by main) and `FOUNDATION-INTEGRITY-002`
  (current config/extension identity evidence gap).
- Corrected-candidate reviewer: fresh `foundation-integrity-reviewer` task
  `ses_fba962915ffeUW2zI0qp9Dff7M`, Effective Model `openai/gpt-5.6-sol`, reported
  `FOUNDATION-INTEGRITY-003`. Main confirmed that provider-free state/materializer/
  controller replay evaluations retain original-capture process counts under both
  `liveCalls` and `processStarts`, while replay invocation stdout reports zero.

## State

`observed -> confirmed -> correcting -> closed`

The exact correction is uniquely determined and does not change product semantics:
configured proof servers use a create-new empty config source plus the selected model
profile, retain built-in provider/auth support, record the effective config digest and
configured MCP/plugin ids, and require exact whole-worktree Git status to remain empty
before and after every root. The recovery does not ignore, delete, or relabel `.serena`
output. The corrected evidence narrative also distinguishes effect-free replay invocation
from provider-free evaluation fields that intentionally recompute original-capture facts.

## Active Artifact Inventory

| Artifact or surface | Disposition | Reason |
| --- | --- | --- |
| `add-autonomous-campaign-orchestration` proposal/design/specs/tasks/history | `closed-rebind` | Owns the corrected configured semantic invariant and narrowed evidence ceiling. |
| Campaign `evidence-index.json` and embedded `autonomous-work-campaign-v1` claim | `closed-narrow` | Checked rows bind r5; broad claim remains `unknown`. |
| `task-4-1-semantic-configured-r4` and replay r5 | `historical-narrow` | Immutable historical evidence supports zero SDK diff and unchanged `src/main.ts`, not unchanged whole worktree. |
| `task-4-3-playbook-configured-r6` and controls/replays | `historical-diagnosis` | Reproduction evidence only; never successful admission evidence. |
| Semantic executor/schema/playbook production and focused tests | `closed-rebind` | Re-proven on the isolated r5 surface with current source readback. |
| `add-specialist-team-advisor` | `not-dependent` | No current configured semantic proof binding. |
| `add-cross-project-kaizen-loop` | `not-dependent` | Serial successor; no current configured semantic proof binding. |
| `add-roadmap-delivery-trajectory-loop` | `not-dependent` | Serial successor; no current configured semantic proof binding. |
| Canonical `openspec/specs/**` | `not-dependent` | No canonical behavior changes; active campaign delta remains the behavior owner. |
| `openspec/changes/archive/**` | `not-dependent` | Historical immutable archive; no recovery write is permitted. |
| Standalone `claims/*.json` | `not-dependent` | No active standalone claim files exist. |

## Preservation Digests

- Historical task 4.1 r4 raw Git blob digest:
  `ae8b334cd1f4c90e4d0481393b3e6cc611aa7048`.
- Reproducing task 4.3 r6 raw Git blob digest:
  `2086c610a9ad3b6cadd3af43cd5dfc2d5d033a0f`.
- Current archive aggregate (stable list of current file blob digests):
  `1cc38bdc8e885ab90ca5cb32080bdef38c97cf9f`.
- Current canonical-spec aggregate:
  `d6c88a7c9798accba60fc3ebc351f36338853179`.

## Evidence Ceilings

- r4/r5 historical ceiling: one configured discovery call used the selected route,
  remained parentless, reported zero SDK diff/questions/permission requests, preserved
  `src/main.ts` bytes, and cleaned up. It does not establish whole-worktree non-mutation
  or an extension-free runtime.
- r6 ceiling: schema-constrained configured discovery/reconciliation/synthesis all
  completed read-only according to SDK observations, but the globally loaded Serena MCP
  created two untracked project files and campaign admission correctly blocked.
- Corrected r5 ceiling: one isolated configured discovery assignment and one isolated
  configured discovery/reconciliation/synthesis component reach frozen-wave admission
  with empty configured MCP/plugin inventories, unchanged whole worktree, terminal
  cleanup, and complete configured replay evaluations with `liveCalls: 0`.
- Provider-free replay ceiling: invocation stdout reports `liveCalls: 0` and the replay
  code path only reads raw/evaluation input and writes a create-new evaluation bundle.
  State/materializer/controller replay evaluations reproduce original-capture
  `liveCalls`/`processStarts` counts; those fields are not replay-effect evidence.

## Terminal Evidence

- Candidate/environment: `foundation-fi-camp-003-r5` /
  `node-24.18.1-windows-isolated-semantic-r5`.
- Current direct source readback: `43/43`, zero mismatch, manifest digest
  `0ac16cb2e300bbbcee80ce8b8b7a9aecd4b595437364347f52d27d8f628c09a6`.
- Evidence inventory: 11 checked tasks and 11 current rows; no incomplete, stale,
  unknown, envelope-mismatched, or unindexed row; 208 retained files / 961016 bytes;
  explicit retention exception not exceeded.
- `openspec validate add-autonomous-campaign-orchestration --strict`: exit `0`.
- Apply operation gate: `passed`.
- Terminal state: `closed`; reproduction disposition: `confirmed`.
- Broad claim remains `unknown` at `0/20`; task 4.3 configured mission remediation and
  campaign completion, multiple waves, Windows supervision, population closure,
  deployment, release, and remote effects remain unproved.
