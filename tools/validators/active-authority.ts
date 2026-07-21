import * as yaml from "js-yaml";
import {
  GLOBAL_AGENTS_DECISION_READY_HANDOFF_FIELDS,
  GLOBAL_AGENTS_NON_WAIVABLE_RISK_CLAUSE,
  GLOBAL_AGENTS_PROTECTED_BOUNDARY_CATEGORIES,
} from "../contracts/skills.ts";

/**
 * Supported top-level fenced-code line mask (backtick or tilde only).
 * Pure and deterministic: no filesystem, process, environment, or logging side effects.
 *
 * Supported subset (not full CommonMark containers):
 * - Open: exactly 0-3 leading ASCII spaces, then a run of 3+ identical `` ` `` or `~`
 *   markers (for backtick fences the info string must not contain `` ` ``).
 * - Close: exactly 0-3 leading ASCII spaces, same marker character, run length at least
 *   the opener, trailing horizontal whitespace only.
 * - Fence delimiter lines and content between them are marked true. An unclosed fence
 *   remains open through EOF.
 *
 * Non-top-level fence syntax (blockquote/list/nested-container prefixes, 4+ leading
 * spaces, prose/inline prefixes before a 3+ fence run) is intentionally unsupported.
 * Callers that need fail-closed operative text must use `operativeTextOutsideFences`
 * or the AGENTS/skill authority entry points, which reject that syntax.
 *
 * @returns boolean array parallel to `lines`; true means the line is inside a supported
 *   top-level fence (including the opening and closing fence delimiter lines).
 */
export function fencedCodeLineMask(lines: readonly string[]): boolean[] {
  const mask = new Array<boolean>(lines.length);
  let openMarker: "`" | "~" | null = null;
  let openLength = 0;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]!;
    if (openMarker == null) {
      const open = tryOpenFence(line);
      if (open != null) {
        openMarker = open.marker;
        openLength = open.length;
        mask[i] = true;
      } else {
        mask[i] = false;
      }
      continue;
    }
    mask[i] = true;
    if (isCloseFence(line, openMarker, openLength)) {
      openMarker = null;
      openLength = 0;
    }
  }
  return mask;
}

/**
 * Structured operative scan: distinguishes legitimate empty operative text from
 * unsupported non-top-level fence syntax. Pure and deterministic.
 *
 * - `operativeText`: lines outside supported top-level fences (empty string is valid
 *   when the whole document is fenced or blank).
 * - `unsupportedFenceLine`: 1-based line of the first unmasked line that contains any
 *   3+ backtick/tilde run whose prefix is not exactly 0-3 ASCII spaces; null when none.
 *   Every delimiter run on each unmasked line is inspected. Runs inside supported
 *   top-level fences are ignored.
 */
export type OperativeTextScan = {
  operativeText: string;
  unsupportedFenceLine: number | null;
};

/**
 * First 1-based line number of an unsupported non-top-level fence delimiter run, or null.
 * Inspects every 3+ backtick/tilde run on each unmasked line.
 */
