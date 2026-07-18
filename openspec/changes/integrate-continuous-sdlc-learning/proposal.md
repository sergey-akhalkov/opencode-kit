## Why

The kit already asks agents to record workflow friction and contains a partial prevention ledger, but reviewer findings, worker blockers, Markdown feedback, and the machine ledger are disconnected and do not reliably reduce future SDLC return loops. The kit needs one portable learning policy that emits structured return events when an adapter exists, falls back locally when it does not, and turns accepted evidence into stronger but smaller reusable instructions.

## What Changes

- Define qualifying SDLC return events and require serious reviewer, SDET, validation, delivery, and production-routing outcomes to separate the current candidate correction from the future prevention signal.
- Integrate the versioned `dream-team.sdlc-learning-signal.v1` adapter contract without copying its runtime schema or making Temporal mandatory for portable projects.
- Route reusable prevention work to `opencode-kit`, repository-specific work to the current project, dual-scope work to both owners, and unknown causes to investigation rather than guessed instruction changes.
- Keep `complain` and a local privacy-safe feedback candidate as the fallback when no conforming background adapter is discovered.
- Replace the disconnected Markdown/ignored-JSON lifecycle with one documented ownership model: raw events remain adapter-owned, while a compact versioned curated lifecycle record, proposals, candidates, replay fixtures, and accepted decisions enter Git repositories.
- Strengthen instruction placement, generalization, one-in-one-out replacement, token-budget, deduplication, provenance, replay, and decay rules so feedback improves instruction strength without unbounded prompt growth.
- Require background instruction candidates to use isolated workspaces and the existing Change-Ready lifecycle; never mutate or activate the currently loaded global configuration in place.
- Add representative instruction evals and deterministic validators for emission routing, fallback behavior, generalization boundaries, instruction budgets, and `applied -> replayed -> resolved` closure.

## Capabilities

### New Capabilities
- `library-continuous-sdlc-learning`: Portable return-event semantics, adapter discovery, global/local routing, fallback capture, generalization, bounded instruction improvement, and replay closure.

### Modified Capabilities
- `library-instruction-artifacts`: Establish a canonical compact prevention contract and enforce placement, deduplication, context-budget, and non-duplication rules across global instructions, skills, agents, and feedback artifacts.

## Impact

- Affected instruction artifacts: `global/AGENTS.md`, `global/skills/change-ready-sdlc/SKILL.md`, `global/skills/complain/SKILL.md`, `global/skills/instruction-artifact-tuning/SKILL.md`, `instructions/leaf-reviewer-agent-contract.md`, and only the role agents that need role-specific signal fields.
- Affected deterministic tooling: instruction feedback lifecycle, instruction inventory/budget checks, validator contracts, and focused fixtures/tests under `tools/`.
- Affected documentation: feedback ownership and fallback guidance in `docs/feedbacks/README.md` and portable integration guidance.
- Runtime background execution is supplied by the coordinated Dream Team change `add-background-sdlc-learning-operation`; projects without that adapter retain a non-blocking local fallback.
- No automatic merge, update of a primary/user ref, user-branch commit, push, active global-config mutation, or remote-state operation is introduced. A machine-owned detached candidate commit is permitted only inside the isolated workspace and is never integrated automatically.
