#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath } from "node:url";

import { WorkCampaignError } from "./work-campaign/contracts.ts";
import { executeSemanticAssignment } from "./work-campaign/semantic-executor.ts";

function usage(): string {
  return `Usage:
  work-campaign-semantic-executor execute --root <path> --definition <file> --assignment <file> --result <file> --server-url <loopback-url> --agent <agent>

Runs one bounded parentless read-only semantic assignment against an already-running
loopback OpenCode runtime. It never starts a server, creates child sessions, asks
questions, issues mission certificates, or grants source/OpenSpec write tools.

Inputs/effects/evidence/cleanup:
  - reads one campaign definition and one contained assignment JSON;
  - performs at most the assignment's single configured model call;
  - writes one create-new result JSON below the campaign evidence path;
  - verifies no file diff, child, question, or permission request and deletes the session.`;
}

function value(args: string[], name: string): string {
  const at = args.indexOf(name);
  if (at < 0 || at + 1 >= args.length) throw new WorkCampaignError(`${name} is required`, 2, { field: name });
  return args[at + 1];
}

function isDirectExecution(): boolean {
  const entrypoint = process.argv[1];
  return entrypoint != null && path.resolve(entrypoint) === fileURLToPath(import.meta.url);
}

export async function main(args: string[]): Promise<number> {
  if (args.includes("--help") || args.includes("-h")) {
    console.log(usage());
    return 0;
  }
  if (args[0] !== "execute") throw new WorkCampaignError(`unknown command: ${args[0] ?? "<missing>"}`, 2, { field: "command" });
  const result = await executeSemanticAssignment({
    agent: value(args, "--agent"),
    assignmentPath: value(args, "--assignment"),
    definitionPath: value(args, "--definition"),
    resultPath: value(args, "--result"),
    root: value(args, "--root"),
    serverUrl: value(args, "--server-url"),
  });
  console.log(JSON.stringify({
    assignmentId: result.assignmentId,
    cleanup: result.cleanup,
    modelCalls: result.modelCalls,
    resultPath: value(args, "--result"),
    status: result.status,
  }, null, 2));
  return result.status === "complete" ? 0 : result.status === "unknown" ? 1 : 2;
}

if (isDirectExecution()) {
  main(process.argv.slice(2)).then((status) => {
    process.exitCode = status;
  }).catch((error) => {
    const status = error instanceof WorkCampaignError ? error.exitCode : 1;
    console.error(error instanceof Error ? error.message : "Semantic assignment failed");
    process.exitCode = status;
  });
}
