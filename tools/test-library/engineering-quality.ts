import fs from "node:fs";
import path from "node:path";

import {
  ENGINEERING_QUALITY_SURFACES,
  GLOBAL_ENGINEERING_QUALITY_MARKERS,
} from "../contracts/engineering-quality.ts";
import {
  engineeringQualityAuthorityProblem,
  validateEngineeringQualityContracts,
} from "../validators/engineering-quality.ts";
import { createContext } from "../validators/context.ts";
import {
  assert,
  assertEqual,
  libraryRoot,
  newTempDir,
  type TestCase,
  writeText,
} from "../test-helpers/library.ts";

const globalAgentsPath = path.join(libraryRoot, "global", "AGENTS.md");

export const engineeringQualityTests: TestCase[] = [
  {
    name: "engineering quality accepts the current global authority",
    run: () => {
      const agents = fs.readFileSync(globalAgentsPath, "utf8");
      assertEqual(engineeringQualityAuthorityProblem(agents), null, "Current global authority must satisfy the engineering-quality contract.");
    },
  },
  {
    name: "engineering quality rejects every missing global authority marker",
    run: () => {
      const agents = fs.readFileSync(globalAgentsPath, "utf8");
      for (const marker of GLOBAL_ENGINEERING_QUALITY_MARKERS) {
        assertEqual(agents.split(marker).length - 1, 1, `Global engineering-quality marker must remain unique: ${marker}`);
        assertEqual(
          engineeringQualityAuthorityProblem(agents.replace(marker, "removed-marker")),
          `AGENTS.md missing architecture/diagnostic authority marker: ${marker}`,
          `Missing global marker must fail closed: ${marker}`,
        );
      }
    },
  },
  {
    name: "engineering quality ignores a required marker inside fenced example code",
    run: () => {
      const agents = fs.readFileSync(globalAgentsPath, "utf8");
      const marker = GLOBAL_ENGINEERING_QUALITY_MARKERS[0]!;
      const withFencedDecoy = `${agents.replace(marker, "removed-marker")}\n\n\`\`\`text\n${marker}\n\`\`\`\n`;
      assertEqual(
        engineeringQualityAuthorityProblem(withFencedDecoy),
        `AGENTS.md missing architecture/diagnostic authority marker: ${marker}`,
        "Fenced examples must not satisfy active engineering-quality authority.",
      );
    },
  },
  {
    name: "engineering quality validator names a drifting maintained mirror",
    run: () => {
      const fixture = newTempDir("engineering-quality-mirror");
      const mirror = ENGINEERING_QUALITY_SURFACES.find(({ relative }) => relative === "REPO_AGENTS.md");
      assert(mirror != null, "REPO_AGENTS.md must remain an explicit engineering-quality mirror.");
      const marker = mirror.markers[0]!;
      writeText(path.join(fixture, "global", "AGENTS.md"), fs.readFileSync(globalAgentsPath, "utf8"));
      writeText(
        path.join(fixture, "global", "skills", "change-ready-sdlc", "SKILL.md"),
        fs.readFileSync(path.join(libraryRoot, "global", "skills", "change-ready-sdlc", "SKILL.md"), "utf8"),
      );
      writeText(
        path.join(fixture, mirror.relative),
        fs.readFileSync(path.join(libraryRoot, mirror.relative), "utf8").replace(marker, "removed-marker"),
      );
      const ctx = createContext();
      validateEngineeringQualityContracts(ctx, fixture);
      assert(
        ctx.errors.some((error) => error.includes(`architecture/diagnostic contract must include '${marker}'`) && error.includes("REPO_AGENTS.md")),
        "Mirror drift diagnostic must name the missing marker and artifact.",
      );
    },
  },
];
