import type { NormalizedQuestion, NormalizedQuestionRequest } from "./types.ts";

const MAX_ANSWER_ROWS = 16;
const MAX_DESCRIPTION_CHARS = 2_000;
const MAX_HEADER_CHARS = 100;
const MAX_LABEL_CHARS = 200;
const MAX_OPTIONS = 32;
const MAX_QUESTION_CHARS = 4_000;
const MAX_QUESTIONS = 16;

function record(value: unknown): Record<string, unknown> | null {
  return value != null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function requiredString(value: unknown, field: string, max: number): string {
  if (typeof value !== "string" || value.trim() === "" || value.length > max) {
    throw new Error(`Invalid pending question field: ${field}`);
  }
  return value;
}

function normalizeQuestion(value: unknown, index: number): NormalizedQuestion {
  const input = record(value);
  if (input == null) throw new Error(`Invalid pending question field: questions[${index}]`);
  if (!Array.isArray(input.options) || input.options.length === 0 || input.options.length > MAX_OPTIONS) {
    throw new Error(`Invalid pending question field: questions[${index}].options`);
  }
  if (input.multiple != null && typeof input.multiple !== "boolean") {
    throw new Error(`Invalid pending question field: questions[${index}].multiple`);
  }
  if (input.custom != null && typeof input.custom !== "boolean") {
    throw new Error(`Invalid pending question field: questions[${index}].custom`);
  }
  const labels = new Set<string>();
  const options = input.options.map((value, optionIndex) => {
    const option = record(value);
    if (option == null) {
      throw new Error(`Invalid pending question field: questions[${index}].options[${optionIndex}]`);
    }
    const label = requiredString(
      option.label,
      `questions[${index}].options[${optionIndex}].label`,
      MAX_LABEL_CHARS,
    );
    if (labels.has(label)) {
      throw new Error(`Duplicate pending question option label: questions[${index}].options`);
    }
    labels.add(label);
    return {
      description: requiredString(
        option.description,
        `questions[${index}].options[${optionIndex}].description`,
        MAX_DESCRIPTION_CHARS,
      ),
      label,
    };
  });
  return {
    custom: input.custom !== false,
    header: requiredString(input.header, `questions[${index}].header`, MAX_HEADER_CHARS),
    multiple: input.multiple === true,
    options,
    question: requiredString(input.question, `questions[${index}].question`, MAX_QUESTION_CHARS),
  };
}

export function normalizeQuestionRequest(properties: Record<string, unknown>): NormalizedQuestionRequest {
  const requestID = typeof properties.id === "string" && properties.id !== ""
    ? properties.id
    : typeof properties.requestID === "string" && properties.requestID !== ""
      ? properties.requestID
      : null;
  if (requestID == null) throw new Error("Invalid pending question field: requestID");
  if (
    !Array.isArray(properties.questions) ||
    properties.questions.length === 0 ||
    properties.questions.length > MAX_QUESTIONS
  ) {
    throw new Error("Invalid pending question field: questions");
  }
  return {
    questions: properties.questions.map(normalizeQuestion),
    requestID,
    toolCallID: typeof record(properties.tool)?.callID === "string"
      ? String(record(properties.tool)?.callID)
      : null,
  };
}

export function validateQuestionAnswers(value: unknown, questions: NormalizedQuestion[]): string[][] {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_ANSWER_ROWS) {
    throw new Error("Invalid completion verdict field: questionAnswers");
  }
  if (value.length !== questions.length) {
    throw new Error("Question answer row count does not match the pending request");
  }
  return value.map((answer, index) => {
    const question = questions[index];
    if (question == null || question.options.length === 0 || !Array.isArray(answer)) {
      throw new Error(`Invalid completion verdict field: questionAnswers[${index}]`);
    }
    const expectedCount = question.multiple ? { min: 1, max: question.options.length } : { min: 1, max: 1 };
    if (answer.length < expectedCount.min || answer.length > expectedCount.max) {
      throw new Error(`Invalid completion verdict field: questionAnswers[${index}]`);
    }
    const offered = new Set(question.options.map((option) => option.label));
    const selected = new Set<string>();
    for (const label of answer) {
      if (typeof label !== "string" || !offered.has(label) || selected.has(label)) {
        throw new Error(`Invalid completion verdict field: questionAnswers[${index}]`);
      }
      selected.add(label);
    }
    return [...selected];
  });
}

export function questionRequestForArbiter(request: NormalizedQuestionRequest): Record<string, unknown> {
  return {
    mode: "pending_question",
    questions: request.questions,
  };
}
