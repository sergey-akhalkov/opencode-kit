import crypto from "node:crypto";

export const ROADMAP_MISSION_CERTIFICATE_ISSUER = "roadmap-mission-session-executor";

export type TerminalCertificateChallenge = {
  acceptedClaimIds: string[];
  challengeRef: string;
  claimEvidenceRefs: string[];
  issuer: string;
  leaseGeneration: number;
  requirementIds: string[];
  revisionDigest: string;
  rootRef: string;
  schemaVersion: 1;
};

export type TerminalCertificate = TerminalCertificateChallenge & {
  disposition: "allow_stop";
  evidenceRefs: string[];
};

export type TerminalCertificateState = {
  acceptedClaimIds?: string[];
  challenge: TerminalCertificateChallenge | null;
  claimEvidenceRefs?: string[];
  deadlineAt: number | null;
  evidenceRefs: string[];
  issuer: string | null;
  reason: string | null;
  status: "accepted" | "declined" | "expired" | "not-configured" | "rejected" | "waiting";
};

export type TerminalCertificateEvaluation =
  | { certificate: TerminalCertificate; reason: null; status: "accepted" }
  | { certificate: null; reason: string; status: "rejected" };

function record(value: unknown): Record<string, unknown> | null {
  return value != null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function boundedString(value: unknown, label: string, max = 200): string {
  if (typeof value !== "string" || value === "" || value.length > max || /[\r\n\0]/.test(value)) {
    throw new Error(`${label} must be a non-empty bounded single-line string`);
  }
  return value;
}

function stringList(value: unknown, label: string, max: number, pathOnly = false, allowEmpty = false): string[] {
  const minimum = allowEmpty ? 0 : 1;
  if (!Array.isArray(value) || value.length < minimum || value.length > max) {
    throw new Error(`${label} must contain between ${minimum} and ${max} entries`);
  }
  const entries = value.map((entry, index) => boundedString(entry, `${label}[${index}]`));
  if (pathOnly && entries.some((entry) => entry.startsWith("/") || entry.includes("\\") || entry.split("/").some((part) => part === ".."))) {
    throw new Error(`${label} contains an unsafe evidence reference`);
  }
  const sorted = [...entries].sort();
  if (new Set(sorted).size !== sorted.length) throw new Error(`${label} must not contain duplicates`);
  return sorted;
}

function exactKeys(input: Record<string, unknown>, expected: readonly string[], label: string): void {
  const actual = Object.keys(input).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    throw new Error(`${label} has unsupported or missing fields`);
  }
}

export function createTerminalCertificateChallenge(input: {
  acceptedClaimIds?: string[];
  claimEvidenceRefs?: string[];
  issuer: string;
  leaseGeneration: number;
  requirementIds: string[];
  revisionDigest: string;
  rootRef: string;
}): TerminalCertificateChallenge {
  const issuer = boundedString(input.issuer, "terminal certificate issuer");
  const rootRef = boundedString(input.rootRef, "terminal certificate rootRef");
  const revisionDigest = boundedString(input.revisionDigest, "terminal certificate revisionDigest");
  const acceptedClaimIds = stringList(
    input.acceptedClaimIds ?? [],
    "terminal certificate acceptedClaimIds",
    32,
    false,
    true,
  );
  const claimEvidenceRefs = stringList(
    input.claimEvidenceRefs ?? [],
    "terminal certificate claimEvidenceRefs",
    256,
    false,
    true,
  );
  if (!Number.isSafeInteger(input.leaseGeneration) || input.leaseGeneration < 0) {
    throw new Error("terminal certificate leaseGeneration must be a non-negative integer");
  }
  const requirementIds = stringList(input.requirementIds, "terminal certificate requirementIds", 100);
  const challengeRef = crypto.createHash("sha256").update(JSON.stringify({
    acceptedClaimIds,
    claimEvidenceRefs,
    issuer,
    leaseGeneration: input.leaseGeneration,
    requirementIds,
    revisionDigest,
    rootRef,
  })).digest("hex");
  return {
    acceptedClaimIds,
    challengeRef,
    claimEvidenceRefs,
    issuer,
    leaseGeneration: input.leaseGeneration,
    requirementIds,
    revisionDigest,
    rootRef,
    schemaVersion: 1,
  };
}

