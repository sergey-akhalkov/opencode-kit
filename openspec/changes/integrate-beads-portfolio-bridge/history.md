# Strategy History

## 2026-09-01 - Replace existing lifecycle owners with Beads

- **Objective:** Minimize custom workflow mechanisms by making Beads the universal tracker and execution owner.
- **Approach:** Replace Kaizen promotion, OpenSpec tasks, `grind_frontier`, Campaign/Mission orchestration, and writer leases with Beads issues, dependencies, ready state, and claims.
- **Evidence:** Current source shows Kaizen owns privacy-safe signal evidence and decisions, `grind_frontier` owns protected task-scoped gates, and Campaign/Mission own durable source-writer leases. The selected Beads release exposes issue coordination but not those exact safety, decision, proof, archive, or writer-liveness contracts.
- **Outcome:** Rejected in favor of a narrow admitted-portfolio bridge.
- **Reason:** Replace-all would erase unique authority and safety semantics and make a third-party issue state an unsupported source-mutation permission.
- **Do-Not-Repeat Condition:** Do not propose Beads as the universal owner while these distinct current contracts remain accepted and Beads lacks equivalent proven boundaries.
- **Evidence-Based Retry Condition:** Reconsider only through a separate Material proposal after current runtime evidence proves exact contract equivalence and an accepted owner decision selects replacement rather than coexistence.

## 2026-09-01 - Use vendor OpenCode setup and always-loaded guidance

- **Objective:** Integrate Beads quickly with the vendor-maintained OpenCode path.
- **Approach:** Run `bd setup opencode`, use its managed `AGENTS.md` section, load `bd prime`, or add the Beads MCP catalog to normal sessions.
- **Evidence:** Official integration documentation says setup creates or updates managed `AGENTS.md`; the inspected vendor section declares Beads for all issue tracking. The kit already has canonical OpenSpec, Kaizen, frontier, and writer owners, and context-cost improvement is unproved.
- **Outcome:** Rejected in favor of an explicit full `core-beads` profile, one on-demand skill, and a closed CLI adapter.
- **Reason:** Vendor setup creates conflicting always-loaded lifecycle authority, while prime/MCP can increase startup context and permission surface without adding a required current oracle.
- **Do-Not-Repeat Condition:** Do not run or copy vendor setup, prime-at-startup, MCP, or all-tracking instructions in this increment.
- **Evidence-Based Retry Condition:** Reconsider only if a later pinned release provides a non-mutating OpenCode integration mode whose exact loaded behavior is proven compatible and lower-cost through matched outcomes.

## 2026-09-01 - Treat isolated project databases as a cross-project portfolio

- **Objective:** Obtain global opportunity visibility while preserving project isolation.
- **Approach:** Initialize independent embedded Dolt stores per project and describe their combined state as one cross-project graph.
- **Evidence:** Each embedded store owns only its project-local data; no stable selected-release federation, server, or kit-owned aggregate index was proved. Architecture review identified this as an unsupported ownership claim.
- **Outcome:** Corrected to one-project scope with cross-project visibility outside `BPB-001`.
- **Reason:** Isolated databases do not create a truthful shared query, readiness, assignment, or transaction owner.
- **Do-Not-Repeat Condition:** Do not claim cross-project portfolio behavior from multiple project-local stores alone.
- **Evidence-Based Retry Condition:** Reconsider after two project-local pilots and direct proof of one explicitly selected central portfolio, stable federation/server, or read-only aggregate owner with privacy and recovery contracts.

## 2026-09-01 - Add Beads beside Kaizen Grind SQLite work items

- **Objective:** Preserve the active Kaizen Grind design while gaining Beads coordination features.
- **Approach:** Implement Kaizen SQLite `work_items` and mirror admitted items, status, dependencies, assignment, and closure into Beads.
- **Evidence:** The active unimplemented Grind proposal already assigns work-item identity, transitions, claims, routing, and closure to SQLite. Beads offers overlapping issue identity, dependencies, readiness, assignment, and terminal state, creating bidirectional synchronization and crash-recovery ambiguity.
- **Outcome:** Rejected; current design requires one admitted-work owner before production integration.
- **Reason:** Mirroring would create duplicate semantic authority and turn every interruption into a reconciliation problem with no safe precedence.
- **Do-Not-Repeat Condition:** Do not implement either production work-item layer until current planning delegates admitted portfolio identity to exactly one owner.
- **Evidence-Based Retry Condition:** Reconsider only if later evidence proves Beads cannot satisfy the selected bounded contract and the Beads path is removed rather than mirrored.

