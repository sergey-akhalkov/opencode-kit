# 6.3 Critical SDET Trigger

- Candidate: establish-practice-owner-agents working tree
- Named critical trigger: reachable authorization/privacy compromise, data loss, irreversible external action, or equivalent
- Classification: not triggered
- Evidence: compact safety kernel in `global/AGENTS.md` remains loaded. `execution-safety-reviewer` is read-only and cannot authorize. Protected-action capture left `unrecognized.tmp` unchanged. No new permission widening on owner reviewers. `troubleshooter` `permission: allow` is pre-existing, not introduced here.
- Terminal: N/A - SDET not launched
