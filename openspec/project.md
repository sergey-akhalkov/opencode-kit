# Project OpenSpec Guide

This repository uses OpenSpec changes for durable behavior and contract work that affects reusable skills, agents, instructions, validators, tools, templates, or project documentation.

## Durable Rules

- Define the next useful working increment through the Spec Capsule in `openspec/config.yaml`.
- Keep proposal, design, delta specs, tasks, implementation, proof, and documentation synchronized.
- Mark a task complete only after its stated observable proof and applicable focused validation pass.
- Order behavior tasks by time-to-first-real-signal: an earliest safely reachable real check or its smallest harness/safety/restoration prerequisite precedes dependent behavior; external execution remains separately authorized.
- Treat `openspec validate` as structural evidence, not semantic or runtime proof.
- Complete archive requires finished artifacts and tasks, synchronized specs, current applicable validation, and explicit handling of blockers. Intentionally incomplete work uses the separate abandon path and never claims completion.
- Optional reviewers provide evidence only. They do not authorize mutation, set lifecycle state, or become mandatory without concrete risk or project policy.

## Live Status

Do not maintain active changes, task counts, dependency waves, commit ids, or CI run ids in this file. Discover current state from live evidence:

```sh
npx openspec list --json
npx openspec status --change <change-id> --json
npx openspec instructions apply --change <change-id> --json
```

Use current task checkboxes and validation output for completion evidence. Use `openspec/changes/archive/` only for historical reference.

## Configuration Sources

OpenCode may combine managed, host-default global, project, explicit, inline, and custom-directory sources. `OPENCODE_CONFIG_DIR` points at the kit's custom `global/` directory but does not prove that host-default artifacts are absent. Use current official documentation and privacy-safe runtime diagnostics for exact precedence.

The kit owns these committed or provisioned artifacts:

- `opencode.json`: this workspace's project config.
- `global/opencode.json.template`: portable machine-config seed.
- `global/opencode.json`: gitignored machine-local config provisioned from the template.
- `global/opencode.local.instructions.md`: optional gitignored personal instructions referenced through the official `instructions` config field.
- `global/model-profiles/`: explicit child-process model overlays, never implicit base layers.

Permissive `permission: allow` is tool access, not a managed sandbox. Runtime safety and external-operation authority remain explicit requirements.
