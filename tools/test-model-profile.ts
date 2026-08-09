#!/usr/bin/env node
import childProcess, { type SpawnSyncReturns } from "node:child_process";
import fs from "node:fs";
import { syncBuiltinESMExports } from "node:module";
import path from "node:path";
import {
  MODEL_PROFILE_SCHEMA,
  assertNoInheritedInlineConfig,
  buildProfileChildEnvironment,
  discoverGovernedAgentNames,
  findExplicitPrimaryModel,
  launchOpenCode,
  loadModelProfile,
  parseLauncherArguments,
  parseModelProfileText,
  parseProfileSelection,
  renderProfileExplanation,
  resolveProfilePath,
  runModelProfileCli,
  validateModelProfile,
  type LoadedModelProfile,
  type ModelProfile,
} from "./model-profile.ts";
import {
  assert,
  assertDeepEqual,
  assertEqual,
  libraryRoot,
  newTempDir,
  runTests,
  type TestCase,
  writeText,
} from "./test-helpers/library.ts";

const SOL_MODEL = "openai/gpt-5.6-sol";
const GROK_MODEL = "xai/grok-4.5";
const QUALITY_CREATORS = new Set([
  "build",
  "compaction",
  "general",
  "implementation-worker",
  "plan",
  "troubleshooter",
]);
const EXPECTED_CATALOG = [
  "build",
  "code-quality-reviewer",
  "compaction",
  "deployment-config-reviewer",
  "explore",
  "final-candidate-reviewer",
  "general",
  "implementation-readiness-reviewer",
  "implementation-worker",
  "instruction-artifact-reviewer",
  "legacy-client-compatibility-reviewer",
  "legacy-evidence-reviewer",
  "openspec-architecture-reviewer",
  "performance-reliability-reviewer",
  "plan",
  "protocol-api-reviewer",
  "qwen-local-worker",
  "rust-concurrency-reviewer",
  "scout",
  "sdet-quality-engineer",
  "session-completion-arbiter",
  "summary",
  "test-coverage-reviewer",
  "title",
  "troubleshooter",
  "wire-protocol-reviewer",
];

function captureError(run: () => unknown): Error {
  try {
    run();
  } catch (error) {
    assert(error instanceof Error, "Rejected operation must throw an Error.");
    assert(error.message.length > 0, "Rejected operation must include a useful diagnostic.");
    return error;
  }
  throw new Error("Expected operation to fail, but it succeeded.");
}

function assertErrorContains(run: () => unknown, expected: string, message: string): Error {
  const error = captureError(run);
  assert(
    error.message.includes(expected),
    `${message}\nExpected error to contain: ${expected}\nActual: ${error.message}`,
  );
  return error;
}

function profileFor(
  agents: string[],
  model = SOL_MODEL,
  variant = "xhigh",
  smallModel = model,
): ModelProfile {
  return {
    $schema: MODEL_PROFILE_SCHEMA,
    model,
    small_model: smallModel,
    agent: Object.fromEntries(
      [...agents]
        .sort((left, right) => left.localeCompare(right))
        .map((agentName) => [agentName, { model, variant }]),
    ),
  };
}

function newSelectionFixture(name: string): { root: string; agents: string[] } {
  const root = newTempDir(name);
  writeText(path.join(root, "global", "agents", "demo-reviewer.md"), "# demo-reviewer\n");
  const agents = discoverGovernedAgentNames(root);
  writeText(
    path.join(root, "global", "model-profiles", "shared.json"),
    `${JSON.stringify(profileFor(agents), null, 2)}\n`,
  );
  writeText(
    path.join(root, "global", "model-profiles", "local", "shared.json"),
    `${JSON.stringify(profileFor(agents, GROK_MODEL, "high"), null, 2)}\n`,
  );
  return { root, agents };
}

function captureConsole<T>(run: () => T): { value: T; logs: string[]; warnings: string[] } {
  const originalLog = console.log;
  const originalWarn = console.warn;
  const logs: string[] = [];
  const warnings: string[] = [];
  console.log = (...values: unknown[]) => logs.push(values.map(String).join(" "));
  console.warn = (...values: unknown[]) => warnings.push(values.map(String).join(" "));
  try {
    return { value: run(), logs, warnings };
  } finally {
    console.log = originalLog;
    console.warn = originalWarn;
  }
}

