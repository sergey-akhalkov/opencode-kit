## Why

The active global instructions do not fully require concise, plain-language explanations or decision-ready answer options. Strict library validation also applies a repository-owned implementation-workflow warning to three generated OpenSpec skills that this repository does not own.

## What Changes

- Require every user-facing message to be as short and plain as practical without losing material accuracy.
- Require immediate brief explanations for necessary specialist terms and acronyms.
- Require every answer option to explain its effect, main advantage, and main disadvantage, with a clearly marked recommendation first.
- Restore the three generated OpenSpec skills to their baseline bytes.
- Exempt generated OpenSpec skills only from the repository-owned missing risk-driven workflow warning while preserving every other Markdown validation rule.
- Add a regression test for the narrow exemption.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `library-instruction-artifacts`: Define user-facing communication requirements and require instruction artifacts to pass strict validation without misleading implementation classification.

## Impact

Affected artifacts are `global/AGENTS.md`, the Markdown and frontmatter validators, one validator test, and this OpenSpec change. Generated OpenSpec skills remain unchanged. No application API, persisted data, dependency, or remote system changes.
