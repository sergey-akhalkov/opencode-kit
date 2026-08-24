# Task 1.2 preflight

- Help lists `extend-existing-owner`.
- Provider-free preflight r2 exit 0; `cleanup=removed`; `modelCalls=0`; scenarios `local-owner,trivial-fix,extend-existing-owner`.
- Loader: `hasReuseDiscovery=true`, `hasReuseInventory=false`, `permissionExact=true`.
- r1 failed Proof Runner cleanup (`os.tmpdir()` EPERM). r2 used disposable roots under the evidence directory.
