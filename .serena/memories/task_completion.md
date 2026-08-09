# Task Completion

- Run the nearest focused test first, selected from `npm run test:focused:*`.
- For instruction/config/library changes, run `npm run validate`; use `npm run validate:strict` when warnings must fail.
- Run `npm run openspec:validate` when OpenSpec requirements/change artifacts are touched.
- Run `npm test` for broad behavior changes; final repository gate is `npm run prepush:validate` when the candidate scope warrants it.
- Behavior-changing work also needs representative run-observe-correct evidence at the actual safe boundary; compile/static/unit output alone is insufficient.
- After changing loaded OpenCode config, skills, agents, or plugins, start a new OpenCode process/session because config-time artifacts are not hot-reloaded.
- Completion handoff reports validation, limitations, `Development-Stage`, and `Stable Candidate: RC<n>` when stable.