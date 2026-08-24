import fs from "node:fs";
import path from "node:path";
import {
  assert,
  assertFailure,
  assertOutputContains,
  assertSuccess,
  invokeInstructionBudget,
  invokeValidator,
  libraryRoot,
  lines,
  newLibraryFixture,
  newTempDir,
  type TestCase,
  writeText,
} from "../test-helpers/library.ts";
import { evaluateLoaderSkills } from "../proofs/runtime-surface-loader.ts";
import { descriptionSelectsOpenSpecSkill } from "../validators/skills.ts";
import {
  CORE_AGENTS,
  CORE_COMMANDS,
  CORE_FILES,
  CORE_SKILLS,
  inspectRuntimeSurfaceProfiles,
  listCommandNames,
  loadRuntimeSurfaceProfile,
  materializeRuntimeSurfaceProfile,
  parseRuntimeSurfaceProfile,
  readRenderedPermission,
  writeRuntimeSurfaceConfig,
  readbackRuntimeSurfaceTree,
  resolveRuntimeSurfaceProfile,
  serializeRuntimeSurfaceProfile,
  type RuntimeSurfaceProfile,
} from "../runtime-surface-profile.ts";

function committedProfile(name: "all" | "core"): RuntimeSurfaceProfile {
  const loaded = loadRuntimeSurfaceProfile(libraryRoot, name);
  assert(loaded.profile != null, `Committed profiles/${name}.json must parse.`);
  assert(loaded.errors.length === 0, `Committed profiles/${name}.json errors: ${loaded.errors.join("; ")}`);
  return loaded.profile;
}

function mutateCommitted(name: "all" | "core", mutate: (profile: RuntimeSurfaceProfile) => RuntimeSurfaceProfile): {
  file: string;
  profile: RuntimeSurfaceProfile;
  root: string;
} {
  const root = newTempDir(`runtime-surface-${name}`);
  copyMinimalKit(root);
  const profile = mutate(structuredClone(committedProfile(name)));
  const file = path.join(root, "profiles", `${name}.json`);
  writeText(file, serializeRuntimeSurfaceProfile(profile));
  return { file, profile, root };
}

function copyMinimalKit(root: string): void {
  const names = ["all.json", "core.json"];
  for (const name of names) {
    const source = path.join(libraryRoot, "profiles", name);
    writeText(path.join(root, "profiles", name), fs.readFileSync(source, "utf8"));
  }
  for (const relative of [
    ...CORE_FILES,
    ...CORE_SKILLS.map((name) => `global/skills/${name}/SKILL.md`),
    ...CORE_AGENTS.map((name) => `global/agents/${name}.md`),
    ...CORE_COMMANDS.map((name) => `global/commands/${name}.md`),
  ]) {
    const source = path.join(libraryRoot, ...relative.split("/"));
    writeText(path.join(root, ...relative.split("/")), fs.readFileSync(source, "utf8"));
  }
}

