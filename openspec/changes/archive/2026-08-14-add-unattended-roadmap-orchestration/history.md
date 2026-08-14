# Strategy History

## 2026-08-13 - Extend existing workflow owners

- **Objective:** make long-running roadmap work deterministic without turning the completion arbiter into a scheduler or adding a duplicate OpenSpec implementation.
- **Approach:** add a persisted mission/preflight/controller layer over existing operation gate, archive helper, project adapter, runtime-source diagnostics, session-delivery evidence, and completion guard.
- **Evidence:** runtime audit of `pmac-emulator` showed project-local OpenSpec surfaces shadowing newer kit contracts, doctor qualification blocked by missing project validation/runtime authority, one active change plus separate D2B/D2C successors, and guard retry/restart/evidence gaps. Repository search found the required lower-level owners but no mission state machine. Cross-project Graphify evidence was degraded and yielded no verified analogue.
- **Outcome:** selected `extend`; proposal authored before production mutation.
- **Reason:** a new independent workflow would duplicate archive, validation, evidence, and completion behavior and increase drift risk.
- **Do-Not-Repeat Condition:** do not implement another archive command, model-driven roadmap parser, free-form successor selector, or second completion arbiter.
- **Evidence-Based Retry Condition:** revisit build-versus-reuse only if a current verified implementation supplies the exact mission state, restart, OpenSpec lifecycle, and protected-boundary contract at lower total cost.

## 2026-08-13 - Runtime preflight proof R2

- **Objective:** prove provider-free real Git/OpenSpec/adapter/canonical-loader preflight in a generic disposable project.
- **Approach:** invoke the production CLI against a copied canonical global source, fake OpenSpec 1.6-compatible executable, real Git repository, resolved adapter, and actual `opencode debug skill/config --pure` loader.
- **Evidence:** every deterministic prerequisite passed, but `workflow:loaded-identity` rejected `openspec-apply-change` because the evaluator compared the complete loaded skill content byte-for-byte with the source body.
- **Outcome:** proof blocked before evidence publication; fixture cleanup completed.
- **Reason:** OpenCode appends loader-owned runtime metadata to skill content. Exact full-content equality was an invalid oracle even though the selected `location` resolved to the canonical file and that file had already passed canonical source/hash readback.
- **Do-Not-Repeat Condition:** do not compare the complete loaded skill content with the source body or weaken identity to same-name presence.
- **Evidence-Based Retry Condition:** require exact canonical location, canonical file readback/hash, and canonical body prefix while permitting only loader-added suffix metadata; then rerun the same disposable scenario.

## 2026-08-13 - Runtime preflight proof R3

- **Objective:** rerun the runtime preflight after permitting loader-added skill suffix metadata.
- **Approach:** retain exact canonical location/hash and compare loaded skill content by source-body prefix.
- **Evidence:** the same `openspec-apply-change content differs` result remained while every non-loader prerequisite passed. The source normalizer converted CRLF to LF, but the loaded content side retained CRLF internally.
- **Outcome:** no downstream boundary advancement; this is the second materially similar local attempt in the same failure chain and establishes stagnation.
- **Reason:** the comparison still used different newline representations, so suffix handling could not affect the first internal line break mismatch.
- **Do-Not-Repeat Condition:** do not rerun with another prefix/suffix flag or compare unnormalized loader/source text.
- **Evidence-Based Retry Condition:** canonicalize CRLF/LF on both loaded and source representations while retaining exact location and source hash gates, then retry once.

## 2026-08-13 - Runtime preflight proof R4

- **Objective:** prove the normalized canonical loader identity and complete provider-free preflight.
- **Approach:** canonicalize CRLF/LF for loaded/source skill and command text while retaining exact source location/hash gates.
- **Evidence:** loader identity no longer blocked; the proof reached its no-mutation postcondition and reported that the valid project file manifest changed. The current evaluator did not expose the changed path before deleting the fixture.
- **Outcome:** identity cause retired; a new no-mutation failure chain blocks task 2.2 proof.
- **Reason:** at least one runtime-inspection command represented as read-only has an unclassified local file effect, or the fixture manifest includes a volatile path that must remain explicitly owned rather than silently ignored.
- **Do-Not-Repeat Condition:** do not exclude `.git`, `.opencode`, caches, or another path category without observing the exact added/removed/changed rows.
- **Evidence-Based Retry Condition:** add deterministic manifest-difference diagnostics, recapture once, then either remove/isolate the mutating production inspection or explicitly own and restore a proven harmless tool cache outside the project behavior boundary.

## 2026-08-13 - Runtime preflight diagnostic capture R5

- **Objective:** identify the exact filesystem mutation left by provider-free loader inspection.
- **Approach:** compare full project file manifests and return stable added/changed/removed path rows before fixture cleanup.
- **Evidence:** the only delta was added `.git/opencode`; no source, config, OpenSpec, adapter, roadmap, or mission file changed.
- **Outcome:** mutation cause identified; proof remains blocked until production preflight restores its own inspection marker.
- **Reason:** `opencode debug` creates its project identity marker even in pure debug mode.
- **Do-Not-Repeat Condition:** do not ignore `.git/opencode` in proof manifests and do not remove a pre-existing marker.
- **Evidence-Based Retry Condition:** production loader inspection records whether the exact marker existed; if absent, it removes only the newly created regular marker and fails on unsafe/failed cleanup; if present, it verifies the marker remains byte-identical.

## 2026-08-13 - Expanded preflight proof R8

- **Objective:** close every task 2.2 scenario with one generic provider-free capture.
- **Approach:** add missing-adapter, ambiguous-active-change, dirty-owned-path, invalid-checkpoint, and protected-effect fixtures to the existing valid/forward-dependency/overlay proof.
- **Evidence:** protected-effect fixture failed during manifest parsing because slice B retained `local-write` while the fixture's `allowedEffects` replaced local-write with hardware.
- **Outcome:** proof input blocked before runtime effect classification; no evidence bundle was published and disposable cleanup completed.
- **Reason:** fixture construction changed the allowed effect set globally but changed only slice A's effect set.
- **Do-Not-Repeat Condition:** do not represent a protected-effect scenario by removing effects still used by independent slices.
- **Evidence-Based Retry Condition:** retain every original local effect in `allowedEffects`, add hardware plus its explicit authority reference, and let only the next slice require hardware so runtime `mission:next-effects` owns the expected block.

## 2026-08-13 - Canonical workflow post-migration proof R1

- **Objective:** restore current Runtime Proof after relocating the standard OpenSpec workflow owner from project-local `.opencode` surfaces to the installed global source.
- **Approach:** fix global skill schema/catalog/portable-entrypoint validation, share the production mission source inventory with the proof runner, then invoke the actual preflight and OpenCode loader in eight disposable Git/OpenSpec-compatible projects.
- **Evidence:** `evidence/canonical-workflow-r1/raw.json` records the current gate/mission source hashes; the valid scenario loaded all three standard skills and commands from the copied canonical global source and selected `slice-a`; ambiguous change, dirty owned path, missing adapter, stale project overlay, protected effect, forward dependency, and invalid checkpoint each blocked; every before/after manifest matched. `evaluation.json` records status and cleanup complete with mutation count zero. Repository `npm run validate`, strict selected-change validation, operation gate, loader readback, and `git diff --check` exited zero.
- **Outcome:** tasks 2.2, 2.3, 3.1, and improvement I2 are proven on the post-migration candidate; task 3.2 is the next dependency boundary.
- **Reason:** one canonical installed workflow now owns the standard names while project overlays remain explicit fail-closed migration blockers rather than silent precedence behavior.
- **Do-Not-Repeat Condition:** do not restore same-name project copies, duplicate the production module inventory in the proof runner, or infer loaded identity from file presence alone.
- **Evidence-Based Retry Condition:** rerun this lane only if a Product Candidate, loader environment, canonical workflow source, or proof runner mutation invalidates its recorded identity or behavior.

## 2026-08-13 - Focused library validation after unattended diagnostics

- **Objective:** check existing bootstrap/doctor/library contracts after adding separate unattended readiness diagnostics.
- **Approach:** run the existing focused init and library suites without editing automated tests or fixtures before complete accepted-scope Runtime Proof.
- **Evidence:** `npm run test:focused:init` passed 3/3. `npm run test:focused:library` failed because current test fixtures still omit the newly canonical `global/bin/openspec-operation-gate.ts` and roadmap-mission files, retain the old `node tools/openspec-operation-gate.ts` package script, omit the new unattended adapter object, and read deleted `.opencode` OpenSpec workflow paths.
- **Outcome:** production/disposable proof remains green, but full focused library validation is red and improvement I1 remains open for the fresh test-only SDET lane.
- **Reason:** these are the stale test ownership references already identified during task 3.1 migration; changing production behavior to accept the retired owner would invalidate the canonical-workflow requirement.
- **Do-Not-Repeat Condition:** do not rerun the full focused library suite before I1 retargets the test fixtures, and do not weaken the production validator or restore project-local workflow copies merely to satisfy stale tests.
- **Evidence-Based Retry Condition:** after complete accepted-scope Runtime Proof, fresh SDET updates I1 test-only owners/fixtures and the focused suite is rerun against the current candidate.

## 2026-08-13 - Disposable project unattended readiness R3

