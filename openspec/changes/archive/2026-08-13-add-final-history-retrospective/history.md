# Strategy History

## 2026-08-13 - Broad synchronized instruction patch

- **Objective:** Apply the complete additive final-history-retrospective policy across all loaded and normative mirrors in one atomic edit.
- **Approach:** Use one multi-file patch with shared context spanning global authority, propose/apply/archive skills and commands, OpenSpec config, and normative specs.
- **Evidence:** The patch tool rejected the complete edit before mutation because the archive skill says `Invoke complete archive` while the command mirror says `Invoke the deterministic archive helper`; the broad expected context did not match the skill.
- **Outcome:** No file was changed by the failed patch. Exact source blocks were then read and the same accepted semantics were applied through two narrower patches, which succeeded.
- **Reason:** Maintained skill/command mirrors intentionally express the same behavior with small operation-local wording differences, so one shared exact-context hunk was not valid for every file.
- **Do Not Repeat:** Do not use one shared exact-context hunk across skill and command mirrors without first confirming byte-compatible surrounding text.
- **Evidence-Based Retry Condition:** Retry a grouped patch only when targeted readback proves the relevant context is byte-compatible; otherwise patch each exact current owner block separately.

## 2026-08-13 - Focused contract validation with concurrent candidate

- **Objective:** Verify that the instruction candidate preserves all existing focused contracts before loaded runtime proof.
- **Approach:** Run the repository-native `npm run test:focused:contracts` on the shared dirty worktree after source mutation.
- **Evidence:** Every relevant existing lifecycle, OpenSpec apply, and session-improvement contract passed. One unrelated test failed because `global/agents/session-completion-arbiter.md` lacks the checkpoint marker `use owner_required only when the question crosses an exact owner boundary`, which belongs to the concurrently active `make-grind-questions-autonomous` candidate. `npm run validate:strict`, strict selected-change validation, and diff check passed.
- **Outcome:** The retrospective candidate is not implicated; complete focused validation remains red on the shared worktree until the concurrent owner finishes or reconciles its arbiter surface.
- **Reason:** The focused suite validates all active dirty changes together and cannot isolate a candidate that shares the repository with another unfinished instruction change.
- **Do Not Repeat:** Do not mutate the completion-arbiter surface or weaken its oracle from this change merely to make aggregate validation green.
- **Evidence-Based Retry Condition:** Rerun the complete focused suite after the concurrent arbiter candidate supplies the named marker or when an isolated candidate validation mechanism can preserve all intended shared edits.

## 2026-08-13 - Incomplete disposable propose environment

- **Objective:** Prove through the actual loaded `/opsx-propose` entry point that a newly authored change receives the one initially-last final-history-retrospective task and reaches proposal readiness without implementing product work.
- **Approach:** Create a disposable root containing the candidate `.opencode` command/skill loaders, ask the model to author a minimal change, and run the command's own propose gate and strict validation.
- **Evidence:** The installed command created a valid OpenSpec change whose `tasks.md` has exactly one ordinary task followed by exactly one final retrospective with the canonical matrix/admission/task fields, while `note.md` remained absent. Readiness attempt 1 then failed because the disposable root lacked the repository `openspec:gate` npm adapter. After adding that adapter and resuming the same session, attempt 2 reached the real gate and failed because the command-only fixture also lacked `openspec/config.yaml`, so its minimal proposal did not receive this repository's required seven-field Outcome Capsule rule. Strict OpenSpec validation itself passed before the adapter correction.
- **Outcome:** Product task-authoring behavior is observed green, but complete propose readiness is not established in this incomplete environment. No Product Candidate or planning artifact in the working repository changed.
- **Reason:** Copying only `.opencode` proved command loading but did not reproduce the project's complete OpenSpec authoring environment and deterministic gate prerequisites.
- **Do Not Repeat:** Do not run another propose proof in a command-only fixture or repair its missing project contract one failure at a time.
- **Evidence-Based Retry Condition:** A materially distinct fresh disposable root must contain the candidate `.opencode` loaders, `openspec/config.yaml`, and a working local `openspec:gate` adapter before the model call; only then may one complete propose authoring attempt run.

## 2026-08-13 - Archive delta already present in main specs

- **Objective:** Complete the official deterministic OpenSpec merge and archive after all implementation tasks and validation were green.
- **Approach:** Invoke the portable archive owner with the official OpenSpec JSON archive command and `npm run prepush:validate` as project validation.
- **Evidence:** Pre-archive validation passed, then official merge returned `archive_spec_update_failed`: `library-instruction-artifacts ADDED failed for header "### Requirement: New OpenSpec changes schedule one final history retrospective" - already exists`. The helper reported `No files were changed`; source readback confirmed every complete delta requirement already exists in current main specs from the synchronized implementation candidate.
- **Outcome:** Archive stopped before mutation. The complete identical delta blocks are reclassified from `ADDED` to `MODIFIED`; accepted semantics, Product Candidate, Runtime Proof, tasks, and main specs are unchanged.
- **Reason:** This repository keeps current normative specs synchronized during implementation, so archive sees existing exact requirement owners rather than absent additions.
- **Do Not Repeat:** Do not retry official archive with `ADDED` operations for requirement headers already present in main specs, and do not bypass merge with `--skip-specs` or manual movement.
- **Evidence-Based Retry Condition:** Retry only after strict validation confirms complete `MODIFIED` requirement blocks whose headers and accepted content match the current main requirement owners.
