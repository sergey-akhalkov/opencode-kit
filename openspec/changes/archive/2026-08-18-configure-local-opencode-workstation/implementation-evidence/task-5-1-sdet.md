# Task 5.1 Fresh Material SDET Evidence

Date: 2026-08-17

## Attribution

- SDET session/task: `ses_fef323a3fffeTVyzzXjgqj91DM`
- SDET identity: `fresh-sdet-child-xai-grok-4.6-workstation-2026-08-17`
- Effective Model: `xai/grok-4.6`
- Inspected controller candidate: `1B607F16AF43C706249C20871AC57F6E7D5C38A75023CB8CFAA7FF5823CDA30B`
- Inspected configuration: `A80299795EC358DA1BB73610C2D3E8B1453B8A4AF265ED524B66E620DA7738A0`
- Terminal state: `critical-risks-reported`
- Test-only changed paths: none

## Critical Claim

`WS-CR-01`: credential-bearing health probes run before listener ownership validation.

The SDET observed that `healthProbe(password)` accepts any HTTP `200` payload with `healthy: true`; `start` can return `reused` on that response before the unverified-listener guard; `launch` performs the same probe before spawning attach; and the probe sends Basic Authorization containing the protected server password. When the real managed server is stopped and port `4096` is free, an unelevated local impostor could bind the port, mimic health, receive the credential, and later control the real elevated API. Task 4.3 used a non-HTTP collision listener and did not exercise this branch.

SDET confidence was medium because the frozen server could not be stopped within its read-only/no-host-mutation scope. It supplied a bounded main-session reproduction: positively stop only the managed tree, bind a disposable loopback responder returning `200 {"healthy":true}`, invoke installed Start/Launch, record only Authorization presence rather than the value, remove only the proof listener, and restore the managed server.

## Remaining Matrix Disposition Inputs

- `WS-H01`: live unauthenticated and wrong-password probes across six endpoint paths returned `401`; authenticated installed Status returned healthy `200`.
- `WS-H02`: protected root/controller/manifest expose Users RX only; credential ACL exposes only SYSTEM/Administrators Full. No forbidden write attempt was made.
- `WS-H03`: zero secret hits in repository, protected root excluding credential, Desktop shortcut bytes, Status output, or process argv. The impostor path remains the distinct critical disclosure claim.
- `WS-H04`: source and task 4.3 support fail-closed stale process/listener identity; no destructive rerun by SDET.
- `WS-H05`: current tree/listener matches final task 4.3 identities and zero protected-config clients remain; no fresh Restart by SDET.
- `WS-H06`: installed parser rejected unknown ID, surplus path, unknown mode, and surplus serve arguments with exit `1`; shortcuts contain fixed modes/IDs.
- `WS-H07`: source derives `--dir` from protected manifest after exact Git-root validation; task 4.3 proved all four actual paths.
- `WS-H08`: installed rollback dry-run was fully eligible; source fails closed on identity mismatch; task 4.3 proved complete rollback/reinstall.
- `WS-H09`: source has no bare OpenCode fallback when the server is missing; the impostor-health path remains `WS-CR-01`.
- `WS-H10`: invalid config cases fail before mutation; source/config and manifest hashes match; runtime launch uses protected manifest, not hot reload.

## Checks And Cleanup

The SDET re-read source/config hashes, installed Status, dry-run rollback, task/ACL/shortcut/process/listener facts, endpoint authentication, parser/config negatives, and secret surfaces. It made no production/config/task/shortcut/ACL/credential/server mutation, no provider/model product call, and no test edit. Temporary preflight fixtures were removed. It left one healthy server with the same six shortcuts and no probe client/listener.

Main must independently reproduce or disprove `WS-CR-01` before any production correction or lifecycle disposition. The other rows remain evidence inputs, not acceptance authority.
