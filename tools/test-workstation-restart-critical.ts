#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const controllerPath = path.join(root, "tools", "windows", "opencode-workstation.ts");
const source = fs.readFileSync(controllerPath, "utf8");

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function extractFunction(name: string): string {
  const start = source.indexOf(`function ${name}(`);
  assert(start >= 0, `Controller must define ${name}.`);
  const brace = source.indexOf("{", start);
  assert(brace >= 0, `${name} must have a body.`);
  let depth = 0;
  for (let index = brace; index < source.length; index += 1) {
    const char = source[index];
    if (char === "{") depth += 1;
    else if (char === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }
  throw new Error(`${name} body is unclosed.`);
}

const tests = [
  {
    name: "targeted stop never issues taskkill /T and treats already-gone as success",
    run: () => {
      const terminateSource = extractFunction("terminateValidatedProcess");
      assert(!/\/T/.test(terminateSource), "terminateValidatedProcess must not use taskkill /T.");
      assert(!/\/T/.test(extractFunction("stopManagedServer")), "stopManagedServer must not reintroduce /T.");
      assert(!/\/T/.test(extractFunction("serve")), "serve child termination must not use /T.");
      assert(!/taskkill\.exe", \["\/T"/.test(source) && !/\/T", "\/F"/.test(source) && !/\/T \/F/.test(source), "Controller must not issue tree kill.");

      const calls: Array<{ bin: string; args: string[] }> = [];
      const alive = new Set<number>();
      const terminate = new Function(
        "processAlive",
        "spawnSync",
        `${terminateSource}; return terminateValidatedProcess;`,
      )(
        (processId: number) => alive.has(processId),
        (bin: string, args: string[]) => {
          calls.push({ bin, args });
          if (args[1] === "4242") alive.delete(4242);
          return { status: 128, stderr: "already gone", stdout: "", error: undefined };
        },
      ) as (processId: number) => { processId: number; status: string; taskkillStatus?: number };

      assert(terminate(Number.NaN).status === "already-gone", "Non-integer PID must count as already-gone.");
      assert(terminate(4242).status === "already-gone", "Dead validated PID must count as already-gone.");
      assert(calls.length === 0, "Already-gone must not invoke taskkill.");

      alive.add(4242);
      const stopped = terminate(4242);
      assert(stopped.status === "stopped", "Gone after taskkill 128 must count as stopped, not failure.");
      assert(calls.length === 1 && calls[0]?.bin === "taskkill.exe", "Live PID must use taskkill.exe.");
      assert(JSON.stringify(calls[0]?.args) === JSON.stringify(["/PID", "4242", "/F"]), "Kill must be /PID /F only.");

      alive.add(99);
      let thrown: unknown;
      try {
        terminate(99);
      } catch (error) {
        thrown = error;
      }
      assert(thrown instanceof Error && /still alive/.test(thrown.message), "Still-live validated PID after non-zero taskkill must fail closed.");
      assert(thrown instanceof Error && !/password|OPENCODE_SERVER_PASSWORD|GRAPHIFY_API_KEY/i.test(thrown.message), "Terminator failure must stay secret-free.");
    },
  },
  {
    name: "unmatched 4096 owner is not classified as a leftover to kill",
    run: () => {
      const leftover = new Function(
        "processObservation",
        "listenerOwnedByServerRoot",
        `${extractFunction("leftoverManagedListener")}; return leftoverManagedListener;`,
      )(
        (processId: number) => {
          if (processId === 7001) return { parentProcessId: 5000 };
          if (processId === 7002) return { parentProcessId: 8000 };
          if (processId === 7003) throw new Error("observation failed");
          return { parentProcessId: 1 };
        },
        (listenerProcessId: number, serverRootProcessId: number) => listenerProcessId === 7004 && serverRootProcessId === 5000,
      ) as (
        listener: { processId?: number },
        serverRoot: { processId: number },
        supervisor: { processId: number },
        expectedListener?: { processId: number },
      ) => boolean;

      const serverRoot = { processId: 5000 };
      const supervisor = { processId: 8000 };
      const expected = { processId: 6000 };
      assert(leftover({ processId: 9001 }, serverRoot, supervisor, expected) === false, "Unrelated listener must not be leftover.");
      assert(leftover({ processId: 7001 }, serverRoot, supervisor, expected) === true, "Direct child of server-root is leftover.");
      assert(leftover({ processId: 7002 }, serverRoot, supervisor, expected) === true, "Direct child of supervisor is leftover.");
      assert(leftover({ processId: 7003 }, serverRoot, supervisor, expected) === false, "Observation failure must not authorize a kill.");
      assert(leftover({ processId: 7004 }, serverRoot, supervisor, expected) === true, "Documented descendant leftover must remain collectable.");
      assert(leftover({ processId: 6000 }, serverRoot, supervisor, expected) === true, "Recorded listener PID may be retried.");
      assert(leftover({ processId: Number.NaN }, serverRoot, supervisor, expected) === false, "Invalid listener PID must not be leftover.");
    },
  },
  {
    name: "starting-state stop is accepted and unmatched owners fail before any kill",
    run: () => {
      const stopState = extractFunction("validateManagedStopState");
      assert(stopState.includes('state.status !== "starting"'), "Stop/Restart must accept matching starting state.");
      const notRunningBranch = stopState.slice(stopState.indexOf('snapshot.task.state !== "Running"'), stopState.indexOf("const state = readManagedTaskState"));
      assert(notRunningBranch.includes("Current port owner does not match the managed listener identity."), "Non-running task with a current listener must report ownership mismatch before state load.");
      const stopBody = extractFunction("stopManagedServer");
      assert(stopBody.indexOf("validateManagedStopState") < stopBody.indexOf("terminateValidatedProcess"), "No process kill before stop-state validation.");
      assert(stopBody.indexOf("validated.serverRoot.processId") < stopBody.indexOf("validated.listener?.processId"), "Server-root must be recorded before listener.");
      assert(stopBody.includes("Listener remained after managed stop") === false, "Stop itself must not start a replacement.");
      const restartBody = extractFunction("restart");
      assert(restartBody.includes("Listener remained after managed stop; refusing replacement."), "Restart must refuse replacement while any 4096 owner remains.");
      assert(restartBody.includes("startServerTask()") && restartBody.indexOf("await stopManagedServer()") < restartBody.indexOf("startServerTask()"), "Replacement start must follow stop.");
    },
  },
  {
    name: "tray failure stays red, names the log, and does not treat a leftover listener as success",
    run: () => {
      const tray = extractFunction("managedTrayScriptContents");
      assert(tray.includes("ShowBalloonTip"), "Failed tray Restart must show a balloon.");
      assert(tray.includes("controller-errors.log"), "Balloon must name controller-errors.log.");
      assert(tray.includes("$label (restart failed)"), "Failed Restart tooltip must stay restart-failed.");
      assert(tray.includes("Write-LampState 'red'"), "Failed Restart must persist red lamp state.");
      assert(/if \(\$code -eq 0 -and \(Test-ServerListening\)\)/.test(tray), "Green return requires both exit 0 and identity-matched listen.");
      assert(tray.includes("[int]$openCode.OwningProcess -eq [int]$state.listeners[0].processId"), "Port listen alone must not count as healthy replacement.");
      assert((tray.match(/Start-ControllerAsync 'start'/g) ?? []).length === 1, "Tray must launch Start only at host startup, never after Restart failure.");
      assert(tray.includes("if ($script:phase -eq 'restarting' -or $script:phase -eq 'exiting') { return }"), "In-flight Restart must ignore a second click.");
      assert(!/OPENCODE_SERVER_PASSWORD|GRAPHIFY_API_KEY|server-password|graphify-api-key/.test(tray), "Tray script must not receive or name credential material.");
    },
  },
  {
    name: "Desktop serve kill stays silent and operator Restart keeps the secret-free dialog",
    run: () => {
      const invoker = extractFunction("managedInvokerContents");
      assert(invoker.includes('LCase(WScript.Arguments(0)) <> \\"serve\\"'), "Serve-task termination must not show the operator dialog.");
      assert(invoker.includes("controller-errors.log"), "Desktop operator failure must name the same log.");
      assert(!/OPENCODE_SERVER_PASSWORD|password/.test(invoker), "Invoker dialog must stay secret-free.");
    },
  },
];

let failed = 0;
for (const test of tests) {
  try {
    test.run();
    console.log(`PASS ${test.name}`);
  } catch (error) {
    failed += 1;
    console.error(`FAIL ${test.name}`);
    console.error(error instanceof Error ? error.message : String(error));
  }
}

if (failed > 0) process.exit(1);
console.log(`OK: workstation restart critical tests=${tests.length}`);
