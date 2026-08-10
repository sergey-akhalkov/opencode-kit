import {
  createOpencodeClient,
  type OpencodeClient,
  type Session,
} from "../../../global/node_modules/@opencode-ai/sdk/dist/v2/client.js";

export type ProofRoute = {
  agent: string;
  hidden: boolean;
  model: {
    modelID: string;
    providerID: string;
  };
  variant: string | null;
};

export type RoutedProofSessions = {
  child: Session;
  root: Session;
};

export async function requestData<T>(request: Promise<unknown>, label: string): Promise<T> {
  const response = await request as { data?: T; error?: unknown };
  if (response.error != null) {
    const error = new Error(`${label} failed`) as Error & { cause?: unknown };
    error.cause = response.error;
    throw error;
  }
  if (!("data" in response)) throw new Error(`${label} returned no data`);
  return response.data as T;
}

export function proofClient(baseUrl: string, directory: string): OpencodeClient {
  return createOpencodeClient({ baseUrl, directory });
}

function agentRows(payload: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(payload)) return payload.filter((value): value is Record<string, unknown> => value != null && typeof value === "object");
  if (payload != null && typeof payload === "object") {
    const data = (payload as { data?: unknown }).data;
    if (Array.isArray(data)) return data.filter((value): value is Record<string, unknown> => value != null && typeof value === "object");
  }
  throw new Error("agent.list returned an unsupported payload shape");
}

export async function resolveProofRoute(
  client: OpencodeClient,
  directory: string,
  agent: string,
): Promise<ProofRoute> {
  const payload = await requestData<unknown>(
    client.v2.agent.list({ location: { directory } }) as Promise<unknown>,
    "agent.list",
  );
  const rows = agentRows(payload);
  const row = rows.find((candidate) => candidate.id === agent);
  if (row == null) {
    const available = rows.flatMap((candidate) => typeof candidate.id === "string" ? [candidate.id] : []).sort();
    throw new Error(`Configured proof agent is unavailable: ${agent}; available=${available.join(",")}`);
  }
  const model = row.model as { id?: unknown; providerID?: unknown; variant?: unknown } | undefined;
  if (typeof model?.providerID !== "string" || typeof model.id !== "string") {
    throw new Error(`Configured proof agent has no model route: ${agent}`);
  }
  return {
    agent,
    hidden: row.hidden === true,
    model: { modelID: model.id, providerID: model.providerID },
    variant: typeof model.variant === "string" ? model.variant : null,
  };
}

export async function waitForProofRoute(
  client: OpencodeClient,
  directory: string,
  agent: string,
  timeoutMs = 5_000,
): Promise<ProofRoute> {
  const deadline = Date.now() + timeoutMs;
  let lastError: unknown = null;
  do {
    try {
      return await resolveProofRoute(client, directory, agent);
    } catch (error) {
      lastError = error;
      if (Date.now() >= deadline) break;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  } while (true);
  const error = new Error(`Proof agent route did not become ready within ${timeoutMs}ms`) as Error & { cause?: unknown };
  error.cause = lastError;
  throw error;
}

export async function disabledToolMap(
  client: OpencodeClient,
  directory: string,
): Promise<Record<string, boolean>> {
  const ids = await requestData<string[]>(client.tool.ids({ directory }) as Promise<unknown>, "tool.ids");
  return Object.fromEntries(ids.map((id) => [id, false]));
}

export async function createRoutedProofSessions(
  client: OpencodeClient,
  directory: string,
  route: ProofRoute,
  title: string,
): Promise<RoutedProofSessions> {
  const root = await requestData<Session>(client.session.create({
    directory,
    title: `${title} root`,
  }) as Promise<unknown>, "proof root create");
  try {
    const child = await requestData<Session>(client.session.create({
      agent: route.agent,
      directory,
      model: {
        id: route.model.modelID,
        providerID: route.model.providerID,
        ...(route.variant == null ? {} : { variant: route.variant }),
      },
      parentID: root.id,
      title: `${title} child`,
    }) as Promise<unknown>, "proof child create");
    return { child, root };
  } catch (error) {
    await client.session.delete({ directory, sessionID: root.id });
    throw error;
  }
}

export async function deleteProofSessions(
  client: OpencodeClient,
  directory: string,
  sessions: Partial<RoutedProofSessions>,
): Promise<void> {
  let cleanupError: unknown = null;
  for (const session of [sessions.child, sessions.root]) {
    if (session == null) continue;
    try {
      const response = await client.session.delete({ directory, sessionID: session.id }) as { error?: unknown };
      if (response.error != null) throw response.error;
    } catch (error) {
      cleanupError ??= error;
    }
  }
  if (cleanupError != null) {
    const error = new Error("Proof session cleanup failed") as Error & { cause?: unknown };
    error.cause = cleanupError;
    throw error;
  }
}
