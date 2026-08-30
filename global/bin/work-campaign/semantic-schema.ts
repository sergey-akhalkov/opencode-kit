import type { SemanticAssignment } from "./semantic-executor.ts";

type JsonSchema = Record<string, unknown>;

const string: JsonSchema = { type: "string" };
const integer: JsonSchema = { type: "integer" };
const stringArray: JsonSchema = { items: string, type: "array" };

function object(properties: Record<string, JsonSchema>): JsonSchema {
  return {
    additionalProperties: false,
    properties,
    required: Object.keys(properties),
    type: "object",
  };
}

function enumeration(values: readonly string[]): JsonSchema {
  return { enum: values, type: "string" };
}

function partition(assignment: SemanticAssignment): JsonSchema {
  return object({
    assignmentId: { const: assignment.assignmentId, type: "string" },
    blockIds: stringArray,
    candidateDigest: { const: assignment.candidateDigest, type: "string" },
    evidenceRefs: stringArray,
    id: string,
    inventoryDigest: string,
    producerSessionRef: string,
    recordType: { const: "partition-result", type: "string" },
    schemaVersion: { const: 1, type: "integer" },
    status: enumeration(["blocked", "complete", "unknown"]),
    workItemIds: stringArray,
  });
}

function workItem(assignment: SemanticAssignment): JsonSchema {
  return object({
    affectedPaths: stringArray,
    candidateDigest: { const: assignment.candidateDigest, type: "string" },
    confidence: enumeration(["high", "low", "medium", "unknown"]),
    effectClasses: stringArray,
    evidenceRefs: stringArray,
    id: string,
    impact: string,
    initialSeverity: enumeration(["P0", "P1", "P2", "P3", "unknown"]),
    likelyCause: string,
    ownedPaths: stringArray,
    principleRef: string,
    producerSessionRef: string,
    proposedOutcome: string,
    recordType: { const: "work-item", type: "string" },
    scenario: string,
    schemaVersion: { const: 1, type: "integer" },
    sourceBlockIds: stringArray,
    status: enumeration(["candidate", "confirmed", "duplicate", "falsified", "fixed-and-verified", "owner-required", "product-decision-required", "report-only", "unknown-material", "waiting"]),
  });
}

function reconciliation(assignment: SemanticAssignment): JsonSchema {
  return object({
    candidateDigest: { const: assignment.candidateDigest, type: "string" },
    disposition: enumeration(["confirmed", "duplicate", "falsified", "unknown"]),
    evidenceRefs: stringArray,
    id: string,
    producerSessionRef: string,
    recordType: { const: "reconciliation-result", type: "string" },
    schemaVersion: { const: 1, type: "integer" },
    severity: enumeration(["P0", "P1", "P2", "P3", "unknown"]),
    sourceDigest: string,
    workItemId: string,
  });
}

function missionBlocker(): JsonSchema {
  const nullableString: JsonSchema = { type: ["string", "null"] };
  const waitKinds = ["budget", "capability", "external", "live-attempt", "process", "safety", "technical", "writer-liveness"];
  return object({
    affectedItemRefs: stringArray,
    decisions: {
      items: object({
        affectedItemRefs: stringArray,
        decisionPoint: string,
        evidenceRefs: stringArray,
        id: string,
        optionInvariantItemRefs: stringArray,
        questionRef: string,
      }),
      type: "array",
    },
    disposition: enumeration(["product-decision-required", "waiting"]),
    evidenceRefs: stringArray,
    frontier: {
      anyOf: [
        { type: "null" },
        object({
          acceptedOutcomeRef: string,
          basisHumanRef: string,
          frontierGeneration: integer,
          progressFingerprint: string,
          taskStateDigest: string,
        }),
      ],
    },
    gates: {
      items: object({
        affectedItemRefs: stringArray,
        evidenceRefs: stringArray,
        id: string,
        kind: enumeration(["product-decision", ...waitKinds]),
        resumeCondition: string,
      }),
      type: "array",
    },
    resumeCondition: string,
    rootSessionRef: nullableString,
    source: enumeration(["completion-guard", "mission-preflight"]),
    waitKind: { enum: [null, ...waitKinds] },
  });
}

function investigation(): JsonSchema {
  return object({
    allowedObservations: stringArray,
    blocker: { anyOf: [{ type: "null" }, missionBlocker()] },
    budgets: object({ modelCalls: integer, wallClockSeconds: integer }),
    evidenceRefs: stringArray,
    id: string,
    producerSessionRef: string,
    question: string,
    recordType: { const: "investigation-result", type: "string" },
    result: enumeration(["confirmed", "falsified", "owner-required", "product-decision-required", "still-unknown", "waiting"]),
    schemaVersion: { const: 1, type: "integer" },
    sourceBlockIds: stringArray,
    workItemId: string,
  });
}

function wave(assignment: SemanticAssignment): JsonSchema {
  return object({
    campaignId: { const: assignment.campaignId, type: "string" },
    candidateDigest: { const: assignment.candidateDigest, type: "string" },
    definitionDigest: { const: assignment.definitionDigest, type: "string" },
    id: string,
    missionDefinitionDigest: string,
    recordType: { const: "wave-manifest", type: "string" },
    schemaVersion: { const: 1, type: "integer" },
    slices: {
      items: object({
        changeId: string,
        dependsOn: stringArray,
        effectClasses: stringArray,
        expectedProof: string,
        id: string,
        outcome: string,
        ownedPaths: stringArray,
        validationArgv: stringArray,
        workItemIds: stringArray,
      }),
      type: "array",
    },
    status: { const: "frozen", type: "string" },
    workItemIds: stringArray,
  });
}

function closure(assignment: SemanticAssignment): JsonSchema {
  return object({
    candidateDigest: { const: assignment.candidateDigest, type: "string" },
    challengeStatus: enumeration(["blocked", "complete", "unknown"]),
    definitionDigest: { const: assignment.definitionDigest, type: "string" },
    inventory: object({ blocked: integer, currentTerminal: integer, needsRereview: integer, total: integer }),
    ownershipStatus: enumeration(["blocked", "terminal", "unknown"]),
    proofStatus: enumeration(["blocked", "complete", "unknown"]),
    recordType: { const: "closure-matrix", type: "string" },
    reportDigest: string,
    schemaVersion: { const: 1, type: "integer" },
    terminalState: enumeration(["blocked", "complete", "owner-required", "product-decision-required", "unknown", "waiting"]),
    validationStatus: enumeration(["blocked", "complete", "unknown"]),
    waves: object({ archived: integer, checkpointed: integer, total: integer }),
    workItems: object({
      fixedAndVerified: integer,
      ownerRequired: integer,
      productDecisionRequired: integer,
      reportOnly: integer,
      resolved: integer,
      total: integer,
      unknownMaterial: integer,
      unresolvedP0P1: integer,
      waiting: integer,
    }),
  });
}

export function semanticPayloadSchema(assignment: SemanticAssignment): JsonSchema {
  if (assignment.assignmentType === "discovery") {
    return object({
      partition: partition(assignment),
      workItems: { items: workItem(assignment), type: "array" },
    });
  }
  if (assignment.assignmentType === "reconciliation") return object({ reconciliation: reconciliation(assignment) });
  if (assignment.assignmentType === "investigation") return object({ investigation: investigation() });
  if (assignment.assignmentType === "synthesis") return object({ wave: wave(assignment) });
  return object({ closure: closure(assignment) });
}
