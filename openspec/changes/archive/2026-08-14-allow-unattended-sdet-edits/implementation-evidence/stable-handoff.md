# Stable Handoff

## Outcome

`sdet-quality-engineer` now resolves `edit: allow` and can create an authorized
test-only artifact without presenting the operator approval dialog. Its operative
contract still requires the exact supplied test-only scope and forbids production
edits. `bash`, task, question, skill, web access, todowrite, external-directory,
LSP, and doom-loop remain denied.

## Scope And Non-Goals

- Changed the canonical global SDET agent, deterministic contract, validator,
  focused oracle, normative spec, installed permission proof, and maintained
  routed proof runner.
- Did not enable shell, network, delegation, user questions, credentials, external
  directories, production authorship, lifecycle authority, or remote effects.
- Did not install, activate, commit, push, release, publish, or modify unrelated
  concurrent worktree changes.

## Candidate And Proof

- Candidate Reference: `allow-unattended-sdet-edits-RC1`.
- Installed environment: OpenCode `1.18.18`, Node `v24.18.0`, Windows, kit global
  source selected by `OPENCODE_CONFIG_DIR`.
- Provider-free permission proof: SDET `editPermission=allow`; every named explicit
  deny retained.
- Routed Runtime Proof: `capture-r1` records exact SDET child/parent correlation,
  completed `edit`, one exact 18-byte file, 1,155 permission polls, and zero pending
  requests before/after.
- Cleanup evidence: immutable capture retains its Windows `EPERM`; provider-free
  `replay-r1` verifies completed proof-owned cleanup and current Product Candidate
  hashes; `preflight-r2` verifies the current runner and terminal cleanup.
- Live-Attempt Gate: `clear`; no repeat capture is needed unless Product Candidate
  behavior changes.

## Independent Evidence

- Critical SDET: terminal `no-critical-risk`; child
  `ses_fff55e574ffextnn5Q5RfJZZRW`; Effective Model `xai/grok-4.6`; no test changes.
- Code-quality reduction review: child `ses_fff505f01ffeCmRXDEGBAhh9YL`, Effective
  Model `xai/grok-4.6`; no safe net reduction.
- Validation: strict library validation green with zero warnings; full `npm test`
  green; permission proof green; selected and all strict OpenSpec validation green
  (`16/16`); operation gate, syntax check, and diff check green.

## Known Non-Critical Limitations

- OpenCode scalar edit permission is tool-wide. Exact dynamic path containment is
  enforced by the SDET role contract and main's mutation attribution rather than a
  path-aware OpenCode permission rule.
- The currently running OpenCode process loaded the old agent definition at startup.
  A full process restart is required before future SDET children use this change.
- Permission polling proves no request remained queued during this synthetic child
  run; it is not a historical platform permission-event log.

## Rollback

Revert the scoped SDET permission from `allow` to `ask` together with its contract,
validator, test oracle, proof expectation, and normative spec. No persisted data or
migration rollback exists.

## External Operations

Bounded configured model inference was used for the disposable routed proof, fresh
critical SDET, and read-only code-quality review under standing authorization. No
remote repository mutation, deployment, install, activation, release, publication,
credential change, or destructive external action occurred.

Development-Stage: stable

Stable Candidate: RC1
