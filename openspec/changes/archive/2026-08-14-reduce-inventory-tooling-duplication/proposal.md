## Why

Independent review found two exact local duplications in maintained inventory
tooling: the instruction inventory reimplements an existing Markdown walker, and
the code-quality inventory test reimplements the shared process/fixture harness.
Both copies increase change and review cost without owning distinct behavior.

## Outcome Capsule

- **Outcome:** Inventory tooling reuses the existing matching production walker and
  shared test harness while preserving every CLI, output, ignore, and test oracle.
- **Operating Envelope:** Two proven internal reductions in kit TypeScript tooling;
  no new abstraction, package, CLI option, or consumer behavior.
- **Non-Goals:** Merge the three inventory CLIs; unify their different ignore sets;
  remove `largeFiles` or `--fail-on-split-candidates`; redesign inventory scope;
  refactor session-completion-guard tests.
- **Non-Deferrable Invariants:** Catalog contents and ordering remain byte-stable
  after normalization of nondeterministic fields; CLI argv/exits and JSON version
  remain compatible; all unique focused test oracles remain.
- **Observable Proof:** Before/after installed instruction inventory outputs match,
  focused code-quality inventory tests preserve all four scenarios, and full kit
  validation remains green.
- **Material Residual Risks:** Unread external consumers may depend on undocumented
  output details; concurrent loader-visible inventory work touches the same
  production file and must be serialized.
- **Stop Line:** Stop after the two reviewed reductions, focused proof, complete
  validation, and code-quality readback. Broader inventory architecture remains
  outside this change.

## What Changes

- Replace the private `walkMarkdown` implementation in
  `tools/instruction-artifacts-inventory.ts` with the existing equivalent
  `walkMarkdownFiles` owner from `tools/validators/context.ts`.
- Replace the private process/fixture/assertion harness in
  `tools/test-code-quality-inventory.ts` with `tools/test-helpers/library.ts`,
  adding only a minimal code-quality invocation helper if needed.
- Retain all distinct inventory ignore policies, CLI main guards, scripts, JSON
  contracts, and focused test cases.
- Serialize this reduction before `measure-loader-visible-instruction-budget`,
  which intentionally builds on the resulting instruction-inventory owner.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `library-tools-architecture`: Require reuse of the existing equivalent walker and
  test harness for these inventory owners without changing public behavior.

## Impact

- Affected code: `tools/instruction-artifacts-inventory.ts`,
  `tools/test-code-quality-inventory.ts`, and at most one invocation helper in
  `tools/test-helpers/library.ts`.
- Expected reduction: approximately 80 local lines and two duplicated concepts.
- Compatibility: no intended CLI, schema, output, ignore, script, or test-oracle
  change.
- Dependencies: no new package or module; uses existing project owners only.
