## Why

Global Change-Ready instructions conflate ordinary implementation success with release-grade qualification. Agents invent requirements, widen scope, and over-engineer small requests because mandatory rules force full ceremony on every behavior change: load a large skill, treat unknown as Material, ban main-session production/test edits, require universal fresh SDET/final review, and mandate dual candidate identities plus Identity Recipe and full rollback.

An independent audit confirmed this systemic root cause. The owner approved simplification: ordinary clear, bounded, reversible work must default to the fastest successful path; full qualification is conditional.

## What Changes

- Create this superseding OpenSpec change for ordinary-routing and universal-ceremony policy. Do **not** rewrite historical `add-lightweight-sdet-pr-ready-sdlc` artifacts.
- Redefine always-loaded global routing so **Ordinary Small** is the default path: direct main production, observable happy-path proof, focused validation, optional smallest focused regression test after proof, and `Change-Ready: not requested`.
- Load `change-ready-sdlc` before mutation only for explicit Change-Ready, project-required qualification, or concrete named Material risks.
- Require explicit user approval before unrequested scope expansion (features, abstractions, compatibility layers, tooling, hardening, adjacent cleanup, new acceptance criteria).
- Replace universal dual-identity / Identity Recipe ceremony with optional project-native **Candidate Reference** on the qualification path only.
- Make SDET, final candidate review, Material delivery review, and detailed rollback proportional/conditional rather than universal for every behavior change.
- Synchronize role prompts, reusable/project routing docs, README discovery text, static contracts, and deterministic validators to enforce the new positive rules and reject old universal anti-patterns.
- Reduce combined `global/AGENTS.md` + `change-ready-sdlc/SKILL.md` content; do not add an override-only layer.

## Non-Goals

- No workflow engine, plugin, MCP server, durable state store, candidate hash helper, or new abstraction layer.
- No config migration, archive of the historical OpenSpec change, commit, push, remote action, or runtime restart in this production slice.
- No edits to `openspec/changes/add-lightweight-sdet-pr-ready-sdlc/**`, `openspec/changes/integrate-continuous-sdlc-learning/**`, or `docs/feedbacks/**`.
- No automated test authorship in the production slice (fresh SDET owns tests later).
- No fix for unrelated baseline debt in `tools/test-library/validator-2.ts`.

## Impact

- **Runtime authority:** `global/AGENTS.md`, `global/skills/change-ready-sdlc/SKILL.md`
- **Role prompts:** implementation-worker, sdet-quality-engineer, final-candidate-reviewer, session-delivery-reviewer, implementation-readiness-reviewer, test-coverage-reviewer
- **Project/routing docs:** `REPO_AGENTS.md`, `templates/project/AGENTS.md`, `instructions/reusable-project-agent-instructions.md`, `instructions/universal-development-loop.md`, `README.md`
- **Contracts/validators:** `tools/contracts/*` and `tools/validators/*` listed in the change tasks
- **Compatibility:** High-risk Material gates and role separation when SDET/final review are invoked remain. Ordinary Small no longer inherits universal qualification ceremony.
- **Supersession:** Ordinary-routing and universal-ceremony parts of completed `add-lightweight-sdet-pr-ready-sdlc` are superseded by this change's normative delta. Historical artifacts remain as history only.

## Rollout

1. Production author implements instruction/contract/validator/doc candidate.
2. Main proves ordinary-Small routing from fresh-context source inspection and runs `validate:strict` / `openspec:validate`.
3. Fresh SDET updates frozen contract tests and regression coverage.
4. Complete `npm test`, inventories, OpenSpec gate, fresh final review, and Material delivery review.
5. Archive this change only after qualification acceptance (separately authorized).
