import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  assert,
  assertDeepEqual,
  assertEqual,
  libraryRoot,
  sectionBetween,
  taskSectionBetween,
  type TestCase,
} from "./test-helpers/library.ts";

const root = libraryRoot;

type LocalStatusItem = {
  artifact: string;
  taskItem: string;
  baselineMarker: " " | "x" | "X";
};

type LocalIdentityRecipe = {
  statusItems: readonly LocalStatusItem[];
};

type CandidateEntry = {
  status: "A" | "M" | "D";
  content: Buffer;
};

type CandidateFiles = ReadonlyMap<string, CandidateEntry>;

function candidate(status: CandidateEntry["status"], content: string | Buffer = ""): CandidateEntry {
  return { status, content: Buffer.isBuffer(content) ? Buffer.from(content) : Buffer.from(content, "utf8") };
}

function u64be(value: number): Buffer {
  const bytes = Buffer.alloc(8);
  bytes.writeBigUInt64BE(BigInt(value));
  return bytes;
}

function normalizeForwardStatusMarkers(
  artifact: string,
  text: string,
  recipe: LocalIdentityRecipe,
): string {
  return text.replace(
    /^(\s*-\s*)\[([ xX])\](\s+)(.*)$/gm,
    (line, prefix: string, marker: string, spacing: string, taskItem: string) => {
      const baseline = recipe.statusItems.find((item) => item.artifact === artifact && item.taskItem === taskItem);
      const isAllowedForwardTransition = baseline?.baselineMarker === " " && (marker === "x" || marker === "X");
      return isAllowedForwardTransition ? `${prefix}[ ]${spacing}${taskItem}` : line;
    },
  );
}

