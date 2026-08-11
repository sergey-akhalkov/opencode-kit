import fs from "node:fs";
import path from "node:path";

import {
  SKILL_DESCRIPTION_MAX_CHARS,
  SKILL_NAME_PATTERN,
  SKILL_OUTPUT_CONTRACT_PATTERN,
} from "./contracts/skills.ts";
import {
  assert,
  assertEqual,
  libraryRoot,
  type TestCase,
} from "./test-helpers/library.ts";

const root = libraryRoot;

const SKILL_RELATIVE = "global/skills/deduplication-audit/SKILL.md";
const COMMAND_RELATIVE = "global/commands/dedup.md";
const PROFILE_RELATIVE = "profiles/all.json";
const README_RELATIVE = "README.md";
const PACKAGE_RELATIVE = "package.json";
const PACKAGE_LOCK_RELATIVE = "package-lock.json";
const CODE_QUALITY_REVIEWER_RELATIVE = "global/agents/code-quality-reviewer.md";
const DEDUPLICATOR_RELATIVE = "global/agents/deduplicator.md";
const UPSTREAM_JSCPD_SKILL_RELATIVE = "global/skills/jscpd/SKILL.md";
const UPSTREAM_DRY_REFACTORING_SKILL_RELATIVE = "global/skills/dry-refactoring/SKILL.md";

const CLOSED_CLASSIFICATIONS = [
  "exact duplicate",
  "near duplicate",
  "overlapping responsibility",
  "redundant wrapper",
  "keep separate by design",
  "not proven",
] as const;

const CLOSED_RECOMMENDATIONS = [
  "remove",
  "reuse",
  "extract",
  "parameterize",
  "keep separate",
] as const;

const REQUIRED_OUTPUT_FIELDS = [
  "Scope",
  "Tool Evidence",
  "Candidate Matrix",
  "Reviewer Evidence",
  "No Safe Reduction",
  "Audit Effects",
] as const;

const REQUIRED_MATRIX_FIELDS = [
  "classification and exact locations",
  "canonical owner or `unknown`",
  "contract, error, effect, and lifecycle differences",
  "callers and tests inspected",
  "retained critical/compatibility test oracles",
  "remove | reuse | extract | parameterize | keep separate",
  "estimated net line delta and net concept delta",
  "coupling/public-surface effect",
  "confidence and evidence gaps",
  "required Runtime Proof before any later production change",
] as const;

const EXCLUSION_GLOBS = [
  "**/node_modules/**",
  "**/vendor/**",
  "**/generated/**",
  "**/dist/**",
  "**/build/**",
  "**/coverage/**",
  "**/.cache/**",
  "**/out/**",
  "**/target/**",
] as const;

const SEMANTIC_PROOF_MARKERS = [
  "never prove semantic equivalence",
  "Exact and near textual clones are candidate locations only",
  "A non-zero process exit is a failed scan, not \"no duplicates\"",
] as const;

const READ_ONLY_SKILL_MARKERS = [
  "This workflow is read-only",
  "never edits production",
  "Do not write `.jscpd.json`",
  "End the audit before mutation",
] as const;

const READ_ONLY_COMMAND_MARKERS = [
  "Load the `deduplication-audit` skill",
  "$ARGUMENTS",
  "Do not edit production",
  "remove a unique critical/compatibility test oracle",
  "escalate into `codebase-audit-loop`",
] as const;

type ContractFinding = { artifact: string; missing: string };

function readRepo(relative: string): string {
  return fs.readFileSync(path.join(root, relative), "utf8");
}

function existsRepo(relative: string): boolean {
  return fs.existsSync(path.join(root, relative));
}

function parseFrontmatter(text: string): { name?: string; description?: string; body: string } {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  assert(match != null, "Skill must use YAML frontmatter delimited by ---.");
  const raw = match[1] ?? "";
  const body = match[2] ?? "";
  const name = raw.match(/^name:\s*(.+)\s*$/m)?.[1]?.trim();
  const description = raw.match(/^description:\s*(.+)\s*$/m)?.[1]?.trim();
  return { name, description, body };
}

function assertTokens(text: string, tokens: readonly string[], message: string): void {
  for (const token of tokens) {
    assert(text.includes(token), `${message}: missing ${JSON.stringify(token)}`);
  }
}

function missingTokens(text: string, tokens: readonly string[]): string[] {
  return tokens.filter((token) => !text.includes(token));
}

