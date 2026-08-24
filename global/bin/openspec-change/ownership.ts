import {
  MAX_OWNERS,
  OPENSPEC_MANIFEST_SCHEMA_VERSION,
  SAFE_ID,
  SAFE_TOKEN,
  extraKeys,
  failIssues,
  plainRecord,
  readArray,
  readBoolean,
  readObject,
  readString,
  safeRelativePath,
  writeRootsOverlap,
  type ParseResult,
  type SchemaIssue,
} from "./manifest.ts";

export type OwnershipKind = "requirement" | "write-root";
export type DependencyKind = "planning-only" | "archive-before-acquire";
export type TransferCondition = "archived" | "explicit";
export type OwnershipRef = { type: OwnershipKind; capability?: string; requirement?: string; path?: string };
export type OwnershipDependency = { changeId: string; kind: DependencyKind; owners: OwnershipRef[]; transferCondition: string };
export type OwnershipTransfer = { fromChangeId: string; toChangeId: string; owners: OwnershipRef[]; condition: TransferCondition };
export type OwnershipCapability = { capability: string; requirements: string[] };
export type OwnershipManifest = {
  schemaVersion: typeof OPENSPEC_MANIFEST_SCHEMA_VERSION;
  changeId: string;
  mutationEnabled: boolean;
  capabilities: OwnershipCapability[];
  writeRoots: string[];
  dependencies: OwnershipDependency[];
  transfers: OwnershipTransfer[];
};
export type OwnershipOverlap = {
  leftChangeId: string;
  rightChangeId: string;
  kind: OwnershipKind;
  capability?: string;
  requirement?: string;
  writeRoot?: string;
  dependency: OwnershipDependency | null;
  transfer: OwnershipTransfer | null;
};

function collect(issues: SchemaIssue[], result: ParseResult<unknown>): void {
  if (!result.ok) issues.push(...result.issues);
}

function parseRef(value: unknown, path: string): ParseResult<OwnershipRef> {
  const object = readObject(value, path);
  if (!object.ok) return object;
  const issues = extraKeys(object.value, ["type", "capability", "requirement", "path"], path);
  const type = object.value.type;
  if (type === undefined) issues.push({ code: "missing", path: `${path}.type`, message: "Invalid input: expected string, received undefined" });
  else if (type !== "requirement" && type !== "write-root") issues.push({ code: "invalid", path: `${path}.type`, message: "Invalid owner type." });
  if (issues.length > 0) return failIssues(issues);
  const ref: OwnershipRef = { type };
  if (type === "requirement") {
    if (object.value.capability == null) issues.push({ code: "missing", path: `${path}.capability`, message: "Requirement owner requires capability." });
    if (object.value.requirement == null) issues.push({ code: "missing", path: `${path}.requirement`, message: "Requirement owner requires requirement." });
    if (object.value.path != null) issues.push({ code: "extra", path: `${path}.path`, message: "Requirement owner must not include path." });
    const capability = readString(object.value.capability, `${path}.capability`, SAFE_TOKEN);
    const requirement = readString(object.value.requirement, `${path}.requirement`);
    collect(issues, capability);
    collect(issues, requirement);
    if (issues.length > 0) return failIssues(issues);
    return { ok: true, value: { type, capability: capability.ok ? capability.value : "", requirement: requirement.ok ? requirement.value : "" } };
  }
  if (object.value.path == null) issues.push({ code: "missing", path: `${path}.path`, message: "Write-root owner requires path." });
  if (object.value.capability != null) issues.push({ code: "extra", path: `${path}.capability`, message: "Write-root owner must not include capability." });
  if (object.value.requirement != null) issues.push({ code: "extra", path: `${path}.requirement`, message: "Write-root owner must not include requirement." });
  const pathValue = readString(object.value.path, `${path}.path`);
  collect(issues, pathValue);
  if (pathValue.ok) {
    const escape = safeRelativePath(pathValue.value, `${path}.path`);
    if (escape) issues.push(escape);
  }
  if (issues.length > 0) return failIssues(issues);
  return { ok: true, value: { type, path: pathValue.ok ? pathValue.value : "" } };
}

