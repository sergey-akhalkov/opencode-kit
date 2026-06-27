---
name: latency-benchmark-pack
description: Build or review latency/load benchmark evidence for service hot paths, SLOs, queue wait, tail latency, starvation, isolation, and performance regression gates.
license: MIT
---

# Latency Benchmark Pack

Use this skill when performance claims, SLOs, load isolation, queue wait, watchdog/starvation, or hot-path regressions matter.

## Principles

- Do not claim performance improvement without before/after evidence.
- Measure the real scoped path when possible; synthetic microbenchmarks are support evidence, not production proof.
- Report p50, p95, p99, max, throughput, queue wait, error/rejection counts, and environment.
- Keep load profiles reproducible and versioned.
- Separate tooling smoke from benchmark evidence.

## Safety

- No commits, pushes, merges, remote-state changes, source deletion, or destructive cleanup without explicit user request and repository policy.
- Do not run load tests against shared, production, billable, or rate-limited services unless the user approves the target environment, command, limits, duration, and rollback/stop criteria.
- If benchmark tooling changes behavior, add or update the smallest fixture/smoke gate before implementation; if infeasible, state why and use the closest reproducible substitute evidence.

## Benchmark Matrix

- Baseline idle latency.
- Single client/resource steady state.
- Many clients on one resource.
- Many clients across resources.
- Slow resource mixed with normal resource.
- Saturation/overload and backpressure.
- Recovery path: timeout, reconnect, partial response, shutdown.
- Before/after comparison for optimizations.

## Output

Return benchmark command, environment, load profile, result table, interpretation, regression threshold, and residual measurement risks.
