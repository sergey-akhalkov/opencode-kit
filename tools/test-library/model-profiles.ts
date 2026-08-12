import fs from "node:fs";
import path from "node:path";
import {
  assertFailure,
  assertOutputContains,
  assertOutputExcludes,
  assertSuccess,
  invokeValidator,
  newLibraryFixture,
  type TestCase,
  writeText,
} from "../test-helpers/library.ts";

type FixtureProfile = {
  $schema: string;
  model: string;
  small_model: string;
  agent: Record<string, Record<string, unknown>>;
  [key: string]: unknown;
};

function profilePath(fixture: string, profileName: string): string {
  return path.join(fixture, "global", "model-profiles", `${profileName}.json`);
}

function readProfile(fixture: string, profileName: string): FixtureProfile {
  return JSON.parse(fs.readFileSync(profilePath(fixture, profileName), "utf8")) as FixtureProfile;
}

function writeProfile(fixture: string, profileName: string, profile: FixtureProfile): void {
  writeText(profilePath(fixture, profileName), `${JSON.stringify(profile, null, 2)}\n`);
}

export const modelProfileTests: TestCase[] = [
  {
    name: "model profile validator accepts the complete synthetic fixture baseline",
    run: () => {
      const fixture = newLibraryFixture("model-profile-valid-baseline");
      assertSuccess(invokeValidator(fixture), "A complete synthetic three-profile fixture must validate.");
    },
  },
  {
    name: "model profile validator rejects malformed JSON",
    run: () => {
      const fixture = newLibraryFixture("model-profile-malformed-json");
      writeText(profilePath(fixture, "grok-only"), "{ invalid json\n");
      const result = invokeValidator(fixture);
      assertFailure(result, "Malformed committed model profile JSON must fail validation.");
      assertOutputContains(result, "contains invalid JSON", "Malformed JSON diagnostic must identify the profile parse failure.");
      assertOutputContains(result, "global/model-profiles/grok-only.json", "Malformed JSON diagnostic must identify the exact profile.");
    },
  },
  {
    name: "model profile validator rejects unsupported root and agent fields without content disclosure",
    run: () => {
      const fixture = newLibraryFixture("model-profile-unsupported-fields");
      const secret = "credential-value-must-not-appear";
      const grok = readProfile(fixture, "grok-only");
      grok.permission = { bash: "allow", credential: secret };
      writeProfile(fixture, "grok-only", grok);
      const sol = readProfile(fixture, "sol-only");
      sol.agent.build!.tools = { bash: true };
      writeProfile(fixture, "sol-only", sol);

      const result = invokeValidator(fixture);
      assertFailure(result, "Unsupported model-profile behavior fields must fail validation.");
      assertOutputContains(result, "unsupported field 'permission'", "Root behavior field diagnostic must name the rejected field.");
      assertOutputContains(result, "agent 'build' contains unsupported field 'tools'", "Agent behavior field diagnostic must name the route and field.");
      assertOutputExcludes(result, secret, "Restricted-field diagnostics must not disclose field content.");
    },
  },
  {
    name: "model profile validator rejects a missing governed agent route",
    run: () => {
      const fixture = newLibraryFixture("model-profile-missing-agent");
      const profile = readProfile(fixture, "quality-independent");
      delete profile.agent["demo-reviewer"];
      writeProfile(fixture, "quality-independent", profile);
      const result = invokeValidator(fixture);
      assertFailure(result, "A committed profile missing a governed fixture agent must fail validation.");
      assertOutputContains(result, "agent matrix is incomplete", "Missing route diagnostic must identify matrix incompleteness.");
      assertOutputContains(result, "Missing: demo-reviewer", "Missing route diagnostic must identify the exact agent.");
    },
  },
  {
    name: "model profile validator rejects a newly added agent until every profile routes it",
    run: () => {
      const fixture = newLibraryFixture("model-profile-new-agent");
      const newAgentPath = path.join(fixture, "global", "agents", "new-reviewer.md");
      const existingAgent = fs.readFileSync(path.join(fixture, "global", "agents", "demo-reviewer.md"), "utf8");
      // Deliberately bypass writeText's ordinary-fixture synchronization to reproduce catalog drift.
      fs.writeFileSync(newAgentPath, existingAgent, "utf8");
      const result = invokeValidator(fixture);
      assertFailure(result, "A new reusable agent without routes in all committed profiles must fail validation.");
      assertOutputContains(result, "Missing: new-reviewer", "Catalog drift diagnostic must identify the newly added agent.");
      for (const profileName of ["grok-only", "quality-independent", "sol-only"]) {
        assertOutputContains(result, `global/model-profiles/${profileName}.json`, `Catalog drift must be attributed to ${profileName}.`);
      }
    },
  },
  {
    name: "model profile validator rejects exact committed preset drift",
    run: () => {
      const fixture = newLibraryFixture("model-profile-preset-drift");
      const profile = readProfile(fixture, "quality-independent");
      profile.agent.build = { model: "xai/grok-4.6", variant: "high" };
      writeProfile(fixture, "quality-independent", profile);
      const result = invokeValidator(fixture);
      assertFailure(result, "A valid but drifted committed route must fail exact preset validation.");
      assertOutputContains(
        result,
        "Committed model profile 'quality-independent' route 'build' must be openai/gpt-5.6-sol/xhigh",
        "Preset drift diagnostic must identify the exact expected route.",
      );
    },
  },
  {
    name: "model profile validator rejects malformed model and variant identifiers",
    run: () => {
      const fixture = newLibraryFixture("model-profile-invalid-identifiers");
      const grok = readProfile(fixture, "grok-only");
      grok.model = "missing-provider-separator";
      writeProfile(fixture, "grok-only", grok);
      const sol = readProfile(fixture, "sol-only");
      sol.agent.build!.variant = "invalid/variant";
      writeProfile(fixture, "sol-only", sol);
      const result = invokeValidator(fixture);
      assertFailure(result, "Malformed model and variant identifiers must fail validation.");
      assertOutputContains(result, "field 'model' must be a provider/model identifier", "Top-level model diagnostic must identify the required shape.");
      assertOutputContains(result, "field 'agent.build.variant' must be a non-empty variant identifier", "Agent variant diagnostic must identify the exact field.");
    },
  },
  {
    name: "model profile validator rejects local ignore policy drift",
    run: () => {
      const fixture = newLibraryFixture("model-profile-local-ignore-drift");
      writeText(path.join(fixture, ".gitignore"), "/global/model-profiles/**/*.json\n");
      const result = invokeValidator(fixture);
      assertFailure(result, "A broadened local-profile ignore rule must fail validation.");
      assertOutputContains(
        result,
        "must contain only exact rule '/global/model-profiles/local/*.json'",
        "Ignore-policy diagnostic must identify the exact accepted rule.",
      );
    },
  },
  {
    name: "model profile validator rejects reusable-agent model and variant pins",
    run: () => {
      const fixture = newLibraryFixture("model-profile-agent-pins");
      const agentPath = path.join(fixture, "global", "agents", "demo-reviewer.md");
      const agent = fs.readFileSync(agentPath, "utf8");
      writeText(agentPath, agent.replace("mode: subagent", "mode: subagent\nmodel: owner/pinned\nvariant: pinned"));
      const result = invokeValidator(fixture);
      assertFailure(result, "Reusable agent frontmatter pins must fail profile validation.");
      assertOutputContains(result, "frontmatter to omit 'model'", "Model-pin diagnostic must identify the forbidden field.");
      assertOutputContains(result, "frontmatter to omit 'variant'", "Variant-pin diagnostic must identify the forbidden field.");
      assertOutputContains(result, "global/agents/demo-reviewer.md", "Pin diagnostics must identify the exact reusable agent.");
    },
  },
  {
    name: "model profile validator accepts a complete custom local profile",
    run: () => {
      const fixture = newLibraryFixture("model-profile-valid-local");
      const local = readProfile(fixture, "quality-independent");
      local.model = "owner/local-primary";
      local.small_model = "owner/local-small";
      for (const agentName of Object.keys(local.agent)) {
        local.agent[agentName] = { model: `owner/${agentName}`, variant: "balanced" };
      }
      writeText(
        path.join(fixture, "global", "model-profiles", "local", "personal.json"),
        `${JSON.stringify(local, null, 2)}\n`,
      );
      assertSuccess(invokeValidator(fixture), "A complete restricted local model profile must validate without preset-matrix enforcement.");
    },
  },
];
