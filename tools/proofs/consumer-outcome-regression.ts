#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { inventoryOpenSpecChanges } from "../../global/bin/openspec-change/inventory.ts";
import { parseOwnershipManifest } from "../../global/bin/openspec-change/ownership.ts";
import { inspectManagedPromptDrift } from "../opencode-runtime-sources.ts";
import { installedOpenCodeIdentity } from "./lib/opencode-proof-client.ts";
import { captureLane, type CaptureFailureKind, type SessionMode } from "./consumer-outcome/capture.ts";
import {
  type DecisionGapPack,
  type DecisionPackName,
  type Expectation,
  type SourceIdentity,
  ContractError,
  governedSourceIdentity,
  loadDecisionGapPack,
  loadManifest,
  posixPath,
  verifyFixtureSeed,
  writeNewFile,
} from "./consumer-outcome/contracts.ts";
import { evaluateBundle, evaluateDecisionGapPack, gateCurrent, loadGateInputs, readBundle, replayEvaluation } from "./consumer-outcome/evaluate.ts";
import { captureStatusScopeLane, statusScopeConfiguredRoutes } from "./consumer-outcome/status-scope.ts";

type Options = {
  baselinePath?: string;
  candidateConfigDir?: string;
  candidateId: string;
  candidatePath?: string;
  candidateRequestPath?: string;
  evidenceRoot?: string;
  expectation: Expectation | "baseline-establishment";
  failure: CaptureFailureKind;
  gitRef: string;
  help: boolean;
  mode: "help" | "preflight" | "baseline" | "capture" | "replay" | "evaluate" | "gate";
  opencodePath?: string;
  pack: DecisionPackName | "general";
  repoRoot: string;
  resultPath?: string;
  sessionMode: SessionMode;
};

function usage(): string {
  return [
    "Usage:",
    "  node tools/proofs/consumer-outcome-regression.ts --help",
    "  node tools/proofs/consumer-outcome-regression.ts -h",
    "  node tools/proofs/consumer-outcome-regression.ts --mode preflight [--pack general|claim-evidence|shift-left|status-scope] [--root <path>] [--source-ref HEAD|working-tree] [--opencode <absolute-path>]",
    "  node tools/proofs/consumer-outcome-regression.ts --mode baseline --candidate-id <id> --evidence-root <absolute-new-path> [--pack general|shift-left|status-scope] [--source-ref HEAD|working-tree] [--session-mode configured] [--opencode <absolute-path>]",
    "  node tools/proofs/consumer-outcome-regression.ts --mode capture --candidate-id <id> --evidence-root <absolute-new-path> [--pack general|claim-evidence|shift-left|status-scope] [--baseline <path>] [--candidate-config-dir <path>] [--source-ref HEAD|working-tree] [--session-mode configured] [--opencode <absolute-path>]",
    "  node tools/proofs/consumer-outcome-regression.ts --mode replay --baseline <path> [--candidate <path>] [--pack general|claim-evidence|shift-left|status-scope] [--expectation no-regression|improvement|baseline-establishment] [--result-path <absolute-new-path>]",
    "  node tools/proofs/consumer-outcome-regression.ts --mode evaluate --baseline <path> [--candidate <path>] [--expectation no-regression|improvement|baseline-establishment] [--result-path <absolute-new-path>]",
    "  node tools/proofs/consumer-outcome-regression.ts --mode gate [--source-ref HEAD|working-tree] [--candidate <path>] [--candidate-request <path>]",
    "",
    "Inputs: reviewed config/consumer-outcome-regression.json, fixture seeds, optional candidate-request JSON, optional preserved bundles.",
    "Effects: help, preflight, replay, evaluate, and gate are provider-free and create no session, process, network, or provider call; replay/evaluate write only an explicit create-new result path.",
    "         baseline/capture write one create-new evidence root and disposable fixtures; they never mutate the baseline pointer.",
    "Focused packs: claim-evidence uses one matched capture and at most eight configured-provider requests.",
    "               shift-left uses separate baseline/candidate captures, two scenarios, and at most four requests total.",
    "               status-scope uses one main response, one actual compaction, and one reconstruction call per arm, with six calls total.",
    "               All focused packs have exact decision oracles, bounded claims, provider-free replay, and cannot promote the maintained baseline pointer.",
    "Evidence: immutable bundle.json plus evaluation JSON on stdout. Sample bound 524288 bytes. Capture bound 8388608 bytes.",
    "Cleanup: capture deletes proof sessions, processes, and fixture roots in finally. Cleanup uncertainty blocks the next sample.",
    "Modes: baseline | capture | replay | evaluate | gate. Capture authorization is explicit and never implied by CI or validation.",
  ].join("\n");
}

