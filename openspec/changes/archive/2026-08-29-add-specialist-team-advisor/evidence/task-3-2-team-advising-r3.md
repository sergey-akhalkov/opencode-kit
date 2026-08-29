# Task 3.2 Team-Advising Candidate Evidence R3

> Historical-only after foundation incident `FI-STA-CORE-001`: this bundle used generated-core files plus the full `quality-independent` inline agent map. It remains valid for that exact hybrid environment but does not support the corrected-core population claim.

## Scope

- Candidate: `add-specialist-team-advisor-task-3-2-r3`
- Selected `STA-001` members: `trivial-owner-local-direct`, `non-trivial-single-domain-main-alone`
- Baseline: `team-advising-baseline-r2/bundle.json`
- Installed OpenCode: `1.18.25`
- Profile/model: generated `core`, `openai/gpt-5.6-sol/xhigh`
- Maximum claim: only these two selected members under the recorded model, profile, source, and environment identities

## Runtime Proof

The configured capture used exactly two candidate root turns. The evaluator reports `modelCalls=4` across the selected baseline and candidate arms, four passing rows, `status=passed`, candidate bundle digest `1a299bc3fb227d7ad2476233ab2fec71c6c479c8fd907bb7081945626b0d036e`, and evaluation digest `5fc567e054784ba1ccc17d7fc2dc53482ce9d72a4354e6e2b082c536f920d42f`.

`trivial-owner-local-direct` completed directly with no advisor call and no catalog call. `non-trivial-single-domain-main-alone` invoked `specialist-team-advisor` exactly once, called `specialist_catalog` exactly once, returned `main-alone`, created no specialist work package, and reported no unavailable capability. Both samples changed only `result.json`, passed `node check-result.ts`, retained `sourceUnchanged=true`, observed no forbidden effect, removed all sessions and fixtures, and recorded `cleanup.complete=true`.

The provider-free replay reproduced the same evaluation digest and passing rows with `liveCalls=0`. The active gitignored `global/opencode.json` remained byte-identical before and after capture and replay at SHA-256 `0050d9de6b28e9b5574b57a519c5a3c09766910dc97afd0dcaf2b4a778628144`.

## Corrected Failure Chain

- R1 was a Proof Runner environment failure: `OPENCODE_PURE=1` suppressed the configured catalog plugin, so the advisor had no catalog tool.
- R2 loaded and called the tool, but the installed plugin runtime injected SDK `1.18.15`, which lacked the newer `app.skills` method and returned a bounded `unknown` catalog state.
- Provider-free compatibility proof `task-3-2-catalog-compat-r2.json` verifies the newer public API and the installed transport routes `/session/{id}`, `/agent`, and `/skill`; `installedLegacyTransport.status=passed`.
- R3 is the first accepted task 3.2 candidate bundle. R1 and R2 remain diagnostic evidence and do not support the accepted claim.

## Commands

```text
npm.cmd run proof:consumer-outcome -- --mode capture --pack team-advising --candidate-id add-specialist-team-advisor-task-3-2-r3 --evidence-root <task-3-2-r3> --baseline <baseline-r2-bundle> --source-ref working-tree --session-mode configured --scenarios trivial-owner-local-direct,non-trivial-single-domain-main-alone --opencode <installed-opencode>
npm.cmd run proof:consumer-outcome -- --mode replay --pack team-advising --baseline <baseline-r2-bundle> --candidate <task-3-2-r3-bundle> --scenarios trivial-owner-local-direct,non-trivial-single-domain-main-alone --expectation no-regression
```

## Preserved Evidence

- `team-advising-candidate-r3-task-3-2/bundle.json`
- `team-advising-candidate-r3-task-3-2/evaluation.json`
- `task-3-2-catalog-compat-r2.json`
- Diagnostic only: `team-advising-candidate-r1-task-3-2/`, `team-advising-candidate-r2-task-3-2/`, `task-3-2-catalog-compat-r1.json`

No installation, active-config mutation, restart, commit, push, release, deployment, or remote effect occurred.
