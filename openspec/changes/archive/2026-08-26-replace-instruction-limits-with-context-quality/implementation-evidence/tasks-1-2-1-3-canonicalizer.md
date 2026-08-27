# Tasks 1.2-1.3 Canonicalizer Proof

## Candidate

- Product Candidate: `tools/instruction-context-quality.ts`, `config/instruction-context-quality.json`, `package.json`, and `package-lock.json`
- Focused Test Owner: `tools/test-instruction-context-quality.ts`
- Markdown parser/fixer engine: `textlint@15.8.0` and direct `@textlint/markdown-to-ast@15.8.0`
- Operating envelope: repository source and proof-owned disposable roots only; no active install, provider call, consumer mutation, or remote effect

## Actual Entry Point

`npm run instruction:canonicalize` is the maintained entry. The focused suite invokes that package entry on Windows through the host command processor and invokes `npm` directly on other platforms; it does not substitute the imported evaluator for package-entry proof.

`npm run instruction:canonicalize -- --help` and `npm run instruction:canonicalize -- -h` both exited `0` and printed the same usage without requiring a readable source root or seed.

## Disposable Runtime Proof

`node tools/test-instruction-context-quality.ts` exited `0` with four passing cases and exact cleanup:

1. Both help aliases were effect-free against an intentionally unreadable root.
2. A malformed seed failed non-zero with `Context-quality seed.rules must be an array`; direct CLI output redacted the fixture root and the source preimage was unchanged.
3. Inline code, a quoted requirement, link text/destination, URL, and fenced code remained unchanged. Protected fixture SHA-256 before/after: `bde3952f1c269ec50d2330615689d3e9c1a6ed03fb61bb3ecc29783006b7b30c`.
4. Check mode reported `needs-fixes` and rule `replace-in-order-to` without mutation; write mode changed `Act in order to verify the result.` to `Act to verify the result.` and reported before/after measurements; immediate second check reported `passed` with zero safe fixes and no byte drift.

Fixed-point preimage SHA-256: `a7e6023118b617a25b354b1762fe11bb01b8f5371eafa014cb279484fab3ae3a`.

Fixed-point canonical SHA-256 after write and second check: `ee0795b54fb499144b0d3b59e4c48a8cfa1a92c680be3348e7f537ffd1991203`.

Every proof-owned fixture root was removed in `finally`; the suite checks absence after cleanup.

## Focused Validation

- `npm run test:focused:instruction-context`: exit `0`, `OK: instruction context quality tests=4`
- `npm ls --depth=0 textlint @textlint/markdown-to-ast`: exit `0`, both packages resolved to `15.8.0`
- Package/lockfile readback: exact direct development dependencies and `lockfileVersion: 3`
- `git diff --check`: exit `0`; Git emitted only its local LF-to-CRLF notice for `package.json`

## Claim Ceiling

This proves the exact reviewed phrase rule, protected fixture population above, malformed-seed failure, transactional write, and immediate fixed point through the maintained package entry. It does not prove arbitrary semantic equivalence, every Markdown construct, or current-repository duplicate closure; those remain tasks 2.1-3.1.
