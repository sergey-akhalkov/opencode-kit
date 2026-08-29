# Task 5.1 Architecture And Locality Practice Observation

- Practice: `architecture-and-change-locality`
- Observation: `findings-reported`
- Reviewer task: `ses_fb5078a71ffeLxHxGP53QdobmK`
- Inspected candidate: `add-specialist-team-advisor-task-4-3-full-r5`
- Inspected governed source: `1fb07c7ab923a3626cbc7ea7656bbb40f493ad555fb6d66d2d03149bdb7c7702`
- Effective Model: `xai/grok-4.6`
- Role boundary: read-only; no mutation, dispatch, provider call, or lifecycle verdict

| Risk ID | Current evidence | Consequence | Smallest mitigation |
|---|---|---|---|
| `ARCH-STA-TRIGGER-SPLIT-001` | The same discovery drift reported as `IG-STA-001` split one trigger contract across the delta spec/design, loaded `AGENTS.md`, agent frontmatter, and validator constant. | Trigger edits could not remain local and an unreviewed surface could become canonical. | Retain one loaded compact trigger and exact discovery mirror; leave complete bypass semantics in the advisor body. |
| `ARCH-STA-CONTINUITY-PREFLIGHT-001` | `--continuity --mode preflight` spread a selected STA-001 topology preflight and then relabeled the result as continuity. | Continuity preflight carried STA-001 pack/member identity and depended on an unrelated fixture. | Load and validate only continuity's generated core, routes, compaction fields, model/provider identity, and cleanup observer. |

No mixed main/advisor/Practice Owner authority, second semantic scorer, profile/plugin cardinality defect, or current foundation binding defect was found. Historical `FI-STA-CORE-001` remained closed and non-current.
