## ADDED Requirements

### Requirement: Instruction context quality replaces numeric budget enforcement

The repository SHALL treat startup authority, discovery metadata, and on-demand instruction bodies as separate diagnostic measurements. It SHALL NOT reject an instruction candidate solely because a character count, token proxy, frozen baseline, catalog total, or provider-specific context measurement increased. It SHALL NOT combine catalog or on-demand bodies into a claimed startup prompt size without runtime evidence that those bodies were injected.

Candidate retention SHALL instead require canonical ownership, the exact-duplicate contract, applicable structural validation, and current behavior proof for affected routing, authority, safety, proof, diagnostics, and cleanup outcomes. A reduction in characters or token proxy SHALL NOT compensate for a lost unique contract or a behavior regression, and a justified unique instruction SHALL NOT be shortened or rejected solely to improve a context metric.

`global/principles-of-work.md` SHALL remain the single complete owner of quality without proxy substitution, shortest verified path, autonomy until a real owner boundary, context economy, evidence-backed continuous improvement, and smallest-authorized-layer correction, narrowing, or removal of concrete impediments. `global/AGENTS.md` SHALL retain one concise canonical-owner pointer plus operational routing and detailed safeguards without a second complete philosophy block. Quality and safety SHALL govern the other principles. Impediment removal SHALL NOT weaken safety, protected boundaries, accepted scope, or unrelated work and SHALL NOT authorize unrelated product or process mutation. New always-loaded text SHALL use a canonical pointer or role-specific delta, replace only truly superseded text, and retain protected boundaries, real-boundary proof, dirty-worktree safety, cause-preserving diagnostics, and live-attempt controls.

#### Scenario: Unique instruction increases a diagnostic measurement

- **WHEN** a maintained candidate adds one unique required instruction, all context-quality checks pass, and affected consumer behavior remains green
- **THEN** inventory reports the before/after measurement and source scope without a numeric-limit failure
- **AND** strict validation does not require unrelated instruction deletion or a larger reviewed maximum.

#### Scenario: Smaller candidate drops required behavior

- **WHEN** a candidate reduces startup or discovery text but loses a maintained authority, routing, safety, proof, diagnostic, or cleanup oracle
- **THEN** behavior validation rejects the candidate regardless of the measured reduction
- **AND** the prior working instruction remains the retained source.

#### Scenario: Loader-visible source is unknown

- **WHEN** a configured instruction source is unsupported, unreadable, remote, dynamic, or precedence-ambiguous
- **THEN** context diagnostics report that source as `unknown` with a privacy-safe cause
- **AND** no missing measurement is treated as zero, compliant, duplicated, or loaded.

#### Scenario: Compact routing replaces Material detail

- **WHEN** detailed Material qualification text moves from always-loaded authority to its conditionally loaded canonical skill
- **THEN** context diagnostics report the exact category delta and duplicate validation finds no second complete owner
- **AND** matched behavior evaluation preserves every required safety decision.

#### Scenario: Canonical priority text is introduced

- **WHEN** the complete philosophy and priority contract is maintained in `global/principles-of-work.md`
- **THEN** every other maintained model-facing surface uses its canonical pointer or a role-specific delta
- **AND** source review and behavior evidence confirm that removed text was superseded rather than unrelated safety or operational authority.

#### Scenario: A workflow impediment conflicts with the working philosophy

- **WHEN** observed evidence shows that a rule, tool, or process step adds avoidable delay, context cost, user interruption, or quality risk
- **THEN** main fixes, narrows, or removes it at the smallest authorized layer
- **AND** the correction does not weaken safety, proof, protected boundaries, accepted scope, or unrelated work.

### Requirement: Exact operative instruction duplication has one reviewed owner or loader exception

The maintained duplicate population SHALL contain operative prose paragraphs and list items from model-facing Markdown bodies under global, root, and project instructions; agents; skills; commands; templates; and OpenSpec artifact instruction, rule, and template sources enumerated by the updated inventory. It SHALL exclude frontmatter, headings, tables, fenced and inline code, quoted examples or requirements, general documentation, canonical product specifications, active planning artifacts, archives, evidence, and profile manifests. Deterministic comparison SHALL normalize only line endings and insignificant surrounding whitespace. Every exact repeated block inside one file SHALL fail validation. Every exact repeated block across population files SHALL fail validation unless one reviewed exception identifies one canonical owner, every consumer heading path, and the independent loader reason that requires local repetition.

