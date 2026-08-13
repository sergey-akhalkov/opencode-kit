## Context

The current completion guard intercepts `question.asked`, asks the hidden arbiter whether the decision is autonomous, and calls `question.reject` for both `continue` and `allow_stop`. It then waits for an idle event and injects a synthetic correction asking the primary agent to continue. This path cannot satisfy an interactive option-selection contract because the arbiter request carries only a hashed request id, the verdict has no answer field, and rejection returns no selected value to the suspended tool call. The maintained proof invokes `applyVerdict` directly only with `owner_required`; it never drives the installed entry point through an autonomous question.

The active executable is OpenCode 1.18.18 while the kit dependency graph provides the 1.18.15 plugin/SDK client types. The legacy official client surface used by the plugin still exposes `question.reply({requestID, answers})`, `question.reject`, and legacy plugin events with `properties`. This change uses only that supported common surface and adds a startup capability check for `question.reply`.

Root-cause chain:

1. A primary agent calls the interactive question tool and waits for a reply.
2. Grind classifies the question but has no exact question/options in its arbiter request and no structured answer in its verdict.
3. The guard rejects rather than replies, so the tool receives no chosen option.
4. A second synthetic turn may continue, but neither the chosen decision nor the suspended tool's normal success path exists.
5. The owner-only component proof remains green because that branch intentionally performs no question side effect, leaving the autonomous branch untested.

## Goals / Non-Goals

**Goals:**

- Carry exact bounded question definitions from the plugin event into one correlated question audit.
- Require and validate an exact offered-label answer matrix for autonomous question verdicts.
- Apply the answer through the official reply API so the original tool call resumes normally.
- Persist enough privacy-safe provenance to keep synthetic replies out of human authority evidence.
- Preserve human precedence, owner-required preservation, disable/interrupt cancellation, single-flight execution, retry, and stale-revision behavior.
- Prove the installed OpenCode boundary and the wider unattended session state machine, not only private controller methods.

**Non-Goals:**

- No arbitrary free-form/custom answer generation.
- No new permission or protected-operation authority.
- No process supervisor, reboot recovery, provider failover, distributed scheduler, or remote deployment.
- No upgrade of the pinned SDK dependency unless runtime evidence proves the common reply/event surface insufficient.
- No claim that an LLM can never make a poor in-authority choice.

## Decisions

### 1. Extend the existing correlated arbiter protocol

Each question audit owns an immutable normalized question payload: request id, ordered questions, exact option labels/descriptions, `multiple`, and `custom`. The first arbiter request includes this payload; retries continue in the retained child without re-embedding it. A verdict adds `questionAnswers`, which is `null` for completion, owner-required, and paused verdicts and an exact matrix for autonomous question verdicts.

Validation occurs before any reply effect:

- answer row count equals question count;
- every answer is an exact offered label;
- offered labels are unique within each question;
- single-select rows contain exactly one label;
- multi-select rows contain one or more unique labels;
- optionless/custom-only questions cannot be autonomous;
- question count, option count, and text lengths stay bounded;
- non-question verdicts and owner-required question verdicts carry `questionAnswers: null`.

Alternative: deterministically pick the first option. Rejected because first position is a presentation convention only when the caller recommends an option; it does not prove the option is within authority or correct for every question.

Alternative: ask a second model outside the existing arbiter. Rejected because it duplicates protected-boundary classification, retry, correlation, and evidence ownership.

### 2. Reply instead of reject for autonomous decisions

After a current `continue` or `allow_stop` question verdict validates, the controller records a privacy-safe pending synthetic-answer ref in root metadata, persists it, rechecks the exact audit/question epoch, and calls `question.reply` with the validated answer matrix. A successful reply moves the ref to the confirmed set and persists it; an unpersistable confirmation remains pending/unknown rather than becoming human authority. A successful reply lets OpenCode resolve the original tool call and resume the same assistant turn. No corrective root prompt is needed.

If reply fails while no replied event was observed, the pre-recorded provenance is removed and persisted before retry. `QuestionNotFoundError` without an observed reply is treated as a terminal race won by another resolver. If a matching replied event is observed while the guard reply is in flight or the successful reply cannot be confirmed persistently, the pending ref remains fail-closed as a synthetic resolution with unknown final actor rather than being converted into human authority.

Alternative: retain rejection plus synthetic continuation. Rejected because it does not answer the question and tests a different control path from the interactive success path.

Alternative: inject a synthetic root prompt containing the selected label before replying. Rejected because the root is already busy in the question tool and a second prompt creates ordering and duplicate-turn risk.

### 3. Keep synthetic question authority distinct in persisted evidence

Root `completionGuard` metadata stores privacy-safe request refs for successful autonomous answers. The session-delivery projection moves matching `question.replied` events from `questionReplies` into `questionInterventions` with actor `guard`, status `answered`, and the observed answer matrix. The arbiter continues to treat only remaining `questionReplies` as human authority.

The metadata list is append-only within a root and has a technically enforced maximum of 1,024 autonomous question refs. Reaching the limit fails closed before another reply rather than evicting an old ref and later misclassifying its event as human. This supports long sessions while bounding metadata growth.

Alternative: infer actor from timing or matching labels. Rejected because a human can select the same labels concurrently.

Alternative: cap and evict old refs. Rejected because old synthetic replies would become false human authority in later completion audits.

### 4. Remove the obsolete corrective-rejection state machine

