## Context

Doctor report version 2 deliberately separates structural severity,
qualification impact, and unattended readiness. That separation is useful for
interactive diagnosis, but the process exit follows only structural severity.
The runtime-source inspector already records privacy-safe source locations and
canonical collisions, yet doctor does not consume that evidence. The two tools
therefore expose related facts through incompatible automation boundaries.

This change touches two import-safe local CLIs and their focused disposable
fixtures. It adds no dependency and does not change OpenCode loading.

## Goals / Non-Goals

**Goals:**

- Preserve the current informational doctor report as the default.
- Add one explicit selected gate whose process exit matches its reported result.
- Print every blocker for the selected gate in stable order.
- Reuse runtime-source discovery and redaction for canonical collision checks.
- Make runtime-source help effect-free and discoverable.
- Prove behavior through the installed CLIs over disposable source layouts.

**Non-Goals:**

- Infer or change undocumented OpenCode precedence.
- Treat every additive instruction, config, or `AGENTS.md` source as a blocker.
- Migrate consumer overlays or edit another repository.
- Execute adapter validation argv or any project command.
- Redesign adapter schema validation.

## Decisions

### 1. Add an explicit `--require` gate and preserve the default report

`doctor --require structural|qualification|unattended` selects exactly one exit
contract. Exit `0` means the selected gate passed, exit `2` means it is blocked,
and exit `1` remains usage or diagnostic failure. Structural warnings continue
to pass the structural gate. Without `--require`, doctor retains its current
informational process-exit behavior for compatibility.

Alternative: make every qualification block change the default exit. Rejected
because existing callers may intentionally use doctor as a structural inventory;
an explicit gate narrows the compatibility change and makes intent visible.

### 2. Report named blockers as first-class derived output

Doctor derives stable ordered blocker arrays from the same per-check records that
derive each top-level status. Markdown prints them next to the selected result;
JSON exposes them as structured fields. No second policy table is introduced.

Alternative: rely on the existing table's `Blocks Qualification` column. Rejected
because automation and cold readers would need to reinterpret every row and
unattended checks use a different shape.

### 3. Reuse runtime-source inspection for canonical authority only

Doctor calls the existing import-safe runtime-source inspector and classifies
collisions using the maintained canonical OpenSpec skill and command names.
Unknown precedence for those names blocks qualification and unattended readiness.
Other additive sources remain visible diagnostics and do not become blockers.
Collision output retains the inspector's redaction and never reads config content
into the report.

Alternative: duplicate source discovery inside doctor. Rejected because it would
create a second source model and drift from `opencode:sources`.

Alternative: block every duplicate source kind. Rejected because additive global,
project, and explicit instruction/config layers are expected behavior.

### 4. Parse help before all source discovery

`opencode-runtime-sources --help` and `-h` print usage, list `--root`, perform no
source walk, and exit `0`. Unknown options fail with usage and exit `1` rather
than being silently ignored.

### 5. Use a provider-free disposable runtime boundary

Current fidelity rung: source inspection and existing CLI observations.

Next real boundary: invoke the installed CLIs against disposable project,
host-default, and custom-global layouts containing controlled canonical and
non-canonical collisions.

Authorization: local disposable file creation and process execution only.
Safeguards: isolated environment variables and roots; no provider, model,
credential, installation, activation, target-project mutation, or remote action.
Restoration/cleanup: remove only proof-owned fixtures; preserve command, exit,
stdout, stderr, source identities, and cleanup status as immutable evidence.

## Risks / Trade-offs

- [Existing callers assume ignored unknown options] -> reject unknown options only
  in the runtime-source CLI and document the change.
- [Presence does not prove runtime winner] -> report unknown precedence and fail
  closed only for canonical authority under the selected lifecycle gate.
- [Doctor imports a CLI with top-level effects] -> retain and test the existing
  import-safe main guard before composing the inspector.
- [Default exit remains easy to misuse] -> documentation and output name the
  explicit `--require` modes; automation proof uses only an explicit gate.
- [OpenCode changes loader semantics] -> retain the evidence gap and require a
  later isolated loader proof before making a stronger precedence claim.

## Migration Plan

1. Add focused fixtures and help/argument behavior.
2. Add structured blocker derivation and explicit gate exits.
3. Compose canonical collision evidence through the existing inspector.
4. Update README and quality-gate guidance to use explicit `--require` modes.
5. Run disposable installed-CLI proof and project-native validation.

Rollback removes the explicit gate and collision composition while preserving the
unchanged default report. No persisted data or external state requires migration.

## Open Questions

None for this increment. Exact loader precedence remains intentionally unknown and
outside the stop line.
