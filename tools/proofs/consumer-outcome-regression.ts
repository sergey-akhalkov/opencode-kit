#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { captureLane, type CaptureFailureKind, type SessionMode } from "./consumer-outcome/capture.ts";
import {
  type Expectation,
  ContractError,
  governedSourceIdentity,
  loadDecisionGapPack,
  loadManifest,
  writeNewFile,
} from "./consumer-outcome/contracts.ts";
import { evaluateBundle, evaluateDecisionGapPack, gateCurrent, loadGateInputs, readBundle, replayEvaluation } from "./consumer-outcome/evaluate.ts";

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
  pack: "claim-evidence" | "general";
  repoRoot: string;
  sessionMode: SessionMode;
};

function usage(): string {
  return [
    "Usage:",
    "  node tools/proofs/consumer-outcome-regression.ts --help",
    "  node tools/proofs/consumer-outcome-regression.ts -h",
    "  node tools/proofs/consumer-outcome-regression.ts --mode preflight [--pack general|claim-evidence] [--root <path>] [--source-ref HEAD|working-tree]",
    "  node tools/proofs/consumer-outcome-regression.ts --mode baseline --candidate-id <id> --evidence-root <absolute-new-path> [--source-ref HEAD]",
    "  node tools/proofs/consumer-outcome-regression.ts --mode capture --candidate-id <id> --evidence-root <absolute-new-path> [--pack general|claim-evidence] [--candidate-config-dir <path>] [--source-ref HEAD]",
    "  node tools/proofs/consumer-outcome-regression.ts --mode replay --baseline <path> [--candidate <path>] [--pack general|claim-evidence] [--expectation no-regression|improvement|baseline-establishment]",
    "  node tools/proofs/consumer-outcome-regression.ts --mode evaluate --baseline <path> [--candidate <path>] [--expectation no-regression|improvement|baseline-establishment]",
    "  node tools/proofs/consumer-outcome-regression.ts --mode gate [--source-ref HEAD|working-tree] [--candidate <path>] [--candidate-request <path>]",
    "",
    "Inputs: reviewed config/consumer-outcome-regression.json, fixture seeds, optional candidate-request JSON, optional preserved bundles.",
    "Effects: help, preflight, replay, evaluate, and gate are provider-free and create no session, process, network, or provider call.",
    "         baseline/capture write one create-new evidence root and disposable fixtures; they never mutate the baseline pointer.",
    "Focused pack: claim-evidence is fixed to one sample per arm, eight configured-provider requests, explicit decision oracles, and no-regression.",
    "              It supports preflight/capture/replay/evaluate only and cannot establish or promote the maintained baseline.",
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
      if (value !== "general" && value !== "claim-evidence") throw new Error("Invalid pack");
      options.pack = value;
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
  return options;
}

function defaultRoot(): string {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
}

function emit(value: unknown): void {
  console.log(JSON.stringify(value));
}

async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2));
  if (options.help || options.mode === "help") {
    console.log(usage());
    return;
  }
  const focused = options.pack === "claim-evidence" ? loadDecisionGapPack(options.repoRoot) : null;
  const loaded = focused == null
    ? loadManifest(options.repoRoot)
    : { digest: focused.digest, manifest: focused.pack.manifest };
  if (focused != null && (options.mode === "baseline" || options.mode === "gate")) {
    throw new Error("The claim-evidence pack cannot establish, promote, or gate the maintained baseline pointer.");
  }
  if (focused != null && options.expectation !== "no-regression") {
    throw new Error("The claim-evidence pack requires the explicit no-regression expectation.");
  }
  if (options.mode === "preflight") {
    const source = governedSourceIdentity(options.repoRoot, options.gitRef, loaded.manifest.governedSourcePaths);
    emit({
      governedDigest: source.governedDigest,
      mode: "preflight",
      modelCalls: 0,
      pack: options.pack,
      scenarioDigest: loaded.digest,
      scenarioIds: loaded.manifest.scenarios.map((scenario) => scenario.id),
      status: "ready",
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
        expectation: "no-regression",
        pack: focused.pack,
      });
    emit({ evaluation, liveCalls: 0, mode: options.mode });
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
  if (focused != null && options.baselinePath != null) throw new Error("The claim-evidence pack uses one matched capture and does not accept --baseline.");
  const bundle = await captureLane(loaded.manifest, loaded.digest, {
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