const tests: TestCase[] = [
  {
    name: "committed presets cover the exact current agent catalog",
    run: () => {
      const catalog = discoverGovernedAgentNames(libraryRoot);
      assertDeepEqual(
        catalog,
        [...EXPECTED_CATALOG].sort((left, right) => left.localeCompare(right)),
        "Governed catalog must be the eight built-ins plus every current global/agents Markdown role.",
      );
      for (const profileName of ["grok-only", "quality-independent", "sol-only"]) {
        const loaded = loadModelProfile(libraryRoot, profileName);
        assertDeepEqual(
          Object.keys(loaded.profile.agent),
          catalog,
          `${profileName} must route the exact complete catalog in stable order.`,
        );
      }
    },
  },
  {
    name: "committed presets implement the exact accepted routing matrices",
    run: () => {
      const quality = loadModelProfile(libraryRoot, "quality-independent").profile;
      assertEqual(quality.model, SOL_MODEL, "quality-independent top-level model must be Sol.");
      assertEqual(quality.small_model, GROK_MODEL, "quality-independent small model must be Grok.");
      for (const [agentName, route] of Object.entries(quality.agent)) {
        const useSol = QUALITY_CREATORS.has(agentName);
        assertDeepEqual(
          route,
          useSol
            ? { model: SOL_MODEL, variant: "xhigh" }
            : { model: GROK_MODEL, variant: "high" },
          `quality-independent route drifted for ${agentName}.`,
        );
      }

      for (const [profileName, model, variant] of [
        ["sol-only", SOL_MODEL, "xhigh"],
        ["grok-only", GROK_MODEL, "high"],
      ] as const) {
        const profile = loadModelProfile(libraryRoot, profileName).profile;
        assertEqual(profile.model, model, `${profileName} top-level model drifted.`);
        assertEqual(profile.small_model, model, `${profileName} small model drifted.`);
        for (const [agentName, route] of Object.entries(profile.agent)) {
          assertDeepEqual(route, { model, variant }, `${profileName} route drifted for ${agentName}.`);
        }
      }
    },
  },
  {
    name: "committed and local selections resolve separate same-named namespaces without shadowing",
    run: () => {
      const { root } = newSelectionFixture("model-profile-resolution");
      const committed = loadModelProfile(root, "shared");
      const local = loadModelProfile(root, "local:shared");
      assertEqual(committed.id, "shared", "Committed profile id must be preserved.");
      assertEqual(committed.sourceKind, "committed", "Unprefixed profile must resolve only as committed.");
      assertEqual(committed.profile.model, SOL_MODEL, "Committed selection must not be shadowed by local profile.");
      assertEqual(local.id, "shared", "Local profile id must exclude the namespace prefix.");
      assertEqual(local.sourceKind, "local", "local: selection must resolve only as local.");
      assertEqual(local.profile.model, GROK_MODEL, "Local selection must not be shadowed by committed profile.");
      assert(
        committed.filePath !== local.filePath,
        "Committed and local same-named profiles must resolve to distinct files.",
      );
    },
  },
  {
    name: "profile selection rejects blank traversal separators and ambiguous identifiers",
    run: () => {
      for (const selection of ["", " ", ".", "..", "a..b", "../shared", "local:", "local:../shared", "a/b", "a\\b", ":shared"]) {
        assertErrorContains(
          () => parseProfileSelection(selection),
          selection.trim().length === 0 ? "non-empty identifier" : "Invalid model profile selection",
          `Selection must be rejected: ${JSON.stringify(selection)}`,
        );
      }
    },
  },
  {
    name: "profile resolution rejects non-regular selections",
    run: () => {
      const root = newTempDir("model-profile-non-regular");
      fs.mkdirSync(path.join(root, "global", "model-profiles", "directory.json"), { recursive: true });
      assertErrorContains(
        () => resolveProfilePath(root, "directory"),
        "must resolve to a regular file",
        "A directory with a profile filename must not be read as a profile.",
      );
    },
  },
  {
    name: "profile resolution rejects a regular candidate whose real path escapes its namespace",
    run: () => {
      const { root } = newSelectionFixture("model-profile-escape");
      const candidate = path.resolve(root, "global", "model-profiles", "shared.json");
      const outside = path.resolve(root, "outside.json");
      writeText(outside, `${JSON.stringify(profileFor(["build"]))}\n`);
      const originalRealpath = fs.realpathSync;
      const fakeRealpath = ((target: fs.PathLike, options?: unknown) => {
        if (path.resolve(String(target)) === candidate) return outside;
        return originalRealpath(target, options as never);
      }) as typeof fs.realpathSync;
      Object.defineProperty(fs, "realpathSync", { configurable: true, value: fakeRealpath, writable: true });
      try {
        const error = assertErrorContains(
          () => resolveProfilePath(root, "shared"),
          "resolves outside its profile namespace",
          "Real-path containment must reject an escaping candidate.",
        );
        assert(!error.message.includes(outside), "Escape diagnostics must not disclose unrelated absolute paths.");
      } finally {
        Object.defineProperty(fs, "realpathSync", { configurable: true, value: originalRealpath, writable: true });
      }
    },
  },
  {
    name: "profile parsing rejects restricted root and per-agent fields without disclosing values",
    run: () => {
      const secret = "private-profile-value-must-not-leak";
      for (const field of ["permission", "tool", "provider", "prompt", "mcp", "credential", "metadata"]) {
        const value = { ...profileFor(["alpha"]), [field]: secret };
        const error = assertErrorContains(
          () => validateModelProfile(value, ["alpha"], "restricted"),
          `unsupported field '${field}'`,
          `Restricted root field must be rejected: ${field}`,
        );
        assert(!error.message.includes(secret), `Diagnostic must not disclose ${field} content.`);
      }
      for (const field of ["permission", "tools", "prompt", "temperature"]) {
        const value = profileFor(["alpha"]) as ModelProfile & { agent: Record<string, Record<string, unknown>> };
        value.agent.alpha![field] = secret;
        const error = assertErrorContains(
          () => validateModelProfile(value, ["alpha"], "restricted"),
          `agent 'alpha' contains unsupported field '${field}'`,
          `Restricted agent field must be rejected: ${field}`,
        );
        assert(!error.message.includes(secret), `Diagnostic must not disclose agent ${field} content.`);
      }
    },
  },
  {
    name: "profile parsing rejects malformed model and variant identifiers",
    run: () => {
      for (const model of ["", "model-without-provider", "/missing-provider", "provider/", "open ai/model"]) {
        const value = { ...profileFor(["alpha"]), model };
        assertErrorContains(
          () => validateModelProfile(value, ["alpha"], "malformed"),
          "field 'model' must be a provider/model identifier",
          `Malformed top-level model must be rejected: ${JSON.stringify(model)}`,
        );
      }
      for (const variant of ["", " ", ".hidden", "invalid/variant", "invalid variant"]) {
        const value = profileFor(["alpha"]);
        value.agent.alpha!.variant = variant;
        assertErrorContains(
          () => validateModelProfile(value, ["alpha"], "malformed"),
          "field 'agent.alpha.variant' must be a non-empty variant identifier",
          `Malformed agent variant must be rejected: ${JSON.stringify(variant)}`,
        );
      }
      assertErrorContains(
        () => parseModelProfileText("[1, 2, 3]", ["alpha"], "array"),
        "must contain a JSON object",
        "Non-object profile roots must be rejected.",
      );
    },
  },
  {
    name: "profile parsing rejects missing and extra governed-agent routes",
    run: () => {
      const missing = profileFor(["alpha", "beta"]);
      delete missing.agent.beta;
      assertErrorContains(
        () => validateModelProfile(missing, ["alpha", "beta"], "missing"),
        "Missing: beta. Extra: none.",
        "Missing governed agent must be named.",
      );
      const extra = profileFor(["alpha", "unexpected"]);
      assertErrorContains(
        () => validateModelProfile(extra, ["alpha"], "extra"),
        "Missing: none. Extra: unexpected.",
        "Unexpected route must be named.",
      );
    },
  },
  {
    name: "inherited inline configuration is refused without content disclosure",
    run: () => {
      const secret = "inherited-inline-private-content";
      const error = assertErrorContains(
        () => assertNoInheritedInlineConfig({ OPENCODE_CONFIG_CONTENT: secret }),
        "OPENCODE_CONFIG_CONTENT is already set",
        "Non-empty inherited inline configuration must block profile selection.",
      );
      assert(!error.message.includes(secret), "Inherited inline configuration content must never appear in diagnostics.");
      assertNoInheritedInlineConfig({ OPENCODE_CONFIG_CONTENT: "   " });
    },
  },
  {
    name: "profile explanation is complete and stable in agent-name order",
    run: () => {
      const loaded: LoadedModelProfile = {
        id: "ordered",
        selection: "local:ordered",
        sourceKind: "local",
        filePath: path.resolve("fixtures", "ordered.json"),
        profile: {
          $schema: MODEL_PROFILE_SCHEMA,
          model: SOL_MODEL,
          small_model: GROK_MODEL,
          agent: {
            zeta: { model: SOL_MODEL, variant: "xhigh" },
            alpha: { model: GROK_MODEL, variant: "high" },
          },
        },
      };
      assertEqual(
        renderProfileExplanation(loaded),
        [
          "Profile: local:ordered",
          "Source: local",
          `Path: ${loaded.filePath}`,
          `Model: ${SOL_MODEL}`,
          `Small model: ${GROK_MODEL}`,
          "Agents:",
          `- alpha: ${GROK_MODEL} (high)`,
          `- zeta: ${SOL_MODEL} (xhigh)`,
        ].join("\n"),
        "Explanation output must have stable complete formatting.",
      );

      const expected = renderProfileExplanation(loadModelProfile(libraryRoot, "quality-independent"));
      const captured = captureConsole(() => runModelProfileCli(["quality-independent", "--explain"], {}, libraryRoot));
      assertEqual(captured.value, 0, "Explain mode must exit successfully.");
      assertDeepEqual(captured.logs, [expected], "Explain CLI must emit only the stable resolved matrix.");
      assertDeepEqual(captured.warnings, [], "Explain CLI must not emit deviation warnings.");
    },
  },
  {
    name: "child environment construction is complete and leaves parent inputs unchanged",
    run: () => {
      const loaded = loadModelProfile(libraryRoot, "quality-independent");
      const base: NodeJS.ProcessEnv = { PATH: "fixture-path", OWNER_SENTINEL: "preserve" };
      const beforeBase = { ...base };
      const parentKeys = ["OPENCODE_CONFIG_CONTENT"];
      const parentBefore = Object.fromEntries(parentKeys.map((key) => [key, process.env[key]]));
      const child = buildProfileChildEnvironment(base, loaded);

      assert(child !== base, "Child environment must be a new object.");
      assertDeepEqual(base, beforeBase, "Base environment must not be mutated.");
      assertEqual(child.OWNER_SENTINEL, "preserve", "Unrelated environment values must be forwarded.");
      assertEqual(child.OPENCODE_CONFIG_CONTENT, JSON.stringify(loaded.profile), "Child inline config must be the validated selected profile.");
      assertDeepEqual(
        Object.fromEntries(parentKeys.map((key) => [key, process.env[key]])),
        parentBefore,
        "Building the child environment must not mutate the parent process environment.",
      );
    },
  },
  {
    name: "launcher argument parsing preserves passthrough arguments and rejects ambiguous modes",
    run: () => {
      assertDeepEqual(
        parseLauncherArguments(["quality-independent", "--", "run", "--model", "owner/custom", "--explain"]),
        {
          selection: "quality-independent",
          mode: "launch",
          openCodeArgs: ["run", "--model", "owner/custom", "--explain"],
        },
        "Arguments after -- must be forwarded byte-for-byte even when they resemble launcher flags.",
      );
      assertDeepEqual(
        parseLauncherArguments(["quality-independent", "--check"]),
        { selection: "quality-independent", mode: "check", openCodeArgs: [] },
        "Check mode must parse without passthrough arguments.",
      );
      assertErrorContains(
        () => parseLauncherArguments(["quality-independent", "--check", "--explain"]),
        "mode flags are ambiguous",
        "Duplicate launcher mode flags must fail closed.",
      );
      assertErrorContains(
        () => parseLauncherArguments(["quality-independent", "--explain", "run"]),
        "does not accept OpenCode arguments",
        "Inspection modes must not silently ignore launch arguments.",
      );
    },
  },
  {
    name: "launchOpenCode forwards command arguments and the exact injected child environment",
    run: () => {
      const environment: NodeJS.ProcessEnv = { SAFE_SENTINEL: "preserved" };
      const calls: Array<{ command: string; args: readonly string[]; environment: NodeJS.ProcessEnv; stdio: string }> = [];
      const status = launchOpenCode(
        ["run", "--model", "owner/custom", "task text"],
        environment,
        ((command: string, args: readonly string[], options: { env: NodeJS.ProcessEnv; stdio: "inherit" }) => {
          calls.push({ command, args, environment: options.env, stdio: options.stdio });
          return {
            pid: 101,
            output: [null, Buffer.alloc(0), Buffer.alloc(0)],
            stdout: Buffer.alloc(0),
            stderr: Buffer.alloc(0),
            status: 7,
            signal: null,
          } as unknown as SpawnSyncReturns<Buffer>;
        }),
      );
      assertEqual(status, 7, "Launcher must return the child process status.");
      assertDeepEqual(calls, [{
        command: "opencode",
        args: ["run", "--model", "owner/custom", "task text"],
        environment,
        stdio: "inherit",
      }], "Launcher must invoke only OpenCode with unchanged arguments and supplied child environment.");
    },
  },
  {
    name: "explicit primary model detection accepts native forms and rejects ambiguity",
    run: () => {
      assertEqual(findExplicitPrimaryModel(["run"]), undefined, "Missing explicit model must remain absent.");
      assertEqual(findExplicitPrimaryModel(["--model", "owner/custom"]), "owner/custom", "Long model flag must be detected.");
      assertEqual(findExplicitPrimaryModel(["-m", "owner/short"]), "owner/short", "Short model flag must be detected.");
      assertEqual(findExplicitPrimaryModel(["--model=owner/equals"]), "owner/equals", "Equals model form must be detected.");
      assertErrorContains(
        () => findExplicitPrimaryModel(["--model", "owner/one", "-m", "owner/two"]),
        "Multiple explicit OpenCode model arguments are ambiguous",
        "Multiple explicit primary models must fail closed.",
      );
      assertErrorContains(
        () => findExplicitPrimaryModel(["--model"]),
        "requires a model identifier",
        "Missing explicit model value must fail closed.",
      );
    },
  },
  {
    name: "launch mode reports a differing explicit primary model and preserves it for spawn",
    run: () => {
      const mutableChildProcess = childProcess as unknown as { spawnSync: typeof childProcess.spawnSync };
      const originalSpawnSync = mutableChildProcess.spawnSync;
      const calls: Array<{ command: string; args: readonly string[]; env: NodeJS.ProcessEnv }> = [];
      mutableChildProcess.spawnSync = ((command: string, args: readonly string[], options: { env: NodeJS.ProcessEnv }) => {
        calls.push({ command, args, env: options.env });
        return {
          pid: 102,
          output: [null, Buffer.alloc(0), Buffer.alloc(0)],
          stdout: Buffer.alloc(0),
          stderr: Buffer.alloc(0),
          status: 0,
          signal: null,
        } as unknown as SpawnSyncReturns<Buffer>;
      }) as typeof childProcess.spawnSync;
      syncBuiltinESMExports();
      try {
        const captured = captureConsole(() => runModelProfileCli(
          ["quality-independent", "--", "run", "--model", "owner/custom", "task text"],
          { SAFE_SENTINEL: "preserved" },
          libraryRoot,
        ));
        assertEqual(captured.value, 0, "Injected launch must return the fake OpenCode success status.");
        assertDeepEqual(captured.warnings, [
          `INFO: model profile primary deviation profile=quality-independent profileModel=${SOL_MODEL} explicitModel=owner/custom`,
        ], "Differing explicit primary model must produce one privacy-safe deviation report.");
        assertDeepEqual(calls.map((call) => ({ command: call.command, args: call.args })), [{
          command: "opencode",
          args: ["run", "--model", "owner/custom", "task text"],
        }], "Explicit primary model and unrelated launch arguments must reach OpenCode unchanged.");
        assertEqual(calls[0]!.env.SAFE_SENTINEL, "preserved", "Unrelated child environment must be preserved.");
        assertEqual(
          calls[0]!.env.OPENCODE_CONFIG_CONTENT,
          JSON.stringify(loadModelProfile(libraryRoot, "quality-independent").profile),
          "Spawned child must receive the selected profile config.",
        );
      } finally {
        mutableChildProcess.spawnSync = originalSpawnSync;
        syncBuiltinESMExports();
      }
    },
  },
];

runTests(tests, "model profile");