/** Structural skill contract. Behavioral classification is not proven by these markers. */
function skillContractFindings(skillText: string, artifact = SKILL_RELATIVE): ContractFinding[] {
  const findings: ContractFinding[] = [];
  const add = (missing: string): void => {
    findings.push({ artifact, missing });
  };

  const fm = parseFrontmatter(skillText);
  if (fm.name !== "deduplication-audit") add("frontmatter name: deduplication-audit");
  if (fm.name == null || !SKILL_NAME_PATTERN.test(fm.name)) add("valid skill name pattern");
  if (fm.description == null || fm.description.length === 0) add("non-empty description");
  if ((fm.description?.length ?? 0) > SKILL_DESCRIPTION_MAX_CHARS) add("description length <= max");
  if (fm.description != null && !/ONLY for explicit \/dedup|scoped duplication|clone analysis/i.test(fm.description)) {
    add("lazy explicit-trigger description");
  }
  if (!SKILL_OUTPUT_CONTRACT_PATTERN.test(skillText)) add("## Output / Return contract");

  for (const token of SEMANTIC_PROOF_MARKERS) {
    if (!skillText.includes(token)) add(`semantic-proof protection: ${token}`);
  }
  for (const token of READ_ONLY_SKILL_MARKERS) {
    if (!skillText.includes(token)) add(`read-only marker: ${token}`);
  }
  // Mentions of --no-gitignore are allowed only as an explicit forbid ("never pass").
  const noGitignoreMentions = skillText.match(/--no-gitignore/g) ?? [];
  const forbidsNoGitignore =
    skillText.includes("never pass `--no-gitignore`") || skillText.includes("never pass --no-gitignore");
  if (noGitignoreMentions.length > 0 && !forbidsNoGitignore) {
    add("must not instruct --no-gitignore without forbid");
  }
  if (!forbidsNoGitignore && !skillText.includes("Preserve default `.gitignore`")) {
    add("gitignore preserved");
  }
  if (/pass `--no-gitignore`|pass --no-gitignore/i.test(skillText) && !/never pass/i.test(skillText)) {
    add("must not enable --no-gitignore");
  }
  for (const glob of EXCLUSION_GLOBS) {
    if (!skillText.includes(glob)) add(`exclusion glob: ${glob}`);
  }
  for (const classification of CLOSED_CLASSIFICATIONS) {
    if (!skillText.includes(classification)) add(`classification: ${classification}`);
  }
  if (!skillText.includes("remove | reuse | extract | parameterize | keep separate")) {
    add("closed recommendations set");
  }
  for (const recommendation of CLOSED_RECOMMENDATIONS) {
    // each appears in closed set or prose
    if (!skillText.includes(`\`${recommendation}\``) && !skillText.includes(recommendation)) {
      add(`recommendation: ${recommendation}`);
    }
  }
  for (const field of REQUIRED_OUTPUT_FIELDS) {
    if (!skillText.includes(field)) add(`output field: ${field}`);
  }
  for (const field of REQUIRED_MATRIX_FIELDS) {
    if (!skillText.includes(field)) add(`matrix field: ${field}`);
  }
  if (!skillText.includes("Preserve every unique critical or compatibility test oracle")) {
    add("unique oracle retention");
  }
  if (!skillText.includes("Line reduction alone is insufficient")) {
    add("concept/coupling gate (line reduction alone insufficient)");
  }
  if (!skillText.includes("does not increase coupling")) {
    add("concept/coupling gate (no coupling increase)");
  }
  if (!skillText.includes("code-quality-reviewer")) add("reuse code-quality-reviewer");
  if (!skillText.includes("Do not create or invoke a `deduplicator` agent")) {
    add("forbid deduplicator agent");
  }
  if (!skillText.includes("main implements the smallest bounded production slice")) {
    add("main-only later mutation");
  }
  if (!skillText.includes("Clone disappearance is never Runtime Proof")) {
    add("clone disappearance is not Runtime Proof");
  }
  if (!skillText.includes("codebase-audit-loop") || !skillText.includes("only when the user separately requests exhaustive coverage")) {
    add("no automatic exhaustive codebase-audit-loop route");
  }
  if (!skillText.includes("Keep it unloaded for trivial owner-local fixes")) {
    add("trivial-fix opt-out");
  }
  if (!skillText.includes("do not install it or add a target-repository dependency")) {
    add("no repository jscpd install");
  }
  if (!skillText.includes("major version 5")) add("jscpd major version 5 gate");

  return findings;
}

