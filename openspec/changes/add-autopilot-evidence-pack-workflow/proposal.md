# Proposal: Add Autopilot Evidence Pack Workflow

## Why

The live regression required many separate commands and manual report synthesis: tool smoke, status, collect, stop, ledger discovery, fixture validation, in-memory probes, repository validation, OpenSpec validation, source reading, reviewer routing, and report editing. This was accurate but command-heavy and token-heavy.

Autopilot needs a deterministic evidence-pack workflow that gathers the routine evidence once, summarizes it compactly, and leaves judgment-heavy findings to the agent or reviewers.

## What Changes

- Add a TypeScript evidence-pack command or plugin-accessible helper for Autopilot regression and task execution.
- Collect ledger discovery, validator results, safe tool smoke outputs, validation plan/results, reviewer routing, scenario coverage, residual risks, and report-ready Markdown sections.
- Emit compact JSON for automation and optional Markdown for OpenSpec reports.
- Store long raw command output in privacy-safe evidence files when writing is explicitly requested, while returning concise summaries to the agent.
- Keep the workflow deterministic: no fuzzy scoring, no model-like summarization, no hidden inference.

## Non-Goals

- Do not replace reviewer judgment or user-owned decisions.
- Do not run destructive commands, push, merge, deploy, or read secrets.
- Do not edit protected Autopilot paths unless the plugin owns the write.
- Do not make every validation command run by default at every step; support planning and final validation modes.

## Evidence

- The regression needed separate calls to `autopilot_run_next`, `autopilot_status`, `autopilot_collect`, `autopilot_stop`, `npm run validate`, `npm test`, `npm run autopilot:validate`, `openspec validate --all`, fixture validation, source reads, and report edits.
- Manual synthesis was required to map findings to follow-up changes and reviewer gates.
- Current tooling has `npm run autopilot:validate`, but no command that produces a scenario matrix, reviewer plan, or report-ready evidence pack.

## Impact

- Fewer commands and less token-heavy transcript output for future regressions.
- Higher review quality because reviewer routing and validation gaps are visible as structured evidence.
- Faster handoff because reports can cite stable evidence ids instead of copied raw logs.

## Validation

- Add focused tests for evidence-pack JSON shape, redaction, stable ordering, validation planning, and report rendering.
- Keep `npm run validate`, `npm test`, `npm run autopilot:validate -- <task-ledger.json>`, and `openspec validate --all` green.
