export const SKILL_NAME_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export const SKILL_DESCRIPTION_MAX_CHARS = 1024;

export const SKILL_TRIGGER_PATTERN = /\bUse this (skill|helper)\b/i;

export const SKILL_OUTPUT_CONTRACT_PATTERN = /(^## Output\b|^## Output Shapes\b|^## Minimal Ledger\b|^Workers return:|\bReturn:|\bReturn\s+)/m;