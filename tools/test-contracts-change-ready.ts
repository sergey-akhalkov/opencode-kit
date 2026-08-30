import fs from "node:fs";
import path from "node:path";

import {
  BEHAVIORAL_SUBSTITUTION_REQUIRED_TEXT,
  CHANGE_READY_SDLC_CONTINUATION_TOKENS,
  CHANGE_READY_SDLC_DEVELOPMENT_STAGE_MARKERS,
  CHANGE_READY_SDLC_LIFECYCLE_MARKERS,
  CHANGE_READY_SDLC_OUTCOME_AUTHORITY_MARKERS,
  FORBIDDEN_PRODUCTION_ROUTING_PATTERNS,
  FORBIDDEN_PRODUCTION_ROUTING_SCAN_FILES,
  GLOBAL_AGENTS_FANOUT_CONTINUATION_TOKENS,
  GLOBAL_AGENTS_NON_WAIVABLE_RISK_CLAUSE,
  GLOBAL_AGENTS_OUTCOME_AUTHORITY_MARKERS,
  GLOBAL_AGENTS_PROTECTED_BOUNDARY_CATEGORIES,
  SHIFT_LEFT_REAL_BOUNDARY_MARKERS,
  SHIFT_LEFT_REAL_BOUNDARY_SURFACES,
} from "./contracts/skills.ts";
import {
  EVIDENCE_SUFFICIENCY_REVIEWER_REQUIRED_TEXT,
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
import { createContext } from "./validators/context.ts";
import { validateImplementationWorkerRouting } from "./validators/routing.ts";
import {
  assert,
  assertDeepEqual,
  assertEqual,
  libraryRoot,
  newTempDir,
  type TestCase,
  writeText,
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

/**
 * Critical process-control autonomy vs protected-action authority oracles.
 * Pinned in the test file so weakening production marker arrays alone cannot drop them.
 */
const CRITICAL_PROCESS_CONTROL_GLOBAL_MARKERS = [
  "attempt limit, or process stop line",
  "does not authorize the underlying protected action",
  "plan/spec/task update, successor attempt, attempt-limit change, or process stop-line change",
  "process controls, not owner scope",
  "Do not ask whether to continue",
] as const;

const CRITICAL_PROCESS_CONTROL_SKILL_MARKERS = [
  "attempt limits, and stop lines",
  "underlying protected action retains separate authority",
  "one-attempt or `no successor` wording is not owner scope by itself",
  "continue without asking for process approval",
] as const;

const CRITICAL_PROCESS_CONTROL_ARBITER_MARKERS = [
  "attempt limits, and process stop lines are autonomous controls",
  "`one attempt`, `no successor`, or checked-task rule is not human scope by itself",
  "Classify questions asking whether to update those controls",
  "as `continue`",
  "underlying protected action remains a scoped non-product gate",
] as const;

/** Baseline pre-candidate wording lacks process-control autonomy and protected-action separation. */
const BASELINE_PROCESS_CONTROL_AGENTS_FRAGMENT =
  "Implementation footprint may adapt after first mutation. Main MAY add/change a task, local write path, artifact, focused check, or action without approval only when evidenced necessary for the accepted outcome or a non-deferrable invariant, local and reversible, no protected boundary, the smallest sufficient dependency closure, and unrelated work preserved. Main records traceability, updates the brief, and invalidates only evidence affected under the evidence-topology rules above; only production-behavior mutation or a red happy path forces `development`. Reviewer/SDET/validation/delivery evidence never authorizes mutation; main owns reproduction, classification, authorized correction, parking, owner routing, and lifecycle disposition.";

function missingTokens(text: string, tokens: readonly string[]): string[] {
  return tokens.filter((token) => !text.includes(token));
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

const EXPECTED_SHIFT_LEFT_REAL_BOUNDARY_MARKERS = [
  "time-to-first-real-signal",
  "first safely reachable real boundary sufficient",
  "does not authorize external operations",
];

/**
 * Path-versus-outcome critical oracles. Pinned here so shrinking production
 * marker arrays cannot drop outcome necessity, no-safe-route, path-scoped
 * gates, claim ceiling, or owner-only fail-closed behavior.
 */
const CRITICAL_PATH_VS_OUTCOME_GLOBAL_MARKERS = [
  "first safely reachable real boundary sufficient",
  "Authority is a ceiling, not a fidelity target",
  "If path-only, keep its action/gate blocked",
  "reconcile conflicting planning controls",
  "do not claim the blocked path",
  "exact protected action necessary for the original accepted outcome",
  "no unused safe goal-preserving real route can advance that outcome",
  "hand off without `troubleshooter`",
  "asks nothing if the outcome advances",
] as const;

const CRITICAL_PATH_VS_OUTCOME_SKILL_MARKERS = [
  "Authority is a ceiling, not a fidelity target",
  "A path-only action/gate stays blocked",
  "without claiming that path",
  "every sufficient route requires owner action",
] as const;

const CRITICAL_SELF_DIAGNOSTIC_GLOBAL_MARKERS = [
  "Before main declares a technical/evidence blocker",
  "Product Candidate, Proof Runner, Evaluator, Environment, Authority, or `unknown`",
  "qualify absence sources",
  "smallest safe causally distinct falsifying probe",
  "narrowest supported claim ceiling",
] as const;

const CRITICAL_SELF_DIAGNOSTIC_SKILL_MARKERS = [
  "Blocker self-diagnosis and absence-source qualification",
  "expected observable phenomenon",
  "safe positive control",
  "source is `unqualified`",
  "narrowest supported claim ceiling",
] as const;

const CRITICAL_SELF_DIAGNOSTIC_ARBITER_MARKERS = [
  "technical/evidence blocker",
  "observer qualification",
  "supported claim ceiling",
  "smallest remaining safe causally distinct probe",
  "return `continue`",
  "Never turn incomplete diagnosis",
  "into `allow_stop`, `product_decision_required`, or `waiting`",
] as const;

const SUPERSEDED_PATH_VS_OUTCOME_OPERATORS = [
  "The autonomous target is the highest rung allowed by current authority",
  "Active-change pending tasks remain accepted unless user-bounded",
  "no unused safe distinct mechanism can advance the chain",
] as const;

const EXPECTED_SHIFT_LEFT_REAL_BOUNDARY_SURFACES = [
  "REPO_AGENTS.md",
  "global/AGENTS.md",
  "global/skills/change-ready-sdlc/SKILL.md",
  "instructions/reusable-project-agent-instructions.md",
  "instructions/universal-development-loop.md",
  "templates/project/AGENTS.md",
];

function seedShiftLeftSurfaces(fixture: string): void {
  for (const relative of SHIFT_LEFT_REAL_BOUNDARY_SURFACES) {
    writeText(path.join(fixture, relative), fs.readFileSync(path.join(root, relative), "utf8"));
  }
}

function shiftLeftCadenceErrors(fixture: string): string[] {
  const ctx = createContext();
  validateImplementationWorkerRouting(ctx, fixture, []);
  return ctx.errors;
}

const EXPECTED_FINAL_REVIEWER_MARKERS = [
  "## Contract Reference",
  "`instructions/leaf-reviewer-agent-contract.md`",
  "fresh read-only",
  "After current proof",
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
    name: "contracts: current lifecycle and optional final-review arrays are exact",
    run: () => {
      assertDeepEqual([...CHANGE_READY_SDLC_LIFECYCLE_MARKERS], EXPECTED_LIFECYCLE_MARKERS, "Lifecycle marker array drifted.");
      assertDeepEqual([...CHANGE_READY_SDLC_DEVELOPMENT_STAGE_MARKERS], EXPECTED_DEVELOPMENT_STAGE_MARKERS, "Development-Stage marker array drifted.");
      assertDeepEqual([...FINAL_CANDIDATE_REVIEWER_REQUIRED_TEXT], EXPECTED_FINAL_REVIEWER_MARKERS, "Optional final-review marker array drifted.");
      assertDeepEqual([...SHIFT_LEFT_REAL_BOUNDARY_MARKERS], EXPECTED_SHIFT_LEFT_REAL_BOUNDARY_MARKERS, "Shift-left real-boundary marker array drifted.");
      assertDeepEqual([...SHIFT_LEFT_REAL_BOUNDARY_SURFACES], EXPECTED_SHIFT_LEFT_REAL_BOUNDARY_SURFACES, "Shift-left real-boundary surface array drifted.");
    },
  },
  {
    name: "contracts: shift-left real-boundary cadence fails closed on missing operative marker and fenced decoys",
    run: () => {
      const targetRelative = "REPO_AGENTS.md";
      const marker = "does not authorize external operations";
      const baseline = fs.readFileSync(path.join(root, targetRelative), "utf8");
      assertEqual(baseline.split(marker).length - 1, 1, `Baseline ${targetRelative} must keep unique non-authorization marker.`);

      const missingFixture = newTempDir("shift-left-missing-marker");
      seedShiftLeftSurfaces(missingFixture);
      writeText(path.join(missingFixture, targetRelative), baseline.replace(marker, "removed-marker"));
      const missingErrors = shiftLeftCadenceErrors(missingFixture);
      assert(
        missingErrors.some(
          (error) =>
            error.includes("shift-left real-boundary cadence") &&
            error.includes(`'${marker}'`) &&
            error.replace(/\\/g, "/").includes(targetRelative),
        ),
        `Removing operative marker must fail closed with cadence label, marker, and path. errors=${JSON.stringify(missingErrors)}`,
      );

      const fencedFixture = newTempDir("shift-left-fenced-decoy");
      seedShiftLeftSurfaces(fencedFixture);
      writeText(
        path.join(fencedFixture, targetRelative),
        `${baseline.replace(marker, "removed-marker")}\n\n\`\`\`text\n${marker}\n\`\`\`\n`,
      );
      const fencedErrors = shiftLeftCadenceErrors(fencedFixture);
      assert(
        fencedErrors.some(
          (error) =>
            error.includes("shift-left real-boundary cadence") &&
            error.includes(`'${marker}'`) &&
            error.replace(/\\/g, "/").includes(targetRelative),
        ),
        `Fenced-only marker text must not satisfy operative shift-left cadence. errors=${JSON.stringify(fencedErrors)}`,
      );

      const sufficiency = "first safely reachable real boundary sufficient";
      assert(baseline.includes(sufficiency), `Baseline ${targetRelative} must keep the sufficient-boundary marker.`);
      const supersededFixture = newTempDir("shift-left-superseded-earliest");
      seedShiftLeftSurfaces(supersededFixture);
      writeText(
        path.join(supersededFixture, targetRelative),
        baseline.replace(sufficiency, "earliest safely reachable real boundary"),
      );
      const supersededErrors = shiftLeftCadenceErrors(supersededFixture);
      assert(
        supersededErrors.some(
          (error) =>
            error.includes("shift-left real-boundary cadence") &&
            error.includes(`'${sufficiency}'`) &&
            error.replace(/\\/g, "/").includes(targetRelative),
        ),
        `Restoring superseded earliest-boundary wording without sufficiency must fail closed. errors=${JSON.stringify(supersededErrors)}`,
      );
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
        "An unchanged candidate and unchanged critical-risk hypothesis receive no equivalent verdict-seeking rerun",
        "No SDET attempt count permanently prohibits future risk assessment of a materially changed candidate",
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
        "Optional final-candidate, code-quality, and domain reviewers",
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
      assertEqual(ALLOWED_SDET_QUALITY_ENGINEER_EDIT_RULES.get("permission.edit"), "allow", "SDET test-only edits must remain unattended.");
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
      assert(
        !fs.existsSync(path.join(root, "global", "agents", "session-delivery-reviewer.md")),
        "Retired session-delivery-reviewer must not remain an active optional reviewer.",
      );
      for (const fileName of ["final-candidate-reviewer.md", "code-quality-reviewer.md"]) {
        const text = fs.readFileSync(path.join(root, "global", "agents", fileName), "utf8");
        assert(text.includes("Effective Model"), `${fileName} must record Effective Model.`);
        for (const forbidden of REVIEWER_SDET_FORBIDDEN_ACTION_FIELDS) {
          assert(!text.includes(forbidden), `${fileName} exposes forbidden reviewer authority: ${forbidden}`);
        }
      }
      const arbiter = fs.readFileSync(path.join(root, "global", "agents", "session-completion-arbiter.md"), "utf8");
      assert(arbiter.includes("hidden: true"), "Completion arbiter must remain hidden.");
      assert(arbiter.includes("never run as an optional reviewer"), "Completion arbiter must not be an optional reviewer.");
      for (const forbidden of REVIEWER_SDET_FORBIDDEN_ACTION_FIELDS) {
        assert(!arbiter.includes(forbidden), `Completion arbiter exposes forbidden reviewer authority: ${forbidden}`);
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
    name: "contracts: README exposes verified outcome and conditional qualification",
    run: () => {
      const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");
      assertTokens(readme, [
        "run-observe-correct",
        "accepted-scope completion",
        "RC/stable qualification and independent critical SDET are conditional",
        "Outcome: working | blocked | unknown",
        "Optional reviewers never become stage gates",
        "Development-Stage: development | MVP | RC<n> | stable",
      ], "README verified-outcome route drifted");
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
    name: "contracts: pure lifecycle fixture enforces MVP, RC, stable, mutation, and evidence-gated SDET continuation",
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
        equivalentRerunBlocked: boolean;
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
        equivalentRerunBlocked: false,
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
        state.equivalentRerunBlocked = false;
        if (state.confirmedCritical) state.correctedAfterCritical = true;
      };
      const runSdet = (state: State, action: SdetAction, mainConfirmedCritical: boolean): string => {
        if (state.stage !== "MVP" || !state.scopeComplete) return "blocked: missing MVP or accepted scope";
        if (state.equivalentRerunBlocked) return "blocked: equivalent SDET rerun";
        if (state.confirmedCritical && !state.correctedAfterCritical) return "blocked: correction and new proof required";
        state.sdetTerminal = true;
        state.confirmedCritical = action === "critical-risks-reported" && mainConfirmedCritical;
        state.correctedAfterCritical = false;
        if (!state.confirmedCritical) state.equivalentRerunBlocked = true;
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
      assertEqual(runSdet(state, "no-critical-risk", false), "no-critical-risk", "First valid no-confirmed-critical attempt must park equivalent SDET reruns.");
      assertEqual(runSdet(state, "critical-risks-reported", true), "blocked: equivalent SDET rerun", "Unchanged candidate must not receive an equivalent verdict-seeking SDET rerun.");
      assertEqual(freezeRc(state), "RC1", "Qualified candidate must receive RC1 only after scope, validation, and terminal SDET.");
      assertEqual(handoff(state), "RC1", "Stable handoff must retain the same RC.");
      assertEqual(state.stableCandidate, "RC1", "Stable Candidate must link to the qualified RC.");

      mutate(state);
      assertEqual(prove(state, true), "MVP", "Post-stable mutation proof must restore only MVP.");
      state.scopeComplete = true;
      state.validationGreen = true;
      assertEqual(runSdet(state, "no-critical-risk", false), "no-critical-risk", "A materially changed candidate may receive fresh SDET after current proof and accepted-scope completion.");
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
  {
    name: "contracts: process-control autonomy stays paired with protected-action authority",
    run: () => {
      const agents = fs.readFileSync(path.join(root, "global", "AGENTS.md"), "utf8");
      const skill = fs.readFileSync(path.join(root, "global", "skills", "change-ready-sdlc", "SKILL.md"), "utf8");
      const arbiter = fs.readFileSync(path.join(root, "global", "agents", "session-completion-arbiter.md"), "utf8");

      // Production contract arrays must retain the critical autonomy/separation pair.
      assertTokens(
        GLOBAL_AGENTS_OUTCOME_AUTHORITY_MARKERS.join("\n"),
        ["attempt limit, or process stop line", "does not authorize the underlying protected action"],
        "GLOBAL_AGENTS_OUTCOME_AUTHORITY_MARKERS dropped process-control pair",
      );
      assertTokens(
        CHANGE_READY_SDLC_OUTCOME_AUTHORITY_MARKERS.join("\n"),
        ["attempt limits, and stop lines", "underlying protected action retains separate authority"],
        "CHANGE_READY_SDLC_OUTCOME_AUTHORITY_MARKERS dropped process-control pair",
      );

      // Current candidate must carry the full critical distinction, including arbiter routing.
      assertEqual(
        missingTokens(agents, CRITICAL_PROCESS_CONTROL_GLOBAL_MARKERS).join("|"),
        "",
        `global/AGENTS.md missing process-control critical markers: ${missingTokens(agents, CRITICAL_PROCESS_CONTROL_GLOBAL_MARKERS).join(", ")}`,
      );
      assertEqual(
        missingTokens(skill, CRITICAL_PROCESS_CONTROL_SKILL_MARKERS).join("|"),
        "",
        `change-ready-sdlc missing process-control critical markers: ${missingTokens(skill, CRITICAL_PROCESS_CONTROL_SKILL_MARKERS).join(", ")}`,
      );
      assertEqual(
        missingTokens(arbiter, CRITICAL_PROCESS_CONTROL_ARBITER_MARKERS).join("|"),
        "",
        `session-completion-arbiter missing process-control critical markers: ${missingTokens(arbiter, CRITICAL_PROCESS_CONTROL_ARBITER_MARKERS).join(", ")}`,
      );

      // Baseline / autonomy-without-separation mutations must fail the oracle.
      assert(
        missingTokens(BASELINE_PROCESS_CONTROL_AGENTS_FRAGMENT, CRITICAL_PROCESS_CONTROL_GLOBAL_MARKERS).length > 0,
        "Baseline pre-candidate AGENTS fragment must fail the process-control oracle.",
      );

      const autonomyWithoutSeparation = agents.replaceAll(
        "does not authorize the underlying protected action",
        "may authorize the underlying protected action after plan update",
      );
      assert(
        autonomyWithoutSeparation !== agents,
        "Candidate AGENTS must contain the protected-action separation marker for mutation proof.",
      );
      assert(
        missingTokens(autonomyWithoutSeparation, CRITICAL_PROCESS_CONTROL_GLOBAL_MARKERS).includes(
          "does not authorize the underlying protected action",
        ),
        "Removing protected-action separation while keeping attempt-limit autonomy must fail closed.",
      );

      const skillWithoutSeparation = skill.replaceAll(
        "underlying protected action retains separate authority",
        "underlying protected action may inherit plan authority",
      );
      assert(
        missingTokens(skillWithoutSeparation, CRITICAL_PROCESS_CONTROL_SKILL_MARKERS).includes(
          "underlying protected action retains separate authority",
        ),
        "Skill autonomy without separate protected-action authority must fail closed.",
      );

      const arbiterWithoutPlanningBoundary = arbiter.replaceAll(
        "underlying protected action remains a scoped non-product gate",
        "underlying protected action inherits planning authority",
      );
      assert(
        missingTokens(arbiterWithoutPlanningBoundary, CRITICAL_PROCESS_CONTROL_ARBITER_MARKERS).includes(
          "underlying protected action remains a scoped non-product gate",
        ),
        "Arbiter must keep planning-update vs protected-action authority separation.",
      );

      const arbiterWithoutContinue = arbiter.replaceAll("as `continue`", "as `product_decision_required`");
      assert(
        missingTokens(arbiterWithoutContinue, CRITICAL_PROCESS_CONTROL_ARBITER_MARKERS).includes("as `continue`"),
        "Arbiter process-only questions must remain classified as continue, not product decisions.",
      );
    },
  },
  {
    name: "contracts: blocker self-diagnosis preserves layer, observer, probe, claim, and continuation controls",
    run: () => {
      const agents = fs.readFileSync(path.join(root, "global", "AGENTS.md"), "utf8");
      const skill = fs.readFileSync(path.join(root, "global", "skills", "change-ready-sdlc", "SKILL.md"), "utf8");
      const arbiter = fs.readFileSync(path.join(root, "global", "agents", "session-completion-arbiter.md"), "utf8");
      const verdictTypes = fs.readFileSync(path.join(root, "global", "extensions", "session-completion-guard", "types.ts"), "utf8");

      assertTokens(
        GLOBAL_AGENTS_OUTCOME_AUTHORITY_MARKERS.join("\n"),
        CRITICAL_SELF_DIAGNOSTIC_GLOBAL_MARKERS,
        "GLOBAL_AGENTS_OUTCOME_AUTHORITY_MARKERS dropped blocker self-diagnostic control",
      );
      assertTokens(
        CHANGE_READY_SDLC_OUTCOME_AUTHORITY_MARKERS.join("\n"),
        CRITICAL_SELF_DIAGNOSTIC_SKILL_MARKERS,
        "CHANGE_READY_SDLC_OUTCOME_AUTHORITY_MARKERS dropped absence qualification control",
      );
      assertEqual(
        missingTokens(agents, CRITICAL_SELF_DIAGNOSTIC_GLOBAL_MARKERS).join("|"),
        "",
        `global/AGENTS.md missing self-diagnostic markers: ${missingTokens(agents, CRITICAL_SELF_DIAGNOSTIC_GLOBAL_MARKERS).join(", ")}`,
      );
      assertEqual(
        missingTokens(skill, CRITICAL_SELF_DIAGNOSTIC_SKILL_MARKERS).join("|"),
        "",
        `change-ready-sdlc missing absence qualification markers: ${missingTokens(skill, CRITICAL_SELF_DIAGNOSTIC_SKILL_MARKERS).join(", ")}`,
      );
      assertEqual(
        missingTokens(arbiter, CRITICAL_SELF_DIAGNOSTIC_ARBITER_MARKERS).join("|"),
        "",
        `session-completion-arbiter missing technical continuation markers: ${missingTokens(arbiter, CRITICAL_SELF_DIAGNOSTIC_ARBITER_MARKERS).join(", ")}`,
      );
      assert(verdictTypes.includes("schemaVersion: 2;"), "CompletionVerdict must retain schema version 2.");
      assert(!verdictTypes.includes("diagnosticAssessment"), "Self-diagnosis must not add a new verdict schema object.");

      const unqualifiedAbsence = agents.replaceAll("qualify absence sources", "accept absence sources");
      assert(
        unqualifiedAbsence !== agents && missingTokens(unqualifiedAbsence, CRITICAL_SELF_DIAGNOSTIC_GLOBAL_MARKERS).includes("qualify absence sources"),
        "Removing absence qualification from always-loaded authority must fail closed.",
      );
      const missingPositiveControl = skill.replaceAll("safe positive control", "negative observation");
      assert(
        missingPositiveControl !== skill && missingTokens(missingPositiveControl, CRITICAL_SELF_DIAGNOSTIC_SKILL_MARKERS).includes("safe positive control"),
        "Removing the positive control requirement must fail closed.",
      );
      const prematureStop = arbiter.replaceAll("return `continue`", "return `allow_stop`");
      assert(
        prematureStop !== arbiter && missingTokens(prematureStop, CRITICAL_SELF_DIAGNOSTIC_ARBITER_MARKERS).includes("return `continue`"),
        "Replacing technical continuation with allow_stop must fail closed.",
      );
    },
  },
  {
    name: "contracts: evidence bounds keep one principle, one substitution owner, and one read-only challenge role",
    run: () => {
      const principles = fs.readFileSync(path.join(root, "global", "principles-of-work.md"), "utf8");
      const agents = fs.readFileSync(path.join(root, "global", "AGENTS.md"), "utf8");
      const skill = fs.readFileSync(path.join(root, "global", "skills", "behavioral-substitution-qualification", "SKILL.md"), "utf8");
      const reviewer = fs.readFileSync(path.join(root, "global", "agents", "evidence-sufficiency-reviewer.md"), "utf8");
      const qualification = fs.readFileSync(path.join(root, "global", "skills", "change-ready-sdlc", "SKILL.md"), "utf8");
      const apply = fs.readFileSync(path.join(root, "global", "skills", "openspec-apply-change", "SKILL.md"), "utf8");
      const propose = fs.readFileSync(path.join(root, "global", "skills", "openspec-propose", "SKILL.md"), "utf8");
      const readinessReviewer = fs.readFileSync(path.join(root, "global", "agents", "implementation-readiness-reviewer.md"), "utf8");
      const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");
      const instructionSpec = fs.readFileSync(path.join(root, "openspec", "specs", "library-instruction-artifacts", "spec.md"), "utf8");
      assert((principles.match(/\*\*Evidence Bounds Claims:\*\*/g) ?? []).length === 1, "Principles must contain one canonical Evidence Bounds Claims entry.");
      assertTokens(agents, [
        "Evidence bounds claims",
        "Claim And Evidence Scope",
        "behavioral-substitution-qualification",
        "evidence-sufficiency-reviewer",
        "blocks only that broad claim",
      ], "Always-loaded claim-evidence trigger drifted");
      assertTokens(skill, BEHAVIORAL_SUBSTITUTION_REQUIRED_TEXT, "Substitution skill closure contract drifted");
      assertTokens(reviewer, EVIDENCE_SUFFICIENCY_REVIEWER_REQUIRED_TEXT, "Evidence-sufficiency reviewer contract drifted");
      assert(qualification.includes("load `behavioral-substitution-qualification`"), "Change-Ready must reference the focused substitution owner.");
      assert(apply.includes("load `behavioral-substitution-qualification`"), "OpenSpec apply must reference the focused substitution owner.");
      assertTokens(propose, [
        "schema-valid development claim record",
        "--operation apply",
        "Structural artifact readiness",
        "Semantic implementation readiness",
        "implementation-readiness-reviewer",
        "no-material-finding",
        "no unchanged, optional, or confidence-seeking third challenge",
        "Never invent evidence",
      ], "OpenSpec propose broad-claim apply-readiness contract drifted");
      assert(!propose.includes("Create artifacts in sequence until apply-ready"), "OpenSpec propose must not collapse artifact completion into implementation readiness.");
      assert(!readme.includes("create one apply-ready OpenSpec change"), "README must not collapse structural and semantic readiness.");
      assertTokens(readme, [
        "reports structural artifact readiness separately from semantic implementation readiness",
        "one bounded-falsification declaration",
        "`final-candidate-reviewer` remains optional and post-proof",
      ], "README bounded-falsification routing drifted");
      assert(!instructionSpec.includes("reports `Ready for implementation` only when all three commands exit `0`"), "Canonical spec must not derive semantic readiness from deterministic checks.");
      assertTokens(instructionSpec, [
        "`Structural artifact readiness: passed` only when all three commands exit `0`",
        "semantic implementation readiness remains separate",
      ], "Canonical structural-versus-semantic readiness wording drifted");
      assertTokens(apply, [
        "Bounded Falsification Review",
        "falsification-review.md",
        "Reuse a current terminal episode",
        "do not relaunch an equivalent generic review",
        "final-candidate-reviewer` as a mandatory fallback",
        "Semantic implementation readiness",
      ], "OpenSpec apply bounded-falsification consumption contract drifted");
      assertTokens(readinessReviewer, [
        "accepted outcome or non-deferrable invariant at risk",
        "reachable current-envelope scenario",
        "concrete consequence",
        "exact evidence",
        "current-scope justification",
        "smallest mitigation note",
        "Optional, future-scope, stylistic, polish, and generic-uncertainty rows create no work",
      ], "Implementation-readiness finding-admission contract drifted");
      assertTokens(agents, [
        "Material inline decision frame",
        "Material work without a formal plan creates the smallest inline frame before production mutation",
        "Ordinary Small exact cases stay direct",
        "independently matched exact Practice Owners keep their boundaries",
      ], "Non-OpenSpec bounded-falsification fallback drifted");
      assert(!qualification.includes("Compare baseline and candidate from the same actor request"), "Change-Ready must not duplicate the focused comparison procedure.");
      for (const forbidden of REVIEWER_SDET_FORBIDDEN_ACTION_FIELDS) {
        assert(!reviewer.includes(forbidden), `Evidence-sufficiency reviewer exposes forbidden authority: ${forbidden}`);
      }
    },
  },
  {
    name: "contracts: priority duplication tripwire names the canonical principles owner",
    run: () => {
      const contracts = fs.readFileSync(path.join(root, "tools", "contracts", "skills.ts"), "utf8");
      const routing = fs.readFileSync(path.join(root, "tools", "validators", "routing.ts"), "utf8");
      assertTokens(contracts, [
        '"First, Do No Harm"',
        '"Two-Way Door Decisions"',
        '"Fast Feedback"',
      ], "Priority duplicate labels must match the canonical principles file");
      assertTokens(routing, [
        "relative === PRINCIPLES_OF_WORK_RELATIVE",
        "relative === GLOBAL_AGENTS_RELATIVE",
        "keep the full contract only in ${PRINCIPLES_OF_WORK_RELATIVE}",
      ], "Priority duplication routing must skip only the canonical owner and scan AGENTS");
    },
  },
  {
    name: "contracts: path-only blockers cannot become owner scope or clear a blocked gate",
    run: () => {
      const agents = fs.readFileSync(path.join(root, "global", "AGENTS.md"), "utf8");
      const skill = fs.readFileSync(path.join(root, "global", "skills", "change-ready-sdlc", "SKILL.md"), "utf8");
      const troubleshooter = fs.readFileSync(path.join(root, "global", "agents", "troubleshooter.md"), "utf8");

      assertTokens(
        GLOBAL_AGENTS_OUTCOME_AUTHORITY_MARKERS.join("\n"),
        [
          "necessary for the original accepted outcome",
          "no unused safe goal-preserving real route can advance that outcome",
          "reconcile conflicting planning controls",
          "Authority is a ceiling, not a fidelity target",
        ],
        "GLOBAL_AGENTS_OUTCOME_AUTHORITY_MARKERS dropped path-versus-outcome pair",
      );
      assertTokens(
        CHANGE_READY_SDLC_OUTCOME_AUTHORITY_MARKERS.join("\n"),
        ["Authority is a ceiling, not a fidelity target", "every sufficient route requires owner action"],
        "CHANGE_READY_SDLC_OUTCOME_AUTHORITY_MARKERS dropped path-versus-outcome pair",
      );

      assertEqual(
        missingTokens(agents, CRITICAL_PATH_VS_OUTCOME_GLOBAL_MARKERS).join("|"),
        "",
        `global/AGENTS.md missing path-versus-outcome markers: ${missingTokens(agents, CRITICAL_PATH_VS_OUTCOME_GLOBAL_MARKERS).join(", ")}`,
      );
      assertEqual(
        missingTokens(skill, CRITICAL_PATH_VS_OUTCOME_SKILL_MARKERS).join("|"),
        "",
        `change-ready-sdlc missing path-versus-outcome markers: ${missingTokens(skill, CRITICAL_PATH_VS_OUTCOME_SKILL_MARKERS).join(", ")}`,
      );
      for (const superseded of SUPERSEDED_PATH_VS_OUTCOME_OPERATORS) {
        assert(!agents.includes(superseded), `global/AGENTS.md restored superseded operator: ${superseded}`);
        assert(!skill.includes(superseded), `change-ready-sdlc restored superseded operator: ${superseded}`);
      }

      for (const superseded of SUPERSEDED_PATH_VS_OUTCOME_OPERATORS) {
        assert(
          FORBIDDEN_PRODUCTION_ROUTING_PATTERNS.some((pattern) => pattern.needle === superseded),
          `Production forbidden-routing array dropped superseded operator: ${superseded}`,
        );
        const restored = `${agents}\n${superseded}\n`;
        assert(
          !agents.includes(superseded) && restored.includes(superseded),
          `Restoring superseded operator must be distinguishable from the current candidate: ${superseded}`,
        );
      }

      const withoutOutcomeNecessity = agents.replaceAll(
        "exact protected action necessary for the original accepted outcome",
        "exact protected action plus proof no unused safe distinct mechanism",
      );
      assert(
        withoutOutcomeNecessity !== agents &&
          missingTokens(withoutOutcomeNecessity, CRITICAL_PATH_VS_OUTCOME_GLOBAL_MARKERS).includes(
            "exact protected action necessary for the original accepted outcome",
          ),
        "Dropping outcome necessity while restoring the superseded owner-only conjunct must fail closed.",
      );

      const withoutNoSafeRoute = agents.replaceAll(
        "no unused safe goal-preserving real route can advance that outcome",
        "no unused safe distinct mechanism can advance the chain",
      );
      assert(
        withoutNoSafeRoute !== agents &&
          missingTokens(withoutNoSafeRoute, CRITICAL_PATH_VS_OUTCOME_GLOBAL_MARKERS).includes(
            "no unused safe goal-preserving real route can advance that outcome",
          ),
        "Replacing the no-safe-route conjunct with the superseded chain test must fail closed.",
      );

      const pathOnlyOwnerHandoff = agents.replaceAll(
        "If path-only, keep its action/gate blocked",
        "If path-only, hand off to the owner",
      );
      assert(
        pathOnlyOwnerHandoff !== agents &&
          missingTokens(pathOnlyOwnerHandoff, CRITICAL_PATH_VS_OUTCOME_GLOBAL_MARKERS).includes(
            "If path-only, keep its action/gate blocked",
          ),
        "Path-only owner handoff must fail closed.",
      );

      const clearedBlockedGate = agents.replaceAll(
        "keep its action/gate blocked",
        "clear its action/gate",
      );
      assert(
        clearedBlockedGate !== agents &&
          missingTokens(clearedBlockedGate, CRITICAL_PATH_VS_OUTCOME_GLOBAL_MARKERS).includes(
            "If path-only, keep its action/gate blocked",
          ),
        "Treating a blocked path as clear must fail closed.",
      );

      const claimedBlockedPath = agents.replaceAll(
        "do not claim the blocked path",
        "may claim the blocked path",
      );
      assert(
        claimedBlockedPath !== agents &&
          missingTokens(claimedBlockedPath, CRITICAL_PATH_VS_OUTCOME_GLOBAL_MARKERS).includes(
            "do not claim the blocked path",
          ),
        "Weakening the blocked-path claim ceiling must fail closed.",
      );

      const ownerDelay = agents.replaceAll(
        "hand off without `troubleshooter`",
        "hand off after consulting `troubleshooter`",
      );
      assert(
        ownerDelay !== agents &&
          missingTokens(ownerDelay, CRITICAL_PATH_VS_OUTCOME_GLOBAL_MARKERS).includes(
            "hand off without `troubleshooter`",
          ),
        "Owner-only must fail closed when specialist delay is substituted for the no-consult bypass.",
      );

      const unboundedConsult = agents.replaceAll(
        "at most one diagnosis-only `troubleshooter`",
        "any number of diagnosis-only `troubleshooter`",
      );
      assert(
        unboundedConsult !== agents && !unboundedConsult.includes("at most one diagnosis-only `troubleshooter`"),
        "Equivalent consultation bound must fail closed when the one-consult limit is removed.",
      );

      const unavailableBlocks = agents.replaceAll(
        "absence alone is not a stage blocker",
        "absence alone is a stage blocker",
      );
      assert(
        unavailableBlocks !== agents && !unavailableBlocks.includes("absence alone is not a stage blocker"),
        "Missing specialist capability must not become a lifecycle blocker.",
      );

      const protectedSubstitution = troubleshooter.replaceAll(
        "Never simulate, authorize, or weaken",
        "May simulate, authorize, or weaken",
      );
      assert(
        protectedSubstitution !== troubleshooter &&
          !protectedSubstitution.includes("Never simulate, authorize, or weaken"),
        "Protected-action non-substitution must fail closed.",
      );
    },
  },
];
