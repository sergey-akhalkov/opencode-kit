#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  CORE_SKILLS,
  DELIVERY_TRAJECTORY_HELPER_FILES,
  ROADMAP_MISSION_PLUGIN_FILES,
  SPECIALIST_CATALOG_PLUGIN_FILE,
  loadRuntimeSurfaceProfile,
  materializeRuntimeSurfaceProfile,
} from "../runtime-surface-profile.ts";

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
  agentListStatus: number | null;
  agentStatus: number | null;
  advisorAgentName: string;
  advisorStatus: number | null;
  authorityMarkers: {
    compactionTeamAdviceMirror: boolean;
    debugConfigExposesCompactionPrompt: boolean;
    evidenceBoundsPrinciple: boolean;
    claimRoutingTrigger: boolean;
    complexityRoutingTrigger: boolean;
    foundationRoutingTrigger: boolean;
    practiceOwnerBoundary: boolean;
    teamAdviceRoutingTrigger: boolean;
    teamAdviceStateContract: boolean;
  };
  canonicalOpenSpecSkills: string[];
  catalogPluginCount: number;
  configStatus: number | null;
  extraCoreAgents: string[];
  missingCanonicalOpenSpecSkills: string[];
  permissionFailures: string[];
  pluginPaths: string[];
  resolvedPaths: Record<string, string>;
  unexpectedCorePlugins: string[];
};

export type MissionLoaderEvaluation = {
  advisorAgentName: string;
  advisorStatus: number | null;
  agentListStatus: number | null;
  catalogPluginCount: number;
  commandNames: string[];
  configStatus: number | null;
  missingCommands: string[];
  missingPlugins: string[];
  missingSelectedAgents: string[];
  missingSelectedSkills: string[];
  missingTrajectoryClosure: string[];
  model: unknown;
  pluginPaths: string[];
  selectedAgentNames: string[];
  skillNames: string[];
  stagingPathCount: number;
  status: "failed" | "passed";
  unresolvedPlaceholderCount: number;
};

const DOMAIN_SKILLS = [
  "com-activex-adapter-implementation",
  "rust-workspace-bootstrap",
  "windows-service-packaging",
  "wire-protocol-golden-tests",
] as const;

const DOMAIN_AGENTS = [
  "deployment-config-reviewer",
  "legacy-client-compatibility-reviewer",
  "legacy-evidence-reviewer",
  "performance-reliability-reviewer",
  "protocol-api-reviewer",
  "rust-concurrency-reviewer",
  "wire-protocol-reviewer",
] as const;

function usage(): string {
  return [
    "Usage:",
    "  npm run proof:runtime-surface-loader -- [options]",
    "",
    "Start installed OpenCode against a disposable generated profile and verify its loader-visible surface.",
    "",
    "Options:",
    "  --candidate-id <id>     Evidence candidate id.",
    "  --evidence-root <path>  Create-new evidence directory. Required with --candidate-id.",
    "  --profile <core|all>     Generated profile to inspect. Defaults to core.",
    "  --help, -h              Show this help. No effects.",
  ].join("\n");
}

function repositoryRoot(): string {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
}

