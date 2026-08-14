## Why

The shipped reuse-first trigger is useful, but its private registry, inventory command, scanner, cache, outbox, and promotion protocol were committed from an incomplete change with no configured current consumer and no green loaded happy path. Current work already uses bounded source discovery through repository, platform/dependency, and explicitly configured cross-project code-intelligence layers, so retaining the unproved parallel registry increases maintenance and instruction cost without current user value.

## Outcome Capsule

- **Outcome:** Retain one proportional reuse-first workflow for changes that introduce a new mechanism, using current-repository, platform/dependency, explicitly configured cross-project, and bounded ecosystem evidence before `build-minimal`, while removing the unused private registry and inventory subsystem.
- **Operating Envelope:** Loaded project-neutral OpenCode instructions and one lazy skill; local source/search tools and explicitly configured cross-project indexes or graphs; targeted source verification; read-only ecosystem research when applicable and authorized; fresh disposable OpenCode proof with non-sensitive prompts and no product mutation.
- **Non-Goals:** No private capability registry, `/reuse-inventory` command, project scanner, generated inventory, cache, outbox, capability promotion, MCP installation/configuration, all-project enumeration, source copying, dependency installation, publication, remote mutation, or claim that one cross-project tool is universally available.
- **Non-Deferrable Invariants:** Trivial/local/mechanical work remains ceremony-free; triggered work searches the current repository and platform/dependencies first; cross-project search uses only an explicitly configured and authorized scope; selected candidates are verified against current source before reuse; unavailable or stale cross-project evidence is reported as degraded; discovery never authorizes installation or remote mutation; machine-local project names, paths, and tool routing remain outside committed portable instructions.
- **Observable Proof:** A fresh OpenCode process loading the actual global source handles one new-mechanism scenario by loading reuse guidance, searching bounded sources, inspecting current-repository candidates, explicitly reporting the unavailable cross-project layer as `degraded`, and returning one `reuse | extend | build-minimal` disposition without registry calls. A matched trivial-fix scenario performs no reuse-skill or cross-project discovery ceremony. Loader inventory confirms the removed command is absent.
- **Material Residual Risks:** Model adherence remains sensitive to model/runtime versions; configured cross-project indexes can be stale or incomplete; vocabulary mismatch can miss candidates; a degraded layer can still permit duplicate minimal implementation. Current source verification and explicit degraded evidence contain but do not eliminate those risks.
- **Stop Line:** Stop after the registry/inventory product and proof surfaces are removed, the compact trigger and lazy skill are synchronized with current normative specs and docs, fresh loaded new-mechanism and trivial-fix proof is green, critical-only SDET is terminal, applicable repository validation passes, and a local stable handoff is complete. Do not install/configure a graph provider, scan private projects broadly, adopt a dependency, archive another completed change, commit, push, release, or mutate remote state.

## What Changes

- **BREAKING:** Remove `/reuse-inventory`, the `reuse:registry` CLI/package surface, private registry template, deterministic registry/scanner modules, and the registry-specific proof runner and historical runtime catalog entry.
- Narrow `reuse-discovery` to one job: bounded reuse-first discovery before production when a change introduces a new mechanism.
- Search in a stable order: remove/narrow, current repository, platform and installed dependencies, explicitly configured cross-project source intelligence, bounded public ecosystem research, then the smallest concrete `build-minimal` owner.
- Require source verification and an explicit degraded cross-project result without requiring registration, sync, or inventory state.
- Keep Graphify, Codebase Memory, paths, project groups, and refresh commands in machine-local or repository-specific instruction layers rather than portable global authority.
- Add current normative requirements and focused loaded-behavior evidence for the retained workflow and trivial-fix opt-out.

## Capabilities

### New Capabilities

- `library-reuse-discovery`: Defines the proportional trigger, bounded search order, explicit cross-project scope, source verification, degraded behavior, disposition, and trivial-fix opt-out without a private registry.

### Modified Capabilities

- `library-change-ready-sdlc`: Makes the compact reuse-first decision boundary explicit while preserving outcome-first narrowing and proportional Ordinary Small work.
- `library-instruction-artifacts`: Requires one canonical loaded trigger, one lazy cohesive skill, no inventory command, no registry protocol duplication, and fresh loaded behavior evidence.

## Impact

- Loaded instruction behavior: `global/AGENTS.md` and `global/skills/reuse-discovery/SKILL.md`.
- Removed runtime surfaces: `global/commands/reuse-inventory.md`, `global/bin/reuse-registry.ts`, `global/bin/reuse-registry/**`, `global/reuse-registry-template/**`, and registry-specific package/profile/catalog references.
- Replaced proof surface: `tools/proofs/reuse-discovery.ts` becomes a thin two-scenario loaded-behavior runner using existing OpenCode process/profile conventions without retaining the registry fixture system.
- Normative/docs/contracts: current OpenSpec specs, README/profile catalog, instruction markers, and focused validation as needed.
- No dependency, public network API, persisted user data, credential, installation, activation, deployment, release, or remote-state impact.
