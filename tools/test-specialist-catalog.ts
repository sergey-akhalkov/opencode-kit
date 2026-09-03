#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  configuredProofServerEnvironment,
  installedOpenCodeIdentity,
  isolatedProofServerEnvironment,
  proofClient,
  requestData,
  seedProofModelsCatalog,
  startProofServer,
  stopProofServer,
} from "./proofs/lib/opencode-proof-client.ts";

type JsonRecord = Record<string, unknown>;

type Options = {
  agent: string | null;
  evidence: string;
  opencode: string;
  plugin: string | null;
  routeDiagnostic: boolean;
};

const HELP = `Usage: node tools/test-specialist-catalog.ts --opencode <absolute-path> --evidence <path> [--plugin <absolute-path>] [--agent <absolute-path>] [--route-diagnostic]

Runs a provider-free isolated runtime preflight for the specialist catalog adapter.
When --plugin is present, loads that candidate instead of the embedded API probe.
The command creates and removes one temporary OpenCode config, project, and data root.
`;

const PLUGIN_SOURCE = `
import crypto from "node:crypto";

const ADVISOR = "proof-advisor";
const CONTROL_PLANE = new Set(["compaction", "proof-control-plane", "session-completion-arbiter", "summary", "title"]);

function unwrap(response, label) {
  if (response?.error != null) throw new Error(label, { cause: response.error });
  if (response == null || !("data" in response)) throw new Error(label + " returned no data");
  return response.data;
}

function rows(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  throw new Error("unsupported catalog payload");
}

function safeDescription(value) {
  return typeof value === "string"
    ? value.replace(/[\\r\\n\\t]+/g, " ").replace(/[^\\x20-\\x7e]/g, "?").replace(/\\s+/g, " ").trim().slice(0, 160)
    : "";
}

function ref(value) {
  return crypto.createHash("sha256").update(value).digest("hex").slice(0, 16);
}

async function rootSession(client, directory, sessionID) {
  let current = unwrap(await client.session.get({ directory, sessionID }), "session.get");
  const visited = new Set();
  for (let depth = 0; depth < 64; depth += 1) {
    if (visited.has(current.id)) throw new Error("session parent cycle detected");
    visited.add(current.id);
    if (current.parentID == null) return current;
    current = unwrap(await client.session.get({ directory, sessionID: current.parentID }), "session.get");
  }
  throw new Error("session parent depth exceeded");
}

function result(value) {
  return { output: JSON.stringify(value), title: "Specialist catalog preflight" };
}

export default async function specialistCatalogPreflight({ client }) {
  return {
    tool: {
      proof_catalog: {
        args: {},
        description: "Return a redacted root-effective specialist and skill catalog for the proof advisor.",
        async execute(_args, context) {
          if (context.agent !== ADVISOR) return result({ entries: [], status: "denied" });
          if (typeof client?.v2?.agent?.list !== "function" || typeof client?.v2?.skill?.list !== "function") {
            return result({ entries: [], reason: "catalog-api-unavailable", status: "unknown" });
          }
          try {
            const root = await rootSession(client, context.directory, context.sessionID);
            const agentPayload = unwrap(await client.v2.agent.list({ location: { directory: root.directory } }), "agent.list");
            const skillPayload = unwrap(await client.v2.skill.list({ location: { directory: root.directory } }), "skill.list");
            const agents = rows(agentPayload)
              .filter((item) => item && typeof item.id === "string" && item.id !== ADVISOR && item.hidden !== true && !CONTROL_PLANE.has(item.id) && item.mode !== "primary")
              .map((item) => ({ availability: "available", description: safeDescription(item.description), id: item.id, kind: "agent" }))
              .sort((left, right) => left.id.localeCompare(right.id));
            const skills = rows(skillPayload)
              .filter((item) => item && typeof item.name === "string")
              .map((item) => ({ availability: "available", description: safeDescription(item.description), id: item.name, kind: "skill" }))
              .sort((left, right) => left.id.localeCompare(right.id));
            return result({ entries: [...agents, ...skills], rootRef: ref(root.id), status: "ok" });
          } catch {
            return result({ entries: [], reason: "catalog-read-failed", status: "unknown" });
          }
        },
      },
    },
  };
}
`;

