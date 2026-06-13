# Design: Deterministic Artifact Contracts

## Contract Boundaries

The new helpers gather and validate explicit facts only:

- Filesystem facts: paths, file existence, line counts, SHA-256 hashes, frontmatter fields, profile membership.
- Package facts: package script names and exact command strings.
- README facts: marked generated blocks, catalog row names, command block presence, route/reviewer names.
- Agent facts: frontmatter permission map and required output section headings.
- Porting facts: literal substring/regex matches and explicit suppressions.

They must not judge wording quality, trigger accuracy, root cause, severity, or whether a duplicate block is harmful. Those remain reviewer decisions.

## Tool Contracts

Add `tools/tool-contracts.json` as the canonical manifest for repository automation commands.

Initial fields:

```json
{
  "schemaVersion": 1,
  "tools": [
    {
      "script": "validate",
      "command": "node tools/validate-library.ts",
      "mutability": "read-only",
      "docsAnchors": ["## Validate"],
      "requiredTests": ["tools/test-library-validation-scripts.ts"]
    }
  ]
}
```

`tools/tooling-contract.ts` validates package scripts, required test files, README anchors, stable JSON output, and unsupported fields. It reports `unknown` only when a referenced optional target is not available and the contract allows optionality.

## Instruction Artifact Manifest

Add `tools/instruction-manifest.ts` or extend `tools/instruction-artifacts-inventory.ts` with a manifest/check mode.

Stable output:

```json
{
  "schemaVersion": 1,
  "artifacts": [],
  "profiles": [],
  "readmeCatalogs": [],
  "pluginBundles": [],
  "duplicateBlocks": [],
  "violations": []
}
```

The filesystem/frontmatter remains the source of truth for artifact existence and names. A small manifest may record non-inferable category and bundle metadata. README generated fragments are checked by exact equality between markers and sorted deterministically.

## Reviewer Contract Verification

Add `tools/reviewer-contract-check.ts` plus optional `reviewer-contracts.json` for domain-specific extensions.

Common contract:

- `mode: subagent`.
- `read`, `glob`, `grep`, and `list` are `allow`.
- `bash`, `edit`, `task`, `question`, `skill`, `webfetch`, `websearch`, `todowrite`, `external_directory`, `lsp`, and `doom_loop` are `deny`.
- Output includes `Verdict`, `Confidence`, `Findings`, and `Actionable Continuation Items`.

Domain-specific output sections are allowed when declared in the contract manifest or found as additional headings after required sections.

## Porting Anchor Manifest

Add support for `porting-anchors.json`:

```json
{
  "schemaVersion": 1,
  "forbiddenSubstrings": [],
  "forbiddenRegex": [],
  "allowedPlaceholders": ["<project>", "<change>", "<validation-command>"],
  "suppressions": [
    { "pattern": "example", "path": "README.md", "reason": "documented example" }
  ]
}
```

Suppressions must be path-scoped and include a reason. The validator reports deterministic file/line evidence for unsuppressed matches.

## Migration Strategy

1. Add contract files and validators with tests.
2. Wire contract verification into `npm run validate` without write modes.
3. Update README/instruction prose to reference commands and keep short human context.
4. Add optional generated README fragments only after exact output is fixture-tested.

## Risks

- Manifest drift: mitigated by making validators fail when manifest/package/README/artifacts diverge.
- Over-standardized reviewers: mitigated by domain extension sections.
- Private path leakage: mitigated by redaction defaults and explicit `--show-paths`.
