# Task 4.1 Fresh Material SDET Evidence

Date: 2026-08-18

## Attribution

- SDET identity: `fresh-sdet-child-xai-grok-4.6-tray-2026-08-18-54496c86`
- Effective Model: `xai/grok-4.6`
- Inspected Candidate Reference: `54496C86A617819B1D233942DC5035C4821FD21EB0BF8DCD956017BD5B468582`
- Current RC: `development`
- Terminal state: `no-critical-risk`
- Test-only changed paths: none

## Inspected Candidate

- Repository controller hash equals installed controller hash equals claimed candidate `54496C86A617819B1D233942DC5035C4821FD21EB0BF8DCD956017BD5B468582`.
- Installed path: `C:\ProgramData\OpenCodeWorkstation\opencode-workstation.ts`
- Manifest/state candidate field matches the same hash.
- Configuration hash remains `A80299795EC358DA1BB73610C2D3E8B1453B8A4AF265ED524B66E620DA7738A0`.

## Independent Live Observations

- Installed `--help` exits `0` and lists public `stop`.
- Installed `status` exits `0`: installed/complete; server task Highest, `triggerCount=0`, action `wscript //nologo ...\invoke.vbs serve`; tray task Highest, `triggerCount=1` AtLogon, action `wscript //nologo ...\tray-host.vbs`; health `200` / `healthy=true` / version `1.18.18`; one listener `127.0.0.1:4096` PID `25008` `opencode-serve`.
- Installed `rollback --dry-run` exits `0`, `eligible=true`, all recorded identity checks true.
- Tray lamp state file: `label=opencode-server`, `color=green`.
- Current managed tree alive and parent-linked: wscript `6400` → node serve `14844` → opencode serve `12164` → listener `25008`. Tray host wscript `24532` → pwsh `-File tray.ps1` `15284`. No password in those command lines.
- Owner Alacritty PIDs `12084` and `17232` left untouched and still alive.
- Six OneDrive Desktop shortcuts target `wscript.exe` + `invoke.vbs` with fixed `start` / `restart` / `launch --repository <id>` only.
- Protected Alacritty config contains `startup_mode = "Maximized"`.
- ACLs: protected root and derived scripts/state are Users `(OI)(CI)RX` + Administrators/SYSTEM Full; `server-password` is Administrators/SYSTEM Full only (no Users ACE). `tray-command.json` is absent.
- Unauthenticated and wrong-password probes to `/global/health`, `/session`, `/config`, `/global/event`, `/project`, `/` all returned `401`. Authenticated Status health remained `200`.
- Parser negatives exit `1` before mutation: unknown repository id; surplus launch path; surplus `stop` argument.
- Secret scan of protected-root files except the credential, repository workstation sources, Desktop `.lnk` bytes/args, Status/dry-run output, and process argv: zero password hits. Share-read of `server.stdout.log` (len 51), `server.stderr.log` (len 0), and `controller-errors.log` (len 9537): `secretHit=False`.
- Installed `tray.ps1` contains `tray-command.json` IPC but not `OPENCODE_SERVER_PASSWORD` or `server-password`.

## Challenged Critical Hypotheses (no incident)

| ID | Requirement | Scenario | Evidence | Result |
| --- | --- | --- | --- | --- |
| WS-TRAY-H01 | Authenticated elevated server | Unauthenticated or wrong-credential HTTP control | Live 401 on six paths; Status 200 after ownership-validated probe | not reached |
| WS-TRAY-H02 | Privileged runtime material protected | Unelevated mutation of controller/tray/invoker/credential/tray-command | icacls Users RX; credential no Users ACE; no probe file created | not reached |
| WS-TRAY-H03 | Credential never in shortcuts/task/tray argv/logs | Password disclosure on new quiet/tray surfaces | Secret scan zero hits; tray argv is `-File tray.ps1`; tasks/shortcuts have no secret | not reached |
| WS-TRAY-H04 | Restart/Exit/stop fail-closed | Stale identity or unmatched listener termination | `stop`/`restart` call `stopManagedServer` → `validateManagedRunningState` before `taskkill`; current live PIDs match state; bind of a substitute listener was forbidden this attempt | not reached on current identity; unmatched-listener not re-bound |
| WS-TRAY-H05 | Ownership-safe stop | Tray Exit/public stop kills unmatched listener | Tray Exit invokes controller `stop` only; parser rejects extra stop args | not reached |
| WS-TRAY-H06 | Arbitrary directory / wrong-dir attach | Unknown id, surplus path, or drifted git root | Parser rejects unknown id and surplus path; `launch` re-validates protected mapping + git toplevel before spawn | not reached |
| WS-TRAY-H07 | No implicit unprotected server | Project launcher or tray start creates a second/unauthenticated server | `launch` requires `waitForValidatedManagedHealth`; `serve` refuses if port owned; one loopback listener only | not reached |
| WS-TRAY-H08 | Rollback does not destroy unrelated config | Eligible dry-run vs drifted ordinary Alacritty | Dry-run eligible; ordinary and protected Alacritty hashes match recorded identities | not reached |
| WS-TRAY-H09 | Tray does not receive the password | Tray host/helper argv or script embeds credential | Live tray command line and `tray.ps1` tokens have no password | not reached |
| WS-TRAY-H10 | Orphaned elevated descendants | Current serve tree or stop `/T` leaves extra listener | Live tree 6400→14844→12164→25008; single `127.0.0.1:4096` listener | not observed |

Source paths supporting fail-closed ownership-before-credential and stop identity: `validatedManagedHealth` `tools/windows/opencode-workstation.ts:888-892`; `validateManagedRunningState` `:1467-1499`; `stopManagedServer` `:1510-1542`; `stop` `:1544-1556`; `launch` `:1047-1112`; `parseInvocation` `:1832-1864`.

## Cleanup

- No managed server stop/restart was performed.
- One healthy managed server and the tray host remain running (green).
- No extra proof Alacritty window was created.
- Owner Alacritty `12084` and `17232` remain.
- Temporary inspect helpers `sdet-liveness.ps1` and `sdet-unelevated-acl.ps1` are removed after this report.
- No `sdet-acl-probe.txt` or `tray-command.json` remains under the protected root.

```markdown
<SDET_QUALITY_REPORT>
Action: no-critical-risk
SDET Identity: fresh-sdet-child-xai-grok-4.6-tray-2026-08-18-54496c86
Candidate Reference: 54496C86A617819B1D233942DC5035C4821FD21EB0BF8DCD956017BD5B468582
Current RC: development
Effective Model: xai/grok-4.6

**Critical Risk Matrix**
- none

**Test Changes**
- none

**Execution Request**
- none

**Evidence Gaps And Residual Risks**
- No live substitute listener was bound on 4096 (forbidden this attempt); unmatched-listener fail-closed is source-backed to the same `validateManagedRunningState` path, not re-exercised by binding.
- Limited-token `runas /trustlevel:0x20000` write probe did not execute (exit 1, no output). Unelevated-denial evidence is the live ACL (Users RX; credential Admins/SYSTEM only), not a completed restricted-token write.
- Supplied production Runtime Proof was a host-proof summary; this attempt independently re-observed the installed Status/dry-run/auth/secret/process boundary.
- `rollback --dry-run` does not record tray-task identity. Unregister is by reserved task name. Not classified as a reachable critical incident.
</SDET_QUALITY_REPORT>
```
