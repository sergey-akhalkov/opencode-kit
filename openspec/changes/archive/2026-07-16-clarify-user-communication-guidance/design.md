## Context

`global/AGENTS.md` already requires concise responses and exact technical names, but it does not fully define plain-language explanations or decision-ready options. The strict Markdown validator also reports three project-local OpenSpec skills because it applies this repository's proof-before-SDET policy to generated artifacts with `generatedBy: "1.6.0"` metadata.

The user explicitly decided that these generated skills are not repository-owned and must remain unchanged. They should be exempt only from the foreign workflow warning, not from syntax, safety, or other Markdown checks.

## Goals / Non-Goals

**Goals:**

- Make user-facing communication brief, plain, and decision-ready without sacrificing accuracy.
- Keep all generated OpenSpec skill files byte-equal to baseline.
- Suppress only the repository-owned missing risk-driven workflow warning for generated OpenSpec skills.
- Restore a clean `npm run validate:strict` result.

**Non-Goals:**

- Exclude generated OpenSpec skills from all validation.
- Rewrite generated OpenSpec skill content or metadata.
- Add application dependencies or compatibility layers.
- Change OpenSpec CLI behavior.

## Decisions

1. Extend the existing `Communication Preferences` section instead of adding a new communication framework. This keeps global guidance discoverable and avoids duplicating `Concise Response Style`.
2. Detect generated OpenSpec skills only when both conditions hold: the relative path matches `.opencode/skills/openspec-*/SKILL.md`, and the leading YAML frontmatter contains an actual nested `metadata` mapping with a non-empty string child `generatedBy`. Add a side-effect-free frontmatter helper that preserves YAML nesting instead of relying on the existing flattened key map. Body text, top-level `generatedBy`, literal top-level `metadata.generatedBy`, missing values, and blank values do not qualify. Skip only the missing happy-path-first risk-driven workflow warning for eligible files.
3. Keep generated OpenSpec skills inside the normal Markdown validation pipeline so malformed frontmatter, trailing whitespace, forbidden content, and every unrelated safety rule remain active.
4. Add one focused validator regression test through fresh SDET ownership. Existing tests continue to prove that non-generated implementation guidance still receives the warning.
5. Use exact project validation as the oracle: `npm run validate:strict`, `npm test`, and `openspec validate clarify-user-communication-guidance --type change --strict --no-interactive` must pass before final review.
6. Treat the expected complete 9-path post-SDET candidate manifest as one rollback unit: four modified files (`global/AGENTS.md`, Markdown validator, frontmatter validator, validator test) and five added OpenSpec files. Before rollback, verify every path status/raw preimage against Package Identity and confirm no newer ownership; stop on mismatch. Build the inverse in an isolated worktree. Apply it to the shared workspace only through a per-path journal that stores expected candidate bytes and inverse actions; restore candidate bytes on partial failure.

## Risks / Trade-offs

- Strong brevity guidance can hide necessary context. Mitigation: explicitly preserve facts, constraints, risks, uncertainty, and exact identifiers.
- A single runtime communication example cannot guarantee compliance by every model. Mitigation: combine representative runtime proof with source requirements and independent review; do not expand into an exhaustive model matrix without a concrete high-impact risk.
- A broad exemption could hide real defects. Mitigation: require both generated metadata and the OpenSpec skill path, skip only one warning, and retain every other validation rule.

## Migration Plan

1. Apply the global communication edit and narrow validator exemption while leaving generated skills unchanged.
2. Let fresh SDET add the focused regression test.
3. Run the representative communication proof and complete project validation.
4. Restart OpenCode so the global instructions reload.

Rollback procedure:

1. Verify the current expected 9-path manifest, Package Identity, baseline, and path ownership. Stop without mutation if any path differs or contains newer work.
2. In an isolated worktree, create the inverse package: restore the four modified files from baseline raw bytes and omit the five added OpenSpec files.
3. Run `npm run validate` and `npm test` in the isolated rollback worktree. Require tests to pass and validation to reproduce the known baseline diagnostics: exactly the three generated OpenSpec workflow warnings and no validation errors. Strict validation is intentionally not the rollback oracle because the recorded baseline contains those warnings.
4. Record a per-path rollback journal containing the expected candidate bytes and inverse action, then apply the inverse package to the shared workspace. On partial failure, restore candidate bytes from the journal and stop.
5. Confirm the four modified paths equal baseline bytes and the five added paths are absent. Runtime activation rollback is `N/A` before restart; if the global instruction was activated by restarting OpenCode, restart it again after the file rollback.

No rollback is executed by this change, and no persisted application data requires migration.

## Open Questions

None.
