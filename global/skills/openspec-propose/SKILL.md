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

I'll create a change with profile-required artifacts:
- proposal.md (what & why)
- design.md (how)
- tasks.md (implementation steps)
- history.md only after a materially distinct strategy event

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

2. **Reconstruct candidate-free context when current distinctions are at risk**

   Before `openspec new change`, work only from the original accepted request, observable success boundary, current envelope/non-goals, and current raw source/system evidence. If a current decision can collapse evidenced differences in representation, identity, occurrence, actor, state, lifecycle, ownership, recovery, or proof outcome, launch one fresh `implementation-readiness-reviewer` with no `task_id` and no current candidate. The candidate must not yet exist in a prompt, change artifact, inline frame, or searchable workspace. Preserve the exact returned task identity and candidate-free reconstruction session-locally; do not persist private prompt text or a transcript. If identity or reconstruction is unusable, keep the prospective protocol `unknown`, do not launch a candidate-visible substitute, and continue only structural authoring that does not claim semantic readiness. If no current distinction pressure exists, do not add this phase. Ordinary Small exact and exact substitution routes retain their existing owners.

3. **Create the change directory**
   Run `openspec new change "<name>"`.
   This creates a scaffolded change in the planning home resolved by the CLI with `.openspec.yaml`.

4. **Get the artifact build order**
   Run `openspec status --change "<name>" --json`.
   Parse the JSON to get:
   - `applyRequires`: array of artifact IDs needed before implementation (e.g., `["tasks"]`)
   - `artifacts`: list of all artifacts with their status and dependencies
   - `planningHome`, `changeRoot`, `artifactPaths`, and `actionContext`: path and scope context. Use these instead of assuming repo-local paths.

5. **Create artifacts in sequence until apply requirements are complete**

   Use the **TodoWrite tool** to track progress through the artifacts.

   Before drafting the first candidate, work from the original accepted request rather than the scaffold: identify the observable success boundary, current envelope/non-goals, strongest coherent-wrong-outcome path, silent owner-decision path, missing-oracle path, likely late implementation invalidation, and strongest unnecessary-scope candidate. Use those hypotheses to improve the artifacts. Persist only decision-relevant outcomes; never persist raw private request text, hidden reasoning, or a reviewer transcript.

   Before writing any artifact, main records two independent reviewed facts in `.openspec.yaml`: `artifactProfile: compact | full` and `riskDisposition.kind: ordinary-small-exact | material | unknown`. The `riskDisposition` object contains exactly `kind`; keep supporting evidence in reviewed planning prose or its source, never as another metadata key. Compact is available only for a bounded exact Ordinary Small increment with no broad claim or decision-material surface. Material or unknown risk selects full; unknown remains structurally authorable but semantically unknown and cannot authorize apply/archive mutation. Do not infer either axis from prose, paths, diffs, file/task counts, model output, or helper scoring. Both fields absent is legacy compatibility only, not a new-authoring option.

   If the selected profile is full, select exactly one proposal declaration: an existing validated project Horizon id, or `none - <concrete reason>`. If compact, omit an unlinked Horizon and declare only an existing validated Horizon id when the change is explicitly linked. Never infer membership. For a linked proposal with a prior successful archive in the same Horizon, identify the latest explicitly linked archive and run `node "<global-source>/bin/delivery-trajectory-context.ts" --root "<project-root>" --horizon "<horizon-id>" --archive "<archive-id>" --format json` from the exact active global source. Main, not the helper, evaluates the compact signal from those facts. If it is `review-required`, load `roadmap-delivery-trajectory` once for the current evidence tuple and consume or create its matching terminal receipt before dependent planning or artifact writes. If it is `unknown`, obtain the smallest safe discriminating observation or block only the affected dependent planning; another Horizon, unrelated work, and safe evidence collection remain available.

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
      - A compact proposal contains `Outcome`, `Operating Envelope`, `Non-Goals`, `Non-Deferrable Invariants`, `Observable Proof`, and `Stop Line`; its Observable Proof is the exact claim boundary. A full proposal retains the complete seven-field capsule including `Material Residual Risks`.
      - Keep one change-level broad `Claim And Evidence Scope` owner only under full artifacts. A declared broad class uses the explicit fields supplied by the proposal rule; do not infer the class from prose or repeat the complete record in design/spec/tasks.
      - Under compact exact, omit absent Horizon, dividend, bounded-falsification, separate claim-scope, and no-event history records rather than declaring `none` or `exempt`. An explicitly present mechanism keeps its existing parser and correlation rules. Under full, retain the current declarations: bounded falsification is `required - <decision surface>` for decision-material work or a reviewed compatible exemption; Material automation dividend is required; Horizon is an explicit id or `none - <reason>`.
      - When authoring tasks, represent independently falsifiable required prerequisites as evidence-bearing leaves and their integration as a dependent parent. Give each leaf one bounded result/owner-or-effect boundary/earliest sufficient oracle/failure-cleanup envelope, keep the parent unchecked until its distinct integration oracle passes, and keep same-leaf corrections, cohesive Ordinary Small work, and grouped mechanical edits direct. Do not create per-file tasks or numeric granularity rules, infer semantics in deterministic tooling, weaken accepted proof, or replace exact owner/protected/live gates.
      - Show brief progress: "Created <artifact-id>"

   b. **Continue until all `applyRequires` artifacts are complete**
      - After creating each artifact, re-run `openspec status --change "<name>" --json`
      - Check if every artifact ID in `applyRequires` has `status: "done"` in the artifacts array
      - Stop when all `applyRequires` artifacts are done

   c. **If an artifact requires user input** (unclear context):
      - Use **AskUserQuestion tool** to clarify
      - Then continue with creation

