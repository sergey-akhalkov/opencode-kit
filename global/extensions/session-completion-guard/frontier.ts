export const GRIND_FRONTIER_TOOL = "grind_frontier";

export const GRIND_FRONTIER_LIMITS = {
  maxFrontierBytes: 32_768,
  maxItems: 16,
  maxDependencies: 64,
  maxGates: 16,
  maxDecisions: 8,
  maxRefsPerField: 4,
  maxStringBytes: 256,
} as const;

const REF_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const REF_SCHEMA = { type: "string", minLength: 1, maxLength: 128, pattern: "^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$" } as const;
const REF_ARRAY_SCHEMA = { type: "array", maxItems: GRIND_FRONTIER_LIMITS.maxRefsPerField, uniqueItems: true, items: REF_SCHEMA } as const;
const ITEM_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    id: REF_SCHEMA,
    requirementRefs: REF_ARRAY_SCHEMA,
    status: { enum: ["pending", "running", "complete", "deferred", "blocked"] },
    dependsOn: REF_ARRAY_SCHEMA,
    gateRefs: REF_ARRAY_SCHEMA,
    evidenceRefs: REF_ARRAY_SCHEMA,
  },
  required: ["id", "requirementRefs", "status", "dependsOn", "gateRefs", "evidenceRefs"],
} as const;
const GATE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    id: REF_SCHEMA,
    kind: { enum: ["product-decision", "process", "technical", "capability", "external", "safety", "live-attempt", "writer-liveness"] },
    status: { enum: ["open", "satisfied", "stale"] },
    affectedItemRefs: REF_ARRAY_SCHEMA,
    resumeCondition: { type: "string", minLength: 1, maxLength: GRIND_FRONTIER_LIMITS.maxStringBytes },
    evidenceRefs: REF_ARRAY_SCHEMA,
  },
  required: ["id", "kind", "status", "affectedItemRefs", "resumeCondition", "evidenceRefs"],
} as const;
const DECISION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    id: REF_SCHEMA,
    questionRef: REF_SCHEMA,
    affectedItemRefs: REF_ARRAY_SCHEMA,
    optionInvariantItemRefs: REF_ARRAY_SCHEMA,
    decisionPoint: { type: "string", minLength: 1, maxLength: GRIND_FRONTIER_LIMITS.maxStringBytes },
    evidenceRefs: REF_ARRAY_SCHEMA,
  },
  required: ["id", "questionRef", "affectedItemRefs", "optionInvariantItemRefs", "decisionPoint", "evidenceRefs"],
} as const;

export const GRIND_FRONTIER_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    expectedGeneration: { type: "integer", minimum: 0 },
    acceptedOutcomeRef: REF_SCHEMA,
    items: { type: "array", maxItems: GRIND_FRONTIER_LIMITS.maxItems, items: ITEM_SCHEMA },
    gates: { type: "array", maxItems: GRIND_FRONTIER_LIMITS.maxGates, items: GATE_SCHEMA },
    parkedDecisions: { type: "array", maxItems: GRIND_FRONTIER_LIMITS.maxDecisions, items: DECISION_SCHEMA },
    progressFingerprint: { type: "string", minLength: 1, maxLength: GRIND_FRONTIER_LIMITS.maxStringBytes },
  },
  required: ["expectedGeneration", "acceptedOutcomeRef", "items", "gates", "parkedDecisions", "progressFingerprint"],
} as const;

export type WorkFrontierItem = {
  dependsOn: string[];
  evidenceRefs: string[];
  gateRefs: string[];
  id: string;
  requirementRefs: string[];
  status: "pending" | "running" | "complete" | "deferred" | "blocked";
};

export type WorkFrontierGate = {
  affectedItemRefs: string[];
  evidenceRefs: string[];
  id: string;
  kind: "product-decision" | "process" | "technical" | "capability" | "external" | "safety" | "live-attempt" | "writer-liveness";
  resumeCondition: string;
  status: "open" | "satisfied" | "stale";
};

