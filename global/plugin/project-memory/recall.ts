import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  ProjectMemoryError,
  pathContainedByRoot,
  projectMemoryFingerprintStatus,
  normalizeRepositorySelector,
  readProjectMemoryPopulation,
  sanitizeMemoryText,
  type ProjectMemoryFoldedCard,
  type ProjectMemoryStatus,
  type ProjectMemoryStore,
} from "./store.ts";

export const PROJECT_MEMORY_CAPSULE_BYTES = 8 * 1024;
export const PROJECT_MEMORY_RESULT_LIMIT = 7;
export const PROJECT_MEMORY_FRESH_DAYS = 180;
export const PROJECT_MEMORY_SERENA_FILE_LIMIT = 100;
export const PROJECT_MEMORY_SERENA_BYTES = 512 * 1024;
export const PROJECT_MEMORY_SERENA_CORE_BYTES = 2 * 1024;
export const PROJECT_MEMORY_RECALL_OUTPUT_BYTES = 16 * 1024;

const PROJECT_MEMORY_WARNING_LIMIT = 32;

const BM25_K1 = 1.2;
const BM25_B = 0.75;
const FIELD_WEIGHTS = {
  title: 3,
  triggers: 3,
  selectors: 4,
  body: 1,
} as const;
const CONFIDENCE_ORDER = { high: 3, medium: 2, low: 1 } as const;
const PRECEDENCE_HEADER = [
  "# Advisory Project Memory",
  "Current user instructions, source, specifications, and runtime evidence take precedence over recalled memory.",
  "",
].join("\n");

type ScoringField = keyof typeof FIELD_WEIGHTS;

type RecallCandidate = {
  ref: string;
  source: "local" | "serena";
  status: ProjectMemoryStatus;
  title: string;
  kind: ProjectMemoryFoldedCard["kind"] | "curated";
  confidence: ProjectMemoryFoldedCard["confidence"];
  verifiedAt: string | null;
  technique: string;
  why: string;
  evidence: string;
  invalidatedWhen: string;
  triggers: string[];
  appliesTo: ProjectMemoryFoldedCard["appliesTo"];
  eligible: boolean;
  exclusionReason: string | null;
};

type ScoringDocument = {
  candidate: RecallCandidate;
  fields: Record<ScoringField, string[]>;
};

type CuratedSerenaSource = {
  core: string;
  candidates: RecallCandidate[];
  warnings: string[];
};

export type ProjectMemoryRecallRequest = {
  query: string;
  path?: string;
  symbol?: string;
  statuses?: ProjectMemoryStatus[];
  limit?: number;
};

export type ProjectMemoryScoreEvidence = {
  bm25: number;
  exactTrigger: boolean;
  exactPath: boolean;
  exactSymbol: boolean;
  matchedTerms: number;
};

export type ProjectMemoryRecallResultItem = {
  ref: string;
  source: "local" | "serena";
  status: ProjectMemoryStatus;
  title: string;
  kind: ProjectMemoryFoldedCard["kind"] | "curated";
  confidence: ProjectMemoryFoldedCard["confidence"];
  verifiedAt: string | null;
  technique: string;
  why: string;
  evidence: string;
  appliesTo: ProjectMemoryFoldedCard["appliesTo"];
  eligible: boolean;
  exclusionReason: string | null;
  score: number;
  scoreEvidence: ProjectMemoryScoreEvidence;
};

export type ProjectMemoryRecallResult = {
  schemaVersion: 1;
  projectRef: string;
  results: ProjectMemoryRecallResultItem[];
  warnings: string[];
  omitted: number;
  truncated: boolean;
  coreIncluded: boolean;
  capsule: string;
};

function normalizedText(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/([\p{Ll}\p{Nd}])([\p{Lu}])/gu, "$1 $2")
    .replace(/([\p{Lu}])([\p{Lu}][\p{Ll}])/gu, "$1 $2")
    .toLowerCase();
}

export function tokenizeProjectMemory(value: string): string[] {
  return normalizedText(value).match(/[\p{L}\p{N}]+/gu) ?? [];
}

