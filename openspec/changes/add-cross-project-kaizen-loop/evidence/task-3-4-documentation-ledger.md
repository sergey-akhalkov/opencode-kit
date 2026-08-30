# Documentation Hardening Ledger

- Scope: `README.md`, `docs/kaizen.md`
- Goal: Provide one source-verified operator map for the Kaizen lifecycle and keep top-level navigation/ownership claims current.
- Non-goals: Change runtime behavior, managed prompt/template wording, active machine config, installation, activation, qualification, or `KZN-001` status.
- Evidence policy: Documentation is a claim until checked against loaded source, command/skill contracts, tests, and effect-free CLI output.
- Current phase: final
- Progress: 2/2 blocks reviewed; 3 findings fixed; 0 blocked; 0 needs-rereview.

## File Inventory

- `README.md` | 608 lines | navigation/install/reference | clean after fixes | full file read; material Kaizen/profile ownership statements corrected
- `docs/kaizen.md` | 171 lines | canonical operator guide | clean after fix | full file read; every behavior class traced to source/tests/help

## Block Coverage

- [x] DB01 | `README.md:1-608` | top-level navigation and lifecycle ownership claims | source/profile/skill contracts | clean after fixes
- [x] DB02 | `docs/kaizen.md:1-171` | activation, tools, lifecycle, storage, privacy, cleanup, proof | source/tests/help output | clean after fix

## Block Reviews

### DB01 | `README.md:1-608`

- Claims: profile inventory, core plugin surface, global command ownership, complain routing, and feedback fallback.
- Evidence checked: `profiles/core.json`, `profiles/all.json`, `tools/runtime-surface-profile.ts`, `global/commands/kaizen-*.md`, `global/skills/complain/SKILL.md`, profile preview output, and complete README readback.
- Verdict: clean after fixes.
- Findings: F01 and F02.
- Fix decision: point to one canonical guide and retain only compact top-level ownership statements.
- Re-review: complete after final edits.

### DB02 | `docs/kaizen.md:1-171`

- Claims: activation/rollback, five tools, two commands, signal/checkpoint/report states, compaction dependency, fallback/import, proposal containment, data-root precedence, record/output bounds, privacy ceiling, inspection/cleanup, and proof invocations.
- Evidence checked: `global/plugin/kaizen/{index,store}.ts`, `global/plugin/project-memory/store.ts`, `global/plugin/session-env.ts`, both Kaizen commands, `complain`, archive skill, `node tools/test-cross-project-kaizen.ts --json`, proof `--help`, installer `--help`, runtime-source output, and strict validators.
- Verdict: clean after one typo fix.
- Findings: F03.
- Fix decision: keep one operational guide, name conditional/unproved compaction state explicitly, and avoid copying normative schemas in README.
- Re-review: complete after final edit.

## Findings

- F01 | material | DB01 | README described core as specialist-catalog-only after core gained `session-env` | operators could install the wrong expected surface | prior profile description did not move with task 3.3 | narrow README correction plus canonical guide link | fixed
- F02 | material | DB01 | README described `docs/feedbacks` and `complain` as the primary append target | duplicate inbox/Markdown capture risk | prior feedback owner text predates task 2.3 | identify Markdown as degraded fallback and link the lifecycle owner | fixed
- F03 | material | DB02 | no canonical Kaizen operator guide existed | activation, privacy, cleanup, and proposal containment were discoverable only from source/spec fragments | feature implementation preceded operator docs | add one source-verified guide | fixed

## Validation

- `node tools/test-cross-project-kaizen.ts --json`: passed 26 named lifecycle, containment, privacy, capacity, disabled, copied-plugin, and failure scenarios.
- `node tools/proofs/cross-project-kaizen.ts --help`: exit 0; documented provider-free, loaded, and replay modes present.
- `node tools/install-opencode-global.ts --help`: exit 0; documented profile and restart behavior present.
- `npm run validate:strict`: exit 0, `warnings=0`.
- `npm run instruction:inventory -- --format markdown`: context quality passed with zero deterministic errors or review-only findings.
- Strict OpenSpec validation: change valid.
- `git diff --check`: exit 0; only existing line-ending warnings.

## Residual Risks

- Automatic compaction capture remains explicitly documented as conditional and unproved while task 2.1 is serialized.
- Installed cold command following, SDET, and the independent broad-claim challenge remain task-4 evidence, not documentation proof.
