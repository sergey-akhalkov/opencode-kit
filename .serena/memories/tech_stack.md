# Tech Stack

- Node.js >=24; native TypeScript entrypoints execute directly with `node`.
- ESM package (`"type": "module"`); npm with committed `package-lock.json`.
- Key libraries: `js-yaml`, `jsonc-parser`, `zod`.
- Tests use Node's built-in test runner plus repository test helpers; no repository `tsconfig.json`, ESLint, Prettier, or alternate formatter config was found during onboarding.
- Model-facing artifacts are Markdown; OpenCode configuration is JSON/JSONC; OpenSpec supplies requirements/change artifacts.