# Baseline Loaded Workflow Evidence

## Environment

- Date: 2026-08-13.
- Entry point: installed OpenCode `1.18.18` using `opencode run --command`.
- Model: `openai/gpt-5.6-sol`, variant `xhigh`, agent `build`.
- Tool envelope: `edit`, `bash`, `task`, `question`, and `external_directory` denied through `OPENCODE_CONFIG_CONTENT`; both prompts also prohibited tools and mutation.
- Effects: two configured-provider inference calls; no file, archive, remote, credential, installation, activation, or protected-operation effect. Both attributable proof sessions were deleted after capture.

## Propose Baseline

Invocation shape:

`opencode run --command opsx-propose --model openai/gpt-5.6-sol --variant xhigh <read-only synthetic new-change prompt>`

Exit: `0`.

Observed response:

- The current loaded `/opsx-propose` explicitly says it does not require a separate initially-last task that analyzes complete `history.md` through the compaction improvement matrix.
- It requires ordinary implementation tasks and strategy history only; it rejects a prospective placeholder for future analysis.

## Apply Baseline

Invocation shape:

`opencode run --command opsx-apply --model openai/gpt-5.6-sol --variant xhigh <read-only synthetic completed-change prompt>`

Exit: `0`.

Observed response:

- The current loaded `/opsx-apply` explicitly says it need not run the full six-cell compaction analysis over complete `history.md`.
- It reads `history.md`, but absent current-session admission or `Pending Improvement Tasks`, journal evidence alone does not become an improvement candidate.
- It does not schedule that analysis exactly once.

## Candidate Oracle

Using the same model, command loaders, tool denial, and substantive scenario:

1. Candidate propose requires exactly one unchecked initially-last final-history analysis task created once during new-change authoring.
2. Candidate apply requires that task to run after every other currently known task, use the existing compaction matrix/admission/task contract with complete `history.md` as input, append every admitted improvement, and immediately continue implementation.
3. A no-evidence journal produces `none` and no manufactured task.
4. Neither apply nor generated work creates a second final-history analysis task.
