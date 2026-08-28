# Task 6.1 Campaign Readiness Evidence

- Candidate: `task-6-1-readiness-r1`
- Environment: `node-24.18.1-windows-task-6-1-r1`
- Profile: Material, development
- Effects: local disposable files/processes only; no provider call, campaign start/resume, supervisor registration, host mutation, remote action, commit, push, install, or activation

## Real Boundary

`npm run test:focused:library` passed 179 tests through the production doctor entrypoint. The retained scenarios prove:

- A schema-valid provider-free disposable campaign passes `--require campaign` with no campaign blockers.
- Selecting protected host recovery without a checked supervisor blocks only `campaign supervisor` and exits 2.
- Git porcelain is empty before and after both doctor observations, so doctor neither mutates nor starts/resumes/registers the campaign.
- A static unattended-ready project passes `--require unattended` while absent campaign configuration remains independently blocked.
- Selecting `--require campaign` for that same project exits 2 without changing its passing unattended status.

`npm run doctor -- --project . --format json --require campaign` exercised the real self-hosted kit boundary. It exited 2 because this checkout intentionally has no `opencode-dev-kit/work-campaign.json`; `campaignStatus` was `blocked`, `qualificationStatus` remained `pass`, the runtime/workflow row passed, and no campaign or host action occurred.

`npm run doctor -- --help` and `node tools/init-project.ts --help` exited 0 and documented effect-free readiness/bootstrap entrypoints. Project init preview/write behavior and the inactive campaign templates passed `npm run test:focused:init` (3 tests).

## Focused Validation

- `npm run test:focused:library`: pass, 179 tests
- `npm run test:focused:init`: pass, 3 tests
- `npm run test:focused:work-campaign`: pass
- `npm run test:focused:portable-process`: pass, 9 tests
- `npm run test:focused:install`: pass, 30 tests
- `task-6-1-controller-r1`: complete, 89 local process starts, zero provider/OpenCode/host/source-write effects
- `task-6-1-controller-replay-r1a`: complete, `liveCalls: 0`
- `task-6-1-controller-replay-r1b`: complete, `liveCalls: 0`
- `task-6-1-configured-preflight-r1`: complete, `liveCalls: 0`
- `task-6-1-configured-r1`: complete, nine bounded configured model calls
- `task-6-1-configured-replay-r1`: complete, `liveCalls: 0`

## Corrected Defects

- Campaign preflight no longer loads `@opencode-ai/sdk`; the SDK is imported only when a semantic assignment actually executes.
- The portable installed runtime manifest now includes `portable-process-supervisor.ts`; timeout-bounded commands no longer fail before child invocation.
- The maintained campaign runtime surface includes `semantic-schema.ts`.
- The inactive provider-free template uses the contract-valid minimum model-call budget of one while excluding `provider-inference` from its effect envelope, so the budget grants no provider authority.
- The disposable campaign-ready fixture is a valid empty OpenSpec project, allowing production active-change inspection to execute.

## Claim Ceiling

This evidence supports task 6.1 campaign bootstrap/readiness and status independence while retaining the current configured two-wave semantic boundary. Portable supervision, Windows registration/re-entry, host auto-resume, installation, broad population closure, SDET, RC/stable, deployment, release, and remote effects remain unsupported.
