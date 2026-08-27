# Task 4.1 - Disposable Core Loader Proof

Date: 2026-08-26
Candidate ID: `replace-instruction-limits-context-quality-task-4-1-r1`

## Actual Boundary

The maintained package proof materialized the candidate `core` profile under a
disposable generated config root, created an unrelated disposable project and isolated
runtime directory, and invoked the installed OpenCode `debug skill` and `debug agent`
entry points. It did not install or activate the candidate source.

Invocation:

`npm.cmd run proof:runtime-surface-loader -- --candidate-id replace-instruction-limits-context-quality-task-4-1-r1 --evidence-root <change>/evidence/task-4-1-runtime-loader-r1`

Retained evidence:

- `evidence/task-4-1-runtime-loader-r1/raw.json`
- `evidence/task-4-1-runtime-loader-r1/evaluation.json`

## Observations

- Proof exit: `0`; evaluation status: `passed`.
- Installed loader skill status: `0`; agent status: `0`.
- Exact `core` skill catalog contained ten expected skills, including the three
  canonical OpenSpec workflow skills and the replacement-relevant
  `behavioral-substitution-qualification` and `change-ready-sdlc` skills.
- Missing core skills: none; extra core skills: none; hidden parent hits: none.
- Loaded reviewer: `evidence-sufficiency-reviewer` from the generated root.
- Permission failures: none.
- Evidence-bounds and claim-routing authority markers: present.
- Generated paths were privacy-redacted in evidence.
- Cleanup: `complete`; the generated config, project, and isolated runtime trees were
  removed by the proof owner.
- Evaluation digest:
  `ab63142219363dd9fbf0105d2ad913f0fc4f493e69069c0920f1925d88ef8432`.

## Profile And Context Diagnostics

The exact `runtimeSurfaceProfileTests` slice was executed through the maintained test
helper and passed 14/14 tests. It covered committed catalog identity, missing/escaping/
duplicate/conflicting/unstably ordered entries, core/all byte-exact materialization,
placeholder and staging-path removal, permission rendering, rollback, injected-failure
preservation, hidden-parent rejection, and missing-core rejection.

Separate context measurements remained diagnostic rather than loader verdicts:

- 71 model-facing artifacts
- startup/discovery/on-demand classification retained by the inventory owner
- 4,892 lines; 372,655 characters; token proxy 93,186
- context quality `passed`; safe fixes 0; deterministic errors 0; review-only 0;
  duplicate exceptions 26/26 active

The disposable loader accepted the candidate independently of those numeric values.

## Source And Effects

`npm.cmd run opencode:sources` resolved the custom kit source to this repository and
reported the existing multi-source config inventory. Source presence was not treated as
precedence proof. The isolated generated loader showed no parent-catalog leakage or
source collision in the exercised `core` boundary. The active global config and runtime
were not rewritten, installed, activated, or restarted; no provider, session, model,
credential, consumer, remote, deployment, or release operation occurred.

## Claim Ceiling

This proves only the installed OpenCode loader-visible `core` surface for the recorded
candidate and local environment. It does not prove configured-model behavior or that
every host/project config source is absent or lower precedence.