- **Objective:** prove task 3.2 bootstrap, doctor, adapter, source-diagnostic, and non-destructive migration behavior in unrelated disposable non-JavaScript projects.
- **Approach:** drive actual `init-project`, `doctor`, runtime-source inventory, installed roadmap mission definition/workflow modes, and OpenCode loader against fresh and legacy roots; preserve only bounded privacy-safe facts; add an explicit overwrite backup oracle before the final capture.
- **Evidence:** `evidence/project-readiness-r3/raw.json` records preview/write exit zero, no project-local canonical workflow copies, selected mission and aggregate argv pass, ordinary qualification pass, separate unattended status blocked only by the not-yet-finite guard lane, exact legacy overlay collision, unchanged overlay hash, and byte-identical explicit-overwrite `AGENTS.md` backup. Runtime source locations are reduced to `<global-source>`, `<fixture>`, or `<external-source>`. `evaluation.json` records cleanup complete. `evidence/canonical-workflow-r2/**` re-proves the current mission entrypoint source identity and zero-mutation scenarios after its new definition/workflow diagnostic modes.
- **Outcome:** task 3.2 is complete; controller state/replay task 4.1 is the next dependency boundary. Focused library validation remains red only on the already-open test-only I1 migration.
- **Reason:** ordinary project usability, unattended capability, canonical workflow identity, checkpoint support, aggregate argv, and long-run guard readiness are now independently observable without deleting or silently migrating project files.
- **Do-Not-Repeat Condition:** do not infer unattended readiness from ordinary qualification, print raw config/provider payloads, auto-delete overlays, or rerun the stale full focused library fixture suite before I1.
- **Evidence-Based Retry Condition:** rerun the project-readiness lane only after bootstrap/doctor/template/source-diagnostic/Product Candidate or runner mutation; rerun focused library after fresh SDET updates I1.

## 2026-08-13 - Mission state proof R1 lease-holder setup failure

- **Objective:** prove restart recovery after archive with one proof-owned terminated writer lease.
- **Approach:** start the proof runner in an internal lease-holder mode, wait for its create-new `writer.lock`, terminate only that child, then resume through production reconciliation/replay.
- **Evidence:** the child created the lease but exited before termination; the parent reported `Proof-owned lease process did not accept termination`. No evidence bundle was published and disposable cleanup completed.
- **Outcome:** state transition proof did not start; Product Candidate semantics were not implicated.
- **Reason:** an unresolved Promise alone does not retain a Node event-loop handle, so the internal lease-holder reached natural process exit.
- **Do-Not-Repeat Condition:** do not use a handle-free pending Promise to represent a live proof-owned writer.
- **Evidence-Based Retry Condition:** retain the child with an explicit timer handle, observe it still running after `writer.lock` appears, then repeat against a new evidence root.

## 2026-08-13 - Mission state restart proof R2

- **Objective:** prove immutable transition/state persistence and restart recovery between archive and checkpoint/successor activation.
- **Approach:** invoke actual production state CLI modes, terminate only a proof-owned child after its writer lease exists, quarantine the stale lease during reconciliation, then continue checkpoint and successor transitions; run separate missing-transition and unknown-writer fixtures.
- **Evidence:** `evidence/roadmap-state-r2/raw.json` records `preflight -> archive -> restart-reconciliation -> checkpoint -> successor-activation`, sequence 5, current projection, clear writer, one stale lease archive, and exactly one archive. Duplicate archive exited 2; removed first transition exited 2 on non-contiguous chain; persisted active session with no lease exited 1 and reported writer unknown. `evaluation.json` records status/cleanup complete. `evidence/canonical-workflow-r3/**` re-proves current global source identity including `state.ts` and all preflight scenarios with zero mutation.
- **Outcome:** task 4.1 is complete; task 4.2 serial controller composition is the next boundary.
- **Reason:** durable immutable transitions now precede atomic projection updates, restart cannot infer over a missing/corrupt chain or unknown writer, and an archived slice cannot be archived twice.
- **Do-Not-Repeat Condition:** do not bypass transition hash-chain replay, clear an active operation during reconciliation, reuse a live/unknown writer lease, or infer cursor from roadmap prose.
- **Evidence-Based Retry Condition:** rerun the state lane after state schema/transition/lease/replay/runner mutation or an environment change affecting process-liveness behavior.

## 2026-08-13 - Mission controller proof R1 attribution failure

- **Objective:** prove two serialized OpenSpec archives, rejection/retry of one false completion, and stop before a protected third slice.
- **Approach:** run the production controller through existing operation-gate and complete-archive owners with a fake/no-model executor and OpenSpec-compatible disposable CLI.
- **Evidence:** change A's first executor exit zero left its task unchecked; the archive gate rejected it and the controller invoked a second attempt. A then archived successfully. Successor preflight stopped at cursor 1 because the proof fake wrote `.archive-calls` outside the mission evidence/owned-path set. No evidence bundle was published and fixture cleanup completed.
- **Outcome:** false-completion and first archive behavior advanced; the complete controller scenario remains unproved.
- **Reason:** proof-only archive call instrumentation was unattributed dirty state, correctly rejected by production preflight.
- **Do-Not-Repeat Condition:** do not place proof counters outside the mission evidence path or weaken dirty-state attribution to ignore them.
- **Evidence-Based Retry Condition:** place archive counters under the mission evidence path, preserve exact dirty-path attribution, add archive-launch transition before the side effect, and rerun with a new evidence root.

## 2026-08-13 - Mission controller proof R2

- **Objective:** prove the provider-free serial OpenSpec controller through two archives and a terminal protected successor.
- **Approach:** hold one mission writer lease across the mutation window; compose existing apply/archive gates and complete-archive helper around an explicit bounded executor argv; persist archive-launch before the side effect and derive every lifecycle transition from machine-readable filesystem/OpenSpec facts.
- **Evidence:** `evidence/roadmap-controller-r2/raw.json` records executor counts A=2, B=1, C=0; A's first zero-exit retained an unchecked task and archive was not invoked; A and B then archived exactly once; transition sequence includes session launch/completion, archive-launch/archive/checkpoint, one successor activation, and terminal stop before C. State replay is valid/current/clear. `evaluation.json` and cleanup are complete. `roadmap-state-r3`, `canonical-workflow-r4`, strict validation, operation gate, diff check, and focused operation-gate tests are green.
- **Outcome:** task 4.2 is complete; task 4.3 checkpoint modes are the next dependency boundary.
- **Reason:** model/executor output remains non-authorizing evidence; tasks, gates, complete-archive helper output, OpenSpec list readback, protected effects, and durable state own transitions.
- **Do-Not-Repeat Condition:** do not trust executor exit/prose as completion, run archive without archive-launch state, release the controller lease around a writer, ignore timeout, or treat unattributed dirty state as mission-owned.
- **Evidence-Based Retry Condition:** rerun controller plus dependent state/preflight lanes after controller/gate/archive/process/state mutation or an environment change affecting process/CLI semantics.

## 2026-08-13 - Checkpoint proof R4 undifferentiated Git fixture failure

- **Objective:** extend the controller proof through local-commit and external checkpoint modes.
- **Approach:** add two isolated disposable Git scenarios to the existing fake/no-model controller proof.
- **Evidence:** the runner exited before evidence publication with `error: no action specified`; fixture cleanup completed, but the Git helper omitted argv from its exception and the owning command was therefore unknown.
- **Outcome:** checkpoint behavior remains unproved; no Product Candidate cause is claimed.
- **Reason:** proof diagnostics at the Git fixture boundary were insufficient to distinguish setup, commit, ref-readback, or staging failure.
- **Do-Not-Repeat Condition:** do not retry the same checkpoint scenario while discarding the failing Git argv.
- **Evidence-Based Retry Condition:** include exact Git argv in helper failures, rerun once against a new evidence root, then correct only the observed causal mechanism.

## 2026-08-13 - Checkpoint proof R5 Windows Git config setup failure

- **Objective:** identify and retire the undifferentiated R4 Git setup failure.
- **Approach:** rerun with exact Git argv in proof helper diagnostics.
- **Evidence:** the runner reported `git config user.name Mission Controller Proof failed: error: no action specified`; the checkpoint controller had not started and cleanup completed.
- **Outcome:** the exact fixture-only cause is known; two setup attempts in the same chain produced no checkpoint boundary advancement, so the `git config` setup strategy is stagnant and retired.
- **Reason:** the proof's portable Windows Git invocation did not represent the spaced config value as the intended set action. Production checkpoint behavior does not need repository config mutation.
- **Do-Not-Repeat Condition:** do not configure disposable commit identity through `git config` in this proof path or retry only with alternate quoting.
- **Evidence-Based Retry Condition:** supply proof-only author/committer identity in the controller process environment, leave Git config untouched, and retry through the actual checkpoint boundary.

## 2026-08-13 - Checkpoint proof R6 bare native argv defect

