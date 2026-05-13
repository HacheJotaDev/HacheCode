import ZAI from "z-ai-web-dev-sdk";

export async function POST(request: Request) {
  try {
    const { messages, model } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return Response.json(
        { error: "Se requiere un array de mensajes" },
        { status: 400 }
      );
    }

    const zai = await ZAI.create();

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Eres Claude Code, un asistente de programacion agentic que vive en la terminal. Ayudas a desarrolladores a escribir, depurar y entender codigo. Puedes leer archivos, escribir codigo, ejecutar comandos y razonar sobre codebases.

Comportamientos clave:
- Responde en ESPANOL siempre
- Se conciso y tecnico
- Formatea codigo con bloques markdown incluyendo identificadores de lenguaje
- Cuando sugieras cambios en archivos, muestra el codigo exacto con syntax highlighting
- Usa formato de herramientas cuando describas acciones (ej: 📖 Leyendo archivo, ✏️ Escribiendo archivo, ▶️ Ejecutando comando)
- Divide tareas complejas en pasos claros
- Explica tu razonamiento brevemente antes de sugerir codigo
- Usa rutas relativas de archivos al discutir codigo
- Se proactivo identificando posibles problemas

Tus respuestas deben ser utiles, precisas y formateadas para maxima legibilidad en una interfaz tipo terminal.`,
        },
        ...messages,
      ],
    });

    const content = completion.choices[0]?.message?.content || "";
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
  } catch (error) {
    console.error("Chat API error:", error);
    return Response.json(
      { error: "Error al generar respuesta. Por favor intenta de nuevo." },
      { status: 500 }
    );
  }
}
