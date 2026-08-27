# False-Positive Candidate R3 Diagnosis

- Candidate governed digest: `673ea8f4199a79663fc5a84b2fe6ac409e199e44bfe95e7a5cd4b9260a0ddce3`.
- Working behavior: the owner was launched once, the concern was falsified, the decision recorded `falsified`/`falsified`, every terminal member was supported, named artifacts were unchanged, and cleanup completed.
- Exact defect: the structured trace recorded one `foundation-integrity-recovery` skill load despite falsification. The exact oracle requires zero recovery loads and no recovery work.
- Layer classification: Product Candidate lifecycle branch defect. Runner and exact evaluator correctly rejected only `recoverySkillCount` and `recovery-skill-tool-count`.
- Causal correction: canonical routing now explicitly prohibits loading recovery or creating work when the owner report falsifies the concern.
- Invalidation: governed source changes again; earlier green bundles remain historical. Final same-source recapture is required after this observed source correction.
- Live-Attempt Gate: blocked for unchanged digest `673ea8f4…`; a causally changed source may be recaptured after provider-free validation.
