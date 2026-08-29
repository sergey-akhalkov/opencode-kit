# Task 4.1 Routing And Provider-Free Archive Evidence

- **Task:** `4.1`
- **Candidate:** `roadmap-delivery-trajectory-routing-r2`
- **Candidate Diff Digest:** `b421ba92e5877e86722601f7013f2dd91e926c44`
- **Environment:** `provider-free-disposable-archive-r3`
- **Boundary:** canonical propose/apply/archive instruction routing plus the unchanged `global/bin/openspec-archive.ts` over a disposable explicitly linked OpenSpec project.
- **Claim Ceiling:** This evidence supports explicit instruction routing, deterministic Horizon declaration validation, and one provider-free canonical linked archive with fact-helper readback. It does not support a configured semantic signal, forecast, trigger, review receipt, successor, or any `roadmap-delivery-trajectory-v1` population member.

## Candidate Routing

- `global/AGENTS.md` requires exactly one explicit Horizon declaration for new proposals, preserves archive and trajectory as independent dimensions, and scopes an unknown/missing capability to the affected same-Horizon dependent route.
- `openspec-propose` resolves current same-Horizon context through the exact active `delivery-trajectory-context.ts` helper before artifact writes; main alone evaluates the compact signal.
- `openspec-apply-change` consumes a matching terminal receipt before dependent implementation. Only measure/replan receipts admit a named successor; `continue` permits ordinary continuation, while `owner-required` and `unknown` create no successor and block only the exact unresolved action.
- `openspec-archive-change` runs trajectory routing only after canonical archive returns zero and final `status: archived`; legacy/none is `not-applicable`, no-trigger is ephemeral `none`, and route failure is `unknown` without changing archive status or bytes.
- `opsx-propose`, `opsx-apply`, and `opsx-archive` remain unchanged thin skill loaders. `global/bin/openspec-archive.ts` remains unchanged.

## Runtime Proof

Attempt r3 used a create-new local project and the package-owned OpenSpec template contract after two preserved fixture-shape diagnostics. The existing main capability passed strict validation before archive, the linked change passed strict validation, and the propose operation gate returned zero with `Delivery Horizon 'phase-fixture' exists and has valid contained references.`

The canonical invocation was:

```text
node <global-source>/bin/openspec-archive.ts --root . --change task-4-1-fixture -- node -e "process.exit(0)"
```

Observed output:

- exit `0`;
- `status: archived`;
- `archivedAs: 2026-08-29-task-4-1-fixture`;
- `specsUpdated: true`;
- totals `added=1`, `modified=0`, `removed=0`, `renamed=0`;
- no warning;
- no active change remained;
- no Horizon review directory or receipt existed;
- strict all-spec validation passed `1/1` after archive.

All archived planning and delta-spec bytes matched their pre-archive SHA-256 values:

| Artifact | SHA-256 |
| --- | --- |
| `proposal.md` | `18624de1ca49e87b18cd7ea22942a1019c5b95bbda9714c417d72bcb2891448c` |
| `design.md` | `d38caa96da3fe40043276d71cae1d5923a1c2d6aca7a4b85bd8722c2da8bf3f1` |
| `tasks.md` | `1bc9097c4f9b6616a999f9f6cce1937f3e5e538e72cd8670cac62f49fb1323f8` |
| `history.md` | `251b6c7787ae1207397df676e1d5e8855fbd8e752dbc9038677add6195000376` |
| `specs/fixture-capability/spec.md` | `ec7bbf85057eebca1742cb18e9cc9b03edf1f065e83e4e2c947376a645cd4b40` |

Absolute-root fact-helper readback returned `status: complete`, `semanticInference: false`, one exact linked archive, privacy-safe relative paths/digests/sizes, and zero writes, model calls, provider calls, network calls, OpenSpec operations, Git operations, or process starts.

## Preserved Diagnostics

- r1 archive and context behavior passed, but the first helper call correctly rejected relative `--root` and strict all-spec validation exposed a missing `Purpose` section in the disposable main spec.
- r2 again archived and preserved bytes, but strict main-spec validation isolated `Purpose section is too brief (less than 50 characters)`.
- Strategy history records the shift from manual shape retries to the causally different package-template and strict prevalidation mechanism used by r3.

## Instruction Owner Review

Read-only `instruction-artifact-reviewer` session `ses_fb4102d65ffe4rauOEpzD31YZE`, Effective Model `xai/grok-4.6`, inspected pre-correction candidate digest `d5fa28dbaad0ba8a3bc0b0ab3ed6a865e6e3b367` and reported `IG-T41-001` and `IG-T41-002`. Main reproduced both: propose evaluated after writes without invoking the fact helper, and apply could read a valid `continue` receipt as requiring a successor. Candidate `routing-r2` moves propose context/signal evaluation before writes, binds the exact helper and main-owned semantics, and makes disposition-specific successor behavior explicit. The strengthened focused contract fails closed on those ordering and disposition markers.

## Validation And Cleanup

- `npm.cmd run test:focused:contracts`: exit `0`, `72` tests.
- `npm.cmd run test:focused:library`: exit `0`, `187` tests before the route-only correction; the correction changed no library/runtime implementation.
- `npm.cmd run test:focused:openspec-gate`: exit `0`, `23` tests.
- `npm.cmd run test:focused:roadmap-delivery-trajectory`: exit `0`, `4` groups.
- `npm.cmd run test:focused:instruction-context`: exit `0`, `15` tests.
- Scoped `git diff --check`: no whitespace errors; only expected LF-to-CRLF warnings.
- Disposable r1, r2, and r3 project roots were present before cleanup and absent afterward. No writer, session, or process remains.
- Installation, activation, configured model calls, consumer mutation, commit, push, release, deployment, remote mutation, and credential use were not performed.
