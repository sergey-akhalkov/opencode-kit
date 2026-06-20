# Project OpenSpec Guide

This repository uses OpenSpec changes for durable follow-up work that affects reusable skills, agents, instructions, validators, tools, templates, or project documentation.

OpenSpec archive does not require a separate learning file or archive-time process gate. Archive readiness is based on completed scoped tasks, synchronized specs, validation evidence, reviewer evidence when risk warrants it, and explicit handling of unresolved blockers or follow-ups.

When concrete workflow friction appears during an OpenSpec implementation session, use at most one just-in-time process improvement instead of creating archive-time retro ceremony. Delegate to `just-in-time-process-improvement-worker`; the worker claims the cap before edits:

```sh
npm run instruction:feedback -- --claim-session-improvement --session <session-ref> --source-ref <evidence-ref> --summary <summary>
```

If the worker reports that the cap is already claimed, keep later process ideas as continuation items or explicit follow-up work outside the archive gate.
