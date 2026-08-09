# Conventions

- TypeScript only for implementation and automation; do not introduce `.js`, `.py`, or `.ps1` source/tooling.
- ESM imports include `.ts`; style uses double quotes, semicolons, trailing commas, explicit types at boundaries, and small deterministic functions.
- Reusable helpers require explicit root/config/argv inputs, stable ordering/output, privacy-safe evidence, and explicit `unknown`/`unsupported`/`blocked` states instead of hidden inference.
- Model-facing artifacts remain cohesive and project-neutral; placeholders replace local repository/service/path assumptions.
- Reviewer agents are read-only leaves except the scoped feedback-ledger write exception.
- Prefer evidence-backed executable contracts over vague prose, but helper code must not score or infer semantic instruction quality.
- `global/AGENTS.md` and `REPO_AGENTS.md` have distinct runtime versus maintainer ownership and must not be merged.