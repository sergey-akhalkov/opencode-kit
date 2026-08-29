## Context

See `proposal.md` for the incident and accepted outcome. The current production path reads one full `SessionDeliveryContextResult`, inserts it unchanged into a pretty-printed audit request, and enforces `maxRequestBytes` only after serialization. Individual arrays and texts are capped, but the full projection repeats todo rows across four views, retains the deprecated `userMessages` alias beside `humanMessages`, and repeats tool output in validation summaries. A read-only reconstruction of the observed incident showed approximately 90 KB of tool evidence, 56 KB of todo views, 30 KB of claim evidence, and 23 KB of validation evidence before wrapper overhead.

The public projection is also used by the `session_delivery_context` tool, while the hidden arbiter is the only consumer that needs a provider-optimized representation. Claim closure and descendant completeness are already fail-closed contracts, so an aggregate-budget correction cannot solve overflow by dropping those fields. The current long-run proof demonstrates safe terminal overflow but has no positive oracle that the production 200,000 byte envelope admits a realistic capped long root.

## Goals / Non-Goals

**Goals:**

- Extend the existing arbiter evidence owner with a private deterministic representation whose reviewed positive population fits the unchanged request budget.
- Preserve the full correlated delivery snapshot for controller state and verdict validation while sending only a losslessly normalized hidden-arbiter view.
- Make exact request bytes, surface contributions, canonical conflicts, and irreducible overflow observable without exposing evidence text.
- Prove the substitution at provider-free, privacy-safe incident, matched baseline/candidate, and installed disposable boundaries.

**Non-Goals:**

- Replacing or versioning the public delivery-context schema.
- Dynamically increasing the budget from provider context size or model routing.
- Compressing arbitrary prose, summarizing evidence semantically, or letting deterministic code decide which requirement matters.
- Guaranteeing that every theoretically valid 32-claim maximum-text document fits 200,000 bytes; such irreducible critical evidence remains an explicit overflow.
- Refactoring unrelated controller, retry, verdict, certificate, campaign, or configuration owners.

## Decisions

### 1. Extend the arbiter evidence owner, not the public projection

`captureArbiterEvidence` continues to return the full redacted `SessionDeliveryContextResult` and the audit epoch retains it for claim-matrix validation, diagnostics, and existing controller behavior. `buildArbiterAuditRequest` projects that value into one private versioned `ArbiterCompletionEvidence` shape immediately before serialization.

The private projection stays in `global/extensions/session-completion-guard/arbiter-evidence.ts` unless implementation shows that one cohesive supporting type file materially improves locality. It does not add normalization responsibility to `global/plugin/session-delivery-context/index.ts`, whose owner remains public capture and projection.

Alternative rejected: change the public schema and every consumer. That creates an unnecessary compatibility migration and does not improve the owning provider boundary.

Alternative rejected: increase or remove `maxRequestBytes`. That converts a representation defect into unbounded provider cost/context risk and conflicts with the finite installed contract.

### 2. Use a versioned canonical evidence shape with lossless refs

The private representation preserves each non-duplicated evidence surface and changes only proven overlaps:

- omit the deprecated `userMessages` alias because the identical `humanMessages` rows remain;
- replace the four todo arrays with one stable `items` collection keyed by event ref and a sorted membership list containing `current`, `ever`, `open`, and `unresolved`; retain todo-history availability/source/tool-call facts;
- retain each validation command/status/time/truncation row and replace its summary with a `toolOutputRef` only when a retained tool row has the same call ref and byte-identical output; otherwise retain the bounded summary;
- preserve claim evidence, human/question/permission facts, requirement signals, descendants, audit/background refs, diffs, synthetic messages, assistant/tool/validation evidence, strategy refs, warnings, counts, and truncation records needed by the hidden agent;
- sort map-derived memberships and refs while preserving the existing evidence ordering where order carries first/latest semantics.

