# Task 3.1 Readable Candidate Source

- Candidate governed digest: `4fef3cbdd638edfb55a6573618517e388bc661388d6d579e6def5a11c9971123`.
- Canonical owner: the existing `Principle of Least Surprise` in `global/principles-of-work.md` now scopes status to subject/evidence and separates differing resource, authority, path/runner, evidence, consequence, and outcome states.
- Gate owners: `global/AGENTS.md` and `global/skills/change-ready-sdlc/SKILL.md` state only the Live-Attempt path/lane delta; fail-closed classification and retry authorization are unchanged.
- Compaction owner/mirror: `global/opencode.json.template` is canonical; the active ignored `global/opencode.json` prompt was materialized from it without changing active routes. `npm run opencode:sources` reports `agent.compaction.prompt` as `same`, digest `0a8503d6ae4fa72ee53cc8102807f1b10e09f9de99927e4eef35f6a8459433c2`, restart boundary `none`.
- Deterministic markers: the focused status-scope test reads the canonical principle, both gate owners, canonical prompt marker, and byte-equal active prompt value.
- Provider-free preflight: zero model calls, source `4fef3cbdd638edfb55a6573618517e388bc661388d6d579e6def5a11c9971123`, unchanged scenario `64454936f0a923bc11baa5fe94823aaff6ac4833d813fbd05a82d496d0dfd99c`, unchanged main `openai/gpt-5.6-sol/xhigh`, compaction `xai/grok-4.6/high`, and six-call total bound.
- Validation: `npm run test:focused:consumer-outcome`, `npm run test:focused:contracts`, `npm run validate:strict`, `npm run instruction:budget`, and `openspec validate prevent-cross-layer-status-ambiguity --strict` passed. Core startup budget is `11999/12000`; no seed was raised.
- Non-goals preserved: no public API, project-specific policy, fuzzy prose scorer, new runner, external operation, host-default source mutation, or Live-Attempt authorization change.
