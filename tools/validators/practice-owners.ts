import fs from "node:fs";
import path from "node:path";

import {
  OPTIONAL_FINAL_REVIEW_AGENT,
  allOwnerAgents,
  coreOwnerAgents,
  defaultPracticeOwnerSeedPath,
  defaultPracticeOwnerViewPath,
  expectedCoreAgents,
  loadPracticeOwnerSeed,
  renderPracticeOwnerView,
  seedDigest,
} from "../practice-owners.ts";
import { loadRuntimeSurfaceProfile } from "../runtime-surface-profile.ts";
import type { ValidationContext } from "./context.ts";

export function validatePracticeOwners(ctx: ValidationContext, root: string): void {
  if (!fs.existsSync(defaultPracticeOwnerSeedPath(root))) return;
  let seed;
  try {
    seed = loadPracticeOwnerSeed(root);
  } catch (error) {
    ctx.addError(error instanceof Error ? error.message : String(error));
    return;
  }
  const first = seedDigest(seed);
  const second = seedDigest(loadPracticeOwnerSeed(root));
  if (first !== second) ctx.addError("Practice owner seed readback digest is unstable.");
  for (const practice of seed.practices) {
    for (const surface of practice.maintenanceSurfaces) {
      if (!fs.existsSync(path.join(root, surface))) ctx.addError(`Missing owner surface: ${surface}`);
    }
    for (const anchor of practice.anchors) {
      const file = path.join(root, anchor.path);
      if (!fs.existsSync(file)) {
        ctx.addError(`Missing practice anchor file: ${anchor.path}`);
        continue;
      }
      const text = fs.readFileSync(file, "utf8");
      if (!text.includes(anchor.marker)) ctx.addError(`Missing anchor marker for ${practice.id} in ${anchor.path}`);
    }
    if (practice.exclusions.some((item) => !seed.practices.some((row) => row.id === item))) {
      ctx.addError(`Unknown exclusion on ${practice.id}`);
    }
  }
  const viewPath = defaultPracticeOwnerViewPath(root);
  if (!fs.existsSync(viewPath)) {
    ctx.addError(`Missing generated practice-owner view: ${path.relative(root, viewPath)}`);
  } else if (fs.readFileSync(viewPath, "utf8") !== renderPracticeOwnerView(seed)) {
    ctx.addError("Practice-owner view drifted from seed. Run node tools/practice-owners.ts --materialize");
  }
  try {
    const coreLoaded = loadRuntimeSurfaceProfile(root, "core");
    const allLoaded = loadRuntimeSurfaceProfile(root, "all");
    if (coreLoaded.profile == null || allLoaded.profile == null) {
      ctx.addError([...coreLoaded.errors, ...allLoaded.errors].join("; ") || "Runtime surface profiles failed to load.");
    } else {
      const core = coreLoaded.profile;
      const all = allLoaded.profile;
      const expectedCore = expectedCoreAgents(seed);
      if (JSON.stringify(core.agents) !== JSON.stringify(expectedCore)) {
        ctx.addError("profiles/core.json agents must match seed core owners plus non-owner core agents.");
      }
      if (!all.agents.includes(OPTIONAL_FINAL_REVIEW_AGENT)) ctx.addError("all profile must retain final-candidate-reviewer");
      for (const owner of coreOwnerAgents(seed)) {
        if (!core.agents.includes(owner)) ctx.addError(`core profile omitted owner ${owner}`);
      }
      for (const owner of allOwnerAgents(seed)) {
        if (!all.agents.includes(owner)) ctx.addError(`all profile omitted owner ${owner}`);
      }
      for (const owner of allOwnerAgents(seed).filter((name) => !coreOwnerAgents(seed).includes(name))) {
        if (core.agents.includes(owner)) ctx.addError(`core profile must not include domain owner ${owner}`);
      }
      if (core.agents.includes(OPTIONAL_FINAL_REVIEW_AGENT)) {
        ctx.addError("core profile must not include final-candidate-reviewer");
      }
    }
  } catch (error) {
    ctx.addError(error instanceof Error ? error.message : String(error));
  }
  if (!fs.existsSync(defaultPracticeOwnerSeedPath(root))) ctx.addError("Missing config/practice-owners.json");
}
