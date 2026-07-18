## Context

The kit's portable SDLC is instruction-only. Static contracts and validators currently ratchet the old universal-ceremony model. Simplifying prose without updating validators would either fail validation or leave agents under contradictory pressure. The design therefore deletes/narrows ceremony at canonical sources and rewrites deterministic checks in lockstep.

## Goals / Non-Goals

**Goals**

- Ordinary Small default path is always-loaded and unambiguous.
- Full qualification remains available and fail-closed for named Material risks and explicit Change-Ready.
- Scope expansion requires explicit user approval.
- Validators enforce new positives and reject old universal anti-patterns.
- Combined AGENTS + skill token/line cost decreases.

**Non-Goals**

- No new runtime product, hash algorithm, identity service, or workflow engine.
- No historical OpenSpec rewrite.
- No test authorship in production slice.

## Decisions

### D1. Mode name: Ordinary Small

Use `Ordinary Small` (not `Delivery` or bare `Small`) in always-loaded routing to avoid creating another readiness workflow. Portable delivery text may still mention `Small` as a synonym alias where needed for binding surfaces.

### D2. Qualification is conditional

Load `change-ready-sdlc` only for:

- explicit Change-Ready request;
- project-required qualification;
- concrete named Material risks (public API/protocol/compatibility; persisted data/migration; security/privacy/authorization; destructive/remote; concurrency correctness; deployment/release; loaded instruction/config altering lifecycle/safety policy).

Unknown escalates only when it can materially change accepted behavior or a named risk domain.

### D3. Ordinary completion label

Ordinary completion reports `Change-Ready: not requested`. Only the qualification path emits `yes|no`.

### D4. Test ownership split

- Ordinary Small: main may author the smallest focused regression test after happy-path proof; prefer existing tests.
- Material/qualification: fresh SDET owns systematic automated-test authorship after Applicable Proof. Production authors never author tests.

### D5. Candidate continuity

Remove portable mandatory `Semantic Candidate Identity`, `Package Identity`, and `Identity Recipe`. Qualification uses project-native **Candidate Reference** (diff/snapshot/manifest/revision/equivalent). Ordinary Small does not require it.

### D6. Concurrent writer safety retained proportionally

Keep universal writer attempt closure for actual asynchronous/concurrent mutation-capable executions. Do not impose full liveness protocol on ordinary synchronous direct edits.

### D7. Rollback proportional

Detailed rollback evidence is required when migration, destructive state, deployment/activation, or substantial multi-surface risk makes it relevant. Execution remains separately authorized and never required to claim Change-Ready.

### D8. Validator strategy

Replace exact token arrays that preserve universal identities/rollback/SDET/main-edit bans with:

- required positive tokens for Ordinary Small, scope-expansion approval, Material triggers, `Change-Ready: not requested`, role separation when invoked, unrelated-work/remote safety;
- forbidden exact anti-pattern needles for old universal rules;
- ordered skill headings for the simplified qualification lifecycle (Candidate Reference instead of Candidate Freeze identity ceremony).

### D9. Deletion strategy

Edit canonical sources in place. Do not add a second override paragraph that leaves the old mandatory rules intact. Historical OpenSpec remains untouched.

### D10. Baseline debt attribution

Do not touch `tools/test-library/validator-2.ts`. Report it as unrelated baseline debt if inventories flag it.

## Risks / Trade-offs

- **Risk:** Frozen contract tests still expect old tokens until SDET updates them. **Mitigation:** Production slice leaves tests to fresh SDET; main must not treat pre-SDET `npm test` failure as production defect without SDET assessment.
- **Risk:** Agents may under-escalate true Material work. **Mitigation:** Named high-risk list remains explicit; high-risk must not be downgraded for small diffs; ambiguous public/security/data semantics still block/ask.
- **Risk:** Validators become too loose. **Mitigation:** Keep frontmatter, permissions, path, project-neutrality, and positive Ordinary Small / Material trigger checks.

## Migration Plan

1. Land production instruction/contract/validator/doc candidate.
2. Fresh SDET updates tests.
3. Run full validation inventories and qualification reviews.
4. Archive this change after acceptance (separate authority).

## Open Questions

None for implementers. Owner approved the audit plan and acceptance criteria before mutation.
