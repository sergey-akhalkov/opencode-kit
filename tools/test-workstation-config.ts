#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  WORKSTATION_EXAMPLE_CONFIG_NAME,
  WORKSTATION_LOCAL_CONFIG_NAME,
  replaceWorkstationLocalConfig,
  resolveWorkstationConfigurationPath,
  workstationConfigPaths,
} from "./windows/opencode-workstation-config.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const windowsDir = path.join(root, "tools", "windows");
const examplePath = path.join(windowsDir, WORKSTATION_EXAMPLE_CONFIG_NAME);
const controller = path.join(windowsDir, "opencode-workstation.ts");
const absolutePathPattern = /(?:[A-Za-z]:\\|\/(?:Users|home|home)\/|\\\\)/;

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "oc-workstation-config-"));
}

const tests = [
  {
    name: "tracked example is schema-shaped and has no absolute maintainer path",
    run: () => {
      const text = fs.readFileSync(examplePath, "utf8");
      const parsed = JSON.parse(text) as {
        schemaVersion: number;
        repositories: Record<string, string>;
        graphify: { python: string; graph: string; port: number };
      };
      assert(parsed.schemaVersion === 2, "Example must use schema version 2.");
      assert(Object.keys(parsed.repositories).sort().join(",") === "controller-gateway-service,opencode-kit,pmac-emulator,windows-ui-automation", "Example must name the four repository ids.");
      assert(parsed.graphify.port === 4097, "Example must keep the fixed Graphify port.");
      assert(!absolutePathPattern.test(text), "Tracked example must not contain an absolute user or repository path.");
      assert(!text.includes("mekha"), "Tracked example must not contain a maintainer repository root token.");
      assert(!text.includes("noilw"), "Tracked example must not contain a maintainer user token.");
    },
  },
  {
    name: "gitignore lists the machine-local workstation config",
    run: () => {
      const ignore = fs.readFileSync(path.join(root, ".gitignore"), "utf8");
      assert(
        ignore.includes("tools/windows/opencode-workstation.config.json") || ignore.includes("/tools/windows/opencode-workstation.config.json"),
        ".gitignore must ignore the concrete workstation config.",
      );
      assert(!ignore.includes(WORKSTATION_EXAMPLE_CONFIG_NAME), "The tracked example must not be gitignored.");
    },
  },
  {
    name: "absent local config fails before any host mutation and names example plus local path",
    run: () => {
      const dir = makeTempDir();
      try {
        const paths = workstationConfigPaths(dir);
        fs.writeFileSync(paths.example, fs.readFileSync(examplePath));
        let thrown: unknown;
        try {
          resolveWorkstationConfigurationPath({ sourceDirectory: dir });
        } catch (error) {
          thrown = error;
        }
        assert(thrown instanceof Error, "Absent local config must fail.");
        const message = thrown instanceof Error ? thrown.message : "";
        assert(message.includes(paths.local), "Diagnostic must name the expected local path.");
        assert(message.includes(paths.example), "Diagnostic must name the tracked example.");
        assert(message.includes("Copy the tracked example"), "Preflight must explain how to create the ignored local config.");
        assert(!fs.existsSync(path.join(dir, "elevated")), "Absent config must not create host-mutation markers.");
      } finally {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    },
  },
  {
    name: "invalid local config fails before elevation",
    run: () => {
      const dir = makeTempDir();
      try {
        const paths = workstationConfigPaths(dir);
        fs.writeFileSync(paths.local, "{ not json\n");
        const resolved = resolveWorkstationConfigurationPath({ sourceDirectory: dir });
        assert(resolved.path === paths.local, "Invalid local file is still the selected path.");
        const result = spawnSync(process.execPath, [controller, "preflight", "--config", paths.local], {
          cwd: root,
          encoding: "utf8",
        });
        assert((result.status ?? 0) !== 0, "Invalid local config must fail preflight.");
        const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
        assert(/invalid|JSON|Failed to read/i.test(output), `Invalid config must be diagnosed.\n${output}`);
        assert(!/delegated-to-elevated|setx|schtasks/i.test(output), "Invalid config must fail before elevation or host mutation.");
      } finally {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    },
  },
  {
    name: "tracked example is refused as the live config",
    run: () => {
      let thrown: unknown;
      try {
        resolveWorkstationConfigurationPath({
          explicitPath: examplePath,
          sourceDirectory: windowsDir,
        });
      } catch (error) {
        thrown = error;
      }
      assert(thrown instanceof Error && thrown.message.includes("Refusing the tracked example"), "Example must not be selected as live config.");
    },
  },
  {
    name: "failed local replacement restores prior bytes and removes the temp file",
    run: () => {
      const dir = makeTempDir();
      try {
        const local = path.join(dir, WORKSTATION_LOCAL_CONFIG_NAME);
        const previous = Buffer.from('{"keep":"original"}\n');
        fs.writeFileSync(local, previous);
        let thrown: unknown;
        try {
          replaceWorkstationLocalConfig(local, Buffer.from('{"keep":"next"}\n'), {
            renameSync() {
              throw new Error("injected atomic replacement failure");
            },
          });
        } catch (error) {
          thrown = error;
        }
        assert(thrown instanceof Error && thrown.message.includes("injected atomic replacement failure"), "Injected failure must surface.");
        assert(fs.readFileSync(local).equals(previous), "Rollback must restore the prior local bytes.");
        const leftovers = fs.readdirSync(dir).filter((name) => name.includes(".tmp"));
        assert(leftovers.length === 0, `Temporary replacement artifacts must be removed: ${leftovers.join(", ")}`);
      } finally {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    },
  },
  {
    name: "missing --config path fails closed through the real preflight entrypoint",
    run: () => {
      const missing = path.join(makeTempDir(), "absent-workstation.config.json");
      const result = spawnSync(process.execPath, [controller, "preflight", "--config", missing], {
        cwd: root,
        encoding: "utf8",
      });
      assert((result.status ?? 0) !== 0, "Missing explicit config must fail preflight.");
      const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
      assert(output.includes(WORKSTATION_EXAMPLE_CONFIG_NAME), "CLI must name the tracked example.");
      assert(output.includes(WORKSTATION_LOCAL_CONFIG_NAME), "CLI must name the local config.");
      assert(!/delegated-to-elevated|setx/i.test(output), "Missing config must fail before elevation.");
      fs.rmSync(path.dirname(missing), { recursive: true, force: true });
    },
  },
];

let failed = 0;
for (const test of tests) {
  try {
    test.run();
    console.log(`PASS ${test.name}`);
  } catch (error) {
    failed += 1;
    console.error(`FAIL ${test.name}`);
    console.error(error instanceof Error ? error.message : String(error));
  }
}

if (failed > 0) {
  process.exit(1);
}

console.log(`OK: workstation config tests=${tests.length}`);
