import type { KaizenSignalInput } from "./store.ts";

const ENTRY_BYTES = 16 * 1024;
const FEEDBACK_ID = /^FB-\d{4}-\d{2}-\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const SAFE_SOURCE = /^[a-z0-9][a-z0-9._-]{0,63}$/u;
const SAFE_STATUS = /^[a-z][a-z0-9-]{0,31}$/u;
const SAFE_EVIDENCE_REF = /^[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)*$/u;
const METADATA = ["Source", "Role", "Type", "Severity", "Recurrence", "Status"] as const;
const REQUIRED_SECTIONS = [
  "Complaint",
  "Context",
  "Evidence From Current Session",
  "Impact",
  "Desired Future",
  "Proposed Direction",
  "OpenSpec Follow-Up",
] as const;

type FeedbackType = "complaint" | "suggestion" | "automation-candidate" | "instruction-conflict" | "tooling-friction" | "context-friction";

export type LegacyFeedbackEntry = {
  feedbackId: string;
  legacyStatus: string;
  recurrence: "current-session-once" | "current-session-repeated" | "ledger-match" | "unknown";
  role: "main-agent" | "reviewer" | "worker" | "skill";
  severity: "low" | "medium" | "high";
  signal: KaizenSignalInput;
  source: string;
  type: FeedbackType;
};

function fail(message: string): never {
  throw new Error(`Legacy feedback entry is invalid: ${message}`);
}

function bounded(value: string, label: string, maximumBytes: number): string {
  const normalized = value.trim();
  if (normalized === "" || Buffer.byteLength(normalized, "utf8") > maximumBytes) fail(`${label} must be nonempty and at most ${maximumBytes} bytes`);
  return normalized;
}

function enumValue<T extends string>(value: string, label: string, allowed: readonly T[]): T {
  if (!allowed.includes(value as T)) fail(`${label} is unsupported`);
  return value as T;
}

function kindFor(type: FeedbackType): KaizenSignalInput["kind"] {
  if (type === "complaint") return "friction";
  if (type === "tooling-friction" || type === "automation-candidate") return "tooling-gap";
  return "process-gap";
}

export function parseLegacyFeedbackEntry(markdown: string, evidenceRef: string): LegacyFeedbackEntry {
  if (typeof markdown !== "string" || Buffer.byteLength(markdown, "utf8") > ENTRY_BYTES || markdown.includes("\0")) fail(`entry must be text no larger than ${ENTRY_BYTES} bytes`);
  if (typeof evidenceRef !== "string" || !SAFE_EVIDENCE_REF.test(evidenceRef) || evidenceRef.split("/").some((part) => part === "." || part === "..")) {
    fail("evidenceRef must be one repository-relative file reference");
  }
  const lines = markdown.replaceAll("\r\n", "\n").trim().split("\n");
  const heading = /^## (FB-[a-z0-9-]+)$/u.exec(lines[0] ?? "");
  if (heading == null || heading[1].length > 96 || !FEEDBACK_ID.test(heading[1])) fail("heading must contain one stable FB-* id");
  if (lines[1] !== "") fail("heading must be followed by one blank line");

  let cursor = 2;
  const metadata = new Map<string, string>();
  for (const name of METADATA) {
    const prefix = `${name}: `;
    const line = lines[cursor++] ?? "";
    if (!line.startsWith(prefix) || line.slice(prefix.length).trim() === "") fail(`missing ordered ${name} metadata`);
    metadata.set(name, line.slice(prefix.length).trim());
  }
  if (lines[cursor++] !== "") fail("metadata must be followed by one blank line");

  const sections = new Map<string, string>();
  for (const name of REQUIRED_SECTIONS) {
    if (lines[cursor++] !== `### ${name}`) fail(`missing ordered ${name} section`);
    const content: string[] = [];
    while (cursor < lines.length && !lines[cursor].startsWith("### ")) content.push(lines[cursor++]);
    sections.set(name, bounded(content.join("\n"), name, name === "Evidence From Current Session" ? 1_200 : 768));
  }
  if (cursor < lines.length) {
    if (lines[cursor++] !== "### Related Entries") fail("unsupported trailing section");
    bounded(lines.slice(cursor).join("\n"), "Related Entries", 768);
    cursor = lines.length;
  }
  if (cursor !== lines.length) fail("unexpected trailing content");

  const source = metadata.get("Source")!;
  if (!SAFE_SOURCE.test(source)) fail("Source is unsafe");
  const role = enumValue(metadata.get("Role")!, "Role", ["main-agent", "reviewer", "worker", "skill"] as const);
  const type = enumValue(metadata.get("Type")!, "Type", ["complaint", "suggestion", "automation-candidate", "instruction-conflict", "tooling-friction", "context-friction"] as const);
  const severity = enumValue(metadata.get("Severity")!, "Severity", ["low", "medium", "high"] as const);
  const recurrence = enumValue(metadata.get("Recurrence")!, "Recurrence", ["current-session-once", "current-session-repeated", "ledger-match", "unknown"] as const);
  const legacyStatus = metadata.get("Status")!;
  if (!SAFE_STATUS.test(legacyStatus)) fail("Status is unsafe");
  const openSpecFollowUp = enumValue(sections.get("OpenSpec Follow-Up")!, "OpenSpec Follow-Up", ["yes", "no", "maybe"] as const);
  const observedEvidence = bounded([
    `Legacy feedback ${heading[1]}; written status ${legacyStatus}; source ${source}; role ${role}; severity ${severity}; recurrence ${recurrence}; OpenSpec follow-up ${openSpecFollowUp}.`,
    `Context: ${sections.get("Context")!}`,
    `Evidence: ${sections.get("Evidence From Current Session")!}`,
  ].join("\n"), "derived observedEvidence", 2_048);
  const doNotRepeat = bounded([
    `Desired future: ${sections.get("Desired Future")!}`,
    `Proposed direction: ${sections.get("Proposed Direction")!}`,
  ].join("\n"), "derived doNotRepeat", 1_024);

  return {
    feedbackId: heading[1],
    legacyStatus,
    recurrence,
    role,
    severity,
    source,
    type,
    signal: {
      kind: kindFor(type),
      summary: bounded(sections.get("Complaint")!, "derived summary", 1_024),
      observedEvidence,
      impact: bounded(sections.get("Impact")!, "derived impact", 1_024),
      likelyCause: "unknown",
      doNotRepeat,
      scopeHint: "unknown",
      evidenceRefs: [evidenceRef],
    },
  };
}
