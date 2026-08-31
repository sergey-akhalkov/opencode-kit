# Documentation Hardening Ledger

- **Scope:** `proposal.md`, `design.md`, `specs/local-opencode-workstation/spec.md`, `tasks.md`, `history.md`, and `falsification-review.md` for `install-nuphus-windows-desktop-mcp`.
- **Goal:** Ensure the propose candidate is internally consistent, source-bounded, implementation-ready, and explicit about unknown live behavior before apply.
- **Non-Goals:** Prove package installation, MCP behavior, OpenCode loading, GUI effects, local models, rollback, or unrelated repository documentation.
- **Success Criteria:** Every in-scope line is reviewed; normative behavior remains in the delta spec; proposal/design/tasks/history are synchronized; material findings are corrected and re-reviewed; strict OpenSpec validation passes.
- **Stop Line:** Stop after the final planning candidate has continuous block coverage, no open material documentation finding, a terminal bounded falsification record, and green structural validation. Do not install Nuphus or drive the desktop in this loop.
- **Evidence Policy:** Documentation is a claim until source, schema, command output, owner decision, or later live apply evidence verifies it.
- **Current Phase:** final
- **Progress:** 36/36 blocks reviewed; 1 material finding fixed and re-reviewed; 0 blocked; 0 needs-rereview.

## File Inventory

| Path | Lines | Type | Status | Notes |
|---|---:|---|---|---|
| `proposal.md` | 50 | OpenSpec proposal | clean | Canonical accepted outcome, claim ceiling, and change surface. |
| `design.md` | 101 | technical design | clean | Canonical implementation/proof decisions and failure boundaries. |
| `specs/local-opencode-workstation/spec.md` | 78 | normative delta spec | clean | Four added behavior requirements with observable scenarios. |
| `tasks.md` | 26 | apply checklist | clean | Dependency-ordered behavior, proof, risk, and validation work. |
| `history.md` | 102 | strategy evidence | clean | Selected/rejected routes, advisory gap, correction, and review closure. |
| `falsification-review.md` | 25 | readiness review record | clean | Machine-readable bounded review identity and terminal state. |

`documentation-hardening-ledger.md` is the review record and is excluded from recursive self-coverage. `.openspec.yaml` is unchanged OpenSpec schema metadata, not authored decision prose, and is outside this documentation review scope.

## Block Coverage

- [x] DB01 | `proposal.md:1-4` | motivation | clean
- [x] DB02 | `proposal.md:5-14` | outcome capsule | finding fixed
- [x] DB03 | `proposal.md:15-19` | claim ceiling | clean
- [x] DB04 | `proposal.md:20-27` | change surface | clean
- [x] DB05 | `proposal.md:28-32` | automation and falsification | clean
- [x] DB06 | `proposal.md:33-50` | capabilities and impact | clean
- [x] DB07 | `design.md:1-12` | context and fidelity ladder | clean
- [x] DB08 | `design.md:13-28` | goals and non-goals | clean
- [x] DB09 | `design.md:29-38` | package/config owner decision | clean
- [x] DB10 | `design.md:39-44` | full-authority decision | clean
- [x] DB11 | `design.md:45-50` | observation-route decision | clean
- [x] DB12 | `design.md:51-60` | isolated real-proof decision | finding fixed
- [x] DB13 | `design.md:61-66` | restart/model/rollback state | clean
- [x] DB14 | `design.md:67-76` | failure boundaries | clean
- [x] DB15 | `design.md:77-87` | risks and mitigations | clean
- [x] DB16 | `design.md:88-101` | migration and questions | clean
- [x] DB17 | `specs/local-opencode-workstation/spec.md:1-25` | installed/load behavior | finding fixed
- [x] DB18 | `specs/local-opencode-workstation/spec.md:26-45` | target-act-confirm behavior | clean
- [x] DB19 | `specs/local-opencode-workstation/spec.md:46-65` | exact reversibility | clean
- [x] DB20 | `specs/local-opencode-workstation/spec.md:66-78` | screen/model-data effects | clean
- [x] DB21 | `tasks.md:1-5` | candidate/proof setup | clean
- [x] DB22 | `tasks.md:6-10` | install/config tasks | clean
- [x] DB23 | `tasks.md:11-16` | real desktop proof tasks | finding fixed
- [x] DB24 | `tasks.md:17-22` | rollback/regression/risk tasks | clean
- [x] DB25 | `tasks.md:23-26` | validation/handoff tasks | clean
- [x] DB26 | `history.md:1-12` | custom-driver rejection | clean
- [x] DB27 | `history.md:13-22` | pinned local selection | clean
- [x] DB28 | `history.md:23-32` | strict-confirm rejection | clean
- [x] DB29 | `history.md:33-42` | inline-base64 rejection | clean
- [x] DB30 | `history.md:43-52` | screenshot-to-Read selection | clean
- [x] DB31 | `history.md:53-62` | portable expansion rejection | clean
- [x] DB32 | `history.md:63-72` | attributed Notepad selection | clean
- [x] DB33 | `history.md:73-82` | team-advice status | clean
- [x] DB34 | `history.md:83-93` | confirmed readiness correction | finding fixed
- [x] DB35 | `history.md:94-102` | corrected-candidate closure | clean
- [x] DB36 | `falsification-review.md:1-25` | bounded review record | clean

