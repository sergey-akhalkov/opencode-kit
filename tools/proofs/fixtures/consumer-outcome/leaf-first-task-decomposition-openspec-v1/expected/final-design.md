## Accepted Outcome

- Outcome: deliver the schema and transport through one integrated client.
- Oracle: distinct client integration after both required leaves pass.
- Preserved evidence: `evidence-transport` remains current.

## Leaf Dependencies

- `leaf-schema-prerequisite` independently materializes the schema input.
- `leaf-schema` depends on `leaf-schema-prerequisite`.
- `parent-client` depends on `leaf-schema` and `leaf-transport`.
- The newly observed prerequisite blocks only `leaf-schema` and `parent-client`; the passing transport observation remains current.

## Same-Leaf Control

- The local work-file defect remains inside its existing owner and oracle without task or history churn.
