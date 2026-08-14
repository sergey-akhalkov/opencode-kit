# Pre-Change Baseline

## Identity and Scope

- Repository: `<repo-root>`
- Git candidate before this change: `f756159` (`feat(workflow): add unattended OpenSpec orchestration`)
- Initial worktree before owner-authorized reconciliation: clean and aligned with `origin/main`
- Profile: `Material`
- Development-Stage: `development`
- Root RC history: none
- Active replacement change: `simplify-reuse-first-discovery`
- Preserved incomplete predecessor: `openspec/changes/archive/2026-08-14-abandoned-adopt-reuse-first-capability-discovery/`
- Unrelated working-tree changes at start: none observed

The current working tree now contains only this session's abandoned-change move, replacement planning/evidence, and later candidate work. The predecessor records 11 unchecked tasks, Rung 2-only client proof, red loaded happy path, and `Main Specs Synchronized: no`.

## Product Candidate Baseline

Current loaded/product owners before simplification:

- `global/AGENTS.md`: SHA-256 `4b5b79af042fd2688dbfca747373ad42a5dc0e131469a9570397fb219d5cc183`
- `global/commands/reuse-inventory.md`: SHA-256 `ac63de019053375ac32a6e79e7e08b2cb85252b3f65fee7e23ab7035eb5359c3`
- `global/skills/reuse-discovery/SKILL.md`: SHA-256 `e6f45c67238102610fb1c47a8924e79d02baeff115dc24074769e4b206bbe090`
- `global/bin/reuse-registry.ts`: SHA-256 `f2c2b47ffb0fd925679760928923b96a474a10da77fd609752b7cb0da313a650`
- `tools/proofs/reuse-discovery.ts`: SHA-256 `2a1554a3d55415b261ecf35495146324f8741effd54b06f575b7f604965a8db4`
- Registry implementation/template, package scripts, README/proof inventory, and current delta-only OpenSpec requirements are in the task 2.1 removal/synchronization scope.

The ignored `global/opencode.local.instructions.md` remains outside Product Candidate mutation. It supplies the current Graphify-specific Mekha gate and is preserved byte-for-byte.

## Zero-Provider Preflight

- Invocation: `npm run proof:reuse-discovery -- --mode preflight --evidence-root openspec/changes/simplify-reuse-first-discovery/implementation-evidence/baseline-preflight --capture-kind baseline --candidate-id pre-simplify-source`
- Exit: `0`
- OpenCode: `1.18.18`
- Route: `openai/gpt-5.6-sol/xhigh`
- Existing credential records detected: `4`; no values or provider names were captured
- Model calls: `0`
- Exact final permission policy: true
- Loader config/agent status: `0 / 0`, no loader error
- Cleanup: removed
- Raw bundle: `implementation-evidence/baseline-preflight/preflight.json`

## Installed Loaded Baseline

Invocation:

`npm run proof:reuse-discovery -- --mode capture --evidence-root openspec/changes/simplify-reuse-first-discovery/implementation-evidence/baseline-sessions --capture-kind baseline --candidate-id pre-simplify-source --profile quality-independent --scenarios local-owner,trivial-fix`

### Triggered `local-owner`

- Process/session-delete/root-cleanup: `0 / 0 / true`
- Elapsed fact: `99,607ms`
- Loaded `reuse-discovery` before implementation decision.
- Searched local workspace and inspected current Alpha source/proof.
- Selected `extend` and explicitly reported old `registry impact: not-applicable`.
- No registry client call was needed because a verified local candidate satisfied the contract.
- Product/project files were not modified; disposable `.serena` state was removed with the root.
- Raw bundle: `implementation-evidence/baseline-sessions/local-owner.bundle.json`

### `trivial-fix`

- Process/session-delete/root-cleanup: `0 / 0 / true`
- Elapsed fact: `42,684ms`
- Read only the local task and greeting owner.
- Did not load `reuse-discovery` and made no registry or cross-project call.
- Returned the one-line punctuation correction and nearest exact proof.
- Product/project files were not modified; disposable state was removed with the root.
- Raw bundle: `implementation-evidence/baseline-sessions/trivial-fix.bundle.json`

## Evidence Topology and Gate

- Product Candidate: current loaded trigger, skill, command, registry client/modules/template, package/catalog/docs, and current normative spec state.
- Proof Runner: current `tools/proofs/reuse-discovery.ts` before task 2.1 simplification.
- Evaluator: direct exact-fact readback of status, tool calls, disposition markers, manifests, and cleanup in the two bundles; no quality score.
- Environment: OpenCode `1.18.18`, Node `v24`, Windows, `quality-independent`, `openai/gpt-5.6-sol/xhigh`, current global source and ignored local instruction layer.
- Raw Evidence Bundle: the preflight and two scenario JSON files named above.
- Live-Attempt Gate: clear. Both provider calls reached terminal output, session deletion status `0`, proof-root cleanup `true`, and no external/product mutation occurred.

## Removal Decision

Reuse disposition for task 2.1: `extend` the existing compact trigger and lazy skill while removing the unconfigured parallel registry product. Current repository/platform/source-search owners remain. Cross-project routing stays tool-neutral in portable artifacts and is concretized by the already loaded ignored machine-local Graphify gate. No new dependency, command, scanner, registry, cache, outbox, or provider configuration is introduced.