export function parseTerminalCertificateChallenge(value: unknown): TerminalCertificateChallenge {
  const input = record(value);
  if (input == null) throw new Error("terminal certificate challenge must be an object");
  exactKeys(input, ["acceptedClaimIds", "challengeRef", "claimEvidenceRefs", "issuer", "leaseGeneration", "requirementIds", "revisionDigest", "rootRef", "schemaVersion"], "terminal certificate challenge");
  if (input.schemaVersion !== 1) throw new Error("terminal certificate challenge schema is unsupported");
  const challenge = createTerminalCertificateChallenge({
    acceptedClaimIds: stringList(input.acceptedClaimIds, "terminal certificate challenge acceptedClaimIds", 32, false, true),
    claimEvidenceRefs: stringList(input.claimEvidenceRefs, "terminal certificate challenge claimEvidenceRefs", 256, false, true),
    issuer: boundedString(input.issuer, "terminal certificate challenge issuer"),
    leaseGeneration: input.leaseGeneration as number,
    requirementIds: stringList(input.requirementIds, "terminal certificate challenge requirementIds", 100),
    revisionDigest: boundedString(input.revisionDigest, "terminal certificate challenge revisionDigest"),
    rootRef: boundedString(input.rootRef, "terminal certificate challenge rootRef"),
  });
  if (boundedString(input.challengeRef, "terminal certificate challengeRef") !== challenge.challengeRef) {
    throw new Error("terminal certificate challengeRef does not match its bound fields");
  }
  return challenge;
}

export function parseTerminalCertificate(value: unknown): TerminalCertificate {
  const input = record(value);
  if (input == null) throw new Error("terminal certificate must be an object");
  exactKeys(input, [
    "acceptedClaimIds",
    "challengeRef",
    "claimEvidenceRefs",
    "disposition",
    "evidenceRefs",
    "issuer",
    "leaseGeneration",
    "requirementIds",
    "revisionDigest",
    "rootRef",
    "schemaVersion",
  ], "terminal certificate");
  if (input.disposition !== "allow_stop") throw new Error("terminal certificate disposition must be allow_stop");
  const challenge = parseTerminalCertificateChallenge({
    acceptedClaimIds: input.acceptedClaimIds,
    challengeRef: input.challengeRef,
    claimEvidenceRefs: input.claimEvidenceRefs,
    issuer: input.issuer,
    leaseGeneration: input.leaseGeneration,
    requirementIds: input.requirementIds,
    revisionDigest: input.revisionDigest,
    rootRef: input.rootRef,
    schemaVersion: input.schemaVersion,
  });
  return {
    ...challenge,
    disposition: "allow_stop",
    evidenceRefs: stringList(input.evidenceRefs, "terminal certificate evidenceRefs", 100, true),
  };
}

export function evaluateTerminalCertificate(input: {
  certificate: unknown;
  challenge: TerminalCertificateChallenge;
  configuredIssuers: readonly string[];
  pendingQuestion: boolean;
}): TerminalCertificateEvaluation {
  if (input.pendingQuestion) return { certificate: null, reason: "pending-question", status: "rejected" };
  if (!input.configuredIssuers.includes(input.challenge.issuer)) {
    return { certificate: null, reason: "unknown-issuer", status: "rejected" };
  }
  let certificate: TerminalCertificate;
  try {
    certificate = parseTerminalCertificate(input.certificate);
  } catch (error) {
    return {
      certificate: null,
      reason: error instanceof Error ? `malformed:${error.message}`.slice(0, 300) : "malformed",
      status: "rejected",
    };
  }
  const comparisons: Array<[boolean, string]> = [
    [certificate.issuer === input.challenge.issuer, "issuer-mismatch"],
    [certificate.rootRef === input.challenge.rootRef, "root-mismatch"],
    [certificate.revisionDigest === input.challenge.revisionDigest, "stale-revision"],
    [certificate.leaseGeneration === input.challenge.leaseGeneration, "stale-lease"],
    [JSON.stringify(certificate.requirementIds) === JSON.stringify(input.challenge.requirementIds), "missing-requirement"],
    [JSON.stringify(certificate.acceptedClaimIds) === JSON.stringify(input.challenge.acceptedClaimIds), "missing-claim"],
    [JSON.stringify(certificate.claimEvidenceRefs) === JSON.stringify(input.challenge.claimEvidenceRefs), "claim-evidence-mismatch"],
    [certificate.challengeRef === input.challenge.challengeRef, "challenge-mismatch"],
  ];
  const failed = comparisons.find(([matches]) => !matches);
  return failed == null
    ? { certificate, reason: null, status: "accepted" }
    : { certificate: null, reason: failed[1], status: "rejected" };
}
