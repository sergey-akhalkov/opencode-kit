import path from "node:path";
import type { ValidationContext } from "./context.ts";
import {
  compareCatalog,
  directoryExists,
  fileExists,
  getCatalogEntries,
  getRequiredHeadingSection,
  isPlainRecord,
  readJsonRecord,
  readText,
  requireBulletedSection,
  requireDirectory,
  requireFile,
  requireTextContains,
} from "./context.ts";

function readPackageScripts(
  ctx: ValidationContext,
  root: string,
): Record<string, string> {
  const packagePath = path.join(root, "package.json");
  if (!fileExists(packagePath)) {
    ctx.addError(`Missing package.json for opencode-dev-kit tooling: ${packagePath}`);
    return {};
  }
  const parsed = readJsonRecord(ctx, packagePath);
  if (!parsed || !isPlainRecord(parsed.scripts) || !parsed.scripts) {
    ctx.addError(`package.json must define scripts for opencode-dev-kit tooling: ${packagePath}`);
    return {};
  }
  const scripts: Record<string, string> = {};
  for (const [name, value] of Object.entries(parsed.scripts)) {
    if (typeof value === "string") {
      scripts[name] = value;
    }
  }
  return scripts;
}

export function validateDevKitContract(ctx: ValidationContext, root: string): void {
  requireFile(ctx, root, "instructions/universal-development-loop.md", "Universal Development Loop instruction");
  requireFile(ctx, root, "templates/project/AGENTS.md", "project AGENTS.md template");
  requireFile(ctx, root, "templates/project/opencode.json", "project opencode.json template");
  requireFile(ctx, root, "templates/project/validation.md", "project validation template");
  requireFile(ctx, root, "templates/project/adapter.json", "project adapter template");
  requireFile(ctx, root, "templates/ci/github-actions.yml", "CI template");
  requireDirectory(ctx, root, "profiles", "install profiles directory");
  requireFile(ctx, root, "profiles/all.json", "all install profile");
  requireFile(ctx, root, "tools/init-project.ts", "project bootstrap tool");
  requireFile(ctx, root, "tools/doctor.ts", "doctor tool");
  requireFile(ctx, root, "tools/project-inventory.ts", "project inventory tool");
  requireFile(
    ctx,
    root,
    "tools/instruction-artifacts-inventory.ts",
    "instruction inventory tool",
  );
  requireFile(ctx, root, "tools/pre-push-validate.ts", "pre-push validation tool");
  requireFile(ctx, root, ".githooks/pre-push", "tracked pre-push hook");

  const universalLoop = path.join(root, "instructions", "universal-development-loop.md");
  if (fileExists(universalLoop)) {
    const text = readText(universalLoop);
    for (const required of [
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
    ]) {
      requireTextContains(ctx, text, required, "Universal Development Loop", universalLoop);
    }
  }

  const projectTemplate = path.join(root, "templates", "project", "AGENTS.md");
  if (fileExists(projectTemplate)) {
    const projectTemplateText = readText(projectTemplate);
    requireTextContains(
      ctx,
      projectTemplateText,
      "Universal Development Loop",
      "project AGENTS.md template",
      projectTemplate,
    );
    requireTextContains(
      ctx,
      projectTemplateText,
      "Do not commit, push, merge, delete source artifacts, or alter remote state unless explicitly requested",
      "project AGENTS.md remote/destructive guard",
      projectTemplate,
    );
  }

  const projectFeedbackTemplate = path.join(
    root,
    "templates",
    "project",
    "docs",
    "feedbacks",
    "README.md",
  );
  if (fileExists(projectFeedbackTemplate)) {
    ctx.addError(
      `Project feedback README template must be deleted; init-project copies the kit-level docs/feedbacks/README.md directly: ${projectFeedbackTemplate}`,
    );
  }

  const adapterTemplate = path.join(root, "templates", "project", "adapter.json");
  if (fileExists(adapterTemplate)) {
    const adapter = readJsonRecord(ctx, adapterTemplate);
    if (adapter) {
      if (adapter.schemaVersion !== 1) {
        ctx.addError(`Project adapter template must use schemaVersion 1: ${adapterTemplate}`);
      }
      if (!isPlainRecord(adapter.validation)) {
        ctx.addError(
          `Project adapter template must define validation commands object: ${adapterTemplate}`,
        );
      }
    }
  }

  const opencodeTemplate = path.join(root, "templates", "project", "opencode.json");
  if (fileExists(opencodeTemplate)) {
    const config = readJsonRecord(ctx, opencodeTemplate);
    if (config && config.$schema !== "https://opencode.ai/config.json") {
      ctx.addError(`Project opencode.json template must declare the OpenCode schema: ${opencodeTemplate}`);
    }
  }

  const readmePath = path.join(root, "README.md");
  if (fileExists(readmePath)) {
    const readme = readText(readmePath);
    for (const heading of [
      "What This Is",
      "Universal Development Loop",
      "Install",
      "Bootstrap A Project",
      "Token Economy",
      "Validate",
    ]) {
      requireTextContains(ctx, readme, `## ${heading}`, "README opencode-dev-kit quickstart", readmePath);
    }
    requireTextContains(ctx, readme, "opencode-dev-kit", "README product framing", readmePath);
  }

  const scripts = readPackageScripts(ctx, root);
  for (const script of [
    "install:global",
    "init:project",
    "doctor",
    "project:inventory",
    "instruction:inventory",
    "instruction:feedback",
    "code-quality:inventory",
    "openspec:validate",
    "openspec:gate",
    "prepush:validate",
    "validate",
    "validate:strict",
    "test",
  ]) {
    if (!scripts[script]) {
      ctx.addError(`package.json missing required opencode-dev-kit script '${script}'`);
    }
  }
  if (scripts["openspec:validate"] && scripts["openspec:validate"] !== "openspec validate --all") {
    ctx.addError("package.json script 'openspec:validate' must run openspec validate --all.");
  }
  if (scripts["openspec:gate"] && scripts["openspec:gate"] !== "node tools/openspec-operation-gate.ts") {
    ctx.addError("package.json script 'openspec:gate' must run node tools/openspec-operation-gate.ts.");
  }
  if (
    scripts["instruction:feedback"] &&
    scripts["instruction:feedback"] !== "node tools/instruction-feedback-ledger.ts"
  ) {
    ctx.addError(
      "package.json script 'instruction:feedback' must run node tools/instruction-feedback-ledger.ts.",
    );
  }
  if (
    scripts.test &&
    !/(^|&&)\s*node\s+tools\/test-instruction-feedback-ledger\.ts(\s|$|&&)/.test(scripts.test)
  ) {
    ctx.addError("package.json script 'test' must include node tools/test-instruction-feedback-ledger.ts.");
  }
  if (
    scripts.test &&
    !/(^|&&)\s*node\s+tools\/test-install-opencode-global\.ts(\s|$|&&)/.test(scripts.test)
  ) {
    ctx.addError("package.json script 'test' must include node tools/test-install-opencode-global.ts.");
  }
  if (scripts["validate:strict"] && !scripts["validate:strict"].includes("--fail-on-warnings")) {
    ctx.addError("package.json script 'validate:strict' must pass --fail-on-warnings.");
  }
}

