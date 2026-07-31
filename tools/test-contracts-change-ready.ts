import fs from "node:fs";
import path from "node:path";

import {
  CHANGE_READY_SDLC_CONTINUATION_TOKENS,
  CHANGE_READY_SDLC_DEVELOPMENT_STAGE_MARKERS,
  CHANGE_READY_SDLC_LIFECYCLE_MARKERS,
  CHANGE_READY_SDLC_OUTCOME_AUTHORITY_MARKERS,
  FORBIDDEN_PRODUCTION_ROUTING_PATTERNS,
  FORBIDDEN_PRODUCTION_ROUTING_SCAN_FILES,
  GLOBAL_AGENTS_DECISION_READY_HANDOFF_FIELDS,
  GLOBAL_AGENTS_FANOUT_CONTINUATION_TOKENS,
  GLOBAL_AGENTS_NON_WAIVABLE_RISK_CLAUSE,
  GLOBAL_AGENTS_OUTCOME_AUTHORITY_MARKERS,
  GLOBAL_AGENTS_PROTECTED_BOUNDARY_CATEGORIES,
  GLOBAL_AGENTS_SELF_CONTAINED_HANDOFF_MARKERS,
} from "./contracts/skills.ts";
import {
  FINAL_CANDIDATE_REVIEWER_REQUIRED_TEXT,
  REVIEWER_SDET_FORBIDDEN_ACTION_FIELDS,
} from "./contracts/agents.ts";
import {
  OUTCOME_AUTHORITY_SCOPE_MARKERS,
  OUTCOME_AUTHORITY_SCOPE_SURFACES,
} from "./contracts/reviewer-binding.ts";
import {
  ALLOWED_SDET_QUALITY_ENGINEER_BASH_RULES,
  ALLOWED_SDET_QUALITY_ENGINEER_EDIT_RULES,
  SDET_QUALITY_ENGINEER_DENIED_PERMISSION_KEYS,
  SDET_QUALITY_ENGINEER_REQUIRED_TEXT,
} from "./contracts/sdet-quality-engineer.ts";
import {
  assert,
  assertDeepEqual,
  assertEqual,
  libraryRoot,
  type TestCase,
} from "./test-helpers/library.ts";

const root = libraryRoot;

function assertTokens(text: string, tokens: readonly string[], message: string): void {
  for (const token of tokens) assert(text.includes(token), `${message}: ${token}`);
}

function assertOrderedTokens(text: string, tokens: readonly string[], message: string): void {
  let cursor = -1;
  for (const token of tokens) {
    const index = text.indexOf(token, cursor + 1);
    assert(index > cursor, `${message}: ${token}`);
    cursor = index;
  }
}

const EXPECTED_LIFECYCLE_MARKERS = [
  "Profiles And Stage",
  "Authoritative Brief",
  "Runtime Proof",
  "Candidate Reference",
  "Optional Risk Discovery",
  "Critical SDET",
  "Validate And Freeze RC",
  "Stable Handoff",
];

const EXPECTED_DEVELOPMENT_STAGE_MARKERS = [
  "Stable Handoff",
  "Development-Stage: development | MVP | RC<n> | stable",
  "Ordinary Small | Material",
  "Neither MVP, RC, nor stable authorizes",
  "Stable Candidate: RC",
  "returns to `development`",
];

const EXPECTED_DECISION_READY_HANDOFF_FIELDS = [
  "plain-language goal and current state",
  "what happened and why it matters",
  "outcome working status",
  "exact failure/evidence",
  "facts, inferences, and unknowns",
  "root-cause status/confidence",
  "attempted paths and why they did not resolve the blocker",
  "why no authorized path remains",
  "why user authority is required",
  "exact requested action",
  "real alternatives/consequences if any",
  "option advantages, disadvantages, risks, reversibility, and cost",
  "agent recommendation and rationale",
  "what happens after each choice",
  "residual risk",
  "preserved state",
  "exact reply needed from the user",
];

