import fs from "node:fs";
import path from "node:path";

import {
  SAFE_ID,
  digestText,
  isSha256,
  readArray,
  readObject,
  readString,
  safeRelativePath,
} from "./manifest.ts";

export const DELIVERY_HORIZON_SCHEMA_VERSION = 1;
export const TRAJECTORY_REVIEW_RECEIPT_SCHEMA_VERSION = 1;

export type DeliveryHorizonErrorCode =
  | "conflict"
  | "escape"
  | "exists"
  | "invalid"
  | "missing"
  | "unreadable"
  | "unsupported";

export class DeliveryHorizonError extends Error {
  readonly code: DeliveryHorizonErrorCode;
  readonly field?: string;

  constructor(
    message: string,
    options: { cause?: unknown; code?: DeliveryHorizonErrorCode; field?: string } = {},
  ) {
    super(message);
    if (options.cause !== undefined) (this as DeliveryHorizonError & { cause?: unknown }).cause = options.cause;
    this.name = "DeliveryHorizonError";
    this.code = options.code ?? "invalid";
    this.field = options.field;
  }
}

export type DeliveryHorizon = {
  schemaVersion: 1;
  id: string;
  windowStart: string;
  usefulBy: string;
  outcomeRefs: string[];
  exitPredicateRefs: string[];
  nonDeferrableInvariantRefs: string[];
  nonGoalRefs: string[];
};

export type DeliveryHorizonDeclaration =
  | { status: "linked"; horizonId: string }
  | { status: "none"; reason: string }
  | { status: "legacy-unlinked" }
  | { status: "duplicate"; count: number }
  | { status: "malformed"; reason: string };

export type TrajectoryReferenceIdentity = {
  ref: string;
  contentDigest: string;
};

export type TrajectoryReviewDisposition =
  | "continue"
  | "measure-next-boundary"
  | "replan-outcome-preserving"
  | "owner-required"
  | "unknown";

export type TrajectoryForecastStatus = "within-window" | "at-risk" | "outside-window" | "unknown";

export type TrajectoryReviewReceipt = {
  schemaVersion: 1;
  horizonId: string;
  archiveIdentity: {
    archiveId: string;
    archiveRef: string;
    contentDigest: string;
  };
  reviewedAt: string;
  decisionContext: TrajectoryReferenceIdentity[];
  triggerEvidence: TrajectoryReferenceIdentity[];
  decisionContextDigest: string;
  triggerEvidenceDigest: string;
  receiptKey: string;
  triggerClass: string;
  costObservations: {
    engineeringSetup: string;
    proofValidation: string;
    externalRuntime: string;
    coordinationRecovery: string;
    contextComprehension: string;
  };
  forecast: {
    status: TrajectoryForecastStatus;
    assumptions: string[];
    uncertainty: string;
  };
  disposition: TrajectoryReviewDisposition;
  successorRef: string | null;
  uncertainty: string;
  doNotRepeatCondition: string;
  retryCondition: string;
};

const HORIZON_KEYS = [
  "schemaVersion",
  "id",
  "windowStart",
  "usefulBy",
  "outcomeRefs",
  "exitPredicateRefs",
  "nonDeferrableInvariantRefs",
  "nonGoalRefs",
] as const;
const REFERENCE_IDENTITY_KEYS = ["ref", "contentDigest"] as const;
const RECEIPT_KEYS = [
  "schemaVersion",
  "horizonId",
  "archiveIdentity",
  "reviewedAt",
  "decisionContext",
  "triggerEvidence",
  "decisionContextDigest",
  "triggerEvidenceDigest",
  "receiptKey",
  "triggerClass",
  "costObservations",
  "forecast",
  "disposition",
  "successorRef",
  "uncertainty",
  "doNotRepeatCondition",
  "retryCondition",
] as const;
const ARCHIVE_IDENTITY_KEYS = ["archiveId", "archiveRef", "contentDigest"] as const;
const COST_OBSERVATION_KEYS = [
  "engineeringSetup",
  "proofValidation",
  "externalRuntime",
  "coordinationRecovery",
  "contextComprehension",
] as const;
const FORECAST_KEYS = ["status", "assumptions", "uncertainty"] as const;
const FORECAST_STATUSES = new Set<TrajectoryForecastStatus>([
  "within-window",
  "at-risk",
  "outside-window",
  "unknown",
]);
const REVIEW_DISPOSITIONS = new Set<TrajectoryReviewDisposition>([
  "continue",
  "measure-next-boundary",
  "replan-outcome-preserving",
  "owner-required",
  "unknown",
]);
const UTC_INSTANT = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?Z$/u;
const EXACT_DECLARATION = /^\s*-\s+\*\*Delivery Horizon:\*\*\s*(.*)$/u;
const DECLARATION_CANDIDATE = /^\s*-\s+\*\*Delivery Horizon(?::)?\*\*:?\s*(.*)$/u;