export type WorkFrontierDecision = {
  affectedItemRefs: string[];
  decisionPoint: string;
  evidenceRefs: string[];
  id: string;
  optionInvariantItemRefs: string[];
  questionRef: string;
};

export type WorkFrontierInput = {
  acceptedOutcomeRef: string;
  expectedGeneration: number;
  gates: WorkFrontierGate[];
  items: WorkFrontierItem[];
  parkedDecisions: WorkFrontierDecision[];
  progressFingerprint: string;
};

export type WorkFrontier = Omit<WorkFrontierInput, "expectedGeneration"> & {
  basisHumanRef: string;
  frontierGeneration: number;
  schemaVersion: 1;
  taskStateDigest: string;
};

export type WorkFrontierAssessment = {
  frontier: WorkFrontier;
  frontierState: "complete" | "product-decision" | "runnable" | "waiting";
  openGateRefs: string[];
  parkedDecisionRefs: string[];
  runnableItemRefs: string[];
};

export type PersistedWorkFrontierProjection = {
  assessment: WorkFrontierAssessment | null;
  errorCode: string | null;
  status: "absent" | "invalid" | "present";
};

export class FrontierValidationError extends Error {
  readonly code: string;

  constructor(code: string, options?: { cause?: unknown }) {
    super(code);
    this.name = "FrontierValidationError";
    this.code = code;
    if (options != null && "cause" in options) {
      Object.defineProperty(this, "cause", { configurable: true, value: options.cause });
    }
  }
}

function fail(code: string): never {
  throw new FrontierValidationError(code);
}

function record(value: unknown, code: string): Record<string, unknown> {
  if (value == null || typeof value !== "object" || Array.isArray(value)) fail(code);
  return value as Record<string, unknown>;
}

function parseRecord(value: unknown): Record<string, unknown> | null {
  if (value != null && typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
  if (typeof value !== "string") return null;
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed != null && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

function exactKeys(value: Record<string, unknown>, keys: string[], code: string): void {
  if (Object.keys(value).sort().join("\n") !== [...keys].sort().join("\n")) fail(code);
}

function integer(value: unknown, code: string, minimum = 0): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < minimum) fail(code);
  return value;
}

function ref(value: unknown, code: string): string {
  if (typeof value !== "string" || !REF_PATTERN.test(value)) fail(code);
  return value;
}

function text(value: unknown, code: string): string {
  if (typeof value !== "string" || value.trim() === "" || new TextEncoder().encode(value).byteLength > GRIND_FRONTIER_LIMITS.maxStringBytes) fail(code);
  return value;
}

function refs(value: unknown, code: string): string[] {
  if (!Array.isArray(value) || value.length > GRIND_FRONTIER_LIMITS.maxRefsPerField) fail(code);
  const result = value.map((item) => ref(item, code));
  if (new Set(result).size !== result.length) fail(code);
  return result;
}

function parseItem(value: unknown): WorkFrontierItem {
  const input = record(value, "invalid-item");
  exactKeys(input, ["dependsOn", "evidenceRefs", "gateRefs", "id", "requirementRefs", "status"], "invalid-item");
  const status = input.status;
  if (status !== "pending" && status !== "running" && status !== "complete" && status !== "deferred" && status !== "blocked") fail("invalid-item-status");
  return {
    id: ref(input.id, "invalid-item-id"),
    requirementRefs: refs(input.requirementRefs, "limit-requirementRefs"),
    status,
    dependsOn: refs(input.dependsOn, "limit-dependsOn"),
    gateRefs: refs(input.gateRefs, "limit-gateRefs"),
    evidenceRefs: refs(input.evidenceRefs, "limit-item-evidenceRefs"),
  };
}

