import { records } from "./store.ts";

export function inventoryFor(id: string): number {
  return records.get(id) ?? 0;
}