Canonical rows with the same event or call ref must agree on every represented value. A mismatch is an input-state error with only the surface and privacy-safe refs in diagnostics; deterministic code never chooses one conflicting value.

The top-level completion audit request advances to an internal request schema understood by the hidden arbiter instructions and focused validator. This is not a public API version. The output verdict schema and parser remain unchanged.

Alternative rejected: lower all existing per-surface counts until the old shape fits. It discards unique facts while retaining structural duplication and makes long-session behavior depend on arbitrary smaller windows.

Alternative rejected: model-authored summary compression. It adds another inference call, can omit exact refs, and makes the byte safety boundary probabilistic.

### 3. Serialize compact JSON and enforce one exact final-byte invariant

The provider text uses compact `JSON.stringify(request)` inside the existing correlation wrapper. Stable source arrays and explicitly sorted map-derived values make identical fixed input byte-stable. The same final string is measured and passed to `session.prompt`; no later formatting step may alter it.

The runtime limit remains configurable and finite. The reviewed 200,000 byte fixture has a proof-control target of at most 175,000 bytes, reserving 25,000 bytes for wrapper and future schema drift without changing accepted semantics. This headroom is a revisable implementation control, not owner scope. Runtime behavior is governed only by the configured exact limit.

On overflow, diagnostics include total observed/allowed bytes and a bounded, descending list of top-level contribution names and byte counts. They contain no raw text, command, path, session id, or claim statement. Contribution accounting is diagnostic; the exact full-string measurement remains authoritative.

Alternative rejected: gzip or base64 the prompt. The hidden model boundary consumes text, so compression either remains opaque to the model or requires a new decompression mechanism and does not reduce provider context after decoding.

### 4. Keep critical overflow terminal and distinguish representation conflicts

The existing no-child/no-prompt `AuditRequestOverflowError` path remains the final safety net. A canonical identity conflict is also terminal input-state, but its diagnostic names the conflicting surface/ref rather than misreporting byte overflow. Descendant graph incompleteness continues to stop during capture before normalization.

No automatic retry can change immutable request size or a canonical conflict. A new human revision or corrected evidence source may create a new epoch under existing rules; the guard does not loop the unchanged failure.

### 5. Extend the existing proof family and bind the substitution claim

The focused test creates one reviewed long-root fixture matching the observed retained counts: 16 assistant rows, 32 background rows, 32 descendants, 24 diffs, 64 tools, 24 validations, 32 synthetic rows, independently bounded todo views, and four ordinary claim records. It asserts canonical readback matrices, a request at or below 175,000 proof-control bytes and 200,000 runtime bytes, and two identical serializations with fixed generated time.

Negative fixtures cover conflicting refs, descendant graph truncation, and required claim closure that alone cannot fit. They must preserve zero child/model calls and the existing terminal classification.

`tools/proofs/session-completion-guard-long-run.ts` remains the proof owner and gains effect-free `--help`, a provider-free reviewed-fixture mode, and a read-only incident mode that accepts an explicit database path, selects only roots carrying recorded completion overflow diagnostics, and emits counts, hashes, source request sizes, candidate request sizes, contribution bytes, and pass/fail states without session ids or evidence content. Two provider-free replays must have identical evaluated output after volatile timestamps are excluded explicitly.

Behavioral substitution is bounded to one low-ambiguity sub-limit fixture. Baseline and candidate use the same hidden agent/model/variant, human request, initial database, claim facts, and tool-denied environment. The observation matrix compares request correlation, expected verdict disposition, requirement refs/statuses, claim matrix, unresolved cardinality, root side-effect class, and cleanup. It does not compare free-form wording or claim universal model equivalence.

