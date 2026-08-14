## Context

The always-loaded runtime contract already requires repository-native proof
tooling, exact invocation inventories, explicit I/O, deterministic helpers, and no
sole proof-tool source in disposable output. It does not currently establish the
authoring-time interface that makes those tools easy for a later agent to use:

- repeated-use repository CLIs can reject `--help` even when their proof inventory
  tells callers to use it;
- the helper admission rule waits for repeated work and therefore does not trigger
  before the first durable artifact containing mechanically derived hashes,
  lengths, ordering, or repeated schema variants;
- the observed ignored-source defect could recur only if the current maintained-
  source rule is ineffective, which requires behavior evidence rather than a
  second plausible policy copy.

The observed `pmac-emulator` evidence is a navigation and workflow baseline, not a
target of this change. Installed commands showed three incompatible unsupported
`--help` behaviors and one help-as-error behavior while the maintained inventory
recommended `--help`. A checked-in 698-line structured plan has no materializer,
and unique 483-line Python and 412-line Rust harness sources live only below
ignored `target/`. Archived evidence also records one ad-hoc PowerShell capture
that emitted `null` booleans and three materially similar dynamic-layout replay
failures before a typed evaluator replaced that mechanism.

This is a `Material` instruction behavior change because it modifies loaded
lifecycle/safety-adjacent authoring policy. Planning remains
`Development-Stage: development`. The exact current working-tree instruction
inputs, including unrelated owner changes, must be frozen before mutation and
preserved throughout baseline/candidate comparison.

## Goals / Non-Goals

**Goals:**

- Put one concise canonical policy in existing `global/AGENTS.md` sections so it
  is available before a repeated-use CLI or mechanical structured artifact is
  authored.
- Make repeated-use repository CLIs expose safe, successful, complete help and
  make callers stop guessing when an existing or third-party CLI lacks that
  contract.
- Use a compact semantic seed plus the smallest deterministic materializer/
  validator when structured data contains mechanically derivable identity fields
  or schema variants.
- Preserve the current maintained-source behavior, role boundaries, small-one-off
  proportionality, project neutrality, and existing helper safety rules.
- Prove the instruction behavior with same-model disposable workflows and enforce
  only exact structural markers through deterministic validation.

**Non-Goals:**

- Implementing `--help`, generators, or source moves in `pmac-emulator` or another
  target repository.
- Requiring help for third-party tools, true one-shot scripts, build products, or
  binaries that are never intended for repeated agent/operator use.
- Requiring a generator because of line count alone, replacing small semantic
  records with code, or banning intentionally generated raw evidence.
- Selecting a CLI parsing library, adding a package dependency, creating generic
  command metadata, or standardizing every project's CLI output format.
- Letting a generator infer semantic values, policy, classification, priority, or
  correctness; those remain authored and reviewed decisions.
- Widening SDET production authority, allowing main to author Material test
  artifacts, or turning instruction-artifact review into an implementation gate.

## Decisions

### 1. Extend existing canonical clauses instead of adding a new policy chapter

`global/AGENTS.md` remains the sole complete runtime owner. The change edits only
the existing proof-inventory and deterministic-helper clauses that map to the two
reproduced gaps. Specialist and review artifacts remain unchanged.

This keeps the high-frequency decision close to its authoring trigger and avoids
another section that a cold agent must reconcile. README curation text and
deterministic contracts mirror only compact discovery markers, not the full rule.

Alternative rejected: put the rule only in `change-ready-sdlc`. The observed
ergonomic failures are reachable in Ordinary Small work and before Material
qualification is selected. Alternative rejected: put it only in a project
template. Existing repositories and direct global sessions would miss it.

### 2. Define one narrow repeated-use CLI help contract

A repository-owned CLI is in scope when it is intended for repeated operator,
agent, or proof use. Its `--help` and `-h` paths are parsed before ordinary command,
required-value, output-root, or side-effect validation; print command/mode names
and required/optional arguments; perform no product or evidence mutation; and exit
`0`. A focused invocation proves stdout/stderr, exit, and absence of declared
effects through the installed entry point before docs recommend the flag.