function invalid(field: string, message: string, code: DeliveryHorizonErrorCode = "invalid"): never {
  throw new DeliveryHorizonError(message, { code, field });
}

function resultValue<T>(result: { ok: true; value: T } | { ok: false; issues: Array<{ message: string }> }, field: string): T {
  if (result.ok) return result.value;
  invalid(field, result.issues.map((issue) => issue.message).join(" "));
}

function exactRecord(value: unknown, field: string, expectedKeys: readonly string[]): Record<string, unknown> {
  const record = resultValue(readObject(value, field), field);
  const actual = Object.keys(record).sort((left, right) => left.localeCompare(right));
  const expected = [...expectedKeys].sort((left, right) => left.localeCompare(right));
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    invalid(field, `${field} must contain exactly: ${expected.join(", ")}.`);
  }
  return record;
}

function nonEmptyString(value: unknown, field: string): string {
  return resultValue(readString(value, field), field);
}

function safeId(value: unknown, field: string, reserveNone = false): string {
  const parsed = resultValue(readString(value, field, SAFE_ID), field);
  if ((reserveNone && parsed === "none") || parsed === "." || parsed === "..") {
    invalid(field, `${field} must be a safe non-reserved id.`);
  }
  return parsed;
}

function relativeRef(value: unknown, field: string): string {
  const parsed = nonEmptyString(value, field);
  if (/[\0\r\n]/u.test(parsed)) invalid(field, `${field} must be a single-line repository-relative path.`);
  const issue = safeRelativePath(parsed, field);
  if (issue != null) invalid(field, issue.message, issue.code === "escape" ? "escape" : "invalid");
  return parsed;
}

function digest(value: unknown, field: string): string {
  const parsed = nonEmptyString(value, field);
  if (!isSha256(parsed)) invalid(field, `${field} must be a lowercase SHA-256 digest.`);
  return parsed;
}

function stringArray(value: unknown, field: string, requireNonEmpty = true): string[] {
  const input = resultValue(readArray(value, field), field);
  if (requireNonEmpty && input.length === 0) invalid(field, `${field} must be a non-empty array.`);
  return input.map((entry, index) => nonEmptyString(entry, `${field}[${index}]`));
}

function referenceArray(value: unknown, field: string): string[] {
  const input = resultValue(readArray(value, field), field);
  if (input.length === 0) invalid(field, `${field} must be a non-empty array.`);
  const references = input.map((entry, index) => relativeRef(entry, `${field}[${index}]`));
  if (new Set(references).size !== references.length) invalid(field, `${field} must not contain duplicate references.`, "conflict");
  return references;
}

type ParsedUtcInstant = { seconds: number; fraction: string };

function utcInstant(value: unknown, field: string): { value: string; parsed: ParsedUtcInstant } {
  const text = nonEmptyString(value, field);
  const match = UTC_INSTANT.exec(text);
  if (match == null) invalid(field, `${field} must be an RFC 3339 UTC instant.`);
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);
  if (year < 1 || month < 1 || month > 12 || hour > 23 || minute > 59 || second > 59) {
    invalid(field, `${field} must be a valid RFC 3339 UTC instant.`);
  }
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (day < 1 || day > daysInMonth) invalid(field, `${field} must be a valid RFC 3339 UTC instant.`);
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(hour, minute, second, 0);
  return { value: text, parsed: { seconds: Math.floor(date.getTime() / 1_000), fraction: match[7] ?? "" } };
}

