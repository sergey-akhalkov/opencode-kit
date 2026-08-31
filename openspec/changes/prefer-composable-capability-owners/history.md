# Strategy History

## 2026-08-31 - Separate source composition from leaf-first task decomposition

- **Objective**: Select the smallest owner for the requested global composition and independent-testability behavior.
- **Approach**: Compare expanding `add-leaf-first-task-decomposition` with creating an orthogonal successor change.
- **Evidence**: Leaf-first defines execution dependencies, leaf oracles, and parent suppression but explicitly avoids file-count rules and does not govern physical source shape. The requested behavior distinguishes semantic ownership from private implementation modules and changes reuse/implementation decisions even when task structure is unchanged.
- **Outcome**: Selected a separate planning-only successor that composes with leaf-first and waits for its overlapping owners to transfer.
- **Reason**: Combining the changes would mix task-DAG behavior with source ownership, broaden the active claim population, and invalidate attribution for a currently planning-complete predecessor.
- **Do Not Repeat**: Do not fold physical capability composition into leaf-first while its accepted outcome, owners, and evidence population remain unchanged.
- **Retry Condition**: Reconsider one combined capability only if post-archive canonical evidence proves task dependency and source capability shape cannot be specified, implemented, or validated independently.

## 2026-08-31 - Preserve one semantic owner across multiple physical modules

- **Objective**: Prevent monolithic files without creating duplicate behavioral ownership or wrapper-only fragmentation.
- **Approach**: Compare one-owner/one-file, module-per-task, and one semantic owner that may delegate to directly testable private capabilities.
- **Evidence**: Current `extend` semantics forbid copied siblings while current change-locality guidance permits evidenced seams and rejects line quotas. The observed failure mode is the inference that one behavior owner requires one physical source file, while existing reusable modules demonstrate that private component proof and parent integration can remain separate.
- **Outcome**: Selected semantic ownership as the authority boundary and a current contract plus direct oracle as the physical extraction criterion.
- **Reason**: The selected model preserves state/lifecycle/public authority and Rule of Three while allowing one cohesive extraction to reduce current navigation and diagnostic coupling.
- **Do Not Repeat**: Do not use file length, task count, function count, or one semantic owner as an automatic split or no-split decision.
- **Retry Condition**: Reconsider the criterion only if maintained scenarios show a current valuable extraction cannot be identified through contract, oracle, failure/effect boundary, or evidence-backed change axis.

## 2026-08-31 - Extend existing owners and proof families instead of adding a registry or skill

- **Objective**: Make capability reuse and composition globally effective with the least new runtime mechanism.
- **Approach**: Compare a capability registry/new composition skill and proof runner with the current reuse-discovery, architecture/change-locality, Change-Ready, authoring proof, and reuse proof owners.
- **Evidence**: `library-reuse-discovery` already defines bounded current/platform/configured-cross-project/ecosystem search without a registry; loaded main already selects `reuse | extend | build-minimal`; the existing authoring and reuse runners cover the two required permission/effect envelopes.
- **Outcome**: Selected extensions to existing canonical instructions, specs, roles, deterministic contracts, and two current proof families; no new runtime skill, agent, Practice Owner, registry, or third runner.
- **Reason**: The missing behavior is an operational bridge and scenario population, not discovery storage or another decision authority.
- **Do Not Repeat**: Do not add a central inventory, promotion lifecycle, new reviewer, or duplicate proof harness for unchanged evidence.
- **Retry Condition**: Reconsider a new mechanism only if current owner inspection proves an accepted scenario cannot be expressed or safely proved through the existing search, authoring, permission, evidence, and cleanup contracts.
