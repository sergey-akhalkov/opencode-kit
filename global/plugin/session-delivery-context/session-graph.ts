import { hasColumns, quoteIdent, selectColumnOrNull } from "./db.ts";
import type { DbSchema, SessionRow } from "./db-types.ts";
import type { SqliteDatabase } from "./sqlite.ts";

export const SESSION_GRAPH_ROW_LIMIT = 512;
export const SESSION_GRAPH_DEPTH_LIMIT = 16;
export const SESSION_GRAPH_SURFACE = "descendants.graph";

export type SessionGraphLookup = "indexed" | "capability-blocked" | "unsupported";
export type SessionGraphReason = "ok" | "capability-blocked" | "row-limit" | "depth-limit" | "unsupported";

export type SessionGraphCapability = {
  idLookup: SessionGraphLookup;
  parentLookup: SessionGraphLookup;
  queryPlan: Array<Record<string, unknown>>;
};

export type SessionGraphWalk = {
  capability: SessionGraphCapability;
  complete: boolean;
  maxDepth: number;
  omitted: number;
  reason: SessionGraphReason;
  rows: SessionRow[];
};

type IndexListRow = { name: unknown };
type IndexInfoRow = { name: unknown; seqno: unknown };
type TableInfoRow = { name: unknown; pk: unknown };

function identifier(value: unknown): string {
  return quoteIdent(String(value));
}

function explain(db: SqliteDatabase, sql: string): Array<Record<string, unknown>> {
  return db.prepare(`explain query plan ${sql}`).all("capability-probe") as Array<Record<string, unknown>>;
}

function indexCovers(db: SqliteDatabase, table: string, column: string): boolean {
  const tableInfo = db.prepare(`pragma table_info(${quoteIdent(table)})`).all() as TableInfoRow[];
  if (tableInfo.some((row) => String(row.name) === column && Number(row.pk) > 0)) {
    return true;
  }
  const indexes = db.prepare(`pragma index_list(${quoteIdent(table)})`).all() as IndexListRow[];
  return indexes.some((index) => {
    const columns = db.prepare(`pragma index_info(${identifier(index.name)})`).all() as IndexInfoRow[];
    const first = columns.find((row) => Number(row.seqno) === 0);
    return first != null && String(first.name) === column;
  });
}

function lookupState(supported: boolean, indexed: boolean): SessionGraphLookup {
  if (!supported) return "unsupported";
  return indexed ? "indexed" : "capability-blocked";
}

export function inspectSessionGraphCapability(db: SqliteDatabase, schema: DbSchema): SessionGraphCapability {
  const hasId = hasColumns(schema, "session", ["id"]);
  const hasParent = hasColumns(schema, "session", ["parent_id"]);
  const queryPlan = [
    ...(hasId ? explain(db, "select id from session where id = ?") : []),
    ...(hasParent ? explain(db, "select id from session where parent_id = ?") : []),
  ];
  return {
    idLookup: lookupState(hasId, hasId && indexCovers(db, "session", "id")),
    parentLookup: lookupState(hasParent, hasParent && indexCovers(db, "session", "parent_id")),
    queryPlan,
  };
}

function sessionSelectList(schema: DbSchema): string {
  return [
    quoteIdent("id"),
    selectColumnOrNull(schema, "session", "parent_id"),
    selectColumnOrNull(schema, "session", "metadata"),
    selectColumnOrNull(schema, "session", "agent"),
    selectColumnOrNull(schema, "session", "time_created"),
    selectColumnOrNull(schema, "session", "time_updated"),
  ].join(", ");
}

function sessionOrderBy(schema: DbSchema): string {
  return schema.get("session")?.has("time_created") === true ? "time_created, id" : "id";
}

function blockedWalk(capability: SessionGraphCapability, reason: SessionGraphReason): SessionGraphWalk {
  return {
    capability,
    complete: false,
    maxDepth: 0,
    omitted: reason === "capability-blocked" ? 1 : 0,
    reason,
    rows: [],
  };
}

export function collectSessionGraph(
  db: SqliteDatabase,
  schema: DbSchema,
  rootId: string,
): SessionGraphWalk {
  const capability = inspectSessionGraphCapability(db, schema);
  if (capability.parentLookup === "unsupported" || capability.idLookup === "unsupported") {
    return blockedWalk(capability, "unsupported");
  }
  if (capability.parentLookup !== "indexed" || capability.idLookup !== "indexed") {
    return blockedWalk(capability, "capability-blocked");
  }
  const selectSql = `select ${sessionSelectList(schema)} from session where parent_id = ? order by ${sessionOrderBy(schema)}`;
  const rows: SessionRow[] = [];
  const seen = new Set<string>([rootId]);
  const queue: Array<{ id: string; depth: number }> = [{ id: rootId, depth: 0 }];
  let omitted = 0;
  let maxDepth = 0;
  let reason: SessionGraphReason = "ok";
  while (queue.length > 0) {
    const current = queue.shift();
    if (current == null) break;
    const children = db.prepare(selectSql).all(current.id) as SessionRow[];
    const nextDepth = current.depth + 1;
    if (nextDepth > SESSION_GRAPH_DEPTH_LIMIT) {
      omitted += children.length;
      reason = "depth-limit";
      continue;
    }
    for (const child of children) {
      const id = String(child.id);
      if (seen.has(id)) continue;
      if (rows.length >= SESSION_GRAPH_ROW_LIMIT) {
        omitted += 1;
        reason = "row-limit";
        continue;
      }
      seen.add(id);
      rows.push(child);
      maxDepth = Math.max(maxDepth, nextDepth);
      queue.push({ id, depth: nextDepth });
    }
  }
  return {
    capability,
    complete: omitted === 0 && reason === "ok",
    maxDepth,
    omitted,
    reason,
    rows,
  };
}

export function queryPlanHasFullScan(plan: Array<Record<string, unknown>>): boolean {
  return plan.some((row) => {
    const detail = String(row.detail ?? "").toLowerCase();
    return detail.includes("scan") && !detail.includes("search");
  });
}