export const runtimeSurfaceProfileTests: TestCase[] = [
  {
    name: "OpenSpec descriptions stay quiet on generic requests and match exact domain requests",
    run: () => {
      const apply = fs.readFileSync(path.join(libraryRoot, "global", "skills", "openspec-apply-change", "SKILL.md"), "utf8");
      const propose = fs.readFileSync(path.join(libraryRoot, "global", "skills", "openspec-propose", "SKILL.md"), "utf8");
      const applyDescription = apply.match(/^description:\s*(.+)$/m)?.[1] ?? "";
      const proposeDescription = propose.match(/^description:\s*(.+)$/m)?.[1] ?? "";
      assert(applyDescription.includes("OpenSpec"), "Apply description must name OpenSpec.");
      assert(
        !descriptionSelectsOpenSpecSkill(applyDescription, "implement the login form"),
        "Generic implementation must not select OpenSpec apply.",
      );
      assert(
        !descriptionSelectsOpenSpecSkill(proposeDescription, "propose a new feature"),
        "Generic propose must not select OpenSpec propose.",
      );
      assert(
        descriptionSelectsOpenSpecSkill(applyDescription, "implement the OpenSpec change"),
        "Exact OpenSpec apply request must still match.",
      );
      assert(
        descriptionSelectsOpenSpecSkill(proposeDescription, "propose an OpenSpec change"),
        "Exact OpenSpec propose request must still match.",
      );
      const fixture = newLibraryFixture("generic-openspec-description");
      writeText(path.join(fixture, "global", "skills", "openspec-apply-change", "SKILL.md"), lines([
        "---",
        "name: openspec-apply-change",
        "description: Implement tasks from a change. Use when the user wants to implement code.",
        "license: MIT",
        "---",
        "",
        "# OpenSpec Apply",
        "",
        "Use this skill when applying OpenSpec tasks.",
        "",
        "## Output",
        "",
        "Return apply notes.",
        "",
      ]));
      const profilePath = path.join(fixture, "profiles", "all.json");
      const profile = JSON.parse(fs.readFileSync(profilePath, "utf8")) as { skills: string[] };
      profile.skills.push("openspec-apply-change");
      profile.skills.sort((left, right) => left.localeCompare(right));
      writeText(profilePath, `${JSON.stringify(profile, null, 2)}\n`);
      const result = invokeValidator(fixture);
      assertFailure(result, "Generic OpenSpec frontmatter must fail the discovery contract.");
      assertOutputContains(result, "frontmatter description must include 'OpenSpec'", "Discovery contract must blame the frontmatter description.");
    },
  },
  {
    name: "committed core and all profiles match the named catalogs",
    run: () => {
      const core = committedProfile("core");
      const all = committedProfile("all");
      assert(core.configMode === "ask", "Core configMode must be ask.");
      assert(all.configMode === "all-compatibility", "All configMode must be all-compatibility.");
      assert(JSON.stringify(core.skills) === JSON.stringify([...CORE_SKILLS]), "Core skills must match the design catalog.");
      assert(JSON.stringify(core.agents) === JSON.stringify([...CORE_AGENTS]), "Core agents must match the design catalog.");
      assert(JSON.stringify(core.commands) === JSON.stringify([...CORE_COMMANDS]), "Core commands must match the design catalog.");
      assert(JSON.stringify(core.files) === JSON.stringify([...CORE_FILES]), "Core files must match the design catalog.");
      const resolvedCore = resolveRuntimeSurfaceProfile(
        libraryRoot,
        core,
        path.join(libraryRoot, "profiles", "core.json"),
      );
      const resolvedAll = resolveRuntimeSurfaceProfile(
        libraryRoot,
        all,
        path.join(libraryRoot, "profiles", "all.json"),
      );
      assert(resolvedCore.errors.length === 0, `Core resolve errors: ${resolvedCore.errors.join("; ")}`);
      assert(resolvedAll.errors.length === 0, `All resolve errors: ${resolvedAll.errors.join("; ")}`);
      const inspection = inspectRuntimeSurfaceProfiles(
        libraryRoot,
        all.skills,
        all.agents,
        listCommandNames(libraryRoot),
      );
      assert(inspection.errors.length === 0, `Committed profile inspection errors: ${inspection.errors.join("; ")}`);
    },
  },
  {
    name: "runtime surface profile rejects a missing source file",
    run: () => {
      const { file, profile, root } = mutateCommitted("core", (current) => ({
        ...current,
        files: [...current.files, "global/missing-authority.md"].sort((left, right) => left.localeCompare(right)),
      }));
      const resolved = resolveRuntimeSurfaceProfile(root, profile, file);
      assert(resolved.errors.some((error) => error.includes("Profile source is missing: global/missing-authority.md")), `Missing-file errors: ${resolved.errors.join("; ")}`);
    },
  },
  {
    name: "runtime surface profile rejects an escaping source path",
    run: () => {
      const parsed = parseRuntimeSurfaceProfile(
        {
          ...committedProfile("core"),
          files: ["../secret.md"],
        },
        "profiles/core.json",
        "core",
      );
      assert(parsed.profile != null, "Escaping path must still parse schema before resolve.");
      const resolved = resolveRuntimeSurfaceProfile(libraryRoot, parsed.profile, "profiles/core.json");
      assert(
        resolved.errors.some((error) => error.includes("Profile path escapes the repository: ../secret.md")),
        `Escape-path errors: ${resolved.errors.join("; ")}`,
      );
    },
  },
  {
    name: "runtime surface profile rejects a duplicate owner",
    run: () => {
      const { file, profile, root } = mutateCommitted("core", (current) => ({
        ...current,
        directories: ["global/skills/complain"],
      }));
      const resolved = resolveRuntimeSurfaceProfile(root, profile, file);
      assert(
        resolved.errors.some((error) => error.includes("Profile has duplicate owner 'skill:complain'")),
        `Duplicate-owner errors: ${resolved.errors.join("; ")}`,
      );
    },
  },
  {
    name: "runtime surface profile rejects conflicting owners",
    run: () => {
      const { file, profile, root } = mutateCommitted("core", (current) => ({
        ...current,
        files: [...current.files, "global/skills/complain/SKILL.md"].sort((left, right) => left.localeCompare(right)),
      }));
      const resolved = resolveRuntimeSurfaceProfile(root, profile, file);
      assert(
        resolved.errors.some((error) => error.includes("conflicting owners for 'skill:complain'")),
        `Conflicting-owner errors: ${resolved.errors.join("; ")}`,
      );
    },
  },
  {
    name: "runtime surface profile rejects unstable ordering",
    run: () => {
      const parsed = parseRuntimeSurfaceProfile(
        {
          ...committedProfile("core"),
          skills: ["reuse-discovery", "complain", "change-ready-sdlc"],
        },
        "profiles/core.json",
        "core",
      );
      assert(parsed.profile != null, "Unstable order must still parse schema before resolve.");
      const resolved = resolveRuntimeSurfaceProfile(libraryRoot, parsed.profile, "profiles/core.json");
      assert(
        resolved.errors.some((error) => error.includes("Profile field 'skills' must be stably ordered")),
        `Unstable-order errors: ${resolved.errors.join("; ")}`,
      );
    },
  },
  {
    name: "library fixture still accepts the generated core and all profiles",
    run: () => {
      const fixture = newLibraryFixture("runtime-surface-fixture-baseline");
      assertSuccess(invokeValidator(fixture), "A fixture with generated core and all profiles must validate.");
    },
  },
  {
    name: "materialize core and all trees byte-match their manifests",
    run: () => {
      for (const profileName of ["core", "all"] as const) {
        const targetRoot = path.join(newTempDir(`materialize-${profileName}`), profileName);
        const result = materializeRuntimeSurfaceProfile({
          profileName,
          root: libraryRoot,
          targetRoot,
        });
        assert(result.manifest.profile === profileName, `${profileName} effective manifest must name the profile.`);
        const loaded = loadRuntimeSurfaceProfile(libraryRoot, profileName);
        assert(loaded.profile != null, `${profileName} must load.`);
        const resolved = resolveRuntimeSurfaceProfile(
          libraryRoot,
          loaded.profile,
          path.join(libraryRoot, "profiles", `${profileName}.json`),
        );
        const readback = readbackRuntimeSurfaceTree(libraryRoot, targetRoot, resolved.entries);
        assert(readback.length === 0, `${profileName} generated tree mismatches: ${readback.join("; ")}`);
      }
    },
  },
  {
    name: "fresh core config is ask and autonomy allow stays in generated config",
    run: () => {
      const machineConfig = path.join(libraryRoot, "global", "opencode.json");
      const before = fs.existsSync(machineConfig) ? fs.readFileSync(machineConfig) : null;
      const targetRoot = path.join(newTempDir("core-ask-config"), "core");
      materializeRuntimeSurfaceProfile({
        profileName: "core",
        root: libraryRoot,
        targetRoot,
      });
      assert(readRenderedPermission(path.join(targetRoot, "opencode.json")) === "ask", "Fresh core permission must be ask.");
      const autonomyRoot = path.join(newTempDir("machine-autonomy"), "generated");
      const autonomyFile = writeRuntimeSurfaceConfig(autonomyRoot, "machine-autonomy");
      assert(readRenderedPermission(autonomyFile) === "allow", "Autonomy permission must be allow.");
      assert(autonomyFile.includes("generated"), "Autonomy config must be written only to a generated root.");
      const after = fs.existsSync(machineConfig) ? fs.readFileSync(machineConfig) : null;
      assert(
        (before == null && after == null) || (before != null && after != null && before.equals(after)),
        "Existing machine config must remain byte-for-byte unchanged.",
      );
    },
  },
  {
    name: "successful rematerialize can roll back from the backup root",
    run: () => {
      const targetRoot = path.join(newTempDir("materialize-rollback"), "surface");
      const first = materializeRuntimeSurfaceProfile({
        profileName: "core",
        root: libraryRoot,
        targetRoot,
      });
      const marker = fs.readFileSync(path.join(targetRoot, "AGENTS.md"));
      const second = materializeRuntimeSurfaceProfile({
        profileName: "all",
        root: libraryRoot,
        targetRoot,
      });
      assert(second.backupRoot != null, "Second materialize must keep a backup.");
      assert(fs.existsSync(second.backupRoot!), "Backup root must exist.");
      fs.rmSync(targetRoot, { recursive: true, force: true });
      fs.renameSync(second.backupRoot!, targetRoot);
      assert(fs.readFileSync(path.join(targetRoot, "AGENTS.md")).equals(marker), "Rollback must restore the prior generated bytes.");
      assert(first.targetRoot === targetRoot, "Rollback must reuse the same generated root.");
    },
  },
  {
    name: "injected materialization failure preserves the prior generated root",
    run: () => {
      const targetRoot = path.join(newTempDir("materialize-preserve"), "core");
      fs.mkdirSync(targetRoot, { recursive: true });
      const marker = path.join(targetRoot, "prior-marker.txt");
      fs.writeFileSync(marker, "prior-root-bytes");
      const prior = fs.readFileSync(marker);
      for (const injectFailure of ["after-stage", "after-backup"] as const) {
        fs.writeFileSync(marker, prior);
        let failed = false;
        try {
          materializeRuntimeSurfaceProfile({
            injectFailure,
            profileName: "core",
            root: libraryRoot,
            targetRoot,
          });
        } catch (error) {
          failed = true;
          assert(String(error).includes("Injected materialization failure"), `Unexpected failure: ${String(error)}`);
        }
        assert(failed, `${injectFailure} must throw.`);
        assert(fs.existsSync(marker), `${injectFailure} must keep the prior marker.`);
        assert(fs.readFileSync(marker).equals(prior), `${injectFailure} must preserve prior bytes.`);
        const parent = path.dirname(targetRoot);
        const staging = fs.readdirSync(parent).filter((name) => name.startsWith("core.staging-"));
        assert(staging.length === 0, `${injectFailure} must remove the staging root.`);
      }
    },
  },
  {
    name: "core instruction budget fails closed for over-budget missing-source and collision fixtures",
    run: () => {
      const seed = (kit: string): string => {
        const file = path.join(kit, "config", "instruction-budget.json");
        writeText(file, `${JSON.stringify({
          limits: {
            discoveryMetadataTokenProxy: 100000,
            globalStartupTokenProxy: 100000,
            onDemandBodiesTokenProxy: 100000,
          },
          schemaVersion: 2,
        }, null, 2)}\n`);
        return file;
      };
      const writeCore = (kit: string, profile: RuntimeSurfaceProfile): void => {
        writeText(path.join(kit, "profiles", "core.json"), serializeRuntimeSurfaceProfile(profile));
      };
      const baseProfile = (): RuntimeSurfaceProfile => ({
        agents: [],
        commands: [],
        configMode: "ask",
        description: "Budget fixture core.",
        directories: [],
        files: ["global/AGENTS.md", "global/principles-of-work.md"],
        name: "core",
        schemaVersion: 1,
        skills: ["complain"],
      });

      const over = newTempDir("core-budget-over");
      writeText(path.join(over, "global", "AGENTS.md"), "a".repeat(48_004));
      writeText(path.join(over, "global", "principles-of-work.md"), "b");
      writeText(path.join(over, "global", "skills", "complain", "SKILL.md"), "---\ndescription: Demo.\n---\n\nBody.\n");
      writeCore(over, baseProfile());
      const overResult = invokeInstructionBudget(["--root", over, "--seed", seed(over), "--format", "json"]);
      assertFailure(overResult, "Core over-budget fixture must fail.");
      assertOutputContains(overResult, "coreStartupTokenProxy", "Over-budget report must name the core startup ceiling.");

      const missing = newTempDir("core-budget-missing");
      writeText(path.join(missing, "global", "AGENTS.md"), "ok");
      writeText(path.join(missing, "global", "principles-of-work.md"), "ok");
      writeText(path.join(missing, "global", "skills", "complain", "SKILL.md"), "---\ndescription: Demo.\n---\n\nBody.\n");
      writeCore(missing, {
        ...baseProfile(),
        files: ["global/AGENTS.md", "global/missing-authority.md", "global/principles-of-work.md"],
      });
      const missingResult = invokeInstructionBudget(["--root", missing, "--seed", seed(missing), "--format", "json"]);
      assertFailure(missingResult, "Missing core source must fail closed.");
      assertOutputContains(missingResult, "Profile source is missing: global/missing-authority.md", "Missing-source diagnostic must name the path.");

      const collision = newTempDir("core-budget-collision");
      writeText(path.join(collision, "global", "AGENTS.md"), "ok");
      writeText(path.join(collision, "global", "principles-of-work.md"), "ok");
      writeText(path.join(collision, "global", "skills", "complain", "SKILL.md"), "---\ndescription: Demo.\n---\n\nBody.\n");
      writeCore(collision, { ...baseProfile(), directories: ["global/skills/complain"] });
      const collisionResult = invokeInstructionBudget(["--root", collision, "--seed", seed(collision), "--format", "json"]);
      assertFailure(collisionResult, "Core owner collision must fail closed.");
      assertOutputContains(collisionResult, "duplicate owner 'skill:complain'", "Collision diagnostic must name the owner.");
    },
  },
  {
    name: "loader evaluator rejects a hidden parent catalog and missing core skills",
    run: () => {
      const generated = path.join(libraryRoot, "global", ".runtime-profiles", "core");
      const passed = evaluateLoaderSkills(
        CORE_SKILLS.map((name) => ({ location: path.join(generated, "skills", name, "SKILL.md"), name })),
        generated,
        path.join(libraryRoot, "global"),
      );
      assert(passed.status === "passed", `Core-only inventory must pass: ${JSON.stringify(passed)}`);
      const leaked = evaluateLoaderSkills(
        [
          { location: path.join(libraryRoot, "global", "skills", "windows-service-packaging", "SKILL.md"), name: "windows-service-packaging" },
          { location: path.join(generated, "skills", "complain", "SKILL.md"), name: "complain" },
        ],
        generated,
        path.join(libraryRoot, "global"),
      );
      assert(leaked.status === "failed", "Parent-catalog leak must fail.");
      assert(leaked.hiddenParentHits.includes("windows-service-packaging"), "Leak must name the parent skill.");
      assert(leaked.extraCoreSkills.includes("windows-service-packaging"), "Domain skill must be extra.");
      assert(leaked.missingCoreSkills.includes("change-ready-sdlc"), "Missing core skills must be reported.");
    },
  },
  {
    name: "validator rejects a fixture missing core.json",
    run: () => {
      const fixture = newLibraryFixture("runtime-surface-missing-core");
      fs.rmSync(path.join(fixture, "profiles", "core.json"));
      const result = invokeValidator(fixture);
      assertFailure(result, "Missing core.json must fail validation.");
      assertOutputContains(result, "profiles/core.json", "Missing-core diagnostic must name the required profile.");
    },
  },
];
