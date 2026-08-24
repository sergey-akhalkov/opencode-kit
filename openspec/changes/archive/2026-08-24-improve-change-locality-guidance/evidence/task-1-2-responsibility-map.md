# Runner Responsibility Map

- `agent-tooling-ergonomics.ts` remains the shared capture/evaluate/preflight/cleanup owner.
- `tools/proofs/lib/change-locality-scenarios.ts` owns CLC-001 scenario seed load, prompts, follow-ups, fixture setup, compliant fixtures, and factual runtime oracles.
- `tools/proofs/fixtures/change-locality-guidance/scenarios.json` is the reviewed seven-scenario seed.
- Split-or-justify: extract scenario data only; do not add a second proof runner.
- Pack `tooling` keeps the original three scenarios so existing bundles stay evaluable.
