# Pre-Change Baseline

Captured: 2026-08-10

## Outcome Capsule

- **Outcome**: Ship a natural-language `/reuse-inventory` command, deterministic committed-tree bootstrap/rescan client, private registry/query/outbox protocol, and a compact new-mechanism reuse trigger that finds source-verified capabilities without adding routine ceremony.
- **Operating Envelope**: Explicit local config, existing local Git registry/project roots, named group intersection, exact committed refs, disposable proof repositories, bounded synthetic OpenCode sessions, and no owner registry activation.
- **Non-Goals**: No clone/fetch/pull/commit/push, dependency installation, source copying, public mutation, owner registry creation, all-index project enumeration, fuzzy scoring, dirty-tree scanning, or universal search before trivial edits.
- **Non-Deferrable Invariants**: Exact configured identities and roots; unallowlisted projects remain undisclosed; registry content is untrusted data; generated candidates remain distinct from curated capabilities; source verification precedes reuse; checkpoints advance only after complete validated atomic replacement; remote/dependency effects remain absent.
- **Observable Proof**: Rung 2 disposable registry/producer/consumer CLI lanes plus Rung 3 same-model baseline/candidate OpenCode sessions, with exact command/tool/effect/cleanup evidence.
- **Material Residual Risks**: Generated inventory can be incomplete/noisy; exact lexical terms can miss vocabulary variants; source/cache/index freshness must be verified; registry outage can still permit explicitly degraded minimal duplication.
- **Stop Line**: Complete command, deterministic core, registry/template/config/outbox, incremental committed-tree refresh, runtime policy integration, disposable proof, same-model comparison, critical-only SDET, validation, and local handoff. Rung 4 owner activation remains separate.

## Candidate And Authority

- Profile: `Material` because loaded lifecycle/safety policy changes.
- Git branch: `main`.
- Git HEAD: `35f5f3519bd7e6e709bece5b2b4472e17a49f031` (`fix(workflow): accept structured owner boundaries`).
- Development stage before Product Candidate mutation: `development`.
- Root RC history: no RC has been assigned for this change; first eligible candidate is `RC1` and numbering will not reset.
- Material SDET stop rule: one fresh test-only attempt after current MVP and accepted-scope completion; continue only after an immediately prior main-confirmed critical defect, production correction, and renewed proof; the first precondition-valid attempt without confirmed-critical progress permanently stops SDET for this root.
- Live-Attempt Gate: `clear`; no reuse-discovery provider attempt has run and no prior failure chain exists.
- External Operations: not performed.

## Product Candidate

Planned exact owners from the accepted design; paths may be narrowed within these owners but not broadened beyond the accepted outcome without evidence:

- Portable core and CLI: `global/bin/reuse-registry.ts`, cohesive support modules under `global/bin/reuse-registry/`, and `global/bin/portable-process.ts` only if its existing API must be reused without semantic change.
- Portable schemas/templates: project-neutral reuse registry/config/template artifacts under `global/` in one discoverable data owner.
- Runtime command and policy: `global/commands/reuse-inventory.md`, `global/skills/reuse-discovery/SKILL.md`, `global/AGENTS.md`, and `global/skills/change-ready-sdlc/SKILL.md`.
- Thin kit exposure and discoverability: `package.json`, `README.md`, profiles/catalog/template pointers only where required.
- Deterministic drift validation: focused contracts under `tools/contracts/` and validators under `tools/validators/`; repository validation does not enter the portable core.
- Proof Runner: `tools/proofs/reuse-discovery.ts` plus the existing `tools/proofs/lib/opencode-proof-client.ts` ownership and `tools/proofs/README.md` inventory.
- Evaluator: scenario-neutral offline evaluation owned by the proof runner or one cohesive sibling under `tools/proofs/`; it records explicit facts and does not score prompt quality.
- Evidence and task state: this change's `implementation-evidence/**` and `tasks.md`.

## Ownership And Split Decisions

- `tools/proofs/lib/opencode-proof-client.ts` already owns route/session/tool-map lifecycle and is retained rather than duplicated.
- `global/bin/portable-process.ts` already owns portable argv execution and is retained rather than adding a process wrapper.
- `tools/project-inventory.ts` is repository-maintenance inventory knowledge, not the portable registry core. Reuse its deterministic manifest/path concepts without importing kit/package-manager identity into `global/bin/`.
- `tools/validators/opencode-config.ts` owns OpenCode config validation only; private reuse-config validation belongs to the portable reuse core.
- `tools/validators/devkit-contract.ts` is already mixed and above the attention threshold. New registry/command markers will use a focused validator/contract owner rather than adding another responsibility there.
- `global/AGENTS.md` remains the sole compact always-loaded trigger owner. Detailed search/registry/outbox behavior stays lazy in one skill.
- `split-or-justify`: new portable registry responsibilities require cohesive new modules; adding them to `portable-process.ts`, `project-inventory.ts`, or `devkit-contract.ts` would mix owners and is rejected.

## Dirty Worktree Inventory

`rtk git status --short` before Product Candidate mutation:

```text
 M .serena/project.yml
?? openspec/changes/adopt-reuse-first-capability-discovery/
```

