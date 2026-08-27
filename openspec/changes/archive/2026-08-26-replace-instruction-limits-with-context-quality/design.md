## Context

See `proposal.md` for motivation and the two delta specs for observable behavior. The current owner chain is `tools/instruction-artifacts-inventory.ts` for catalog and loader-visible measurements, `tools/instruction-budget.ts` plus `config/instruction-budget.json` for fail-closed maxima, and `tools/validate-library.ts` for strict activation. `repeatedLines` currently reports only identical lines of at least 40 characters that occur in at least three files; it does not find repeated blocks inside one file, two-file duplication, canonical ownership, or stale exceptions.

The canonical specs contain numeric ceilings in several otherwise independent requirements, and all five active changes contain a current instruction-ceiling, removed-command, or dependent preflight reference. Removing only the seed or validator would therefore leave live normative contradictions and would allow later changes to restore the old behavior.

External-tool research found `textlint` 15.8.0 compatible with Node 20.18 and newer, while this repository requires Node 24. Its Markdown TxtAST and fixable-rule interface can limit transformations to prose nodes; its own fixer guidance recommends small fixes and one fix per diagnostic. The repository has no current Markdown-aware fixer. `jscpd` and the existing deduplication workflow identify review candidates but intentionally do not prove semantic equivalence.

## Goals / Non-Goals

**Goals:**

- Preserve one read-only instruction inventory owner while replacing numeric budget verdicts with separate measurements and deterministic context-quality findings.
- Detect exact operative block duplication inside and across maintained repository instruction files, with one reviewed exception mechanism for independently loaded consumers.
- Provide an explicit, atomic, fixed-point canonicalization path for reviewed safe Markdown transformations.
- Remove every current normative, validation, proof, package, documentation, and active-plan dependency on hard instruction token-proxy maxima.
- Reach the first real signal through disposable parser/rule fixtures and the actual package entry points before removing the working budget gate.

**Non-Goals:**

- A semantic duplicate detector, contradiction resolver, general English simplifier, model-based paraphraser, or prose quality score.
- Automatic deletion or consolidation across files.
- A replacement context maximum, reduction percentage, minimum savings target, provider-specific policy, or background service.
- Rewriting archived OpenSpec artifacts or historical evidence that accurately records prior budget behavior.
- Changing OpenCode loader precedence, profiles, install behavior, or active machine configuration.

## Decisions

### 1. Keep measurement ownership and add one cohesive context-quality seam

`tools/instruction-artifacts-inventory.ts` remains the source-scope, classification, measurement, redaction, and reporting owner. Add one cohesive `tools/instruction-context-quality.ts` module that uses one textlint Markdown AST for operative-block, heading-path, protected-span, exception, rule, and fixed-point evaluation. Inventory imports its read-only report, strict validation imports its deterministic errors, and the explicit write CLI calls the same evaluator. Delete `repeatedLines` rather than retaining a third weaker duplicate definition. Startup authority, discovery metadata, on-demand bodies, unknowns, and profile identities remain separate inventory fields; maxima and pass/fail status are removed.

After replacement checks pass, delete `config/instruction-budget.json`, `tools/instruction-budget.ts`, `tools/proofs/instruction-inventory-budget.ts`, their package entries, focused tests/helpers, proof-inventory row, and validation import. Do not retain a compatibility alias: the old command's purpose is the removed fail-closed limit, and a silent diagnostic alias would preserve misleading terminology and maintenance ownership.

Alternative rejected: retain the budget tool with infinite or automatically rematerialized maxima. That keeps a dead policy owner and makes output look authoritative while no longer enforcing a meaningful contract.

### 2. Use one reviewed context-quality seed without derived values

Add one compact `config/instruction-context-quality.json` semantic seed with schema version, approved canonicalization rules, and duplicate exceptions. A canonicalization rule contains a stable ID, exact source form, canonical form, applicable prose scope, and review rationale. A duplicate exception contains a stable ID, one owner path and section, exact consumer paths and sections, and the independent-loader reason.

The seed contains no hashes, line numbers, counts, source ordering, measured totals, or copied complete duplicate blocks. The inventory derives normalized block digests and current locations, validates that each exception resolves to exactly one shared block, and rejects stale or ambiguous records. This follows the existing mechanical-structured-artifact contract without adding a generated mirror.

Alternative rejected: inline suppressions in Markdown. They would add loader-visible noise to every consumer, duplicate exception metadata, and risk becoming operative prompt text.

### 3. Reuse textlint as the Markdown fixer engine and keep policy local