Caller behavior is separate: an agent may probe help once. If an existing,
third-party, or historical CLI rejects help or returns it as usage failure, the
agent reads the project inventory, source, or schema and does not guess flags or
retry help variants. Unsupported help is classified as a product defect only when
the accepted contract promised it.

Alternative rejected: require a parser framework or generated command registry.
The behavior can be implemented with existing project mechanisms and no
dependency. Alternative rejected: forbid `--help` probes. The conventional probe
is useful when supported; the defect is unsupported documented behavior and
unbounded guessing, not the probe itself.

### 3. Trigger generation from mechanical derivation, not file size

Before authoring a durable structured artifact, the production author checks for
these concrete triggers:

- hashes, byte lengths, counts, indexes, or ordering mechanically derived from
  other named inputs;
- mirrored rows or identifiers that must remain synchronized;
- more than one variant generated from the same closed shape.

When any trigger is present, the smallest repository-owned deterministic helper
materializes or validates the authoritative artifact from a compact reviewable
semantic seed. The helper has explicit input/output, closed failure behavior,
stable ordinal ordering, privacy-safe diagnostics, output readback/schema
validation, and a regeneration/drift check. It may calculate mechanical facts but
cannot choose semantic values, requirements, risk, policy, or classification.

Small one-off records with no derived fields or variant family remain manual. A
large cohesive static semantic table may also remain data when no mechanical
derivation trigger exists; line count is only navigation evidence, never the gate.

Alternative rejected: wait until a step repeats. The first authoritative artifact
can already contain enough mechanical entropy to justify automation. Alternative
rejected: generate every JSON file. That replaces reviewable data with unnecessary
code and conflicts with outcome-first simplicity.

### 4. Retain source placement as a no-regression control

The frozen baseline placed its repeated generator under maintained `scripts/`,
kept only generated cases under ignored `target/`, invoked the generator, and left
the tiny semantic record manual. This exact result shows that the current global
maintained-source rule already governs the synthetic scenario. The candidate does
not add or duplicate placement/SDET policy; paired evaluation requires this control
to remain green.

### 5. Extend deterministic structural enforcement, but prove behavior separately

Existing contract constants, validators, and tests will enforce only exact
operative facts:

- the canonical global clauses contain the CLI and mechanical-generation behavior;
- permissions, role ownership, and forbidden-production-routing checks remain
  byte/semantically compatible;
- `global/AGENTS.md` and complete instruction inventory stay within the normative
  token-proxy ceilings.

The behavior lane uses a new bounded TypeScript runner under `tools/proofs/**`,
reusing the current proof inventory conventions and
`tools/proofs/lib/opencode-proof-client.ts` where its session/cleanup contract
fits. It creates isolated baseline and candidate global-source fixtures from the
same frozen working-tree inputs, uses the same configured model/profile and exact
non-sensitive prompts, captures tool calls/files/exits/stdout/stderr, and removes
all disposable sessions and roots in `finally`. The evaluator derives only exact
facts from produced files and executed commands; it does not score prose.

The three scenario classes are:

1. repeated-use CLI: create and invoke a tiny local CLI; observe effect-free
   `--help`/`-h`, complete usage, and exit `0`;
2. mechanical structured artifact: create a seed plus at least two variants with
   derived hash/length/order facts; rerun the materializer and require stable
   validated output rather than model-authored duplicated JSON;
3. source placement/proportionality control: require the already-compliant baseline
   and candidate to keep reusable source outside ignored output and a tiny one-off
   semantic record manual.

Baseline must reproduce each claimed improvement gap. A scenario already satisfied
by baseline becomes a no-regression control and authorizes no new policy. Candidate
capture must improve the two gaps without losing safety, source-placement,
tiny-one-off, or cleanup controls. One configured-model call per scenario per side
is the bound; evaluator corrections replay preserved bundles without another call.

Reuse disposition: `extend`. Local candidates are the existing OpenCode proof
client, baseline/candidate capture/evaluator patterns in `reuse-discovery.ts` and
`deduplication-audit.ts`, instruction inventory, contracts, and validation
orchestrator. A new scenario-specific runner is still required because neither
existing proof owner evaluates CLI-authoring, structured-materialization, and
source-placement decisions. No dependency or generic framework is added.
Cross-project registry impact is `not-applicable`: the runner validates this
repository's installed instruction behavior and is not a shared product
capability.

