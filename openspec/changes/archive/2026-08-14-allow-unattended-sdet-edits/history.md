# Strategy History

## 2026-08-14 - Remove the SDET edit override and inherit global permission

- **Objective:** Eliminate the SDET edit approval dialog using the operator's
  global allow default.
- **Approach:** Omit `permission.edit` from the agent and rely on merged top-level
  permission resolution.
- **Evidence:** Runtime source inventory reports host-default, custom-global, and
  project config layers; current `opencode debug agent` shows explicit agent rules
  are appended after broad global rules.
- **Outcome:** Rejected before mutation.
- **Reason:** A host or project ask-level default could reintroduce the prompt when
  the agent is used outside the current global config composition.
- **Do-Not-Repeat Condition:** Do not rely on inherited edit permission while the
  reusable agent requires deterministic unattended behavior across config layers.
- **Evidence-Based Retry Condition:** Reconsider only if OpenCode gains a managed,
  non-overridable inherited permission contract that is proven for all supported
  source compositions.

## 2026-08-14 - Explicit scalar allow with contract-level test containment

- **Objective:** Remove the prompt without widening unrelated SDET capabilities.
- **Approach:** Set scalar `edit: allow`, preserve every other explicit deny, retain
  exact test-only scope and production prohibition in the role contract, and prove
  both resolved permission and an actual disposable edit.
- **Evidence:** Baseline runtime readback resolves the final SDET edit rule to
  `ask`; OpenCode's documented scalar permission supports `allow`; the existing
  permission proof already compares configured and effective specialist rules.
- **Outcome:** Selected for implementation.
- **Reason:** It is the smallest deterministic change that addresses the observed
  dialog while preserving the established role boundary.
- **Do-Not-Repeat Condition:** Do not add a path classifier, plugin, or broad
  specialist permission rewrite unless the selected scalar candidate fails a
  requirement-linked runtime boundary.
- **Evidence-Based Retry Condition:** Replace this strategy only if fresh installed
  readback still resolves ask, the actual SDET run prompts, or main reproduces an
  in-scope production-authority defect.

## 2026-08-14 - Direct CLI subagent selection

- **Objective:** Exercise the changed SDET edit permission through the installed
  provider-backed agent entry point in a disposable project.
- **Approach:** Run `opencode run --agent sdet-quality-engineer --format json` with
  one exact test-only output path and no `--auto` permission override.
- **Evidence:** OpenCode `1.18.18` printed `agent "sdet-quality-engineer" is a
  subagent, not a primary agent. Falling back to default agent`; root session
  `ses_fff64af4bffePI8GHuHHz7YeFg` then created and read only the disposable test
  file before main interrupted it. The process terminated with Windows Ctrl-C exit
  `-1073741510`; no permission event appeared in the 20-line JSON stream.
- **Outcome:** Rejected as Runtime Proof and stopped after the fallback was observed.
- **Reason:** The direct CLI route exercised the default primary agent's permission,
  not the SDET subagent's final permission rule.
- **Do-Not-Repeat Condition:** Do not pass a subagent name directly to `opencode
  run --agent`; its successful tool event cannot prove subagent behavior.
- **Evidence-Based Retry Condition:** Retry only if a future OpenCode version
  explicitly supports direct subagent selection and provider-free help/runtime
  output proves that behavior. The current candidate must instead use the actual
  primary-parent `task` route.

## 2026-08-14 - Routed child capture with immediate fixture deletion

- **Objective:** Prove the changed SDET edit rule through the actual installed
  parent/child SDK route without an automatic permission override.
- **Approach:** Reuse `opencode-proof-client.ts`, create a correlated root and SDET
  child, monitor pending permission requests every 50 ms, require one exact test
  file and completed edit tool event, then delete sessions, server, and fixture.
- **Evidence:** `capture-r1/raw.json` records child agent and parent correlation,
  1,155 permission polls, zero pending requests before/after, completed `edit`, the
  exact 18-byte file as the only project effect, and deleted sessions/stopped
  server. Immediate fixture deletion failed with Windows `EPERM`; the original
  evaluation therefore correctly returned `fail`.
