# Task 6.1 Candidate Reference

## Identity

- Candidate Reference: `add-autonomous-roadmap-mission-runtime-task-6-1-r1`
- Product Candidate: current mission launcher, PTY bridge, roadmap entry point, executor wrapper, controller/preflight/contracts/state owners, completion-guard owners, installed `all` profile materialization, validators, and operator documentation.
- Configured proof environment: Windows, OpenCode `1.18.22`, Bun `1.3.14` with Node compatibility `v24.3.0`, `openai/gpt-5.6-sol`, profile `quality-independent`, variant `xhigh`, agent `build`, disposable isolated config/data/project, no host `127.0.0.1:4096`, no remote.
- Identity rule: Product Candidate identity is the content recorded by the source manifests below. Historical bundle `candidateId` values identify proof attempts and are not generalized as one runtime execution. Each provider-free lane retains its own Environment Identity and claim ceiling.

## Product Sources

| Owner | Immutable source identity |
| --- | --- |
| Configured controller/executor/launcher | `task-6-1-integrated-two-slice-capture-r1/raw.json` `sources` |
| Full mission/preflight/contracts source set | `task-6-1-current-source-contract-r5/raw.json` `productionSources` |
| Launcher and shared PTY manager | `task-6-1-current-source-launcher-r3/raw.json` `sources` |
| Current executor wrapper and completion guard | `task-6-1-owner-required-current-r2/raw.json` `sources` |
| Installed `all` profile source materialization | `task-5-1-install-doctor-r5/raw.json` runtime source manifests |
| Generated `all` loader/config surface (path-only readback, not a source identity) | `task-5-1-runtime-loader-r4/raw.json` |

The overlapping current identities are controller `e19fdc98ba08285b58bc39d53d439e48a0ae4e0fdddb7a9b60fb1e8e2d6cc81c`, inner executor `6ca220ffc342ed2db0d42ed30d55e72bd32eef28754e6009707f4bed282dec60`, launcher `3832b497cc384ed4e1a13d91455dabbc93f669a5d1412a07fdd3f4ddce66f599`, PTY bridge `47ba676ac221168c90cde9bfbd9889393f5cd0d7170cfc01a5b16aa8d67179bc`, roadmap entry point `6df1c2f293a41df4e48a6bb482ec1844d0f6847e5102f43e2626b4715661747b`, and executor wrapper `e5f243d29c247280e3d7be6eb45fddafc502daf70a9658f4748bc4043a783128`.

## Proof Identities

| Role | Identity |
| --- | --- |
| Configured capture runner/evaluator | `tools/proofs/roadmap-mission-integrated.ts` SHA-256 `58aa617d2f78c5f20648fea2a315d340d36b187ce643a7b57b15c32eb543ddab` at capture |
| Current configured replay evaluator | `tools/proofs/roadmap-mission-integrated.ts` SHA-256 `418e589b2604408551d24a0b35a4cd0a37a5d8bf411cdff2de7315fab4efbbfd` |
| Contract capture runner | `tools/proofs/roadmap-mission.ts` SHA-256 `48a2e76c9f48d42efae68a4ce61be41eba8dddf76cc032c5fbf9a2d4a33f8ee4` at capture |
| Current contract replay evaluator | `tools/proofs/roadmap-mission.ts` SHA-256 `04098c84a18fed413b614f8af6dea77c69c0acb85d07dccb43434a9c4ef92770` |
| Launcher capture/replay runner | `tools/proofs/roadmap-mission-launcher-stop.ts` SHA-256 `d1c5740ba73651835b95e3ac92e60302c10d3d908ec789920636e54226b89055` |
| Current owner-required runner/evaluator | `tools/proofs/roadmap-mission-runtime.ts` SHA-256 `ca98d31464f23c5d6435fb06d5b69d5502f36840b6aa3a2f479016309fd6b527` |

## Configured Invocation

```text
bun tools/proofs/roadmap-mission-integrated.ts --mode capture --profile quality-independent --candidate-id add-autonomous-roadmap-mission-runtime-task-6-1-r1 --evidence-root <new-task-6-1-capture-root> --scenario two-slice
```

The terminal capture output reported `status=complete`. `task-6-1-integrated-two-slice-capture-r1/raw.json` records OpenCode `1.18.22`, exact `openai/gpt-5.6-sol` / `xhigh` route facts, 49 completed assistant responses with zero response errors, three deleted roots, terminal controller PTY, no remote, and complete cleanup. The exact profile is an invocation input; it is not inferred from the raw route fields.

## Scenario Map

