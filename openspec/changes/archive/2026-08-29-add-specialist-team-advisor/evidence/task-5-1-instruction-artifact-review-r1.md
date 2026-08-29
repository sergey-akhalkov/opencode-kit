# Task 5.1 Instruction-Artifact Practice Observation

- Practice: `instruction-governance`
- Observation: `findings-reported`
- Reviewer task: `ses_fb50e43e9ffef4cS5kK90GDcpc`
- Inspected candidate: `add-specialist-team-advisor-task-4-3-full-r5`
- Inspected governed source: `1fb07c7ab923a3626cbc7ea7656bbb40f493ad555fb6d66d2d03149bdb7c7702`
- Effective Model: `xai/grok-4.6`
- Role boundary: read-only; no mutation, dispatch, provider call, or lifecycle verdict

| Risk ID | Current evidence | Consequence | Smallest mitigation |
|---|---|---|---|
| `IG-STA-001` | `design.md` and `library-instruction-artifacts/spec.md` retained the earlier `Use by default...` discovery sentence while the loaded agent and validator required the current before-selecting-or-omitting contract. | A spec-following edit could regress the r5 advisor-before-selection behavior or fail structural validation. | Make the delta spec/design mirror the loaded and validator-owned sentence exactly. |
| `IG-STA-002` | The README Agent Catalog listed `specialist-team-advisor`, but the Routing Map did not state its parentless-root trigger or direct-work exception. | README-first routing could omit the advisory pass while loaded `AGENTS.md` required it. | Add one compact Routing Map row; do not duplicate the complete Team Advice contract. |

No additional material finding was reported for advisor permissions, compaction's eleven-field mirror, core/all cardinality, inherit-from-primary routing, catalog fail-closed behavior, or active-host isolation.