function normalizedPhrase(value: string): string {
  return tokenizeProjectMemory(value).join(" ");
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function boundedWarnings(values: string[]): string[] {
  const warnings = unique(values).sort();
  if (warnings.length <= PROJECT_MEMORY_WARNING_LIMIT) return warnings;
  return [
    ...warnings.slice(0, PROJECT_MEMORY_WARNING_LIMIT - 1),
    `warnings-truncated:${warnings.length - PROJECT_MEMORY_WARNING_LIMIT + 1}`,
  ];
}

function documentFor(candidate: RecallCandidate): ScoringDocument {
  return {
    candidate,
    fields: {
      title: tokenizeProjectMemory(candidate.title),
      triggers: tokenizeProjectMemory(candidate.triggers.join(" ")),
      selectors: tokenizeProjectMemory([...candidate.appliesTo.paths, ...candidate.appliesTo.symbols].join(" ")),
      body: tokenizeProjectMemory([candidate.technique, candidate.why, candidate.evidence, candidate.invalidatedWhen].join(" ")),
    },
  };
}

function termFrequency(tokens: string[], term: string): number {
  let count = 0;
  for (const token of tokens) if (token === term) count += 1;
  return count;
}

function bm25Score(documents: ScoringDocument[], document: ScoringDocument, terms: string[]): { score: number; matchedTerms: number } {
  if (documents.length === 0 || terms.length === 0) return { score: 0, matchedTerms: 0 };
  const matched = new Set<string>();
  let total = 0;
  for (const field of Object.keys(FIELD_WEIGHTS) as ScoringField[]) {
    const averageLength = documents.reduce((sum, row) => sum + row.fields[field].length, 0) / documents.length || 1;
    const tokens = document.fields[field];
    for (const term of terms) {
      const frequency = termFrequency(tokens, term);
      if (frequency === 0) continue;
      matched.add(term);
      const documentFrequency = documents.reduce(
        (count, row) => count + (row.fields[field].includes(term) ? 1 : 0),
        0,
      );
      const inverseDocumentFrequency = Math.log(1 + ((documents.length - documentFrequency + 0.5) / (documentFrequency + 0.5)));
      const denominator = frequency + BM25_K1 * (1 - BM25_B + BM25_B * (tokens.length / averageLength));
      total += FIELD_WEIGHTS[field] * inverseDocumentFrequency * ((frequency * (BM25_K1 + 1)) / denominator);
    }
  }
  return { score: total, matchedTerms: matched.size };
}

async function cardEligibility(
  store: ProjectMemoryStore,
  card: ProjectMemoryFoldedCard,
  now: Date,
): Promise<{ eligible: boolean; reason: string | null }> {
  if (card.status !== "active") return { eligible: false, reason: card.status };
  if (card.verifiedAt == null) return { eligible: false, reason: "missing-verification" };
  const age = now.getTime() - Date.parse(card.verifiedAt);
  if (!Number.isFinite(age) || age > PROJECT_MEMORY_FRESH_DAYS * 24 * 60 * 60 * 1_000) {
    return { eligible: false, reason: "stale-verification" };
  }
  for (const fingerprint of card.fingerprints) {
    const status = await projectMemoryFingerprintStatus(store, fingerprint);
    if (status === "missing") return { eligible: false, reason: "missing-evidence" };
    if (status !== "match") return { eligible: false, reason: status === "mismatch" ? "fingerprint-mismatch" : `evidence-${status}` };
  }
  return { eligible: true, reason: null };
}

function localRecallCandidate(
  card: ProjectMemoryFoldedCard,
  eligibility: { eligible: boolean; reason: string | null },
): RecallCandidate {
  return {
    ref: card.cardRef,
    source: "local",
    status: card.status,
    title: card.title,
    kind: card.kind,
    confidence: card.confidence,
    verifiedAt: card.verifiedAt,
    technique: card.technique,
    why: card.why,
    evidence: card.evidence,
    invalidatedWhen: card.invalidatedWhen,
    triggers: card.triggers,
    appliesTo: card.appliesTo,
    eligible: eligibility.eligible,
    exclusionReason: eligibility.reason,
  };
}

async function readRecallSources(store: ProjectMemoryStore, now: Date): Promise<{
  local: RecallCandidate[];
  curated: CuratedSerenaSource;
  warnings: string[];
}> {
  const warnings: string[] = [];
  let local: RecallCandidate[] = [];
  try {
    const population = await readProjectMemoryPopulation(store);
    warnings.push(...population.warnings);
    local = await Promise.all(population.cards.map(async (card) => localRecallCandidate(
      card,
      await cardEligibility(store, card, now),
    )));
  } catch (error) {
    warnings.push(`local:${error instanceof ProjectMemoryError ? error.code : "unavailable"}`);
  }
  const curated = await readCuratedSerena(store);
  warnings.push(...curated.warnings);
  return { local, curated, warnings: boundedWarnings(warnings) };
}

function exactPhrase(query: string, candidate: string): boolean {
  const phrase = normalizedPhrase(candidate);
  if (phrase === "") return false;
  return ` ${normalizedPhrase(query)} `.includes(` ${phrase} `);
}

function exactPathMatch(candidate: RecallCandidate, query: string, selector?: string): boolean {
  const normalizedQuery = normalizedText(query).replaceAll("\\", "/");
  return candidate.appliesTo.paths.some((candidatePath) => {
    const normalized = candidatePath.toLowerCase();
    return selector === normalized || normalizedQuery.includes(normalized);
  });
}

function exactSymbolMatch(candidate: RecallCandidate, query: string, symbol?: string): boolean {
  const normalizedQuery = normalizedText(query);
  return candidate.appliesTo.symbols.some((candidateSymbol) => {
    const normalized = normalizedText(candidateSymbol);
    return symbol === normalized || ` ${normalizedQuery} `.includes(` ${normalized} `);
  });
}

function truncateUtf8(value: string, maximumBytes: number): string {
  const bytes = Buffer.from(value, "utf8");
  if (bytes.length <= maximumBytes) return value;
  let end = Math.max(0, maximumBytes);
  while (end > 0 && (bytes[end] & 0xc0) === 0x80) end -= 1;
  return bytes.subarray(0, end).toString("utf8");
}

function curatedRef(relativePath: string): string {
  return `serena_${crypto.createHash("sha256").update(relativePath).digest("hex").slice(0, 16)}`;
}

async function readCuratedSerena(store: ProjectMemoryStore): Promise<CuratedSerenaSource> {
  const empty = (warning?: string): CuratedSerenaSource => ({
    core: "",
    candidates: [],
    warnings: warning == null ? [] : [warning],
  });
  const configuredRoot = path.join(store.canonicalRoot, ".serena", "memories");
  try {
    const rootStat = await fs.promises.lstat(configuredRoot);
    if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) throw new ProjectMemoryError("unsafe-source", "Curated Serena root is unsafe.");
    const memoryRoot = await fs.promises.realpath(configuredRoot);
    if (!pathContainedByRoot(memoryRoot, configuredRoot)) throw new ProjectMemoryError("unsafe-source", "Curated Serena root escapes containment.");
    const files: Array<{ absolutePath: string; relativePath: string; bytes: number; modifiedAt: string }> = [];
    let totalBytes = 0;
    const walk = async (directory: string, relativeDirectory: string): Promise<void> => {
      const entries = (await fs.promises.readdir(directory, { withFileTypes: true })).sort((left, right) => left.name.localeCompare(right.name));
      for (const entry of entries) {
        if (entry.isSymbolicLink()) throw new ProjectMemoryError("unsafe-source", "Curated Serena contains a symbolic link.");
        const absolutePath = path.join(directory, entry.name);
        const relativePath = path.posix.join(relativeDirectory, entry.name);
        const realPath = await fs.promises.realpath(absolutePath);
        if (!pathContainedByRoot(realPath, memoryRoot)) throw new ProjectMemoryError("unsafe-source", "Curated Serena entry escapes containment.");
        if (entry.isDirectory()) {
          await walk(realPath, relativePath);
          continue;
        }
        if (!entry.isFile() || path.extname(entry.name).toLowerCase() !== ".md") continue;
        const stat = await fs.promises.lstat(realPath);
        if (!stat.isFile() || stat.isSymbolicLink()) throw new ProjectMemoryError("unsafe-source", "Curated Serena entry is not a regular file.");
        files.push({ absolutePath: realPath, relativePath, bytes: stat.size, modifiedAt: stat.mtime.toISOString() });
        totalBytes += stat.size;
        if (files.length > PROJECT_MEMORY_SERENA_FILE_LIMIT || totalBytes > PROJECT_MEMORY_SERENA_BYTES) {
          throw new ProjectMemoryError("over-limit", "Curated Serena exceeds its fixed envelope.");
        }
      }
    };
    await walk(memoryRoot, "");
    let core = "";
    const candidates: RecallCandidate[] = [];
    for (const file of files) {
      const content = await fs.promises.readFile(file.absolutePath, "utf8");
      if (Buffer.byteLength(content, "utf8") !== file.bytes) throw new ProjectMemoryError("changed-during-read", "Curated Serena changed during bounded discovery.");
      const sanitized = sanitizeMemoryText(content, store.canonicalRoot);
      if (file.relativePath.toLowerCase() === "core.md") {
        core = truncateUtf8(sanitized, PROJECT_MEMORY_SERENA_CORE_BYTES);
        continue;
      }
      const heading = /^#\s+(.+)$/m.exec(sanitized)?.[1]?.trim();
      const memoryName = file.relativePath.replace(/\.md$/i, "");
      candidates.push({
        ref: curatedRef(file.relativePath),
        source: "serena",
        status: "active",
        title: heading ? `${memoryName} - ${heading}` : memoryName,
        kind: "curated",
        confidence: "medium",
        verifiedAt: file.modifiedAt,
        technique: sanitized,
        why: "Current curated Serena memory.",
        evidence: "",
        invalidatedWhen: "",
        triggers: [],
        appliesTo: { paths: [], symbols: [] },
        eligible: true,
        exclusionReason: null,
      });
    }
    return { core, candidates, warnings: [] };
  } catch (error) {
    const code = error instanceof ProjectMemoryError ? error.code : (error as NodeJS.ErrnoException)?.code;
    if (code === "ENOENT") return empty();
    return empty(`serena:${typeof code === "string" ? code : "unavailable"}`);
  }
}

