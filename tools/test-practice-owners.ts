#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import {
  PRACTICE_OWNER_COUNT,
  loadPracticeOwnerSeed,
  parsePracticeOwnerSeed,
  renderPracticeOwnerView,
  seedDigest,
} from "./practice-owners.ts";
import { validatePracticeOwners } from "./validators/practice-owners.ts";
import { createContext } from "./validators/context.ts";
import { assert, libraryRoot, runTests, type TestCase } from "./test-helpers/library.ts";

const tests: TestCase[] = [
  {
    name: "practice-owners: current seed is closed and stable",
    run: () => {
      const root = libraryRoot;
      const seed = loadPracticeOwnerSeed(root);
      assert(seed.practices.length === PRACTICE_OWNER_COUNT, "seed must contain 15 practices");
      assert(seedDigest(seed) === seedDigest(loadPracticeOwnerSeed(root)), "readback digest must be stable");
      const ctx = createContext();
      validatePracticeOwners(ctx, root);
      assert(ctx.errors.length === 0, ctx.errors.join("\n"));
    },
  },
  {
    name: "practice-owners: rejects duplicate owners and unsafe paths",
    run: () => {
      const seed = loadPracticeOwnerSeed(libraryRoot);
      const duplicate = structuredClone(seed);
      duplicate.practices[1].owner = duplicate.practices[0].owner;
      let duplicateRejected = false;
      try {
        parsePracticeOwnerSeed(duplicate);
      } catch {
        duplicateRejected = true;
      }
      assert(duplicateRejected, "duplicate owners must fail");
      const unsafe = structuredClone(seed);
      unsafe.practices[0].anchors[0].path = "../secret";
      let unsafeRejected = false;
      try {
        parsePracticeOwnerSeed(unsafe);
      } catch {
        unsafeRejected = true;
      }
      assert(unsafeRejected, "unsafe anchor paths must fail");
    },
  },
  {
    name: "practice-owners: each owner file names its Practice ID",
    run: () => {
      const seed = loadPracticeOwnerSeed(libraryRoot);
      for (const practice of seed.practices) {
        const text = fs.readFileSync(path.join(libraryRoot, "global", "agents", `${practice.owner}.md`), "utf8");
        assert(text.includes(`Practice ID: \`${practice.id}\``), `${practice.owner} must name ${practice.id}`);
      }
    },
  },
  {
    name: "practice-owners: owners stay read-only and name maintenance surfaces",
    run: () => {
      const seed = loadPracticeOwnerSeed(libraryRoot);
      for (const practice of seed.practices) {
        const relative = `global/agents/${practice.owner}.md`;
        const text = fs.readFileSync(path.join(libraryRoot, relative), "utf8");
        assert(!/^permission:\s*$/m.test(text) || !/^  edit:\s*allow$/m.test(text), `${practice.owner} must not have blanket edit allow`);
        assert(practice.maintenanceSurfaces.includes(relative), `${practice.id} must list ${relative}`);
      }
    },
  },
  {
    name: "practice-owners: generated view matches seed",
    run: () => {
      const seed = loadPracticeOwnerSeed(libraryRoot);
      const view = fs.readFileSync(path.join(libraryRoot, "config", "practice-owners.view.md"), "utf8");
      assert(view === renderPracticeOwnerView(seed), "view must match seed materialization");
    },
  },
];

await runTests(tests);
