import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = path.resolve(import.meta.dirname, "..");
const configDir = process.env.OPENCODE_CONFIG_DIR;
if (configDir == null || configDir.trim() === "") throw new Error("OPENCODE_CONFIG_DIR is unavailable");
const archive = JSON.parse(fs.readFileSync(path.join(root, "archive-result.json"), "utf8"));
const helper = path.join(configDir, "bin", "delivery-trajectory-context.ts");
const result = spawnSync(process.execPath, [
  helper,
  "--root", root,
  "--horizon", "phase-fixture",
  "--archive", archive.archivedAs,
  "--format", "json",
], { cwd: root, encoding: "utf8", env: process.env, windowsHide: true });
if (result.status !== 0) throw new Error(`trajectory context failed (${String(result.status)}): ${result.stderr}`);
const parsed = JSON.parse(result.stdout);
fs.writeFileSync(path.join(root, "trajectory-context.json"), `${JSON.stringify(parsed, null, 2)}\n`, "utf8");
console.log(JSON.stringify(parsed));
