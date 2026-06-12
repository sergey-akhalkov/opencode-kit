import { applyStopToRuntimeState } from "./openspec-autopilot-runtime.ts";
import {
  createAnswerBlockerOutput,
  createCollectOutput,
  createRunNextOutput,
  createStatusOutput,
  createStopOutput,
  readAutopilotQueueSummaries,
  readLedgerSummaries,
  validateBlockerAnswer,
  type AutopilotOptions,
  type AutopilotOutput,
} from "./openspec-autopilot-output.ts";

export type AutopilotScope = {
  changeId?: string;
  taskId?: string;
};

export type TriggerSource = {
  kind: "model-tool" | "programmatic-trigger" | "tui-command";
  name?: string;
  eventType?: string;
};

export type BlockerAnswerArgs = {
  questionId: string;
  taskId?: string;
  selectedLabel?: string;
  action?: string;
};

export type StopArgs = {
  target?: string;
  id?: string;
  reason?: string;
};

export type AutopilotControllerResult = {
  payload: AutopilotOutput;
  metadata: Record<string, unknown>;
};

export type AutopilotController = {
  runNext(scope: AutopilotScope, source?: TriggerSource): Promise<AutopilotControllerResult>;
  status(scope: Pick<AutopilotScope, "changeId">, source?: TriggerSource): Promise<AutopilotControllerResult>;
  collect(scope: Pick<AutopilotScope, "taskId">, source?: TriggerSource): Promise<AutopilotControllerResult>;
  answerBlocker(args: BlockerAnswerArgs, source?: TriggerSource): Promise<AutopilotControllerResult>;
  stop(args: StopArgs, source?: TriggerSource): Promise<AutopilotControllerResult>;
};

type ControllerContext = {
  root: string;
};

function sourceMetadata(source: TriggerSource | undefined): Record<string, unknown> {
  if (source == null || source.kind === "model-tool") {
    return {};
  }
  return {
    triggerSource: Object.fromEntries(Object.entries({
      kind: source.kind,
      name: source.name,
      eventType: source.eventType,
    }).filter((entry): entry is [string, string] => typeof entry[1] === "string" && entry[1].trim().length > 0)),
  };
}

function result(payload: AutopilotOutput, metadata: Record<string, unknown> = {}, source?: TriggerSource): AutopilotControllerResult {
  return {
    payload,
    metadata: {
      ...metadata,
      ...sourceMetadata(source),
      service: "openspec-autopilot",
      outcome: payload.outcome,
    },
  };
}

function stopArgumentContext(args: StopArgs, stopApplied: boolean): { acknowledged: string[]; ignored: string[]; mutation: string } {
  const idProvided = typeof args.id === "string";
  const idAcknowledged = stopApplied && idProvided && (args.target ?? "run") !== "all";
  return {
    acknowledged: stopApplied ? ["target", ...(idAcknowledged ? ["id"] : [])] : ["target"],
    ignored: [...(idProvided && !idAcknowledged ? ["id"] : []), "reason"],
    mutation: stopApplied ? "plugin-owned-runtime-only" : "none",
  };
}

export function createAutopilotController(ctx: ControllerContext, options: AutopilotOptions = {}): AutopilotController {
  return {
    async runNext(scope: AutopilotScope = {}, source?: TriggerSource): Promise<AutopilotControllerResult> {
      const queue = readAutopilotQueueSummaries(ctx.root, options, { changeId: scope.changeId, taskId: scope.taskId });
      return result(createRunNextOutput(queue.ledgers, { dependencyGraph: queue.dependencyGraph, runtimeState: options.runtimeState }), {}, source);
    },

    async status(scope: Pick<AutopilotScope, "changeId"> = {}, source?: TriggerSource): Promise<AutopilotControllerResult> {
      const queue = readAutopilotQueueSummaries(ctx.root, options, { changeId: scope.changeId });
      return result(createStatusOutput(queue.ledgers, { dependencyGraph: queue.dependencyGraph, runtimeState: options.runtimeState }), {}, source);
    },

    async collect(scope: Pick<AutopilotScope, "taskId"> = {}, source?: TriggerSource): Promise<AutopilotControllerResult> {
      const ledgers = readLedgerSummaries(ctx.root, options, { taskId: scope.taskId });
      return result(createCollectOutput(ledgers, { runtimeState: options.runtimeState, mutateRuntimeState: true }), {}, source);
    },

    async answerBlocker(args: BlockerAnswerArgs, source?: TriggerSource): Promise<AutopilotControllerResult> {
      const validation = validateBlockerAnswer(options.runtimeState, args);
      return result(createAnswerBlockerOutput(args.questionId, validation), {
        argumentContext: {
          acknowledged: validation.accepted ? ["questionId", "taskId", "selectedLabel", "action"] : ["questionId"],
          ignored: validation.accepted ? [] : ["taskId", "selectedLabel", "action"],
          mutation: "none",
        },
      }, source);
    },

    async stop(args: StopArgs, source?: TriggerSource): Promise<AutopilotControllerResult> {
      const stoppedEntries = applyStopToRuntimeState(args.target, args.id, options.runtimeState);
      const output = createStopOutput(args.target, { id: args.id, stoppedEntries });
      return result(output, {
        argumentContext: stopArgumentContext(args, output.reasonCode === "stop_applied"),
      }, source);
    },
  };
}

export function toPluginToolOutput(result: AutopilotControllerResult): { output: string; metadata: Record<string, unknown> } {
  return {
    output: JSON.stringify(result.payload, null, 2),
    metadata: result.metadata,
  };
}
