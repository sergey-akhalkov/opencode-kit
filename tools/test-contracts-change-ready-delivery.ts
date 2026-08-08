import fs from "node:fs";
import path from "node:path";

import {
  MATERIAL_DELIVERY_ROUTING_SURFACES,
  MATERIAL_DELIVERY_ROUTING_TOKENS,
  SESSION_DELIVERY_BINDING_CONTRACT,
  SESSION_DELIVERY_BINDING_HANDOFF_TOKENS,
  SESSION_DELIVERY_BINDING_REQUIRED_TEXT,
  SESSION_DELIVERY_BINDING_SURFACES,
} from "./contracts/reviewer-binding.ts";
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
  assertDeepEqual,
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

const EXPECTED_SESSION_DELIVERY_REQUIRED_TEXT = [
  "optional after MVP",
  "never a mandatory RC/stable gate",
  "## Minimal Evidence Bundle",
  "changed files or diffstat",
  "Root causes must cite evidence; use `unknown`",
  "candidate-specific production proof",
  "critical-risks-reported | no-critical-risk | blocked",
  "Keep matrices terse",
  "Risk Matrix",
  "Do not return an acceptance/rejection verdict",
  "Candidate Reference",
  "readable scoped candidate",
  "Rollback plan",
  "proportional",
  "Development-Stage",
  "Stable Candidate: RC<n>",
  "no stage authorizes external operations",
  "Effective Model",
];

const EXPECTED_DELIVERY_SURFACES = [
  "REPO_AGENTS.md",
  "global/AGENTS.md",
  "instructions/reusable-project-agent-instructions.md",
  "instructions/universal-development-loop.md",
  "templates/project/AGENTS.md",
];

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
    name: "contracts: optional delivery binding arrays are byte-equal",
    run: () => {
      assertDeepEqual([...SESSION_DELIVERY_BINDING_REQUIRED_TEXT], EXPECTED_SESSION_DELIVERY_REQUIRED_TEXT, "Session-delivery required markers drifted.");
      assertDeepEqual(SESSION_DELIVERY_BINDING_CONTRACT.requiredText, EXPECTED_SESSION_DELIVERY_REQUIRED_TEXT, "Session-delivery contract drifted.");
      assertDeepEqual([...SESSION_DELIVERY_BINDING_HANDOFF_TOKENS], ["Development-Stage", "after MVP", "optional"], "Session-delivery handoff tokens drifted.");
      assertDeepEqual([...MATERIAL_DELIVERY_ROUTING_TOKENS], [
        "Optional final-candidate",
        "after MVP",
        "concrete risk, project policy, or",
        "not itself a stage blocker",
      ], "Optional delivery routing tokens drifted.");
      assertDeepEqual([...MATERIAL_DELIVERY_ROUTING_SURFACES], EXPECTED_DELIVERY_SURFACES, "Optional delivery routing surfaces drifted.");
      assertDeepEqual([...SESSION_DELIVERY_BINDING_SURFACES], EXPECTED_DELIVERY_SURFACES, "Delivery handoff surfaces drifted.");
    },
  },
  {
    name: "contracts: project-facing surfaces keep optional post-MVP delivery semantics",
    run: () => {
      for (const relative of EXPECTED_DELIVERY_SURFACES) {
        const text = fs.readFileSync(path.join(root, relative), "utf8");
        assertTokens(text, MATERIAL_DELIVERY_ROUTING_TOKENS, `${relative} missing optional delivery route`);
        assertTokens(text, SESSION_DELIVERY_BINDING_HANDOFF_TOKENS, `${relative} missing stage/optional handoff token`);
      }
    },
  },
  {
    name: "contracts: session delivery review is evidence-only and never a stage gate",
    run: () => {
      const delivery = fs.readFileSync(path.join(root, "global", "agents", "session-delivery-reviewer.md"), "utf8");
      assertTokens(delivery, [
        ...SESSION_DELIVERY_BINDING_REQUIRED_TEXT,
        "Missing or unusable optional review output is not itself a stage blocker",
        "never a mandatory RC/stable gate",
        "Main alone dispositions every row and changes stage",
        "execution remains separately authorized",
        "never required solely to claim stable",
      ], "Session-delivery role missing optional/non-authorizing safeguard");
      for (const staleActivePolicy of [
        "run this delivery review once after Runtime Proof and before terminal SDET regardless of diagnostic scale",
        "unusable mandatory output consumes the launch",
        "Main alone dispositions every row and decides Done-Done",
      ]) {
        assert(!delivery.includes(staleActivePolicy), `Session-delivery role retains superseded mandatory policy: ${staleActivePolicy}`);
      }
    },
  },
  {
    name: "contracts: optional delivery never authorizes external operations",
    run: () => {
      const delivery = fs.readFileSync(path.join(root, "global", "agents", "session-delivery-reviewer.md"), "utf8");
      assertTokens(delivery, [
        "no stage authorizes external operations",
        "Do not set or approve `Development-Stage`",
        "Rollback plan: proportional",
        "execution remains separately authorized",
        "External Operations",
      ], "Delivery role missing external-operation separation");
    },
  },
];
