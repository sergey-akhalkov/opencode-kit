# Documentation Hardening Ledger

- Scope: `docs/project-memory.md`
- Goal: Provide a source-verified operator guide for the implemented project-memory surface.
- Non-goals: New runtime behavior, arbitrary OpenCode versions, unknown-secret completeness, or a destructive cleanup command.
- Success Criteria: Continuous block coverage, exact implemented names/limits/actions, validated commands, and no unsupported lifecycle or safety claim.
- Stop Line: One operator guide plus evidence; do not duplicate the normative OpenSpec contract or add another documentation framework.
- Evidence policy: Documentation is a claim map; production source, schemas, package scripts, focused tests, and OpenSpec strict validation are authoritative.
- Current phase: final
- Progress: 8/8 blocks reviewed; 1 material finding fixed; 0 blocked; 0 needs re-review.

## File Inventory

| Path | Lines | Type | Status | Notes |
|---|---:|---|---|---|
| `docs/project-memory.md` | 176 | Operator guide | reviewed | New file; all blocks re-read after the one source-alignment fix. |

## Block Coverage

- [x] DB01 | `docs/project-memory.md:1-20` | purpose, precedence, activation, restart, rollback, data override | clean
- [x] DB02 | `docs/project-memory.md:21-88` | exact tool names, actions, fields, enums, output limits | finding fixed
- [x] DB03 | `docs/project-memory.md:89-103` | admission, staleness, revalidation, root/compaction behavior | clean
- [x] DB04 | `docs/project-memory.md:104-114` | Serena source role and bounds | clean
- [x] DB05 | `docs/project-memory.md:115-135` | layout, platform precedence, event and capsule limits | clean
- [x] DB06 | `docs/project-memory.md:136-143` | privacy, diagnostics, source independence | clean
- [x] DB07 | `docs/project-memory.md:144-157` | inspection, rollback, exact manual cleanup | clean
- [x] DB08 | `docs/project-memory.md:158-176` | maintained proof and focused commands | clean

## Block Reviews

### DB01 | `docs/project-memory.md:1-20`

- Claims: advisory precedence; exact startup enablement; restart requirement; inert disable; optional data base.
- Evidence checked: `createProjectMemoryFeature`, `createProjectMemoryPluginHooks`, `resolveProjectMemoryDataRoot`, proposal outcome capsule.
- Verdict: clean.
- Findings: none.
- Fix decision: none.
- Re-review: complete.

### DB02 | `docs/project-memory.md:21-88`

- Claims: two tools; candidate/promote/invalidate and recall schemas; immutable lifecycle; byte limits.
- Evidence checked: `RECALL_INPUT_SCHEMA`, `MANAGE_INPUT_SCHEMA`, `ProjectMemoryManageResult`, `toolResult`, focused tool-object proof.
- Verdict: finding fixed.
- Findings: F01 originally described enablement as requiring a valid Git worktree, while production validates a canonical project root and receives worktree identity from plugin input without performing its own Git check.
- Fix decision: narrowed the claim to a valid canonical project root.
- Re-review: complete.

### DB03 | `docs/project-memory.md:89-103`

- Claims: deterministic admission; weak miss; lifecycle/freshness/fingerprint exclusion; selected-ref revalidation; root-only/compaction behavior.
- Evidence checked: `recallProjectMemory`, `revalidateProjectMemorySelection`, `createProjectMemoryPluginHooks`, task `2.2` and `2.4` focused evidence.
- Verdict: clean.
- Findings: none.
- Fix decision: none.
- Re-review: complete.

### DB04 | `docs/project-memory.md:104-114`

- Claims: read-only direct Serena filesystem source; 100-file/512-KiB envelope; 2-KiB core; no MCP dependency or writes.
- Evidence checked: `readSerenaMemory`, task `2.3` evidence, maintained corpus Serena hash oracle.
- Verdict: clean.
- Findings: none.
- Fix decision: none.
- Re-review: complete.

### DB05 | `docs/project-memory.md:115-135`

- Claims: exact layout; platform data precedence; project hash; fixed card/event and render limits.
- Evidence checked: `resolveProjectMemoryDataRoot`, `resolveProjectMemoryStore`, fixed-slot constants, task `3.2` full-envelope proof.
- Verdict: clean.
- Findings: none.
- Fix decision: none.
- Re-review: complete.

### DB06 | `docs/project-memory.md:136-143`

- Claims: root-first plus existing redaction; no transcript/provider/network behavior; safe warnings; independent source failure.
- Evidence checked: `sanitizeMemoryText`, `createProjectMemoryPluginHooks`, task `2.5` evidence and hook warning oracle.
- Verdict: clean.
- Findings: none.
- Fix decision: none.
- Re-review: complete.

### DB07 | `docs/project-memory.md:144-157`

- Claims: no destructive cleanup tool; disable/stop/identify/backup/remove exact local directory; Serena remains separate.
- Evidence checked: registered tool schemas contain no delete action; manage result exposes `projectRef`; migration/rollback design.
- Verdict: clean.
- Findings: none.
- Fix decision: added the implemented `projectRef` source so exact-directory cleanup does not rely on guessing.
- Re-review: complete.

### DB08 | `docs/project-memory.md:158-176`

- Claims: exact package proof, focused test, and runner help commands; create-new evidence and provider-free effects.
- Evidence checked: `package.json`, isolated effect-free help probe, current package corpus capture, `tools/proofs/README.md`.
- Verdict: clean.
- Findings: none.
- Fix decision: none.
- Re-review: complete.

## Findings

- F01 | medium | DB02 | Production canonicalizes a project root but does not perform a Git check | A Git-only statement could mislead operators about the actual enablement guard | likely copied from the intended operating envelope rather than runtime validation | narrowed to canonical project root | fixed, re-reviewed, high confidence
