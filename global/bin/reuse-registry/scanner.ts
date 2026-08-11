import path from "node:path";

import { runPortableCommand } from "../portable-process.ts";
import {
  generatedProjectSchema,
  REUSE_SCANNER_VERSION,
  REUSE_SCHEMA_VERSION,
  type Capability,
  type GeneratedProject,
  type PrivateConfig,
  type ProjectsFile,
  type ResolvedPlan,
} from "./contracts.ts";
import { assertRealDirectory, ReuseRegistryError, samePath, sha256 } from "./io.ts";

const sourceExtensions = new Set([".c", ".cc", ".cpp", ".cs", ".go", ".h", ".hpp", ".java", ".js", ".jsx", ".kt", ".kts", ".mjs", ".mts", ".py", ".rb", ".rs", ".swift", ".ts", ".tsx", ".vue"]);
const manifestNames = new Set(["Cargo.toml", "CMakeLists.txt", "Makefile", "build.gradle", "build.gradle.kts", "deno.json", "go.mod", "package.json", "pom.xml", "pyproject.toml"]);
const scanPolicyHash = sha256("reuse-registry:committed-tree:manifest-exports:scripts:exported-symbols:v1");

function git(root: string, args: string[], label: string): string {
  const result = runPortableCommand(root, ["git", ...args], { capture: true });
  if (result.error != null || result.status !== 0) {
    const cause = result.error ?? new Error(result.stderr.trim() || `exit ${String(result.status)}`);
    throw new ReuseRegistryError(`${label} failed`, "blocked", 5, { cause });
  }
  return result.stdout;
}

function committedText(root: string, commit: string, relative: string): string {
  return git(root, ["show", `${commit}:${relative}`], `Committed source read for ${relative}`);
}

function gitExists(root: string, object: string): boolean {
  const result = runPortableCommand(root, ["git", "cat-file", "-e", object], { capture: true });
  return result.error == null && result.status === 0;
}

