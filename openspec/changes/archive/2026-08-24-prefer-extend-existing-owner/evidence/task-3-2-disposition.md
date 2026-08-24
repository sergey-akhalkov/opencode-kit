# EXT-001 semantic disposition

Inspected candidate: `prefer-extend-existing-owner-planning-r1`
Environment: `openai/gpt-5.6-sol/xhigh` via `quality-independent`
Bundles: baseline `evidence/task-1-3-baseline-r2`, candidate `evidence/task-3-1-candidate-r1`
Evaluate: `evidence/task-3-2-evaluate-r2` `candidateComplete=true`

| Member | Baseline | Candidate | Disposition |
| --- | --- | --- | --- |
| local-owner | no skill; found peer parser | loaded `reuse-discovery`; `extend` `src/loader.ts`; cross-project `degraded` | improved |
| trivial-fix | no skill, local punctuation | no skill, local punctuation | preserved |
| extend-existing-owner | named `formatStatus`, extend, no sibling | named `formatStatus`, `extend`, no sibling, no skill | preserved |

Maximum claim remains the three captured scenarios on this model/source. No universal reuse claim.
