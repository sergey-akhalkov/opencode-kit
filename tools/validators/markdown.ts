import fs from "node:fs";
import path from "node:path";
import type { ValidationContext } from "./context.ts";
import { toPosixPath } from "./context.ts";
import { getNestedFrontmatterString } from "./frontmatter.ts";

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
    "Happy Path",
    "Happy-Path Proof",
    "Risk Discovery",
    "Negative Tests",
    "Harden",
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
    [
      "AGENTS.md",
      "REPO_AGENTS.md",
      "README.md",
      "global/AGENTS.md",
      "templates/project/AGENTS.md",
    ].includes(relative);
  // Generated OpenSpec skills are not repository-owned; skip only the foreign workflow warning.
  // Eligibility requires actual nested metadata.generatedBy from leading frontmatter only
  // (not body text and not a literal top-level dotted key).
  let isGeneratedOpenSpecSkill = false;
  if (/^\.opencode\/skills\/openspec-[^/]+\/SKILL\.md$/.test(relative)) {
    const generatedBy = getNestedFrontmatterString(text, "metadata", "generatedBy");
    isGeneratedOpenSpecSkill = generatedBy != null;
  }
  if (isInstructionArtifact) {
    for (const reference of legacyToolingReferences) {
      if (text.includes(reference)) {
        ctx.addError(`Legacy non-TypeScript tooling reference '${reference}' found in ${file}`);
      }
    }
  }

  const implementationLanguage =
    /\b(implement|make code changes?|write code|fixes are allowed|edit workers?|write scope|make the smallest correct change)\b/i;
  const negatedScopeLanguage =
    /\b(non-goals?|out of scope|not in scope|excluded|do not|must not|never)\b/i;
  const mentionsImplementation = lines.some(
    (line) => implementationLanguage.test(line) && !negatedScopeLanguage.test(line),
  );
  const mentionsRiskDrivenWorkflow =
    /\b(Universal Development Loop|happy[- ]path|risk[- ]driven|risk discovery|fresh-context testing subagent|testing subagent|negative\/end-to-end|negative and end-to-end)\b/is.test(text);

  if (
    isInstructionArtifact &&
    !isGeneratedOpenSpecSkill &&
    mentionsImplementation &&
    !mentionsRiskDrivenWorkflow
  ) {
    ctx.addWarning(`Implementation-related artifact language lacks happy-path-first risk-driven testing guidance: ${file}`);
  }
  const staleTestOrdering =
    /\b(tests?|fixtures?|harness(?:es)?|scenarios?|benchmarks?|golden vectors?)[^.\n]{0,160}\b(authored|updated|ready|written|added|created|put)?[^.\n]{0,80}\b(before|prior to|precede(?:s|d)?)\b[^.\n]{0,100}\b(implementation|code|coding|fix(?:es)?)\b/i;
  const supersededStaleOrdering =
    /\b(superseded|historical|obsolete|deprecated|must not be followed|do not follow (?:this|the) (?:old )?(?:rule|requirement|guidance)|not (?:an )?active (?:rule|requirement|guidance))\b/i;
  const staleOrderingClauses = lines.flatMap((line) =>
    line.split(/(?<=[.!?;])\s+|,\s+|\s+(?:but|however)\s+/i),
  );
  const hasActiveStaleTestOrdering = staleOrderingClauses.some(
    (clause) => staleTestOrdering.test(clause) && !supersededStaleOrdering.test(clause),
  );
  if (isInstructionArtifact && hasActiveStaleTestOrdering) {
    ctx.addError(
      `Instruction artifact requires automated test work before observable happy-path proof: ${file}`,
    );
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
