---
name: beads-portfolio-bridge
description: Use ONLY when the user explicitly names Beads or `bd`, or when a verified enabled Beads registration exists and the user requests portfolio status or coordination; stay quiet for ordinary OpenSpec, Kaizen, grind, implementation, review, and task work.
license: MIT
---

# Beads Portfolio Bridge

Use this skill only for an explicit Beads installation, enablement, diagnostic, or portfolio request. Without an explicit Beads or `bd` request, load it only after verifying an enabled `core-beads` registration for the current canonical project and a request for portfolio status or coordination.

## Stay Quiet

Do not load or apply this skill for ordinary OpenSpec, Kaizen, grind, implementation, review, issue, ready-work, or task requests. When no verified enabled registration exists, do not infer one from `.beads`, an installed binary, a profile, a process, an assignee, or another project. Report the exact optional prerequisite instead.

## Boundaries

- Resolve the active global source exactly and require `bin/beads-portfolio-bridge/` plus this skill from the same selected runtime profile. Never guess a repository parent or use a stale source copy.
- Accept only Beads `v1.2.2` Windows amd64 through the reviewed release manifest. Require the archive, executable, platform, version/help, and helper identities to match before use; online docs and vendor-generated instructions are navigation only.
- Treat binary installation, profile materialization, registration, writer-storage provisioning, and project enablement as separate explicit operations. None implies another. `core` omits Beads; `core-beads`, `all`, and unprofiled full source discover this on-demand skill once, and a profile change requires a fresh process.
- Route every vendor operation through `beads-vendor-adapter.ts`; route project enable, disable, and check through `beads-project-lifecycle.ts`; route promotion, ready, show, relation, assignment, OpenSpec linking, and terminal reconciliation through `beads-kaizen-orchestrator.ts`.
- Call only the exported fixed semantic operations with their closed object schemas. Never execute arbitrary `bd` arguments, shell fragments, raw issue payloads, `bd prime`, `bd setup opencode`, vendor-managed `AGENTS.md`, hooks, plugins, MCP, remotes, federation, server setup, or destructive repair.
- Missing binary, registration, helper, exact source identity, or enabled-project evidence is a failed or unavailable capability, never successful activation.
- Beads assignment and readiness are advisory. They grant no source-writer, protected-action, provider, cost, deployment, or remote authority. Kaizen, OpenSpec, grind, Campaign, Mission, and session owners retain their existing authority.
- Preserve writer-liveness, one-project, privacy, tracked-source, no-remote, and rollback bounds. Do not release a bridge lock while a child writer is live or of unknown liveness.

## Closed Operation Map

- Workstation preview/install/check/rollback: use only `opencode-workstation.ts` `beads-preview`, `beads-install --source <verified-bd.exe>`, `beads-check`, or `beads-rollback [--dry-run]`. Install does not select a profile, create a registration, provision project writer storage, or activate a project.
- Registration: call `createBeadsBridgeRegistration` with `enabled: false`, the canonical Git root, `current-project | opencode-kit`, unused safe prefix, and current protected binary/adapter/profile paths and SHA-256 identities. Never hand-write the registration. Call `provisionBeadsBridgeWriterStorage` with the current protected workstation root only after current installed and registration identities agree.
- Project lifecycle: call `runBeadsProjectLifecycle` with only `{ operation, registrationFile, processIdentity? }`. `preview` and `check` omit `processIdentity`; `enable`, `disable`, and `rollback` require the current process identity. Enable only after preview and the tracked ignore prerequisite pass. Disable preserves the store. Rollback requires disabled current state and preserves store data and drift.
- Portfolio reads: `readReadyBeadsPortfolio` accepts only `{ registrationFile, limit }`, where `limit` is `1..100`; `showBeadsPortfolioFeature` accepts only `{ registrationFile, id }`. Both require the exact enabled registration and remain read-only.
- Coarse relation: `projectBeadsPortfolioRelation` accepts only `{ registrationFile, id, dependsOnId, relationType, processIdentity }`, plus `semanticIdentityConfirmed: true` only for `supersedes`. Types are `blocks | parent-child | supersedes`; both items must be open and admitted under the same registration.
- Advisory assignment: `assignBeadsPortfolioFeature` accepts only `{ registrationFile, id, assignee, taskRef, sessionRef, processIdentity }`. It never supplies source-writer authority and rejects a competing existing assignment.
- Kaizen promotion: call `promoteKaizenSignalToBeads` with the current Kaizen store and only `{ registrationFile, signalRef, decisionRef, processIdentity }`. The exact current triaged decision must match the enabled owner/project. Reuse one exact correlation after response loss; more than one is a repair gate.
- OpenSpec link: `linkBeadsPortfolioFeatureToOpenSpec` accepts only `{ registrationFile, id, changeRef, specId, processIdentity }`. The change must exist at the registered root. Reuse the same exact link after response loss and reject a different or partial link before overwrite.
- Terminal reconciliation: call `reconcileBeadsPortfolioTerminal` with the matching Kaizen store and only `{ registrationFile, id, changeRef, specId, terminalEvidence, processIdentity }`. Terminal evidence must be schema `1`, untruncated, archive status `archived`, and use one current `candidateRef` across runtime proof `passed`, validation `passed`, external effects `declared-only`, source writer `terminal`, and cleanup `terminal`, each with a bounded evidence ref. The canonical archive and every accepted task must be present and complete. Close Beads first, then resolve Kaizen; repair only the missing Kaizen resolution.