function compareUtc(left: ParsedUtcInstant, right: ParsedUtcInstant): number {
  if (left.seconds !== right.seconds) return left.seconds < right.seconds ? -1 : 1;
  const width = Math.max(left.fraction.length, right.fraction.length);
  return left.fraction.padEnd(width, "0").localeCompare(right.fraction.padEnd(width, "0"));
}

export function deliveryHorizonRelativePath(horizonId: string): string {
  const id = safeId(horizonId, "horizonId", true);
  return `openspec/delivery-horizons/${id}/horizon.json`;
}

export function trajectoryReviewReceiptRelativePath(horizonId: string, receiptKey: string): string {
  const id = safeId(horizonId, "horizonId", true);
  const key = digest(receiptKey, "receiptKey");
  return `openspec/delivery-horizons/${id}/reviews/${key}.json`;
}

export function parseDeliveryHorizon(value: unknown, expectedId?: string): DeliveryHorizon {
  const source = exactRecord(value, "deliveryHorizon", HORIZON_KEYS);
  if (source.schemaVersion !== DELIVERY_HORIZON_SCHEMA_VERSION) {
    invalid("deliveryHorizon.schemaVersion", "Unsupported Delivery Horizon schema version.", "unsupported");
  }
  const id = safeId(source.id, "deliveryHorizon.id", true);
  if (expectedId != null && id !== safeId(expectedId, "expectedHorizonId", true)) {
    invalid("deliveryHorizon.id", `Delivery Horizon id '${id}' contradicts path id '${expectedId}'.`, "conflict");
  }
  const windowStart = utcInstant(source.windowStart, "deliveryHorizon.windowStart");
  const usefulBy = utcInstant(source.usefulBy, "deliveryHorizon.usefulBy");
  if (compareUtc(windowStart.parsed, usefulBy.parsed) >= 0) {
    invalid("deliveryHorizon.usefulBy", "deliveryHorizon.usefulBy must be later than windowStart.", "conflict");
  }
  const outcomeRefs = referenceArray(source.outcomeRefs, "deliveryHorizon.outcomeRefs");
  const exitPredicateRefs = referenceArray(source.exitPredicateRefs, "deliveryHorizon.exitPredicateRefs");
  const nonDeferrableInvariantRefs = referenceArray(source.nonDeferrableInvariantRefs, "deliveryHorizon.nonDeferrableInvariantRefs");
  const nonGoalRefs = referenceArray(source.nonGoalRefs, "deliveryHorizon.nonGoalRefs");
  const allReferences = [...outcomeRefs, ...exitPredicateRefs, ...nonDeferrableInvariantRefs, ...nonGoalRefs];
  if (new Set(allReferences).size !== allReferences.length) {
    invalid("deliveryHorizon", "Delivery Horizon references must be unique across all reference arrays.", "conflict");
  }
  return {
    schemaVersion: 1,
    id,
    windowStart: windowStart.value,
    usefulBy: usefulBy.value,
    outcomeRefs,
    exitPredicateRefs,
    nonDeferrableInvariantRefs,
    nonGoalRefs,
  };
}

export function parseDeliveryHorizonDeclaration(proposalText: string): DeliveryHorizonDeclaration {
  const candidates = proposalText.split(/\r?\n/u).filter((line) => DECLARATION_CANDIDATE.test(line));
  if (candidates.length === 0) return { status: "legacy-unlinked" };
  if (candidates.length > 1) return { status: "duplicate", count: candidates.length };
  const match = EXACT_DECLARATION.exec(candidates[0] ?? "");
  if (match == null) {
    return { status: "malformed", reason: "Declaration must use '- **Delivery Horizon:** <safe-id>' or '- **Delivery Horizon:** none - <non-empty reason>'." };
  }
  const declaration = (match[1] ?? "").trim();
  const none = /^none\s+-\s+(\S(?:.*\S)?)$/u.exec(declaration);
  if (none != null) {
    const reason = none[1] ?? "";
    if (reason.length > 1_000) return { status: "malformed", reason: "Delivery Horizon none reason is too long." };
    return { status: "none", reason };
  }
  if (declaration === "none" || declaration.startsWith("none ")) {
    return { status: "malformed", reason: "Delivery Horizon none requires 'none - <non-empty reason>'." };
  }
  if (!SAFE_ID.test(declaration) || declaration === "." || declaration === "..") {
    return { status: "malformed", reason: "Linked Delivery Horizon must be one safe id." };
  }
  return { status: "linked", horizonId: declaration };
}

