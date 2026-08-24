#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { CORE_SKILLS } from "../runtime-surface-profile.ts";
import { materializeRuntimeSurfaceProfile } from "../runtime-surface-profile.ts";

export type LoaderSkill = { location: string; name: string };

export type LoaderEvaluation = {
  extraCoreSkills: string[];
  hiddenParentHits: string[];
  missingCoreSkills: string[];
  skillNames: string[];
  status: "failed" | "passed";
};

export type LoaderAgent = {
  mode: string;
  name: string;
  permission: Array<{ action: string; pattern: string; permission: string }>;
  prompt: string;
};

export type LoaderSurfaceEvaluation = LoaderEvaluation & {
  agentName: string;
  agentStatus: number | null;
  authorityMarkers: {
    evidenceBoundsPrinciple: boolean;
    claimRoutingTrigger: boolean;
  };
  canonicalOpenSpecSkills: string[];
  missingCanonicalOpenSpecSkills: string[];
  permissionFailures: string[];
  resolvedPaths: Record<string, string>;
};

const DOMAIN_SKILLS = [
  "com-activex-adapter-implementation",
  "rust-workspace-bootstrap",
  "windows-service-packaging",
  "wire-protocol-golden-tests",
] as const;

function usage(): string {
  return [
    "Usage:",
    "  npm run proof:runtime-surface-loader -- [options]",
    "",
    "Start installed OpenCode against a disposable core config and verify skills, agents, paths, and permissions.",
    "",
    "Options:",
    "  --candidate-id <id>     Evidence candidate id.",
    "  --evidence-root <path>  Create-new evidence directory. Required with --candidate-id.",
    "  --help, -h              Show this help. No effects.",
  ].join("\n");
}

function repositoryRoot(): string {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
}

function parseArgs(args: string[]): { candidateId: string | null; evidenceRoot: string | null } | null {
  if (args.includes("--help") || args.includes("-h")) return null;
  let candidateId: string | null = null;
  let evidenceRoot: string | null = null;
  for (let index = 0; index < args.length; index++) {
    const arg = args[index]!;
    const value = args[index + 1];
    if (arg === "--candidate-id" && value != null) {
      candidateId = value;
      index++;
    } else if (arg === "--evidence-root" && value != null) {
      evidenceRoot = path.resolve(value);
      index++;
    } else {
      throw new Error(`Unknown or incomplete option: ${arg}`);
    }
  }
  if ((candidateId == null) !== (evidenceRoot == null)) {
    throw new Error("--candidate-id and --evidence-root must be supplied together.");
  }
  return { candidateId, evidenceRoot };
}

