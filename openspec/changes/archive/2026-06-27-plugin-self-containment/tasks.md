## 1. Move module under plugin directory

- [x] 1.1 Create `global/plugin/session-delivery-context/` directory.
- [x] 1.2 Move `tools/delivery-context/db.ts` (or, if CHG-001 has not landed, the equivalent SQLite query helpers from `tools/session-delivery-context.ts`) into `global/plugin/session-delivery-context/db.ts`.
- [x] 1.3 Move `requirements.ts` into `global/plugin/session-delivery-context/requirements.ts`.
- [x] 1.4 Move `redaction.ts` into `global/plugin/session-delivery-context/redaction.ts`.
- [x] 1.5 Move `projection.ts` into `global/plugin/session-delivery-context/projection.ts`.
- [x] 1.6 Create `global/plugin/session-delivery-context/index.ts` that re-exports `readSessionDeliveryContext` and the public types.
- [x] 1.7 Update internal `import` paths inside the moved files so they resolve within the new directory.

## 2. Plugin static import

- [x] 2.1 Replace `loadSessionDeliveryContextModule` in `global/plugin/session-env.ts` with `import { readSessionDeliveryContext } from "./session-delivery-context/index.ts";`.
- [x] 2.2 Remove the candidate-path loop and the throw-on-not-found error path.
- [x] 2.3 Confirm `deliveryContextMetadata` and the tool registration still produce identical output.

## 3. CLI shim

- [x] 3.1 Rewrite `tools/session-delivery-context.ts` as a CLI shim that imports from `../global/plugin/session-delivery-context/index.ts`.
- [x] 3.2 Keep the shim under 100 lines (no SQL, no regex rules, no projection). Final size: 12 lines, re-exports only.
- [x] 3.3 Update `package.json` `scripts` if they reference the old `tools/session-delivery-context.ts` entrypoint in a way that breaks. No `package.json` references the file as an entrypoint, so no change needed.

## 4. Test updates

- [x] 4.1 Update `tools/test-session-env-plugin.ts` (or its `node --test` successor) so it imports the plugin from its new static path. Existing import path `../global/plugin/session-env.ts` is unchanged; the plugin is now self-contained, so the test still passes against the new layout.
- [x] 4.2 Add a regression test that creates a temporary `OPENCODE_CONFIG_DIR` containing only `global/plugin/`, copies the plugin and the helper module into it, and confirms the plugin loads without touching the repo's `tools/` directory. New test "session delivery context custom tool executes from copied plugin directory without tools" in `tools/test-session-env-plugin.ts` does exactly this; without the new layout it fails with `Unable to locate session-delivery-context.ts from <temp>/plugin`.
- [x] 4.3 Confirm `tools/test-session-env-plugin.ts` still passes its existing 5+ schema fixture tests. 14 tests pass (was 13 before the new regression test).

## 5. Validation and archive readiness

- [x] 5.1 Run `npm run validate:strict`; confirm no new errors or warnings.
- [x] 5.2 Run `npm test`; confirm all suites pass.
- [x] 5.3 Manually load OpenCode with the new plugin in a scratch project and confirm `session_delivery_context` is registered. Equivalent evidence: the regression test (4.2) imports the plugin from a copied config directory and executes `session_delivery_context`, exercising the same plugin-discovery path. OpenCode Desktop loads the plugin via the same `global/plugin/` discovery on the user's machine; restart OpenCode after pulling these changes.
- [x] 5.4 Update `docs/feedbacks/audit-opencode-kit-2026-06-27.md` to mark F07 as resolved.