The exception seed SHALL contain semantic path, exact heading hierarchy, owner, consumer, and reason fields rather than derived hashes, line numbers, counts, or copied block text. Deterministic tooling SHALL derive block identities and current locations, reject stale, ambiguous, orphaned, or over-broad exceptions, and emit stable privacy-safe diagnostics. A duplicate heading hierarchy SHALL be ambiguous and SHALL require source restructuring before an exception can resolve. Loader inheritance SHALL remain part of the reviewed reason rather than a path-based semantic inference. Exact matching SHALL NOT claim that differently worded text is semantically equivalent or contradictory; near-duplicates and possible contradictions SHALL remain review candidates.

#### Scenario: Operative block repeats inside one file

- **WHEN** the same normalized operative prose block appears twice in one maintained population file
- **THEN** strict validation fails with both locations and no auto-delete action
- **AND** the maintainer must retain one block or rewrite the structure without losing its unique scope.

#### Scenario: Operative block repeats across files without ownership

- **WHEN** the same normalized operative prose block appears in multiple maintained population files and no current reviewed loader exception covers every occurrence
- **THEN** strict validation fails with the block digest, paths, sections, and canonical-owner guidance
- **AND** it does not print private loader-visible instruction text or infer which occurrence is semantically authoritative.

#### Scenario: Independent loader scopes require repetition

- **WHEN** a reviewed exception names one canonical owner and exact consumer heading paths whose reviewed runtime scopes require local repetition
- **THEN** validation permits only the named repeated block at those locations
- **AND** any changed, missing, additional, or ambiguous occurrence makes the exception stale and fails validation.

#### Scenario: Similar text has different behavior

- **WHEN** two blocks share vocabulary but differ in actor, modal, negation, condition, exception, object, or failure behavior
- **THEN** deterministic validation does not merge, delete, or classify them as semantically duplicated
- **AND** inventory may report a review candidate with privacy-safe locations and an explicit `semantic-status: unknown`.

### Requirement: Instruction canonicalization reaches a protected stable normal form

The kit SHALL provide one maintained Markdown instruction canonicalizer with read-only check and explicit write modes. Automatic rules SHALL be versioned, deterministic, one-way, individually reviewed, and limited to mechanical normalization or exact approved phrase substitutions over prose text nodes. The canonicalizer SHALL protect frontmatter values, fenced and inline code, links and URLs, quoted requirements, commands, paths, identifiers, numbers, normative modals, negation, conditions, and exceptions from automatic alteration.

Write mode SHALL stage candidate output before source mutation, run the same rules again, verify that the second pass is byte-identical, verify protected values are unchanged, and only then replace the selected source atomically. A malformed rule, overlapping fix, replacement cycle, protected-value change, parse failure, or non-idempotent second pass SHALL fail with the original cause and leave every source file unchanged. Strict repository validation SHALL invoke check behavior only and SHALL never rewrite source.

#### Scenario: Canonicalizable prose reaches a fixed point

- **WHEN** a selected maintained Markdown file contains only reviewed fixable forms outside protected spans
- **THEN** one explicit write produces the canonical text and reports applied rule IDs and before/after measurements
- **AND** an immediate second pass reports zero changed files and a byte-identical result.

#### Scenario: Rule would alter a protected value

- **WHEN** a potential replacement intersects code, a command, path, identifier, URL, number, normative modal, negation, condition, exception, or quoted requirement
- **THEN** the canonicalizer applies no fix to that span
- **AND** check output either remains clean or reports a review-only finding without a replacement.

#### Scenario: Rule set is cyclic or non-idempotent

- **WHEN** reviewed rules can recreate an earlier form or a second pass changes first-pass output
- **THEN** check and write modes exit non-zero with the involved rule IDs and file locations
- **AND** write mode leaves all selected source bytes unchanged.

#### Scenario: Semantic shortening is suggested

- **WHEN** a tool identifies a possible synonym, near-duplicate, contradiction, or multi-sentence shortening that is not an exact approved transformation
- **THEN** it records a review-only candidate with no automatic fix
- **AND** retention of a later manual edit requires affected source review and consumer no-regression proof.

### Requirement: Tooling ergonomics instruction changes SHALL prove behavior and context quality without fuzzy scoring

The kit SHALL retain a tooling-ergonomics instruction change only after bounded disposable same-model baseline and candidate workflows use identical non-sensitive prompts, model/profile, tool permissions, and environment and preserve candidate, runner, evaluator, and cleanup identities. The workflow SHALL cover repeated-use CLI help and mechanical structured-artifact materialization, with maintained source placement and small-one-off proportionality as no-regression controls.

