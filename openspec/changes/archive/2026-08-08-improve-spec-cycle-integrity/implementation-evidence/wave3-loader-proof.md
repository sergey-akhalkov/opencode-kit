# Wave 3 Loader And Local Instructions Proof

## Candidate Reference

- Product Candidate: current working-tree content of `global/opencode.json.template`, `tools/install-opencode-global.ts`, `tools/opencode-runtime-sources.ts`, `tools/doctor.ts`, and the related README/spec/instruction wording.
- OpenCode source reference: tag `v1.18.15`, `packages/core/src/global.ts`, `packages/opencode/src/config/{config,paths,variable}.ts`, and `packages/opencode/src/session/instruction.ts` from `https://github.com/anomalyco/opencode`.
- Development stage after the corrected live lane: `MVP` for loader precedence and fresh-install local instructions.

## Environment Identity

- OS: Windows.
- Node: `24.18.0`.
- OpenCode: `1.18.15`.
- External model/provider calls: none for this lane. The provider boundary was a disposable HTTP listener on `127.0.0.1:18081`.
- Disposable fixture root: `C:\Users\Sergey\AppData\Local\Temp\opencode\loader-precedence-proof` (removed after capture).

## Source Contract

- `Global.make()` selects `OPENCODE_CONFIG_DIR` as the global instruction/config service directory when set.
- `ConfigPaths.directories()` still includes the host-default config directory, project directories, and the custom directory, so config/plugin/agent/skill discovery remains additive.
- `Instruction.systemPaths()` checks the selected global service directory for `AGENTS.md`, then the nearest project instruction, then configured `instructions` paths. Therefore a custom `AGENTS.md` replaces the host-default global `AGENTS.md` slot for this artifact class; project instructions and explicit instruction paths remain additive.
- Config `{env:...}` substitution occurs on raw JSON. Native Windows backslashes therefore cannot safely be interpolated into a JSON string. The retained implementation materializes one exact placeholder at installer time as a forward-slash absolute path.

## Fresh-Install Runner

- Runner: exact candidate installer copied into an isolated kit-shaped directory with its existing dependencies linked read-only.
- Invocation: `node tools/install-opencode-global.ts` in the disposable copy.
- Exit: `0` after dependency setup.
- Observation: the generated `global/opencode.json` contained an absolute forward-slash `instructions` entry ending in `/global/opencode.local.instructions.md`; the placeholder was absent.
- Observation: `global/opencode.local.instructions.md` was provisioned from the portable example.
- Existing-config behavior: the candidate preserves an existing config and emits an actionable note when that config does not reference the expected absolute local-instructions path. It does not migrate or overwrite persisted machine-local configuration.

## Integrated Loader Runner

- Fixture markers: `HOST_DEFAULT_AGENTS_MARKER`, `CUSTOM_AGENTS_MARKER`, `PROJECT_AGENTS_MARKER`, and `LOCAL_INSTRUCTIONS_MARKER` in separate disposable sources.
- Client invocation: `opencode run --pure --format json --model proof/proof --agent build --title loader-precedence-proof "Reply only fixture-ok. Do not call tools."` with isolated `XDG_CONFIG_HOME`, `OPENCODE_CONFIG_DIR`, and `OPENCODE_TEST_HOME`.
- Capture boundary: localhost OpenAI-compatible `/v1/chat/completions` request body; evaluator emitted marker presence booleans only and did not persist prompt content.
- Client exit: `0`; session `ses_01ecc97d4ffeFBPAmwcy6Gjyy4`; response `fixture-ok`.
- Captured markers: host-default global `false`, custom global `true`, project `true`, materialized local instructions `true`.
- Verdict: the exact custom/default `AGENTS.md` precedence and the additive project/local-instructions behavior match the current source contract.

## Runtime Source Inventory

- Invocation: `npm run opencode:sources`.
- Exit: `0`.
- Observation: the privacy-safe report identified the host-default and custom config collision, project/custom artifact locations, and no host-default `AGENTS.md` in the current machine inventory. It printed locations and names, not file contents or provider options.
- Limitation: inventory presence alone does not prove precedence; the source contract and isolated localhost capture above supply that evidence.

## Proof Incident And Restoration

- The first installer runner attempted to shadow `setx` through `PATH`, but Windows application resolution reached the real `setx.exe` and temporarily changed `HKCU\Environment\OPENCODE_CONFIG_DIR` to the disposable fixture.
- Detection: `reg query "HKCU\Environment" /V OPENCODE_CONFIG_DIR` returned the fixture path immediately after the run.
- Restoration: `setx OPENCODE_CONFIG_DIR "D:\sa-gh\opencode-kit\global"` exited zero, and a second registry query returned exactly `D:\sa-gh\opencode-kit\global`.
- No further installer proof used `setx`; the already materialized disposable config was used for the localhost capture.

## Residual Limit

- Existing machine-local `opencode.json` files are deliberately not rewritten. Their owners must add the reported absolute instruction path or recreate the local config from the template if they want the new personal-instructions source loaded.
