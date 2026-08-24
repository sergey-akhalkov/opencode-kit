# Task 3.1 Automation Dividend Gate

- Parser: `global/bin/openspec-change/automation-dividend.ts`
- Gate checks: `artifact:automation-dividend`, `artifact:automation-dividend-task`, `archive:automation-dividend`
- Propose: missing/duplicate/malformed fail. Apply: missing declaration is legacy-skip; required needs exactly one `N.N [automation-dividend]` task; exempt forbids a tagged task.
- Archive: required needs checked task plus current evidence-index digest/candidate/environment/invocation; exempt stays archive-eligible.
- Proof: `node tools/test-openspec-operation-gate.ts` OK tests=16. Harvest apply correlates the 2.1 tagged task. Product claim-evidence checks remain independent.
- No official archive of a real change. No AGENTS.md mutation.
