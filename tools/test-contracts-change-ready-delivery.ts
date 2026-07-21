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
  GLOBAL_AGENTS_DECISION_READY_HANDOFF_FIELDS,
  GLOBAL_AGENTS_NON_WAIVABLE_RISK_CLAUSE,
  GLOBAL_AGENTS_PROTECTED_BOUNDARY_CATEGORIES,
} from "./contracts/skills.ts";
import {
  addRegisteredReviewerFixture,
  assert,
  assertDeepEqual,
  assertEqual,
  assertFailure,
  assertOutputContains,
  assertSuccess,
  installer,
  invokeProcessCapture,
  invokeValidator,
  libraryRoot,
  newLibraryFixture,
  sectionBetween,
  taskSectionBetween,
  type TestCase,
  writeText,
} from "./test-helpers/library.ts";
import { measuredValueLength, SETX_SAFE_LIMIT } from "./install-opencode-global.ts";
import {
  agentsAuthorityProblem,
  operativeTextOutsideFences,
  scanOperativeTextOutsideFences,
  skillAuthorityProblem,
} from "./validators/active-authority.ts";

const root = libraryRoot;
const ENV_VAR = "OPENCODE_CONFIG_DIR";
const globalPath = path.resolve(root, "global");

function invokeInstaller(args: string[], envOverride?: Record<string, string | undefined>) {
  return invokeProcessCapture(process.execPath, [installer, ...args], root, envOverride);
}

function assertTokens(text: string, tokens: readonly string[], message: string): void {
  for (const token of tokens) {
    assert(text.includes(token), `${message}: ${token}`);
  }
}

const NAMED_MATERIAL_RISK_TEXT = "public API/protocol/compatibility, persisted data or migration, security/privacy/authorization, destructive or remote, concurrency correctness, deployment/release, loaded instruction/configuration change that alters lifecycle or safety policy";
const PROTECTED_BOUNDARY_AUTHORITY_TEXT = GLOBAL_AGENTS_PROTECTED_BOUNDARY_CATEGORIES.map(({ marker }) => marker).join("; ");
const DECISION_READY_HANDOFF_TEXT = GLOBAL_AGENTS_DECISION_READY_HANDOFF_FIELDS.join("; ");
const CONFORMING_AGENTS_ROUTING_BODY = `Ordinary Small is the default and reports Change-Ready: not requested. Main may directly author Ordinary Small production changes.
Profiles remain Ordinary Small | Material. Pilot-Ready: yes | no | not requested is a disposition inside a technically enforced operating envelope. Neither disposition authorizes external operations.
Path: prove it observably before inspecting realistic requirement-linked edge cases.
The accepted outcome and protected boundaries define scope; expansion requires explicit user approval. Necessary local reversible work uses the smallest sufficient dependency closure. Findings never authorize mutation.
Qualification permits one correction wave. Attempt failure does not automatically end the unfinished root goal. An unchanged-candidate must not be retried blindly.
Before the first mutation, load change-ready-sdlc for an explicit Change-Ready request, project-required qualification, or a concrete Material risk: ${NAMED_MATERIAL_RISK_TEXT}.
High-risk behavior must not be downgraded merely because the diff is small.
Before Pilot-Ready: yes, require a bounded outcome and non-goals, real-boundary happy-path proof, focused project-native validation, critical safety/data/authorization protection, sufficient material failure visibility, and proportional disable/rollback/containment.
Protected-boundary owner authority includes: ${PROTECTED_BOUNDARY_AUTHORITY_TEXT}.
${GLOBAL_AGENTS_NON_WAIVABLE_RISK_CLAUSE}
Decision-ready handoff states: ${DECISION_READY_HANDOFF_TEXT}. State every listed field explicitly; when evidence is absent, use unknown or none.`;
const CONFORMING_AGENTS_AUTHORITY = `# Independent Active Authority

## Change-Ready SDLC Routing

${CONFORMING_AGENTS_ROUTING_BODY}

## Universal Task Briefing Contract

Provide an execution-ready brief before specialist dispatch.

## Autonomous Work Contract

The primary orchestrator owns lifecycle state and bounded validation.

## Shared Reviewer Runtime Invariants

Reviewers are read-only leaf specialists and never self-approve readiness.
`;
const MANDATORY_AGENTS_H2_TITLES = [
  "Change-Ready SDLC Routing",
  "Universal Task Briefing Contract",
  "Autonomous Work Contract",
  "Shared Reviewer Runtime Invariants",
] as const;
const SKILL_FRONTMATTER = `---
name: change-ready-sdlc
description: Independent fenced-code authority fixture.
---
`;
const CONFORMING_SKILL_BODY = `# Change-Ready SDLC
## When To Load
Ordinary Small does **not** load this skill. Named Material risks: ${NAMED_MATERIAL_RISK_TEXT}.
High-risk behavior must not be downgraded merely because the diff is small.
## Profile
Use a project-specific scope lock around the accepted outcome and protected boundaries; expansion requires explicit owner approval.
Necessary local reversible work uses the smallest sufficient dependency closure. Findings use Blocking Evidence and non-authorizing Follow-up Candidates and never authorize mutation. Qualification permits one correction wave with no persistent evidence infrastructure and does not automatically end the unfinished root goal. Never retry an unchanged candidate. Never ask the user solely to approve an internal revision. Final review uses approved | approved_with_notes | rejected | blocked.
## Adapter Discovery
## Authoritative Brief
## Orchestrator ownership
## Lifecycle transitions
### 1. Classify and prepare
### 2. Production path or test-only N/A
### 3. Candidate Reference
### 4. Applicable Proof
### 5. Fresh SDET
### 6. Project-Native Validation
### 7. Correction routing and replay
### 8. Final Candidate Review
### 9. Change-Ready Decision
### 10. Pilot-Ready Decision
Pilot-Ready: yes | no | not requested is not a third lifecycle profile; profiles remain Ordinary Small | Material. The complete Pilot safety floor is authoritative only in always-loaded global AGENTS.md; this skill does not restate that floor. Neither disposition authorizes external operations.
## Compact orchestration output
`;
const CONFORMING_SKILL_AUTHORITY = `${SKILL_FRONTMATTER}${CONFORMING_SKILL_BODY}`;

const GLOBAL_AUTHORITY_MINIMUM_CASES = [
  ...GLOBAL_AGENTS_PROTECTED_BOUNDARY_CATEGORIES.map(({ label, marker }) => ({
    label: `protected boundary ${label}`,
    marker,
    diagnostic: `AGENTS.md missing protected-boundary category: ${label}`,
  })),
  {
    label: "non-waivable critical-risk clause",
    marker: GLOBAL_AGENTS_NON_WAIVABLE_RISK_CLAUSE,
    diagnostic: "AGENTS.md missing non-waivable critical-risk clause",
  },
  ...GLOBAL_AGENTS_DECISION_READY_HANDOFF_FIELDS.map((field) => ({
    label: `decision-ready handoff field ${field}`,
    marker: field,
    diagnostic: `AGENTS.md missing decision-ready handoff field: ${field}`,
  })),
];

