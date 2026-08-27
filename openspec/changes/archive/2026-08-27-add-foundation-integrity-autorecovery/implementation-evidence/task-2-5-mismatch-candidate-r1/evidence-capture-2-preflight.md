# Task 2.5 Evidence Capture 2 Preflight

- Purpose: acquire the exact configured command output, tool facts, proof result, missing/present `decision.json` state, session deletion, and cleanup facts lost by candidate attempt 1.
- Classification: bounded diagnostic evidence capture, not task 2.5 acceptance proof and not archive evidence by itself.
- Scope: candidate arm, scenario `mismatch-unique-recovery`, sample 1 only; one configured primary model request; no baseline call.
- Candidate source: current working-tree governed source frozen by the provider-free selected-pack preflight. Proof-runner changes do not alter the governed owner/skill/config identity.
- Effects: isolated temporary fixture write only; no external writes, remote mutation, release, deployment, activation, or consumer-project mutation.
- Evaluator: preserve `bundle.json` and `evaluation.json`; terminally evaluate against the accepted task-1.3 baseline; inspect command status/output, tool calls, outcome state, proof, session cleanup, and fixture cleanup.
- Stop line: do not expand to the other six scenarios and do not treat a green result as acceptance proof. A further acceptance attempt requires decision-changing candidate evidence or a causal candidate correction.
