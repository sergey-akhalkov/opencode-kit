# Waves 2-5 Maintenance Evidence

Date: 2026-08-08

## Change Inventory And Traceability

- `openspec/project.md` derives active and archived change state from live OpenSpec commands instead of carrying a stale hand-maintained snapshot.
- Completed and retired proposal references use explicit non-active wording.
- Active specification `Purpose` sections no longer contain placeholder text.
- Shared Universal Development Loop behavior is synchronized across `openspec/specs/` and `global/skills/deep-task-planning/`.

## Loader And Local Instructions

`implementation-evidence/wave3-loader-proof.md` records the live loader and installer proof. The candidate:

- enumerates project-root and singular OpenCode instruction/plugin/skill/agent sources;
- groups equivalent config names as one `OpenCode config` collision class;
- materializes the local-instructions placeholder as a forward-slash absolute path for a new generated config;
- preserves a pre-existing gitignored config and emits migration guidance instead of rewriting it;
- retains `OPENCODE_CONFIG_DIR` as an additive kit source rather than treating it as proof that other sources are absent.

## Compaction And Next-Step

- Compaction session `ses_01ee323feffe8iLpOWq63wLFHl` produced all six required quality/cycle-speed/token-economy cells and exactly one `Next-Session Action`.
- Corrected next-step session `ses_01ede6932ffe6R1A87NHL0dDPq` used only `openspec list` and `openspec instructions apply`, recommended one bounded active change, and exited zero.

## Static And Component Validation

Observed green commands before this record:

```text
openspec validate improve-spec-cycle-integrity --strict
node tools/validate-library.ts --strict
node tools/install-opencode-global.ts --check
npm run install:global -- --dry-run
npm run test:focused:contracts
npm run test:focused:validation
npm run test:focused:init
npm run test:focused:code-quality
npm run test:focused:model-routing
npm run test:focused:library
npm run test:focused:session-plugin
```

The remaining operation-gate, pre-push, and installer fixture updates are intentionally not represented as complete here.
