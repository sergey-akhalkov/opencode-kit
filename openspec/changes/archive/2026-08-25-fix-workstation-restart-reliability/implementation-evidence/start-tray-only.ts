import { spawnSync } from "node:child_process"

const listing = spawnSync("powershell.exe", [
  "-NoLogo",
  "-NoProfile",
  "-Command",
  "$ids = @(Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -and (($_.CommandLine -like '*tray.ps1*') -or ($_.CommandLine -like '*tray-host.vbs*')) } | ForEach-Object { [int]$_.ProcessId }); $task = Get-ScheduledTask -TaskName 'OpenCode Workstation Tray'; [ordered]@{ before = ($ids -join ','); state = $task.State.ToString() } | ConvertTo-Json -Compress",
], { encoding: "utf8", windowsHide: true, timeout: 30_000 })

const start = spawnSync("powershell.exe", [
  "-NoLogo",
  "-NoProfile",
  "-Command",
  "Start-ScheduledTask -TaskName 'OpenCode Workstation Tray' -ErrorAction Stop; Start-Sleep -Seconds 2; $ids = @(Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -and (($_.CommandLine -like '*tray.ps1*') -or ($_.CommandLine -like '*tray-host.vbs*')) } | ForEach-Object { [int]$_.ProcessId }); $task = Get-ScheduledTask -TaskName 'OpenCode Workstation Tray'; [ordered]@{ after = ($ids -join ','); state = $task.State.ToString(); startOk = $true } | ConvertTo-Json -Compress",
], { encoding: "utf8", windowsHide: true, timeout: 30_000 })

process.stdout.write(`${JSON.stringify({
  listStatus: listing.status,
  listStdout: (listing.stdout ?? "").trim(),
  listStderr: (listing.stderr ?? "").trim().slice(-400),
  startStatus: start.status,
  startStdout: (start.stdout ?? "").trim(),
  startStderr: (start.stderr ?? "").trim().slice(-400),
}, null, 2)}\n`)
if (start.status !== 0) process.exitCode = 1
