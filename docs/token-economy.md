# Token Economy

Speed means time to a verified working result, fewer owner interruptions, fewer tokens/tool calls, less repeated manual work, more safe parallelism, and deterministic automation. Token economy is one mechanism: lower context cost leaves more budget for reasoning, validation, and review, but never justifies weaker proof.

## Rules

- Use one canonical workflow, not many competing workflows.
- Gather inventories before broad reads.
- Keep responses compact by default and remove filler, while preserving exact commands, paths, errors, code, and safety warnings.
- Prefer `glob`, `grep`, and targeted file reads over scanning whole trees manually.
- Install the full kit globally, but load heavyweight/domain skills only when they reduce total work.
- Run one relevant reviewer gate by risk, not all reviewers.
- Keep handoffs compact: outcome, changed files, evidence, validation, residual risks.
- Convert repeated counting, drift checks, and report assembly into deterministic helpers.

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

The checked-in `config/instruction-budget.json` is the only budget seed. It stores
reviewed maxima only; measurements and drift are derived from source:

```sh
npm run instruction:budget -- --format markdown
```

The current reviewed maxima grandfather existing debt and prevent further growth.
Historical reduction targets remain `13,279` for committed `global/AGENTS.md` and
`84,513` for the catalog; meeting those lower targets requires a separate content
reduction change. Review any intentional new baseline produced by
`npm run instruction:budget -- --materialize-seed`; never regenerate merely to
silence a failure.

Code navigation risk:

```sh
npm run code-quality:inventory -- --format markdown
```
