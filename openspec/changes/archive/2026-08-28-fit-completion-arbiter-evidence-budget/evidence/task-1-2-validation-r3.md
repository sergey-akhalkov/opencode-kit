# Task 1.2 Proof-Owner Validation

## Contract

- `--help` is effect-free and documents inputs, effects, retained evidence, and cleanup for `suite`, `fixture`, `incidents`, and `replay`.
- `fixture` creates one disposable database, reads the production public projection in a child process, fixes only the synthetic source ref, applies the reviewed retained counts and four ordinary claims, then invokes the production controller with `maxRequestBytes=200000` and deletes the fixture before retaining evidence.
- `incidents` requires an explicit database path, opens it with SQLite `readonly: true`, enables and verifies `PRAGMA query_only=ON`, emits only privacy-safe refs/counts/bytes, closes the handle, and records zero writes.
- `replay` reads a preserved raw bundle and runs the complete mode evaluator without creating a fixture or reading the live database.

## Observations

- Independent fixture captures r3 and r4 produced identical raw SHA-256 `d635343eeeaf6021ae7201413cfb79fceed5921b46ce26dcd199e48c99f4f012` and identical evaluation SHA-256 `c3ace007ba6f121681cd4ab6e5ce626249a72e6a852c2dd86c92dc12738e4600`.
- The unchanged production request was exactly `736473` bytes against the configured `200000` limit. The controller recorded terminal `input-state`, zero child creates, zero model calls, and the same measured bytes.
- The fixture retained 16 assistant, 32 background, 32 descendants, 24 diffs, 32 human, 32 permission, 32 question, 32 synthetic, four independent 64-row todo views, 64 tool, 24 validation, and four ordinary claim records.
- Incident mode found exactly eight terminal roots from `214535` through `254691` bytes, including `233377`; all retained `allowedBytes=200000`. Query-only, handle closure, zero writes, zero child calls, zero model calls, and privacy scan are green.
- Replay A and B produced identical evaluation SHA-256 `5e6698c8fd9b43d47278da97fdbcc0794bb9183c4c46434cf0f0cb4ec3343ddc`.
- No `guard-long-run-reviewed-*` or `guard-long-run-proof-*` disposable directory remained after capture.

## Validation

```text
bun tools/proofs/session-completion-guard-long-run.ts --help
bun tools/proofs/session-completion-guard-long-run.ts --mode fixture --candidate-id completion-arbiter-budget-baseline-r1 --evidence-root <new-root>
bun tools/proofs/session-completion-guard-long-run.ts --mode incidents --candidate-id completion-arbiter-budget-baseline-r1 --database <OPENCODE_DB> --evidence-root <new-root>
bun tools/proofs/session-completion-guard-long-run.ts --mode replay --candidate-id completion-arbiter-budget-baseline-r1 --input <baseline-raw> --evidence-root <new-root-a>
bun tools/proofs/session-completion-guard-long-run.ts --mode replay --candidate-id completion-arbiter-budget-baseline-r1 --input <baseline-raw> --evidence-root <new-root-b>
npm run proof:guard-long-run -- --mode suite --candidate-id completion-arbiter-budget-baseline-r1 --evidence-root <new-root>
npm run test:focused:session-completion-guard
```

Every invocation exited `0`. The maintained suite reported `status=complete`; the focused guard suite reported `45/45`.
