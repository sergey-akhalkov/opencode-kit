import fs from "node:fs";
import path from "node:path";
import { lines, newTempDir, writeText } from "./temp.ts";

export function newLibraryFixture(name: string, repoRoot: string): string {
  const dir = newTempDir(name);
  writeText(
    path.join(dir, "global", "skills", "demo-skill", "SKILL.md"),
    lines([
      "---",
      "name: demo-skill",
      "description: Use when testing a demo reusable skill.",
      "license: MIT",
      "---",
      "",
      "# Demo Skill",
      "",
      "Use this skill when testing reusable skill validation fixtures.",
      "",
      "## Output",
      "",
      "Return fixture validation evidence.",
      "",
    ]),
  );
  const complainPath = path.join(repoRoot, "global", "skills", "complain", "SKILL.md");
  if (fs.existsSync(complainPath)) {
    writeText(
      path.join(dir, "global", "skills", "complain", "SKILL.md"),
      fs.readFileSync(complainPath, "utf8"),
    );
  }
  const feedbackReadme = path.join(repoRoot, "docs", "feedbacks", "README.md");
  if (fs.existsSync(feedbackReadme)) {
    writeText(
      path.join(dir, "docs", "feedbacks", "README.md"),
      fs.readFileSync(feedbackReadme, "utf8"),
    );
  }
  writeText(
    path.join(dir, "global", "agents", "demo-reviewer.md"),
    lines([
      "---",
      "description: Reviews demo fixture behavior.",
      "mode: subagent",
      "permission:",
      "  read: allow",
      "  glob: allow",
      "  grep: allow",
      "  bash: deny",
      "  edit:",
      '    "*": deny',
      '    "docs/feedbacks/**": allow',
      "  task: deny",
      "  question: deny",
      "  skill:",
      '    "*": deny',
      "    complain: allow",
      "  webfetch: deny",
      "  websearch: deny",
      "  todowrite: deny",
      "  external_directory: deny",
      "  lsp: deny",
      "  doom_loop: deny",
      "---",
      "",
      "You are a read-only demo reviewer.",
      "",
      "## Contract Reference",
      "",
      "This reviewer follows the shared contract defined at `instructions/leaf-reviewer-agent-contract.md` (Leaf Contract, Feedback Ledger, Evidence Rules, Severity Scale, Prevention Feedback, Output Schema).",
      "",
      "## Output",
      "",
      "Return:",
      "",
      "- `Findings`: ordered by severity. Each finding includes `Severity`, `Evidence`, `Evidence Type`, `Impact`, `Likely Root Cause`, `Recommendation`, `Confidence`, `Needs external reviewer`.",
      "- `Residual Risks`: known low-confidence gaps, missing evidence, or `none`.",
      "- `Actionable Continuation Items`: concrete tasks for the main session, or `none`.",
      "",
    ]),
  );
  writeText(path.join(dir, "instructions", "example.md"), lines(["# Example", ""]));
  writeText(
    path.join(dir, "instructions", "universal-development-loop.md"),
    lines([
      "# Universal Development Loop",
      "",
      "## Contract",
      "",
      "1. Intake",
      "2. Evidence",
      "3. Baseline Proof",
      "4. Small Slice",
      "5. Happy Path",
      "6. Happy-Path Proof",
      "7. Risk Discovery",
      "8. Negative Tests",
      "9. Harden",
      "10. Review Gate",
      "11. Final Validation",
      "12. Handoff",
      "13. Process Improvement",
      "",
    ]),
  );
  writeText(
    path.join(dir, "templates", "project", "AGENTS.md"),
    lines([
      "# Project Agent Instructions",
      "",
      "## Universal Development Loop",
      "",
      "- Follow `instructions/universal-development-loop.md` as the single canonical workflow.",
      "- Implement and observably prove the smallest complete happy path, then use a separate fresh-context testing subagent for risk discovery, negative tests, and hardening.",
      "- Do not commit, push, merge, delete source artifacts, or alter remote state unless explicitly requested and allowed by repository policy.",
      "",
    ]),
  );
  writeText(
    path.join(dir, "templates", "project", "opencode.json"),
    lines(["{", '  "$schema": "https://opencode.ai/config.json"', "}", ""]),
  );
  writeText(
    path.join(dir, "templates", "project", "validation.md"),
    lines(["# Project Validation", "", "- Record observable happy-path proof, risk discovery, negative suites, hardening, and final validation.", ""]),
  );
  writeText(
    path.join(dir, "templates", "project", "adapter.json"),
    lines([
      "{",
      '  "schemaVersion": 1,',
      '  "validation": {',
      '    "focusedTest": "unknown",',
      '    "test": "unknown",',
      "  }",
      "}",
      "",
    ]),
  );
  writeText(
    path.join(dir, "templates", "ci", "github-actions.yml"),
    lines([
      "name: validate",
      "on: [push, pull_request]",
      "jobs:",
      "  validate:",
      "    runs-on: ubuntu-latest",
      "    steps:",
      "      - uses: actions/checkout@v4",
      "      - run: npm ci",
      "      - run: npm run validate:strict",
      "      - run: npm test",
      "",
    ]),
  );
  writeText(
    path.join(dir, "profiles", "all.json"),
    JSON.stringify(
      {
        name: "all",
        description: "All kit skills and agents",
        skills: ["demo-skill", "complain"],
        agents: ["demo-reviewer"],
      },
      null,
      2,
    ) + "\n",
  );
  writeText(path.join(dir, "tools", "init-project.ts"), "// placeholder\n");
  writeText(path.join(dir, "tools", "doctor.ts"), "// placeholder\n");
  writeText(path.join(dir, "tools", "project-inventory.ts"), "// placeholder\n");
  writeText(path.join(dir, "tools", "instruction-artifacts-inventory.ts"), "// placeholder\n");
  writeText(path.join(dir, "tools", "pre-push-validate.ts"), "// placeholder\n");
  writeText(path.join(dir, ".githooks", "pre-push"), "#!/bin/sh\nexit 0\n");
  return dir;
}
