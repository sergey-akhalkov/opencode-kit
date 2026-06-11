type EvidenceScope = Record<string, unknown>;

type TypeGateRule = {
  taskType: string;
  from: string;
  to: string;
  fields: readonly string[];
  allowInfeasibleReason: boolean;
};

export type TypeGateValidationInput = {
  taskType: string | null;
  from: string;
  to: string;
  evidenceScopes: EvidenceScope[];
};

const structuredEvidenceSupportFields = [
  "command",
  "commands",
  "file",
  "files",
  "path",
  "paths",
  "fixture",
  "fixtures",
  "artifact",
  "artifacts",
  "metric",
  "metrics",
  "schema",
  "schemaFile",
  "validator",
  "cliContract",
  "generatedOutput",
  "generatedConfig",
  "output",
  "outputs",
] as const;

const typeGateRules = [
  {
    taskType: "bugfix",
    from: "Analyze",
    to: "Implementation",
    fields: ["reproduction", "characterization", "regressionTest", "infeasibleReason"],
    allowInfeasibleReason: true,
  },
  {
    taskType: "tooling",
    from: "Implementation",
    to: "Review",
    fields: ["toolingGate", "fixture", "validator", "cliContract", "generatedOutput"],
    allowInfeasibleReason: false,
  },
  {
    taskType: "config",
    from: "Implementation",
    to: "Review",
    fields: ["configGate", "schemaCheck", "fixture", "generatedConfig", "reloadPolicy", "limitsDefaults", "limits", "defaults"],
    allowInfeasibleReason: false,
  },
  {
    taskType: "performance",
    from: "Implementation",
    to: "Review",
    fields: ["benchmark", "profile", "loadTest", "sloEvidence", "infeasibleReason"],
    allowInfeasibleReason: true,
  },
  {
    taskType: "protocol",
    from: "Implementation",
    to: "Review",
    fields: ["goldenVectors", "negativeCases", "compatibilityVectors", "wireEvidence", "infeasibleReason"],
    allowInfeasibleReason: true,
  },
] as const satisfies readonly TypeGateRule[];

function isRecord(value: unknown): value is EvidenceScope {
  return typeof value === "object" && value != null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function supportValueHasContent(value: unknown): boolean {
  if (isNonEmptyString(value)) {
    return true;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return true;
  }
  if (Array.isArray(value)) {
    return value.some((item) => supportValueHasContent(item));
  }
  if (isRecord(value)) {
    return Object.values(value).some((item) => supportValueHasContent(item));
  }
  return false;
}

function hasStructuredEvidenceObject(value: EvidenceScope): boolean {
  return isNonEmptyString(value.summary) && structuredEvidenceSupportFields.some((field) => supportValueHasContent(value[field]));
}

function evidenceValueHasContent(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.some((item) => evidenceValueHasContent(item));
  }
  return isRecord(value) && hasStructuredEvidenceObject(value);
}

function hasInfeasibleReason(value: unknown): boolean {
  if (isNonEmptyString(value)) {
    return true;
  }
  return isRecord(value) && isNonEmptyString(value.reason);
}

function hasFieldEvidence(scope: EvidenceScope, field: string, allowInfeasibleReason: boolean): boolean {
  if (field === "infeasibleReason") {
    return allowInfeasibleReason && hasInfeasibleReason(scope[field]);
  }
  return evidenceValueHasContent(scope[field]);
}

function formatFields(fields: readonly string[]): string {
  if (fields.length <= 1) {
    return fields.join("");
  }
  return `${fields.slice(0, -1).join(", ")}, or ${fields[fields.length - 1]}`;
}

function findTypeGateRule(input: TypeGateValidationInput): TypeGateRule | null {
  return typeGateRules.find((rule) => rule.taskType === input.taskType && rule.from === input.from && rule.to === input.to) ?? null;
}

export function validateTypeSpecificEvidenceGate(input: TypeGateValidationInput): string | null {
  const rule = findTypeGateRule(input);
  if (!rule) {
    return null;
  }

  const hasEvidence = input.evidenceScopes.some((scope) => rule.fields.some((field) => hasFieldEvidence(scope, field, rule.allowInfeasibleReason)));
  if (hasEvidence) {
    return null;
  }

  return `${rule.taskType} ${rule.from} -> ${rule.to} requires structured ${formatFields(rule.fields)} evidence`;
}

export const autopilotLedgerTypeGateRules = typeGateRules.map((rule) => ({
  taskType: rule.taskType,
  from: rule.from,
  to: rule.to,
  fields: Array.from(rule.fields),
  allowInfeasibleReason: rule.allowInfeasibleReason,
}));
