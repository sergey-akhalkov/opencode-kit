# Repository Instructions

This repository stores reusable OpenCode skills, subagents, and instruction templates.

- Keep artifacts project-neutral: do not hardcode repository names, company-internal paths, issue trackers, services, hardware, or validation commands unless the artifact is explicitly scoped to that ecosystem.
- Prefer evidence-backed workflow contracts over reminders. If a check can be automated, document the command shape or validation hook instead of adding vague prose.
- For behavior-changing implementation work in skills, agents, templates, tools, or examples, default to TDD: add or update the focused failing test, acceptance check, fixture, or validation scenario before implementation; if infeasible, state why and use the closest reproducible evidence.
- Keep TDD proportional: one smallest useful test/gate for the scoped behavior is enough; do not expand into unrelated coverage, broad suites, or speculative tests unless risk evidence warrants it.
- Skills and agents must be safe to reuse in unrelated repositories. Use placeholders such as `<project>`, `<change>`, `<service>`, `<legacy-source>`, and `<validation-command>` where local projects differ.
- Reviewer agents are leaf validators by default: read-only, no edits, no commits, no pushes, no nested agents, no user questions.
- Keep each artifact cohesive. Split artifacts when triggers, permissions, or output contracts differ materially.
- Preserve OpenCode compatibility: skill folders must match `name` in `SKILL.md`; agent files must use valid frontmatter and least-privilege permissions.

## Completion Handoff

- After non-trivial user-visible work, the main session offers 2-4 self-contained next actions via `question` when available.
- Put the recommended option first and end its label with `(Recommended)`.
- In read-only, no-question, reviewer-agent, or subagent contexts, do not ask the user directly; return `Suggested Next Options` or `Actionable Continuation Items` for the main session instead.
- If the user selects an actionable option, continue immediately in the current context instead of asking them to restate the task.
- Prefer automation, validation, reviewer gates, and MR/PR-ready handoff so user input is reserved for scope direction, high-risk decisions, remote/destructive approvals, and MR/PR review outcomes.

After changing skills or agents, review `README.md` and the relevant artifact frontmatter so the library remains discoverable.