function canonicalProjectRoot(root: string): string {
  try {
    const canonical = fs.realpathSync(path.resolve(root));
    const stat = fs.lstatSync(canonical);
    if (!stat.isDirectory() || stat.isSymbolicLink()) invalid("root", "Project root must be an ordinary directory.", "unreadable");
    return canonical;
  } catch (cause) {
    if (cause instanceof DeliveryHorizonError) throw cause;
    throw new DeliveryHorizonError("Project root is unreadable.", { cause, code: "unreadable", field: "root" });
  }
}

function resolvedContainedPath(root: string, relative: string, field: string): string {
  const resolved = path.resolve(root, relative);
  const relation = path.relative(root, resolved);
  if (relation.startsWith("..") || path.isAbsolute(relation)) invalid(field, `${field} escapes the project root.`, "escape");
  return resolved;
}

function containedExistingFile(root: string, relative: string, field: string): string {
  relativeRef(relative, field);
  const resolved = resolvedContainedPath(root, relative, field);
  let current = root;
  const segments = relative.split("/");
  for (let index = 0; index < segments.length; index++) {
    current = path.join(current, segments[index] ?? "");
    let stat: fs.Stats;
    try {
      stat = fs.lstatSync(current);
    } catch (cause) {
      throw new DeliveryHorizonError(`${field} is missing or unreadable.`, { cause, code: "unreadable", field });
    }
    if (stat.isSymbolicLink()) invalid(field, `${field} must not traverse a symbolic link.`, "escape");
    const last = index === segments.length - 1;
    if ((!last && !stat.isDirectory()) || (last && !stat.isFile())) {
      invalid(field, `${field} must be a regular non-symlink file.`, "invalid");
    }
  }
  let canonical: string;
  try {
    canonical = fs.realpathSync(resolved);
  } catch (cause) {
    throw new DeliveryHorizonError(`${field} is unreadable.`, { cause, code: "unreadable", field });
  }
  const relation = path.relative(root, canonical);
  if (relation.startsWith("..") || path.isAbsolute(relation)) invalid(field, `${field} escapes the project root.`, "escape");
  return canonical;
}

function readContainedText(root: string, relative: string, field: string): string {
  const file = containedExistingFile(root, relative, field);
  try {
    return fs.readFileSync(file, "utf8");
  } catch (cause) {
    throw new DeliveryHorizonError(`${field} is unreadable.`, { cause, code: "unreadable", field });
  }
}

function parseJson(text: string, field: string): unknown {
  try {
    return JSON.parse(text);
  } catch (cause) {
    throw new DeliveryHorizonError(`${field} must contain valid JSON.`, { cause, code: "invalid", field });
  }
}

export function loadDeliveryHorizon(projectRoot: string, horizonId: string): DeliveryHorizon {
  const canonicalRoot = canonicalProjectRoot(projectRoot);
  const relative = deliveryHorizonRelativePath(horizonId);
  const text = readContainedText(canonicalRoot, relative, "deliveryHorizon");
  const horizon = parseDeliveryHorizon(parseJson(text, "deliveryHorizon"), horizonId);
  const references = [
    ...horizon.outcomeRefs,
    ...horizon.exitPredicateRefs,
    ...horizon.nonDeferrableInvariantRefs,
    ...horizon.nonGoalRefs,
  ];
  for (let index = 0; index < references.length; index++) {
    readContainedText(canonicalRoot, references[index] ?? "", `deliveryHorizon.references[${index}]`);
  }
  return horizon;
}

