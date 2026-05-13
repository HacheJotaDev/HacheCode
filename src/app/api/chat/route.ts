import ZAI from "z-ai-web-dev-sdk";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `Eres Hache Code, un asistente de programación agéntico avanzado que vive en la terminal. Ayudas a desarrolladores a escribir, depurar y entender código. Puedes leer archivos, escribir código, ejecutar comandos y razonar sobre codebases completos.

Comportamientos clave:
- Responde en ESPAÑOL siempre
- Sé conciso y técnico, pero explicativo cuando sea necesario
- Formatea código con bloques markdown incluyendo identificadores de lenguaje
- Cuando sugieras cambios en archivos, muestra el código exacto con syntax highlighting
- Usa formato de herramientas cuando describas acciones (ej: 📖 Leyendo archivo, ✏️ Escribiendo archivo, ▶️ Ejecutando comando)
- Divide tareas complejas en pasos claros y numerados
- Explica tu razonamiento brevemente antes de sugerir código
- Usa rutas relativas de archivos al discutir código
- Sé proactivo identificando posibles problemas
- Cuando generes código, inclúyelo siempre en bloques de código markdown con el lenguaje especificado
- Si el usuario pide crear algo, genera el código completo y funcional

Tus respuestas deben ser útiles, precisas y formateadas para máxima legibilidad en una interfaz tipo terminal.`;

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

    const zai = await ZAI.create();

    const recentMessages = messages.slice(-20);

    const apiMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...recentMessages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    // Use streaming to keep the connection alive and avoid timeouts
    const streamBody = await zai.chat.completions.create({
      messages: apiMessages,
      stream: true,
    });

    // The SDK returns a ReadableStream when stream: true
    const upstreamStream = streamBody as ReadableStream<Uint8Array>;

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const transformStream = new TransformStream({
      transform(chunk, controller) {
        const text = decoder.decode(chunk, { stream: true });
        const lines = text.split("\n");

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          // Skip SSE comment lines
          if (trimmed.startsWith(":")) continue;

          // Handle SSE data lines
          if (trimmed.startsWith("data: ")) {
            const data = trimmed.slice(6);
            if (data === "[DONE]") {
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              continue;
            }
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || "";
              if (content) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ content, done: false })}\n\n`)
                );
              }
            } catch {
              // Forward non-JSON as-is
              controller.enqueue(encoder.encode(`${trimmed}\n\n`));
            }
          } else {
            // Try to parse as raw JSON (some responses don't use SSE format)
            try {
              const parsed = JSON.parse(trimmed);
              const content = parsed.choices?.[0]?.delta?.content || "";
              if (content) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ content, done: false })}\n\n`)
                );
              }
            } catch {
              // Skip unparseable content
            }
          }
        }
      },
      flush(controller) {
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      },
    });

    const readable = upstreamStream.pipeThrough(transformStream);

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
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
