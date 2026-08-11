# Pre-Change Baseline

## Accepted Boundary

- Outcome and operating envelope are frozen in `proposal.md` and `design.md`.
- Product Candidate paths: `global/skills/deduplication-audit/SKILL.md`, `global/commands/dedup.md`, the dedup entry in `profiles/all.json`, and the matching README catalog line.
- Proof Runner: `tools/proofs/deduplication-audit.ts`.
- Evaluator: the runner's provider-free `preflight`, `cli-proof`, and `evaluate` modes plus fresh SDET contract tests after Runtime Proof.
- Environment Identity: current working-tree source, OpenCode 1.18.16, Node 24.18.0, npm 11.13.0, `quality-independent` route resolved by preflight, and machine-global jscpd identity recorded after installation.
- Root RC history: none; next eligible candidate is RC1.
- Critical SDET state: not started; one fresh test-only attempt is required after current MVP and accepted-scope completion.
- Live-Attempt Gate: clear for this new synthetic proof path before the first provider attempt.

## Existing Ownership

- `reuse-discovery` owns pre-production new-mechanism reuse discovery and remains unchanged.
- `code-quality-audit` owns broad maintainability guidance and remains unchanged.
- `codebase-audit-loop` owns explicit exhaustive audits and remains excluded from scoped `/dedup` routing.
- `code-quality-reviewer` already owns read-only safe reduction evidence and is reused unchanged.
- The in-progress `adopt-reuse-first-capability-discovery` change has unrelated uncommitted/global artifacts. This change does not modify its `global/AGENTS.md`, command, skill, proof runner, registry client, or evidence. The shared all-profile/catalog edits are additive dedup entries only.

## Pre-Mutation Facts

- No kit global `deduplication-audit` skill or `/dedup` command exists.
- No `deduplicator` agent exists.
- Upstream skills named `jscpd` and `dry-refactoring` are not installed in the kit global source.
- `jscpd` is not currently resolved as a global executable or global npm package.
- Repository `package.json` has no `jscpd` dependency; installation is host-global only.

## Behavior Scenarios

The runner freezes six same-input baseline/candidate scenarios: `local-owner`, `exact-clone`, `semantic-near-clone`, `unique-compatibility-test`, `no-match-helper`, and `trivial-fix`. Non-trivial scenarios invoke command name `dedup` with scope `src`; baseline supplies only a disposable generic command while candidate uses the global `/dedup`. The trivial scenario uses the same direct planning prompt in both captures and forbids dedup ceremony.

## Safety and Cleanup

- Synthetic repositories contain no credentials, private source, network targets, or external effects.
- Provider sessions deny edits, external directories, web access, questions, and arbitrary shell/task use; only `jscpd`, local reads/search, the lazy skill, and `code-quality-reviewer` are available where applicable.
- Every bundle records source hashes before/after, exact invocation, status, stdout/stderr, tool/model/token/time facts when exposed, and session/root cleanup.
- Unknown cleanup or a red provider/evaluator lane blocks another live attempt until preserved evidence reaches terminal offline evaluation and identifies the causal correction or missing observation.