export function readTrajectoryReferenceIdentity(projectRoot: string, reference: string): TrajectoryReferenceIdentity {
  const canonicalRoot = canonicalProjectRoot(projectRoot);
  const ref = relativeRef(reference, "reference");
  const content = readContainedText(canonicalRoot, ref, "reference");
  return { ref, contentDigest: digestText(content) };
}

export function readTrajectoryReferenceIdentities(projectRoot: string, references: readonly string[]): TrajectoryReferenceIdentity[] {
  if (references.length === 0) invalid("references", "references must be non-empty.");
  const canonicalRoot = canonicalProjectRoot(projectRoot);
  const normalized = references.map((reference, index) => relativeRef(reference, `references[${index}]`));
  if (new Set(normalized).size !== normalized.length) invalid("references", "references must not contain duplicates.", "conflict");
  return normalized.map((ref, index) => ({
    ref,
    contentDigest: digestText(readContainedText(canonicalRoot, ref, `references[${index}]`)),
  }));
}

function parseReferenceIdentities(value: unknown, field: string): TrajectoryReferenceIdentity[] {
  const input = resultValue(readArray(value, field), field);
  if (input.length === 0) invalid(field, `${field} must be a non-empty array.`);
  const identities = input.map((entry, index) => {
    const rowField = `${field}[${index}]`;
    const row = exactRecord(entry, rowField, REFERENCE_IDENTITY_KEYS);
    return {
      ref: relativeRef(row.ref, `${rowField}.ref`),
      contentDigest: digest(row.contentDigest, `${rowField}.contentDigest`),
    };
  });
  if (new Set(identities.map((row) => row.ref)).size !== identities.length) {
    invalid(field, `${field} must not contain duplicate references.`, "conflict");
  }
  return identities;
}

function referenceIdentityDigest(kind: "decision-context" | "trigger-evidence", identities: readonly TrajectoryReferenceIdentity[]): string {
  const parsed = parseReferenceIdentities(identities, kind);
  return digestText(JSON.stringify({ kind, references: parsed }));
}

export function trajectoryDecisionContextDigest(identities: readonly TrajectoryReferenceIdentity[]): string {
  return referenceIdentityDigest("decision-context", identities);
}

export function trajectoryTriggerEvidenceDigest(identities: readonly TrajectoryReferenceIdentity[]): string {
  return referenceIdentityDigest("trigger-evidence", identities);
}

export function trajectoryReviewReceiptKey(
  horizonId: string,
  decisionContextDigest: string,
  triggerEvidenceDigest: string,
): string {
  const id = safeId(horizonId, "horizonId", true);
  const context = digest(decisionContextDigest, "decisionContextDigest");
  const evidence = digest(triggerEvidenceDigest, "triggerEvidenceDigest");
  return digestText(JSON.stringify({ horizonId: id, decisionContextDigest: context, triggerEvidenceDigest: evidence }));
}

