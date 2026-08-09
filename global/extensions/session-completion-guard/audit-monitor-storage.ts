import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  openReadOnlyDatabase,
  type SqliteDatabase,
} from "../../plugin/session-delivery-context/sqlite.ts";

type SessionRow = {
  id: unknown;
  metadata: unknown;
  model: unknown;
  time_updated: unknown;
};

export type MonitorSession = {
  id: string;
  metadata: Record<string, unknown>;
  model: { id: string; providerID: string; variant?: string } | null;
  time: { updated: number };
};

export type MonitorSnapshot = {
  children: MonitorSession[];
  root: MonitorSession | null;
};

function record(value: unknown): Record<string, unknown> | null {
  if (value != null && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value !== "string" || value === "") return null;
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed != null && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : null;
  } catch {
    return null;
  }
}

function session(row: SessionRow): MonitorSession {
  const model = record(row.model);
  const id = typeof model?.id === "string" ? model.id : "";
  const providerID = typeof model?.providerID === "string" ? model.providerID : "";
  const variant = typeof model?.variant === "string" ? model.variant : undefined;
  return {
    id: String(row.id),
    metadata: record(row.metadata) ?? {},
    model: id === "" || providerID === "" ? null : { id, providerID, ...(variant == null ? {} : { variant }) },
    time: { updated: typeof row.time_updated === "number" ? row.time_updated : 0 },
  };
}

function candidateDatabasePaths(environment: NodeJS.ProcessEnv): string[] {
  const home = environment.USERPROFILE ?? environment.HOME ?? os.homedir();
  const directories = [
    environment.OPENCODE_DATA_DIR,
    environment.XDG_DATA_HOME == null ? null : path.join(environment.XDG_DATA_HOME, "opencode"),
    path.join(home, ".local", "share", "opencode"),
    environment.LOCALAPPDATA == null ? null : path.join(environment.LOCALAPPDATA, "opencode"),
    environment.APPDATA == null ? null : path.join(environment.APPDATA, "opencode"),
    path.join(home, "Library", "Application Support", "opencode"),
  ];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const directory of directories) {
    if (directory == null || directory === "") continue;
    const databasePath = path.resolve(directory, "opencode.db");
    const key = process.platform === "win32" ? databasePath.toLowerCase() : databasePath;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(databasePath);
  }
  return result;
}

export function findMonitorDatabasePath(
  rootSessionID: string,
  environment: NodeJS.ProcessEnv = process.env,
): string {
  for (const databasePath of candidateDatabasePaths(environment)) {
    if (!fs.existsSync(databasePath)) continue;
    let database: SqliteDatabase | null = null;
    try {
      database = openReadOnlyDatabase(databasePath);
      const root = database.prepare("select id from session where id = ?").get(rootSessionID);
      if (root != null) return databasePath;
    } catch {
      // A different or incompatible local database is not this root's source.
    } finally {
      database?.close();
    }
  }
  throw new Error("OpenCode session database was not found for the guard monitor root");
}

export function openMonitorStorage(databasePath: string): {
  close(): void;
  read(rootSessionID: string): MonitorSnapshot;
} {
  if (!path.isAbsolute(databasePath) || path.basename(databasePath).toLowerCase() !== "opencode.db") {
    throw new Error("Guard monitor database path was invalid");
  }
  const database = openReadOnlyDatabase(databasePath);
  return {
    close: () => database.close(),
    read: (rootSessionID) => {
      const root = database.prepare(
        "select id, metadata, model, time_updated from session where id = ?",
      ).get(rootSessionID) as SessionRow | undefined;
      if (root == null) return { children: [], root: null };
      const children = database.prepare(
        "select id, metadata, model, time_updated from session where parent_id = ? order by time_updated desc, id",
      ).all(rootSessionID) as SessionRow[];
      return { children: children.map(session), root: session(root) };
    },
  };
}