function parseArgs(args: string[]): { candidateId: string | null; evidenceRoot: string | null; profile: "all" | "core" } | null {
  if (args.includes("--help") || args.includes("-h")) return null;
  let candidateId: string | null = null;
  let evidenceRoot: string | null = null;
  let profile: "all" | "core" = "core";
  for (let index = 0; index < args.length; index++) {
    const arg = args[index]!;
    const value = args[index + 1];
    if (arg === "--candidate-id" && value != null) {
      candidateId = value;
      index++;
    } else if (arg === "--evidence-root" && value != null) {
      evidenceRoot = path.resolve(value);
      index++;
    } else if (arg === "--profile" && (value === "all" || value === "core")) {
      profile = value;
      index++;
    } else {
      throw new Error(`Unknown or incomplete option: ${arg}`);
    }
  }
  if ((candidateId == null) !== (evidenceRoot == null)) {
    throw new Error("--candidate-id and --evidence-root must be supplied together.");
  }
  return { candidateId, evidenceRoot, profile };
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

export function parseAgentListNames(text: string): string[] {
  return [...text.matchAll(/^([A-Za-z0-9][A-Za-z0-9._-]*) \((?:all|primary|subagent)\)\s*$/gm)]
    .map((match) => match[1]!)
    .sort((left, right) => left.localeCompare(right));
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

function isolatedEnv(configDir: string, runtimeRoot: string, configuredPlugins = false): NodeJS.ProcessEnv {
  const environment = { ...process.env };
  environment.OPENCODE_CONFIG_DIR = configDir;
  environment.XDG_CACHE_HOME = path.join(runtimeRoot, "cache");
  environment.XDG_CONFIG_HOME = path.join(runtimeRoot, "config-home");
  environment.XDG_DATA_HOME = path.join(runtimeRoot, "data");
  environment.XDG_STATE_HOME = path.join(runtimeRoot, "state");
  environment.OPENCODE_DISABLE_EXTERNAL_SKILLS = "1";
  environment.OPENCODE_DISABLE_CLAUDE_CODE_SKILLS = "1";
  if (configuredPlugins) {
    environment.OPENCODE_DISABLE_DEFAULT_PLUGINS = "1";
    delete environment.OPENCODE_PURE;
  } else {
    environment.OPENCODE_PURE = "1";
  }
  delete environment.OPENCODE_CONFIG;
  delete environment.OPENCODE_CONFIG_CONTENT;
  return environment;
}

function finalExactPermission(agent: LoaderAgent, permission: string, pattern: string): string | null {
  const matches = agent.permission.filter((rule) => rule.permission === permission && rule.pattern === pattern);
  return matches.at(-1)?.action ?? null;
}

function finalPermission(agent: LoaderAgent, permission: string, pattern: string): string | null {
  const matches = agent.permission.filter((rule) =>
    (rule.permission === "*" || rule.permission === permission) && rule.pattern === pattern
  );
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
  advisor: LoaderAgent,
  config: Record<string, unknown>,
  generatedConfig: Record<string, unknown>,
  listedAgentNames: string[],
  generatedRoot: string,
  sourceGlobal: string,
  agentStatus: number | null,
  advisorStatus: number | null,
  configStatus: number | null,
  agentListStatus: number | null,
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
  if (agent.name !== "foundation-integrity-reviewer") permissionFailures.push(`agent-name=${agent.name}`);
  if (agent.mode !== "subagent") permissionFailures.push(`agent-mode=${agent.mode}`);
  if (!agent.prompt.includes("Foundation Relation Matrix") || !agent.prompt.includes("Do not return an acceptance/rejection verdict")) {
    permissionFailures.push("agent-prompt-markers-missing");
  }
  const advisorPermissions: Array<[string, string, string]> = [
    ["read", "*", "allow"],
    ["glob", "*", "allow"],
    ["grep", "*", "allow"],
    ["specialist_catalog", "*", "allow"],
    ["bash", "*", "deny"],
    ["edit", "*", "deny"],
    ["task", "*", "deny"],
    ["question", "*", "deny"],
    ["skill", "*", "deny"],
    ["webfetch", "*", "deny"],
    ["websearch", "*", "deny"],
    ["todowrite", "*", "deny"],
    ["external_directory", "*", "deny"],
    ["lsp", "*", "deny"],
    ["doom_loop", "*", "deny"],
  ];
  if (finalExactPermission(advisor, "*", "*") !== "deny") {
    permissionFailures.push("advisor wildcard deny missing");
  }
  for (const [permission, pattern, expected] of advisorPermissions) {
    const actual = finalPermission(advisor, permission, pattern);
    if (actual !== expected) permissionFailures.push(`advisor:${permission}:${pattern} expected=${expected} observed=${actual ?? "missing"}`);
  }
  if (advisor.name !== "specialist-team-advisor") permissionFailures.push(`advisor-name=${advisor.name}`);
  if (advisor.mode !== "subagent") permissionFailures.push(`advisor-mode=${advisor.mode}`);
  if (!advisor.prompt.includes("Call `specialist_catalog` exactly once") || !advisor.prompt.includes("You never dispatch")) {
    permissionFailures.push("advisor-prompt-markers-missing");
  }
  const pluginPaths = missionPluginPaths(config, generatedRoot);
  const catalogPluginCount = pluginPaths.filter((entry) => entry === SPECIALIST_CATALOG_PLUGIN_FILE).length;
  const unexpectedCorePlugins = pluginPaths.filter((entry) => entry !== SPECIALIST_CATALOG_PLUGIN_FILE);
  const extraCoreAgents = DOMAIN_AGENTS.filter((name) => listedAgentNames.includes(name));
  const principles = fs.readFileSync(path.join(generatedRoot, "principles-of-work.md"), "utf8");
  const routing = fs.readFileSync(path.join(generatedRoot, "AGENTS.md"), "utf8");
  const practiceOwnerContract = fs.readFileSync(path.join(path.dirname(sourceGlobal), "instructions", "practice-owner-agent-contract.md"), "utf8");
  const configAgents = generatedConfig.agent && typeof generatedConfig.agent === "object" && !Array.isArray(generatedConfig.agent)
    ? generatedConfig.agent as Record<string, unknown>
    : {};
  const debugConfigAgents = config.agent && typeof config.agent === "object" && !Array.isArray(config.agent)
    ? config.agent as Record<string, unknown>
    : {};
  const compactionAgent = configAgents.compaction && typeof configAgents.compaction === "object" && !Array.isArray(configAgents.compaction)
    ? configAgents.compaction as Record<string, unknown>
    : {};
  const compactionPrompt = typeof compactionAgent.prompt === "string" ? compactionAgent.prompt : "";
  const debugCompactionAgent = debugConfigAgents.compaction && typeof debugConfigAgents.compaction === "object" && !Array.isArray(debugConfigAgents.compaction)
    ? debugConfigAgents.compaction as Record<string, unknown>
    : {};
  const teamAdviceStateFields = [
    "Advisor Task Ref",
    "Candidate Ref",
    "Catalog Ref",
    "Main Disposition",
    "Active Work Packages",
    "Terminal Work Packages",
    "Pending Activation Evidence",
    "Specialist Liveness",
    "Integration State",
    "Unavailable Material Capabilities",
    "Reconsultation Condition",
  ];
  const resolvedPaths = {
    behavioralSubstitutionSkill: generatedLocation(skills, "behavioral-substitution-qualification", generatedRoot),
    complexityForagingContract: fs.existsSync(path.join(generatedRoot, "bin", "complexity-foraging-contract.ts"))
      ? "<generated>/bin/complexity-foraging-contract.ts"
      : "<missing>",
    complexityForagingInventory: fs.existsSync(path.join(generatedRoot, "bin", "complexity-foraging-inventory.ts"))
      ? "<generated>/bin/complexity-foraging-inventory.ts"
      : "<missing>",
    complexityManagementSkill: generatedLocation(skills, "complexity-management", generatedRoot),
    deliveryHorizonContract: fs.existsSync(path.join(generatedRoot, "bin", "openspec-change", "delivery-horizon.ts"))
      ? "<generated>/bin/openspec-change/delivery-horizon.ts"
      : "<missing>",
    deliveryHorizonManifest: fs.existsSync(path.join(generatedRoot, "bin", "openspec-change", "manifest.ts"))
      ? "<generated>/bin/openspec-change/manifest.ts"
      : "<missing>",
    deliveryTrajectoryContext: fs.existsSync(path.join(generatedRoot, "bin", "delivery-trajectory-context.ts"))
      ? "<generated>/bin/delivery-trajectory-context.ts"
      : "<missing>",
    evidenceSufficiencyReviewer: fs.existsSync(path.join(generatedRoot, "agents", "evidence-sufficiency-reviewer.md"))
      ? "<generated>/agents/evidence-sufficiency-reviewer.md"
      : "<missing>",
    foundationIntegrityRecoverySkill: generatedLocation(skills, "foundation-integrity-recovery", generatedRoot),
    foundationIntegrityReviewer: fs.existsSync(path.join(generatedRoot, "agents", "foundation-integrity-reviewer.md"))
      ? "<generated>/agents/foundation-integrity-reviewer.md"
      : "<missing>",
    openspecApplySkill: generatedLocation(skills, "openspec-apply-change", generatedRoot),
    openspecArchiveSkill: generatedLocation(skills, "openspec-archive-change", generatedRoot),
    openspecProposeSkill: generatedLocation(skills, "openspec-propose", generatedRoot),
    roadmapDeliveryTrajectorySkill: generatedLocation(skills, "roadmap-delivery-trajectory", generatedRoot),
    specialistCatalogPlugin: fs.existsSync(path.join(generatedRoot, ...SPECIALIST_CATALOG_PLUGIN_FILE.split("/")))
      ? `<generated>/${SPECIALIST_CATALOG_PLUGIN_FILE}`
      : "<missing>",
    specialistTeamAdvisor: fs.existsSync(path.join(generatedRoot, "agents", "specialist-team-advisor.md"))
      ? "<generated>/agents/specialist-team-advisor.md"
      : "<missing>",
  };
  const authorityMarkers = {
    compactionTeamAdviceMirror: compactionPrompt.includes("Team Advice State")
      && teamAdviceStateFields.every((field) => compactionPrompt.includes(field))
      && compactionPrompt.includes("does not infer a new team")
      && compactionPrompt.includes("does not reconsult solely because compaction occurred"),
    debugConfigExposesCompactionPrompt: typeof debugCompactionAgent.prompt === "string",
    evidenceBoundsPrinciple: principles.includes("**Evidence Bounds Claims:**"),
    claimRoutingTrigger: routing.includes("behavioral-substitution-qualification") && routing.includes("evidence-sufficiency-reviewer"),
    complexityRoutingTrigger: routing.includes("Proportional context-efficient architecture")
      && routing.includes("`complexity-management`")
      && routing.includes("`codebase-audit-loop`")
      && routing.includes("project mode unavailable without approximating coverage"),
    foundationRoutingTrigger: routing.includes("foundation-integrity-reviewer") && routing.includes("foundation-integrity-recovery"),
    practiceOwnerBoundary: practiceOwnerContract.includes("zero-trigger work launches no Practice Owner")
      && practiceOwnerContract.includes("The non-owner team advisor follows its separate parentless-root mission trigger")
      && practiceOwnerContract.includes("never satisfies or suppresses a matched practice trigger"),
    teamAdviceRoutingTrigger: routing.includes("## Team Advice")
      && routing.includes("trivial owner-local action with known representative proof")
      && routing.includes("obtain one fresh `specialist-team-advisor` map")
      && routing.includes("Main retains the mission spine")
      && routing.includes("`main-alone` is a successful advisory result")
      && routing.includes("Reconsult once only after a material topology change"),
    teamAdviceStateContract: routing.includes("`Team Advice State` section")
      && teamAdviceStateFields.every((field) => routing.includes(field))
      && routing.includes("Compaction never verifies runtime availability")
      && routing.includes("a mismatch invalidates only dependent recommendations"),
  };
  const pathFailures = Object.values(resolvedPaths).filter((value) => !value.startsWith("<generated>/"));
  const passed = skillEvaluation.status === "passed"
    && agentStatus === 0
    && advisorStatus === 0
    && configStatus === 0
    && agentListStatus === 0
    && catalogPluginCount === 1
    && extraCoreAgents.length === 0
    && unexpectedCorePlugins.length === 0
    && missingCanonicalOpenSpecSkills.length === 0
    && permissionFailures.length === 0
    && pathFailures.length === 0
    && authorityMarkers.evidenceBoundsPrinciple
    && authorityMarkers.claimRoutingTrigger
    && authorityMarkers.complexityRoutingTrigger
    && authorityMarkers.foundationRoutingTrigger
    && authorityMarkers.compactionTeamAdviceMirror
    && authorityMarkers.practiceOwnerBoundary
    && authorityMarkers.teamAdviceRoutingTrigger
    && authorityMarkers.teamAdviceStateContract;
  return {
    ...skillEvaluation,
    agentName: agent.name,
    agentListStatus,
    agentStatus,
    advisorAgentName: advisor.name,
    advisorStatus,
    authorityMarkers,
    canonicalOpenSpecSkills,
    catalogPluginCount,
    configStatus,
    extraCoreAgents: [...extraCoreAgents],
    missingCanonicalOpenSpecSkills,
    permissionFailures,
    pluginPaths,
    resolvedPaths,
    status: passed ? "passed" : "failed",
    unexpectedCorePlugins,
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
  agentListStatus: number | null;
  agentStatus: number | null;
  advisorStatus: number | null;
  configStatus: number | null;
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
  fs.copyFileSync(
    path.join(generatedRoot, "opencode.local.instructions.example.md"),
    path.join(generatedRoot, "opencode.local.instructions.md"),
  );
  const env = isolatedEnv(generatedRoot, runtimeRoot, true);
  const config = runOpenCode(projectRoot, ["debug", "config"], env);
  if (config.status !== 0) {
    fs.rmSync(work, { recursive: true, force: true });
    throw new Error(`opencode debug config exited ${config.status ?? "unknown"}: ${config.stderr || config.stdout}`);
  }
  const generatedConfig = JSON.parse(fs.readFileSync(path.join(generatedRoot, "opencode.json"), "utf8")) as Record<string, unknown>;
  const agentList = runOpenCode(projectRoot, ["agent", "list"], env);
  if (agentList.status !== 0) {
    fs.rmSync(work, { recursive: true, force: true });
    throw new Error(`opencode agent list exited ${agentList.status ?? "unknown"}: ${agentList.stderr || agentList.stdout}`);
  }
  const skill = runOpenCode(projectRoot, ["debug", "skill"], env);
  if (skill.status !== 0) {
    fs.rmSync(work, { recursive: true, force: true });
    throw new Error(`opencode debug skill exited ${skill.status ?? "unknown"}: ${skill.stderr || skill.stdout}`);
  }
  const skills = parseLoaderSkills(extractJson(skill.stdout));
  const agent = runOpenCode(projectRoot, ["debug", "agent", "foundation-integrity-reviewer"], env);
  if (agent.status !== 0) {
    fs.rmSync(work, { recursive: true, force: true });
    throw new Error(`opencode debug agent exited ${agent.status ?? "unknown"}: ${agent.stderr || agent.stdout}`);
  }
  const advisor = runOpenCode(projectRoot, ["debug", "agent", "specialist-team-advisor"], env);
  if (advisor.status !== 0) {
    fs.rmSync(work, { recursive: true, force: true });
    throw new Error(`opencode debug advisor exited ${advisor.status ?? "unknown"}: ${advisor.stderr || advisor.stdout}`);
  }
  const evaluation = evaluateLoaderSurface(
    skills,
    parseLoaderAgent(extractJson(agent.stdout)),
    parseLoaderAgent(extractJson(advisor.stdout)),
    extractJson(config.stdout) as Record<string, unknown>,
    generatedConfig,
    parseAgentListNames(agentList.stdout),
    generatedRoot,
    path.join(root, "global"),
    agent.status,
    advisor.status,
    config.status,
    agentList.status,
  );
  return {
    agentListStatus: agentList.status,
    agentStatus: agent.status,
    advisorStatus: advisor.status,
    cleanup: () => {
      fs.rmSync(work, { recursive: true, force: true });
      if (fs.existsSync(work)) throw new Error("Disposable loader root still exists after cleanup.");
    },
    evaluation,
    generatedRoot,
    projectRoot,
    configStatus: config.status,
    skillStatus: skill.status,
  };
}

function missionPluginPaths(config: Record<string, unknown>, generatedRoot: string): string[] {
  const plugins = Array.isArray(config.plugin) ? config.plugin : [];
  return plugins.flatMap((entry) => {
    const source = typeof entry === "string" ? entry : Array.isArray(entry) && typeof entry[0] === "string" ? entry[0] : null;
    if (source == null || !source.startsWith("file:")) return [];
    const relative = path.relative(generatedRoot, fileURLToPath(source)).replaceAll("\\", "/");
    return relative.startsWith("../") ? [] : [relative];
  });
}

export function captureMissionLoaderSurface(root: string): {
  cleanup: () => void;
  evaluation: MissionLoaderEvaluation;
  generatedRoot: string;
  projectRoot: string;
  skillStatus: number | null;
} {
  const work = fs.mkdtempSync(path.join(os.tmpdir(), "runtime-surface-loader-all-"));
  const generatedRoot = path.join(root, "global", ".runtime-profiles", `proof-loader-${process.pid}-${crypto.randomBytes(4).toString("hex")}`);
  const projectRoot = path.join(work, "unrelated-app");
  const runtimeRoot = path.join(work, "xdg");
  fs.mkdirSync(projectRoot, { recursive: true });
  fs.writeFileSync(path.join(projectRoot, "README.md"), "# Unrelated fixture\n");
  materializeRuntimeSurfaceProfile({ profileName: "all", root, targetRoot: generatedRoot });
  fs.copyFileSync(
    path.join(generatedRoot, "opencode.local.instructions.example.md"),
    path.join(generatedRoot, "opencode.local.instructions.md"),
  );
  const env = isolatedEnv(generatedRoot, runtimeRoot, true);
  const configResult = runOpenCode(projectRoot, ["debug", "config"], env);
  if (configResult.status !== 0) {
    fs.rmSync(work, { recursive: true, force: true });
    fs.rmSync(generatedRoot, { recursive: true, force: true });
    throw new Error(`opencode debug config exited ${configResult.status ?? "unknown"}: ${configResult.stderr || configResult.stdout}`);
  }
  const config = extractJson(configResult.stdout) as Record<string, unknown>;
  const pluginPaths = missionPluginPaths(config, generatedRoot);
  const requiredPlugins = [...ROADMAP_MISSION_PLUGIN_FILES, SPECIALIST_CATALOG_PLUGIN_FILE];
  const catalogPluginCount = pluginPaths.filter((entry) => entry === SPECIALIST_CATALOG_PLUGIN_FILE).length;
  const advisor = runOpenCode(projectRoot, ["debug", "agent", "specialist-team-advisor"], env);
  if (advisor.status !== 0) {
    fs.rmSync(work, { recursive: true, force: true });
    fs.rmSync(generatedRoot, { recursive: true, force: true });
    throw new Error(`opencode debug advisor exited ${advisor.status ?? "unknown"}: ${advisor.stderr || advisor.stdout}`);
  }
  const advisorAgent = parseLoaderAgent(extractJson(advisor.stdout));
  const skill = runOpenCode(projectRoot, ["debug", "skill"], env);
  if (skill.status !== 0) {
    fs.rmSync(work, { recursive: true, force: true });
    fs.rmSync(generatedRoot, { recursive: true, force: true });
    throw new Error(`opencode debug skill exited ${skill.status ?? "unknown"}: ${skill.stderr || skill.stdout}`);
  }
  const skills = parseLoaderSkills(extractJson(skill.stdout));
  const skillNames = [...new Set(skills.map((entry) => entry.name))].sort((left, right) => left.localeCompare(right));
  const agentList = runOpenCode(projectRoot, ["agent", "list"], env);
  if (agentList.status !== 0) {
    fs.rmSync(work, { recursive: true, force: true });
    fs.rmSync(generatedRoot, { recursive: true, force: true });
    throw new Error(`opencode agent list exited ${agentList.status ?? "unknown"}: ${agentList.stderr || agentList.stdout}`);
  }
  const selectedAgentNames = parseAgentListNames(agentList.stdout);
  const selectedProfile = loadRuntimeSurfaceProfile(root, "all");
  if (selectedProfile.profile == null || selectedProfile.errors.length > 0) {
    fs.rmSync(work, { recursive: true, force: true });
    fs.rmSync(generatedRoot, { recursive: true, force: true });
    throw new Error(selectedProfile.errors.join("\n") || "Unable to load all profile for agent readback.");
  }
  const missingSelectedAgents = selectedProfile.profile.agents.filter((name) => !selectedAgentNames.includes(name));
  const missingSelectedSkills = selectedProfile.profile.skills.filter((name) => !skillNames.includes(name));
  const missingTrajectoryClosure = DELIVERY_TRAJECTORY_HELPER_FILES.filter((relative) => {
    const generatedRelative = relative.slice("global/".length);
    return !fs.existsSync(path.join(generatedRoot, ...generatedRelative.split("/")));
  });
  const command = config.command != null && typeof config.command === "object" && !Array.isArray(config.command)
    ? config.command as Record<string, unknown>
    : {};
  const commandNames = Object.keys(command).filter((name) => name.startsWith("mission-")).sort((left, right) => left.localeCompare(right));
  const requiredCommands = ["mission-resume", "mission-run", "mission-status", "mission-stop"];
  const missingPlugins = requiredPlugins.filter((relative) => pluginPaths.filter((entry) => entry === relative).length !== 1);
  const missingCommands = requiredCommands.filter((name) => !commandNames.includes(name));
  const serializedConfig = JSON.stringify(config);
  const stagingPathCount = serializedConfig.split(".staging-").length - 1;
  const unresolvedPlaceholderCount = serializedConfig.split("__OPENCODE_").length - 1;
  const evaluation: MissionLoaderEvaluation = {
    advisorAgentName: advisorAgent.name,
    advisorStatus: advisor.status,
    agentListStatus: agentList.status,
    catalogPluginCount,
    commandNames,
    configStatus: configResult.status,
    missingCommands,
    missingPlugins,
    missingSelectedAgents,
    missingSelectedSkills,
    missingTrajectoryClosure: [...missingTrajectoryClosure],
    model: config.model,
    pluginPaths,
    selectedAgentNames,
    skillNames,
    stagingPathCount,
    status: configResult.status === 0
        && advisor.status === 0
        && advisorAgent.name === "specialist-team-advisor"
        && agentList.status === 0
        && catalogPluginCount === 1
        && config.model === "openai/gpt-5.6-sol"
        && missingPlugins.length === 0
        && missingSelectedAgents.length === 0
        && missingSelectedSkills.length === 0
        && missingTrajectoryClosure.length === 0
        && missingCommands.length === 0
        && stagingPathCount === 0
        && unresolvedPlaceholderCount === 0
      ? "passed"
      : "failed",
    unresolvedPlaceholderCount,
  };
  return {
    cleanup: () => {
      fs.rmSync(work, { recursive: true, force: true });
      fs.rmSync(generatedRoot, { recursive: true, force: true });
      if (fs.existsSync(work) || fs.existsSync(generatedRoot)) throw new Error("Disposable loader root still exists after cleanup.");
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
  const captured = options.profile === "all"
    ? captureMissionLoaderSurface(repositoryRoot())
    : captureCoreLoaderSurface(repositoryRoot());
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
        profile: options.profile,
        agentStatus: "agentStatus" in captured ? captured.agentStatus : null,
        advisorStatus: "advisorStatus" in captured ? captured.advisorStatus : null,
        configStatus: "configStatus" in captured ? captured.configStatus : captured.evaluation.configStatus,
        skillStatus: "skillStatus" in captured ? captured.skillStatus : null,
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