export function parseTrajectoryReviewReceipt(value: unknown): TrajectoryReviewReceipt {
  const source = exactRecord(value, "trajectoryReviewReceipt", RECEIPT_KEYS);
  if (source.schemaVersion !== TRAJECTORY_REVIEW_RECEIPT_SCHEMA_VERSION) {
    invalid("trajectoryReviewReceipt.schemaVersion", "Unsupported trajectory review receipt schema version.", "unsupported");
  }
  const horizonId = safeId(source.horizonId, "trajectoryReviewReceipt.horizonId", true);
  const archiveSource = exactRecord(source.archiveIdentity, "trajectoryReviewReceipt.archiveIdentity", ARCHIVE_IDENTITY_KEYS);
  const archiveIdentity = {
    archiveId: safeId(archiveSource.archiveId, "trajectoryReviewReceipt.archiveIdentity.archiveId"),
    archiveRef: relativeRef(archiveSource.archiveRef, "trajectoryReviewReceipt.archiveIdentity.archiveRef"),
    contentDigest: digest(archiveSource.contentDigest, "trajectoryReviewReceipt.archiveIdentity.contentDigest"),
  };
  const reviewedAt = utcInstant(source.reviewedAt, "trajectoryReviewReceipt.reviewedAt").value;
  const decisionContext = parseReferenceIdentities(source.decisionContext, "trajectoryReviewReceipt.decisionContext");
  const expectedHorizonRef = deliveryHorizonRelativePath(horizonId);
  if (decisionContext[0]?.ref !== expectedHorizonRef) {
    invalid(
      "trajectoryReviewReceipt.decisionContext",
      `The first decision-context reference must be ${expectedHorizonRef} so reviewed horizon intent is part of the immutable identity.`,
      "conflict",
    );
  }
  const triggerEvidence = parseReferenceIdentities(source.triggerEvidence, "trajectoryReviewReceipt.triggerEvidence");
  const decisionContextDigest = digest(source.decisionContextDigest, "trajectoryReviewReceipt.decisionContextDigest");
  const expectedDecisionContextDigest = trajectoryDecisionContextDigest(decisionContext);
  if (decisionContextDigest !== expectedDecisionContextDigest) {
    invalid("trajectoryReviewReceipt.decisionContextDigest", "Decision-context digest does not match its ordered reference identities.", "conflict");
  }
  const triggerEvidenceDigest = digest(source.triggerEvidenceDigest, "trajectoryReviewReceipt.triggerEvidenceDigest");
  const expectedTriggerEvidenceDigest = trajectoryTriggerEvidenceDigest(triggerEvidence);
  if (triggerEvidenceDigest !== expectedTriggerEvidenceDigest) {
    invalid("trajectoryReviewReceipt.triggerEvidenceDigest", "Trigger-evidence digest does not match its ordered reference identities.", "conflict");
  }
  const receiptKey = digest(source.receiptKey, "trajectoryReviewReceipt.receiptKey");
  const expectedReceiptKey = trajectoryReviewReceiptKey(horizonId, decisionContextDigest, triggerEvidenceDigest);
  if (receiptKey !== expectedReceiptKey) {
    invalid("trajectoryReviewReceipt.receiptKey", "Receipt key does not match horizon and reviewed evidence identity.", "conflict");
  }
  const triggerClass = nonEmptyString(source.triggerClass, "trajectoryReviewReceipt.triggerClass");
  if (triggerClass === "none") invalid("trajectoryReviewReceipt.triggerClass", "A no-trigger signal must not create a review receipt.", "conflict");
  const costSource = exactRecord(source.costObservations, "trajectoryReviewReceipt.costObservations", COST_OBSERVATION_KEYS);
  const costObservations = {
    engineeringSetup: nonEmptyString(costSource.engineeringSetup, "trajectoryReviewReceipt.costObservations.engineeringSetup"),
    proofValidation: nonEmptyString(costSource.proofValidation, "trajectoryReviewReceipt.costObservations.proofValidation"),
    externalRuntime: nonEmptyString(costSource.externalRuntime, "trajectoryReviewReceipt.costObservations.externalRuntime"),
    coordinationRecovery: nonEmptyString(costSource.coordinationRecovery, "trajectoryReviewReceipt.costObservations.coordinationRecovery"),
    contextComprehension: nonEmptyString(costSource.contextComprehension, "trajectoryReviewReceipt.costObservations.contextComprehension"),
  };
  const forecastSource = exactRecord(source.forecast, "trajectoryReviewReceipt.forecast", FORECAST_KEYS);
  const forecastStatus = nonEmptyString(forecastSource.status, "trajectoryReviewReceipt.forecast.status") as TrajectoryForecastStatus;
  if (!FORECAST_STATUSES.has(forecastStatus)) invalid("trajectoryReviewReceipt.forecast.status", "Unsupported forecast status.", "unsupported");
  const forecast = {
    status: forecastStatus,
    assumptions: stringArray(forecastSource.assumptions, "trajectoryReviewReceipt.forecast.assumptions", false),
    uncertainty: nonEmptyString(forecastSource.uncertainty, "trajectoryReviewReceipt.forecast.uncertainty"),
  };
  const disposition = nonEmptyString(source.disposition, "trajectoryReviewReceipt.disposition") as TrajectoryReviewDisposition;
  if (!REVIEW_DISPOSITIONS.has(disposition)) invalid("trajectoryReviewReceipt.disposition", "Unsupported trajectory review disposition.", "unsupported");
  const successorRef = source.successorRef === null
    ? null
    : relativeRef(source.successorRef, "trajectoryReviewReceipt.successorRef");
  if (successorRef == null && (disposition === "measure-next-boundary" || disposition === "replan-outcome-preserving")) {
    invalid("trajectoryReviewReceipt.successorRef", `Disposition '${disposition}' requires one planned successor reference.`, "conflict");
  }
  if (successorRef != null && disposition !== "measure-next-boundary" && disposition !== "replan-outcome-preserving") {
    invalid("trajectoryReviewReceipt.successorRef", `Disposition '${disposition}' cannot name a successor.`, "conflict");
  }
  return {
    schemaVersion: 1,
    horizonId,
    archiveIdentity,
    reviewedAt,
    decisionContext,
    triggerEvidence,
    decisionContextDigest,
    triggerEvidenceDigest,
    receiptKey,
    triggerClass,
    costObservations,
    forecast,
    disposition,
    successorRef,
    uncertainty: nonEmptyString(source.uncertainty, "trajectoryReviewReceipt.uncertainty"),
    doNotRepeatCondition: nonEmptyString(source.doNotRepeatCondition, "trajectoryReviewReceipt.doNotRepeatCondition"),
    retryCondition: nonEmptyString(source.retryCondition, "trajectoryReviewReceipt.retryCondition"),
  };
}

