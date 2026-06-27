import fs from "node:fs";
import path from "node:path";
import type { ValidationContext } from "./context.ts";
import { toPosixPath } from "./context.ts";

const forbiddenCodeExtensions = new Set([
  ".cjs",
  ".js",
  ".mjs",
  ".ps1",
  ".psd1",
  ".psm1",
  ".py",
  ".pyw",
]);

const legacyToolingReferences = [
  "pwsh -NoProfile -File",
  "validate-library.ps1",
  "test-library.ps1",
  "install-opencode-global.js",
];

export function validateTypeScriptOnlySourceFiles(
  ctx: ValidationContext,
  root: string,
  walkRepositoryFiles: (root: string) => string[],
): void {
  for (const file of walkRepositoryFiles(root)) {
    const extension = path.extname(file).toLowerCase();
    if (forbiddenCodeExtensions.has(extension)) {
      ctx.addError(
        `Non-TypeScript source/tooling file is not allowed: ${toPosixPath(path.relative(root, file))}`,
      );
    }
  }
}

export function jsonReplacementForAutomationMarkdown(relative: string): string | null {
  const openspecMatch = relative.match(/^(openspec\/changes\/[^/]+\/automation\/.+)\.md$/);
  if (openspecMatch) {
    return `${openspecMatch[1]}.json`;
  }
  return null;
}

export function validateUniversalDevelopmentLoopSingleSource(
  ctx: ValidationContext,
  relative: string,
  text: string,
  file: string,
): void {
  const canonicalRelative = "instructions/universal-development-loop.md";
  if (relative === canonicalRelative) {
    return;
  }

  const stepNames = [
    "Intake",
    "Evidence",
    "Baseline Proof",
    "Small Slice",
    "Test First",
    "Implement",
    "Focused Validation",
    "Review Gate",
    "Final Validation",
    "Handoff",
    "Process Improvement",
  ];

  const numberedStepPattern = /^\s*\d+\.\s+`([A-Z][A-Za-z ]+)`:/;
  const numberedSteps = new Set<string>();
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(numberedStepPattern);
    if (match && stepNames.includes(match[1])) {
      numberedSteps.add(match[1]);
    }
  }
  if (numberedSteps.size >= 6) {
    ctx.addError(
      `Universal Development Loop step list must only appear in ${canonicalRelative}; restated step list found in ${relative} (${numberedSteps.size} canonical steps). Replace with a pointer paragraph to the canonical file.`,
    );
  }

  const arrowLinePattern =
    /(?:^|\s)([A-Z][A-Za-z ]+)\s*->\s*([A-Z][A-Za-z ]+)(?:\s*->\s*([A-Z][A-Za-z ]+))*/g;
  const arrowChainSteps = new Set<string>();
  for (const match of text.matchAll(arrowLinePattern)) {
    for (const segment of match[0].split("->")) {
      const trimmed = segment.replace(/^\s+|\s+$/g, "");
      if (stepNames.includes(trimmed)) {
        arrowChainSteps.add(trimmed);
      }
    }
  }
  if (arrowChainSteps.size >= 6) {
    ctx.addError(
      `Universal Development Loop inline chain must only appear in ${canonicalRelative}; restated chain found in ${relative} (${arrowChainSteps.size} canonical steps). Replace with a pointer paragraph to the canonical file.`,
    );
  }
}

export function validateMarkdownFile(
  ctx: ValidationContext,
  root: string,
  file: string,
  forbiddenAnchors: string[],
): void {
  const raw = fs.readFileSync(file, "utf8");
  const lines = raw.split(/\r?\n/);
  const text = lines.join("\n");
  const relative = toPosixPath(path.relative(root, file));
  const jsonReplacement = jsonReplacementForAutomationMarkdown(relative);
  if (jsonReplacement != null) {
    ctx.addError(
      `OpenSpec automation wrapper Markdown artifact is not allowed: ${relative}. Use ${jsonReplacement} with schemaVersion instead.`,
    );
  }

  for (let index = 0; index < lines.length; index++) {
    if (/[ \t]+$/.test(lines[index])) {
      ctx.addError(`Trailing whitespace: ${file}:${index + 1}`);
    }
  }

  for (const anchor of forbiddenAnchors) {
    if (anchor.trim() !== "" && text.includes(anchor)) {
      ctx.addError(`Forbidden anchor '${anchor}' found in ${file}`);
    }
  }

  validateUniversalDevelopmentLoopSingleSource(ctx, relative, text, file);

  const isInstructionArtifact =
    /^(?:global|\.opencode)\/(skills|agents)\//.test(relative) ||
    /^instructions\//.test(relative) ||
    ["AGENTS.md", "REPO_AGENTS.md", "README.md"].includes(relative);
  if (isInstructionArtifact) {
    for (const reference of legacyToolingReferences) {
      if (text.includes(reference)) {
        ctx.addError(`Legacy non-TypeScript tooling reference '${reference}' found in ${file}`);
      }
    }
  }

  const implementationLanguage =
    /\b(implement|implementation|code changes?|behavior-changing|behavior changes?|fixes are allowed|edit workers?|write scope|make the smallest correct change)\b/i;
  const negatedScopeLanguage =
    /\b(non-goals?|out of scope|not in scope|excluded|do not|must not|never)\b/i;
  const mentionsImplementation = lines.some(
    (line) => implementationLanguage.test(line) && !negatedScopeLanguage.test(line),
  );
  const mentionsTdd =
    /\b(TDD|test-first|validation-first|tests? before|failing tests?[^.\n]{0,80}\bbefore\b|(?:tests?|benchmarks?|manual gates?|golden vectors?|fixtures?)[^.\n]{0,120}\bbefore\b|\bbefore\b[^.\n]{0,120}(?:tests?|benchmarks?|manual gates?|golden vectors?|fixtures?))\b/is.test(
      text,
    );

  if (isInstructionArtifact && mentionsImplementation && !mentionsTdd) {
    ctx.addWarning(`Implementation-related artifact language lacks TDD/test-first language: ${file}`);
  }
  if (
    isInstructionArtifact &&
    /after (a )?non-trivial user-visible work( cycle)?,? (the main session offers|offer|use the built-in `?question`?|before stopping)/i.test(
      text,
    )
  ) {
    ctx.addError(
      `Instruction artifact must not require routine post-task question handoff: ${file}`,
    );
  }
  if (
    isInstructionArtifact &&
    /(^#{2,4}\s+.*Self-Improvement\s*$|Self-improvement while context is hot|Core principle\s+[-\u2014]\s+do not remove)/im.test(
      text,
    )
  ) {
    ctx.addError(
      `Instruction artifact must not include automatic self-improvement/self-edit loops: ${file}`,
    );
  }
  if (isInstructionArtifact && /\bshared URLs?\b/i.test(text)) {
    const hasSharedUrlApproval =
      /user-approved shared URLs?/i.test(text) ||
      /fetch remote\/shared URLs?.{0,160}(explicitly grants|explicit permission|user approved|user-approved|approved)/is.test(
        text,
      );
    const hasSharedUrlProhibition =
      /(never|do not|must not|out of scope|exclude|excluded|not in scope).{0,120}shared URLs?/is.test(
        text,
      ) ||
      /shared URLs?.{0,120}(out of scope|excluded|not in scope|must not|never)/is.test(text);
    if (!hasSharedUrlApproval && !hasSharedUrlProhibition) {
      ctx.addError(
        `Instruction artifact mentioning shared URLs must require user-approved remote/shared URL access: ${file}`,
      );
    }
  }
}
