# Stable Handoff

## Status

- **Profile:** Material
- **Development-Stage:** stable
- **Stable Candidate:** RC1
- **Date:** 2026-08-15

## Outcome

The primary selects and executes the smallest dependency-valid pending task slice without asking the owner to choose ordinary task ranges, batches, or optional review. Explicit user limits remain authoritative. Owner interaction is reserved for accepted-outcome, operating-envelope, protected-semantics, or exact protected-action boundaries. The completion guard stops only when every advancing option crosses such a boundary.

## Operating Envelope And Non-Goals

- Local OpenCode instruction, apply-workflow, hidden-arbiter, guard-route, proof-runner, and regression-test behavior only.
- No scheduler, fixed batch-size policy, compatibility layer, instruction-budget increase, target-project mutation, protected action, external deployment, installation, activation, release, commit, push, or archive.

## Candidate Reference

- Product Candidate: `fd38d010a742c3c3f9dbcc2669fd9b5cacecd083`
- Supplemental current product-diff digest: `3df3b615f5c88572f252c0d3141395a54f88b82a`
- Proof Runner: `6ff12554e99c78d75fe03cbcfe1e967ccd2a166a`
- Contract tests: `d22d24ec7a199fc757556a8fb27cc6df1cad9ef4`
- Guard tests: `bedf50665f44a3c886b3828f7063ea3a276f94d7`
- Environment: Windows, repository `D:\sa-gh\opencode-kit`, OpenCode `1.18.18`, `OPENCODE_CONFIG_DIR=D:\sa-gh\opencode-kit\global`

## Runtime Proof

1. Paired loaded-primary proof, session `ses_ffe1fa6f2ffe09dQlY5XMrsTla`: an ordinary task-range choice produced `continue_next` for tasks 2.1-2.2; credentials/physical contact produced `owner_required`.
2. Installed mixed-protected proof, root `ses_ffdf3f30affemMzRx9b9DH5J3m`, hidden child `ses_ffdf39d95ffeKc4Isk3EZyQl5y`, server `64d8c7e6`: the real question path reached the configured `session-completion-arbiter` using `xai/grok-4.6` with `high` profile and terminated as `guardState: owner-required`. No answer was selected or projected. Cleanup completed.
3. The first installed attempt exposed `Configured hidden completion arbiter route is unavailable`. The final candidate added finite provider-free route settling, in-flight lookup cancellation/deadline handling, cause preservation, and a zero-child invariant before route readiness. The corrected installed proof passed without protected effects.

## Critical SDET

- Fresh task: `ses_ffdf0baf1ffeV0uWofuh4SewNb`
- Effective Model: `xai/grok-4.6`
- Terminal action: `no-critical-risk`
- Guard regression suite: `35/35`
- Contract suite: `68/68`
- SDET is permanently stopped for this root by the first precondition-valid no-confirmed-critical result.

## Validation

| Check | Observation |
| --- | --- |
| `npm run test:contracts-change-ready-delivery` | `68/68` passed |
| `npm run test:session-completion-guard` | `35/35` passed |
| `openspec validate keep-openspec-task-sequencing-autonomous --strict` | valid |
| `npm run validate:strict` | `skills=29`, `agents=18`, `markdown=419`, `warnings=0`, `infos=2` |
| `npm test` | exited `0` |
| `npm run prepush:validate` | exited `0` |
| `npm run proof:permissions` | `outcome: pass` |
| `npm run instruction:budget` | catalog `100519/100519`; global authority `16646/16646` |
| Instruction/source inventories and read-only operation gates | passed; unattended workflow collision status `clear` |
| `git diff --check` | clean |

## Architecture And Code Quality

- Sequencing policy stays in existing global/apply instruction owners; protected-stop classification stays in the hidden arbiter; route readiness stays in `arbiter-route.ts`; the proof scenario extends the existing guard runner.
- No new public API, dependency, service, or reusable abstraction was introduced.
- `tools/test-session-completion-guard.ts` is a pre-existing split-candidate. The added tests are cohesive with its guard ownership and reuse its fixtures. Splitting during qualification would duplicate harness ownership and invalidate current test evidence.
- Fresh reduction review `ses_ffde6709cffeBSe2mrcKFVuTMw` (`xai/grok-4.6`) found no safe deletion or consolidation; all route retry, exhaustion, cancellation, deadline, late-completion, and zero-child oracles are unique.

## Residual Risks

- A real long-context apply has not been observed after restart. Short paired and installed proofs are green, but instruction-model retrieval remains model-sensitive.
- The instruction budgets are at their approved maxima; further always-loaded wording requires replacement or deletion, not growth.
- Home, global, and project OpenCode sources contain configuration-name collisions. The intended kit source resolved correctly and the unattended workflow collision check was clear.
- Existing OpenCode processes retain config-time artifacts loaded before this change.

## Rollback And Activation

- Rollback is source-only: revert the scoped instruction, arbiter-route, runner, and test changes together, then restart OpenCode. No persisted-data migration or external restoration is required.
- Activation requires quitting and restarting OpenCode so the edited config-time artifacts load into a new process.

## External Operations

No commit, push, archive, installation, activation, release, target-project mutation, credential action, physical action, or protected external effect was performed.
