export type SqliteStatement = {
  all(...parameters: unknown[]): unknown[];
  get(...parameters: unknown[]): unknown;
};

export type SqliteDatabase = {
  close(): void;
  prepare(sql: string): SqliteStatement;
};

type DatabaseConstructor = new (
  filename: string,
  options: Record<string, boolean>,
) => SqliteDatabase;

const bunRuntime = "Bun" in globalThis;
const sqliteModuleName = bunRuntime ? "bun:sqlite" : "node:sqlite";
const sqliteModule = await import(sqliteModuleName) as Record<string, unknown>;
const Database = (bunRuntime ? sqliteModule.Database : sqliteModule.DatabaseSync) as DatabaseConstructor;

export function openReadOnlyDatabase(filename: string): SqliteDatabase {
  return new Database(filename, bunRuntime
    ? { create: false, readonly: true }
    : { readOnly: true });
}
