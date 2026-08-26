# Strategy History

## 2026-08-25 - Restore the archived full communication block

- **Objective:** Restore universal plain and accurate wording after the observed cross-layer status ambiguity.
- **Approach:** Reinsert the detailed communication rules previously added to `global/AGENTS.md` by `clarify-user-communication-guidance`.
- **Evidence:** Git history shows the archived block required concise plain language, immediate term definitions, and accuracy safeguards, while later consolidation moved general communication ownership to `principles-of-work.md` and reduced duplicated always-loaded text.
- **Outcome:** Rejected during proposal preparation.
- **Reason:** It would restore broad duplicated policy, increase startup context, and still leave the canonical `Principle of Least Surprise` weaker than the main specification.
- **Do-Not-Repeat Condition:** Do not restore the whole archived block while one compact canonical rule plus a narrow Live-Attempt delta can satisfy the accepted outcome.
- **Evidence-Based Retry Condition:** Reconsider only if loaded-behavior evidence shows the compact canonical rule and exact hotspot delta cannot preserve scoped status meaning without the fuller operational block.

## 2026-08-25 - Add a wording skill, reviewer, or prose scorer

- **Objective:** Make wording quality available across projects and prevent ambiguous status reports.
- **Approach:** Add an on-demand wording practice, dedicated reviewer, mandatory output template, or deterministic prose-quality scoring mechanism.
- **Evidence:** The requirement applies to every main response and compaction summary, while on-demand skills/reviewers are not always loaded; repository guardrails also prohibit fuzzy deterministic scoring that infers instruction effectiveness.
- **Outcome:** Rejected during proposal preparation.
- **Reason:** It would miss the universal loading requirement, add ceremony, and create an unreliable quality proxy instead of preserving exact facts.
- **Do-Not-Repeat Condition:** Do not add a new practice surface or fuzzy scorer merely to reinforce this general invariant.
- **Evidence-Based Retry Condition:** Reconsider a separate owner only if future evidence identifies a distinct recurring practice with bounded triggers and outputs that cannot remain cohesive in the canonical principle or current proof harness.

## 2026-08-25 - Canonical rule plus exact hotspot delta and finite behavior pack

- **Objective:** Prevent user-facing and continuation text from broadening a scoped status while preserving concise communication and current safety semantics.
- **Approach:** Strengthen the existing `Principle of Least Surprise`, narrow the current Live-Attempt and compaction contracts, and retain behavior through the existing consumer-outcome harness with actual compaction/reconstruction evidence.
- **Evidence:** The current main spec already requires accurate concrete wording; loaded global text lacks subject/evidence-scope separation; `global/AGENTS.md` and the compaction prompt already own Live-Attempt output; the existing proof harness owns matched source/model capture and replay; the installed SDK exposes `session.summarize`.
- **Outcome:** Selected for the proposal.
- **Reason:** It is the smallest owner-correct approach that reaches every main session, protects future self-state across compaction, avoids duplicated policy, and provides bounded semantic evidence without claiming universal compliance.
- **Do-Not-Repeat Condition:** Do not add parallel communication owners, runners, or project-specific wording while these owners remain sufficient.
- **Evidence-Based Retry Condition:** Revise this strategy only if source ownership, actual compaction support, or matched candidate evidence disproves one of its stated owner or proof assumptions.

## 2026-08-26 - Pinned server startup without prepared database parent

- **Objective:** Capture the immutable pre-instruction baseline through the installed configured server and actual summarize boundary.
- **Approach:** Start the exact installed OpenCode executable with an isolated proof root and `OPENCODE_DB` under `data/opencode/opencode.db`; the first bundle retained only terminal exit `1`, so the shared client was corrected to retain the terminal handle and redacted streams before one bounded diagnostic capture.
- **Evidence:** `task-2-1-baseline-r1` and `task-2-1-baseline-r2` both used zero configured requests and replayed deterministically. R2 preserved terminal status `1`, complete cleanup, and stderr `unable to open database file`, proving the database parent did not exist.
- **Outcome:** Rejected as a usable configured-capture setup; Product Candidate behavior was not reached.
- **Reason:** The proof runner supplied a database file path whose parent it had not created.
- **Do-Not-Repeat Condition:** Do not launch the configured proof server with an unprepared database parent or without retained terminal streams.
- **Evidence-Based Retry Condition:** Create only the proof-owned cache, config-home, database-parent, and state directories; keep source/model/call identities unchanged; pass provider-free startup-failure and focused harness tests; then classify the next invocation as bounded evidence capture rather than proof.

