# Strategy History

## 2026-08-21 - Owner authorized workstation config transfer

- **Objective:** Separate tracked portable example from gitignored machine-local workstation mappings.
- **Approach:** Keep current local bytes in place, add a path-free example, ignore the concrete filename, resolve only explicit `--config` or the documented local default, and refuse the example as live config.
- **Evidence:** `node tools/test-workstation-config.ts` exited 0 (7 tests). Default `preflight` still reads the preserved local file. Missing/invalid configs fail before elevation. Injected replacement failure restored prior bytes. `git rm --cached` untracked the concrete file without deleting working-tree bytes.
- **Outcome:** Task 4.2 complete. Host mappings remain local-only.
- **Reason:** Owner explicitly authorized the previously serialized file movement.
- **Do-Not-Repeat Condition:** Do not copy example placeholders into the live local file or synthesize maintainer paths.
- **Evidence-Based Retry Condition:** Revisit only if schema 2 or repository-id set changes and the example becomes invalid.

## 2026-08-21 - Windows local validation; Ubuntu hosted-only

- **Objective:** Prove the Windows CI-equivalent command set and report Ubuntu/OpenSpec status without mutating unrelated owners.
- **Approach:** Run focused process/MCP/CI-envelope tests, installer help/dry-run, `npm run validate:strict`, `npm run test:diagnostic`, selected OpenSpec validation, and `openspec validate --all` on this Windows host. Probe WSL for a local Ubuntu set.
- **Evidence:** WSL list exited `1`. Windows focused suites passed (portable process 7, MCP 12, CI envelope 2, install-global 27, library 161). `validate:strict` exited `0` (`skills=29 agents=18 markdown=556 warnings=0`). Selected change validation exited `0`. `openspec validate --all` exited `1` solely for unrelated `reduce-workflow-ceremony` omitted MODIFIED scenarios. Installer `--dry-run` printed `setx` preview and stated no environment change.
- **Outcome:** Unblocked scope is locally green on Windows. Task 4.2 remains blocked on workstation config ownership. Ubuntu execution stays on the existing hosted job.
- **Reason:** No local Ubuntu runtime is available; the Ubuntu workflow job was left in place and not rewritten.
- **Do-Not-Repeat Condition:** Do not treat the unrelated `reduce-workflow-ceremony` OpenSpec failure as a reason to edit that change from this owner.
- **Evidence-Based Retry Condition:** Re-run the Ubuntu command set when WSL or a hosted Windows/Ubuntu pair is available; retry 4.2 only after the recorded transfer condition.

## 2026-08-21 - Workstation config ownership remains blocked

- **Objective:** Reconcile who may mutate `tools/windows/opencode-workstation.config.json` before replacing it with a path-free example plus gitignored local file.
- **Approach:** Read active workstation change tasks/history and leave the concrete config untouched until both owners close or transfer the file.
- **Evidence:** `fix-workstation-restart-reliability` still has unchecked mutation-capable tasks (2.2 onward). `optimize-shared-opencode-runtime-resources` has checked tasks but is not archived and already extended this file (schema 2 / graphify paths). The file currently contains absolute maintainer paths.
- **Outcome:** Config movement stays planning-only. Resolver, MCP tests, and Windows CI proceed on disjoint files.
- **Reason:** Dual active ownership makes a rename/ignore change an overlapping write.
- **Do-Not-Repeat Condition:** Do not mutate `tools/windows/opencode-workstation.config.json` while either workstation change remains active/unarchived.
- **Evidence-Based Retry Condition:** Implement task 4.2 only after both workstation changes are archived or each records an explicit transfer of this file to `harden-cross-platform-bootstrap-validation`.

## 2026-08-21 - Reject execution-policy modification

- **Objective:** Make documented bootstrap commands work on Windows.
- **Approach:** Consider changing PowerShell execution policy, then select `.cmd`/direct Node argv resolution plus native Windows effect-blocked CI.
- **Evidence:** The audited host failed before kit logic because PowerShell selected blocked `.ps1` shims; `npm.cmd` and `openspec.cmd` worked with no policy change.
- **Outcome:** Platform-correct resolver and CI selected; policy mutation rejected.
- **Reason:** The selected approach is portable, reversible, and tests what users invoke without weakening host security.
- **Do-Not-Repeat Condition:** Do not bypass or relax execution policy to make repository commands green.
- **Evidence-Based Retry Condition:** Reconsider command candidates only if current Windows runtime documentation or live evidence removes `.cmd` support or supplies a safer official entrypoint.
