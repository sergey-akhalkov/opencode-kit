# PMAC Read-Only Inventory Evidence

- Candidate: `continuous-complexity-management-pmac-diagnostic-r1`
- External source identity: Git `bd34403cb9f32385bbbdf68649296ab177f1ad34`
- Root identity: `sha256:79847b83706e0ac8772b90d3b85c8cd5ef9db422d4227a521622c102206c0c56`
- Helper identity: `sha1:63975335c8cafff87fe414131a8423eac852a626`
- Contract identity: `sha1:d94f0b90a67fa51dcefc732e526db033645ada53`
- Reviewed scope identity: `sha1:6148deb57895785de469cbde532b576ccfdc55d7`
- Active source: `OPENCODE_CONFIG_DIR` contained the exact helper and contract.
- Invocation: `node <active-global>/bin/complexity-foraging-inventory.ts --root <pmac-emulator> --scope <change-evidence>/task-4-2-pmac-scope.json --format json --max-files 500000 --max-bytes 536870912 --timeout-ms 120000`
- Exit status: `0`
- Stderr: empty
- Stdout raw artifact: session tool output `tool_043529c6f001dbhLkWCbt8fqnF`; durable evidence below is redacted and contains no absolute path or source payload.
- Support: `complete`; unsupported fields: none; unknown fields: none; unreadable paths: `0`.

## Counts

| Class | Files |
| --- | ---: |
| Total | 146414 |
| Maintained | 501 |
| Generated | 19856 |
| Evidence | 98939 |
| Corpus | 23435 |
| Dependency | 3683 |
| Unknown | 0 |
| Unsupported filesystem entries | 13 |

Observed total bytes: `10900388405`; maintained text lines: `315925`; directories: `13685`.

## Maintained Concentration

| Root | Files | Bytes | Lines |
| --- | ---: | ---: | ---: |
| `crates` | 329 | 9541816 | 254276 |
| `tools` | 148 | 4052160 | 57369 |
| `docs` | 12 | 804205 | 3935 |
| `pmac` | 1 | 118563 | 0 |

Largest maintained text owners include:

- `tools/proofs/README.md`: 5798 lines.
- `crates/pmac-qualification-stand/src/candidate_send.rs`: 6172 lines.
- `crates/pmac-qualification-stand/src/restoration_live.rs`: 5083 lines.
- `crates/pmac-qualification-stand/src/main.rs`: 4120 lines.
- `crates/pmac-qualification-core/tests/candidate_send_critical.rs`: 5763 lines.
- `crates/pmac-qualification-core/src/phase1_hmi_disconnected.rs`: 4528 lines.
- `crates/pmac-qualification-core/src/stand_restoration.rs`: 4692 lines.
- `crates/mnc-language/src/program.rs`: 5162 lines.
- `crates/mnc-execution-core/src/driver.rs`: 3854 lines.

## Reviewed Scope

Maintained hot-path roots are `crates`, `tools`, selected project/navigation docs, workspace/toolchain manifests, `profiles`, and `pmac`. The scope classifies `saturn`, `data`, and generated manual/reference trees as corpus; OpenSpec and proof records as evidence; `target` and local code-intelligence/repository metadata as generated; development runtime/editor configuration as dependency. Every exclusion retains `EXCLUSION_NOT_ABSENCE`; counts remain visible and no exclusion proves irrelevance.

## Exact Ceiling

This record supports stable privacy-safe foraging facts for one read-only checkout and the reviewed scope only. It does not infer architecture quality, authorize a refactor, prove another repository, or complete any generic population member.
