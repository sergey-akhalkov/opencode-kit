import fs from "node:fs";
import path from "node:path";
import { TROUBLESHOOTER_PERMISSION } from "../contracts/troubleshooter.ts";
import {
  assert,
  assertEqual,
  libraryRoot,
  type TestCase,
} from "../test-helpers/library.ts";

export const agentPermissionTests: TestCase[] = [
  {
    name: "troubleshooter permission is exact scalar allow-all",
    run: () => {
      assertEqual(
        TROUBLESHOOTER_PERMISSION,
        "allow",
        "TROUBLESHOOTER_PERMISSION must remain exact scalar allow.",
      );
      const agent = fs.readFileSync(path.join(libraryRoot, "global", "agents", "troubleshooter.md"), "utf8");
      const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(agent)?.[1];
      assert(frontmatter !== undefined, "Troubleshooter must retain readable YAML frontmatter.");
      assert(
        /^permission:\s*allow\s*$/m.test(frontmatter ?? ""),
        "Troubleshooter frontmatter must set exact permission: allow.",
      );
      assert(
        !/^permission:\s*(ask|deny)\s*$/m.test(frontmatter ?? ""),
        "Troubleshooter must not set permission: ask or deny.",
      );
      assert(
        !/^permission:\s*$/m.test(frontmatter ?? ""),
        "Troubleshooter must not use a nested permission map.",
      );
      assert(
        !/^permission\./m.test(frontmatter ?? ""),
        "Troubleshooter must not use nested permission.* keys.",
      );
    },
  },
];
