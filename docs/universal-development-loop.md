# Universal Development Loop

The kit uses one process for every project. Technology adapters change commands; they do not create new workflows.

The canonical definition of the Universal Development Loop, including its current 11-step list, Quality Defaults, and Output Shape, lives at `instructions/universal-development-loop.md`. The always-loaded working philosophy lives in `global/principles-of-work.md`; operational routing and safeguards live in `global/AGENTS.md`, with context-cost details in `docs/token-economy.md`.

If this kit doc and the canonical file drift, `tools/validate-library.ts` will fail the build until the divergence is reconciled. Update the canonical file and let this pointer point back to it.

## What Changes Here

- New kit-policy notes about the loop (e.g. proportionality, non-goals) belong in this file or in `docs/`.
- Step text, quality defaults, and output shape belong only in `instructions/universal-development-loop.md`.
- Project-level templates, reviewer agents, and downstream `AGENTS.md` files should point at the canonical file rather than duplicating the step list.

See `instructions/universal-development-loop.md` for the contract.
