# Task 3.1 Full Inventory CLI Evidence

## Outcome And Ownership

- Decision: `extend`. The current owner remains `global/bin/complexity-foraging-inventory.ts`; no inventory framework, semantic classifier, target-project script, repository-only `tools` import, or new dependency was added.
- Candidate: `continuous-complexity-management-inventory-r2`.
- Environment: Windows, Node `24.18.1`, provider-free local execution.
- Scope: stable JSON and Markdown, reviewed scope readback, explicit complete/partial/unknown/unsupported/unreadable/blocked states, privacy-safe diagnostics, file/maintained-byte/time bounds, caller-owned cancellation marker, package wrapper, and focused regression coverage.

## Real Boundary

- Focused invocation: `npm run test:focused:complexity-foraging`.
- Terminal result: exit `0`; stdout reports contract `valid=8 invalid=7` and inventory `fixtures=6 bounds=3 cancellation=1 unreadable=3`; stderr empty.
- Native runner invocation: `node --test --test-reporter=spec --test-concurrency=1 tools/test-complexity-foraging-contract.ts tools/test-complexity-foraging-inventory.ts`.
- Native runner result: exit `0`; tests `2`, pass `2`, fail/cancelled/skipped/todo `0`.
- Repository wrapper invocation: `npm run complexity:inventory -- --root tools/proofs/fixtures/complexity-foraging/projects/cohesive --format markdown`.
- Wrapper result: exit `0`; support `complete`; stdout is the exact retained Markdown artifact; stderr empty; target project unchanged.

## Exercised Contract

- The exact global CLI ran twice with byte-stable canonical JSON over six provider-free fixture roots: cohesive `complete`, reviewed noisy `complete`, reviewed classes `complete`, unsupported ecosystem `unsupported`, out-of-scope path `unknown`, and normally readable nested-I/O fixture `complete`.
- Reviewed classes retain exact maintained/generated/vendor/evidence/corpus/dependency counts, exclude non-maintained candidates, preserve exclusion reasons, and warn that exclusions are not proof of absence.
- Invalid schema version/path and malformed JSON stop before output with field/cause diagnostics and no absolute root/scope path. Missing and non-directory roots return structured `unreadable` output, nonzero status, SHA-256 root identity, and original cause code without an absolute path.
- Injected nested `EACCES` preserves the project-relative failing path and independently observed manifest facts as `partial`; injected root-directory `EACCES` is `unreadable`, nonzero at the CLI boundary, and replaces the OS path-bearing message with safe context while preserving name/code.
- File, maintained-byte, and wall-clock bounds plus a pre-existing caller cancellation marker return structured `blocked` output and nonzero status. The file count does not exceed its cap, the byte-bound case does not read the over-bound payload, timeout stops before full traversal, and pre-cancellation stops at zero files.
- JSON contract readback is canonical; Markdown is byte-stable across split/equal argument forms. Output contains no source payload or absolute root/cancellation path.

## Effects And Cleanup

- Both help forms are effect-free and source-fixture digests are unchanged before/after all scans.
- The test owns one OS temporary root and its cancellation marker, waits synchronously for child closure, removes the root in `finally`, confirms absence, and leaves fixture digests unchanged.
- The inventory only reads the caller-owned cancellation marker and never creates, changes, or removes it. No model/provider call, install, network, remote effect, or target-project mutation occurred.

## Retained Evidence And Claim Ceiling

- `task-3-1-cohesive.json`: exact successful canonical JSON output.
- `task-3-1-cohesive.md`: exact successful Markdown projection.
- `task-3-1-max-files.json`: exact structured nonzero bound output with `MAX_FILES` and reached counts.
- This evidence supports the provider-free inventory contract and fixture matrix only. It does not support a loaded configured population member, semantic architecture judgment, broad refactor-effectiveness claim, external-project behavior, or consumer mutation.
- Known non-critical limitation: synchronous operating-system filesystem calls cannot be preempted while the host call itself is blocked; timeout and cancellation are checked before each traversal unit and after maintained reads, and any reached timeout/cancellation is fail-closed as `blocked`.
