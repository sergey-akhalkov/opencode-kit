import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {
  assert,
  assertFailure,
  assertOutputContains,
  assertSuccess,
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
  ALL_COMPATIBILITY_FILES,
  ALL_COMPATIBILITY_PLUGIN_FILES,
  CORE_AGENTS,
  CORE_COMMANDS,
  CORE_FILES,
  CORE_SKILLS,
  DELIVERY_TRAJECTORY_HELPER_FILES,
  OPENSPEC_ARCHIVE_HELPER_FILES,
  ROADMAP_MISSION_PLUGIN_FILES,
  SPECIALIST_CATALOG_PLUGIN_FILE,
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
      assert(JSON.stringify(all.files) === JSON.stringify([...ALL_COMPATIBILITY_FILES]), "All files must retain the compatibility catalog.");
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
      for (const profile of [core, all]) {
        assert(
          profile.agents.filter((name) => name === "foundation-integrity-reviewer").length === 1,
          `${profile.name} must resolve the foundation owner exactly once.`,
        );
        assert(
          profile.skills.filter((name) => name === "foundation-integrity-recovery").length === 1,
          `${profile.name} must resolve the foundation recovery skill exactly once.`,
        );
        assert(
          profile.agents.filter((name) => name === "specialist-team-advisor").length === 1,
          `${profile.name} must resolve the specialist team advisor exactly once.`,
        );
      }
      assert(core.files.includes(`global/${SPECIALIST_CATALOG_PLUGIN_FILE}`), "Core must own the exact specialist catalog source file.");
      assert(!all.files.includes(`global/${SPECIALIST_CATALOG_PLUGIN_FILE}`), "All must retain its existing extension-directory source ownership without a duplicate file entry.");
      assert(all.directories.includes("global/extensions"), "All must retain the extensions directory.");
    },
  },
  {
    name: "complexity management and its exact helper closure are profile available",
    run: () => {
      const core = committedProfile("core");
      const all = committedProfile("all");
      const helperFiles = [
        "global/bin/complexity-foraging-contract.ts",
        "global/bin/complexity-foraging-inventory.ts",
      ];
      assert(core.skills.includes("complexity-management"), "Core must expose focused complexity management.");
      assert(all.skills.includes("complexity-management"), "All must expose focused complexity management.");
      for (const relative of helperFiles) {
        assert(core.files.includes(relative), `Core must include exact helper closure member ${relative}.`);
      }
      for (const allOnly of ["code-quality-audit", "codebase-audit-loop", "codebase-audit-ledger"]) {
        assert(!core.skills.includes(allOnly), `Core must keep ${allOnly} unavailable.`);
        assert(all.skills.includes(allOnly), `All must retain ${allOnly}.`);
      }

      const generated = path.join(newTempDir("complexity-core-profile"), "core");
      materializeRuntimeSurfaceProfile({ profileName: "core", root: libraryRoot, targetRoot: generated });
      const focusedSkill = fs.readFileSync(path.join(generated, "skills", "complexity-management", "SKILL.md"), "utf8");
      assert(focusedSkill.includes("project-unavailable"), "Core focused mode must expose the project-unavailable result.");
      assert(focusedSkill.includes("without approximating coverage"), "Core must not approximate unavailable exhaustive coverage.");
      for (const relative of helperFiles) {
        const generatedRelative = relative.slice("global/".length);
        assert(fs.existsSync(path.join(generated, ...generatedRelative.split("/"))), `Generated core must contain ${generatedRelative}.`);
      }

      const custom: RuntimeSurfaceProfile = {
        ...structuredClone(core),
        name: "custom-without-complexity",
        skills: core.skills.filter((name) => name !== "complexity-management"),
        files: core.files.filter((relative) => !helperFiles.includes(relative)),
      };
      const customResolved = resolveRuntimeSurfaceProfile(libraryRoot, custom, "profiles/custom-without-complexity.json");
      assert(customResolved.errors.length === 0, `Custom omission must remain valid: ${customResolved.errors.join("; ")}`);
      assert(!custom.skills.includes("complexity-management"), "Custom omission must not claim focused availability.");
      assert(custom.files.every((relative) => !helperFiles.includes(relative)), "Custom omission must not retain the helper closure.");
    },
  },
  {
    name: "delivery trajectory skill and exact helper closure are profile available on demand",
    run: () => {
      const core = committedProfile("core");
      const all = committedProfile("all");
      const skillName = "roadmap-delivery-trajectory";
      const helper = DELIVERY_TRAJECTORY_HELPER_FILES[0];
      const helperClosure = [...DELIVERY_TRAJECTORY_HELPER_FILES];
      for (const profile of [core, all]) {
        assert(profile.skills.filter((name) => name === skillName).length === 1, `${profile.name} must expose the trajectory skill exactly once.`);
      }
      for (const relative of helperClosure) {
        assert(core.files.filter((entry) => entry === relative).length === 1, `Core must include exact trajectory closure member ${relative} once.`);
        assert(!all.files.includes(relative), `All must retain global/bin directory ownership without duplicate file ${relative}.`);
      }
      assert(all.directories.includes("global/bin"), "All must include the trajectory helper through global/bin.");

      for (const profileName of ["core", "all"] as const) {
        const generated = path.join(newTempDir(`trajectory-${profileName}-profile`), profileName);
        materializeRuntimeSurfaceProfile({ profileName, root: libraryRoot, targetRoot: generated });
        const skill = fs.readFileSync(path.join(generated, "skills", skillName, "SKILL.md"), "utf8");
        assert(skill.includes("## Trigger") && skill.includes("## Output"), `${profileName} must materialize the on-demand skill body.`);
        const generatedHelper = path.join(generated, "bin", "delivery-trajectory-context.ts");
        assert(fs.existsSync(generatedHelper), `${profileName} must materialize the exact helper.`);
        const help = spawnSync(process.execPath, [generatedHelper, "--help"], {
          cwd: newTempDir(`trajectory-${profileName}-help`),
          encoding: "utf8",
          shell: false,
          timeout: 30_000,
        });
        assert(help.status === 0, `${profileName} generated helper help must exit zero: ${help.stderr}`);
        assert(help.stdout.includes("No semantic progress"), `${profileName} helper must retain the semantic boundary.`);
        const archiveHelper = path.join(generated, "bin", "openspec-archive.ts");
        const archiveHelp = spawnSync(process.execPath, [archiveHelper, "--help"], {
          cwd: newTempDir(`archive-${profileName}-help`),
          encoding: "utf8",
          shell: false,
          timeout: 30_000,
        });
        assert(archiveHelp.status === 0, `${profileName} generated archive helper help must exit zero: ${archiveHelp.stderr}`);
        assert(archiveHelp.stdout.includes("--validation-not-applicable"), `${profileName} archive helper must retain its validation boundary.`);
      }

      const custom: RuntimeSurfaceProfile = {
        ...structuredClone(core),
        name: "custom-without-trajectory",
        skills: core.skills.filter((name) => name !== skillName),
        files: core.files.filter((relative) => !helperClosure.includes(relative)),
      };
      const customResolved = resolveRuntimeSurfaceProfile(libraryRoot, custom, "profiles/custom-without-trajectory.json");
      assert(customResolved.errors.length === 0, `Custom omission must remain valid: ${customResolved.errors.join("; ")}`);
      const sourceSkill = fs.readFileSync(path.join(libraryRoot, "global", "skills", skillName, "SKILL.md"), "utf8");
      assert(sourceSkill.includes("capability unavailable"), "Missing-capability contract must be explicit.");
      assert(sourceSkill.includes("no adjacent-skill fallback"), "Missing-capability contract must prohibit fallback.");
      const omitted = evaluateLoaderSkills(
        CORE_SKILLS.filter((name) => name !== skillName).map((name) => ({ location: path.join("<generated>", "skills", name, "SKILL.md"), name })),
        "<generated>",
        "<source>",
      );
      assert(omitted.status === "failed" && omitted.missingCoreSkills.includes(skillName), "Loader evaluator must name the exact missing trajectory skill.");
    },
  },
  {
    name: "core profile includes the exact OpenSpec archive helper closure",
    run: () => {
      const core = committedProfile("core");
      const all = committedProfile("all");
      for (const relative of OPENSPEC_ARCHIVE_HELPER_FILES) {
        assert(core.files.filter((entry) => entry === relative).length === 1, `Core must include exact archive closure member ${relative} once.`);
        assert(!all.files.includes(relative), `All must retain global/bin directory ownership without duplicate file ${relative}.`);
      }
    },
  },
  {
    name: "core profile rejects a missing foundation owner or recovery skill",
    run: () => {
      for (const kind of ["agent", "skill"] as const) {
        const { root } = mutateCommitted("core", (current) => ({
          ...current,
          agents: kind === "agent"
            ? current.agents.filter((name) => name !== "foundation-integrity-reviewer")
            : current.agents,
          skills: kind === "skill"
            ? current.skills.filter((name) => name !== "foundation-integrity-recovery")
            : current.skills,
        }));
        const core = loadRuntimeSurfaceProfile(root, "core");
        assert(core.profile != null, `missing foundation ${kind} fixture must parse`);
        const inspection = inspectRuntimeSurfaceProfiles(root, [...CORE_SKILLS], [...CORE_AGENTS], [...CORE_COMMANDS]);
        assert(
          inspection.errors.some((error) => error.includes(kind === "agent" ? "foundation-integrity-reviewer" : "foundation-integrity-recovery")),
          `missing foundation ${kind} must fail with its exact identity: ${inspection.errors.join("; ")}`,
        );
      }
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
        const config = JSON.parse(fs.readFileSync(path.join(targetRoot, "opencode.json"), "utf8")) as Record<string, unknown>;
        const serializedConfig = JSON.stringify(config).replaceAll("\\", "/");
        const configAgents = config.agent && typeof config.agent === "object" && !Array.isArray(config.agent)
          ? config.agent as Record<string, unknown>
          : {};
        const compaction = configAgents.compaction && typeof configAgents.compaction === "object" && !Array.isArray(configAgents.compaction)
          ? configAgents.compaction as Record<string, unknown>
          : {};
        const compactionPrompt = typeof compaction.prompt === "string" ? compaction.prompt : "";
        assert(!serializedConfig.includes("__OPENCODE_"), `${profileName} generated config must materialize every placeholder.`);
        assert(!serializedConfig.includes(".staging-"), `${profileName} generated config must not retain staging paths.`);
        assert(compactionPrompt.includes("Team Advice State"), `${profileName} generated config must retain the compaction team-advice mirror.`);
        assert(compactionPrompt.includes("Unavailable Material Capabilities"), `${profileName} generated config must retain every canonical Team Advice State field.`);
        assert(compactionPrompt.includes("does not infer a new team"), `${profileName} generated config must retain the compaction non-inference boundary.`);
        for (const relative of ["principles-of-work.md", "opencode.local.instructions.md"]) {
          const expected = path.join(targetRoot, relative).replaceAll("\\", "/");
          assert(serializedConfig.includes(expected), `${profileName} generated config must reference final ${relative}.`);
        }
        const plugins = Array.isArray(config.plugin) ? config.plugin : [];
        const catalogPath = path.join(targetRoot, ...SPECIALIST_CATALOG_PLUGIN_FILE.split("/")).replaceAll("\\", "/");
        const catalogMatches = plugins.filter((entry) => JSON.stringify(entry).replaceAll("\\", "/").includes(catalogPath));
        assert(catalogMatches.length === 1, `Generated ${profileName} config must load ${SPECIALIST_CATALOG_PLUGIN_FILE} exactly once.`);
        if (profileName === "core") {
          assert(plugins.length === 1, "Generated core config must contain only the specialist catalog plugin.");
          for (const relative of ALL_COMPATIBILITY_PLUGIN_FILES.filter((entry) => entry !== SPECIALIST_CATALOG_PLUGIN_FILE)) {
            const expected = path.join(targetRoot, ...relative.split("/")).replaceAll("\\", "/");
            assert(!serializedConfig.includes(expected), `Generated core config must not load all-only plugin ${relative}.`);
          }
        }
        if (profileName === "all") {
          assert(config.model === "openai/gpt-5.6-sol", "Generated all config must retain the pinned mission model.");
          for (const relative of ROADMAP_MISSION_PLUGIN_FILES) {
            const expected = path.join(targetRoot, ...relative.split("/")).replaceAll("\\", "/");
            const matching = plugins.filter((entry) => JSON.stringify(entry).replaceAll("\\", "/").includes(expected));
            assert(matching.length === 1, `Generated all config must load ${relative} exactly once from the final profile root.`);
          }
        }
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