After provider-free and incident lanes pass, one installed disposable OpenCode path runs the low-ambiguity sub-limit matched baseline/candidate pair through the real `session.prompt` boundary. The baseline half may reuse a current terminal capture only if all baseline identities and fixture bytes match; otherwise it receives one bounded non-sensitive configured call. The same installed candidate identity then runs one separate reviewed long-root audit whose baseline request exceeds 200,000 bytes, proving that the corrected production shape reaches a schema-valid correlated verdict rather than only the request builder. The three-call maximum is one baseline, one sub-limit candidate, and one long-root candidate; each preserves exact request bytes, verdict, state, source/environment identity, stdout/stderr, session/process effects, and cleanup.

Before representing the finite-population substitution claim complete, obtain one fresh read-only evidence-sufficiency challenge against the current observation matrix. It cannot authorize mutation or broaden the maximum claim.

## Risks / Trade-offs

- **Canonical memberships hide conflicting rows** -> Require exact value agreement for a shared ref and fail closed on mismatch.
- **Validation refs point to a trimmed tool row** -> Replace a summary only when the exact retained tool output is present; otherwise keep the bounded summary.
- **Compact/private schema changes model interpretation** -> Update the hidden agent contract atomically and run one same-actor matched baseline/candidate observation matrix at the real provider boundary.
- **Future fields exceed the budget** -> Maintain the 175,000 byte positive-fixture control, exact 200,000 byte runtime assertion, contribution diagnostics, and explicit proof invalidation when the private schema changes.
- **Incident replay exposes private content** -> Open the configured database read-only, emit only hashes/counts/bytes/statuses, never persist raw rows, and scan the retained bundle for session ids, paths, prompts, commands, or evidence text.
- **Live database changes during measurement** -> Treat incident readback as a compatibility observation rather than source-of-truth proof; the deterministic synthetic fixture owns byte-stability proof.
- **Loaded source differs from repository source** -> Record `OPENCODE_CONFIG_DIR`, plugin file hash, OpenCode version, model route ref, and disposable data root before the configured path.

## Migration Plan

1. Recheck active ownership and current canonical spec/source identities; stop if an overlapping writer owns the completion-guard, hidden-agent, focused-test, or long-run-proof paths.
2. Implement and prove the private projection with provider-free fixtures before changing hidden-agent instructions or attempting a configured call.
3. Update the hidden arbiter input description and focused validators atomically with the internal request schema, leaving verdict schema and public delivery context unchanged.
4. Run read-only incident compatibility and provider-free replay, then the bounded matched installed path only after all offline gates are green and cleanup is known.
5. Validate the loaded candidate in an isolated disposable config/data root. Ordinary active sessions continue using their already-loaded source until an explicit restart.
6. Roll back by restoring the prior completion-guard/agent source and restarting the affected OpenCode process; no persisted schema or project data migration is required.

## Proof Boundary

- **Current Fidelity Rung**: Current source/spec inspection plus privacy-safe read-only measurements of eight terminal overflow diagnostics; no candidate behavior exists yet.
- **Next Real Boundary**: Production request builder over the reviewed synthetic long-root fixture with zero model calls, followed by privacy-safe incident readback.
- **Authorization**: Local source/spec/test changes, disposable databases/processes, read-only access to the configured OpenCode database, and at most three non-sensitive configured arbiter calls under standing local authorization: one matched sub-limit pair plus one candidate long-root audit. No remote mutation, deployment, release, credential change, or ordinary-user activation.
- **Safeguards**: Exact finite byte limit, all-tools-denied arbiter, immutable correlation, critical-evidence fail-closed behavior, no private incident content, no unchanged live retry, and scoped source/data/process identity.
- **Restoration/Cleanup**: Remove proof-owned databases, sessions, processes, config roots, and staged source copies; leave the real OpenCode database unchanged; retain only bounded redacted raw/evaluation bundles.
- **Expected Immutable Evidence**: Fixture and incident raw/evaluation bundles, baseline/candidate observation matrix, installed request/verdict capture, source/environment manifests, privacy scan, exact cleanup record, two provider-free replay digests, and applicable validation output.