function verifyReferenceIdentities(root: string, identities: readonly TrajectoryReferenceIdentity[], field: string): void {
  for (let index = 0; index < identities.length; index++) {
    const identity = identities[index];
    if (identity == null) continue;
    const current = digestText(readContainedText(root, identity.ref, `${field}[${index}]`));
    if (current !== identity.contentDigest) {
      invalid(`${field}[${index}].contentDigest`, `${field}[${index}] content digest is stale or contradictory.`, "conflict");
    }
  }
}

function verifyReceiptReferences(root: string, receipt: TrajectoryReviewReceipt): void {
  loadDeliveryHorizon(root, receipt.horizonId);
  verifyReferenceIdentities(root, receipt.decisionContext, "trajectoryReviewReceipt.decisionContext");
  verifyReferenceIdentities(root, receipt.triggerEvidence, "trajectoryReviewReceipt.triggerEvidence");
  const archiveDigest = digestText(readContainedText(root, receipt.archiveIdentity.archiveRef, "trajectoryReviewReceipt.archiveIdentity.archiveRef"));
  if (archiveDigest !== receipt.archiveIdentity.contentDigest) {
    invalid("trajectoryReviewReceipt.archiveIdentity.contentDigest", "Archive identity content digest is stale or contradictory.", "conflict");
  }
}

function ensureContainedDirectory(root: string, relative: string): string {
  let current = root;
  for (const segment of relative.split("/")) {
    current = path.join(current, segment);
    let stat: fs.Stats | undefined;
    try {
      stat = fs.lstatSync(current, { throwIfNoEntry: false }) ?? undefined;
    } catch (cause) {
      throw new DeliveryHorizonError(`Directory ${relative} is unreadable.`, { cause, code: "unreadable", field: relative });
    }
    if (stat == null) {
      try {
        fs.mkdirSync(current);
        stat = fs.lstatSync(current);
      } catch (cause) {
        throw new DeliveryHorizonError(`Directory ${relative} could not be created safely.`, { cause, code: "unreadable", field: relative });
      }
    }
    if (!stat.isDirectory() || stat.isSymbolicLink()) invalid(relative, `Directory ${relative} must contain only ordinary directories.`, "escape");
  }
  const relation = path.relative(root, current);
  if (relation.startsWith("..") || path.isAbsolute(relation)) invalid(relative, `Directory ${relative} escapes the project root.`, "escape");
  return current;
}

