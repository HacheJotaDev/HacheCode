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

// ─────────────────────────────────────────────
// Strategy 1: OpenAI-compatible API
// Works with: OpenAI, ChatGLM, Groq, Together, etc.
// Requires: API_BASE_URL + API_KEY env vars
// ─────────────────────────────────────────────
async function streamOpenAICompatible(
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

  const body: Record<string, unknown> = {
    model: config.model,
    messages: apiMessages,
    stream: true,
  };

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(`API request failed (${response.status}): ${errorText}`);
  }

  return response;
}

function createSSEStreamFromOpenAI(
  upstreamResponse: Response,
  model: string
): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
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

        if (totalContent) {
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
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (error) {
        console.error("Stream error:", error);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", error: "Stream interrupted" })}\n\n`
          )
        );
        controller.close();
      }
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

// ─────────────────────────────────────────────
// Strategy 2: Z.ai SDK (works inside Z.ai codespace)
// No env vars needed - SDK handles auth internally
// ─────────────────────────────────────────────
async function handleWithZaiSDK(
  apiMessages: { role: string; content: string }[],
  model: string
): Promise<Response> {
  // Import Z.ai SDK - available as project dependency (works in Z.ai codespace)
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

  // Return as SSE stream so the frontend gets consistent format
  const encoder = new TextEncoder();
  const usage = completion.usage;
  const promptTokens = usage?.prompt_tokens || 0;
  const completionTokens = usage?.completion_tokens || 0;

  const sseStream = new ReadableStream({
    start(controller) {
      // Send the full content as one delta
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ type: "delta", content })}\n\n`
        )
      );

      // Send done event
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({
            type: "done",
            content,
            usage: {
              promptTokens,
              completionTokens,
              totalTokens: promptTokens + completionTokens,
            },
            model: completion.model || model,
          })}\n\n`
        )
      );

      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(sseStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

// ─────────────────────────────────────────────
// Main POST handler with fallback chain
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

    // ── Strategy 1: OpenAI-compatible API ──
    const baseUrl = process.env.API_BASE_URL;
    const apiKey = process.env.API_KEY;

    if (baseUrl && apiKey) {
      console.log("[Chat] Using OpenAI-compatible API:", baseUrl);
      try {
        const upstreamResponse = await streamOpenAICompatible(apiMessages, {
          baseUrl,
          apiKey,
          model: apiModel,
        });
        return createSSEStreamFromOpenAI(upstreamResponse, apiModel);
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
          "No se pudo conectar con ninguna API. Configura API_BASE_URL y API_KEY para deploy externo, o ejecuta dentro de Z.ai.",
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
