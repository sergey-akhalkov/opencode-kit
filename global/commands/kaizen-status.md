---
description: Show bounded cross-project Kaizen inbox status without exposing signal payloads.
agent: build
---

Call `kaizen_status` with `limit: 25`, `details: false`, and only the status filter explicitly requested in `$ARGUMENTS`. Treat the arguments as filter intent, not shell flags. If the request is absent or ambiguous, use all lifecycle states.

Report activation, proposal-owner state, selected and lifecycle counts, ordering, capacity, truncation, repair gaps, observations, and diagnostics exactly as returned. Do not request triage details, append a decision, create a proposal, mutate a project, infer semantic cohesion from counts, or treat `repair-gap` as persisted lifecycle state.
