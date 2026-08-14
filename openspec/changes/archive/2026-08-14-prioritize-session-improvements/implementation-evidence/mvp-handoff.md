# Apply Handoff

## Outcome

The loaded compaction/apply/archive policy now distinguishes preservation, admission, and execution:

- admitted work requires an exact remaining current-change consumer and executes at its earliest safe consumer boundary;
- a same-repository multiplier requires the current change to consume and prove an existing shared owner plus another exact evidenced consumer, without authorizing mutation of that other consumer;
- evidence-backed no-current-consumer work is persisted as a non-checkbox deferred history record and does not block RC, stable, or archive;
- unsupported generic ideas create neither tasks nor deferred records;
- blocked/unknown live-attempt and non-deferrable safety gates still run first.

## Candidate And Proof

- Profile: `Material`.
- Candidate Reference: current exact hashes and active prompt SHA-256 in `runtime-proof.md`, including the 2026-08-14 refresh after the concurrent canonical-workflow change archived.
- Environment: OpenCode 1.18.18, loaded `compaction · grok-4.6` high.
- Runtime Proof: baseline plus refreshed current-consumer and deferred candidate lanes through `opencode run --agent compaction`; current lanes use the exact recorded inputs, exit 0, preserve the accepted safety/order contract, and perform no tools or repository mutation.
- Critical SDET: fresh `xai/grok-4.6`, terminal `no-critical-risk`, no test changes.
- Architecture: existing global policy/prompt/workflow owners were extended; no new scheduler, scoring helper, backlog service, or duplicate mechanism.
- Diagnostics: exact model-facing inputs, exits, output facts, side effects, previous red validation bundles, retry condition, and current green closure are recorded in `runtime-proof.md`, `critical-sdet.md`, and `history.md`.

## Validation

Green:

- `npm run test:focused:contracts`: 67 contracts passed.
- `npm run validate:strict`: `OK: skills=29 agents=18 markdown=358 warnings=0 infos=2`.
- `npm test`: exit 0.
- `openspec validate prioritize-session-improvements --strict`.
- `openspec validate --all --strict`: 13 passed, 0 failed.
- propose/apply operation gates.
- active/template compaction JSON parsing and marker readback.
- instruction inventory and runtime-source diagnostics.
- `npm run prepush:validate`: passed, including repository validation, repository tests, and OpenSpec validation.
- `git diff --check`.

The prior 51 library failures and three `.opencode/skills/openspec-*` `ENOENT` failures were owned by the concurrent canonical-workflow migration. That change completed I1 and archived; all affected validation lanes were replayed green without this change editing its owned test or fixture scope.

## Known Limitations

- Semantic compliance beyond the two recorded candidate prompts remains model-dependent and unknown.
- Running OpenCode sessions retain already-loaded instructions; a new process/session is required to load the retained policy/config changes.
- The runtime-source inventory reports host-default, custom, and project config sources. Canonical unattended workflow collisions are clear; source presence alone does not establish every running process's loaded precedence.

## Rollback And Restart

- A new OpenCode process/session is required before an operator observes the retained instruction and prompt changes; existing sessions keep their loaded instructions.
- Rollback is limited to this change's policy, prompt, canonical workflow, documentation, and normative-spec fragments. Do not restore deleted project-local canonical OpenSpec overlays or revert unrelated concurrent work.
- No installation, activation, archive, commit, push, deployment, release, credential mutation, or remote action was performed.

## Lifecycle

- Profile: `Material`.
- Outcome: working at the loaded compaction boundary.
- Live-Attempt Gate: clear.
- Development-Stage: `MVP`.
- Stable Candidate: none.
- Owner Blocker: none.
- External Operations: none.