function parseGate(value: unknown): WorkFrontierGate {
  const input = record(value, "invalid-gate");
  exactKeys(input, ["affectedItemRefs", "evidenceRefs", "id", "kind", "resumeCondition", "status"], "invalid-gate");
  const kind = input.kind;
  if (kind !== "product-decision" && kind !== "process" && kind !== "technical" && kind !== "capability" && kind !== "external" && kind !== "safety" && kind !== "live-attempt" && kind !== "writer-liveness") fail("invalid-gate-kind");
  const status = input.status;
  if (status !== "open" && status !== "satisfied" && status !== "stale") fail("invalid-gate-status");
  return {
    id: ref(input.id, "invalid-gate-id"),
    kind,
    status,
    affectedItemRefs: refs(input.affectedItemRefs, "limit-affectedItemRefs"),
    resumeCondition: text(input.resumeCondition, "limit-resumeCondition"),
    evidenceRefs: refs(input.evidenceRefs, "limit-gate-evidenceRefs"),
  };
}

function parseDecision(value: unknown): WorkFrontierDecision {
  const input = record(value, "invalid-decision");
  exactKeys(input, ["affectedItemRefs", "decisionPoint", "evidenceRefs", "id", "optionInvariantItemRefs", "questionRef"], "invalid-decision");
  return {
    id: ref(input.id, "invalid-decision-id"),
    questionRef: ref(input.questionRef, "invalid-question-ref"),
    affectedItemRefs: refs(input.affectedItemRefs, "limit-decision-affectedItemRefs"),
    optionInvariantItemRefs: refs(input.optionInvariantItemRefs, "limit-optionInvariantItemRefs"),
    decisionPoint: text(input.decisionPoint, "limit-decisionPoint"),
    evidenceRefs: refs(input.evidenceRefs, "limit-decision-evidenceRefs"),
  };
}

function parseInput(value: unknown): WorkFrontierInput {
  const input = record(value, "invalid-frontier-input");
  exactKeys(input, ["acceptedOutcomeRef", "expectedGeneration", "gates", "items", "parkedDecisions", "progressFingerprint"], "invalid-frontier-input");
  if (!Array.isArray(input.items) || input.items.length > GRIND_FRONTIER_LIMITS.maxItems) fail("limit-items");
  if (!Array.isArray(input.gates) || input.gates.length > GRIND_FRONTIER_LIMITS.maxGates) fail("limit-gates");
  if (!Array.isArray(input.parkedDecisions) || input.parkedDecisions.length > GRIND_FRONTIER_LIMITS.maxDecisions) fail("limit-decisions");
  return {
    expectedGeneration: integer(input.expectedGeneration, "invalid-expected-generation"),
    acceptedOutcomeRef: ref(input.acceptedOutcomeRef, "invalid-outcome-ref"),
    items: input.items.map(parseItem),
    gates: input.gates.map(parseGate),
    parkedDecisions: input.parkedDecisions.map(parseDecision),
    progressFingerprint: text(input.progressFingerprint, "limit-progressFingerprint"),
  };
}

function uniqueIds(values: Array<{ id: string }>, code: string): void {
  if (new Set(values.map((value) => value.id)).size !== values.length) fail(code);
}

function assertAcyclic(items: WorkFrontierItem[]): void {
  const byId = new Map(items.map((item) => [item.id, item]));
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (id: string): void => {
    if (visiting.has(id)) fail("dependency-cycle");
    if (visited.has(id)) return;
    visiting.add(id);
    for (const dependency of byId.get(id)?.dependsOn ?? []) visit(dependency);
    visiting.delete(id);
    visited.add(id);
  };
  for (const id of [...byId.keys()].sort()) visit(id);
}

function dependencyClosure(start: string[], items: Map<string, WorkFrontierItem>): Set<string> {
  const closure = new Set(start);
  let changed = true;
  while (changed) {
    changed = false;
    for (const item of items.values()) {
      if (closure.has(item.id) || !item.dependsOn.some((dependency) => closure.has(dependency))) continue;
      closure.add(item.id);
      changed = true;
    }
  }
  return closure;
}

