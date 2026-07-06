// Communication with the słowik chat backend.
// Kept 1:1 with the previous site: POST the full conversation, get { message } back.
// The backend (Express @ chat-api.krystianslowik.com) adds the system prompt,
// rate-limits, and logs — the browser never talks to a model vendor directly.

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

const CHAT_API_URL =
  import.meta.env.PUBLIC_CHAT_API_URL ?? "https://chat-api.krystianslowik.com/chat";

/** Carries the backend's own error text (e.g. the rate limiter's human-check). */
export class ChatApiError extends Error {
  constructor(
    public status: number,
    public apiMessage?: string,
  ) {
    super(`chat-api responded ${status}`);
    this.name = "ChatApiError";
  }
}

export async function sendChat(
  conversation: ChatMessage[],
  signal?: AbortSignal,
): Promise<string> {
  const response = await fetch(CHAT_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conversation }),
    signal,
  });

  if (!response.ok) {
    let apiMessage: string | undefined;
    try {
      const body = (await response.json()) as { error?: string };
      if (typeof body.error === "string") apiMessage = body.error;
    } catch {
      // non-JSON error body; keep the status-only error
    }
    throw new ChatApiError(response.status, apiMessage);
  }

  const data = (await response.json()) as { message?: string };
  if (typeof data.message !== "string") {
    throw new Error("chat-api returned an unexpected shape");
  }
  return data.message;
}