/** Structural command contract. Loader expansion is not executed here. */
function commandContractFindings(commandText: string, artifact = COMMAND_RELATIVE): ContractFinding[] {
  const findings: ContractFinding[] = [];
  const add = (missing: string): void => {
    findings.push({ artifact, missing });
  };

  if (!commandText.includes("description:")) add("command frontmatter description");
  if (!commandText.includes("agent: build")) add("command agent: build");
  for (const token of READ_ONLY_COMMAND_MARKERS) {
    if (!commandText.includes(token)) add(`command marker: ${token}`);
  }
  // Full $ARGUMENTS must stand alone as scope intent, not shell flags.
  if (!/Treat the full text above as the requested scope, not as shell flags/.test(commandText)) {
    add("full $ARGUMENTS as scope intent (not shell flags)");
  }
  if (!commandText.includes("repository-contained paths")) add("repository-contained scope");
  if (!commandText.includes("install anything") && !commandText.includes("add a dependency")) {
    add("no install/dependency via command");
  }
  if (!commandText.includes("create an agent")) add("no create agent");
  // Must not authorize production edits.
  if (/\bedit production\b/i.test(commandText) && !/Do not edit production/i.test(commandText)) {
    add("must forbid production edits");
  }

  return findings;
}

function assertNoFindings(findings: ContractFinding[], label: string): void {
  if (findings.length === 0) return;
  const detail = findings.map((f) => `${f.artifact}: ${f.missing}`).join("\n");
  throw new Error(`${label}\n${detail}`);
}

function assertFindingsInclude(
  findings: ContractFinding[],
  needle: string | RegExp,
  label: string,
): void {
  const hit = findings.some((f) =>
    typeof needle === "string" ? f.missing.includes(needle) : needle.test(f.missing),
  );
  assert(hit, `${label}\nFindings:\n${findings.map((f) => `- ${f.missing}`).join("\n")}`);
}

function packageMentionsJscpd(): boolean {
  const packageJson = readRepo(PACKAGE_RELATIVE);
  if (/\bjscpd\b/.test(packageJson)) return true;
  if (!existsRepo(PACKAGE_LOCK_RELATIVE)) return false;
  return /\bjscpd\b/.test(readRepo(PACKAGE_LOCK_RELATIVE));
}

