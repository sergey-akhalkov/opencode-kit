## Why

Evidence-backed workflow improvements are currently emitted in compaction summaries but can remain advisory and disappear from execution. The user wants admitted improvements to become durable, understandable work in the active OpenSpec change and to be completed before that change is declared complete.

## Outcome Capsule

- **Outcome**: Every admitted session-derived improvement is promptly persisted as an evidence-rich unchecked task in the owning active OpenSpec change and is completed before normal change completion or archive.
- **Operating Envelope**: OpenSpec-driven local work with an identifiable active change, writable `tasks.md`, and improvements that pass the existing evidence, causal-link, locality, reversibility, cost, and no-scope-expansion admission gate.
- **Non-Goals**: Turning speculative ideas into tasks, silently expanding accepted product scope, bypassing protected-boundary authority, forcing unrelated `opencode-kit` work into another repository's change, or replacing strategy history and defect evidence.
- **Non-Deferrable Invariants**: Preserve owner authority and protected boundaries; never invent improvement evidence; never mark an improvement complete without its stated proof; never archive with an admitted unresolved improvement; preserve candidates pending at compaction when file mutation is unavailable.
- **Observable Proof**: A fresh loaded OpenCode session receives an active-change continuation containing an evidence-backed improvement and responds by producing the required structured `tasks.md` entry before continuing or claiming completion; static contracts reject missing persistence/completion wording.
- **Material Residual Risks**: Instruction-only enforcement cannot prove that every future model notices every improvement; exact cross-repository target ownership can remain owner-blocked; stale OpenCode sessions retain their previously loaded instructions until restarted.
- **Stop Line**: Stop after the global/apply/archive contracts, OpenSpec requirements, focused static checks, and disposable loaded-session comparison prove persistence and completion behavior; do not add a general backlog service, fuzzy classifier, or automatic semantic task generator.

## What Changes

- Replace advisory one-candidate follow-up behavior with immediate durable persistence for every admitted improvement that the active change can own.
- Define a concise task record containing trigger/evidence, causal reason, prerequisites, scope/non-goals, implementation outcome, observable proof, validation, and owner blocker when applicable.
- Require pending improvement entries in compaction output when the compactor cannot write files, and require the next active session to persist them before substantial work.
- Require apply and normal complete-archive paths to reconcile admitted improvements and leave them unchecked until implementation and proof are complete.
- Preserve scope and protected-boundary rules: an improvement that cannot be owned by the active change is recorded as an exact owner disposition blocker rather than silently implemented or dropped.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `library-instruction-artifacts`: Change session-improvement handling from advisory summary output to durable active-change task ownership and execution.
- `library-spec-workflow-integrity`: Require apply and complete-archive flows to reconcile and complete admitted session-derived improvement tasks.
- `library-change-ready-sdlc`: Treat admitted session-derived improvement tasks as accepted scope without weakening the critical-only post-MVP stop rule for ordinary findings.

## Impact

- `global/AGENTS.md`
- `.opencode/skills/openspec-apply-change/SKILL.md`
- `.opencode/commands/opsx-apply.md`
- `.opencode/skills/openspec-archive-change/SKILL.md`
- `global/skills/change-ready-sdlc/SKILL.md`
- `openspec/config.yaml`
- Focused instruction/contract tests and the two modified OpenSpec capability specs
