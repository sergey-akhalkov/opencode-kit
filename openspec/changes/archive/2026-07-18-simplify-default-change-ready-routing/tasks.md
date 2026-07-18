## 1. OpenSpec planning

- [x] 1.1 Create `openspec/changes/simplify-default-change-ready-routing/` with `.openspec.yaml`, `proposal.md`, `design.md`, delta spec, and this `tasks.md`
- [x] 1.2 State supersession of ordinary-routing/universal-ceremony parts of `add-lightweight-sdet-pr-ready-sdlc` without rewriting that history

## 2. Runtime authority

- [x] 2.1 Rewrite `global/AGENTS.md` Change-Ready routing for Ordinary Small default, scope-expansion approval, Material triggers, and qualification path
- [x] 2.2 Simplify `global/skills/change-ready-sdlc/SKILL.md` to conditional qualification lifecycle with Candidate Reference
- [x] 2.3 Update briefing, implementation, review, parallel-work, and risk-test sections in `global/AGENTS.md` for proportional Ordinary Small vs Material

## 3. Role prompts

- [x] 3.1 Simplify `implementation-worker` continuation to Candidate Reference + reproducer
- [x] 3.2 Simplify `sdet-quality-engineer` to single report action without dual-identity handshake
- [x] 3.3 Simplify `final-candidate-reviewer` as qualification gate with optional Candidate Reference
- [x] 3.4 Simplify `session-delivery-reviewer` continuity/rollback to proportional Candidate Reference evidence
- [x] 3.5 Update `implementation-readiness-reviewer` and `test-coverage-reviewer` so optional adapters/theoretical risks do not invent acceptance scope

## 4. Project routing and discovery docs

- [x] 4.1 Update `REPO_AGENTS.md`, `templates/project/AGENTS.md`, `instructions/reusable-project-agent-instructions.md`, and `instructions/universal-development-loop.md`
- [x] 4.2 Update `README.md` discovery/routing text to match runtime authority without duplicating the full skill

## 5. Static contracts and validators

- [x] 5.1 Rewrite `tools/contracts/skills.ts`, `implementation-worker.ts`, `sdet-quality-engineer.ts`, `agents.ts`, and `reviewer-binding.ts` for the new policy and anti-patterns
- [x] 5.2 Update `tools/validators/active-authority.ts` ordered skill headings and AGENTS authority checks
- [x] 5.3 Keep `tools/validators/skills.ts`, `routing.ts`, and `agents.ts` aligned with contract exports (no out-of-scope test edits)

## 6. Production proof handoff (main owns execution)

- [x] 6.1 Main: inspect changed runtime text and run observable fresh-context Ordinary Small routing proof
- [x] 6.2 Main: `npm run validate:strict` exits 0 with zero warnings
- [x] 6.3 Main: `npm run openspec:validate` passes this change and existing items
- [x] 6.4 Main: `npm run instruction:inventory -- --format markdown` shows reduced combined global/skill cost
- [x] 6.5 Main: code-quality inventory attributes unchanged `validator-2.ts` baseline debt; no new split candidate from this change

## 7. Fresh SDET (not this production slice)

- [x] 7.1 Fresh SDET: update/assess frozen contract and validator regression tests for new policy tokens
- [x] 7.2 Fresh SDET: ensure tests reject old universal anti-patterns and accept Ordinary Small default
- [x] 7.3 Main after SDET: `npm test` passes

## 8. Qualification gates (main/orchestrator after SDET)

- [x] 8.1 Fresh final-candidate review of the complete candidate
- [x] 8.2 Material delivery review (`session-delivery-reviewer`) accepts the final candidate
- [x] 8.3 `npm run openspec:gate -- --operation prepush` reported; unrelated active-change blockers attributed rather than fixed
- [x] 8.4 Archive this change only after accepted qualification (separately authorized; not part of production slice)
