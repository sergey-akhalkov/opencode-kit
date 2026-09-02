import {
  readKaizenSignal,
  transitionKaizenSignal,
} from "../../global/plugin/kaizen/store.ts";
import type { KaizenDecision, KaizenSignal, KaizenStore } from "../../global/plugin/kaizen/store.ts";
import {
  acquireBeadsBridgeWriterLease,
  loadBeadsBridgeRegistration,
  releaseBeadsBridgeWriterLease,
} from "./beads-bridge-registration.ts";
import type { BeadsBridgeProcessIdentity, BeadsBridgeWriterLease } from "./beads-bridge-registration.ts";
import { BeadsAdapterError, runBeadsAdapter } from "./beads-vendor-adapter.ts";
import type { BeadsAdapterDependencies, BeadsIssueFact } from "./beads-vendor-adapter.ts";

export type BeadsKaizenPromotionInput = {
  registrationFile: string;
  signalRef: string;
  decisionRef: string;
  processIdentity: BeadsBridgeProcessIdentity;
};

export type BeadsKaizenPromotionDependencies = {
  adapter?: BeadsAdapterDependencies;
  afterCreate?: () => void;
};

export type BeadsKaizenPromotionResult = {
  schemaVersion: 1;
  signalRef: string;
  decisionRef: string;
  projectRef: string;
  beadsId: string;
  created: boolean;
  kaizenTransitionAppended: boolean;
  status: "promoted" | "already-promoted";
};

export class BeadsKaizenPromotionError extends Error {
  readonly code: string;

  constructor(message: string, code: string, options: { cause?: unknown } = {}) {
    super(message, options.cause == null ? undefined : { cause: options.cause });
    this.name = "BeadsKaizenPromotionError";
    this.code = code;
  }
}

const SIGNAL_REF = /^signal_[a-f0-9]{32}$/u;
const DECISION_REF = /^decision_[a-f0-9]{32}$/u;

function exactKeys(value: Record<string, unknown>, keys: string[], label: string): void {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) throw new BeadsKaizenPromotionError(`${label} fields are invalid.`, "invalid-request");
}

function parseInput(value: unknown): BeadsKaizenPromotionInput {
  if (value == null || typeof value !== "object" || Array.isArray(value)) throw new BeadsKaizenPromotionError("Promotion input must be an object.", "invalid-request");
  const source = value as Record<string, unknown>;
  exactKeys(source, ["registrationFile", "signalRef", "decisionRef", "processIdentity"], "Promotion input");
  if (typeof source.registrationFile !== "string" || source.registrationFile.trim() === "") throw new BeadsKaizenPromotionError("registrationFile is invalid.", "invalid-request");
  if (typeof source.signalRef !== "string" || !SIGNAL_REF.test(source.signalRef)) throw new BeadsKaizenPromotionError("signalRef is invalid.", "invalid-request");
  if (typeof source.decisionRef !== "string" || !DECISION_REF.test(source.decisionRef)) throw new BeadsKaizenPromotionError("decisionRef is invalid.", "invalid-request");
  return {
    registrationFile: source.registrationFile,
    signalRef: source.signalRef,
    decisionRef: source.decisionRef,
    processIdentity: source.processIdentity as BeadsBridgeProcessIdentity,
  };
}

function decision(signal: KaizenSignal, decisionRef: string): KaizenDecision {
  const selected = signal.decision;
  if (selected == null) throw new BeadsKaizenPromotionError("Signal has no current triage decision.", "zero-owner");
  if (selected.decisionRef !== decisionRef) throw new BeadsKaizenPromotionError("Current signal decision does not match the requested decision.", "decision-mismatch");
  if (selected.decision !== "project-change" && selected.decision !== "kit-candidate") {
    throw new BeadsKaizenPromotionError("Current decision is not eligible for Beads promotion.", "ineligible-decision");
  }
  return selected;
}

function title(signal: KaizenSignal): string {
  if (signal.summary.length < 1 || signal.summary.length > 200) throw new BeadsKaizenPromotionError("Kaizen summary is outside the bounded feature-title envelope.", "unsafe-payload");
  return signal.summary;
}

function exactItem(item: BeadsIssueFact, metadata: ReturnType<typeof bridgeMetadata>, signalRef: string): boolean {
  return item.externalRef === signalRef
    && item.metadata.bridgeSchemaVersion === metadata.bridgeSchemaVersion
    && item.metadata.kaizenSignalRef === metadata.kaizenSignalRef
    && item.metadata.decisionRef === metadata.decisionRef
    && item.metadata.projectRef === metadata.projectRef
    && item.metadata.ownerClass === metadata.ownerClass;
}

function bridgeMetadata(selected: KaizenDecision, projectRef: string) {
  return {
    bridgeSchemaVersion: 1 as const,
    kaizenSignalRef: selected.signalRef,
    decisionRef: selected.decisionRef,
    projectRef,
    ownerClass: selected.ownerClass as "current-project" | "opencode-kit",
  };
}

function terminalClosure(lease: BeadsBridgeWriterLease, evidence: string) {
  return {
    schemaVersion: 1 as const,
    status: "terminal" as const,
    observedAt: new Date().toISOString(),
    processRef: lease.processRef,
    childProcessRefs: [],
    evidenceRefs: [evidence],
  };
}

function releaseOnError(error: unknown, registrationFile: string, lease: BeadsBridgeWriterLease): void {
  if (error instanceof BeadsAdapterError && error.failure?.process.cleanupState === "unknown") return;
  releaseBeadsBridgeWriterLease(
    registrationFile,
    loadBeadsBridgeRegistration(registrationFile),
    lease,
    terminalClosure(lease, "evidence:kaizen-promotion-failure-terminal"),
  );
}

