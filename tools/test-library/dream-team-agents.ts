import fs from "node:fs";
import path from "node:path";
import {
  assertFailure,
  assertOutputContains,
  assertSuccess,
  invokeValidator,
  libraryRoot,
  lines,
  newLibraryFixture,
  type TestCase,
  writeText,
} from "../test-helpers/library.ts";

const root = libraryRoot;

export const dreamTeamAgentTests: TestCase[] = [
  {
    name: "validator accepts hidden Dream Team runtime agents outside reusable catalog",
    run: () => {
      const fixture = newLibraryFixture("hidden-dream-team-runtime-agent");
      writeText(path.join(fixture, "global", "agents", "dream-team-reviewer.md"), lines([
        "---",
        "hidden: true",
        "description: Runtime Dream Team reviewer fixture.",
        "mode: subagent",
        "permission:",
        "  read: allow",
        "  glob: allow",
        "  grep: allow",
        "  bash: deny",
        "  edit:",
        "    \"*\": deny",
        "    \"docs/feedbacks/**\": allow",
        "  task: deny",
        "  question: deny",
        "  skill:",
        "    \"*\": deny",
        "    complain: allow",
        "  webfetch: deny",
        "  websearch: deny",
        "  todowrite: deny",
        "  external_directory: deny",
        "  lsp: deny",
        "  doom_loop: deny",
        "  dream_team_*: deny",
        "---",
        "",
        "Runtime-only Dream Team reviewer fixture.",
        "",
      ]));
      assertSuccess(invokeValidator(fixture), "Hidden Dream Team runtime agents should not require reusable reviewer catalog/profile contracts.");
    },
  },
  {
    name: "validator rejects hidden Dream Team runtime agents without recursive tool deny",
    run: () => {
      const fixture = newLibraryFixture("hidden-dream-team-runtime-agent-missing-deny");
      writeText(path.join(fixture, "global", "agents", "dream-team-reviewer.md"), lines([
        "---",
        "hidden: true",
        "description: Runtime Dream Team reviewer fixture.",
        "mode: subagent",
        "permission:",
        "  read: allow",
        "---",
        "",
        "Runtime-only Dream Team reviewer fixture.",
        "",
      ]));
      const result = invokeValidator(fixture);
      assertFailure(result, "Hidden Dream Team runtime agents must deny recursive Dream Team tools.");
      assertOutputContains(result, "must deny dream_team_* tools", "Dream Team runtime-agent failure should name the recursive-tool deny contract.");
    },
  },
  {
    name: "validator accepts the exact read-only Dream Team reviewer profile",
    run: () => {
      const fixture = newLibraryFixture("dream-team-reviewer-valid-profile");
      const sourcePath = path.join(root, "global", "agents", "dream-team-reviewer.md");
      const fixturePath = path.join(fixture, "global", "agents", "dream-team-reviewer.md");
      writeText(fixturePath, fs.readFileSync(sourcePath, "utf8"));
      assertSuccess(invokeValidator(fixture), "The hidden Dream Team reviewer must accept its exact read-only, recursion-denied profile.");
    },
  },
  {
    name: "validator rejects write access for the Dream Team reviewer",
    run: () => {
      const fixture = newLibraryFixture("dream-team-reviewer-write-access");
      const sourcePath = path.join(root, "global", "agents", "dream-team-reviewer.md");
      const fixturePath = path.join(fixture, "global", "agents", "dream-team-reviewer.md");
      const source = fs.readFileSync(sourcePath, "utf8");
      const mutationTarget = "    \"*\": deny";
      if (!source.includes(mutationTarget)) throw new Error(`Dream Team reviewer fixture source is missing mutation target: ${mutationTarget}`);
      writeText(fixturePath, source.replace(mutationTarget, "    \"*\": allow"));
      const result = invokeValidator(fixture);
      assertFailure(result, "The Dream Team reviewer must remain read-only outside its feedback-ledger exception.");
      assertOutputContains(result, "edit.*: deny", "The reviewer diagnostic must identify the unsafe wildcard edit permission.");
    },
  },
  {
    name: "validator accepts the workspace-edit Dream Team implementer profile",
    run: () => {
      const fixture = newLibraryFixture("dream-team-implementer-valid-profile");
      const sourcePath = path.join(root, "global", "agents", "dream-team-implementer.md");
      const fixturePath = path.join(fixture, "global", "agents", "dream-team-implementer.md");
      writeText(fixturePath, fs.readFileSync(sourcePath, "utf8"));
      assertSuccess(invokeValidator(fixture), "The hidden Dream Team implementer must accept its exact workspace-edit runtime profile.");
    },
  },
  ...[
    ["dream-team-implementer-missing-edit", "  edit: allow", "  # edit permission intentionally missing", "must set edit: allow", "A runtime implementer without edit access cannot perform its workspace-edit role."],
    ["dream-team-implementer-bash-allow", "  bash: deny", "  bash: allow", "must set bash: deny", "A runtime implementer must not bypass parent-workflow validation through shell access."],
    ["dream-team-implementer-recursive-tool-allow", "  dream_team_*: deny", "  dream_team_*: allow", "must deny dream_team_* tools", "A runtime implementer must not recurse into Dream Team orchestration tools."],
    ["dream-team-implementer-task-allow", "  task: deny", "  task: allow", "must set task: deny", "A runtime implementer must not delegate into unrelated orchestration agents."],
    ["dream-team-implementer-webfetch-allow", "  webfetch: deny", "  webfetch: allow", "must set webfetch: deny", "A runtime implementer must not gain unrelated network-tool access."],
  ].map(([fixtureName, from, to, expected, message]): TestCase => ({
    name: `validator rejects unsafe Dream Team implementer profile: ${fixtureName}`,
    run: () => {
      const fixture = newLibraryFixture(fixtureName);
      const sourcePath = path.join(root, "global", "agents", "dream-team-implementer.md");
      const fixturePath = path.join(fixture, "global", "agents", "dream-team-implementer.md");
      const source = fs.readFileSync(sourcePath, "utf8");
      if (!source.includes(from)) throw new Error(`Dream Team implementer fixture source is missing mutation target: ${from}`);
      writeText(fixturePath, source.replace(from, to));
      const result = invokeValidator(fixture);
      assertFailure(result, message);
      assertOutputContains(result, expected, `${message} The diagnostic must identify the unsafe permission.`);
    },
  })),
];