const SKILL_OPERATIVE_AUTHORITY_CASES = [
  { marker: "Ordinary Small does **not** load this skill", diagnostic: "skills/change-ready-sdlc/SKILL.md missing Ordinary Small non-load/default boundary" },
  { marker: "project-specific scope lock", diagnostic: "skills/change-ready-sdlc/SKILL.md missing project-specific scope-lock control" },
  { marker: "explicit owner approval", diagnostic: "skills/change-ready-sdlc/SKILL.md missing explicit owner approval expansion rule" },
  { marker: "must not be downgraded merely because the diff is small", diagnostic: "skills/change-ready-sdlc/SKILL.md missing no high-risk downgrade for small diffs" },
  { marker: "accepted outcome", diagnostic: "skills/change-ready-sdlc/SKILL.md missing accepted-outcome authority marker" },
  { marker: "protected boundaries", diagnostic: "skills/change-ready-sdlc/SKILL.md missing protected-boundaries authority marker" },
  { marker: "smallest sufficient dependency closure", diagnostic: "skills/change-ready-sdlc/SKILL.md missing local reversible dependency-closure marker" },
  { marker: "never authorize mutation", diagnostic: "skills/change-ready-sdlc/SKILL.md missing non-authorizing findings rule" },
  { marker: "one correction wave", diagnostic: "skills/change-ready-sdlc/SKILL.md missing finite one-correction-wave marker" },
  { marker: "does not automatically end the unfinished root goal", diagnostic: "skills/change-ready-sdlc/SKILL.md missing attempt-versus-root-goal continuation marker" },
  { marker: "Never retry an unchanged candidate", diagnostic: "skills/change-ready-sdlc/SKILL.md missing unchanged-candidate anti-retry marker" },
  { marker: "Never ask the user solely to approve an internal revision", diagnostic: "skills/change-ready-sdlc/SKILL.md missing process-only-blocker prohibition marker" },
  { marker: "Blocking Evidence", diagnostic: "skills/change-ready-sdlc/SKILL.md missing Blocking Evidence output field" },
  { marker: "Follow-up Candidates", diagnostic: "skills/change-ready-sdlc/SKILL.md missing Follow-up Candidates output field" },
  { marker: "approved | approved_with_notes | rejected | blocked", diagnostic: "skills/change-ready-sdlc/SKILL.md missing final-review rejected verdict enum" },
  { marker: "Pilot-Ready: yes | no | not requested", diagnostic: "skills/change-ready-sdlc/SKILL.md missing exact Pilot-Ready disposition token" },
  { marker: "not a third lifecycle profile", diagnostic: "skills/change-ready-sdlc/SKILL.md missing no-third-profile Pilot-Ready boundary" },
  { marker: "complete Pilot safety floor is authoritative only in always-loaded global", diagnostic: "skills/change-ready-sdlc/SKILL.md missing complete Pilot safety-floor authority reference to always-loaded global AGENTS" },
  { marker: "Neither disposition authorizes", diagnostic: "skills/change-ready-sdlc/SKILL.md missing neither-disposition-authorizes external-operation safety marker" },
  { marker: "public API/protocol/compatibility", diagnostic: "skills/change-ready-sdlc/SKILL.md missing named Material risk class: public API/protocol/compatibility" },
  { marker: "persisted data or migration", diagnostic: "skills/change-ready-sdlc/SKILL.md missing named Material risk class: persisted data/migration" },
  { marker: "security/privacy/authorization", diagnostic: "skills/change-ready-sdlc/SKILL.md missing named Material risk class: security/privacy/authorization" },
  { marker: "destructive or remote", diagnostic: "skills/change-ready-sdlc/SKILL.md missing named Material risk class: destructive/remote" },
  { marker: "concurrency correctness", diagnostic: "skills/change-ready-sdlc/SKILL.md missing named Material risk class: concurrency correctness" },
  { marker: "deployment/release", diagnostic: "skills/change-ready-sdlc/SKILL.md missing named Material risk class: deployment/release" },
  { marker: "loaded instruction/configuration change that alters lifecycle or safety policy", diagnostic: "skills/change-ready-sdlc/SKILL.md missing named Material risk class: loaded instruction/config lifecycle/safety" },
] as const;

function fencedBlock(delimiter: "```" | "~~~~", body: string, indent = "", closed = true): string {
  const content = body.endsWith("\n") ? body : `${body}\n`;
  return `${indent}${delimiter} markdown\n${content}${closed ? `${indent}${delimiter}\n` : ""}`;
}

const UNSUPPORTED_AUTHORITY_FENCE_PREFIXES = [
  { label: "blockquote", prefix: "> " },
  { label: "nested blockquote", prefix: "> > " },
  { label: "unordered list", prefix: "- " },
  { label: "ordered list", prefix: "1. " },
  { label: "nested blockquote-list container", prefix: "> - " },
  { label: "four-space indent", prefix: "    " },
  { label: "prose and inline-code prefix", prefix: "prose `inline` " },
  { label: "tab prefix", prefix: "\t" },
] as const;

const SUPPORTED_AUTHORITY_FENCE_CASES = [
  { label: "zero-space closed backtick", delimiter: "```", indent: "", closed: true },
  { label: "zero-space unclosed tilde", delimiter: "~~~~", indent: "", closed: false },
  { label: "one-space closed tilde", delimiter: "~~~~", indent: " ", closed: true },
  { label: "one-space unclosed backtick", delimiter: "```", indent: " ", closed: false },
  { label: "two-space closed backtick", delimiter: "```", indent: "  ", closed: true },
  { label: "two-space unclosed tilde", delimiter: "~~~~", indent: "  ", closed: false },
  { label: "three-space closed tilde", delimiter: "~~~~", indent: "   ", closed: true },
  { label: "three-space unclosed backtick", delimiter: "```", indent: "   ", closed: false },
] as const;

const CONTRACT_REFERENCE_EXAMPLE = "## Contract Reference\n\n`instructions/leaf-reviewer-agent-contract.md`\n";
const CONTRACT_REFERENCE_FENCES = [
  { label: "backtick", example: fencedBlock("```", CONTRACT_REFERENCE_EXAMPLE) },
  { label: "tilde", example: fencedBlock("~~~~", CONTRACT_REFERENCE_EXAMPLE, "   ") },
  { label: "unclosed", example: fencedBlock("```", CONTRACT_REFERENCE_EXAMPLE, " ", false) },
];

function withoutContractReference(text: string): string {
  const updated = text.replace(/^## Contract Reference\r?\n\r?\n`instructions\/leaf-reviewer-agent-contract\.md`\r?\n\r?\n/m, "");
  assert(updated !== text, "Reviewer fixture must contain the standalone Contract Reference before removal.");
  return updated;
}

function typeScriptFiles(directory: string): string[] {
  const files: string[] = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...typeScriptFiles(target));
    else if (entry.isFile() && entry.name.endsWith(".ts")) files.push(target);
  }
  return files;
}

const EXPECTED_SESSION_DELIVERY_BINDING_REQUIRED_TEXT = [
  "For Portable profile Material sessions, always run this delivery review regardless of diagnostic scale",
  "For Portable profile Small sessions, run when project policy, risk, owner, or an explicit delivery-review request requires it",
  "## Minimal Evidence Bundle",
  "changed files or diffstat",
  "reviewer findings/fixes",
  "## Compaction Evidence Boundary",
  "every explicit delivery-review request",
  "Root causes must cite evidence; use `unknown`",
  "requirementSignals[]",
  "Root-session user messages, confirmed `requirementSignals[]`, and explicit `questionReplies[]` override supplied continuation summaries",
  "openspec_all_changes",
  "archive_when_complete",
  "push_after_archive",
  "blocker_escalation_gate",
  "new_change_approval_required",
  "push_all",
  "Missing evidence for a confirmed signaled requirement is a P0 blocker",
  "todos.ever[]",
  "todos.unresolved[]",
  "Changed-file scope",
  "Current-slice framing",
  "P0 blocker",
  "observable happy-path proof",
  "fresh-context testing subagent",
  "Keep matrices terse",
  "Blocking Evidence",
  "Follow-up Candidates",
  "never authorize",
  "Record the optional-tool gap in `Evidence Reviewed` and `Residual Risks`",
  "Record missing required session evidence in `Blocking Evidence` when unavailable from all allowed sources",
  "Optional-tool absence alone is not blocking when substitute evidence is sufficient",
  "Delivery self-gate for the current Material closing task",
  "every prerequisite applicable task is checked with current literal evidence",
  "Any other unchecked applicable task remains a P0",
  "Candidate Reference",
  "readable scoped candidate",
  "Rollback plan",
  "proportional",
  "never required to claim Change-Ready",
  "explicitly accepted conforming delivery result",
  "Verdict: material deviations",
  "Verdict: not enough evidence",
  "must not coexist with `Blocking for Acceptance: no`",
  "terminal for the current attempt",
  "Pilot-Ready: yes|no|not requested",
  "not a third profile",
  "does not authorize external operations",
];

const EXPECTED_SESSION_DELIVERY_BINDING_HANDOFF_TOKENS = [
  "Change-Ready: no",
  "Verdict: material deviations",
  "Verdict: not enough evidence",
  "Blocking for Acceptance: yes",
  "Verdict: blocked",
  "Blocking Evidence",
  "Follow-up Candidates",
  "never authorize",
  "do not present the session as complete",
  "Blocking for Acceptance: no",
  "partial slice handoff must not end an unfinished root goal",
];

