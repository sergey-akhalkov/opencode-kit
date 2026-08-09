import crypto from "node:crypto";
import net from "node:net";

const MAX_HANDOFF_BYTES = 32_768;
const DEFAULT_HANDOFF_TIMEOUT_MS = 12_000;
const PIPE_PATTERN = /^\\\\\.\\pipe\\opencode-guard-[0-9a-f]{48}$/;

export type MonitorConnection = {
  closePassedAfterMs: number;
  databasePath: string;
  rootSessionID: string;
};

export type MonitorHandoff = {
  close(): void;
  pipeName: string;
};

type HandoffCallbacks = {
  onDelivered?(): void;
  onError?(error: Error): void;
  onTimeout?(): void;
};

export async function openMonitorHandoff(
  connection: MonitorConnection,
  callbacks: HandoffCallbacks = {},
  timeoutMs = DEFAULT_HANDOFF_TIMEOUT_MS,
): Promise<MonitorHandoff> {
  const serialized = JSON.stringify(connection);
  if (Buffer.byteLength(serialized, "utf8") > MAX_HANDOFF_BYTES) {
    throw new Error("Guard monitor handoff exceeds the bounded payload limit");
  }
  const pipeName = `\\\\.\\pipe\\opencode-guard-${crypto.randomBytes(24).toString("hex")}`;
  let closed = false;
  let delivered = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const server = net.createServer((socket) => {
    if (delivered || closed) {
      socket.destroy();
      return;
    }
    delivered = true;
    if (timer != null) clearTimeout(timer);
    timer = null;
    socket.on("error", () => {});
    socket.end(serialized);
    server.close();
    callbacks.onDelivered?.();
  });
  const close = (): void => {
    if (closed) return;
    closed = true;
    if (timer != null) clearTimeout(timer);
    timer = null;
    server.close();
  };
  server.on("error", (error) => {
    callbacks.onError?.(error);
    close();
  });
  await new Promise<void>((resolve, reject) => {
    const onError = (error: Error): void => reject(error);
    server.once("error", onError);
    server.listen(pipeName, () => {
      server.off("error", onError);
      resolve();
    });
  });
  server.unref();
  timer = setTimeout(() => {
    callbacks.onTimeout?.();
    close();
  }, timeoutMs);
  timer.unref();
  return { close, pipeName };
}

export async function readMonitorHandoff(pipeName: string, timeoutMs = DEFAULT_HANDOFF_TIMEOUT_MS): Promise<MonitorConnection> {
  if (!PIPE_PATTERN.test(pipeName)) throw new Error("Invalid guard monitor handoff name");
  return new Promise<MonitorConnection>((resolve, reject) => {
    let settled = false;
    let bytes = 0;
    const chunks: Buffer[] = [];
    const socket = net.createConnection(pipeName);
    const finish = (error?: Error, value?: MonitorConnection): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      socket.destroy();
      if (error != null) reject(error);
      else resolve(value!);
    };
    const timer = setTimeout(() => finish(new Error("Guard monitor handoff timed out")), timeoutMs);
    timer.unref();
    socket.on("data", (chunk: Buffer) => {
      bytes += chunk.length;
      if (bytes > MAX_HANDOFF_BYTES) {
        finish(new Error("Guard monitor handoff exceeded the bounded payload limit"));
        return;
      }
      chunks.push(chunk);
    });
    socket.once("error", (error) => finish(error));
    socket.once("end", () => {
      try {
        finish(undefined, JSON.parse(Buffer.concat(chunks).toString("utf8")) as MonitorConnection);
      } catch {
        finish(new Error("Guard monitor handoff was not valid JSON"));
      }
    });
  });
}