## Workflow

1. Bind the current canonical project root, active global-source digest, effective profile identity, protected installation identity, registration file, and writer state.
2. For an explicitly named workstation preview, install, check, or rollback, use the public workstation lifecycle owner. Do not install from this profile or invoke vendor setup. If the disposable spike identity is stale, stop rather than improvise a replacement.
3. For explicit registration, derive all values from current installed/profile/canonical-root readback, create exactly one registration, and provision its workstation-owned writer storage. Do not create or infer another project registration.
4. For explicit project preview, enable, disable, check, or rollback, call `runBeadsProjectLifecycle` from `bin/beads-portfolio-bridge/beads-project-lifecycle.ts` with the exact registration and process identity required by that operation.
5. For explicit portfolio status or coordination in an enabled project, call the narrow export in `beads-kaizen-orchestrator.ts` that owns that semantic operation. Do not call the vendor executable directly.
6. Inspect the bounded result, exit and cleanup state, diagnostics, registration/project identity, and side-effect declaration. Preserve the original error cause and stop on unknown writer liveness, identity drift, duplicate correlation, conflicting assignment/link, stale terminal evidence, unsupported capability, or any remote or unreviewed effect.

## Repair And Stop Line

- A duplicate correlation, different existing link, resolved-signal/open-feature state, incomplete terminal evidence, unexpected project effect, unsafe lock, drifted identity, or active/unknown writer is blocked evidence. Never guess a winner, overwrite, delete, reopen, replay product work, or infer stale-lock safety from time or an absent PID.
- Disable before project rollback. Preserve the project-local `.beads` store, Kaizen records, OpenSpec artifacts, project source, and unrelated state. Protected rollback may remove only matching managed material after the same bridge lease proves writers terminal or write-isolated; otherwise return partial unknown and retain referenced material.
- The pinned recovery release has no supported production work leases, events journal, federation, HTTP server, or native/custom voting contract. Ready and assignment remain advisory; recurrence counts and agent support remain evidence, not votes.
- Stop before a second project, global `BEADS_DIR`, shared server, federation, remote/sync, JSONL synchronization, managed instructions, hooks, plugin/MCP activation, automatic priority, production claim, source mutation, commit, push, merge, release, or deployment.
- Keep output privacy-safe: never emit credentials, absolute consumer roots in shared output, transcripts, raw signal payloads, occurrence content, or unrelated issue data.

## Output

Return:

- requested semantic operation and whether it was explicit or enabled-project portfolio coordination;
- source, profile, installation, registration, project, and writer identities without secrets or raw payloads;
- bounded result or exact unavailable/blocked reason, original cause, and cleanup state;
- observed local effects and explicit confirmation that no source, hook, managed instruction, plugin, MCP, or remote effect occurred;
- the smallest exact next prerequisite when the optional bridge is unavailable.