function uniqueStrings(values: string[], path: string): SchemaIssue[] {
  const seen = new Set<string>();
  const issues: SchemaIssue[] = [];
  for (const [index, value] of values.entries()) {
    if (seen.has(value)) issues.push({ code: "invalid", path: `${path}.${index}`, message: `Duplicate value: ${value}.` });
    seen.add(value);
  }
  return issues;
}

export function parseOwnershipManifest(input: unknown): ParseResult<OwnershipManifest> {
  const object = readObject(input, "<root>");
  if (!object.ok) return object;
  const issues = extraKeys(object.value, ["schemaVersion", "changeId", "mutationEnabled", "capabilities", "writeRoots", "dependencies", "transfers"], "<root>");
  if (object.value.schemaVersion !== OPENSPEC_MANIFEST_SCHEMA_VERSION) {
    issues.push(object.value.schemaVersion === undefined
      ? { code: "missing", path: "schemaVersion", message: "Invalid input: expected number, received undefined" }
      : { code: "invalid", path: "schemaVersion", message: "schemaVersion must be 1." });
  }
  const changeId = readString(object.value.changeId, "changeId", SAFE_ID);
  const mutationEnabled = readBoolean(object.value.mutationEnabled, "mutationEnabled");
  const capabilitiesRaw = readArray(object.value.capabilities, "capabilities");
  const writeRootsRaw = readArray(object.value.writeRoots, "writeRoots");
  const dependenciesRaw = readArray(object.value.dependencies, "dependencies");
  const transfersRaw = readArray(object.value.transfers, "transfers");
  collect(issues, changeId);
  collect(issues, mutationEnabled);
  collect(issues, capabilitiesRaw);
  collect(issues, writeRootsRaw);
  collect(issues, dependenciesRaw);
  collect(issues, transfersRaw);
  if (!changeId.ok || !mutationEnabled.ok || !capabilitiesRaw.ok || !writeRootsRaw.ok || !dependenciesRaw.ok || !transfersRaw.ok) {
    return failIssues(issues);
  }
  const capabilities: OwnershipCapability[] = [];
  for (const [index, item] of capabilitiesRaw.value.entries()) {
    const record = readObject(item, `capabilities.${index}`);
    if (!record.ok) { issues.push(...record.issues); continue; }
    issues.push(...extraKeys(record.value, ["capability", "requirements"], `capabilities.${index}`));
    const capability = readString(record.value.capability, `capabilities.${index}.capability`, SAFE_TOKEN);
    const requirementsRaw = readArray(record.value.requirements, `capabilities.${index}.requirements`);
    collect(issues, capability);
    collect(issues, requirementsRaw);
    if (!capability.ok || !requirementsRaw.ok) continue;
    if (requirementsRaw.value.length === 0) issues.push({ code: "missing", path: `capabilities.${index}.requirements`, message: "Capability must declare at least one requirement." });
    const requirements: string[] = [];
    for (const [reqIndex, requirement] of requirementsRaw.value.entries()) {
      const parsed = readString(requirement, `capabilities.${index}.requirements.${reqIndex}`);
      collect(issues, parsed);
      if (parsed.ok) requirements.push(parsed.value);
    }
    issues.push(...uniqueStrings(requirements, `capabilities.${index}.requirements`));
    capabilities.push({ capability: capability.value, requirements });
  }
  const writeRoots: string[] = [];
  for (const [index, item] of writeRootsRaw.value.entries()) {
    const parsed = readString(item, `writeRoots.${index}`);
    collect(issues, parsed);
    if (!parsed.ok) continue;
    const escape = safeRelativePath(parsed.value, `writeRoots.${index}`);
    if (escape) issues.push(escape);
    else writeRoots.push(parsed.value);
  }
  const dependencies: OwnershipDependency[] = [];
  for (const [index, item] of dependenciesRaw.value.entries()) {
    const record = readObject(item, `dependencies.${index}`);
    if (!record.ok) { issues.push(...record.issues); continue; }
    issues.push(...extraKeys(record.value, ["changeId", "kind", "owners", "transferCondition"], `dependencies.${index}`));
    const depChangeId = readString(record.value.changeId, `dependencies.${index}.changeId`, SAFE_ID);
    const kind = record.value.kind;
    const ownersRaw = readArray(record.value.owners, `dependencies.${index}.owners`);
    const transferCondition = readString(record.value.transferCondition, `dependencies.${index}.transferCondition`);
    collect(issues, depChangeId);
    collect(issues, ownersRaw);
    collect(issues, transferCondition);
    if (kind !== "planning-only" && kind !== "archive-before-acquire") {
      issues.push(kind === undefined
        ? { code: "missing", path: `dependencies.${index}.kind`, message: "Invalid input: expected string, received undefined" }
        : { code: "invalid", path: `dependencies.${index}.kind`, message: "Invalid dependency kind." });
    }
    if (!depChangeId.ok || !ownersRaw.ok || !transferCondition.ok || (kind !== "planning-only" && kind !== "archive-before-acquire")) continue;
    if (depChangeId.value === changeId.value) issues.push({ code: "cycle", path: `dependencies.${index}.changeId`, message: "A change cannot depend on itself." });
    const owners: OwnershipRef[] = [];
    for (const [ownerIndex, owner] of ownersRaw.value.entries()) {
      const parsed = parseRef(owner, `dependencies.${index}.owners.${ownerIndex}`);
      collect(issues, parsed);
      if (parsed.ok) owners.push(parsed.value);
    }
    dependencies.push({ changeId: depChangeId.value, kind, owners, transferCondition: transferCondition.value });
  }
  const transfers: OwnershipTransfer[] = [];
  for (const [index, item] of transfersRaw.value.entries()) {
    const record = readObject(item, `transfers.${index}`);
    if (!record.ok) { issues.push(...record.issues); continue; }
    issues.push(...extraKeys(record.value, ["fromChangeId", "toChangeId", "owners", "condition"], `transfers.${index}`));
    const fromChangeId = readString(record.value.fromChangeId, `transfers.${index}.fromChangeId`, SAFE_ID);
    const toChangeId = readString(record.value.toChangeId, `transfers.${index}.toChangeId`, SAFE_ID);
    const ownersRaw = readArray(record.value.owners, `transfers.${index}.owners`);
    const condition = record.value.condition;
    collect(issues, fromChangeId);
    collect(issues, toChangeId);
    collect(issues, ownersRaw);
    if (condition !== "archived" && condition !== "explicit") {
      issues.push(condition === undefined
        ? { code: "missing", path: `transfers.${index}.condition`, message: "Invalid input: expected string, received undefined" }
        : { code: "invalid", path: `transfers.${index}.condition`, message: "Invalid transfer condition." });
    }
    if (!fromChangeId.ok || !toChangeId.ok || !ownersRaw.ok || (condition !== "archived" && condition !== "explicit")) continue;
    if (fromChangeId.value === toChangeId.value) issues.push({ code: "cycle", path: `transfers.${index}`, message: "Transfer source and target must differ." });
    const owners: OwnershipRef[] = [];
    for (const [ownerIndex, owner] of ownersRaw.value.entries()) {
      const parsed = parseRef(owner, `transfers.${index}.owners.${ownerIndex}`);
      collect(issues, parsed);
      if (parsed.ok) owners.push(parsed.value);
    }
    transfers.push({ fromChangeId: fromChangeId.value, toChangeId: toChangeId.value, owners, condition });
  }
  if (capabilities.length === 0 && writeRoots.length === 0) {
    issues.push({ code: "missing", path: "capabilities", message: "Manifest must declare at least one capability or write root." });
  }
  issues.push(...uniqueStrings(capabilities.map((item) => item.capability), "capabilities"));
  issues.push(...uniqueStrings(writeRoots.map((root) => root.replace(/\/+$/u, "")), "writeRoots"));
  issues.push(...uniqueStrings(dependencies.map((item) => item.changeId), "dependencies"));
  if (capabilities.length > MAX_OWNERS || writeRoots.length > MAX_OWNERS || dependencies.length > MAX_OWNERS || transfers.length > MAX_OWNERS) {
    issues.push({ code: "invalid", path: "<root>", message: `Ownership collections cannot exceed ${MAX_OWNERS} entries.` });
  }
  if (issues.length > 0) return failIssues(issues);
  return {
    ok: true,
    value: {
      schemaVersion: OPENSPEC_MANIFEST_SCHEMA_VERSION,
      changeId: changeId.value,
      mutationEnabled: mutationEnabled.value,
      capabilities,
      writeRoots,
      dependencies,
      transfers,
    },
  };
}

