# Suggested Commands

- Install dependencies: `npm install`.
- Focused repository validator tests: `npm run test:focused:library`.
- Other focused suites: `npm run test:focused:contracts`, `npm run test:focused:validation`, `npm run test:focused:install`, `npm run test:focused:openspec-gate`.
- Full tests: `npm test`.
- Library validation: `npm run validate`; strict warnings gate: `npm run validate:strict`.
- OpenSpec validation: `npm run openspec:validate`; operation gate: `npm run openspec:gate`.
- Full pre-push gate: `npm run prepush:validate`.
- Inspect active OpenCode source layers: `npm run opencode:sources`.
- Preview/check model profile: `npm run opencode:profile -- quality-independent --check` and `npm run opencode:profile -- quality-independent --explain`.
