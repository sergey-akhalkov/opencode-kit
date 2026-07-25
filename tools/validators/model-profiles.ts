import fs from "node:fs";
import path from "node:path";
import {
  discoverGovernedAgentNames,
  parseModelProfileText,
  type ModelProfile,
} from "../model-profile.ts";
import type { ValidationContext } from "./context.ts";
import { directoryExists, listFiles, readText, toPosixPath } from "./context.ts";

const COMMITTED_PROFILE_NAMES = ["grok-only", "quality-independent", "sol-only"] as const;
const LOCAL_IGNORE_RULE = "/global/model-profiles/local/*.json";
const SOL_MODEL = "openai/gpt-5.6-sol";
const SOL_VARIANT = "xhigh";
const GROK_MODEL = "xai/grok-4.5";
const GROK_VARIANT = "high";
const QUALITY_CREATOR_AGENTS = new Set([
  "build",
  "compaction",
  "dream-team-implementer",
  "general",
  "implementation-worker",
  "plan",
  "troubleshooter",
]);

export function validateModelProfiles(ctx: ValidationContext, root: string): void {
  const profilesDir = path.join(root, "global", "model-profiles");
  if (!directoryExists(profilesDir)) {
    ctx.addError(`Missing model profiles directory: ${profilesDir}`);
    return;
  }

  let governedAgents: string[];
  try {
    governedAgents = discoverGovernedAgentNames(root);
  } catch (error) {
    ctx.addError(error instanceof Error ? error.message : String(error));
    return;
  }

  const committedEntries = fs
    .readdirSync(profilesDir, { withFileTypes: true })
    .filter((entry) => entry.name.endsWith(".json"));
  const committedNames = committedEntries
    .filter((entry) => entry.isFile())
    .map((entry) => path.basename(entry.name, ".json"))
    .sort((left, right) => left.localeCompare(right));
  if (JSON.stringify(committedNames) !== JSON.stringify(COMMITTED_PROFILE_NAMES)) {
    ctx.addError(
      `Committed model profiles must be exactly ${COMMITTED_PROFILE_NAMES.join(", ")}. Found: ${committedNames.join(", ") || "none"}.`,
    );
  }
  for (const entry of committedEntries) {
    if (!entry.isFile()) {
      ctx.addError(`Committed model profile must be a regular file: global/model-profiles/${entry.name}`);
    }
  }

  for (const profileName of COMMITTED_PROFILE_NAMES) {
    const file = path.join(profilesDir, `${profileName}.json`);
    if (!fs.existsSync(file) || !fs.lstatSync(file).isFile()) continue;
    const profile = parseProfile(ctx, root, file, governedAgents);
    if (profile != null) validateCommittedMatrix(ctx, root, file, profileName, profile);
  }

  const localDir = path.join(profilesDir, "local");
  if (directoryExists(localDir)) {
    for (const entry of fs.readdirSync(localDir, { withFileTypes: true })) {
      if (!entry.name.endsWith(".json")) continue;
      const file = path.join(localDir, entry.name);
      if (!entry.isFile()) {
        ctx.addError(`Local model profile must be a regular file: ${relativePath(root, file)}`);
        continue;
      }
      parseProfile(ctx, root, file, governedAgents);
    }
  }

  validateLocalIgnoreRule(ctx, root);
  validateAgentFilesRemainModelAgnostic(ctx, root);
}

function parseProfile(
  ctx: ValidationContext,
  root: string,
  file: string,
  governedAgents: string[],
): ModelProfile | null {
  const relative = relativePath(root, file);
  let text: string;
  try {
    text = readText(file);
  } catch (error) {
    ctx.addError(`Model profile is unreadable: ${relative}: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
  try {
    return parseModelProfileText(text, governedAgents, relative);
  } catch (error) {
    ctx.addError(error instanceof Error ? error.message : String(error));
    return null;
  }
}

function validateCommittedMatrix(
  ctx: ValidationContext,
  root: string,
  file: string,
  profileName: typeof COMMITTED_PROFILE_NAMES[number],
  profile: ModelProfile,
): void {
  const relative = relativePath(root, file);
  const expectedTop = profileName === "grok-only" ? GROK_MODEL : SOL_MODEL;
  const expectedSmall = profileName === "quality-independent" ? GROK_MODEL : expectedTop;
  if (profile.model !== expectedTop) {
    ctx.addError(`Committed model profile '${profileName}' model must be ${expectedTop}: ${relative}`);
  }
  if (profile.small_model !== expectedSmall) {
    ctx.addError(`Committed model profile '${profileName}' small_model must be ${expectedSmall}: ${relative}`);
  }

  for (const [agentName, route] of Object.entries(profile.agent)) {
    const useSol = profileName === "sol-only" ||
      (profileName === "quality-independent" && QUALITY_CREATOR_AGENTS.has(agentName));
    const expectedModel = useSol ? SOL_MODEL : GROK_MODEL;
    const expectedVariant = useSol ? SOL_VARIANT : GROK_VARIANT;
    if (route.model !== expectedModel || route.variant !== expectedVariant) {
      ctx.addError(
        `Committed model profile '${profileName}' route '${agentName}' must be ${expectedModel}/${expectedVariant}: ${relative}`,
      );
    }
  }
}

function validateLocalIgnoreRule(ctx: ValidationContext, root: string): void {
  const gitignore = path.join(root, ".gitignore");
  let lines: string[];
  try {
    lines = readText(gitignore)
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith("#"));
  } catch {
    ctx.addError(`Missing .gitignore for model profile local policy: ${gitignore}`);
    return;
  }
  const profileRules = lines.filter((line) => line.includes("model-profiles"));
  if (profileRules.length !== 1 || profileRules[0] !== LOCAL_IGNORE_RULE) {
    ctx.addError(
      `Model profile local ignore policy must contain only exact rule '${LOCAL_IGNORE_RULE}': ${gitignore}`,
    );
  }
}

function validateAgentFilesRemainModelAgnostic(ctx: ValidationContext, root: string): void {
  const agentsDir = path.join(root, "global", "agents");
  if (!directoryExists(agentsDir)) return;
  for (const file of listFiles(agentsDir, ".md")) {
    const text = readText(file);
    const frontmatter = text.match(/^---\r?\n(?<body>[\s\S]*?)\r?\n---(?:\r?\n|$)/)?.groups?.body ?? "";
    for (const field of ["model", "variant"]) {
      if (new RegExp(`^${field}\\s*:`, "m").test(frontmatter)) {
        ctx.addError(
          `Model profile routing requires reusable agent frontmatter to omit '${field}': ${relativePath(root, file)}`,
        );
      }
    }
  }
}

function relativePath(root: string, file: string): string {
  return toPosixPath(path.relative(root, file));
}
