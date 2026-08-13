## Why

`/enable-grind` is intended to let an opted-in root advance without a continuously available owner, but its current pending-question path does not choose an answer. It classifies an autonomous question, rejects the tool request, and relies on a later corrective prompt; the arbiter is not given the question text or options, and the maintained proof covers only the owner-required branch. A long-running roadmap session can therefore stop at the exact interactive boundary that grind mode is expected to remove.

## Outcome Capsule

- **Outcome**: An explicitly grind-enabled root automatically answers every pending multiple-choice question whose complete answer is safely derivable inside existing authority, resumes the suspended tool call, and continues the accepted work. A question that requires owner authority remains open and unchanged.
- **Operating Envelope**: Local OpenCode 1.18.18-compatible parentless roots using the installed kit completion guard, the official question request/reply API, one configured hidden arbiter, bounded single- or multi-select option lists, and persisted privacy-safe guard evidence. New roots remain default-off, and `/disable-grind` retains immediate cancellation semantics.
- **Non-Goals**: Do not auto-answer free-form custom input, invent labels, change accepted product/protocol/data/security semantics, authorize protected operations, answer owner-required questions, guarantee process survival across host shutdown, create a general workflow scheduler, or claim that unattended external or destructive actions are authorized.
- **Non-Deferrable Invariants**: Human replies win every race; autonomous answers use only exact offered labels with one answer row per question; owner-required questions remain open; invalid, incomplete, stale, ambiguous, or custom-only decisions fail closed; synthetic answers never become human authority; disable, interrupt, revision, and session deletion prevent late reply or continuation effects; no duplicate answer is applied.
- **Observable Proof**: A fresh installed OpenCode entry point creates a grind-enabled disposable root whose primary agent invokes a real interactive two-option question, receives an automatically selected exact label without human input, observes that label, and completes a downstream marker. Separate lanes prove owner-required preservation, multi-question/multi-select validation, human-reply precedence, disable and stale races, malformed arbiter output, retry recovery, PTY/task waiting, continuation, compaction persistence, and terminal completion.
- **Material Residual Risks**: A model may classify a genuinely owner-only decision as autonomous or choose a poor but in-authority option; exact option validation, conservative arbiter instructions, protected-boundary routing, stale checks, and fresh critical-only SDET reduce but cannot eliminate model judgment risk. Multi-day wall-clock durability remains bounded by the OpenCode process, provider availability, machine uptime, and authorized external dependencies.
- **Stop Line**: Stop when question payload capture, structured answer selection, official reply application, synthetic provenance, installed-entry-point autonomous-question proof, owner/race/failure coverage, runtime source diagnostics, documentation, SDET, and project validation are complete. Durable daemonization, reboot recovery, remote deployment, arbitrary free-text decisions, and unattended protected operations remain separate changes.

## What Changes

- Include bounded exact question text, option labels/descriptions, selection mode, and custom-input policy in each question audit.
- Extend the correlated arbiter verdict with an exact answer matrix that is required only for autonomous pending-question verdicts and forbidden elsewhere.
- Replace autonomous `question.reject` behavior with the official question reply API after deterministic validation and a final race-safe epoch check.
- Persist privacy-safe synthetic-answer provenance so later completion audits never treat the reply as human authority.
- Replace the owner-only component proof with a maintained installed-runtime question runner covering autonomous selection and owner preservation.
- Expand focused, race, retry, persistence, and end-to-end validation for unattended roadmap sessions, while preserving protected owner boundaries.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `session-completion-guard`: Require exact autonomous option selection and official question reply while preserving human precedence, owner boundaries, provenance, and fail-closed behavior.
- `library-config-portability`: Require the installed guard/runtime compatibility contract and discoverable proof entry point to cover autonomous interactive questions on the supported OpenCode version.

## Impact

Affected surfaces include the completion-guard controller, verdict and question state types, arbiter request/agent contract, session-delivery evidence projection, guard tests/proofs, proof inventory, runtime/config validators, and user documentation. The change uses existing OpenCode SDK capabilities and adds no dependency, credential, public network protocol, deployment, or remote-state mutation.
