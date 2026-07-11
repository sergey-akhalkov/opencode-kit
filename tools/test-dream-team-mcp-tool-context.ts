#!/usr/bin/env node
import path from "node:path";
import plugin, {
  applyDreamTeamToolContext,
} from "../global/plugin/dream-team-mcp-tool-context.ts";
import sessionEnvPlugin from "../global/plugin/session-env.ts";

type TestCase = {
  name: string;
  run: () => Promise<void> | void;
};

type Session = {
  id: string;
  parentID?: unknown;
};

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function fakeClient(sessions: Session[], calls: unknown[] = []): unknown {
  return {
    session: {
      list: async (input: unknown) => {
        calls.push(input);
        return { data: sessions };
      },
    },
  };
}

async function assertRejects(
  run: () => Promise<void>,
  expectedMessage: string | null,
  message: string,
): Promise<void> {
  try {
    await run();
  } catch (error) {
    assert(error instanceof Error, `${message} Rejection must be an Error.`);
    assert(error.message.length > 0, `${message} Rejection must include a useful message.`);
    if (expectedMessage !== null) {
      assert(
        error.message.includes(expectedMessage),
        `${message}\nExpected error to contain: ${expectedMessage}\nActual: ${error.message}`,
      );
    }
    return;
  }
  throw new Error(`${message} Expected rejection, but the call succeeded.`);
}

