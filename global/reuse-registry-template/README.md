# Private Reuse Registry Template

Copy this directory into a separately owned private/local Git repository, then replace only logical placeholder IDs. Machine-local roots, scan refs, cache/outbox paths, and Codebase Memory identities belong in an explicit private config outside this registry checkout.

The executable schema owner is `global/bin/reuse-registry/contracts.ts`. Validate a populated checkout with:

```text
node <global-source>/bin/reuse-registry.ts validate --config <absolute-private-config>
```

The client performs no clone, fetch, pull, commit, push, dependency installation, publication, or registry-provided command execution.