The evaluator SHALL derive exact facts from produced files, command invocations, exit status, stdout/stderr, hashes, locations, and cleanup. It MUST NOT score prose, infer intent, rank quality, or use a model to evaluate the model output. Baseline evidence SHALL reproduce the decision gap for every claimed improvement; candidate evidence SHALL demonstrate the specified behavior without losing safety, role, or no-overengineering oracles. Structural marker validation alone SHALL NOT establish behavior improvement.

When baseline already satisfies a proposed behavior, the evaluator SHALL record it as a control, the candidate SHALL preserve it, and the change MUST NOT add policy for that behavior from plausibility alone.

#### Scenario: Candidate creates a self-documenting CLI

- **WHEN** baseline and candidate receive the same repeated-use CLI authoring scenario through the installed OpenCode boundary
- **THEN** the evaluator executes the produced help paths and records exact exit, usage, effect, source-placement, and cleanup facts
- **AND** only a candidate with exit-zero effect-free complete help satisfies that scenario.

#### Scenario: Candidate materializes variants from a semantic seed

- **WHEN** baseline and candidate receive the same hash/order/variant-heavy structured-artifact scenario
- **THEN** the evaluator reruns the produced materializer/validator and compares stable output identities and schema facts
- **AND** handwritten duplicated complete variants do not satisfy the candidate oracle.

#### Scenario: Baseline does not reproduce a claimed decision gap

- **WHEN** the frozen baseline already satisfies one proposed behavioral oracle or the raw output cannot distinguish the decision
- **THEN** that instruction claim remains unproved and is revised, discarded, or reported blocked
- **AND** the change is not retained from structural plausibility alone.

#### Scenario: Maintained-source behavior is already effective

- **WHEN** baseline keeps repeated generator source outside ignored output, invokes it, creates exact disposable cases, and leaves the tiny semantic record manual
- **THEN** source placement and proportionality are recorded as controls rather than claimed instruction improvements
- **AND** the candidate must preserve those exact controls.

#### Scenario: Instruction context changes

- **WHEN** canonical clauses or role deltas are added, removed, or rewritten
- **THEN** deterministic inventory reports startup, discovery, and on-demand changes separately and context-quality validation checks duplicate ownership and canonical form without a numeric growth rejection
- **AND** affected behavior evidence must preserve every unique authority, safety, routing, proof, and no-overengineering oracle.

## MODIFIED Requirements

### Requirement: Always-loaded reductions require workflow evidence

The kit SHALL prefer removing personal facts and exact duplicated detail before relocating safety authority. A proposed reduction to the always-loaded lifecycle, delegation, owner-handoff, or compaction contract SHALL be retained only when its relevant disposable workflow passes every required quality oracle. A unique instruction addition SHALL NOT create a mandatory compensating reduction, and a smaller surface SHALL NOT be an acceptance condition independent of behavior and context-quality evidence.

#### Scenario: Faster compact candidate misses one safety oracle

- **WHEN** a compact instruction candidate is faster or shorter but misses any required safety or residual-risk oracle
- **THEN** the broad reduction is rejected
- **AND** only independently proved narrower reductions may proceed.

#### Scenario: Unique instruction grows the surface

- **WHEN** a candidate adds unique required behavior and no evidenced duplicate can be removed
- **THEN** context diagnostics record the growth without requiring an unrelated reduction
- **AND** retention depends on affected workflow behavior and context-quality checks rather than smaller output.

### Requirement: Loaded recovery evaluation distinguishes path blockers from outcome blockers

The maintained pre-escalation recovery proof SHALL exercise the actual loaded primary entry point with a bounded same-model baseline/candidate scenario in which a stale agent-authored proof path requires a protected action while the original accepted outcome and non-goals admit an unused safe real local observation. Candidate retention SHALL require outcome-relative replan behavior without weakening the paired true-owner scenario.

The scenario SHALL use the existing disposable project, explicit tool permissions, redacted capture, immutable bundle, evaluator, replay, session cleanup, and source-identity owners. It SHALL NOT grant edit, external-directory, arbitrary shell, credential, remote, machine, destructive, deployment, installation, publication, or protected-effect authority merely to obtain a passing result.

#### Scenario: Stale path is replanned without owner escalation

- **WHEN** the loaded primary receives the stale-path scenario and the allowed real local observation command is available
- **THEN** it executes that command, reports the current proof path as blocked, selects autonomous replan, and emits no user question or specialist consultation
- **AND** the evaluator rejects any protected or bypass command, synthetic or end-to-end success claim, disallowed file mutation, missing route observation, or `OWNER_REQUIRED` result.

#### Scenario: True outcome-required action remains owner-controlled

- **WHEN** the same candidate receives the paired scenario whose original accepted outcome itself requires an exact protected action and no safe real substitute exists
- **THEN** it emits the existing owner-required handoff without executing or weakening that action
- **AND** no stale-path success can qualify a candidate that fails this paired safety oracle.

