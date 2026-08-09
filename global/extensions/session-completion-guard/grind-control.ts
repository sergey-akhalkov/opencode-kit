import type { Config } from "@opencode-ai/plugin";

export type GrindControlAction = "disable" | "enable";

const COMMANDS: Record<GrindControlAction, string> = {
  disable: "disable-grind",
  enable: "enable-grind",
};

const CONFIRMATION: Record<GrindControlAction, string> = {
  disable: "Grind mode is disabled for this session. Reply with a concise confirmation only.",
  enable: "Grind mode is enabled for this session. Reply with a concise confirmation only.",
};

export function configureGrindCommands(config: Config): void {
  config.command = {
    ...(config.command ?? {}),
    [COMMANDS.enable]: {
      description: "Enable completion grind for this session",
      template: CONFIRMATION.enable,
    },
    [COMMANDS.disable]: {
      description: "Disable completion grind for this session",
      template: CONFIRMATION.disable,
    },
  };
}

export function grindControlAction(command: string): GrindControlAction | null {
  if (command === COMMANDS.enable) return "enable";
  if (command === COMMANDS.disable) return "disable";
  return null;
}

export function grindControlPart(action: GrindControlAction): Record<string, unknown> {
  return {
    type: "text",
    text: `<completion_guard_control action="${action}">${CONFIRMATION[action]}</completion_guard_control>`,
    synthetic: true,
    metadata: { action, provenance: "completion-guard" },
  };
}