export function validatePackageScriptsTypeScriptOnly(
  ctx: ValidationContext,
  root: string,
): void {
  const packagePath = path.join(root, "package.json");
  if (!fileExists(packagePath)) {
    return;
  }
  const parsed = readJsonRecord(ctx, packagePath);
  if (!parsed || !isPlainRecord(parsed.scripts) || !parsed.scripts) {
    return;
  }
  for (const [name, value] of Object.entries(parsed.scripts)) {
    if (typeof value !== "string") {
      continue;
    }
    if (
      /(^|\s)(pwsh|powershell)(\s|$)|\.(ps1|psd1|psm1|py|pyw|js|cjs|mjs)\b/i.test(value)
    ) {
      ctx.addError(
        `Package script '${name}' must use TypeScript tooling, not PowerShell, Python, or JavaScript entrypoints: ${packagePath}`,
      );
    }
  }
}

export function validateInstructionFeedbackContracts(ctx: ValidationContext, root: string): void {
  const helperPath = path.join(root, "tools", "instruction-feedback-ledger.ts");
  if (fileExists(helperPath)) {
    const helperText = readText(helperPath);
    for (const required of [
      "--add",
      "--pending",
      "--decay-report",
      "--check-bloat",
      "--replay-pending",
      "duplicate",
      "routeRuleWrite",
      "unsupportedRequest",
    ]) {
      requireTextContains(
        ctx,
        helperText,
        required,
        "instruction-feedback ledger helper CLI surface",
        helperPath,
      );
    }
  }
}

