#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

import { stableJson } from "./roadmap-mission/contracts.ts";
import {
  WorkCampaignError,
  loadWorkCampaignDefinition,
} from "./work-campaign/contracts.ts";
import {
  replayCampaign,
  resumeCampaign,
  runProviderFreeCampaign,
  statusCampaign,
  stopCampaign,
  verifyCampaign,
} from "./work-campaign/controller.ts";
import { preflightCampaign } from "./work-campaign/preflight.ts";
import {
  appendCampaignLedgerRecord,
  loadCampaignSeedRecord,
  materializeCampaignReport,
  readCampaignReport,
} from "./work-campaign/materializer.ts";
import {
  loadCampaignTransitionDescriptor,
  loadCampaignWriterAttestation,
  reconcileCampaignState,
  reconcileCampaignWriterLease,
  recordCampaignStopIntent,
  recordCampaignTransition,
  replayCampaignState,
} from "./work-campaign/state.ts";

type Operation = "contract-preflight" | "ledger-append" | "preflight" | "replay" | "report-materialize" | "report-readback" | "resume" | "run" | "state-record" | "state-reconcile" | "state-reconcile-writer" | "state-replay" | "state-stop" | "status" | "stop" | "verify";

type Options = {
  attestationPath: string;
  checkpointIdentity: string;
  definitionPath: string;
  eventPath: string;
  evidenceRef: string;
  help: boolean;
  globalSource: string;
  missionAdapterPath: string;
  operation: Operation;
  phaseInputPath: string;
  recordPath: string;
  root: string;
  stopSource: "operator" | "signal" | "supervisor";
  verificationInputPath: string;
};

function usage(): string {
  return [
    "Usage:",
    "  node global/bin/work-campaign.ts preflight --root <absolute-project-root> --definition <project-relative-json>",
    "  node global/bin/work-campaign.ts run --root <absolute-project-root> --definition <project-relative-json> --phase-input <project-relative-json> [--global-source <absolute-kit-global> --mission-adapter <project-relative-json> [--checkpoint-identity <identity>]]",
    "  node global/bin/work-campaign.ts resume --root <absolute-project-root> --definition <project-relative-json>",
    "  node global/bin/work-campaign.ts verify --root <absolute-project-root> --definition <project-relative-json> --verification-input <project-relative-json> [--global-source <absolute-kit-global> --mission-adapter <project-relative-json> [--checkpoint-identity <identity>]]",
    "  node global/bin/work-campaign.ts status --root <absolute-project-root> --definition <project-relative-json>",
    "  node global/bin/work-campaign.ts stop --root <absolute-project-root> --definition <project-relative-json> --source <operator|signal|supervisor> --evidence-ref <typed-ref>",
    "  node global/bin/work-campaign.ts replay --root <absolute-project-root> --definition <project-relative-json>",
    "  node global/bin/work-campaign.ts contract-preflight --root <absolute-project-root> --definition <project-relative-json>",
    "  node global/bin/work-campaign.ts state-record --root <absolute-project-root> --definition <project-relative-json> --event <project-relative-json>",
    "  node global/bin/work-campaign.ts state-replay --root <absolute-project-root> --definition <project-relative-json>",
    "  node global/bin/work-campaign.ts state-reconcile --root <absolute-project-root> --definition <project-relative-json> --event <project-relative-json>",
    "  node global/bin/work-campaign.ts state-reconcile-writer --root <absolute-project-root> --definition <project-relative-json> --attestation <project-relative-json>",
    "  node global/bin/work-campaign.ts state-stop --root <absolute-project-root> --definition <project-relative-json> --source <operator|signal|supervisor> --evidence-ref <typed-ref>",
    "  node global/bin/work-campaign.ts ledger-append --root <absolute-project-root> --definition <project-relative-json> --record <project-relative-json>",
    "  node global/bin/work-campaign.ts report-materialize --root <absolute-project-root> --definition <project-relative-json>",
    "  node global/bin/work-campaign.ts report-readback --root <absolute-project-root> --definition <project-relative-json>",
    "",
    "Effects:",
    "  --help/-h: none.",
    "  preflight: reads definition/adapter, exact Git/OpenSpec/candidate/state/writer identities, and performs no write.",
    "  run without mission options preserves the provider-free pause. With mission options it materializes one exact frozen mission, releases the campaign lease, invokes the existing mission controller, and stops before parent consumption.",
    "  resume consumes only a terminal correlated mission handoff, marks changed blocks for re-review, and regenerates the report. verify consumes one contained read-only re-review, non-self reconciliation, synthesis wave, or final challenge; synthesis requires explicit mission options and releases the campaign lease before invoking the existing mission. status/replay are read-only; stop records campaign and mission-owned stop intent.",
    "  contract-preflight: reads and validates the contained campaign definition and adapter only.",
    "  state-replay: reads and validates the contained immutable transition chain, projection, writer lease, and stop intent.",
    "  state-record/state-reconcile/state-reconcile-writer/state-stop: write only the definition-contained campaign state root.",
    "  ledger-append: appends one normalized reviewed seed and atomically refreshes its definition-contained seed index.",
    "  report-materialize: atomically regenerates definition-contained ledger projections and Markdown report from current reviewed seeds.",
    "  report-readback: reads and recomputes the current ledger projections and report without writing.",
    "  Mission-enabled run may start local child processes and mutate only the admitted mission-owned project/change/evidence/state/report paths through the existing mission controller; it may validate and archive the disposable OpenSpec change.",
    "  It makes no provider, OpenCode model, host, remote, credential, installation, publication, release, or otherwise protected effect unless separately represented and authorized by the mission contract.",
    "",
    "Output:",
    "  Stable schema-v1 JSON with current phase, disposition, evidence refs, and writer/cleanup closure, or a cause-preserving blocked error.",
  ].join("\n");
}