## 2026-09-01 - Select a bounded one-project portfolio bridge

- **Objective:** Reuse Beads where it lowers custom coordination cost without weakening existing lifecycle owners.
- **Approach:** Pin the tested recovery release, prove it in a disposable Windows root, install it through existing workstation ownership, expose one exact full `core-beads` on-demand profile, enable one project-local embedded store, correlate only evidence-triaged Kaizen decisions, and close through verified OpenSpec terminal evidence.
- **Evidence:** Official CLI documentation exposes exact release, init flags, metadata filters, external refs, dependencies, ready/show, assignment/claim, config, where, doctor, and Dolt behavior. Current kit source provides the retained signal, frontier, profile, workstation, OpenSpec, and writer owners needed around the narrow adapter. Runtime fit remains unproved and is task 1.1.
- **Outcome:** Selected for `BPB-001` planning, with production work gated by disposable proof and Grind ownership reconciliation.
- **Reason:** This is the smallest useful bridge that can test actual value while containing persistence, context, remote, concurrency, and authority risk.
- **Do-Not-Repeat Condition:** Do not expand to another project, central database, server/federation, remotes, production claims, automatic voting, or source mutation inside this change.
- **Evidence-Based Retry Condition:** Revise the route only when task 1.1 or later current proof falsifies the selected pin, embedded topology, adapter boundary, or one-project operational value.

## 2026-09-01 - Compose a Beads-only partial profile with core

- **Objective:** Keep Beads out of default core while allowing an operator to add only its on-demand artifacts.
- **Approach:** Add a partial `beads` profile and describe selection as `core + beads` composition.
- **Evidence:** Current `tools/install-opencode-global.ts` accepts only concrete full `core | all` identities, and `tools/runtime-surface-profile.ts` materializes one named profile rather than a union. A Beads-only tree would omit core authority; adding a skill under full `global/` source also makes it discoverable in all/unprofiled catalogs.
- **Outcome:** Rejected in favor of one exact full `core-beads` profile, with truthful all/unprofiled full-source discovery and unchanged core.
- **Reason:** The partial composition was not an existing runtime mechanism and its proof could pass on a fixture that operators cannot install safely.
- **Do-Not-Repeat Condition:** Do not claim composable partial profiles until the selected current installer/profile owner actually implements and proves that contract.
- **Evidence-Based Retry Condition:** Reconsider composition only after another accepted profile needs the same mechanism and one reviewed full-profile alternative has higher total maintenance/proof cost.

## 2026-09-01 - Use one universal bridge adapter and delete every Grind work-item record

- **Objective:** Minimize the number of new bridge modules and eliminate duplicate admitted-work state.
- **Approach:** Give one adapter install/project/Beads/Kaizen/OpenSpec operations and make Beads replace all Grind `work_items` records.
- **Evidence:** Architecture review of `BPB-SPEC-r1` showed the workstation already owns binary lifecycle, Kaizen owns signal transitions, and the vendor seam should only invoke `bd`. Campaign/Mission still require durable Grind-owned execution/routing/retry/gate correlation even when Beads owns portfolio identity.
- **Outcome:** Corrected to three existing/local owners: workstation binary/profile lifecycle, narrow vendor adapter, and Kaizen-owned promotion/link/terminal orchestrator; Grind retains a non-portfolio execution record referencing the Beads ID.
- **Reason:** The universal facade mixed failure/rollback owners, while deleting every execution record removed required Campaign/Mission handoff state rather than only duplicate portfolio authority.
- **Do-Not-Repeat Condition:** Do not merge installer, vendor CLI, Kaizen lifecycle, OpenSpec terminal decisions, or Grind execution state into one bridge owner.
- **Evidence-Based Retry Condition:** Reconsider only if current implementation proves one of those owners has been removed or their exact state/effect contracts have become identical.

## 2026-09-01 - Roll back installation state independently of bridge-writer liveness