const EXPECTED_MATERIAL_DELIVERY_ROUTING_TOKENS = [
  "For Material work, always run the discovered conforming delivery/readiness gate",
  "missing conforming capability blocks",
  "Ordinary Small uses proportional evidence and invokes that gate only when project policy, risk, or the owner requires it",
  "explicitly accepted conforming delivery result",
];

const EXPECTED_DELIVERY_SURFACES = [
  "REPO_AGENTS.md",
  "global/AGENTS.md",
  "instructions/reusable-project-agent-instructions.md",
  "instructions/universal-development-loop.md",
  "templates/project/AGENTS.md",
];

export const changeReadyDeliveryContractTests: TestCase[] = [
  {
    name: "contracts: task lookup accepts only allowed marker states while preserving wording and order",
    run: () => {
      const source = "- [MARKER] 5.1 Start exact ownership\n  continuation oracle\n- [ ] 5.2 Finish exact evidence\n";
      for (const marker of [" ", "x", "X"]) {
        const section = taskSectionBetween(source.replace("MARKER", marker), "5.1 Start exact ownership", "5.2 Finish exact evidence");
        assert(section.includes("continuation oracle"), `Allowed [${marker}] marker must preserve the exact task section.`);
      }
      const invalid = [
        source.replace("MARKER", "-"),
        source.replace("MARKER", " ").replace("Start exact ownership", "Start changed ownership"),
        `${source.replace("MARKER", " ")}- [x] 5.1 Start exact ownership\n`,
        "- [ ] 5.2 Finish exact evidence\n- [x] 5.1 Start exact ownership\n",
        "- [ ] 5.1 Start exact ownership\n",
      ];
      for (const text of invalid) {
        let error: unknown;
        try {
          taskSectionBetween(text, "5.1 Start exact ownership", "5.2 Finish exact evidence");
        } catch (caught) {
          error = caught;
        }
        assert(error instanceof Error, "Unknown markers, wording/order drift, duplicate additions, and deletions must fail task lookup.");
      }
    },
  },
  {
    name: "contracts: copied active authority requires every protected boundary, non-waivable risk, and decision-ready handoff field",
    run: () => {
      assertEqual(agentsAuthorityProblem(CONFORMING_AGENTS_AUTHORITY), null, "Complete independently copied AGENTS authority must pass the pure active-authority boundary.");
      for (const item of GLOBAL_AUTHORITY_MINIMUM_CASES) {
        const incomplete = CONFORMING_AGENTS_AUTHORITY.replaceAll(item.marker, `[removed-${item.label.replace(/[^a-z0-9]+/gi, "-")}]`);
        assert(incomplete !== CONFORMING_AGENTS_AUTHORITY, `Copied AGENTS fixture must contain ${item.label}.`);
        assert(!incomplete.includes(item.marker), `Negative copied AGENTS fixture must remove every occurrence of ${item.label}.`);
        assertEqual(
          agentsAuthorityProblem(incomplete),
          item.diagnostic,
          `Copied AGENTS authority must reject missing ${item.label}.`,
        );
      }
    },
  },
  {
    name: "contracts: copied AGENTS target headings are byte-exact",
    run: () => {
      const exactHeading = "## Change-Ready SDLC Routing";
      const missingHeadingDiagnostic = "AGENTS.md missing exact heading ## Change-Ready SDLC Routing";
      const driftCases = [
        { label: "tab separator", heading: "##\tChange-Ready SDLC Routing" },
        { label: "repeated separator", heading: "##  Change-Ready SDLC Routing" },
        { label: "leading space", heading: " ## Change-Ready SDLC Routing" },
        { label: "trailing space", heading: "## Change-Ready SDLC Routing " },
        { label: "closing hash", heading: "## Change-Ready SDLC Routing #" },
      ] as const;

      for (const item of driftCases) {
        const drifted = CONFORMING_AGENTS_AUTHORITY.replace(exactHeading, item.heading);
        assert(drifted !== CONFORMING_AGENTS_AUTHORITY, `${item.label} fixture must replace the exact routing target.`);
        assertEqual(
          agentsAuthorityProblem(drifted),
          missingHeadingDiagnostic,
          `${item.label} must fail at the byte-exact routing-heading oracle rather than a downstream marker check.`,
        );
      }
    },
  },
  {
    name: "contracts: copied AGENTS requires exactly one unfenced byte-exact mandatory H2",
    run: () => {
      for (const title of MANDATORY_AGENTS_H2_TITLES) {
        const exactHeading = `## ${title}`;
        assertEqual(
          CONFORMING_AGENTS_AUTHORITY.split(/\r?\n/).filter((line) => line === exactHeading).length,
          1,
          `The conforming copied-authority fixture must begin with exactly one ${exactHeading}.`,
        );
        const privateDuplicateBody = `private contradictory duplicate body for ${title}`;
        const duplicated = `${CONFORMING_AGENTS_AUTHORITY}\n${exactHeading}\n\n${privateDuplicateBody}\n`;
        assertEqual(
          agentsAuthorityProblem(duplicated),
          `AGENTS.md duplicate exact heading ${exactHeading}`,
          `${exactHeading} must reject a second unfenced exact target before the already-conforming first body can certify authority.`,
        );
      }
    },
  },
  {
    name: "contracts: fenced and non-exact mandatory H2 copies do not change exact cardinality",
    run: () => {
      for (const title of MANDATORY_AGENTS_H2_TITLES) {
        const exactHeading = `## ${title}`;
        const fencedCopies = `${exactHeading}\nclosed private example\n${exactHeading}\nsecond closed private example\n`;
        const withSupportedFencedCopies = `${CONFORMING_AGENTS_AUTHORITY}\n${fencedBlock("```", fencedCopies)}${fencedBlock("~~~~", fencedCopies, "  ", false)}`;
        assertEqual(
          agentsAuthorityProblem(withSupportedFencedCopies),
          null,
          `Closed and unclosed supported fences containing repeated ${exactHeading} examples must not count against the one outside target.`,
        );
      }

      const withRepresentativeNonExactCopies = `${CONFORMING_AGENTS_AUTHORITY}\n##\tUniversal Task Briefing Contract\nnon-exact tab copy\n## Shared Reviewer Runtime Invariants #\nnon-exact closing-hash copy\n`;
      assertEqual(
        agentsAuthorityProblem(withRepresentativeNonExactCopies),
        null,
        "Representative tab-separated and closing-hash lookalikes must remain outside byte-exact mandatory-target cardinality.",
      );
    },
  },
  {
    name: "contracts: copied AGENTS markers remain owned by their exact H2 sections",
    run: () => {
      const exactRoutingSection = `## Change-Ready SDLC Routing\n\n${CONFORMING_AGENTS_ROUTING_BODY}`;
      assert(CONFORMING_AGENTS_AUTHORITY.includes(exactRoutingSection), "Copied authority fixture must expose the exact routing section for ownership mutations.");
      for (const boundary of ["# Other", " # Other", "  ## Other", "##\tOther"] as const) {
        const misowned = CONFORMING_AGENTS_AUTHORITY.replace(
          exactRoutingSection,
          `## Change-Ready SDLC Routing\n${boundary}\n${CONFORMING_AGENTS_ROUTING_BODY}`,
        );
        assertEqual(
          agentsAuthorityProblem(misowned),
          "AGENTS.md Change-Ready SDLC Routing section is empty",
          `${JSON.stringify(boundary)} must end routing ownership before the original markers.`,
        );
      }

      const autonomousBody = "The primary orchestrator owns lifecycle state and bounded validation.";
      const exactAutonomousSection = `## Autonomous Work Contract\n\n${autonomousBody}`;
      assert(CONFORMING_AGENTS_AUTHORITY.includes(exactAutonomousSection), "Copied authority fixture must expose the exact autonomous section for ownership mutation.");
      const misownedAutonomous = CONFORMING_AGENTS_AUTHORITY.replace(
        exactAutonomousSection,
        `## Autonomous Work Contract\n ## Other\n${autonomousBody}`,
      );
      assertEqual(
        agentsAuthorityProblem(misownedAutonomous),
        "AGENTS.md Autonomous Work Contract section is empty",
        "The shared H1/H2 boundary must also protect the Autonomous Work Contract caller.",
      );

      const h3AndIndentedCodeControl = CONFORMING_AGENTS_AUTHORITY.replace(
        exactRoutingSection,
        `## Change-Ready SDLC Routing\n### Routing detail\n    ## Indented example\n${CONFORMING_AGENTS_ROUTING_BODY}`,
      );
      assertEqual(
        agentsAuthorityProblem(h3AndIndentedCodeControl),
        null,
        "H3 and four-space indented heading-like lines must not end exact H2 ownership.",
      );
    },
  },
  {
    name: "contracts: active authority ignores closed and unclosed fenced heading skeletons and body tokens",
    run: () => {
      const fences = [
        { label: "zero-space backtick", block: (body: string) => fencedBlock("```", body) },
        { label: "three-space tilde", block: (body: string) => fencedBlock("~~~~", body, "   ") },
        { label: "one-space unclosed backtick", block: (body: string) => fencedBlock("```", body, " ", false) },
      ];
      for (const fence of fences) {
        assertEqual(agentsAuthorityProblem(`# Example\n\n${fence.block(CONFORMING_AGENTS_AUTHORITY)}`), "AGENTS.md missing exact heading ## Change-Ready SDLC Routing", `${fence.label} fenced AGENTS headings must not satisfy authority.`);
        assertEqual(skillAuthorityProblem(`${SKILL_FRONTMATTER}${fence.block(CONFORMING_SKILL_BODY)}`), "skills/change-ready-sdlc/SKILL.md missing ordered heading: Change-Ready title", `${fence.label} fenced SKILL headings must not satisfy authority.`);
        assertEqual(agentsAuthorityProblem(`${CONFORMING_AGENTS_AUTHORITY}\n${fence.block(CONFORMING_AGENTS_AUTHORITY)}`), null, `${fence.label} fenced examples must not corrupt valid outside AGENTS authority.`);
        assertEqual(skillAuthorityProblem(`${CONFORMING_SKILL_AUTHORITY}\n${fence.block(CONFORMING_SKILL_BODY)}`), null, `${fence.label} fenced examples must not duplicate valid outside SKILL headings.`);

        const floorMarker = "bounded outcome and non-goals";
        const agentsWithoutOperativeFloor = CONFORMING_AGENTS_AUTHORITY.replace(floorMarker, "[removed-pilot-floor-marker]");
        assertEqual(
          agentsAuthorityProblem(`${agentsWithoutOperativeFloor}\n${fence.block(floorMarker)}`),
          "AGENTS.md missing Pilot safety-floor bounded outcome and non-goals marker",
          `${fence.label} fenced-only Pilot floor marker must not satisfy AGENTS authority.`,
        );

        for (const item of SKILL_OPERATIVE_AUTHORITY_CASES) {
          const withoutOperativeMarker = CONFORMING_SKILL_AUTHORITY.replaceAll(item.marker, `[removed-${item.marker.replace(/[^a-z0-9]+/gi, "-")}]`);
          assert(withoutOperativeMarker !== CONFORMING_SKILL_AUTHORITY, `Conforming SKILL fixture must contain operative marker: ${item.marker}`);
          assert(!withoutOperativeMarker.includes(item.marker), `Negative SKILL fixture must remove every operative occurrence: ${item.marker}`);
          assertEqual(
            skillAuthorityProblem(`${withoutOperativeMarker}\n${fence.block(item.marker)}`),
            item.diagnostic,
            `${fence.label} fenced-only SKILL marker must not satisfy operative authority: ${item.marker}`,
          );
        }
      }
      for (const [marker, diagnostic] of [
        ["bounded outcome and non-goals", "AGENTS.md missing Pilot safety-floor bounded outcome and non-goals marker"],
        ["real-boundary happy-path proof", "AGENTS.md missing Pilot safety-floor real-boundary happy-path proof marker"],
        ["focused project-native validation", "AGENTS.md missing Pilot safety-floor focused project-native validation marker"],
        ["critical safety/data/authorization", "AGENTS.md missing Pilot safety-floor critical safety/data/authorization marker"],
        ["failure visibility", "AGENTS.md missing Pilot safety-floor failure visibility marker"],
        ["disable/rollback/containment", "AGENTS.md missing Pilot safety-floor disable/rollback/containment marker"],
      ] as const) {
        const withoutMarker = CONFORMING_AGENTS_AUTHORITY.replace(marker, "[removed-pilot-floor-item]");
        assert(withoutMarker !== CONFORMING_AGENTS_AUTHORITY, `Conforming AGENTS fixture must contain Pilot floor marker: ${marker}`);
        assertEqual(agentsAuthorityProblem(withoutMarker), diagnostic, `Active authority must reject missing Pilot floor marker: ${marker}`);
      }
      for (const delimiter of ["```", "~~~~"] as const) {
        const hiddenBody = fencedBlock(delimiter, CONFORMING_AGENTS_ROUTING_BODY);
        const agents = CONFORMING_AGENTS_AUTHORITY.replace(`${CONFORMING_AGENTS_ROUTING_BODY}\n`, hiddenBody);
        assertEqual(agentsAuthorityProblem(agents), "AGENTS.md Change-Ready SDLC Routing section is empty", `${delimiter} fenced routing body tokens must not satisfy the outside section.`);
      }
    },
  },
  {
    name: "contracts: unsupported container and inline fences fail closed across direct authority and operative text",
    run: () => {
      for (const prefixCase of UNSUPPORTED_AUTHORITY_FENCE_PREFIXES) {
        for (const delimiter of ["```", "~~~"] as const) {
          const privateLineSentinel = `private-${prefixCase.label.replace(/[^a-z]+/g, "-")}-${delimiter === "```" ? "backtick" : "tilde"}-content`;
          const unsupportedLine = `${prefixCase.prefix}${delimiter} ${privateLineSentinel}`;
          const agentsText = `# Unsupported fence fixture\n${unsupportedLine}\n${CONFORMING_AGENTS_AUTHORITY}`;
          const skillText = `${SKILL_FRONTMATTER}${unsupportedLine}\n${CONFORMING_SKILL_BODY}`;

          const agentsProblem = agentsAuthorityProblem(agentsText);
          assertEqual(
            agentsProblem,
            "AGENTS.md contains unsupported non-top-level fenced-code syntax at line 2",
            `${prefixCase.label} ${delimiter} syntax must block otherwise conforming AGENTS authority at its exact line.`,
          );
          assert(
            !String(agentsProblem).includes(privateLineSentinel),
            `${prefixCase.label} ${delimiter} AGENTS diagnostic must not expose source-line content.`,
          );

          const skillProblem = skillAuthorityProblem(skillText);
          assertEqual(
            skillProblem,
            "skills/change-ready-sdlc/SKILL.md contains unsupported non-top-level fenced-code syntax at line 5",
            `${prefixCase.label} ${delimiter} syntax must block otherwise conforming skill authority at its exact line.`,
          );
          assert(
            !String(skillProblem).includes(privateLineSentinel),
            `${prefixCase.label} ${delimiter} skill diagnostic must not expose source-line content.`,
          );

          assertEqual(
            operativeTextOutsideFences(agentsText),
            "",
            `${prefixCase.label} ${delimiter} syntax must remove the complete shared AGENTS operative surface even when required markers exist.`,
          );
          assertEqual(
            operativeTextOutsideFences(skillText),
            "",
            `${prefixCase.label} ${delimiter} syntax must remove the complete shared skill operative surface even when required markers exist.`,
          );
        }
      }
    },
  },
  {
    name: "contracts: operative scan inspects every delimiter run after an invalid top-level opener",
    run: () => {
      const privateLineSentinel = "private-later-delimiter-content";
      const unsupportedLine = `\`\`\` invalid opener prose > \`\`\` ${privateLineSentinel}`;
      const agentsText = `# Multi-run unsupported fixture\n${unsupportedLine}\n${CONFORMING_AGENTS_AUTHORITY}`;
      const skillText = `${SKILL_FRONTMATTER}${unsupportedLine}\n${CONFORMING_SKILL_BODY}`;

      const agentsScan = scanOperativeTextOutsideFences(agentsText);
      assertEqual(agentsScan.unsupportedFenceLine, 2, "AGENTS scan must inspect the later delimiter run after the invalid first opener.");
      assert(agentsScan.operativeText.includes(CONFORMING_AGENTS_ROUTING_BODY), "Structured AGENTS scan must preserve its independently reported operative surface.");
      assertEqual(operativeTextOutsideFences(agentsText), "", "Compatibility wrapper must fail closed for a later unsupported delimiter run.");

      const agentsProblem = agentsAuthorityProblem(agentsText);
      assertEqual(agentsProblem, "AGENTS.md contains unsupported non-top-level fenced-code syntax at line 2", "AGENTS authority must reject the exact multi-run line.");
      assert(!String(agentsProblem).includes(privateLineSentinel), "AGENTS multi-run diagnostic must not expose source-line content.");

      const skillScan = scanOperativeTextOutsideFences(skillText);
      assertEqual(skillScan.unsupportedFenceLine, 5, "Skill scan must inspect the later delimiter run after the invalid first opener.");
      assert(skillScan.operativeText.includes("# Change-Ready SDLC"), "Structured skill scan must preserve its independently reported operative surface.");
      assertEqual(operativeTextOutsideFences(skillText), "", "Skill compatibility wrapper must fail closed for a later unsupported delimiter run.");

      const skillProblem = skillAuthorityProblem(skillText);
      assertEqual(skillProblem, "skills/change-ready-sdlc/SKILL.md contains unsupported non-top-level fenced-code syntax at line 5", "Skill authority must reject the exact multi-run line.");
      assert(!String(skillProblem).includes(privateLineSentinel), "Skill multi-run diagnostic must not expose source-line content.");
    },
  },
  {
    name: "contracts: supported top-level fences and nested delimiter examples preserve active authority",
    run: () => {
      assertEqual(agentsAuthorityProblem(CONFORMING_AGENTS_AUTHORITY), null, "Complete copied AGENTS authority must remain a positive control.");
      assertEqual(skillAuthorityProblem(CONFORMING_SKILL_AUTHORITY), null, "Complete copied skill authority must remain a positive control.");
      assertEqual(
        agentsAuthorityProblem(fs.readFileSync(path.join(root, "global", "AGENTS.md"), "utf8")),
        null,
        "Current canonical global AGENTS authority must remain supported.",
      );
      assertEqual(
        skillAuthorityProblem(fs.readFileSync(path.join(root, "global", "skills", "change-ready-sdlc", "SKILL.md"), "utf8")),
        null,
        "Current canonical Change-Ready skill authority must remain supported.",
      );

      for (const control of SUPPORTED_AUTHORITY_FENCE_CASES) {
        const fencedAgentsExample = fencedBlock(control.delimiter, CONFORMING_AGENTS_AUTHORITY, control.indent, control.closed);
        const fencedSkillExample = fencedBlock(control.delimiter, CONFORMING_SKILL_BODY, control.indent, control.closed);
        const agentsText = `${CONFORMING_AGENTS_AUTHORITY}\n${fencedAgentsExample}`;
        const skillText = `${CONFORMING_SKILL_AUTHORITY}\n${fencedSkillExample}`;
        assertEqual(agentsAuthorityProblem(agentsText), null, `${control.label} example must not reject valid AGENTS authority.`);
        assertEqual(skillAuthorityProblem(skillText), null, `${control.label} example must not reject valid skill authority.`);
        assert(
          operativeTextOutsideFences(agentsText).includes("bounded outcome and non-goals"),
          `${control.label} must preserve valid AGENTS operative text outside the supported fence.`,
        );
        assert(
          operativeTextOutsideFences(skillText).includes("project-specific scope lock"),
          `${control.label} must preserve valid skill operative text outside the supported fence.`,
        );
      }

      const nestedSentinel = "private-nested-delimiter-content";
      const nestedDelimiterExample = fencedBlock(
        "```",
        `> \`\`\` ${nestedSentinel}\n> - ~~~~ ${nestedSentinel}\n`,
      );
      const agentsWithNestedExample = `${CONFORMING_AGENTS_AUTHORITY}\n${nestedDelimiterExample}`;
      const skillWithNestedExample = `${CONFORMING_SKILL_AUTHORITY}\n${nestedDelimiterExample}`;
      assertEqual(agentsAuthorityProblem(agentsWithNestedExample), null, "Container-prefixed delimiter runs inside a recognized AGENTS fence must remain masked.");
      assertEqual(skillAuthorityProblem(skillWithNestedExample), null, "Container-prefixed delimiter runs inside a recognized skill fence must remain masked.");
      assert(!operativeTextOutsideFences(agentsWithNestedExample).includes(nestedSentinel), "Nested delimiter content inside a supported AGENTS fence must remain non-operative.");
      assert(!operativeTextOutsideFences(skillWithNestedExample).includes(nestedSentinel), "Nested delimiter content inside a supported skill fence must remain non-operative.");
    },
  },
  {
    name: "contracts: one outside Contract Reference plus backtick or tilde fenced examples counts once",
    run: () => {
      for (const { label, example } of CONTRACT_REFERENCE_FENCES) {
        const fixture = newLibraryFixture(`contract-reference-${label}-example`);
        const reviewer = addRegisteredReviewerFixture(fixture, "code-quality-reviewer");
        writeText(reviewer, `${fs.readFileSync(reviewer, "utf8")}\n${example}`);
        assertSuccess(invokeValidator(fixture), `${label} fenced Contract Reference example must not change valid outside cardinality.`);
      }
    },
  },
  {
    name: "contracts: fenced-only Contract Reference examples count zero",
    run: () => {
      for (const { label, example } of CONTRACT_REFERENCE_FENCES) {
        const fixture = newLibraryFixture(`contract-reference-${label}-only`);
        const reviewer = addRegisteredReviewerFixture(fixture, "code-quality-reviewer");
        writeText(reviewer, `${withoutContractReference(fs.readFileSync(reviewer, "utf8"))}\n${example}`);
        const result = invokeValidator(fixture);
        assertFailure(result, `${label} fenced-only Contract Reference must fail zero-cardinality validation.`);
        assertOutputContains(result, "Reusable reviewer agent must contain exactly one ## Contract Reference heading", "Fenced-only reference must retain the cardinality diagnostic.");
      }
    },
  },
  {
    name: "contracts: fenced malformed references are ignored while malformed outside headings still fail",
    run: () => {
      const fixture = newLibraryFixture("contract-reference-fenced-malformed");
      const reviewer = addRegisteredReviewerFixture(fixture, "code-quality-reviewer");
      const withFencedExamples = `${fs.readFileSync(reviewer, "utf8")}\n${fencedBlock("```", "### Contract Reference\n## Contract Reference ##\n")}\n${fencedBlock("~~~~", "## Contract Reference\n## Contract Reference\n", "   ")}`;
      writeText(reviewer, withFencedExamples);
      assertSuccess(invokeValidator(fixture), "Malformed or duplicate fenced examples must not corrupt the one valid outside reference.");
      writeText(reviewer, `${withFencedExamples}\n### Contract Reference\n`);
      const result = invokeValidator(fixture);
      assertFailure(result, "A real malformed outside Contract Reference heading must still fail.");
      assertOutputContains(result, "Reusable reviewer agent must contain exactly one ## Contract Reference heading", "Outside malformed heading must retain the cardinality diagnostic.");
    },
  },
  {
    name: "contracts: installer help documents the config-dir pointing model",
    run: () => {
      const result = invokeInstaller(["--help"]);
      assertSuccess(result, "Help should exit successfully.");
      assertOutputContains(result, ENV_VAR, "Help should name OPENCODE_CONFIG_DIR.");
      assertOutputContains(result, "global/", "Help should reference the global/ target directory.");
      assertOutputContains(result, "setx", "Help should document the Windows setx mechanism.");
      for (const token of ["Windows: default mode runs", "macOS/Linux: default mode prints", "--persist-script <file>", "--print is preview-only"]) assertOutputContains(result, token, `Help must distinguish activation semantics: ${token}`);
      const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");
      for (const token of ["On Windows, persists", "On macOS/Linux, prints", "use `--persist-script`", "Do **not** run `setx` manually", "do not treat `--print` output as a safe recovery command"]) assert(readme.includes(token), `README must retain truthful activation guidance: ${token}`);
    },
  },
  {
    name: "contracts: installer print outputs the repo global path and platform commands",
    run: () => {
      const result = invokeInstaller(["--print"]);
      assertSuccess(result, "--print should exit successfully.");
      assertOutputContains(result, globalPath, "--print should output the resolved global/ path.");
      assertOutputContains(result, `setx ${ENV_VAR}`, "--print should show the Windows command.");
      assertOutputContains(result, `export ${ENV_VAR}`, "--print should show the posix command.");
    },
  },
  {
    name: "contracts: installer dry-run does not change the environment and previews the set",
    run: () => {
      const result = invokeInstaller(["--dry-run"], { [ENV_VAR]: undefined });
      assertSuccess(result, "Dry-run should exit successfully.");
      assertOutputContains(result, `would set: ${ENV_VAR}=${globalPath}`, "Dry-run should preview the value.");
      assertOutputContains(result, "No environment variable was changed.", "Dry-run must state no-write outcome.");
    },
  },
  {
    name: "contracts: installer check passes when env var points at repo global",
    run: () => {
      const result = invokeInstaller(["--check"], { [ENV_VAR]: globalPath });
      assertSuccess(result, "--check should pass when OPENCODE_CONFIG_DIR matches repo global/.");
      assertOutputContains(result, "configured:", "--check should report configured status.");
    },
  },
  {
    name: "contracts: installer check fails when env var is unset",
    run: () => {
      const result = invokeInstaller(["--check"], { [ENV_VAR]: undefined });
      assertFailure(result, "--check should fail when OPENCODE_CONFIG_DIR is unset.");
      assertOutputContains(result, "not set", "--check should report the unset state.");
    },
  },
  {
    name: "contracts: installer check fails on mismatched env var value",
    run: () => {
      const result = invokeInstaller(["--check"], { [ENV_VAR]: path.join(root, "some-other-dir") });
      assertFailure(result, "--check should fail when OPENCODE_CONFIG_DIR points elsewhere.");
      assertOutputContains(result, "mismatch:", "--check should report the mismatch.");
      assertOutputContains(result, globalPath, "--check should show the expected repo global/ path.");
    },
  },
  {
    name: "contracts: installer source keeps config-dir pointing model guards",
    run: () => {
      const installerText = fs.readFileSync(installer, "utf8") as string;
      assert(installerText.includes(ENV_VAR), "Installer must reference OPENCODE_CONFIG_DIR.");
      assert(installerText.includes('"global"'), "Installer must target the global/ directory.");
      assert(installerText.includes("setx"), "Installer must use setx on Windows.");
      assert(!installerText.includes("collectDrift"), "Installer must not retain legacy copy/drift logic.");
    },
  },
  {
    name: "contracts: installer measuredValueLength enforces the documented over-limit safety boundary",
    run: () => {
      assert(measuredValueLength("/short/path") === "/short/path".length + ENV_VAR.length + 1, "measuredValueLength must add ENV_VAR length and 1 separator.");
      assert(SETX_SAFE_LIMIT === 900, "SETX_SAFE_LIMIT must be 900 to keep headroom under the 1024-char setx limit.");
      const longPath = "D:\\" + "a".repeat(SETX_SAFE_LIMIT);
      assert(measuredValueLength(longPath) > SETX_SAFE_LIMIT, "A long path must exceed the safety limit.");
      const shortPath = "D:\\" + "a".repeat(SETX_SAFE_LIMIT - 50);
      assert(measuredValueLength(shortPath) <= SETX_SAFE_LIMIT, "A short path must be under the safety limit.");
    },
  },
  {
    name: "contracts: delivery binding arrays remain byte-equal to accepted safeguards",
    run: () => {
      assertDeepEqual(
        [...SESSION_DELIVERY_BINDING_REQUIRED_TEXT],
        EXPECTED_SESSION_DELIVERY_BINDING_REQUIRED_TEXT,
        "SESSION_DELIVERY_BINDING_REQUIRED_TEXT drifted.",
      );
      assertEqual(SESSION_DELIVERY_BINDING_CONTRACT.fileName, "session-delivery-reviewer.md", "Delivery binding filename drifted.");
      assertDeepEqual(
        SESSION_DELIVERY_BINDING_CONTRACT.requiredText,
        EXPECTED_SESSION_DELIVERY_BINDING_REQUIRED_TEXT,
        "Delivery binding contract requiredText drifted.",
      );
      assertDeepEqual(
        [...SESSION_DELIVERY_BINDING_HANDOFF_TOKENS],
        EXPECTED_SESSION_DELIVERY_BINDING_HANDOFF_TOKENS,
        "SESSION_DELIVERY_BINDING_HANDOFF_TOKENS drifted.",
      );
      assertDeepEqual(
        [...MATERIAL_DELIVERY_ROUTING_TOKENS],
        EXPECTED_MATERIAL_DELIVERY_ROUTING_TOKENS,
        "MATERIAL_DELIVERY_ROUTING_TOKENS drifted.",
      );
      assertDeepEqual([...MATERIAL_DELIVERY_ROUTING_SURFACES], EXPECTED_DELIVERY_SURFACES, "Material delivery surfaces drifted.");
      assertDeepEqual([...SESSION_DELIVERY_BINDING_SURFACES], EXPECTED_DELIVERY_SURFACES, "Binding handoff surfaces drifted.");
    },
  },
  {
    name: "contracts: all project-facing surfaces bind the complete negative delivery set and accepted Material prerequisite",
    run: () => {
      for (const relative of EXPECTED_DELIVERY_SURFACES) {
        const text = fs.readFileSync(path.join(root, relative), "utf8");
        assertTokens(text, MATERIAL_DELIVERY_ROUTING_TOKENS, `${relative} missing Material delivery prerequisite`);
        assertTokens(text, SESSION_DELIVERY_BINDING_HANDOFF_TOKENS, `${relative} missing binding negative-delivery oracle`);
      }

      const delivery = fs.readFileSync(path.join(root, "global", "agents", "session-delivery-reviewer.md"), "utf8");
      const consistency = sectionBetween(delivery, "- Output consistency:", "## Severity Guide");
      assertTokens(consistency, [
        "Material `Change-Ready: yes` requires an explicitly accepted conforming delivery result",
        "Accepted mapping: `on plan` or `minor deviations` only with `Change-Ready: yes` and `Blocking for Acceptance: no`",
        "Every `Change-Ready: no`",
        "`Verdict: material deviations`",
        "`Verdict: not enough evidence`",
        "`Blocking for Acceptance: yes`",
        "`Verdict: blocked`",
        "non-empty `Blocking Evidence`",
        "terminal for the current attempt",
        "Negative delivery verdict or `Change-Ready: no` must not coexist with `Blocking for Acceptance: no` and empty `Blocking Evidence`",
        "Delivery rejection never authorizes candidate mutation or gate replay",
      ], "Session-delivery output-consistency contract missing accepted/blocked result");
    },
  },
  {
    name: "contracts: Portable profile and optional evidence gaps cannot bypass Material delivery",
    run: () => {
      const skill = fs.readFileSync(path.join(root, "global", "skills", "change-ready-sdlc", "SKILL.md"), "utf8");
      const workflow = fs.readFileSync(path.join(root, "instructions", "universal-development-loop.md"), "utf8");
      const delivery = fs.readFileSync(path.join(root, "global", "agents", "session-delivery-reviewer.md"), "utf8");
      assertTokens(skill, [
        "Material work always supplies current task/evidence status to the discovered conforming delivery/readiness gate",
        "missing conforming capability blocks",
        "for Material work, an explicitly accepted conforming delivery result",
      ], "Canonical skill missing Material delivery contract");
      const compact = sectionBetween(skill, "## Compact orchestration output", "## Enforcement honesty");
      assertTokens(compact, [
        "`Candidate Reference`: project-native readable scoped candidate evidence, or none when not applicable",
        "`Delivery/readiness gate`: accepted, blocked, or `N/A - Ordinary Small <reason>`",
      ], "Compact orchestration output missing delivery status oracle");
      assertTokens(workflow, [
        "missing conforming capability blocks readiness and is never a skip due to unavailable inputs",
        "Diagnostic scale (trivial/bounded/material/complex) does not override the Portable Ordinary Small/Material profile",
      ], "Universal Development Loop missing Portable profile precedence");
      assertTokens(delivery, [
        "For Portable profile Material sessions, always run this delivery review regardless of diagnostic scale",
        "Record the optional-tool gap in `Evidence Reviewed` and `Residual Risks`",
        "Record missing required session evidence in `Blocking Evidence` when unavailable from all allowed sources",
        "Optional-tool absence alone is not blocking when substitute evidence is sufficient",
      ], "Session-delivery reviewer missing proportional optional-evidence handling");
    },
  },
  {
    name: "contracts: active rollback planning is proportional and separately authorized",
    run: () => {
      const skill = fs.readFileSync(path.join(root, "global", "skills", "change-ready-sdlc", "SKILL.md"), "utf8");
      const rollback = sectionBetween(skill, "### Rollback plan", "### Restart and continuity").replace(/\s+/g, " ");
      assertTokens(rollback, [
        "Rollback planning is proportional",
        "Detailed rollback evidence is required when migration, destructive state, deployment/activation, or substantial multi-surface risk makes it relevant",
        "Rollback is executed only when separately authorized and is never required to claim Change-Ready",
        "Preserve unrelated, pre-existing, or teammate work outside the candidate scope",
        "Runtime activation rollback",
        "does not count as full change rollback",
      ], "Active rollback contract missing proportional safety oracle");
    },
  },
  {
    name: "contracts: historical add-lightweight SDLC-008 retains rollback outcomes",
    run: () => {
      const changeRoot = path.join(root, "openspec", "changes", "add-lightweight-sdet-pr-ready-sdlc");
      const design = fs.readFileSync(path.join(changeRoot, "design.md"), "utf8");
      const spec = fs.readFileSync(path.join(changeRoot, "specs", "library-change-ready-sdlc", "spec.md"), "utf8");
      const tasks = fs.readFileSync(path.join(changeRoot, "tasks.md"), "utf8");
      const normalizedTasks = tasks.replace(/\s+/g, " ");
      const fullRollback = sectionBetween(design, "### 7.1 Full change rollback (repository candidate)", "### 7.2 Runtime activation rollback (operational only)").replace(/\s+/g, " ");
      const fullScenario = sectionBetween(spec, "#### Scenario: full change rollback restores the complete scoped candidate manifest", "#### Scenario: partial, interrupted, or third-state rollback is blocked").replace(/\s+/g, " ");
      const blockedScenario = sectionBetween(spec, "#### Scenario: partial, interrupted, or third-state rollback is blocked", "#### Scenario: runtime activation rollback does not restore the repository candidate").replace(/\s+/g, " ");

      assertTokens(fullRollback, [
        "expected 59 paths: 42 modified, 16 added, 1 deleted",
        "prior 58 plus pure active-authority policy owner `tools/validators/active-authority.ts`",
        "failure-atomic or explicitly journaled/recoverable mechanism that retains preimages",
        "Owner authorization may be additionally required but never substitutes for failure atomicity or journaling",
        "stop before unprotected target mutation when possible",
        "hand off the validated isolated restored package",
        "do not promise original workspace preservation after unprotected partial target mutation",
      ], "Design full rollback contract missing corrected integration semantics");
      assertTokens(fullScenario, [
        "every modified manifest path SHALL be restored to baseline content",
        "every added manifest path SHALL be removed",
        "every deleted manifest path SHALL be restored when a baseline copy exists",
        "failure-atomic or explicitly journaled/recoverable",
        "retains preimages",
        "owner authorization MAY be additionally required but SHALL never substitute for failure atomicity or journaling",
        "baseline-compatible repository validation SHALL run only after complete restoration",
      ], "SDLC-008 full rollback scenario missing success oracle");
      assertTokens(blockedScenario, [
        "no safe isolated failure-atomic or journaled integration capability",
        "rollback incomplete/blocked",
        "stop before unprotected target mutation when possible",
        "hand off the validated isolated restored package",
        "SHALL NOT promise original workspace preservation after unprotected partial target mutation",
        "SHALL NOT run baseline validation against a mixed state",
        "SHALL NOT claim rollback complete",
      ], "SDLC-008 blocked rollback scenario missing safe-failure oracle");
      assertTokens(normalizedTasks, [
        "expected final manifest size is **59**",
        "templates/project/adapter.json",
        "tools/install-opencode-global.ts",
        "tools/validators/opencode-config.ts",
        "tools/validators/active-authority.ts",
        "specs/library-tools-architecture/spec.md",
        "owner authorization is additional, never a substitute for atomicity",
        "without promising original workspace preservation after unprotected partial mutation",
      ], "OpenSpec tasks missing corrected rollback acceptance trace");
    },
  },
  {
    name: "contracts: historical activation rollback remains operational-only and active delivery stays proportional",
    run: () => {
      const changeRoot = path.join(root, "openspec", "changes", "add-lightweight-sdet-pr-ready-sdlc");
      const design = fs.readFileSync(path.join(changeRoot, "design.md"), "utf8");
      const spec = fs.readFileSync(path.join(changeRoot, "specs", "library-change-ready-sdlc", "spec.md"), "utf8");
      const delivery = fs.readFileSync(path.join(root, "global", "agents", "session-delivery-reviewer.md"), "utf8");
      const activation = sectionBetween(design, "### 7.2 Runtime activation rollback (operational only)", "### 7.3 Handoff package").replace(/\s+/g, " ");
      const activationScenario = sectionBetween(spec, "#### Scenario: runtime activation rollback does not restore the repository candidate", "### Requirement: SDLC-009 Global instruction topology prevents process drift").replace(/\s+/g, " ");

      assertTokens(activation, [
        "prior active `OPENCODE_CONFIG_DIR` / active global config directory pointer",
        "without mutating the repository candidate",
        "SHALL NOT count as rollback of the repository change or of non-runtime support artifacts",
        "full change rollback remains a separate reviewed action",
      ], "Design activation rollback contract missing operational-only oracle");
      assertTokens(activationScenario, [
        "restores the prior active config pointer and restarts or reloads OpenCode without mutating repository paths",
        "repository candidate and non-runtime support artifacts SHALL remain unchanged",
        "SHALL NOT be treated as full change rollback of the repository candidate",
      ], "SDLC-008 activation scenario missing repository-preservation oracle");
      assertTokens(delivery, [
        "Rollback plan: proportional",
        "When migration, destructive state, deployment/activation, or substantial multi-surface risk makes detailed rollback relevant",
        "Runtime activation rollback",
        "must not be treated as full change rollback",
        "Actual rollback execution remains separately authorized and is never required to claim Change-Ready",
      ], "Session delivery rollback review contract missing proportional safety oracle");
    },
  },
  {
    name: "contracts: historical identity design and active templates keep runtime authority global",
    run: () => {
      const changeRoot = path.join(root, "openspec", "changes", "add-lightweight-sdet-pr-ready-sdlc");
      const proposal = fs.readFileSync(path.join(changeRoot, "proposal.md"), "utf8").replace(/\s+/g, " ");
      assertTokens(proposal, [
        "status-marker normalization is adapter-owned, explicit, and absent by default",
        "no portable default status filename or marker syntax",
        "OpenSpec recipe may use pre-existing `tasks.md` checkbox markers as a project-local instance only, not a portable requirement",
        "Candidate identity generation is adapter-owned",
        "templates/project/adapter.json",
        "tools/install-opencode-global.ts",
        "specs/library-tools-architecture/spec.md",
      ], "Proposal portable identity rule drifted");
      for (const stale of ["portable status artifact is `tasks.md`", "universal `tasks.md` status file", "all projects use `tasks.md`"]) {
        assert(!proposal.includes(stale), `Proposal must not prescribe a universal tasks.md contract: ${stale}`);
      }

      for (const [relative, required] of [
        ["instructions/reusable-project-agent-instructions.md", "Do not depend on a target-relative kit path such as `instructions/universal-development-loop.md` for runtime authority"],
        ["templates/project/AGENTS.md", "do not depend on a target-relative kit path for runtime authority"],
      ] as const) {
        const text = fs.readFileSync(path.join(root, relative), "utf8");
        assert(text.includes("active global") && text.includes("`AGENTS.md`") && text.includes("`change-ready-sdlc`"), `${relative} must depend on active global runtime authority.`);
        assert(text.includes(required), `${relative} must reject a target-relative UDL runtime dependency.`);
        assert(!text.includes("Follow `instructions/universal-development-loop.md`"), `${relative} must not direct target projects to load a relative UDL.`);
      }

      const adapter = JSON.parse(fs.readFileSync(path.join(root, "templates", "project", "adapter.json"), "utf8")) as { quality?: Record<string, unknown> };
      assert(adapter.quality?.focusedValidationFirst === true, "Template adapter must retain focusedValidationFirst=true.");
      assert(adapter.quality?.broadValidationBeforeHandoff === true, "Template adapter must retain broadValidationBeforeHandoff=true.");
      assert(!Object.prototype.hasOwnProperty.call(adapter.quality ?? {}, "testFirstDefault"), "Template adapter must not retain obsolete testFirstDefault workflow policy.");

      const tasks = fs.readFileSync(path.join(changeRoot, "tasks.md"), "utf8").replace(/\s+/g, " ");
      for (const trace of ["Module split contract (library-tools-architecture)", "Test runner contract (library-tools-architecture)", "Contract source-of-truth (library-tools-architecture)"]) {
        assert(tasks.includes(trace), `Requirement Trace missing library-tools row: ${trace}`);
      }
    },
  },
  {
    name: "contracts: active lifecycle captures Candidate Reference before proof and Fresh SDET",
    run: () => {
      const skill = fs.readFileSync(path.join(root, "global", "skills", "change-ready-sdlc", "SKILL.md"), "utf8");
      const ordered = [
        "### 3. Candidate Reference",
        "### 4. Applicable Proof",
        "### 5. Fresh SDET",
      ].map((token) => ({ token, index: skill.indexOf(token) }));
      for (const item of ordered) assert(item.index >= 0, `Canonical lifecycle missing section: ${item.token}`);
      for (let index = 1; index < ordered.length; index++) {
        assert(ordered[index - 1].index < ordered[index].index, `Canonical lifecycle section order drifted at ${ordered[index].token}.`);
      }
      const candidateReference = sectionBetween(skill, "### 3. Candidate Reference", "### 4. Applicable Proof");
      assertTokens(candidateReference, [
        "closes every concurrent mutation-capable production writer under **Universal writer attempt closure** when concurrent writers ran",
        "integrates production outputs",
        "captures a project-native **Candidate Reference**",
        "Dual `Semantic Candidate Identity` / `Package Identity` / `Identity Recipe` are not portable requirements",
        "After test edits, recapture Candidate Reference before post-test proof and complete validation",
      ], "Pre-SDET Candidate Reference contract drifted");
      const proof = sectionBetween(skill, "### 4. Applicable Proof", "### 5. Fresh SDET");
      assertTokens(proof, [
        "After Candidate Reference capture and before Fresh SDET dispatch",
        "observable happy-path proof at the relevant boundary",
        "inspection, compilation alone, or mocked-helper-only claims are insufficient",
      ], "Applicable Proof must bind to readable candidate evidence before SDET.");
    },
  },
  {
    name: "contracts: historical add-lightweight task ownership separates production and SDET",
    run: () => {
      const tasks = fs.readFileSync(path.join(root, "openspec", "changes", "add-lightweight-sdet-pr-ready-sdlc", "tasks.md"), "utf8");
      const task51 = taskSectionBetween(tasks, "5.1 Start", "5.2 Freeze/current Applicable Proof").replace(/\s+/g, " ");
      assertTokens(task51, [
        "Production doctor and installer behavior remain production-author-owned",
        "Fresh SDET owns only test/oracle artifacts",
        "doctor/installer regression and oracle updates",
        "`tools/test-library/doctor.ts`",
        "`tools/test-install-opencode-global.ts`",
      ], "Task 5.1 ownership boundary drifted");
    },
  },
  {
    name: "contracts: historical add-lightweight task 7.3 owns final review",
    run: () => {
      const tasks = fs.readFileSync(path.join(root, "openspec", "changes", "add-lightweight-sdet-pr-ready-sdlc", "tasks.md"), "utf8");
      const task67 = sectionBetween(tasks, "6.7 Run a fresh production-correction continuation eval.", "## 7. Final Review And Handoff").replace(/\s+/g, " ");
      assert(task67.includes("Current-candidate final review remains solely task 7.3 and is not part of this eval pass condition."), "Task 6.7 must explicitly exclude current-candidate final review from its pass condition.");
      assert(!/fresh[- ]final review/i.test(task67), "Task 6.7 must not retain a stale fresh-final-review clause.");
      assert(!task67.includes("final-candidate-reviewer"), "Task 6.7 must not dispatch the final-candidate reviewer.");
      const task73 = sectionBetween(tasks, "7.3 Run `final-candidate-reviewer`", "7.4 Run `session-delivery-reviewer`").replace(/\s+/g, " ");
      assert(task73.includes("current post-validation candidate"), "Task 7.3 must own final review of the current post-validation candidate.");
    },
  },
  {
    name: "contracts: historical tools-architecture keeps library helper as canonical facade",
    run: () => {
      const delta = fs.readFileSync(path.join(root, "openspec", "changes", "add-lightweight-sdet-pr-ready-sdlc", "specs", "library-tools-architecture", "spec.md"), "utf8");
      assertTokens(delta, [
        "tools/test-helpers/library.ts",
        "canonical shared test-helper facade",
        "tools/test-helpers/{temp,process}.ts",
        "retained internal/available migration helper modules only",
        "not the canonical direct import surface for current suites",
        "new shared-helper consumption SHOULD go through `library.ts`",
        "Existing legacy aggregate entrypoints",
        "MAY remain during migration",
        "Non-executable extracted modules",
        "SHALL reuse the shared `TestCase` type and assertions",
        "SHALL NOT duplicate local test harness types or assertion implementations",
        "no new standalone hand-rolled runner SHALL be introduced",
      ], "Library-tools delta missing accepted legacy-module architecture");

      for (const helper of ["library.ts", "temp.ts", "process.ts"]) {
        assert(fs.existsSync(path.join(root, "tools", "test-helpers", helper)), `Canonical test helper missing: ${helper}`);
      }
      assert(!fs.existsSync(path.join(root, "tools", "test-helpers", "fixture-builder.ts")), "Deleted fixture-builder helper must not return.");
      const shared = fs.readFileSync(path.join(root, "tools", "test-helpers", "library.ts"), "utf8");
      for (const exported of ["export type TestCase", "export function assert(", "export function assertEqual", "export function assertDeepEqual", "export function sectionBetween", "export function taskSectionBetween", "export const libraryRoot"]) {
        assert(shared.includes(exported), `Canonical library helper missing export: ${exported}`);
      }

      const currentSuiteFiles = typeScriptFiles(path.join(root, "tools")).filter((file) => {
        const relative = path.relative(path.join(root, "tools"), file).replace(/\\/g, "/");
        return relative.startsWith("test-") || relative.includes("/test-");
      });
      const internalImport = /from\s+["'][^"']*test-helpers\/(?:temp|process)\.ts["']/;
      for (const file of currentSuiteFiles) {
        const source = fs.readFileSync(file, "utf8");
        assert(!internalImport.test(source), `${path.relative(root, file)} must consume shared helpers through library.ts, not migration internals.`);
      }
      assert(currentSuiteFiles.some((file) => fs.readFileSync(file, "utf8").includes("test-helpers/library.ts")), "Current suites must have direct canonical library.ts consumers.");

      for (const relative of [
        "tools/test-contracts-change-ready.ts",
        "tools/test-contracts-change-ready-identity.ts",
        "tools/test-contracts-change-ready-delivery.ts",
      ]) {
        const source = fs.readFileSync(path.join(root, relative), "utf8");
        const helperImport = source.match(/import\s*\{([^}]*)\}\s*from\s*"\.\/test-helpers\/library\.ts";/)?.[1] ?? "";
        for (const symbol of ["TestCase", "assert", "assertEqual", "assertDeepEqual", "libraryRoot", "sectionBetween"]) {
          assert(helperImport.includes(symbol), `${relative} must import shared ${symbol}.`);
        }
        assert(!/^\s*import\b[^;]*from\s*"node:url"/m.test(source), `${relative} must use shared libraryRoot instead of a local URL-derived root.`);
        for (const forbidden of [/^\s*type\s+TestCase\s*=/m, /^\s*function\s+assert\s*\(/m, /^\s*function\s+assertEqual\s*\(/m, /^\s*function\s+assertDeepEqual\s*\(/m, /^\s*function\s+sectionBetween\s*\(/m]) {
          assert(!forbidden.test(source), `${relative} contains a duplicated local test harness declaration: ${forbidden}`);
        }
        assert(!source.startsWith("#!") && !/^\s*import\b[^;]*from\s*"node:test"/m.test(source) && !/^\s*let\s+failed\s*=/m.test(source), `${relative} must remain a non-executable extracted module without a standalone runner.`);
        assert(/export const \w+Tests: TestCase\[\]/.test(source), `${relative} must export tests for the existing legacy aggregate.`);
      }
    },
  },
];
