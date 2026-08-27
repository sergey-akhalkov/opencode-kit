import fs from "node:fs";
import path from "node:path";

type RequirementOperation = "added" | "base" | "modified" | "removed";

export type WorkflowRequirement = {
  capability: string;
  name: string;
  operation: RequirementOperation;
  source: string;
};

export type WorkflowContractConflict = {
  contractId: string;
  forbidSources: string[];
  requireSources: string[];
};

export type WorkflowContractReport = {
  conflicts: WorkflowContractConflict[];
  effectiveRequirements: WorkflowRequirement[];
  operationCounts: Record<RequirementOperation, number>;
  problems: string[];
  status: "blocked" | "passed";
};

type ContractDefinition = {
  forbidSources: Array<{ marker: string; source: string }>;
  id: string;
  requirementNames: Set<string>;
};

const CONTRACTS: ContractDefinition[] = [
  {
    forbidSources: [
      {
        marker: "OpenSpec workflow retains removed completion ceremony",
        source: "tools/validators/devkit-contract.ts",
      },
      {
        marker: "Do not append a mandatory final retrospective",
        source: "global/skills/openspec-propose/SKILL.md",
      },
      {
        marker: "Optional retrospective or workflow feedback stays outside the product task graph",
        source: "global/skills/openspec-apply-change/SKILL.md",
      },
    ],
    id: "final-history-retrospective",
    requirementNames: new Set([
      "New OpenSpec changes schedule one final history retrospective",
      "Final history analysis uses the existing improvement contract",
      "Final history retrospective is an evidence-bound completion task",
    ]),
  },
];

function relativePath(root: string, file: string): string {
  return path.relative(root, file).replaceAll("\\", "/");
}

function directories(root: string): string[] {
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function operationAt(text: string, index: number): RequirementOperation | null {
  const headings = [...text.matchAll(/^## (ADDED|MODIFIED|REMOVED) Requirements\s*$/gm)]
    .filter((match) => (match.index ?? -1) < index);
  const heading = headings[headings.length - 1]?.[1];
  if (heading === "ADDED") return "added";
  if (heading === "MODIFIED") return "modified";
  if (heading === "REMOVED") return "removed";
  return null;
}

function parseRequirements(
  root: string,
  file: string,
  capability: string,
  delta: boolean,
  problems: string[],
): WorkflowRequirement[] {
  let text: string;
  try {
    text = fs.readFileSync(file, "utf8");
  } catch {
    problems.push(`workflow contract source could not be read: ${relativePath(root, file)}`);
    return [];
  }
  const requirements: WorkflowRequirement[] = [];
  for (const match of text.matchAll(/^### Requirement:\s+(.+?)\s*$/gm)) {
    const operation = delta ? operationAt(text, match.index ?? 0) : "base";
    if (operation == null) {
      problems.push(`delta requirement has no ADDED/MODIFIED/REMOVED owner: ${relativePath(root, file)}#${match[1]}`);
      continue;
    }
    requirements.push({
      capability,
      name: match[1],
      operation,
      source: relativePath(root, file),
    });
  }
  return requirements;
}

function requirementKey(requirement: Pick<WorkflowRequirement, "capability" | "name">): string {
  return `${requirement.capability}\u0000${requirement.name}`;
}

function loadRequirements(root: string, problems: string[]): WorkflowRequirement[] {
  const requirements: WorkflowRequirement[] = [];
  const specsRoot = path.join(root, "openspec", "specs");
  for (const capability of directories(specsRoot)) {
    const file = path.join(specsRoot, capability, "spec.md");
    if (fs.existsSync(file)) requirements.push(...parseRequirements(root, file, capability, false, problems));
  }

  const changesRoot = path.join(root, "openspec", "changes");
  for (const change of directories(changesRoot).filter((name) => name !== "archive")) {
    const changeSpecs = path.join(changesRoot, change, "specs");
    for (const capability of directories(changeSpecs)) {
      const file = path.join(changeSpecs, capability, "spec.md");
      if (fs.existsSync(file)) requirements.push(...parseRequirements(root, file, capability, true, problems));
    }
  }
  return requirements;
}

function effectiveRequirements(
  requirements: WorkflowRequirement[],
  problems: string[],
): WorkflowRequirement[] {
  const base = new Map<string, WorkflowRequirement>();
  const deltas = new Map<string, WorkflowRequirement[]>();
  for (const requirement of requirements) {
    const key = requirementKey(requirement);
    if (requirement.operation === "base") {
      if (base.has(key)) problems.push(`duplicate base workflow requirement: ${requirement.capability}#${requirement.name}`);
      else base.set(key, requirement);
      continue;
    }
    const values = deltas.get(key) ?? [];
    values.push(requirement);
    deltas.set(key, values);
  }

  const effective = new Map(base);
  for (const [key, operations] of deltas) {
    const removals = operations.filter((operation) => operation.operation === "removed");
    const present = operations.filter((operation) => operation.operation !== "removed");
    if (removals.length > 0 && present.length > 0) {
      problems.push(
        `active workflow deltas both remove and retain ${operations[0].capability}#${operations[0].name}: ${operations.map((item) => item.source).join(", ")}`,
      );
      continue;
    }
    if (removals.length > 0) effective.delete(key);
    else effective.set(key, present.sort((left, right) => left.source.localeCompare(right.source))[0]);
  }
  return [...effective.values()].sort((left, right) =>
    requirementKey(left).localeCompare(requirementKey(right)) || left.source.localeCompare(right.source)
  );
}

function activeForbidSources(root: string, definition: ContractDefinition): string[] {
  return definition.forbidSources.flatMap(({ marker, source }) => {
    const file = path.join(root, source);
    try {
      return fs.existsSync(file) && fs.readFileSync(file, "utf8").includes(marker) ? [source] : [];
    } catch {
      return [];
    }
  });
}

export function inspectWorkflowContracts(root: string): WorkflowContractReport {
  const resolvedRoot = path.resolve(root);
  const problems: string[] = [];
  const requirements = loadRequirements(resolvedRoot, problems);
  const effective = effectiveRequirements(requirements, problems);
  const operationCounts: Record<RequirementOperation, number> = {
    added: 0,
    base: 0,
    modified: 0,
    removed: 0,
  };
  for (const requirement of requirements) operationCounts[requirement.operation]++;

  const conflicts = CONTRACTS.flatMap((definition): WorkflowContractConflict[] => {
    const requireSources = effective
      .filter((requirement) => definition.requirementNames.has(requirement.name))
      .map((requirement) => requirement.source);
    const forbidSources = activeForbidSources(resolvedRoot, definition);
    if (requireSources.length === 0 || forbidSources.length === 0) return [];
    return [{
      contractId: definition.id,
      forbidSources: [...new Set(forbidSources)].sort(),
      requireSources: [...new Set(requireSources)].sort(),
    }];
  });

  return {
    conflicts,
    effectiveRequirements: effective,
    operationCounts,
    problems,
    status: conflicts.length === 0 && problems.length === 0 ? "passed" : "blocked",
  };
}

export function workflowContractDiagnostics(report: WorkflowContractReport): string[] {
  return [
    ...report.problems,
    ...report.conflicts.map((conflict) =>
      `workflow contract conflict '${conflict.contractId}': required by ${conflict.requireSources.join(", ")}; forbidden by ${conflict.forbidSources.join(", ")}`
    ),
  ];
}
