---
name: rust-workspace-bootstrap
description: Bootstrap or reshape a Rust workspace with crate boundaries, minimal happy-path skeletons, risk-driven tests, tooling, CI-friendly validation, and production-ready structure.
license: MIT
---

# Rust Workspace Bootstrap

Use this skill when creating a Rust workspace, adding crates, defining module boundaries, or establishing initial test/tooling structure.

## Principles

- Keep product crates in `crates/` and tooling/helper crates in `tools/` unless the repository uses another convention.
- Start with a minimal compilable happy-path skeleton and prove it through observable execution at the relevant boundary.
- After happy-path proof, use a separate fresh-context testing subagent to derive realistic Rust/runtime risks and author test-only negative or end-to-end evidence.
- Prefer small cohesive crates over premature generic frameworks.
- Make validation commands easy to run locally and in CI.
- Avoid adding dependencies until there is a concrete need.

## Safety

- No commits, pushes, merges, remote-state changes, source deletion, or destructive cleanup without explicit user request and repository policy.
- Do not add broad dependencies, generated files, formatting sweeps, or workspace-wide rewrites unless they are required by the scoped change and validated.

## Baseline Tasks

- Create or update workspace `Cargo.toml`.
- Add crate manifests with clear package names and edition.
- Add `src/lib.rs` or `src/main.rs` with minimal public API.
- Add test directories and first contract tests.
- Configure formatting, clippy, deny/audit/coverage tools only when appropriate.
- Document validation commands in README or project instructions.

## Output

Return workspace structure, crate responsibilities, validation commands, tests added, dependency rationale, and next implementation slice.