- `.serena/project.yml`: unrelated pre-existing/user change, `30` inserted and `36` deleted lines by numstat. Its content was not used, edited, staged, reverted, or cleaned.
- `openspec/changes/adopt-reuse-first-capability-discovery/`: accepted untracked change artifacts and evidence root.
- No concurrent mutation-capable specialist was dispatched.

## Environment

- Node: `v24.18.0`
- npm: `11.13.0`
- Git: `2.55.0.windows.3`
- OpenSpec: `1.6.0`
- OpenCode: `1.18.16`
- Workspace: Windows `D:\\sa-gh\\opencode-kit`; shared evidence redacts absolute roots.

## Instruction And Code Baselines

- `global/AGENTS.md`: 321 lines, 60,831 chars, token proxy `15,208`.
- Maintained instruction inventory: 53 artifacts, 4,154 lines, 347,599 chars, token proxy `86,919`.
- The final candidate must keep `global/AGENTS.md <= 15,208` token proxy and maintained corpus `<= 86,919` token proxy.
- Code-quality inventory: 120 source files; 24 attention files; 10 pre-existing split candidates. New modules must stay cohesive and the current change must not worsen an existing mixed owner.
- Project inventory: existing proof library source root `tools/proofs/lib`; package scripts and build/config inventory captured in `baseline/project-inventory.json`.

## Validation Baseline

| Command | Exit | Baseline result |
| --- | ---: | --- |
| `npm run project:inventory -- --root . --format json` | 0 | Green; raw JSON captured. |
| `npm run instruction:inventory -- --format json` | 0 | Green; exact budget facts captured. |
| `npm run code-quality:inventory -- --root . --format json --attention-lines 400 --split-lines 800` | 0 | Green informational `split-candidate`; pre-existing paths captured. |
| `npm run validate:strict` | 0 | Green: `skills=24 agents=18 markdown=250 warnings=0 infos=2`. |
| `npm test` | unknown (non-zero observed) | Red baseline: four existing library fixture failures require `auditWindow` in copied `global/opencode.json.template`; the terminal adapter did not expose the precise process code and no reuse Product Candidate existed. |
| `npm run openspec:validate` | 0 | Green: 11 passed, 0 failed. |

The `npm test` failures are pre-existing current-tree validation-fixture drift. They occur before any Product Candidate mutation in fixture scenarios `machine-local-permission-info`, `global-template-permission-info`, `global-machine-local-top-level-allow-info`, and `missing-portable-bin-and-stagnation`; each reports `Completion guard options must define auditWindow`. They are not corrected under task 1 and remain an attributed validation baseline to re-evaluate during final validation.

## Artifact Hashes

Git blob hashes at baseline, in listed order:

| Path | Hash |
| --- | --- |
| `tools/proofs/README.md` | `3b890c8887b5f463b44e248b9c3a4a0e577e7f49` |
| `tools/proofs/lib/opencode-proof-client.ts` | `7df79af8e4b37f561b7c908c29e647574dc25751` |
| `global/bin/portable-process.ts` | `34c9306ce08e689ebfc4c2521ef9ef7d2070e997` |
| `tools/project-inventory.ts` | `7da2f75e19dd4132d98430945066159d80fe7956` |
| `tools/instruction-artifacts-inventory.ts` | `b0e3e4b445132c20af2482c7759b9873045d1744` |
| `tools/code-quality-inventory.ts` | `49a2a2d86f5ab69390e63ce8bc8df3040241fbc3` |
| `tools/validators/opencode-config.ts` | `f49c9de7e9cf83b89a7dc79677f13c8be4dfead4` |
| `tools/validators/devkit-contract.ts` | `5ad770109d9aa21eaced3a5f1e65c7cd6c6c5413` |
| `tools/validators/engineering-quality.ts` | `a01c7c659671999b1efd10f3fa89badce957c999` |
| `tools/contracts/skills.ts` | `a0be077affb053d8cbf5bd7040ad2be9471fc55c` |
| `global/AGENTS.md` | `e46cf25dc5a1d4916c26d34e8e87aa62711eb4eb` |
| `global/skills/change-ready-sdlc/SKILL.md` | `f488b0c7cdd125f7ac14049801a63d5a9df9edb9` |
| `instructions/reusable-project-agent-instructions.md` | `820c5e1071fdcc545eacd5ae8520eb12b063438a` |
| `instructions/universal-development-loop.md` | `4e03168fae04e2ed87664a402277ab441fb5d835` |
| `templates/project/AGENTS.md` | `edacb1c876e84c09b6609ee56c326bf95cf7cf54` |
| `README.md` | `8c48aed882d48f1f8a048d226d4a86f59d80079a` |
| `package.json` | `3a94b9a58fa14bc4d8823b766aaff8509f30c85b` |

## Evidence Topology

- Product Candidate: paths listed above.
- Proof Runner: retained OpenCode proof client plus `reuse-discovery.ts` scenario driver.
- Evaluator: deterministic explicit-oracle replay over captured raw bundles.
- Environment Identity: baseline HEAD and hashes, tool versions, exact configured proof profile/model route, and disposable project commit/tree identities.
- Raw Evidence Bundle: `implementation-evidence/baseline/**`, later `baseline-sessions/**`, and runtime-proof lane directories.
- Cleanup: baseline commands are read-only; later runners must remove sessions/disposable roots in `finally`, with unknown cleanup terminal.
