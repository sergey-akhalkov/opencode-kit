# Final Validation Evidence

## Candidate Validation

- `npm test`: exit `0`; the complete project-native Node test command completed under the dot reporter.
- `npm run test:focused:contracts`: exit `0`, `OK: contracts tests=65` after the two SDET critical oracles.
- `npm run validate:strict`: exit `0`, `OK: skills=26 agents=18 markdown=289 warnings=0 infos=2` before final handoff files.
- `openspec validate --all --strict`: exit `0`, 12 passed and 0 failed, including this change and all current library specs/active changes.
- `npm run openspec:gate -- --operation apply --change persist-session-improvements-in-tasks`: exit `0`, operation passed; at that point only final handoff task 3.2 remained unchecked.
- `git diff --check`: exit `0`.

The first attempt to launch `npm test` through a PTY adapter failed before a session was created and produced no candidate effects. The same exact project-native command then ran synchronously and exited `0`; no retry of a failing product/test mechanism occurred.

## Instruction Inventory

- Baseline `global/AGENTS.md`: token proxy 15,494.
- Candidate `global/AGENTS.md`: token proxy 15,649 (`+155`).
- Baseline complete inventory: token proxy 90,908.
- Candidate complete inventory: token proxy 91,119 (`+211`).
- The increase implements the user-required durable field contract and all-candidate completion semantics; no helper, backlog service, or duplicate full workflow was added.

## Runtime Proof Summary

- Fresh build-agent lane: baseline allowed Candidate B to remain summary-only; candidate required A and B as structured mandatory tasks before archive, exit `0`.
- Hidden compaction lane after CR-PSI-01 correction: emitted complete A and B `Pending Improvement Tasks`, one safety-ordering action, and mandatory persistence/completion, exit `0`.
- `/opsx-archive` command lane after CR-PSI-02 correction: refused helper invocation over synthetic pending A and B and required return to apply, exit `0`.
- All runtime lanes denied mutation tools and performed no repository/remote/destructive effects. Configured model inference was the only external interaction.

## Final Gate To Run After Checkoff

After task 3.2 is checked, rerun strict library/OpenSpec validation, complete archive-readiness operation gate, and diff/status inspection. Do not invoke archive.

## Post-Checkoff Results

- An initial read-only gate attempt used unsupported operation name `complete-archive` and returned `unknown`, exit `1`, before inspecting or mutating the change. A subsequent unsupported `--help` probe also produced no effects. Source inspection identified the registered operation as `archive`; do not repeat the guessed name.
- The first correct `--operation archive` run returned exit `1` and accurately reported one unchecked task (3.2), demonstrating fail-closed checklist behavior.
- After all 3.2 validation and handoff work had actually completed, task 3.2 was checked and the identical archive gate returned exit `0`, status `passed`, with `0/7 unchecked task(s)`.
- Post-checkoff `openspec validate persist-session-improvements-in-tasks --strict`: exit `0`.
- Post-checkoff `git diff --check`: exit `0`.
- The deterministic archive helper itself was not invoked; no spec merge or change movement occurred.
