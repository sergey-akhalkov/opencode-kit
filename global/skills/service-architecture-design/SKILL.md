---
name: service-architecture-design
description: "Architecture design gate for services: boundaries, ownership, concurrency, failure model, deployment, observability, compatibility, and implementation-ready decisions."
license: MIT
---

# Service Architecture Design

Use this skill when shaping service architecture, design docs, specs, or implementation plans before coding. Resolve only next-increment outcome, enforced operating envelope, non-deferrable invariants, proof, or material residual risk. Unreachable future-scale design is residual.

## Design Areas

- System boundary, operating envelope, and non-goals for the next increment.
- Cohesive code/module ownership that keeps routine changes understandable through targeted reads; navigation-heavy touched files require one responsibility extraction or `split-or-justify`, not wrapper-only fragmentation.
- Ownership of state, requests, responses, resources, sessions, and retries.
- Concurrency model: actors, workers, queues, locks, async boundaries, cancellation, shutdown.
- Failure model: dependency failure, partial IO, timeout, overload, stale state, crash, restart.
- API/protocol model and compatibility constraints.
- Deployment model: service/process split, config, secrets, logging, diagnostics, upgrades.
- Observability: meaningful failure boundaries, existing logging/error mechanisms, original exception cause/stack, structured safe operation/correlation context, log-once ownership, noise/redaction limits, metrics, tracing, health, readiness, and auditability.
- Diagnostic evidence: exact invocation/input, identity, exit status, stdout/stderr, relevant logs/exceptions, side effects, artifact paths, retention, and the smallest instrumentation needed when realistic causes remain indistinguishable.
- Testability: fake dependencies, integration tests, load tests, manual gates.
- Implementation slices define the contract and observable happy path, implement and prove that path, then apply focused validation. Main may add the smallest post-proof regression. A separate fresh test-only SDET authors independent critical acceptance, recovery, or characterization evidence only when a reachable named critical consequence or explicit project/owner requirement triggers it.

## Output

Return decisions, alternatives rejected, risk matrix, validation plan, implementation slices, and reviewer gates needed before acceptance.

If the design yields multiple independent implementation, test, evidence, or reviewer tracks, recommend bounded worker fan-out only when the tracks are safe to coordinate; keep single-track design decisions in this skill.
