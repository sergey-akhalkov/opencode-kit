#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

import {
  BEADS_RELEASE_MANIFEST_PATH,
  loadBeadsReleaseManifest,
  parseBeadsReleaseManifest,
  requireBeadsCapability,
  validateBeadsInitializationObservation,
  validateBeadsReleaseCandidate,
} from "./windows/beads-release.ts";
import type { BeadsInitializationObservation, BeadsReleaseCandidate } from "./windows/beads-release.ts";

const archiveSha256 = "1f00c29cd9599e182a4a4e829f5210daca2da14155920aee2836d8bc613b2feb";
const executableSha256 = "b1f3609fea1d9f0f19b2ed49098b3628acfa6ca115aa28b01a1ee178c3a214de";
const trackedIgnoreSha256 = "9788c26633ae340b1647c267f66c010ca0ded0b3bb039e887497ffeccccc6553";

function candidate(overrides: Partial<BeadsReleaseCandidate> = {}): BeadsReleaseCandidate {
  return {
    version: "1.2.2",
    buildCommit: "6c124203e771",
    platform: "windows",
    architecture: "amd64",
    archiveSha256,
    executableBytes: 145740800,
    executableSha256,
    requestedCapabilities: ["projectInitEmbedded", "featureCreateAtomicCorrelation", "ready"],
    capabilityScope: "production",
    ...overrides,
  };
}

function observation(overrides: Partial<BeadsInitializationObservation> = {}): BeadsInitializationObservation {
  return {
    flags: ["--json", "--non-interactive", "--prefix", "--sandbox", "--setup-exclude", "--skip-agents", "--skip-hooks"],
    ignoreSchemaSkew: false,
    trackedFileDigests: { ".gitignore": trackedIgnoreSha256 },
    createdPaths: [".beads"],
    modifiedPaths: [".git/config", ".git/info/exclude"],
    gitConfig: { "beads.role": "maintainer" },
    forbiddenEffects: [],
    ...overrides,
  };
}

test("loads the exact reviewed Beads release and closed capability matrix", () => {
  const manifest = loadBeadsReleaseManifest();
  assert.equal(manifest.release.version, "1.2.2");
  assert.equal(manifest.release.buildCommit, "6c124203e771");
  assert.equal(manifest.release.platform, "windows");
  assert.equal(manifest.release.architecture, "amd64");
  assert.equal(manifest.license, "MIT");
  assert.equal(manifest.release.archive.fileName, "beads_1.2.2_windows_amd64.zip");
  assert.equal(manifest.release.archive.url, "https://github.com/gastownhall/beads/releases/download/v1.2.2/beads_1.2.2_windows_amd64.zip");
  assert.equal(manifest.release.archive.sha256, archiveSha256);
  assert.equal(manifest.release.executable.fileName, "bd.exe");
  assert.equal(manifest.release.executable.bytes, 145740800);
  assert.equal(manifest.release.executable.sha256, executableSha256);
  assert.deepEqual(manifest.initialization.requiredTrackedFiles, [{ path: ".gitignore", sha256: trackedIgnoreSha256 }]);
  assert.deepEqual(manifest.initialization.allowedCreatedPaths, [".beads"]);
  assert.deepEqual(manifest.initialization.allowedModifiedPaths, [".git/config", ".git/info/exclude"]);
  assert.deepEqual(manifest.initialization.allowedGitConfig, [{ key: "beads.role", value: "maintainer" }]);
  assert.deepEqual(manifest.initialization.disallowedFlags, ["--ignore-schema-skew", "--stealth"]);
  assert.equal(manifest.initialization.metrics, "disabled");
  assert.equal(manifest.initialization.schemaSkew, "reject");
  assert.equal(manifest.capabilities.doctorEmbedded, "unsupported");
  assert.equal(manifest.capabilities.sqlEmbedded, "unsupported");
  assert.equal(manifest.capabilities.featureClaim, "spike-only");
  assert.equal(manifest.capabilities.featureUpdateExact, "supported");
});

test("accepts the exact release candidate and rejects identity drift", () => {
  const manifest = loadBeadsReleaseManifest();
  assert.equal(validateBeadsReleaseCandidate(manifest, candidate()), manifest);
  const driftCases: Array<[string, Partial<BeadsReleaseCandidate>]> = [
    ["version", { version: "1.2.1" }],
    ["build commit", { buildCommit: "000000000000" }],
    ["platform", { platform: "linux" }],
    ["architecture", { architecture: "arm64" }],
    ["archive", { archiveSha256: "0".repeat(64) }],
    ["executable bytes", { executableBytes: 1 }],
    ["executable", { executableSha256: "0".repeat(64) }],
  ];
  for (const [label, drift] of driftCases) {
    assert.throws(() => validateBeadsReleaseCandidate(manifest, candidate(drift)), undefined, `${label} drift must fail`);
  }
});

