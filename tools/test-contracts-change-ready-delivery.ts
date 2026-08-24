import fs from "node:fs";
import path from "node:path";

import {
  GLOBAL_AGENTS_NON_WAIVABLE_RISK_CLAUSE,
  GLOBAL_AGENTS_PROTECTED_BOUNDARY_CATEGORIES,
} from "./contracts/skills.ts";
import {
  agentsAuthorityProblem,
  skillAuthorityProblem,
} from "./validators/active-authority.ts";
import {
  assert,
  assertEqual,
  libraryRoot,
  type TestCase,
} from "./test-helpers/library.ts";

const root = libraryRoot;

function copiedAgentsAuthority(): string {
  const source = fs.readFileSync(path.join(root, "global", "AGENTS.md"), "utf8");
  const updated = source.replace(
    /## Change-Ready SDLC Routing(\r?\n)/,
    (_match, eol: string) => `## Change-Ready SDLC Routing${eol}${eol}run-observe-correct before inspecting realistic requirement-linked edge cases.${eol}`,
  );
  assert(updated !== source, "Copied authority fixture must locate the routing heading across LF/CRLF line endings.");
  return updated;
}

function assertTokens(text: string, tokens: readonly string[], message: string): void {
  for (const token of tokens) assert(text.includes(token), `${message}: ${token}`);
}

const OPTIONAL_REVIEW_SURFACES = [
  "REPO_AGENTS.md",
  "global/AGENTS.md",
  "instructions/reusable-project-agent-instructions.md",
  "instructions/universal-development-loop.md",
  "templates/project/AGENTS.md",
] as const;

const MIRROR_SELF_CONTAINMENT_MARKERS = [
  {
    relative: "REPO_AGENTS.md",
    markers: [
      "one self-contained decision packet",
      "without opening earlier chat, code, documents, logs, or links",
      "Links, paths, symbols, logs, candidate/blocker IDs, and lifecycle terms are optional supporting evidence only",
      "mentally remove all references",
    ],
  },
  {
    relative: "instructions/reusable-project-agent-instructions.md",
    markers: [
      "one self-contained chat message",
      "will not open earlier chat, code, documents, logs, or links",
      "References and internal IDs are optional supporting evidence only",
      "mentally remove every reference",
    ],
  },
  {
    relative: "templates/project/AGENTS.md",
    markers: [
      "one self-contained message",
      "will not open earlier chat, code, documents, logs, or links",
      "Treat references and internal IDs as optional supporting evidence",
      "mentally remove every reference",
    ],
  },
] as const;

const ACTIVE_CATALOG_SURFACES = [
  "README.md",
  "profiles/all.json",
  "global/model-profiles/grok-only.json",
  "global/model-profiles/quality-independent.json",
  "global/model-profiles/sol-only.json",
  "global/opencode.json.template",
] as const;

/** OpenSpec change that retired session-delivery-reviewer; history may be active or uniquely archived. */
const SESSION_COMPLETION_GUARD_CHANGE = "add-session-completion-guard";

/**
 * Resolve the single attributable history.md for the completion-guard change.
 * Valid states: active `openspec/changes/<id>/history.md`, or exactly one
 * `openspec/changes/archive/*-<id>/history.md` (or archive dir named `<id>`).
 * Zero or multiple matches fail closed — never pick an ambiguous archive.
 */
