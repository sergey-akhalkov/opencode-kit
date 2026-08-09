const ENGLISH_STOP = /\b(?:stop|pause|halt|wait|hold\s+on|stand\s+by|do\s+nothing|stop\s+working)\b/iu;
const RUSSIAN_STOP = /(?<![\p{L}\p{N}_])(?:стоп|пауза|остановись|останови(?:сь)?|приостанови|прекрати|хватит|подожди|ничего\s+не\s+делай)(?![\p{L}\p{N}_])/iu;
const ENGLISH_NEGATED = /\b(?:do\s+not|don't|dont|never|must\s+not|should\s+not|no\s+need\s+to)\s+(?:stop|pause|halt|wait)\b/iu;
const RUSSIAN_NEGATED = /(?<![\p{L}\p{N}_])(?:не|никогда\s+не|не\s+надо|не\s+нужно)\s+(?:останавливай(?:ся)?|останавливаться|остановись|ставь\s+на\s+паузу|прекращай|жди)(?![\p{L}\p{N}_])/iu;
const DISCUSSION = /(?<![\p{L}\p{N}_])(?:word|term|phrase|quote|quoted|discuss|means?|example|слово|термин|фраза|цитат\p{L}*|обсужд\p{L}*|означает|пример)(?![\p{L}\p{N}_])/iu;
const DIRECTIVE_CONTEXT = /(?<![\p{L}\p{N}_])(?:please|now|immediately|work|working|session|agent|пожалуйста|сейчас|работ\p{L}*|сесси\p{L}*)(?![\p{L}\p{N}_])/iu;

function withoutQuotedText(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/"[^"]*"/g, " ")
    .replace(/'[^']*'/g, " ")
    .replace(/«[^»]*»/g, " ");
}

export function isExplicitHumanStop(text: string): boolean {
  const normalized = withoutQuotedText(text).trim().toLowerCase();
  if (normalized === "" || ENGLISH_NEGATED.test(normalized) || RUSSIAN_NEGATED.test(normalized)) {
    return false;
  }
  const match = ENGLISH_STOP.exec(normalized) ?? RUSSIAN_STOP.exec(normalized);
  if (match == null || match.index == null) return false;
  const nearby = normalized.slice(Math.max(0, match.index - 60), Math.min(normalized.length, match.index + match[0].length + 60));
  if (DISCUSSION.test(nearby)) return false;
  return (
    match.index <= 24 ||
    DIRECTIVE_CONTEXT.test(nearby)
  );
}

export function isGuardSyntheticPart(part: Record<string, unknown>): boolean {
  const text = typeof part.text === "string" ? part.text : "";
  const metadata = part.metadata != null && typeof part.metadata === "object"
    ? (part.metadata as Record<string, unknown>)
    : {};
  return part.synthetic === true && (
    metadata.provenance === "completion-guard" ||
    /^<completion_guard\b/iu.test(text)
  );
}

export function syntheticAsyncMarker(text: string): "pty" | "task" | null {
  if (/<pty_exited\b/iu.test(text)) return "pty";
  if (/<task_(?:result|error)\b/iu.test(text)) return "task";
  return null;
}
