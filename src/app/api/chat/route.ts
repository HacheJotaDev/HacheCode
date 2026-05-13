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
 * Stream chat completions using any OpenAI-compatible API.
 * Works with: OpenAI, ChatGLM/BigModel, Groq, Together, any compatible endpoint.
 */
async function streamChatCompletions(
  apiMessages: { role: string; content: string }[],
  config: {
    baseUrl: string;
    apiKey: string;
    model: string;
    stream: boolean;
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
    stream: config.stream,
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

    // Read configuration from environment variables
    const baseUrl = process.env.API_BASE_URL;
    const apiKey = process.env.API_KEY;
    const apiModel = process.env.API_MODEL || model || "glm-4-plus";
    const useStream = process.env.API_STREAM !== "false"; // default: true

    if (!baseUrl || !apiKey) {
      return Response.json(
        {
          error:
            "Variables de entorno no configuradas. Debes configurar API_BASE_URL y API_KEY en tu plataforma de deploy (Vercel/Railway).",
        },
        { status: 500 }
      );
    }

    // Try streaming first (best UX)
    if (useStream) {
      try {
        const upstreamResponse = await streamChatCompletions(apiMessages, {
          baseUrl,
          apiKey,
          model: apiModel,
          stream: true,
        });

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

              // Send final event with usage
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
                      model: apiModel,
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
        console.error("Streaming failed, falling back to non-streaming:", streamError);
        // Fall through to non-streaming
      }
    }

    // Non-streaming fallback
    const upstreamResponse = await streamChatCompletions(apiMessages, {
      baseUrl,
      apiKey,
      model: apiModel,
      stream: false,
    });

    const data = await upstreamResponse.json();
    const content = data.choices?.[0]?.message?.content || "";

    if (!content) {
      return Response.json(
        { error: "No se pudo generar una respuesta. Intenta de nuevo." },
        { status: 500 }
      );
    }

    const usage = data.usage;
    return Response.json({
      content,
      model: apiModel,
      usage: usage
        ? {
            promptTokens: usage.prompt_tokens || 0,
            completionTokens: usage.completion_tokens || 0,
            totalTokens:
              (usage.prompt_tokens || 0) + (usage.completion_tokens || 0),
          }
        : undefined,
    });
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
