#!/usr/bin/env node
import { stableJson } from "./roadmap-mission/contracts.ts";
import { WorkCampaignError } from "./work-campaign/contracts.ts";
import { runCampaignSupervisor } from "./work-campaign/supervisor.ts";

type Operation = "run" | "status" | "stop";

function usage(): string {
  return [
    "Usage:",
    "  node global/bin/work-campaign-supervisor.ts <run|status|stop> --registry <absolute-json> [--registration <id>]",
    "",
    "Effects:",
    "  --help/-h: none.",
    "  status: reads the registry, runtime health, Git/campaign preflight, and campaign status; writes nothing.",
    "  run: additionally writes registry-local lease/log generations and invokes only an advised exact campaign resume.",
    "  stop: invokes only the exact registered campaign stop boundary and writes no project files directly.",
    "  No operation installs host material, starts OpenCode, accepts command argv, prints credentials, or interprets campaign lifecycle prose.",
  ].join("\n");
}

function value(args: string[], index: number, option: string): string {
  const selected = args[index + 1];
  if (selected == null || selected.trim() === "" || selected.startsWith("--")) throw new WorkCampaignError(`Missing value for ${option}`, 2, { field: option });
  return selected;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.length === 1 && (args[0] === "--help" || args[0] === "-h")) {
    console.log(usage());
    return;
  }
  const operation = args[0] as Operation;
  if (operation !== "run" && operation !== "status" && operation !== "stop") throw new WorkCampaignError("operation must be run, status, or stop", 2, { field: "operation" });
  let registryPath = "";
  let registrationId: string | undefined;
  for (let index = 1; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--registry") {
      registryPath = value(args, index, arg);
      index++;
    } else if (arg === "--registration") {
      registrationId = value(args, index, arg);
      index++;
    } else {
      throw new WorkCampaignError(`Unknown option: ${arg}`, 2, { field: arg });
    }
  }
  const abort = new AbortController();
  const stop = (): void => abort.abort();
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
  try {
    const report = await runCampaignSupervisor({ operation, registrationId, registryPath, signal: abort.signal });
    console.log(stableJson(report).trimEnd());
    process.exitCode = report.rows.some((row) => row.state === "blocked" || row.state === "unknown") ? 1 : 0;
  } finally {
    process.off("SIGINT", stop);
    process.off("SIGTERM", stop);
  }
}

void main().catch((error: unknown) => {
  const reported = error instanceof WorkCampaignError ? error : new WorkCampaignError("campaign supervisor failed", 1, { cause: error });
  console.error(stableJson({
    cause: reported.cause instanceof Error ? reported.cause.message : null,
    error: reported.message,
    exitCode: reported.exitCode,
    field: reported.field,
    operation: process.argv[2] ?? "unknown",
    schemaVersion: 1,
    status: "blocked",
    tool: "work-campaign-supervisor",
  }).trimEnd());
  process.exitCode = reported.exitCode;
});