function required(args: string[], index: number, name: string): string {
  const value = args[index + 1];
  if (value == null || value.trim() === "" || value.startsWith("--")) throw new Error(`Missing value for ${name}`);
  return value;
}

function parseOptions(args: string[]): Options {
  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    return {
      candidateId: "help",
      expectation: "no-regression",
      failure: "none",
      gitRef: "HEAD",
      help: true,
      mode: "help",
      pack: "general",
      repoRoot: defaultRoot(),
      sessionMode: "harness",
    };
  }
  const options: Options = {
    candidateId: "",
    expectation: "no-regression",
    failure: "none",
    gitRef: "HEAD",
    help: false,
    mode: "preflight",
    pack: "general",
    repoRoot: defaultRoot(),
    sessionMode: "harness",
  };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--help" || arg === "-h") options.help = true;
    else if (arg === "--mode") {
      const value = required(args, index, arg);
      if (value !== "preflight" && value !== "baseline" && value !== "capture" && value !== "replay" && value !== "evaluate" && value !== "gate") {
        throw new Error("Unknown mode");
      }
      options.mode = value;
      index += 1;
    } else if (arg === "--root") {
      options.repoRoot = path.resolve(required(args, index, arg));
      index += 1;
    } else if (arg === "--pack") {
      const value = required(args, index, arg);
      if (value !== "general" && value !== "claim-evidence" && value !== "shift-left" && value !== "status-scope") throw new Error("Invalid pack");
      options.pack = value;
      index += 1;
    } else if (arg === "--opencode") {
      options.opencodePath = path.resolve(required(args, index, arg));
      index += 1;
    } else if (arg === "--source-ref") {
      options.gitRef = required(args, index, arg);
      index += 1;
    } else if (arg === "--candidate-id") {
      options.candidateId = required(args, index, arg);
      index += 1;
    } else if (arg === "--evidence-root") {
      options.evidenceRoot = path.resolve(required(args, index, arg));
      index += 1;
    } else if (arg === "--baseline") {
      options.baselinePath = path.resolve(required(args, index, arg));
      index += 1;
    } else if (arg === "--candidate") {
      options.candidatePath = path.resolve(required(args, index, arg));
      index += 1;
    } else if (arg === "--candidate-request") {
      options.candidateRequestPath = path.resolve(required(args, index, arg));
      index += 1;
    } else if (arg === "--candidate-config-dir") {
      options.candidateConfigDir = path.resolve(required(args, index, arg));
      index += 1;
    } else if (arg === "--result-path") {
      const value = required(args, index, arg);
      if (!path.isAbsolute(value)) throw new Error("Result path must be absolute");
      options.resultPath = path.resolve(value);
      index += 1;
    } else if (arg === "--expectation") {
      const value = required(args, index, arg);
      if (value !== "no-regression" && value !== "improvement" && value !== "baseline-establishment") throw new Error("Invalid expectation");
      options.expectation = value;
      index += 1;
    } else if (arg === "--session-mode") {
      const value = required(args, index, arg);
      if (value !== "harness" && value !== "configured") throw new Error("Invalid session mode");
      options.sessionMode = value;
      index += 1;
    } else if (arg === "--inject-failure") {
      const value = required(args, index, arg);
      if (value !== "none" && value !== "model" && value !== "tool" && value !== "validation" && value !== "evidence" && value !== "timeout" && value !== "cleanup") {
        throw new Error("Invalid failure injection");
      }
      options.failure = value;
      index += 1;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }
  if (options.resultPath != null && options.mode !== "replay" && options.mode !== "evaluate") {
    throw new Error("Result path is supported only for replay/evaluate");
  }
  return options;
}

