#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { inventoryOpenSpecChanges } from "../../global/bin/openspec-change/inventory.ts";
import { parseOwnershipManifest } from "../../global/bin/openspec-change/ownership.ts";
import { inspectManagedPromptDrift } from "../opencode-runtime-sources.ts";
import { installedOpenCodeIdentity } from "./lib/opencode-proof-client.ts";
import { captureConfiguredDiagnostic, captureFoundationConfiguredLane, captureLane, createFoundationBundleFromDiagnostic, type CaptureFailureKind, type SessionMode } from "./consumer-outcome/capture.ts";
import {
  type CaptureBundle,
  type ComplexityConfiguredSessionPack,
  type ComplexityFacadeScenarioExpectation,
  type DecisionGapPack,
  type DecisionPackName,
  type Expectation,
  type SampleEvidence,
  type SourceIdentity,
  ContractError,
  complexityConfiguredInvocationManifest,
  digestOf,
  governedSourceIdentity,
  loadComplexityConfiguredSessionPack,
  loadDecisionGapPack,
  loadManifest,
  posixPath,
  stableJson,
  verifyFixtureSeed,
  writeNewFile,
} from "./consumer-outcome/contracts.ts";
import { evaluateBundle, evaluateComplexityConfiguredSessionPack, evaluateDecisionGapPack, gateCurrent, loadGateInputs, readBundle, replayEvaluation } from "./consumer-outcome/evaluate.ts";
import {
  captureDeliveryTrajectoryConfigured,
  deliveryTrajectoryConfiguredPreflight,
  deliveryTrajectoryPreflight,
  materializeDeliveryTrajectoryBundle,
  replayDeliveryTrajectory,
  replayDeliveryTrajectoryConfigured,
} from "./consumer-outcome/delivery-trajectory.ts";
import {
  captureDeliveryCheckpointConfigured,
  deliveryCheckpointConfiguredPreflight,
  deliveryCheckpointPreflight,
  materializeDeliveryCheckpointBundle,
  replayDeliveryCheckpoint,
  replayDeliveryCheckpointConfigured,
} from "./consumer-outcome/delivery-checkpoint.ts";
import {
  DELIVERY_CHECKPOINT_CONTINUITY_SCENARIO_ID,
  captureDeliveryCheckpointContinuity,
  deliveryCheckpointContinuityPreflight,
  replayDeliveryCheckpointContinuity,
} from "./consumer-outcome/delivery-checkpoint-continuity.ts";
import { captureStatusScopeLane, statusScopeConfiguredRoutes } from "./consumer-outcome/status-scope.ts";
import { captureTeamAdviceContinuity, evaluateTeamAdviceContinuity, loadTeamAdviceContinuityFixture, readTeamAdviceContinuityBundle, teamAdviceContinuityPreflight } from "./consumer-outcome/team-advice-continuity.ts";
import { captureTeamAdvisingPack, evaluateTeamAdvisingPack, loadTeamAdvisingPack, readTeamBundle, redactTeamBundlePrivacy, selectTeamAdvisingPack, teamAdvisingPreflight } from "./consumer-outcome/team-advising.ts";

type Options = {
  baselineConfigDir?: string;
  baselinePath?: string;
  candidateConfigDir?: string;
  candidateId: string;
  candidatePath?: string;
  candidatePaths: string[];
  candidateRequestPath?: string;
  continuity: boolean;
  diagnosticPath?: string;
  evidenceRoot?: string;
  expectation: Expectation | "baseline-establishment";
  failure: CaptureFailureKind;
  gitRef: string;
  help: boolean;
  mode: "help" | "preflight" | "materialize" | "baseline" | "capture" | "convert" | "diagnose" | "evaluate" | "gate";
  opencodePath?: string;
  pack: DecisionPackName | "complexity-configured" | "delivery-checkpoint" | "delivery-trajectory" | "general" | "team-advising";
  repoRoot: string;
  resultPath?: string;
  scenarioIds?: string[];
  sessionMode: SessionMode;
};

function usage(): string {
  return [
    "Usage:",
    "  node tools/proofs/consumer-outcome-regression.ts --help",
    "  node tools/proofs/consumer-outcome-regression.ts -h",
    "  node tools/proofs/consumer-outcome-regression.ts --mode preflight [--pack general|bounded-falsification|claim-evidence|complexity|complexity-configured|delivery-checkpoint|delivery-trajectory|foundation-integrity|shift-left|status-scope|team-advising] [--root <path>] [--source-ref HEAD|working-tree] [--opencode <absolute-path>]",
    "  node tools/proofs/consumer-outcome-regression.ts --mode baseline --candidate-id <id> --evidence-root <absolute-new-path> [--pack general|bounded-falsification|complexity|complexity-configured|delivery-trajectory|foundation-integrity|shift-left|status-scope|team-advising] [--baseline-config-dir <path>] [--source-ref HEAD|working-tree] [--session-mode configured] [--scenarios id,...] [--opencode <absolute-path>]",
    "  node tools/proofs/consumer-outcome-regression.ts --mode capture --candidate-id <id> --evidence-root <absolute-new-path> [--pack general|bounded-falsification|claim-evidence|complexity|complexity-configured|delivery-trajectory|foundation-integrity|shift-left|status-scope|team-advising] [--baseline <path>] [--candidate-config-dir <path>] [--source-ref HEAD|working-tree] [--session-mode configured] [--scenarios id,...] [--result-path <absolute-new-path>] [--opencode <absolute-path>]",
    "  node tools/proofs/consumer-outcome-regression.ts --mode diagnose --pack complexity|foundation-integrity [--scenarios <one-foundation-id>] --candidate-id <id> --evidence-root <absolute-new-path> --source-ref working-tree --session-mode configured --opencode <absolute-path>",
    "  node tools/proofs/consumer-outcome-regression.ts --mode convert --pack foundation-integrity --scenarios <one-id> --candidate-id <id> --evidence-root <absolute-new-path> --diagnostic <path> --baseline <path> --source-ref working-tree",
    "  node tools/proofs/consumer-outcome-regression.ts --mode preflight|capture --pack team-advising --continuity [--source-ref HEAD|working-tree] [--candidate-id <id> --evidence-root <absolute-new-path> --session-mode configured] --opencode <absolute-path>",
    "  node tools/proofs/consumer-outcome-regression.ts --mode evaluate --pack team-advising --continuity --candidate <disposable-input> [--result-path <absolute-new-path>]",
    "  node tools/proofs/consumer-outcome-regression.ts --mode convert --pack team-advising --baseline <sealed-bundle> --candidate-id <id> --evidence-root <absolute-new-path>",
    "  node tools/proofs/consumer-outcome-regression.ts --mode evaluate --baseline <path> [--candidate <path>] [--expectation no-regression|improvement|baseline-establishment] [--result-path <absolute-new-path>]",
    "  node tools/proofs/consumer-outcome-regression.ts --mode preflight|baseline|capture|evaluate --pack delivery-trajectory --source-ref working-tree [--candidate-id <id> --evidence-root <absolute-new-path>] [--baseline <disposable-input>] [--candidate <disposable-input>]",
    "  node tools/proofs/consumer-outcome-regression.ts --mode preflight|materialize --pack delivery-checkpoint --source-ref working-tree [--candidate-id <id> --evidence-root <absolute-new-path>]",
    "  node tools/proofs/consumer-outcome-regression.ts --mode evaluate --pack delivery-checkpoint --baseline <disposable-input> [--result-path <absolute-new-path>]",
    "  node tools/proofs/consumer-outcome-regression.ts --mode preflight|capture --pack delivery-checkpoint --source-ref working-tree --session-mode configured --scenarios <one-configured-id> --opencode <absolute-path> --candidate-config-dir <generated-core> [--candidate-id <id> --evidence-root <absolute-new-path>]",
    "  node tools/proofs/consumer-outcome-regression.ts --mode evaluate --pack delivery-checkpoint --session-mode configured --scenarios <one-configured-id> --candidate <disposable-diagnostic.json>",
    "  node tools/proofs/consumer-outcome-regression.ts --mode preflight|capture --pack delivery-trajectory --source-ref working-tree --session-mode configured --scenarios <one-id> --opencode <absolute-path> --candidate-config-dir <generated-core> [--candidate-id <id> --evidence-root <absolute-new-path>]",
    "  node tools/proofs/consumer-outcome-regression.ts --mode evaluate --pack delivery-trajectory --scenarios <one-id> --candidate <disposable-diagnostic.json>",
    "  node tools/proofs/consumer-outcome-regression.ts --mode gate [--source-ref HEAD|working-tree] [--candidate <path>] [--candidate-request <path>]",
    "",
    "Inputs: reviewed config/consumer-outcome-regression.json, fixture seeds, optional candidate-request JSON, and explicit disposable evaluator inputs.",
    "Effects: help, preflight, convert, evaluate, and gate are provider-free and create no session, process, network, or provider call; evaluate writes only an explicitly requested temporary result.",
    "         baseline/capture/diagnose use caller-owned temporary output and disposable fixtures; none mutate the baseline pointer or create a repository proof artifact.",
    "Focused packs: claim-evidence uses one matched capture and at most eight configured-provider requests.",
    "               delivery-checkpoint freezes twelve reviewed OPDC-001 members plus deliberate red controls; materialize and evaluate are provider-free and validate explicit fields, event order, identity preservation, and cost arithmetic without semantic scoring. Each separately authorized configured ordinary/OpenSpec population lane permits one request and supports only its exact reviewed rows.",
    "               bounded-falsification uses twelve reviewed partitions, one primary request per scenario/arm, and at most twenty-four primary requests total.",
    "               complexity prepares one useful-current-consumer-facade member and permits only one separately cleared configured diagnostic request.",
    "               complexity-configured captures twelve matched baseline/candidate partitions with at most twenty-four configured-provider requests total.",
    "               delivery-trajectory freezes 13 reviewed members as provider-free proof contracts and reuses the configured diagnostic owner for two explicit archive happy paths; configured capture is separately authorized and bounded to one request per selected scenario.",
    "               foundation-integrity supports reviewed scenario subsets and provider-free composition; the complete baseline/candidate population remains bounded to fourteen primary requests total.",
    "               shift-left uses separate baseline/candidate captures, two scenarios, and at most four requests total.",
    "               status-scope uses one main response, one actual compaction, and one reconstruction call per arm, with six calls total.",
    "               team-advising uses nine reviewed scenarios, ten root turns per arm, exact child/catalog/skill identities, and twenty configured requests total.",
    "               team-advising --continuity uses two candidate-only actual-compaction controls and at most six configured requests; disposable evaluation is provider-free.",
    "               All focused packs have exact decision oracles, bounded claims, provider-free disposable evaluation, and cannot promote the maintained baseline pointer.",
    "Diagnostics: bounded current-run evaluation is emitted on stdout; temporary capture output is caller-cleaned and is never a repository or handoff artifact.",
    "Cleanup: capture deletes proof sessions, processes, and fixture roots in finally. Cleanup uncertainty blocks the next sample.",
    "Modes: materialize | baseline | capture | convert | diagnose | evaluate | gate. Configured authorization is explicit and never implied by CI or validation.",
  ].join("\n");
}