function requirementKey(capability: string, requirement: string): string {
  return `${capability}\u0000${requirement}`;
}

function declaredDependency(left: OwnershipManifest, right: OwnershipManifest): OwnershipDependency | null {
  return left.dependencies.find((item) => item.changeId === right.changeId)
    ?? right.dependencies.find((item) => item.changeId === left.changeId)
    ?? null;
}

function declaredTransfer(left: OwnershipManifest, right: OwnershipManifest): OwnershipTransfer | null {
  return left.transfers.find((item) =>
    (item.fromChangeId === left.changeId && item.toChangeId === right.changeId)
    || (item.fromChangeId === right.changeId && item.toChangeId === left.changeId),
  ) ?? right.transfers.find((item) =>
    (item.fromChangeId === left.changeId && item.toChangeId === right.changeId)
    || (item.fromChangeId === right.changeId && item.toChangeId === left.changeId),
  ) ?? null;
}

export function findOwnershipOverlaps(manifests: OwnershipManifest[]): OwnershipOverlap[] {
  const ordered = [...manifests].sort((left, right) => left.changeId.localeCompare(right.changeId));
  const overlaps: OwnershipOverlap[] = [];
  for (let i = 0; i < ordered.length; i++) {
    for (let j = i + 1; j < ordered.length; j++) {
      const left = ordered[i];
      const right = ordered[j];
      const dependency = declaredDependency(left, right);
      const transfer = declaredTransfer(left, right);
      const rightRequirements = new Set(right.capabilities.flatMap((item) => item.requirements.map((requirement) => requirementKey(item.capability, requirement))));
      for (const capability of left.capabilities) {
        for (const requirement of capability.requirements) {
          if (rightRequirements.has(requirementKey(capability.capability, requirement))) {
            overlaps.push({ leftChangeId: left.changeId, rightChangeId: right.changeId, kind: "requirement", capability: capability.capability, requirement, dependency, transfer });
          }
        }
      }
      for (const leftRoot of left.writeRoots) {
        for (const rightRoot of right.writeRoots) {
          if (writeRootsOverlap(leftRoot, rightRoot)) {
            overlaps.push({ leftChangeId: left.changeId, rightChangeId: right.changeId, kind: "write-root", writeRoot: [leftRoot, rightRoot].sort()[0], dependency, transfer });
          }
        }
      }
    }
  }
  return overlaps.sort((left, right) =>
    left.leftChangeId.localeCompare(right.leftChangeId)
    || left.rightChangeId.localeCompare(right.rightChangeId)
    || left.kind.localeCompare(right.kind)
    || (left.capability ?? "").localeCompare(right.capability ?? "")
    || (left.requirement ?? "").localeCompare(right.requirement ?? "")
    || (left.writeRoot ?? "").localeCompare(right.writeRoot ?? ""),
  );
}

