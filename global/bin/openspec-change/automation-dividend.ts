export type AutomationDividendMode = "required" | "exempt";

export type AutomationDividendParse =
  | { status: "missing" }
  | { status: "duplicate"; count: number }
  | { status: "malformed"; reason: string }
  | { status: "ok"; mode: AutomationDividendMode; text: string };

const DECLARATION = /^\s*-\s+\*\*Automation Dividend\*\*:\s*(.*)$/gmu;
const VALUE = /^(required|exempt)\s+-\s+(\S.*)$/u;
export const AUTOMATION_DIVIDEND_TOKEN = "[automation-dividend]";

export function parseAutomationDividend(proposalText: string): AutomationDividendParse {
  const matches = [...proposalText.matchAll(DECLARATION)].map((match) => (match[1] ?? "").trim());
  if (matches.length === 0) return { status: "missing" };
  if (matches.length > 1) return { status: "duplicate", count: matches.length };
  const value = matches[0] ?? "";
  const parsed = VALUE.exec(value);
  if (parsed == null) return { status: "malformed", reason: "Declaration must be 'required - <candidate>' or 'exempt - <reason>'." };
  return { status: "ok", mode: parsed[1] as AutomationDividendMode, text: parsed[2] ?? "" };
}

export function automationDividendTasks(tasksText: string): Array<{ checked: boolean; text: string }> {
  const rows: Array<{ checked: boolean; text: string }> = [];
  for (const line of tasksText.split(/\r?\n/)) {
    const match = /^\s*[-*]\s+\[([ xX])\]\s+(.*)$/u.exec(line);
    if (match == null) continue;
    const text = match[2] ?? "";
    if (!/^\d+(?:\.\d+)*\s+\[automation-dividend\](?:\s|$)/u.test(text)) continue;
    rows.push({ checked: match[1] !== " ", text });
  }
  return rows;
}
