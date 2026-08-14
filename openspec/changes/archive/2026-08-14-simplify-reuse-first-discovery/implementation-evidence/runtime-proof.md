# Runtime Proof

## Outcome and Stage

- Profile: `Material`
- Candidate: `simplify-r2`
- Outcome: working
- Development-Stage: `MVP`
- Live-Attempt Gate: clear

The smallest accepted loaded happy path is current: triggered new-mechanism work loads bounded reuse discovery, inspects current source, emits a compact disposition and explicit cross-project state, and performs no registry call; matched trivial work remains ceremony-free.

## Evidence Topology

- Product Candidate:
  - `global/AGENTS.md`: SHA-256 `09dcd9530c1a4ea1f176ab28c2bc39586acc91ff86e5ac79987681b0850c7514`
  - `global/skills/reuse-discovery/SKILL.md`: SHA-256 `9c0f51aa607f04903ed16665299234e0c3637bfed160bb18df047eb340deb073`
  - `global/commands/reuse-inventory.md`: absent
  - `global/bin/reuse-registry.ts`: absent
  - `README.md`: SHA-256 `efa14cb1f373decc0a33acb10f43312a1d8fe1f7bff346e0c1beb536446c2e7b`
  - `package.json`: SHA-256 `20e19fe085d504abdc813dfb25bf22875735a33114563a5afe93882b2302dc90`
- Proof Runner at preflight/capture: `tools/proofs/reuse-discovery.ts`, SHA-256 `9be9392552c11aa9bbe0155d01b2a60ed326504eeeff81fadffa380568ddfbba`; flat `bash: deny` replaced the ineffective nested-pattern map.
- Evaluator revision: provider-free exact-fact path in the same runner, SHA-256 `64a1dfe42ce8e0a14f742f0a5a9b0f96e64d0b84fbcd2f536d7e6b2752c283c3`; the post-capture patch only added no-bash facts and delayed output creation until inputs were readable, so raw capture remains valid.
- Environment: Windows, Node 24, OpenCode `1.18.18`, `quality-independent`, `openai/gpt-5.6-sol/xhigh`, fresh primary `build` processes, current global source, and the configured ignored machine-local instruction layer.
- Raw Evidence Bundle:
  - `implementation-evidence/candidate-preflight-r3/preflight.json`
  - `implementation-evidence/candidate-sessions-r2/local-owner.bundle.json`
  - `implementation-evidence/candidate-sessions-r2/trivial-fix.bundle.json`
  - `implementation-evidence/candidate-evaluation-r3/evaluation.json`
  - preserved failed offline chain: `implementation-evidence/candidate-evaluation-r2/failure.md`

## Provider-Free Preflight

Invocation:

`npm run proof:reuse-discovery -- --mode preflight --evidence-root openspec/changes/simplify-reuse-first-discovery/implementation-evidence/candidate-preflight-r3 --capture-kind candidate --candidate-id simplify-r2-proof-r2`

Observed:

- Exit `0`; model calls `0`; cleanup `removed`.
- Loader config, build-agent, and skill inventory exited `0`.
- Loaded skills include `reuse-discovery`.
- Loaded command names are `dedup`, `opsx-apply`, `opsx-archive`, and `opsx-propose`; `reuse-inventory` is absent.
- Registry command and CLI source hashes are `null`.
- Final proof permission map matches exactly and reports flat `bash: deny`.
- Existing credential count is `4`; values and provider names were not captured.

## Fresh Installed Capture

Invocation:

`npm run proof:reuse-discovery -- --mode capture --evidence-root openspec/changes/simplify-reuse-first-discovery/implementation-evidence/candidate-sessions-r2 --capture-kind candidate --candidate-id simplify-r2-proof-r2 --profile quality-independent --scenarios local-owner,trivial-fix`

### Triggered `local-owner`

- Process/session-delete/root-cleanup: `0 / 0 / true`.
- Elapsed fact: `101,558ms`.
- Loaded `reuse-discovery` before the implementation decision.
- Inspected the current loader/parser owners and local Alpha/Beta candidates.
- Source-inspected the apparent Alpha parser, identified its string-unsafe regex design, and selected `extend` for the existing consumer-owned parser rather than copying that candidate or adding a dependency/framework.
- Reported `Cross-project: degraded` because the bounded proof forbids external/remote discovery tools.
- Made no bash or registry call and changed none of the tracked fixture source bytes.
- Stderr was empty.

### `trivial-fix`

- Process/session-delete/root-cleanup: `0 / 0 / true`.
- Elapsed fact: `51,786ms`.
- Read only the task and existing greeting owner.
- Did not load `reuse-discovery` and made no bash, cross-project, or registry call.
- Returned the one-line punctuation correction and nearest exact proof.
- Changed none of the tracked fixture source bytes.
- Stderr was empty.

## Offline Evaluation

Invocation:

`npm run proof:reuse-discovery -- --mode evaluate --evidence-root openspec/changes/simplify-reuse-first-discovery/implementation-evidence/candidate-evaluation-r3 --baseline-root openspec/changes/simplify-reuse-first-discovery/implementation-evidence/baseline-sessions --candidate-root openspec/changes/simplify-reuse-first-discovery/implementation-evidence/candidate-sessions-r2 --candidate-id simplify-r2-proof-r2`

Observed `candidateComplete: true` with exact facts:

- triggered status/cleanup/source stability green;
- triggered skill load and disposition present;
- explicit cross-project state present;
- zero bash and registry calls;
- trivial status/cleanup/source stability green;
- zero trivial bash, reuse-skill, cross-project, or registry calls.

## Baseline Comparison and Limits

- Baseline triggered elapsed fact was `99,607ms`; candidate was `101,558ms`. This change makes no latency-improvement claim.
- Baseline trivial elapsed fact was `42,684ms`; candidate was `51,786ms`. The difference is observational only.
- Baseline and candidate used the same model/profile, prompts, workspace-visible source shape, and primary process boundary. The candidate intentionally lacks the prior registry product/config state and uses the narrowed proof runner.
- The proof covers a safe explicit `degraded` cross-project result, not a Graphify or another provider-specific successful peer lookup. The ignored machine-local gate remains unchanged; ordinary project use is the next Rung 3 boundary.
- No bash, dependency, source copy, product edit, external-directory read, web access, credential output, remote mutation, commit, push, installation, or activation occurred.
