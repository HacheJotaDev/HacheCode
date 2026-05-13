import ZAI from "z-ai-web-dev-sdk";

export const maxDuration = 60;

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

    const systemMessage = {
      role: "system",
      content: `Eres Claude Code, un asistente de programación agéntico avanzado que vive en la terminal. Ayudas a desarrolladores a escribir, depurar y entender código. Puedes leer archivos, escribir código, ejecutar comandos y razonar sobre codebases completos.

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

Tus respuestas deben ser útiles, precisas y formateadas para máxima legibilidad en una interfaz tipo terminal.`,
    };

    const apiMessages = [
      systemMessage,
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    const completion = await zai.chat.completions.create({
      messages: apiMessages,
    });

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
      model: model || "claude-sonnet-4",
      usage: usage
        ? {
            promptTokens: usage.prompt_tokens || 0,
            completionTokens: usage.completion_tokens || 0,
            totalTokens: (usage.prompt_tokens || 0) + (usage.completion_tokens || 0),
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