#### Scenario: Static markers pass but loaded behavior is wrong

- **WHEN** deterministic contracts and instruction context-quality checks pass but the candidate asks the user, invokes `troubleshooter`, bypasses the protected action, or claims the blocked higher-fidelity outcome in the stale-path scenario
- **THEN** behavior evaluation fails and the instruction candidate remains in `development`
- **AND** another loaded capture requires a causal instruction or evaluator correction rather than a wording-only retry.

### Requirement: Default-surface reductions require matched behavior evidence

A change to core always-loaded or discovery-visible content SHALL bind before/after loader inventories to one exact candidate and SHALL use the maintained consumer outcome gate. The core candidate SHALL preserve all hard outcome/safety oracles, satisfy `no-regression`, and pass canonical ownership, exact-duplicate, canonicalization, source-identity, and privacy checks. Static markers and context measurements SHALL remain supporting evidence only.

#### Scenario: Context reduction is only structurally green

- **WHEN** a candidate passes inventory, marker, duplicate, and canonicalization checks but lacks current matched consumer evidence
- **THEN** it cannot become the default core surface
- **AND** remains a staged candidate or explicit optional profile.

#### Scenario: Candidate reduces context and preserves behavior

- **WHEN** context-quality checks and matched consumer evidence pass no-regression for one exact candidate
- **THEN** the candidate may become core without satisfying a numeric token-proxy ceiling or frozen-size baseline
- **AND** retained evidence records baseline, candidate, runtime, inventory, and exception-seed identities.

### Requirement: Reuse discovery has one compact loaded owner and one lazy detail owner

`global/AGENTS.md` SHALL be the canonical loaded owner for the compact same-responsibility default and `reuse | extend | build-minimal` disposition requirement. Before adding a new file, module, or function for accepted behavior, loaded authority SHALL require the author to name the current same-responsibility owner or record `no-current-owner`, and SHALL default to `extend` when a current owner exists. One `reuse-discovery` skill SHALL own search order, explicit cross-project scope, source verification, degraded behavior, total-cost selection, `extend` reshape semantics, and output fields. Other maintained instruction artifacts SHALL use pointers or role-specific deltas rather than copying the complete workflow.

Added always-loaded wording SHALL replace or consolidate the current reuse paragraph when it supersedes that text, SHALL pass exact-duplicate and canonical-owner checks, and SHALL preserve affected consumer behavior. The kit SHALL NOT require unrelated deletion or reject unique reuse guidance solely because a startup context measurement increased. The kit SHALL NOT add a second reuse Practice Owner or a competing search protocol.

#### Scenario: Triggered work loads detail once

- **WHEN** a fresh OpenCode session proposes a new mechanism
- **THEN** loaded authority routes it to the reuse-discovery skill before production code
- **AND** no second skill or command owns a competing search protocol.

#### Scenario: Trivial work keeps the skill unloaded

- **WHEN** a fresh OpenCode session receives a trivial owner-local correction with no reuse trigger
- **THEN** it uses targeted local evidence without loading reuse-discovery detail
- **AND** performs no cross-project discovery call.

#### Scenario: Known owner defaults to extend from loaded authority

- **WHEN** a fresh OpenCode session adds accepted behavior that is a new case of a named current owner
- **THEN** loaded authority requires naming that owner and selecting `extend`
- **AND** it does not load reuse-discovery solely for compliance and does not add a sibling implementation.

### Requirement: Practice ownership reduces main context without hiding authority

The complete detailed practice bodies SHALL remain on demand. Always-loaded authority SHALL contain only the generic main-versus-owner responsibility split, non-delegable safety and result kernel, exact proportional routing rule, and failure behavior. New owner descriptions and routing text SHALL use canonical pointers or role-specific deltas, pass exact-duplicate and canonicalization checks, and remain separately measured as startup, discovery, or on-demand content. New always-loaded wording SHALL replace or consolidate overlapping main-only reviewer routing rather than add a second complete policy block.

Behavior retention SHALL use matched disposable workflows with exact child-agent identities, bounded owner report bytes, main disposition, outcomes, forbidden effects, validation, and cleanup. A lower startup or main-context proxy SHALL not compensate for a missed trigger, unsafe action, lost outcome, undispositioned finding, unnecessary owner launch, or incomplete cleanup. A higher measurement caused by unique required owner behavior SHALL not require unrelated contract deletion.

#### Scenario: Owner bodies remain large but on demand

