# Task 4.2 Regression Disposition

- Candidate: `cross-project-kaizen-loop-kzn-001-r1`
- Result: one focused regression extension after a reproduced critical privacy defect

The maintained runner and focused suites already contain direct oracles for every accepted behavior exercised by task 4.1:

- loaded report/status advertisement, persistence, privacy, egress, worktree, and cleanup checks;
- two independent loaded root-compaction prompt/context/correlation/persistence paths;
- two-project shared-store isolation, opt-out, stable refs, bounds, and durable readback;
- all archive checkpoint outcomes and archive/harvest state separation;
- consumer-versus-owner triage containment and exactly-one valid proposal;
- legacy import, complain fallback, malformed and partial state, capacity, concurrency, privacy, and failure visibility across the 25-member population.

The initial `none` disposition was valid before independent challenge. Fresh SDET then identified, and main independently reproduced, a delimiter-prefixed absolute-path bypass in the existing privacy oracle. Main extended that same test with Windows drive, POSIX, and UNC delimiter cases plus an HTTPS non-path control; no new test owner or fixture was added.

`node tools/test-cross-project-kaizen.ts --json` passed all 27 named tests after the correction. An exact provider-free production-module probe also observed the delimiter-prefixed path rejected with no retained synthetic path. The store mutation invalidates the earlier runtime bundles and requires affected-lane recapture before current evidence closure.
