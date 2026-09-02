export const OPENSPEC_KNOWN_OPERATIONS: readonly string[] = [
  "propose",
  "apply",
  "task-update",
  "review",
  "acceptance",
  "archive",
  "post-archive",
];

export const OPENSPEC_PROPOSAL_OPERATIONS: readonly string[] = [
  "propose",
  "apply",
  "review",
  "acceptance",
  "archive",
];

export const OPENSPEC_TASKS_OPERATIONS: readonly string[] = [
  "apply",
  "task-update",
  "review",
  "acceptance",
  "archive",
];

export const OPENSPEC_SPEC_DELTA_OPERATIONS: readonly string[] = [
  "propose",
  "apply",
];

export const OPENSPEC_ARTIFACT_INSTRUCTION_SURFACES: ReadonlyArray<{
  markers: readonly string[];
  relative: string;
}> = [
  {
    relative: "global/AGENTS.md",
    markers: [
      "## OpenSpec Change Authoring",
      "artifactProfile: compact | full",
      "riskDisposition.kind: ordinary-small-exact | material | unknown",
      "Observable Proof",
      "Automation Dividend",
      "history.md",
    ],
  },
  {
    relative: "global/skills/openspec-propose/SKILL.md",
    markers: [
      "artifactProfile: compact | full",
      "riskDisposition.kind: ordinary-small-exact | material | unknown",
      "Preserve strategy history when observed",
      "Bounded falsification: not-applicable | exempt",
      "openspec-operation-gate.ts",
    ],
  },
  {
    relative: "global/skills/openspec-apply-change/SKILL.md",
    markers: [
      "artifactProfile",
      "riskDisposition.kind",
      "Bounded falsification: not-applicable | exempt",
      "Delivery Horizon",
      "openspec-operation-gate.ts",
    ],
  },
  {
    relative: "global/skills/openspec-archive-change/SKILL.md",
    markers: [
      "artifactProfile",
      "riskDisposition.kind",
      "compact-unlinked",
      "openspec-archive.ts",
    ],
  },
  {
    relative: "instructions/reusable-project-agent-instructions.md",
    markers: ["OpenSpec", "artifact-profile/risk-disposition", "compact", "global"],
  },
  {
    relative: "templates/project/AGENTS.md",
    markers: ["OpenSpec", "artifact-profile/risk-disposition", "compact", "global"],
  },
];
