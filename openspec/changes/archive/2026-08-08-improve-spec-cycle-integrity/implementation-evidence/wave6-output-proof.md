# Wave 6 Test Output Proof

Date: 2026-08-08

## Candidate

- Runner: `tools/run-focused-test.ts`
- Integration: every `test:focused:*` package script delegates to the runner.
- Boundary: package-manager invocation of an actual focused test script.

## Green Path

Command:

```text
rtk npm run test:focused:contracts
```

Observed command output after the package-manager preamble:

```text
OK: contracts tests=55
```

Exit status: `0`.

## Red Path

Command:

```text
rtk npm run test:focused:openspec-gate
```

The command printed all five passing case lines, all three failing assertion messages, the thrown error, and the Node stack trace. Exit status was non-zero.

## Result

Successful focused commands collapse child output to one command-level summary. Failed focused commands preserve the child stdout and stderr without truncation or suppression.

After the fresh test-only SDET update, the formerly red operation-gate command exited zero with the single summary `OK: OpenSpec operation gate tests=9`. The pre-push and installer focused commands likewise emitted one summary each while retaining their direct failure behavior inside the child suites.

## Serial Versus Concurrent Full Suite

Both lanes ran on the same unchanged candidate and Windows/Node environment:

```text
npm test                -> exit 1, 120682 ms
npm run test:concurrent -> exit 1,  57281 ms
```

Both reached the same stale doctor exact-string oracle. The serial default's diagnostic fallback printed the precise expected and actual messages. The concurrent dot-reporter lane printed only `tools/test-library.ts: test failed`, losing the actionable failure context. Because the comparison was red and concurrent execution lost diagnostics, the candidate discarded `test:concurrent`; serial remains the only full-suite default. No speedup claim is retained from these failed runs.