- **Objective:** Keep workstation rollback independent from project-local bridge coordination.
- **Approach:** Allow the workstation owner to remove matching binary, profile, adapter, registration, config, or lock material without acquiring the bridge lease because project disable and binary/profile rollback are separate operations.
- **Evidence:** Corrected-candidate architecture review `BPB-ARCH-007` showed the bridge lock lived in installation-owned state while no contract prevented independent rollback from deleting that state during a live or unknown child `bd`/Dolt write.
- **Outcome:** Rejected; the workstation lifecycle now solely owns lock-artifact storage/identity/deletion, and rollback of registration-referenced managed material must acquire the same lease or preserve the lock and every referenced item as a partial unknown result.
- **Reason:** Removing the coordination artifact or referenced executable/adapter/registration while a late writer can still mutate recreates duplicate-create and unrepaired writer races despite a correct bridge-operation lease.
- **Do-Not-Repeat Condition:** Do not infer safe rollback from timeout, cancellation acknowledgement, elapsed time, or an absent PID, and do not delete the lock or registration-referenced material while writer closure is active or unknown.
- **Evidence-Based Retry Condition:** Reconsider only if a later owner removes project-local child writers entirely or proves another exact revocation mechanism that prevents all late project writes before managed state is removed.

## 2026-09-01 - Initialize an empty repository without prepared Dolt ignore policy

- **Objective:** Prove that the pinned non-interactive embedded initialization changes only `.beads` and the reviewed local exclude file.
- **Approach:** Initialize an empty disposable Git repository with `bd init --prefix BPB --non-interactive --skip-agents --skip-hooks --setup-exclude --sandbox --json` after redirecting Windows profile, AppData, XDG, and global Git identities and blocking outbound traffic for the verified executable.
- **Evidence:** The verified `v1.2.2` process exited 0 and created the expected embedded store and `.git/info/exclude` entries, but also created a project-root `.gitignore` containing Dolt and Beads credential/proxy patterns. The init parent briefly left one proof-owned child `bd.exe`, which terminated naturally before another mutation. No user profile, workspace `.beads`, hook, remote, or tracked-file effect was observed.
- **Outcome:** Rejected as the activation route for a project without a pre-reviewed ignore policy.
- **Reason:** Automatic project-root `.gitignore` creation is outside the accepted activation effect envelope and would make installed-pilot source bytes differ from the reviewed candidate.
- **Do-Not-Repeat Condition:** Do not invoke project activation when the exact required Dolt and Beads ignore entries are absent from the reviewed tracked project baseline, and do not treat an untracked `.gitignore` as harmless merely because no prior tracked bytes changed.
- **Evidence-Based Retry Condition:** Use a fresh disposable repository whose tracked baseline already contains the exact observed ignore entries, then prove byte-for-byte stability across initialization; the future preview must fail before `bd` invocation when that prerequisite is absent or drifted.

## 2026-09-01 - Require a prepared tracked Dolt ignore policy before activation

- **Objective:** Preserve reviewed project bytes while proving the exact pinned embedded lifecycle and atomic Beads correlation boundary.
- **Approach:** Recreate the disposable repository with the exact observed Dolt and Beads credential/proxy ignore entries already present in the tracked index; keep the project-local `.git/info/exclude` change explicit, redirect Windows profile/AppData/XDG/global-Git identities, disable anonymous metrics in the isolated state, and block outbound traffic for the verified executable.
- **Evidence:** The release API and downloaded archive matched SHA-256 `1f00c29cd9599e182a4a4e829f5210daca2da14155920aee2836d8bc613b2feb`; extracted `bd.exe` was SHA-256 `b1f3609fea1d9f0f19b2ed49098b3628acfa6ca115aa28b01a1ee178c3a214de` and reported `1.2.2`. Prepared initialization left the tracked index and `.gitignore` hash unchanged, installed no hooks or remote, and created only the reviewed local exclude and `.beads` state. One `create` atomically committed the external ref and all correlation metadata, exact all-state metadata lookup recovered the same item open and closed, blocker readiness changed only after close, two concurrent claims produced one winner and one explicit rejection, an exact-PID interrupted close left the item safely open with no child, and normal close/reopen/final-close plus history and embedded reopen succeeded. The store contained 15 files totaling 1,454,120 bytes. `doctor` and raw `sql` truthfully reported unsupported in embedded mode. All proof-owned `bd`/Dolt processes, the executable-specific firewall rule, and the unique proof root were terminal or removed; user Git configuration and user/workspace Beads paths remained unchanged. A separate pre-existing OpenCode parent/child pair exited during the final cleanup interval without any process-targeting command, so that environmental exit is not claimed as static-process proof.
- **Outcome:** Selected as the source and adapter precondition for `BPB-001`; task 1.1 passed at the one-workstation disposable boundary.
- **Reason:** This is the smallest observed route that preserves tracked project bytes while retaining exact embedded identity, atomic correlation, advisory readiness/assignment, fail-closed contention, interruption recovery, and no remote effect.
- **Do-Not-Repeat Condition:** Do not activate a project whose reviewed tracked ignore policy is absent or drifted; do not enable metrics, pass `--ignore-schema-skew`, rely on embedded `doctor`/`sql`, infer writer closure from the parent exit alone, or broaden the supported command surface from top-level help.
- **Evidence-Based Retry Condition:** Re-run the live spike only after a changed pin, platform, extracted digest, initialization contract, required command surface, or directly observed environment invalidates this evidence; otherwise consume the exact manifest and capability matrix in tasks 1.3 and 2.1.

