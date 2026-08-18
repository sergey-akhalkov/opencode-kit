# Task 4.4 Concurrent Client Evidence

Date: 2026-08-18

## Owner Observation

The owner reported that Desktop Start and `pmac-emulator` succeeded, but the next `opencode-kit` shortcut showed an error and required a manual OpenCode launch. Prior proof had launched and closed one client at a time, so it did not establish simultaneous clients. The installed controller also wrote protected error diagnostics only for `serve`; the exact earlier launcher cause was therefore unavailable.

## Current Readback

- Repository, installed controller, manifest candidate, and state candidate all matched `9E21B5C4D3555BF75A397E96B6112CF5DBB0D2EAE167DBC37330444CF46E97D0`.
- Server state was `running` with supervisor/root/listener PIDs `22192` / `11868` / `16008`, one listener, four mappings, and six shortcuts.
- Owner `pmac-emulator` tree remained active: Alacritty `13088`, PowerShell `14392`, OpenCode shim/client `6600` / `23188`, exact `attach ... --dir D:\mekha\mtronics\pmac-emulator`.
- Owner manual tree remained active: ordinary Alacritty `8520`, PowerShell `15604`, OpenCode `20556` / `7884` started as `opencode -c`.
- No prior `controller-errors.log` existed because the old candidate logged only `serve` failures.

## Concurrent Actual Shortcut Proof

With both owner trees preserved, the actual `C:\Users\noilw\OneDrive\Desktop\OpenCode - opencode-kit.lnk` created a new protected-config Alacritty root PID `3544` and exact kit attach PIDs `25112` / `2316`.

During simultaneous operation:

- existing pmac root PID `13088` and attach PID `23188` remained alive;
- the owner manual kit root PID `8520` remained alive;
- the new client used `attach http://127.0.0.1:4096 --dir D:\home\sergey-akhalkov\opencode-kit`;
- listener count remained one and PID remained `16008`;
- no second serve process appeared.

Cleanup terminated only new proof root PID `3544` and its descendants. The entire proof tree disappeared; owner pmac/manual trees remained alive; all three managed server PIDs and the one listener remained unchanged.

## Correction And Remaining Gate

- Spec/design/tasks now require concurrent client proof rather than sequential substitution.
- Repository controller now appends every operation error to protected `logs\controller-errors.log`, preserving operation/type/message/cause/stack without a credential value.
- A safe unknown-repository negative produced the expected protected JSON log entry, proving non-serve launcher diagnostics persist.

## Confirmed Cause And Final Proof

The first final-candidate concurrent attempt reproduced the owner report. Fresh proof `pmac-emulator` attached, but immediate actual `opencode-kit.lnk` created no Alacritty root. Protected diagnostics recorded `Shared OpenCode server is unavailable; run the Start shortcut first.` Installed Status immediately afterward reported complete integrity and healthy OpenCode `1.18.18` on the same server/listener. Root cause was a single two-second health request during first-client initialization, not wrong mapping, a second server, or lost process identity.

Candidate `14CD0165B87729EB6D7152E6B846D7973DF64A24369693DA61C85ADF51DAB724` adds at most 15 seconds of retry only for temporary health unavailability. Every retry obtains a fresh task/process/listener ownership validation; HTTP `401`/`403` returns immediately and no ownership failure is retried.

The exact no-delay actual shortcut sequence then passed:

- proof pmac Alacritty PID `16260`, attach PIDs `8320` / `7968`;
- proof kit Alacritty PID `9704`, attach PIDs `18284` / `8648`;
- both roots alive concurrently with exact distinct mappings;
- one managed server tree (shim/listener processes) and one listener PID `20932` throughout;
- owner pmac PID `13088` and manual kit PID `8520` preserved;
- kit cleanup removed only the kit tree and left proof pmac attached;
- final cleanup removed only proof pmac; owner windows and all server PIDs remained unchanged.

Task 4.4 is complete for candidate `14CD0165B87729EB6D7152E6B846D7973DF64A24369693DA61C85ADF51DAB724`.
