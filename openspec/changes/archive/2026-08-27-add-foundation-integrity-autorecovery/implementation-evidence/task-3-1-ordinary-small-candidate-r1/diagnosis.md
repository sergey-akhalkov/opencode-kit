# Ordinary Small And Anti-Loop Candidate R1 Diagnosis

- Candidate governed digest: `87fe04ff093f71acd8ddd2c65dcec91021289808ecfeac9d6b5bfa591ff7ea14`.
- Working behavior: one configured structured capture completed with no owner, recovery, question, forbidden effect, or named artifact mutation; all three terminal members were `supported`; cleanup was complete.
- Exact defect: the decision preserved prior incident `fi-prior-closed-r1` but set current `terminalState=closed` and `reproductionDisposition=confirmed`. The current invocation was an unchanged non-applicable control and should be `not-applicable`/`not-run` while retaining that prior ID.
- Layer classification: Product Candidate anti-loop/current-versus-historical disposition defect. Runner and exact evaluator correctly rejected only the two fields.
- Causal correction: canonical routing explicitly preserves the prior incident ID while prohibiting historical closure from becoming current confirmation or a successor incident.
- Invalidation: governed source changes again; all earlier green bundles remain historical. Final same-source recapture is required after this last observed source correction.
- Live-Attempt Gate: blocked for unchanged digest `87fe04ff…`; a causally changed source may be recaptured after provider-free validation.