- **Objective:** reach the local-commit checkpoint after replacing Git config mutation with environment-scoped identity.
- **Approach:** run the complete checkpoint proof with proof-only author/committer environment variables.
- **Evidence:** fixture setup advanced, then a Git commit with message `configure local-commit checkpoint fixture` failed because bare `git` was sent through `cmd.exe` and the spaced message became pathspecs (`local-commit`, `checkpoint`, `fixture`). The same portable-process path is used by production local checkpoint commit messages.
- **Outcome:** reproduced a Product Candidate process-boundary defect; checkpoint remains unproved.
- **Reason:** `runPortableCommand` directly spawned only argv entries already ending in `.exe`/`.com`; it did not resolve bare native executables from `PATH` before falling back to the command shell.
- **Do-Not-Repeat Condition:** do not remove spaces from commit messages, add quoting variants at each caller, or route native executables through shell strings.
- **Evidence-Based Retry Condition:** resolve bare Windows `.exe`/`.com` commands from the provided `PATH`, preserve metacharacter validation, spawn resolved native executables with `shell: false`, validate the portable-process contract, then rerun checkpoint proof.

## 2026-08-13 - Checkpoint proof R7 Windows environment casing defect

- **Objective:** prove local-commit and external checkpoint modes after adding native executable resolution.
- **Approach:** resolve bare `.exe`/`.com` commands from `environment.PATH`, spawn them directly, validate the existing process contract, then run the complete checkpoint proof.
- **Evidence:** existing absolute-native and metacharacter process oracles passed, but checkpoint fixture setup reproduced the R6 pathspec split before publishing a bundle. Inspection showed the proof passes `{ ...process.env, GIT_* }`; on Windows that ordinary object retains `Path`, while the resolver read only case-sensitive `PATH`.
- **Outcome:** checkpoint remains unproved; native resolution was bypassed for cloned Windows environments.
- **Reason:** Windows environment names are case-insensitive, but spread-cloned JavaScript environment objects are not.
- **Do-Not-Repeat Condition:** do not retry with a resolver that reads only `environment.PATH`, and do not patch individual proof or controller environments with a duplicate `PATH` key.
- **Evidence-Based Retry Condition:** find the supplied PATH variable case-insensitively, retain direct native spawn and shell-script fallback, syntax-check, then run a new checkpoint proof root.

## 2026-08-13 - Checkpoint proof R8 Git format placeholder rejected

- **Objective:** prove checkpoint modes after making Windows PATH lookup case-insensitive.
- **Approach:** run the complete controller proof with bare Git resolved to direct `git.exe` execution.
- **Evidence:** proof advanced beyond spaced commit setup, then failed closed on `git for-each-ref --format=%(refname):%(objectname)` because `%` is prohibited by the portable process shell-safety contract. Source inspection also found production crash recovery using `git log --format=%s`.
- **Outcome:** direct native execution works, but checkpoint proof and a production recovery readback still depended on shell metacharacter-bearing Git format arguments.
- **Reason:** the process owner intentionally validates every Windows argv before choosing a direct or shell-backed executable; weakening that rule would regress the existing fail-closed contract.
- **Do-Not-Repeat Condition:** do not exempt `%` for native executables, bypass `runPortableCommand`, or change only the proof while production retains a format placeholder.
- **Evidence-Based Retry Condition:** replace production subject readback with `git cat-file commit HEAD` parsing, compare proof remote refs using default `git for-each-ref` output, then syntax-check and run a new full proof root.

## 2026-08-13 - Checkpoint proof R9 unlabelled empty controller output

- **Objective:** prove checkpoint modes after removing Git format placeholders from production recovery and proof inspection.
- **Approach:** run the complete checkpoint proof with direct native Git and format-free argv.
- **Evidence:** proof advanced beyond the prior format rejection but terminated with `Unexpected end of JSON input`; no evidence root was published. The runner had multiple bare `JSON.parse(result.stdout)` sites, so the output did not identify which controller stage returned no JSON or preserve its stderr.
- **Outcome:** checkpoint remains unproved and the precise later production or fixture failure is unknown.
- **Reason:** proof-runner diagnostics collapsed a child-process failure into a contextless JSON parser exception.
- **Do-Not-Repeat Condition:** do not infer the failed stage or change production behavior from the parser exception; do not rerun with the same unlabelled parse path.
- **Evidence-Based Retry Condition:** add privacy-safe stage labels, exit status, and stderr to expected controller report parsing, then run one new disposable diagnostic proof to identify the exact causal failure.

## 2026-08-13 - Checkpoint proof R10 scoped staging mismatch

- **Objective:** identify and clear the exact post-R9 checkpoint failure using stage-labelled proof diagnostics.
- **Approach:** run the complete proof with controller stage, exit status, and stderr preserved on non-JSON stdout.
- **Evidence:** local-commit controller reached production scoped staging, then failed closed with `staged checkpoint paths differ from the attributed dirty set`; no evidence bundle was published. The existing production diagnostic did not report either relative path set.
- **Outcome:** checkpoint remains unproved; the failure is narrowed to the post-`git add` equality invariant.
- **Reason:** unknown until the computed attributed and staged path sets are observed; both are already privacy-safe repository-relative metadata.
- **Do-Not-Repeat Condition:** do not weaken or remove exact staged-set equality, and do not guess whether rename detection, ignored runtime state, or another Git behavior caused the mismatch.
- **Evidence-Based Retry Condition:** include sorted attributed and staged relative path sets in the fail-closed diagnostic, then run one new disposable proof to retire the remaining causal ambiguity.

## 2026-08-13 - Checkpoint proof R11 rename-normalization mismatch

- **Objective:** observe the exact attributed and staged path sets at the local-commit equality gate.
- **Approach:** preserve both sorted repository-relative inventories in the production fail-closed diagnostic and rerun the complete proof.
- **Evidence:** attributed paths contained deletions under `openspec/changes/change-a/**` and additions under `openspec/changes/archive/change-a/**`; staged output omitted source files whose unchanged bytes Git detected as renames, while retaining the modified `tasks.md` source deletion. The index therefore represented the expected mutations but `--name-only` used different rename normalization after staging.
- **Outcome:** root cause confirmed; checkpoint remains unproved.
- **Reason:** dirty inventory and staged readback compared path-level mutation sets while staged `git diff` was allowed to collapse delete/add pairs through rename detection.
- **Do-Not-Repeat Condition:** do not weaken exact equality, infer rename pairs, or permit archive paths outside the owned set.
- **Evidence-Based Retry Condition:** add `--no-renames` to unstaged, cached, and post-stage Git inventories so both sides report explicit additions/deletions, then run a new full proof root.

## 2026-08-13 - Long-run guard proof R1 Windows SQLite cleanup failure

- **Objective:** prove bounded long-root projection, terminal pre-prompt overflow, finite retained-child rotation, and cleanup through the production owners.
- **Approach:** create an oversized disposable SQLite root, invoke production projection/controller/arbiter-child in one Bun process, preserve raw/evaluator facts, then delete the fixture in `finally`.
- **Evidence:** all behavioral assertions completed and the evidence root was written, but final fixture deletion failed with Windows `EBUSY`; `evaluation.json` remains `cleanup: pending`. Source inspection confirmed `readSessionDeliveryContext` closes its read-only database in `finally`.
- **Outcome:** R1 is failed raw evidence and does not prove task 5.1 because required cleanup is incomplete.
- **Reason:** Bun's native SQLite resource remained locked on Windows until process termination despite explicit close; exact lower-level handle lifetime is runtime-internal.
- **Do-Not-Repeat Condition:** do not claim R1, retry deletion delays, ignore cleanup, or weaken terminal cleanup requirements.
- **Evidence-Based Retry Condition:** run production projection in a short-lived child process, consume JSON only after terminal child exit, then let the parent perform behavioral evaluation and fixture deletion under a new evidence root.

## 2026-08-13 - Guard restart proof R1 command activation mismatch

- **Objective:** prove a transient local-provider failure resumes after a proof-owned OpenCode process restart with the same persisted audit, child, and bounded attempt.
- **Approach:** start a fresh isolated OpenCode server, create a root, invoke `session.command` for `enable-grind`, drive one primary response and retry, restart the server, and inspect correlated metadata.
- **Evidence:** the runner stopped at `session.command` with `enable grind failed` before any model/provider request or evidence publication. Cleanup stopped the proof server/provider and removed isolated state.
- **Outcome:** no Runtime Proof; production retry/restart behavior was not reached.
- **Reason:** the SDK command endpoint is an assistant-command execution route and did not accept this slash-command activation shape in the headless proof. Existing installed proofs and production state restoration use persisted `completionGuard.grindEnabled` metadata.
- **Do-Not-Repeat Condition:** do not add a provider-backed command turn merely to activate proof state or retry the same headless `session.command` shape.
- **Evidence-Based Retry Condition:** create the disposable root with explicit persisted `completionGuard.grindEnabled=true` metadata, then drive the same fresh-loader provider/restart boundary under a new evidence root.

## 2026-08-13 - Guard restart proof R2 missing root-state diagnostic

- **Objective:** reach a persisted retry through explicit grind-enabled root metadata, then restart the proof-owned OpenCode process.
- **Approach:** create the disposable root with `completionGuard.grindEnabled=true`, complete one primary local-provider response, and wait for `audit-retrying` before process termination.
- **Evidence:** the primary prompt completed but the runner timed out waiting for `audit-retrying`; no external provider was used and cleanup removed the local server/provider/fixture. The timeout did not preserve the last guard metadata, local request kinds, or server log cause.
- **Outcome:** restart was not attempted and guard behavior remains unproved.
- **Reason:** unknown; candidates include loader startup failure, root state restoration, event scheduling, or local transport shape, but R2 output cannot distinguish them.
- **Do-Not-Repeat Condition:** do not change production or retry from the bare timeout.
- **Evidence-Based Retry Condition:** preserve the last guard state and keys, local simulator request kinds, and redacted bounded server-log tail on failure, then run one new diagnostic proof root.

