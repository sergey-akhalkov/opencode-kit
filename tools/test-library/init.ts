import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  assertEqual,
  assertFailure,
  assertOutputContains,
  assertSuccess,
  findPathWithBasename,
  invokeInitProject,
  newTempDir,
  type TestCase,
  writeText,
  lines,
  libraryRoot,
} from "../test-helpers/library.ts";

const root = libraryRoot;

export const initTests: TestCase[] = [
  {
    name: "init project previews and writes universal loop bootstrap",
    run: () => {
      const project = newTempDir("init-project-target");
      const preview = invokeInitProject(["--target", project]);
      assertSuccess(preview, "Project bootstrap preview should succeed.");
      assertOutputContains(preview, "would create: AGENTS.md", "Preview should show AGENTS.md creation.");
      assertOutputContains(preview, "would create: docs/feedbacks/README.md", "Preview should show feedback ledger creation.");
      if (fs.existsSync(path.join(project, "AGENTS.md"))) {
        throw new Error("Project bootstrap preview must not write files.");
      }
      if (fs.existsSync(path.join(project, "docs", "feedbacks", "README.md"))) {
        throw new Error("Project bootstrap preview must not write feedback ledger files.");
      }

      const write = invokeInitProject(["--target", project, "--mode", "write"]);
      assertSuccess(write, "Project bootstrap write should succeed for an empty project.");
      assertOutputContains(write, "created: AGENTS.md", "Write should create AGENTS.md.");
      assertOutputContains(write, "created: docs/feedbacks/README.md", "Write should create feedback ledger README.");
      assertOutputContains(write, "created: opencode-dev-kit/adapter.json", "Write should create the adapter file.");
      const agentsText = fs.readFileSync(path.join(project, "AGENTS.md"), "utf8");
      if (!agentsText.includes("Universal Development Loop")) {
        throw new Error("Project AGENTS.md should install the Universal Development Loop template.");
      }
      const feedbackText = fs.readFileSync(path.join(project, "docs", "feedbacks", "README.md"), "utf8");
      const kitFeedbackText = fs.readFileSync(path.join(root, "docs", "feedbacks", "README.md"), "utf8");
      if (!feedbackText.includes("Feedback Ledger") || !feedbackText.includes("complain")) {
        throw new Error("Project bootstrap should install the feedback ledger README.");
      }
      assertEqual(feedbackText, kitFeedbackText, "Project bootstrap should copy the kit-level feedback README byte-for-byte.");
    },
  },
  {
    name: "init project refuses overwrite without explicit flag",
    run: () => {
      const project = newTempDir("init-project-overwrite");
      const agentsPath = path.join(project, "AGENTS.md");
      writeText(agentsPath, "existing rules\n");
      const result = invokeInitProject(["--target", project, "--mode", "write"]);
      assertFailure(result, "Project bootstrap should refuse overwriting existing files without --overwrite.");
      assertOutputContains(result, "Refusing to overwrite", "Overwrite refusal should explain the safety boundary.");
      assertEqual(fs.readFileSync(agentsPath, "utf8"), "existing rules\n".replace(/\n/g, os.EOL), "Overwrite refusal should preserve existing AGENTS.md.");
    },
  },
  {
    name: "init project overwrite backs up and replaces existing files",
    run: () => {
      const project = newTempDir("init-project-overwrite-backup");
      const agentsPath = path.join(project, "AGENTS.md");
      writeText(agentsPath, "existing rules\n");
      const result = invokeInitProject(["--target", project, "--mode", "write", "--overwrite"]);
      assertSuccess(result, "Project bootstrap should overwrite only with explicit --overwrite.");
      assertOutputContains(result, "replaced: AGENTS.md", "Overwrite should report replaced AGENTS.md.");
      assertOutputContains(result, "backup:", "Overwrite should report backup path.");
      const backup = findPathWithBasename(path.join(project, ".backups", "opencode-dev-kit"), "AGENTS.md");
      if (!backup) {
        throw new Error("Overwrite should create an AGENTS.md backup.");
      }
      if (!fs.readFileSync(backup, "utf8").includes("existing rules")) {
        throw new Error(`Backup should preserve original AGENTS.md content.\nBackup: ${backup}`);
      }
      const expected = fs.readFileSync(path.join(root, "templates", "project", "AGENTS.md"), "utf8");
      assertEqual(fs.readFileSync(agentsPath, "utf8"), expected, "Overwrite should copy the project AGENTS.md template exactly.");
    },
  },
];
