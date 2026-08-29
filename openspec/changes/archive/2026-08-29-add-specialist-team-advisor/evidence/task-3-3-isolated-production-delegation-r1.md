# Task 3.3 Isolated Production Delegation Evidence R1

> Historical-only after foundation incident `FI-STA-CORE-001`: this bundle used generated-core files plus the full `quality-independent` inline agent map. Its delegation, liveness, effects, and cleanup observations remain valid for that exact hybrid environment but do not support the corrected-core population claim.

## Scope

- Candidate: `add-specialist-team-advisor-task-3-3-r1`
- Selected `STA-001` member: `isolated-production-delegation`
- Baseline: `team-advising-baseline-r2/bundle.json`
- Installed OpenCode: `1.18.25`
- Profile/model: generated `core`, `openai/gpt-5.6-sol/xhigh`

## Runtime Proof

The configured capture used one candidate root turn. The evaluator reports `modelCalls=2` across the selected baseline and candidate arms, both rows passing, `status=passed`, candidate bundle digest `a254efd2f700198c43acc9ddae4367869eee7733eb3bee085adbecaaa625863c`, and evaluation digest `b1499ccdb9c244192047dc48f670d56ebba3d29143767202ce24836f64e5ec2e`.

Main invoked `specialist-team-advisor` once. The advisor called `specialist_catalog` once and returned one dispatch-ready `implementation-worker` package with exclusive `worker/output.txt` ownership, exact `worker-ok\n` content, no test/proof/result ownership, and serial closure before main integration. Main dispatched one worker, observed terminal `status=completed`, inspected the output, authored `result.json`, and then ran `node check-result.ts`. The bundle records only `result.json` and `worker/output.txt` as changed, `workerCompletedBeforeProof=true`, `mainDisposition=team-recommended`, accepted package `worker-output`, proof status zero, and `sourceUnchanged=true`.

All child and root sessions were removed, the fixture was removed, no forbidden effect was observed, and `cleanup.complete=true`. Provider-free replay reproduced the same passing evaluation digest with `liveCalls=0`. The active gitignored `global/opencode.json` remained byte-identical at SHA-256 `0050d9de6b28e9b5574b57a519c5a3c09766910dc97afd0dcaf2b4a778628144`.

## Preserved Evidence

- `team-advising-candidate-r1-task-3-3/bundle.json`
- `team-advising-candidate-r1-task-3-3/evaluation.json`

The maximum claim is limited to this selected member under the recorded model, profile, source, and environment identities. No installation, active-config mutation, restart, commit, push, release, deployment, or remote effect occurred.
