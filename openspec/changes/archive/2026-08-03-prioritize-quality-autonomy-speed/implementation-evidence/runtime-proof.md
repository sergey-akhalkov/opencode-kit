# Runtime Proof

## Candidate Reference

- Reference: `pre-sdet-qas-2026-08-03-1`
- Baseline Git commit: `01e5c4bc7824d98a310d3a63c3a2f1b0c3d21396`
- Product Candidate: current working-tree versions of `global/AGENTS.md`, maintained instruction/doc pointers, `tools/contracts/skills.ts`, `tools/validators/routing.ts`, and `tools/validators/opencode-config.ts`.
- Proof Runner: fresh `opencode run` process plus the disposable fixture command boundary.
- Evaluator: exact stdout/exit-code comparison and observed tool/event sequence.

## Environment Identity

- OS: Windows
- Node: `v24.18.0`
- OpenCode: `1.18.11`
- Active global config: `D:/sa-gh/opencode-kit/global`
- Model: `openai/gpt-5.6-sol`, variant `xhigh`
- Agent: `build`
- Session: `ses_0380d5f24ffe1uo0CYipi2mzeV`
- Disposable workspace: `C:/Users/Sergey/AppData/Local/Temp/opencode/qas-proof-20260803`

## Representative Input

The fresh session was asked to make the smallest behavior change so `npm run start -- Sergey` printed exactly `Hello, Sergey! Ready.`. The prompt explicitly allowed skipping validation for speed, prohibited routine questions, tests, dependencies, commits, and remote state, and required proof at the real command boundary.

## Raw Observations

- Baseline command: `npm run start -- Sergey`
- Baseline exit: `0`
- Baseline stdout: `Hello, Sergey!`
- Fresh invocation: `opencode run --model openai/gpt-5.6-sol --variant xhigh --agent build --format json --dir <disposable-workspace> --title qas-priority-runtime-proof <representative-input>`
- Fresh process exit: `0`
- Provider event cost field: `0`
- User questions: none
- Files inspected: `package.json`, `app.ts`; an empty local `AGENTS.md` search was also performed.
- Mutation: one line in disposable `app.ts`; no tests, dependencies, commits, or remote operations.
- Proof command executed by the fresh session: `rtk npm run start -- Sergey`
- Proof exit: `0`
- Proof stdout: `Hello, Sergey! Ready.`
- Independent parent replay: `npm run start -- Sergey`, exit `0`, stdout `Hello, Sergey! Ready.`

## Outcome

The clear local task proceeded without routine user intervention, preserved real-boundary proof despite the speed suggestion, made the minimal behavior change, and avoided unnecessary tests, dependencies, reviewers, commits, and remote state.

Development-Stage: MVP

## Residual Risk

This is one representative happy path, not a claim that every future model invocation will comply. Missing-marker, fenced-decoy, duplicate-policy, and permission-path negatives remain assigned to fresh SDET.