## 2026-08-26 - Prepare only proof-owned runtime directories

- **Objective:** Reach the installed server readiness boundary without changing loaded instructions, credentials, model routes, or the configured-call envelope.
- **Approach:** Materialize `cache`, `config-home`, `data/opencode`, and `state` inside the disposable proof root before constructing the configured environment.
- **Evidence:** R2 named the exact missing database parent; the proof root is create-new and deleted in `finally`; no host credential or foreign config is copied or mutated.
- **Outcome:** Advanced to server readiness, then failed before a provider request at route resolution.
- **Reason:** It corrected the database prerequisite, but R3 exposed an independent legacy SDK response-shape assumption and a missing offline ripgrep PATH pin.
- **Do-Not-Repeat Condition:** Do not broaden this into host data/config copying or another standalone runner, and do not repeat while route parsing or ripgrep isolation remains stale.
- **Evidence-Based Retry Condition:** Preserve and terminally replay R3, update route parsing to the installed SDK v2 `name/modelID/providerID/variant` shape, pin the already-installed ripgrep, and prove both provider-free.

## 2026-08-26 - Test alternate route shape and pin offline ripgrep

- **Objective:** Reach the first configured response without route-schema failure or an unrelated download request.
- **Approach:** Test the alternate public `Agent` name/model shape, prepend the installed OpenCode ripgrep directory to the configured proof PATH, and classify any future ripgrep download request as forbidden `install` and `remote` evidence.
- **Evidence:** R3 replay digest `acbe15fcc872beac766c78a36b7449966d304f1f5408d2356e87bca06a2991cb` was stable and its server log recorded `downloading ripgrep`. R4 retained the same empty-list route failure but no download marker. Direct generated-SDK inspection then confirmed this endpoint uses `AgentV2Info.id` and `ModelRef.id`, not the alternate public `Agent.name` shape.
- **Outcome:** Ripgrep isolation succeeded; the alternate route-shape hypothesis was rejected without a provider request.
- **Reason:** R4 disproved the shape hypothesis and left route readiness as the narrower explanation for an empty agent list.
- **Do-Not-Repeat Condition:** Do not accept a capture that requests a ripgrep download, and do not retry the alternate route parser.
- **Evidence-Based Retry Condition:** Restore the installed endpoint's documented `id/model.id` shape and use the existing bounded `waitForProofRoute` owner instead of querying immediately.

## 2026-08-26 - Wait for the configured route owner

- **Objective:** Distinguish an actually missing configured agent from an agent list that is empty while the server instance finishes bootstrapping.
- **Approach:** Restore `AgentV2Info.id` plus `ModelRef.id/providerID/variant` parsing and route both `build` and `compaction` through the existing 15-second `waitForProofRoute` boundary.
- **Evidence:** R3 and R4 queried immediately after HTTP readiness and both returned an empty agent list; server logs continued bootstrapping after the readiness response. A provider-free fake client now proves the shared wait retries an initial empty list and resolves the documented SDK v2 row on the second read.
- **Outcome:** Resolved both routes, then stopped before a provider request on the stale expected-compaction assertion.
- **Reason:** Readiness was correct; R5 proved the actual active compaction route is `xai/grok-4.6/high`, while task 1.1 had frozen `quality-independent` profile content (`openai/gpt-5.6-sol/xhigh`) instead of the loaded `global/opencode.json` route.
- **Do-Not-Repeat Condition:** Do not return to immediate agent lookup or compare a loaded route to a model-profile assumption.
- **Evidence-Based Retry Condition:** Preserve and replay R5, resolve expected routes from the selected active config source, correct provider-free preflight evidence, and keep the actual baseline/candidate routes identical.

