import * as yaml from "js-yaml";

/**
 * CommonMark-style fenced code block line mask (backtick or tilde).
 * Pure and deterministic: no filesystem, process, environment, or logging side effects.
 *
 * Open: 0-3 leading ASCII spaces, then a run of 3+ identical `` ` `` or `~` markers
 * (for backtick fences the info string must not contain `` ` ``).
 * Close: 0-3 leading ASCII spaces, same marker character, run length at least the opener,
 * trailing horizontal whitespace only.
 * Fence delimiter lines and content between them are marked true. An unclosed fence
 * remains open through EOF. Four-space indented code is not a fence.
 *
 * @returns boolean array parallel to `lines`; true means the line is inside a fence
 *   (including the opening and closing fence delimiter lines).
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

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Exact ATX heading line match (level 2), ignoring headings inside fenced code blocks. */
function hasExactH2(text: string, title: string): boolean {
  const re = new RegExp(`^##\\s+${escapeRegExp(title)}\\s*$`);
  const lines = text.split(/\r?\n/);
  const fenced = fencedCodeLineMask(lines);
  for (let i = 0; i < lines.length; i += 1) {
    if (!fenced[i] && re.test(lines[i]!)) {
      return true;
    }
  }
  return false;
}

/**
 * Body of the first exact level-2 section outside fenced code blocks, or null when
 * the heading is missing. Section ends at the next non-fenced H2 (or EOF).
 * Fenced body lines (including fence delimiters) are omitted so they cannot satisfy
 * nonempty or required-instruction checks.
 */
function sectionBodyAfterExactH2(text: string, title: string): string | null {
  const re = new RegExp(`^##\\s+${escapeRegExp(title)}\\s*$`);
  const lines = text.split(/\r?\n/);
  const fenced = fencedCodeLineMask(lines);
  let startLine = -1;
  for (let i = 0; i < lines.length; i += 1) {
    if (!fenced[i] && re.test(lines[i]!)) {
      startLine = i;
      break;
    }
  }
  if (startLine < 0) {
    return null;
  }
  const bodyLines: string[] = [];
  for (let i = startLine + 1; i < lines.length; i += 1) {
    if (!fenced[i] && /^##\s+/.test(lines[i]!)) {
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
  if (!hasExactH2(text, "Change-Ready SDLC Routing")) {
    return "AGENTS.md missing exact heading ## Change-Ready SDLC Routing";
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
  if (!hasExactH2(text, "Universal Task Briefing Contract")) {
    return "AGENTS.md missing exact heading ## Universal Task Briefing Contract";
  }
  const briefing = sectionBodyAfterExactH2(text, "Universal Task Briefing Contract");
  if (briefing == null || briefing.trim() === "") {
    return "AGENTS.md Universal Task Briefing Contract section is empty";
  }
  // Runtime/owner/delivery authority sections (adapter-neutral structural markers).
  if (!hasExactH2(text, "Autonomous Work Contract")) {
    return "AGENTS.md missing exact heading ## Autonomous Work Contract";
  }
  const autonomous = sectionBodyAfterExactH2(text, "Autonomous Work Contract");
  if (autonomous == null || autonomous.trim() === "") {
    return "AGENTS.md Autonomous Work Contract section is empty";
  }
  if (!hasExactH2(text, "Shared Reviewer Runtime Invariants")) {
    return "AGENTS.md missing exact heading ## Shared Reviewer Runtime Invariants";
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

/**
 * Structural change-ready-sdlc SKILL.md authority: js-yaml frontmatter + ordered
 * lifecycle heading skeleton + deterministic Material/Ordinary Small safety minimum.
 * Pure: no filesystem, process, environment, or logging side effects.
 */
export function skillAuthorityProblem(text: string): string | null {
  if (text.trim() === "") {
    return "skills/change-ready-sdlc/SKILL.md is empty";
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
  if (!SKILL_ORDINARY_NONLOAD_MARKERS.some((marker) => body.includes(marker))) {
    return "skills/change-ready-sdlc/SKILL.md missing Ordinary Small non-load/default boundary";
  }
  if (!body.includes(SKILL_SCOPE_LOCK_MARKER)) {
    return "skills/change-ready-sdlc/SKILL.md missing project-specific scope-lock control";
  }
  if (!body.includes(SKILL_OWNER_APPROVAL_MARKER)) {
    return "skills/change-ready-sdlc/SKILL.md missing explicit owner approval expansion rule";
  }
  if (!body.includes(SKILL_NO_DOWNGRADE_MARKER)) {
    return "skills/change-ready-sdlc/SKILL.md missing no high-risk downgrade for small diffs";
  }
  // Triggers may live in description and/or body; require complete named Material classes.
  const triggerSurface = `${map.description}\n${body}`;
  for (const risk of SHARED_MATERIAL_RISK_MARKERS) {
    if (!triggerSurface.includes(risk.marker)) {
      return `skills/change-ready-sdlc/SKILL.md missing named Material risk class: ${risk.label}`;
    }
  }
  return null;
}