const EXPECTED_SELF_CONTAINED_HANDOFF_MARKERS = [
  "one self-contained message",
  "without opening prior chat, code, documents, logs, or links",
  "Links and internal identifiers are optional supporting evidence",
  "remove every link and internal identifier",
];

const EXPECTED_FINAL_REVIEWER_MARKERS = [
  "## Contract Reference",
  "`instructions/leaf-reviewer-agent-contract.md`",
  "fresh read-only",
  "After current MVP proof",
  "complete readable current candidate",
  "Candidate Reference",
  "optional review remains attributed to the exact candidate",
  "Risk Matrix",
  "Risk ID",
  "Requirement/Invariant",
  "Reachable Scenario And Enforced Envelope",
  "Business Consequence",
  "Likelihood",
  "Recommendation",
  "Confidence",
  "Reproduction Procedure",
  "Smallest Mitigation Note",
  "Evidence Gaps And Residual Risks",
  "Do not return an acceptance/rejection verdict",
  "Main alone reproduces, classifies, fixes, parks",
  "directly readable",
  "FINAL_CANDIDATE_REVIEW_REPORT",
  "Runtime Proof",
  "exact candidate assessed",
  "Effective Model",
  "remove, narrow, reuse, local guard",
];

export const changeReadyContractTests: TestCase[] = [
  {
    name: "contracts: current lifecycle, owner-handoff, and optional final-review arrays are exact",
    run: () => {
      assertDeepEqual([...CHANGE_READY_SDLC_LIFECYCLE_MARKERS], EXPECTED_LIFECYCLE_MARKERS, "Lifecycle marker array drifted.");
      assertDeepEqual([...CHANGE_READY_SDLC_DEVELOPMENT_STAGE_MARKERS], EXPECTED_DEVELOPMENT_STAGE_MARKERS, "Development-Stage marker array drifted.");
      assertDeepEqual([...GLOBAL_AGENTS_DECISION_READY_HANDOFF_FIELDS], EXPECTED_DECISION_READY_HANDOFF_FIELDS, "Decision-ready handoff field array drifted.");
      assertDeepEqual([...GLOBAL_AGENTS_SELF_CONTAINED_HANDOFF_MARKERS], EXPECTED_SELF_CONTAINED_HANDOFF_MARKERS, "Self-contained handoff marker array drifted.");
      assertDeepEqual([...FINAL_CANDIDATE_REVIEWER_REQUIRED_TEXT], EXPECTED_FINAL_REVIEWER_MARKERS, "Optional final-review marker array drifted.");
    },
  },
  {
    name: "contracts: compact skill keeps current stage, critical SDET, and writer-safety boundaries",
    run: () => {
      const skill = fs.readFileSync(path.join(root, "global", "skills", "change-ready-sdlc", "SKILL.md"), "utf8");
      assertOrderedTokens(skill, EXPECTED_LIFECYCLE_MARKERS, "Compact skill lifecycle heading order drifted");
      assertTokens(skill, [
        ...CHANGE_READY_SDLC_DEVELOPMENT_STAGE_MARKERS,
        ...CHANGE_READY_SDLC_OUTCOME_AUTHORITY_MARKERS,
        ...CHANGE_READY_SDLC_CONTINUATION_TOKENS,
        "After current Runtime Proof, capture a readable Product Candidate Reference plus Proof Runner, Evaluator, Environment Identity, and Raw Evidence Bundle identities when applicable, then set `Development-Stage: MVP`",
        "repeat affected Runtime Proof lanes to restore `MVP`",
        "RC numbering starts at RC1 and never resets within the root",
        "next complete qualification freezes `RC<n+1>`",
        "Another fresh attempt is earned only when",
        "permanently stops SDET for the root",
        "parked non-critical work never blocks RC or stable",
      ], "Compact skill missing current qualification invariant");
    },
  },
  {
    name: "contracts: always-loaded authority preserves non-waivable risks and global writer closure",
    run: () => {
      const agents = fs.readFileSync(path.join(root, "global", "AGENTS.md"), "utf8");
      assertTokens(agents, [
        "Development-Stage: development | MVP | RC<n> | stable",
        "Stable Candidate: RC<n>",
        "Neither MVP, RC, nor stable authorizes",
        ...GLOBAL_AGENTS_OUTCOME_AUTHORITY_MARKERS,
        ...GLOBAL_AGENTS_FANOUT_CONTINUATION_TOKENS,
        ...GLOBAL_AGENTS_PROTECTED_BOUNDARY_CATEGORIES.map(({ marker }) => marker),
        GLOBAL_AGENTS_NON_WAIVABLE_RISK_CLAUSE,
        ...GLOBAL_AGENTS_DECISION_READY_HANDOFF_FIELDS,
        ...GLOBAL_AGENTS_SELF_CONTAINED_HANDOFF_MARKERS,
        "Reviewer invocation is optional and risk-driven, not a lifecycle gate",
        "Known non-critical limitations may remain",
      ], "Global authority missing current safety invariant");
    },
  },
  {
    name: "contracts: loaded authority surfaces reject superseded active lifecycle policy",
    run: () => {
      for (const relative of OUTCOME_AUTHORITY_SCOPE_SURFACES) {
        const text = fs.readFileSync(path.join(root, relative), "utf8");
        assertTokens(text, OUTCOME_AUTHORITY_SCOPE_MARKERS, `${relative} missing outcome-authority marker`);
      }
      for (const relative of FORBIDDEN_PRODUCTION_ROUTING_SCAN_FILES) {
        const text = fs.readFileSync(path.join(root, relative), "utf8");
        for (const forbidden of FORBIDDEN_PRODUCTION_ROUTING_PATTERNS) {
          assert(!text.includes(forbidden.needle), `${relative} retains forbidden active policy: ${forbidden.diagnostic}`);
        }
      }
    },
  },
  {
    name: "contracts: Ordinary Small remains main-default and free of Material reviewer ceremony",
    run: () => {
      const agents = fs.readFileSync(path.join(root, "global", "AGENTS.md"), "utf8");
      assertTokens(agents, [
        "### Ordinary Small (default)",
        "Main is the default production author for Ordinary Small and Material",
        "run-observe-correct",
        "focused validation",
        "Development-Stage",
        "Optional final-candidate, delivery, code-quality, and domain reviewers",
      ], "Ordinary Small routing missing current path");
      assert(!/Ordinary Small[^\n]*(?:requires?|must use)[^\n]*(?:reviewer|fresh SDET)/i.test(agents), "Ordinary Small must not acquire mandatory reviewer/SDET ceremony.");
    },
  },
  {
    name: "contracts: SDET remains inherited-model test-only authority with production denied",
    run: () => {
      const sdet = fs.readFileSync(path.join(root, "global", "agents", "sdet-quality-engineer.md"), "utf8");
      const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(sdet)?.[1] ?? "";
      assert(!/^model\s*:/m.test(frontmatter), "SDET must inherit the invoking primary model.");
      assert(!/^variant\s*:/m.test(frontmatter), "SDET must not pin a model variant.");
      assertEqual(ALLOWED_SDET_QUALITY_ENGINEER_BASH_RULES.get("permission.bash"), "deny", "SDET bash permission drifted.");
      assertEqual(ALLOWED_SDET_QUALITY_ENGINEER_EDIT_RULES.get("permission.edit"), "ask", "Every SDET edit must remain approval-gated.");
      assert(SDET_QUALITY_ENGINEER_DENIED_PERMISSION_KEYS.includes("task"), "SDET nested-agent denial drifted.");
      assertTokens(sdet, [
        ...SDET_QUALITY_ENGINEER_REQUIRED_TEXT,
        "unknown effective model makes the attempt `blocked`",
        "test-only write scope",
        "Never edit or repair production",
        "Action: critical-risks-reported | no-critical-risk | blocked",
      ], "SDET role missing current independence/safety marker");
    },
  },
  {
    name: "contracts: optional reviewers remain evidence-only and never stage authorities",
    run: () => {
      for (const fileName of ["final-candidate-reviewer.md", "session-delivery-reviewer.md", "code-quality-reviewer.md"]) {
        const text = fs.readFileSync(path.join(root, "global", "agents", fileName), "utf8");
        assert(text.includes("Effective Model"), `${fileName} must record Effective Model.`);
        for (const forbidden of REVIEWER_SDET_FORBIDDEN_ACTION_FIELDS) {
          assert(!text.includes(forbidden), `${fileName} exposes forbidden reviewer authority: ${forbidden}`);
        }
      }
      const finalReviewer = fs.readFileSync(path.join(root, "global", "agents", "final-candidate-reviewer.md"), "utf8");
      assertTokens(finalReviewer, FINAL_CANDIDATE_REVIEWER_REQUIRED_TEXT, "Final reviewer missing current optional-review marker");
    },
  },
  {
    name: "contracts: routing validator imports Development-Stage policy without redeclaration",
    run: () => {
      const routing = fs.readFileSync(path.join(root, "tools", "validators", "routing.ts"), "utf8");
      assert(routing.includes("CHANGE_READY_SDLC_DEVELOPMENT_STAGE_MARKERS"), "Routing must import the current Development-Stage marker array.");
      assert(!routing.includes("CHANGE_READY_SDLC_CHANGE_STATUS_MARKERS"), "Routing must not restore the removed Change-Status export.");
    },
  },
  {
    name: "contracts: README exposes MVP proof, critical SDET, RC freeze, and optional review",
    run: () => {
      const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");
      assertTokens(readme, [
        "run-observe-correct to MVP",
        "accepted-scope completion",
        "critical-only SDET for Material behavior",
        "RC freeze",
        "local stable handoff",
        "Optional reviewers never become stage gates",
        "Development-Stage: development | MVP | RC<n> | stable",
      ], "README lifecycle route drifted");
    },
  },
  {
    name: "contracts: every reusable role inherits model provenance",
    run: () => {
      const agentsDir = path.join(root, "global", "agents");
      for (const fileName of fs.readdirSync(agentsDir).filter((name) => name.endsWith(".md"))) {
        const text = fs.readFileSync(path.join(agentsDir, fileName), "utf8");
        const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)?.[1];
        if (frontmatter === undefined) continue;
        assert(!/^model\s*:/m.test(frontmatter), `${fileName} must not pin a model.`);
        assert(!/^variant\s*:/m.test(frontmatter), `${fileName} must not pin a variant.`);
      }
    },
  },
  {
    name: "contracts: pure lifecycle fixture enforces MVP, RC, stable, mutation, and critical SDET stop",
    run: () => {
      type Stage = "development" | "MVP" | `RC${number}` | "stable";
      type SdetAction = "critical-risks-reported" | "no-critical-risk" | "blocked";
      type State = {
        stage: Stage;
        rc: number;
        proven: boolean;
        scopeComplete: boolean;
        validationGreen: boolean;
        sdetTerminal: boolean;
        sdetStopped: boolean;
        confirmedCritical: boolean;
        correctedAfterCritical: boolean;
        knownNonDeferrable: boolean;
        stableCandidate: string | null;
      };
      const create = (): State => ({
        stage: "development",
        rc: 0,
        proven: false,
        scopeComplete: false,
        validationGreen: false,
        sdetTerminal: false,
        sdetStopped: false,
        confirmedCritical: false,
        correctedAfterCritical: false,
        knownNonDeferrable: false,
        stableCandidate: null,
      });
      const prove = (state: State, passed: boolean): Stage => {
        state.proven = passed;
        state.stage = passed ? "MVP" : "development";
        return state.stage;
      };
      const mutate = (state: State): void => {
        state.stage = "development";
        state.proven = false;
        state.scopeComplete = false;
        state.validationGreen = false;
        state.sdetTerminal = false;
        if (state.confirmedCritical) state.correctedAfterCritical = true;
      };
      const runSdet = (state: State, action: SdetAction, mainConfirmedCritical: boolean): string => {
        if (state.stage !== "MVP" || !state.scopeComplete) return "blocked: missing MVP or accepted scope";
        if (state.sdetStopped) return "blocked: terminal SDET stop";
        if (state.confirmedCritical && !state.correctedAfterCritical) return "blocked: correction and new proof required";
        state.sdetTerminal = true;
        state.confirmedCritical = action === "critical-risks-reported" && mainConfirmedCritical;
        state.correctedAfterCritical = false;
        if (!state.confirmedCritical) state.sdetStopped = true;
        return action;
      };
      const freezeRc = (state: State): string => {
        if (!state.proven || !state.scopeComplete || !state.validationGreen || !state.sdetTerminal || state.confirmedCritical || state.knownNonDeferrable) {
          return "blocked";
        }
        state.rc += 1;
        state.stage = `RC${state.rc}`;
        return state.stage;
      };
      const handoff = (state: State): string => {
        if (!String(state.stage).startsWith("RC")) return "blocked";
        state.stableCandidate = String(state.stage);
        state.stage = "stable";
        return state.stableCandidate;
      };

      const state = create();
      assertEqual(prove(state, true), "MVP", "Runtime Proof must restore only MVP, not RC.");
      state.scopeComplete = true;
      assertEqual(runSdet(state, "critical-risks-reported", true), "critical-risks-reported", "Main-confirmed critical evidence must permit correction continuation.");
      assertEqual(runSdet(state, "critical-risks-reported", true), "blocked: correction and new proof required", "Unchanged candidate must not earn another SDET attempt.");
      mutate(state);
      assertEqual(state.stage, "development", "Candidate mutation must return to development.");
      assertEqual(prove(state, true), "MVP", "Corrected candidate proof must restore MVP.");
      state.scopeComplete = true;
      state.validationGreen = true;
      assertEqual(runSdet(state, "no-critical-risk", false), "no-critical-risk", "First valid no-confirmed-critical attempt must terminate SDET.");
      assertEqual(runSdet(state, "critical-risks-reported", true), "blocked: terminal SDET stop", "Post-stop SDET dispatch must fail.");
      assertEqual(freezeRc(state), "RC1", "Qualified candidate must receive RC1 only after scope, validation, and terminal SDET.");
      assertEqual(handoff(state), "RC1", "Stable handoff must retain the same RC.");
      assertEqual(state.stableCandidate, "RC1", "Stable Candidate must link to the qualified RC.");

      mutate(state);
      assertEqual(prove(state, true), "MVP", "Post-stable mutation proof must restore only MVP.");
      state.scopeComplete = true;
      state.validationGreen = true;
      state.sdetTerminal = true;
      state.confirmedCritical = false;
      assertEqual(freezeRc(state), "RC2", "Changed requalified candidate must receive the next monotonic RC.");

      const unsafe = create();
      prove(unsafe, true);
      unsafe.scopeComplete = true;
      unsafe.validationGreen = true;
      unsafe.sdetTerminal = true;
      unsafe.knownNonDeferrable = true;
      assertEqual(freezeRc(unsafe), "blocked", "Known non-deferrable risk must not be waived into RC.");
      for (const stage of ["MVP", "RC1", "stable"] as const) {
        assert(!["deploy", "release", "publish"].includes(stage), `Stage ${stage} must not encode external-operation authority.`);
      }
    },
  },
];