- **Outcome:** Product interaction succeeded; cleanup lane failed and blocked a
  second live attempt.
- **Reason:** `fs.rmSync` used zero retries immediately after process shutdown,
  while Windows retained a transient handle. The same proof-owned fixture deleted
  successfully once the process had fully released it.
- **Do-Not-Repeat Condition:** Do not repeat provider capture after a cleanup-only
  failure until the preserved bundle and cleanup have reached a terminal offline
  verdict.
- **Evidence-Based Retry Condition:** A future live retry is permitted only after
  replay verifies the preserved product facts, current product-source hashes,
  deleted sessions/server, approved fixture identity, and fixture absence.

## 2026-08-14 - Preserved-bundle cleanup replay

- **Objective:** Close the cleanup failure without another provider call or
  overwriting the failed live bundle.
- **Approach:** Delete only the proof-owned fixture after handle release, add bounded
  Windows deletion retries for future runs, and evaluate `capture-r1/raw.json`
  through a provider-free replay mode into a new immutable evidence root.
- **Evidence:** Manual cleanup returned `cleanup-replay-complete`;
  `replay-r1/raw.json` reports `factsPass`, `cleanupPass`, `fixtureAbsent`,
  `fixtureInsideApprovedTemp`, and `productSourcesCurrent` all true. Current-runner
  `preflight-r2` also passes route, parent, model, pending-permission, session,
  server, and fixture cleanup.
- **Outcome:** Terminal replay passed; the Runtime Proof lane is current without a
  second live attempt.
- **Reason:** The original raw facts already contained the complete successful SDET
  edit observation; only terminal cleanup was missing and was independently
  observable offline.
- **Do-Not-Repeat Condition:** Do not overwrite or relabel `capture-r1`; retain its
  failed cleanup verdict and compose it with `replay-r1`.
- **Evidence-Based Retry Condition:** Repeat live capture only after a Product
  Candidate mutation or evidence that the preserved edit facts are incomplete.

## Final History Retrospective

**Original User Goal:** Stop `sdet-quality-engineer` from repeatedly asking the
operator for edit permission when the global OpenCode default already allows tool
access.

| Dimension | Working Repository | opencode-kit |
| --- | --- | --- |
| Quality | none: the working repository is `opencode-kit` itself, so there is no distinct target-repository consumer or evidence lane. | Evidence: routed capture exposed transient Windows `EPERM` after otherwise successful product behavior. Smallest cheap improvement: bounded deletion retry plus preserved-bundle replay was already implemented and proven by `replay-r1`/`preflight-r2`. Expected benefit: terminal cleanup without relabeling failed evidence or repeating model calls. Cost/risk: small runner-only complexity, reviewed with no safe reduction. No remaining candidate. |
| Cycle Speed | none: no separate working-repository workflow was invoked or changed. | Evidence: direct `opencode run --agent sdet-quality-engineer` consumed one invalid attempt because OpenCode falls back from subagents to the default primary. Smallest cheap improvement: the maintained runner now uses the existing SDK parent/child route and documents it. Expected benefit: future permission proof reaches the real child on the first valid attempt. Cost/risk: one scenario-specific runner already validated. No remaining candidate. |
| Token Economy | none: no separate target-repository context or repeated consumer was observed. | Evidence: raw debug-agent output is large, while `proof:permissions` and the new runner emit bounded privacy-safe facts and immutable hashes. Smallest cheap improvement: compact evaluator output and source-hash evidence were already implemented. Expected benefit: later sessions can inspect small bundles instead of replaying full prompt/tool transcripts. Cost/risk: evidence omits provider prose by design. No remaining candidate. |

- Admitted current-consumer improvements: none; every evidenced improvement was
  already consumed and proven before this retrospective.
- Deferred Improvement Candidates: none; the history supplies no exact unserved
  consumer with a direct causal link to the accepted outcome.
- This analysis is complete and MUST NOT be rerun by apply, archive, compaction, or
  generated tasks.
