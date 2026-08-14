---
name: openspec-propose
description: Propose a new change with all artifacts generated in one step. Use when the user wants to quickly describe what they want to build and get a complete proposal with design, specs, and tasks ready for implementation.
allowed-tools: Bash(openspec:*)
license: MIT
compatibility: Requires openspec CLI.
metadata:
  author: openspec
  version: "1.0"
  generatedBy: "1.6.0"
---

Propose a new change - create the change and generate all artifacts in one step.

Use this skill when the user asks to propose or author a new OpenSpec change and wants every apply-required artifact generated. It authors planning controls only; implementation still follows the Universal Development Loop happy path and runtime-proof sequence.

I'll create a change with artifacts:
- proposal.md (what & why)
- design.md (how)
- tasks.md (implementation steps)
- history.md (materially distinct attempted strategies)

When ready to implement, run /opsx-apply

---

**Store selection:** If the user names a store (a store is a standalone OpenSpec repo registered on this machine) or the work lives in one, run `openspec store list --json` to discover registered store ids, then pass `--store <id>` on the commands that read or write specs and changes (`new change`, `status`, `instructions`, `list`, `show`, `validate`, `archive`, `doctor`, `context`). Other commands do not take the flag. Hints printed by commands already carry the flag; keep it on follow-ups. Without a store, commands act on the nearest local `openspec/` root.

**Input**: The user's request should include a change name (kebab-case) OR a description of what they want to build.

**Steps**

1. **If no clear input provided, ask what they want to build**

   Use the **AskUserQuestion tool** (open-ended, no preset options) to ask:
   > "What change do you want to work on? Describe what you want to build or fix."

   From their description, derive a kebab-case name (e.g., "add user authentication" → `add-user-auth`).

   **IMPORTANT**: Do NOT proceed without understanding what the user wants to build.

2. **Create the change directory**
   Run `openspec new change "<name>"`.
   This creates a scaffolded change in the planning home resolved by the CLI with `.openspec.yaml`.

3. **Get the artifact build order**
   Run `openspec status --change "<name>" --json`.
   Parse the JSON to get:
   - `applyRequires`: array of artifact IDs needed before implementation (e.g., `["tasks"]`)
   - `artifacts`: list of all artifacts with their status and dependencies
   - `planningHome`, `changeRoot`, `artifactPaths`, and `actionContext`: path and scope context. Use these instead of assuming repo-local paths.

4. **Create artifacts in sequence until apply-ready**

   Use the **TodoWrite tool** to track progress through the artifacts.

   Loop through artifacts in dependency order (artifacts with no pending dependencies first):

   a. **For each artifact that is `ready` (dependencies satisfied)**:
      - Get instructions by running `openspec instructions <artifact-id> --change "<name>" --json`.
      - The instructions JSON includes:
        - `context`: Project background (constraints for you - do NOT include in output)
        - `rules`: Artifact-specific rules (constraints for you - do NOT include in output)
        - `template`: The structure to use for your output file
        - `instruction`: Schema-specific guidance for this artifact type
        - `resolvedOutputPath`: Resolved path or pattern to write the artifact
        - `dependencies`: Completed artifacts to read for context
      - Read any completed dependency files for context
      - Create the artifact file using `template` as the structure and write it to `resolvedOutputPath`
      - Apply `context` and `rules` as constraints - but do NOT copy them into the file
      - Show brief progress: "Created <artifact-id>"

   b. **Continue until all `applyRequires` artifacts are complete**
      - After creating each artifact, re-run `openspec status --change "<name>" --json`
      - Check if every artifact ID in `applyRequires` has `status: "done"` in the artifacts array
      - Stop when all `applyRequires` artifacts are done

   c. **If an artifact requires user input** (unclear context):
      - Use **AskUserQuestion tool** to clarify
      - Then continue with creation

   d. **When the tasks artifact is authored, append the final history retrospective once**:
      - Append exactly one unchecked final-history-retrospective task as the initially last checkbox in `tasks.md`; do not add a placeholder improvement or more than one analysis task.
      - Require it to wait until every other currently known task is complete, then analyze the complete change `history.md` using the existing compaction `Quality`, `Cycle Speed`, and `Token Economy` rows across `Working Repository` and `opencode-kit`, the canonical impact/consumer/execution classification, admission/deferral gate, target ownership, authority boundaries, and record fields.
      - Require it to append and immediately execute every admitted current-consumer improvement under `## Session-Derived Improvements`, preserve no-current-consumer evidence as non-checkbox deferred history records, or record `none` without inventing work. State that apply, archive, compaction, and generated tasks must not create or rerun this final analysis.

5. **Create strategy history**

   Create `<changeRoot>/history.md` with `# Strategy History`. Record only materially distinct strategies actually considered or tried while preparing this change. Each entry contains objective, approach, evidence, outcome, reason, do-not-repeat condition, and evidence-based retry condition. If no strategy has been tried, retain the heading and state that no attempts are recorded yet; do not invent history.

6. **Validate operation readiness**

   Resolve the current project root and the active kit global source explicitly. Run the portable gate from that source; do not require a target-project package script.
   Run `node "<global-source>/bin/openspec-operation-gate.ts" --root "<project-root>" --operation propose --change "<name>"`, then `openspec validate "<name>" --strict`.

   Stop if either command exits non-zero. Do not describe the change as ready from
   artifact existence alone. Preserve the exact failing command, exit status,
   stdout/stderr, and named artifact.

7. **Show final status**
   Run `openspec status --change "<name>"`.

**Output**

After completing all artifacts and both readiness checks, summarize:
- Change name and location
- List of artifacts created with brief descriptions
- What's ready: "Artifacts and deterministic readiness checks passed. Ready for implementation."
- Prompt: "Run `/opsx-apply` or ask me to implement to start working on the tasks."
- Lifecycle: planning artifacts alone remain `Development-Stage: development`; never emit an RC or stable claim from this command

## Output Contract

Return the change identity and resolved location, created artifact list, exact readiness-check commands and outcomes, remaining blockers or `none`, and `Development-Stage: development`.

**Artifact Creation Guidelines**

- Follow the `instruction` field from `openspec instructions` for each artifact type
- The schema defines what each artifact should contain - follow it
- Read dependency artifacts for context before creating new ones
- Use `template` as the structure for your output file - fill in its sections
- **IMPORTANT**: `context` and `rules` are constraints for YOU, not content for the file
  - Do NOT copy `<context>`, `<rules>`, `<project_context>` blocks into the artifact
  - These guide what you write, but should never appear in the output

**Guardrails**
- Create ALL artifacts needed for implementation (as defined by schema's `apply.requires`)
- Always read dependency artifacts before creating a new one
- If context is critically unclear, ask the user - but prefer making reasonable decisions to keep momentum
- If a change with that name already exists, ask if user wants to continue it or create a new one
- Verify each artifact file exists after writing before proceeding to next
- Create `history.md` before readiness checks and never manufacture attempted strategies
- Ensure every newly authored `tasks.md` has exactly one initially-last unchecked final-history-retrospective task; do not retrofit an existing change merely because this creation-time task is absent
- Do not claim implementation readiness until the propose gate and strict OpenSpec validation both pass
- Do not treat implementation readiness as implemented, runtime-proved, RC-qualified, or stable
- Author attempt limits and stop lines as revisable process controls, not immutable owner scope. Their later update needs no owner approval when accepted semantics remain unchanged; authority for the underlying protected action remains separate.
