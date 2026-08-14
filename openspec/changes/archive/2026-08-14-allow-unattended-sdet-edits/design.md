## Context

OpenCode merges the top-level permission policy and then appends explicit agent
rules. The active global config resolves to allow-all, but the final SDET rule is
`edit: ask`, so it wins and opens an operator approval dialog. The same rule and
approval wording are intentionally enforced by the SDET contract, validator,
tests, and normative spec.

The role already receives an exact test-only write scope from main and is
prohibited from production edits in its operative prompt. OpenCode does not expose
a static permission expression that can encode an arbitrary per-attempt path list.

## Goals / Non-Goals

**Goals:**

- Resolve SDET `edit` to `allow` in a fresh installed OpenCode process.
- Preserve the exact supplied test-only write scope and all non-edit restrictions.
- Keep source, validator, tests, spec, and runtime proof synchronized.

**Non-Goals:**

- Grant shell, network, nested-agent, question, or external-directory access.
- Let SDET edit production or approve qualification.
- Add a plugin, path classifier, dependency, or compatibility layer.

## Decisions

### Use an explicit scalar `edit: allow`

The SDET frontmatter will set scalar `edit: allow`. Omitting the key and relying on
the top-level policy was rejected because project or host layers could restore an
ask-level default. Nested path rules were rejected because a reusable agent cannot
statically represent each invocation's exact test-only scope and broad filename
patterns would misclassify repositories.

### Keep role containment separate from tool authorization

The operative prompt will state that edit is pre-authorized only for the supplied
test scope. Missing or unsafe scope remains a blocked attempt, production edits
remain forbidden, and main continues to attribute every test mutation before
qualification. This accurately describes the available enforcement: OpenCode
permission removes the interactive prompt, while role and orchestration contracts
own semantic path containment.

### Reuse the installed permission proof and direct agent entry point

The existing `proof:permissions` runner already compares configured and effective
agent rules through `opencode debug agent`. It will gain an explicit SDET
`edit=allow` oracle. Runtime Proof then uses a fresh actual SDET invocation in a
disposable project with one supplied test file and observes the edit, permission
reply count or absence of a prompt, production tree, exit status, and cleanup.

Fidelity ladder: resolved provider-free permission readback -> fresh local SDET
invocation in a disposable project -> future real qualification runs. The current
change reaches the first two rungs. The final rung requires only an OpenCode restart
by the operator and is not needed to prove the source candidate.

- **Authorization:** Local disposable files/processes and one bounded configured
  synthetic model invocation.
- **Safeguards:** Exact test-only path, no credentials/network/remote state, no
  production source, and main inspection of all effects.
- **Restoration/Cleanup:** Delete the disposable project and OpenCode session state;
  do not alter installed config outside this source tree.
- **Evidence:** Fresh resolved permission JSON plus exact invocation, input,
  exit/stdout/stderr, file effects, permission replies, and cleanup result.

## Risks / Trade-offs

- **Tool-wide edit authorization could be used outside the supplied scope** -> Keep
  the production prohibition operative, require exact scope, and have main inspect
  attributable mutations before integration or freeze.
- **Current TUI keeps its startup-loaded agent definition** -> Prove in a fresh
  process and require one full OpenCode restart before operator use.
- **Runtime proof could mutate the repository** -> Use only a disposable project and
  verify its effect inventory before cleanup.

## Migration Plan

1. Change the canonical global agent and synchronized contract surfaces.
2. Validate and invoke the changed source through a fresh OpenCode process with
   `OPENCODE_CONFIG_DIR` already pointing to `global/`.
3. Restart existing OpenCode sessions to load the new frontmatter.

Rollback is the source-local reversal from `edit: allow` to `edit: ask` plus the
synchronized contract wording; no persisted data migration is involved.

## Open Questions

None.
