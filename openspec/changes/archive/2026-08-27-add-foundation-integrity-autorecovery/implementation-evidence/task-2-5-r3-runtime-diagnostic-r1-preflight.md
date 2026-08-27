# Task 2.5 R3 Runtime Diagnostic R1 Preflight

- Purpose: classify the R3 post-`step_start` termination through a causally different OpenCode server/SDK observation path. This invocation is diagnostic only and cannot satisfy task 2.5 acceptance.
- Scope: one selected `mismatch-unique-recovery` candidate session, one configured primary prompt, no baseline call, no other scenario, and no equivalent retry.
- Candidate governed digest: `231a2c5b1f1d0058f3e3a427479350a0e3fc1dad2ba64b6d34e50db540785e93`.
- Scenario digest: `6cfcbecbeacfe352c4e5884cb3ae1f1f6a5c59e0f8b27b5a81c016990abaadf9`.
- Installed runtime: standalone OpenCode `1.18.23`; executable SHA-256 `59b379b53354da72d2c5262119fe70c44b4e473826ebbaa94d47a2d58a359b1a`. Required local model catalog and pinned ripgrep were observed before launch.
- Instrumentation: route readiness and provider connectivity, structured assistant finish/error and message/tool sequence, prompt error causes, server terminal status/signal, bounded redacted INFO logs, elapsed time, hashed XDG runtime manifest, outcome files, proof/validation exits, session deletion, process stop, and fixture cleanup.
- Permissions/effects: same reviewed fixture-only foundation envelope; local `read`, `edit`, named owner task, and named recovery skill only. No remote mutation, credentials output, question, shell, external directory, install, commit, release, deployment, or protected action.
- Provider-free validation: consumer-outcome tests 28; standalone identity fallback succeeded; selected-pack preflight remained ready with one scenario, three members, and the same governed/scenario digests.
- Stop line: stop after the first structured completion, provider/runtime error, process exit, or 180-second timeout. Preserve `diagnostic.json`; do not infer task 2.5 acceptance or start another live call from this diagnostic alone.
