# Final Validation And Local Handoff

Date: 2026-08-08

## Candidate Reference

- Change: `improve-spec-cycle-integrity`
- Branch: `improve-spec-cycle-integrity`
- Base commit: `3402779`
- Product Candidate: the scoped working-tree diff for this OpenSpec change; the final immutable commit reference is assigned after complete archive.
- Excluded dirty work: the separate `integrate-continuous-sdlc-learning` change deletion, its feedback-ledger tool/test/script/policy removals, and `.serena/` are not part of this candidate and must remain unstaged.

## Evidence Topology

- Proof runners: OpenCode prompt sessions and local command identities recorded in `wave1-prompt-proof.md`, `wave3-loader-proof.md`, `wave4-reduction-oracles.md`, and `wave6-output-proof.md`.
- Evaluators: explicit scenario assertions in those files, repository validators/tests, and the fresh critical SDET.
- Environment: Windows, Node `24.18.0`, OpenCode `1.18.15`, OpenSpec `1.6.0`; loader proof used the disposable localhost boundary documented in Wave 3.
- Raw evidence: PTY/session ids and exact command outcomes in the evidence files; no credential or private prompt content is committed.

## Scoped Commit-Candidate Validation

The staged index was materialized into a disposable Git repository with the existing dependency tree linked read-only. This excluded the separate dirty feedback-ledger work and validated the exact content intended for commit.

```text
npm run validate:strict       -> exit 0, markdown=204, warnings=0, infos=1
npm run openspec:validate     -> exit 0, 9 passed / 0 failed
npm run instruction:inventory -> exit 0, 53 artifacts / 4097 lines / token proxy 83081
npm test                      -> exit 0, 11 serial test files including the preserved feedback-ledger suite
npm run prepush:validate      -> exit 0, validation + tests + 9 OpenSpec items
```

The broader working-tree checks also passed the privacy-safe source inventory, installer `--check`, installer `--dry-run`, strict archived-change validation, and `git diff --check`; the installer commands performed no environment mutation.

## SDET

- Terminal SDET: `ses_01e86c990ffeA9wYgWLuvnKmRf`
- Result: `no-critical-risk`
- Effective model: `xai/grok-4.5`
- Main disposition: no reachable critical or non-deferrable defect is known.

## Known Non-Critical Limitations

- Existing machine-local `global/opencode.json` files are preserved rather than migrated; owners must follow the installer guidance to load the new personal-instructions path.
- Source inventory establishes privacy-safe presence/collisions, not universal load precedence; exact `AGENTS.md` and configured-instruction behavior is supported by the isolated loader capture.
- Windows environment/process fault cases use fake-process tests, supplemented by the real disposable installer run. Do not repeat PATH-shadowed `setx` proof.
- Prompt behavior comparisons cover the evaluated models, inputs, and local environment; they are not universal model guarantees.

## Rollback

Revert the eventual scoped commit to restore repository behavior. The installer did not rewrite the existing machine config, validation dry-run did not mutate environment state, disposable fixtures were removed, and no deployment, installation, activation, release, or remote repository mutation occurred during qualification.

## Lifecycle

- Stable Candidate: `RC1`
- Development-Stage: `stable`
- External Operations during qualification: not performed.
- A branch push may occur only after complete archive and scoped commit because the owner explicitly requested it; push does not authorize merge, release, or deployment.
