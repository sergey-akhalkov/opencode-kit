# Protected R2 Runtime Diagnostic R1 Classification

- Classification: diagnostic-only completed observation; not task 3.1 acceptance by itself.
- Governed/source identity: `87fe04ff093f71acd8ddd2c65dcec91021289808ecfeac9d6b5bfa591ff7ea14`; one configured `openai/gpt-5.6-sol/xhigh` prompt.
- Terminal facts: `completed-observation`, latest assistant `finish=stop`, no runtime error, elapsed 153728 ms, proof and validation status 0.
- Behavior: four reads, one `foundation-integrity-reviewer` task, one decision write, zero recovery loads, exact `terminalState=owner-boundary`, exact `reproductionDisposition=ambiguous`, no identity selection, and all named artifact hashes preserved.
- Cleanup: sessions, process tree, and fixture all removed; server terminal status was retained; no proof-owned root or writer remained.
- Decision: the keyed Product Candidate behavior is observed working through the structured path. The CLI failure is runner-specific. The next acceptance mechanism converts the same server/SDK facts into the existing foundation bundle and evaluator, with no source or expected-oracle change.