export function formatTrajectoryReviewReceipt(receipt: TrajectoryReviewReceipt): string {
  return `${JSON.stringify(parseTrajectoryReviewReceipt(receipt), null, 2)}\n`;
}

export function readTrajectoryReviewReceipt(
  projectRoot: string,
  horizonId: string,
  receiptKey: string,
): TrajectoryReviewReceipt {
  const canonicalRoot = canonicalProjectRoot(projectRoot);
  const relative = trajectoryReviewReceiptRelativePath(horizonId, receiptKey);
  const text = readContainedText(canonicalRoot, relative, "trajectoryReviewReceipt");
  const receipt = parseTrajectoryReviewReceipt(parseJson(text, "trajectoryReviewReceipt"));
  if (receipt.horizonId !== horizonId || receipt.receiptKey !== receiptKey) {
    invalid("trajectoryReviewReceipt", "Receipt content contradicts its horizon or filename identity.", "conflict");
  }
  return receipt;
}

export function materializeTrajectoryReviewReceipt(
  projectRoot: string,
  value: unknown,
): { relativePath: string; receipt: TrajectoryReviewReceipt } {
  const receipt = parseTrajectoryReviewReceipt(value);
  const canonicalRoot = canonicalProjectRoot(projectRoot);
  verifyReceiptReferences(canonicalRoot, receipt);
  const relativePath = trajectoryReviewReceiptRelativePath(receipt.horizonId, receipt.receiptKey);
  const directory = `openspec/delivery-horizons/${receipt.horizonId}/reviews`;
  const reviewRoot = ensureContainedDirectory(canonicalRoot, directory);
  const file = resolvedContainedPath(canonicalRoot, relativePath, "trajectoryReviewReceipt");
  if (path.dirname(file) !== reviewRoot) invalid("trajectoryReviewReceipt", "Receipt path contradicts its horizon reviews directory.", "conflict");
  let existing: fs.Stats | undefined;
  try {
    existing = fs.lstatSync(file, { throwIfNoEntry: false }) ?? undefined;
  } catch (cause) {
    throw new DeliveryHorizonError("Receipt path is unreadable.", { cause, code: "unreadable", field: relativePath });
  }
  if (existing != null) invalid(relativePath, "Trajectory review receipt path already exists and is immutable.", "exists");
  const text = formatTrajectoryReviewReceipt(receipt);
  let descriptor: number | undefined;
  try {
    descriptor = fs.openSync(file, "wx");
    fs.writeFileSync(descriptor, text, "utf8");
    fs.fsyncSync(descriptor);
  } catch (cause) {
    let cleanupCause: unknown;
    if (descriptor != null) {
      try {
        fs.closeSync(descriptor);
        descriptor = undefined;
        fs.unlinkSync(file);
      } catch (error) {
        cleanupCause = error;
      }
    }
    throw new DeliveryHorizonError("Trajectory review receipt could not be created.", {
      cause: cleanupCause == null ? cause : new AggregateError([cause, cleanupCause], "Receipt creation and cleanup failed."),
      code: "unreadable",
      field: relativePath,
    });
  } finally {
    if (descriptor != null) fs.closeSync(descriptor);
  }
  try {
    const readback = readTrajectoryReviewReceipt(canonicalRoot, receipt.horizonId, receipt.receiptKey);
    if (formatTrajectoryReviewReceipt(readback) !== text) {
      invalid("trajectoryReviewReceipt", "Trajectory review receipt readback differs from the materialized bytes.", "conflict");
    }
    return { relativePath, receipt: readback };
  } catch (cause) {
    let cleanupCause: unknown;
    try {
      fs.unlinkSync(file);
    } catch (error) {
      cleanupCause = error;
    }
    if (cleanupCause == null) throw cause;
    throw new DeliveryHorizonError("Trajectory review receipt readback and cleanup failed.", {
      cause: new AggregateError([cause, cleanupCause], "Receipt readback and cleanup failed."),
      code: "unreadable",
      field: relativePath,
    });
  }
}