## 2026-09-02 - Rebind Kaizen Grind execution state beneath one-project Beads portfolio ownership

- **Foundation Incident ID:** `FI-BPB-KZG-20260901-01`.
- **Candidate Relation:** `candidate:bpb-spec-r4-foundation-reconciled` with `candidate:add-autonomous-kaizen-grind-r3-foundation-reconciled`; the relation is the one BPB-enabled project's admitted portfolio identity versus Grind's controller execution correlation.
- **Reproduction Evidence:** Current `add-autonomous-kaizen-grind` planning assigned accepted-work identity, dependencies, mutable status, assignment-adjacent session correlation, and terminal closure to SQLite `work_items`; current `BPB-001` assigned the same enabled project's identity, graph, readiness, assignment, duplicate relations, and terminal state to Beads. Implementing both unchanged would create competing authorities and ambiguous crash recovery.
- **State Transitions:** `observed -> confirmed -> correcting -> swept -> re-reviewed -> closed`.
- **Selected Correction:** Preserve `KZG-001` population and project routing but rename its controller object to a non-portfolio execution record. The record contains only its execution ref, run/cycle and source-decision refs, project/registration/candidate digests, optional canonical Beads ID, exact execution-prerequisite refs, route, gate/retry, Campaign/Mission/session refs, and resulting execution handoff. For the one BPB-enabled project the Beads ID is mandatory, Beads-owned state is not copied, and Grind only records the Kaizen bridge's ordered terminal result. Another registration has no inferred Beads identity or ownership.
- **Dependent Rebind:** `integrate-beads-portfolio-bridge/{proposal.md,design.md,tasks.md,specs/cross-project-kaizen-loop/spec.md}`.
- **Dependent Narrow:** `add-autonomous-kaizen-grind/{proposal.md,design.md,tasks.md,specs/autonomous-kaizen-grind/spec.md,specs/autonomous-work-campaign/spec.md,specs/cross-project-kaizen-loop/spec.md,specs/local-opencode-workstation/spec.md,specs/unattended-roadmap-orchestration/spec.md}`.
- **Not Dependent:** Both `.openspec.yaml` files; both historical `falsification-review.md` records; `add-autonomous-kaizen-grind/history.md`; BPB `beads-portfolio-bridge`, workstation, and profile deltas; KZG profile delta; canonical specs; archives; and active changes `add-prospective-consequence-rehearsal`, `deliver-continuous-reusable-value`, and `make-team-advice-evidence-triggered`.
- **Owner Boundary Or Unknown:** none for this one-project relation. Extending Beads ownership to another project remains outside `BPB-001`, not a recovery decision.
- **Preserved Evidence:** Pre-correction dependency-cone aggregate SHA-256 `65c99a9d1c9ed80ad139c489708aa3842565ef6a15c83930929a5a547b83dcd0`; rejected-strategy history, immutable falsification records, archives, canonical specs, unrelated active changes, and unrelated dirty worktree paths were not rewritten. Task 1.1 disposable runtime proof remains valid only for the exact pinned one-project spike and does not prove KZG integration or cross-project Beads ownership.
- **Corrected-Candidate Proof:** `openspec validate add-autonomous-kaizen-grind --strict` and `openspec validate integrate-beads-portfolio-bridge --strict` both passed before re-review. The same strict validators passed again after the focused correction; targeted readback found no remaining current `terminal execution record`, `frozen execution record`, direct campaign-to-`handoff-complete`, or non-historical KZG `work_items` wording. `git diff --check` reported no error for the two change roots. No production store, binary, project, runtime, profile, or host state was mutated by this recovery.
- **Fresh Re-Review:** Foundation Integrity reviewer task `ses_fa11de9e9ffe1PyopT9sTJBUG7`, effective model `openai/gpt-5.6-sol`, inspected the exact corrected candidate and reported `FI-BPB-KZG-R01` (the campaign delta named a broader semantic input as the persisted execution record) and `FI-BPB-KZG-R02` (campaign completion could enter execution-handoff completion before the selected portfolio owner's terminal result).
- **Main Disposition:** Both findings were independently reproduced from the current paths. The campaign contract now uses a distinct frozen campaign input that references the exact bounded execution-record projection while keeping accepted-outcome/evidence/path/effect/candidate facts outside `execution_records`. Campaign/Mission completion now enters `awaiting-terminal`; only the Kaizen bridge's ordered Beads-close-then-signal-resolve result permits `handoff-complete` for the BPB-enabled project, while another registration requires its existing Kaizen terminal transition. No second verdict-seeking review was run.
- **Terminal State:** `closed`. Remaining protected owner boundary: none for this one-project relation. Known limitation: BPB-KZG runtime integration remains unproved and task 1.1 evidence remains bounded to the exact disposable pinned-binary spike.

## 2026-09-02 - Rebind registration to the canonical Kaizen project identity

- **Foundation Incident ID:** `FI-BPB-KPREF-20260902-01`.
- **Candidate Relation:** `candidate:bpb-task2.3-project-lifecycle-20260901T2345Z`; Beads registration `projectRef` versus Kaizen v1 `KaizenSignal.projectRefs` for exact task 3.1 `project-change` eligibility.
- **Reproduction Evidence:** For the same native canonical workspace root, Kaizen's current `project_${sha256(root).slice(0,32)}` and registration's former `project:${sha256(root.toLowerCase())}` both matched their private schemas but were unequal; native-root and lowercased-root hashes were also unequal. No repository registration artifact existed, and protected install/registration had not occurred, so there was no current persisted population to migrate.
- **State Transitions:** `observed -> confirmed -> correcting -> swept -> re-reviewed -> closed`.
- **Selected Correction:** Registration now reuses the existing Kaizen/Project Memory identity exactly, without conversion or session-ref substitution. Lifecycle record validation and protected state path derivation use the same 32-hex privacy-safe suffix.
- **Dependent Rebind:** `tools/windows/beads-bridge-registration.ts`, `tools/windows/beads-project-lifecycle.ts`, their focused tests, and tasks 2.2-2.3 proof state.
- **Not Dependent:** BPB requirement prose, release manifest, vendor adapter metadata validation, `add-autonomous-kaizen-grind`, the other three active changes, canonical specs, and archives. Tracked archive tree `1a2f6b50780e24ab79ab63f6bcfee5abb2bbd148` plus unrelated untracked archive directories were not rewritten.
- **Prior Evidence Ceiling:** Former task 2.2-2.3 tests remain historical-only for `project:<64hex>` identity and its 64-hex protected path; their registration-to-Kaizen compatibility claim was invalid.
- **Corrected-Candidate Proof:** Registration tests passed 7/7, including exact equality with the Kaizen v1 canonical-root formula; lifecycle tests passed 12/12, including full enable/check/disable/rollback, drift, red-effect, and unknown-writer oracles under the corrected 32-hex identity. No real registration, binary, profile, project, provider, remote, or host state was created.
- **Fresh Re-Review:** Foundation Integrity reviewer task `ses_fa07a2dd3ffe6xYOFR7PYz5fep`, effective model `openai/gpt-5.6-sol`, inspected `candidate:bpb-task2.3-project-ref-rebound-20260902T0012Z` and reported `no-material-finding`; the exact current relation is aligned while task 3.1 promotion remains unimplemented and unproved.
- **Terminal State:** `closed`. Remaining protected owner boundary: none for this disposable identity rebind. Known limitation: corrected proof establishes same-root identity and task 2.2-2.3 lifecycle compatibility only, not Kaizen-to-Beads promotion.
