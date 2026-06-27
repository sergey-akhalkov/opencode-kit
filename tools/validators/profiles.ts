import path from "node:path";
import type { ValidationContext } from "./context.ts";
import {
  compareStringSets,
  directoryExists,
  listFiles,
  readJsonRecord,
} from "./context.ts";

export function validateStringArray(
  ctx: ValidationContext,
  value: unknown,
  file: string,
  key: string,
): string[] {
  if (value == null) {
    return [];
  }
  if (
    !Array.isArray(value) ||
    value.some((item) => typeof item !== "string" || item.trim() === "")
  ) {
    ctx.addError(`Profile field '${key}' must be an array of non-empty strings: ${file}`);
    return [];
  }
  return value;
}

export function findDuplicateStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) {
      duplicates.add(value);
    }
    seen.add(value);
  }
  return [...duplicates].sort((left, right) => left.localeCompare(right));
}

export function validateProfiles(
  ctx: ValidationContext,
  root: string,
  skillNames: string[],
  agentNames: string[],
): void {
  const profilesDir = path.join(root, "profiles");
  if (!directoryExists(profilesDir)) {
    return;
  }
  const profileFiles = listFiles(profilesDir, ".json");
  const profileNames = new Set(profileFiles.map((file) => path.basename(file, ".json")));
  const allowedKeys = new Set(["agents", "description", "extends", "name", "skills"]);
  const extendsMap = new Map<string, string>();
  const profileSkillsMap = new Map<string, string[] | undefined>();
  const profileAgentsMap = new Map<string, string[] | undefined>();
  const skillSet = new Set(skillNames);
  const agentSet = new Set(agentNames);

  if (profileNames.size !== 1 || !profileNames.has("all")) {
    ctx.addError(
      "Install profiles must contain exactly profiles/all.json; restricted standard/strict/advanced profiles are not supported.",
    );
  }

  for (const file of profileFiles) {
    const name = path.basename(file, ".json");
    const profile = readJsonRecord(ctx, file);
    if (!profile) {
      continue;
    }
    for (const key of Object.keys(profile)) {
      if (!allowedKeys.has(key)) {
        ctx.addError(`Unsupported profile field '${key}': ${file}`);
      }
    }
    if (typeof profile.name !== "string" || profile.name !== name) {
      ctx.addError(`Profile name must match filename '${name}': ${file}`);
    }
    if (profile.description != null && typeof profile.description !== "string") {
      ctx.addError(`Profile description must be a string: ${file}`);
    }
    if (profile.extends != null) {
      if (typeof profile.extends !== "string" || profile.extends.trim() === "") {
        ctx.addError(`Profile extends must be a non-empty string: ${file}`);
      } else if (!profileNames.has(profile.extends)) {
        ctx.addError(`Profile extends missing profile '${profile.extends}': ${file}`);
      } else {
        extendsMap.set(name, profile.extends);
      }
    }
    const skills = validateStringArray(ctx, profile.skills, file, "skills");
    profileSkillsMap.set(name, profile.skills == null ? undefined : skills);
    const duplicateSkills = findDuplicateStrings(skills);
    if (duplicateSkills.length > 0) {
      ctx.addError(`Profile has duplicate skills ${duplicateSkills.join(", ")}: ${file}`);
    }
    for (const skill of skills) {
      if (!skillSet.has(skill)) {
        ctx.addError(`Profile references missing skill '${skill}': ${file}`);
      }
    }
    const agents = validateStringArray(ctx, profile.agents, file, "agents");
    profileAgentsMap.set(name, profile.agents == null ? undefined : agents);
    const duplicateAgents = findDuplicateStrings(agents);
    if (duplicateAgents.length > 0) {
      ctx.addError(`Profile has duplicate agents ${duplicateAgents.join(", ")}: ${file}`);
    }
    for (const agent of agents) {
      if (!agentSet.has(agent)) {
        ctx.addError(`Profile references missing agent '${agent}': ${file}`);
      }
    }
  }

  const allProfilePath = path.join(profilesDir, "all.json");
  if (profileNames.has("all")) {
    const allSkills = profileSkillsMap.get("all");
    const allAgents = profileAgentsMap.get("all");
    if (allSkills == null || allAgents == null) {
      ctx.addError(
        `profiles/all.json must explicitly list every skill and every agent: ${allProfilePath}`,
      );
    } else {
      const skillDiff = compareStringSets(allSkills, skillNames);
      const agentDiff = compareStringSets(allAgents, agentNames);
      if (skillDiff.missing.length > 0 || skillDiff.extra.length > 0) {
        ctx.addError(
          `profiles/all.json must match repository skills. Missing: ${skillDiff.missing.join(", ") || "none"}. Extra: ${skillDiff.extra.join(", ") || "none"}.`,
        );
      }
      if (agentDiff.missing.length > 0 || agentDiff.extra.length > 0) {
        ctx.addError(
          `profiles/all.json must match repository agents. Missing: ${agentDiff.missing.join(", ") || "none"}. Extra: ${agentDiff.extra.join(", ") || "none"}.`,
        );
      }
    }
  }

  for (const profile of profileNames) {
    const seen = new Set<string>();
    let current: string | undefined = profile;
    while (current) {
      if (seen.has(current)) {
        ctx.addError(`Profile inheritance cycle: ${[...seen, current].join(" -> ")}`);
        break;
      }
      seen.add(current);
      current = extendsMap.get(current);
    }
  }
}