function renderItem(item: ProjectMemoryRecallResultItem): string {
  return [
    `## ${item.title}`,
    `Ref: ${item.ref}; source: ${item.source}; confidence: ${item.confidence}; verified: ${item.verifiedAt ?? "unknown"}`,
    item.technique,
    `Why: ${item.why}`,
    "",
  ].join("\n");
}

function recallResultItem(
  candidate: RecallCandidate,
  score: number,
  scoreEvidence: ProjectMemoryScoreEvidence,
): ProjectMemoryRecallResultItem {
  return {
    ref: candidate.ref,
    source: candidate.source,
    status: candidate.status,
    title: candidate.title,
    kind: candidate.kind,
    confidence: candidate.confidence,
    verifiedAt: candidate.verifiedAt,
    technique: candidate.technique,
    why: candidate.why,
    evidence: candidate.evidence,
    appliesTo: candidate.appliesTo,
    eligible: candidate.eligible,
    exclusionReason: candidate.exclusionReason,
    score,
    scoreEvidence,
  };
}

function renderCapsule(
  items: ProjectMemoryRecallResultItem[],
  warnings: string[],
  core: string,
): { capsule: string; rendered: number; truncated: boolean } {
  const warningText = warnings.length > 0 ? `Warnings: ${warnings.join(", ")}\n\n` : "";
  const coreText = core === "" ? "" : `## Curated Project Core\n${core}\n\n`;
  let capsule = truncateUtf8(`${PRECEDENCE_HEADER}${warningText}${coreText}`, PROJECT_MEMORY_CAPSULE_BYTES);
  let rendered = 0;
  let truncated = Buffer.byteLength(`${PRECEDENCE_HEADER}${warningText}${coreText}`, "utf8") > PROJECT_MEMORY_CAPSULE_BYTES;
  for (const item of items) {
    const block = renderItem(item);
    const remaining = PROJECT_MEMORY_CAPSULE_BYTES - Buffer.byteLength(capsule, "utf8");
    if (remaining <= 0) {
      truncated = true;
      break;
    }
    if (Buffer.byteLength(block, "utf8") <= remaining) {
      capsule += block;
      rendered += 1;
      continue;
    }
    if (remaining >= 96) {
      capsule += truncateUtf8(block, remaining);
      rendered += 1;
    }
    truncated = true;
    break;
  }
  return { capsule, rendered, truncated };
}

