# Task 1.2 Complexity-Foraging Schema Evidence

## Outcome And Ownership

- Decision: `no-current-owner -> build-minimal`. The new owner is the self-contained `global/bin/complexity-foraging-contract.ts`; importing OpenSpec, roadmap, consumer-outcome, or repository-only `tools` parsers would create a wrong domain or installed dependency.
- Scope: schema/types/parser/normalizer, two reviewed fixture packs, and one focused provider-free runner only. No CLI, package-script registration, instruction/profile mutation, dependency, target-project write, configured session, install, network, or remote effect occurred.
- Candidate: `continuous-complexity-management-schema-r2`.
- Environment: Windows, Node `24.18.1`, provider-free local execution.

## Real Boundary

- Invocation: `node tools/test-complexity-foraging-contract.ts`.
- Terminal result: exit `0`; stdout `OK: complexity-foraging-contract valid=8 invalid=7`; stderr empty.
- Valid records: portable reviewed scope, normalized input, cohesive output, noisy reviewed-scope output, unsupported ecosystem, unreadable root, nested unreadable partial support, and cancellation-blocked output. Every record was parsed, serialized in canonical order, parsed again, and compared byte-for-byte.
- Invalid records: schema version, scope class, privacy-safe root digest, file bound, detector evidence, support state, and original-cause code each failed at the exact reviewed field.
- First attempt: failed before fixture evaluation because Node strip-only TypeScript rejects constructor parameter properties. The contract was changed to an explicit readonly field assignment; the next run reached and passed all records. No writer or runtime state remained open.

## Contract And Safety Readback

- Schema version is `1`; root identity is lowercase SHA-256 only; project paths are relative forward-slash paths without empty/current/parent segments; diagnostic messages reject absolute Windows, UNC, and Unix paths.
- Deterministic helpers enforce exact keys, stable scope/candidate/fact/diagnostic order, positive scan bounds under named hard caps, explicit support states, and cause class/code/message without semantic scoring, ranking, architecture inference, or source payload.
- Defaults are 100,000 files, 512 MiB, and 120 seconds. Hard caps are 1,000,000 files, 4 GiB, and 600 seconds. These are scan process controls, not instruction-size or semantic quality ceilings.
- Cleanup: none required; the proof reads bounded regular fixture files and creates no temporary or persistent state.

## Validation And Review

- `node --check global/bin/complexity-foraging-contract.ts`: exit `0`.
- `node --check tools/test-complexity-foraging-contract.ts`: exit `0`.
- `npm run validate:strict`: exit `0`, skills `32`, agents `21`, markdown `869`, warnings `0`, infos `2`.
- `openspec validate add-continuous-complexity-management --strict --no-interactive`: valid.
- Apply operation gate: exit `0`; declaration and compact falsification record pass; semantic readiness remains unknown.
- Code-quality inventory: contract `456` lines, attention band, below split-candidate. Responsibility map is one cohesive versioned contract owner; `split-or-justify=justify` because separating its closed-key types from their field parsers would duplicate or obscure the one I/O contract.
- Fresh read-only reduction review: session `ses_fbdf29c4bffeQaB6hsWk4C0jDW`, effective model `xai/grok-4.6`, reduction `none`, high confidence; all 7/7 records are unique oracles and no generic helper reuse is contract-compatible.
- Task-1.3 dependency readback found that a portable versioned scope file cannot require the normalized input record's machine-specific root digest and runtime bounds. Schema r2 therefore adds one exact `recordType=scope` shape to the same owner and focused runner; the 8/7 terminal result above proves it without weakening root identity or introducing precedence rules.
- Serena reports no contract diagnostic. The focused runner reports only repository-wide missing Node ambient type declarations (`node:fs`, `node:path`, `node:url`, `process`); this repository does not install `@types/node`, while the actual Node entrypoint executes successfully. No dependency was added for editor-only diagnostics.

## Claim Ceiling

The provider-free schema/scope shapes, stable round-trip, named invalid-field rejection, and explicit fallback/error representation are observed. No inventory CLI project scan, loaded workflow, semantic decision, same-scenario refactor, configured population member, or real oracle is implemented or supported yet.

CLI-r1 dependency readback reran `node tools/test-complexity-foraging-contract.ts` with terminal `valid=8 invalid=7`; the CLI imports the exact contract and does not fork or weaken the schema. The task-1.2 evidence remains current for the CLI candidate.
