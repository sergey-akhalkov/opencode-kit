# Candidate Fresh-Session Evidence

## Environment

- Date: 2026-08-11
- Entry point: installed `opencode run`
- OpenCode version: `1.18.16`
- Route: `openai/gpt-5.6-sol`, variant `xhigh`, agent `build`
- Prompt and tool denial: byte-for-byte equivalent in substantive content to the two-candidate baseline; `edit`, `bash`, `task`, and `question` denied
- Exit: `0`
- Effects: one configured-provider call; no repository, remote, credential, or fixture mutation

## Observed Candidate Disposition

- Candidate A: create a separate unchecked task under `## Session-Derived Improvements` with `Trigger/Evidence`, `Why`, `Prerequisites`, `Scope/Non-Goals`, `Implementation`, `Observable Proof`, and `Validation`; `Owner Blocker` only when applicable.
- Candidate B: create a separate unchecked task in the same section with the same fields.
- Both candidates: implementation, stated proof, focused validation, and checkbox completion are mandatory before archive.
- Neither candidate may remain only in the summary.
- Safety order remains intact: Candidate A's offline preflight must pass before another parser boundary run, but this does not remove Candidate B from accepted completion scope.

## Baseline Comparison

Baseline selected Candidate A and explicitly allowed Candidate B to remain summary-only. Candidate requires both. The accepted behavior oracle therefore passes and the instruction change reaches current `MVP` proof at the actual fresh-session loader boundary.
