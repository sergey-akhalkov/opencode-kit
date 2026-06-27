## 1. Move module under plugin directory

- [ ] 1.1 Create `global/plugin/session-delivery-context/` directory.
- [ ] 1.2 Move `tools/delivery-context/db.ts` (or, if CHG-001 has not landed, the equivalent SQLite query helpers from `tools/session-delivery-context.ts`) into `global/plugin/session-delivery-context/db.ts`.
- [ ] 1.3 Move `requirements.ts` into `global/plugin/session-delivery-context/requirements.ts`.
- [ ] 1.4 Move `redaction.ts` into `global/plugin/session-delivery-context/redaction.ts`.
- [ ] 1.5 Move `projection.ts` into `global/plugin/session-delivery-context/projection.ts`.
- [ ] 1.6 Create `global/plugin/session-delivery-context/index.ts` that re-exports `readSessionDeliveryContext` and the public types.
- [ ] 1.7 Update internal `import` paths inside the moved files so they resolve within the new directory.

## 2. Plugin static import

- [ ] 2.1 Replace `loadSessionDeliveryContextModule` in `global/plugin/session-env.ts` with `import { readSessionDeliveryContext } from "./session-delivery-context/index.ts";`.
- [ ] 2.2 Remove the candidate-path loop and the throw-on-not-found error path.
- [ ] 2.3 Confirm `deliveryContextMetadata` and the tool registration still produce identical output.

## 3. CLI shim

- [ ] 3.1 Rewrite `tools/session-delivery-context.ts` as a CLI shim that imports from `../global/plugin/session-delivery-context/index.ts`.
- [ ] 3.2 Keep the shim under 100 lines (no SQL, no regex rules, no projection).
- [ ] 3.3 Update `package.json` `scripts` if they reference the old `tools/session-delivery-context.ts` entrypoint in a way that breaks.

## 4. Test updates

- [ ] 4.1 Update `tools/test-session-env-plugin.ts` (or its `node --test` successor) so it imports the plugin from its new static path.
- [ ] 4.2 Add a regression test that creates a temporary `OPENCODE_CONFIG_DIR` containing only `global/plugin/`, copies the plugin and the helper module into it, and confirms the plugin loads without touching the repo's `tools/` directory.
- [ ] 4.3 Confirm `tools/test-session-env-plugin.ts` still passes its existing 5+ schema fixture tests.

## 5. Validation and archive readiness

- [ ] 5.1 Run `npm run validate:strict`; confirm no new errors or warnings.
- [ ] 5.2 Run `npm test`; confirm all suites pass.
- [ ] 5.3 Manually load OpenCode with the new plugin in a scratch project and confirm `session_delivery_context` is registered.
- [ ] 5.4 Update `docs/feedbacks/audit-opencode-kit-2026-06-27.md` to mark F07 as resolved.