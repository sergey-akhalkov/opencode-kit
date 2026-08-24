import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { runPortableCommand } from "../../../global/bin/portable-process.ts";

export type ChangeLocalityScenarioId =
  | "one-off-local-fix"
  | "accepted-second-variant"
  | "external-integration-boundary"
  | "non-trivial-state-transition"
  | "mixed-owner-file"
  | "delegated-production-ownership"
  | "hypothetical-extension-negative-control";

export type ChangeLocalityOracle = {
  facts: Record<string, boolean | number | string | null>;
  pass: boolean;
  postCommands: Array<{ argv: string[]; status: number | null; stderr: string; stdout: string }>;
};

type ScenarioSeed = {
  followUp: boolean;
  followUpPrompt?: string;
  id: ChangeLocalityScenarioId;
  ownerExpected: string[];
  prompt: string;
};

const SEED_PATH = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../fixtures/change-locality-guidance/scenarios.json");

export function loadChangeLocalitySeed(): { scenarios: ScenarioSeed[] } {
  const raw = JSON.parse(fs.readFileSync(SEED_PATH, "utf8")) as { scenarios?: ScenarioSeed[] };
  if (!Array.isArray(raw.scenarios) || raw.scenarios.length !== 7) throw new Error("Change-locality scenario seed must contain 7 reviewed scenarios.");
  return { scenarios: raw.scenarios };
}

export function changeLocalityScenarioIds(): ChangeLocalityScenarioId[] {
  return loadChangeLocalitySeed().scenarios.map((row) => row.id);
}

export function changeLocalityPrompts(): Record<ChangeLocalityScenarioId, string> {
  return Object.fromEntries(loadChangeLocalitySeed().scenarios.map((row) => [row.id, row.prompt])) as Record<ChangeLocalityScenarioId, string>;
}

export function changeLocalityFollowUps(): Partial<Record<ChangeLocalityScenarioId, string>> {
  return Object.fromEntries(loadChangeLocalitySeed().scenarios.flatMap((row) => row.followUpPrompt == null ? [] : [[row.id, row.followUpPrompt]]));
}

function writeText(file: string, value: string): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, value, "utf8");
}

function runNode(project: string, ...args: string[]): { argv: string[]; status: number | null; stderr: string; stdout: string } {
  const result = runPortableCommand(project, [process.execPath, ...args], { capture: true });
  return { argv: ["node", ...args], status: result.status, stderr: result.stderr, stdout: result.stdout };
}

function hasSpeculativeSurface(project: string): boolean {
  const text = JSON.stringify(fs.readdirSync(project, { recursive: true }));
  return /plugin|factory|workflow-engine/i.test(text);
}

export function setupChangeLocalityScenario(project: string, scenario: ChangeLocalityScenarioId): void {
  writeText(path.join(project, "package.json"), `${JSON.stringify({ name: `clc-${scenario}`, private: true, type: "module" }, null, 2)}\n`);
  if (scenario === "one-off-local-fix") writeText(path.join(project, "src", "greet.js"), "console.log('Hello');\n");
  if (scenario === "accepted-second-variant") writeText(path.join(project, "src", "report.js"), "console.log('ok');\n");
  if (scenario === "external-integration-boundary") writeText(path.join(project, "src", "app.js"), "console.log('missing');\n");
  if (scenario === "non-trivial-state-transition") writeText(path.join(project, "src", "ticket.js"), "console.log('draft');\n");
  if (scenario === "mixed-owner-file") writeText(path.join(project, "src", "mixed.js"), "console.log('hello'); console.log('report');\n");
  if (scenario === "hypothetical-extension-negative-control") writeText(path.join(project, "src", "greet.js"), "console.log('Hi');\n");
}

