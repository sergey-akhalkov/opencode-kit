# Final Validation R1

- **Candidate:** `completion-arbiter-budget-v1-corrected-r1` (indexed product candidate `completion-arbiter-budget-v1`)
- **Environment:** Windows, OpenCode `1.18.25`, Bun `1.4.0`, Node `v24.18.1`
- **Outcome:** working locally; no ordinary-user activation, install, commit, push, release, deployment, remote mutation, credential use, or external provider call.

## Command Matrix

| Command | Exit | Observed result |
| --- | ---: | --- |
| `npm run test:focused:session-completion-guard` | 0 | `OK: session completion guard tests=46` |
| `npm run test:focused:session-plugin` | 0 | `OK: session env plugin tests=18` |
| `npm run proof:guard-long-run` | 0 | maintained provider-free suite `status=complete` |
| `npm run proof:permissions` | 0 | OpenCode `1.18.25`; arbiter `toolsAllFalse=true`, 13 disabled tools |
| `openspec validate fit-completion-arbiter-evidence-budget --strict` | 0 | selected change valid |
| `openspec validate --all --strict` | 0 | 28 passed, 0 failed |
| `npm run instruction:inventory -- --format json` | 0 | context-quality `status=passed`, no changed canonicalization files |
| `npm run opencode:sources` | 0 | custom helper/source resolution complete; unattended collision status clear; known config-source collision reported without precedence claim |
| `npm run proof:project-unattended -- --help` | 0 | effect-free help readback |
| `npm run proof:project-unattended -- --candidate-id completion-arbiter-budget-v1 --evidence-root <new-temp-root>` | 0 | corrected r3 `status=complete`, `unattendedReadiness=pass`, `runtimeSurfaceInstall=all-profile-pass`, `cleanup=complete` |
| `npm test` | 0 | complete configured repository test command passed twice on the corrected source |
| `npm run validate:strict` | 0 | `skills=33 agents=21 markdown=943 warnings=0 infos=2` |
| `npm run code-quality:inventory -- --format markdown` | 0 | inventory completed; touched long-run/test/controller owners are split candidates by navigation size |
| `git diff --check` | 0 | no whitespace error; Windows line-ending notices only |
| blocking apply operation gate | 0 | passed; claim `narrowed`, observed 16/16 |
| evidence index materialization twice | 0 | 46 files, 12 lanes; identical digest `4fac911ef14a0c2ba7d434fbc264ad75ca8ebdad6ece7be0ae70c9d26d3c631f` before final task-row additions |

The first unattended-readiness run exposed a clean disposable-fixture contract drift: `helper-proof` lacked the now-required bounded-falsification declaration. The first correction put the colon inside the bold marker and remained unrecognized. The exact parser-compatible `- **Bounded Falsification Review**: exempt - ...` correction then passed r3. Both failed roots self-removed; no live writer/process/session remained.

## Diff And Quality Review

Scoped diff inspection found the intended private canonical evidence projection, schema-2 compact request, fail-closed contribution diagnostics, agent read contract, focused tests, maintained long-run modes/evaluators, and the one-line readiness fixture correction. The public `session_delivery_context` projection source is unchanged. The working tree contains unrelated archived-campaign and later active-change work that was not modified for this candidate.

Fresh code-quality reviewer session `ses_fb6563b07ffe492W3k31TI57PU` (`xai/grok-4.6`) returned no qualifying safe reduction. Split-or-justify disposition is `justify keep`: the large long-run runner and focused-test file are the existing cohesive proof owners, and the controller delta stays local to its existing audit path. Extracting a second runner/harness or splitting unrelated controller/test responsibilities would add concepts or expand scope. Unique lossless/conflict, irreducible overflow, reviewed fixture, incidents, matched pair, installed reviewed, cleanup, and replay oracles remain retained.

## Claim And Limitations

Fresh evidence-sufficiency challenge r2 returned `no-material-finding` for the corrected exact ceiling. The claim remains honestly `narrowed`: incident members prove byte/disposition fit only; the matched pair proves observed local-provider transport, fixed matrices, side-effect class, and cleanup only; no real-model, universal semantic-equivalence, other-version/provider, or Cartesian-maximum claim is made. The older installed 32-message lane is supplemental and unreferenced by the current claim.

## Rollback, Restart, Cleanup

Rollback is source-local: revert the private canonical builder, matching agent read paragraph, controller contribution field, proof/test additions, and the disposable readiness marker together. No persisted product-data migration exists. No ordinary configuration was installed or activated, so no operator restart occurred; a future separately authorized activation would require a fresh OpenCode process to load changed source. Installed proof roots/children/processes/config/databases report complete cleanup; retained repository evidence is redacted, bounded, and indexed.
