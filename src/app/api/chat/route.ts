export const maxDuration = 300;
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

interface EnvConfig {
  baseUrl: string;
  apiKey: string;
  chatId?: string;
  userId?: string;
  token?: string;
}

function getEnvConfig(): EnvConfig | null {
  const baseUrl = process.env.ZAI_BASE_URL;
  const apiKey = process.env.ZAI_API_KEY;

  if (!baseUrl || !apiKey) {
    return null;
  }

  return {
    baseUrl,
    apiKey,
    chatId: process.env.ZAI_CHAT_ID,
    userId: process.env.ZAI_USER_ID,
    token: process.env.ZAI_TOKEN,
  };
}

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

async function callWithEnvVars(
  apiMessages: { role: string; content: string }[],
  config: EnvConfig
) {
  const url = `${config.baseUrl}/chat/completions`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${config.apiKey}`,
  };

  if (config.token) {
    headers["X-Token"] = config.token;
  }

  if (config.userId) {
    headers["X-User-Id"] = config.userId;
  }

  const body: Record<string, unknown> = {
    messages: apiMessages,
    stream: false,
  };

  if (config.chatId) {
    body.chat_id = config.chatId;
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(
      `API request failed (${response.status}): ${errorText}`
    );
  }

  return await response.json();
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

    let completion;

    // Try SDK first (works locally with .z-ai-config file)
    // Fall back to env vars (works on Vercel and other cloud platforms)
    try {
      completion = await callWithSDK(apiMessages);
    } catch (sdkError) {
      console.log(
        "SDK not available, trying environment variables:",
        sdkError instanceof Error ? sdkError.message : "Unknown error"
      );

      const envConfig = getEnvConfig();
      if (!envConfig) {
        throw new Error(
          "No se pudo conectar con la API. Configura las variables de entorno (ZAI_BASE_URL, ZAI_API_KEY) o el archivo .z-ai-config."
        );
      }

      completion = await callWithEnvVars(apiMessages, envConfig);
    }

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