function resolveSessionCompletionGuardHistoryPaths(): string[] {
  const found: string[] = [];
  const activeHistory = path.join(root, "openspec", "changes", SESSION_COMPLETION_GUARD_CHANGE, "history.md");
  if (fs.existsSync(activeHistory)) found.push(activeHistory);

  const archiveRoot = path.join(root, "openspec", "changes", "archive");
  if (fs.existsSync(archiveRoot)) {
    const archiveDirs = fs
      .readdirSync(archiveRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .filter(
        (name) =>
          name === SESSION_COMPLETION_GUARD_CHANGE || name.endsWith(`-${SESSION_COMPLETION_GUARD_CHANGE}`),
      )
      .sort();
    for (const name of archiveDirs) {
      const archivedHistory = path.join(archiveRoot, name, "history.md");
      if (fs.existsSync(archivedHistory)) found.push(archivedHistory);
    }
  }
  return found;
}

/** Active OpenSpec apply surfaces that must share the owner-only pause contract. */
const OPENSPEC_APPLY_AUTONOMY_SURFACES = [
  "global/skills/openspec-apply-change/SKILL.md",
  "global/commands/opsx-apply.md",
] as const;

/** Workflow surfaces that must omit removed completion ceremony. */
const REMOVED_COMPLETION_CEREMONY_SURFACES = [
  "global/AGENTS.md",
  "global/skills/openspec-propose/SKILL.md",
  "global/commands/opsx-propose.md",
  "global/skills/openspec-apply-change/SKILL.md",
  "global/commands/opsx-apply.md",
  "global/skills/openspec-archive-change/SKILL.md",
  "global/commands/opsx-archive.md",
  "openspec/config.yaml",
  "openspec/project.md",
] as const;

const REMOVED_COMPLETION_CEREMONY_MARKERS = [
  "final-history-retrospective",
  "Pending Improvement Tasks",
  "Deferred Improvement Candidates",
  "Session-Derived Improvements",
] as const;

const APPLY_OUTCOME_RECONCILIATION_SURFACES = [
  "global/skills/openspec-apply-change/SKILL.md",
  "global/commands/opsx-apply.md",
] as const;

const APPLY_OUTCOME_RECONCILIATION_MARKERS = [
  "state: \"all_done\"",
  "accepted outcome",
  "required observable proof",
  "smallest ordinary task",
  "incomplete/abandoned disposition",
] as const;

const ARCHIVE_OUTCOME_RECONCILIATION_SURFACES = [
  "global/skills/openspec-archive-change/SKILL.md",
  "global/commands/opsx-archive.md",
] as const;

const ARCHIVE_OUTCOME_RECONCILIATION_MARKERS = [
  "Reconcile Accepted Outcome",
  "all-checked tasks",
  "smallest ordinary task",
  "incomplete/abandoned preservation flow",
] as const;

const HELPER_RESOLUTION_SURFACES = [
  { helper: "bin/openspec-operation-gate.ts", relative: "global/skills/openspec-propose/SKILL.md" },
  { helper: "bin/openspec-operation-gate.ts", relative: "global/commands/opsx-propose.md" },
  { helper: "bin/openspec-operation-gate.ts", relative: "global/skills/openspec-apply-change/SKILL.md" },
  { helper: "bin/openspec-operation-gate.ts", relative: "global/commands/opsx-apply.md" },
  { helper: "bin/openspec-archive.ts", relative: "global/skills/openspec-archive-change/SKILL.md" },
  { helper: "bin/openspec-archive.ts", relative: "global/commands/opsx-archive.md" },
] as const;

const HELPER_RESOLUTION_MARKERS = [
  "OPENCODE_CONFIG_DIR",
  "privacy-safe runtime-source/collision evidence",
  "Never strip a final `global` segment",
] as const;

const COMPACTION_REFLECTION_MARKERS = [
  "optional evidence outside product completion scope",
  "must not create or schedule product work",
  "separately owned change",
] as const;

/** Focused markers that keep apply autonomous after checkpoints while preserving owner stops. */
const OPENSPEC_APPLY_AUTONOMY_REQUIRED_MARKERS = [
  "**Pause only if:**",
  "exact user-owned decision or action",
  "The user interrupts",
  "not by itself a reason to ask whether to continue",
  "progress checkpoint",
  "locally resolvable",
  "blocked live/external gate",
  "Pause only for an exact user-owned blocker",
  "## Owner Action Required",
  "do not guess across an exact owner boundary",
] as const;

/**
 * Old contradictory apply pause/options wording that caused routine "continue?"
 * owner questions after large cycles or ordinary failures.
 */
const OPENSPEC_APPLY_AUTONOMY_FORBIDDEN_PHRASES = [
  "wait for guidance",
  "Pause on errors",
  "Pause if: Error or blocker",
  "Error or blocker encountered",
  "report and wait",
  "Would you like me to continue",
  "Do you want me to continue",
  "Should I continue",
] as const;

const GLOBAL_CHECKPOINT_CONTINUE_MARKERS = [
  "A progress checkpoint, completed or long work cycle, green validation pass, still-open task, locally resolvable failure, or blocked live/external gate is not itself an owner blocker",
  "Do not ask whether to continue while safe local/offline required work remains",
] as const;

const BASELINE_FALSE_COMPLETE_ARCHIVE_FRAGMENT =
  "All current tasks are checked, so archive the change as complete even if Development-Stage remains development and the required receipt is absent.";

function missingTokens(text: string, tokens: readonly string[]): string[] {
  return tokens.filter((token) => !text.includes(token));
}

const ARBITER_CHECKPOINT_CONTINUE_MARKERS = [
  "classify a question asking whether to continue in that state as autonomous",
  "progress checkpoint, completed or long work cycle, green validation pass, still-open task, locally resolvable failure, or blocked live/external gate is not an owner boundary",
  "use `owner_required` only when the question crosses an exact owner boundary",
] as const;

/** Strip fenced examples so sequencing/owner-stop oracles inspect operative instructions only. */
function operativeInstructionText(source: string): string {
  return source.replace(/```[\s\S]*?```/g, "\n");
}

const TASK_SEQUENCING_APPLY_SURFACES = [
  "global/skills/openspec-apply-change/SKILL.md",
  "global/commands/opsx-apply.md",
] as const;

const TASK_SEQUENCING_GLOBAL_MARKERS = [
  "Task order/batching, tool/reviewer choice, and cycle size are agent-owned",
  "Pending tasks remain required only while consistent with the current user-bounded outcome",
  "smallest dependency-valid slice to the first sufficient real boundary",
  "stop only the affected action at its exact owner boundary",
] as const;

const TASK_SEQUENCING_APPLY_MARKERS = [
  "smallest dependency-valid pending slice",
  "unless the user bounded this request",
  "an exact owner boundary stops it",
  "This does not authorize the underlying protected action",
] as const;

const TASK_SEQUENCING_ARBITER_MARKERS = [
  "unbounded task-range/batch/review/cycle question is autonomous",
  "every advancing option",
  "Use `owner_required` only for an exact protected decision/action",
] as const;

/** Current compressed arbiter rule: mixed protected+review menus stay autonomous. */
const WEAK_ARBITER_EVERY_OPTION_FRAGMENT =
  "An unbounded task-range/batch/review/cycle question is autonomous: choose the smallest dependency-valid slice unless every option is `owner_required`. Use `owner_required` only for an exact protected decision/action";

/** Pre-candidate wording: generic `scope` ask plus apply-until-done without an explicit user task limit. */
const BASELINE_TASK_SEQUENCING_FRAGMENT = [
  "Think before coding: do not assume, hide confusion, or silently choose between meaningful interpretations. If ambiguity affects outcome, risk, scope, data, or public API, stop and ask one concise question; if a safe reversible default exists, state the assumption and continue.",
  "Keep going through tasks until done, interrupted, or stopped by an exact owner boundary",
].join("\n");

const TASK_SEQUENCING_FORBIDDEN_GENERIC_SCOPE =
  "If ambiguity affects outcome, risk, scope, data, or public API";

export const changeReadyDeliveryContractTests: TestCase[] = [
  {
    name: "contracts: OpenSpec apply skill and slash command keep owner-only pause autonomy",
    run: () => {
      for (const relative of OPENSPEC_APPLY_AUTONOMY_SURFACES) {
        const text = fs.readFileSync(path.join(root, relative), "utf8");
        assertTokens(text, OPENSPEC_APPLY_AUTONOMY_REQUIRED_MARKERS, `${relative} missing apply autonomy marker`);
        for (const phrase of OPENSPEC_APPLY_AUTONOMY_FORBIDDEN_PHRASES) {
          assert(
            !text.includes(phrase),
            `${relative} retains forbidden generic pause/continue trigger: ${phrase}`,
          );
        }
        // Owner-boundary path must remain explicit — autonomy must not erase protected stops.
        assert(
          text.includes("exact owner boundary") || text.includes("exact user-owned"),
          `${relative} must retain exact owner-boundary pause language`,
        );
        assert(
          text.includes("## Owner Action Required"),
          `${relative} must retain the owner-blocker output contract`,
        );
      }
    },
  },
  {
    name: "contracts: global authority and completion arbiter reject checkpoint continue questions",
    run: () => {
      const agents = fs.readFileSync(path.join(root, "global", "AGENTS.md"), "utf8");
      assertTokens(
        agents,
        GLOBAL_CHECKPOINT_CONTINUE_MARKERS,
        "global/AGENTS.md missing checkpoint/continue autonomy rule",
      );
      assert(
        agents.includes("exact owner-only blocker") || agents.includes("exact user-owned blockers"),
        "global/AGENTS.md must retain exact owner-boundary pause authority",
      );

      const arbiter = fs.readFileSync(path.join(root, "global", "agents", "session-completion-arbiter.md"), "utf8");
      assertTokens(
        arbiter,
        ARBITER_CHECKPOINT_CONTINUE_MARKERS,
        "session-completion-arbiter missing checkpoint continue-as-autonomous rule",
      );
      assert(
        arbiter.includes("Use `owner_required` only for an exact protected decision/action"),
        "session-completion-arbiter must retain owner_required for exact protected boundaries",
      );
    },
  },
  {
    name: "contracts: current copied authority passes active structural checks",
    run: () => {
      const agents = copiedAgentsAuthority();
      const skill = fs.readFileSync(path.join(root, "global", "skills", "change-ready-sdlc", "SKILL.md"), "utf8");
      assertEqual(agentsAuthorityProblem(`${agents}`), null, "Copied current global authority must pass the pure boundary.");
      assertEqual(skillAuthorityProblem(`${skill}`), null, "Copied current skill authority must pass the pure boundary.");
      assertTokens(agents, [
        "Development-Stage: development | MVP | RC<n> | stable",
        ...GLOBAL_AGENTS_PROTECTED_BOUNDARY_CATEGORIES.map(({ marker }) => marker),
        GLOBAL_AGENTS_NON_WAIVABLE_RISK_CLAUSE,
      ], "Copied global authority missing safety marker");
    },
  },
  {
    name: "contracts: copied authority rejects every protected-boundary omission",
    run: () => {
      const agents = copiedAgentsAuthority();
      for (const [index, { label, marker }] of GLOBAL_AGENTS_PROTECTED_BOUNDARY_CATEGORIES.entries()) {
        const incomplete = agents.replaceAll(marker, `[removed-protected-boundary-${index}]`);
        assert(incomplete !== agents, `Copied authority must contain protected boundary ${label}.`);
        assertEqual(agentsAuthorityProblem(incomplete), `AGENTS.md missing protected-boundary category: ${label}`, `Missing ${label} must fail closed.`);
      }
      const withoutNonWaivable = agents.replaceAll(GLOBAL_AGENTS_NON_WAIVABLE_RISK_CLAUSE, "[removed-non-waivable-risk]");
      assertEqual(agentsAuthorityProblem(withoutNonWaivable), "AGENTS.md missing non-waivable critical-risk clause", "Non-waivable critical-risk omission must fail closed.");
    },
  },
  {
    name: "contracts: project-facing mirrors keep exact no-external-context handoff guards",
    run: () => {
      for (const { relative, markers } of MIRROR_SELF_CONTAINMENT_MARKERS) {
        const text = fs.readFileSync(path.join(root, relative), "utf8");
        assertTokens(text, markers, `${relative} missing self-contained owner-handoff guard`);
      }
    },
  },
  {
    name: "contracts: automatic completion guard retires active session-delivery-reviewer routing",
    run: () => {
      assert(
        !fs.existsSync(path.join(root, "global", "agents", "session-delivery-reviewer.md")),
        "Active session-delivery-reviewer agent file must be deleted after migration.",
      );
      for (const relative of ACTIVE_CATALOG_SURFACES) {
        const text = fs.readFileSync(path.join(root, relative), "utf8");
        assert(
          !text.includes("session-delivery-reviewer"),
          `${relative} must not positively register or route retired session-delivery-reviewer.`,
        );
        assert(
          text.includes("session-completion-arbiter") || relative === "README.md" || relative.endsWith("opencode.json.template"),
          `${relative} should retain completion-arbiter routing when it is a profile/catalog surface.`,
        );
      }
      const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");
      assert(readme.includes("session-completion-arbiter"), "README catalog must advertise the hidden completion arbiter.");
      assert(!readme.includes("`session-delivery-reviewer`"), "README catalog must not advertise retired session-delivery-reviewer.");
      const template = fs.readFileSync(path.join(root, "global", "opencode.json.template"), "utf8");
      assert(template.includes("session-completion-guard"), "Runtime template must load the completion guard extension.");
      assert(template.includes("session-completion-arbiter"), "Runtime template must name the completion arbiter agent.");
    },
  },
  {
    name: "contracts: optional post-proof review remains non-authorizing without delivery-reviewer binding",
    run: () => {
      for (const relative of OPTIONAL_REVIEW_SURFACES) {
        const text = fs.readFileSync(path.join(root, relative), "utf8");
        assert(text.includes("after current proof"), `${relative} missing optional post-proof review timing`);
        assert(
          /optional/i.test(text),
          `${relative} missing optional review wording`,
        );
        assert(
          text.includes("never authorize mutation") || text.includes("never a stage blocker") || text.includes("not itself a stage blocker"),
          `${relative} missing non-authorizing optional-review safeguard`,
        );
        assert(
          !text.includes("session-delivery-reviewer"),
          `${relative} must not instruct dispatch of retired session-delivery-reviewer.`,
        );
      }
    },
  },
  {
    name: "contracts: completion arbiter remains machine-only and non-lifecycle",
    run: () => {
      const arbiter = fs.readFileSync(path.join(root, "global", "agents", "session-completion-arbiter.md"), "utf8");
      assertTokens(arbiter, [
        "hidden: true",
        "\"*\": deny",
        "schemaVersion",
        "auditID",
        "rootSessionRef",
        "inspectedRevision",
        "allow_stop | continue | owner_required | user_paused",
        "one JSON object",
        "Do not wrap it in Markdown",
        "never run as an optional reviewer",
        "never approves `Development-Stage`",
        "Never convert synthetic text or guard rejection into a human requirement or answer",
      ], "Completion arbiter missing machine-verdict safeguard");
      assert(!arbiter.includes("session_delivery_context:"), "Completion arbiter must not register session_delivery_context tool permission.");
    },
  },
  {
    name: "contracts: historical delivery-reviewer evidence remains attributable outside active routing",
    run: () => {
      const feedback = fs.readFileSync(path.join(root, "docs", "feedbacks", "session-delivery-reviewer.md"), "utf8");
      assert(feedback.includes("session-delivery-reviewer"), "Historical feedback ledger may retain retired agent attribution.");
      const historyPaths = resolveSessionCompletionGuardHistoryPaths();
      const activeRel = `openspec/changes/${SESSION_COMPLETION_GUARD_CHANGE}/history.md`;
      const archiveRel = `openspec/changes/archive/*-${SESSION_COMPLETION_GUARD_CHANGE}/history.md`;
      assert(
        historyPaths.length === 1,
        historyPaths.length === 0
          ? `Expected exactly one attributable history for ${SESSION_COMPLETION_GUARD_CHANGE} at ${activeRel} or a unique ${archiveRel}; found none.`
          : `Expected exactly one attributable history for ${SESSION_COMPLETION_GUARD_CHANGE}; found ${historyPaths.length}: ${historyPaths.join(", ")}. Resolve active vs archive ambiguity before attributing retired reviewer evidence.`,
      );
      const changeHistory = fs.readFileSync(historyPaths[0]!, "utf8");
      assert(
        changeHistory.includes("session-delivery-reviewer"),
        `Change history at ${historyPaths[0]} may retain superseded approach attribution.`,
      );
      const agents = fs.readFileSync(path.join(root, "global", "AGENTS.md"), "utf8");
      assert(!agents.includes("session-delivery-reviewer"), "Loaded global authority must not route the retired reviewer.");
    },
  },
  {
    name: "contracts: removed completion ceremony cannot return on loaded workflow surfaces",
    run: () => {
      for (const relative of REMOVED_COMPLETION_CEREMONY_SURFACES) {
        const text = fs.readFileSync(path.join(root, relative), "utf8");
        for (const forbidden of REMOVED_COMPLETION_CEREMONY_MARKERS) {
          assert(!text.includes(forbidden), `${relative} retains removed completion ceremony: ${forbidden}`);
        }
      }

      const template = fs.readFileSync(path.join(root, "global", "opencode.json.template"), "utf8");
      assert(
        template.includes("Next-Session Action"),
        "Compaction prompt must still emit one Next-Session Action for gate ordering",
      );
      assert(
        template.includes("Live-Attempt Gate: clear | blocked | unknown"),
        "Compaction prompt must retain Live-Attempt Gate classification",
      );
      assertTokens(
        template,
        COMPACTION_REFLECTION_MARKERS,
        "global/opencode.json.template missing compaction reflection-separation marker",
      );
      for (const forbidden of REMOVED_COMPLETION_CEREMONY_MARKERS) {
        assert(!template.includes(forbidden), `Compaction prompt retains removed product-task expansion: ${forbidden}`);
      }

      const ceremonyRestored = `${template}\nCreate a final-history-retrospective task and Pending Improvement Tasks.\n`;
      assert(
        ceremonyRestored.includes("final-history-retrospective") && ceremonyRestored.includes("Pending Improvement Tasks"),
        "Negative ceremony mutation must be distinguishable from the current candidate.",
      );
    },
  },
  {
    name: "contracts: apply/archive refuse checked-but-unmet completion and keep helper resolution fail-closed",
    run: () => {
      for (const relative of APPLY_OUTCOME_RECONCILIATION_SURFACES) {
        const text = fs.readFileSync(path.join(root, relative), "utf8");
        assertEqual(
          missingTokens(text, APPLY_OUTCOME_RECONCILIATION_MARKERS).join("|"),
          "",
          `${relative} missing apply outcome-reconciliation markers: ${missingTokens(text, APPLY_OUTCOME_RECONCILIATION_MARKERS).join(", ")}`,
        );
      }

      for (const relative of ARCHIVE_OUTCOME_RECONCILIATION_SURFACES) {
        const text = fs.readFileSync(path.join(root, relative), "utf8");
        assertEqual(
          missingTokens(text, ARCHIVE_OUTCOME_RECONCILIATION_MARKERS).join("|"),
          "",
          `${relative} missing archive outcome-reconciliation markers: ${missingTokens(text, ARCHIVE_OUTCOME_RECONCILIATION_MARKERS).join(", ")}`,
        );
      }

      for (const surface of HELPER_RESOLUTION_SURFACES) {
        const text = fs.readFileSync(path.join(root, surface.relative), "utf8");
        assertTokens(
          text,
          [...HELPER_RESOLUTION_MARKERS, surface.helper],
          `${surface.relative} missing portable helper-resolution marker`,
        );
      }

      assert(
        missingTokens(BASELINE_FALSE_COMPLETE_ARCHIVE_FRAGMENT, ARCHIVE_OUTCOME_RECONCILIATION_MARKERS).length > 0,
        "Baseline checked-but-unmet archive fragment must fail the outcome-reconciliation oracle.",
      );

      const archive = fs.readFileSync(path.join(root, "global", "skills", "openspec-archive-change", "SKILL.md"), "utf8");
      const withoutOutcomeGate = archive.replaceAll("all-checked tasks", "checked tasks as completion");
      assert(
        missingTokens(withoutOutcomeGate, ARCHIVE_OUTCOME_RECONCILIATION_MARKERS).includes("all-checked tasks"),
        "Dropping all-checked-as-structural-only wording must fail closed.",
      );
      const withoutUnmetRoute = archive.replaceAll("smallest ordinary task", "complete archive anyway");
      assert(
        missingTokens(withoutUnmetRoute, ARCHIVE_OUTCOME_RECONCILIATION_MARKERS).includes("smallest ordinary task"),
        "Dropping unmet-outcome reopen/add routing must fail closed.",
      );

      const apply = fs.readFileSync(path.join(root, "global", "skills", "openspec-apply-change", "SKILL.md"), "utf8");
      const allDoneAsComplete = apply.replaceAll("state: \"all_done\"", "state: complete");
      assert(
        missingTokens(allDoneAsComplete, APPLY_OUTCOME_RECONCILIATION_MARKERS).includes("state: \"all_done\""),
        "Treating all_done as completion instead of provisional structure must fail closed.",
      );

      const strippedGlobal = archive.replaceAll("Never strip a final `global` segment", "May strip a final global segment");
      assert(
        !strippedGlobal.includes("Never strip a final `global` segment"),
        "Dropping no-strip-global helper resolution must fail closed.",
      );
    },
  },
  {
    name: "contracts: task-range sequencing stays autonomous without bypassing user limits or protected actions",
    run: () => {
      const agents = operativeInstructionText(
        fs.readFileSync(path.join(root, "global", "AGENTS.md"), "utf8"),
      );
      const arbiter = operativeInstructionText(
        fs.readFileSync(path.join(root, "global", "agents", "session-completion-arbiter.md"), "utf8"),
      );

      assertEqual(
        missingTokens(agents, TASK_SEQUENCING_GLOBAL_MARKERS).join("|"),
        "",
        `global/AGENTS.md missing task-sequencing pair: ${missingTokens(agents, TASK_SEQUENCING_GLOBAL_MARKERS).join(", ")}`,
      );
      assert(
        !agents.includes(TASK_SEQUENCING_FORBIDDEN_GENERIC_SCOPE),
        "global/AGENTS.md must not restore the generic scope ambiguity trigger",
      );

      for (const relative of TASK_SEQUENCING_APPLY_SURFACES) {
        const text = operativeInstructionText(fs.readFileSync(path.join(root, relative), "utf8"));
        assertEqual(
          missingTokens(text, TASK_SEQUENCING_APPLY_MARKERS).join("|"),
          "",
          `${relative} missing task-sequencing pair: ${missingTokens(text, TASK_SEQUENCING_APPLY_MARKERS).join(", ")}`,
        );
      }

      assertEqual(
        missingTokens(arbiter, TASK_SEQUENCING_ARBITER_MARKERS).join("|"),
        "",
        `session-completion-arbiter missing task-sequencing pair: ${missingTokens(arbiter, TASK_SEQUENCING_ARBITER_MARKERS).join(", ")}`,
      );

      assert(
        missingTokens(BASELINE_TASK_SEQUENCING_FRAGMENT, TASK_SEQUENCING_GLOBAL_MARKERS).length > 0,
        "Baseline pre-candidate wording must fail the global sequencing/user-bound oracle",
      );
      assert(
        missingTokens(BASELINE_TASK_SEQUENCING_FRAGMENT, TASK_SEQUENCING_APPLY_MARKERS).length > 0,
        "Baseline pre-candidate wording must fail the apply sequencing/user-bound oracle",
      );
      assert(
        missingTokens(BASELINE_TASK_SEQUENCING_FRAGMENT, TASK_SEQUENCING_ARBITER_MARKERS).length > 0,
        "Baseline pre-candidate wording must fail the arbiter sequencing/owner-stop oracle",
      );

      const agentsWithAcceptedTasks = agents.replaceAll(
        "Pending tasks remain required only while consistent with the current user-bounded outcome",
        "pending tasks remain accepted unless user-bounded",
      );
      assert(
        agentsWithAcceptedTasks !== agents &&
          missingTokens(agentsWithAcceptedTasks, TASK_SEQUENCING_GLOBAL_MARKERS).includes(
            "Pending tasks remain required only while consistent with the current user-bounded outcome",
          ),
        "Restoring accepted-pending-task owner-scope wording must fail closed",
      );
      const agentsWithoutSufficientSlice = agents.replaceAll(
        "smallest dependency-valid slice to the first sufficient real boundary",
        "smallest dependency-valid slice to earliest safe real boundary",
      );
      assert(
        agentsWithoutSufficientSlice !== agents &&
          missingTokens(agentsWithoutSufficientSlice, TASK_SEQUENCING_GLOBAL_MARKERS).includes(
            "smallest dependency-valid slice to the first sufficient real boundary",
          ),
        "Restoring earliest-boundary slice wording without sufficiency must fail closed",
      );

      const apply = operativeInstructionText(
        fs.readFileSync(path.join(root, "global", "skills", "openspec-apply-change", "SKILL.md"), "utf8"),
      );
      const applyWithoutUserBound = apply.replaceAll(
        "unless the user bounded this request",
        "unless the session is tired",
      );
      assert(
        missingTokens(applyWithoutUserBound, TASK_SEQUENCING_APPLY_MARKERS).includes(
          "unless the user bounded this request",
        ),
        "Dropping the explicit user task-limit stop must fail closed",
      );
      const applyWithoutOwnerStop = apply.replaceAll(
        "an exact owner boundary stops it",
        "an exact owner boundary may be deferred",
      );
      assert(
        missingTokens(applyWithoutOwnerStop, TASK_SEQUENCING_APPLY_MARKERS).includes(
          "an exact owner boundary stops it",
        ),
        "Dropping the exact owner-boundary stop while keeping sequencing autonomy must fail closed",
      );

      assert(
        missingTokens(WEAK_ARBITER_EVERY_OPTION_FRAGMENT, TASK_SEQUENCING_ARBITER_MARKERS).includes(
          "every advancing option",
        ),
        "Arbiter wording that treats mixed protected+non-advancing menus as autonomous must fail closed",
      );
      const arbiterWithoutAdvancingStop = arbiter.replaceAll(
        "every advancing option",
        "every option",
      );
      assert(
        missingTokens(arbiterWithoutAdvancingStop, TASK_SEQUENCING_ARBITER_MARKERS).includes(
          "every advancing option",
        ),
        "Dropping advancing-option owner_required retention for mixed protected menus must fail closed",
      );
    },
  },
];