## 2026-08-13 - Guard restart proof R3 startup session-list payload defect

- **Objective:** diagnose why the fresh loaded guard never left the root's initial running metadata after one local primary response.
- **Approach:** preserve last guard metadata keys/state, local simulator request kinds, and a redacted bounded OpenCode server log tail.
- **Evidence:** local simulator received one primary request and zero arbiter requests. OpenCode 1.18.18 logged `failed to load plugin` at startup because `roots.filter is not a function` in `reconcileRoots`; the runtime `v2.session.list` response data was a nested payload rather than the source-assumed direct array. Root metadata consequently remained the initial `{grindEnabled,state}` object.
- **Outcome:** reproduced a current Product Candidate startup defect before hook registration; no restart attempt or provider retry occurred.
- **Reason:** the generated SDK declaration describes an array response, but the active runtime client adapter returned an additional `data` envelope, as already handled by this repository's agent-list route.
- **Do-Not-Repeat Condition:** do not bypass startup reconciliation, assume declarations override observed runtime shape, or loosen to arbitrary object coercion.
- **Evidence-Based Retry Condition:** accept only a direct array or one explicit nested `data` array for session-list payloads, fail closed otherwise, then run a fresh loaded restart proof.

## 2026-08-13 - Guard restart proof R4 outer timeout and storage isolation defect

- **Objective:** prove transient retry recovery after correcting the fresh-loader session-list payload parser.
- **Approach:** run the complete two-server restart proof with a 180-second outer process timeout and the runner's `OPENCODE_DATA_DIR` fixture setting.
- **Evidence:** the outer tool timed out with no runner output or evidence root. Writer closure then showed no proof-created OpenCode/Bun process or listener remained; only exact temp root `guard-restart-proof-WhjG1j` remained. Its `data/` directory was empty because OpenCode 1.18.18 ignores `OPENCODE_DATA_DIR`; repository history already records `XDG_DATA_HOME`, `XDG_CACHE_HOME`, and `XDG_STATE_HOME` as the required isolation mechanism. Host-default database inspection found zero exact `guard restart proof` sessions, showing runner cleanup removed its sessions before outer kill. The exact temp root was then deleted.
- **Outcome:** R4 is failed with no immutable proof bundle; attempt liveness and cleanup are now closed.
- **Reason:** the runner repeated a known invalid storage override and had no internal terminal deadline; its stop helper also attached the exit listener after kill, permitting a missed-exit cleanup hang.
- **Do-Not-Repeat Condition:** do not use `OPENCODE_DATA_DIR` for OpenCode server isolation, rely only on an outer timeout, or attach process-exit observation after termination.
- **Evidence-Based Retry Condition:** isolate all XDG data/cache/state roots, add a runner-owned terminal deadline, attach the exit listener before kill, syntax/fixture-check the runner, then start a fresh proof root.

## 2026-08-13 - Guard restart proof R5 missing isolated arbiter route

- **Objective:** prove persisted retry/restart with corrected XDG isolation and runner-owned process termination.
- **Approach:** start the isolated fresh loader, complete one primary local-provider response, wait for persisted retry, then inspect the retained child before restart.
- **Evidence:** guard entered `audit-retrying` with attempt `1/2`, but no child existed. Server diagnostics showed `Configured hidden completion arbiter route is unavailable` before `ensureArbiterChild` creation; the copied arbiter Markdown intentionally has no fixed model and the isolated config had not supplied one. The failure was classified transient because the generic classifier matched `unavailable`, although a missing hidden route is a capability fault.
- **Outcome:** restart was not attempted; runner cleanup completed and no evidence root was published.
- **Reason:** incomplete isolated agent route plus an overbroad transient-error keyword.
- **Do-Not-Repeat Condition:** do not expect a copied model-neutral agent artifact to acquire a route implicitly, and do not classify all `unavailable` messages as provider-transient.
- **Evidence-Based Retry Condition:** configure the proof-only hidden arbiter model in the isolated config, classify hidden-route/capability faults before transient provider faults, then run a fresh proof root.

## 2026-08-13 - Guard restart proof R6 misplaced prompt-timeout option

- **Objective:** reach one real local-provider arbiter failure and persist a retained retrying child before process restart.
- **Approach:** configure the isolated hidden arbiter model, classify route faults as capability failures, and rerun the fresh loader.
- **Evidence:** the hidden child was created with correct root/audit/revision correlation, but no arbiter HTTP request reached the simulator. Server diagnostics recorded immediate `ArbiterPromptTimeoutError: ... undefinedms`; source inspection found `arbiterPromptTimeoutMs` mistakenly returned by `parseAuditWindowOptions` instead of the top-level `parseGuardOptions`. Root retry state became visible before child metadata finished updating from `auditing` to `retrying`.
- **Outcome:** no restart attempt and no proof bundle; cleanup completed.
- **Reason:** production option wiring defect plus a runner assertion that observed a valid short metadata-convergence window.
- **Do-Not-Repeat Condition:** do not infer provider timeout from `undefinedms`, and do not require root/child metadata writes to be simultaneous.
- **Evidence-Based Retry Condition:** return `arbiterPromptTimeoutMs` from top-level guard options, remove it from audit-window output, wait boundedly for child retry metadata after root retry state, then run a fresh proof root.

## 2026-08-13 - Guard restart proof R7 provider-internal retry crossed simulator recovery

- **Objective:** persist one guard-owned transient retry and restart with the same child/audit after correcting prompt-timeout option wiring.
- **Approach:** return HTTP 503 for the first arbiter request and a valid correlated verdict for the next request, expecting the first failure to reach the completion guard.
- **Evidence:** the local simulator received two arbiter requests in the same first-server audit. OpenCode/AI SDK retried the 503 internally before `session.prompt` returned; the aggregate child response then lacked one exact verdict object, and the guard correctly stopped after attempt `1/2` as immutable `input-state` with no automatic guard retry. Cleanup completed and no bundle was published.
- **Outcome:** production immutable-error classification worked, but persisted guard retry/restart was not exercised.
- **Reason:** simulator recovery was keyed to HTTP request ordinal, below the guard's `session.prompt` ownership boundary.
- **Do-Not-Repeat Condition:** do not equate one HTTP request with one guard attempt or recover the transport before the first proof-owned OpenCode process is terminal.
- **Evidence-Based Retry Condition:** keep every arbiter HTTP request in outage throughout the first server, wait for guard-owned retry metadata, stop that server, explicitly recover the simulator, then start the second server under a new evidence root.

## 2026-08-13 - Guard restart proof R8 startup recovery not scheduled

- **Objective:** preserve one guard-owned retry through first-server outage, recover the simulator only after process exit, and resume on the second server.
- **Approach:** keep all first-server arbiter HTTP requests at 503, wait for converged retrying child metadata, stop server one, recover local transport, and start server two on the same isolated XDG roots.
- **Evidence:** first-server retry state and child converged and server one stopped. Server two started, but root metadata remained `audit-retrying` with the prior message and `restartRecoveryAction:null`; simulator received no post-restart arbiter request. Cleanup completed. Existing diagnostics did not reveal whether the startup list omitted the root, returned a nested shape, omitted metadata, or ran before the project instance was ready.
- **Outcome:** persisted retry exists but restart reconciliation remains unproved.
- **Reason:** unknown within the startup list/reconciliation boundary.
- **Do-Not-Repeat Condition:** do not change recovery scheduling or list parsing from unchanged root metadata alone.
- **Evidence-Based Retry Condition:** capture privacy-safe post-restart `v2.session.list` nesting keys, row count, exact proof-title match count, and completion-guard metadata keys, then run one diagnostic proof root.

## 2026-08-13 - Guard restart proof R9 list rows omit persisted metadata

- **Objective:** observe the exact startup session-list shape and metadata availability after a persisted retry.
- **Approach:** repeat the first-server outage/restart sequence and inspect only post-restart list nesting, row count, proof-title match count, and guard metadata keys.
- **Evidence:** `v2.session.list` returned `{cursor,data}` with two rows and one exact proof-title match, but that row's completion-guard metadata keys were empty. The canonical `session.get` read still showed the root in `audit-retrying`; no post-restart arbiter request occurred. Cleanup completed.
- **Outcome:** root discovery works, but restart reconciliation filters an intentionally compact list row before reading full persisted metadata.
- **Reason:** startup treated global session-list rows as full session records; active OpenCode 1.18.18 omits metadata from this list representation.
- **Do-Not-Repeat Condition:** do not infer grind state from list-row absence, parse database storage directly, or broaden to unknown metadata shapes.
- **Evidence-Based Retry Condition:** use list rows only to enumerate parentless identities, fetch each candidate through canonical `session.get`, filter on full metadata, then run a fresh restart proof.

## 2026-08-13 - Guard restart proof R10 plugin-startup recovery deadlock