## Block Reviews

### DB01-DB06 | Proposal

- **Claims:** Current need, exact host/package envelope, non-goals, invariants, proof oracle, risks, stop line, exact-case ceiling, file/effect surface, automation dividend, and capability ownership.
- **Evidence Checked:** Independent owner request and full-authority reply; read-only host/config/package/source inventory; current capability path; strict OpenSpec validation; r1/r2 readiness reviews.
- **Verdict:** finding fixed.
- **Findings:** F01 affected DB02's proof-process attribution.
- **Fix Decision:** Bind proof to ephemeral port, isolated runtime roots, active-config digest/resolved Nuphus projection, sibling-disable overlay, exact PID/base URL, and unchanged managed 4096/4097 identities.
- **Re-review:** DB02 re-read after correction; corrected-candidate reviewer reported no material finding.

### DB07-DB16 | Design

- **Claims:** Package and screen-output observations; Material profile; fidelity order; owner/reuse disposition; full-authority, observation, isolation, restart, model, and rollback decisions; cause-preserving failure classes; mitigations; migration sequence.
- **Evidence Checked:** Current `global/opencode.json` MCP block, `openspec/specs/local-opencode-workstation/spec.md`, `tools/proofs/lib/opencode-proof-client.ts`, `tools/proofs/lib/proof-process-cleanup.ts`, representative workstation proof runners, package metadata/source observations, and both readiness reviews.
- **Verdict:** finding fixed.
- **Findings:** F01 affected DB12 and the related proof-identity failure/risk/migration rows.
- **Fix Decision:** Reuse the existing configured proof environment rather than create a second lifecycle owner; disable siblings only in the proof overlay and fail closed if composition cannot preserve the active Nuphus entry.
- **Re-review:** DB12 and dependent DB14-DB16 rows re-read; r2 review found no material contradiction or unsupported current composition claim. Live composition remains explicitly unknown until apply.

### DB17-DB20 | Delta Spec

- **Claims:** Pinned local MCP availability, unchanged existing sessions, visible failures, target-act-confirm observation, exact rollback/drift safety, and explicit screen/model-data effects.
- **Evidence Checked:** Existing capability ownership on ports 4096/4097, active sibling MCP keys, Nuphus documented operation shapes, proposal/design boundaries, and OpenSpec scenario-format validation.
- **Verdict:** finding fixed.
- **Findings:** F01 affected DB17 and rollback absence attribution in DB19.
- **Fix Decision:** Add observable process/config/port isolation and identical rollback absence route without encoding implementation internals beyond externally testable identities.
- **Re-review:** Every requirement retains at least one exact WHEN/THEN scenario; strict validation and r2 readiness review pass.

### DB21-DB25 | Tasks

