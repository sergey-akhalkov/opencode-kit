# Strategy History

## 2026-08-18 - Visible server console as the only presence

- **Objective:** Give Start at most one server window and hide launcher consoles.
- **Approach:** Keep the Interactive `node serve` console visible and tee OpenCode output into it; hide only shortcut/elevate consoles.
- **Evidence:** Owner later asked for a minimized window or tray lamp, then autostart at Windows logon, then tray-only with Restart/Exit.
- **Outcome:** Superseded. A visible or minimized console at every logon is the opposite of the accepted presence.
- **Reason:** Autostart plus a console fights the quiet-desktop goal; a `serve()` child tray cannot stay red after `taskkill /T` on the supervisor.
- **Do-not-repeat condition:** Do not use a visible or minimized serve console as the liveness indicator.
- **Evidence-based retry condition:** Owner explicitly asks to restore a server console in addition to the tray.

## 2026-08-18 - Tray as a child of serve()

- **Objective:** Smallest tray lamp without a second task.
- **Approach:** After healthy, `serve()` spawns a hidden WinForms NotifyIcon helper.
- **Evidence:** `stopManagedServer()` kills the supervisor tree with `taskkill /T`. Owner requires red after Exit.
- **Outcome:** Rejected for this increment.
- **Reason:** The lamp would die with the server, so red-when-stopped is impossible.
- **Do-not-repeat condition:** Do not parent the tray helper under the serve supervisor if Exit must leave a red lamp.
- **Evidence-based retry condition:** Exit is redefined to keep the supervisor alive, or red-after-stop is dropped.

## 2026-08-18 - Repair rewrote ordinary Alacritty onto one line

- **Objective:** Apply protected maximize during stopped repair.
- **Approach:** Reuse `installAlacrittyConfiguration` / `managedAlacrittyContents` on the existing ordinary file.
- **Evidence:** Ordinary `alacritty.toml` became `[terminal]shell = ...` on one line; Alacritty showed a TOML parse error. Backup still had the valid two-line file. `\s*` in the shell matcher consumed the newline after `[terminal]`.
- **Outcome:** Restored ordinary config from backup. Matcher now uses `[ \t]*` only. Repair no longer rewrites ordinary config when it already exists.
- **Reason:** CRLF section rewrite ate the required newline.
- **Do-not-repeat condition:** Do not let `\s*` consume newlines when replacing a key inside a TOML section.
- **Evidence-based retry condition:** A new ordinary-config migration requires a newline-preserving rewrite with a parse proof.

## 2026-08-18 - Tray Restart blocked the UI thread

- **Objective:** Show red/blinking during Restart and close the tray on Exit.
- **Approach:** First tray Restart called `restart` with `Start-Process -Wait` on the WinForms click thread and `$ErrorActionPreference = 'Stop'`.
- **Evidence:** Icon stayed green during replacement; a PowerShell error dialog could appear if restart failed; Exit left a red lamp instead of closing the host.
- **Outcome:** Restart/Exit are async. Restart writes `restarting` and blinks red/amber, then steady green. Exit stops the server and disposes the tray.
- **Reason:** `-Wait` froze painting; Exit semantics changed by owner request.
- **Do-not-repeat condition:** Do not call controller start/stop/restart with `-Wait` on the tray UI thread.
- **Evidence-based retry condition:** A different STA host proves that `-Wait` still paints the NotifyIcon.

## 2026-08-18 - Tray host VBS lost quotes around pwsh

- **Objective:** Launch hidden `pwsh -File tray.ps1` from wscript.
- **Approach:** Concatenate the Store pwsh path into `WScript.Shell.Run` without extra quotes in the runtime command string.
- **Evidence:** Visible "Windows Script Host" dialog; path split on `C:\Program Files`.
- **Outcome:** Wrap executable and `-File` path with `Chr(34)` in the Run command value.
- **Reason:** `Program Files` must stay one token.
- **Do-not-repeat condition:** Do not pass an unquoted path with spaces to `WScript.Shell.Run`.
- **Evidence-based retry condition:** A different launcher is used that does not parse unquoted paths.

