#!/usr/bin/env node
import path from "node:path";
import { pathToFileURL } from "node:url";

import { ReuseRegistryError, redactText, stableJson } from "./reuse-registry/io.ts";
import {
  bootstrapRegistry,
  enqueueCandidate,
  loadPrivateConfig,
  loadResolvedPlan,
  queryRegistry,
  registryStatus,
  syncOutbox,
  validateRegistry,
} from "./reuse-registry/registry.ts";

type Operation = "bootstrap" | "enqueue" | "query" | "rescan" | "status" | "sync" | "validate";

type CliOptions = {
  candidate: string | null;
  config: string;
  groups: string[];
  limit: number | undefined;
  needs: string[];
  offset: number | undefined;
  operation: Operation;
  plan: string | null;
};

function usage(): string {
  return [
    "Usage:",
    "  node reuse-registry.ts status|validate|sync --config <absolute-file>",
    "  node reuse-registry.ts bootstrap|rescan --config <absolute-file> --plan <absolute-file>",
    "  node reuse-registry.ts query --config <absolute-file> --need <term>... --groups <group>... [--limit <1-50>] [--offset <n>]",
    "  node reuse-registry.ts enqueue --config <absolute-file> --candidate <absolute-file>",
    "",
    "The thin CLI may obtain --config only from nonblank OPENCODE_REUSE_CONFIG. Other roots and identities are never inferred.",
  ].join("\n");
}

function requiredValue(args: string[], index: number, option: string): string {
  const value = args[index + 1];
  if (value == null || value.trim() === "" || value.startsWith("--")) throw new ReuseRegistryError(`Missing value for ${option}`);
  return value;
}

function integerValue(value: string, option: string): number {
  if (!/^\d+$/.test(value)) throw new ReuseRegistryError(`${option} must be a non-negative integer`);
  return Number.parseInt(value, 10);
}

function parseArgs(args: string[], environment: NodeJS.ProcessEnv): CliOptions {
  const operation = args[0];
  if (operation === "--help" || operation === "-h") {
    console.log(usage());
    process.exit(0);
  }
  if (!(["bootstrap", "enqueue", "query", "rescan", "status", "sync", "validate"] as string[]).includes(operation ?? "")) {
    throw new ReuseRegistryError("A supported operation is required");
  }
  let config = "";
  let plan: string | null = null;
  let candidate: string | null = null;
  let limit: number | undefined;
  let offset: number | undefined;
  const groups: string[] = [];
  const needs: string[] = [];
  for (let index = 1; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--config") {
      config = requiredValue(args, index, arg);
      index++;
    } else if (arg === "--plan") {
      plan = requiredValue(args, index, arg);
      index++;
    } else if (arg === "--candidate") {
      candidate = requiredValue(args, index, arg);
      index++;
    } else if (arg === "--need") {
      needs.push(requiredValue(args, index, arg));
      index++;
    } else if (arg === "--groups") {
      const value = args[index + 1];
      if (value != null && !value.startsWith("--")) {
        groups.push(value);
        index++;
      }
    } else if (arg === "--limit") {
      limit = integerValue(requiredValue(args, index, arg), arg);
      index++;
    } else if (arg === "--offset") {
      offset = integerValue(requiredValue(args, index, arg), arg);
      index++;
    } else {
      throw new ReuseRegistryError(`Unknown option: ${arg}`);
    }
  }
  if (config.trim() === "") config = environment.OPENCODE_REUSE_CONFIG?.trim() ?? "";
  if (config === "") throw new ReuseRegistryError("Registry configuration is unavailable", "degraded", 3);
  if (!path.isAbsolute(config)) throw new ReuseRegistryError("Private config path must be absolute");
  return { candidate, config: path.resolve(config), groups, limit, needs, offset, operation: operation as Operation, plan };
}

function execute(options: CliOptions): Record<string, unknown> {
  const config = loadPrivateConfig(options.config);
  if (options.operation === "status") return registryStatus(config);
  if (options.operation === "validate") return validateRegistry(config);
  if (options.operation === "query") return queryRegistry(config, { groups: options.groups, limit: options.limit, needs: options.needs, offset: options.offset });
  if (options.operation === "enqueue") {
    if (options.candidate == null || !path.isAbsolute(options.candidate)) throw new ReuseRegistryError("enqueue requires an absolute --candidate path");
    return enqueueCandidate(config, options.candidate);
  }
  if (options.operation === "sync") return syncOutbox(config);
  if (options.plan == null || !path.isAbsolute(options.plan)) throw new ReuseRegistryError(`${options.operation} requires an absolute --plan path`);
  const plan = loadResolvedPlan(options.plan);
  if (plan.operation !== options.operation) throw new ReuseRegistryError("CLI operation and resolved plan operation differ");
  return bootstrapRegistry(config, plan);
}

function directExecution(): boolean {
  return process.argv[1] != null && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
}

if (directExecution()) {
  let options: CliOptions | null = null;
  try {
    options = parseArgs(process.argv.slice(2), process.env);
    console.log(stableJson(execute(options)).trimEnd());
  } catch (error) {
    const failure = error instanceof ReuseRegistryError
      ? error
      : new ReuseRegistryError("Reuse registry operation failed", "blocked", 5, { cause: error });
    const roots: Array<[string, string]> = [[process.cwd(), "<cwd>"]];
    if (options != null) roots.push([options.config, "<config>"]);
    const cause = failure.cause instanceof Error ? failure.cause.message : failure.cause == null ? null : String(failure.cause);
    console.error(stableJson({
      cause: cause == null ? null : redactText(cause, roots),
      error: failure.message,
      operation: options?.operation ?? process.argv[2] ?? "unknown",
      stack: failure.stack == null ? null : redactText(failure.stack, roots),
      status: failure.status,
    }).trimEnd());
    process.exitCode = failure.exitCode;
  }
}

export { execute, parseArgs };
