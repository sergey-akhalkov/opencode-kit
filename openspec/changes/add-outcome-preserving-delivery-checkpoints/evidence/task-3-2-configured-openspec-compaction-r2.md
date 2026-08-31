# Task 3.2 Configured OpenSpec Apply And Compaction

- Candidate: `opdc-openspec-compaction-r2`
- Environment: `windows-node-24.18.1-opencode-1.18.25-configured-openspec-compaction-r2`
- Installed OpenCode: `1.18.25`, executable SHA-256 `59b379b53354da72d2c5262119fe70c44b4e473826ebbaa94d47a2d58a359b1a`
- Main and compaction route: `openai/gpt-5.6-sol/xhigh`
- Governed source digest: `450590f71d2b501b20c10d3f3b81341c8f0c9dda516b4b67af57acdd78ae69b3`
- Effective isolated config digest: `c7a330e24aa2b3cb2b457d1433b917e81756cc1ada381a0a7ca7226d537aa95a`
- Result: complete for one reviewed disposable OpenSpec apply, actual compaction, and continuation chain

## Failure And Gate Closure

- The first configured attempt is preserved under `configured-openspec-compaction-r1`. Its terminal evaluator and provider-free replay failed because compaction regressed completed work to `Not started` and replaced the checkpoint Next Action with skill loading even though the exact planning diff and checkers completed.
- The successor was not an unchanged retry. The loaded compaction contract now gives later observed work precedence without weakening live-attempt/protected-action gates; the apply skill mirrors duplicate-history suppression; and the proof runner requires the exact completed main checkpoint state before summarize.
- The r2 fixture creates a random resume token only after the pre-compaction checker passes, includes it in the main checkpoint Next Action, removes its source file before reconstruction, and verifies the canary token digest. Continuation therefore cannot recover the action from the original prompt or fixture data.

## Runtime Proof

- Main loaded `openspec-apply-change`, changed exactly `design.md`, `history.md`, and `tasks.md`, retained proposal/spec/ownership/evidence bytes, appended one suppression identity, kept both tasks unchecked, and passed the pre-compaction checker.
- Actual compaction retained completed status, the exact dynamic Next Action, unchanged outcome/oracle/population, evidence refs, next oracle, and suppression condition. Reconstruction executed that retained command, reached `canary-result.json:passed`, made zero planning writes, and returned the final checker output.
- The final checker reported the same checkpoint identity, zero duplicate history entries, exact three-path planning change set, and unchanged outcome/oracle/population.
- Capture used three configured requests. Session, proof-owned process, and disposable fixture cleanup were terminal; host config was not loaded, no ripgrep download was requested, governed source remained unchanged, and no archive/remote/protected effect occurred.
- Capture and provider-free replay both produced evaluation digest `6b946b456b952fb810dc97ec24a2d8869eebe1dd94be316549ca776f08b48723` with no failures; replay used `liveCalls=0`.

## Practice Owner Disposition

- Corrected-candidate reviewer session: `ses_fab096dd6ffedz4YSIXbBGQ5TL`; Effective Model: `xai/grok-4.6`.
- `IAR-OPDC-R2-01`: confirmed and closed with the post-checker runtime token, pre-reconstruction marker removal, token-digest oracle, and checker-stdout response instead of prompt-supplied continuation values.
- `IAR-OPDC-R2-02`: confirmed and closed with a provider-free test proving a missing main-response marker aborts before summarize and reconstruction while still deleting the session.
- `IAR-OPDC-R2-03`: confirmed and closed by explicitly excluding live-attempt classification, protected action, and the required first offline gate-closing action from later-evidence precedence.
- `IAR-OPDC-R2-04`: confirmed and closed by applying the same due-checkpoint suppression-identity exception before pending-history reconciliation in the apply skill.
- No additional generic re-review was launched.

## Validation And Claim Ceiling

- `node tools/test-consumer-outcome.ts`: `OK: consumer outcome tests=46`.
- `node tools/test-contracts.ts`: `OK: contracts tests=75`.
- Disposable `openspec.cmd validate checkpoint-route --strict`: valid; apply operation gate: passed.
- Configured loaded preflight: current template and skill loaded, both routes and provider identity available, all checkpoint fields present.
- This supports only the exact recorded configured OpenSpec apply/compaction/continuation path. It does not yet support an `OPDC-001` population member, current ordinary/grind behavior, universal trigger quality, cross-project reliability, active user-process activation, or deployed-runtime behavior.
