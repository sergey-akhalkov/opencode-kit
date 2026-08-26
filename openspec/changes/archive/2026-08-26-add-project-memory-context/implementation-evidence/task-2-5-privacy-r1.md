# Task 2.5 Privacy And Diagnostic Proof

- Recorded at: `2026-08-25T21:30:28.8523844Z`
- Product Candidate: `29ba3b07623d31065236053e30d9d488650e900651d868b63d60b96d73aeed8b`
- Candidate derivation: SHA-256 of the sorted five-file production manifest. Current changed hashes: `index.ts=fb5e913bb2aa252f5951bbd24e063a71fc216d26b825ef58ef17a1bc1de3bacd`; `recall.ts=ac7fd1385d9c05493f63bcd5ea5b8bc5edfc984406deff13d3cfcce5cd71850a`; `store.ts=f7d38a38778b1b34bf2369375e42dd7985dc15b70ee6383777bf22403681898e`.
- Environment: `windows-node24.18.1-privacy-output-r1`
- Invocations: `node tools/test-project-memory.ts`; `node tools/test-project-memory-hooks.ts`; `node tools/test-session-env-plugin.ts`; `npx openspec validate add-project-memory-context --strict`.
- Exit status: all `0`.
- Focused result: project-memory direct `8/8` PASS; real hook-object lifecycle/privacy `1/1` PASS; existing session plugin `18/18` PASS; OpenSpec strict validation valid.
- Diagnostic oracle: malformed records retain `malformed-record` or `unsupported-schema` cause codes behind hashed record refs; unreadable and over-limit local stores report fixed safe warning codes; unsupported and unsafe selectors fail with typed causes without echoing supplied paths.
- Warning oracle: two identical one-second root-lookup timeouts for one session emit exactly one captured warning. The warning contains only a 12-hex session ref and contains no raw session id, project root, supported credential, or home path.
- Output oracle: explicit recall JSON and the actual recall tool output are at most 16 KiB; actual manage tool output is at most 4 KiB. Tool metadata contains only byte count and a `project_` plus 32-hex ref. A 20,000-byte relevant curated item is retained in bounded automatic rendering while explicit output reports deterministic truncation.
- Privacy oracle: persisted cards, recall/tool results, capsules, metadata, and captured warning diagnostics omit the supported credential, home path, canonical native root, slash-normalized root, and case variant. Project roots render as `<project-root>` and supported secrets as `<redacted>`.
- Source-failure oracle: unreadable local storage and unsafe/over-limit curated storage fail independently; valid content from the other source remains usable. Malformed records are quarantined individually while cause refs remain bounded.
- Unrelated behavior oracle: the composed session plugin remains `18/18` green, including shell, Graphify, delivery-context, privacy, and descendant handling.
- Effects and cleanup: provider-free disposable Git/data/Serena fixtures and exact child processes only; all fixture roots and children were cleaned; no installed, remote, external-network, transcript, worktree-memory, or Serena mutation survived.
- Claim ceiling: task `2.5` exact privacy, diagnostic, source-failure, and output-boundary cases. Loaded-plugin evidence remains stale until task `4.1`, and complete `PMC-001` population closure remains unknown.
