# Task 3.2 Configured Partition Pack Evidence

## Outcome And Ownership

- Decision: `extend`; cross-project reuse is `not-applicable`. The existing consumer-outcome contracts remain the owner, with one separately named `complexity-configured-session-r1` pack.
- Candidate: `continuous-complexity-management-partition-pack-r1`.
- Environment: Windows, Node `24.18.1`, provider-free local execution.
- Scope: twelve exact claim-population fixtures, reviewed semantic oracle facts, a 24-request configured bound, matched baseline/candidate invocation identities, and provider-free fixture readback.
- The sealed `complexity-management-r1` task-2.4 diagnostic remains a separate one-member pack containing only `useful-current-consumer-facade`.

## Real Boundary

- Invocation: `npm run test:focused:consumer-outcome`.
- Terminal result: exit `0`; stdout `OK: consumer outcome tests=36`; stderr empty.
- The focused boundary loads and verifies all twelve fixture seeds, runs each native `node --check src/main.ts` validation command, runs each proof command, and checks every expected stdout marker.
- `COMPLEXITY_CONFIGURED_SESSION_MEMBER_ORDER`, the pack manifest, and the claim population use the same stable ordered identifiers.

## Matched Preparation Contract

- `complexityConfiguredInvocationManifest` returns exactly 24 rows: baseline then candidate for each of twelve members, within `configuredProviderRequestBound=24`.
- Each pair has identical comparison, request, model, variant, permission, and environment identities. Each arm retains its reviewed maximum claim.
- Every reviewed arm retains nonempty trigger, owner, context, and path facts. Maximum claims are partition-bounded with `-only` suffixes.
- Prompts, validation/proof commands, expected decision records, permissions, allowed/forbidden effects, evidence bounds, and cleanup oracles are explicit in the versioned pack.
- `task-3-2-invocation-manifest.json` is derived from the parsed pack by the production contract helper and retains the exact 12-member/24-row invocation preparation.

## Semantic And Safety Boundaries

- Deterministic code validates shape, exact identity, ordering, bounds, paths, permissions, effects, and cleanup facts. A test changes one allowed reviewed semantic disposition and confirms the parser does not choose architecture semantics.
- An extra `qualityScore` field is rejected before effects, preventing the helper from becoming a hidden semantic scorer.
- The preparation boundary makes no model/provider call, does not run configured capture or evaluation, does not write a consumer repository, and does not mutate the sealed task-2.4 pack.
- All fixture proof processes terminate synchronously. The pack requires fixture/process/session cleanup oracles to remain fail-closed for later configured execution.

## Claim Ceiling

- This evidence supports only versioned fixture and matched-invocation preparation for the twelve reviewed partitions.
- It does not support a configured observation, baseline/candidate comparison, semantic improvement, 12/12 population closure, PMAC behavior, or the broad `continuous-complexity-management-v1` claim. Those remain deferred to tasks 3.3, 4.1, and 4.3.
