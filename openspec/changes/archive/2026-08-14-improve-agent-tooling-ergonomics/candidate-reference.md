# Candidate Reference

## Identity

- Candidate: `candidate-contract-green-r4`
- Development stage at freeze: `MVP`
- Product Candidate: `global/AGENTS.md`
- Product Candidate SHA-256: `4b5b79af042fd2688dbfca747373ad42a5dc0e131469a9570397fb219d5cc183`
- Proof Runner: `tools/proofs/agent-tooling-ergonomics.ts`
- Proof Runner / Evaluator SHA-256: `e6dd2cd9d24a10102fba5a124fcc9bd9f150ecdc071d60d69ae52bb8960b0ddb`
- Shared process boundary: `global/bin/portable-process.ts`
- Shared process boundary SHA-256: `6b4bd770a56c6e3dbaba5586358e9683eec1c08451f7444c0351abbf62f7769b`
- Environment: OpenCode `1.18.18`, profile `quality-independent`, model
  `openai/gpt-5.6-sol`, variant `xhigh`, Windows local disposable projects.

## Behavior Evidence

- Baseline capture: `evidence/baseline-capture-r2/manifest.json`
  (`c1561f7f1f67b36c5554b553ae1d2334eec097ac031f7ab266046b667c6e2e34`).
- Candidate capture: `evidence/candidate-capture-r4/manifest.json`
  (`92ce91a251e666700ff5f64e5e0d3ab977d722a97666f8befbdf90a7086f3fb5`).
- Paired evaluator: `evidence/paired-evaluate-r7/manifest.json`
  (`004f41ea87aa76a2502175215ace43295a0dca742cdbee3f03c4ea3bcfb7bf1e`).
- Paired replay: `evidence/paired-replay-r7/manifest.json`
  (`7b6974e13cfc1d5bf518abcda8d12e617382cf38528fd2732c61b488db9cb95d`).
- Verdict: `baselineComplete: true`, `candidateComplete: true`.
- Reproduced improvements: repeated-use `--help` / `-h` changed from effect-free
  exit `1` usage failure to complete effect-free exit `0`; mechanical variants
  changed from helper-code semantic rows without a seed to reviewed seed data plus
  stable exact materialization.
- Preserved controls: product commands/output, maintained generator source outside
  ignored output, manual tiny one-off semantic data, model/profile/prompts, command
  status, session deletion, and disposable-root cleanup.

## Structural Evidence

- Final instruction inventory: `global/AGENTS.md` token proxy `16,599`; complete
  inventory `100,852`. Both are one below the frozen unrelated baseline and remain
  above normative `13,279` / `84,513` ceilings due to inherited changes outside
  this candidate.
- Permission readback: `evidence/permissions-r3/evaluation.json`
  (`026dca9f94733161f21c5cfb8349a68b0befee644b73c68bdc6232255f998c97`):
  permissive main default, preserved specialist restrictions, all-false hidden
  arbiter tools, status complete.
- Frozen pre-change unrelated tracked diff identity:
  `7f8973b1ebb485ba95bc54108928585fb7e94abb`.
- Full working tracked diff identity at freeze:
  `c0ae11611ff4a8a53a86cd2f1525e2873d948523`.
- The unrelated compaction-improvement hunk in `global/AGENTS.md` remains present;
  this candidate changes only the reusable-proof-tooling and deterministic-helper
  hunks.

## Boundaries

- No installation, activation, provider configuration, credential access, target
  repository mutation, commit, push, archive, release, or remote state change.
- `pmac-emulator` CLI repairs, structured-plan migration, and ignored historical
  harness migration remain separate deferred changes.
- Fresh critical-only SDET terminated `no-critical-risk` on the earlier proven r2
  hash and cannot repeat for this root. The current hash restores the pre-existing
  `New instructions are a last resort` safety marker and the exact r2-proven
  structured-data decision sequence; current paired runtime proof is green.
- `validate:strict`, full `npm test`, all OpenSpec validation, apply operation
  gate, permission readback, focused tests, diff check, and scoped secret scan are
  green. The roadmap owner completed its integrated proof and fresh SDET-owned
  installer/native test migration, removing the separated validation blocker.
