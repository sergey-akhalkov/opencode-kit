import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { sanitizeText } from "../session-delivery-context/redaction.ts";
import {
  PROJECT_MEMORY_CANDIDATE_BYTES,
  PROJECT_MEMORY_LIFECYCLE_BYTES,
  ProjectMemoryError,
  assertCandidateEnums,
  byteLength,
  candidateMarkdown,
  invalidationMarkdown,
  isProjectMemoryRef,
  isoTime,
  normalizeRepositorySelector,
  parseCandidateMarkdown,
  parseLifecycleMarkdown,
  promotionMarkdown,
  requiredText,
} from "./records.ts";

export {
  PROJECT_MEMORY_CANDIDATE_BYTES,
  PROJECT_MEMORY_LIFECYCLE_BYTES,
  PROJECT_MEMORY_SCHEMA_VERSION,
  ProjectMemoryError,
  normalizeRepositorySelector,
  parseCandidateMarkdown,
  parseLifecycleMarkdown,
} from "./records.ts";

export const PROJECT_MEMORY_CARD_LIMIT = 2_000;
export const PROJECT_MEMORY_LIFECYCLE_LIMIT = 8_000;
export const PROJECT_MEMORY_EVENT_LIMIT = PROJECT_MEMORY_CARD_LIMIT + PROJECT_MEMORY_LIFECYCLE_LIMIT;

const SAFE_REDACTION_SESSION_ID = "session_project_memory_internal";
const CARD_SLOT_PATTERN = /^card-(\d{4})\.md$/;
const EVENT_SLOT_PATTERN = /^event-(\d{6})\.md$/;

export type ProjectMemoryKind = "tip" | "pitfall" | "procedure";
export type ProjectMemoryConfidence = "low" | "medium" | "high";
export type ProjectMemoryStatus = "candidate" | "active" | "invalidated";

export type ProjectMemoryEnvironment = Record<string, string | undefined>;

export type ProjectMemoryRootInput = {
  worktree?: string;
  projectWorktree?: string;
  directory?: string;
  startupDirectory?: string;
  environment?: ProjectMemoryEnvironment;
  platform?: NodeJS.Platform;
  homeDirectory?: string;
};

export type ProjectMemoryStore = {
  canonicalRoot: string;
  dataRoot: string;
  projectRef: string;
  storeRoot: string;
};

export type ProjectMemoryCandidateInput = {
  title: string;
  kind: ProjectMemoryKind;
  confidence: ProjectMemoryConfidence;
  triggers: string[];
  appliesTo?: {
    paths?: string[];
    symbols?: string[];
  };
  evidencePaths?: string[];
  technique: string;
  why: string;
  evidence: string;
  invalidatedWhen: string;
};

export type ProjectMemoryPromotionInput = {
  cardRef: string;
  evidence: string;
  verifiedAt?: string;
};

export type ProjectMemoryInvalidationInput = {
  cardRef: string;
  reason: string;
};

export type ProjectMemoryFingerprint = {
  path: string;
  sha256: string;
};

export type ProjectMemoryFingerprintStatus = "match" | "missing" | "mismatch" | "unavailable" | "unsafe";

export type ProjectMemoryCandidate = {
  schemaVersion: 1;
  event: "candidate";
  eventRef: string;
  cardRef: string;
  title: string;
  kind: ProjectMemoryKind;
  createdAt: string;
  confidence: ProjectMemoryConfidence;
  triggers: string[];
  appliesTo: {
    paths: string[];
    symbols: string[];
  };
  evidencePaths: string[];
  technique: string;
  why: string;
  evidence: string;
  invalidatedWhen: string;
};

export type ProjectMemoryPromotion = {
  schemaVersion: 1;
  event: "promote";
  eventRef: string;
  cardRef: string;
  createdAt: string;
  verifiedAt: string;
  fingerprints: ProjectMemoryFingerprint[];
  evidence: string;
};

export type ProjectMemoryInvalidation = {
  schemaVersion: 1;
  event: "invalidate";
  eventRef: string;
  cardRef: string;
  createdAt: string;
  reason: string;
};

