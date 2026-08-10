# Proof Tool Inventory

Reusable production proof runners, capture/evaluator utilities, and cleanup helpers live here. Temporary directories may hold disposable server state and raw evidence bundles, but not the only source copy of a proof tool.

| Tool | Boundary and inputs | Modes and exact invocation | Authorization / external effects | Evidence and cleanup | Known limits |
|---|---|---|---|---|---|
| `session-completion-guard-retry.ts` | OpenCode SDK hidden-agent route and same-child bounded retry transport. Inputs: running local server URL, directory, optional agent name. | `preflight`: `npm run proof:guard-retry -- --mode preflight --server-url http://127.0.0.1:<port>`<br>`live`: `npm run proof:guard-retry -- --mode live --server-url http://127.0.0.1:<port>` | `preflight`: local disposable sessions only. `live`: two configured provider calls and therefore requires the recorded live-attempt/provider gate. | Emits one privacy-safe JSON result. Both modes delete root/child sessions in `finally`; cleanup failure is terminal. Preserve command, server identity/log, exit status, stdout, and stderr as the raw bundle. | Caller owns server startup/shutdown. `live` proves transport/schema behavior, not the complete root idle lifecycle. |
| `session-completion-guard-question.ts` | Production parser and controller question-verdict path. Input: one privacy-safe structured owner-boundary fixture matching the observed wire shape. | `bun tools/proofs/session-completion-guard-question.ts` | Offline only; no provider, server, credential, root prompt, or question-reject effect. | Emits final guard/question state and side-effect counts. Uses in-memory SDK adapters and performs no persistent writes. | Proves parser/application behavior; configured hidden-agent generation remains a separate transport lane. |
| `lib/opencode-proof-client.ts` | Shared OpenCode proof client API. Inputs: SDK client, directory, agent route, session title. | Import `proofClient`, `waitForProofRoute`, `disabledToolMap`, `createRoutedProofSessions`, `requestData`, and `deleteProofSessions`. | No effects until a caller invokes an SDK operation; session helpers create/delete local OpenCode state. | Returns typed route/session facts and preserves SDK errors as causes; cleanup is child then root. | Deliberately does not start servers, select authorization, call models, or evaluate scenario-specific output. |

## Operating Rules

- Run `preflight` before `live` and preserve its JSON route evidence.
- A live-attempt gate, provider authorization, and evidence/cleanup plan remain mandatory; this inventory does not grant authority.
- Output is privacy-safe and structural. Raw provider text and completion evidence are not printed.
- Add every new proof runner or shared proof library to this table with its boundary, modes, effects, cleanup, and exact invocation.
