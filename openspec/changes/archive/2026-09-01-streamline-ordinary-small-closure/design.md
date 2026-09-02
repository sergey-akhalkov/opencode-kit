## Context

See `proposal.md` for the observed authoring friction and SOSC-001 claim boundary. Earlier planning combined compact OpenSpec artifacts with team-advice routing and used one `profile` field as both artifact selection and risk proof. Review showed that this was fail-open: the model selecting `ordinary-small` could also suppress the controls that would challenge that selection. Team routing now belongs to `make-team-advice-evidence-triggered`; this change owns only OpenSpec artifact contracts and touched syntax-versus-prose validation.

The active ownership order is `add-outcome-preserving-delivery-checkpoints` (OPDC), then `add-leaf-first-task-decomposition` (LFTD), then `prefer-composable-capability-owners` (CCO), then this change. The inventory resolves overlap only through a direct dependency or transfer between each pair, so this change declares direct dependencies on all three predecessors rather than relying on transitive order. It remains mutation-disabled until current writers are terminal and exact owners transfer.

The current fidelity rung is planning plus provider-free structural evidence. The first later real boundary is the production operation gate in a disposable repository, followed by one installed compact authoring scenario. No external, remote, deployment, install, credential, destructive, or consumer-project effect is authorized. Configured proof uses current-run diagnostics only; it SHALL NOT create a retained replay corpus or repository evidence bundle. Proof-owned roots, sessions, processes, and temporary output are automatically cleaned.

## Goals / Non-Goals

**Goals:**

- Separate artifact-shape selection from semantic risk disposition.
- Fail closed when metadata is missing in part, malformed, stale, Material, or unknown.
- Preserve legacy/full behavior while allowing a genuinely compact exact-case contract.
- Omit only non-applicable mechanism records and no-event history.
- Keep exact validation at parser boundaries and use behavior oracles for human policy.
- Reach the production operation gate and installed compact route before expanding the finite SOSC-001 population.

**Non-Goals:**

- Do not change team-advice, catalog, Practice Owner, LFTD, OPDC, CCO, protected-boundary, or qualification semantics.
- Do not infer risk or artifact value from prose, paths, counts, diffs, or helper scoring.
- Do not add another agent, skill, registry, workflow database, or evidence ledger.
- Do not rewrite active or archived change bytes solely to adopt structured metadata.
- Do not retain configured-run replay bundles or proof archives.

## Decisions

### 1. Use separate artifact and risk axes

New structured changes use two reviewed inputs:

```yaml
artifactProfile: compact | full
riskDisposition:
  kind: ordinary-small-exact | material | unknown
```

The metadata reader normalizes both fields absent to `artifactProfile: legacy`, which preserves current strict behavior. `legacy` is a compatibility state, not a new profile authors select. Exactly one field present, an unsupported value, or a non-object risk disposition is invalid.

| Normalized artifact profile | Risk disposition | Result |
|---|---|---|
| `compact` | `ordinary-small-exact` | Compact contract is structurally eligible while the disposition remains current. |
| `full` | `ordinary-small-exact` | Full contract is valid; richer artifacts do not change the risk class. |
| `full` | `material` | Full Material contract and review routes apply. |
| `full` | `unknown` | Full artifacts may be authored, but semantic readiness and implementation mutation remain blocked until risk resolves. |
| `legacy` | absent | Existing legacy-strict contract applies. |
| `compact` | `material` or `unknown` | Invalid; operation gates fail before mutation. |

Artifact shape never authorizes risk. Main owns the evidence-based risk disposition under current loaded Material and Practice Owner triggers. Deterministic code validates only explicit shape, enum, correlation, and stale-state inputs; it does not decide whether work is Ordinary Small or Material.

Alternative rejected: one `profile: ordinary-small | material` field. It lets the same model assertion select both risk and weaker artifacts. Alternative rejected: independent exemption booleans. They recreate synchronization burden and invalid combinations.

### 2. Material evidence invalidates compact selection before mutation

Apply rereads current request, candidate, ownership, and loaded trigger facts before substantial mutation. If a named Material boundary or decision-material surface appears after compact selection, the compact disposition becomes stale. Main changes the metadata to `artifactProfile: full` plus `riskDisposition.kind: material` or `unknown`, creates the full required artifacts, and reruns affected readiness checks. This is an outcome-preserving process correction and does not need owner approval unless accepted product semantics or a protected action changes.

Unknown never defaults to Ordinary Small. A stale or unknown compact record cannot be repaired by prose, file size, test count, or a successful deterministic gate.

Alternative rejected: trust the original compact declaration until implementation fails. That moves risk discovery behind dependent work and weakens the before-mutation Material route.

### 3. Compact omits only mechanisms that are actually absent

A compact exact proposal retains one concise accepted contract: `Outcome`, `Operating Envelope`, `Non-Goals`, `Non-Deferrable Invariants`, `Observable Proof`, and `Stop Line`. `Observable Proof` is also the exact-case claim boundary. It may omit:

- `Material Residual Risks` when no material risk remains inside the reviewed exact envelope;
- a separate `Claim And Evidence Scope` when no broad-claim trigger exists;
- `Delivery Horizon` when no explicit Horizon link exists;
- `Automation Dividend` when no repeated-use behavior is introduced or extended;
- `Bounded Falsification Review` and `falsification-review.md` when there is no decision-material surface;
- `history.md` when no materially distinct strategy was considered or attempted.

An explicitly present horizon, dividend, broad claim, falsification episode, or strategy event keeps its existing parser and correlation checks. A broad claim or decision-material surface requires full artifacts even if the behavioral change itself is locally reversible.

Alternative rejected: generate explicit `none` and `exempt` declarations. That automates typing but preserves artifact count, mirror drift, and no-op completion work.

### 4. Full and legacy retain the complete contract

`full` requires the complete seven-field capsule and currently applicable claim, horizon, dividend, falsification, history, task, and archive controls. `material` requires full. `unknown` uses full shape but cannot be semantically ready or mutate until resolved. Missing both fields uses legacy-strict parsing so existing active and archived changes need no migration.

Explicit full authoring remains available to Ordinary Small work when a broad claim, repeated automation, Horizon link, materially distinct strategy, or other useful record exists. Full therefore does not imply Material, and compact does not prove Ordinary Small.

### 5. Exact-string checks remain only at machine boundaries

Each touched validator marker is classified as parser-facing syntax, stable identifier/schema value, generated fragment, or human-readable policy. The first three may retain exact validation. Human-readable policy uses one canonical semantic owner, structural checks for owner/section/stable identifiers, and positive/negative operation or installed fixtures. No complete policy sentence is synchronized across independently maintained prose.

This change removes only exact prose coupling on the touched OpenSpec artifact route. It does not launch a repository-wide validator rewrite.

### 6. Reuse current proof owners and prove the shortest route first

The automation dividend extends current OpenSpec operation-gate and configured consumer-outcome owners with explicit reviewed SOSC-001 rows. Seed data carries expected risk and artifact facts; deterministic helpers validate only those fields and observable outcomes.

Proof order:

1. Provider-free metadata normalization and invalid-combination controls.
2. Production propose/apply/archive operation gates in disposable changes.
3. Actual installed compact Ordinary Small authoring with representative artifact and cleanup oracles.
4. Full Material, full unknown, stale compact, explicit optional-mechanism, and representative legacy controls.
5. Syntax-versus-prose deliberate defects and finite SOSC-001 readback.

After a failed configured run, inspect its exact invocation, identity, status, stdout/stderr, effects, diagnostics, and cleanup. Another equivalent configured call requires a causally different mechanism or the exact missing observation. Current-run diagnostics determine that decision; no retained replay corpus is created.

### 7. Reconcile exact active owners before production mutation

The scaffold remains `mutationEnabled=false`. Before apply, OPDC must archive with terminal writers, then LFTD, then CCO, with current manifests, canonical specs, source, dirty worktree, and runtime identities reread at each transfer. This change declares a direct dependency on every overlapping predecessor because transitive dependency does not resolve a pairwise inventory overlap. Exactly one active change may mutate each overlapping root.

Alternative rejected: edit apparently free files now. That would mix loaded candidates and invalidate later proof. Alternative rejected: edit excluded predecessor manifests to clear their existing AUD-007 finding. That exceeds this change's scope and would overwrite another owner's planning state.

## Risks / Trade-offs

- **[Main misclassifies risk]** -> Compact requires explicit current evidence; Material triggers override it; unknown uses full and blocks mutation; installed red controls exercise stale and conflicting combinations.
- **[Artifact metadata becomes new ceremony]** -> Two fields replace multiple no-op declarations and encode independent facts; legacy records need no migration.
- **[Partial metadata silently downgrades]** -> Exactly one field present is invalid rather than legacy or compact.
- **[Legacy proposal breaks]** -> Both fields absent normalizes to legacy-strict and representative records remain fixtures.
- **[Phrase-check removal hides drift]** -> Keep stable syntax checks and require deliberate behavior defects to fail before removing a sentence mirror.
- **[Configured proof becomes retained evidence infrastructure]** -> Use current-run diagnostics and automatically cleaned temporary roots only; retain only reviewed project-native seed bytes.
- **[Planning order churns]** -> Keep mutation disabled and use direct pairwise dependencies without editing excluded predecessors.
- **[Finite population is overgeneralized]** -> Preserve the SOSC-001 maximum claim and unresolved observations.

## Migration Plan

1. Wait for OPDC, LFTD, and CCO to archive in order with terminal writers; reread current ownership and source before exact transfer.
2. Add two-axis metadata normalization with both-absent legacy fallback and partial/invalid fail-closed diagnostics.
3. Add compact/full/legacy operation-gate behavior and provider-free deliberate defects.
4. Update loaded propose/apply/archive instructions and touched structural validators.
5. Run the production disposable gates, then the installed compact happy path, then stronger controls.
6. Remove only superseded full-sentence mirrors after replacement red/green discrimination is observed.
7. Roll back by disabling structured profile selection and retaining legacy-strict behavior; existing records remain readable throughout.