export function extractJson(text: string): unknown {
  const start = text.search(/[\[{]/);
  if (start < 0) {
    throw new Error("OpenCode output did not contain JSON.");
  }
  return JSON.parse(text.slice(start));
}

export function parseLoaderSkills(value: unknown): LoaderSkill[] {
  if (!Array.isArray(value)) {
    throw new Error("debug skill output must be a JSON array.");
  }
  return value.map((item, index) => {
    if (item == null || typeof item !== "object" || Array.isArray(item)) {
      throw new Error(`debug skill row ${index} is not an object.`);
    }
    const row = item as Record<string, unknown>;
    if (typeof row.name !== "string" || typeof row.location !== "string") {
      throw new Error(`debug skill row ${index} is missing name or location.`);
    }
    return { location: row.location, name: row.name };
  });
}

export function parseLoaderAgent(value: unknown): LoaderAgent {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("debug agent output must be an object.");
  }
  const row = value as Record<string, unknown>;
  if (typeof row.name !== "string" || typeof row.mode !== "string" || typeof row.prompt !== "string" || !Array.isArray(row.permission)) {
    throw new Error("debug agent output is missing name, mode, prompt, or permission.");
  }
  const permission = row.permission.map((item, index) => {
    if (item == null || typeof item !== "object" || Array.isArray(item)) throw new Error(`debug agent permission ${index} is not an object.`);
    const rule = item as Record<string, unknown>;
    if (typeof rule.permission !== "string" || typeof rule.action !== "string" || typeof rule.pattern !== "string") {
      throw new Error(`debug agent permission ${index} is incomplete.`);
    }
    return { permission: rule.permission, action: rule.action, pattern: rule.pattern };
  });
  return { mode: row.mode, name: row.name, permission, prompt: row.prompt };
}

export function evaluateLoaderSkills(
  skills: LoaderSkill[],
  generatedRoot: string,
  sourceGlobal: string,
): LoaderEvaluation {
  const skillNames = [...new Set(skills.map((skill) => skill.name))].sort((left, right) => left.localeCompare(right));
  const generated = path.resolve(generatedRoot);
  const parentSkills = path.join(path.resolve(sourceGlobal), "skills");
  const missingCoreSkills = CORE_SKILLS.filter((name) => !skillNames.includes(name));
  const extraCoreSkills = DOMAIN_SKILLS.filter((name) => skillNames.includes(name));
  const hiddenParentHits = skills
    .filter((skill) => {
      const location = path.resolve(skill.location);
      return location.startsWith(`${parentSkills}${path.sep}`) && !location.startsWith(`${generated}${path.sep}`);
    })
    .map((skill) => skill.name)
    .sort((left, right) => left.localeCompare(right));
  return {
    extraCoreSkills: [...extraCoreSkills],
    hiddenParentHits,
    missingCoreSkills: [...missingCoreSkills],
    skillNames,
    status: missingCoreSkills.length === 0 && extraCoreSkills.length === 0 && hiddenParentHits.length === 0
      ? "passed"
      : "failed",
  };
}

function isolatedEnv(configDir: string, runtimeRoot: string): NodeJS.ProcessEnv {
  const environment = { ...process.env };
  environment.OPENCODE_CONFIG_DIR = configDir;
  environment.XDG_CACHE_HOME = path.join(runtimeRoot, "cache");
  environment.XDG_CONFIG_HOME = path.join(runtimeRoot, "config-home");
  environment.XDG_DATA_HOME = path.join(runtimeRoot, "data");
  environment.XDG_STATE_HOME = path.join(runtimeRoot, "state");
  environment.OPENCODE_DISABLE_EXTERNAL_SKILLS = "1";
  environment.OPENCODE_DISABLE_CLAUDE_CODE_SKILLS = "1";
  environment.OPENCODE_PURE = "1";
  delete environment.OPENCODE_CONFIG;
  delete environment.OPENCODE_CONFIG_CONTENT;
  return environment;
}

function finalExactPermission(agent: LoaderAgent, permission: string, pattern: string): string | null {
  const matches = agent.permission.filter((rule) => rule.permission === permission && rule.pattern === pattern);
  return matches.at(-1)?.action ?? null;
}

function generatedLocation(skills: LoaderSkill[], name: string, generatedRoot: string): string {
  const matches = skills.filter((skill) => skill.name === name);
  if (matches.length !== 1) return `<invalid:${matches.length}>`;
  const relative = path.relative(path.resolve(generatedRoot), path.resolve(matches[0]!.location));
  if (relative.startsWith("..") || path.isAbsolute(relative)) return "<outside-generated>";
  return `<generated>/${relative.replaceAll("\\", "/")}`;
}

export function evaluateLoaderSurface(
  skills: LoaderSkill[],
  agent: LoaderAgent,
  generatedRoot: string,
  sourceGlobal: string,
  agentStatus: number | null,
): LoaderSurfaceEvaluation {
  const skillEvaluation = evaluateLoaderSkills(skills, generatedRoot, sourceGlobal);
  const canonicalOpenSpecSkills = ["openspec-apply-change", "openspec-archive-change", "openspec-propose"];
  const missingCanonicalOpenSpecSkills = canonicalOpenSpecSkills.filter((name) => !skillEvaluation.skillNames.includes(name));
  const expectedPermissions: Array<[string, string, string]> = [
    ["read", "*", "allow"],
    ["glob", "*", "allow"],
    ["grep", "*", "allow"],
    ["bash", "*", "deny"],
    ["edit", "*", "deny"],
    ["edit", "docs/feedbacks/**", "allow"],
    ["task", "*", "deny"],
    ["question", "*", "deny"],
    ["skill", "*", "deny"],
    ["skill", "complain", "allow"],
    ["webfetch", "*", "deny"],
    ["websearch", "*", "deny"],
    ["todowrite", "*", "deny"],
    ["external_directory", "*", "deny"],
    ["lsp", "*", "deny"],
    ["doom_loop", "*", "deny"],
  ];
  const permissionFailures = expectedPermissions.flatMap(([permission, pattern, expected]) => {
    const actual = finalExactPermission(agent, permission, pattern);
    return actual === expected ? [] : [`${permission}:${pattern} expected=${expected} observed=${actual ?? "missing"}`];
  });
  if (agent.name !== "evidence-sufficiency-reviewer") permissionFailures.push(`agent-name=${agent.name}`);
  if (agent.mode !== "subagent") permissionFailures.push(`agent-mode=${agent.mode}`);
  if (!agent.prompt.includes("Claim-Evidence Matrix") || !agent.prompt.includes("Do not return an acceptance/rejection verdict")) {
    permissionFailures.push("agent-prompt-markers-missing");
  }
  const principles = fs.readFileSync(path.join(generatedRoot, "principles-of-work.md"), "utf8");
  const routing = fs.readFileSync(path.join(generatedRoot, "AGENTS.md"), "utf8");
  const resolvedPaths = {
    behavioralSubstitutionSkill: generatedLocation(skills, "behavioral-substitution-qualification", generatedRoot),
    evidenceSufficiencyReviewer: fs.existsSync(path.join(generatedRoot, "agents", "evidence-sufficiency-reviewer.md"))
      ? "<generated>/agents/evidence-sufficiency-reviewer.md"
      : "<missing>",
    openspecApplySkill: generatedLocation(skills, "openspec-apply-change", generatedRoot),
    openspecArchiveSkill: generatedLocation(skills, "openspec-archive-change", generatedRoot),
    openspecProposeSkill: generatedLocation(skills, "openspec-propose", generatedRoot),
  };
  const authorityMarkers = {
    evidenceBoundsPrinciple: principles.includes("**Evidence Bounds Claims:**"),
    claimRoutingTrigger: routing.includes("behavioral-substitution-qualification") && routing.includes("evidence-sufficiency-reviewer"),
  };
  const pathFailures = Object.values(resolvedPaths).filter((value) => !value.startsWith("<generated>/"));
  const passed = skillEvaluation.status === "passed"
    && agentStatus === 0
    && missingCanonicalOpenSpecSkills.length === 0
    && permissionFailures.length === 0
    && pathFailures.length === 0
    && authorityMarkers.evidenceBoundsPrinciple
    && authorityMarkers.claimRoutingTrigger;
  return {
    ...skillEvaluation,
    agentName: agent.name,
    agentStatus,
    authorityMarkers,
    canonicalOpenSpecSkills,
    missingCanonicalOpenSpecSkills,
    permissionFailures,
    resolvedPaths,
    status: passed ? "passed" : "failed",
  };
}

function runOpenCode(cwd: string, args: string[], env: NodeJS.ProcessEnv): { status: number | null; stderr: string; stdout: string } {
  const result = spawnSync("opencode", args, {
    cwd,
    encoding: "utf8",
    env,
    maxBuffer: 32 * 1024 * 1024,
    shell: false,
    timeout: 60_000,
  });
  return {
    status: result.status,
    stderr: typeof result.stderr === "string" ? result.stderr : "",
    stdout: typeof result.stdout === "string" ? result.stdout : "",
  };
}

export function captureCoreLoaderSurface(root: string): {
  cleanup: () => void;
  agentStatus: number | null;
  evaluation: LoaderSurfaceEvaluation;
  generatedRoot: string;
  projectRoot: string;
  skillStatus: number | null;
} {
  const work = fs.mkdtempSync(path.join(os.tmpdir(), "runtime-surface-loader-"));
  const generatedRoot = path.join(work, "core");
  const projectRoot = path.join(work, "unrelated-app");
  const runtimeRoot = path.join(work, "xdg");
  fs.mkdirSync(projectRoot, { recursive: true });
  fs.writeFileSync(path.join(projectRoot, "README.md"), "# Unrelated fixture\n");
  materializeRuntimeSurfaceProfile({ profileName: "core", root, targetRoot: generatedRoot });
  fs.writeFileSync(path.join(generatedRoot, "opencode.json"), `${JSON.stringify({
    $schema: "https://opencode.ai/config.json",
    permission: "ask",
  }, null, 2)}\n`);
  const env = isolatedEnv(generatedRoot, runtimeRoot);
  const skill = runOpenCode(projectRoot, ["debug", "skill"], env);
  if (skill.status !== 0) {
    fs.rmSync(work, { recursive: true, force: true });
    throw new Error(`opencode debug skill exited ${skill.status ?? "unknown"}: ${skill.stderr || skill.stdout}`);
  }
  const skills = parseLoaderSkills(extractJson(skill.stdout));
  const agent = runOpenCode(projectRoot, ["debug", "agent", "evidence-sufficiency-reviewer"], env);
  if (agent.status !== 0) {
    fs.rmSync(work, { recursive: true, force: true });
    throw new Error(`opencode debug agent exited ${agent.status ?? "unknown"}: ${agent.stderr || agent.stdout}`);
  }
  const evaluation = evaluateLoaderSurface(
    skills,
    parseLoaderAgent(extractJson(agent.stdout)),
    generatedRoot,
    path.join(root, "global"),
    agent.status,
  );
  return {
    agentStatus: agent.status,
    cleanup: () => {
      fs.rmSync(work, { recursive: true, force: true });
      if (fs.existsSync(work)) throw new Error("Disposable loader root still exists after cleanup.");
    },
    evaluation,
    generatedRoot,
    projectRoot,
    skillStatus: skill.status,
  };
}

function isMainModule(): boolean {
  const entrypoint = process.argv[1];
  return Boolean(entrypoint && import.meta.url === pathToFileURL(path.resolve(entrypoint)).href);
}

if (isMainModule()) {
  const options = parseArgs(process.argv.slice(2));
  if (options == null) {
    console.log(usage());
    process.exit(0);
  }
  const captured = captureCoreLoaderSurface(repositoryRoot());
  let cleanupComplete = false;
  let exitCode = 1;
  try {
    captured.cleanup();
    cleanupComplete = true;
    if (options.evidenceRoot != null && options.candidateId != null) {
      fs.mkdirSync(options.evidenceRoot, { recursive: true });
      const raw = {
        cleanup: "complete",
        candidateId: options.candidateId,
        evaluation: captured.evaluation,
        agentStatus: captured.agentStatus,
        skillStatus: captured.skillStatus,
        tool: "opencode-dev-kit-runtime-surface-loader",
      };
      fs.writeFileSync(path.join(options.evidenceRoot, "raw.json"), `${JSON.stringify(raw, null, 2)}\n`, { flag: "wx" });
      fs.writeFileSync(
        path.join(options.evidenceRoot, "evaluation.json"),
        `${JSON.stringify({ digest: crypto.createHash("sha256").update(JSON.stringify(raw)).digest("hex"), status: captured.evaluation.status }, null, 2)}\n`,
        { flag: "wx" },
      );
    }
    console.log(JSON.stringify(captured.evaluation, null, 2));
    exitCode = captured.evaluation.status === "passed" ? 0 : 1;
  } finally {
    if (!cleanupComplete) captured.cleanup();
  }
  process.exitCode = exitCode;
}