The `guard-rejecting`, `guard-rejected`, `pendingQuestionCorrection`, and `questionCorrectionAbort` path is removed rather than retained as compatibility behavior. Question state becomes `open | guard-answering | guard-answered | human-replied | owner-required`, with an explicit reply-observed race fact. No persisted data depends on the old in-memory states.

This narrows `controller.ts` responsibility by placing question normalization and answer validation in one internal `question.ts` module. Controller orchestration remains in the controller. `split-or-justify`: the current controller already owns many state transitions; adding parsing/validation there would add a second data-validation responsibility, so one cohesive extraction improves testability and navigation.

### 5. Use a maintained installed-runtime proof runner

The proof runner starts or attaches to a disposable local OpenCode process through the established SDK helper, creates a root with the actual loaded plugin, enables grind, and uses a bounded synthetic primary agent/model prompt that must invoke one interactive question. It subscribes to real events, records the exact asked payload, observes the guard reply and selected label at the original tool boundary, and requires a downstream completion marker. A paired owner-required scenario remains open with zero reply/reject effect. Sessions and server state are deleted in `finally`.

If the selected model refuses the required synthetic question call, that attempt is invalid-route evidence rather than product proof. The runner preserves model/agent/source identity and may use another already configured model only after recording the causal route change. It never fakes a question by calling private controller methods for the runtime-proof lane.

## Fidelity Ladder

1. Deterministic offline validation of normalized question payloads, answer matrices, provenance projection, races, and stale effects.
2. Local controller integration with the real SDK-shaped reply API and plugin hooks.
3. Disposable installed OpenCode process with the actual loaded plugin, configured arbiter, real question tool request/reply, original tool continuation, and terminal root audit.
4. Owner TUI observation is optional confirmation after restart; it is not a substitute for the programmatically observable installed boundary.
5. Multi-day wall-clock soak and reboot/provider-outage recovery are future scope.

Current rung is 1 with a preserved owner-only component replay and a red coverage finding for the autonomous branch. The next real boundary is rung 3 after production correction and rung-1/2 replay. Authorization is the standing bounded configured-provider inference grant. Safeguards: disposable local sessions, no credentials in evidence, no file/product mutation by proof agents, no remote/destructive/external operations, exact cleanup, and a fail-closed owner question. Restoration is session deletion and local server termination; the repository candidate remains version-controlled. Expected immutable evidence includes command, OpenCode/config/plugin/model identity, session refs, event order, asked payload shape, answer matrix, tool result, terminal marker, status, stdout/stderr/logs, and cleanup result.

## Evidence Topology

- **Product Candidate**: controller, question protocol/types, arbiter contract, and session-delivery projection.
- **Proof Runner**: maintained installed-runtime question runner under `tools/proofs/`.
- **Evaluator**: deterministic runner assertions and project-native tests; evaluator failures replay preserved events before another provider attempt.
- **Environment Identity**: OpenCode executable/version, kit source and plugin origins, SDK package version, configured agent/model route, OS, and repository candidate digest.
- **Raw Evidence Bundle**: exact invocation, privacy-safe event stream, exit status, stdout/stderr, relevant guard logs/status metadata, selected answers/tool observation, side-effect counts, and cleanup.

Product mutation invalidates autonomous-question runtime proof and validation. Runner mutation invalidates only captures whose driven boundary or facts change. Evaluator-only mutation replays preserved raw events. Environment/model mutation invalidates only lanes using that identity. A failed provider/live evidence lane blocks repetition through the same path until its complete preserved event bundle reaches the terminal offline evaluator or the exact missing observation is named.

## Failure Diagnostics

The controller logs once at the owning question boundary with privacy-safe root/request refs, operation (`normalize`, `audit`, `persist-provenance`, `reply`, or `race-disposition`), original SDK cause/stack through `safeError`, and no raw questions or answers. Status metadata exposes `Question Auditing`, `Question Answering`, `Owner Required`, retry, and error without labels. Runtime evidence preserves process exit, stdout/stderr, guard logs, session status, and artifact paths. Invalid question payloads fail before a model call; invalid answer matrices enter arbiter retry with bounded structural diagnostics.

## Risks / Trade-offs

- **Model misclassifies a protected choice as autonomous** -> conservative arbiter contract, exact owner-boundary requirements, no free text, fresh critical SDET, and paired protected scenarios.
- **Human and guard reply race** -> pre-reply provenance, official API winner result, event observation without premature attribution, rollback on not-found/error, and final epoch checks.
- **Synthetic reply appears as human authority** -> persisted request-ref provenance and projection reclassification with no eviction.
- **Long sessions grow metadata** -> compact refs and fail-closed maximum rather than lossy eviction.
- **Pinned SDK differs from executable** -> common-surface capability check plus installed-process proof on OpenCode 1.18.18; no unsupported v2-only call.
- **Configured model refuses to invoke a synthetic proof question** -> classify as route evidence, preserve it, and use a causally distinct already configured route without weakening product assertions.
- **Question reply resumes the model before guard persistence settles** -> persist provenance before reply and serialize existing status writes.

## Migration / Rollback

No persisted-data migration is needed. Existing roots restore the new empty provenance list when metadata lacks it. Source changes require a new OpenCode process to load. Rollback stops OpenCode, restores the prior coherent guard/arbiter/projection/proof candidate, and restarts; no session question already answered can be undone, so proof uses disposable roots only. `/disable-grind` remains the immediate per-root runtime rollback.

## Open Questions

None for the bounded increment. Durable process supervision and reboot/provider recovery require separate owner-scoped outcomes.
