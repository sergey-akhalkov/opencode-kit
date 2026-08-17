# R5 Provider-Free Preflight Timeout

- Invocation: `node tools/proofs/openspec-outcome-continuation.ts --mode preflight`
  for candidate `outcome-continuation-candidate-r1`.
- Outer status: terminated after the 300000 ms shell timeout.
- Model/provider calls: none; capture mode was not entered.
- Evidence state at timeout: no `preflight.json` was written.
- Terminal liveness check: no process whose command line referenced this runner,
  evidence root, or `openspec-outcome-preflight-*` remained; no PTY remained.
- Classification: proof-runner preflight orchestration failure. Sequential
  duplicate CLI debug/models probes had independent 120-second limits and could
  exceed the outer bound before the server-specific gate and `finally`.
- Retry condition: replace the duplicate CLI probes with the direct loopback
  server command/agent/template inventory plus local OpenSpec readback, retain
  this failure, and use a create-new evidence root.

Live-Attempt Gate: blocked until the reduced provider-free preflight is green.