function validateRelations(input: WorkFrontierInput): void {
  uniqueIds(input.items, "duplicate-item-id");
  uniqueIds(input.gates, "duplicate-gate-id");
  uniqueIds(input.parkedDecisions, "duplicate-decision-id");
  const items = new Map(input.items.map((item) => [item.id, item]));
  const gates = new Map(input.gates.map((gate) => [gate.id, gate]));
  if (input.items.reduce((total, item) => total + item.dependsOn.length, 0) > GRIND_FRONTIER_LIMITS.maxDependencies) fail("limit-dependencies");
  for (const item of input.items) {
    if (item.dependsOn.some((dependency) => !items.has(dependency) || dependency === item.id)) fail("invalid-dependency-ref");
    if (item.gateRefs.some((gate) => !gates.has(gate))) fail("invalid-item-gate-ref");
  }
  for (const gate of input.gates) {
    if (gate.affectedItemRefs.some((item) => !items.has(item))) fail("invalid-gate-item-ref");
    if (gate.affectedItemRefs.some((item) => !items.get(item)?.gateRefs.includes(gate.id))) fail("inconsistent-gate-item-ref");
  }
  for (const item of input.items) {
    if (item.gateRefs.some((gate) => !gates.get(gate)?.affectedItemRefs.includes(item.id))) fail("inconsistent-item-gate-ref");
  }
  assertAcyclic(input.items);
  for (const decision of input.parkedDecisions) {
    if (decision.affectedItemRefs.length === 0 || decision.affectedItemRefs.some((item) => !items.has(item))) fail("invalid-decision-item-ref");
    if (decision.optionInvariantItemRefs.some((item) => !items.has(item))) fail("invalid-option-invariant-ref");
    const matchingGate = input.gates.find((gate) => gate.kind === "product-decision" && decision.affectedItemRefs.every((item) => gate.affectedItemRefs.includes(item)));
    if (matchingGate == null) fail("missing-product-decision-gate");
    const cone = dependencyClosure(matchingGate.affectedItemRefs, items);
    if (decision.optionInvariantItemRefs.some((item) => cone.has(item))) fail("option-invariant-in-dependency-cone");
  }
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value == null || typeof value !== "object") return value;
  const input = value as Record<string, unknown>;
  return Object.fromEntries(Object.keys(input).sort().map((key) => [key, stableValue(input[key])]));
}

function frontierBytes(value: WorkFrontier): number {
  return new TextEncoder().encode(`${JSON.stringify(stableValue(value), null, 2)}\n`).byteLength;
}

function assess(frontier: WorkFrontier): WorkFrontierAssessment {
  const itemById = new Map(frontier.items.map((item) => [item.id, item]));
  const gateById = new Map(frontier.gates.map((gate) => [gate.id, gate]));
  const runnableItemRefs = frontier.items
    .filter((item) => item.status === "pending"
      && item.dependsOn.every((dependency) => itemById.get(dependency)?.status === "complete")
      && item.gateRefs.every((gate) => gateById.get(gate)?.status === "satisfied"))
    .map((item) => item.id)
    .sort();
  const openGates = frontier.gates.filter((gate) => gate.status === "open");
  const openGateRefs = openGates.map((gate) => gate.id).sort();
  const parkedDecisionRefs = frontier.parkedDecisions.map((decision) => decision.id).sort();
  let frontierState: WorkFrontierAssessment["frontierState"];
  if (runnableItemRefs.length > 0) frontierState = "runnable";
  else if (frontier.items.every((item) => item.status === "complete" || item.status === "deferred")) frontierState = "complete";
  else if (openGates.some((gate) => gate.kind === "product-decision") && parkedDecisionRefs.length > 0) frontierState = "product-decision";
  else if (openGates.some((gate) => gate.kind !== "product-decision")) frontierState = "waiting";
  else fail("unresolved-without-open-gate");
  return { frontier, frontierState, runnableItemRefs, openGateRefs, parkedDecisionRefs };
}

