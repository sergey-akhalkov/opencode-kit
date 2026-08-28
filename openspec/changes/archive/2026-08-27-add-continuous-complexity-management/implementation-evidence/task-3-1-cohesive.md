# Complexity Foraging Inventory

- Schema: 1
- Root: sha256:12a69baeda89c99e27dc675442edefb769a3e2ef8434ae47f053bd44e2c014c1
- Support: complete
- Unsupported fields: none
- Unknown fields: none

## Counts

| Class | Count |
| --- | ---: |
| files | 4 |
| directories | 2 |
| bytes | 385 |
| lines | 13 |
| maintained | 4 |
| generated | 0 |
| vendor | 0 |
| evidence | 0 |
| corpus | 0 |
| dependency | 0 |
| unknown | 0 |
| unsupported | 0 |
| unreadable | 0 |

## Reviewed Scope

| Mode | Path | Class | Reason |
| --- | --- | --- | --- |
| none | none | none | none |

## Candidates

| Kind | Path | Detector | Evidence |
| --- | --- | --- | --- |
| component | src | exact-name | src |
| entrypoint | src/index.ts | exact-name | index.ts |
| manifest | package.json | exact-name | package.json |
| proof | test/widget.test.ts | path-segment | test |
| public-surface | src/index.ts | manifest-field | exports |
| source | src/index.ts | extension | .ts |
| source | src/widget.ts | extension | .ts |
| test | test/widget.test.ts | exact-name | widget.test.ts |

## Largest Maintained Files

| Path | Bytes | Lines |
| --- | ---: | ---: |
| test/widget.test.ts | 141 | 3 |
| package.json | 114 | 6 |
| src/widget.ts | 84 | 3 |
| src/index.ts | 46 | 1 |

## Top-Level Concentration

| Path | Files | Bytes | Lines |
| --- | ---: | ---: | ---: |
| test | 1 | 141 | 3 |
| src | 2 | 130 | 4 |
| package.json | 1 | 114 | 6 |

## Diagnostics

| Stage | Path | Cause | Message |
| --- | --- | --- | --- |
| none | none | none | none |
