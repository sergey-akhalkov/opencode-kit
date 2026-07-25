#!/usr/bin/env node
import path from "node:path";
import plugin, {
  applyDreamTeamToolContext as applyDreamTeamToolContextWithEnvironment,
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

function assertDeepEqual(actual: unknown, expected: unknown, message: string): void {
  const actualJson = JSON.stringify(actual, null, 2);
  const expectedJson = JSON.stringify(expected, null, 2);
  assert(actualJson === expectedJson, `${message}\nExpected: ${expectedJson}\nActual: ${actualJson}`);
}

function applyDreamTeamToolContext(
  input: unknown,
  output: unknown,
  directory: unknown,
  client: unknown,
  environment: NodeJS.ProcessEnv = {},
): Promise<void> {
  return applyDreamTeamToolContextWithEnvironment(input, output, directory, client, environment);
}

function fakeClient(sessions: Session[], calls: unknown[] = [], logs: unknown[] = []): unknown {
  return {
    session: {
      list: async (input: unknown) => {
        calls.push(input);
        return { data: sessions };
      },
    },
    app: {
      log: async (input: unknown) => {
        logs.push(input);
      },
    },
  };
}

const PROFILE_ID_ENV = "OPENCODE_MODEL_PROFILE_ID";
const REVIEW_MODEL_ENV = "OPENCODE_MODEL_PROFILE_DREAM_TEAM_REVIEW_MODEL";
const REVIEW_VARIANT_ENV = "OPENCODE_MODEL_PROFILE_DREAM_TEAM_REVIEW_VARIANT";
const IMPLEMENT_MODEL_ENV = "OPENCODE_MODEL_PROFILE_DREAM_TEAM_IMPLEMENT_MODEL";
const IMPLEMENT_VARIANT_ENV = "OPENCODE_MODEL_PROFILE_DREAM_TEAM_IMPLEMENT_VARIANT";

type DreamTeamToolCase = {
  tool: "dream_team_review" | "dream_team_implement";
  model: string;
  variant: string;
  modelEnvironmentKey: string;
  variantEnvironmentKey: string;
};

const dreamTeamToolCases: DreamTeamToolCase[] = [
  {
    tool: "dream_team_review",
    model: "xai/grok-4.5",
    variant: "high",
    modelEnvironmentKey: REVIEW_MODEL_ENV,
    variantEnvironmentKey: REVIEW_VARIANT_ENV,
  },
  {
    tool: "dream_team_implement",
    model: "openai/gpt-5.6-sol",
    variant: "xhigh",
    modelEnvironmentKey: IMPLEMENT_MODEL_ENV,
    variantEnvironmentKey: IMPLEMENT_VARIANT_ENV,
  },
];

function profileEnvironment(overrides: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv {
  return {
    [PROFILE_ID_ENV]: "quality-independent",
    [REVIEW_MODEL_ENV]: "xai/grok-4.5",
    [REVIEW_VARIANT_ENV]: "high",
    [IMPLEMENT_MODEL_ENV]: "openai/gpt-5.6-sol",
    [IMPLEMENT_VARIANT_ENV]: "xhigh",
    ...overrides,
  };
}

function expectedDeviationLog(
  tool: DreamTeamToolCase["tool"],
  deviations: Array<{ field: "model" | "variant"; profileValue: string; explicitValue: string }>,
): unknown {
  return {
    body: {
      service: "dream-team.tool-context",
      level: "info",
      message: "Dream Team model profile deviation",
      extra: {
        profile: "quality-independent",
        tool,
        deviations,
      },
    },
  };
}

async function withoutAmbientProfile(run: () => Promise<void>): Promise<void> {
  const previous = process.env[PROFILE_ID_ENV];
  delete process.env[PROFILE_ID_ENV];
  try {
    await run();
  } finally {
    if (previous === undefined) delete process.env[PROFILE_ID_ENV];
    else process.env[PROFILE_ID_ENV] = previous;
  }
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
      await withoutAmbientProfile(async () => {
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
      });
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
  ...dreamTeamToolCases.flatMap((toolCase): TestCase[] => [
    {
      name: `${toolCase.tool} injects omitted profile model and variant while preserving unrelated arguments`,
      run: async () => {
        const directory = path.resolve("fixtures", "profile-workspace");
        const unrelated = { keep: true };
        const args: Record<string, unknown> = { repo: "project", base: "main", unrelated };
        const logs: unknown[] = [];
        await applyDreamTeamToolContext(
          { tool: toolCase.tool, sessionID: "session_root" },
          { args },
          directory,
          fakeClient([{ id: "session_root" }], [], logs),
          profileEnvironment(),
        );
        assert(args.model === toolCase.model, `${toolCase.tool} must inject its profile model.`);
        assert(args.variant === toolCase.variant, `${toolCase.tool} must inject its compatible profile variant.`);
        assert(args.repo === path.resolve(directory, "project"), `${toolCase.tool} must retain relative repo resolution.`);
        assert(args.base === "main", `${toolCase.tool} must preserve base.`);
        assert(args.unrelated === unrelated, `${toolCase.tool} must preserve unrelated argument identity.`);
        if (toolCase.tool === "dream_team_review") {
          assert(args.callerSessionId === "session_root", "Profile-aware review must retain caller-session propagation.");
        } else {
          assert(!("callerSessionId" in args), "Profile-aware implementation must not receive review-only caller context.");
        }
        assertDeepEqual(logs, [], "Profile-conforming omitted routing must not emit deviation logs.");
      },
    },
    {
      name: `${toolCase.tool} injects the profile variant for an explicit matching model`,
      run: async () => {
        const args: Record<string, unknown> = { repo: ".", model: toolCase.model, unrelated: "preserve" };
        const logs: unknown[] = [];
        await applyDreamTeamToolContext(
          { tool: toolCase.tool, sessionID: "session_root" },
          { args },
          path.resolve("fixtures", "profile-workspace"),
          fakeClient([{ id: "session_root" }], [], logs),
          profileEnvironment(),
        );
        assert(args.model === toolCase.model, `${toolCase.tool} must preserve a matching explicit model.`);
        assert(args.variant === toolCase.variant, `${toolCase.tool} must inject the compatible profile variant.`);
        assert(args.unrelated === "preserve", `${toolCase.tool} must preserve unrelated arguments.`);
        assertDeepEqual(logs, [], "A matching explicit model must not emit a deviation log.");
      },
    },
    {
      name: `${toolCase.tool} preserves a differing explicit model without attaching a profile variant and logs it`,
      run: async () => {
        const explicitModel = "owner/explicit-model";
        const args: Record<string, unknown> = { repo: "project", model: explicitModel, unrelated: 17 };
        const logs: unknown[] = [];
        await applyDreamTeamToolContext(
          { tool: toolCase.tool, sessionID: "session_root" },
          { args },
          path.resolve("fixtures", "profile-workspace"),
          fakeClient([{ id: "session_root" }], [], logs),
          profileEnvironment(),
        );
        assert(args.model === explicitModel, `${toolCase.tool} must preserve a differing explicit model.`);
        assert(!("variant" in args), `${toolCase.tool} must not combine a profile variant with a differing explicit model.`);
        assert(args.unrelated === 17, `${toolCase.tool} must preserve unrelated arguments.`);
        assertDeepEqual(logs, [expectedDeviationLog(toolCase.tool, [{
          field: "model",
          profileValue: toolCase.model,
          explicitValue: explicitModel,
        }])], "Differing explicit model must emit one exact structured informational log.");
      },
    },
    {
      name: `${toolCase.tool} preserves an explicit matching variant and injects only the omitted model`,
      run: async () => {
        const args: Record<string, unknown> = { repo: ".", variant: toolCase.variant, unrelated: false };
        const logs: unknown[] = [];
        await applyDreamTeamToolContext(
          { tool: toolCase.tool, sessionID: "session_root" },
          { args },
          path.resolve("fixtures", "profile-workspace"),
          fakeClient([{ id: "session_root" }], [], logs),
          profileEnvironment(),
        );
        assert(args.model === toolCase.model, `${toolCase.tool} must inject the omitted profile model.`);
        assert(args.variant === toolCase.variant, `${toolCase.tool} must preserve an explicit matching variant.`);
        assert(args.unrelated === false, `${toolCase.tool} must preserve unrelated explicit arguments.`);
        assertDeepEqual(logs, [], "Matching explicit variant must not emit a deviation log.");
      },
    },
    {
      name: `${toolCase.tool} preserves and logs a differing explicit variant`,
      run: async () => {
        const explicitVariant = "owner-variant";
        const args: Record<string, unknown> = {
          repo: ".",
          model: toolCase.model,
          variant: explicitVariant,
          unrelated: ["preserve"],
        };
        const logs: unknown[] = [];
        await applyDreamTeamToolContext(
          { tool: toolCase.tool, sessionID: "session_root" },
          { args },
          path.resolve("fixtures", "profile-workspace"),
          fakeClient([{ id: "session_root" }], [], logs),
          profileEnvironment(),
        );
        assert(args.model === toolCase.model, `${toolCase.tool} must preserve the explicit profile model.`);
        assert(args.variant === explicitVariant, `${toolCase.tool} must preserve a differing explicit variant.`);
        assertDeepEqual(logs, [expectedDeviationLog(toolCase.tool, [{
          field: "variant",
          profileValue: toolCase.variant,
          explicitValue: explicitVariant,
        }])], "Differing explicit variant must emit one exact structured informational log.");
      },
    },
    {
      name: `${toolCase.tool} rejects an incomplete active bridge before argument mutation`,
      run: async () => {
        const environment = profileEnvironment();
        delete environment[toolCase.modelEnvironmentKey];
        const args: Record<string, unknown> = { repo: "relative-project", unrelated: "preserve" };
        const logs: unknown[] = [];
        await assertRejects(
          () => applyDreamTeamToolContext(
            { tool: toolCase.tool, sessionID: "session_root" },
            { args },
            path.resolve("fixtures", "profile-workspace"),
            fakeClient([{ id: "session_root" }], [], logs),
            environment,
          ),
          "incomplete or invalid Dream Team",
          `${toolCase.tool} must fail closed when its active bridge model is missing.`,
        );
        assert(args.repo === "relative-project", "Incomplete bridge failure must occur before repo mutation.");
        assert(!("model" in args) && !("variant" in args), "Incomplete bridge failure must not partially inject routing.");
        assert(args.unrelated === "preserve", "Incomplete bridge failure must preserve unrelated arguments.");
        assertDeepEqual(logs, [], "Incomplete bridge failure must not emit a misleading deviation log.");
      },
    },
    {
      name: `${toolCase.tool} rejects a malformed active bridge before argument mutation`,
      run: async () => {
        const environment = profileEnvironment({ [toolCase.variantEnvironmentKey]: "invalid/variant" });
        const args: Record<string, unknown> = { repo: "relative-project" };
        await assertRejects(
          () => applyDreamTeamToolContext(
            { tool: toolCase.tool, sessionID: "session_root" },
            { args },
            path.resolve("fixtures", "profile-workspace"),
            fakeClient([{ id: "session_root" }]),
            environment,
          ),
          "incomplete or invalid Dream Team",
          `${toolCase.tool} must fail closed when its active bridge variant is malformed.`,
        );
        assert(args.repo === "relative-project", "Malformed bridge failure must occur before repo mutation.");
        assert(!("model" in args) && !("variant" in args), "Malformed bridge failure must not partially inject routing.");
      },
    },
    {
      name: `${toolCase.tool} rejects malformed explicit routing before argument mutation`,
      run: async () => {
        const args: Record<string, unknown> = { repo: "relative-project", model: "malformed-model" };
        await assertRejects(
          () => applyDreamTeamToolContext(
            { tool: toolCase.tool, sessionID: "session_root" },
            { args },
            path.resolve("fixtures", "profile-workspace"),
            fakeClient([{ id: "session_root" }]),
            profileEnvironment(),
          ),
          "explicit model must be a valid non-empty identifier",
          `${toolCase.tool} must reject a malformed explicit model.`,
        );
        assert(args.repo === "relative-project", "Malformed explicit routing must fail before repo mutation.");
        assert(args.model === "malformed-model", "Malformed explicit routing must not rewrite the caller value.");
        assert(!("variant" in args), "Malformed explicit routing must not partially inject a variant.");
      },
    },
    {
      name: `${toolCase.tool} fails closed when a required deviation cannot use structured logging`,
      run: async () => {
        const args: Record<string, unknown> = { repo: "relative-project", model: "owner/explicit-model" };
        const clientWithoutLogging = {
          session: { list: async () => ({ data: [{ id: "session_root" }] }) },
        };
        await assertRejects(
          () => applyDreamTeamToolContext(
            { tool: toolCase.tool, sessionID: "session_root" },
            { args },
            path.resolve("fixtures", "profile-workspace"),
            clientWithoutLogging,
            profileEnvironment(),
          ),
          "requires OpenCode structured logging",
          `${toolCase.tool} must not silently dispatch an undisclosed profile deviation.`,
        );
        assert(args.repo === "relative-project", "Logging failure must occur before repo mutation.");
        assert(!("variant" in args), "Logging failure must not attach a profile variant to a differing explicit model.");
      },
    },
    {
      name: `${toolCase.tool} preserves no-profile fallback behavior without model or variant injection`,
      run: async () => {
        const directory = path.resolve("fixtures", "no-profile-workspace");
        const args: Record<string, unknown> = { repo: "project", unrelated: "preserve" };
        const logs: unknown[] = [];
        await applyDreamTeamToolContext(
          { tool: toolCase.tool, sessionID: "session_root" },
          { args },
          directory,
          fakeClient([{ id: "session_root" }], [], logs),
          {},
        );
        assert(!("model" in args), "No-profile path must not inject a model.");
        assert(!("variant" in args), "No-profile path must not inject a variant.");
        assert(args.repo === path.resolve(directory, "project"), "No-profile path must retain repo resolution.");
        assert(args.unrelated === "preserve", "No-profile path must preserve unrelated arguments.");
        if (toolCase.tool === "dream_team_review") {
          assert(args.callerSessionId === "session_root", "No-profile review must retain caller-session propagation.");
        } else {
          assert(!("callerSessionId" in args), "No-profile implementation must retain its caller-session behavior.");
        }
        assertDeepEqual(logs, [], "No-profile path must not emit profile-deviation logs.");
      },
    },
  ]),
  ...dreamTeamToolCases.map((toolCase): TestCase => ({
    name: `${toolCase.tool} rejects a malformed active profile marker without disclosing it`,
    run: async () => {
      const malformedMarker = "../private-selection";
      const args: Record<string, unknown> = { repo: "relative-project" };
      try {
        await applyDreamTeamToolContext(
          { tool: toolCase.tool, sessionID: "session_root" },
          { args },
          path.resolve("fixtures", "profile-workspace"),
          fakeClient([{ id: "session_root" }]),
          profileEnvironment({ [PROFILE_ID_ENV]: malformedMarker }),
        );
      } catch (error) {
        assert(error instanceof Error, "Malformed marker rejection must be an Error.");
        assert(error.message.includes("Active model profile marker is malformed"), "Malformed marker failure must identify the problem class.");
        assert(!error.message.includes(malformedMarker), "Malformed marker diagnostic must not disclose the raw marker.");
        assert(args.repo === "relative-project", "Malformed marker must fail before repo mutation.");
        return;
      }
      throw new Error("Malformed active profile marker must fail closed.");
    },
  })),
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