function boundExplicitRecallResult(
  result: ProjectMemoryRecallResult,
  core: string,
): ProjectMemoryRecallResult {
  while (Buffer.byteLength(`${JSON.stringify(result, null, 2)}\n`, "utf8") > PROJECT_MEMORY_RECALL_OUTPUT_BYTES) {
    if (result.results.length === 0) throw new ProjectMemoryError("output-over-limit", "Project memory recall output exceeds 16 KiB.");
    result.results.pop();
    result.omitted += 1;
    result.truncated = true;
    const rendered = renderCapsule(result.results, result.warnings, core);
    result.results = result.results.slice(0, rendered.rendered);
    result.capsule = rendered.capsule;
  }
  return result;
}

export async function recallProjectMemory(
  store: ProjectMemoryStore,
  request: ProjectMemoryRecallRequest,
  options: { automatic?: boolean; now?: Date } = {},
): Promise<ProjectMemoryRecallResult> {
  const query = request.query.trim();
  if (query === "") throw new Error("Project memory recall query must be non-empty.");
  const limit = request.limit ?? PROJECT_MEMORY_RESULT_LIMIT;
  if (!Number.isInteger(limit) || limit < 1 || limit > PROJECT_MEMORY_RESULT_LIMIT) {
    throw new Error(`Project memory recall limit must be between 1 and ${PROJECT_MEMORY_RESULT_LIMIT}.`);
  }
  const pathSelector = request.path == null
    ? undefined
    : normalizeRepositorySelector(request.path, "path").toLowerCase();
  const symbolSelector = request.symbol == null ? undefined : normalizedText(request.symbol.trim());
  const automatic = options.automatic ?? false;
  const statuses = new Set(request.statuses ?? ["active"]);
  const now = options.now ?? new Date();
  const sources = await readRecallSources(store, now);
  const localCandidates = sources.local.filter((candidate) => automatic ? candidate.eligible : statuses.has(candidate.status));
  const curated = sources.curated;
  const included = automatic || statuses.has("active")
    ? [...localCandidates, ...curated.candidates]
    : localCandidates;
  const documents = included.map(documentFor);
  const terms = unique(tokenizeProjectMemory(query));
  const ranked = documents.flatMap((document): ProjectMemoryRecallResultItem[] => {
    const candidate = document.candidate;
    const bm25 = bm25Score(documents, document, terms);
    const trigger = candidate.triggers.some((candidateTrigger) => exactPhrase(query, candidateTrigger));
    const pathMatch = exactPathMatch(candidate, query, pathSelector);
    const symbolMatch = exactSymbolMatch(candidate, query, symbolSelector);
    const metadataMatch = trigger || pathMatch || symbolMatch;
    if (!metadataMatch && (bm25.matchedTerms < 2 || bm25.score < 1)) return [];
    const score = bm25.score + (trigger ? 8 : 0) + (pathMatch || symbolMatch ? 10 : 0);
    return [recallResultItem(candidate, score, {
        bm25: bm25.score,
        exactTrigger: trigger,
        exactPath: pathMatch,
        exactSymbol: symbolMatch,
        matchedTerms: bm25.matchedTerms,
    })];
  }).sort((left, right) => {
    const leftExact = Number(left.scoreEvidence.exactPath || left.scoreEvidence.exactSymbol);
    const rightExact = Number(right.scoreEvidence.exactPath || right.scoreEvidence.exactSymbol);
    return rightExact - leftExact
      || right.score - left.score
      || CONFIDENCE_ORDER[right.confidence] - CONFIDENCE_ORDER[left.confidence]
      || (right.verifiedAt ?? "").localeCompare(left.verifiedAt ?? "")
      || left.source.localeCompare(right.source)
      || left.ref.localeCompare(right.ref);
  });
  const selected = ranked.slice(0, limit);
  const rendered = renderCapsule(selected, sources.warnings, curated.core);
  const result: ProjectMemoryRecallResult = {
    schemaVersion: 1,
    projectRef: store.projectRef,
    results: selected.slice(0, rendered.rendered),
    warnings: sources.warnings,
    omitted: Math.max(0, ranked.length - rendered.rendered),
    truncated: rendered.truncated || ranked.length > selected.length,
    coreIncluded: curated.core !== "",
    capsule: rendered.capsule,
  };
  return automatic ? result : boundExplicitRecallResult(result, curated.core);
}

export async function revalidateProjectMemorySelection(
  store: ProjectMemoryStore,
  refs: string[],
  options: { now?: Date } = {},
): Promise<ProjectMemoryRecallResult> {
  const sources = await readRecallSources(store, options.now ?? new Date());
  const eligible = new Map(
    [...sources.local.filter((candidate) => candidate.eligible), ...sources.curated.candidates]
      .map((candidate) => [candidate.ref, candidate]),
  );
  const selected = refs.flatMap((ref): ProjectMemoryRecallResultItem[] => {
    const candidate = eligible.get(ref);
    return candidate == null ? [] : [recallResultItem(candidate, 0, {
      bm25: 0,
      exactTrigger: false,
      exactPath: false,
      exactSymbol: false,
      matchedTerms: 0,
    })];
  });
  const rendered = renderCapsule(selected, sources.warnings, sources.curated.core);
  return {
    schemaVersion: 1,
    projectRef: store.projectRef,
    results: selected.slice(0, rendered.rendered),
    warnings: sources.warnings,
    omitted: Math.max(0, refs.length - rendered.rendered),
    truncated: rendered.truncated || rendered.rendered < selected.length,
    coreIncluded: sources.curated.core !== "",
    capsule: rendered.capsule,
  };
}
