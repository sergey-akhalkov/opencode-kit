# Token Economy

Token economy is a first-class part of the working philosophy alongside quality, shortest verified path, autonomy, and continuous improvement. Lower context cost leaves more budget for reasoning, validation, and review, but never justifies weaker proof, hidden risk, proxy substitution, or loss of a material fact.

## Rules

- Use one canonical workflow, not many competing workflows.
- Gather inventories before broad reads.
- Keep responses compact by default and remove filler, while preserving exact commands, paths, errors, code, and safety warnings.
- Prefer `glob`, `grep`, and targeted file reads over scanning whole trees manually.
- Install the full kit globally, but load heavyweight/domain skills only when they reduce total work.
- Run one relevant reviewer gate by risk, not all reviewers.
- Keep handoffs compact: outcome, changed files, evidence, validation, residual risks.
- Convert repeated counting, drift checks, and report assembly into deterministic helpers.
- At relevant checkpoints, use observed cost and failure evidence to improve context use. Fix, narrow, or remove concrete token-wasting rules, tools, and process steps at the smallest authorized layer; avoid unrelated cleanup or speculative automation.

## Commands

Target project context:

```sh
npm run project:inventory -- --root <project-path> --format markdown
```

Kit instruction context:

```sh
npm run instruction:inventory -- --format markdown
```

The default `catalog` scope measures the maintained kit artifact catalog and keeps
its version 1 output compatible. To inspect one project's bounded loader-visible
candidates without printing instruction text or external paths, run:

```sh
npm run instruction:inventory -- --source-scope loader-visible --project <project-path> --format markdown
```

Loader-visible output separates startup-visible candidates, discovery metadata,
on-demand bodies, and unknown sources. Its token proxy is `ceil(chars / 4)`, not
provider tokenization or proof that a candidate reaches the final prompt. Remote
URLs, globs, inline config, malformed config, and unreadable files remain unknown.

The checked-in schema-v2 `config/instruction-budget.json` is the only budget seed.
It measures committed global startup authority as the combined
`global/principles-of-work.md` and `global/AGENTS.md` token proxy, with separate maxima for maintained
discovery metadata, and maintained on-demand bodies; measurements and drift are
derived from source:

```sh
npm run instruction:budget -- --format markdown
```

The reviewed maxima are `13,279` startup tokens, `2,239` discovery-metadata tokens,
and `66,244` on-demand-body tokens. They are growth brakes, not claims that every
source enters one prompt. `npm run instruction:budget -- --materialize-seed` may
only retain or lower every maximum; growth fails without seed mutation and requires
a direct reviewed seed edit with rationale. A malformed seed also requires direct
review and is never repaired by materialization.

Code navigation risk:

```sh
npm run code-quality:inventory -- --format markdown
```
