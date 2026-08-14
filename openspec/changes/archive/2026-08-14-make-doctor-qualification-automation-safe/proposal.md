## Why

`doctor` currently separates structural status from qualification and unattended
readiness, but its process exit follows only structural status. Automation can
therefore receive exit `0` while qualification is blocked, and canonical runtime
source collisions remain visible only through a separate diagnostic. The
runtime-source CLI also performs a scan when invoked with `--help`.

## Outcome Capsule

- **Outcome:** Operators and automation can invoke one explicit doctor gate for
  structural, qualification, or unattended readiness and receive a process exit,
  blocker list, and privacy-safe runtime-source diagnosis that agree.
- **Operating Envelope:** Local read-only diagnostics over one explicitly selected
  project and the loader-visible OpenCode sources already inspected by the kit.
- **Non-Goals:** Prove undocumented loader precedence; migrate project overlays;
  change OpenCode loading behavior; make every additive instruction/config source
  a blocker; execute project validation commands.
- **Non-Deferrable Invariants:** Diagnostics remain privacy-safe and effect-free;
  unknown canonical precedence fails closed for the selected gate; additive
  non-authority layering is not misclassified; existing default doctor reporting
  remains available; `machineOverride` remains rejected.
- **Observable Proof:** The installed CLIs expose effect-free help; disposable
  projects demonstrate matching report status, named blockers, and exit status for
  structural, qualification, unattended, and canonical-collision cases.
- **Material Residual Risks:** OpenCode may change loader semantics after the
  captured runtime contract; presence-based inventory cannot by itself prove which
  source a running process selected.
- **Stop Line:** Stop when the three gate modes, canonical collision integration,
  blocker reporting, help behavior, and focused disposable-project proof are
  complete. Loader implementation changes and project migrations remain separate.

## What Changes

- Add an explicit doctor gate selector for structural, qualification, and
  unattended readiness while preserving the current informational default.
- Make each selected gate return a non-zero exit and name every reason when its
  corresponding status is blocked.
- Reuse the privacy-safe runtime-source inspector so canonical global/project
  workflow collisions participate in qualification and unattended diagnostics.
- Keep ordinary additive source layering visible without treating every duplicate
  `AGENTS.md` or config location as a lifecycle blocker.
- Align blocking `project AGENTS.md` diagnostics with their actual impact instead
  of presenting a qualification blocker as advisory wording.
- Add effect-free `--help` and `-h` handling to the runtime-source CLI.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `library-install-init-resilience`: Define automation-safe doctor gate selection,
  blocker reporting, and process-exit behavior.
- `library-config-portability`: Integrate canonical source collisions into doctor
  readiness and require effect-free runtime-source CLI help.

## Impact

- Affected code: `tools/doctor.ts`, `tools/opencode-runtime-sources.ts`, their
  focused tests, and operator documentation.
- Affected contracts: doctor CLI exit semantics only when an explicit gate is
  selected; runtime-source help behavior; canonical collision diagnostics.
- Dependencies: reuse existing source inventory and redaction logic; no new package.
- Systems: local kit and consumer-project diagnostics only. No installation,
  activation, provider call, project validation, or remote operation.