export function validateInstallerConfigDirModel(ctx: ValidationContext, root: string): void {
  const installerPath = path.join(root, "tools", "install-opencode-global.ts");
  if (!fileExists(installerPath)) {
    return;
  }
  const text = readText(installerPath);
  if (!text.includes("OPENCODE_CONFIG_DIR")) {
    ctx.addError(
      "install-opencode-global must point OPENCODE_CONFIG_DIR at the repository global/ directory (config-dir pointing model, not file copy).",
    );
  }
  if (!text.includes('"global"') && !text.includes("'global'") && !text.includes("`global`")) {
    ctx.addError(
      "install-opencode-global must reference the repository global/ directory as the OPENCODE_CONFIG_DIR target.",
    );
  }
  const globalDir = path.join(root, "global");
  if (!directoryExists(globalDir)) {
    ctx.addError(`Missing global config directory: ${globalDir}`);
    return;
  }
  for (const required of ["skills", "agents", "AGENTS.md", "opencode.json.template"]) {
    const candidate = path.join(globalDir, required);
    if (!fileExists(candidate) && !directoryExists(candidate)) {
      ctx.addError(`Missing global/${required}: the OPENCODE_CONFIG_DIR target must contain it.`);
    }
  }
}

export function validateRepoAgentsMd(ctx: ValidationContext, root: string): void {
  const agentsPath = path.join(root, "REPO_AGENTS.md");
  if (!fileExists(agentsPath)) {
    ctx.addError(`Missing REPO_AGENTS.md: ${agentsPath}`);
    return;
  }

  const legacyAgentsPath = path.join(root, "AGENTS.md");
  if (fileExists(legacyAgentsPath)) {
    ctx.addError(
      `Root-level AGENTS.md must be renamed to REPO_AGENTS.md to keep the runtime instruction file (global/AGENTS.md) unambiguous: ${legacyAgentsPath}`,
    );
  }

  const agentsText = readText(agentsPath);
  requireTextContains(
    ctx,
    agentsText,
    "## Autonomous Work Contract",
    "REPO_AGENTS.md autonomous work contract",
    agentsPath,
  );
  requireTextContains(
    ctx,
    agentsText,
    "Ask the user only",
    "REPO_AGENTS.md autonomous work contract",
    agentsPath,
  );
  requireTextContains(
    ctx,
    agentsText,
    "## Completion Handoff",
    "REPO_AGENTS.md completion handoff contract",
    agentsPath,
  );
  requireTextContains(
    ctx,
    agentsText,
    "`question`",
    "REPO_AGENTS.md completion handoff contract",
    agentsPath,
  );
  requireTextContains(
    ctx,
    agentsText,
    "(Recommended)",
    "REPO_AGENTS.md completion handoff contract",
    agentsPath,
  );
  requireTextContains(
    ctx,
    agentsText,
    "Follow-up Candidates",
    "REPO_AGENTS.md completion handoff contract",
    agentsPath,
  );
  requireTextContains(
    ctx,
    agentsText,
    "Residual Risks",
    "REPO_AGENTS.md evidence-only reviewer handoff contract",
    agentsPath,
  );
  requireTextContains(
    ctx,
    agentsText,
    "Blocking Evidence",
    "REPO_AGENTS.md closed-world reviewer handoff contract",
    agentsPath,
  );
  requireTextContains(
    ctx,
    agentsText,
    "post-freeze scope may only shrink",
    "REPO_AGENTS.md closed-world scope firewall",
    agentsPath,
  );
  requireTextContains(
    ctx,
    agentsText,
    "never authorize scope expansion",
    "REPO_AGENTS.md closed-world scope firewall",
    agentsPath,
  );
  requireTextContains(
    ctx,
    agentsText,
    "## TypeScript Development",
    "REPO_AGENTS.md TypeScript-only development policy",
    agentsPath,
  );
  requireTextContains(
    ctx,
    agentsText,
    "TypeScript",
    "REPO_AGENTS.md TypeScript-only development policy",
    agentsPath,
  );
  requireTextContains(
    ctx,
    agentsText,
    "PowerShell",
    "REPO_AGENTS.md TypeScript-only development policy",
    agentsPath,
  );
  requireTextContains(
    ctx,
    agentsText,
    "Python",
    "REPO_AGENTS.md TypeScript-only development policy",
    agentsPath,
  );
  requireTextContains(
    ctx,
    agentsText,
    "JavaScript",
    "REPO_AGENTS.md TypeScript-only development policy",
    agentsPath,
  );
  requireTextContains(
    ctx,
    agentsText,
    "## Deterministic Helper Automation",
    "REPO_AGENTS.md deterministic helper automation policy",
    agentsPath,
  );
  requireTextContains(
    ctx,
    agentsText,
    "repetitive, evidence-heavy",
    "REPO_AGENTS.md deterministic helper automation policy",
    agentsPath,
  );
  requireTextContains(
    ctx,
    agentsText,
    "no hidden heuristics",
    "REPO_AGENTS.md deterministic helper automation policy",
    agentsPath,
  );
  requireTextContains(
    ctx,
    agentsText,
    "explicit inputs",
    "REPO_AGENTS.md deterministic helper automation policy",
    agentsPath,
  );
  requireTextContains(
    ctx,
    agentsText,
    "explicit outputs",
    "REPO_AGENTS.md deterministic helper automation policy",
    agentsPath,
  );
  requireTextContains(
    ctx,
    agentsText,
    "privacy-safe output",
    "REPO_AGENTS.md deterministic helper automation policy",
    agentsPath,
  );
  requireTextContains(
    ctx,
    agentsText,
    "fuzzy scoring",
    "REPO_AGENTS.md deterministic helper automation policy",
    agentsPath,
  );
  requireTextContains(
    ctx,
    agentsText,
    "model-like summarization",
    "REPO_AGENTS.md deterministic helper automation policy",
    agentsPath,
  );
  for (const fallback of ["unknown", "unreadable", "unsupported", "blocked"]) {
    requireTextContains(
      ctx,
      agentsText,
      fallback,
      "REPO_AGENTS.md deterministic helper automation fallback policy",
      agentsPath,
    );
  }
  requireTextContains(
    ctx,
    agentsText,
    "npm run instruction:feedback -- --add",
    "REPO_AGENTS.md prevention feedback ledger handoff",
    agentsPath,
  );
  requireTextContains(
    ctx,
    agentsText,
    "applied -> replayed -> resolved",
    "REPO_AGENTS.md replay gate policy",
    agentsPath,
  );
  requireTextContains(
    ctx,
    agentsText,
    "## Feedback Ledger",
    "REPO_AGENTS.md feedback ledger policy",
    agentsPath,
  );
  requireTextContains(
    ctx,
    agentsText,
    "complain",
    "REPO_AGENTS.md feedback ledger policy",
    agentsPath,
  );
  requireTextContains(
    ctx,
    agentsText,
    "docs/feedbacks",
    "REPO_AGENTS.md feedback ledger policy",
    agentsPath,
  );
  requireTextContains(
    ctx,
    agentsText,
    "Recurrence: unknown",
    "REPO_AGENTS.md feedback ledger policy",
    agentsPath,
  );

  if (
    /after (a )?non-trivial user-visible work( cycle)?,? (the main session offers|offer|use the built-in `?question`?|before stopping)/i.test(
      agentsText,
    )
  ) {
    ctx.addError(`REPO_AGENTS.md must not require routine post-task question handoff: ${agentsPath}`);
  }
}

