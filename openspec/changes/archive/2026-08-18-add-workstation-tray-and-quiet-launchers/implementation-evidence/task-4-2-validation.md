# Task 4.2 Validation

Candidate: `54496C86A617819B1D233942DC5035C4821FD21EB0BF8DCD956017BD5B468582`

| Command | Result |
| --- | --- |
| `node --check tools/windows/opencode-workstation.ts` | exit 0 |
| installed `--help` | exit 0, lists `stop` |
| repository `preflight --config tools/windows/opencode-workstation.config.json` | exit 0, `status: collision` (current install) |
| installed `status` | exit 0, complete, healthy `1.18.18`, one listener |
| installed `rollback --dry-run` | exit 0, `eligible: true` |
| `npx openspec validate add-workstation-tray-and-quiet-launchers --strict` | exit 0 |
| `npm run openspec:validate` | 15 passed, 0 failed |
| `npm run validate:strict` | exit 0, warnings=0 |
| `npm test` | exit 0 |

Rollback: installed `rollback --dry-run` is eligible. Real rollback would stop the server, remove both tasks and six shortcuts, restore ordinary Alacritty from backup, and remove the protected root.

Known non-critical limitations:
- Dry-run does not yet record tray-task execute/arguments/trigger identity.
- AtLogon was proved via `Start-ScheduledTask` of the tray task, not a fresh Windows logoff/logon.
- `tray-command.json` is an internal proof hook for Restart/Exit handlers.

External operations: not performed.
