---
name: service-architecture-design
description: "Architecture design gate for services: boundaries, ownership, concurrency, failure model, deployment, observability, compatibility, and implementation-ready decisions."
license: MIT
---

# Service Architecture Design

Use this skill when shaping service architecture, design docs, specs, or implementation plans before coding.

## Design Areas

- System boundary and non-goals.
- Ownership of state, requests, responses, resources, sessions, and retries.
- Concurrency model: actors, workers, queues, locks, async boundaries, cancellation, shutdown.
- Failure model: dependency failure, partial IO, timeout, overload, stale state, crash, restart.
- API/protocol model and compatibility constraints.
- Deployment model: service/process split, config, secrets, logging, diagnostics, upgrades.
- Observability: metrics, tracing, logs, health, readiness, auditability.
- Testability: fake dependencies, integration tests, load tests, manual gates.
- Implementation slices should define the contract and observable happy path, implement and prove that path, then use a separate fresh-context testing subagent to author acceptance, negative, recovery, and characterization evidence from the architecture risk matrix.

## Output

Return decisions, alternatives rejected, risk matrix, validation plan, implementation slices, and reviewer gates needed before acceptance.

If the design yields multiple independent implementation, test, evidence, or reviewer tracks, recommend bounded worker fan-out only when the tracks are safe to coordinate; keep single-track design decisions in this skill.
