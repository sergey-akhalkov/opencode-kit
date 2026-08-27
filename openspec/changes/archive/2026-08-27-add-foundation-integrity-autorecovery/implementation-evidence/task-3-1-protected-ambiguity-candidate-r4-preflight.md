# Task 3.1 Protected Ambiguity Candidate R4 Preflight

- Product candidate remains governed digest `87fe04ff093f71acd8ddd2c65dcec91021289808ecfeac9d6b5bfa591ff7ea14`; scenario digest remains `69839d9cf4dbaed7d7a26417117d4d9e1abaa301a9b1f54c8fd42b0419092a62`.
- Causal runner change: structured foundation server prompt bound is 420000 ms instead of the R3-observed 300000 ms abort. This uses the maintained long-session boundary and changes no product instruction, expected decision, model call count, permission, or cleanup rule.
- Evidence: R3 retained `MessageAbortedError` during the owner task at the exact old bound with full cleanup; the prior same-source diagnostic completed the exact branch in 153728 ms.
- Stop line: one configured server/SDK prompt; exact keyed decision and proof; complete cleanup; terminal evaluator pass. No further retry or next scenario on failure.
