## 1. Deliver The Client

- [ ] 1.1.1 [leaf-schema-prerequisite] Materialize the independently testable schema input. **Dependencies:** none. **Observable Proof:** `result/schema-prerequisite.json` reports passed.
- [ ] 1.1 [leaf-schema] Implement the schema boundary. **Dependencies:** 1.1.1. **Observable Proof:** `result/schema.json` reports the schema oracle passed.
- [ ] 1.2 [leaf-transport] Implement the transport boundary. **Dependencies:** none. **Observable Proof:** existing `evidence-transport` remains current and is not rerun.
- [ ] 1.3 [parent-client] Integrate the client. **Dependencies:** 1.1 and 1.2. **Observable Proof:** run the distinct client integration oracle after every required leaf passes.
