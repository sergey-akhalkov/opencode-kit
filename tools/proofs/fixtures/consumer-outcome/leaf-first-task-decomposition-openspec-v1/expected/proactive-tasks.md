## 1. Deliver The Client

- [ ] 1.1 [leaf-schema] Implement the schema boundary. **Dependencies:** none. **Observable Proof:** `result/schema.json` reports the schema oracle passed.
- [ ] 1.2 [leaf-transport] Implement the transport boundary. **Dependencies:** none. **Observable Proof:** existing `evidence-transport` remains current.
- [ ] 1.3 [parent-client] Integrate the client. **Dependencies:** 1.1 and 1.2. **Observable Proof:** run the distinct client integration oracle after both leaves pass.
