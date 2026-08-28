import path from "node:path";

export const OPENCODE_WORKSTATION_PROTECTED_ROOT = String.raw`C:\ProgramData\OpenCodeWorkstation`;
export const OPENCODE_WORKSTATION_SERVER_TASK_NAME = "OpenCode Workstation Shared Server";
export const OPENCODE_WORKSTATION_TRAY_TASK_NAME = "OpenCode Workstation Tray";
export const OPENCODE_WORKSTATION_SERVER_CREDENTIAL_PATH = path.join(OPENCODE_WORKSTATION_PROTECTED_ROOT, "server-password");

export const OPENCODE_PROTECTED_ROOT_ACL = {
  display: ["SYSTEM:F", "BUILTIN\\Administrators:F", "BUILTIN\\Users:RX"],
  icacls: ["*S-1-5-18:(OI)(CI)F", "*S-1-5-32-544:(OI)(CI)F", "*S-1-5-32-545:(OI)(CI)RX"],
} as const;

export const OPENCODE_PROTECTED_CREDENTIAL_ACL = {
  display: ["SYSTEM:F", "BUILTIN\\Administrators:F"],
  icacls: ["*S-1-5-18:F", "*S-1-5-32-544:F"],
} as const;

export const OPENCODE_OWNER_LOGON_TASK_POLICY = {
  logonType: "Interactive",
  multipleInstances: "IgnoreNew",
  runLevel: "Highest",
  trigger: "AtLogon",
  executionTimeLimit: "PT0S",
} as const;

export function quoteWindowsArgument(value: string): string {
  if (value.length > 0 && !/[\s"]/u.test(value)) return value;
  let result = '"';
  let backslashes = 0;
  for (const character of value) {
    if (character === "\\") {
      backslashes += 1;
      continue;
    }
    if (character === '"') {
      result += "\\".repeat(backslashes * 2 + 1) + '"';
      backslashes = 0;
      continue;
    }
    result += "\\".repeat(backslashes) + character;
    backslashes = 0;
  }
  return result + "\\".repeat(backslashes * 2) + '"';
}