- **Objective:** recover a persisted retry by enumerating list identities and reading full root metadata through canonical `session.get`.
- **Approach:** start server two with the corrected full-row read and wait for same-child recovery to terminal state.
- **Evidence:** the outer runner timed out. Closure proved no proof-owned OpenCode/Bun process or listener remained and one isolated XDG fixture remained. Offline read showed root still `audit-retrying` with `restartRecoveryAction:null` and one child `retrying`, attempt `1/2`, with intact audit/revision correlation. Server two had entered plugin loading but never reached ready state. The exact isolated fixture was deleted.
- **Outcome:** no proof bundle; writer/process closure and cleanup are complete.
- **Reason:** `createSessionCompletionGuard.start()` synchronously awaited `reconcileRoots()`, which called server SDK `session.get` while the plugin/server instance was still bootstrapping, creating a startup dependency cycle. The runner's recovered simulator also only parsed initial audit envelopes, not bounded retry envelopes.
- **Do-Not-Repeat Condition:** do not await server SDK recovery calls before returning plugin hooks, rerun the same live-like startup path, or leave retry-envelope transport unverified.
- **Evidence-Based Retry Condition:** register hooks first and schedule exactly one asynchronous reconciliation turn, support the bounded retry envelope in the local simulator, verify syntax/focused contracts and runner internal terminal behavior offline, then run a fresh proof root.

## 2026-08-13 - Guard restart proof R11 evaluator counted non-guard children

- **Objective:** prove async post-hook startup reconciliation and retry-envelope recovery after offline unlock preflight.
- **Approach:** validate hooks return before unresolved startup list, validate retry-envelope correlation offline, then run the isolated two-server boundary.
- **Evidence:** the first server reached a real 5000ms arbiter timeout and persisted root retry state. `waitRetryChild` found a child whose completion-guard status was `retrying`, but the next assertion rejected the complete child list because it required `children.length === 1` and inspected `children[0]`; OpenCode may create non-guard children and list order is not an ownership contract. Cleanup completed.
- **Outcome:** production restart was not attempted; proof evaluator failed after the required retrying guard child existed.
- **Reason:** runner conflated every root child with a guard-owned correlated child.
- **Do-Not-Repeat Condition:** do not require no non-guard children, depend on child ordering, or relax production rootRef/audit correlation.
- **Evidence-Based Retry Condition:** carry the exact matched retrying child, count duplicate conflicts only among rootRef-correlated guard children, preserve non-guard children, then run a fresh proof root.

## 2026-08-13 - Guard restart proof R12 compact child metadata lacked ownership fields

- **Objective:** carry the exact retrying child rather than relying on child-list ordering or total count.
- **Approach:** match the list child by retrying status, then count guard duplicates using the list row's `rootSessionRef`.
- **Evidence:** one retrying child was found after a real 5000ms timeout, but the full-correlation assertion failed. Active `session.children` compact rows can expose current status while omitting ownership fields such as `rootSessionRef`, just as startup global list rows omit root metadata. Cleanup completed.
- **Outcome:** restart was not attempted and no bundle was published.
- **Reason:** evaluator still treated a compact list row as a full session record for ownership correlation.
- **Do-Not-Repeat Condition:** do not infer full child ownership metadata from `session.children` compact rows or match undefined root refs.
- **Evidence-Based Retry Condition:** fetch the exact matched child through canonical `session.get`, require non-empty audit/root correlation there, and use audit identity plus full readback for post-restart verification.

## 2026-08-13 - Guard restart proof R13 recovered child returned no exact verdict text

- **Objective:** use canonical full child metadata in both production and evaluator, then complete same-child retry after restart.
- **Approach:** expand compact child identities through `session.get`, preserve root/audit correlation, recover transport after server one exits, and resume attempt `2/2` on server two.
- **Evidence:** restart recovery ran: local simulator received a third arbiter request after restart and server two processed the same retained child on attempt two. The root then stopped terminally as `input-state` because `parseCompletionVerdictText` received no one exact JSON object, despite the simulator returning a correlated success payload. Cleanup completed.
- **Outcome:** persisted retry/restart boundary is reached, but terminal success remains unproved.
- **Reason:** unknown between OpenAI-compatible response shape, OpenCode stored child message/part transport, and controller prompt result projection.
- **Do-Not-Repeat Condition:** do not weaken exact verdict parsing, treat transport success as verdict success, or change recovery ownership from this terminal error alone.
- **Evidence-Based Retry Condition:** preserve privacy-safe failed child message structure (role/finish/error, part types/text lengths, parsed JSON top-level keys) and run one diagnostic proof root.

## 2026-08-13 - Guard restart proof R14 simulator omitted streaming transport

- **Objective:** determine whether recovered success was lost in simulator response shape, stored child transport, or controller projection.
- **Approach:** after terminal error, inspect only child message role/finish/error, part types, text lengths, and safe JSON keys.
- **Evidence:** recovered child stored the retry user text (548 characters), then an assistant with `finish: unknown` and only zero-text `step-start`/`step-finish` parts. No assistant error was recorded. The simulator had returned a non-stream `chat.completion` JSON body while the OpenCode AI SDK requested a streaming response.
- **Outcome:** same-child recovery reached the local provider, but fake transport did not emit assistant text; no production verdict was evaluated.
- **Reason:** proof simulator did not implement OpenAI-compatible SSE chunk transport for `stream:true` requests.
- **Do-Not-Repeat Condition:** do not weaken exact verdict parsing, infer verdict content from simulator intent, or reuse non-stream response bodies for streaming requests.
- **Evidence-Based Retry Condition:** return standard `chat.completion.chunk` SSE frames and `[DONE]` when `stream:true`, retain non-stream response for the offline probe, then run a fresh proof root.

## 2026-08-13 - Guard restart proof R15 in-process deadline bypassed cleanup/evidence

- **Objective:** complete same-child attempt two using standard SSE simulator transport.
- **Approach:** run the two-server workflow with an in-process 120-second deadline that kills the current server, removes the fixture, and calls `process.exit(124)`.
- **Evidence:** outer command returned exit zero with no stdout, no evidence root, and one isolated fixture. Its timestamp was exactly 120 seconds after creation, proving the internal deadline fired; config/cache were partially removed, XDG database remained with no session rows, and no proof-owned process/listener survived. The exact fixture was deleted.
- **Outcome:** no trustworthy raw bundle or terminal evaluator verdict; attempt liveness and cleanup are closed only after manual evidence-based reconciliation.
- **Reason:** `process.exit` terminated the runner from inside async workflow/finally, preventing reliable exit propagation, evidence publication, and deterministic cleanup.
- **Do-Not-Repeat Condition:** do not call `process.exit` inside the worker, rely on in-process deadlines to unwind async SDK/server work, or interpret empty exit-zero output as success.
- **Evidence-Based Retry Condition:** supervise the complete worker from a parent process, let the parent own timeout and exact child termination, keep worker cleanup/evidence in normal `finally`, validate worker exit propagation without OpenCode, and classify the next live-like run as bounded evidence capture until offline terminal evaluation is green.

## 2026-08-13 - Guard long-run proof R4 transient-exhaustion oracle setup

- **Objective:** close task 5.2 provider-free component scenarios after the successful R16 installed restart proof.
- **Approach:** add immutable no-retry, transient exhaustion, duplicate-child conflict, task fallback/disable, and wait-limit scenarios to the maintained long-run runner.
- **Evidence:** runner stopped at `Transient exhaustion must stop terminally`; no evidence root was published and disposable cleanup completed. The scenario called `retryAudit` with epoch attempt `0` and limit `1`, which correctly scheduled the one permitted attempt rather than treating it as exhausted.
- **Outcome:** production behavior was consistent with the finite-attempt contract; the offline oracle precondition was invalid.
- **Reason:** test setup represented pre-final-attempt state while asserting post-final-attempt behavior.
- **Do-Not-Repeat Condition:** do not weaken retry limits or classify attempt zero as exhausted.
- **Evidence-Based Retry Condition:** initialize the exhaustion scenario at persisted attempt `1/1`, retain timer-free terminal assertions, then run a new provider-free proof root.

## 2026-08-13 - Permission proof stale allow-all oracle

- **Objective:** prove permissive main defaults without replacing explicit specialist-agent restrictions.
- **Approach:** stop assigning the top-level `PERMISSION_ALLOW` object to every resolved agent and run the installed permission proof.
- **Evidence:** `npm run proof:permissions` stopped at `Resolved agent permission is not allow-all: code-quality-reviewer`; isolated loader inspection showed the reviewer's declared deny policy survived while main remained top-level allow.
- **Outcome:** the production correction reached its intended loader behavior, but the proof runner rejected it before immutable evidence publication.
- **Reason:** the runner encoded the retired contract that every specialist must become allow-all rather than comparing each effective compiled rule with that specialist's declared policy.
- **Do-Not-Repeat Condition:** do not restore specialist allow-all normalization, weaken declared denies, or edit focused automated tests from Main to make the stale oracle green.
- **Evidence-Based Retry Condition:** make the maintained proof runner derive each expected permission from resolved configured policy, separately require permissive top-level main and all-false hidden-arbiter tools, isolate the kit custom source, and capture a new create-only bundle.

## 2026-08-13 - Project readiness R4 stale long-run blocker oracle