export type ProjectMemoryLifecycleEvent = ProjectMemoryPromotion | ProjectMemoryInvalidation;

export type ProjectMemoryFoldedCard = ProjectMemoryCandidate & {
  status: ProjectMemoryStatus;
  verifiedAt: string | null;
  fingerprints: ProjectMemoryFingerprint[];
  invalidationReason: string | null;
};

export type ProjectMemoryPopulation = {
  cards: ProjectMemoryFoldedCard[];
  warnings: string[];
};

export type ProjectMemoryManageResult = {
  schemaVersion: 1;
  action: "candidate" | "promote" | "invalidate";
  cardRef: string;
  eventRef: string;
  status: ProjectMemoryStatus;
  projectRef: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function errorCode(error: unknown): string | null {
  return isRecord(error) && typeof error.code === "string" ? error.code : null;
}

function randomRef(prefix: "card" | "event"): string {
  return `${prefix}_${crypto.randomBytes(16).toString("hex")}`;
}

function sha256(value: string | Buffer): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)];
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replaceInsensitive(value: string, needle: string, replacement: string): string {
  if (needle === "") return value;
  return value.replace(new RegExp(escapeRegExp(needle), "gi"), replacement);
}

export function sanitizeMemoryText(value: string, canonicalRoot: string): string {
  const roots = uniqueStrings([
    canonicalRoot,
    canonicalRoot.replaceAll("\\", "/"),
    canonicalRoot.replaceAll("/", "\\"),
  ]).sort((left, right) => right.length - left.length);
  const rootRedacted = roots.reduce(
    (current, root) => replaceInsensitive(current, root, "<project-root>"),
    value,
  );
  return sanitizeText(rootRedacted, SAFE_REDACTION_SESSION_ID);
}

function selectProjectRoot(input: ProjectMemoryRootInput): string | null {
  for (const candidate of [input.worktree, input.projectWorktree, input.directory]) {
    if (typeof candidate === "string" && candidate.trim() !== "") return candidate;
  }
  return null;
}

export function canonicalProjectRoot(input: ProjectMemoryRootInput): string | null {
  const selected = selectProjectRoot(input);
  if (selected == null) return null;
  try {
    return fs.realpathSync.native(path.resolve(selected));
  } catch (error) {
    throw new ProjectMemoryError("project-root", "Project memory could not resolve the configured project root.", { cause: error });
  }
}

export function resolveOpenCodeDataRoot(input: ProjectMemoryRootInput): string {
  const environment = input.environment ?? process.env;
  const startupDirectory = path.resolve(input.startupDirectory ?? process.cwd());
  const platform = input.platform ?? process.platform;
  const homeDirectory = input.homeDirectory ?? os.homedir();
  const explicit = environment.OPENCODE_DATA_DIR?.trim();
  let base: string;
  if (explicit) {
    base = path.resolve(startupDirectory, explicit);
  } else if (platform === "win32") {
    const windowsData = environment.LOCALAPPDATA?.trim() || environment.APPDATA?.trim();
    if (!windowsData) throw new ProjectMemoryError("data-root", "Project memory could not resolve the Windows OpenCode data root.");
    base = path.resolve(startupDirectory, windowsData, "opencode");
  } else if (platform === "darwin") {
    if (!homeDirectory) throw new ProjectMemoryError("data-root", "Project memory could not resolve the macOS home directory.");
    base = path.join(homeDirectory, "Library", "Application Support", "opencode");
  } else {
    const xdgData = environment.XDG_DATA_HOME?.trim();
    if (xdgData) base = path.resolve(startupDirectory, xdgData, "opencode");
    else {
      if (!homeDirectory) throw new ProjectMemoryError("data-root", "Project memory could not resolve the local data directory.");
      base = path.join(homeDirectory, ".local", "share", "opencode");
    }
  }
  return base;
}

export function resolveProjectMemoryDataRoot(input: ProjectMemoryRootInput): string {
  return path.join(resolveOpenCodeDataRoot(input), "project-memory", "v1");
}