function defaultRoot(): string {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
}

function emit(value: unknown, resultPath?: string): void {
  const text = JSON.stringify(value);
  if (resultPath != null) writeNewFile(resultPath, `${text}\n`);
  console.log(text);
}

function statusScopePreflight(options: Options, pack: DecisionGapPack, source: SourceIdentity): Record<string, unknown> {
  if (pack.statusScope == null) throw new Error("status-scope metadata is missing");
  const activeConfigDir = process.env.OPENCODE_CONFIG_DIR?.trim();
  const expectedConfigDir = path.join(options.repoRoot, "global");
  if (activeConfigDir == null || path.resolve(activeConfigDir) !== path.resolve(expectedConfigDir)) {
    throw new Error("status-scope preflight requires OPENCODE_CONFIG_DIR to resolve to the kit global source");
  }
  const inventory = inventoryOpenSpecChanges(options.repoRoot);
  const changeId = "prevent-cross-layer-status-ambiguity";
  const ownership = inventory.changes.find((change) => change.changeId === changeId);
  const unresolved = inventory.overlaps.filter((overlap) => overlap.unresolved);
  if (ownership != null && (ownership.mutationEnabled !== true || ownership.ownership.status !== "present")) {
    throw new Error("status-scope ownership is missing, disabled, or overlapping");
  }
  const archiveRoot = path.join(options.repoRoot, "openspec", "changes", "archive");
  const archivedOwnershipPaths = ownership == null && fs.existsSync(archiveRoot)
    ? fs.readdirSync(archiveRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && (entry.name === changeId || entry.name.endsWith(`-${changeId}`)))
      .map((entry) => path.join(archiveRoot, entry.name, "ownership.json"))
      .filter((file) => fs.existsSync(file))
      .sort()
    : [];
  const archivedOwnership = archivedOwnershipPaths.length === 1
    ? parseOwnershipManifest(JSON.parse(fs.readFileSync(archivedOwnershipPaths[0], "utf8")))
    : null;
  if (unresolved.length > 0 || (ownership == null && (archivedOwnershipPaths.length !== 1 || archivedOwnership?.ok !== true || archivedOwnership.value.changeId !== changeId))) {
    throw new Error("status-scope ownership is missing, disabled, overlapping, or ambiguously archived");
  }
  if (options.opencodePath == null || !path.isAbsolute(options.opencodePath)) {
    throw new Error("status-scope preflight requires --opencode with an installed executable");
  }
  const openCode = installedOpenCodeIdentity(options.opencodePath);
  const routes = statusScopeConfiguredRoutes(activeConfigDir);
  const prompt = inspectManagedPromptDrift(
    path.join(options.repoRoot, "global", "opencode.json.template"),
    path.join(activeConfigDir, "opencode.json"),
  )[0];
  if (prompt?.status !== "same" || prompt.template == null || prompt.active == null) {
    throw new Error("status-scope compaction prompt source and active mirror differ");
  }
  const scenario = pack.manifest.scenarios[0];
  const fixture = verifyFixtureSeed(options.repoRoot, scenario);
  return {
    activeSource: {
      configDir: "global",
      resolution: "OPENCODE_CONFIG_DIR",
      sourceKind: "kit-custom",
    },
    baseline: {
      configDir: "global",
      governedDigest: source.governedDigest,
      pathDigests: source.pathDigests,
      sourceRef: source.gitRef,
    },
    candidate: {
      configDir: "global",
      sourcePlan: "same-kit-global-after-reviewed-instruction-edit",
    },
    cleanupContract: scenario.cleanupOracle,
    compactionPrompt: {
      markers: prompt.template.markers,
      restartBoundary: prompt.restartBoundary,
      sha256: prompt.template.sha256,
      status: prompt.status,
    },
    fixtureDigest: fixture.digest,
    foreignSourceMutationAllowed: false,
    modelRoutes: {
      compaction: `${routes.compaction.model}/${routes.compaction.variant}`,
      main: `${routes.main.model}/${routes.main.variant}`,
      profile: "active-config",
      requestedProfile: pack.manifest.profile,
    },
    openCode: {
      executable: `<installed-opencode>/${posixPath(path.basename(options.opencodePath))}`,
      sha256: openCode.sha256,
      version: openCode.version,
    },
    ownership: {
      changeId,
      lifecycle: ownership == null ? "archived" : "active",
      mutationEnabled: ownership?.mutationEnabled === true,
      overlappingChangeIds: [],
      overlappingWriterState: "clear",
    },
    permissions: scenario.permissions,
    scenarioMembers: pack.statusScope.memberOrder,
  };
}