function requiredValue(args: string[], index: number, option: string): string {
  const value = args[index + 1];
  if (value == null || value.trim() === "" || value.startsWith("--")) throw new WorkCampaignError(`Missing value for ${option}`);
  return value;
}

function parseArgs(args: string[]): Options {
  if (args.length === 1 && (args[0] === "--help" || args[0] === "-h")) {
    return {
      attestationPath: "",
      checkpointIdentity: "",
      definitionPath: "",
      eventPath: "",
      evidenceRef: "",
      help: true,
      globalSource: "",
      missionAdapterPath: "",
      operation: "preflight",
      phaseInputPath: "",
      recordPath: "",
      root: process.cwd(),
      stopSource: "operator",
      verificationInputPath: "",
    };
  }
  const supported = new Set<Operation>(["contract-preflight", "ledger-append", "preflight", "replay", "report-materialize", "report-readback", "resume", "run", "state-record", "state-reconcile", "state-reconcile-writer", "state-replay", "state-stop", "status", "stop", "verify"]);
  const operation = args[0] as Operation;
  if (!supported.has(operation)) throw new WorkCampaignError("operation is unsupported");
  let attestationPath = "";
  let checkpointIdentity = "";
  let definitionPath = "";
  let eventPath = "";
  let evidenceRef = "";
  let globalSource = "";
  let missionAdapterPath = "";
  let phaseInputPath = "";
  let recordPath = "";
  let root = "";
  let stopSource: Options["stopSource"] = "operator";
  let verificationInputPath = "";
  for (let index = 1; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--attestation") {
      attestationPath = requiredValue(args, index, arg);
      index++;
    } else if (arg === "--checkpoint-identity") {
      checkpointIdentity = requiredValue(args, index, arg);
      index++;
    } else if (arg === "--definition") {
      definitionPath = requiredValue(args, index, arg);
      index++;
    } else if (arg === "--event") {
      eventPath = requiredValue(args, index, arg);
      index++;
    } else if (arg === "--evidence-ref") {
      evidenceRef = requiredValue(args, index, arg);
      index++;
    } else if (arg === "--global-source") {
      globalSource = requiredValue(args, index, arg);
      index++;
    } else if (arg === "--mission-adapter") {
      missionAdapterPath = requiredValue(args, index, arg);
      index++;
    } else if (arg === "--root") {
      root = requiredValue(args, index, arg);
      index++;
    } else if (arg === "--record") {
      recordPath = requiredValue(args, index, arg);
      index++;
    } else if (arg === "--phase-input") {
      phaseInputPath = requiredValue(args, index, arg);
      index++;
    } else if (arg === "--source") {
      const value = requiredValue(args, index, arg);
      if (value !== "operator" && value !== "signal" && value !== "supervisor") throw new WorkCampaignError("--source must be operator, signal, or supervisor");
      stopSource = value;
      index++;
    } else if (arg === "--verification-input") {
      verificationInputPath = requiredValue(args, index, arg);
      index++;
    } else {
      throw new WorkCampaignError(`Unknown option: ${arg}`);
    }
  }
  if (!path.isAbsolute(root)) throw new WorkCampaignError("--root must be absolute", 2, { field: "root" });
  if (!fs.statSync(root, { throwIfNoEntry: false })?.isDirectory()) {
    throw new WorkCampaignError("--root must identify a readable directory", 2, { field: "root" });
  }
  if (definitionPath.trim() === "") throw new WorkCampaignError("--definition is required", 2, { field: "definitionPath" });
  if ((operation === "state-record" || operation === "state-reconcile") && eventPath === "") {
    throw new WorkCampaignError("--event is required", 2, { field: "eventPath" });
  }
  if (operation === "state-reconcile-writer" && attestationPath === "") {
    throw new WorkCampaignError("--attestation is required", 2, { field: "attestationPath" });
  }
  if (operation === "state-stop" && evidenceRef === "") {
    throw new WorkCampaignError("--evidence-ref is required", 2, { field: "evidenceRef" });
  }
  if (operation === "ledger-append" && recordPath === "") {
    throw new WorkCampaignError("--record is required", 2, { field: "recordPath" });
  }
  if (operation === "run" && phaseInputPath === "") {
    throw new WorkCampaignError("--phase-input is required", 2, { field: "phaseInputPath" });
  }
  if (operation === "verify" && verificationInputPath === "") {
    throw new WorkCampaignError("--verification-input is required", 2, { field: "verificationInputPath" });
  }
  if ((globalSource === "") !== (missionAdapterPath === "")) {
    throw new WorkCampaignError("--global-source and --mission-adapter must be supplied together", 2, { field: "mission" });
  }
  if (globalSource !== "" && ((operation !== "run" && operation !== "verify") || !path.isAbsolute(globalSource))) {
    throw new WorkCampaignError("--global-source must be absolute and is valid only for run or verify", 2, { field: "globalSource" });
  }
  if (checkpointIdentity !== "" && globalSource === "") {
    throw new WorkCampaignError("--checkpoint-identity requires mission-enabled run", 2, { field: "checkpointIdentity" });
  }
  if (operation === "stop" && evidenceRef === "") {
    throw new WorkCampaignError("--evidence-ref is required", 2, { field: "evidenceRef" });
  }
  const unused = [
    attestationPath !== "" && operation !== "state-reconcile-writer" ? "--attestation" : null,
    checkpointIdentity !== "" && operation !== "run" && operation !== "verify" ? "--checkpoint-identity" : null,
    eventPath !== "" && operation !== "state-record" && operation !== "state-reconcile" ? "--event" : null,
    evidenceRef !== "" && operation !== "state-stop" && operation !== "stop" ? "--evidence-ref" : null,
    phaseInputPath !== "" && operation !== "run" ? "--phase-input" : null,
    recordPath !== "" && operation !== "ledger-append" ? "--record" : null,
    verificationInputPath !== "" && operation !== "verify" ? "--verification-input" : null,
  ].filter((value): value is string => value != null);
  if (unused.length > 0) throw new WorkCampaignError(`${unused.join(", ")} is not valid for ${operation}`);
  return {
    attestationPath,
    checkpointIdentity,
    definitionPath,
    eventPath,
    evidenceRef,
    globalSource: globalSource === "" ? "" : path.resolve(globalSource),
    help: false,
    missionAdapterPath,
    operation,
    phaseInputPath,
    recordPath,
    root: path.resolve(root),
    stopSource,
    verificationInputPath,
  };
}

