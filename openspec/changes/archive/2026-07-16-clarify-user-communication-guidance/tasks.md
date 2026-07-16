## 1. Instruction Updates

- [x] 1.1 Update `global/AGENTS.md` with concise plain-language communication, necessary-term definitions, accuracy safeguards, and decision-ready option rules; verify the scoped diff and representative OpenCode response.
- [x] 1.2 Restore the three generated OpenSpec skill files to baseline bytes and remove them from the candidate manifest.
- [x] 1.3 Add a path-plus-`generatedBy` exemption only to the missing risk-driven workflow warning; preserve every other validator rule.
- [x] 1.4 Have fresh SDET add a focused regression test proving the narrow exemption while existing non-generated warning coverage remains.

## 2. Validation

- [x] 2.1 Run a fresh read-only OpenCode prompt on the final candidate; confirm Russian output contains brief term definitions, the recommendation first, and each option's effect, advantage, and disadvantage.
- [x] 2.2 Run `npm run validate:strict`; require exit code 0 and zero warnings.
- [x] 2.3 Run `npm test`; require exit code 0.
- [x] 2.4 Run `openspec validate clarify-user-communication-guidance --type change --strict --no-interactive`; require exit code 0.

## 3. Delivery Correction

- [x] 3.1 Replace the rollback design with a complete expected 8-path post-SDET, ownership-safe, isolated, journaled procedure and run strict OpenSpec validation successfully.

## 4. Frontmatter Eligibility Correction

- [x] 4.1 Restrict generated-skill eligibility to a non-empty `metadata.generatedBy` scalar from parsed leading frontmatter.
- [x] 4.2 Have a fresh corrected-candidate SDET add body-only and blank-marker negative tests without changing production.
- [x] 4.3 Repeat the final communication proof on the corrected candidate.
- [x] 4.4 Run `npm run validate:strict`; require exit code 0 and zero warnings.
- [x] 4.5 Run `npm test`; require exit code 0.
- [x] 4.6 Run `openspec validate clarify-user-communication-guidance --type change --strict --no-interactive`; require exit code 0.

## 5. Nested YAML Structure Correction

- [x] 5.1 Require an actual nested `metadata` mapping and `generatedBy` child without flattened-key ambiguity.
- [x] 5.2 Have a fresh corrected-candidate SDET add a literal top-level `metadata.generatedBy` negative test.
- [x] 5.3 Repeat the final communication proof on the nested-structure candidate.
- [x] 5.4 Run `npm run validate:strict`; require exit code 0 and zero warnings.
- [x] 5.5 Run `npm test`; require exit code 0.
- [x] 5.6 Run `openspec validate clarify-user-communication-guidance --type change --strict --no-interactive`; require exit code 0.
