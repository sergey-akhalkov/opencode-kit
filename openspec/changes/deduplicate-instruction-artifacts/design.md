## Context

The kit documents its core contract — the Universal Development Loop — four times, with subtle drift between versions. `docs/universal-development-loop.md` (31 lines, kit-level) and `instructions/universal-development-loop.md` (45 lines, project-level) differ in their Token/Time Rules, Quality Defaults, and Output Shape sections. `instructions/reusable-project-agent-instructions.md` (87 lines) and `templates/project/AGENTS.md` (57 lines) inline the loop into project-level templates. The validator (`tools/validate-library.ts`) checks that the canonical token strings appear in each location but cannot catch rewordings.

The reviewer agent contract is the second duplication: `instruction:inventory --format markdown` shows `Prevention Feedback`, `Recurrence Path`, `Draft Rule`, `Replay Evidence`, and `Actionable Continuation Items` blocks appearing 14 times each across the reviewer agents. Any edit to the contract requires editing 14 files in lockstep.

The project feedback README exists in two forms: `docs/feedbacks/README.md` (57 lines, full template) and `templates/project/docs/feedbacks/README.md` (20 lines, abbreviated). `tools/init-project.ts` copies the abbreviated version, leaving the canonical kit-level template unused in projects.

Finally, two files share the name `AGENTS.md`: the kit's repository-level rules (77 lines) and the runtime global instructions (121 lines). Both files exist for valid reasons (different audiences), but the duplicate name confuses contributors.

Stakeholders: kit maintainers, downstream consumers of the template bootstrap, and reviewer agents that depend on the contract text.

## Goals / Non-Goals

**Goals:**

- One canonical Universal Development Loop source.
- One canonical reviewer agent contract source.
- One canonical feedback README source, copied unchanged into bootstrap projects.
- Validator rejects duplicate inline restatements so future drift cannot reappear.

**Non-Goals:**

- Rewrite the contract itself (separate follow-up).
- Add new reviewer agents or skills.
- Change the AGENTS.md runtime semantics — only rename the repo-level file or move its content.
- Modify how `complain` or `feedback-ledger` operate.

## Decisions

### D1 — Canonical UDL lives in `instructions/universal-development-loop.md`

**Choice**: The project-level instruction wins because projects consume it directly when they include `instructions/` content in their `AGENTS.md`. The kit docs become a pointer.

**Rationale**: Today both versions drift. Choosing the longer project version preserves the Token/Time Rules, Quality Defaults, and Output Shape sections that downstream agents depend on. The kit doc loses those because it ships to library maintainers who do not need them.

**Alternatives considered**:

- *Make the kit version canonical*: rejected; loses Token/Time and Output Shape for downstream consumers.
- *Merge both into one new file*: rejected; the change becomes too large to review.

### D2 — Reviewer contract lives in `instructions/leaf-reviewer-agent-contract.md`

**Choice**: Keep the existing instruction template file as the single source; each reviewer agent adds a `## Contract Reference` block (3-5 lines) instead of repeating the 30-line contract body.

**Rationale**: The file already exists with full text. Reference-based inclusion is the lightest change that removes duplication without rewriting the contract.

**Alternatives considered**:

- *Inline the full body once in a shared snippet*: rejected; OpenCode agent bodies are not snippets.
- *Force validator to assemble the body at build time*: rejected; too magical for a one-shot cleanup change.

### D3 — Project feedback README is generated from kit-level README

**Choice**: Delete `templates/project/docs/feedbacks/README.md`. `tools/init-project.ts` reads `docs/feedbacks/README.md` from the kit root and copies it verbatim.

**Rationale**: One source means one place to update. The 20-line abbreviated version loses information (no template block, no Entry Template example).

**Alternatives considered**:

- *Keep both with a sync test*: rejected; adds maintenance burden.
- *Generate at validator time*: rejected; init-project is the right place to materialize project assets.

### D4 — Rename repo-level `AGENTS.md` to `REPO_AGENTS.md`

**Choice**: Rename `AGENTS.md` (77 lines) to `REPO_AGENTS.md`. Keep `global/AGENTS.md` (121 lines) unchanged as the runtime instruction file.

**Rationale**: The runtime `global/AGENTS.md` is the one OpenCode loads. The repo-level file is contributor-facing library policy. Different filenames make the audience obvious.

**Alternatives considered**:

- *Move content to `docs/curation.md`*: rejected; the rules are operational, not documentation.
- *Keep both names, add `<!-- audience: maintainer -->` header*: rejected; comment-based hints are fragile.

### D5 — Validator gains two new error rules

**Choice**: `tools/validate-library.ts` (or its successor module under `tools/validators/`) gains:

- A rule that fails if the Universal Development Loop step list appears in any artifact other than `instructions/universal-development-loop.md`.
- A rule that fails if a reviewer agent contains the Leaf Contract, Feedback Ledger, or Prevention Feedback block inline instead of a `## Contract Reference`.

**Rationale**: The validator is the only mechanism that survives editor turnover. Token-presence checks catch drift; future regressions will fail `npm run validate`.

## Risks / Trade-offs

- **[Risk] Removing inline blocks breaks downstream agents that pattern-match the inline text** → Add a regression test that runs `npm run validate` against the fixture repo from CHG-001; the fixture reviewer agent must include a `## Contract Reference` and pass.
- **[Risk] Renaming `AGENTS.md` to `REPO_AGENTS.md` breaks anyone scripting against the old name** → README and AGENTS.md cross-reference update; document in `CHANGELOG` and the next `README.md` Token Economy section.
- **[Risk] Generated project README loses the abbreviated shape that some teams preferred** → The full README is strictly more informative; no documented consumer relied on the abbreviated form.
- **[Risk] `instruction:feedback` ledger entries reference `docs/feedbacks/README.md` path; renaming repo `AGENTS.md` does not affect this** → Verified; ledger path is `docs/feedbacks/<source>.md`, not the AGENTS.md name.

## Migration Plan

1. Add the canonical-source validator rules behind a feature flag (or, simpler, ship the rule together with the first agent that adopts the reference form).
2. Convert one reviewer agent to reference form; confirm validator passes.
3. Convert remaining reviewer agents in a single batch.
4. Delete the project feedback README template; update `init-project.ts` to copy from kit.
5. Replace the kit docs UDL with a pointer.
6. Replace the project template AGENTS.md UDL with a pointer.
7. Rename repo-level `AGENTS.md` to `REPO_AGENTS.md`; update `package.json` and any cross-references.
8. Re-run `npm run validate:strict` and `npm test`; both must pass.

## Open Questions

- Should `instructions/leaf-reviewer-agent-contract.md` itself be auto-generated from a single source? Recommendation: leave manual for now; revisit only after this change lands.
- Should the canonical UDL be split into a short "user contract" (for humans) and a long "implementation contract" (for agents)? Recommendation: no; keep one file but tag each section with audience.