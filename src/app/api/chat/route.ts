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

/**
 * Try using z-ai-web-dev-sdk (works in local Z.ai environment with auto-config)
 */
async function callWithSDK(
  apiMessages: { role: "user" | "assistant" | "system"; content: string }[]
) {
  const ZAI = (await import("z-ai-web-dev-sdk")).default;
  const zai = await ZAI.create();
  const completion = await zai.chat.completions.create({
    messages: apiMessages,
  });
  return completion;
}

/**
 * Stream chat completions using env vars (for Vercel and other cloud platforms)
 * Uses the same headers and format as z-ai-web-dev-sdk internally
 */
async function streamWithEnvVars(
  apiMessages: { role: string; content: string }[],
  config: { baseUrl: string; apiKey: string; chatId?: string; userId?: string; token?: string }
): Promise<Response> {
  const url = `${config.baseUrl}/chat/completions`;

  // Same headers as z-ai-web-dev-sdk
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${config.apiKey}`,
    "X-Z-AI-From": "Z",
  };

  if (config.chatId) {
    headers["X-Chat-Id"] = config.chatId;
  }
  if (config.userId) {
    headers["X-User-Id"] = config.userId;
  }
  if (config.token) {
    headers["X-Token"] = config.token;
  }

  const body: Record<string, unknown> = {
    messages: apiMessages,
    stream: true,
    thinking: { type: "disabled" },
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

    const baseUrl = process.env.ZAI_BASE_URL;
    const apiKey = process.env.ZAI_API_KEY;

    // If env vars are configured, use streaming (best for Vercel)
    if (baseUrl && apiKey) {
      const config = {
        baseUrl,
        apiKey,
        chatId: process.env.ZAI_CHAT_ID,
        userId: process.env.ZAI_USER_ID,
        token: process.env.ZAI_TOKEN,
      };

      try {
        const upstreamResponse = await streamWithEnvVars(apiMessages, config);

        // Create a passthrough stream that re-emits SSE events cleanly
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
                        encoder.encode(`data: ${JSON.stringify({ type: "delta", content: delta })}\n\n`)
                      );
                    }

                    // Capture usage if present
                    if (json.usage) {
                      promptTokens = json.usage.prompt_tokens || 0;
                      completionTokens = json.usage.completion_tokens || 0;
                    }
                  } catch {
                    // Skip malformed JSON chunks
                  }
                }
              }

              // Send usage info at the end
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
                      model: model || "hache-sonnet-4",
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
      } catch (streamError) {
        console.error("Streaming failed:", streamError);
        // Fall through to non-streaming SDK approach
      }
    }

    // Fallback: Try SDK (works locally with .z-ai-config file)
    try {
      const completion = await callWithSDK(apiMessages);
      const content = completion.choices?.[0]?.message?.content || "";

      if (!content) {
        return Response.json(
          { error: "No se pudo generar una respuesta. Intenta de nuevo." },
          { status: 500 }
        );
      }

      const usage = completion.usage;
      return Response.json({
        content,
        model: model || "hache-sonnet-4",
        usage: usage
          ? {
              promptTokens: usage.prompt_tokens || 0,
              completionTokens: usage.completion_tokens || 0,
              totalTokens:
                (usage.prompt_tokens || 0) + (usage.completion_tokens || 0),
            }
          : undefined,
      });
    } catch (sdkError) {
      console.error("SDK error:", sdkError);
      return Response.json(
        {
          error:
            "No se pudo conectar con la API. Configura las variables de entorno ZAI_BASE_URL y ZAI_API_KEY en Vercel.",
        },
        { status: 500 }
      );
    }
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
