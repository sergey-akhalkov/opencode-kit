# Portable Workflow Runtime Proof

Date: 2026-08-08

## Environment

- Product Candidate: current working-tree `global/bin/` entrypoints, archive command/skill mirrors, thin package adapters, and portability/stagnation instruction contracts.
- Node: `24.18.0`
- OpenSpec: `1.6.0`
- OpenCode: `1.18.15`
- Runtime boundaries: unrelated disposable local projects under the approved temporary root; no credentials, network service, remote state, installation, or deployment.

## Deterministic Archive

Current entrypoint invocation:

```text
node D:\sa-gh\opencode-kit\global\bin\openspec-archive.ts --root <portable-archive-bin> --change portable-bin-proof -- node --version
```

Observed:

- completion gate: `artifacts=4 tasks=1/1`;
- strict change validation: exit `0`;
- non-npm project validation before and after archive: Node `v24.18.0`, exit `0`;
- official operation: `openspec archive portable-bin-proof --yes --json`;
- result: `status=archived`, `specsUpdated=true`, totals `added=1 modified=0 removed=0 renamed=0`;
- main spec created at `openspec/specs/portable-bin-proof/spec.md`;
- active path absent and dated archive contains proposal, design, tasks, delta, and metadata.

The earlier incomplete fixture exited non-zero at `Complete archive blocked by 1 unchecked task(s)` before project validation or official archive. Its main-spec hash remained `75e13ebc451083e7173de53ee35a998099d5b8b4`, active files remained present, and no archive path existed. After explicitly checking the task, the same fixture archived successfully through the official operation. No model-authored spec edit or manual move occurred.

## Exact Staged Candidate

Current entrypoint invocation:

```text
node D:\sa-gh\opencode-kit\global\bin\validate-staged.ts --root <portable-staged-pass> --temp-parent <portable-staged-temp> --reuse node_modules -- node validate.ts
```

Observed:

- source worktree `check.txt`: `red-worktree`;
- staged `:check.txt`: `green-index`;
- staged tree: `e5eb698f420b59d34a5f5b2914f03293cd757f45`;
- deterministic candidate commit: `d864ae22b718584c24727c3e6420949d5bbe56df`;
- validation observed `candidate=green-index dependency=reused-dependency`;
- result: `status=passed`, `cleanup=complete`;
- source worktree remained `MM check.txt`, its bytes were unchanged, and `git worktree list` contained only the source worktree;
- shared temporary parent was empty after execution.

The separate failure fixture printed `expected staged validation failure diagnostic`, preserved child exit `7`, and also removed its detached worktree and reuse link.

After SDET exposed Windows spaced-executable argv mangling, current reproof used absolute `C:\Program Files\nodejs\node.exe` for both tools. Staged validation passed with the same tree/commit and cleanup observations. Archive ran absolute Node `--version` before and after official archive, then reported `status=archived`, `specsUpdated=true`, and `added=1` for `portable-process-proof`.

## Loader-Safe Distribution

The first candidate path `global/tools/` was rejected. OpenCode treated it as custom-tool discovery and imported both side-effecting CLIs, producing `Unknown option: run` and host exit `2` even though compaction model output completed. `history.md` records the evidence and do-not-repeat condition.

The corrected candidate uses explicit `global/bin/` plus import-safe main guards. A fresh configured OpenCode process exited `0` with no CLI import diagnostics, while direct archive and staged invocations remained green.

## Compaction Strategy Switch

Same transcript/model/environment comparison, model `xai/grok-4.5` variant `high`:

- Baseline session `ses_01dd33638ffe5H8MYv17geV91N`: exit `0`, output `851` tokens. It advised listener inspection and mentioned later history recording, but emitted no structured pending history entry, no explicit stagnation classification, and no evidence-based retry condition.
- First candidate session `ses_01dd23e7effeMNfaCcjE9GHaWf`: content passed the new oracles but host exit `2` due the rejected loader path; it is red product evidence, not accepted proof.
- Corrected candidate session `ses_01dcfa0f2ffesVNW7Cfvqz2pWO`: exit `0`, output `1457` tokens. It classified `Stagnation: yes`, emitted complete pending strategy-history fields, prohibited timeout/wording/retry-count variants without new causal evidence, selected listener ownership plus direct health as the mechanism-level next strategy, and made the final Next-Session Action persist history before executing that strategy.

Retention is based on required quality/continuity behavior, not token or speed improvement. The extra output is the accepted cost of durable anti-repeat evidence.

## Stage

The representative archive, staged-candidate, loader startup, and compaction behavior paths work at real local boundaries.

Development-Stage: `MVP`
