## ADDED Requirements

### Requirement: Repeated-use repository CLIs SHALL be self-discoverable

The loaded portable instruction contract SHALL require every repository-owned CLI
introduced or materially extended for repeated operator, agent, or proof use to
support `--help` and `-h` before ordinary command, required-value, output-root, or
side-effect validation. Both help forms SHALL perform no product, evidence,
network, credential, process-owner, or other declared operational effect; SHALL
print the available commands or modes plus required and optional arguments; and
SHALL exit `0` through the actual installed or loaded entry point before project
documentation recommends them.

The contract SHALL allow one conventional help probe when discovering an existing
CLI. When help is unsupported or returned as a usage failure, the caller SHALL
inspect the project-native inventory, source, or schema and SHALL NOT guess flags
or retry help variants. Unsupported help SHALL be classified as a product defect
only when the accepted product contract promised help.

True one-shot scripts and third-party or historical CLIs that are not being
introduced or materially extended SHALL NOT acquire a retrofit obligation solely
from this requirement.

#### Scenario: Agent authors a repeated-use proof CLI

- **WHEN** an implementation-capable agent introduces a repository-owned CLI that
  later operators or agents will invoke repeatedly
- **THEN** the installed `--help` and `-h` paths exit `0`, enumerate commands and
  arguments, and create no declared output or operational effect
- **AND** the maintained inventory documents only that proven interface.

#### Scenario: Existing CLI rejects help

- **WHEN** one bounded `--help` probe returns unknown-command, positional-argument,
  unsupported-command, or usage-failure output
- **THEN** the agent stops probing and discovers the invocation from maintained
  inventory, source, or schema without inventing flags
- **AND** it does not call the CLI broken unless its accepted contract promised
  successful help.

#### Scenario: Tiny one-shot script has no repeated consumer

- **WHEN** a scenario-local script is not intended for repeated operator, agent,
  proof, or maintained project use
- **THEN** the instruction contract does not require a help interface solely for
  that script
- **AND** all existing safety, effect, and cleanup rules still apply.

### Requirement: Mechanical structured artifacts SHALL be materialized deterministically

Before an agent authors or materially changes a durable structured artifact, the
loaded contract SHALL require it to identify whether the artifact contains hashes,
byte lengths, counts, indexes, or ordering mechanically derived from named inputs;
mirrored rows or identifiers that must remain synchronized; or more than one
variant generated from the same closed shape. When any such trigger is present,
the authoritative artifact SHALL be materialized or validated by the smallest
repository-owned deterministic helper from a compact reviewable semantic seed.

The helper SHALL have explicit inputs and outputs, stable ordinal ordering,
privacy-safe cause-preserving diagnostics, closed failure behavior, output
readback/schema validation, and a deterministic regeneration or drift check. It
MUST NOT infer semantic values, requirements, policy, risk, priority,
classification, or correctness. The reviewed seed SHALL remain the owner of every
semantic choice.

A small one-off semantic record with no mechanical trigger MAY remain manually
authored. File length alone SHALL NOT force a generator, and intentionally
generated raw evidence SHALL NOT be prohibited by this requirement.

#### Scenario: Durable plan contains derived identities and variants

- **WHEN** an authoritative plan contains source hashes and byte lengths, requires
  ordinal identifier ordering, and produces multiple guard variants
- **THEN** the agent creates or extends a deterministic materializer/validator and
  keeps semantic values in a compact reviewable seed
- **AND** regeneration produces stable validated output without model-authored
  copies of the complete plan.

#### Scenario: Generator cannot derive a semantic decision

- **WHEN** a required field represents policy, classification, risk, or another
  judgment not derivable from explicit input facts
- **THEN** the helper reports that input as unsupported or blocked instead of
  selecting a value
- **AND** the semantic decision remains in the agent or owner layer.

#### Scenario: Small one-off JSON is fully semantic

- **WHEN** one bounded record has no derived identity, synchronized mirror, or
  variant-family trigger and is clearer as direct data
- **THEN** the agent may author and validate it without adding a generator
- **AND** the absence of helper code is not treated as a quality failure.

### Requirement: Tooling ergonomics instruction changes SHALL prove behavior without fuzzy scoring

The kit SHALL retain a tooling-ergonomics instruction change only after bounded
disposable same-model baseline and candidate workflows use identical non-sensitive
prompts, model/profile, tool permissions, and environment and preserve candidate,
runner, evaluator, and cleanup identities. The workflow SHALL cover repeated-use
CLI help and mechanical structured-artifact materialization, with maintained source
placement and small-one-off proportionality as no-regression controls.

The evaluator SHALL derive exact facts from produced files, command invocations,
exit status, stdout/stderr, hashes, locations, and cleanup. It MUST NOT score prose,
infer intent, rank quality, or use a model to evaluate the model output. Baseline
evidence SHALL reproduce the decision gap for every claimed improvement; candidate
evidence SHALL demonstrate the specified behavior without losing safety, role, or
no-overengineering oracles. Structural marker validation alone SHALL NOT establish
behavior improvement.

When baseline already satisfies a proposed behavior, the evaluator SHALL record it
as a control, the candidate SHALL preserve it, and the change MUST NOT add policy
for that behavior from plausibility alone.

#### Scenario: Candidate creates a self-documenting CLI

- **WHEN** baseline and candidate receive the same repeated-use CLI authoring
  scenario through the installed OpenCode boundary
- **THEN** the evaluator executes the produced help paths and records exact exit,
  usage, effect, source-placement, and cleanup facts
- **AND** only a candidate with exit-zero effect-free complete help satisfies that
  scenario.

#### Scenario: Candidate materializes variants from a semantic seed

- **WHEN** baseline and candidate receive the same hash/order/variant-heavy
  structured-artifact scenario
- **THEN** the evaluator reruns the produced materializer/validator and compares
  stable output identities and schema facts
- **AND** handwritten duplicated complete variants do not satisfy the candidate
  oracle.

#### Scenario: Baseline does not reproduce a claimed decision gap

- **WHEN** the frozen baseline already satisfies one proposed behavioral oracle or
  the raw output cannot distinguish the decision
- **THEN** that instruction claim remains unproved and is revised, discarded, or
  reported blocked
- **AND** the change is not retained from structural plausibility alone.

#### Scenario: Maintained-source behavior is already effective

- **WHEN** baseline keeps repeated generator source outside ignored output, invokes
  it, creates exact disposable cases, and leaves the tiny semantic record manual
- **THEN** source placement and proportionality are recorded as controls rather
  than claimed instruction improvements
- **AND** the candidate must preserve those exact controls.

#### Scenario: Instruction context remains bounded

- **WHEN** the canonical clauses and role deltas are added
- **THEN** deterministic inventory confirms the candidate does not increase either
  frozen baseline token proxy
- **AND** any inherited normative-ceiling breach is reported rather than repaired
  by deleting unrelated safety authority.