## 2026-08-26 - Freeze routes from the active config source

- **Objective:** Capture against the actual loaded main and compaction owners without mutating config to satisfy a stale assumption.
- **Approach:** Read `build` and `compaction` model/variant from the selected config directory's `opencode.json` for both preflight and capture assertions; retain the pack's requested profile as a separate fact.
- **Evidence:** R5 terminal replay digest `623dff4f7e13fd8bc6546a918fe984cf77bc2baac6cdac3e7a96f0c58b0262b5` is stable and preserves `main=openai/gpt-5.6-sol/xhigh compaction=xai/grok-4.6/high`. Direct source readback matches those routes. Provider-free preflight R2 now reports `profile=active-config` and `requestedProfile=quality-independent` separately.
- **Outcome:** Reached the first configured main request, then failed locally during model lookup after one counted request.
- **Reason:** Route identity freezing was corrected, but the configured proof environment isolated `XDG_CACHE_HOME` and disabled model fetching without seeding the installed model catalog.
- **Do-Not-Repeat Condition:** Do not conflate requested profile, active source, or observed runtime route, and do not launch a cached-only configured proof with an empty model catalog.
- **Evidence-Based Retry Condition:** Preserve and replay R6 through the terminal evaluator, identify the exact lookup failure from redacted server logs, then seed only the installed non-secret model catalog through the existing cached-only proof pattern.

## 2026-08-26 - Seed the installed cached model catalog only

- **Objective:** Let the configured proof resolve both already-configured models without fetching models or copying credentials.
- **Approach:** Validate `openai/gpt-5.6-sol` and `xai/grok-4.6` against `<home>/.cache/opencode/models.json`, copy only those non-secret catalog bytes to the disposable proof cache, retain the catalog digest in environment identity, and continue using the host credential store in place.
- **Evidence:** R6 terminal replay digest `65ff849c739780e707bca72a17ebb78be026c058a0c8bfb2679882d6d7c5d50a` is stable; raw logs report `ProviderModelNotFoundError` for `openai/gpt-5.6-sol` after exactly one request. The repository's integrated proof already uses cached-only model catalog seeding. Focused tests validate both required routes and the copied catalog digest without reading or copying `auth.json`.
- **Outcome:** The catalog was seeded and bound into a new environment identity, but R7 returned the same main-request model lookup failure after one call.
- **Reason:** Catalog isolation was a real prerequisite but not the cause of the explicit prompt-model lookup failure.
- **Do-Not-Repeat Condition:** Do not copy credentials, enable unbounded model fetches, retry with an empty isolated catalog, or treat catalog presence alone as model-call readiness.
- **Evidence-Based Retry Condition:** Preserve and replay R7, then change the prompt-selection mechanism rather than repeating the same explicit model override.

## 2026-08-26 - Verify provider availability and use the configured agent route

- **Objective:** Avoid a failing explicit model override while retaining exact route and connectivity proof.
- **Approach:** Query the local server's provider list before any model call, require both resolved models and connected providers, then prompt with the already-asserted configured `build` agent without overriding `model` or `variant`; keep explicit model/provider only for the SDK summarize call that requires them.
- **Evidence:** R6 and R7 each consumed one main request and failed with the same `ProviderModelNotFoundError`; both have deterministic terminal replay. Focused fake-client tests prove local provider/model/connection checks and prove both main/reconstruction prompts omit route overrides.
- **Outcome:** R8's provider/model/connectivity precheck passed, but the main request still failed with the same `ProviderModelNotFoundError` after one call.
- **Reason:** It changes the actual model-selection path while preserving identity, prompt bytes, source, permissions, and configured-call bounds.
- **Do-Not-Repeat Condition:** Do not send another explicit main/reconstruction model override on this lane.
- **Evidence-Based Retry Condition:** R8's complete replay confirms that provider-list catalog/connectivity metadata does not prove runtime model resolution. Do not retry until the runtime provider-initialization mechanism changes.

## 2026-08-26 - Retain internal provider plugins under pure mode

