## Context

`instruction-artifacts-inventory` walks Markdown under one repository root and
classifies kit-relative paths. That is a useful catalog inventory, but it does not
represent a consumer's loader-visible instruction surface: project config can
declare external instruction files, project `.opencode` contributes discoverable
skills/agents/commands, and global skill bodies are on-demand rather than one
always-loaded prompt. The current living spec limits are not enforced and have
already been exceeded by inherited changes.

The change must improve measurement without parsing arbitrary secret-bearing
configuration into output or claiming undocumented loader precedence.

## Goals / Non-Goals

**Goals:**

- Preserve and name the existing kit catalog scope.
- Add a bounded loader-visible project scope with explicit evidence classes.
- Separate startup-visible instruction candidates, discovery metadata, and
  on-demand artifact bodies.
- Keep output aggregate, redacted, deterministic, and privacy-safe.
- Establish one checked-in budget seed and validation owner.
- Prove both scopes through installed CLI invocation.

**Non-Goals:**

- Predict provider-specific model tokenization.
- Claim that presence or declaration proves final prompt inclusion or precedence.
- Print external instruction text or repeated-line samples.
- Walk the full consumer repository, vendor trees, evidence, or build output.
- Reduce instruction content or select a future optimized target in this change.

## Decisions

### 1. Preserve catalog mode and add an explicit loader-visible mode

The existing behavior becomes `--source-scope catalog` and remains the default.
`--source-scope loader-visible --project <root>` constructs a bounded manifest
from the maintained runtime-source inspector, conventional instruction locations,
and supported explicit local filesystem entries in OpenCode `instructions`
configuration. It does not recursively classify all project Markdown.

Alternative: redefine the default inventory as runtime cost. Rejected because it
would break existing catalog consumers and conflate startup and on-demand text.

### 2. Record evidence class instead of inferring loaded state

Each loader-visible entry is classified as `runtime-observed`, `config-declared`,
`conventional`, or `unknown`. Totals are grouped as startup-visible candidates,
discovery metadata, and on-demand bodies. The report never merges these categories
into a single “prompt size” claim.

Alternative: label every present file always-loaded. Rejected because current
source evidence does not prove that behavior for every artifact class.

### 3. Read only explicit instruction files and suppress content-bearing output

The loader-visible path reads bytes only for resolved local Markdown instruction
files in the bounded manifest. Remote URLs, unsupported globs, unreadable paths,
and dynamic config become stable unknown rows. External paths are redacted.
Repeated-line output and any excerpt-like field are disabled for this scope.

Alternative: reuse the catalog root walk with ignore globs. Rejected because a
negative ignore list is not a safe or efficient definition of loaded context.

### 4. Keep one reviewed seed and derive every measurement

A checked-in versioned budget seed contains only reviewed maximum token proxies
for the kit catalog and committed global startup authority. Current measured
totals, hashes, lengths, ordering, and drift are generated output and SHALL NOT be
duplicated into the seed. Implementation freezes the first baseline from the
reviewed current candidate and records the older `13,279` / `84,513` targets as
historical reduction debt rather than silently presenting them as green.

Strict validation fails on growth beyond the checked-in maxima or malformed budget
seed. A project loader-visible report is informational unless that project owns an
explicit compatible budget; the kit does not impose one universal consumer limit.

Alternative: hard-code limits in validator source or keep them only in prose.
Rejected because both create synchronized copies or unenforced requirements.

### 5. Prove the installed read-only boundary before tuning policy

Current fidelity rung: repository-only catalog inventory plus manual consumer
source reconciliation.

Next real boundary: installed inventory invocation over the kit and a disposable
consumer containing controlled global, parent, project, `.opencode`, explicit
local, unsupported, and unreadable sources.

Authorization: local read-only source files plus proof-owned disposable fixtures.
Safeguards: no provider, model, credential, network, installation, target-project
mutation, or content-bearing external output. Restoration/cleanup removes only
fixtures and preserves argv, exits, aggregate output, hashes, and cleanup status.

## Risks / Trade-offs

- [Config may contain secrets] -> extract only the supported `instructions` field,
  redact source paths, and never serialize unrelated values.
- [Token proxy is not model tokens] -> retain the existing deterministic proxy name
  and forbid claims of exact provider cost.
- [Budget baselines grandfather debt] -> preserve historical targets and measured
  debt explicitly; this change prevents regression but does not claim optimization.
- [OpenCode source rules change] -> evidence classes and unknown rows prevent a
  stronger claim; update source discovery only with current docs/source/live proof.
- [JSON consumers depend on version 1] -> preserve catalog version 1 when possible;
  version new loader-visible output if its shape cannot be additive.

## Migration Plan

1. Extract/reuse bounded source-manifest discovery and add focused privacy fixtures.
2. Add explicit source scopes and grouped loader-visible output.
3. Materialize and validate the reviewed budget seed from the current candidate.
4. Integrate kit budget validation into strict validation.
5. Update token-economy docs with category definitions and historical debt.
6. Run installed kit/disposable-consumer proof and project-native validation.

Rollback removes loader-visible mode and budget enforcement while retaining the
unchanged catalog CLI. No external or persisted consumer state is migrated.

## Open Questions

None for this increment. Exact runtime prompt composition remains an explicitly
unsupported stronger claim.