6. **Preserve strategy history when observed**

   Create or append `<changeRoot>/history.md` only after a materially distinct strategy was considered, attempted, rejected, superseded, or preserved for retry continuity. Each entry contains objective, approach, evidence, outcome, reason, do-not-repeat condition, and evidence-based retry condition. If no strategy event occurred, omit the file; full profile selection alone does not manufacture an empty history.

7. **Run the bounded falsification episode**

   Read current metadata and the proposal declaration. For compact plus current `ordinary-small-exact` with no decision-material surface, omit both the declaration and `falsification-review.md`; report the episode as not applicable. For a full reviewed exemption, create no `falsification-review.md`; the reason remains semantic main-owned input. If full declares `required`:
   - Reuse a current terminal record only when the original request, candidate, decision surface, and decision-changing evidence are unchanged. Never launch an equivalent challenge for confidence. An existing candidate without a candidate-free reconstruction remains `single-stage`.
   - When step 2 returned a usable reconstruction and exact task identity, resume that exact returned child with the authored candidate. Supply the apply-required artifacts, envelope, non-goals, invariants, proof boundary, and relevant evidence, but do not rebuild context around the now-existing candidate. Candidate-free reconstruction plus this exact initial continuation is one challenge. Verify the returned identity matches; otherwise keep the protocol and semantic readiness `unknown` without a substitute review.
   - Otherwise launch one fresh single-stage `implementation-readiness-reviewer`. Supply the original accepted request and success boundary separately from the candidate, plus the apply-required artifacts, envelope, non-goals, invariants, proof boundary, and relevant evidence. Require the six attack classes, explicit permission for `no-material-finding`, and the role's read-only/no-question/no-nested-agent/non-authorizing boundary.
   - Main independently reproduces and dispositions only rows containing a current accepted outcome or non-deferrable invariant, reachable current-envelope scenario, concrete consequence, exact evidence, current-scope justification, and smallest correction. Optional, future, style, polish, and unproven rows create no work.
   - Apply the smallest confirmed correction. Launch at most one fresh corrected-candidate re-review only when that correction changes the challenged outcome, envelope, invariant, proof boundary, user-owned decision, or material-risk surface. For a pre-authoring-separated episode, supply the same still-current frozen reconstruction to that fresh child; never resume the initial candidate comparison or reconstruct around the corrected candidate. If new raw evidence invalidates the frozen reconstruction, corrected review and semantic readiness stay `unknown`. A second challenge exhausts the generic episode; no unchanged, optional, or confidence-seeking third challenge is permitted.
   - Write `<changeRoot>/falsification-review.md` using only the operation-gate contract's privacy-safe references and explicit facts: original/reviewed request, accepted outcome, candidate/reviewed candidate, decision surface, reviewer/session/model, challenge count, six attack rows, material findings and main dispositions, correction/invalidation, terminal reason/state, and unresolved evidence. If the reviewer is unavailable or unusable, preserve only observed `unknown` facts and do not claim semantic readiness.

8. **Validate operation readiness**

   If the proposal makes a broad claim, state its maximum supported scope directly and name the real observable proof that would support it. Do not create an evidence index, lane record, or retained proof report.
   Resolve the current project root and active kit global source explicitly. Use `OPENCODE_CONFIG_DIR` first when it is non-empty and contains the exact `bin/openspec-operation-gate.ts` helper. Otherwise inspect the supported host-default source and privacy-safe runtime-source/collision evidence. Never strip a final `global` segment or guess a repository-parent `bin`. Run the portable gate from the verified source; do not require a target-project package script.
   Run `node "<global-source>/bin/openspec-operation-gate.ts" --root "<project-root>" --operation propose --change "<name>"`, then `openspec validate "<name>" --strict`, then the same portable gate with `--operation apply`.

   Stop on any non-zero exit and preserve the command, status, output, and artifact. The apply probe is effect-free. Deterministic gate success proves structural artifact readiness only; it never supplies semantic task-fit evidence.

9. **Show final status**
   Run `openspec status --change "<name>"`.

**Output**

After completing all artifacts and all three readiness checks, summarize:
- Change name and location
- List of artifacts created with brief descriptions
- `Structural artifact readiness: passed | failed`
- `Bounded falsification: not-applicable | exempt | no-material-finding | corrected-and-closed | unknown`
- `Semantic implementation readiness: ready | unknown`; emit `ready` only for current compact exact with no decision-material surface, a reviewed full exemption, or a current closed episode, never from deterministic checks alone
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
- Create `history.md` only after a materially distinct strategy event and never manufacture attempted strategies or an empty file
- Do not append a mandatory final retrospective or process-improvement task; keep optional workflow reflection outside product completion scope
- Do not collapse structural artifact readiness and semantic implementation readiness into one `Ready for implementation` phrase
- Do not claim semantic implementation readiness until structural checks pass and the reviewed exemption or current required episode is terminal
- Do not treat implementation readiness as implemented, runtime-proved, RC-qualified, or stable
- Author attempt limits and stop lines as revisable process controls, not immutable owner scope. Their later update needs no owner approval when accepted semantics remain unchanged; authority for the underlying protected action remains separate.
- For compact exact, omit a non-applicable `Automation Dividend`; declare `required - <candidate>` only when repeated-use behavior is introduced or extended. Full Material requires it; full/legacy retain their current compatible contract. Do not infer eligibility.
- For compact exact with no decision-material surface, omit `Bounded Falsification Review`; full retains the current required-or-reviewed-exemption contract. Create no empty exemption record, raw request persistence, duplicate generic review, or deterministic semantic inference.
- If the selected runtime surface lacks `roadmap-delivery-trajectory` or its exact `delivery-trajectory-context.ts` helper closure, report trajectory capability unavailable and do not substitute complexity, next-step, audit, campaign, or another source.