export function validateReadme(
  ctx: ValidationContext,
  root: string,
  skillNames: string[],
  agentNames: string[],
  instructionNames: string[],
): void {
  const readmePath = path.join(root, "README.md");
  if (!fileExists(readmePath)) {
    ctx.addError(`Missing README.md: ${readmePath}`);
    return;
  }

  const readmeText = readText(readmePath);
  const routingMap = getRequiredHeadingSection(
    ctx,
    readmeText,
    "Routing Map",
    readmePath,
  );
  const reviewerGateMap = getRequiredHeadingSection(
    ctx,
    readmeText,
    "Reviewer Gate Map",
    readmePath,
  );
  requireBulletedSection(ctx, routingMap, "README routing map", readmePath);
  requireBulletedSection(ctx, reviewerGateMap, "README reviewer gate map", readmePath);
  requireTextContains(
    ctx,
    routingMap,
    "instruction-artifact-tuning",
    "README instruction-artifact route",
    readmePath,
  );
  requireTextContains(
    ctx,
    routingMap,
    "instruction-artifact-audit-runbook.md",
    "README instruction-artifact route",
    readmePath,
  );
  requireTextContains(
    ctx,
    reviewerGateMap,
    "instruction-artifact-reviewer",
    "README reviewer gate map",
    readmePath,
  );
  compareCatalog(
    ctx,
    "Skill",
    skillNames,
    getCatalogEntries(readmeText, "Skill Catalog", "Agent Catalog", readmePath),
    readmePath,
  );
  compareCatalog(
    ctx,
    "Agent",
    agentNames,
    getCatalogEntries(readmeText, "Agent Catalog", "Instruction Templates", readmePath),
    readmePath,
  );
  compareCatalog(
    ctx,
    "Instruction template",
    instructionNames,
    getCatalogEntries(readmeText, "Instruction Templates", "Porting Notes", readmePath),
    readmePath,
  );
}
