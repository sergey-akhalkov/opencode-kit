---
name: openspec-propose
description: Propose a new OpenSpec change with proposal, design, specs, and tasks. Use ONLY when the user names OpenSpec. Do not use for ordinary product ideas without OpenSpec.
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

4. **Create artifacts in sequence until apply requirements are complete**

   Use the **TodoWrite tool** to track progress through the artifacts.

   Before drafting the first candidate, work from the original accepted request rather than the scaffold: identify the observable success boundary, current envelope/non-goals, strongest coherent-wrong-outcome path, silent owner-decision path, missing-oracle path, likely late implementation invalidation, and strongest unnecessary-scope candidate. Use those hypotheses to improve the artifacts. Persist only decision-relevant outcomes; never persist raw private request text, hidden reasoning, or a reviewer transcript.

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
      - Keep one change-level `Claim And Evidence Scope` owner. An Ordinary Small exact case uses one concise line naming the exact claim and proof boundary. A declared broad class uses the explicit fields supplied by the proposal rule; do not infer the class from prose or repeat the complete record in design/spec/tasks.
      - In proposal.md, declare exactly one `Bounded Falsification Review`: `required - <decision surface>` for decision-material work, or `exempt - <Ordinary Small reason>` only after main reviews that exact exemption. Deterministic tooling validates shape, not materiality or task fit.
      - Show brief progress: "Created <artifact-id>"

   b. **Continue until all `applyRequires` artifacts are complete**
      - After creating each artifact, re-run `openspec status --change "<name>" --json`
      - Check if every artifact ID in `applyRequires` has `status: "done"` in the artifacts array
      - Stop when all `applyRequires` artifacts are done

   c. **If an artifact requires user input** (unclear context):
      - Use **AskUserQuestion tool** to clarify
      - Then continue with creation

5. **Create strategy history**

   Create `<changeRoot>/history.md` with `# Strategy History`. Record only materially distinct strategies actually considered or tried while preparing this change. Each entry contains objective, approach, evidence, outcome, reason, do-not-repeat condition, and evidence-based retry condition. If no strategy has been tried, retain the heading and state that no attempts are recorded yet; do not invent history.

6. **Run the bounded falsification episode**

   Read the proposal declaration. If it is `exempt`, create no `falsification-review.md`; the reviewed reason remains semantic main-owned input. If it is `required`:
   - Reuse a current terminal record only when the original request, candidate, decision surface, and decision-changing evidence are unchanged. Never launch an equivalent challenge for confidence.
   - Otherwise launch one fresh `implementation-readiness-reviewer`. Supply the original accepted request and success boundary separately from the candidate, plus the apply-required artifacts, envelope, non-goals, invariants, proof boundary, and relevant evidence. Require the six attack classes, explicit permission for `no-material-finding`, and the role's read-only/no-question/no-nested-agent/non-authorizing boundary.
   - Main independently reproduces and dispositions only rows containing a current accepted outcome or non-deferrable invariant, reachable current-envelope scenario, concrete consequence, exact evidence, current-scope justification, and smallest correction. Optional, future, style, polish, and unproven rows create no work.
   - Apply the smallest confirmed correction. Launch at most one fresh corrected-candidate re-review only when that correction changes the challenged outcome, envelope, invariant, proof boundary, user-owned decision, or material-risk surface. A second challenge exhausts the generic episode; no unchanged, optional, or confidence-seeking third challenge is permitted.
   - Write `<changeRoot>/falsification-review.md` using only the operation-gate contract's privacy-safe references and explicit facts: original/reviewed request, accepted outcome, candidate/reviewed candidate, decision surface, reviewer/session/model, challenge count, six attack rows, material findings and main dispositions, correction/invalidation, terminal reason/state, and unresolved evidence. If the reviewer is unavailable or unusable, preserve only observed `unknown` facts and do not claim semantic readiness.

7. **Validate operation readiness**

   If proposal.md contains `**Claim Class**`, first create one reviewed schema-valid development claim record in `<changeRoot>/evidence-index.json`; absent observations/oracle/challenge stay `unknown`/`missing` with empty refs and a non-supported disposition. Never invent evidence. Concise exact claims need no record.
   Resolve the current project root and active kit global source explicitly. Use `OPENCODE_CONFIG_DIR` first when it is non-empty and contains the exact `bin/openspec-operation-gate.ts` helper. Otherwise inspect the supported host-default source and privacy-safe runtime-source/collision evidence. Never strip a final `global` segment or guess a repository-parent `bin`. Run the portable gate from the verified source; do not require a target-project package script.
   Run `node "<global-source>/bin/openspec-operation-gate.ts" --root "<project-root>" --operation propose --change "<name>"`, then `openspec validate "<name>" --strict`, then the same portable gate with `--operation apply`.

   Stop on any non-zero exit and preserve the command, status, output, and artifact. The apply probe is effect-free. Deterministic gate success proves structural artifact readiness only; it never supplies semantic task-fit evidence.

8. **Show final status**
   Run `openspec status --change "<name>"`.

**Output**

After completing all artifacts and all three readiness checks, summarize:
- Change name and location
- List of artifacts created with brief descriptions
- `Structural artifact readiness: passed | failed`
- `Bounded falsification: exempt | no-material-finding | corrected-and-closed | unknown`
- `Semantic implementation readiness: ready | unknown`; emit `ready` only for a reviewed exemption or current closed episode, never from deterministic checks alone
- Prompt: "Run `/opsx-apply` or ask me to implement to start working on the tasks."
- Lifecycle: planning artifacts alone remain `Development-Stage: development`; never emit an RC or stable claim from this command

## Output Contract

Return the change/location, three readiness outcomes, blockers or `none`, and `Development-Stage: development`.

**Guardrails**
- Create ALL artifacts needed for implementation (as defined by schema's `apply.requires`)
- Always read dependency artifacts before creating a new one
- If context is critically unclear, ask the user - but prefer making reasonable decisions to keep momentum
- If a change with that name already exists, ask if user wants to continue it or create a new one
- Verify each artifact file exists after writing before proceeding to next
- Create `history.md` before readiness checks and never manufacture attempted strategies
- Do not append a mandatory final retrospective or process-improvement task; keep optional workflow reflection outside product completion scope
- Do not collapse structural artifact readiness and semantic implementation readiness into one `Ready for implementation` phrase
- Do not claim semantic implementation readiness until structural checks pass and the reviewed exemption or current required episode is terminal
- Do not treat implementation readiness as implemented, runtime-proved, RC-qualified, or stable
- Author attempt limits and stop lines as revisable process controls, not immutable owner scope. Their later update needs no owner approval when accepted semantics remain unchanged; authority for the underlying protected action remains separate.
- Declare exactly one `Automation Dividend`: Material `required - <candidate>`; Ordinary Small may `exempt - <reason>`. Do not infer the mode.
- Declare exactly one `Bounded Falsification Review`; no empty record for an exemption, raw request persistence, duplicate generic review, or deterministic semantic inference.