| Delta-spec scenario | Owning terminal evidence | Claim ceiling |
| --- | --- | --- |
| Valid serial mission | `task-6-1-current-source-contract-r5` + replay | Current provider-free contract environment |
| Roadmap prose contains another unchecked item | `task-6-1-current-source-contract-r5` + replay | Definition-owned scope only |
| Mission exceeds the campaign bound | `task-6-1-current-source-contract-r5` + replay | Provider-free rejection before writer |
| Two declared slices complete | `task-6-1-integrated-two-slice-capture-r1` + replay r2 | Exact configured environment |
| Campaign queue is exhausted | `task-6-1-integrated-two-slice-capture-r1` + replay r2 | Exact configured environment |
| Listed dormant changes await later slices | configured preflight/capture r1 and contract r5 | Per-lane admission facts |
| Unlisted active change exists | `task-6-1-current-source-contract-r5` + replay | Provider-free rejection before writer |
| Dormancy cannot be proven | `task-6-1-current-source-contract-r5` + replay | Busy/question/unreadable/lease partitions only |
| Propose slice reaches controller verification | configured capture r1 + replay r2 | Exact configured environment |
| Continue slice uses a new root | configured capture r1 + replay r2 | Exact configured environment |
| Current runtime identity is unsafe | contract r5 + replay | Missing/non-loopback/credentialed/stale/project/capability partitions |
| Operator launches a visible mission | configured capture r1 and launcher r3 + replay | Configured controller visibility plus provider-free cockpit lifecycle |
| Cockpit cannot be established | launcher r3 + replay | Provider-free launcher/manager environment |
| Operator requests graceful stop | launcher r3 + replay | Provider-free launcher/controller environment |
| Operator uses emergency cockpit kill | launcher r3 + replay; task-4-3 hard-kill remains a separately attributed r14 identity | Current-source launcher fail-closed facts only |
| Question requires owner authority | `task-6-1-owner-required-current-r2` + replay | Current wrapper/guard local-provider environment |
| Runtime disappears during a slice | launcher r3 + replay | Provider-free runtime-loss environment |
| Visible two-slice mission completes | configured capture r1 + replay r2; install doctor r5 hash-binds generated `all` materialization; loader r4 supplies path-only load-surface readback | Loaded isolated slash boundary composed with current generated-`all` materialization; no direct generated-`all` command or hash-bound loader claim |
| Preserved interruption corpus is replayed | current contract replay r5, launcher replay r3, owner replay r2, and separately attributed r14 hard-kill and local-blocker state replays | Union of exact per-lane identities only; r14 rows are not attributed to the current Product Candidate |

## Supplementary Task Proof

- Current compaction lifecycle: `compaction-raw.json` and `compaction-evaluation.json` record the current provider-free `npm run proof:guard-question` entry point, proof and production source digests, Bun `1.3.14`, terminal exit `0`, and direct `started`, `autocontinuePending`, `turnPreserved`, and `completed` oracles.
- Local-blocker recovery remains bounded to `task-4-3-local-blocker-simulate-r1`, its r14 source identities, simulation/state-replay mode, and `rootIsolation=not-proven`; it is not current-candidate proof.
- Fresh evidence challenge: `evidence-sufficiency-review-r2.md` records the corrected claim ceiling, exact retained gaps, and risk dispositions with Effective Model `xai/grok-4.6`.
- Current validation: `validation.md` records the candidate-bound project-unattended proof, focused test totals, strict validators, OpenSpec results, evidence-lane resolution, and the declared post-freeze/pre-archive historical retention cleanup.

## Terminal Verdicts

- Configured preflight and zero-call replay: `complete`.
- Configured capture and replay r2: `complete`; replay metadata records `replay.liveCalls=0`.
- Configured finalizer selftest: `complete`, `liveCalls=0`.
- Current contract/admission capture and replay: `complete`, replay `liveCalls=0`.
- Current launcher/stop capture and replay: `complete`, replay `liveCalls=0`.
- Current owner-required capture and replay: `complete`, writer terminal, root deleted, replay `liveCalls=0`.
- Current project-unattended readiness: `complete`, generated `all` source digests match the Product Candidate, ordinary qualification and unattended readiness pass, and cleanup is complete.
- Every recorded task-6.1 writer/process/session/PTY/fixture cleanup is complete. Owner-required r1 was terminal-blocked by proof-route readiness with cleanup complete; r2 used a route canary and supersedes that proof-environment failure.

## Claim And Evidence Scope

Maximum supported claim: the content-bound Product Candidate completes one exact configured two-slice mission through a loaded OpenCode `mission-run` slash boundary, and separately attributed current provider-free/local lanes cover the listed admission, visibility, stop, owner-required, compaction, and interruption partitions on current owning source hashes. Install-doctor r5 hash-binds generated `all` materialization; loader r4 confirms only its path/config load surface. The abandoned generated-`all` r1-r6 `session.command` mechanism is not claimed as working. Historical r14 hard-kill/local-blocker rows remain evidence only for their exact recorded identities. Evidence does not generalize to another OpenCode version, model/profile/variant, target project, operating system, remote effect, or a single runtime reference spanning every deterministic lane.

## Known Non-Critical Limitations

- The configured capture's redundant post-run validator process timed out, while both in-slice validation statuses, exact marker bytes, archives, checkpoints, tasks, and terminal durable state are green. The claim is bounded to those direct oracles.
- The SDK reports the known handled-command `Unexpected server error` sentinel while direct launcher, PTY, controller, state, and cleanup evidence is green.
- The configured raw bundle records model and variant but not the profile name; the exact `quality-independent` profile is preserved in the invocation above.
- Generated `all` serve-plus-command r1-r6 remains blocked before the launcher hook at isolated provider resolution and is not repeated or represented as task-6.1 runtime proof.
- Compaction remains a current component-local provider-free lane rather than a configured-capture event. Local-blocker recovery remains an older r14 simulation/state-replay lane. Neither claim is generalized beyond its exact owner and Environment Identity.
- The historical proof corpus remains untouched under the declared 750-file/8-MiB temporary retention exception; only current terminal lanes are in the bounded index. The declared cleanup rule requires reducing that corpus after this candidate freeze and before archive.
