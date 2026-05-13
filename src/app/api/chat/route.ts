export const maxDuration = 60;
export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `Eres Hache Code, un asistente de programación agéntico avanzado. Ayudas a desarrolladores a escribir, depurar y entender código.

Comportamientos clave:
- Responde en ESPAÑOL siempre
- Sé conciso y técnico, pero explicativo cuando sea necesario
- Formatea código con bloques markdown incluyendo identificadores de lenguaje
- Cuando sugieras cambios en archivos, muestra el código exacto con syntax highlighting
- Divide tareas complejas en pasos claros y numerados
- Explica tu razonamiento brevemente antes de sugerir código
- Cuando generes código, inclúyelo siempre en bloques de código markdown con el lenguaje especificado
- Si el usuario pide crear algo, genera el código completo y funcional

Tus respuestas deben ser útiles, precisas y formateadas para máxima legibilidad.`;

interface ChatMessageInput {
  role: string;
  content: string;
}

// Helper: Create SSE response from our standard format
function createSSEStream(
  generator: (controller: ReadableStreamDefaultController, encoder: TextEncoder) => Promise<void>
): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      await generator(controller, encoder);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

// Helper: Send delta + done + [DONE] events
function sendSSEEvents(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  totalContent: string,
  model: string,
  promptTokens: number,
  completionTokens: number
) {
  controller.enqueue(
    encoder.encode(
      `data: ${JSON.stringify({
        type: "done",
        content: totalContent,
        usage: {
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens,
        },
        model,
      })}\n\n`
    )
  );
  controller.enqueue(encoder.encode("data: [DONE]\n\n"));
  controller.close();
}

// ─────────────────────────────────────────────
// Strategy 0: Anthropic Claude API
// Uses @anthropic-ai/sdk with streaming
// Requires: ANTHROPIC_API_KEY env var
// ─────────────────────────────────────────────
async function handleWithAnthropic(
  apiMessages: { role: string; content: string }[],
  model: string
): Promise<Response> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const apiKey = process.env.ANTHROPIC_API_KEY!;

  const client = new Anthropic({ apiKey });

  // Extract system prompt and convert messages to Anthropic format
  const systemMessage = apiMessages.find((m) => m.role === "system")?.content || "";
  const chatMessages = apiMessages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

  const stream = client.messages.stream({
    model,
    max_tokens: 4096,
    system: systemMessage,
    messages: chatMessages,
  });

  return createSSEStream(async (controller, encoder) => {
    let totalContent = "";
    let inputTokens = 0;
    let outputTokens = 0;

    try {
      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta?.type === "text_delta") {
          const delta = event.delta.text;
          if (delta) {
            totalContent += delta;
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "delta", content: delta })}\n\n`
              )
            );
          }
        }

        if (event.type === "message_start" && event.message?.usage) {
          inputTokens = event.message.usage.input_tokens || 0;
        }

        if (event.type === "message_delta" && event.usage) {
          outputTokens = event.usage.output_tokens || 0;
        }
      }

      sendSSEEvents(controller, encoder, totalContent, model, inputTokens, outputTokens);
    } catch (error) {
      console.error("[Anthropic] Stream error:", error);
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ type: "error", error: "Stream interrumpido" })}\n\n`
        )
      );
      controller.close();
    }
  });
}

