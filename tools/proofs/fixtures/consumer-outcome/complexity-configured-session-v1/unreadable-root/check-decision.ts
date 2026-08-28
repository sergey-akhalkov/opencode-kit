import { spawnSync } from "node:child_process";
import fs from "node:fs";

const caseRecord = JSON.parse(fs.readFileSync("case.json", "utf8"));
const observation = JSON.parse(fs.readFileSync("decision.json", "utf8"));
const argv = caseRecord.representativeProof.split(" ");
const proof = spawnSync(argv[0], argv.slice(1), { encoding: "utf8" });
if (proof.status !== 0) {
  process.stderr.write(proof.stderr || proof.stdout);
  process.exit(proof.status ?? 1);
}
process.stdout.write(`${JSON.stringify({
  observation,
  representativeProof: { argv, status: proof.status, stderr: proof.stderr, stdout: proof.stdout },
})}\n`);