function unsupportedNonTopLevelFenceLine(
  lines: readonly string[],
  fenced: readonly boolean[],
): number | null {
  for (let i = 0; i < lines.length; i += 1) {
    if (fenced[i]) {
      continue;
    }
    const line = lines[i]!;
    const runPattern = /(`{3,}|~{3,})/g;
    let run: RegExpExecArray | null;
    while ((run = runPattern.exec(line)) != null) {
      const prefix = line.slice(0, run.index);
      if (!/^ {0,3}$/.test(prefix)) {
        return i + 1;
      }
    }
  }
  return null;
}

/**
 * One shared deterministic scan for operative authority text and unsupported fence syntax.
 * Prefer this over the string wrapper when callers must distinguish ok vs unsupported.
 */
export function scanOperativeTextOutsideFences(text: string): OperativeTextScan {
  const lines = text.split(/\r?\n/);
  const fenced = fencedCodeLineMask(lines);
  const unsupportedFenceLine = unsupportedNonTopLevelFenceLine(lines, fenced);
  const operative: string[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    if (!fenced[i]) {
      operative.push(lines[i]!);
    }
  }
  return {
    operativeText: operative.join("\n"),
    unsupportedFenceLine,
  };
}

/**
 * Compatibility wrapper over `scanOperativeTextOutsideFences`.
 * Returns operative text when syntax is supported; returns "" when unsupported
 * (fail-closed for callers that only need a string surface). Prefer the structured
 * scan when positive/negative/count logic must not treat unsupported as empty success.
 */
export function operativeTextOutsideFences(text: string): string {
  const scan = scanOperativeTextOutsideFences(text);
  if (scan.unsupportedFenceLine != null) {
    return "";
  }
  return scan.operativeText;
}

/**
 * Model-facing Markdown body scan for role agent files (`global/agents/*.md`).
 * Pure and deterministic: no filesystem, process, environment, or logging side effects.
 *
 * - Optional leading YAML frontmatter (`---` … `---`) is recognized and removed when
 *   present; `rawBody` retains the post-frontmatter body (fences kept) for exact
 *   report-schema parsing.
 * - Supported top-level fences use `fencedCodeLineMask` / `scanOperativeTextOutsideFences`.
 * - CommonMark indented code lines (tab or ≥4 ASCII spaces) are non-operative.
 * - `unsupportedFenceLine` is the original file's 1-based line (frontmatter offset applied).
 *
 * Does not change general authority semantics of `scanOperativeTextOutsideFences`
 * (fence-only; no frontmatter strip; no indented-code exclusion).
 */
export type ModelFacingMarkdownScan = {
  /** True when a leading YAML frontmatter block was recognized and removed. */
  hasFrontmatter: boolean;
  /** Body after frontmatter removal (fences retained). Full text when no frontmatter. */
  rawBody: string;
  /**
   * Operative model-facing text: outside supported fences and indented code.
   * Empty string when unsupported fence syntax is present (fail-closed).
   */
  operativeBody: string;
  /**
   * Original-file 1-based line of the first unsupported non-top-level fence run,
   * or null when syntax is supported.
   */
  unsupportedFenceLine: number | null;
};

/**
 * Leading indentation column count under CommonMark four-column tab stops.
 * ASCII space adds one column; tab advances to the next multiple of four.
 * Stops at the first non-space/non-tab character.
 */
function leadingIndentationColumns(line: string): number {
  let columns = 0;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]!;
    if (ch === " ") {
      columns += 1;
      continue;
    }
    if (ch === "\t") {
      columns = (Math.floor(columns / 4) + 1) * 4;
      continue;
    }
    break;
  }
  return columns;
}

/**
 * True when leading indentation reaches at least four columns (CommonMark
 * indented code). Covers `\t`, four spaces, and mixed prefixes such as
 * ` \t`, `  \t`, and `   \t`. One-to-three spaces alone are not indented code.
 */
function isIndentedCodeLine(line: string): boolean {
  return leadingIndentationColumns(line) >= 4;
}

/**
 * Supported ATX H1/H2 ownership-boundary line (not a full heading parser).
 * Pure and deterministic.
 *
 * Recognizes:
 * - optional 0-3 leading ASCII spaces (four spaces is indented code, not a heading);
 * - exactly one or two `#` characters (H1/H2 only; H3–H6 do not match);
 * - then at least one ASCII space or tab, or end of line (empty heading form).
 *
 * Does not relax byte-exact target heading equality checks used by schema extractors.
 */
export function isAtxH1OrH2BoundaryLine(line: string): boolean {
  return /^ {0,3}#{1,2}(?:[ \t]+|$)/.test(line);
}

/**
 * Strip an exact leading YAML frontmatter block when present.
 * Returns null when the leading block is absent.
 */
function stripLeadingYamlFrontmatter(
  text: string,
): { body: string; lineOffset: number } | null {
  const match = /^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/.exec(text);
  if (match == null) {
    return null;
  }
  const prefix = match[0];
  return {
    body: text.slice(prefix.length),
    lineOffset: (prefix.match(/\r?\n/g) ?? []).length,
  };
}

/**
 * Shared deterministic model-facing body boundary for role agent Markdown.
 * Prefer this over ad-hoc frontmatter/fence/indent scanners in agents and routing.
 */
export function scanModelFacingMarkdownBody(text: string): ModelFacingMarkdownScan {
  const stripped = stripLeadingYamlFrontmatter(text);
  const hasFrontmatter = stripped != null;
  const rawBody = stripped != null ? stripped.body : text;
  const lineOffset = stripped != null ? stripped.lineOffset : 0;

  const scan = scanOperativeTextOutsideFences(rawBody);
  if (scan.unsupportedFenceLine != null) {
    return {
      hasFrontmatter,
      rawBody,
      operativeBody: "",
      unsupportedFenceLine: scan.unsupportedFenceLine + lineOffset,
    };
  }

  const lines = rawBody.split(/\r?\n/);
  const fenced = fencedCodeLineMask(lines);
  const operative: string[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    if (fenced[i]) {
      continue;
    }
    const line = lines[i]!;
    if (isIndentedCodeLine(line)) {
      continue;
    }
    operative.push(line);
  }

  return {
    hasFrontmatter,
    rawBody,
    operativeBody: operative.join("\n"),
    unsupportedFenceLine: null,
  };
}

function tryOpenFence(line: string): { marker: "`" | "~"; length: number } | null {
  const match = /^( {0,3})(`{3,}|~{3,})(.*)$/.exec(line);
  if (match == null) {
    return null;
  }
  const run = match[2]!;
  const marker = run[0] as "`" | "~";
  // CommonMark: backtick fence info string cannot contain backticks.
  if (marker === "`" && match[3]!.includes("`")) {
    return null;
  }
  return { marker, length: run.length };
}

function isCloseFence(line: string, marker: "`" | "~", minLength: number): boolean {
  const match =
    marker === "`"
      ? /^( {0,3})(`{3,})[ \t]*$/.exec(line)
      : /^( {0,3})(~{3,})[ \t]*$/.exec(line);
  return match != null && match[2]!.length >= minLength;
}

/**
 * Count of byte-exact unfenced ATX H2 target lines (`## ${title}`).
 * Ignores lines inside supported fenced code blocks. Whitespace/tab/closing-hash
 * variants do not match.
 */
function countExactH2(text: string, title: string): number {
  const exact = `## ${title}`;
  const lines = text.split(/\r?\n/);
  const fenced = fencedCodeLineMask(lines);
  let count = 0;
  for (let i = 0; i < lines.length; i += 1) {
    if (!fenced[i] && lines[i] === exact) {
      count += 1;
    }
  }
  return count;
}

/**
 * Require exactly one byte-exact unfenced `## ${title}` before section-body trust.
 * Zero → existing missing-heading diagnostic; more than one → section-specific
 * duplicate diagnostic. Null means cardinality is exact one.
 */
function exactMandatoryH2CardinalityProblem(
  text: string,
  title: string,
): string | null {
  const count = countExactH2(text, title);
  if (count === 0) {
    return `AGENTS.md missing exact heading ## ${title}`;
  }
  if (count > 1) {
    return `AGENTS.md duplicate exact heading ## ${title}`;
  }
  return null;
}

/**
 * Body of the first byte-exact level-2 section outside fenced code blocks, or null
 * when the heading is missing. Target is only `## ${title}`. Section ends at the
 * next unfenced supported ATX H1/H2 ownership boundary (`isAtxH1OrH2BoundaryLine`)
 * or EOF. Fenced body lines (including fence delimiters) are omitted so they cannot
 * satisfy nonempty or required-instruction checks. H3–H6 and four-column indented
 * code lines do not end ownership.
 */
function sectionBodyAfterExactH2(text: string, title: string): string | null {
  const exact = `## ${title}`;
  const lines = text.split(/\r?\n/);
  const fenced = fencedCodeLineMask(lines);
  let startLine = -1;
  for (let i = 0; i < lines.length; i += 1) {
    if (!fenced[i] && lines[i] === exact) {
      startLine = i;
      break;
    }
  }
  if (startLine < 0) {
    return null;
  }
  const bodyLines: string[] = [];
  for (let i = startLine + 1; i < lines.length; i += 1) {
    if (!fenced[i] && isAtxH1OrH2BoundaryLine(lines[i]!)) {
      break;
    }
    if (fenced[i]) {
      continue;
    }
    bodyLines.push(lines[i]!);
  }
  return bodyLines.join("\n");
}

/** Exact stable markers required inside AGENTS Change-Ready routing (portable safety minimum). */
const AGENTS_ROUTING_DIRECT_MAIN_MARKER =
  "Main may directly author Ordinary Small production changes";
const AGENTS_ROUTING_PROOF_MARKER = "prove it observably";
const AGENTS_ROUTING_EDGE_MARKER = "realistic requirement-linked edge cases";
const AGENTS_ROUTING_SCOPE_APPROVAL_MARKER = "explicit user approval";
const AGENTS_ROUTING_EXPLICIT_CHANGE_READY_MARKER = "explicit Change-Ready";
const AGENTS_ROUTING_PROJECT_REQUIRED_MARKER = "project-required qualification";
const AGENTS_ROUTING_NO_DOWNGRADE_MARKER =
  "must not be downgraded merely because the diff is small";
/**
 * Shared named Material risk classes for AGENTS routing and canonical skill authority.
 * Exact full phrases only — weak substrings do not prove the intended safety class.
 */
const SHARED_MATERIAL_RISK_MARKERS: readonly { label: string; marker: string }[] = [
  { label: "public API/protocol/compatibility", marker: "public API/protocol/compatibility" },
  { label: "persisted data/migration", marker: "persisted data or migration" },
  { label: "security/privacy/authorization", marker: "security/privacy/authorization" },
  { label: "destructive/remote", marker: "destructive or remote" },
  { label: "concurrency correctness", marker: "concurrency correctness" },
  { label: "deployment/release", marker: "deployment/release" },
  {
    label: "loaded instruction/config lifecycle/safety",
    marker: "loaded instruction/configuration change that alters lifecycle or safety policy",
  },
];

/**
 * Structural AGENTS.md authority: distinct Markdown heading/section structure
 * plus deterministic Ordinary Small / Material safety minimum inside the routing section.
 * One-line all-token stubs must fail. Pure: no filesystem, process, environment, or logging side effects.
 */
export function agentsAuthorityProblem(text: string): string | null {
  if (text.trim() === "") {
    return "AGENTS.md is empty";
  }
  const scan = scanOperativeTextOutsideFences(text);
  if (scan.unsupportedFenceLine != null) {
    return `AGENTS.md contains unsupported non-top-level fenced-code syntax at line ${scan.unsupportedFenceLine}`;
  }
  const operative = scan.operativeText;
  const routingHeadingProblem = exactMandatoryH2CardinalityProblem(
    text,
    "Change-Ready SDLC Routing",
  );
  if (routingHeadingProblem != null) {
    return routingHeadingProblem;
  }
  const routing = sectionBodyAfterExactH2(text, "Change-Ready SDLC Routing");
  if (routing == null || routing.trim() === "") {
    return "AGENTS.md Change-Ready SDLC Routing section is empty";
  }
  if (!routing.includes("Ordinary Small")) {
    return "AGENTS.md Change-Ready SDLC Routing section missing Ordinary Small default";
  }
  if (!/Change-Ready:\s*not requested/i.test(routing)) {
    return "AGENTS.md Change-Ready SDLC Routing section missing Change-Ready: not requested ordinary completion";
  }
  if (!routing.includes("change-ready-sdlc")) {
    return "AGENTS.md Change-Ready SDLC Routing section missing change-ready-sdlc qualification load instruction";
  }
  if (!/Before the first mutation|pre-mutation/i.test(routing)) {
    return "AGENTS.md Change-Ready SDLC Routing section missing pre-mutation qualification instruction";
  }
  if (!routing.includes(AGENTS_ROUTING_DIRECT_MAIN_MARKER)) {
    return "AGENTS.md Change-Ready SDLC Routing section missing direct-main Ordinary Small production authorship";
  }
  const proofIdx = routing.indexOf(AGENTS_ROUTING_PROOF_MARKER);
  if (proofIdx < 0) {
    return "AGENTS.md Change-Ready SDLC Routing section missing observable happy-path proof marker";
  }
  const edgeIdx = routing.indexOf(AGENTS_ROUTING_EDGE_MARKER);
  if (edgeIdx < 0) {
    return "AGENTS.md Change-Ready SDLC Routing section missing realistic requirement-linked edge inspection marker";
  }
  if (proofIdx >= edgeIdx) {
    return "AGENTS.md Change-Ready SDLC Routing section must order observable proof before realistic requirement-linked edge inspection";
  }
  if (!routing.includes(AGENTS_ROUTING_SCOPE_APPROVAL_MARKER)) {
    return "AGENTS.md Change-Ready SDLC Routing section missing explicit owner approval before unrequested scope expansion";
  }
  if (!routing.includes(AGENTS_ROUTING_EXPLICIT_CHANGE_READY_MARKER)) {
    return "AGENTS.md Change-Ready SDLC Routing section missing explicit Change-Ready qualification trigger";
  }
  if (!routing.includes(AGENTS_ROUTING_PROJECT_REQUIRED_MARKER)) {
    return "AGENTS.md Change-Ready SDLC Routing section missing project-required qualification trigger";
  }
  for (const risk of SHARED_MATERIAL_RISK_MARKERS) {
    if (!routing.includes(risk.marker)) {
      return `AGENTS.md Change-Ready SDLC Routing section missing named Material risk class: ${risk.label}`;
    }
  }
  if (!routing.includes(AGENTS_ROUTING_NO_DOWNGRADE_MARKER)) {
    return "AGENTS.md Change-Ready SDLC Routing section missing no high-risk downgrade for small diffs";
  }
  if (!routing.includes("accepted outcome")) {
    return "AGENTS.md Change-Ready SDLC Routing section missing accepted-outcome authority marker";
  }
  if (!routing.includes("protected boundaries")) {
    return "AGENTS.md Change-Ready SDLC Routing section missing protected-boundaries authority marker";
  }
  if (!routing.includes("smallest sufficient dependency closure")) {
    return "AGENTS.md Change-Ready SDLC Routing section missing local reversible dependency-closure marker";
  }
  if (!routing.includes("never authorize mutation")) {
    return "AGENTS.md Change-Ready SDLC Routing section missing non-authorizing findings rule";
  }
  if (!routing.includes("one correction wave")) {
    return "AGENTS.md Change-Ready SDLC Routing section missing finite one-correction-wave marker";
  }
  if (!routing.includes("does not automatically end the unfinished root goal")) {
    return "AGENTS.md Change-Ready SDLC Routing section missing attempt-versus-root-goal continuation marker";
  }
  if (!routing.includes("unchanged-candidate")) {
    return "AGENTS.md Change-Ready SDLC Routing section missing unchanged-candidate anti-retry marker";
  }
  // Outcome-first / Pilot-Ready may live outside the routing H2; check operative text only
  // (closed and unclosed fenced examples cannot satisfy authority markers).
  // `operative` comes from the structured scan above (unsupported already rejected).
  if (!operative.includes("Pilot-Ready: yes | no | not requested")) {
    return "AGENTS.md missing exact Pilot-Ready disposition token";
  }
  if (!operative.includes("technically enforced operating envelope")) {
    return "AGENTS.md missing technically enforced operating envelope marker";
  }
  if (!operative.includes("Neither disposition authorizes")) {
    return "AGENTS.md missing neither-disposition-authorizes external-operation safety marker";
  }
  if (!operative.includes("Ordinary Small | Material")) {
    return "AGENTS.md missing exact Ordinary Small | Material profile pair";
  }
  if (!operative.includes("bounded outcome and non-goals")) {
    return "AGENTS.md missing Pilot safety-floor bounded outcome and non-goals marker";
  }
  if (!operative.includes("real-boundary happy-path proof")) {
    return "AGENTS.md missing Pilot safety-floor real-boundary happy-path proof marker";
  }
  if (!operative.includes("focused project-native validation")) {
    return "AGENTS.md missing Pilot safety-floor focused project-native validation marker";
  }
  if (!operative.includes("critical safety/data/authorization")) {
    return "AGENTS.md missing Pilot safety-floor critical safety/data/authorization marker";
  }
  if (!operative.includes("failure visibility")) {
    return "AGENTS.md missing Pilot safety-floor failure visibility marker";
  }
  if (!operative.includes("disable/rollback/containment")) {
    return "AGENTS.md missing Pilot safety-floor disable/rollback/containment marker";
  }
  for (const boundary of GLOBAL_AGENTS_PROTECTED_BOUNDARY_CATEGORIES) {
    if (!operative.includes(boundary.marker)) {
      return `AGENTS.md missing protected-boundary category: ${boundary.label}`;
    }
  }
  if (!operative.includes(GLOBAL_AGENTS_NON_WAIVABLE_RISK_CLAUSE)) {
    return "AGENTS.md missing non-waivable critical-risk clause";
  }
  for (const field of GLOBAL_AGENTS_DECISION_READY_HANDOFF_FIELDS) {
    if (!operative.includes(field)) {
      return `AGENTS.md missing decision-ready handoff field: ${field}`;
    }
  }
  const briefingHeadingProblem = exactMandatoryH2CardinalityProblem(
    text,
    "Universal Task Briefing Contract",
  );
  if (briefingHeadingProblem != null) {
    return briefingHeadingProblem;
  }
  const briefing = sectionBodyAfterExactH2(text, "Universal Task Briefing Contract");
  if (briefing == null || briefing.trim() === "") {
    return "AGENTS.md Universal Task Briefing Contract section is empty";
  }
  // Runtime/owner/delivery authority sections (adapter-neutral structural markers).
  const autonomousHeadingProblem = exactMandatoryH2CardinalityProblem(
    text,
    "Autonomous Work Contract",
  );
  if (autonomousHeadingProblem != null) {
    return autonomousHeadingProblem;
  }
  const autonomous = sectionBodyAfterExactH2(text, "Autonomous Work Contract");
  if (autonomous == null || autonomous.trim() === "") {
    return "AGENTS.md Autonomous Work Contract section is empty";
  }
  const reviewerHeadingProblem = exactMandatoryH2CardinalityProblem(
    text,
    "Shared Reviewer Runtime Invariants",
  );
  if (reviewerHeadingProblem != null) {
    return reviewerHeadingProblem;
  }
  const reviewer = sectionBodyAfterExactH2(text, "Shared Reviewer Runtime Invariants");
  if (reviewer == null || reviewer.trim() === "") {
    return "AGENTS.md Shared Reviewer Runtime Invariants section is empty";
  }
  return null;
}

type SkillHeadingMarker = {
  label: string;
  test: (headingLine: string) => boolean;
};

/** Ordered qualification lifecycle heading skeleton (stable contracts; not source-byte equality). */
const SKILL_ORDERED_HEADINGS: SkillHeadingMarker[] = [
  { label: "Change-Ready title", test: (line) => /^#\s+Change-Ready\b/.test(line) },
  { label: "When To Load", test: (line) => /^##\s+When To Load\s*$/.test(line) },
  { label: "Profile", test: (line) => /^##\s+Profile\b/.test(line) },
  { label: "Adapter Discovery", test: (line) => /^##\s+Adapter Discovery\s*$/.test(line) },
  { label: "Authoritative Brief", test: (line) => /^##\s+Authoritative Brief\s*$/.test(line) },
  {
    label: "Authoring And Gate Sequence (Orchestrator ownership)",
    test: (line) => /^##\s+Orchestrator ownership\s*$/.test(line),
  },
  {
    label: "Authoring And Gate Sequence (Lifecycle transitions)",
    test: (line) => /^##\s+Lifecycle transitions\s*$/.test(line),
  },
  {
    label: "Candidate Reference",
    test: (line) => /^###\s+\d+\.\s+Candidate Reference\b/.test(line),
  },
  { label: "Applicable Proof", test: (line) => /^###\s+\d+\.\s+Applicable Proof\s*$/.test(line) },
  { label: "Fresh SDET", test: (line) => /^###\s+\d+\.\s+Fresh SDET\s*$/.test(line) },
  {
    label: "Project-Native Validation",
    test: (line) => /^###\s+\d+\.\s+Project-Native Validation\s*$/.test(line),
  },
  {
    label: "Failure Rules (Correction routing and replay)",
    test: (line) => /^###\s+\d+\.\s+Correction routing and replay\s*$/.test(line),
  },
  {
    label: "Fresh Final Candidate Review",
    test: (line) => /^###\s+\d+\.\s+Final Candidate Review\s*$/.test(line),
  },
  {
    label: "Change-Ready Decision",
    test: (line) => /^###\s+\d+\.\s+Change-Ready Decision\s*$/.test(line),
  },
  {
    label: "Pilot-Ready Decision",
    test: (line) => /^###\s+\d+\.\s+Pilot-Ready Decision\s*$/.test(line),
  },
  {
    label: "Handoff And Delivery (Compact orchestration output)",
    test: (line) => /^##\s+Compact orchestration output\s*$/.test(line),
  },
];

function collectAtxHeadings(body: string): string[] {
  const lines = body.split(/\r?\n/);
  const fenced = fencedCodeLineMask(lines);
  const headings: string[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    if (fenced[i]) {
      continue;
    }
    const line = lines[i]!;
    if (/^#{1,6}\s+\S/.test(line)) {
      headings.push(line.trimEnd());
    }
  }
  return headings;
}

function skillBodyHeadingProblem(body: string): string | null {
  const headings = collectAtxHeadings(body);
  let cursor = 0;
  for (const marker of SKILL_ORDERED_HEADINGS) {
    const matches: number[] = [];
    for (let index = 0; index < headings.length; index++) {
      if (marker.test(headings[index])) {
        matches.push(index);
      }
    }
    if (matches.length === 0) {
      return `skills/change-ready-sdlc/SKILL.md missing ordered heading: ${marker.label}`;
    }
    if (matches.length > 1) {
      return `skills/change-ready-sdlc/SKILL.md duplicate heading: ${marker.label}`;
    }
    if (matches[0] < cursor) {
      return `skills/change-ready-sdlc/SKILL.md out-of-order heading: ${marker.label}`;
    }
    cursor = matches[0] + 1;
  }
  return null;
}

/** Exact stable markers required in the canonical skill body (portable safety minimum). */
const SKILL_ORDINARY_NONLOAD_MARKERS: readonly string[] = [
  "does **not** load this skill",
  "Do not load for Ordinary Small",
];
const SKILL_SCOPE_LOCK_MARKER = "project-specific scope lock";
const SKILL_OWNER_APPROVAL_MARKER = "explicit owner approval";
const SKILL_NO_DOWNGRADE_MARKER =
  "must not be downgraded merely because the diff is small";
const SKILL_ACCEPTED_OUTCOME_MARKER = "accepted outcome";
const SKILL_PROTECTED_BOUNDARIES_MARKER = "protected boundaries";
const SKILL_DEPENDENCY_CLOSURE_MARKER = "smallest sufficient dependency closure";
const SKILL_NON_AUTHORIZING_MARKER = "never authorize mutation";
const SKILL_CORRECTION_WAVE_MARKER = "one correction wave";
const SKILL_ROOT_GOAL_CONTINUATION_MARKER = "does not automatically end the unfinished root goal";
const SKILL_UNCHANGED_CANDIDATE_MARKER = "Never retry an unchanged candidate";
const SKILL_PROCESS_ONLY_BLOCKER_MARKER = "Never ask the user solely to approve an internal revision";
const SKILL_BLOCKING_EVIDENCE_MARKER = "Blocking Evidence";
const SKILL_FOLLOW_UP_CANDIDATES_MARKER = "Follow-up Candidates";
const SKILL_FINAL_VERDICT_MARKER = "approved | approved_with_notes | rejected | blocked";

/**
 * Structural change-ready-sdlc SKILL.md authority: js-yaml frontmatter + ordered
 * lifecycle heading skeleton + deterministic Material/Ordinary Small safety minimum.
 * Pure: no filesystem, process, environment, or logging side effects.
 */
export function skillAuthorityProblem(text: string): string | null {
  if (text.trim() === "") {
    return "skills/change-ready-sdlc/SKILL.md is empty";
  }
  const fullScan = scanOperativeTextOutsideFences(text);
  if (fullScan.unsupportedFenceLine != null) {
    return `skills/change-ready-sdlc/SKILL.md contains unsupported non-top-level fenced-code syntax at line ${fullScan.unsupportedFenceLine}`;
  }
  const fmMatch = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/);
  if (fmMatch == null) {
    return "skills/change-ready-sdlc/SKILL.md missing leading frontmatter";
  }
  const frontmatterBody = fmMatch[1];
  const body = fmMatch[2] ?? "";
  let parsed: unknown;
  try {
    parsed = yaml.load(frontmatterBody);
  } catch {
    return "skills/change-ready-sdlc/SKILL.md frontmatter is not valid YAML";
  }
  if (parsed == null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return "skills/change-ready-sdlc/SKILL.md frontmatter must be a YAML mapping";
  }
  const map = parsed as Record<string, unknown>;
  if (!Object.prototype.hasOwnProperty.call(map, "name")) {
    return "skills/change-ready-sdlc/SKILL.md frontmatter missing name";
  }
  if (typeof map.name !== "string") {
    return "skills/change-ready-sdlc/SKILL.md frontmatter name must be a scalar string";
  }
  if (map.name !== "change-ready-sdlc") {
    return "skills/change-ready-sdlc/SKILL.md frontmatter must set exact name: change-ready-sdlc";
  }
  if (!Object.prototype.hasOwnProperty.call(map, "description")) {
    return "skills/change-ready-sdlc/SKILL.md frontmatter missing description";
  }
  if (typeof map.description !== "string") {
    return "skills/change-ready-sdlc/SKILL.md frontmatter description must be a scalar string";
  }
  if (map.description.trim() === "") {
    return "skills/change-ready-sdlc/SKILL.md frontmatter description must be nonempty";
  }
  const headingProblem = skillBodyHeadingProblem(body);
  if (headingProblem != null) {
    return headingProblem;
  }
  // Outcome-authority / safety markers must appear in operative body text only.
  // Closed and unclosed fenced examples cannot satisfy authority markers.
  // Complete Pilot floor enumeration is owned only by always-loaded global AGENTS; skill binds by reference.
  // Unsupported syntax already rejected on full text (file line numbers); body scan is operative surface only.
  const operativeBody = scanOperativeTextOutsideFences(body).operativeText;
  if (!SKILL_ORDINARY_NONLOAD_MARKERS.some((marker) => operativeBody.includes(marker))) {
    return "skills/change-ready-sdlc/SKILL.md missing Ordinary Small non-load/default boundary";
  }
  if (!operativeBody.includes(SKILL_SCOPE_LOCK_MARKER)) {
    return "skills/change-ready-sdlc/SKILL.md missing project-specific scope-lock control";
  }
  if (!operativeBody.includes(SKILL_OWNER_APPROVAL_MARKER)) {
    return "skills/change-ready-sdlc/SKILL.md missing explicit owner approval expansion rule";
  }
  if (!operativeBody.includes(SKILL_NO_DOWNGRADE_MARKER)) {
    return "skills/change-ready-sdlc/SKILL.md missing no high-risk downgrade for small diffs";
  }
  if (!operativeBody.includes(SKILL_ACCEPTED_OUTCOME_MARKER)) {
    return "skills/change-ready-sdlc/SKILL.md missing accepted-outcome authority marker";
  }
  if (!operativeBody.includes(SKILL_PROTECTED_BOUNDARIES_MARKER)) {
    return "skills/change-ready-sdlc/SKILL.md missing protected-boundaries authority marker";
  }
  if (!operativeBody.includes(SKILL_DEPENDENCY_CLOSURE_MARKER)) {
    return "skills/change-ready-sdlc/SKILL.md missing local reversible dependency-closure marker";
  }
  if (!operativeBody.includes(SKILL_NON_AUTHORIZING_MARKER)) {
    return "skills/change-ready-sdlc/SKILL.md missing non-authorizing findings rule";
  }
  if (!operativeBody.includes(SKILL_CORRECTION_WAVE_MARKER)) {
    return "skills/change-ready-sdlc/SKILL.md missing finite one-correction-wave marker";
  }
  if (!operativeBody.includes(SKILL_ROOT_GOAL_CONTINUATION_MARKER)) {
    return "skills/change-ready-sdlc/SKILL.md missing attempt-versus-root-goal continuation marker";
  }
  if (!operativeBody.includes(SKILL_UNCHANGED_CANDIDATE_MARKER)) {
    return "skills/change-ready-sdlc/SKILL.md missing unchanged-candidate anti-retry marker";
  }
  if (!operativeBody.includes(SKILL_PROCESS_ONLY_BLOCKER_MARKER)) {
    return "skills/change-ready-sdlc/SKILL.md missing process-only-blocker prohibition marker";
  }
  if (!operativeBody.includes(SKILL_BLOCKING_EVIDENCE_MARKER)) {
    return "skills/change-ready-sdlc/SKILL.md missing Blocking Evidence output field";
  }
  if (!operativeBody.includes(SKILL_FOLLOW_UP_CANDIDATES_MARKER)) {
    return "skills/change-ready-sdlc/SKILL.md missing Follow-up Candidates output field";
  }
  if (!operativeBody.includes(SKILL_FINAL_VERDICT_MARKER)) {
    return "skills/change-ready-sdlc/SKILL.md missing final-review rejected verdict enum";
  }
  if (!operativeBody.includes("Pilot-Ready: yes | no | not requested")) {
    return "skills/change-ready-sdlc/SKILL.md missing exact Pilot-Ready disposition token";
  }
  if (!operativeBody.includes("not a third lifecycle profile")) {
    return "skills/change-ready-sdlc/SKILL.md missing no-third-profile Pilot-Ready boundary";
  }
  if (!operativeBody.includes("complete Pilot safety floor is authoritative only in always-loaded global")) {
    return "skills/change-ready-sdlc/SKILL.md missing complete Pilot safety-floor authority reference to always-loaded global AGENTS";
  }
  if (!operativeBody.includes("Neither disposition authorizes")) {
    return "skills/change-ready-sdlc/SKILL.md missing neither-disposition-authorizes external-operation safety marker";
  }
  // Triggers may live in description and/or operative body; require complete named Material classes.
  const triggerSurface = `${map.description}\n${operativeBody}`;
  for (const risk of SHARED_MATERIAL_RISK_MARKERS) {
    if (!triggerSurface.includes(risk.marker)) {
      return `skills/change-ready-sdlc/SKILL.md missing named Material risk class: ${risk.label}`;
    }
  }
  return null;
}