function issueItems(response: ReturnType<typeof runBeadsAdapter>): { items: BeadsIssueFact[]; truncated: boolean } {
  if (response.result.kind !== "issues") throw new BeadsKaizenPromotionError("Adapter did not return issue facts.", "invalid-adapter-result");
  return response.result;
}

export async function promoteKaizenSignalToBeads(
  store: KaizenStore,
  inputValue: unknown,
  dependencies: BeadsKaizenPromotionDependencies = {},
): Promise<BeadsKaizenPromotionResult> {
  const input = parseInput(inputValue);
  const registration = loadBeadsBridgeRegistration(input.registrationFile);
  if (!registration.enabled) throw new BeadsKaizenPromotionError("Beads registration is disabled.", "registration-disabled");
  const signal = await readKaizenSignal(store, input.signalRef);
  const selected = decision(signal, input.decisionRef);
  if (signal.status !== "triaged" && signal.status !== "promoted") throw new BeadsKaizenPromotionError("Signal is not in a promotable state.", "signal-state");
  if (selected.decision === "project-change") {
    if (selected.ownerClass !== "current-project" || registration.ownerClass !== "current-project" || !signal.projectRefs.includes(registration.projectRef)) {
      throw new BeadsKaizenPromotionError("Project-change decision does not match the enabled registration.", "wrong-project");
    }
  } else if (selected.ownerClass !== "opencode-kit" || registration.ownerClass !== "opencode-kit") {
    throw new BeadsKaizenPromotionError("Kit-candidate decision does not match an enabled kit-owner registration.", "wrong-owner");
  }
  const featureTitle = title(signal);
  const metadata = bridgeMetadata(selected, registration.projectRef);
  const lease = acquireBeadsBridgeWriterLease(input.registrationFile, registration, "create-feature", input.processIdentity);
  let item: BeadsIssueFact;
  let created = false;
  try {
    const lookup = issueItems(runBeadsAdapter({
      operation: "list",
      executablePath: registration.binaryPath,
      projectRoot: registration.projectRoot,
      limit: 100,
      correlation: metadata,
    }, dependencies.adapter));
    if (lookup.truncated || lookup.items.length > 1) throw new BeadsKaizenPromotionError("Multiple or truncated Beads correlation is a repair gate.", "duplicate-correlation");
    if (lookup.items.length === 1) {
      item = lookup.items[0];
      if (!exactItem(item, metadata, signal.signalRef)) throw new BeadsKaizenPromotionError("Beads correlation does not match the Kaizen owner identity.", "competing-portfolio-state");
    } else {
      if (signal.status === "promoted") throw new BeadsKaizenPromotionError("Promoted Kaizen signal has no canonical Beads correlation.", "competing-portfolio-state");
      const create = issueItems(runBeadsAdapter({
        operation: "create-feature",
        executablePath: registration.binaryPath,
        projectRoot: registration.projectRoot,
        title: featureTitle,
        externalRef: signal.signalRef,
        metadata,
      }, dependencies.adapter));
      if (create.items.length !== 1 || !exactItem(create.items[0], metadata, signal.signalRef)) throw new BeadsKaizenPromotionError("Atomic Beads create did not return the exact correlation.", "invalid-adapter-result");
      item = create.items[0];
      created = true;
      dependencies.afterCreate?.();
      const readback = issueItems(runBeadsAdapter({
        operation: "list",
        executablePath: registration.binaryPath,
        projectRoot: registration.projectRoot,
        limit: 100,
        correlation: metadata,
      }, dependencies.adapter));
      if (readback.truncated || readback.items.length !== 1 || readback.items[0].id !== item.id || !exactItem(readback.items[0], metadata, signal.signalRef)) {
        throw new BeadsKaizenPromotionError("Atomic Beads create readback is missing or ambiguous.", "create-readback-mismatch");
      }
      item = readback.items[0];
    }
    const current = await readKaizenSignal(store, signal.signalRef);
    if (current.decision?.decisionRef !== selected.decisionRef) throw new BeadsKaizenPromotionError("Kaizen decision changed after Beads readback.", "decision-mismatch");
    let output: BeadsKaizenPromotionResult;
    if (current.status === "promoted") {
      output = { schemaVersion: 1, signalRef: signal.signalRef, decisionRef: selected.decisionRef, projectRef: registration.projectRef, beadsId: item.id, created, kaizenTransitionAppended: false, status: "already-promoted" };
    } else {
      if (current.status !== "triaged") throw new BeadsKaizenPromotionError("Kaizen signal state changed after Beads readback.", "signal-state");
      await transitionKaizenSignal(store, { signalRef: signal.signalRef, status: "promoted", note: `beads:${item.id}` });
      output = { schemaVersion: 1, signalRef: signal.signalRef, decisionRef: selected.decisionRef, projectRef: registration.projectRef, beadsId: item.id, created, kaizenTransitionAppended: true, status: "promoted" };
    }
    releaseBeadsBridgeWriterLease(input.registrationFile, registration, lease, terminalClosure(lease, "evidence:beads-create-readback-kaizen-transition-terminal"));
    return output;
  } catch (cause) {
    releaseOnError(cause, input.registrationFile, lease);
    if (cause instanceof BeadsKaizenPromotionError) throw cause;
    throw new BeadsKaizenPromotionError("Kaizen-to-Beads promotion failed before ordered completion.", "promotion-failed", { cause });
  }
}