const tests: TestCase[] = [
  {
    name: "ignores unrelated tools without session hierarchy access",
    run: async () => {
      const output = Object.freeze({ args: Object.freeze({ command: "npm test" }) });
      await applyDreamTeamToolContext(
        { tool: "bash", sessionID: "session_child" },
        output,
        path.resolve("fixtures", "workspace"),
        undefined,
      );
      assert(output.args.command === "npm test", "Unrelated tool arguments must remain untouched.");
    },
  },
  {
    name: "is the sole plugin owner of Dream Team review and implement context",
    run: async () => {
      const directory = path.resolve("fixtures", "workspace");
      const calls: unknown[] = [];
      const hooks = await plugin.server({
        directory,
        client: fakeClient([{ id: "session_root" }], calls),
      } as never);
      const sessionEnvHooks = await sessionEnvPlugin.server({} as never);
      assert(typeof hooks["tool.execute.before"] === "function", "Dream Team context plugin must register tool.execute.before.");
      assert(sessionEnvHooks["tool.execute.before"] == null, "session-env must not register the Dream Team hook.");

      const reviewOutput: { args: { repo: string; base: string; callerSessionId?: string } } = {
        args: { repo: "review-repo", base: "main" },
      };
      await hooks["tool.execute.before"]?.(
        { callID: "review_call", sessionID: "session_root", tool: "dream_team_review" },
        reviewOutput as never,
      );
      assert(
        reviewOutput.args.repo === path.resolve(directory, "review-repo"),
        "Review must resolve a relative repo against the OpenCode directory.",
      );
      assert(
        reviewOutput.args.callerSessionId === "session_root",
        "Review must receive the validated top-level caller session id.",
      );

      const implementOutput: { args: { repo: string; base: string; callerSessionId?: string } } = {
        args: { repo: "implement-repo", base: "main" },
      };
      await hooks["tool.execute.before"]?.(
        { callID: "implement_call", sessionID: "session_root", tool: "dream_team_implement" },
        implementOutput as never,
      );
      assert(
        implementOutput.args.repo === path.resolve(directory, "implement-repo"),
        "Implement must resolve a relative repo against the OpenCode directory.",
      );
      assert(
        !("callerSessionId" in implementOutput.args),
        "Implement must not receive review-only callerSessionId context.",
      );
      assert(calls.length === 2, "Both Dream Team tools must validate the caller hierarchy.");
      for (const call of calls) {
        assert(
          JSON.stringify(call) === JSON.stringify({ query: { directory } }),
          "Session hierarchy lookup must be scoped to the OpenCode directory.",
        );
      }
    },
  },
  {
    name: "preserves an absolute repo path",
    run: async () => {
      const absoluteRepo = path.resolve("fixtures", "absolute-project");
      const output = { args: { repo: absoluteRepo } };
      await applyDreamTeamToolContext(
        { tool: "dream_team_implement", sessionID: "session_root" },
        output,
        path.resolve("fixtures", "workspace"),
        fakeClient([{ id: "session_root" }]),
      );
      assert(output.args.repo === absoluteRepo, "An absolute repo path must be preserved byte-for-byte.");
    },
  },
  {
    name: "preserves an existing review caller session id",
    run: async () => {
      const output = {
        args: {
          repo: path.resolve("fixtures", "absolute-project"),
          callerSessionId: "session_existing",
        },
      };
      await applyDreamTeamToolContext(
        { tool: "dream_team_review", sessionID: "session_root" },
        output,
        path.resolve("fixtures", "workspace"),
        fakeClient([{ id: "session_root" }]),
      );
      assert(
        output.args.callerSessionId === "session_existing",
        "Plugin context must not overwrite an explicit review caller session id.",
      );
    },
  },
  {
    name: "rejects a missing caller session id before hierarchy lookup",
    run: async () => {
      const calls: unknown[] = [];
      await assertRejects(
        () => applyDreamTeamToolContext(
          { tool: "dream_team_review", sessionID: "   " },
          { args: { repo: "." } },
          path.resolve("fixtures", "workspace"),
          fakeClient([], calls),
        ),
        "resolvable top-level OpenCode session",
        "A Dream Team call without a caller identity must fail closed.",
      );
      assert(calls.length === 0, "Missing caller identity must fail before querying session hierarchy.");
    },
  },
  {
    name: "rejects missing session hierarchy API",
    run: () => assertRejects(
      () => applyDreamTeamToolContext(
        { tool: "dream_team_implement", sessionID: "session_root" },
        { args: { repo: "." } },
        path.resolve("fixtures", "workspace"),
        { session: {} },
      ),
      "session hierarchy access",
      "Dream Team calls must fail closed when OpenCode hierarchy access is unavailable.",
    ),
  },
  {
    name: "rejects an unknown caller session",
    run: () => assertRejects(
      () => applyDreamTeamToolContext(
        { tool: "dream_team_review", sessionID: "session_unknown" },
        { args: { repo: "." } },
        path.resolve("fixtures", "workspace"),
        fakeClient([{ id: "session_other" }]),
      ),
      "caller session could not be resolved",
      "A caller absent from the OpenCode hierarchy must not reach Dream Team.",
    ),
  },
  {
    name: "rejects malformed session hierarchy responses",
    run: () => assertRejects(
      () => applyDreamTeamToolContext(
        { tool: "dream_team_implement", sessionID: "session_root" },
        { args: { repo: "." } },
        path.resolve("fixtures", "workspace"),
        { session: { list: async () => ({ data: "not-an-array" }) } },
      ),
      "caller session could not be resolved",
      "Malformed hierarchy data must not be treated as a top-level caller.",
    ),
  },
  {
    name: "rejects a child caller session",
    run: () => assertRejects(
      () => applyDreamTeamToolContext(
        { tool: "dream_team_review", sessionID: "session_child" },
        { args: { repo: "." } },
        path.resolve("fixtures", "workspace"),
        fakeClient([{ id: "session_child", parentID: "session_root" }]),
      ),
      "cannot be called from an OpenCode child session",
      "A child session must not recursively invoke Dream Team tools.",
    ),
  },
  ...[null, "", 42].map((parentID): TestCase => ({
    name: `rejects malformed caller parentID: ${JSON.stringify(parentID)}`,
    run: () => assertRejects(
      () => applyDreamTeamToolContext(
        { tool: "dream_team_implement", sessionID: "session_root" },
        { args: { repo: "." } },
        path.resolve("fixtures", "workspace"),
        fakeClient([{ id: "session_root", parentID }]),
      ),
      "invalid parentID",
      "Only an absent parentID may identify a top-level caller.",
    ),
  })),
  ...[
    null,
    {},
    { args: [] },
  ].map((output, index): TestCase => ({
    name: `rejects malformed mutable tool arguments case ${index + 1}`,
    run: () => assertRejects(
      () => applyDreamTeamToolContext(
        { tool: "dream_team_review", sessionID: "session_root" },
        output,
        path.resolve("fixtures", "workspace"),
        fakeClient([{ id: "session_root" }]),
      ),
      "requires mutable arguments",
      "Malformed output arguments must fail instead of dispatching incomplete Dream Team context.",
    ),
  })),
  {
    name: "rejects immutable tool arguments without partial mutation",
    run: async () => {
      const args = Object.freeze({ repo: "relative-repo" });
      await assertRejects(
        () => applyDreamTeamToolContext(
          { tool: "dream_team_implement", sessionID: "session_root" },
          { args },
          path.resolve("fixtures", "workspace"),
          fakeClient([{ id: "session_root" }]),
        ),
        "requires mutable arguments",
        "Immutable output arguments must fail closed.",
      );
      assert(args.repo === "relative-repo", "A failed immutable-argument call must not partially rewrite repo.");
    },
  },
];

let failed = 0;
for (const test of tests) {
  try {
    await test.run();
    console.log(`PASS ${test.name}`);
  } catch (error) {
    failed++;
    console.error(`FAIL ${test.name}`);
    console.error(error instanceof Error ? error.message : String(error));
  }
}

if (failed > 0) process.exit(1);
console.log(`OK: Dream Team MCP tool-context tests=${tests.length}`);
