# Task 2.3 Curated Serena Proof

- Recorded at: `2026-08-25T21:09:09.3413735Z`
- Product Candidate: `aa7c22394aca7f0af886636a245cfef3742015574e00edd0498475c87f20320b`
- Candidate derivation: SHA-256 of the sorted five-file production manifest. Current hashes: `index.ts=75b58802ef3fcc19ad977a1315979453d42230f94db0887829e99c1b44b77383`; `recall.ts=2ee98c035a3f756a9815a0341db6ff1a243f6343205f2ec1b07499cee12786d1`.
- Environment: `windows-node24.18.1-serena-filesystem-r1`
- Invocation: `node tools/test-project-memory.ts`
- Exit status: `0`
- Focused result: `9/9` PASS.
- Valid-source oracle: current regular Markdown under `.serena/memories/` participates in the shared lexical rank with `source=serena`; `core.md` is excluded from ranked results and included only as bounded project core.
- Core/privacy oracle: a core larger than 2 KiB is UTF-8 truncated before its tail marker; canonical project-root forms and a supported credential are replaced with `<project-root>` and `<redacted>` in the capsule; total capsule size remains at most 8 KiB.
- Envelope oracle: 101 Markdown files and a source larger than 512 KiB each omit the complete curated source with `serena:over-limit`; no partial curated result is ranked.
- Containment oracle: an escaping directory junction is detected as a symbolic-link source and omitted with `serena:unsafe-source`, without exposing the path.
- Independence oracle: an 8,001-event local store produces `local:corpus-envelope` while safe curated recall still succeeds; conversely, unsafe Serena is omitted while a valid active local card still succeeds.
- Absence/no-MCP oracle: all other focused fixtures without `.serena/memories/` continue normally, and the implementation uses only contained filesystem reads with no Serena client or MCP dependency.
- Read-only oracle: curated file contents and disposable repository `git status --porcelain` are unchanged after recall; the implementation exposes no Serena write path.
- Additional validation: syntax checks passed for `recall.ts`, `index.ts`, and the focused test. Code-quality inventory reports `recall.ts` at 463 lines and `tools/test-project-memory.ts` at 794 lines, both attention-only and below the 800-line split-candidate band.
- Effects and cleanup: provider-free disposable filesystem/process activity only; all fixture roots and child processes were removed/stopped; no installed, remote, or persistent Serena state was changed.
- Claim ceiling: task `2.3` exact curated-source and source-independence cases. Loaded-plugin evidence remains stale until task `4.1`, and the complete `PMC-001` population remains unknown.