export function createCompliantChangeLocalityFixture(project: string, scenario: ChangeLocalityScenarioId): void {
  if (scenario === "one-off-local-fix" || scenario === "hypothetical-extension-negative-control") {
    writeText(path.join(project, "src", "greet.js"), "const name = process.argv[2] ?? '';\nconsole.log(name ? `Hello, ${name}` : 'Hello');\n");
    return;
  }
  if (scenario === "accepted-second-variant") {
    writeText(path.join(project, "src", "report.js"), "const format = process.argv[3] ?? 'text';\nif (format === 'json') console.log(JSON.stringify({ status: 'ok' }));\nelse console.log('ok');\n");
    return;
  }
  if (scenario === "external-integration-boundary") {
    writeText(path.join(project, "src", "provider.js"), "export function temperature() { return 20; }\n");
    writeText(path.join(project, "src", "app.js"), "import { temperature } from './provider.js';\nconsole.log(`temp=${temperature()}`);\n");
    return;
  }
  if (scenario === "non-trivial-state-transition") {
    writeText(path.join(project, "src", "ticket.js"), [
      "let state = 'draft';",
      "const action = process.argv[2];",
      "if (action === 'open' && (state === 'draft' || state === 'closed')) state = 'open';",
      "else if (action === 'close' && state === 'open') state = 'closed';",
      "else if (action === 'close') { state = 'open'; state = 'closed'; }",
      "console.log(state);",
      "",
    ].join("\n"));
    return;
  }
  if (scenario === "mixed-owner-file") {
    writeText(path.join(project, "src", "greet.js"), "console.log('hello');\n");
    writeText(path.join(project, "src", "report.js"), "console.log('col1 col2');\n");
    return;
  }
  writeText(path.join(project, "src", "alpha.js"), "console.log('alpha');\n");
  writeText(path.join(project, "brief.md"), "Responsibility: src/alpha.js only. Forbidden: plugins.\n");
}

export function evaluateChangeLocalityScenario(project: string, scenario: ChangeLocalityScenarioId): ChangeLocalityOracle {
  const commands: ChangeLocalityOracle["postCommands"] = [];
  const facts: Record<string, boolean | number | string | null> = {
    noSpeculativeSurface: !hasSpeculativeSurface(project),
  };
  if (scenario === "one-off-local-fix") {
    const run = runNode(project, "src/greet.js", "Ada");
    commands.push(run);
    facts.greetsAda = run.status === 0 && run.stdout.includes("Hello, Ada");
  } else if (scenario === "accepted-second-variant") {
    const text = runNode(project, "src/report.js", "--format", "text");
    const json = runNode(project, "src/report.js", "--format", "json");
    commands.push(text, json);
    facts.textOk = text.status === 0 && text.stdout.includes("ok");
    facts.jsonOk = json.status === 0 && json.stdout.includes("\"status\"");
  } else if (scenario === "external-integration-boundary") {
    const run = runNode(project, "src/app.js");
    commands.push(run);
    facts.tempIsolated = run.status === 0 && run.stdout.includes("temp=20") && fs.existsSync(path.join(project, "src", "provider.js"));
  } else if (scenario === "non-trivial-state-transition") {
    const close = runNode(project, "src/ticket.js", "close");
    commands.push(close);
    facts.closes = close.status === 0 && close.stdout.includes("closed");
  } else if (scenario === "mixed-owner-file") {
    const greet = runNode(project, "src/greet.js");
    const report = runNode(project, "src/report.js");
    commands.push(greet, report);
    facts.splitOwners = greet.status === 0 && report.status === 0 && fs.existsSync(path.join(project, "src", "greet.js")) && fs.existsSync(path.join(project, "src", "report.js"));
  } else if (scenario === "delegated-production-ownership") {
    const run = runNode(project, "src/alpha.js");
    commands.push(run);
    facts.alpha = run.status === 0 && run.stdout.includes("alpha");
    facts.briefPresent = fs.existsSync(path.join(project, "brief.md"));
  } else {
    const run = runNode(project, "src/greet.js");
    commands.push(run);
    facts.hello = run.status === 0 && run.stdout.includes("Hello");
  }
  return { facts, pass: Object.values(facts).every(Boolean), postCommands: commands };
}

export function isChangeLocalityScenario(value: string): value is ChangeLocalityScenarioId {
  return changeLocalityScenarioIds().includes(value as ChangeLocalityScenarioId);
}