function containsSymbol(text: string, symbol: string): boolean {
  const escaped = symbol.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`).test(text);
}

export function verifyCapabilitySource(config: PrivateConfig, capability: Capability): Record<string, unknown> {
  if (capability.project === "external") return { status: "not-applicable" };
  const binding = config.projects[capability.project];
  if (binding == null) return { reason: "project binding is unavailable", status: "unbound" };
  try {
    const root = assertRealDirectory(binding.root, `Project ${capability.project}`);
    const topLevel = git(root, ["rev-parse", "--show-toplevel"], `Git root resolution for ${capability.project}`).trim();
    if (!samePath(root, topLevel)) return { reason: "configured root is not the exact Git root", status: "stale" };
    const commit = git(root, ["rev-parse", binding.scanRef], `scanRef resolution for ${capability.project}`).trim();
    if (!gitExists(root, commit) || git(root, ["cat-file", "-t", commit], `commit type resolution for ${capability.project}`).trim() !== "commit") {
      return { reason: "configured scanRef is not a commit", scanRef: binding.scanRef, status: "stale" };
    }
    for (const entrypoint of capability.entrypoints) {
      if (!gitExists(root, `${commit}:${entrypoint.path}`)) {
        return { commit, entrypoint: entrypoint.path, reason: "entrypoint is missing", scanRef: binding.scanRef, status: "stale" };
      }
      const source = committedText(root, commit, entrypoint.path);
      if (entrypoint.symbol != null && !containsSymbol(source, entrypoint.symbol)) {
        return { commit, entrypoint: entrypoint.path, reason: `symbol is missing: ${entrypoint.symbol}`, scanRef: binding.scanRef, status: "stale" };
      }
      if (entrypoint.command != null) {
        let commandExists = source.includes(entrypoint.command);
        if (path.posix.basename(entrypoint.path) === "package.json") {
          try {
            const manifest = JSON.parse(source) as Record<string, unknown>;
            const scripts = manifest.scripts != null && typeof manifest.scripts === "object" && !Array.isArray(manifest.scripts)
              ? manifest.scripts as Record<string, unknown>
              : {};
            commandExists = Object.hasOwn(scripts, entrypoint.command);
          } catch {
            commandExists = false;
          }
        }
        if (!commandExists) {
          return { commit, entrypoint: entrypoint.path, reason: `command is missing: ${entrypoint.command}`, scanRef: binding.scanRef, status: "stale" };
        }
      }
    }
    for (const evidence of capability.evidence) {
      if (!gitExists(root, `${commit}:${evidence.path}`)) {
        return { commit, evidence: evidence.path, reason: "evidence is missing", scanRef: binding.scanRef, status: "stale" };
      }
    }
    return {
      commit,
      entrypoints: capability.entrypoints.map((entrypoint) => ({ ...entrypoint, status: "present" })),
      evidence: capability.evidence.map((item) => ({ path: item.path, status: "present" })),
      scanRef: binding.scanRef,
      status: "verified",
    };
  } catch (error) {
    return { reason: error instanceof ReuseRegistryError ? error.message : "source verification failed", scanRef: binding.scanRef, status: "stale" };
  }
}

function flattenExportPaths(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(flattenExportPaths);
  if (value != null && typeof value === "object") return Object.values(value as Record<string, unknown>).flatMap(flattenExportPaths);
  return [];
}

function normalizeExportPath(value: string): string | null {
  const normalized = value.replaceAll("\\", "/").replace(/^\.\//, "");
  if (normalized === "" || normalized.startsWith("../") || path.posix.isAbsolute(normalized)) return null;
  return normalized;
}

function exportedSymbols(text: string): string[] {
  const symbols = new Set<string>();
  const expression = /\bexport\s+(?:default\s+)?(?:async\s+)?(?:function|class|const|let|var|interface|type|enum)\s+([A-Za-z_$][\w$]*)/g;
  for (const match of text.matchAll(expression)) symbols.add(match[1]);
  return [...symbols].sort();
}

function projectFileName(project: string): string {
  return `${sha256(project).slice(0, 16)}.json`;
}

export function generatedProjectPath(registryRoot: string, project: string): string {
  return path.join(registryRoot, "generated", "projects", projectFileName(project));
}

function packageOwner(manifest: string): string {
  const directory = path.posix.dirname(manifest);
  return directory === "." ? "root" : directory;
}

function classifyPath(relative: string): "docs" | "proofs" | "specs" | "tests" | null {
  const lower = relative.toLowerCase();
  if (/(^|\/)(?:test|tests|__tests__|spec)(\/|$)|\.(?:spec|test)\.[^.]+$/.test(lower)) return "tests";
  if (/(^|\/)(?:proof|proofs)(\/|$)/.test(lower)) return "proofs";
  if (/(^|\/)(?:openspec|specs)(\/|$)/.test(lower)) return "specs";
  if (/(^|\/)(?:doc|docs)(\/|$)|(?:^|\/)readme(?:\.[^/]+)?$/.test(lower)) return "docs";
  return null;
}

function verifyPlanBinding(config: PrivateConfig, project: ResolvedPlan["projects"][number]): string {
  const binding = config.projects[project.id];
  if (binding == null) throw new ReuseRegistryError(`Plan project is not configured: ${project.id}`);
  if (!samePath(binding.root, project.root)) throw new ReuseRegistryError(`Plan root does not match configured project: ${project.id}`);
  if (binding.scanRef !== project.scanRef) throw new ReuseRegistryError(`Plan scanRef does not match configured project: ${project.id}`);
  if ((binding.codebaseMemoryProject ?? null) !== (project.codebaseMemoryProject ?? null)) {
    throw new ReuseRegistryError(`Plan Codebase Memory identity does not match configured project: ${project.id}`);
  }
  return assertRealDirectory(project.root, `Project ${project.id}`);
}

export function scanProject(
  config: PrivateConfig,
  projects: ProjectsFile,
  plan: ResolvedPlan,
  project: ResolvedPlan["projects"][number],
): GeneratedProject {
  const root = verifyPlanBinding(config, project);
  const topLevel = git(root, ["rev-parse", "--show-toplevel"], `Git root resolution for ${project.id}`).trim();
  if (!samePath(root, topLevel)) throw new ReuseRegistryError(`Configured project root is not the exact Git root: ${project.id}`);
  const resolvedCommit = git(root, ["rev-parse", project.scanRef], `scanRef resolution for ${project.id}`).trim();
  if (git(root, ["cat-file", "-t", resolvedCommit], `commit type resolution for ${project.id}`).trim() !== "commit") {
    throw new ReuseRegistryError(`Configured scanRef does not resolve to a commit: ${project.id}`);
  }
  const treeLine = git(root, ["cat-file", "-p", resolvedCommit], `tree resolution for ${project.id}`)
    .split(/\r?\n/)
    .find((line) => line.startsWith("tree "));
  const resolvedTree = treeLine?.slice("tree ".length).trim() ?? "";
  if (resolvedCommit !== project.commit || resolvedTree !== project.tree) {
    throw new ReuseRegistryError(`Plan commit or tree drifted before scan: ${project.id}`, "conflict", 4);
  }
  const descriptor = projects.projects.find((candidate) => candidate.id === project.id);
  if (descriptor == null) throw new ReuseRegistryError(`Registry project is missing: ${project.id}`);

  const files = git(root, ["ls-tree", "-r", "--name-only", "-z", resolvedCommit], `tree listing for ${project.id}`)
    .split("\0")
    .filter((value) => value !== "")
    .map((value) => value.replaceAll("\\", "/"))
    .sort();
  const manifests = files.filter((file) => manifestNames.has(path.posix.basename(file)));
  const sourceFiles = files.filter((file) => sourceExtensions.has(path.posix.extname(file).toLowerCase()));
  const docs: string[] = [];
  const proofs: string[] = [];
  const specs: string[] = [];
  const tests: string[] = [];
  for (const file of files) {
    const classification = classifyPath(file);
    if (classification === "docs") docs.push(file);
    else if (classification === "proofs") proofs.push(file);
    else if (classification === "specs") specs.push(file);
    else if (classification === "tests") tests.push(file);
  }

  const packages: GeneratedProject["inventory"]["packages"] = [];
  const commands: GeneratedProject["inventory"]["commands"] = [];
  const dependencies: GeneratedProject["inventory"]["dependencies"] = [];
  const entrypoints: GeneratedProject["inventory"]["entrypoints"] = [];
  const exportedPaths = new Set<string>();
  for (const manifest of manifests.filter((file) => path.posix.basename(file) === "package.json")) {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(committedText(root, resolvedCommit, manifest)) as Record<string, unknown>;
    } catch (error) {
      throw new ReuseRegistryError(`Committed package manifest is malformed: ${manifest}`, "invalid", 2, { cause: error });
    }
    packages.push({ manifest, root: path.posix.dirname(manifest) === "." ? "." : path.posix.dirname(manifest) });
    for (const value of flattenExportPaths(parsed.exports ?? parsed.main)) {
      const normalized = normalizeExportPath(path.posix.join(path.posix.dirname(manifest), value));
      if (normalized != null && files.includes(normalized)) exportedPaths.add(normalized);
    }
    const scripts = parsed.scripts != null && typeof parsed.scripts === "object" && !Array.isArray(parsed.scripts)
      ? parsed.scripts as Record<string, unknown>
      : {};
    for (const [name, value] of Object.entries(scripts).filter((entry): entry is [string, string] => typeof entry[1] === "string").sort(([a], [b]) => a.localeCompare(b))) {
      commands.push({ name, value });
      if (/^(?:proof|start|serve|cli|bin)(?::|$)/.test(name)) entrypoints.push({ command: name, owner: packageOwner(manifest), path: manifest });
    }
    for (const [scope, key] of [["runtime", "dependencies"], ["development", "devDependencies"], ["optional", "optionalDependencies"], ["peer", "peerDependencies"]] as const) {
      const values = parsed[key] != null && typeof parsed[key] === "object" && !Array.isArray(parsed[key]) ? parsed[key] as Record<string, unknown> : {};
      for (const name of Object.keys(values).sort()) dependencies.push({ name, scope });
    }
  }

  for (const file of [...exportedPaths].sort()) {
    const symbols = exportedSymbols(committedText(root, resolvedCommit, file));
    if (symbols.length === 0) entrypoints.push({ command: `source:${file}`, owner: path.posix.dirname(file) || "root", path: file });
    else for (const symbol of symbols) entrypoints.push({ owner: path.posix.dirname(file) || "root", path: file, symbol });
  }

  const uniqueEntrypoints = [...new Map(entrypoints.map((entry) => [`${entry.path}:${entry.symbol ?? entry.command}`, entry])).values()]
    .sort((left, right) => `${left.path}:${left.symbol ?? left.command}`.localeCompare(`${right.path}:${right.symbol ?? right.command}`));
  const candidates: GeneratedProject["candidates"] = uniqueEntrypoints.map((entrypoint) => ({
    entrypoint,
    evidence: [entrypoint.path],
    id: `generated/${project.id}/${sha256(`${entrypoint.path}:${entrypoint.symbol ?? entrypoint.command}`).slice(0, 16)}`,
    state: "discovered",
    summary: `Untrusted discovered entrypoint ${entrypoint.symbol ?? entrypoint.command}`,
  }));

  const result: GeneratedProject = {
    candidates,
    inventory: {
      buildFiles: manifests,
      commands,
      dependencies: [...new Map(dependencies.map((item) => [`${item.scope}:${item.name}`, item])).values()].sort((left, right) => `${left.scope}:${left.name}`.localeCompare(`${right.scope}:${right.name}`)),
      docs,
      entrypoints: uniqueEntrypoints,
      manifests,
      packages,
      proofs,
      sourceFiles,
      specs,
      tests,
      unsupported: [],
    },
    project: project.id,
    repository: descriptor.repository,
    scanState: {
      lastSuccessfulCommit: resolvedCommit,
      mode: plan.mode,
      scanPolicyHash,
      scanRef: project.scanRef,
      scannerVersion: REUSE_SCANNER_VERSION,
      schemaVersion: REUSE_SCHEMA_VERSION,
      tree: resolvedTree,
    },
    version: REUSE_SCHEMA_VERSION,
  };
  const validated = generatedProjectSchema.safeParse(result);
  if (!validated.success) {
    const issue = validated.error.issues[0];
    throw new ReuseRegistryError(`Generated project validation failed at ${issue?.path.join(".") || "root"}: ${issue?.message || "invalid"}`);
  }
  return validated.data;
}
