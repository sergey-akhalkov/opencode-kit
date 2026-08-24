# Task 2.1 Snapshot Happy Path

- Disposition: `build-minimal` after verified non-fit of project inventory / OpenSpec inventory / operation gate / session-delivery.
- Recurrence: repeated `git status` + `git diff` + `git log`.
- CLI: `global/bin/repo-candidate-snapshot.ts`
- Help `--help`/`-h` exit 0, no Git.
- Mixed disposable fixture: staged `staged.txt`, unstaged `tracked.txt`, untracked `untracked.txt`; no file mtime change.
- Current worktree `--summary` recorded in `task-2-1-current-summary.json`.
- Focused test: `node tools/test-repo-candidate-snapshot.ts` exit 0.