- **Objective:** re-prove disposable project unattended readiness after finite long-run guard limits became loaded behavior.
- **Approach:** run the maintained bootstrap/doctor/runtime-source proof against a fresh unrelated non-JavaScript project.
- **Evidence:** fresh doctor returned ordinary `pass`, unattended `pass`, and all seven unattended checks `pass`; the runner then rejected the observation because its evaluator still required `blocked-by-long-run-guard`. Fixture cleanup completed and no evidence root was published.
- **Outcome:** current product behavior advanced to the required ready state; only the post-run evaluator was stale.
- **Reason:** task 3.2 originally captured the intentional pre-5.1 blocker and the runner oracle had not been updated after finite guard defaults were implemented.
- **Do-Not-Repeat Condition:** do not reintroduce a guard blocker, classify the current all-pass doctor result as failure, or infer readiness from ordinary qualification alone.
- **Evidence-Based Retry Condition:** require both ordinary and unattended `pass` for the fresh fixture while retaining the legacy-overlay blocked scenario, update the inventory limit, and recapture once under a new evidence root.

## 2026-08-13 - Permission preservation and current guard proof

- **Objective:** close task 5.3 on the actual installed loader and restore every dependent guard/readiness evidence lane after permission normalization changed.
- **Approach:** preserve specialist agent maps while replacing only top-level permission, compare configured and effective policies for every resolved agent, require the hidden arbiter's all-false tool map, then rerun disposable readiness, offline long-run, and installed restart proofs.
- **Evidence:** `evidence/guard-permissions-r2/**` records OpenCode 1.18.18, 25 resolved agents, 195 matching explicit deny decisions, permissive main, and 18 all-false hidden-arbiter tools. `project-readiness-r4/**` records ordinary and unattended `pass` with seven fresh checks green and the legacy overlay still blocked/preserved. `guard-long-run-r6/**` records bounded projection/failure/retention/fallback/wait behavior and cleanup complete. `guard-restart-r17/**` records attempt `1 -> 2`, same child/audit, one non-guard child preserved, terminal passed, and cleanup complete.
- **Outcome:** task 5.3 is complete on the current candidate; tasks 2-5 are green and configured-provider task 6.1 is the next dependency boundary.
- **Reason:** top-level autonomous main and explicit specialist least-privilege are separate config responsibilities; deriving proof expectations from each resolved declared policy detects both accidental escalation and accidental over-restriction.
- **Do-Not-Repeat Condition:** do not clone top-level permission into agents, print resolved config or prompts, rely on host-default overlays, or treat prior guard bundles as current after a shared runtime-source mutation.
- **Evidence-Based Retry Condition:** rerun only the affected permission/guard/readiness lane after permission hook, specialist definitions, arbiter route/tools, loaded config environment, or proof-runner behavior changes.

## 2026-08-13 - Persisted mission retry-limit gap

- **Objective:** prepare the configured-provider restart proof while preserving finite per-slice recovery across controller processes.
- **Approach:** inspect the persisted transition/projection schema and controller resume path before constructing the live-like runner.
- **Evidence:** `MissionStateProjection` persisted no attempt count or slice start time, while `executeOwned` initialized `attempts = 0` and `startedAt = Date.now()` on every invocation. A paused slice could therefore receive another full attempt/time budget after every `resume`, contrary to tasks 4.1-4.2 and the mission retry requirement.
- **Outcome:** tasks 4.1-4.3 were reopened; the state/controller and dependent checkpoint lanes require correction and current proof before task 6.1.
- **Reason:** prior provider-free proof bounded attempts only inside one controller process and did not exercise an exhausted slice across `resume`.
- **Do-Not-Repeat Condition:** do not treat process-local counters as persisted mission recovery limits or claim restart safety from a same-process retry.
- **Evidence-Based Retry Condition:** persist attempt count and slice start time in every correlated transition/projection, enforce monotonic/reset rules, prove exhausted resume launches no writer, then rerun state/controller/checkpoint lanes before configured-provider capture.

## 2026-08-13 - Persisted mission retry-limit correction

- **Objective:** restore tasks 4.1-4.3 with finite per-slice recovery across process restart.
- **Approach:** add hash-correlated `recovery.attempts` and `recovery.sliceStartedAt` to every transition/projection, enforce monotonic same-slice values and reset on successor activation, and initialize controller budgets from persisted state.
- **Evidence:** `evidence/roadmap-state-r5/**` completed the current state/restart chain with cleanup complete. `evidence/roadmap-controller-r13/**` completed two archives, protected stop, local/external checkpoints, and recorded attempts `2`, executor calls `2`, and transition count `6 -> 6` after exhausted `resume`. `evidence/canonical-workflow-r6/**`, focused operation-gate tests 11/11, syntax checks, and `git diff --check` passed.
- **Outcome:** tasks 4.1-4.3 are current and configured-provider task 6.1 is unblocked.
- **Reason:** recovery limits are now durable mission facts rather than process-local counters.
- **Do-Not-Repeat Condition:** do not remove recovery facts from persisted state, reset them on same-slice resume, or permit exhausted resume to append a transition or launch an executor.
- **Evidence-Based Retry Condition:** rerun the affected state/controller/canonical lanes after mission transition schema, controller retry timing, checkpoint resume, preflight identity, or proof-runner mutation.

## 2026-08-14 - Configured-provider capture R1 absolute archive path

- **Objective:** prove the installed configured-provider mission through two changes, restart checkpoints, and protected stop.
- **Approach:** run one bounded capture after provider-free preflight, with one synthetic local failure followed by canonical `opsx-apply` for slice A.
- **Evidence:** `evidence/roadmap-provider-r1/**` preserves one successful configured-provider apply, exact synthetic tool/output evidence, one local pre-provider failure, session deletion exit zero, fixture cleanup complete, and terminal controller exit 2: `evidenceRefs[1] must be a contained project-relative path`. The real OpenSpec archive returned an absolute path; the fake provider-free archive had returned a relative path. Offline evaluator replay reaches terminal `blocked` with one provider call and no downstream controller/checkpoint facts.
- **Outcome:** task 6.1 remains incomplete. No second live attempt is allowed until the archive path contract and preserved-bundle evaluator chain are resolved offline.
- **Reason:** the controller passed the archive helper's absolute `path` directly into project-relative persisted evidence rather than normalizing and containing it at the process boundary.
- **Do-Not-Repeat Condition:** do not rerun the provider capture with an unnormalized archive path, overwrite R1, or interpret successful model output as complete controller proof.
- **Evidence-Based Retry Condition:** normalize only a contained `openspec/changes/archive/**` path, prove an absolute-path archive through the complete provider-free controller/evaluator chain, rerun canonical preflight/current validation, and classify the next live run as bounded capture for the exact missing downstream observations.

## 2026-08-14 - Configured-provider R1 offline unlock

- **Objective:** close the R1 evidence-only failure chain without another provider effect.
- **Approach:** normalize absolute/relative archive output to one contained project-relative path, change the fake archive to return an absolute path, replay the full provider-free controller, and rerun the preserved R1 evaluator.
- **Evidence:** `evidence/roadmap-controller-r14/**` completes two archives, retry, local/external checkpoints, replay, protected stop, and cleanup using absolute archive output. `evidence/canonical-workflow-r7/**` completes current source/loader preflight. Preserved `roadmap-provider-r1` evaluator deterministically remains terminal `blocked` because R1 contains no slice B, restart checkpoint, or protected-stop observations; those observations could only occur after the corrected archive boundary.
- **Outcome:** the causal product defect is corrected and the local complete path is green. The exact missing raw observations are identified; one new bounded evidence capture may acquire them, but is not pre-classified as proof.
- **Reason:** R1 stopped immediately after slice A archive, so offline replay can validate the terminal evaluator and product correction but cannot manufacture provider/session/checkpoint facts that were never observed.
- **Do-Not-Repeat Condition:** do not call R1 complete, waive its blocked evaluator, or repeat live capture without a current provider-free preflight and the corrected controller hash.
- **Evidence-Based Retry Condition:** current provider-free preflight, repository validation, strict selected-change validation, and diff check pass on the corrected candidate; then capture once into a new immutable root and evaluate all downstream observations offline.

## 2026-08-14 - Configured-provider capture R2 checkpoint identity reuse

- **Objective:** acquire the exact downstream slice B, restart checkpoint, and protected-stop observations missing from R1.
- **Approach:** rerun the bounded configured-provider mission after absolute archive-path normalization and a current green preflight.
- **Evidence:** `evidence/roadmap-provider-r2/**` preserves three successful configured-provider commands across two cleaned sessions, one local pre-provider failure, completed A and B authoring/validation/archive, and cleanup complete. The second controller process then exited 1 because the supplied A external checkpoint identity was reused immediately after archive B and therefore did not contain B paths. Preserved evaluator replay is terminal `blocked`; no third provider call occurred or was needed.
- **Outcome:** task 6.1 remains incomplete and another live attempt is blocked until checkpoint identity consumption and the complete real-CLI path are proven without a provider.
- **Reason:** `options.checkpointIdentity` was treated as a reusable run-level value instead of a one-shot identity for the already-awaited checkpoint.
- **Do-Not-Repeat Condition:** do not reuse one external checkpoint for a later slice, overwrite R2, or rerun the same provider-capture strategy without a different complete local mechanism.
- **Evidence-Based Retry Condition:** consume the supplied identity only while reconciling the current awaiting checkpoint, prove A checkpoint -> B archive/pause -> B checkpoint -> protected C with the real OpenSpec CLI and no model, replay R2 evaluator terminally, then run a current preflight before any bounded live capture.