export function resolveProjectMemoryStore(input: ProjectMemoryRootInput): ProjectMemoryStore | null {
  const canonicalRoot = canonicalProjectRoot(input);
  if (canonicalRoot == null) return null;
  const projectRef = `project_${sha256(canonicalRoot).slice(0, 32)}`;
  const dataRoot = resolveProjectMemoryDataRoot(input);
  return {
    canonicalRoot,
    dataRoot,
    projectRef,
    storeRoot: path.join(dataRoot, projectRef),
  };
}

export function pathContainedByRoot(candidate: string, root: string): boolean {
  const relative = path.relative(root, candidate);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function sanitizeCandidateInput(input: ProjectMemoryCandidateInput, store: ProjectMemoryStore): ProjectMemoryCandidateInput {
  const paths = uniqueStrings((input.appliesTo?.paths ?? []).map((value) => normalizeRepositorySelector(value, "applies_to.paths")));
  const symbols = uniqueStrings((input.appliesTo?.symbols ?? []).map((value) => requiredText(value, "applies_to.symbols")));
  const evidencePaths = uniqueStrings((input.evidencePaths ?? []).map((value) => normalizeRepositorySelector(value, "evidence_paths")));
  const sanitize = (value: unknown, field: string) => sanitizeMemoryText(requiredText(value, field), store.canonicalRoot);
  const triggers = uniqueStrings(input.triggers.map((value) => sanitize(value, "triggers")));
  if (triggers.length === 0) throw new ProjectMemoryError("invalid-field", "Project memory requires at least one trigger.");
  return {
    title: sanitize(input.title, "title"),
    kind: input.kind,
    confidence: input.confidence,
    triggers,
    appliesTo: {
      paths,
      symbols: symbols.map((value) => sanitizeMemoryText(value, store.canonicalRoot)),
    },
    evidencePaths,
    technique: sanitize(input.technique, "technique"),
    why: sanitize(input.why, "why"),
    evidence: sanitize(input.evidence, "evidence"),
    invalidatedWhen: sanitize(input.invalidatedWhen, "invalidated_when"),
  };
}

async function appendFixedSlot(
  directory: string,
  prefix: "card" | "event",
  width: number,
  limit: number,
  content: string,
): Promise<string> {
  await fs.promises.mkdir(directory, { recursive: true });
  for (let index = 0; index < limit; index += 1) {
    const fileName = `${prefix}-${String(index).padStart(width, "0")}.md`;
    const filePath = path.join(directory, fileName);
    try {
      await fs.promises.writeFile(filePath, content, { encoding: "utf8", flag: "wx" });
      return fileName;
    } catch (error) {
      if (errorCode(error) === "EEXIST") continue;
      throw new ProjectMemoryError("store-write", `Project memory could not append ${prefix} event.`, { cause: error });
    }
  }
  throw new ProjectMemoryError("capacity", `Project memory ${prefix} capacity is exhausted.`);
}

async function readSlotEntries(directory: string, pattern: RegExp): Promise<fs.Dirent[]> {
  let entries: fs.Dirent[];
  try {
    entries = await fs.promises.readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (errorCode(error) === "ENOENT") return [];
    throw new ProjectMemoryError("store-read", "Project memory could not enumerate its local store.", { cause: error });
  }
  return entries
    .filter((entry) => pattern.test(entry.name))
    .sort((left, right) => left.name.localeCompare(right.name));
}

function assertCorpusEnvelope(cardCount: number, lifecycleCount: number): void {
  if (
    cardCount > PROJECT_MEMORY_CARD_LIMIT
    || lifecycleCount > PROJECT_MEMORY_LIFECYCLE_LIMIT
    || cardCount + lifecycleCount > PROJECT_MEMORY_EVENT_LIMIT
  ) {
    throw new ProjectMemoryError("corpus-envelope", "Project memory store exceeds its fixed corpus envelope.");
  }
}

async function assertWritableEnvelope(store: ProjectMemoryStore): Promise<void> {
  const [cards, lifecycle] = await Promise.all([
    readSlotEntries(path.join(store.storeRoot, "cards"), CARD_SLOT_PATTERN),
    readSlotEntries(path.join(store.storeRoot, "events"), EVENT_SLOT_PATTERN),
  ]);
  assertCorpusEnvelope(cards.length, lifecycle.length);
}

async function readSlotDirectory(
  directory: string,
  pattern: RegExp,
  maximumBytes: number,
): Promise<Array<{ name: string; content: string }>> {
  const files = await readSlotEntries(directory, pattern);
  const result: Array<{ name: string; content: string }> = [];
  for (const entry of files) {
    const filePath = path.join(directory, entry.name);
    try {
      const stat = await fs.promises.lstat(filePath);
      if (!stat.isFile() || stat.isSymbolicLink() || stat.size > maximumBytes) {
        throw new ProjectMemoryError("malformed-record", `Project memory record '${entry.name}' is unsafe or over limit.`);
      }
      result.push({ name: entry.name, content: await fs.promises.readFile(filePath, "utf8") });
    } catch (error) {
      if (error instanceof ProjectMemoryError) throw error;
      throw new ProjectMemoryError("store-read", `Project memory could not read record '${entry.name}'.`, { cause: error });
    }
  }
  return result;
}

function warningRef(fileName: string): string {
  return `record_${sha256(fileName).slice(0, 12)}`;
}

async function readProjectMemoryState(store: ProjectMemoryStore): Promise<{
  population: ProjectMemoryPopulation;
  events: Map<string, ProjectMemoryLifecycleEvent[]>;
}> {
  const warnings: string[] = [];
  const candidates = new Map<string, ProjectMemoryCandidate>();
  const events = new Map<string, ProjectMemoryLifecycleEvent[]>();
  const cardFiles = await readSlotDirectory(path.join(store.storeRoot, "cards"), CARD_SLOT_PATTERN, PROJECT_MEMORY_CANDIDATE_BYTES);
  const lifecycleFiles = await readSlotDirectory(path.join(store.storeRoot, "events"), EVENT_SLOT_PATTERN, PROJECT_MEMORY_LIFECYCLE_BYTES);
  assertCorpusEnvelope(cardFiles.length, lifecycleFiles.length);
  for (const file of cardFiles) {
    try {
      const candidate = parseCandidateMarkdown(file.content);
      if (candidates.has(candidate.cardRef)) throw new ProjectMemoryError("duplicate-card", "Project memory contains a duplicate card ref.");
      candidates.set(candidate.cardRef, candidate);
    } catch (error) {
      warnings.push(`malformed:${error instanceof ProjectMemoryError ? error.code : "unknown"}:${warningRef(file.name)}`);
    }
  }
  for (const file of lifecycleFiles) {
    try {
      const event = parseLifecycleMarkdown(file.content);
      const rows = events.get(event.cardRef) ?? [];
      rows.push(event);
      events.set(event.cardRef, rows);
    } catch (error) {
      warnings.push(`malformed:${error instanceof ProjectMemoryError ? error.code : "unknown"}:${warningRef(file.name)}`);
    }
  }
  const cards = [...candidates.values()].map((candidate): ProjectMemoryFoldedCard => {
    const lifecycle = events.get(candidate.cardRef) ?? [];
    const invalidations = lifecycle.filter((event): event is ProjectMemoryInvalidation => event.event === "invalidate");
    const promotions = lifecycle
      .filter((event): event is ProjectMemoryPromotion => event.event === "promote")
      .sort((left, right) => right.verifiedAt.localeCompare(left.verifiedAt) || left.eventRef.localeCompare(right.eventRef));
    const invalidated = invalidations.sort((left, right) => left.createdAt.localeCompare(right.createdAt) || left.eventRef.localeCompare(right.eventRef))[0];
    const promotion = promotions[0];
    return {
      ...candidate,
      status: invalidated ? "invalidated" : promotion ? "active" : "candidate",
      verifiedAt: promotion?.verifiedAt ?? null,
      fingerprints: promotion?.fingerprints ?? [],
      invalidationReason: invalidated?.reason ?? null,
    };
  });
  cards.sort((left, right) => left.cardRef.localeCompare(right.cardRef));
  return { population: { cards, warnings: uniqueStrings(warnings).sort() }, events };
}

export async function readProjectMemoryPopulation(store: ProjectMemoryStore): Promise<ProjectMemoryPopulation> {
  return (await readProjectMemoryState(store)).population;
}

async function fingerprintsForCandidate(store: ProjectMemoryStore, candidate: ProjectMemoryCandidate): Promise<ProjectMemoryFingerprint[]> {
  const fingerprints: ProjectMemoryFingerprint[] = [];
  for (const selector of candidate.evidencePaths) {
    const resolved = path.resolve(store.canonicalRoot, ...selector.split("/"));
    if (!pathContainedByRoot(resolved, store.canonicalRoot)) {
      throw new ProjectMemoryError("unsafe-selector", "Project memory evidence path escapes the project root.");
    }
    try {
      const stat = await fs.promises.lstat(resolved);
      if (!stat.isFile() || stat.isSymbolicLink()) {
        throw new ProjectMemoryError("evidence-file", `Project memory evidence '${selector}' is not a regular file.`);
      }
      fingerprints.push({ path: selector, sha256: sha256(await fs.promises.readFile(resolved)) });
    } catch (error) {
      if (error instanceof ProjectMemoryError) throw error;
      throw new ProjectMemoryError("evidence-file", `Project memory evidence '${selector}' is unavailable.`, { cause: error });
    }
  }
  return fingerprints;
}

export async function appendProjectMemoryCandidate(
  store: ProjectMemoryStore,
  input: ProjectMemoryCandidateInput,
  now = new Date(),
): Promise<ProjectMemoryManageResult> {
  await assertWritableEnvelope(store);
  assertCandidateEnums(input);
  const sanitized = sanitizeCandidateInput(input, store);
  const candidate: ProjectMemoryCandidate = {
    schemaVersion: 1,
    event: "candidate",
    eventRef: randomRef("event"),
    cardRef: randomRef("card"),
    title: sanitized.title,
    kind: sanitized.kind,
    createdAt: now.toISOString(),
    confidence: sanitized.confidence,
    triggers: sanitized.triggers,
    appliesTo: {
      paths: sanitized.appliesTo?.paths ?? [],
      symbols: sanitized.appliesTo?.symbols ?? [],
    },
    evidencePaths: sanitized.evidencePaths ?? [],
    technique: sanitized.technique,
    why: sanitized.why,
    evidence: sanitized.evidence,
    invalidatedWhen: sanitized.invalidatedWhen,
  };
  const markdown = candidateMarkdown(candidate);
  if (byteLength(markdown) > PROJECT_MEMORY_CANDIDATE_BYTES) {
    throw new ProjectMemoryError("record-too-large", "Project memory candidate exceeds 16 KiB after redaction.");
  }
  await appendFixedSlot(path.join(store.storeRoot, "cards"), "card", 4, PROJECT_MEMORY_CARD_LIMIT, markdown);
  return {
    schemaVersion: 1,
    action: "candidate",
    cardRef: candidate.cardRef,
    eventRef: candidate.eventRef,
    status: "candidate",
    projectRef: store.projectRef,
  };
}

function requireCard(population: ProjectMemoryPopulation, cardRef: string): ProjectMemoryFoldedCard {
  if (!isProjectMemoryRef(cardRef, "card")) {
    throw new ProjectMemoryError("invalid-card-ref", "Project memory card ref is invalid.");
  }
  const card = population.cards.find((item) => item.cardRef === cardRef);
  if (!card) throw new ProjectMemoryError("card-not-found", `Project memory card '${cardRef}' was not found.`);
  return card;
}

export async function promoteProjectMemoryCandidate(
  store: ProjectMemoryStore,
  input: ProjectMemoryPromotionInput,
  now = new Date(),
): Promise<ProjectMemoryManageResult> {
  const { population, events } = await readProjectMemoryState(store);
  const card = requireCard(population, input.cardRef);
  if (card.status === "invalidated") throw new ProjectMemoryError("invalid-transition", `Project memory card '${card.cardRef}' is terminally invalidated.`);
  if (card.status === "active") {
    const activeEvent = events.get(card.cardRef)?.find((event): event is ProjectMemoryPromotion => event.event === "promote");
    return {
      schemaVersion: 1,
      action: "promote",
      cardRef: card.cardRef,
      eventRef: activeEvent?.eventRef ?? card.eventRef,
      status: "active",
      projectRef: store.projectRef,
    };
  }
  const verifiedAt = input.verifiedAt == null ? now.toISOString() : isoTime(input.verifiedAt, "verified_at");
  const promotion: ProjectMemoryPromotion = {
    schemaVersion: 1,
    event: "promote",
    eventRef: randomRef("event"),
    cardRef: card.cardRef,
    createdAt: now.toISOString(),
    verifiedAt,
    fingerprints: await fingerprintsForCandidate(store, card),
    evidence: sanitizeMemoryText(requiredText(input.evidence, "evidence"), store.canonicalRoot),
  };
  const markdown = promotionMarkdown(promotion);
  if (byteLength(markdown) > PROJECT_MEMORY_LIFECYCLE_BYTES) {
    throw new ProjectMemoryError("record-too-large", "Project memory promotion exceeds 4 KiB after redaction.");
  }
  await appendFixedSlot(path.join(store.storeRoot, "events"), "event", 6, PROJECT_MEMORY_LIFECYCLE_LIMIT, markdown);
  return {
    schemaVersion: 1,
    action: "promote",
    cardRef: card.cardRef,
    eventRef: promotion.eventRef,
    status: "active",
    projectRef: store.projectRef,
  };
}

export async function invalidateProjectMemoryCard(
  store: ProjectMemoryStore,
  input: ProjectMemoryInvalidationInput,
  now = new Date(),
): Promise<ProjectMemoryManageResult> {
  const { population, events } = await readProjectMemoryState(store);
  const card = requireCard(population, input.cardRef);
  if (card.status === "invalidated") {
    const invalidationEvent = events.get(card.cardRef)?.find((event): event is ProjectMemoryInvalidation => event.event === "invalidate");
    return {
      schemaVersion: 1,
      action: "invalidate",
      cardRef: card.cardRef,
      eventRef: invalidationEvent?.eventRef ?? card.eventRef,
      status: "invalidated",
      projectRef: store.projectRef,
    };
  }
  const invalidation: ProjectMemoryInvalidation = {
    schemaVersion: 1,
    event: "invalidate",
    eventRef: randomRef("event"),
    cardRef: card.cardRef,
    createdAt: now.toISOString(),
    reason: sanitizeMemoryText(requiredText(input.reason, "reason"), store.canonicalRoot),
  };
  const markdown = invalidationMarkdown(invalidation);
  if (byteLength(markdown) > PROJECT_MEMORY_LIFECYCLE_BYTES) {
    throw new ProjectMemoryError("record-too-large", "Project memory invalidation exceeds 4 KiB after redaction.");
  }
  await appendFixedSlot(path.join(store.storeRoot, "events"), "event", 6, PROJECT_MEMORY_LIFECYCLE_LIMIT, markdown);
  return {
    schemaVersion: 1,
    action: "invalidate",
    cardRef: card.cardRef,
    eventRef: invalidation.eventRef,
    status: "invalidated",
    projectRef: store.projectRef,
  };
}

export async function projectMemoryFingerprintStatus(
  store: ProjectMemoryStore,
  fingerprint: ProjectMemoryFingerprint,
): Promise<ProjectMemoryFingerprintStatus> {
  const resolved = path.resolve(store.canonicalRoot, ...fingerprint.path.split("/"));
  if (!pathContainedByRoot(resolved, store.canonicalRoot)) return "unsafe";
  try {
    const stat = await fs.promises.lstat(resolved);
    if (!stat.isFile() || stat.isSymbolicLink()) return "unavailable";
    return sha256(await fs.promises.readFile(resolved)) === fingerprint.sha256 ? "match" : "mismatch";
  } catch (error) {
    return errorCode(error) === "ENOENT" ? "missing" : "unavailable";
  }
}
