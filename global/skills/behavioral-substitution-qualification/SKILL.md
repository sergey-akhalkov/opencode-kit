---
name: behavioral-substitution-qualification
description: Use ONLY for skip/omit/suppress/cache/replay/emulation/replacement/bypass equivalence at an owning boundary.
license: MIT
compatibility: Requires a reviewed Claim And Evidence Scope and current evidence identities.
metadata:
  author: opencode-kit
  version: "1.0"
---

# Behavioral Substitution Qualification

Use this skill only when a result claims that skipped, omitted, suppressed, cached, replayed, emulated, replaced, or optimized-bypass behavior preserves an existing result. Stay unloaded for an Ordinary Small exact case that changes no behavior by substitution and makes no broader equivalence claim.

## Inputs

- Accepted outcome and stable claim id/class.
- Actual user/caller integration point and substitution boundary.
- Unchanged baseline request, actor, production path, environment, and initial state.
- Candidate path and current Candidate/Environment identity.
- Reviewed observation contract and evidence-lane references.
- Current authorization, real-oracle availability, restoration, cleanup, and external-effect limits.

Missing semantic choices remain reviewed unknowns; deterministic helpers never invent equivalence, non-applicability, partitions, exclusions, or thresholds.

## Closure

1. Freeze the baseline and candidate identities before comparison. Name the owning production boundary; a component, mock, simulator, replay, or representative case is not that boundary unless the accepted claim is explicitly limited to it.
2. Compare the same actor/request, environment, and initial state through every applicable output, state, effect, order, timing, fault, recovery, cleanup, and terminal observation. Mark non-applicable fields explicitly with a reviewed reason.
3. Reach the owning real boundary whenever the claim depends on safely reachable real-system behavior. Lower-fidelity evidence remains useful for its narrower component claim but cannot satisfy an available higher-fidelity dependency.
4. Bind finite members or reviewed partition classes to unique current terminal rows. Keep missing, stale, weaker-path, unresolved, duplicate, or unqualified rows visible.
5. Record the maximum supported claim and `supported | narrowed | blocked | unknown` disposition. `narrowed` also requires explicit accepted-scope evidence; an unavailable required real oracle blocks only the dependent equivalence claim.
6. Before representing real-system equivalence, compatibility/interchangeability, safety, or phase/milestone completion, obtain one fresh read-only `evidence-sufficiency-reviewer` matrix. Main independently dispositions it; review never authorizes mutation or protected effects.

Do not run or repeat an external, physical, destructive, costly, production, install, deploy, or release action without separate authority. Preserve live-attempt, identity, restoration, cleanup, data-integrity, and safety gates from the active global contract.

## Output

Return:

- `Claim ID / Original Outcome`: stable references.
- `Integration And Paths`: caller, substitution boundary, baseline, candidate, production owner.
- `Population / Environment`: explicit identities and coverage basis.
- `Observation Matrix`: required field -> baseline evidence -> candidate evidence -> disposition.
- `Real Oracle`: required/status/evidence or exact blocker.
- `Evidence References`: current bounded lanes.
- `Maximum Supported Claim`: exact ceiling.
- `Disposition`: `supported | narrowed | blocked | unknown`.
- `Independent Challenge`: required/status/reference.
- `Known Limitations`: narrower proof and excluded scope.

Never emit an approval, lifecycle stage, universal model-quality claim, semantic score, or authority to mutate.