export const deduplicationContractTests: TestCase[] = [
  {
    name: "contracts: dedup skill frontmatter, path, and profile/catalog discovery",
    run: () => {
      assert(existsRepo(SKILL_RELATIVE), `${SKILL_RELATIVE} must exist`);
      assert(existsRepo(COMMAND_RELATIVE), `${COMMAND_RELATIVE} must exist`);
      assert(existsRepo(CODE_QUALITY_REVIEWER_RELATIVE), "code-quality-reviewer must remain present");
      assert(!existsRepo(DEDUPLICATOR_RELATIVE), "deduplicator agent must remain absent");

      const skill = readRepo(SKILL_RELATIVE);
      const fm = parseFrontmatter(skill);
      assertEqual(fm.name, "deduplication-audit", "Skill frontmatter name must match directory contract.");
      assert(SKILL_NAME_PATTERN.test(fm.name ?? ""), "Skill name must match SKILL_NAME_PATTERN.");
      assert(
        (fm.description?.length ?? 0) > 0 && (fm.description?.length ?? 0) <= SKILL_DESCRIPTION_MAX_CHARS,
        "Skill description must be non-empty and within max length.",
      );
      assert(
        /ONLY for explicit \/dedup/i.test(fm.description ?? ""),
        "Description must advertise explicit /dedup-only lazy trigger.",
      );

      const profile = JSON.parse(readRepo(PROFILE_RELATIVE)) as { skills: string[]; agents: string[] };
      assert(profile.skills.includes("deduplication-audit"), "profiles/all.json must list deduplication-audit.");
      assert(profile.agents.includes("code-quality-reviewer"), "profiles/all.json must keep code-quality-reviewer.");
      assert(!profile.agents.includes("deduplicator"), "profiles/all.json must not register deduplicator.");

      const readme = readRepo(README_RELATIVE);
      assert(
        readme.includes("`deduplication-audit`") && readme.includes("/dedup"),
        "README catalog must mention deduplication-audit and /dedup.",
      );

      assertNoFindings(skillContractFindings(skill), "Live skill failed structural contract.");
    },
  },
  {
    name: "contracts: dedup command forwards full $ARGUMENTS and stays read-only",
    run: () => {
      const command = readRepo(COMMAND_RELATIVE);
      assertNoFindings(commandContractFindings(command), "Live command failed structural contract.");
      // Ensure $ARGUMENTS is not stripped or replaced by a partial token.
      const argsMatches = command.match(/\$ARGUMENTS/g) ?? [];
      assertEqual(argsMatches.length, 1, "Command must contain exactly one $ARGUMENTS expansion site.");
      assert(
        command.indexOf("Load the `deduplication-audit` skill") < command.indexOf("$ARGUMENTS"),
        "Skill load instruction must precede $ARGUMENTS scope body.",
      );
    },
  },
  {
    name: "contracts: dedup skill keeps jscpd candidate-only + scan/exclusion + closed schema",
    run: () => {
      const skill = readRepo(SKILL_RELATIVE);
      assertTokens(skill, [...SEMANTIC_PROOF_MARKERS], "Semantic-proof protection");
      assertTokens(skill, [...EXCLUSION_GLOBS], "Exclusion globs");
      assertTokens(skill, [...CLOSED_CLASSIFICATIONS], "Closed classifications");
      assertTokens(skill, [...REQUIRED_OUTPUT_FIELDS], "Output fields");
      assertTokens(skill, [...REQUIRED_MATRIX_FIELDS], "Matrix fields");
      assert(skill.includes("remove | reuse | extract | parameterize | keep separate"), "Closed recommendations");
      assert(
        skill.includes("never pass `--no-gitignore`") || skill.includes("never pass --no-gitignore"),
        "Must forbid --no-gitignore",
      );
      assert(skill.includes("jscpd --reporters ai"), "Compact AI reporter scan shape");
      assert(skill.includes("--min-tokens 50"), "Default min-tokens gate");
    },
  },
  {
    name: "contracts: dedup unique-oracle, coupling gate, reviewer reuse, main-only mutation, trivial opt-out",
    run: () => {
      const skill = readRepo(SKILL_RELATIVE);
      assertTokens(
        skill,
        [
          "Preserve every unique critical or compatibility test oracle",
          "Propose a test for removal only when a named retained test proves the same externally meaningful behavior",
          "Line reduction alone is insufficient",
          "does not increase coupling",
          "code-quality-reviewer",
          "Do not create or invoke a `deduplicator` agent",
          "End the audit before mutation",
          "main implements the smallest bounded production slice",
          "Clone disappearance is never Runtime Proof",
          "Keep it unloaded for trivial owner-local fixes",
          "only when the user separately requests exhaustive coverage",
        ],
        "Safety routing markers",
      );
      const command = readRepo(COMMAND_RELATIVE);
      assertTokens(
        command,
        [
          "Do not edit production",
          "remove a unique critical/compatibility test oracle",
          "escalate into `codebase-audit-loop`",
        ],
        "Command safety markers",
      );
    },
  },
  {
    name: "contracts: dedup upstream skills and repository jscpd dependency remain absent",
    run: () => {
      assert(!existsRepo(UPSTREAM_JSCPD_SKILL_RELATIVE), "Upstream jscpd skill must not be installed in kit global source.");
      assert(
        !existsRepo(UPSTREAM_DRY_REFACTORING_SKILL_RELATIVE),
        "Upstream dry-refactoring skill must not be installed in kit global source.",
      );
      assert(!existsRepo(DEDUPLICATOR_RELATIVE), "deduplicator agent file must remain absent.");
      assert(!packageMentionsJscpd(), "package.json/package-lock.json must not declare jscpd dependency.");

      const skillDirs = fs
        .readdirSync(path.join(root, "global", "skills"), { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name);
      assert(skillDirs.includes("deduplication-audit"), "kit skill inventory must include deduplication-audit");
      assert(!skillDirs.includes("jscpd"), "kit skill inventory must not include jscpd");
      assert(!skillDirs.includes("dry-refactoring"), "kit skill inventory must not include dry-refactoring");
    },
  },
  {
    name: "contracts: dedup negative in-memory mutations fail semantic-proof and read-only routing oracles",
    run: () => {
      const liveSkill = readRepo(SKILL_RELATIVE);
      const liveCommand = readRepo(COMMAND_RELATIVE);
      assertNoFindings(skillContractFindings(liveSkill), "Baseline live skill must be green before negative mutations.");
      assertNoFindings(commandContractFindings(liveCommand), "Baseline live command must be green before negative mutations.");

      // Negative 1: strip semantic-equivalence protection → structural oracle must fail.
      const noSemanticProof = liveSkill
        .replaceAll("never prove semantic equivalence, safe deletion, or safe extraction", "prove semantic equivalence and safe deletion")
        .replaceAll("Exact and near textual clones are candidate locations only: ", "");
      const semanticFindings = skillContractFindings(noSemanticProof, "in-memory:skill-no-semantic-proof");
      assert(
        semanticFindings.length > 0,
        "Removing semantic-proof protection must produce structural findings (negative oracle).",
      );
      assertFindingsInclude(
        semanticFindings,
        /semantic-proof protection|never prove semantic equivalence/i,
        "Negative skill mutation must cite semantic-proof protection.",
      );

      // Negative 2: authorize production edit / drop read-only boundary.
      const writableSkill = liveSkill
        .replaceAll("This workflow is read-only. It discovers and classifies candidates; it never edits production, removes tests, installs dependencies, or authorizes a refactor.", "This workflow may edit production and remove tests when clones match.")
        .replaceAll("End the audit before mutation.", "Apply recommended removals immediately after the scan.")
        .replaceAll("Do not write `.jscpd.json` or use file reporters in the target repository.", "Write `.jscpd.json` and apply file reporters in the target repository.");
      const writableFindings = skillContractFindings(writableSkill, "in-memory:skill-writable");
      assert(writableFindings.length > 0, "Writable skill mutation must fail read-only structural oracles.");
      assertFindingsInclude(writableFindings, /read-only marker/i, "Writable skill must fail a read-only marker.");

      // Negative 3: command drops $ARGUMENTS full-scope routing and permits edits.
      const badCommand = liveCommand
        .replaceAll("$ARGUMENTS", "")
        .replaceAll("Do not edit production, install anything, add a dependency, create an agent, remove a unique critical/compatibility test oracle, or escalate into `codebase-audit-loop` unless the user separately requested an exhaustive audit.", "Edit production when jscpd reports clones and remove matching tests.");
      const badCommandFindings = commandContractFindings(badCommand, "in-memory:command-unsafe");
      assert(badCommandFindings.length > 0, "Unsafe command mutation must fail structural oracles.");
      assertFindingsInclude(badCommandFindings, /\$ARGUMENTS|command marker/i, "Unsafe command must miss $ARGUMENTS or read-only markers.");

      // Negative 4: failed scan treated as no duplicates.
      const failedScanOk = liveSkill.replaceAll(
        'A non-zero process exit is a failed scan, not "no duplicates"',
        "A non-zero process exit means no duplicates were found",
      );
      const failedScanFindings = skillContractFindings(failedScanOk, "in-memory:skill-failed-scan-ok");
      assertFindingsInclude(
        failedScanFindings,
        "failed scan",
        "Misrepresenting failed scan as no-duplicates must fail.",
      );

      // Negative 5: unique oracle retention removed.
      const dropOracle = liveSkill.replaceAll(
        "Preserve every unique critical or compatibility test oracle. Propose a test for removal only when a named retained test proves the same externally meaningful behavior and no critical or compatibility signal is lost.",
        "Delete matching tests when textual clones are found.",
      );
      assertFindingsInclude(
        skillContractFindings(dropOracle, "in-memory:skill-drop-oracle"),
        "unique oracle retention",
        "Dropping unique-oracle retention must fail.",
      );

      // Live candidate remains unchanged (negative fixtures are in-memory only).
      assertEqual(readRepo(SKILL_RELATIVE), liveSkill, "Negative tests must not mutate live skill on disk.");
      assertEqual(readRepo(COMMAND_RELATIVE), liveCommand, "Negative tests must not mutate live command on disk.");

      // Document structural limit explicitly in assertion message path for maintainers.
      assert(
        missingTokens(liveSkill, ["behavioral runtime proof of classification"]).length === 1,
        "Behavioral-proof limit: structural markers do not execute /dedup or prove semantic classification at runtime.",
      );
    },
  },
];
