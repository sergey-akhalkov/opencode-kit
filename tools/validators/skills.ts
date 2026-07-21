import path from "node:path";
import {
  CHANGE_READY_SDLC_CONTINUATION_TOKENS,
  CHANGE_READY_SDLC_DESCRIPTION_TERMS,
  CHANGE_READY_SDLC_FORBIDDEN_TOKENS,
  CHANGE_READY_SDLC_LIFECYCLE_MARKERS,
  CHANGE_READY_SDLC_SKILL_NAME,
  CHANGE_READY_SDLC_SKILL_RELATIVE_PATH,
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
  toPosixPath,
} from "./context.ts";
import { getFrontmatterMap } from "./frontmatter.ts";
import { scanOperativeTextOutsideFences } from "./active-authority.ts";

/** ASCII letter or digit (not underscore). */
function isAsciiLetterOrDigit(ch: string | undefined): boolean {
  if (ch === undefined || ch.length !== 1) {
    return false;
  }
  const code = ch.charCodeAt(0);
  return (
    (code >= 48 && code <= 57) || // 0-9
    (code >= 65 && code <= 90) || // A-Z
    (code >= 97 && code <= 122) // a-z
  );
}

/** ASCII word char for portable-hardcode token edges: letter, digit, or underscore. */
function isAsciiWordChar(ch: string | undefined): boolean {
  return isAsciiLetterOrDigit(ch) || ch === "_";
}

/**
 * Case-insensitive literal match for a configured forbidden token.
 * Word-led tokens require a non-word (or start) left edge. Tokens ending in an
 * ASCII letter or digit require a non-word (or end) right edge. A trailing
 * underscore is an intentional prefix terminator and does not require a right
 * edge (e.g. `dream_team_` still matches `dream_team_review`). Punctuation-led
 * or punctuation-ended tokens keep plain literal detection (e.g. `.github/`).
 */
function containsForbiddenPortableHardcodeToken(
  text: string,
  token: string,
): boolean {
  const haystack = text.toLowerCase();
  const needle = token.toLowerCase();
  if (needle.length === 0 || needle.length > haystack.length) {
    return false;
  }
  const requireLeftBoundary = isAsciiWordChar(needle[0]);
  const last = needle[needle.length - 1];
  // Right edge only for letter/digit ends; trailing `_` keeps prefix semantics.
  const requireRightBoundary = isAsciiLetterOrDigit(last);
  let from = 0;
  while (from <= haystack.length - needle.length) {
    const idx = haystack.indexOf(needle, from);
    if (idx === -1) {
      return false;
    }
    const leftOk =
      !requireLeftBoundary ||
      idx === 0 ||
      !isAsciiWordChar(haystack[idx - 1]);
    const after = idx + needle.length;
    const rightOk =
      !requireRightBoundary ||
      after === haystack.length ||
      !isAsciiWordChar(haystack[after]);
    if (leftOk && rightOk) {
      return true;
    }
    from = idx + 1;
  }
  return false;
}

function validateChangeReadySdlcSkill(
  ctx: ValidationContext,
  root: string,
  file: string,
  text: string,
  description: string | null,
): void {
  const relative = toPosixPath(path.relative(root, file));
  if (relative !== CHANGE_READY_SDLC_SKILL_RELATIVE_PATH) {
    ctx.addError(
      `change-ready-sdlc skill path mismatch: expected ${CHANGE_READY_SDLC_SKILL_RELATIVE_PATH}, got ${relative}`,
    );
  }

  if (description) {
    for (const term of CHANGE_READY_SDLC_DESCRIPTION_TERMS) {
      if (!description.includes(term)) {
        ctx.addError(
          `change-ready-sdlc description missing discovery term '${term}': ${file}`,
        );
      }
    }
  }

  const scan = scanOperativeTextOutsideFences(text);
  if (scan.unsupportedFenceLine != null) {
    ctx.addError(
      `change-ready-sdlc contains unsupported non-top-level fenced-code syntax at line ${scan.unsupportedFenceLine}: ${file}`,
    );
    return;
  }
  const operative = scan.operativeText;

  for (const marker of CHANGE_READY_SDLC_LIFECYCLE_MARKERS) {
    if (!operative.includes(marker)) {
      ctx.addError(
        `change-ready-sdlc missing lifecycle marker '${marker}': ${file}`,
      );
    }
  }

  for (const token of CHANGE_READY_SDLC_CONTINUATION_TOKENS) {
    if (!operative.includes(token)) {
      ctx.addError(
        `change-ready-sdlc missing continuation token '${token}': ${file}`,
      );
    }
  }

  // Forbidden portable-hardcode policy remains full-document (including fences/examples).
  for (const token of CHANGE_READY_SDLC_FORBIDDEN_TOKENS) {
    if (containsForbiddenPortableHardcodeToken(text, token)) {
      ctx.addError(
        `change-ready-sdlc forbidden portable-hardcode token '${token}': ${file}`,
      );
    }
  }
}

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

    if (folderName === CHANGE_READY_SDLC_SKILL_NAME) {
      validateChangeReadySdlcSkill(ctx, root, file, text, description);
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
