import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = path.resolve(import.meta.dirname, "..");
const configDir = process.env.OPENCODE_CONFIG_DIR;
if (configDir == null || configDir.trim() === "") throw new Error("OPENCODE_CONFIG_DIR is unavailable");
const helper = path.join(configDir, "bin", "openspec-archive.ts");
const changeRoot = path.join(root, "openspec", "changes", "trajectory-current");

function files(current, base = current, rows = []) {
  for (const entry of fs.readdirSync(current, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name))) {
    const absolute = path.join(current, entry.name);
    if (entry.isDirectory()) files(absolute, base, rows);
    else if (entry.isFile()) rows.push({
      path: path.relative(base, absolute).replaceAll("\\", "/"),
      sha256: crypto.createHash("sha256").update(fs.readFileSync(absolute)).digest("hex"),
    });
  }
  return rows;
}

fs.writeFileSync(path.join(root, "archive-before.json"), `${JSON.stringify(files(changeRoot), null, 2)}\n`, "utf8");
const result = spawnSync(process.execPath, [
  helper,
  "--root", root,
  "--change", "trajectory-current",
  "--validation-not-applicable", "Disposable configured fixture is validated by scripts/check-result.ts after the session.",
], { cwd: root, encoding: "utf8", env: process.env, windowsHide: true });
fs.writeFileSync(path.join(root, "archive-command.json"), `${JSON.stringify({
  status: result.status,
  signal: result.signal,
  stderr: result.stderr,
  stdout: result.stdout,
}, null, 2)}\n`, "utf8");
if (result.status !== 0) throw new Error(`canonical archive failed (${String(result.status)}): ${result.stderr}`);
const parsed = JSON.parse(result.stdout);
fs.writeFileSync(path.join(root, "archive-result.json"), `${JSON.stringify(parsed, null, 2)}\n`, "utf8");
console.log(JSON.stringify(parsed));