### 6. Preserve token and unrelated-work identity

The normative ceilings remain `13,279` for `global/AGENTS.md` and `84,513` for the
complete inventory, but the frozen unrelated working tree already measures
`16,600` and `100,853`. This change must not increase either proxy and records the
inherited breach; restoring the absolute ceilings would require unrelated scope.

Implementation freezes exact pre-change hashes/diff for all touched instruction
artifacts. Existing unrelated working-tree changes, including the current
compaction-improvement edits in `global/AGENTS.md`, remain intact and are included
unchanged in both baseline and candidate identity.

## Fidelity Ladder

```text
observed installed-CLI and artifact evidence
  -> current source/spec/instruction inventory
  -> provider-free synthetic fixture and structural preflight
  -> same-model baseline capture on frozen current instructions
  -> smallest canonical instruction and role-delta mutation
  -> same-model candidate capture with identical prompts/environment
  -> offline exact-fact evaluator/replay and token/role validation
  -> installed global loader readback in an isolated local config
  -> future target-project CLI/generator migrations (out of scope)
```

The next real boundary is a provider-free synthetic fixture followed by the same-
model baseline through the installed OpenCode entry point. It is reachable under
standing authorization with non-sensitive inputs and bounded configured-provider
calls. Safeguards are isolated config/project/data roots, no credentials output,
no external directories, no remote/destructive/install tools, exact call bounds,
session deletion, and terminal cleanup evidence. Raw baseline/candidate bundles
remain immutable; evaluator changes replay them without another model call.

## Risks / Trade-offs

- **[The policy over-engineers small scripts or JSON]** -> Scope by repeated-use
  intent and concrete mechanical derivation/variant triggers; include a tiny-one-
  off scenario that must remain manual.
- **[Help becomes a side-effect path]** -> Parse help before ordinary validation,
  execute the installed help path, and assert no declared output/effect mutation.
- **[A generator hides semantic decisions]** -> Keep semantic values in a compact
  reviewed seed and prohibit inference/ranking/classification in helper code.
- **[SDET placement wording widens test authority]** -> Require the existing exact
  test-only write scope and `blocked` when no maintained path is authorized; keep
  production paths forbidden.
- **[Additional global wording increases context cost]** -> Replace/consolidate
  existing clauses and enforce both token-proxy ceilings.
- **[Behavior changes are model-sensitive]** -> Use identical bounded baseline/
  candidate workflows, preserve raw outputs and Effective Model, and claim only
  the observed scenario result.
- **[A baseline scenario does not reproduce the observed decision]** -> Do not
  retain instruction text on plausibility alone; refine the non-sensitive fixture
  from preserved evidence or mark the behavior claim blocked.
- **[Existing product CLIs remain inconvenient]** -> Keep product fixes as explicit
  future scope; this change prevents recurrence but does not retrofit consumers.

## Migration Plan

1. Freeze the current working-tree instruction sources, exact unrelated diff,
   token inventory, installed loader/model/profile identity, scenario prompts, and
   baseline evidence root before instruction mutation.
2. Implement provider-free runner preflight and obtain the bounded same-model
   baseline captures; stop or revise the proof fixture if the claimed gap is not
   reproduced.
3. Replace/consolidate the canonical global clauses, add terse worker/SDET/review
   deltas, and update deterministic markers/tests without widening permissions.
4. Run structural/token validation, then capture the candidate through the same
   installed entry point and exact prompts; replay/evaluate both immutable bundles.
5. Complete fresh critical SDET for the Material instruction candidate, full
   project validation, isolated installed-loader readback, README/spec/history
   synchronization, and local handoff.

Rollback restores only this change's instruction, contract, test, proof-runner,
README, and spec edits while preserving unrelated working-tree content and raw
baseline/candidate evidence. No persisted product data, provider configuration,
installation, remote state, or migration exists.

## Open Questions

None. Exact fixture source names and evidence-root IDs are implementation controls;
they do not change the accepted behavior or protected boundaries.

Standards Impact: no product, protocol, deployment, safety, security, privacy, or
certification standard is changed. The increment affects only portable OpenCode
instruction quality, deterministic evidence, and local maintainability controls.
