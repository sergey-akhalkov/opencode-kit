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
      assert(seed.practices.length === PRACTICE_OWNER_COUNT, "seed must contain 16 practices");
      assert(seedDigest(seed) === seedDigest(loadPracticeOwnerSeed(root)), "readback digest must be stable");
      const ctx = createContext();
      validatePracticeOwners(ctx, root);
      assert(ctx.errors.length === 0, ctx.errors.join("\n"));
    },
  },
  {
    name: "practice-owners: foundation owner and recovery pair stay exact",
    run: () => {
      const seed = loadPracticeOwnerSeed(libraryRoot);
      const practice = seed.practices.find((row) => row.id === "foundation-integrity");
      assert(practice != null, "foundation-integrity practice must exist");
      assert(practice.owner === "foundation-integrity-reviewer", "foundation-integrity must retain its exact owner");
      assert(
        JSON.stringify(practice.profiles) === JSON.stringify(["core", "all"]),
        "foundation-integrity must remain selected by core and all",
      );
      assert(
        practice.maintenanceSurfaces.includes("global/skills/foundation-integrity-recovery/SKILL.md"),
        "foundation-integrity must retain its paired recovery skill",
      );
      const owner = fs.readFileSync(path.join(libraryRoot, "global", "agents", "foundation-integrity-reviewer.md"), "utf8");
      const skill = fs.readFileSync(
        path.join(libraryRoot, "global", "skills", "foundation-integrity-recovery", "SKILL.md"),
        "utf8",
      );
      for (const marker of ["Foundation Relation Matrix", "Ordinary Small exact-case work", "Do not return an acceptance/rejection verdict"]) {
        assert(owner.includes(marker), `foundation owner missing marker: ${marker}`);
      }
      for (const marker of ["only after active primary main independently reproduces", "dependent-rebind", "re-reviewed -> closed"]) {
        assert(skill.includes(marker), `foundation recovery missing marker: ${marker}`);
      }
    },
  },
  {
    name: "practice-owners: bounded falsification extends only outcome readiness",
    run: () => {
      const seed = loadPracticeOwnerSeed(libraryRoot);
      const practice = seed.practices.find((row) => row.id === "outcome-readiness");
      assert(practice != null, "outcome-readiness practice must exist");
      assert(practice.owner === "implementation-readiness-reviewer", "bounded falsification must reuse the readiness owner");
      assert(JSON.stringify(practice.profiles) === JSON.stringify(["core", "all"]), "outcome-readiness profiles must remain core and all");
      assert(practice.exclusions.includes("foundation-integrity"), "outcome-readiness must remain distinct from foundation-integrity");

      const principles = fs.readFileSync(path.join(libraryRoot, "global", "principles-of-work.md"), "utf8");
      const routing = fs.readFileSync(path.join(libraryRoot, "global", "AGENTS.md"), "utf8");
      const owner = fs.readFileSync(path.join(libraryRoot, "global", "agents", "implementation-readiness-reviewer.md"), "utf8");
      const finalReviewer = fs.readFileSync(path.join(libraryRoot, "global", "agents", "final-candidate-reviewer.md"), "utf8");
      const core = JSON.parse(fs.readFileSync(path.join(libraryRoot, "profiles", "core.json"), "utf8")) as { agents: string[] };
      const all = JSON.parse(fs.readFileSync(path.join(libraryRoot, "profiles", "all.json"), "utf8")) as { agents: string[] };
      for (const marker of ["Falsification Before Confidence", "no-material-finding", "at most one re-review"]) {
        assert(principles.includes(marker), `working philosophy missing bounded marker: ${marker}`);
      }
      for (const marker of ["newly authored decision-material", "Material inline decision frame", "one initial challenge", "final-candidate-reviewer` stays optional"]) {
        assert(routing.includes(marker), `main routing missing bounded marker: ${marker}`);
      }
      for (const marker of ["original accepted request", "coherent-wrong-outcome", "unnecessary-scope", "Practice Observation", "Falsification Matrix", "Do not decide the product result"]) {
        assert(owner.includes(marker), `readiness owner missing bounded marker: ${marker}`);
      }
      assert(finalReviewer.includes("optional fresh read-only final-candidate"), "final-candidate-reviewer must remain optional");
      assert(!core.agents.includes("final-candidate-reviewer") && all.agents.includes("final-candidate-reviewer"), "profiles must retain optional final-review separation");
      assert(core.agents.filter((agent) => agent === "implementation-readiness-reviewer").length === 1, "core must contain exactly one readiness owner");
      assert(all.agents.filter((agent) => agent === "implementation-readiness-reviewer").length === 1, "all must contain exactly one readiness owner");
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
