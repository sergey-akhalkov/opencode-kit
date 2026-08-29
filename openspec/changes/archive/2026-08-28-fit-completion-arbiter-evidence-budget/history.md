# Strategy History

## 2026-08-28 - Remove the request limit

- **Objective:** Prevent completion-evidence overflow from terminating multi-day autonomous roots.
- **Approach:** Treat `maxRequestBytes` as the impediment and remove or disable the finite check.
- **Evidence:** The loaded config and runtime default are both 200,000 bytes; option parsing does not support `-1` for this field; the canonical completion-guard spec requires a finite provider-bound surface and terminal no-prompt overflow. The request carries model input, so removing the boundary also removes the last aggregate cost/context guard.
- **Outcome:** Rejected before mutation.
- **Reason:** It weakens the accepted safety envelope without correcting duplicated evidence and creates unbounded provider/context behavior.
- **Do-Not-Repeat Condition:** Do not propose an unlimited request merely because another bounded long root overflows.
- **Evidence-Based Retry Condition:** Reconsider only if the accepted completion contract explicitly changes to another technically enforced finite provider-input boundary with equivalent cost, context, privacy, and fail-closed proof.

## 2026-08-28 - Increase the configured limit

- **Objective:** Admit all currently observed overflow requests with the smallest config edit.
- **Approach:** Raise `maxRequestBytes` above the observed maximum of 254,691 bytes, for example to 300,000 or 512,000.
- **Evidence:** A read-only database query found eight terminal overflows between 214,535 and 254,691 bytes. The reconstructed request contained overlapping todo, validation/tool, and compatibility surfaces, so a larger number would admit current duplication but would not establish an aggregate bound for later fields or larger claim records.
- **Outcome:** Rejected as the production solution; retained only as a separately authorized emergency workaround if no candidate can be built.
- **Reason:** It moves the failure threshold, increases provider exposure, changes loaded config owned by another active workflow surface, and leaves the representation defect intact.
- **Do-Not-Repeat Condition:** Do not tune the number upward from each newly observed request size.
- **Evidence-Based Retry Condition:** Use a temporary finite increase only if a time-critical owner-authorized recovery is required, the exact provider/context envelope is proven, rollback/restart is available, and the canonical projection correction cannot safely land first.

## 2026-08-28 - Compact serialization only

- **Objective:** Recover enough bytes without changing any evidence fields.
- **Approach:** Replace pretty-printed `JSON.stringify(request, null, 2)` with compact JSON.
- **Evidence:** Reconstructing the observed root saved approximately 48,032 bytes, but the candidate request measured about 199,351 bytes against the 200,000 byte limit, leaving roughly 649 bytes of headroom while evidence continued to evolve.
- **Outcome:** Retained as one component, rejected as a complete strategy.
- **Reason:** Whitespace removal is lossless and useful, but it does not repair structural duplication or provide a maintainable envelope for schema drift.
- **Do-Not-Repeat Condition:** Do not claim the incident closed from a single compact request that barely fits.
- **Evidence-Based Retry Condition:** Compact-only may become sufficient if a maintained maximum-shape proof establishes durable headroom for the complete accepted population without reducing or normalizing fields.

## 2026-08-28 - Private canonical arbiter projection plus compact serialization

- **Objective:** Preserve the finite safety boundary and acceptance-critical evidence while admitting realistic capped long roots.
- **Approach:** Keep the full public/session epoch projection, derive one versioned private arbiter representation, encode repeated todo memberships and validation/tool relationships by stable refs, omit only the identical deprecated alias, serialize compactly, and retain terminal overflow for irreducible critical evidence.
- **Evidence:** An illustrative in-memory normalization of the same snapshot reduced compact evidence from approximately 196,908 to 150,350 bytes before final implementation, while retaining full claim records and unique facts. Current source confirms the hidden arbiter is the sole provider-bound consumer and the public tool can remain unchanged.
- **Outcome:** Selected for proposal and bounded falsification; not yet implemented or runtime-proved.
- **Reason:** It extends the current owner, removes proven duplication at the owning boundary, preserves claim/liveness fail-closed rules, and creates measurable headroom without a config or public-schema migration.
- **Do-Not-Repeat Condition:** Do not implement normalization by event/call ref unless conflicting values fail closed and readback proves the declared authority/liveness/todo/validation/claim matrices.
- **Evidence-Based Retry Condition:** Revise the shape or return to a narrower strategy if provider-free readback cannot preserve those matrices, the reviewed fixture exceeds 175,000 proof-control bytes, the same-actor observation matrix changes expected disposition/effects, or public delivery-context compatibility changes.

## 2026-08-28 - Maximum cardinality plus maximum text fixture

