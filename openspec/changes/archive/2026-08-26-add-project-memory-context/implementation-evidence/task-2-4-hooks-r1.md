# Task 2.4 Hook Lifecycle And Revalidation Proof

- Recorded at: `2026-08-25T21:18:34.6492075Z`
- Product Candidate: `57a0eb58899901f38bf66ce279758bdc7c57045d0f99cacdb8bb6666a53b2ee9`
- Candidate derivation: SHA-256 of the sorted five-file production manifest. Current hashes: `index.ts=68054db723ac22571813c6b06b757ece5f266c7b2a01102fd85c95d80ce6d556`; `recall.ts=0b457bb6a180b6e40b43e3890ce34a3bf9ffec5d110dd410b30e2e0898e71cd6`.
- Environment: `windows-node24.18.1-hook-revalidation-r1`
- Invocations: `node tools/test-project-memory-hooks.ts`; `node tools/test-project-memory.ts`; `node tools/test-session-env-plugin.ts`.
- Exit status: all `0`.
- Focused result: project-memory hooks `1/1` PASS; project-memory store/recall `8/8` PASS; existing session plugin `18/18` PASS.
- Root oracle: one root message uses exactly one SDK lookup with `{ path: { id }, query: { directory } }`. Missing session id, mismatched returned id, outside-root directory, child parent, and a lookup exceeding the one-second deadline all produce no selection; reversed system-hook order also injects nothing.
- Selection oracle: a root selection produces stable repeated system capsules. A matching card added after selection is absent until the next human message because revalidation uses only the selected privacy-safe refs.
- Cross-process oracle: a separate Node process appends invalidation after selection. Pre-transform revalidation removes only the invalidated ref while retaining another selected current ref; pre-compaction revalidation removes an invalidated sole ref.
- Manage/cache oracle: a successful project-memory manage tool action clears process-local selections; system transform stays empty until a later human message selects current memory again.
- Compaction oracle: invalidated context is omitted and the existing `prompt` value remains byte-for-byte unchanged; no transcript read or replacement prompt path exists.
- Cleanup oracle: session deletion and plugin disposal each clear cached selection state; later transforms inject nothing.
- Locality decision: the existing 794-line test owner was split before adding hook scenarios. `tools/test-project-memory.ts` now owns store/recall/process cases at 672 lines; new focused sibling `tools/test-project-memory-hooks.ts` owns real hook-object lifecycle cases at 245 lines. This is `build-minimal`, with no dependency or generic test framework; cross-project discovery was not applicable.
- Effects and cleanup: provider-free local SDK stubs, disposable files, and exact child processes only; the timeout probe emitted one hashed-session warning; all children and fixture roots were cleaned; no installed, remote, transcript, or Serena mutation occurred.
- Claim ceiling: task `2.4` exact hook-order/root/revalidation/cleanup cases. Loaded-plugin evidence remains stale until task `4.1`, and the complete `PMC-001` population remains unknown.
