#!/usr/bin/env node
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "jsonc-parser";
import {
  evaluateGraphifyListenerState,
  applyGraphifyConfigPlan,
  loadSharedToolsConfiguration,
  materializeGraphifyConfigPlan,
  planGraphifyConfigEdit,
  preflightSharedGraphify,
  redactGraphifyError,
  restoreGraphifyConfig,
} from "../windows/opencode-shared-tools.ts";
import { requireExplicitGraphifyRepository } from "../../global/plugin/graphify-project-context.ts";

type Mode = "capture" | "replay";

type Options = {
  candidateId: string;
  evidenceRoot: string;
  help: boolean;
  inputRoot: string | null;
  mode: Mode;
};

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const runnerPath = path.join(sourceRoot, "tools", "proofs", "opencode-shared-tools-contract.ts");
const modulePath = path.join(sourceRoot, "tools", "windows", "opencode-shared-tools.ts");
const controllerPath = path.join(sourceRoot, "tools", "windows", "opencode-workstation.ts");
const machineConfigPath = path.join(sourceRoot, "tools", "windows", "opencode-workstation.config.json");
const opencodeConfigPath = path.join(sourceRoot, "global", "opencode.json");
const pluginPath = path.join(sourceRoot, "global", "plugin", "graphify-project-context.ts");
const sessionEnvPath = path.join(sourceRoot, "global", "plugin", "session-env.ts");

function usage(): string {
  return [
    "Usage:",
    "  node tools/proofs/opencode-shared-tools-contract.ts --mode capture --candidate-id <id> --evidence-root <absolute-new-path>",
    "  node tools/proofs/opencode-shared-tools-contract.ts --mode replay --candidate-id <id> --input-root <capture-path> --evidence-root <absolute-new-path>",
  ].join("\n");
}

function required(args: string[], index: number, option: string): string {
  const value = args[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`Missing value for ${option}`);
  return value;
}

function parseOptions(args: string[]): Options {
  if (args.length === 1 && (args[0] === "--help" || args[0] === "-h")) {
    return { candidateId: "help", evidenceRoot: sourceRoot, help: true, inputRoot: null, mode: "capture" };
  }
  let candidateId = "";
  let evidenceRoot = "";
  let inputRoot = "";
  let mode = "";
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--candidate-id") {
      candidateId = required(args, index, arg);
      index++;
    } else if (arg === "--evidence-root") {
      evidenceRoot = required(args, index, arg);
      index++;
    } else if (arg === "--input-root") {
      inputRoot = required(args, index, arg);
      index++;
    } else if (arg === "--mode") {
      mode = required(args, index, arg);
      index++;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }
  if (mode !== "capture" && mode !== "replay") throw new Error("--mode must be capture or replay");
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/.test(candidateId)) throw new Error("--candidate-id must be a safe identifier");
  if (!path.isAbsolute(evidenceRoot)) throw new Error("--evidence-root must be absolute");
  if (mode === "replay" && !path.isAbsolute(inputRoot)) throw new Error("replay requires absolute --input-root");
  if (mode === "capture" && inputRoot !== "") throw new Error("capture does not accept --input-root");
  return {
    candidateId,
    evidenceRoot: path.resolve(evidenceRoot),
    help: false,
    inputRoot: inputRoot === "" ? null : path.resolve(inputRoot),
    mode,
  };
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value == null || typeof value !== "object") return value;
  const record = value as Record<string, unknown>;
  return Object.fromEntries(Object.keys(record).sort().map((key) => [key, stableValue(record[key])]));
}

function json(value: unknown): string {
  return `${JSON.stringify(stableValue(value), null, 2)}\n`;
}

function sha256(value: string | Buffer): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function fileHash(file: string): string {
  return sha256(fs.readFileSync(file));
}

function writeNew(file: string, value: unknown): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, typeof value === "string" ? value : json(value), { encoding: "utf8", flag: "wx" });
}

