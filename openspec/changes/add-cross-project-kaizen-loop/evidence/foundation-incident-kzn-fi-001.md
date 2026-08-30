# Foundation Incident KZN-FI-001

- **Relation**: current Kaizen store candidate versus the accepted two-tier store envelope.
- **Candidate**: `cross-project-kaizen-loop-store-boundary-r1`.
- **Decision-changing evidence**: the current proposal and specification require 2,000 signal records at 16 KiB each plus 8,000 lifecycle records at 4 KiB each, while `global/plugin/kaizen/store.ts` implemented one 10,000-record pool at 6 KiB per record.
- **Main reproduction**: source comparison confirmed both signal capture and lifecycle transitions used `KAIZEN_EVENT_LIMIT = 10_000`, `KAIZEN_EVENT_BYTES = 6 * 1024`, and one `inbox/event-NNNNN.json` namespace. The retained task-1.3 proof imported that candidate-local byte constant and exercised only two small records.
- **Foundation review**: `ses_fb346b7c7ffek3L1O8dwAVBelc`, `findings-reported`, Effective Model `openai/gpt-5.6-sol`.
- **State**: `closed`.
- **State transitions**: `observed -> confirmed -> correcting -> swept -> re-reviewed -> closed`.
- **Terminal result**: `terminalState=closed`; `reproductionDisposition=confirmed`.

## Preserved Identities

- Archived advisor tree: `317a6ec33a975702b1319b26eb26c9bd85836ffc`.
- Archived trajectory tree: `b6295661cea55817f243236d1cec55b88393a4ec`.
- Compaction API-gate bundle SHA-256: `f1f65d365ec379fd519c6e2b5fe8666615a49c88c9613cb9dc04a98fb2bc17d6`.
- Store-boundary r1 bundle SHA-256: `dbdbfca96b9a48e98640878d4fae2ff4811506051f4251b6de82e71926424428`.
- Contradicted r1 store source SHA-256: `9ae7599e824c48a24ac9d65c5e94efccb63c5a1b8d8d3eca68f52ebae1544584`.

## Active Artifact Inventory

| Artifact | Disposition | Reason |
|---|---|---|
| `add-cross-project-kaizen-loop` proposal/design/specs | `not-dependent` | Current authority is internally aligned and remains unchanged. |
| `add-cross-project-kaizen-loop` task 1.3 | `dependent-rebind` | Reopen until the accepted two-tier envelope and renewed real boundary are current. |
| `add-cross-project-kaizen-loop/evidence-index.json` task 1.2 attribution | `dependent-narrow` | Retain as runtime API-gate component evidence; do not claim that it exercised the store candidate. |
| `add-cross-project-kaizen-loop/evidence-index.json` task 1.3 and `KZN-001` | `dependent-rebind` | Replace current completion attribution only after a corrected candidate and independent oracle exist. |
| `evidence/compaction-identity-r1/bundle.json` | `dependent-narrow` | Preserve immutable API-gate facts and original candidate identity. |
| `evidence/store-boundary-r1/bundle.json` | `dependent-narrow` | Preserve exact two-root/direct-module facts; it does not prove the accepted capacity envelope. |
| `global/plugin/kaizen/store.ts` and focused tests/proof | `dependent-rebind` | Correct the store representation and authority-side oracle. |
| `global/plugin/kaizen/index.ts` and `global/plugin/session-env.ts` | `dependent-rebind` | Revalidate unchanged composition against the corrected store. |
| `global/plugin/project-memory/store.ts` | `not-dependent` | Reused data-root helper remains unchanged by this recovery. |
| `make-grind-blockers-task-scoped` | `not-dependent` | Separate active change and writer; do not mutate. |
| Archived advisor and trajectory changes | `not-dependent` | Preserve archive bytes and lifecycle history. |

## Correction Boundary

Implement separate fixed signal and lifecycle slot populations, preserve exclusive create and source idempotency, use accepted 16 KiB and 4 KiB record guards, renew the two-root proof under a new candidate/evidence identity, and re-run affected focused validation. Do not change accepted product semantics, shared compaction wording, grind-blocker work, archives, or either r1 raw bundle.

## Corrected Candidate

- Candidate: `cross-project-kaizen-loop-store-boundary-r2`.
- Environment: `windows-node-24.18.1-kaizen-store-r2`.
- Corrected proof: `evidence/store-boundary-r2/bundle.json`, SHA-256 `7ec2bc5c1cbef536ead285001166559d6ab4e7e64af184edd6bcc2379470e597`, status `passed`.
- Composition record: `evidence/candidate-composition-r2.json`; binds the unchanged r1 runtime API-gate component to r2 source digests without rewriting the component bundle.
- Focused validation: 15 Kaizen tests passed, including both capacity limits and multi-process replay; project-memory tests passed; project-memory hook test passed; 18 session-env plugin tests passed; strict OpenSpec validation passed.
- Current claim ceiling: task 1.3 is current for the corrected direct-module boundary; `KZN-001` remains `unknown` with 0/25 member observations and no loaded-tool claim.
- Unchanged: accepted proposal/design/specs, archived advisor/trajectory trees, active gitignored config, grind-blocker artifacts, and both r1 raw bundles.

## Corrected-Candidate Re-Review Disposition

- Fresh review: `ses_fb3343302ffeZ0ytst0aVcpvTd`, Effective Model `openai/gpt-5.6-sol`, inspected `cross-project-kaizen-loop-store-boundary-r2`.
- `KZN-FI-004`: main-confirmed. The r2 signal record omits mandatory accepted evidence, impact, cause/unknown, do-not-repeat, scope, and session-ref fields. Reopen task 1.3 and correct within this incident.
- `KZN-FI-005`: main-confirmed artifact inconsistency, uniquely resolved by current normative authority. The specification's exact source enum is `legacy-feedback`; the proposal population's `legacy-import` token is corrected to match it. No shipped store or migration exists, so no compatibility layer is added.
- The original split-capacity correction remains valid and is retained at its r2 store-mechanics ceiling.

## Terminal Closure

- Final candidate: `cross-project-kaizen-loop-store-boundary-r4`.
- Final environment: `windows-node-24.18.1-kaizen-store-r4`.
- Final proof: `evidence/store-boundary-r4/bundle.json`, SHA-256 `f32577d27809d29c696ca708ac109c5b9b87ee774dd3383fc79e596be3c30fb7`, status `passed`.
- Final composition: `evidence/candidate-composition-r4.json`; the r1 API-gate remains component evidence and r2/r3 remain historical narrower store lanes.
- `KZN-FI-004` correction: immutable signal records and readback now require observed evidence, impact, likely cause/`unknown`, do-not-repeat guidance, scope hint, repository-relative evidence refs, and privacy-safe project/session refs. The r4 bundle retains payload-free schema facts for both records.
- `KZN-FI-005` correction: proposal, source, parser, and focused idempotency test now use the normative `legacy-feedback` token.
- Final validation: 15 focused Kaizen tests passed; project-memory tests passed; project-memory hook test passed; 18 session-env plugin tests passed; r4 direct boundary passed with cleanup, zero provider/network use, and unchanged active config.
- Remaining protected owner boundary: none.
- Remaining material unknown for this incident: none. `KZN-001` remains independently `unknown` because task 1.4 and later loaded/population work are outside this incident.
- Continuation point: task 1.4 copied-plugin and pinned-OpenCode explicit report/status boundary.
