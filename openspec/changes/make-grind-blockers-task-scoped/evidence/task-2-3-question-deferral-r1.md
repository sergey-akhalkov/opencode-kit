# Task 2.3 Question Deferral Evidence R1

## Outcome

- Task: `2.3`
- Result: `complete` at the provider-free official-SDK controller boundary only.
- Candidate: `grind-task-scoped-question-deferral-r1`
- Environment: `windows-node-24.18.1-bun-1.4.0-provider-free-r1`
- Required boundary: `question-deferral-controller`
- Installed OpenCode proof: not run and not implied; task `4.1` remains the next installed boundary.
- Claim disposition: `GRIND-TSB-001` remains `unknown` with `0/20` installed population observations.

## Implemented Boundary

- `controller.ts` persists bounded pending blocker provenance before calling official `client.question.reject`, confirms provenance only after the call succeeds, and leaves uncertain outcomes fail-closed with `question-deferral-resolution-unknown`.
- A confirmed deferral remains `question-deferring` while the root is busy. Only a later idle observation applies the already validated verdict by continuing its selected runnable item or entering its exact non-product waiting state.
- Concurrent `question.replied` wins over a deferral in flight, clears pending or confirmed synthetic provenance, invalidates the pre-reply frontier basis, and prevents stale continuation.
- `status.ts` serializes pending and confirmed deferral provenance. `runtime-support.ts` restores valid bounded provenance and initializes any persisted pending rejection as an explicit restart error rather than inferring its outcome.
- The existing official offered-label `questionAction=answer` path remains unchanged.

## Observable Proof

- The Bun controller oracle observes one pending provenance record in root metadata at the instant `question.reject` is invoked.
- A successful rejection while the root remains busy produces no continuation. A correlated `question.rejected` event cannot misclassify it as human-resolved; the subsequent idle event injects exactly one selected-item continuation.
- A successful technical-gate deferral remains pending until idle, then enters resumable `technical` waiting with no root continuation.
- A human reply arriving while rejection is in flight wins: the question becomes `human-replied`, pending and confirmed deferral provenance are empty, the frontier becomes stale, and no synthetic continuation is injected.
- A rejection transport failure preserves pending provenance, records `resolution-unknown`, exposes `question-deferral-resolution-unknown`, and produces no continuation.
- Restart with valid pending deferral provenance initializes fail-closed in `error` with the same explicit recovery action.

## Validation

- `npm run test:focused:session-completion-guard` -> exit `0`, `OK: session completion guard tests=54`.
- `npm run test:focused:session-plugin` -> exit `0`, `OK: session env plugin tests=18`.
- `npm run validate:strict` -> exit `0`, `OK: skills=34 agents=22 markdown=1028 warnings=0 infos=2`.
- Installed OpenSpec JavaScript entry `validate make-grind-blockers-task-scoped --strict` -> exit `0`, `Change 'make-grind-blockers-task-scoped' is valid`.
- `git diff --check` -> exit `0`; Windows line-ending conversion notices only.
- `npm run code-quality:inventory -- --format markdown` -> exit `0`; controller and focused test remain pre-existing split candidates.

## Code Quality Disposition

- Verdict: fixed; code-health delta: neutral.
- Split-or-justify: `controller.ts` remains the existing cohesive owner of question audit state and official question effects. Extracting this temporal state machine would add a second lifecycle owner before another implementation exists.
- Split-or-justify: `tools/test-session-completion-guard.ts` remains the maintained guard oracle owner and reuses its existing Bun child-process pattern instead of adding a runner.
- Fresh reduction review `ses_fb0e87d39ffeSsNwwZfTCUZU0M`, Effective Model `xai/grok-4.6`, Candidate `grind-task-scoped-question-deferral-r1`, found one safe reduction: remove write-only `rejectionObserved`. The field and assignments were deleted, the event oracle was narrowed to the retained state transition, and the 54-test suite remained green.

## External Effects And Cleanup

- Provider calls: `0`.
- Network requests: `0`.
- Installed OpenCode processes or sessions: `0`.
- Repository install, activation, restart, commit, push, or remote effects: `0`.
- Disposable controller state and child Bun processes terminated within the focused runner.

## Claim Ceiling And Next Boundary

This evidence supports task `2.3` only at the current provider-free official-SDK controller boundary. It does not prove loaded main or arbiter compatibility, an installed OpenCode question lifecycle, product/dependency classification quality, roadmap/campaign composition, authorization containment, any `GRIND-TSB-001` population member, SDET, or archive readiness. The next implementation task is `3.1`; the next real installed question boundary remains task `4.1`.