## 2026-08-14 - Real-CLI simulation unlock after R2

- **Objective:** replace repeated configured-provider diagnosis with a complete provider-free real-CLI mechanism before another live effect.
- **Approach:** add `roadmap-mission-provider --mode simulate`, which uses the production controller, canonical loader, real OpenSpec CLI/archive, persisted state, three controller processes, two external checkpoints, and deterministic local executor.
- **Evidence:** `evidence/roadmap-controller-r15/**` proves one-shot external checkpoint consumption with fake/no-model OpenSpec. `evidence/canonical-workflow-r8/**` proves current source/loader identity. `evidence/roadmap-provider-simulate-r1/**` completes the exact real OpenSpec path with two archives, three controller processes, one local failure, two checkpoints, protected stop before executor, terminal evaluator, session cleanup not applicable, and fixture cleanup complete. Preserved R2 evaluator remains terminal `blocked` only for missing final checkpoint/protected observations.
- **Outcome:** the two observed controller causes are retired through a materially different complete local mechanism. One current configured-provider capture may now test only the provider substitution on the already-green real-CLI path.
- **Reason:** simulation exercises archive path shape and checkpoint lifecycle without depending on provider output, so another live run is no longer being used to diagnose those mechanisms.
- **Do-Not-Repeat Condition:** do not remove the simulation rung, skip its evaluator, or retry a future live failure before replaying its preserved bundle and the complete simulation path.
- **Evidence-Based Retry Condition:** current provider-free preflight, repository/strict OpenSpec validation, and diff check pass with the simulation and controller hashes; the next capture uses a new immutable root and remains bounded by the same effect-denied policy.

## 2026-08-14 - Configured-provider mission proof R3

- **Objective:** complete task 6.1 on the corrected candidate through the installed configured-provider boundary.
- **Approach:** run the current provider-free preflight, then one bounded configured capture using canonical `opsx-apply`, `opsx-propose`, real OpenSpec/archive, persisted recovery, two external checkpoints, and three controller processes.
- **Evidence:** `evidence/roadmap-provider-r3/raw.json` records three successful configured-provider commands in two sessions, one synthetic local failure before inference, exact `alpha`/`beta` effects, archive identities for A and B, checkpoint identities, 17 valid hash-correlated transitions, recovery attempt `1 -> 2`, checkpoint/restart transitions, terminal cursor 2 with no change C, and current source hashes. Both sessions deleted with exit zero; fixture cleanup is complete. Separate offline `evaluate` replay records status complete.
- **Outcome:** task 6.1 is complete and the candidate reaches the integrated MVP boundary. Fresh test-only SDET and I1 test migration are next.
- **Reason:** archive paths are normalized at the owner boundary, external checkpoint identities are one-shot, and the complete real-CLI lifecycle was proven before configured-provider substitution.
- **Do-Not-Repeat Condition:** do not rerun configured provider proof unless a dependent Product Candidate, runner, environment, loader route, archive/checkpoint, or evaluator mutation invalidates R3.
- **Evidence-Based Retry Condition:** identify the exact invalidated lane, replay evaluator-only changes offline, and require current simulation/preflight before another configured-provider attempt.

## 2026-08-14 - Concurrent portable-process candidate invalidation

- **Objective:** qualify the post-I1 candidate without overwriting a concurrent active change that also consumes the shared Windows process owner.
- **Approach:** compare the configured-provider R3 source manifest with the current worktree, inspect the concurrent change history and focused library diagnostics, and route the conflicting native-argv contract to the owner before mutation.
- **Evidence:** `roadmap-provider-r3/raw.json` records `global/bin/portable-process.ts` SHA-256 `e9cfd70aff8548010dcd43ac637d12f5e3239a92ac9dd47bdd2ac84834ad776e`; the current file is `6b4bd770a56c6e3dbaba5586358e9683eec1c08451f7444c0351abbf62f7769b`. `improve-agent-tooling-ergonomics/history.md` records that native multiline/metacharacter argv through `shell: false` was required and provider-free proven before its configured baseline capture. Focused library reached one remaining failure because the older roadmap oracle required native `node.exe` to reject `evil&echo` before execution, although no second shell command ran. The owner selected direct-native literal argv as canonical while preserving fail-closed shell fallback. The first SDET report inspected `roadmap-provider-r3` despite the hash mismatch and is therefore precondition-invalid rather than the terminal task 6.2 challenge. Its test-only I1 correction reduced 27 stale doctor failures to zero; one authorized portable-process oracle remains red.
- **Outcome:** tasks 4.2, 4.3, 6.1, and I3 are reopened; `Development-Stage` returns to `development`. The direct-native versus shell-fallback distinction is resolved, but the current controller/simulation/provider lanes and a fresh exact-candidate SDET must be re-proven before qualification.
- **Reason:** the shared process helper is part of the R3 Product Candidate identity and controller invocation path. Its mutation invalidates dependent proof even though the newly allowed values do not invoke a shell. A stale test cannot force restoration of behavior that would overwrite another active change and break its already-proven native multiline use case.
- **Do-Not-Repeat Condition:** do not restore unconditional native metacharacter rejection, overwrite the concurrent helper, call R3 current, treat the precondition-invalid SDET as task 6.2 terminal evidence, or start another provider capture before current provider-free controller/simulation/preflight completes.
- **Evidence-Based Retry Condition:** update only the old test contract through a fresh eligible test-only SDET after the current Product Candidate regains integrated proof; before that, prove current direct-native literal argv plus fail-closed shell fallback and complete the affected provider-free controller/simulation/preflight lanes. A new configured-provider capture may then use a create-new evidence root and bounded existing authorization.

## 2026-08-14 - Current native-argv provider-free unlock and instruction blocker

- **Objective:** prove the owner-selected direct-native semantics through every provider-free roadmap boundary and establish whether another configured-provider capture is unlocked.
- **Approach:** run the complete fake/no-model controller, real-OpenSpec configured-provider preflight, and real-OpenSpec deterministic simulation against the current shared process helper before repository validation or another provider call.
- **Evidence:** `evidence/roadmap-controller-r16/**` records helper SHA-256 `6b4bd770a56c6e3dbaba5586358e9683eec1c08451f7444c0351abbf62f7769b`, two archives, A=2/B=1/C=0 executor calls, exhausted resume with no executor, local-commit scoped hook/no-push, external checkpoint pause/verify without repeat, protected stop, and cleanup complete. `evidence/roadmap-provider-preflight-r4/**` is terminal complete with `modelCalls: 0`. `evidence/roadmap-provider-simulate-r2/**` records the same helper hash, two archives, three controller processes, one recoverable local failure, two simulation calls, restart/checkpoints, protected stop, zero configured-provider calls, and cleanup complete. Strict selected-change validation and `git diff --check` exited zero. Repository `npm run validate` exited one because the concurrent `improve-agent-tooling-ergonomics` Product Candidate removed the required `global/AGENTS.md` marker `New instructions are a last resort`; that change marks its instruction task complete and owns the overlapping file.
- **Outcome:** tasks 4.2 and 4.3 are current again. The live-attempt gate remains blocked before another provider capture because mandatory repository validation is red on an overlapping concurrent loaded-instruction mutation. I3 also remains open until a fresh exact-candidate SDET updates the old native rejection oracle after integrated proof.
- **Reason:** provider-free runtime behavior is green, but the recorded high-cost unlock explicitly requires current repository validation. Editing or bypassing another active Material instruction candidate would violate write ownership and could invalidate its token/proof evidence.
- **Do-Not-Repeat Condition:** do not run configured capture while repository validation is red, restore the removed marker without coordinating the concurrent change, weaken the validator, or rerun the already-green controller/preflight/simulation roots.
- **Evidence-Based Retry Condition:** the concurrent instruction owner restores a validator-conforming equivalent within its accepted token and behavior envelope, or the owner explicitly authorizes this session to integrate that overlapping correction; then rerun repository validation, strict selected-change validation, and diff check before the create-new configured-provider capture.

## 2026-08-14 - Current configured-provider mission proof R4

- **Objective:** restore integrated Runtime Proof after the shared process and
  loaded-instruction conflicts were resolved by their owners.
- **Approach:** retain owner-selected direct-native literal argv with fail-closed
  shell fallback, restore the required loaded instruction marker, run current
  repository/strict/diff gates, then run create-new provider-free preflight,
  real-OpenSpec deterministic simulation, and one configured-provider capture.
- **Evidence:** `roadmap-provider-preflight-r5` completed with zero model calls;
  `roadmap-provider-simulate-r3` completed two archives, three controller processes,
  one recoverable failure, two checkpoints, protected stop, and cleanup.
  `roadmap-provider-r4/raw.json` records three successful configured-provider
  commands in two deleted sessions, A/B archives and distinct checkpoints, 17 valid
  transitions, recovery `1 -> 2`, protected C absent, writer clear, and complete
  cleanup. Its evaluator is terminal `complete`.
- **Outcome:** Task `6.1` is complete on `roadmap-current-6b4-marker`; integrated
  `MVP` is restored. Fresh exact-candidate SDET owns I1/I3 test corrections next.
- **Reason:** Current provider-free and configured boundaries now share one exact
  Product Candidate and the prior instruction validation blocker is gone.