Add `textlint` as a development dependency and expose `tools/instruction-context-quality.ts` as `npm run instruction:canonicalize`. The cohesive module owns source selection, shared AST/block/heading/protected-span extraction, seed validation, duplicate evaluation, staged fixing, second-pass comparison, atomic writes, stable diagnostics, and `--help`/`-h`. Repository-owned rule code reads only reviewed seed entries; no external prose-style preset is enabled by default.

Disposition: `reuse`. Existing repository discovery reached the line-based inventory and review-only `jscpd` workflow but no safe Markdown fixer; Node standard libraries do not parse Markdown; textlint provides the required current AST/fixer contract at lower parser and maintenance cost than a local parser. Vale is strongest as a declarative linter but does not own the required atomic fixed-point write path. Retext offers an AST ecosystem but would require more custom fixer orchestration. Regex-only replacement cannot reliably protect Markdown literals. Cross-project discovery is `not-applicable`: the capability is a portable package/API selection and current repository plus bounded public package evidence resolved the choice without private peer source.

The dependency is an engine, not semantic authority. Version upgrades require focused protected-span and fixed-point replay before lockfile adoption. Automatic rule retention requires exact positive/negative fixtures and affected consumer proof when an actual instruction is changed.

### 4. Divide findings into safe-fix, deterministic-error, and review-only classes

The runner and inventory expose three non-overlapping classes:

- `safe-fix`: exact reviewed one-way replacements over TxtAST prose nodes plus mechanical file normalization that preserves Markdown meaning. These are the only write-capable findings.
- `deterministic-error`: same-file exact operative instruction block duplication, unexcepted cross-file exact operative instruction block duplication, malformed/stale exceptions, malformed/cyclic rules, overlapping fixes, protected-value changes, parse failures, and non-idempotent output.
- `review-only`: near duplicates, possible contradictions, verbose phrasing without an approved exact rule, and any difference in actor, modal, negation, condition, exception, object, or failure behavior.

No helper scores, ranks, or infers semantic equivalence. Review-only output uses paths, sections, locations, digests, and `semantic-status: unknown`; it does not auto-fix or block solely because similarity exists.

Alternative rejected: adopt generic simplification, passive-voice, filler-word, or readability presets. Their heuristics can alter obligation strength and would substitute style scores for instruction behavior.

### 5. Make write mode transactional and prove the fixed point before mutation

Check mode is the default and is effect-free. Write mode resolves the selected maintained files, reads all preimages, parses and fixes temporary copies, verifies protected-value inventories, and runs the same transformation over first-pass output. It writes nothing unless pass two is byte-identical for every selected file and every quality error is absent. Successful writes use sibling temporary files plus atomic rename; any failure removes proof-owned temporary files and preserves all original bytes.

The protected inventory includes frontmatter scalar values, fenced and inline code, link destinations and URLs, quoted requirements, command/path/identifier-like literals, numbers, normative modals, negation markers, condition markers, and exception markers. Protection is deliberately conservative: an approved phrase that overlaps one of these values becomes review-only.

Alternative rejected: run `textlint --fix` directly over repository source and inspect afterward. A partial multi-file fix or non-idempotent rule could mutate the candidate before the failure is known.

### 6. Define exact-duplicate scope without pretending to solve semantics

The exhaustive duplicate population is the explicit model-facing Markdown category set: global/root/project instructions, agents, skills, commands, templates, and OpenSpec artifact instruction/rule/template sources enumerated by the updated inventory. General documentation, canonical product specs, active plans, archives/evidence, profiles, frontmatter, headings, tables, code, and quoted examples/requirements are outside that population. The one shared parser compares operative prose paragraph and list-item blocks after only line-ending and surrounding-whitespace normalization. Every same-file exact duplicate fails; every cross-file exact duplicate requires one current exception. Semantic-near matches remain visible diagnostics.

Loader-visible external and machine-local sources retain aggregate privacy behavior. Their text is not copied into output or compared against committed source in a way that reveals content. Unsupported or unreadable sources remain `unknown`. Profiles participate in loader identity and measurements but not prose duplication. The exhaustive claim therefore covers only enumerated maintained model-facing Markdown categories, matching the proposal's exact Claim And Evidence Scope.

Alternative rejected: hash every external source and compare hashes. Whole-file hashes do not identify duplicate instructions, while block hashes could leak equality relationships for private text and still would not establish semantic ownership.

### 7. Reconcile live planning controls, preserve history

Update canonical specs and current proposal/design/spec/task controls in all five current changes: `add-foundation-integrity-autorecovery`, `add-bounded-falsification-review`, `add-continuous-complexity-management`, `add-specialist-team-advisor`, and the instruction-budget preflight in `add-autonomous-campaign-orchestration`. Replace unchanged budgets, budget payment, overrun rejection, removed commands, and numeric ceiling proof with separate context diagnostics, duplicate/canonicalization checks, and the same existing behavior oracles. Distinguish unrelated campaign/process attempt budgets from instruction ceilings. Re-run active-change search after edits in case another current plan acquired a conflicting clause.