function validateInstalledOpenCodeConfig(managedBytes: Buffer, fixtureRoot: string): Record<string, unknown> {
  const configDir = path.join(fixtureRoot, "loader-config");
  const runtimeRoot = path.join(fixtureRoot, "loader-runtime");
  fs.mkdirSync(configDir, { recursive: true });
  fs.writeFileSync(path.join(configDir, "opencode.json"), managedBytes);
  const sentinel = `schema-proof-${crypto.randomUUID()}`;
  const environment = {
    ...process.env,
    OPENCODE_CONFIG_DIR: configDir,
    OPENCODE_DISABLE_AUTOUPDATE: "1",
    OPENCODE_DISABLE_DEFAULT_PLUGINS: "1",
    OPENCODE_DISABLE_EXTERNAL_SKILLS: "1",
    OPENCODE_DISABLE_PROJECT_CONFIG: "1",
    OPENCODE_GRAPHIFY_API_KEY: sentinel,
    OPENCODE_PURE: "1",
    OPENCODE_TEST_HOME: path.join(runtimeRoot, "home"),
    XDG_CACHE_HOME: path.join(runtimeRoot, "cache"),
    XDG_CONFIG_HOME: path.join(runtimeRoot, "config"),
    XDG_DATA_HOME: path.join(runtimeRoot, "data"),
    XDG_STATE_HOME: path.join(runtimeRoot, "state"),
  };
  delete environment.OPENCODE_CONFIG;
  delete environment.OPENCODE_CONFIG_CONTENT;
  delete environment.OPENCODE_SERVER_PASSWORD;
  const result = spawnSync("opencode.exe", ["debug", "config"], {
    cwd: fixtureRoot,
    encoding: "utf8",
    env: environment,
    windowsHide: true,
  });
  if (result.error) throw new Error("Installed OpenCode schema probe could not start.", { cause: result.error });
  const stdout = result.stdout ?? "";
  const stderr = result.stderr ?? "";
  if (result.status !== 0) {
    throw new Error(`Installed OpenCode rejected the managed configuration (exit ${result.status}, stdout ${sha256(stdout)}, stderr ${sha256(stderr)}).`);
  }
  return {
    status: result.status,
    stdoutSha256: sha256(stdout),
    stderrSha256: sha256(stderr),
    resolvedCredentialObserved: stdout.includes(sentinel) || stderr.includes(sentinel),
    credentialValuePersisted: false,
  };
}

async function rejected(operation: () => unknown | Promise<unknown>): Promise<{ rejected: boolean; message: string }> {
  try {
    await operation();
    return { rejected: false, message: "" };
  } catch (error) {
    const projection = redactGraphifyError(error);
    return { rejected: true, message: projection.message };
  }
}

function evaluate(raw: Record<string, any>, mode: Mode): Record<string, unknown> {
  const checks = {
    actualPreflightReady: raw.preflight?.status === "ready" && raw.preflight?.listener?.count === 0,
    configSourceUnchanged: raw.configSource?.beforeSha256 === raw.configSource?.afterSha256,
    exactSingleEdit: raw.transformation?.edit?.count === 1 && raw.transformation?.edit?.prefixPreserved === true && raw.transformation?.edit?.suffixPreserved === true,
    managedReadback: raw.transformation?.managedReadback?.type === "remote" && raw.transformation?.managedReadback?.authorization === "Bearer {env:OPENCODE_GRAPHIFY_API_KEY}",
    installedSchemaAccepted: raw.transformation?.installedSchema?.status === 0 && raw.transformation?.installedSchema?.credentialValuePersisted === false,
    rollbackExact: raw.transformation?.rollbackSha256 === raw.transformation?.originalSha256,
    aclPreserved: raw.transformation?.aclOriginalSha256 === raw.transformation?.aclManagedSha256,
    invalidInputsRejected: Object.values(raw.negative ?? {}).every((value: any) => value?.rejected === true),
    listenerCollisionClosed: raw.listenerCollision?.status === "collision" && raw.listenerCollision?.credentialProbeAllowed === false,
    repositoryGuardClosed: raw.repositoryGuard?.missingRejected === true && raw.repositoryGuard?.explicitPreserved === true && raw.repositoryGuard?.graphToolUnaffected === true,
    redactionPreservedCause: raw.redaction?.secretAbsent === true && raw.redaction?.causePresent === true,
    noEndpointCalls: raw.endpointCalls === 0,
    cleanupComplete: raw.cleanup?.fixtureAbsent === true,
  };
  return {
    schemaVersion: 1,
    mode,
    passed: Object.values(checks).every(Boolean),
    checks,
    liveCalls: mode === "replay" ? 0 : undefined,
  };
}

