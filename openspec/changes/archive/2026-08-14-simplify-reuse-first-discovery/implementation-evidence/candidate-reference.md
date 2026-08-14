# Candidate Reference

## Identity

- Candidate: `simplify-r2`
- Profile: `Material`
- Development-Stage: `stable`
- Stable Candidate: `RC1`
- Root RC history: `RC1`
- Runtime Proof: `implementation-evidence/runtime-proof.md`
- Live-Attempt Gate: clear
- Current loaded source hashes:
  - `global/AGENTS.md`: `09dcd9530c1a4ea1f176ab28c2bc39586acc91ff86e5ac79987681b0850c7514`
  - `global/skills/reuse-discovery/SKILL.md`: `9c0f51aa607f04903ed16665299234e0c3637bfed160bb18df047eb340deb073`
  - `README.md`: `efa14cb1f373decc0a33acb10f43312a1d8fe1f7bff346e0c1beb536446c2e7b`
  - `package.json`: `20e19fe085d504abdc813dfb25bf22875735a33114563a5afe93882b2302dc90`
  - `global/commands/reuse-inventory.md`: absent
  - `global/bin/reuse-registry.ts`: absent

## Product Candidate

Retained loaded behavior:

- one compact new-mechanism trigger in `global/AGENTS.md`;
- one lazy `global/skills/reuse-discovery/SKILL.md` owner;
- ordered remove/narrow -> current repository -> platform/installed dependency -> explicitly configured cross-project -> bounded ecosystem -> `build-minimal` discovery;
- current-source verification before `reuse` or `extend`;
- explicit cross-project `verified | degraded | not-applicable` state;
- trivial/local/mechanical opt-out;
- no mutation authority from discovery.

Removed active behavior:

- `global/commands/reuse-inventory.md`;
- `global/bin/reuse-registry.ts` and `global/bin/reuse-registry/**`;
- `global/reuse-registry-template/**`;
- `reuse:registry` package script;
- registry/inventory wording in README and proof inventory;
- registry-specific scanner/cache/outbox/promotion proof behavior.

Current normative owners:

- `openspec/specs/library-reuse-discovery/spec.md`;
- modified `SDLC-012` in `openspec/specs/library-change-ready-sdlc/spec.md`;
- reuse ownership/removal/runtime requirements in `openspec/specs/library-instruction-artifacts/spec.md`;
- matching delta specs in this change.

## Proof and Environment

- Proof Runner: narrowed `tools/proofs/reuse-discovery.ts`; capture revision SHA-256 `9be9392552c11aa9bbe0155d01b2a60ed326504eeeff81fadffa380568ddfbba`, one provider-free preflight, and two configured-provider captures with flat `bash: deny`.
- Evaluator: current runner SHA-256 `64a1dfe42ce8e0a14f742f0a5a9b0f96e64d0b84fbcd2f536d7e6b2752c283c3`; exact status, tool, disposition, cross-project-state, source-hash, no-bash, registry-call, and cleanup facts; no fuzzy scoring or model call.
- Environment: OpenCode `1.18.18`, Node 24, Windows, `quality-independent`, `openai/gpt-5.6-sol/xhigh`, current kit global source, ignored machine-local instruction layer.
- Raw bundles: candidate preflight r3, candidate sessions r2, candidate evaluation r3. Failed provider-free evaluator r2 is preserved separately and did not alter raw inputs.
- Loaded command inventory: `dedup`, `opsx-apply`, `opsx-archive`, `opsx-propose`; no `reuse-inventory`.
- Triggered lane: `extend`, current-source inspection, defective local candidate rejected, cross-project `degraded`, zero bash/registry calls, no source mutation, cleanup green.
- Trivial lane: zero bash/reuse skill/cross-project/registry calls, no source mutation, cleanup green.

## Architecture

- `global/AGENTS.md` owns only the trigger and compact disposition.
- `reuse-discovery/SKILL.md` is 58 lines and owns one cohesive decision workflow.
- The ignored machine-local file remains the concrete provider/project/refresh owner and was not modified.
- `tools/proofs/reuse-discovery.ts` is 614 lines, below the repository split threshold of 800. **Split-or-justify:** keep it cohesive because fixture identity, permission envelope, redaction, raw event parsing, session deletion, cleanup, and exact evaluator facts share one two-scenario evidence lifecycle; splitting those stateful responsibilities would add cross-file correlation and cleanup risk without another consumer.
- The change removes 14 registry/command/template files and roughly 1,100 lines from the proof runner; it adds no product dependency, service, config layer, command, or compatibility adapter.

## Diagnostics

- Preflight and both live lanes preserve exact argv, status, stdout/stderr, tool order, source hashes, and cleanup.
- Both live stderr values are empty.
- Non-zero commands would preserve their bundle before throwing; cleanup failure is terminal.
- Cross-project unavailability is surfaced as `degraded`, not an empty success or false complete-search claim.
- Proof-only source still names removed entrypoints in bounded absence/oracle locations. They cannot invoke current product behavior and exist solely to prove command/source absence and zero registry calls.

## Terminal Critical SDET

- Fresh SDET identity: `fresh-sdet-simplify-r2`; Effective Model: `xai/grok-4.6`.
- Terminal action: `no-critical-risk`; critical matrix: none; test changes: none.
- Main independently dispositioned every evidence note in `implementation-evidence/critical-sdet.md`. The only correction was proof-envelope enforcement, not Product Candidate behavior; current Runtime Proof is restored and the root SDET stop is terminal.

## Current Validation

- `npm run validate:strict`: final documentation replay green, `skills=29 agents=18 markdown=373 warnings=0 infos=2`.
- `openspec validate --all --strict`: 13 passed, 0 failed.
- `openspec list --json`: only `simplify-reuse-first-discovery` is active, complete at 10/10 tasks.
- `npm test` and `npm run prepush:validate`: green.
- `git diff --check`: green on the complete candidate before final handoff docs.
- Instruction inventory: 58 artifacts, 100,165 token proxy; `reuse-discovery` is 949 token proxy. No performance improvement is claimed.

## Limits and External State

- Successful provider-specific cross-project lookup is not proved; the current safe proof exercises explicit `degraded` behavior. Future ordinary project use is Rung 3.
- Cross-project indexes may be stale/noisy and vocabulary-sensitive; current source remains authoritative.
- Running OpenCode processes retain previously loaded skill/command catalogs until restart.
- No install, activation, provider configuration, dependency mutation, commit, push, archive, release, publication, credential, or remote-state operation was performed.
