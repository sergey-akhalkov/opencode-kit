#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  createContext,
  type ValidationContext,
  listFiles,
  walkMarkdownFiles,
  walkRepositoryFiles,
} from "./validators/context.ts";
import {
  validateSkills,
  validateFeedbackLedgerArtifacts,
} from "./validators/skills.ts";
import { validateAgents } from "./validators/agents.ts";
import { validateProfiles } from "./validators/profiles.ts";
import { validateOpenCodeConfigFiles } from "./validators/opencode-config.ts";
import {
  validateMarkdownFile,
  validateTypeScriptOnlySourceFiles,
} from "./validators/markdown.ts";
import {
  validateDevKitContract,
  validateInstructionFeedbackContracts,
  validateInstallerConfigDirModel,
  validatePackageScriptsTypeScriptOnly,
  validateReadme,
  validateRepoAgentsMd,
} from "./validators/devkit-contract.ts";
import {
  validateImplementationWorkerRouting,
  validateSessionDeliveryBinding,
} from "./validators/routing.ts";

type Options = {
  failOnWarnings: boolean;
  forbiddenAnchors: string[];
  root: string;
};

function defaultRoot(): string {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
}

function readOptionValue(args: string[], index: number, name: string): string {
  const value = args[index + 1];
  if (!value || value.trim() === "" || value.startsWith("-")) {
    throw new Error(`Missing value for ${name}.`);
  }
  return value;
}

function splitForbiddenAnchorValues(values: string[]): string[] {
  return values
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

function parseArgs(args: string[]): Options {
  let root = defaultRoot();
  let failOnWarnings = false;
  const forbiddenAnchors: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--root" || arg === "--Root" || arg === "-Root") {
      root = readOptionValue(args, i, arg);
      i++;
    } else if (arg.startsWith("--root=")) {
      root = arg.slice("--root=".length);
    } else if (arg.startsWith("--Root=")) {
      root = arg.slice("--Root=".length);
    } else if (
      arg === "--forbidden-anchor" ||
      arg === "--ForbiddenAnchor" ||
      arg === "-ForbiddenAnchor"
    ) {
      const values: string[] = [];
      while (i + 1 < args.length && !args[i + 1].startsWith("-")) {
        values.push(args[i + 1]);
        i++;
      }
      if (values.length === 0) {
        throw new Error(`Missing value for ${arg}.`);
      }
      forbiddenAnchors.push(...splitForbiddenAnchorValues(values));
    } else if (arg.startsWith("--forbidden-anchor=")) {
      forbiddenAnchors.push(
        ...splitForbiddenAnchorValues([arg.slice("--forbidden-anchor=".length)]),
      );
    } else if (arg.startsWith("--ForbiddenAnchor=")) {
      forbiddenAnchors.push(
        ...splitForbiddenAnchorValues([arg.slice("--ForbiddenAnchor=".length)]),
      );
    } else if (arg === "--fail-on-warnings") {
      failOnWarnings = true;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  return { failOnWarnings, forbiddenAnchors, root: path.resolve(root) };
}

function getMarkdownFiles(root: string): string[] {
  const gitDir = path.join(root, ".git");
  if (fs.existsSync(gitDir)) {
    const gitResult = spawnSync(
      "git",
      ["-C", root, "ls-files", "--cached", "--others", "--exclude-standard", "*.md"],
      { encoding: "utf8" },
    );
    if (gitResult.status === 0 && typeof gitResult.stdout === "string") {
      return gitResult.stdout
        .split(/\r?\n/)
        .filter((relative) => relative.trim() !== "")
        .map((relative) => relative.split(path.sep).join("/"))
        .map((relative) => path.join(root, relative))
        .filter((file) => fs.existsSync(file));
    }
  }

  return walkMarkdownFiles(root).sort((a, b) => a.localeCompare(b));
}

function getInstructionNames(root: string): string[] {
  const instructionsDir = path.join(root, "instructions");
  if (!fs.existsSync(instructionsDir)) {
    return [];
  }
  return listFiles(instructionsDir, ".md").map((file) => path.basename(file));
}

function main(): void {
  const options = parseArgs(process.argv.slice(2));
  const ctx: ValidationContext = createContext();
  const root = options.root;

  const skillNames = validateSkills(ctx, root);
  validateFeedbackLedgerArtifacts(ctx, root, skillNames);
  const agentNames = validateAgents(ctx, root);
  const instructionNames = getInstructionNames(root);
  validateTypeScriptOnlySourceFiles(ctx, root, walkRepositoryFiles);
  validatePackageScriptsTypeScriptOnly(ctx, root);
  validateDevKitContract(ctx, root);
  validateProfiles(ctx, root, skillNames, agentNames);
  validateImplementationWorkerRouting(ctx, root, agentNames);
  validateSessionDeliveryBinding(ctx, root, agentNames);
  validateOpenCodeConfigFiles(ctx, root);
  validateReadme(ctx, root, skillNames, agentNames, instructionNames);
  validateRepoAgentsMd(ctx, root);
  validateInstructionFeedbackContracts(ctx, root);
  validateInstallerConfigDirModel(ctx, root);

  const markdownFiles = getMarkdownFiles(root);
  for (const file of markdownFiles) {
    validateMarkdownFile(ctx, root, file, options.forbiddenAnchors);
  }

  for (const warning of ctx.warnings) {
    console.log(`WARN: ${warning}`);
  }

  for (const info of ctx.infos) {
    console.log(`INFO: ${info}`);
  }

  if (options.failOnWarnings && ctx.warnings.length > 0) {
    ctx.addError(
      `Warnings are not allowed in strict validation mode: ${ctx.warnings.length} warning(s).`,
    );
  }

  if (ctx.errors.length > 0) {
    for (const error of ctx.errors) {
      console.log(`ERROR: ${error}`);
    }
    process.exit(1);
  }

  console.log(
    `OK: skills=${skillNames.length} agents=${agentNames.length} markdown=${markdownFiles.length} warnings=${ctx.warnings.length} infos=${ctx.infos.length}`,
  );
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`ERROR: ${message}`);
  process.exit(1);
}
