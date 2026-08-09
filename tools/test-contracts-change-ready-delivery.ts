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

export const changeReadyDeliveryContractTests: TestCase[] = [
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
    name: "contracts: optional post-MVP review remains non-authorizing without delivery-reviewer binding",
    run: () => {
      for (const relative of OPTIONAL_REVIEW_SURFACES) {
        const text = fs.readFileSync(path.join(root, relative), "utf8");
        assert(text.includes("after MVP"), `${relative} missing optional post-MVP review timing`);
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
      const changeHistory = fs.readFileSync(
        path.join(root, "openspec", "changes", "add-session-completion-guard", "history.md"),
        "utf8",
      );
      assert(changeHistory.includes("session-delivery-reviewer"), "Active change history may retain superseded approach attribution.");
      const agents = fs.readFileSync(path.join(root, "global", "AGENTS.md"), "utf8");
      assert(!agents.includes("session-delivery-reviewer"), "Loaded global authority must not route the retired reviewer.");
    },
  },
];