- **Objective:** Restore runtime provider initialization without enabling external/configured plugins or weakening proof isolation.
- **Approach:** Remove only `OPENCODE_DISABLE_DEFAULT_PLUGINS` from `configuredProofServerEnvironment`; retain `OPENCODE_PURE=1`, external-skill/model-fetch/project-config suppression, disposable roots, tool denies, route assertions, and configured-call bounds.
- **Evidence:** The installed 1.18.23 executable has separate gates: `disableDefaultPlugins ? [] : <internal plugin loop>` and `pure ? [] : plugin_origins`. Existing working proof environments use pure mode without disabling internal defaults. R8 proved catalog presence and connection metadata while runtime `getModel` still lacked the model, which is consistent with suppressed provider initialization.
- **Outcome:** R9 completed all three configured requests. The main response preserved every expected field; compaction was accepted; reconstruction broadened `resourceAvailability` to `known` and omitted multiple independent fields, producing the required failing pre-change baseline observation.
- **Reason:** It addresses the initialized-provider path named by the terminal error while preserving the external-plugin boundary.
- **Do-Not-Repeat Condition:** Do not relax pure mode, enable configured plugins/fetches, copy authentication, or change the configured routes.
- **Evidence-Based Retry Condition:** One new capture is permitted only after focused provider-free validation passes and confirms pure mode remains enabled while default-plugin suppression is absent.

## 2026-08-26 - Extend the existing status owners only

- **Objective:** Correct status-scope loss without adding another communication framework or changing Live-Attempt safety semantics.
- **Approach:** Extend `Principle of Least Surprise` with one compact subject/evidence-scope rule; add one path/lane-only delta to the existing global and Change-Ready gate owners; update the canonical compaction prompt and its active kit mirror; enforce exact markers in the existing focused test.
- **Evidence:** R9 preserves the pre-change failure. Candidate preflight reports governed digest `3768c8d482c84698fc244744213e192ffb165188bf96384cbd6d82dafcfdb4a1`, unchanged routes/scenario/call bounds, prompt status `same`, and zero model calls. Focused consumer-outcome and contract tests, strict validation, strict selected OpenSpec validation, and the `12000/12000` core startup budget pass.
- **Outcome:** Candidate R1 completed three requests and kept all main-response fields exact, but its compaction summary listed the field schema and claimed preservation without retaining the values; reconstruction returned null for every field.
- **Reason:** These are the existing universal, gate-specific, compaction, mirror, and proof owners named by the design; no new owner is needed.
- **Do-Not-Repeat Condition:** Do not add project-specific status terms, another prose policy, fuzzy scoring, a standalone runner, or a budget increase.
- **Evidence-Based Retry Condition:** R1 has terminal equal-digest offline replay. A successor is permitted only after the compaction owners explicitly require retained subject/dimension/value instead of a preservation claim or context pointer and regain source/budget validation.

## 2026-08-26 - Require explicit compaction values

- **Objective:** Make retained status facts reconstructable rather than merely described as preserved.
- **Approach:** Replace the abstract mixed-status reminder at existing compaction owners with one explicit rule: retain subject/dimension/value and do not substitute a preservation claim or pointer to prior context.
- **Evidence:** R1 compaction says every member and field matched, but preserves no values and points to `STATUS_SCOPE_FACTS` in conversation; the immediate reconstruction returns three all-null members. Two provider-free replays return digest `a7b44c8361ed5454ede87b3a5105ed52fcd7a7aa8fad8e9d17848b8f1b4c2386` with zero calls.
- **Outcome:** Selected as the smallest in-scope correction; no new framework, route, fixture, evaluator, or authorization semantic changes.
- **Reason:** It addresses the exact retained-evidence omission observed after compaction.
- **Do-Not-Repeat Condition:** Do not add scenario IDs or expected values to instructions, weaken the evaluator, change reconstruction prompts, or repeat R1 wording.
- **Evidence-Based Retry Condition:** One R2 capture may run only after provider-free source/mirror, focused tests, strict validation, and startup budget checks pass on a new governed digest.

## 2026-08-26 - Reject an unscoped clear gate

