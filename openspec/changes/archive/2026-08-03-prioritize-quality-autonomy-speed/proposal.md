## Why

The kit already contains strong quality and autonomy rules, plus scattered speed mechanisms, but it does not state how to resolve trade-offs among them. This allows avoidable questions, ceremony, prompt growth, or unsafe interpretations of speed, while the committed global config template and its documentation currently disagree about the intentional permission default.

## What Changes

- Establish one ordered runtime priority contract: quality and safety first, autonomy second, and speed third.
- Define speed as time to a verified working result, fewer owner interruptions, fewer tokens and tool calls, more deterministic automation, and more safe parallelism without weakening proof or protected boundaries.
- Keep the complete contract only in `global/AGENTS.md`; use concise pointers or role-specific deltas elsewhere and reject copied full blocks deterministically.
- Preserve documented non-critical limitations as non-blocking and keep questions limited to material ambiguity or owner-controlled decisions.
- Document `permission: "allow"` as the intentional global template and machine-local default while retaining warning behavior for unrelated broad-permission workspace configs.
- Coordinate this change ahead of the unchecked runtime baseline in `integrate-continuous-sdlc-learning` so that its later non-growth comparison treats this contract as baseline authority.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `library-instruction-artifacts`: Add the ordered quality/autonomy/speed authority, canonical placement, mirror behavior, non-duplication, and deterministic drift requirements.
- `library-config-portability`: Make the intentional global `allow` default and exact-path validator severity explicit while preserving warnings for unrelated configs.

## Impact

- Runtime and reusable instruction surfaces: `global/AGENTS.md`, the Universal Development Loop, project/maintainer pointers, instruction-audit guidance, and the instruction tuning/reviewer artifacts.
- Human documentation: README, quality gates, token economy, adapter guidance, and OpenSpec project guidance.
- Deterministic support: routing/config contracts, validators, and focused SDET-owned fixtures.
- No application product API, persisted data, provider, model route, remote state, deployment, installation, or current-session activation changes.
