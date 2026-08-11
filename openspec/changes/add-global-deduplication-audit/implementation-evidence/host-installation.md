# Host Installation

- Requested package: upstream npm `jscpd@5.0.14` from `https://github.com/kucherenko/jscpd`.
- Installation method: `npm install --global jscpd@5.0.14`.
- Installation result: exit `0`, two global packages added.
- Version invocation: `jscpd --version`.
- Version output: `cpd 5.0.14` (the upstream v5 package exposes the Rust `cpd` binary through the `jscpd` command).
- Global package inventory: `npm list --global jscpd --depth=0 --json` reports `jscpd` version `5.0.14`.
- Resolved Windows command shim: `%APPDATA%\npm\jscpd.ps1`.
- Repository impact: no `jscpd` entry was added to repository `package.json` or a repository lockfile.
- Upstream skills: neither `jscpd` nor `dry-refactoring` was installed; the requested kit-owned `deduplication-audit` skill is the only planned instruction integration.
