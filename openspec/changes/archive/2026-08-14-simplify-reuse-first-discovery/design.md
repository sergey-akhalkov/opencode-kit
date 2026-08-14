## Context

Commit `06833cf` introduced two different ideas together: a useful proportional reuse-first trigger and a much broader private registry/inventory product. The registry product includes a natural-language command, scanner, schema, generated inventory, cache, outbox, promotion workflow, template, and a large proof runner. Its owning OpenSpec change never reached a loaded happy path, 11 tasks remained incomplete, no machine-local registry binding is configured, and later repository work has used current-repository plus configured cross-project graph/search evidence instead.

The current machine-local instruction layer already supplies a stricter Graphify-specific gate for Mekha projects. That file is ignored and intentionally owns personal project scope, refresh routing, and concrete tool names. Portable committed instructions must remain usable when Graphify, Codebase Memory, or another cross-project index is absent.

This is a Material instruction-behavior change because it changes loaded reuse routing and removes a slash command. It does not change credentials, install providers, mutate remote state, or migrate persisted user data. The abandoned registry change preserves all historical source/evidence attribution under `openspec/changes/archive/2026-08-14-abandoned-adopt-reuse-first-capability-discovery/` without synchronizing its delta specs.

## Goals / Non-Goals

**Goals:**

- Retain the precise new-mechanism trigger and trivial-work opt-out.
- Keep discovery bounded, cheapest-first, source-verified, and tool-neutral.
- Let an explicit repository or machine-local layer select Graphify, Codebase Memory, or another configured cross-project source.
- Remove unconfigured registry/inventory runtime, command, template, proof, package, profile, and documentation surfaces without compatibility shims.
- Add the smallest current normative contract and loaded behavior proof for the retained workflow.

**Non-Goals:**

- Build or migrate a private registry, catalog, project inventory, cache, outbox, or promotion protocol.
- Install, configure, or refresh Graphify or another code-intelligence service.
- Define organization-wide project allowlists in portable instructions.
- Search every indexed project, copy peer source, install a dependency, or perform remote mutation.
- Guarantee discovery completeness or automatically determine contract fit.

## Decisions

### D1. Remove the private registry subsystem rather than retain a compatibility layer

Delete the command, CLI, registry modules, template, package entry, profile/catalog references, and registry-specific proof runner. The removed surface has no configured current consumer, its full accepted behavior was not implemented, and keeping a deprecated adapter would preserve the same maintenance and instruction ownership without user value.

Alternative: finish the original registry increment. Rejected because incremental refresh, cache fallback, privacy lanes, candidate qualification, full loaded proof, SDET, and final synchronization remain incomplete while current work already has a configured cross-project discovery route.

Alternative: keep the CLI hidden for future use. Rejected because hidden unproved product code remains a public maintenance and validation obligation and can be rediscovered as apparent authority.

### D2. Keep portable cross-project discovery tool-neutral

The global skill requires an explicitly configured and authorized cross-project source, bounded capability terms, targeted current-source inspection, and an explicit degraded result when unavailable. Repository and machine-local instruction layers may tighten this with a concrete graph, group, refresh procedure, or project set. Portable global text does not name private projects, local paths, or one mandatory MCP product.

Alternative: hard-code Graphify globally. Rejected because the portable kit must work for users without that service and must not embed the current maintainer's project topology.

Alternative: omit cross-project discovery globally and rely entirely on local instructions. Rejected because the reusable skill still needs a complete safe fallback contract and source-verification rule.

### D3. Keep one lazy skill and no slash command

`global/AGENTS.md` owns the compact trigger and required disposition. `global/skills/reuse-discovery/SKILL.md` owns search order, source verification, degraded handling, and output fields. No command is needed because inventory is no longer an accepted outcome and ordinary new-mechanism work already triggers the skill.

Alternative: retain `/reuse-inventory` as a generic search command. Rejected because its name and prompt promise mutation and checkpoint behavior that no retained owner provides.

### D4. Replace registry impact with a source-coverage disposition

Triggered work records the requested capability/trigger, sources reached and blocked, material candidates, `reuse | extend | build-minimal`, and contract/total-cost reason. It records the cross-project layer as `verified | degraded | not-applicable`. It does not report `synced | pending | not-applicable` because no registry state exists.

### D5. Prove the loaded decision boundary before broader validation

Fidelity ladder:

1. Provider-free source, loader, catalog, and structural validation.
2. Fresh installed OpenCode process with one synthetic new-mechanism request and one matched trivial-fix request under a read-only/no-product-mutation envelope.
3. Future ordinary project use with its configured cross-project source; no external or remote operation is required for this change.

The Product Candidate is the loaded trigger/skill plus removed runtime/catalog surfaces. The Proof Runner narrows the existing `tools/proofs/reuse-discovery.ts` owner to two matched scenarios and existing OpenCode process/profile conventions without preserving the registry fixture system. The Evaluator checks exact observable facts: skill use only for the triggered case, bounded source order, source verification or explicit degraded result, disposition, no registry call, trivial-fix opt-out, loader absence of `/reuse-inventory`, and cleanup. Environment identity includes the candidate source hash, OpenCode version, model/profile, permission envelope, and loaded config source.

## Failure Model and Diagnostics

- Missing or unavailable cross-project tooling produces `degraded`, not an empty-success claim or a blocked local implementation.
- A selected peer candidate without readable current source remains unverified and cannot support `reuse`.
- Ambiguous project identity or unsafe broad enumeration stops that layer and is reported explicitly.
- Public ecosystem research remains read-only and cannot authorize dependency mutation.
- Proof failure preserves exit status, stdout/stderr, raw events, candidate/environment identity, side effects, and cleanup before correction or another provider attempt.

## Risks / Trade-offs

- **[Removing registry code discards a possible future curated catalog]** -> Historical design and evidence remain in the abandoned archive; a future independently justified change can reuse verified concepts rather than carrying active dead code.
- **[Tool-neutral wording can be less operationally specific]** -> The machine-local layer supplies the current Graphify procedure, while the global skill requires explicit scope, bounded terms, source verification, and degraded evidence.
- **[Cross-project search can be stale or noisy]** -> Treat indexes as discovery only and inspect current selected source before reuse.
- **[Removing a command is a breaking loader change]** -> README/profile/catalog are updated together, loader absence is proven, and running sessions are told to restart.
- **[Model behavior can regress]** -> Use matched fresh loaded triggered/trivial scenarios and fresh critical-only SDET before freeze.

## Migration Plan

1. Preserve the original change as `abandoned-incomplete` with unsynchronized main specs.
2. Capture current source/inventory identity and verify the replacement proposal/design/spec/tasks before production mutation.
3. Remove registry/inventory/proof surfaces and narrow the loaded skill/trigger/docs in one coherent candidate.
4. Invoke the actual loaded OpenCode entry point for triggered and trivial scenarios; correct only accepted-outcome or non-deferrable defects until current Runtime Proof is green.
5. Synchronize current normative specs and focused structural contracts, then complete fresh critical-only SDET and project validation.
6. Record restart requirements and stable local handoff. Do not install, activate, commit, push, or archive this replacement change unless separately requested.

Rollback restores only this replacement candidate's removed product/instruction/docs/spec/test paths from version control while preserving the abandoned historical change and unrelated work. Because no registry is configured and no user data is migrated, there is no persisted-state rollback.

## Open Questions

No current-increment product decision remains open. A future curated private registry requires a new accepted outcome and proof boundary rather than a compatibility promise in this change.
