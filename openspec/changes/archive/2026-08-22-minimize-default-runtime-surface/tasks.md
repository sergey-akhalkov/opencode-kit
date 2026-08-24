## Shared Execution Envelope

All work starts in disposable generated config roots. Existing `OPENCODE_CONFIG_DIR`, `global/opencode.json`, machine-local instructions, and installed artifacts remain unchanged until an explicit later migration operation. Consumer/provider evidence is owned by `establish-consumer-outcome-regression-gate`; this change does not make unbounded model calls.

## 1. Define And Generate Runtime Surfaces

- [x] 1.1 After the proposal dependency predicates are current, add exact profile schema plus the design's named `core` catalog and updated `all` manifest; verify missing files, escape paths, duplicate/conflicting owners, and unstable ordering fail in focused profile tests.
- [x] 1.2 Implement create-new profile materialization under an ignored disposable root with atomic swap/backup/readback; verify core and all generated trees byte-match their manifests and injected failure preserves the prior root.
- [x] 1.3 Add effect-free help, preview, check, and migration planning to global installation; verify an existing unprofiled/full install is reported without changing config, environment, or files.

## 2. Prove The Core Loader Surface

- [x] 2.1 Materialize core in a disposable config root and start the installed OpenCode entrypoint against an unrelated fixture; verify loader-visible source inventory contains only core artifacts, no hidden parent catalog, and exact cleanup. This is the first real boundary.
- [x] 2.2 Bind instruction budget to the generated core identity and enforce 12,000 startup/1,200 discovery token-proxy while reporting full catalog separately; verify over-budget, missing-source, and collision fixtures fail closed.

## 3. Separate Authority And Tighten Discovery

- [x] 3.1 Move personal standing authorization from portable `global/AGENTS.md` into the official gitignored local-instructions example/path without weakening portable protected boundaries; verify committed runtime text contains no maintainer identity and local opt-in remains loader-visible only in its generated machine root.
- [x] 3.2 Render ask-level core config and explicit machine-autonomy mode while preserving existing config bytes; verify fresh core permission readback is ask, autonomy readback is allow only in gitignored generated config, and no current machine config is rewritten.
- [x] 3.3 Narrow maintained skill descriptions and validator contracts; verify generic adjacent requests do not discover OpenSpec/domain skills while exact domain requests still do, using metadata fixtures before model evidence.

## 4. Retain Only A Proven Default

- [x] 4.1 Run matched consumer `no-regression` for staged full baseline versus core candidate after all static/loader gates pass; verify every hard outcome/safety oracle and owner-question/tool-call constraint passes before selecting core.
- [x] 4.2 Run one fresh test-only SDET against the runtime-proven candidate for reachable permission/authorization or private machine-fact leakage, then independently disposition any critical row and regain proof after correction.
- [x] 4.3 Make core the fresh-install default and keep explicit all/rollback behavior; prove a disposable fresh install, explicit all install, migration preview, migration/rollback fixture, and unchanged existing install.

## 5. Complete Validation

- [x] 5.1 Run focused profile/installer/description tests, loader inventory, instruction budgets, consumer gate replay, `npm test`, `npm run validate:strict`, selected strict OpenSpec validation, and `openspec validate --all`; keep the change at MVP and record any unrelated active-change failure until repository-wide validation is green.