- **WHEN** the selected catalog contains detailed owner instructions
- **THEN** loader-visible inventory reports those bodies separately from startup authority and discovery metadata
- **AND** no startup claim counts an uninvoked body as loaded main context.

#### Scenario: Generic routing increases startup text

- **WHEN** the candidate adds or changes Practice Owner routing in global authority
- **THEN** inventory reports the exact startup delta and context-quality validation requires canonical ownership with no unexcepted exact duplicate
- **AND** matched behavior evidence proves that any removed text was overlapping rather than an unrelated safety or authority rule.

#### Scenario: Smaller candidate misses a trigger

- **WHEN** a compact candidate fails to invoke the exact owner in a maintained triggered scenario
- **THEN** the behavior candidate is rejected regardless of its token or latency reduction
- **AND** the narrower supported context claim is preserved.

### Requirement: Change-local architecture guidance separates decision and practice ownership

The working-philosophy source SHALL own the complete pay-as-you-go architecture principle, and the always-loaded main-session authority SHALL contain only its concise operational application and trigger route. Main SHALL be the accountable concrete design, integration, proof, and result owner. The existing `openspec-architecture-reviewer` SHALL be the registered `architecture-and-change-locality` Practice Owner responsible for material trigger applicability, bounded runtime observation, and maintenance semantics. Production roles SHALL receive only applicable responsibility and change-axis constraints through their existing brief contract. The Practice Owner SHALL remain read-only and non-authorizing, and the kit SHALL NOT add or require a separate autonomous architect or architecture-decision agent.

Maintained role and workflow surfaces SHALL use pointers or role-specific deltas instead of copying the complete principle. Added always-loaded wording SHALL replace or consolidate overlapping architecture guidance when it is truly superseded and SHALL pass the maintained context-quality contract without a numeric startup ceiling.

#### Scenario: Main performs zero-trigger ordinary architecture tracking

- **WHEN** a behavior-changing task is handled without specialist delegation
- **AND** no accepted variation, mixed responsibility, system boundary, state transition, important invariant, or source-backed change axis matches the reviewed material trigger
- **THEN** main remains responsible for the direct cohesive implementation and final locality check
- **AND** no Practice Owner launch is required solely to satisfy the architecture guidance.

#### Scenario: Material trigger routes to the Practice Owner

- **WHEN** a reviewed material change-locality trigger matches the current design decision
- **THEN** main obtains one bounded observation from `openspec-architecture-reviewer`
- **AND** main retains the concrete decision, integration, proof, and finding disposition.

#### Scenario: Production work is delegated

- **WHEN** a bounded implementation worker receives a slice with an applicable responsibility boundary or named change axis
- **THEN** its role-specific contract requires it to preserve that boundary or report the conflict
- **AND** it does not independently broaden architecture, requirements, or write scope.

#### Scenario: Practice Owner finds unnecessary structure

- **WHEN** the architecture/change-locality Practice Owner reports speculative layers inside its exact boundary
- **THEN** main owns reproduction and disposition against the accepted outcome
- **AND** the owner neither authorizes mutation nor becomes a mandatory completion gate.

#### Scenario: Canonical guidance remains context-neutral

- **WHEN** maintained project, skill, agent, and documentation surfaces need the architecture principle
- **THEN** they reference the canonical owner or state only their role-specific behavior
- **AND** the complete principle is not copied across those surfaces.

## REMOVED Requirements

### Requirement: Priority contract does not increase instruction context

**Reason:** The fixed `13,279` token-proxy maximum and frozen-inventory non-growth rule are historical snapshot proxies without a demonstrated quality or runtime boundary. They can force deletion of unique authority while failing to prevent duplication or behavior regression.

**Migration:** Preserve every philosophy-owner, role-delta, impediment-removal, safety, proof, worktree, diagnostics, and live-attempt clause plus its scenarios under `Instruction context quality replaces numeric budget enforcement` and the exact-duplicate contract.

### Requirement: Instruction budgets SHALL have one enforceable seed owner

**Reason:** A checked-in maxima seed converts prior source size into a fail-closed quality gate even though the measurements are approximate and do not establish prompt inclusion or behavioral quality.

**Migration:** Remove the budget seed and materializer after the maintained inventory emits separate diagnostic measurements and strict validation enforces duplicate ownership, canonical form, source uncertainty, and behavior-based no-regression instead.

### Requirement: Tooling ergonomics instruction changes SHALL prove behavior without fuzzy scoring

**Reason:** The replacement requirement preserves every behavior-proof and no-fuzzy-scoring obligation while removing the frozen token-proxy non-growth gate.

**Migration:** Use `Tooling ergonomics instruction changes SHALL prove behavior and context quality without fuzzy scoring`.
