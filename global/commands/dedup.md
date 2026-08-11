---
description: Audit duplication inside an explicit repository scope without editing production code.
agent: build
---

Load the `deduplication-audit` skill and execute its complete read-only workflow for this scope intent:

$ARGUMENTS

Treat the full text above as the requested scope, not as shell flags. Resolve only repository-contained paths and ask one precise question if scope is missing, ambiguous, or external. Use the installed `jscpd` CLI only as a textual clone candidate source, then inspect symbols, owners, callers, and tests before classification. Do not edit production, install anything, add a dependency, create an agent, remove a unique critical/compatibility test oracle, or escalate into `codebase-audit-loop` unless the user separately requested an exhaustive audit.