- **Objective:** Prevent a compaction summary from reporting a general clear gate while retained facts still contain an unknown or blocked named path.
- **Approach:** Add a deterministic `Live-Attempt Gate: clear` text rejection and strengthen existing gate wording so another route or outcome cannot clear the named path.
- **Evidence:** Candidate R2 retained and reconstructed all three members exactly, but its compaction summary emitted `Live-Attempt Gate: clear` without naming a path or lane while `known-resource-path-unknown` remained `unknown` with `repeat-live-attempt-blocked-for-named-path`.
- **Outcome:** Rejected after candidate R3.
- **Reason:** The regex rejected every clear gate rather than an exact cross-dimension contradiction, changed the evaluator identity after the immutable baseline, and became the prose heuristic prohibited by the design. R3 also showed that a separately named session lane can be clear without changing reported path facts.
- **Do-Not-Repeat Condition:** Do not infer cross-dimension conflict from an unparsed status phrase or mutate evaluator semantics after freezing the matched baseline.
- **Evidence-Based Retry Condition:** Reconsider deterministic text checks only for an exact bounded contradiction representable without style or semantic scoring and with matched evaluator identity for both arms.

## 2026-08-26 - Separate reported status from the session gate

- **Objective:** Preserve reconstructable mixed facts while preventing the compactor from treating the completed transformation task as the status owner for the reported paths.
- **Approach:** Restore the baseline-matched exact structured-field evaluator. In the existing compaction prompt only, require materially mixed reported facts under one `Status Scope` namespace with exact subject/dimension/value and keep that namespace separate from the session `Live-Attempt Gate`, whose clear state applies only to its named path.
- **Evidence:** R3 used three configured requests with complete cleanup. Its main response was exact, its summary named `no live-attempt lane applicable` and separately called that session gate clear, but it omitted the reported values and reconstruction returned three all-null members. Provider-free replay digest `8105174987b79594f45da69f3094f9024d086673301f41480d0f66231dadc9f0` preserves the failure.
- **Outcome:** Selected as the next causally distinct mechanism.
- **Reason:** An explicit namespace separates two status subjects rather than adding another generic wording reminder, changing the fixture, weakening exact field oracles, or imposing a universal response schema.
- **Do-Not-Repeat Condition:** Do not add another regex prose scorer, conflate the current synthetic session gate with reported member paths, change frozen scenario values, or repeat R3 wording.
- **Evidence-Based Retry Condition:** One successor capture may run only after the evaluator digest again matches R9, R2 replays under the restored evaluator, source/mirror checks and focused tests pass, and the startup instruction budget remains within its existing seed.

## 2026-08-26 - Bind terminal replay evaluator separately from capture provenance

- **Objective:** Evaluate immutable R9 and exact candidate R4 under one explicit terminal evaluator without rewriting either raw bundle or repeating a configured call.
- **Approach:** For the status-scope pack only, preserve each arm's historical capture-time evaluator digest as provenance and bind the provider-free terminal replay evaluator digest separately. Continue requiring scenario identity, environment identity, exact candidate fields, provider bounds, effects, privacy, and cleanup.
- **Evidence:** R4 completed exactly three configured requests with terminal cleanup and passed all twelve candidate main/reconstruction field oracles. Its only immediate reason was `status-scope-oracle:evaluator-digest:5d780...:6861...`. The digest function hashes `contracts.ts`, `evaluate.ts`, and `capture.ts`; those capture-time bytes do not generate the preserved model text, and one replay invocation evaluates both immutable bundles with the same current code.
- **Outcome:** Selected as the provider-free identity correction; another live capture is prohibited.
- **Reason:** It distinguishes raw-capture provenance from the evaluator that actually produces the terminal verdict, keeps both identities visible, and avoids manufacturing equality or recapturing already-complete product behavior.
- **Do-Not-Repeat Condition:** Do not overwrite bundle evaluator digests, hide their difference, treat an offline evaluator edit as a model-behavior failure, or spend another configured request on this identity-only issue.
- **Evidence-Based Retry Condition:** No live retry. The lane advances only if two provider-free R9/R4 replays produce the same terminal digest and every candidate oracle remains exact; otherwise retain R4 as a narrow direct observation and keep task 3.2 open.