function parseOptions(argv: string[]): Options | null {
  if (argv.includes("--help") || argv.includes("-h")) return null;
  let evidence = "";
  let agent: string | null = null;
  let opencode = "";
  let plugin: string | null = null;
  const routeDiagnostic = argv.includes("--route-diagnostic");
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index + 1];
    if (argv[index] === "--evidence" && value != null) evidence = value;
    if (argv[index] === "--agent" && value != null) agent = path.resolve(value);
    if (argv[index] === "--opencode" && value != null) opencode = value;
    if (argv[index] === "--plugin" && value != null) plugin = path.resolve(value);
  }
  if (evidence === "" || opencode === "") throw new Error("--opencode and --evidence are required");
  if (routeDiagnostic && (agent == null || plugin == null)) throw new Error("--route-diagnostic requires --agent and --plugin");
  return { agent, evidence: path.resolve(evidence), opencode: path.resolve(opencode), plugin, routeDiagnostic };
}

function packageVersion(packagePath: string): string {
  const value = JSON.parse(fs.readFileSync(packagePath, "utf8")) as JsonRecord;
  assert.equal(typeof value.version, "string", `Missing package version: ${packagePath}`);
  return value.version as string;
}

function sha256File(filePath: string): string {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function bodyRows(payload: unknown): JsonRecord[] {
  if (Array.isArray(payload)) return payload.filter((row): row is JsonRecord => row != null && typeof row === "object" && !Array.isArray(row));
  assert.ok(payload != null && typeof payload === "object" && !Array.isArray(payload));
  const rows = (payload as JsonRecord).data;
  assert.ok(Array.isArray(rows));
  return rows.filter((row): row is JsonRecord => row != null && typeof row === "object" && !Array.isArray(row));
}

function sessionID(session: JsonRecord): string {
  assert.equal(typeof session.id, "string");
  return session.id as string;
}

function entryIDs(value: unknown): string[] {
  assert.ok(Array.isArray(value));
  return value.map((entry) => {
    assert.ok(entry != null && typeof entry === "object" && !Array.isArray(entry));
    assert.equal(typeof (entry as JsonRecord).id, "string");
    return (entry as JsonRecord).id as string;
  });
}

function toolOutput(value: unknown): JsonRecord {
  assert.ok(value != null && typeof value === "object" && !Array.isArray(value));
  const output = (value as JsonRecord).output;
  assert.equal(typeof output, "string");
  const parsed = JSON.parse(output as string) as unknown;
  assert.ok(parsed != null && typeof parsed === "object" && !Array.isArray(parsed));
  return parsed as JsonRecord;
}

function matchingRules(agent: JsonRecord, action: string): JsonRecord[] {
  const permissions = agent.permissions ?? agent.permission;
  assert.ok(Array.isArray(permissions));
  return permissions.filter((rule): rule is JsonRecord => (
    rule != null
    && typeof rule === "object"
    && !Array.isArray(rule)
    && ((rule as JsonRecord).action === action || (rule as JsonRecord).permission === action)
  ));
}

function agentID(agent: JsonRecord): unknown {
  return agent.id ?? agent.name;
}

function ruleEffect(rule: JsonRecord | undefined): unknown {
  return rule?.effect ?? rule?.action;
}

async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2));
  if (options == null) {
    process.stdout.write(HELP);
    return;
  }
  assert.ok(path.isAbsolute(options.opencode) && fs.statSync(options.opencode).isFile(), "OpenCode executable is unreadable");
  if (options.agent != null) assert.ok(path.isAbsolute(options.agent) && fs.statSync(options.agent).isFile(), "Candidate agent is unreadable");
  if (options.plugin != null) assert.ok(path.isAbsolute(options.plugin) && fs.statSync(options.plugin).isFile(), "Candidate plugin is unreadable");

  const normalizedRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const candidateMode = options.plugin != null;
  const advisorID = candidateMode ? "specialist-team-advisor" : "proof-advisor";
  const controlPlaneID = candidateMode ? "session-completion-arbiter" : "proof-control-plane";
  const toolID = candidateMode ? "specialist_catalog" : "proof_catalog";
  const runtimeRoot = fs.mkdtempSync(path.join(os.tmpdir(), "opencode-specialist-catalog-preflight-"));
  const configDir = path.join(runtimeRoot, "config");
  const projectDir = path.join(runtimeRoot, "project");
  const pluginPath = options.plugin ?? path.join(runtimeRoot, "proof-plugin.mjs");
  const skillDir = path.join(configDir, "skills", "proof-skill");
  const agentDir = path.join(configDir, "agents");
  fs.mkdirSync(skillDir, { recursive: true });
  fs.mkdirSync(agentDir, { recursive: true });
  fs.mkdirSync(path.join(runtimeRoot, "data", "opencode"), { recursive: true });
  fs.mkdirSync(path.join(runtimeRoot, "state"), { recursive: true });
  fs.mkdirSync(projectDir, { recursive: true });
  if (!candidateMode) fs.writeFileSync(pluginPath, PLUGIN_SOURCE, "utf8");
  if (options.agent != null) fs.copyFileSync(options.agent, path.join(agentDir, `${advisorID}.md`));
  fs.writeFileSync(path.join(skillDir, "SKILL.md"), `---\nname: proof-skill\ndescription: Provider-free catalog preflight skill.\n---\n\nPRIVATE_SKILL_BODY_SENTINEL\n`, "utf8");
  const runtimeConfig = {
    $schema: "https://opencode.ai/config.json",
    ...(options.agent == null ? {} : { model: "openai/gpt-5.6-sol" }),
    agent: {
      ...(options.agent == null ? { [advisorID]: {
        description: "Provider-free catalog preflight advisor.",
        mode: "subagent",
        permission: {
          "*": "deny",
          read: "allow",
          glob: "allow",
          grep: "allow",
          [toolID]: "allow",
        },
        prompt: "PRIVATE_PROMPT_SENTINEL advisor",
      } } : { [advisorID]: { model: "openai/gpt-5.6-sol", variant: "xhigh" } }),
      [controlPlaneID]: {
        description: "PRIVATE_CONTROL_DESCRIPTION_SENTINEL",
        mode: "subagent",
        permission: "deny",
      },
      "proof-hidden": {
        description: "PRIVATE_HIDDEN_DESCRIPTION_SENTINEL",
        hidden: true,
        mode: "subagent",
        permission: "deny",
      },
      "proof-other": {
        description: "Provider-free denial control.",
        mode: "subagent",
        permission: { "*": "deny", read: "allow" },
      },
      "proof-worker": {
        description: "Bounded provider-free worker.",
        mode: "subagent",
        permission: { "*": "deny", read: "allow" },
      },
    },
    plugin: [pathToFileURL(pluginPath).href],
  };
  fs.writeFileSync(path.join(configDir, "opencode.json"), `${JSON.stringify(runtimeConfig, null, 2)}\n`, "utf8");

  const environment = options.agent == null
    ? isolatedProofServerEnvironment(process.env, configDir, runtimeRoot)
    : configuredProofServerEnvironment(process.env, configDir, runtimeRoot, runtimeConfig);
  if (options.agent != null) {
    seedProofModelsCatalog(runtimeRoot, ["openai/gpt-5.6-sol"]);
    environment.OPENCODE_PURE = "0";
    delete environment.OPENCODE_CONFIG_CONTENT;
  }
  if (options.agent == null) environment.OPENCODE_DISABLE_PROJECT_CONFIG = "1";
  else delete environment.OPENCODE_DISABLE_PROJECT_CONFIG;
  let server: Awaited<ReturnType<typeof startProofServer>> | null = null;
  const sessions: string[] = [];
  let terminal: { signal: NodeJS.Signals | null; status: number | null } | null = null;
  let evidence: JsonRecord | null = null;
  let installedLegacyTransportStatus = candidateMode ? "not-run" : "not-applicable";
  try {
    server = await startProofServer(options.opencode, projectDir, environment);
    const client = proofClient(server.url, projectDir, environment);
    const rootSession = await requestData<JsonRecord>(client.session.create({ directory: projectDir, title: "catalog preflight root" }) as Promise<unknown>, "root create");
    sessions.push(sessionID(rootSession));
    const agentResponse = candidateMode && !options.routeDiagnostic
      ? await client.app.agents({ directory: projectDir }) as unknown as JsonRecord
      : await client.v2.agent.list({ location: { directory: projectDir } }) as unknown as JsonRecord;
    const agentPayload = await requestData<unknown>(Promise.resolve(agentResponse), "agent.list");
    const skillPayload = candidateMode && !options.routeDiagnostic
      ? await requestData<unknown>(client.app.skills({ directory: projectDir }) as Promise<unknown>, "skill.list")
      : await requestData<unknown>(client.v2.skill.list({ location: { directory: projectDir } }) as Promise<unknown>, "skill.list");
    const configPayload = await requestData<JsonRecord>(client.config.get({ directory: projectDir }) as Promise<unknown>, "config.get");
    const toolIDs = await requestData<string[]>(client.tool.ids({ directory: projectDir }) as Promise<unknown>, "tool.ids");
    const agents = bodyRows(agentPayload);
    const skills = bodyRows(skillPayload);
    if (options.routeDiagnostic) {
      const legacyResponse = await client.app.agents({ directory: projectDir }) as unknown as JsonRecord;
      const legacySkillsResponse = await client.app.skills({ directory: projectDir }) as unknown as JsonRecord;
      const locationResponse = await client.v2.location.get({ location: { directory: projectDir } }) as unknown as JsonRecord;
      const legacyPayload = legacyResponse.data;
      const legacySkillsPayload = legacySkillsResponse.data;
      const locationPayload = locationResponse.data;
      const legacyNames = Array.isArray(legacyPayload)
        ? legacyPayload.flatMap((item) => item != null && typeof item === "object" && typeof (item as JsonRecord).name === "string" ? [(item as JsonRecord).name as string] : []).sort()
        : [];
      const location = locationPayload != null && typeof locationPayload === "object" && !Array.isArray(locationPayload)
        ? locationPayload as JsonRecord
        : {};
      const project = location.project != null && typeof location.project === "object" && !Array.isArray(location.project)
        ? location.project as JsonRecord
        : {};
      evidence = {
        schemaVersion: 1,
        candidate: "specialist-team-advisor-route-diagnostic-r1",
        environment: {
          installedOpenCode: installedOpenCodeIdentity(options.opencode),
          node: process.version,
          platform: process.platform,
        },
        routeComparison: {
          configAgentIds: configPayload.agent != null && typeof configPayload.agent === "object" && !Array.isArray(configPayload.agent)
            ? Object.keys(configPayload.agent as JsonRecord).sort()
            : [],
          configSource: "OPENCODE_CONFIG_DIR-only",
          legacy: {
            dataIsArray: Array.isArray(legacyPayload),
            ids: legacyNames,
            status: (legacyResponse.response as JsonRecord | undefined)?.status ?? null,
          },
          legacySkills: {
            dataIsArray: Array.isArray(legacySkillsPayload),
            ids: Array.isArray(legacySkillsPayload)
              ? legacySkillsPayload.flatMap((item) => item != null && typeof item === "object" && typeof (item as JsonRecord).name === "string" ? [(item as JsonRecord).name as string] : []).sort()
              : [],
            status: (legacySkillsResponse.response as JsonRecord | undefined)?.status ?? null,
          },
          location: {
            directoryMatches: location.directory === projectDir,
            projectDirectoryMatches: project.directory === projectDir,
            status: (locationResponse.response as JsonRecord | undefined)?.status ?? null,
          },
          v2: {
            dataIsNestedArray: Array.isArray((agentPayload as JsonRecord).data),
            ids: agents.flatMap((item) => typeof item.id === "string" ? [item.id] : []).sort(),
            outerKeys: Object.keys(agentPayload as JsonRecord).sort(),
            status: (agentResponse.response as JsonRecord | undefined)?.status ?? null,
          },
          v2Skills: {
            dataIsNestedArray: skillPayload != null && typeof skillPayload === "object" && Array.isArray((skillPayload as JsonRecord).data),
            ids: skillPayload != null && typeof skillPayload === "object" && Array.isArray((skillPayload as JsonRecord).data)
              ? ((skillPayload as JsonRecord).data as unknown[]).flatMap((item) => item != null && typeof item === "object" && typeof (item as JsonRecord).name === "string" ? [(item as JsonRecord).name as string] : []).sort()
              : [],
          },
        },
        effects: {
          activeGlobalConfigChanged: false,
          providerRequestCount: 0,
          remoteEffects: false,
          temporaryFixtureOnly: true,
        },
      };
    } else {
    const advisor = agents.find((agent) => agentID(agent) === advisorID);
    const otherAgent = agents.find((agent) => agentID(agent) === "proof-other");
    const configuredAgents = configPayload.agent != null && typeof configPayload.agent === "object" && !Array.isArray(configPayload.agent)
      ? Object.keys(configPayload.agent as JsonRecord).sort()
      : [];
    const configuredAdvisor = configPayload.agent != null && typeof configPayload.agent === "object" && !Array.isArray(configPayload.agent)
      ? (configPayload.agent as JsonRecord)[advisorID]
      : null;
    const configuredAdvisorFacts = configuredAdvisor != null && typeof configuredAdvisor === "object" && !Array.isArray(configuredAdvisor)
      ? {
          keys: Object.keys(configuredAdvisor as JsonRecord).sort(),
          mode: (configuredAdvisor as JsonRecord).mode ?? null,
          permissionKeys: (configuredAdvisor as JsonRecord).permission != null && typeof (configuredAdvisor as JsonRecord).permission === "object"
            ? Object.keys((configuredAdvisor as JsonRecord).permission as JsonRecord).sort()
            : [],
        }
      : null;
    const errorLogs = [...server.stdout, ...server.stderr]
      .map((chunk) => chunk.toString("utf8"))
      .join("")
      .split(/\r?\n/)
      .filter((line) => /ERROR|WARN|failed/i.test(line))
      .join("\n")
      .replaceAll(runtimeRoot, "<proof-root>")
      .replaceAll(normalizedRoot, "<source-root>")
      .slice(-4_000);
    assert.ok(advisor != null && otherAgent != null, `Disposable agents were not root-effective: ${JSON.stringify({ configuredAdvisorFacts, configuredAgents, errorLogs, listedAgents: agents.map(agentID).sort() })}`);
    assert.ok(toolIDs.includes(toolID), "Custom tool was not loaded");
    const wildcardRules = matchingRules(advisor, "*");
    const catalogRules = matchingRules(advisor, toolID);
    if (candidateMode) {
      assert.ok(wildcardRules.some((rule) => ruleEffect(rule) === "allow"), "Advisor unrestricted runtime permission was not retained");
      assert.equal(catalogRules.some((rule) => ruleEffect(rule) === "deny"), false, "Advisor catalog access was denied by a narrower rule");
    } else {
      assert.ok(wildcardRules.some((rule) => ruleEffect(rule) === "deny"), "Proof advisor wildcard deny was not retained");
      assert.equal(ruleEffect(catalogRules.at(-1)), "allow", "Proof advisor exact custom-tool allow was not retained");
    }
    assert.equal(matchingRules(otherAgent, toolID).some((rule) => ruleEffect(rule) === "allow"), false, "Non-advisor gained custom-tool allow");

    const advisorSession = await requestData<JsonRecord>(client.session.create({
      agent: advisorID,
      directory: projectDir,
      parentID: sessionID(rootSession),
      title: "catalog preflight advisor",
    }) as Promise<unknown>, "advisor create");
    sessions.push(sessionID(advisorSession));
    const otherSession = await requestData<JsonRecord>(client.session.create({
      agent: "proof-other",
      directory: projectDir,
      parentID: sessionID(rootSession),
      title: "catalog preflight other",
    }) as Promise<unknown>, "other create");
    sessions.push(sessionID(otherSession));
    const advisorReadback = await requestData<JsonRecord>(client.session.get({ directory: projectDir, sessionID: sessionID(advisorSession) }) as Promise<unknown>, "advisor get");
    const rootReadback = await requestData<JsonRecord>(client.session.get({ directory: projectDir, sessionID: sessionID(rootSession) }) as Promise<unknown>, "root get");
    assert.equal(advisorReadback.agent, advisorID);
    assert.equal(advisorReadback.parentID, sessionID(rootSession));
    assert.equal(rootReadback.parentID, undefined);

    const module = await import(`${pathToFileURL(pluginPath).href}?direct=${Date.now()}`) as { default: (input: JsonRecord) => Promise<JsonRecord> };
    const hooks = await module.default({ client } as unknown as JsonRecord);
    const tool = ((hooks.tool as JsonRecord)[toolID] as JsonRecord).execute as (args: JsonRecord, context: JsonRecord) => Promise<unknown>;
    const positive = toolOutput(await tool({}, {
      agent: advisorID,
      directory: projectDir,
      sessionID: sessionID(advisorSession),
    }));
    assert.equal(positive.status, "ok");
    const entries = candidateMode
      ? [...(positive.agents as unknown[]), ...(positive.skills as unknown[])]
      : positive.entries;
    assert.ok(Array.isArray(entries));
    assert.ok(entries.some((entry) => entry != null && typeof entry === "object" && (entry as JsonRecord).id === "proof-worker"));
    assert.ok(entries.some((entry) => entry != null && typeof entry === "object" && (entry as JsonRecord).id === "proof-skill"));
    assert.equal(entries.some((entry) => entry != null && typeof entry === "object" && [advisorID, controlPlaneID, "proof-hidden"].includes(String((entry as JsonRecord).id))), false);
    const positiveText = JSON.stringify(positive);
    for (const forbidden of [
      "PRIVATE_PROMPT_SENTINEL",
      "PRIVATE_SKILL_BODY_SENTINEL",
      "PRIVATE_CONTROL_DESCRIPTION_SENTINEL",
      "PRIVATE_HIDDEN_DESCRIPTION_SENTINEL",
      sessionID(rootSession),
      sessionID(advisorSession),
      runtimeRoot,
    ]) assert.equal(positiveText.includes(forbidden), false, `Catalog output disclosed ${forbidden}`);

    if (candidateMode) {
      const fallbackCalls: string[] = [];
      const fallbackHooks = await module.default({ client: {
        app: {
          _client: {
            get: (input: { path?: Record<string, string>; query?: Record<string, string>; url: string }) => {
              fallbackCalls.push(input.url);
              const directory = input.query?.directory ?? projectDir;
              if (input.url === "/agent") return client.app.agents({ directory });
              if (input.url === "/skill") return client.app.skills({ directory });
              if (input.url === "/session/{id}" && input.path?.id != null) {
                return client.session.get({ directory, sessionID: input.path.id });
              }
              throw new Error(`Unexpected fallback catalog request: ${input.url}`);
            },
          },
        },
      } } as unknown as JsonRecord);
      const fallbackTool = ((fallbackHooks.tool as JsonRecord)[toolID] as JsonRecord).execute as (args: JsonRecord, context: JsonRecord) => Promise<unknown>;
      const fallback = toolOutput(await fallbackTool({}, {
        agent: advisorID,
        directory: projectDir,
        sessionID: sessionID(advisorSession),
      }));
      assert.equal(fallback.status, "ok");
      assert.deepEqual(fallbackCalls, ["/session/{id}", "/session/{id}", "/agent", "/skill"]);
      installedLegacyTransportStatus = "passed";
    }

    const denied = toolOutput(await tool({}, {
      agent: "proof-other",
      directory: projectDir,
      sessionID: sessionID(otherSession),
    }));
    if (candidateMode) {
      assert.equal(denied.status, "denied");
      assert.deepEqual(denied.agents, []);
      assert.deepEqual(denied.skills, []);
    } else {
      assert.deepEqual(denied, { entries: [], status: "denied" });
    }
    const missingHooks = await module.default({ client: candidateMode ? { app: {} } : { v2: {} } } as unknown as JsonRecord);
    const missingTool = ((missingHooks.tool as JsonRecord)[toolID] as JsonRecord).execute as (args: JsonRecord, context: JsonRecord) => Promise<unknown>;
    const missing = toolOutput(await missingTool({}, {
      agent: advisorID,
      directory: projectDir,
      sessionID: "not-read-when-api-is-missing",
    }));
    if (candidateMode) {
      assert.equal(missing.status, "unknown");
      assert.deepEqual(missing.agents, []);
      assert.deepEqual(missing.skills, []);
      assert.equal(((missing.warnings as JsonRecord[])[0] as JsonRecord).cause, "catalog-api-unavailable");
    } else {
      assert.deepEqual(missing, { entries: [], reason: "catalog-api-unavailable", status: "unknown" });
    }

    const sdkRoot = path.join(normalizedRoot, "global", "node_modules", "@opencode-ai", "sdk");
    const pluginRoot = path.join(normalizedRoot, "global", "node_modules", "@opencode-ai", "plugin");
    const sourceFiles = [
      path.join(sdkRoot, "dist", "v2", "gen", "sdk.gen.d.ts"),
      path.join(sdkRoot, "dist", "v2", "gen", "types.gen.d.ts"),
      path.join(pluginRoot, "dist", "index.d.ts"),
      path.join(pluginRoot, "dist", "tool.d.ts"),
      ...(options.plugin == null ? [] : [options.plugin]),
      ...(options.agent == null ? [] : [options.agent]),
    ];
    evidence = {
      schemaVersion: 1,
      candidate: candidateMode ? "specialist-catalog-plugin-r1" : "specialist-catalog-runtime-preflight-r1",
      generatedAt: new Date().toISOString(),
      environment: {
        installedOpenCode: installedOpenCodeIdentity(options.opencode),
        node: process.version,
        platform: process.platform,
        pluginPackageVersion: packageVersion(path.join(pluginRoot, "package.json")),
        sdkPackageVersion: packageVersion(path.join(sdkRoot, "package.json")),
        sourceIdentities: sourceFiles.map((file) => ({ path: path.relative(normalizedRoot, file).replaceAll("\\", "/"), sha256: sha256File(file) })),
      },
      apiShapes: {
        agentList: candidateMode ? "client.app.agents({ directory }) -> Agent[]" : "client.v2.agent.list({ location: { directory } }) -> { location, data: AgentV2Info[] }",
        skillList: candidateMode ? "client.app.skills({ directory }) -> Skill[]" : "client.v2.skill.list({ location: { directory } }) -> { location, data: SkillV2Info[] }",
        toolContext: ["agent", "directory", "sessionID", "worktree"],
        toolIds: "client.tool.ids({ directory }) -> string[]",
        rootResolution: "client.session.get({ directory, sessionID }) parentID walk",
      },
      controls: {
        rootEffectiveCatalog: {
          agentCount: agents.length,
          skillCount: skills.length,
          status: "passed",
          testAgentIds: agents.map(agentID).filter((id): id is string => typeof id === "string" && id.startsWith("proof-")).sort(),
          testSkillIds: skills.map((skill) => skill.name).filter((name) => typeof name === "string" && name.startsWith("proof-")).sort(),
          toolLoaded: true,
        },
        customToolPermission: {
          advisorCatalogAccess: candidateMode ? "wildcard-allow" : "exact-allow",
          advisorWildcard: candidateMode ? "allow" : "deny",
          nonAdvisorExactAllow: false,
          status: "passed",
        },
        attribution: {
          advisorChildAgent: advisorID,
          advisorChildLinkedToRoot: true,
          positiveStatus: positive.status,
          rootParentless: true,
          rootRefMatches: (candidateMode ? positive.rootSessionRef : positive.rootRef) === crypto.createHash("sha256").update(sessionID(rootSession)).digest("hex").slice(0, 16),
          status: "passed",
        },
        denial: { entries: 0, status: denied.status },
        filtering: {
          bodyPromptPathAndSessionDisclosure: false,
          hiddenControlAndSelfOmitted: true,
          stableOrder: candidateMode
            ? [positive.agents, positive.skills].every((group) => entryIDs(group).every((value, index, all) => index === 0 || all[index - 1].localeCompare(value) <= 0))
            : entries.map((entry) => `${String((entry as JsonRecord).kind)}:${String((entry as JsonRecord).id)}`).every((value, index, all) => index === 0 || all[index - 1].localeCompare(value) <= 0),
          status: "passed",
        },
        missingApi: {
          executeStatus: missing.status,
          initReturnedHooks: true,
          reason: candidateMode ? ((missing.warnings as JsonRecord[])[0] as JsonRecord).cause : missing.reason,
          status: "passed",
        },
        installedLegacyTransport: {
          routes: ["/session/{id}", "/agent", "/skill"],
          status: installedLegacyTransportStatus,
        },
      },
      effects: {
        activeGlobalConfigChanged: false,
        providerRequestCount: 0,
        remoteEffects: false,
        repositoryCandidateSourceLoaded: candidateMode,
        temporaryFixtureOnly: true,
      },
    };
    }
  } finally {
    if (server != null) {
      const client = proofClient(server.url, projectDir, environment);
      for (const id of sessions.reverse()) {
        try {
          await client.session.delete({ directory: projectDir, sessionID: id });
        } catch {
          // Server termination still removes the isolated fixture database.
        }
      }
      terminal = await stopProofServer(server);
    }
    fs.rmSync(runtimeRoot, { force: true, recursive: true });
  }
  assert.ok(evidence != null);
  evidence.cleanup = {
    serverSignal: terminal?.signal ?? null,
    serverStatus: terminal?.status ?? null,
    sessionsRequestedForDeletion: sessions.length,
    temporaryFixtureRemoved: !fs.existsSync(runtimeRoot),
  };
  fs.mkdirSync(path.dirname(options.evidence), { recursive: true });
  fs.writeFileSync(options.evidence, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify({ evidence: path.relative(normalizedRoot, options.evidence).replaceAll("\\", "/"), status: options.routeDiagnostic ? "observed" : "passed" })}\n`);
}

await main();
