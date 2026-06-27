import path from "node:path";
import {
  SKILL_DESCRIPTION_MAX_CHARS,
  SKILL_NAME_PATTERN,
  SKILL_OUTPUT_CONTRACT_PATTERN,
  SKILL_TRIGGER_PATTERN,
} from "../contracts/skills.ts";
import {
  COMPLAIN_DIRECT_WRITE_CONTRACT_TEXT,
  COMPLAIN_SHARED_REQUIRED_TEXT,
} from "../contracts/complain.ts";
import type { ValidationContext } from "./context.ts";
import {
  directoryExists,
  fileExists,
  getRequiredScalar,
  listDirectories,
  readText,
  requireTextContains,
} from "./context.ts";
import { getFrontmatterMap } from "./frontmatter.ts";

export function validateSkills(ctx: ValidationContext, root: string): string[] {
  const skillsDir = path.join(root, "global", "skills");
  if (!directoryExists(skillsDir)) {
    ctx.addError(`Missing skills directory: ${skillsDir}`);
    return [];
  }

  const skillNames: string[] = [];
  for (const dir of listDirectories(skillsDir)) {
    const folderName = path.basename(dir);
    skillNames.push(folderName);
    const file = path.join(dir, "SKILL.md");
    if (!fileExists(file)) {
      ctx.addError(`Missing SKILL.md for skill folder: ${folderName}`);
      continue;
    }

    const text = readText(file);
    const frontmatter = getFrontmatterMap(ctx, text, file);
    const name = getRequiredScalar(ctx, frontmatter, "name", file);
    const description = getRequiredScalar(ctx, frontmatter, "description", file);
    if (!name || name.trim() === "") {
      ctx.addError(`Missing skill name: ${file}`);
    } else if (name !== folderName) {
      ctx.addError(`Skill name mismatch: folder=${folderName} name=${name}`);
    } else if (!SKILL_NAME_PATTERN.test(name)) {
      ctx.addError(`Invalid skill name format: ${name}`);
    }
    if (!description || description.trim() === "") {
      ctx.addError(`Missing skill description: ${file}`);
    } else if (description.length > SKILL_DESCRIPTION_MAX_CHARS) {
      ctx.addError(`Skill description exceeds ${SKILL_DESCRIPTION_MAX_CHARS} chars: ${file}`);
    }
    if (!SKILL_TRIGGER_PATTERN.test(text)) {
      ctx.addError(`Skill must define explicit trigger text with 'Use this skill/helper': ${file}`);
    }
    if (!SKILL_OUTPUT_CONTRACT_PATTERN.test(text)) {
      ctx.addError(`Skill must define an output or ledger contract: ${file}`);
    }
  }

  return skillNames;
}

export function validateFeedbackLedgerArtifacts(
  ctx: ValidationContext,
  root: string,
  skillNames: string[],
): void {
  if (!skillNames.includes("complain")) {
    return;
  }
  const skillPath = path.join(root, "global", "skills", "complain", "SKILL.md");
  const readmePath = path.join(root, "docs", "feedbacks", "README.md");
  if (!fileExists(skillPath)) {
    ctx.addError(`Missing complain skill file: ${skillPath}`);
    return;
  }
  if (!fileExists(readmePath)) {
    ctx.addError(`Missing feedback ledger README: ${readmePath}`);
    return;
  }

  const skillText = readText(skillPath);
  const readmeText = readText(readmePath);
  for (const required of COMPLAIN_SHARED_REQUIRED_TEXT) {
    requireTextContains(
      ctx,
      skillText,
      required,
      "complain skill feedback template",
      skillPath,
    );
    requireTextContains(
      ctx,
      readmeText,
      required,
      "feedback ledger README template",
      readmePath,
    );
  }
  for (const required of COMPLAIN_DIRECT_WRITE_CONTRACT_TEXT) {
    requireTextContains(
      ctx,
      skillText,
      required,
      "complain skill direct-write contract",
      skillPath,
    );
  }
}