function frameV4Candidate(files: CandidateFiles, recipe?: LocalIdentityRecipe): Buffer {
  const chunks: Buffer[] = [];
  const entries = [...files.entries()].sort(([left], [right]) =>
    Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8")));
  for (const [artifact, entry] of entries) {
    const pathBytes = Buffer.from(artifact, "utf8");
    assert(entry.status !== "D" || entry.content.length === 0, `Deleted entry must have zero content bytes: ${artifact}`);
    let content = entry.content;
    if (entry.status !== "D" && recipe?.statusItems.some((item) => item.artifact === artifact)) {
      content = Buffer.from(normalizeForwardStatusMarkers(artifact, content.toString("utf8"), recipe), "utf8");
    }
    chunks.push(
      Buffer.from([0x04]), u64be(pathBytes.length), pathBytes,
      Buffer.from([entry.status.charCodeAt(0)]), u64be(content.length), content,
    );
  }
  return Buffer.concat(chunks);
}

function hashV4Candidate(files: CandidateFiles, recipe?: LocalIdentityRecipe): string {
  return crypto.createHash("sha256").update(frameV4Candidate(files, recipe)).digest("hex");
}

function localRecipeIdentities(files: CandidateFiles, recipe: LocalIdentityRecipe): {
  semantic: string;
  package: string;
} {
  return {
    semantic: hashV4Candidate(files, recipe),
    package: hashV4Candidate(files),
  };
}

const EXPECTED_ELIGIBLE_TASK_IDS = [
  "4.1", "4.2", "4.3", "5.1", "5.2", "5.3", "5.4", "6.1", "6.2",
  "6.3", "6.4", "6.5", "6.6", "6.7", "7.1", "7.2", "7.3", "7.4",
];

const EXPECTED_MANIFEST = {
  modified: `README.md
REPO_AGENTS.md
global/AGENTS.md
global/agents/code-quality-reviewer.md
global/agents/deployment-config-reviewer.md
global/agents/implementation-readiness-reviewer.md
global/agents/implementation-worker.md
global/agents/instruction-artifact-reviewer.md
global/agents/legacy-client-compatibility-reviewer.md
global/agents/legacy-evidence-reviewer.md
global/agents/openspec-architecture-reviewer.md
global/agents/performance-reliability-reviewer.md
global/agents/protocol-api-reviewer.md
global/agents/rust-concurrency-reviewer.md
global/agents/session-delivery-reviewer.md
global/agents/test-coverage-reviewer.md
global/agents/troubleshooter.md
global/agents/wire-protocol-reviewer.md
global/skills/merge-request-author/SKILL.md
instructions/leaf-reviewer-agent-contract.md
instructions/porting-checklist.md
instructions/reusable-project-agent-instructions.md
instructions/universal-development-loop.md
profiles/all.json
templates/project/AGENTS.md
templates/project/adapter.json
templates/project/validation.md
tools/contracts/agents.ts
tools/contracts/implementation-worker.ts
tools/contracts/reviewer-binding.ts
tools/contracts/skills.ts
tools/doctor.ts
tools/install-opencode-global.ts
tools/test-contracts.ts
tools/test-helpers/library.ts
tools/test-install-opencode-global.ts
tools/test-library/doctor.ts
tools/test-library/validator-1.ts
tools/validators/agents.ts
tools/validators/opencode-config.ts
tools/validators/routing.ts
tools/validators/skills.ts`.split("\n"),
  added: `global/agents/final-candidate-reviewer.md
global/agents/sdet-quality-engineer.md
global/skills/change-ready-sdlc/SKILL.md
openspec/changes/add-lightweight-sdet-pr-ready-sdlc/.openspec.yaml
openspec/changes/add-lightweight-sdet-pr-ready-sdlc/design.md
openspec/changes/add-lightweight-sdet-pr-ready-sdlc/proposal.md
openspec/changes/add-lightweight-sdet-pr-ready-sdlc/specs/library-change-ready-sdlc/spec.md
openspec/changes/add-lightweight-sdet-pr-ready-sdlc/specs/library-instruction-artifacts/spec.md
openspec/changes/add-lightweight-sdet-pr-ready-sdlc/specs/library-tools-architecture/spec.md
openspec/changes/add-lightweight-sdet-pr-ready-sdlc/tasks.md
tools/contracts/sdet-quality-engineer.ts
tools/test-contracts-change-ready-delivery.ts
tools/test-contracts-change-ready-identity.ts
tools/test-contracts-change-ready.ts
tools/test-library/validator-change-ready.ts
tools/validators/active-authority.ts`.split("\n"),
  deleted: ["tools/test-helpers/fixture-builder.ts"],
};

export const identityRecipeContractTests: TestCase[] = [
  {
    name: "contracts: historical add-lightweight D14 resumes the recorded primary and exact SDET child",
    run: () => {
      const changeRoot = path.join(root, "openspec", "changes", "add-lightweight-sdet-pr-ready-sdlc");
      const design = fs.readFileSync(path.join(changeRoot, "design.md"), "utf8");
      const d14 = sectionBetween(
        design,
        "### D14. Use reproducible fresh-process evaluations and candidate-only validation",
        "### D15. Make main-owned fan-out and bounded specialist continuation explicit",
      ).replace(/\s+/g, " ");
      const primaryResume = "opencode run --session <recorded-main-session-id> --model <same-model> --format json --dir <repository> <bounded-validation-outcomes>";

      assert(!d14.includes("--agent sdet-quality-engineer"), "D14 must not prescribe direct CLI invocation of the SDET subagent.");
      assert(d14.includes("Do not invoke a subagent by direct `opencode run --agent <subagent-name>`"), "D14 must forbid direct CLI subagent invocation.");

      assert(d14.includes(primaryResume), "D14 must resume the recorded primary session.");
      const resumeCommand = d14.match(/`opencode run --session <recorded-main-session-id>[^`]+`/)?.[0] ?? "";
      assert(resumeCommand.length > 0 && !resumeCommand.includes("--agent"), "D14 primary resume command must contain no child --agent flag.");
      for (const token of [
        "recorded primary session id",
        "the exact recorded SDET child through the discovered runtime continuation adapter",
        "same child SDET session/task id",
        "same SDET role/context",
        "same model disclosure",
      ]) assert(d14.includes(token), `D14 missing parent-to-exact-child continuation oracle: ${token}`);

      for (const token of [
        "fallback to the default primary",
        "unavailable/unverifiable child continuation blocks acceptance",
        "A candidate correction starts a new primary process without continuation flags",
        "a new primary session plus a different child SDET session/task id",
        "fresh corrected-candidate SDET; no continuation flags",
      ]) assert(d14.includes(token), `D14 missing fallback/freshness oracle: ${token}`);

      for (const token of ["final report identity fields", "changed child session/task id or role"]) {
        assert(d14.includes(token), `D14 missing final identity/blocking oracle: ${token}`);
      }
    },
  },
  {
    name: "contracts: active Candidate Reference policy is separate from explicitly historical dual-identity evidence",
    run: () => {
      const skill = fs.readFileSync(path.join(root, "global", "skills", "change-ready-sdlc", "SKILL.md"), "utf8");
      const sdet = fs.readFileSync(path.join(root, "global", "agents", "sdet-quality-engineer.md"), "utf8");
      const activeOutput = sectionBetween(sdet, "## Output", "</SDET_QUALITY_REPORT>");
      assert(skill.includes("Dual `Semantic Candidate Identity` / `Package Identity` / `Identity Recipe` are not portable requirements"), "Active skill must make dual identity non-portable.");
      assert(activeOutput.includes("Candidate Reference:"), "Active SDET output must expose optional Candidate Reference.");
      for (const stale of ["Phase: provisional | final", "Input Semantic Candidate Identity", "Input Package Identity", "Identity Recipe:"]) {
        assert(!activeOutput.includes(stale), `Active SDET output must not retain historical identity field: ${stale}`);
      }

      const historicalSpec = fs.readFileSync(
        path.join(root, "openspec", "changes", "add-lightweight-sdet-pr-ready-sdlc", "specs", "library-change-ready-sdlc", "spec.md"),
        "utf8",
      );
      assert(historicalSpec.includes("Semantic Candidate Identity, Package Identity, and Identity Recipe"), "Historical identity evidence must remain readable as history.");
    },
  },
  {
    name: "contracts: historical add-lightweight recipe keeps enumerated forward markers semantic-neutral",
    run: () => {
      const artifact = "openspec/changes/add-lightweight-sdet-pr-ready-sdlc/tasks.md";
      const taskItems = EXPECTED_ELIGIBLE_TASK_IDS.map((id) => `${id} Fixture task ${id}.`);
      const unchecked = `# Tasks\n\n${taskItems.map((item) => `- [ ] ${item}`).join("\n")}\n`;
      const baseline = new Map<string, CandidateEntry>([
        [artifact, candidate("M", unchecked)],
        ["evidence/result.txt", candidate("M", "proof passed\n")],
      ]);
      const recipe: LocalIdentityRecipe = {
        statusItems: taskItems.map((taskItem) => ({ artifact, taskItem, baselineMarker: " " as const })),
      };
      const baselineIdentities = localRecipeIdentities(baseline, recipe);

      for (const taskItem of taskItems) {
        for (const marker of ["x", "X"] as const) {
          const changed = new Map(baseline);
          changed.set(artifact, candidate("M", unchecked.replace(`- [ ] ${taskItem}`, `- [${marker}] ${taskItem}`)));
          const changedIdentities = localRecipeIdentities(changed, recipe);
          assertEqual(changedIdentities.semantic, baselineIdentities.semantic, `${taskItem} -> [${marker}] must preserve semantic identity.`);
          assert(changedIdentities.package !== baselineIdentities.package, `${taskItem} -> [${marker}] must change Package Identity.`);
        }
      }
    },
  },
  {
    name: "contracts: historical add-lightweight recipe treats non-forward changes as semantic",
    run: () => {
      const artifact = "openspec/changes/example/tasks.md";
      const firstTask = "7.3 Run final candidate review.";
      const secondTask = "7.4 Run delivery review.";
      const checkedBaselineText = `# Tasks\n\n- [x] ${firstTask}\n- [ ] ${secondTask}\n`;
      const checkedBaseline = new Map<string, CandidateEntry>([
        [artifact, candidate("M", checkedBaselineText)],
        ["evidence/result.txt", candidate("M", "proof passed\n")],
      ]);
      const checkedRecipe: LocalIdentityRecipe = {
        statusItems: [
          { artifact, taskItem: firstTask, baselineMarker: "x" },
          { artifact, taskItem: secondTask, baselineMarker: " " },
        ],
      };
      const checkedSemantic = localRecipeIdentities(checkedBaseline, checkedRecipe).semantic;
      const reversed = new Map(checkedBaseline);
      reversed.set(artifact, candidate("M", checkedBaselineText.replace("- [x]", "- [ ]")));
      assert(
        localRecipeIdentities(reversed, checkedRecipe).semantic !== checkedSemantic,
        "A baseline-checked -> unchecked reverse transition must change semantic identity.",
      );

      const uncheckedText = checkedBaselineText.replace("- [x]", "- [ ]");
      const baseline = new Map<string, CandidateEntry>([
        [artifact, candidate("M", uncheckedText)],
        ["evidence/result.txt", candidate("M", "proof passed\n")],
      ]);
      const recipe: LocalIdentityRecipe = {
        statusItems: [{ artifact, taskItem: firstTask, baselineMarker: " " }],
      };
      const baselineSemantic = localRecipeIdentities(baseline, recipe).semantic;
      const cases: Array<[string, CandidateFiles]> = [];

      const nonEnumerated = new Map(baseline);
      nonEnumerated.set(artifact, candidate("M", uncheckedText.replace(`- [ ] ${secondTask}`, `- [x] ${secondTask}`)));
      cases.push(["non-enumerated marker", nonEnumerated]);
      const wording = new Map(baseline);
      wording.set(artifact, candidate("M", uncheckedText.replace("Run final candidate review", "Run independent final candidate review")));
      cases.push(["task wording", wording]);
      const order = new Map(baseline);
      order.set(artifact, candidate("M", `# Tasks\n\n- [ ] ${secondTask}\n- [ ] ${firstTask}\n`));
      cases.push(["task order", order]);
      const added = new Map(baseline);
      added.set("evidence/new.txt", candidate("A", "new evidence\n"));
      cases.push(["added artifact", added]);
      const deleted = new Map(baseline);
      deleted.set("evidence/result.txt", candidate("D"));
      cases.push(["deleted artifact", deleted]);
      const evidence = new Map(baseline);
      evidence.set("evidence/result.txt", candidate("M", "proof changed\n"));
      cases.push(["evidence text", evidence]);

      for (const [label, changed] of cases) {
        assert(
          localRecipeIdentities(changed, recipe).semantic !== baselineSemantic,
          `${label} changes must change semantic identity under the local recipe.`,
        );
      }
    },
  },
  {
    name: "contracts: historical add-lightweight design records adapter-owned status normalization",
    run: () => {
      const design = fs.readFileSync(
        path.join(root, "openspec", "changes", "add-lightweight-sdet-pr-ready-sdlc", "design.md"),
        "utf8",
      );
      const normalizedDesign = design.replace(/\s+/g, " ");
      for (const token of [
        "Status-marker normalization is adapter-owned, explicit, and absent by default",
        "Portable text does not prescribe a universal status filename or marker syntax",
        "Only proven forward transitions on those adapter-enumerated pre-existing status",
        "reverse, unknown, wording, order, add/delete, or evidence changes remain",
        "Identity Recipe change is always semantic process-evidence change",
        "there is no recipe-change exception",
        "recorded Identity Recipe itself is unchanged",
        "both identities remain independently reproduced with that same prior recipe",
      ]) {
        assert(normalizedDesign.includes(token), `Historical design missing adapter-owned status/recipe oracle: ${token}`);
      }
    },
  },
  {
    name: "contracts: historical add-lightweight v4 recipe records collision-safe framing",
    run: () => {
      const changeRoot = path.join(root, "openspec", "changes", "add-lightweight-sdet-pr-ready-sdlc");
      const tasks = fs.readFileSync(path.join(changeRoot, "tasks.md"), "utf8");
      const design = fs.readFileSync(path.join(changeRoot, "design.md"), "utf8");
      const recipeSurfaces = [
        ["tasks", sectionBetween(tasks, "## Kit-Local Identity Recipe (v4)", "## Requirement Trace")],
        ["design", sectionBetween(design, "For this change, the settled kit-local Identity Recipe is", "Identity Recipe is the adapter-owned")],
      ] as const;
      for (const [label, recipe] of recipeSurfaces) {
        const normalizedRecipe = recipe.replace(/\s+/g, " ");
        for (const token of ["sha256-length-prefixed-entries-v4", "status-forward-v1", "0x04", "unsigned 64-bit big-endian", "<deleted>"]) {
          assert(normalizedRecipe.includes(token), `${label} v4 recipe missing framing token: ${token}`);
        }
        assertDeepEqual([...recipe.matchAll(/`(\d+\.\d+)`/g)].map((match) => match[1]), EXPECTED_ELIGIBLE_TASK_IDS, `${label} eligible task IDs drifted.`);
        assert(normalizedRecipe.includes("No normalization is applied at the initial freeze"), `${label} must record the initial no-normalization state.`);
      }
    },
  },
  {
    name: "contracts: historical add-lightweight v4 framing distinguishes status and boundary bytes",
    run: () => {
      const vectors: Array<[string, CandidateEntry, string]> = [
        ["deleted", candidate("D"), "04000000000000000178440000000000000000"],
        ["empty added", candidate("A"), "04000000000000000178410000000000000000"],
        ["empty modified", candidate("M"), "040000000000000001784d0000000000000000"],
        ["literal sentinel", candidate("M", "<deleted>"), "040000000000000001784d00000000000000093c64656c657465643e"],
      ];
      const identities = vectors.map(([label, entry, expected]) => {
        const files = new Map([["x", entry]]);
        assertEqual(frameV4Candidate(files).toString("hex"), expected, `${label} v4 golden bytes drifted.`);
        return hashV4Candidate(files);
      });
      assertEqual(new Set(identities).size, vectors.length, "Deletion, empty A/M, and literal sentinel content must have distinct identities.");
      const boundaryBytes = new Map([["a\0b", candidate("M", Buffer.from([0x00, 0x04, 0x4d, 0xff]))]]);
      assertEqual(frameV4Candidate(boundaryBytes).toString("hex"), "0400000000000000036100624d000000000000000400044dff", "Boundary-containing bytes must use exact length-prefixed framing.");
      assert(
        hashV4Candidate(new Map([["line.txt", candidate("M", "one\ntwo\n")]])) !== hashV4Candidate(new Map([["line.txt", candidate("M", "one\r\ntwo\r\n")]])),
        "v4 framing must preserve exact line endings.",
      );
      const utf8Order = frameV4Candidate(new Map([["😀", candidate("D")], ["�", candidate("D")]]));
      assert(utf8Order.indexOf(Buffer.from("�")) < utf8Order.indexOf(Buffer.from("😀")), "Paths must sort by exact UTF-8 bytes, not UTF-16 code units.");
    },
  },
  {
    name: "contracts: historical add-lightweight OpenSpec traces identity restart reproducibility",
    run: () => {
      const changeRoot = path.join(root, "openspec", "changes", "add-lightweight-sdet-pr-ready-sdlc");
      const spec = fs.readFileSync(path.join(changeRoot, "specs", "library-change-ready-sdlc", "spec.md"), "utf8");
      const tasks = fs.readFileSync(path.join(changeRoot, "tasks.md"), "utf8");
      const normalizedTasks = tasks.replace(/\s+/g, " ");
      const restartScenario = sectionBetween(
        spec,
        "#### Scenario: Identity Recipe enables full-package reproducibility after restart",
        "#### Scenario: missing identity-generation capability blocks qualification",
      );
      const normalizedRestartScenario = restartScenario.replace(/\s+/g, " ");
      for (const token of [
        "Semantic Candidate Identity, Package Identity, and Identity Recipe",
        "recorded Identity Recipe and required local inputs",
        "reproduce both identities for the same scoped candidate",
        "continuity SHALL be unknown",
        "qualification SHALL block",
      ]) {
        assert(normalizedRestartScenario.includes(token), `OpenSpec restart scenario missing normative Identity Recipe oracle: ${token}`);
      }
      for (const token of [
        "project-adapter discovery including deterministic candidate identity-generation",
        "restart continuity that reproduces both identities from the recipe",
        "missing/unreproducible Identity Recipe or missing post-test Applicable Proof continuity after authored-tests blocks",
        "move only the dual-identity, Identity Recipe, marker-normalization, and restart-continuity contract tests",
      ]) {
        assert(normalizedTasks.includes(token), `OpenSpec tasks missing current Identity Recipe trace/acceptance token: ${token}`);
      }
      const identityPolicy = sectionBetween(
        spec,
        "The orchestrator SHALL maintain two deterministic identities",
        "An authoritative failure SHALL NOT be erased",
      ).replace(/\s+/g, " ");
      assert(
        identityPolicy.includes("rather than one ambiguous candidate-identity field"),
        "OpenSpec identity policy must reject an ambiguous singular candidate-identity field.",
      );
    },
  },
  {
    name: "contracts: historical add-lightweight OpenSpec traces identity handshake paths",
    run: () => {
      const changeRoot = path.join(root, "openspec", "changes", "add-lightweight-sdet-pr-ready-sdlc");
      const spec = fs.readFileSync(path.join(changeRoot, "specs", "library-change-ready-sdlc", "spec.md"), "utf8");
      const tasks = fs.readFileSync(path.join(changeRoot, "tasks.md"), "utf8");
      const task12 = taskSectionBetween(tasks, "1.2 Make the skill the only complete global orchestration adapter", "1.3 Keep the complete shared dispatch schema").replace(/\s+/g, " ");
      const authoredScenario = sectionBetween(
        spec,
        "#### Scenario: authored-tests identity handshake maintains one current candidate chain",
        "#### Scenario: no suitable automated test capability exists",
      );
      const assessedScenario = sectionBetween(
        spec,
        "#### Scenario: existing tests are sufficient",
        "#### Scenario: authored-tests identity handshake maintains one current candidate chain",
      );
      for (const token of [
        "return `assessed-existing-tests` without editing artifacts",
        "current Semantic Candidate Identity and Package Identity SHALL equal the input pair with unchanged",
        "Identity Recipe",
        "prior Applicable Proof SHALL remain valid without redundant replay solely for SDET assessment",
      ]) {
        assert(assessedScenario.includes(token), `OpenSpec assessed-existing scenario missing proportional-path token: ${token}`);
      }
      for (const token of [
        "provisional SDET returns `authored-tests` with pending current identities",
        "inspects test-only scope, freezes, recaptures recipe and both identities, re-runs",
        "post-test Applicable Proof, and completes validation",
        "same SDET context SHALL receive exact current pair, recipe, post-test Applicable Proof outcome",
        "pending forbidden",
        "final review and delivery SHALL require that post-test Applicable Proof, final SDET, validation, and",
      ]) {
        assert(authoredScenario.includes(token), `OpenSpec authored-tests handshake scenario missing trace token: ${token}`);
      }
      for (const token of [
        "SDET provisional/final handshake with input/current identity fields and Identity Recipe",
        "authored-tests recapture→post-test Applicable Proof→validation→same-context final sequence",
        "assessed-existing no-redundant-replay path",
        "final review blocking missing post-test proof continuity after authored-tests",
      ]) {
        assert(task12.includes(token), `OpenSpec task 1.2 missing current identity-handshake acceptance trace: ${token}`);
      }
    },
  },
  {
    name: "contracts: historical add-lightweight candidate manifest remains exact",
    run: () => {
      const changeRoot = path.join(root, "openspec", "changes", "add-lightweight-sdet-pr-ready-sdlc");
      const proposal = fs.readFileSync(path.join(changeRoot, "proposal.md"), "utf8");
      const design = fs.readFileSync(path.join(changeRoot, "design.md"), "utf8");
      const tasks = fs.readFileSync(path.join(changeRoot, "tasks.md"), "utf8");
      const paths = (text: string) => [...text.matchAll(/^- `([^`]+)`\s*$/gm)].map((match) => match[1]);
      const actualManifest = {
        modified: paths(sectionBetween(tasks, "### Modified (42)", "### Added (16)")),
        added: paths(sectionBetween(tasks, "### Added (16)", "### Deleted (1)")),
        deleted: paths(sectionBetween(tasks, "### Deleted (1)", "## Kit-Local Identity Recipe (v4)")),
      };
      assertDeepEqual(actualManifest, EXPECTED_MANIFEST, "Authoritative tasks manifest A/M/D entries drifted.");
      assertEqual(actualManifest.modified.length, 42, "Modified manifest count drifted.");
      assertEqual(actualManifest.added.length, 16, "Added manifest count drifted.");
      assertEqual(actualManifest.deleted.length, 1, "Deleted manifest count drifted.");

      const normalized = [proposal, design, tasks].map((text) => text.replace(/\s+/g, " "));
      assert(normalized[0].includes("size 59 paths: 42 modified, 16 added, 1 deleted"), "Proposal final manifest count drifted.");
      assert(normalized[1].includes("expected 59 paths: 42 modified, 16 added, 1 deleted"), "Design final manifest count drifted.");
      assert(normalized[2].includes("Authoritative Expected Final Candidate Manifest (59 paths)"), "Tasks final manifest heading drifted.");
      assert(normalized[2].includes("Counts: **42 M**, **16 A**, **1 D**"), "Tasks final manifest count summary drifted.");
      const architectureDelta = "openspec/changes/add-lightweight-sdet-pr-ready-sdlc/specs/library-tools-architecture/spec.md";
      assert(actualManifest.added.includes(architectureDelta), "The 59-path manifest must include the library-tools architecture delta.");
      assert(fs.existsSync(path.join(root, architectureDelta)), "The library-tools architecture delta must exist at its manifested path.");
      assert(actualManifest.modified.includes("tools/install-opencode-global.ts"), "The 59-path manifest must include the corrected installer production path.");
      assertEqual(actualManifest.modified.filter((entry) => entry === "tools/validators/opencode-config.ts").length, 1, "The shared OpenCode config policy must appear exactly once in the modified manifest.");
      const authorityPath = "tools/validators/active-authority.ts";
      assertEqual(actualManifest.added.filter((entry) => entry === authorityPath).length, 1, "The pure active-authority owner must appear exactly once as Added.");
      assert(!actualManifest.modified.includes(authorityPath) && !actualManifest.deleted.includes(authorityPath), "Active-authority ownership must not drift from Added status.");
      const authorityBytes = fs.readFileSync(path.join(root, authorityPath));
      const addedFrame = frameV4Candidate(new Map([[authorityPath, candidate("A", authorityBytes)]]));
      assertEqual(addedFrame[9 + Buffer.byteLength(authorityPath, "utf8")], "A".charCodeAt(0), "v4 framing must encode active-authority with Added status byte.");
      assert(!addedFrame.equals(frameV4Candidate(new Map([[authorityPath, candidate("M", authorityBytes)]]))), "v4 byte framing must distinguish Added ownership from Modified.");
      assertEqual(actualManifest.modified.filter((entry) => entry === "templates/project/adapter.json").length, 1, "The template adapter must appear exactly once in the modified manifest.");
      const task51 = taskSectionBetween(tasks, "5.1 Start", "5.2 Freeze/current Applicable Proof");
      assert(task51.includes("`tools/test-library/doctor.ts`"), "Task 5.1 must include fresh-SDET doctor regression ownership.");
    },
  },
];