function causeMessage(error: unknown): string | null {
  if (!(error instanceof Error)) return null;
  const cause = (error as Error & { cause?: unknown }).cause;
  return cause instanceof Error ? cause.message : null;
}

try {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
  } else {
    const loaded = loadWorkCampaignDefinition(options.root, options.definitionPath);
    if (options.operation === "contract-preflight") {
      console.log(stableJson({
        adapterDigest: loaded.adapterDigest,
        adapterId: loaded.adapter.adapterId,
        campaignId: loaded.definition.campaignId,
        checks: [
          { id: "definition:schema", status: "passed" },
          { id: "definition:contained", status: "passed" },
          { id: "adapter:schema", status: "passed" },
          { id: "effects:authorized", status: "passed" },
          { id: "budgets:finite", status: "passed" },
          { id: "argv:explicit", status: "passed" },
        ],
        definitionDigest: loaded.definitionDigest,
        exitCode: 0,
        operation: "contract-preflight",
        phase: "inventory",
        schemaVersion: 1,
        status: "contract-valid",
        tool: "work-campaign",
      }).trimEnd());
    } else if (options.operation === "preflight") {
      const report = preflightCampaign(options.root, loaded.definition, loaded.definitionDigest, loaded.adapterDigest);
      console.log(stableJson(report).trimEnd());
      process.exitCode = report.exitCode;
    } else if (options.operation === "run") {
      const report = runProviderFreeCampaign(
        options.root,
        loaded.definition,
        loaded.definitionDigest,
        loaded.adapterDigest,
        options.phaseInputPath,
        options.globalSource === "" ? undefined : {
          adapterPath: options.missionAdapterPath,
          checkpointIdentity: options.checkpointIdentity === "" ? undefined : options.checkpointIdentity,
          globalSource: options.globalSource,
        },
      );
      console.log(stableJson(report).trimEnd());
      process.exitCode = report.disposition === "blocked" || report.disposition === "paused-unknown"
        ? 1
        : report.disposition === "paused-external" ? 3 : 0;
    } else if (options.operation === "resume") {
      const report = resumeCampaign(options.root, loaded.definition, loaded.definitionDigest);
      console.log(stableJson(report).trimEnd());
      process.exitCode = report.disposition === "blocked" || report.disposition === "paused-unknown"
        ? 1
        : report.disposition === "paused-external" ? 3 : 0;
    } else if (options.operation === "verify") {
      const report = verifyCampaign(
        options.root,
        loaded.definition,
        loaded.definitionDigest,
        loaded.adapter,
        options.verificationInputPath,
        options.globalSource === "" ? undefined : {
          adapterPath: options.missionAdapterPath,
          checkpointIdentity: options.checkpointIdentity === "" ? undefined : options.checkpointIdentity,
          globalSource: options.globalSource,
        },
      );
      console.log(stableJson(report).trimEnd());
      process.exitCode = report.disposition === "blocked" || report.disposition === "paused-unknown"
        ? 1
        : report.disposition === "paused-external" ? 3 : 0;
    } else if (options.operation === "status" || options.operation === "replay") {
      const report = options.operation === "status"
        ? statusCampaign(options.root, loaded.definition, loaded.definitionDigest)
        : replayCampaign(options.root, loaded.definition, loaded.definitionDigest);
      console.log(stableJson(report).trimEnd());
      process.exitCode = report.disposition === "blocked" || report.disposition === "paused-unknown" ? 1 : 0;
    } else if (options.operation === "stop") {
      const report = stopCampaign(options.root, loaded.definition, loaded.definitionDigest, options.stopSource, options.evidenceRef);
      console.log(stableJson(report).trimEnd());
      process.exitCode = report.disposition === "paused-unknown" ? 1 : 0;
    } else if (options.operation === "ledger-append") {
      const record = loadCampaignSeedRecord(options.root, options.recordPath, loaded.definition.budgets.evidenceBytes);
      const result = appendCampaignLedgerRecord(options.root, loaded.definition, record);
      console.log(stableJson({
        ...result,
        campaignId: loaded.definition.campaignId,
        definitionDigest: loaded.definitionDigest,
        exitCode: 0,
        operation: options.operation,
        schemaVersion: 1,
        status: result.appended ? "seed-appended" : "seed-current",
        tool: "work-campaign",
      }).trimEnd());
    } else if (options.operation === "report-materialize" || options.operation === "report-readback") {
      const result = options.operation === "report-materialize"
        ? materializeCampaignReport(options.root, loaded.definition)
        : readCampaignReport(options.root, loaded.definition);
      console.log(stableJson({
        ...result,
        exitCode: 0,
        operation: options.operation,
        schemaVersion: 1,
        status: options.operation === "report-materialize" ? "report-materialized" : "report-current",
        tool: "work-campaign",
      }).trimEnd());
    } else if (options.operation === "state-replay") {
      const replay = replayCampaignState(options.root, loaded.definition);
      console.log(stableJson(replay).trimEnd());
      process.exitCode = replay.exitCode;
    } else if (options.operation === "state-stop") {
      const intent = recordCampaignStopIntent(options.root, loaded.definition, {
        evidenceRef: options.evidenceRef,
        source: options.stopSource,
      });
      console.log(stableJson({
        campaignId: intent.campaignId,
        definitionDigest: intent.definitionDigest,
        exitCode: 0,
        operation: options.operation,
        requestedAt: intent.requestedAt,
        schemaVersion: 1,
        source: intent.source,
        status: "stop-requested",
        tool: "work-campaign",
      }).trimEnd());
    } else if (options.operation === "state-reconcile-writer") {
      const attestation = loadCampaignWriterAttestation(options.root, options.attestationPath);
      const archivePath = reconcileCampaignWriterLease(options.root, loaded.definition, attestation);
      console.log(stableJson({
        archivePath,
        campaignId: loaded.definition.campaignId,
        definitionDigest: loaded.definitionDigest,
        exitCode: 0,
        operation: options.operation,
        schemaVersion: 1,
        status: "writer-reconciled",
        tool: "work-campaign",
      }).trimEnd());
    } else {
      const descriptor = loadCampaignTransitionDescriptor(options.root, options.eventPath);
      const transition = options.operation === "state-reconcile"
        ? reconcileCampaignState(options.root, loaded.definition, descriptor)
        : recordCampaignTransition(options.root, loaded.definition, descriptor);
      console.log(stableJson({
        campaignId: transition.campaignId,
        definitionDigest: transition.definitionDigest,
        eventId: transition.eventId,
        exitCode: 0,
        operation: options.operation,
        schemaVersion: 1,
        sequence: transition.sequence,
        status: "recorded",
        tool: "work-campaign",
        transitionDigest: transition.transitionDigest,
      }).trimEnd());
    }
  }
} catch (error) {
  const campaignError = error instanceof WorkCampaignError
    ? error
    : new WorkCampaignError("work-campaign operation failed", 1, { cause: error });
  console.error(stableJson({
    cause: causeMessage(campaignError),
    error: campaignError.message,
    exitCode: campaignError.exitCode,
    field: campaignError.field,
    operation: process.argv[2] ?? "unknown",
    schemaVersion: 1,
    status: "blocked",
    tool: "work-campaign",
  }).trimEnd());
  process.exitCode = campaignError.exitCode;
}