async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2));
  if (options.help || options.mode === "help") {
    console.log(usage());
    return;
  }
  const focused = options.pack === "general" ? null : loadDecisionGapPack(options.repoRoot, options.pack);
  const loaded = focused == null
    ? loadManifest(options.repoRoot)
    : { digest: focused.digest, manifest: focused.pack.manifest };
  if (focused?.pack.name === "claim-evidence" && (options.mode === "baseline" || options.mode === "gate")) {
    throw new Error("The claim-evidence pack cannot establish, promote, or gate the maintained baseline pointer.");
  }
  if ((focused?.pack.name === "shift-left" || focused?.pack.name === "status-scope") && options.mode === "gate") {
    throw new Error(`The ${focused.pack.name} pack cannot gate or promote the maintained baseline pointer.`);
  }
  if (focused?.pack.name === "claim-evidence" && options.expectation !== "no-regression") {
    throw new Error("The claim-evidence pack requires the explicit no-regression expectation.");
  }
  if (focused?.pack.name === "shift-left" && options.expectation === "improvement") {
    throw new Error(`The ${focused.pack.name} pack supports baseline-establishment or no-regression only.`);
  }
  if (options.mode === "preflight") {
    const source = governedSourceIdentity(options.repoRoot, options.gitRef, loaded.manifest.governedSourcePaths);
    emit({
      governedDigest: source.governedDigest,
      mode: "preflight",
      modelCalls: 0,
      maximumClaim: focused?.pack.maximumClaim ?? "maintained two-scenario consumer no-regression for the recorded environment",
      pack: options.pack,
      captureByteLimit: loaded.manifest.captureByteLimit,
      configuredProviderRequestBound: focused == null
        ? Math.max(...loaded.manifest.scenarios.map((scenario) => scenario.configuredProviderRequestBound))
        : focused.pack.configuredProviderRequestBound,
      governedSourcePaths: loaded.manifest.governedSourcePaths,
      sampleByteLimit: loaded.manifest.sampleByteLimit,
      sampleCountPerArm: loaded.manifest.sampleCount,
      scenarioDigest: loaded.digest,
      scenarioIds: loaded.manifest.scenarios.map((scenario) => scenario.id),
      status: "ready",
      ...(focused?.pack.name === "status-scope" ? statusScopePreflight(options, focused.pack, source) : {}),
    });
    return;
  }
  if (options.mode === "replay" || options.mode === "evaluate") {
    if (options.baselinePath == null) throw new Error("Missing --baseline");
    const evaluation = focused == null
      ? replayEvaluation({
        baselinePath: options.baselinePath,
        candidatePath: options.candidatePath,
        expectation: options.expectation,
        manifest: loaded.manifest,
      })
      : evaluateDecisionGapPack({
        baseline: readBundle(options.baselinePath),
        candidate: options.candidatePath == null ? undefined : readBundle(options.candidatePath),
        expectation: (focused.pack.name === "shift-left" || focused.pack.name === "status-scope") && options.candidatePath == null
          ? "baseline-establishment"
          : options.expectation,
        pack: focused.pack,
      });
    emit({ evaluation, liveCalls: 0, mode: options.mode }, options.resultPath);
    return;
  }
  if (options.mode === "gate") {
    const { pointer } = loadGateInputs(options.repoRoot);
    const source = governedSourceIdentity(options.repoRoot, options.gitRef, loaded.manifest.governedSourcePaths);
    const evaluation = gateCurrent({
      candidatePath: options.candidatePath,
      candidateRequestPath: options.candidateRequestPath,
      currentSource: source,
      manifest: loaded.manifest,
      pointer,
      repoRoot: options.repoRoot,
    });
    emit({ evaluation, liveCalls: 0, mode: "gate" });
    if (evaluation.status === "failed" || evaluation.status === "blocked" || evaluation.status === "stale-evidence") process.exitCode = 1;
    return;
  }
  if (options.evidenceRoot == null || options.candidateId.trim() === "") throw new Error("baseline/capture require --candidate-id and --evidence-root");
  if (!path.isAbsolute(options.evidenceRoot)) throw new Error("Evidence root must be absolute");
  const source = governedSourceIdentity(options.repoRoot, options.gitRef, loaded.manifest.governedSourcePaths);
  if (focused?.pack.name === "claim-evidence" && options.baselinePath != null) throw new Error("The claim-evidence pack uses one matched capture and does not accept --baseline.");
  if ((focused?.pack.name === "shift-left" || focused?.pack.name === "status-scope") && options.mode === "capture" && options.baselinePath == null) {
    throw new Error(`The ${focused.pack.name} candidate capture requires --baseline for matched evaluation.`);
  }
  if (focused?.pack.name === "status-scope" && (options.sessionMode !== "configured" || options.opencodePath == null)) {
    throw new Error("The status-scope baseline/capture requires --session-mode configured and --opencode.");
  }
  const bundle = focused?.pack.name === "status-scope"
    ? await captureStatusScopeLane(focused.pack, loaded.digest, {
      arm: options.mode === "baseline" ? "baseline" : "candidate",
      candidateConfigDir: options.candidateConfigDir,
      candidateId: options.candidateId,
      evidenceRoot: options.evidenceRoot,
      executable: options.opencodePath!,
      repoRoot: options.repoRoot,
      sourceIdentity: source,
    })
    : await captureLane(loaded.manifest, loaded.digest, {
      candidateConfigDir: options.candidateConfigDir,
      candidateId: options.candidateId,
      evidenceRoot: options.evidenceRoot,
      failure: options.failure,
      gitRef: options.gitRef,
      kind: options.mode === "baseline" ? "baseline" : options.mode === "capture" && options.baselinePath != null ? "candidate" : "matched",
      repoRoot: options.repoRoot,
      sessionMode: options.sessionMode,
      sourceIdentity: source,
    });
  const evaluation = focused == null
    ? evaluateBundle({
      baseline: options.mode === "baseline" ? bundle : options.baselinePath != null ? readBundle(options.baselinePath) : bundle,
      candidate: options.mode === "capture" ? bundle : undefined,
      expectation: options.mode === "baseline" ? "baseline-establishment" : options.expectation,
      manifest: loaded.manifest,
    })
    : focused.pack.name === "shift-left" || focused.pack.name === "status-scope"
      ? evaluateDecisionGapPack({
        baseline: options.mode === "baseline" ? bundle : readBundle(options.baselinePath!),
        candidate: options.mode === "capture" ? bundle : undefined,
        expectation: options.mode === "baseline" ? "baseline-establishment" : options.expectation,
        pack: focused.pack,
      })
      : evaluateDecisionGapPack({
        baseline: bundle,
        candidate: bundle,
        expectation: "no-regression",
        pack: focused.pack,
      });
  writeNewFile(path.join(options.evidenceRoot, "evaluation.json"), `${JSON.stringify(evaluation, null, 2)}\n`);
  emit({
    bundlePath: path.join(options.evidenceRoot, "bundle.json"),
    evaluation,
    liveCalls: bundle.samples.reduce((sum, sample) => sum + sample.friction.configuredProviderRequestCount, 0),
    mode: options.mode,
    pointerMutated: false,
    sourceDigest: source.governedDigest,
  });
  const status = "evaluation" in evaluation ? evaluation.evaluation.status : evaluation.status;
  if (status === "failed" || status === "blocked") process.exitCode = 1;
}

if (process.argv[1] != null && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    const message = error instanceof ContractError ? `${error.field}: ${error.message}` : error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exit(1);
  });
}

export { main, parseOptions, usage };