- **Do-Not-Repeat Condition:** Do not rerun configured provider proof absent an
  invalidating Product Candidate/runner/environment mutation, or reuse the
  precondition-invalid earlier SDET report.
- **Evidence-Based Retry Condition:** Identify an exact invalidated lane and replay
  evaluator/provider-free facts first; another configured capture requires a
  confirmed critical production correction and fresh-candidate gate.

## 2026-08-14 - Fresh SDET attempt 1 blocked by test-owner scope

- **Objective:** Complete I1/I3 test-only migrations and independently challenge
  the exact integrated candidate.
- **Approach:** Fresh `sdet-quality-engineer` session
  `ses_001257a26ffej5pGEkvKCVPKlZ` received four exact test-only write paths and the
  frozen Candidate Reference.
- **Evidence:** The SDET updated only `tools/test-install-opencode-global.ts` to
  provision all seven portable owners and added direct-native/shell-fallback
  oracles; its focused installer, guard, contracts, validation, and diff checks
  passed. It independently found no critical production incident. `test-library`
  remained red because the old rejection oracle is actually owned by
  `tools/test-library/portable-workflow-tools.ts:302-330`, outside the supplied
  scope.
- **Outcome:** Terminal action `blocked`, not the no-critical-risk terminal attempt.
  The valid test-only installer diff is retained; I1/I3 remain open.
- **Reason:** Main's SDET brief named the aggregator helper but omitted the concrete
  split test owner discovered during execution.
- **Do-Not-Repeat Condition:** Do not edit the split test as main, rerun the same
  four-path brief, discard the green installer correction, or classify the stale
  oracle as a production defect.
- **Evidence-Based Retry Condition:** Add only
  `tools/test-library/portable-workflow-tools.ts` to the exact test-only scope and
  dispatch a new fresh SDET against the unchanged Candidate Reference.

## 2026-08-14 - Terminal fresh SDET and complete validation

- **Objective:** Close I1/I3 with exact current-owner tests, challenge reachable
  critical incidents, and qualify the integrated candidate locally.
- **Approach:** A new fresh test-only SDET received the corrected five-file scope,
  retained the installer fixture correction, replaced the stale split native-argv
  oracle, and ran focused/full tests. Main inspected the two-file diff, hashes,
  current proofs, and reran complete validation.
- **Evidence:** SDET session `ses_0011ab859ffem3YUYhY7WE136V` returned terminal
  `no-critical-risk`, Effective Model `xai/grok-4.6`, critical matrix `none`.
  `tools/test-install-opencode-global.ts` hash
  `49d969b5f82d876ec621355b255db7b633def14f5648488f5437fd1002d821d2`;
  `tools/test-library/portable-workflow-tools.ts` hash
  `5d2f8f24d7d29e980d083724088496dac870f89985adfa423cdafd20d5be11b2`.
  Main reran full `npm test` green; focused library 148, contracts 67, guard 28,
  init 3, installer 27, and operation-gate 11 all passed. Strict repository and
  selected/all OpenSpec validation, apply gate, diff check, code-quality inventory,
  and `guard-permissions-r3` are current and green.
- **Outcome:** Tasks `6.2`, `6.3`, I1, and I3 are complete. The first
  precondition-valid no-confirmed-critical SDET result permanently terminates SDET
  for this root. Candidate is eligible for local RC freeze and handoff.
- **Reason:** Current tests now distinguish direct native literal argv from shell-
  fallback rejection and copied installer fixtures contain every required portable
  owner without weakening production.
- **Do-Not-Repeat Condition:** Do not launch another SDET attempt, restore stale
  project-local workflow/native-rejection oracles, or rerun configured provider
  proof without candidate invalidation.
- **Evidence-Based Retry Condition:** None under terminal SDET; only a later Product
  Candidate mutation or reproduced critical/non-deferrable defect reopens affected
  proof/validation lanes, not another SDET attempt for this root.

## 2026-08-14 - Final complete-history retrospective

Original User Goal: provide one deterministic, restart-safe, bounded owner for an
explicit multi-change OpenSpec roadmap mission, with canonical workflow identity,
guard recovery, checkpoint/archive safety, installed disposable proof, and no
protected or remote effect.

| | Working Repository | opencode-kit |
| --- | --- | --- |
| Quality | A copied installer fixture omitted four newly required portable owners and blocked full validation -> defer one canonical portable-path inventory for production/validator/test consumers -> prevents stale fixture drift -> shared-test-oracle coupling must remain independently checked. | Guard/controller/provider defects were reproduced and corrected through current state, simulation, restart, permission, and configured-provider proofs -> no additional current-consumer improvement -> avoids speculative post-qualification mutation -> none. |
| Cycle Speed | The stale installer fixture appeared only at late full validation -> same deferred inventory would move the mismatch to one source/readback gate -> earlier deterministic signal -> small shared-contract maintenance cost. | R1/R2 live captures stopped on archive/checkpoint mechanisms before the real-CLI simulation existed -> `simulate` plus preserved-bundle evaluation is now implemented and proven -> future live attempts diagnose provider substitution rather than local mechanics -> no remaining improvement. |
| Token Economy | No measured token/context waste directly changed the mission outcome -> none. | Bounded guard projection and exact final-request limits are already implemented/proven; no further token candidate is supported -> none. |

- **Retrospective Result:** No improvement has an exact remaining current-change
  consumer, so no task is admitted and no generated checkbox is created.
- **Retrospective Execution:** Completed once. Do not rerun after this record.
- **Generated Tasks:** none.
- **Deferred Records:** `DIC-ROADMAP-PORTABLE-INVENTORY-001`.

### Deferred Improvement Candidate DIC-ROADMAP-PORTABLE-INVENTORY-001

- **Impact Horizon:** Working Repository
- **Concrete Consumers:** `tools/install-opencode-global.ts::validateGlobalDir`,
  `tools/validators/devkit-contract.ts`,
  `tools/test-install-opencode-global.ts::writeFixturePortableTools`, and
  `tools/test-helpers/library.ts` portable global fixtures.
- **Execution Class:** separate-change
- **Earliest Safe Point:** A dedicated tools-contract change after current active
  changes are archived or otherwise no longer mutating the same inventories.
- **Invalidated Evidence:** Installer, library, validator, project-readiness, and
  canonical-workflow validation lanes that inspect required portable source paths.
- **Observable Payback:** Adding/removing one required portable owner updates one
  reviewed inventory; deterministic drift checks prove every production/fixture
  consumer agrees before full validation.
- **Trigger/Evidence:** Production required seven `global/bin/**` paths while the
  copied installer fixture still provisioned three, causing eight installer test
  failures and blocking `npm test` until fresh SDET I1 corrected the fixture.
- **Why:** The duplicated list can reject valid current production or let a fixture
  omit a required installed owner.
- **Prerequisites:** Name one canonical project-neutral owner and retain at least
  one independent negative oracle so shared data cannot make a self-fulfilling
  production/test assertion.
- **Scope/Non-Goals:** Centralize only portable path identity/materialization; do not
  alter installer effects, workflow behavior, project overlays, or required files.
- **Implementation:** Export or materialize a stable sorted portable-path contract
  consumed by installer/validator fixture builders, while independent tests delete
  each required path and assert the exact missing diagnostic.
- **Observable Proof:** One-path mutation produces deterministic drift or missing-
  path failure; all consumers enumerate the same stable paths and nested modules.
- **Validation:** Focused installer/library/contracts tests, project-readiness and
  canonical-workflow preflight, strict validation, and `git diff --check`.
- **Why Not Admitted:** Current fixtures are corrected and green; no remaining task
  consumes another inventory mutation, so implementation would be post-outcome
  abstraction and would invalidate qualified evidence.
- **Re-Evaluation Condition:** A future portable owner is added/removed, another
  consumer drifts, or a dedicated tools-contract change explicitly owns the shared
  inventory and independent negative oracle.

## 2026-08-14 - Complete archive merge rejected an incomplete modified delta

- **Objective:** Deterministically validate, synchronize, and archive the completed
  change through the canonical portable helper.
- **Approach:** Invoked `global/bin/openspec-archive.ts` with the explicit project
  root, change id, and repository-native `node tools/pre-push-validate.ts` aggregate
  validation argv.
- **Evidence:** Completion gate reported 4/4 artifacts and 20/20 checked tasks;
  strict selected validation, repository validation, all tests, and all OpenSpec
  validation passed. Official `openspec archive --yes --json` then returned
  `archive_spec_update_failed` before mutation because the
  `library-config-portability` modified requirement omitted four existing scenario
  headers. The command reported `No files were changed` and exited 1.
- **Outcome:** Archive did not occur; active source, specs, and change location were
  preserved.
- **Reason:** The delta expressed the accepted replacement behavior with renamed or
  combined scenarios instead of the complete current requirement shape required by
  deterministic OpenSpec merge.
- **Do-Not-Repeat Condition:** Do not retry the unchanged partial modified block or
  bypass the official merge with manual main-spec edits, `--skip-specs`, or a manual
  directory move.
- **Evidence-Based Retry Condition:** Complete each modified delta with the current
  requirement identity and every retained scenario while preserving the already
  qualified semantics, pass strict selected validation, then rerun the same portable
  archive helper once.
