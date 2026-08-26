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
    name: "tray green requires current endpoint health and failure stays red",
    run: () => {
      const tray = extractFunction("managedTrayScriptContents");
      assert(tray.includes("ShowBalloonTip"), "Failed tray Restart must show a balloon.");
      assert(tray.includes("controller-errors.log"), "Balloon must name controller-errors.log.");
      assert(tray.includes("$label (restart failed)"), "Failed Restart tooltip must stay restart-failed.");
      assert(tray.includes("Write-LampState 'red'"), "Failed Restart must persist red lamp state.");
      assert(!tray.includes("Invoke-WebRequest") && !tray.includes("Get-NetTCPConnection"), "Tray UI callbacks must not perform blocking network or listener probes.");
      assert(!tray.includes("Test-ServerIdentityAndChallenge"), "Lifecycle completion must wait for the asynchronous health child instead of blocking the UI thread.");
      assert(tray.includes("'tray-health-probe'") && tray.includes("$script:managedRuntimeHealthy"), "Green must require a recent complete runtime probe delegated to the protected controller.");
      assert(tray.includes("TotalSeconds -le 20") && tray.includes("TotalSeconds -ge 10"), "Authenticated tray health must have bounded cadence and freshness.");
      assert(tray.includes("$script:authenticatedHealthWorkerGeneration -eq $script:healthGeneration") && tray.includes("Invalidate-ManagedHealth"), "A stale probe generation must not turn a replacement runtime green.");
      assert((tray.match(/Start-ControllerAsync 'start'/g) ?? []).length === 2, "Tray may launch Start only at host startup and through bounded unexpected-exit recovery.");
      const restartFailure = tray.slice(tray.indexOf("if ($script:phase -eq 'restarting')"), tray.indexOf("$script:phase = 'idle'", tray.indexOf("if ($script:phase -eq 'restarting')") + 1));
      assert(!restartFailure.includes("Start-ControllerAsync 'start'"), "Explicit Restart failure must not trigger an automatic successor attempt.");
      assert(tray.includes("if ($script:phase -eq 'restarting' -or $script:phase -eq 'recovering' -or $script:phase -eq 'exiting') { return }"), "In-flight Restart or recovery must ignore a second click.");
      assert(tray.includes("Test-RecoverableServerExit") && tray.includes("[string]$state.status -ne 'exited'"), "Automatic recovery must require an unexpected exited state.");
      assert(tray.includes("$script:recoveryAttempts -ge 3") && tray.includes("AddMinutes(1)"), "Automatic recovery must be bounded to three attempts one minute apart.");
      assert(tray.includes("Invoke-Recovery") && tray.includes("Start-ControllerAsync 'start'"), "Idle tray monitoring must recover through the existing protected Start path.");
      assert(!/OPENCODE_SERVER_PASSWORD|GRAPHIFY_API_KEY|server-password|graphify-api-key/.test(tray), "Tray script must not receive or name credential material.");
    },
  },
  {
    name: "tray task removal closes the exact protected tray process",
    run: () => {
      const unregister = extractFunction("unregisterTrayTask");
      assert(unregister.includes('"command":"exit"'), "Tray removal must request graceful Exit first.");
      assert(unregister.indexOf('"command":"exit"') < unregister.indexOf("Stop-ScheduledTask"), "Graceful Exit must precede forced task stop.");
      assert(unregister.includes("$scriptArgument") && unregister.includes("CommandLine"), "Forced cleanup must match the protected tray script argument.");
      assert(unregister.includes("Stop-Process -Id ([int]$_.ProcessId) -Force"), "A bounded exact-process fallback must close an orphaned tray.");
      assert((unregister.match(/AddSeconds\(15\)/g) ?? []).length === 2, "Graceful and forced tray cleanup must each have a bounded shutdown window.");
      assert(unregister.includes("Managed tray process remained after task stop."), "Failed exact tray cleanup must fail closed.");
    },
  },
  {
    name: "Desktop serve kill stays silent and operator Restart keeps the secret-free dialog",
    run: () => {
      const invoker = extractFunction("managedInvokerContents");
      const serverTask = extractFunction("registerServerTask");
      const serviceLog = extractFunction("openManagedServiceLog");
      const serve = extractFunction("serve");
      const stop = extractFunction("stopManagedServer");
      const launch = extractFunction("launch");
      const waitForHealth = extractFunction("waitForValidatedManagedHealth");
      const healthProbe = extractFunction("healthProbe");
      const trayHealth = extractFunction("probeManagedRuntimeHealthForTray");
      const trayListeners = extractFunction("trayListenerSnapshot");
      const unauthorizedChallenge = extractFunction("unauthenticatedChallenge");
      assert(invoker.includes('LCase(WScript.Arguments(0)) <> \\"serve\\"'), "Serve-task termination must not show the operator dialog.");
      assert(invoker.includes("controller-errors.log"), "Desktop operator failure must name the same log.");
      assert(!/OPENCODE_SERVER_PASSWORD|password/.test(invoker), "Invoker dialog must stay secret-free.");
      assert(!serverTask.includes("-RestartCount"), "Recovery must not claim an ineffective demand-task RestartOnFailure policy.");
      assert((stop.match(/writeManagedStoppedState\(\)/g) ?? []).length === 2, "Explicit Stop must persist stopped state on both already-stopped and active cleanup paths.");
      assert(launch.includes("validateManagedRunningState(manifest, snapshot)"), "Launch must validate both managed listener identities before authenticated client handoff.");
      assert(!launch.includes("waitForValidatedManagedHealth"), "Launch must not reject a valid attach handoff because the authenticated health route is busy.");
      assert(waitForHealth.includes("const snapshot = initialSnapshot ?? windowsSnapshot()"), "Validated health wait must accept the launch snapshot while retaining a fresh fallback.");
      assert((waitForHealth.match(/validatedManagedHealth\(manifest, snapshot\)/g) ?? []).length === 2, "Validated health retries must reuse the checked snapshot instead of repeating the expensive host inventory.");
      assert(healthProbe.includes("timeoutMilliseconds = 10_000") && healthProbe.includes("controller.abort(), timeoutMilliseconds"), "Authenticated health must tolerate observed transient stalls without becoming unbounded.");
      assert(trayHealth.includes("healthProbe(readCredential())") && trayHealth.includes("protected installed controller"), "Tray health must delegate credential use to the protected installed controller.");
      assert(source.includes("const OPEN_CODE_PORT = 4096") && trayHealth.includes("OPEN_CODE_PORT"), "Tray health must use the declared OpenCode listener port.");
      assert(trayHealth.includes("trayListenerMatches") && trayHealth.includes("state.health?.healthy !== true"), "Tray health child must validate both recorded listener owners and supervisor readiness.");
      assert((trayHealth.match(/unauthenticatedChallenge\(/g) ?? []).length === 2, "Tray health child must verify both current authentication challenges.");
      assert(trayListeners.includes("Get-NetTCPConnection") && unauthorizedChallenge.includes("response.status === 401"), "Listener and challenge IO must remain in the protected child rather than the tray UI thread.");
      assert(serviceLog.includes(".previous") && serviceLog.includes("renameSync(currentPath, previousPath)"), "Replacement startup must preserve the prior service log generation.");
      assert((serve.match(/openManagedServiceLog\(/g) ?? []).length === 4, "OpenCode and Graphify stdout/stderr must all retain one previous generation.");
      assert(source.includes("recordedAt: new Date().toISOString()"), "Controller diagnostics must carry correlation time.");
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
