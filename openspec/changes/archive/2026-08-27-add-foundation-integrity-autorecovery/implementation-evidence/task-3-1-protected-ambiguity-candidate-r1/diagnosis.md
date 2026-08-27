# Protected Ambiguity Candidate R1 Diagnosis

- Candidate governed digest: `9d3cf9b43390efdaab3b319cff470b15273759289a3b37cb691ce835cadc926a`.
- Runtime/result: one configured invocation launched the owner once, independently confirmed two unresolved public API identities, selected no identity, loaded no recovery, mutated no named artifact, asked no question, and completed cleanup.
- Exact defect: the decision swapped the intended pair, writing `reproductionDisposition: owner-boundary` and `terminalState: ambiguous`. The checker correctly rejected the invalid reproduction enum.
- Layer classification: Product Candidate field-mapping defect caused by ambiguous positional shorthand in loaded compact routing; runner and evaluator behaved correctly.
- Causal correction: canonical routing now names `terminalState` and `reproductionDisposition` for every branch and explicitly prohibits swapping. Expected enums and checker remain unchanged.
- Invalidation: the governed source changed; earlier candidate bundles remain historical and cannot enter final same-source composition.
- Live-Attempt Gate: blocked for unchanged digest `9d3cf9b4…`; a keyed-source candidate may be recaptured only after provider-free validation.