export function findOwnershipCycles(manifests: OwnershipManifest[]): string[][] {
  const edges = new Map<string, string[]>();
  for (const manifest of manifests) {
    if (!edges.has(manifest.changeId)) edges.set(manifest.changeId, []);
    for (const dependency of manifest.dependencies) {
      const next = edges.get(manifest.changeId) ?? [];
      next.push(dependency.changeId);
      edges.set(manifest.changeId, next);
    }
  }
  const cycles: string[][] = [];
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const stack: string[] = [];
  const visit = (node: string): void => {
    if (visited.has(node)) return;
    if (visiting.has(node)) {
      cycles.push([...stack.slice(stack.indexOf(node)), node]);
      return;
    }
    visiting.add(node);
    stack.push(node);
    for (const next of (edges.get(node) ?? []).sort((left, right) => left.localeCompare(right))) visit(next);
    stack.pop();
    visiting.delete(node);
    visited.add(node);
  };
  for (const node of [...edges.keys()].sort((left, right) => left.localeCompare(right))) visit(node);
  return cycles.sort((left, right) => left.join(">").localeCompare(right.join(">")));
}

export function unresolvedOwnershipConflict(overlap: OwnershipOverlap, left: OwnershipManifest, right: OwnershipManifest, cycles: string[][]): boolean {
  if (cycles.some((cycle) => cycle.includes(left.changeId) && cycle.includes(right.changeId))) return true;
  if (overlap.dependency == null && overlap.transfer == null) return true;
  return left.mutationEnabled && right.mutationEnabled;
}
