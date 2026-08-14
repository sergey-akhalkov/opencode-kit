# Minimal Bootstrap Client Runtime Proof

## Identity

- Product Candidate: `global/bin/reuse-registry.ts`, `global/bin/reuse-registry/{contracts,io,registry,scanner}.ts`, `global/reuse-registry-template/**`, and `package.json` exposure.
- Proof Runner: `tools/proofs/reuse-discovery.ts` modes `client-preflight` and `client-proof`.
- Evaluator: explicit boolean facts in `final/client-proof.json`; no quality score.
- Environment: Node `v24.18.0`, Windows, existing `zod` from the global dependency graph, disposable Git registry/producer/consumer roots.
- Raw Evidence Bundle: `preflight-final/client-preflight.json` and `final/client-proof.json`.
- Model calls: `0`.

## Reuse Disposition

- Requested capability: portable committed-tree inventory and private reuse registry client.
- Trigger: new parser/validator/client/proof mechanism.
- Search layers: current repository process, inventory, validation, Git, and Zod owners; central registry did not exist before this candidate; public ecosystem was unnecessary.
- Material candidates: `global/bin/portable-process.ts`, staged-validation Git plumbing/path guards, `tools/project-inventory.ts` manifest concepts, failure-atomic installer replacement, and existing `zod`.
- Decision: `extend` existing owners through cohesive new registry modules; no parser/framework/dependency added.
- Registry impact: `not-applicable` for kit-internal implementation proof; the new registry protocol itself is the capability being delivered.

## Boundary And Input

The runner created unrelated disposable Git repositories for `shared/alpha`, `shared/beta`, a consumer, and a local registry. Each producer used a deterministic plumbing commit and `refs/heads/main`. The resolved plan carried exact canonical roots, refs, full commit/tree identities, selected `personal` group, registry ID, and existing temp parent.

The actual CLI sequence was:

1. `status`
2. `validate`
3. `bootstrap --plan <plan>`
4. bounded `query` before promotion
5. `enqueue` one source-verified candidate
6. `status` with pending visibility
7. local `sync`
8. bounded curated `query`
9. final `validate`

Every command used an explicit absolute private config and exited `0`; exact redacted argv/stdout/stderr and elapsed facts are in `final/client-proof.json`.

## Observations

- Initial registry: `0` selected curated capabilities.
- Bootstrap: two exact committed trees, two generated project records, three untrusted candidates, and no curated promotion.
- Empty query: `total: 0`, `hasMore: false`, `limit: 10`.
- Enqueue: `pending`; status exposed stable ID `text/jsonc-parse`.
- Sync: one local record synchronized, pending count `0`, no commit/push/publication command.
- Curated query: exactly one bound result, `text/jsonc-parse`, owner `shared/alpha`, `total: 1`, `hasMore: false`.
- Privacy: unselected `private/sentinel` and its root were absent from query output.
- Source isolation: producer Git status remained empty; scanner read exact commit objects via Git, not dirty/untracked bytes.
- Cleanup: `removed`; no disposable root remains.

## Architecture

- `contracts.ts`: schema/data owner only.
- `io.ts`: contained reads, deterministic JSON, privacy-safe diagnostics, and rollback-capable atomic writes.
- `scanner.ts`: exact Git committed-tree inventory only.
- `registry.ts`: canonical validation, index derivation, query, outbox, and scan orchestration.
- `reuse-registry.ts`: import-safe CLI adapter and owning error boundary.
- `split-or-justify`: new responsibilities were not added to mixed `devkit-contract.ts` or repository-specific `project-inventory.ts`.

## Diagnostics And Validation

- Rejected attempts and retry conditions are recorded in `history.md`; final preflight was required before the complete lane.
- `npm run validate:strict`: exit `0`; `skills=24 agents=18 markdown=254 warnings=0 infos=2`.
- `node --check` for the CLI and all four core modules: exit `0`, no output.
- Live-Attempt Gate: `clear`; this lane is provider-free and cleanup is complete.
- Development-Stage: `development`; the loaded command/policy happy path in task 2.2 is not yet complete.