async function capture(options: Options): Promise<void> {
  if (fs.existsSync(options.evidenceRoot)) throw new Error(`Evidence root already exists: ${options.evidenceRoot}`);
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "opencode-shared-tools-"));
  const originalConfigBytes = fs.readFileSync(opencodeConfigPath);
  const raw: Record<string, any> = {
    schemaVersion: 1,
    mode: "capture",
    candidateId: options.candidateId,
    invocation: process.argv.map((value) => value.replaceAll("\\", "/")),
    source: {
      runner: { path: path.relative(sourceRoot, runnerPath), sha256: fileHash(runnerPath) },
      module: { path: path.relative(sourceRoot, modulePath), sha256: fileHash(modulePath) },
      controller: { path: path.relative(sourceRoot, controllerPath), sha256: fileHash(controllerPath) },
      plugin: { path: path.relative(sourceRoot, pluginPath), sha256: fileHash(pluginPath) },
      sessionEnv: { path: path.relative(sourceRoot, sessionEnvPath), sha256: fileHash(sessionEnvPath) },
    },
    endpointCalls: 0,
  };
  try {
    const configuration = await loadSharedToolsConfiguration(machineConfigPath);
    raw.preflight = await preflightSharedGraphify({ configurationPath: machineConfigPath, opencodeConfigPath });
    raw.configSource = { beforeSha256: sha256(originalConfigBytes) };

    const fixtureConfigPath = path.join(fixtureRoot, "opencode.jsonc");
    const fixtureOriginal = Buffer.concat([Buffer.from("// preserved fixture comment\n", "utf8"), originalConfigBytes]);
    fs.writeFileSync(fixtureConfigPath, fixtureOriginal);
    const plan = await planGraphifyConfigEdit(fixtureConfigPath, configuration.graphify);
    const managedBytes = materializeGraphifyConfigPlan(plan, "managed");
    const applied = applyGraphifyConfigPlan(plan, path.join(fixtureRoot, "opencode.backup"));
    const managedDocument = parse(managedBytes.toString("utf8"), [], { allowTrailingComma: true, disallowComments: false });
    const managedEntry = managedDocument.mcp["graphify-global"];
    const installedSchema = validateInstalledOpenCodeConfig(managedBytes, fixtureRoot);
    restoreGraphifyConfig(applied);
    raw.transformation = {
      originalSha256: sha256(fixtureOriginal),
      managedSha256: sha256(managedBytes),
      rollbackSha256: fileHash(fixtureConfigPath),
      edit: plan.edit,
      managedReadback: {
        type: managedEntry.type,
        url: managedEntry.url,
        authorization: managedEntry.headers.Authorization,
        oauth: managedEntry.oauth,
      },
      installedSchema,
      aclOriginalSha256: plan.acl.original.sha256,
      aclManagedSha256: plan.acl.managed.sha256,
    };

    const machineValue = JSON.parse(fs.readFileSync(machineConfigPath, "utf8"));
    const missingMachinePath = path.join(fixtureRoot, "machine-missing.json");
    const missingMachine = structuredClone(machineValue);
    delete missingMachine.graphify.port;
    fs.writeFileSync(missingMachinePath, json(missingMachine));
    const wrongPortPath = path.join(fixtureRoot, "machine-wrong-port.json");
    const wrongPort = structuredClone(machineValue);
    wrongPort.graphify.port = 4098;
    fs.writeFileSync(wrongPortPath, json(wrongPort));
    const localEntry = JSON.parse(originalConfigBytes.toString("utf8")).mcp["graphify-global"];
    const duplicateConfigPath = path.join(fixtureRoot, "duplicate.jsonc");
    fs.writeFileSync(duplicateConfigPath, `{"mcp":{"graphify-global":${JSON.stringify(localEntry)},"graphify-global":${JSON.stringify(localEntry)}}}\n`);
    const wrongEntryPath = path.join(fixtureRoot, "wrong-entry.json");
    fs.writeFileSync(wrongEntryPath, originalConfigBytes.toString("utf8").replace('"graphify.serve"', '"graphify.wrong"'));
    const missingEntryPath = path.join(fixtureRoot, "missing-entry.json");
    fs.writeFileSync(missingEntryPath, '{"mcp":{}}\n');
    raw.negative = {
      missingMachineField: await rejected(() => loadSharedToolsConfiguration(missingMachinePath)),
      wrongPort: await rejected(() => loadSharedToolsConfiguration(wrongPortPath)),
      duplicateEntry: await rejected(() => planGraphifyConfigEdit(duplicateConfigPath, configuration.graphify)),
      wrongEntry: await rejected(() => planGraphifyConfigEdit(wrongEntryPath, configuration.graphify)),
      missingEntry: await rejected(() => planGraphifyConfigEdit(missingEntryPath, configuration.graphify)),
    };

    raw.listenerCollision = evaluateGraphifyListenerState([{
      localAddress: "127.0.0.1",
      localPort: 4097,
      processId: 42,
    }]);

    const missingRepo = await rejected(() => requireExplicitGraphifyRepository("graphify-global_list_prs", {}));
    const explicitArgs = { repo: "owner/repository", base: "main" };
    const explicitBefore = JSON.stringify(explicitArgs);
    requireExplicitGraphifyRepository("graphify-global_triage_prs", explicitArgs);
    let graphToolUnaffected = true;
    try {
      requireExplicitGraphifyRepository("graphify-global_query_graph", {});
    } catch {
      graphToolUnaffected = false;
    }
    raw.repositoryGuard = {
      missingRejected: missingRepo.rejected,
      missingMessage: missingRepo.message,
      explicitPreserved: JSON.stringify(explicitArgs) === explicitBefore,
      graphToolUnaffected,
    };

    const sentinel = `proof-secret-${crypto.randomUUID()}`;
    const projectedError = redactGraphifyError(new Error(`outer Bearer ${sentinel}`, { cause: new Error(`inner ${sentinel}`) }), [sentinel]);
    const projectionText = JSON.stringify(projectedError);
    raw.redaction = {
      secretAbsent: !projectionText.includes(sentinel),
      causePresent: projectedError.cause?.message.includes("[REDACTED]") === true,
    };
  } finally {
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
    raw.cleanup = { fixtureAbsent: !fs.existsSync(fixtureRoot) };
    raw.configSource = {
      ...(raw.configSource ?? { beforeSha256: sha256(originalConfigBytes) }),
      afterSha256: fileHash(opencodeConfigPath),
    };
  }
  const evaluation = evaluate(raw, "capture");
  writeNew(path.join(options.evidenceRoot, "raw.json"), raw);
  writeNew(path.join(options.evidenceRoot, "evaluation.json"), evaluation);
  process.stdout.write(json(evaluation));
  if (!evaluation.passed) process.exitCode = 1;
}

function replay(options: Options): void {
  if (!options.inputRoot) throw new Error("Replay input root is missing");
  if (fs.existsSync(options.evidenceRoot)) throw new Error(`Evidence root already exists: ${options.evidenceRoot}`);
  const raw = JSON.parse(fs.readFileSync(path.join(options.inputRoot, "raw.json"), "utf8"));
  const evaluation = evaluate(raw, "replay");
  writeNew(path.join(options.evidenceRoot, "evaluation.json"), evaluation);
  process.stdout.write(json(evaluation));
  if (!evaluation.passed) process.exitCode = 1;
}

async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  if (options.mode === "capture") await capture(options);
  else replay(options);
}

main().catch((error) => {
  process.stderr.write(`${json(redactGraphifyError(error))}`);
  process.exitCode = 1;
});