Do not rewrite archived changes or erase active `history.md` entries that accurately describe strategies considered under the old contract. Append a supersession entry only where a current history strategy would otherwise be mistaken for the next executable control. This change must apply before another active change mutates shared budget, inventory, profile, or loaded-instruction surfaces, or those changes must explicitly rebase on the new contract.

### 8. Shift proof from size compliance to actual tool and consumer behavior

Current fidelity rung: direct source, canonical specification, current CLI behavior, package metadata, and external fixer API documentation. The next real boundary is a provider-free disposable Markdown corpus run through the actual new package entry point.

Proof ladder:

1. Build reviewed duplicate, exception, protected-span, approved-fix, malformed-rule, cycle, overlap, parse-failure, and non-idempotence fixtures. Run `--help`, check, write, and immediate second-check paths through `npm run instruction:canonicalize` with no provider call.
2. Extend `npm run instruction:inventory` and strict validation against disposable kit copies. Prove separate measurements, stable ordering, privacy-safe unknowns, exact locations, seed readback, no source write in check/validation, and no remaining numeric rejection.
3. Run both entry points against the actual maintained model-facing category set. Review every current exact-duplicate finding; remove a true duplicate or add the smallest reviewed independent-loader exception, never auto-delete it. Bind inventory and canonicalizer output to one candidate snapshot/hash.
4. Remove the budget owner and reconcile canonical/current planning surfaces only after steps 1-3 are green. Re-run focused tests and strict validation on the same candidate.
5. Materialize the candidate core profile into a disposable root and run the existing loader/profile proof. If operative loaded instructions changed, run the affected maintained consumer-outcome baseline/candidate scenarios with matched source/model/profile/permission/environment identity; if no operative text changed, preserve that as an exact source-identity control rather than manufacture a behavioral improvement claim.

Authorization is limited to repository source edits, dependency/lockfile update, provider-free local commands, proof-owned disposable roots, and the already authorized bounded synthetic calls only if step 5 actually requires configured-model behavior evidence. Safeguards prohibit active global install, source activation, credentials, consumer mutation, remote/destructive action, archive, commit, push, release, or deployment. Disposable roots and temporary files are removed in `finally`; retained evidence is privacy-safe and local. Attempt counts and stop lines are revisable process controls; they do not authorize any underlying protected action.

## Risks / Trade-offs

- **[Risk] Exact duplication is required for independently loaded safety prompts** -> Require one reviewed owner/consumer exception with loader rationale and reject any stale or broader occurrence.
- **[Risk] A supposedly safe phrase replacement changes obligation strength** -> Protect normative atoms, require per-rule positive/negative fixtures, stage two passes before write, and require affected consumer proof for retained instruction edits.
- **[Risk] The first exact-block scan finds many inherited duplicates** -> Report all current findings over the explicit model-facing population, migrate with the smallest reviewed exception set, and do not weaken strictness by silently baselining every occurrence.
- **[Risk] Textlint or its Markdown parser changes ranges on upgrade** -> Pin through the lockfile and replay parser/protected/fixed-point fixtures before accepting an upgrade.
- **[Risk] Removing hard ceilings permits uncontrolled growth** -> Keep visible separate diagnostics, canonical ownership, exact-duplicate failures, review-only similarity findings, and behavior gates; record growth without treating size as proof of harm or quality.
- **[Risk] Active changes restore budget language later** -> Reconcile all current controls in this change, validate selected and all active changes, and preserve the dependency/supersession entry.
- **[Trade-off] Semantic duplicates remain possible** -> This is intentional; deterministic code cannot safely establish arbitrary natural-language equivalence. Review and behavior evidence remain the semantic boundary.

## Migration Plan

1. Capture current inventory and budget output as historical before-evidence; do not rematerialize the seed.
2. Add the context-quality seed, textlint dependency, canonicalizer, inventory extensions, and focused disposable fixtures while the old validator still exists.
3. Run provider-free actual-entrypoint proof, correct deterministic defects, and review current repository duplicate findings.
4. Delete the budget seed/tool/proof/package/validator/test ownership and update maintained documentation and proof inventory.
5. Apply the two delta specs and reconcile all current active-change controls without rewriting archives or accurate history.
6. Run focused tests, actual repository check mode, strict project validation, selected/all strict OpenSpec validation, core loader proof, applicable matched consumer proof, and scoped diff review.

Rollback before activation is the scoped repository diff and lockfile reversal. No active global source is installed or restarted by this change; later activation remains a separately authorized maintainer operation and requires a fresh OpenCode process because instruction/config sources load at startup.
