import { currentFormatter } from "./current.ts";

export function createFormatter(): (value: string) => string {
  return currentFormatter;
}