test("rejects unreviewed and unavailable capabilities while containing spike-only claim", () => {
  const manifest = loadBeadsReleaseManifest();
  assert.equal(requireBeadsCapability(manifest, "ready", "production"), "supported");
  assert.equal(requireBeadsCapability(manifest, "featureClaim", "spike"), "spike-only");
  assert.throws(() => requireBeadsCapability(manifest, "featureClaim", "production"), /limited to the disposable spike/u);
  assert.throws(() => requireBeadsCapability(manifest, "doctorEmbedded", "production"), /unavailable/u);
  assert.throws(() => requireBeadsCapability(manifest, "sqlEmbedded", "production"), /unavailable/u);
  assert.throws(() => requireBeadsCapability(manifest, "futureServer", "production"), /not in the reviewed matrix/u);
  assert.throws(
    () => validateBeadsReleaseCandidate(manifest, candidate({ requestedCapabilities: ["workLeases"] })),
    /unavailable/u,
  );
});

test("enforces the prepared ignore, exact flags, effect paths, and schema-skew refusal", () => {
  const manifest = loadBeadsReleaseManifest();
  assert.doesNotThrow(() => validateBeadsInitializationObservation(manifest, observation()));
  assert.throws(
    () => validateBeadsInitializationObservation(manifest, observation({ trackedFileDigests: { ".gitignore": "0".repeat(64) } })),
    /reviewed '.gitignore' digest/u,
  );
  assert.throws(
    () => validateBeadsInitializationObservation(manifest, observation({ flags: observation().flags.filter((flag) => flag !== "--skip-hooks") })),
    /missing required flag '--skip-hooks'/u,
  );
  assert.throws(
    () => validateBeadsInitializationObservation(manifest, observation({ flags: [...observation().flags, "--stealth"] })),
    /not reviewed|forbidden/u,
  );
  assert.throws(
    () => validateBeadsInitializationObservation(manifest, observation({ ignoreSchemaSkew: true })),
    /schema skew must remain fail-closed/u,
  );
  assert.throws(
    () => validateBeadsInitializationObservation(manifest, observation({ createdPaths: [".beads", "AGENTS.md"] })),
    /created unreviewed path 'AGENTS.md'/u,
  );
  assert.throws(
    () => validateBeadsInitializationObservation(manifest, observation({ modifiedPaths: [".git/config", ".git/hooks/pre-commit"] })),
    /modified unreviewed path '.git\/hooks\/pre-commit'/u,
  );
  assert.throws(
    () => validateBeadsInitializationObservation(manifest, observation({ gitConfig: { "beads.role": "maintainer", "remote.origin.url": "https://example.invalid" } })),
    /unreviewed Git config 'remote.origin.url'/u,
  );
  assert.throws(
    () => validateBeadsInitializationObservation(manifest, observation({ forbiddenEffects: ["git-hook"] })),
    /forbidden effects: git-hook/u,
  );
});

test("rejects malformed or broadened manifest shape", () => {
  const raw = JSON.parse(fs.readFileSync(BEADS_RELEASE_MANIFEST_PATH, "utf8")) as Record<string, unknown>;
  assert.throws(() => parseBeadsReleaseManifest({ ...raw, extra: true }), /must contain exactly/u);
  assert.throws(() => parseBeadsReleaseManifest({ ...raw, schemaVersion: 2 }), /schemaVersion must be 1/u);
  const capabilities = { ...(raw.capabilities as Record<string, unknown>), futureServer: "supported" };
  assert.throws(() => parseBeadsReleaseManifest({ ...raw, capabilities }), /capabilities must contain exactly/u);
  const initialization = { ...(raw.initialization as Record<string, unknown>), allowedCreatedPaths: ["../escape"] };
  assert.throws(() => parseBeadsReleaseManifest({ ...raw, initialization }), /without parent traversal/u);
});

test("rejects unsafe manifest paths and preserves the JSON parse cause", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "beads-release-test-"));
  try {
    assert.throws(() => loadBeadsReleaseManifest(root), /must be a regular file/u);
    const malformed = path.join(root, "malformed.json");
    fs.writeFileSync(malformed, "{ not json\n", "utf8");
    let thrown: unknown;
    try {
      loadBeadsReleaseManifest(malformed);
    } catch (error) {
      thrown = error;
    }
    assert.ok(thrown instanceof Error);
    assert.match(thrown.message, /Failed to load Beads release manifest/u);
    assert.ok(thrown.cause instanceof SyntaxError, "manifest load must preserve the JSON parse error as cause");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