export function materializeWorkFrontier(
  value: unknown,
  context: { basisHumanRef: string; currentGeneration: number; taskStateDigest: string },
): WorkFrontierAssessment {
  const input = parseInput(value);
  const basisHumanRef = ref(context.basisHumanRef, "invalid-human-ref");
  if (!SHA256_PATTERN.test(context.taskStateDigest)) fail("invalid-task-state-digest");
  const currentGeneration = integer(context.currentGeneration, "invalid-current-generation");
  if (input.expectedGeneration !== currentGeneration) fail("stale-generation");
  validateRelations(input);
  const { expectedGeneration: _expectedGeneration, ...candidate } = input;
  const frontier: WorkFrontier = {
    ...candidate,
    basisHumanRef,
    frontierGeneration: currentGeneration + 1,
    schemaVersion: 1,
    taskStateDigest: context.taskStateDigest,
  };
  if (frontierBytes(frontier) > GRIND_FRONTIER_LIMITS.maxFrontierBytes) fail("limit-frontier-bytes");
  return assess(frontier);
}

export function parsePersistedWorkFrontier(value: unknown): WorkFrontierAssessment {
  const input = record(value, "invalid-persisted-frontier");
  exactKeys(input, ["acceptedOutcomeRef", "basisHumanRef", "frontierGeneration", "gates", "items", "parkedDecisions", "progressFingerprint", "schemaVersion", "taskStateDigest"], "invalid-persisted-frontier");
  if (input.schemaVersion !== 1) fail("unsupported-frontier-schema");
  const frontierGeneration = integer(input.frontierGeneration, "invalid-frontier-generation", 1);
  const basisHumanRef = ref(input.basisHumanRef, "invalid-human-ref");
  if (typeof input.taskStateDigest !== "string" || !SHA256_PATTERN.test(input.taskStateDigest)) fail("invalid-task-state-digest");
  const parsed = parseInput({
    acceptedOutcomeRef: input.acceptedOutcomeRef,
    expectedGeneration: frontierGeneration - 1,
    gates: input.gates,
    items: input.items,
    parkedDecisions: input.parkedDecisions,
    progressFingerprint: input.progressFingerprint,
  });
  validateRelations(parsed);
  const frontier: WorkFrontier = {
    acceptedOutcomeRef: parsed.acceptedOutcomeRef,
    basisHumanRef,
    frontierGeneration,
    gates: parsed.gates,
    items: parsed.items,
    parkedDecisions: parsed.parkedDecisions,
    progressFingerprint: parsed.progressFingerprint,
    schemaVersion: 1,
    taskStateDigest: input.taskStateDigest,
  };
  if (frontierBytes(frontier) > GRIND_FRONTIER_LIMITS.maxFrontierBytes) fail("limit-frontier-bytes");
  return assess(frontier);
}

export function projectPersistedWorkFrontier(sessionMetadata: unknown): PersistedWorkFrontierProjection {
  const metadata = parseRecord(sessionMetadata);
  const guard = parseRecord(metadata?.completionGuard) ?? parseRecord(metadata?.completion_guard);
  if (guard == null || guard.workFrontier == null) {
    return { assessment: null, errorCode: "missing-frontier", status: "absent" };
  }
  try {
    return { assessment: parsePersistedWorkFrontier(guard.workFrontier), errorCode: null, status: "present" };
  } catch (error) {
    return {
      assessment: null,
      errorCode: error instanceof FrontierValidationError ? error.code : "invalid-persisted-frontier",
      status: "invalid",
    };
  }
}

export function workFrontierBasisStatus(
  frontier: WorkFrontier | null,
  basis: { humanRef: string; taskStateDigest: string },
): "absent" | "current" | "stale" {
  if (frontier == null) return "absent";
  return frontier.basisHumanRef === basis.humanRef && frontier.taskStateDigest === basis.taskStateDigest ? "current" : "stale";
}
