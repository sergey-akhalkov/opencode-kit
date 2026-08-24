export const GLOBAL_ENGINEERING_QUALITY_MARKERS: readonly string[] = [
  "Line count is a navigation signal, not a quota",
  "`split-or-justify`",
  "original exception cause and stack",
  "Log once at the owning boundary",
  "stdout and stderr",
  "artifact paths",
  "Inspect preserved diagnostics before",
  "smallest safe instrumentation",
  "architecture-and-change-locality",
  "Zero-trigger work launches no owner",
  "no-current-owner",
  "same-versus-new uncertainty",
];

export const ENGINEERING_QUALITY_SURFACES: readonly {
  relative: string;
  markers: readonly string[];
}[] = [
  {
    relative: "REPO_AGENTS.md",
    markers: ["split-or-justify", "exception cause/stack", "stdout/stderr", "artifact paths"],
  },
  {
    relative: "templates/project/AGENTS.md",
    markers: ["split-or-justify", "exception cause/stack", "stdout/stderr", "artifact paths"],
  },
  {
    relative: "instructions/reusable-project-agent-instructions.md",
    markers: ["split-or-justify", "exception cause/stack", "stdout/stderr", "artifact paths"],
  },
  {
    relative: "instructions/universal-development-loop.md",
    markers: ["split-or-justify", "exception cause/stack", "stdout/stderr", "artifact paths"],
  },
  {
    relative: "global/skills/change-ready-sdlc/SKILL.md",
    markers: ["split-or-justify", "exception cause/stack", "stdout/stderr", "artifact paths"],
  },
  {
    relative: "global/skills/deep-task-planning/SKILL.md",
    markers: ["Architecture And Context Plan", "Diagnostic Evidence Plan", "stdout/stderr"],
  },
  {
    relative: "global/skills/code-quality-audit/SKILL.md",
    markers: ["Context-heavy module", "Opaque failure path", "split-or-justify"],
  },
  {
    relative: "global/skills/service-architecture-design/SKILL.md",
    markers: ["split-or-justify", "exception cause/stack", "stdout/stderr", "artifact paths"],
  },
  {
    relative: "global/skills/instruction-artifact-tuning/SKILL.md",
    markers: ["split-or-justify", "stdout/stderr", "hard line quotas"],
  },
  {
    relative: "global/agents/implementation-worker.md",
    markers: ["split-or-justify", "exception cause/stack", "stdout/stderr", "artifact paths", "named responsibility boundary and change axis", "Owner reshape is in-scope"],
  },
  {
    relative: "instructions/practice-owner-agent-contract.md",
    markers: ["explicit sibling of a live owner"],
  },
  {
    relative: "global/agents/openspec-architecture-reviewer.md",
    markers: ["architecture-and-change-locality", "Main keeps the concrete design decision"],
  },
  {
    relative: "global/principles-of-work.md",
    markers: ["Hypothetical extensibility is not a seam"],
  },
  {
    relative: "global/agents/sdet-quality-engineer.md",
    markers: ["exception cause/stack", "stdout/stderr", "artifact paths"],
  },
  {
    relative: "global/agents/troubleshooter.md",
    markers: ["exception cause/stack", "stdout/stderr", "artifact paths"],
  },
];