// ─────────────────────────────────────────────
// Strategy 1: OpenAI-compatible API
// Works with: OpenAI, ChatGLM, Groq, Together, etc.
// Requires: API_BASE_URL + API_KEY env vars
// ─────────────────────────────────────────────
async function handleWithOpenAICompatible(
  apiMessages: { role: string; content: string }[],
  config: {
    baseUrl: string;
    apiKey: string;
    model: string;
  }
): Promise<Response> {
  const url = `${config.baseUrl}/chat/completions`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${config.apiKey}`,
  };

  const body = JSON.stringify({
    model: config.model,
    messages: apiMessages,
    stream: true,
  });

  const upstreamResponse = await fetch(url, {
    method: "POST",
    headers,
    body,
  });

  if (!upstreamResponse.ok) {
    const errorText = await upstreamResponse.text().catch(() => "Unknown error");
    throw new Error(`API request failed (${upstreamResponse.status}): ${errorText}`);
  }

  return createSSEStream(async (controller, encoder) => {
    const reader = upstreamResponse.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let totalContent = "";
    let promptTokens = 0;
    let completionTokens = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === "data: [DONE]") continue;
          if (!trimmed.startsWith("data: ")) continue;

          try {
            const json = JSON.parse(trimmed.slice(6));
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) {
              totalContent += delta;
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "delta", content: delta })}\n\n`
                )
              );
            }

            if (json.usage) {
              promptTokens = json.usage.prompt_tokens || 0;
              completionTokens = json.usage.completion_tokens || 0;
            }
          } catch {
            // Skip malformed JSON chunks
          }
        }
      }

      sendSSEEvents(controller, encoder, totalContent, config.model, promptTokens, completionTokens);
    } catch (error) {
      console.error("[OpenAI] Stream error:", error);
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ type: "error", error: "Stream interrumpido" })}\n\n`
        )
      );
      controller.close();
    }
  });
}

// ─────────────────────────────────────────────
// Strategy 2: Z.ai SDK (works inside Z.ai codespace)
// No env vars needed - SDK handles auth internally
// ─────────────────────────────────────────────
async function handleWithZaiSDK(
  apiMessages: { role: string; content: string }[],
  model: string
): Promise<Response> {
  const ZAI = (await import("z-ai-web-dev-sdk")).default;
  const zai = await ZAI.create();

  const completion = await zai.chat.completions.create({
    messages: apiMessages as { role: "system" | "user" | "assistant"; content: string }[],
    stream: false,
  });

  const content = completion.choices?.[0]?.message?.content || "";

  if (!content) {
    throw new Error("SDK: respuesta vacía");
  }

  const usage = completion.usage;
  const promptTokens = usage?.prompt_tokens || 0;
  const completionTokens = usage?.completion_tokens || 0;

  return createSSEStream(async (controller, encoder) => {
    // Send full content as one delta (non-streaming SDK)
    controller.enqueue(
      encoder.encode(
        `data: ${JSON.stringify({ type: "delta", content })}\n\n`
      )
    );

    sendSSEEvents(
      controller,
      encoder,
      content,
      completion.model || model,
      promptTokens,
      completionTokens
    );
  });
}

// ─────────────────────────────────────────────
// Detect if model is an Anthropic model
// ─────────────────────────────────────────────
function isAnthropicModel(model: string): boolean {
  return model.startsWith("claude-");
}

// ─────────────────────────────────────────────
// Main POST handler with 3-strategy fallback
// ─────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages, model } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json(
        { error: "Se requiere un array de mensajes válido" },
        { status: 400 }
      );
    }

    const recentMessages = messages.slice(-20) as ChatMessageInput[];

    const apiMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...recentMessages.map((m: ChatMessageInput) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    const apiModel = process.env.API_MODEL || model || "glm-4-plus";

    // ── Strategy 0: Anthropic Claude API ──
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (anthropicKey && isAnthropicModel(apiModel)) {
      console.log("[Chat] Using Anthropic Claude API, model:", apiModel);
      try {
        return await handleWithAnthropic(apiMessages, apiModel);
      } catch (apiError) {
        console.error("[Chat] Anthropic API failed:", apiError);
        // Fall through to next strategy
      }
    }

    // ── Strategy 1: OpenAI-compatible API ──
    const baseUrl = process.env.API_BASE_URL;
    const apiKey = process.env.API_KEY;

    if (baseUrl && apiKey) {
      console.log("[Chat] Using OpenAI-compatible API:", baseUrl);
      try {
        return await handleWithOpenAICompatible(apiMessages, {
          baseUrl,
          apiKey,
          model: apiModel,
        });
      } catch (apiError) {
        console.error("[Chat] OpenAI API failed:", apiError);
        // Fall through to SDK
      }
    }

    // ── Strategy 2: Z.ai SDK (codespace) ──
    try {
      console.log("[Chat] Trying Z.ai SDK fallback...");
      return await handleWithZaiSDK(apiMessages, apiModel);
    } catch (sdkError) {
      console.error("[Chat] Z.ai SDK failed:", sdkError);
      // Fall through to error
    }

    // ── No strategy worked ──
    return Response.json(
      {
        error:
          "No se pudo conectar con ninguna API. Configura ANTHROPIC_API_KEY (Claude), API_BASE_URL+API_KEY (OpenAI), o ejecuta dentro de Z.ai.",
      },
      { status: 500 }
    );
  } catch (error: unknown) {
    console.error("Chat API error:", error);
    const message =
      error instanceof Error ? error.message : "Error desconocido";
    return Response.json(
      { error: `Error al generar respuesta: ${message}` },
      { status: 500 }
    );
  }
}
