# Strategy History

## 2026-08-26 - Preserve or choose a hard instruction ceiling

- **Objective:** Bound instruction context while preserving required quality and safety contracts.
- **Approach:** Treat the existing `13,279`, `12,000`, `1,200`, discovery, and on-demand maxima as fixed growth brakes or select another numerical ceiling from current model context observations.
- **Evidence:** Canonical specs and `config/instruction-budget.json` encode snapshot maxima; current measurement was already near the core ceiling; loader-visible categories do not equal one prompt; observed provider/model windows differ and no maintained outcome study derives any current maximum.
- **Outcome:** Rejected for this change.
- **Reason:** A historical size snapshot is not a demonstrated quality, prompt-inclusion, or provider boundary and can force deletion of unique authority without detecting duplicated or contradictory text.
- **Do-Not-Repeat Condition:** Do not propose another universal hard ceiling from inventory size, one provider window, or prior candidate size alone.
- **Evidence-Based Retry Condition:** Retry only if a separately accepted operating envelope provides reproducible loaded prompt identity, a concrete failure boundary, and matched outcome evidence showing a specific limit protects behavior better than quality/ownership gates.

## 2026-08-26 - Use a generic semantic compressor or paraphraser

- **Objective:** Automatically shorten instruction prose and converge to zero additional reduction on a repeated pass.
- **Approach:** Consider generic simplification, filler-word, passive-voice, synonym, near-duplicate, contradiction, or model-based rewrite tooling as an automatic compressor.
- **Evidence:** Vale, textlint, retext, proselint, controlled-language practice, and term-rewrite approaches can report or apply narrow rules, but arbitrary natural-language paraphrasing does not prove preservation of actor, obligation, negation, condition, exception, or failure behavior. Existing deduplication policy also treats clone similarity as review evidence rather than semantic equivalence.
- **Outcome:** Rejected for automatic semantic mutation; retained only as review-only candidate discovery outside generic presets.
- **Reason:** Idempotence proves a fixed point, not meaning preservation, and heuristic prose scores would violate the repository's no-semantic-inference automation boundary.
- **Do-Not-Repeat Condition:** Do not enable generic style presets, model-generated paraphrasing, automatic near-duplicate merging, or a reduction-percentage target for maintained instructions.
- **Evidence-Based Retry Condition:** Retry one exact transformation only after it is a reviewed one-way rule with protected positive/negative fixtures, second-pass byte identity, and affected consumer no-regression evidence.

## 2026-08-26 - Retain the budget tool as a non-enforcing compatibility surface

- **Objective:** Minimize migration by keeping `instruction:budget` while disabling rejection or using unbounded maxima.
- **Approach:** Rebrand existing output as diagnostics, automatically rematerialize larger maxima, or preserve a compatibility alias after seed removal.
- **Evidence:** `tools/instruction-budget.ts` is structurally centered on maxima, pass/fail boundaries, a materializer, and `config/instruction-budget.json`; package/proof/docs consumers describe that fail-closed policy rather than a neutral inventory contract.
- **Outcome:** Rejected.
- **Reason:** An infinite or moving budget leaves a dead policy owner, misleading terminology, duplicate measurement ownership, and a path for later code to restore arbitrary rejection.
- **Do-Not-Repeat Condition:** Do not preserve the removed command, seed, materializer, or proof through an alias whose behavior is only diagnostic.
- **Evidence-Based Retry Condition:** Retry compatibility only if a concrete shipped external consumer is identified and cannot migrate atomically; then propose that compatibility boundary separately with an explicit removal plan.

## 2026-08-26 - Split parsing between inventory and a separate canonicalizer

- **Objective:** Extend the current line inventory while adding a narrow textlint write runner.
- **Approach:** First draft assigned Markdown block/digest/exception logic to `tools/instruction-artifacts-inventory.ts` and protected TxtAST/fixed-point behavior to a separate `tools/instruction-canonicalizer.ts`.
- **Evidence:** Read-only architecture review `ses_fc12b710bffe0Xieb2vzZalnIW` (`xai/grok-4.6`, risks ARCH-CQ-005/006) showed that two block models could disagree and that the inventory file already mixes catalog classification, loader-visible privacy, measurements, and repeated-line reporting.
- **Outcome:** Superseded in the polished design.
- **Reason:** Duplicate identity, heading scope, protected spans, and canonical fixes require one AST/parser contract, while inventory should remain the measurement/redaction/reporting owner.
- **Do-Not-Repeat Condition:** Do not add a second Markdown parser, retain `repeatedLines` as a competing duplicate definition, or place fixer mutation inside the inventory owner.
- **Evidence-Based Retry Condition:** Revisit the seam only if current textlint APIs cannot provide stable shared AST ranges for both read-only evaluation and staged fixes; preserve one parser contract even if its module boundary changes.

## 2026-08-26 - Use one shared deterministic context-quality normal form

- **Objective:** Remove arbitrary ceilings while preventing repeated instruction authority and safely reducing mechanical prose waste.
- **Approach:** Reuse textlint as an engine behind one repository-owned parser/evaluator/check/write seam, keep inventory measurements separate, fail every exact operative block duplicate in the explicit model-facing Markdown population unless one reviewed loader exception applies, and auto-fix only reviewed protected fixed-point rules.
- **Evidence:** textlint 15.8.0 supports the repository's Node 24 engine and fixable Markdown rules; current `repeatedLines` misses same-file and two-file blocks; public fixer guidance favors small fixes; the polished specs preserve all non-budget priority/safety clauses and make semantic-near findings review-only.
- **Outcome:** Selected for implementation planning.
- **Reason:** It is the smallest design that gives deterministic idempotence, one block identity, explicit ownership, privacy-safe diagnostics, and behavior-bounded semantic review without substituting size or style scores for quality.
- **Do-Not-Repeat Condition:** Do not add a parallel scanner, second reviewer, generic semantic score, background service, or automatic cross-file deletion while this bounded owner can satisfy the accepted outcome.
- **Evidence-Based Retry Condition:** Revise the selected mechanism when actual-entrypoint fixtures demonstrate parser instability, protected-value drift, non-atomic writes, or an unresolvable maintained-source category; preserve the accepted quality/ownership semantics while changing the smallest mechanism.

## 2026-08-26 - Keep detailed OpenSpec workflow contracts in canonical skills

- **Objective:** Restore strict validation after thinning OpenSpec slash commands without recreating duplicated workflow authority.
- **Approach:** Keep outcome reconciliation, helper resolution, pause, and sequencing detail in the canonical propose/apply/archive skills; require each command to name exactly its skill, delegate the complete workflow, pass arguments, and fail closed when that skill is unavailable.
- **Evidence:** The first task-3.2 strict validation failed because validators still required complete policy markers in both skill and command surfaces. The thin commands already routed explicitly and the repository context-quality check was green, so restoring copied detail would contradict the selected one-owner design.
- **Outcome:** Selected and implemented. Focused contracts passed 71/71, strict validation passed with zero warnings, and the final focused library suite passed 175/175.
- **Reason:** Command routing is the command's unique responsibility; lifecycle, helper, and proof policy belong to the loaded skill. Validating both contracts preserves fail-closed behavior without duplicate normative prose.
- **Do-Not-Repeat Condition:** Do not restore complete propose/apply/archive workflow bodies or portable-helper recipes to slash commands merely to satisfy a marker test.
- **Evidence-Based Retry Condition:** Revisit only if fresh loader evidence shows an explicit command-to-skill route cannot load the named canonical skill or loses required argument/failure behavior; then change the smallest loader or routing boundary rather than duplicating policy by default.