function required(args: string[], index: number, name: string): string {
  const value = args[index + 1];
  if (value == null || value.trim() === "" || value.startsWith("--")) throw new Error(`Missing value for ${name}`);
  return value;
}

function parseScenarioIds(value: string): string[] {
  const ids = value.split(",").map((item) => item.trim()).filter((item) => item !== "");
  if (ids.length === 0 || new Set(ids).size !== ids.length) throw new Error("--scenarios must contain unique comma-separated scenario ids");
  return ids;
}

function parseOptions(args: string[]): Options {
  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    return {
      candidateId: "help",
      candidatePaths: [],
      continuity: false,
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
    candidatePaths: [],
    continuity: false,
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
    else if (arg === "--continuity") options.continuity = true;
    else if (arg === "--mode") {
      const value = required(args, index, arg);
      if (value !== "preflight" && value !== "materialize" && value !== "baseline" && value !== "capture" && value !== "convert" && value !== "diagnose" && value !== "evaluate" && value !== "gate") {
        throw new Error("Unknown mode");
      }
      options.mode = value;
      index += 1;
    } else if (arg === "--root") {
      options.repoRoot = path.resolve(required(args, index, arg));
      index += 1;
    } else if (arg === "--pack") {
      const value = required(args, index, arg);
      if (value !== "general" && value !== "bounded-falsification" && value !== "claim-evidence" && value !== "complexity" && value !== "complexity-configured" && value !== "delivery-checkpoint" && value !== "delivery-trajectory" && value !== "foundation-integrity" && value !== "shift-left" && value !== "status-scope" && value !== "team-advising") throw new Error("Invalid pack");
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
    } else if (arg === "--baseline-config-dir") {
      options.baselineConfigDir = path.resolve(required(args, index, arg));
      index += 1;
    } else if (arg === "--candidate") {
      const candidatePath = path.resolve(required(args, index, arg));
      options.candidatePaths.push(candidatePath);
      options.candidatePath ??= candidatePath;
      index += 1;
    } else if (arg === "--candidate-request") {
      options.candidateRequestPath = path.resolve(required(args, index, arg));
      index += 1;
    } else if (arg === "--candidate-config-dir") {
      options.candidateConfigDir = path.resolve(required(args, index, arg));
      index += 1;
    } else if (arg === "--diagnostic") {
      options.diagnosticPath = path.resolve(required(args, index, arg));
      index += 1;
    } else if (arg === "--result-path") {
      const value = required(args, index, arg);
      if (!path.isAbsolute(value)) throw new Error("Result path must be absolute");
      options.resultPath = path.resolve(value);
      index += 1;
    } else if (arg === "--scenarios") {
      options.scenarioIds = parseScenarioIds(required(args, index, arg));
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
  if (options.resultPath != null && options.mode !== "capture" && options.mode !== "evaluate") {
    throw new Error("Result path is supported only for capture/evaluate");
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

function scenarioMemberIds(pack: DecisionGapPack, scenarioId: string): string[] {
  const decision = pack.expectedDecisions[scenarioId];
  if (decision == null || typeof decision !== "object" || !("candidate" in decision)) {
    throw new Error(`foundation-integrity scenario is missing a candidate observation: ${scenarioId}`);
  }
  const candidate = (decision as { candidate?: { terminalRows?: Array<{ memberId?: unknown }> } }).candidate;
  if (!Array.isArray(candidate?.terminalRows)) throw new Error(`foundation-integrity scenario is missing terminal rows: ${scenarioId}`);
  return candidate.terminalRows.map((row) => {
    if (typeof row.memberId !== "string") throw new Error(`foundation-integrity scenario has an invalid member id: ${scenarioId}`);
    return row.memberId;
  });
}

export function selectFoundationPack(pack: DecisionGapPack, requestedIds: string[]): { digest: string; pack: DecisionGapPack } {
  if (pack.name !== "foundation-integrity" || pack.foundationIntegrity == null) {
    throw new Error("--scenarios is supported only for the foundation-integrity pack");
  }
  const requested = new Set(requestedIds);
  const scenarios = pack.manifest.scenarios.filter((scenario) => requested.has(scenario.id));
  const missing = requestedIds.filter((id) => !scenarios.some((scenario) => scenario.id === id));
  if (missing.length > 0) throw new Error(`Unknown foundation-integrity scenario(s): ${missing.join(",")}`);
  const orderedIds = scenarios.map((scenario) => scenario.id);
  const expectedDecisions = Object.fromEntries(orderedIds.map((id) => [id, pack.expectedDecisions[id]]));
  const memberOrder = orderedIds.flatMap((id) => scenarioMemberIds(pack, id));
  const selected: DecisionGapPack = {
    ...pack,
    configuredProviderRequestBound: scenarios.length * 2,
    expectedDecisions,
    foundationIntegrity: { memberOrder },
    id: `${pack.id}-selection-${orderedIds.join("+")}`,
    manifest: { ...pack.manifest, scenarios },
    maximumClaim: `the exercised configured model and selected foundation-integrity scenarios (${orderedIds.join(", ")}) cover only their ${memberOrder.length} explicit members under the recorded identities`,
  };
  return { digest: digestOf(selected), pack: selected };
}

export function selectBoundedFalsificationPack(pack: DecisionGapPack, requestedIds: string[]): { digest: string; pack: DecisionGapPack } {
  if (pack.name !== "bounded-falsification" || pack.boundedFalsification == null) {
    throw new Error("--scenarios bounded selection requires the bounded-falsification pack");
  }
  const requested = new Set(requestedIds);
  const scenarios = pack.manifest.scenarios.filter((scenario) => requested.has(scenario.id));
  const missing = requestedIds.filter((id) => !scenarios.some((scenario) => scenario.id === id));
  if (missing.length > 0) throw new Error(`Unknown bounded-falsification scenario(s): ${missing.join(",")}`);
  const orderedIds = scenarios.map((scenario) => scenario.id);
  const selected: DecisionGapPack = {
    ...pack,
    boundedFalsification: { memberOrder: orderedIds },
    configuredProviderRequestBound: scenarios.length * 2,
    expectedDecisions: Object.fromEntries(orderedIds.map((id) => [id, pack.expectedDecisions[id]])),
    id: `${pack.id}-selection-${orderedIds.join("+")}`,
    manifest: { ...pack.manifest, scenarios },
    maximumClaim: `the exercised configured model and selected bounded-falsification scenarios (${orderedIds.join(", ")}) cover only their ${orderedIds.length} explicit members under the recorded identities`,
  };
  return { digest: digestOf(selected), pack: selected };
}

export function selectComplexityConfiguredPack(pack: ComplexityConfiguredSessionPack, requestedIds: string[]): { digest: string; pack: ComplexityConfiguredSessionPack } {
  const requested = new Set(requestedIds);
  const scenarios = pack.manifest.scenarios.filter((scenario) => requested.has(scenario.id));
  const missing = requestedIds.filter((id) => !scenarios.some((scenario) => scenario.id === id));
  if (missing.length > 0) throw new Error(`Unknown complexity-configured scenario(s): ${missing.join(",")}`);
  const memberOrder = scenarios.map((scenario) => scenario.id);
  const selected: ComplexityConfiguredSessionPack = {
    ...pack,
    configuredProviderRequestBound: scenarios.length * 2,
    expectedDecisions: Object.fromEntries(memberOrder.map((id) => [id, pack.expectedDecisions[id]])),
    id: `${pack.id}-selection-${memberOrder.join("+")}`,
    manifest: { ...pack.manifest, scenarios },
    maximumClaim: `the exercised configured model and selected complexity scenarios (${memberOrder.join(", ")}) cover only their ${memberOrder.length} explicit members under the recorded identities`,
    memberOrder,
  };
  return { digest: digestOf(selected), pack: selected };
}

function projectSample(sample: SampleEvidence, scenarioDigest: string): SampleEvidence {
  const projected = structuredClone(sample);
  projected.environmentIdentity.scenarioDigest = scenarioDigest;
  projected.hashes.sample = "";
  projected.hashes.sample = digestOf({ ...projected, hashes: { sample: "" } });
  return projected;
}

export function projectBundles(
  bundles: CaptureBundle[],
  scenarioDigest: string,
  scenarioIds: string[],
): CaptureBundle {
  if (bundles.length === 0) throw new Error("At least one bundle is required for projection");
  const first = bundles[0]!;
  const allowed = new Set(scenarioIds);
  const sampleKeys = new Set<string>();
  const samples: SampleEvidence[] = [];
  for (const bundle of bundles) {
    if (bundle.kind !== first.kind) throw new Error("Composed bundles must use the same arm kind");
    if (bundle.evaluatorDigest !== first.evaluatorDigest) throw new Error("Composed bundles must use the same evaluator identity");
    if (bundle.sourceIdentity.governedDigest !== first.sourceIdentity.governedDigest) {
      throw new Error("Composed bundles must use the same source identity");
    }
    for (const sample of bundle.samples) {
      if (!allowed.has(sample.scenarioId)) continue;
      const key = `${sample.arm}:${sample.scenarioId}:${sample.sampleIndex}`;
      if (sampleKeys.has(key)) throw new Error(`Composed bundles contain a duplicate sample: ${key}`);
      sampleKeys.add(key);
      samples.push(projectSample(sample, scenarioDigest));
    }
  }
  const order = new Map(scenarioIds.map((id, index) => [id, index]));
  samples.sort((left, right) => (order.get(left.scenarioId) ?? Number.MAX_SAFE_INTEGER) - (order.get(right.scenarioId) ?? Number.MAX_SAFE_INTEGER) || left.sampleIndex - right.sampleIndex);
  const projected: CaptureBundle = {
    ...first,
    byteLength: 0,
    comparisonIdentity: digestOf({
      bundleIdentities: bundles.map((bundle) => bundle.comparisonIdentity),
      scenarioDigest,
      scenarioIds,
    }),
    inventory: [...new Set(bundles.flatMap((bundle) => bundle.inventory))].sort((left, right) => left.localeCompare(right)),
    samples,
    scenarioDigest,
  };
  projected.byteLength = samples.reduce((sum, sample) => sum + Buffer.byteLength(stableJson(sample), "utf8"), 0);
  return projected;
}

function projectedPathBundles(paths: string[], scenarioDigest: string, scenarioIds: string[]): CaptureBundle | undefined {
  return paths.length === 0 ? undefined : projectBundles(paths.map((file) => readBundle(file)), scenarioDigest, scenarioIds);
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

function foundationIntegrityPreflight(pack: DecisionGapPack): Record<string, unknown> {
  if (pack.foundationIntegrity == null) throw new Error("foundation-integrity metadata is missing");
  const expectedAllow = "edit,read,skill:foundation-integrity-recovery,task:foundation-integrity-reviewer";
  const expectedDeny = "bash,external_directory,glob,grep,question,webfetch";
  for (const scenario of pack.manifest.scenarios) {
    if ([...scenario.permissions.allow].sort().join(",") !== expectedAllow || [...scenario.permissions.deny].sort().join(",") !== expectedDeny) {
      throw new Error(`foundation-integrity permission envelope drifted for ${scenario.id}`);
    }
  }
  return {
    configuredSessionRequired: true,
    permissionEnvelope: {
      allow: expectedAllow.split(","),
      deny: expectedDeny.split(","),
      externalWrites: false,
      fixtureWrites: true,
    },
    scenarioMembers: pack.foundationIntegrity.memberOrder,
    terminalRowCountPerArm: pack.foundationIntegrity.memberOrder.length,
  };
}

function boundedFalsificationPreflight(pack: DecisionGapPack): Record<string, unknown> {
  if (pack.boundedFalsification == null) throw new Error("bounded-falsification metadata is missing");
  const expectedAllow = "edit,read,task:implementation-readiness-reviewer,task:instruction-artifact-reviewer";
  const expectedDeny = "bash,external_directory,glob,grep,question,skill,webfetch";
  for (const scenario of pack.manifest.scenarios) {
    if ([...scenario.permissions.allow].sort().join(",") !== expectedAllow || [...scenario.permissions.deny].sort().join(",") !== expectedDeny) {
      throw new Error(`bounded-falsification permission envelope drifted for ${scenario.id}`);
    }
  }
  if (pack.manifest.governedSourcePaths.some((entry) => entry.startsWith("tools/proofs/") || entry.startsWith("openspec/changes/"))) {
    throw new Error("bounded-falsification governed source must exclude proof and change evidence paths");
  }
  return {
    comparisonControls: ["model", "variant", "profile", "permissions", "environment", "request", "initialManifest"],
    configuredSessionRequired: true,
    permissionEnvelope: {
      allow: expectedAllow.split(","),
      deny: expectedDeny.split(","),
      externalWrites: false,
      fixtureWrites: true,
    },
    scenarioMembers: pack.boundedFalsification.memberOrder,
    terminalRowCountPerArm: pack.boundedFalsification.memberOrder.length,
  };
}

function complexityPreflight(options: Options, pack: DecisionGapPack): Record<string, unknown> {
  if (pack.complexity == null || pack.manifest.scenarios.length !== 1) throw new Error("complexity metadata is missing");
  const scenario = pack.manifest.scenarios[0]!;
  const expectedAllow = "bash,edit,read,skill:complexity-management";
  const expectedDeny = "external_directory,glob,grep,question,task,webfetch";
  if ([...scenario.permissions.allow].sort().join(",") !== expectedAllow || [...scenario.permissions.deny].sort().join(",") !== expectedDeny) {
    throw new Error("complexity permission envelope drifted");
  }
  const expectedEffects = "local-read,local-write";
  const expectedForbidden = "commit,credential-read,destructive-action,install,protected-action,remote";
  if ([...scenario.allowedEffects].sort().join(",") !== expectedEffects || [...scenario.forbiddenEffects].sort().join(",") !== expectedForbidden) {
    throw new Error("complexity effect envelope drifted");
  }
  if (!scenario.cleanupOracle.fixtureRemoved || !scenario.cleanupOracle.processesRemoved || !scenario.cleanupOracle.sessionsRemoved) {
    throw new Error("complexity cleanup oracle must fail closed");
  }
  const expectation = pack.expectedDecisions[scenario.id] as ComplexityFacadeScenarioExpectation;
  const applySeeds = Object.fromEntries((["baseline", "candidate"] as const).map((arm) => {
    const relative = `tools/proofs/fixtures/consumer-outcome/apply/${scenario.fixtureId}-${arm}.json`;
    const parsed = JSON.parse(fs.readFileSync(path.join(options.repoRoot, relative), "utf8")) as { files?: Record<string, string> };
    if (parsed.files == null || typeof parsed.files["decision.json"] !== "string") throw new Error(`complexity ${arm} apply seed is incomplete`);
    const observed = JSON.parse(parsed.files["decision.json"]);
    if (stableJson(observed) !== stableJson(expectation[arm])) throw new Error(`complexity ${arm} decision seed drifted`);
    const fileOrder = Object.keys(parsed.files).sort();
    const expectedFiles = arm === "baseline"
      ? ["decision.json"]
      : ["decision.json", "src/order-service.ts", "src/run-order.ts"];
    if (fileOrder.join(",") !== expectedFiles.join(",")) throw new Error(`complexity ${arm} apply file set drifted`);
    return [arm, { files: fileOrder, path: relative, sha256: digestOf(parsed) }];
  }));
  return {
    applySeeds,
    configuredCapture: {
      liveAttemptGate: "requires-current-explicit-clearance",
      mode: "diagnose",
      providerRequestBound: 1,
      semanticClaimBeforeCapture: "unsupported",
    },
    configuredSessionRequired: true,
    effectEnvelope: {
      allowed: expectedEffects.split(","),
      forbidden: expectedForbidden.split(","),
      fixtureWritesOnly: true,
    },
    evidenceByteBound: scenario.evidenceByteBound,
    permissionEnvelope: {
      allow: expectedAllow.split(","),
      deny: expectedDeny.split(","),
      externalWrites: false,
      fixtureWrites: true,
    },
    cleanupContract: scenario.cleanupOracle,
    scenarioMembers: pack.complexity.memberOrder,
  };
}

function complexityConfiguredPreflight(pack: ComplexityConfiguredSessionPack): Record<string, unknown> {
  const invocationManifest = complexityConfiguredInvocationManifest(pack);
  if (invocationManifest.length !== pack.memberOrder.length * 2) {
    throw new Error("complexity configured invocation manifest is incomplete");
  }
  return {
    configuredCapture: {
      liveAttemptGate: "requires-current-green-preflight-and-terminal-proof-owned-writers",
      mode: "baseline/capture",
      providerRequestBound: pack.configuredProviderRequestBound,
      semanticClaimBeforeCapture: "unsupported",
    },
    invocationManifest,
    scenarioMembers: pack.memberOrder,
  };
}

async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2));
  if (options.help || options.mode === "help") {
    console.log(usage());
    return;
  }
  if (options.pack === "delivery-checkpoint") {
    if (options.mode !== "preflight" && options.mode !== "materialize" && options.mode !== "capture" && options.mode !== "evaluate") {
      throw new Error(`The delivery-checkpoint pack does not support ${options.mode} mode.`);
    }
    if (options.expectation !== "no-regression") throw new Error("The delivery-checkpoint pack uses exact reviewed oracles and does not accept comparison expectations.");
    if (options.continuity || options.failure !== "none" || options.candidateRequestPath != null || options.diagnosticPath != null || options.baselineConfigDir != null) {
      throw new Error("The delivery-checkpoint pack does not accept continuity, failure-injection, candidate-request, diagnostic-conversion, or baseline-config inputs.");
    }
    if (options.sessionMode === "configured") {
      const continuityScenario = options.scenarioIds?.length === 1 && options.scenarioIds[0] === DELIVERY_CHECKPOINT_CONTINUITY_SCENARIO_ID;
      if (options.mode === "materialize") throw new Error("Configured delivery-checkpoint evidence does not support materialize mode.");
      if (options.baselinePath != null) throw new Error("Configured delivery-checkpoint evidence does not accept baseline inputs.");
      if (options.mode === "preflight") {
        if (options.opencodePath == null || options.candidateConfigDir == null) {
          throw new Error("Configured delivery-checkpoint preflight requires --opencode and --candidate-config-dir.");
        }
        if (options.evidenceRoot != null || options.candidateId !== "" || options.candidatePaths.length > 0 || options.resultPath != null) {
          throw new Error("Configured delivery-checkpoint preflight does not accept capture or evaluation inputs.");
        }
        emit(continuityScenario
          ? deliveryCheckpointContinuityPreflight({
            candidateConfigDir: options.candidateConfigDir,
            executable: options.opencodePath,
            repoRoot: options.repoRoot,
          })
          : deliveryCheckpointConfiguredPreflight({
            candidateConfigDir: options.candidateConfigDir,
            executable: options.opencodePath,
            gitRef: options.gitRef,
            repoRoot: options.repoRoot,
            scenarioIds: options.scenarioIds,
          }));
        return;
      }
      if (options.mode === "evaluate") {
        if (options.scenarioIds?.length !== 1 || options.candidatePaths.length !== 1) {
          throw new Error("Configured delivery-checkpoint evaluate requires one --scenarios id and one --candidate diagnostic.json.");
        }
        if (options.opencodePath != null || options.candidateConfigDir != null || options.evidenceRoot != null || options.candidateId !== "") {
          throw new Error("Configured delivery-checkpoint evaluate is provider-free and does not accept live capture inputs.");
        }
        const evaluation = continuityScenario
          ? replayDeliveryCheckpointContinuity(options.repoRoot, options.candidatePath!).evaluation
          : replayDeliveryCheckpointConfigured(options.repoRoot, options.candidatePath!, options.scenarioIds[0]!);
        emit({ evaluation, liveCalls: 0, mode: options.mode }, options.resultPath);
        if (evaluation.status !== "passed") process.exitCode = 1;
        return;
      }
      if (options.mode !== "capture" || options.scenarioIds?.length !== 1 || options.opencodePath == null || options.candidateConfigDir == null
        || options.evidenceRoot == null || options.candidateId.trim() === "" || options.candidatePaths.length > 0 || options.resultPath != null) {
        throw new Error("Configured delivery-checkpoint capture requires one --scenarios id, --candidate-id, --evidence-root, --opencode, and --candidate-config-dir without evaluation-result inputs.");
      }
      if (continuityScenario) {
        const captured = await captureDeliveryCheckpointContinuity({
          candidateConfigDir: options.candidateConfigDir,
          candidateId: options.candidateId,
          evidenceRoot: options.evidenceRoot,
          executable: options.opencodePath,
          gitRef: options.gitRef,
          repoRoot: options.repoRoot,
        });
        emit({
          bundlePath: path.join(options.evidenceRoot, "bundle.json"),
          evaluation: captured.evaluation,
          liveCalls: captured.evaluation.modelCalls,
          mode: "capture",
          pointerMutated: false,
          sourceDigest: captured.bundle.sourceIdentity.governedDigest,
        });
        if (captured.evaluation.status !== "passed") process.exitCode = 1;
        return;
      }
      const captured = await captureDeliveryCheckpointConfigured({
          candidateConfigDir: options.candidateConfigDir,
          candidateId: options.candidateId,
          evidenceRoot: options.evidenceRoot,
          executable: options.opencodePath,
          gitRef: options.gitRef,
          repoRoot: options.repoRoot,
          scenarioId: options.scenarioIds[0]!,
        });
      emit({
        diagnosticPath: path.join(options.evidenceRoot, "diagnostic.json"),
        evaluation: captured.evaluation,
        liveCalls: captured.evaluation.modelCalls,
        mode: "capture",
        pointerMutated: false,
        sourceDigest: captured.evaluation.sourceDigest,
      });
      if (captured.evaluation.status !== "passed") process.exitCode = 1;
      return;
    }
    if (options.opencodePath != null || options.candidateConfigDir != null || options.scenarioIds != null || options.candidatePaths.length > 0) {
      throw new Error("Provider-free delivery-checkpoint modes do not accept configured-session, scenario-selection, or candidate inputs.");
    }
    if (options.mode === "capture") throw new Error("Provider-free delivery-checkpoint evidence uses materialize mode.");
    if (options.mode === "preflight") {
      if (options.baselinePath != null || options.evidenceRoot != null || options.candidateId !== "" || options.resultPath != null) {
        throw new Error("Delivery-checkpoint preflight accepts only --root and --source-ref working-tree.");
      }
      emit(deliveryCheckpointPreflight(options.repoRoot, options.gitRef));
      return;
    }
    if (options.mode === "evaluate") {
      if (options.baselinePath == null) throw new Error("Delivery-checkpoint evaluate requires --baseline.");
      if (options.evidenceRoot != null || options.candidateId !== "") throw new Error("Delivery-checkpoint evaluate does not accept materialization inputs.");
      const replayed = replayDeliveryCheckpoint(options.baselinePath);
      emit({ evaluation: replayed.evaluation, liveCalls: 0, mode: options.mode }, options.resultPath);
      if (replayed.evaluation.status !== "passed") process.exitCode = 1;
      return;
    }
    if (options.evidenceRoot == null || options.candidateId.trim() === "" || options.baselinePath != null || options.resultPath != null) {
      throw new Error("Delivery-checkpoint materialize requires --candidate-id and --evidence-root without evaluation-result inputs.");
    }
    const materialized = materializeDeliveryCheckpointBundle({
      candidateId: options.candidateId,
      evidenceRoot: options.evidenceRoot,
      gitRef: options.gitRef,
      repoRoot: options.repoRoot,
    });
    emit({
      bundlePath: path.join(options.evidenceRoot, "bundle.json"),
      evaluation: materialized.evaluation,
      liveCalls: 0,
      mode: "materialize",
      pointerMutated: false,
      sourceDigest: materialized.bundle.sourceIdentity.governedDigest,
    });
    if (materialized.evaluation.status !== "passed") process.exitCode = 1;
    return;
  }
  if (options.pack === "delivery-trajectory") {
    if (options.mode !== "preflight" && options.mode !== "baseline" && options.mode !== "capture" && options.mode !== "evaluate") {
      throw new Error(`The delivery-trajectory pack does not support ${options.mode} mode.`);
    }
    if (options.expectation !== "no-regression") throw new Error("The delivery-trajectory pack uses exact evaluators and does not accept comparison expectations.");
    if (options.continuity || options.candidateRequestPath != null || options.diagnosticPath != null || options.failure !== "none") {
      throw new Error("The delivery-trajectory pack does not accept continuity, candidate-request, diagnostic-conversion, or failure-injection inputs.");
    }
    if (options.sessionMode === "configured") {
      if (options.mode === "baseline") throw new Error("Configured delivery-trajectory evidence is candidate-only; the provider-free contract owns the preserved comparison arm.");
      if (options.baselinePath != null || options.baselineConfigDir != null) throw new Error("Configured delivery-trajectory evidence does not accept baseline inputs.");
      if (options.mode === "preflight") {
        if (options.opencodePath == null || options.candidateConfigDir == null) {
          throw new Error("Configured delivery-trajectory preflight requires --opencode and --candidate-config-dir.");
        }
        if (options.evidenceRoot != null || options.candidateId !== "" || options.candidatePaths.length > 0) {
          throw new Error("Configured delivery-trajectory preflight does not accept capture or evaluation inputs.");
        }
        emit(deliveryTrajectoryConfiguredPreflight({
          candidateConfigDir: options.candidateConfigDir,
          executable: options.opencodePath,
          gitRef: options.gitRef,
          repoRoot: options.repoRoot,
          scenarioIds: options.scenarioIds,
        }));
        return;
      }
      if (options.mode === "evaluate") {
        if (options.scenarioIds?.length !== 1 || options.candidatePaths.length !== 1) {
          throw new Error("Configured delivery-trajectory evaluate requires one --scenarios id and one --candidate diagnostic.json.");
        }
        if (options.opencodePath != null || options.candidateConfigDir != null || options.evidenceRoot != null || options.candidateId !== "") {
          throw new Error("Configured delivery-trajectory evaluate is provider-free and does not accept live capture inputs.");
        }
        const evaluation = replayDeliveryTrajectoryConfigured(options.repoRoot, options.candidatePath!, options.scenarioIds[0]!);
        emit({ evaluation, liveCalls: 0, mode: options.mode }, options.resultPath);
        if (evaluation.status !== "passed") process.exitCode = 1;
        return;
      }
      if (options.mode !== "capture" || options.scenarioIds?.length !== 1 || options.opencodePath == null || options.candidateConfigDir == null
        || options.evidenceRoot == null || options.candidateId.trim() === "" || options.candidatePaths.length > 0 || options.resultPath != null) {
        throw new Error("Configured delivery-trajectory capture requires one --scenarios id, --candidate-id, --evidence-root, --opencode, and --candidate-config-dir without evaluation-result inputs.");
      }
      const captured = await captureDeliveryTrajectoryConfigured({
        candidateConfigDir: options.candidateConfigDir,
        candidateId: options.candidateId,
        evidenceRoot: options.evidenceRoot,
        executable: options.opencodePath,
        gitRef: options.gitRef,
        repoRoot: options.repoRoot,
        scenarioId: options.scenarioIds[0]!,
      });
      emit({
        diagnosticPath: path.join(options.evidenceRoot, "diagnostic.json"),
        evaluation: captured.evaluation,
        liveCalls: captured.evaluation.modelCalls,
        mode: "capture",
        pointerMutated: false,
        sourceDigest: captured.evaluation.sourceDigest,
      });
      if (captured.evaluation.status !== "passed") process.exitCode = 1;
      return;
    }
    if (options.scenarioIds != null || options.opencodePath != null || options.baselineConfigDir != null || options.candidateConfigDir != null) {
      throw new Error("Provider-free delivery-trajectory modes do not accept configured-session inputs.");
    }
    if (options.candidatePaths.length > 1) throw new Error("The delivery-trajectory pack accepts at most one --candidate bundle.");

    if (options.mode === "preflight") {
      if (options.baselinePath != null || options.candidatePath != null || options.evidenceRoot != null || options.candidateId !== "") {
        throw new Error("Delivery-trajectory preflight accepts only --root and --source-ref working-tree.");
      }
      emit(deliveryTrajectoryPreflight(options.repoRoot, options.gitRef));
      return;
    }
    if (options.mode === "evaluate") {
      if (options.baselinePath == null) throw new Error("Delivery-trajectory evaluate requires --baseline.");
      if (options.evidenceRoot != null || options.candidateId !== "") throw new Error("Delivery-trajectory evaluate does not accept capture inputs.");
      const evaluation = replayDeliveryTrajectory(options.repoRoot, options.baselinePath, options.candidatePath);
      emit({ evaluation, liveCalls: 0, mode: options.mode }, options.resultPath);
      return;
    }
    if (options.evidenceRoot == null || options.candidateId.trim() === "") {
      throw new Error("Delivery-trajectory baseline/capture requires --candidate-id and --evidence-root.");
    }
    if (options.resultPath != null || options.candidatePath != null) {
      throw new Error("Delivery-trajectory baseline/capture writes only its create-new evidence root.");
    }
    if (options.mode === "baseline" && options.baselinePath != null) {
      throw new Error("Delivery-trajectory baseline materialization does not accept --baseline.");
    }
    if (options.mode === "capture" && options.baselinePath == null) {
      throw new Error("Delivery-trajectory candidate capture requires --baseline.");
    }
    const materialized = materializeDeliveryTrajectoryBundle({
      arm: options.mode === "baseline" ? "baseline" : "candidate",
      baselinePath: options.baselinePath,
      candidateId: options.candidateId,
      evidenceRoot: options.evidenceRoot,
      gitRef: options.gitRef,
      repoRoot: options.repoRoot,
    });
    emit({
      bundleFile: "bundle.json",
      evaluation: materialized.evaluation,
      liveCalls: 0,
      mode: options.mode,
      pointerMutated: false,
      sourceDigest: materialized.bundle.sourceIdentity.governedDigest,
    });
    return;
  }
  if (options.pack === "team-advising") {
    if (options.mode === "gate") {
      throw new Error(`The team-advising pack does not support ${options.mode} mode.`);
    }
    if (options.continuity) {
      if (options.scenarioIds != null || options.baselinePath != null || options.mode === "baseline" || options.mode === "diagnose") {
        throw new Error("Team-advising continuity supports only preflight, capture, or evaluate without --scenarios/--baseline.");
      }
      const loadedContinuity = loadTeamAdviceContinuityFixture(options.repoRoot);
      if (options.mode === "preflight") {
        if (options.opencodePath == null) throw new Error("Team-advising continuity preflight requires --opencode.");
        const continuityPreflight = teamAdviceContinuityPreflight(options.repoRoot, options.opencodePath);
        emit({
          ...continuityPreflight,
          continuityFixtureDigest: loadedContinuity.digest,
          maximumClaim: loadedContinuity.fixture.maximumClaim,
          mode: "preflight",
          modelCalls: 0,
          pack: "team-advising-continuity",
          providerRequestBound: loadedContinuity.fixture.configuredProviderRequestBound,
        });
        return;
      }
      if (options.mode === "evaluate") {
        if (options.candidatePath == null) throw new Error("Team-advising continuity evaluate requires --candidate.");
        const bundle = readTeamAdviceContinuityBundle(options.candidatePath, loadedContinuity.digest);
        const evaluation = evaluateTeamAdviceContinuity(loadedContinuity.fixture, loadedContinuity.digest, bundle);
        emit({ evaluation, liveCalls: 0, mode: "evaluate" }, options.resultPath);
        if (evaluation.status !== "passed") process.exitCode = 1;
        return;
      }
      if (options.mode !== "capture" || options.evidenceRoot == null || options.candidateId.trim() === "" || options.opencodePath == null || options.sessionMode !== "configured") {
        throw new Error("Team-advising continuity capture requires --candidate-id, --evidence-root, --opencode, and --session-mode configured.");
      }
      const captured = await captureTeamAdviceContinuity({
        candidateId: options.candidateId,
        evidenceRoot: options.evidenceRoot,
        executable: options.opencodePath,
        gitRef: options.gitRef,
        repoRoot: options.repoRoot,
      });
      emit({
        bundlePath: path.join(options.evidenceRoot, "bundle.json"),
        evaluation: captured.evaluation,
        liveCalls: captured.evaluation.modelCalls,
        mode: "capture",
        pointerMutated: false,
        sourceDigest: captured.bundle.sourceIdentity.governedDigest,
      });
      if (captured.evaluation.status !== "passed") process.exitCode = 1;
      return;
    }
    const loadedTeam = loadTeamAdvisingPack(options.repoRoot);
    const teamPack = options.scenarioIds == null
      ? loadedTeam.pack
      : selectTeamAdvisingPack(loadedTeam.pack, options.scenarioIds);
    if (options.mode === "convert") {
      if (options.baselinePath == null || options.evidenceRoot == null || options.candidateId.trim() === "" || options.scenarioIds != null) {
        throw new Error("Team-advising privacy conversion requires --baseline, --candidate-id, and --evidence-root without --scenarios.");
      }
      if (fs.existsSync(options.evidenceRoot)) throw new Error("Team-advising privacy conversion evidence root must be create-new.");
      const sourceBundle = readTeamBundle(options.baselinePath, loadedTeam.digest);
      if (sourceBundle.arm !== "baseline") throw new Error("Team-advising privacy conversion accepts only a sealed baseline bundle.");
      const converted = redactTeamBundlePrivacy(sourceBundle, loadedTeam.digest, options.candidateId);
      const evaluation = evaluateTeamAdvisingPack(teamPack, loadedTeam.digest, converted);
      fs.mkdirSync(options.evidenceRoot, { recursive: true });
      writeNewFile(path.join(options.evidenceRoot, "bundle.json"), `${JSON.stringify(converted, null, 2)}\n`);
      writeNewFile(path.join(options.evidenceRoot, "evaluation.json"), `${JSON.stringify(evaluation, null, 2)}\n`);
      emit({
        bundlePath: path.join(options.evidenceRoot, "bundle.json"),
        evaluation,
        liveCalls: 0,
        mode: "convert",
        pointerMutated: false,
        sourceBundleDigest: sourceBundle.bundleDigest,
      });
      if (evaluation.status !== "passed") process.exitCode = 1;
      return;
    }
    if (options.mode === "preflight") {
      if (options.opencodePath == null) throw new Error("The team-advising preflight requires --opencode.");
      emit({
        ...teamAdvisingPreflight({
          executable: options.opencodePath,
          gitRef: options.gitRef,
          pack: teamPack,
          packDigest: loadedTeam.digest,
          repoRoot: options.repoRoot,
        }),
        maximumClaim: teamPack.maximumClaim,
        mode: "preflight",
        pack: "team-advising",
      });
      return;
    }
    if (options.mode === "evaluate") {
      if (options.baselinePath == null) throw new Error("Team-advising evaluate requires --baseline.");
      const baseline = readTeamBundle(options.baselinePath, loadedTeam.digest);
      const candidate = options.candidatePath == null ? undefined : readTeamBundle(options.candidatePath, loadedTeam.digest);
      const evaluation = evaluateTeamAdvisingPack(teamPack, loadedTeam.digest, baseline, candidate);
      emit({ evaluation, liveCalls: 0, mode: options.mode }, options.resultPath);
      if (evaluation.status !== "passed") process.exitCode = 1;
      return;
    }
    if (options.mode === "diagnose") {
      if (options.scenarioIds?.length !== 1 || options.evidenceRoot == null || options.candidateId.trim() === "" || options.opencodePath == null || options.sessionMode !== "configured") {
        throw new Error("Team-advising diagnose requires one --scenarios id plus --candidate-id, --evidence-root, --opencode, and --session-mode configured.");
      }
      const diagnostic = await captureTeamAdvisingPack(teamPack, loadedTeam.digest, {
        arm: "baseline",
        candidateId: options.candidateId,
        diagnostic: true,
        evidenceRoot: options.evidenceRoot,
        executable: options.opencodePath,
        gitRef: options.gitRef,
        repoRoot: options.repoRoot,
      });
      emit({
        bundlePath: path.join(options.evidenceRoot, "bundle.json"),
        liveCalls: diagnostic.samples.reduce((sum, sample) => sum + sample.configuredProviderRequestCount, 0),
        mode: "diagnose",
        scenarioId: options.scenarioIds[0],
        sourceDigest: diagnostic.sourceIdentity.governedDigest,
      });
      if (diagnostic.samples.some((sample) => !sample.cleanup.complete)) process.exitCode = 1;
      return;
    }
    if (options.evidenceRoot == null || options.candidateId.trim() === "" || options.opencodePath == null || options.sessionMode !== "configured") {
      throw new Error("Team-advising baseline/capture requires --candidate-id, --evidence-root, --opencode, and --session-mode configured.");
    }
    if (options.mode === "capture" && options.baselinePath == null) throw new Error("Team-advising candidate capture requires --baseline.");
    const bundle = await captureTeamAdvisingPack(teamPack, loadedTeam.digest, {
      arm: options.mode === "baseline" ? "baseline" : "candidate",
      candidateId: options.candidateId,
      evidenceRoot: options.evidenceRoot,
      executable: options.opencodePath,
      gitRef: options.gitRef,
      repoRoot: options.repoRoot,
    });
    const baseline = options.mode === "baseline" ? bundle : readTeamBundle(options.baselinePath!, loadedTeam.digest);
    const evaluation = evaluateTeamAdvisingPack(teamPack, loadedTeam.digest, baseline, options.mode === "capture" ? bundle : undefined);
    writeNewFile(path.join(options.evidenceRoot, "evaluation.json"), `${JSON.stringify(evaluation, null, 2)}\n`);
    emit({
      bundlePath: path.join(options.evidenceRoot, "bundle.json"),
      evaluation,
      liveCalls: bundle.samples.reduce((sum, sample) => sum + sample.configuredProviderRequestCount, 0),
      mode: options.mode,
      pointerMutated: false,
      sourceDigest: bundle.sourceIdentity.governedDigest,
    });
    if (evaluation.status !== "passed") process.exitCode = 1;
    return;
  }
  if (options.mode === "materialize") throw new Error("Materialize mode is supported only by the delivery-checkpoint pack.");
  const complexityConfiguredSource = options.pack === "complexity-configured"
    ? loadComplexityConfiguredSessionPack(options.repoRoot)
    : null;
  const loadedFocused = options.pack === "general" || options.pack === "complexity-configured"
    ? null
    : loadDecisionGapPack(options.repoRoot, options.pack);
  if (options.scenarioIds != null && complexityConfiguredSource == null && loadedFocused?.pack.name !== "foundation-integrity" && loadedFocused?.pack.name !== "bounded-falsification") {
    throw new Error("--scenarios is supported only for partition packs");
  }
  const loadedComplexityConfigured = options.scenarioIds == null || complexityConfiguredSource == null
    ? complexityConfiguredSource
    : selectComplexityConfiguredPack(complexityConfiguredSource.pack, options.scenarioIds);
  const focused = options.scenarioIds == null || loadedFocused == null
    ? loadedFocused
    : loadedFocused.pack.name === "bounded-falsification"
      ? selectBoundedFalsificationPack(loadedFocused.pack, options.scenarioIds)
      : selectFoundationPack(loadedFocused.pack, options.scenarioIds);
  const loaded = loadedComplexityConfigured != null
    ? { digest: loadedComplexityConfigured.digest, manifest: loadedComplexityConfigured.pack.manifest }
    : focused == null
      ? loadManifest(options.repoRoot)
      : { digest: focused.digest, manifest: focused.pack.manifest };
  if (focused?.pack.name === "claim-evidence" && (options.mode === "baseline" || options.mode === "gate")) {
    throw new Error("The claim-evidence pack cannot establish, promote, or gate the maintained baseline pointer.");
  }
  if ((focused?.pack.name === "bounded-falsification" || focused?.pack.name === "foundation-integrity" || focused?.pack.name === "shift-left" || focused?.pack.name === "status-scope") && options.mode === "gate") {
    throw new Error(`The ${focused.pack.name} pack cannot gate or promote the maintained baseline pointer.`);
  }
  if (focused?.pack.name === "complexity" && options.mode === "gate") {
    throw new Error("The complexity pack cannot gate or promote the maintained baseline pointer.");
  }
  if (loadedComplexityConfigured != null && options.mode === "gate") {
    throw new Error("The complexity-configured pack cannot gate or promote the maintained baseline pointer.");
  }
  if (focused?.pack.name === "claim-evidence" && options.expectation !== "no-regression") {
    throw new Error("The claim-evidence pack requires the explicit no-regression expectation.");
  }
  if ((focused?.pack.name === "bounded-falsification" || focused?.pack.name === "complexity" || focused?.pack.name === "foundation-integrity" || focused?.pack.name === "shift-left") && options.expectation === "improvement") {
    throw new Error(`The ${focused.pack.name} pack supports baseline-establishment or no-regression only.`);
  }
  if (loadedComplexityConfigured != null && options.expectation === "improvement") {
    throw new Error("The complexity-configured pack supports baseline-establishment or no-regression only.");
  }
  if (options.mode === "preflight") {
    const source = governedSourceIdentity(options.repoRoot, options.gitRef, loaded.manifest.governedSourcePaths);
    emit({
      governedDigest: source.governedDigest,
      mode: "preflight",
      modelCalls: 0,
      maximumClaim: loadedComplexityConfigured?.pack.maximumClaim ?? focused?.pack.maximumClaim ?? "maintained two-scenario consumer no-regression for the recorded environment",
      pack: options.pack,
      captureByteLimit: loaded.manifest.captureByteLimit,
      configuredProviderRequestBound: loadedComplexityConfigured != null
        ? loadedComplexityConfigured.pack.configuredProviderRequestBound
        : focused == null
        ? Math.max(...loaded.manifest.scenarios.map((scenario) => scenario.configuredProviderRequestBound))
        : focused.pack.configuredProviderRequestBound,
      governedSourcePaths: loaded.manifest.governedSourcePaths,
      sampleByteLimit: loaded.manifest.sampleByteLimit,
      sampleCountPerArm: loaded.manifest.sampleCount,
      scenarioDigest: loaded.digest,
      scenarioIds: loaded.manifest.scenarios.map((scenario) => scenario.id),
      status: "ready",
      ...(focused?.pack.name === "status-scope" ? statusScopePreflight(options, focused.pack, source) : {}),
      ...(focused?.pack.name === "foundation-integrity" ? foundationIntegrityPreflight(focused.pack) : {}),
      ...(focused?.pack.name === "bounded-falsification" ? boundedFalsificationPreflight(focused.pack) : {}),
      ...(focused?.pack.name === "complexity" ? complexityPreflight(options, focused.pack) : {}),
      ...(loadedComplexityConfigured == null ? {} : complexityConfiguredPreflight(loadedComplexityConfigured.pack)),
    });
    return;
  }
  if (options.mode === "evaluate") {
    if (options.baselinePath == null) throw new Error("Missing --baseline");
    const scenarioIds = loaded.manifest.scenarios.map((scenario) => scenario.id);
    const baseline = focused?.pack.name === "foundation-integrity" || focused?.pack.name === "bounded-falsification"
      ? projectBundles([readBundle(options.baselinePath)], loaded.digest, scenarioIds)
      : readBundle(options.baselinePath);
    const candidate = focused?.pack.name === "foundation-integrity" || focused?.pack.name === "bounded-falsification"
      ? projectedPathBundles(options.candidatePaths, loaded.digest, scenarioIds)
      : options.candidatePath == null ? undefined : readBundle(options.candidatePath);
    const evaluation = loadedComplexityConfigured != null
      ? evaluateComplexityConfiguredSessionPack({
        baseline,
        candidate,
        expectation: candidate == null ? "baseline-establishment" : options.expectation,
        pack: loadedComplexityConfigured.pack,
      })
      : focused == null
      ? replayEvaluation({
        baselinePath: options.baselinePath,
        candidatePath: options.candidatePath,
        expectation: options.expectation,
        manifest: loaded.manifest,
      })
      : evaluateDecisionGapPack({
        baseline,
        candidate,
        expectation: (focused.pack.name === "bounded-falsification" || focused.pack.name === "complexity" || focused.pack.name === "foundation-integrity" || focused.pack.name === "shift-left" || focused.pack.name === "status-scope") && candidate == null
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
  if (options.mode === "convert") {
    if (focused?.pack.name !== "foundation-integrity" || loaded.manifest.scenarios.length !== 1) {
      throw new Error("Convert mode requires exactly one selected foundation-integrity scenario.");
    }
    if (options.evidenceRoot == null || options.candidateId.trim() === "" || options.diagnosticPath == null || options.baselinePath == null) {
      throw new Error("convert requires --candidate-id, --evidence-root, --diagnostic, and --baseline");
    }
    if (fs.existsSync(options.evidenceRoot)) throw new Error("Convert evidence root must be create-new");
    const source = governedSourceIdentity(options.repoRoot, options.gitRef, loaded.manifest.governedSourcePaths);
    const diagnosticText = fs.readFileSync(options.diagnosticPath, "utf8");
    const diagnostic = JSON.parse(diagnosticText) as Record<string, unknown>;
    const diagnosticSource = diagnostic.sourceIdentity as Partial<SourceIdentity> | undefined;
    if (diagnostic.diagnosticOnly !== true || diagnostic.scenarioDigest !== loaded.digest || diagnosticSource?.governedDigest !== source.governedDigest) {
      throw new Error("Diagnostic identity does not match the selected current candidate");
    }
    fs.mkdirSync(options.evidenceRoot, { recursive: true });
    writeNewFile(path.join(options.evidenceRoot, "diagnostic.json"), diagnosticText);
    const bundle = createFoundationBundleFromDiagnostic(loaded.manifest, loaded.digest, {
      candidateId: options.candidateId,
      evidenceRoot: options.evidenceRoot,
      executable: process.execPath,
      repoRoot: options.repoRoot,
      sourceIdentity: source,
    }, diagnostic);
    const evaluation = evaluateDecisionGapPack({
      baseline: projectBundles([readBundle(options.baselinePath)], loaded.digest, loaded.manifest.scenarios.map((scenario) => scenario.id)),
      candidate: bundle,
      expectation: "no-regression",
      pack: focused.pack,
    });
    writeNewFile(path.join(options.evidenceRoot, "evaluation.json"), `${JSON.stringify(evaluation, null, 2)}\n`);
    emit({ bundlePath: path.join(options.evidenceRoot, "bundle.json"), evaluation, liveCalls: 0, mode: "convert", sourceDigest: source.governedDigest });
    const status = evaluation.evaluation.status;
    if (status === "failed" || status === "blocked") process.exitCode = 1;
    return;
  }
  if (options.mode === "diagnose") {
    if ((focused?.pack.name !== "foundation-integrity" && focused?.pack.name !== "complexity") || loaded.manifest.scenarios.length !== 1) {
      throw new Error("Diagnose mode requires the complexity member or exactly one selected foundation-integrity scenario.");
    }
    if (options.evidenceRoot == null || options.candidateId.trim() === "") throw new Error("diagnose requires --candidate-id and --evidence-root");
    if (options.sessionMode !== "configured" || options.opencodePath == null) {
      throw new Error("Diagnose mode requires --session-mode configured and --opencode.");
    }
    const source = governedSourceIdentity(options.repoRoot, options.gitRef, loaded.manifest.governedSourcePaths);
    const diagnostic = await captureConfiguredDiagnostic(loaded.manifest, loaded.digest, {
      candidateConfigDir: options.candidateConfigDir,
      candidateId: options.candidateId,
      evidenceRoot: options.evidenceRoot,
      executable: options.opencodePath,
      retainChangedText: focused.pack.name === "complexity",
      repoRoot: options.repoRoot,
      sourceIdentity: source,
    });
    emit({
      diagnosticPath: path.join(options.evidenceRoot, "diagnostic.json"),
      liveCalls: diagnostic.providerRequestCount,
      mode: "diagnose",
      sourceDigest: source.governedDigest,
      terminalClassification: diagnostic.terminalClassification,
    });
    const cleanup = diagnostic.cleanup as { complete?: unknown } | undefined;
    if (cleanup?.complete !== true) process.exitCode = 1;
    return;
  }
  if (options.evidenceRoot == null || options.candidateId.trim() === "") throw new Error("baseline/capture require --candidate-id and --evidence-root");
  if (!path.isAbsolute(options.evidenceRoot)) throw new Error("Evidence root must be absolute");
  const source = governedSourceIdentity(options.repoRoot, options.gitRef, loaded.manifest.governedSourcePaths);
  if (focused?.pack.name === "claim-evidence" && options.baselinePath != null) throw new Error("The claim-evidence pack uses one matched capture and does not accept --baseline.");
  if ((focused?.pack.name === "bounded-falsification" || focused?.pack.name === "complexity" || focused?.pack.name === "foundation-integrity" || focused?.pack.name === "shift-left" || focused?.pack.name === "status-scope") && options.mode === "capture" && options.baselinePath == null) {
    throw new Error(`The ${focused.pack.name} candidate capture requires --baseline for matched evaluation.`);
  }
  if (loadedComplexityConfigured != null && options.mode === "capture" && options.baselinePath == null) {
    throw new Error("The complexity-configured candidate capture requires --baseline for matched evaluation.");
  }
  if (focused?.pack.name === "status-scope" && (options.sessionMode !== "configured" || options.opencodePath == null)) {
    throw new Error("The status-scope baseline/capture requires --session-mode configured and --opencode.");
  }
  if (focused?.pack.name === "foundation-integrity" && (options.sessionMode !== "configured" || options.mode === "capture" && options.opencodePath == null)) {
    throw new Error("The foundation-integrity baseline/capture requires --session-mode configured; candidate capture also requires --opencode.");
  }
  if (focused?.pack.name === "bounded-falsification" && options.sessionMode !== "configured") {
    throw new Error("The bounded-falsification baseline/capture requires --session-mode configured.");
  }
  if (focused?.pack.name === "complexity" && options.sessionMode === "configured") {
    throw new Error("The complexity configured lane uses one separately cleared diagnose invocation, not baseline/capture.");
  }
  if (loadedComplexityConfigured != null && (options.sessionMode !== "configured" || options.opencodePath == null)) {
    throw new Error("The complexity-configured baseline/capture requires --session-mode configured and --opencode.");
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
    : focused?.pack.name === "foundation-integrity" && options.mode === "capture"
      ? await captureFoundationConfiguredLane(loaded.manifest, loaded.digest, {
        candidateConfigDir: options.candidateConfigDir,
        candidateId: options.candidateId,
        evidenceRoot: options.evidenceRoot,
        executable: options.opencodePath!,
        repoRoot: options.repoRoot,
        sourceIdentity: source,
      })
    : await captureLane(loaded.manifest, loaded.digest, {
      baselineConfigDir: options.baselineConfigDir,
      candidateConfigDir: options.candidateConfigDir,
      candidateId: options.candidateId,
      evidenceRoot: options.evidenceRoot,
      failure: options.failure,
      fixtureDecisions: focused?.pack.name === "bounded-falsification" && options.mode === "capture"
        ? Object.fromEntries(loaded.manifest.scenarios.map((scenario) => [
          scenario.id,
          (focused.pack.expectedDecisions[scenario.id] as { candidate: unknown }).candidate,
        ]))
        : undefined,
      gitRef: options.gitRef,
      kind: options.mode === "baseline" ? "baseline" : options.mode === "capture" && options.baselinePath != null ? "candidate" : "matched",
      repoRoot: options.repoRoot,
      sessionMode: options.sessionMode,
      sourceIdentity: source,
    });
  const evaluation = loadedComplexityConfigured != null
    ? evaluateComplexityConfiguredSessionPack({
      baseline: options.mode === "baseline" ? bundle : readBundle(options.baselinePath!),
      candidate: options.mode === "capture" ? bundle : undefined,
      expectation: options.mode === "baseline" ? "baseline-establishment" : options.expectation,
      pack: loadedComplexityConfigured.pack,
    })
    : focused == null
    ? evaluateBundle({
      baseline: options.mode === "baseline" ? bundle : options.baselinePath != null ? readBundle(options.baselinePath) : bundle,
      candidate: options.mode === "capture" ? bundle : undefined,
      expectation: options.mode === "baseline" ? "baseline-establishment" : options.expectation,
      manifest: loaded.manifest,
    })
    : focused.pack.name === "bounded-falsification" || focused.pack.name === "complexity" || focused.pack.name === "foundation-integrity" || focused.pack.name === "shift-left" || focused.pack.name === "status-scope"
      ? evaluateDecisionGapPack({
        baseline: options.mode === "baseline"
          ? bundle
          : focused.pack.name === "foundation-integrity" || focused.pack.name === "bounded-falsification"
            ? projectBundles([readBundle(options.baselinePath!)], loaded.digest, loaded.manifest.scenarios.map((scenario) => scenario.id))
            : readBundle(options.baselinePath!),
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