- **Objective:** Reproduce the unchanged aggregate overflow before production mutation with every reviewed retained count present.
- **Approach:** Fill the maximum-cardinality fixture with near-limit text on assistant, synthetic, tool, question, permission, todo, and claim surfaces simultaneously.
- **Evidence:** The unchanged request was 736,473 bytes, while the observed eight-row population is 214,535-254,691 bytes. Unique non-normalizable text in that synthetic shape alone cannot satisfy the 175,000-byte candidate control, so the fixture combined independent maxima that the accepted population never claimed.
- **Outcome:** Rejected as the candidate-fit fixture; retained as diagnostic overflow evidence only. Task 1.2 was reopened before production mutation.
- **Reason:** The fixture overstates the reviewed population and would convert a representation correction into an impossible arbitrary-text compression requirement.
- **Do-Not-Repeat Condition:** Do not combine maximum retained cardinality with maximum text length on every independent surface unless the accepted population explicitly requires that Cartesian maximum.
- **Evidence-Based Retry Condition:** Re-run with the same reviewed cardinalities, four ordinary claims, and representative bounded text calibrated to the observed overflow range; require unchanged baseline bytes above 200,000, deterministic captures/replays, and zero child/model calls before production mutation.

## 2026-08-28 - Direct metadata activation in installed proof

- **Objective:** Exercise the candidate through an isolated installed OpenCode long-root boundary without external provider calls.
- **Approach:** Populate a disposable root while grind was disabled, then set `completionGuard.grindEnabled=true` through `session.update` immediately before the terminal prompt.
- **Evidence:** `completion-arbiter-installed-preflight-r1/failure.json` records two local primary calls, zero arbiter calls, complete cleanup, and terminal error `Installed guard did not reach one passed audit`.
- **Outcome:** Falsified; no source or installed state escaped the disposable fixture.
- **Reason:** Persisted metadata update did not activate the controller's in-memory root state for the next idle event.
- **Do-Not-Repeat Condition:** Do not treat persistence metadata as an activation API for a loaded guard controller.
- **Evidence-Based Retry Condition:** Use the official `enable-grind` command hook, confirm one hidden arbiter request on a small preflight, and preserve complete process/session/database cleanup before running the long profile.

## 2026-08-28 - Full-HEAD installed substitution baseline

- **Objective:** Compare one ordinary below-limit legacy request with the candidate under the installed runtime.
- **Approach:** Run the installed proof against a narrow archive of all `HEAD` agent, extension, and delivery-context runtime trees.
- **Evidence:** `completion-arbiter-installed-baseline-ordinary-r1/failure.json` records one local primary call, zero arbiter calls, complete cleanup, and terminal error `enable installed guard failed`.
- **Outcome:** Rejected as a substitution baseline.
- **Reason:** The full `HEAD` runtime also changed the command-activation surface, so it did not isolate the provider-bound representation and could not reach the matched arbiter boundary.
- **Do-Not-Repeat Condition:** Do not compare broad historical runtime snapshots when only the request representation is under qualification.
- **Evidence-Based Retry Condition:** Overlay only the `HEAD` arbiter request builder and hidden arbiter prompt onto the otherwise identical current runtime, then require both ordinary arms to reach one correlated installed verdict with the same side-effect class and complete cleanup.

## 2026-08-28 - Uninstrumented representation-only runtime overlay

- **Objective:** Reach the matched ordinary baseline while changing only the arbiter request representation and hidden prompt.
- **Approach:** Overlay `HEAD` versions of `arbiter-evidence.ts` and `session-completion-arbiter.md` onto the current runtime tree.
- **Evidence:** `completion-arbiter-installed-baseline-ordinary-r2/failure.json` records one local primary call, zero arbiter calls, complete cleanup, and only the coarse terminal error `enable installed guard failed`.
- **Outcome:** Inconclusive and not repeatable unchanged.
- **Reason:** The failure bundle did not preserve the SDK cause chain or bounded loader/server diagnostics, so it cannot distinguish command availability from overlay import failure.
- **Do-Not-Repeat Condition:** Do not rerun the overlay with the same unqualified error oracle.
- **Evidence-Based Retry Condition:** Preserve redacted cause-chain and plugin/command server logs at the owning installed boundary, then run one instrumented probe and act only on its distinguished cause.

## 2026-08-28 - Incomplete representation-overlay dependency closure

- **Objective:** Diagnose why the representation-only installed baseline could not activate the guard.
- **Approach:** Repeat once with bounded cause-chain and plugin/command server diagnostics.
- **Evidence:** The direct module probe reported missing `global/bin/openspec-change/evidence.ts` from the disposable archive; the installed bundle preserved one primary call, zero arbiter calls, complete cleanup, and an unknown-command failure consistent with the guard plugin never loading.
- **Outcome:** Proof Runner defect confirmed; Product Candidate and baseline representation were not exercised.
- **Reason:** The archive included `global/extensions` and `global/plugin` but omitted a real relative dependency of `claim-evidence.ts`.
- **Do-Not-Repeat Condition:** Do not run a source overlay before its production entrypoint imports successfully in isolation.
- **Evidence-Based Retry Condition:** Add the current `global/bin` dependency closure to the disposable overlay, require an isolated module import to pass, then run one final ordinary matched baseline.