- **Claims:** Preimage/candidate capture, minimal proof owner, exact package/config mutation, earliest direct protocol signal, loaded OpenCode and GUI proof, model bootstrap, rollback rehearsal, focused regression, required risk owners/SDET, validation, cleanup, and handoff.
- **Evidence Checked:** Design dependency order, repository proof inventory, package scripts, reusable process/proof helpers, accepted success boundary, and review findings.
- **Verdict:** finding fixed.
- **Findings:** F01 affected DB23 and DB24's absence proof.
- **Fix Decision:** Make task 3.1 state every server/config/process oracle and make task 4.1 reuse that exact route.
- **Re-review:** Every task remains checkbox-parseable, dependency-valid, bounded to one session-scale outcome, and names its verification. r2 review found no material task gap.

### DB26-DB35 | Strategy History

- **Claims:** Only materially distinct explored routes, evidence, selected/rejected status, do-not-repeat controls, advisor availability, one confirmed review finding, its main disposition, and terminal corrected-candidate review.
- **Evidence Checked:** Current session delivery context; package/source/config discovery; exact reviewer session refs and returned models; main source reproduction of IR-001.
- **Verdict:** clean after F01 record.
- **Findings:** No separate documentation defect. DB34 records F01 rather than creating new scope.
- **Fix Decision:** Preserve the one correction and stop generic re-review on the unchanged decision surface.
- **Re-review:** DB34-DB35 read after both reviewer returns; identities and terminal state agree with `falsification-review.md`.

### DB36 | Falsification Record

- **Claims:** Original request, reviewed r2 candidate, six attempted attack classes, material finding/disposition/correction, invalidated surfaces, terminal corrected-candidate outcome, and still-unobserved live boundaries.
- **Evidence Checked:** Reviewer sessions `ses_fab8df883ffeH4RnahQwQ1Upzg` and `ses_fab85cc8fffet939YIMXRLcjTc`, r1/r2 hashes recorded in history, and current artifact readback.
- **Verdict:** clean.
- **Findings:** none.
- **Fix Decision:** none.
- **Re-review:** complete.

## Findings

### F01 | Material | DB02, DB12, DB17, DB19, DB23, DB24

- **Evidence:** r1 readiness review found that “new isolated OpenCode process” and “actual active config” were not bound to an exact port, DB/XDG roots, config digest, sibling MCP state, PID/base URL, or managed 4096/4097 non-mutation. Main reproduced the ambiguity from the current capability, config, and proof helper.
- **Impact:** A green connection could be attributed to the managed server or copied config, collide with protected listeners, start unrelated MCPs, or leave cleanup ownership unclear.
- **Likely Root Cause:** Initial planning named isolation as an intent but not as observable identities at the existing workstation lifecycle boundary.
- **Minimal Fix:** The r2 proof route and matching rollback route now enforce exact process, port, runtime-root, config, sibling, listener, and cleanup identities.
- **Status:** fixed and independently re-reviewed; `no-material-finding` on r2.

## Final Checks

- Stale status check: all live package/protocol/OpenCode/GUI/model/rollback results remain explicitly unobserved; no installation claim appears.
- Navigation check: proposal capability path, delta spec, current capability, proof helpers, config/template/installer exclusions, and validation commands resolve to existing owners or explicit apply-created paths.
- Duplication check: behavior is normative only in the delta spec; proposal, design, tasks, and history reference the same contract for outcome, mechanism, execution, and evidence roles rather than introducing alternate requirements.
- Scope check: portable defaults, cloud vision, broad Windows compatibility, existing user applications, managed-server lifecycle mutation, and unrelated dirty changes remain outside the increment.
- Readiness check: one confirmed material finding is corrected; one permitted corrected-candidate re-review is terminal with no material finding.

## Residual Risks

- Docs-only source/package observations must be reconfirmed immediately before install and bounded by retained live identities.
- `configuredProofServerEnvironment` supplies isolated DB/cache/config/state; the apply-owned runner must also assign proof-owned data, test-home, project, and evidence roots required by the spec.
- Live config-overlay composition, package execution, OpenCode loading, screen visibility, GUI input, model bootstrap, and rollback remain unknown until apply and cannot be promoted from this ledger.

## Actionable Continuation Items

- Apply task 1.1 is the next dependency-valid step after an explicit OpenSpec apply command; no planning follow-up is required.
