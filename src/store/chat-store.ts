import { create } from "zustand";
import { persist } from "zustand/middleware";

export type MessageRole = "user" | "assistant" | "system";

export interface ToolUse {
  type: "file_read" | "file_write" | "bash_command" | "search";
  label: string;
  detail?: string;
  output?: string;
  expanded?: boolean;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  toolUses?: ToolUse[];
  isStreaming?: boolean;
  isError?: boolean;
}

export interface ModelOption {
  id: string;
  name: string;
  description: string;
}

// Models that work with Z.ai proxy/SDK (no API key needed)
export const MODELS: ModelOption[] = [
  { id: "glm-4-plus", name: "GLM-4 Plus", description: "Mejor equilibrio entre velocidad e inteligencia" },
  { id: "glm-4-flash", name: "GLM-4 Flash", description: "Respuestas ultrarrápidas" },
  { id: "glm-4-long", name: "GLM-4 Long", description: "Contexto largo hasta 128K tokens" },
];

export interface SessionContext {
  files: string[];
  totalTokens: number;
  maxTokens: number;
}

interface ChatState {
  messages: ChatMessage[];
  selectedModel: string;
  isStreaming: boolean;
  sessionContext: SessionContext;
  sidebarOpen: boolean;
  contextPanelOpen: boolean;

  addMessage: (message: Omit<ChatMessage, "id" | "timestamp">) => void;
  updateLastMessage: (content: string) => void;
  sendMessage: (content: string) => Promise<void>;
  setSelectedModel: (model: string) => void;
  setIsStreaming: (streaming: boolean) => void;
  toggleSidebar: () => void;
  toggleContextPanel: () => void;
  addContextFile: (file: string) => void;
  removeContextFile: (file: string) => void;
  updateTokenUsage: (tokens: number) => void;
  clearChat: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content: `Hola, soy **Hache IA**, tu asistente de programación con IA.

Puedo ayudarte con:

- **Escribir código** — Generar, refactorizar o depurar en cualquier lenguaje
- **Operaciones de archivos** — Leer, escribir y navegar archivos del proyecto
- **Buscar código** — Encontrar patrones, rastrear referencias y entender codebases
- **Ejecutar comandos** — Correr comandos y analizar resultados
- **Arquitectura** — Diseñar sistemas, planificar funciones y revisar decisiones

Prueba preguntarme algo como:
- *"Ayúdame a implementar un endpoint REST"*
- *"Explica el flujo de autenticación en este proyecto"*
- *"Encuentra y arregla el bug en mi componente React"*
- *"Escribe tests unitarios para mis funciones"*

¿Qué te gustaría trabajar hoy?`,
  timestamp: Date.now(),
};

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [WELCOME_MESSAGE],
      selectedModel: "glm-4-plus",
      isStreaming: false,
      sessionContext: {
        files: [],
        totalTokens: 0,
        maxTokens: 200000,
      },
      sidebarOpen: true,
      contextPanelOpen: false,

      addMessage: (message) => {
        const newMessage: ChatMessage = {
          ...message,
          id: generateId(),
          timestamp: Date.now(),
        };
        set((state) => ({ messages: [...state.messages, newMessage] }));
      },

      updateLastMessage: (content) => {
        set((state) => {
          const messages = [...state.messages];
          const lastMsg = messages[messages.length - 1];
          if (lastMsg) {
            messages[messages.length - 1] = { ...lastMsg, content };
          }
          return { messages };
        });
      },

      sendMessage: async (content: string) => {
        const { messages, selectedModel, addMessage, setIsStreaming } = get();

        addMessage({ role: "user", content });
        addMessage({ role: "assistant", content: "", isStreaming: true });
        setIsStreaming(true);

        try {
          const apiMessages = messages
            .filter((m) => m.id !== "welcome" && m.role !== "system")
            .map((m) => ({
              role: m.role as "user" | "assistant",
              content: m.content,
            }));

          apiMessages.push({ role: "user", content });

          const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: apiMessages,
              model: selectedModel,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: `Error del servidor (${response.status})` }));
            throw new Error(errorData.error || `Error del servidor (${response.status})`);
          }

          const contentType = response.headers.get("content-type") || "";

          // Handle SSE streaming response
          if (contentType.includes("text/event-stream") && response.body) {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullContent = "";
            let buffer = "";
            let usageData: { promptTokens: number; completionTokens: number; totalTokens: number } | undefined;

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const parts = buffer.split("\n\n");
              buffer = parts.pop() || "";

              for (const part of parts) {
                const trimmed = part.trim();
                if (!trimmed) continue;

                const lines = trimmed.split("\n");
                for (const line of lines) {
                  const lineTrimmed = line.trim();
                  if (!lineTrimmed.startsWith("data: ")) continue;

                  const dataStr = lineTrimmed.slice(6);
                  if (dataStr === "[DONE]") continue;

                  try {
                    const parsed = JSON.parse(dataStr);

                    if (parsed.type === "delta" && parsed.content) {
                      fullContent += parsed.content;
                      set((state) => {
                        const msgs = [...state.messages];
                        const lastIdx = msgs.length - 1;
                        if (msgs[lastIdx]?.role === "assistant") {
                          msgs[lastIdx] = {
                            ...msgs[lastIdx],
                            content: fullContent,
                          };
                        }
                        return { messages: msgs };
                      });
                    } else if (parsed.type === "done") {
                      if (parsed.usage) {
                        usageData = parsed.usage;
                      }
                    } else if (parsed.type === "error") {
                      throw new Error(parsed.error || "Error en el stream");
                    }
                  } catch (e) {
                    if (e instanceof Error && e.message !== "Error en el stream") {
                      // Skip malformed JSON
                    } else {
                      throw e;
                    }
                  }
                }
              }
            }

            // Final update
            const toolUses = parseToolUses(fullContent);
            set((state) => {
              const msgs = [...state.messages];
              const lastIdx = msgs.length - 1;
              if (msgs[lastIdx]?.role === "assistant") {
                msgs[lastIdx] = {
                  ...msgs[lastIdx],
                  content: fullContent || "No pude generar una respuesta.",
                  isStreaming: false,
                  isError: false,
                  toolUses: toolUses.length > 0 ? toolUses : undefined,
                };
              }
              return {
                messages: msgs,
                isStreaming: false,
                sessionContext: {
                  ...state.sessionContext,
                  totalTokens: usageData
                    ? usageData.totalTokens
                    : state.sessionContext.totalTokens + Math.ceil(fullContent.length / 4),
                },
              };
            });
          } else {
            // Handle JSON response (non-streaming)
            const data = await response.json();
            const parsedContent = data.content || "No pude generar una respuesta.";
            const toolUses = parseToolUses(parsedContent);

            set((state) => {
              const msgs = [...state.messages];
              const lastIdx = msgs.length - 1;
              if (msgs[lastIdx]?.role === "assistant") {
                msgs[lastIdx] = {
                  ...msgs[lastIdx],
                  content: parsedContent,
                  isStreaming: false,
                  isError: false,
                  toolUses: toolUses.length > 0 ? toolUses : undefined,
                };
              }
              return {
                messages: msgs,
                isStreaming: false,
                sessionContext: {
                  ...state.sessionContext,
                  totalTokens: data.usage
                    ? data.usage.totalTokens
                    : state.sessionContext.totalTokens + Math.ceil(parsedContent.length / 4),
                },
              };
            });
          }
        } catch (error) {
          const errorMsg =
            error instanceof Error
              ? error.name === "AbortError"
                ? "La solicitud tardó demasiado. Intenta de nuevo."
                : error.message
              : "Ocurrió un error inesperado";

          set((state) => {
            const msgs = [...state.messages];
            const lastIdx = msgs.length - 1;
            if (msgs[lastIdx]?.role === "assistant") {
              msgs[lastIdx] = {
                ...msgs[lastIdx],
                content: `Error: ${errorMsg}`,
                isStreaming: false,
                isError: true,
              };
            }
            return { messages: msgs, isStreaming: false };
          });
        }
      },

      setSelectedModel: (model) => set({ selectedModel: model }),
      setIsStreaming: (streaming) => set({ isStreaming: streaming }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      toggleContextPanel: () => set((state) => ({ contextPanelOpen: !state.contextPanelOpen })),
      addContextFile: (file) =>
        set((state) => ({
          sessionContext: {
            ...state.sessionContext,
            files: state.sessionContext.files.includes(file)
              ? state.sessionContext.files
              : [...state.sessionContext.files, file],
          },
        })),
      removeContextFile: (file) =>
        set((state) => ({
          sessionContext: {
            ...state.sessionContext,
            files: state.sessionContext.files.filter((f) => f !== file),
          },
        })),
      updateTokenUsage: (tokens) =>
        set((state) => ({
          sessionContext: { ...state.sessionContext, totalTokens: tokens },
        })),
      clearChat: () => set({ messages: [WELCOME_MESSAGE], sessionContext: { ...get().sessionContext, totalTokens: 0 } }),
    }),
    {
      name: "hache-ia-chat",
      partialize: (state) => ({
        messages: state.messages.map((m) => ({
          ...m,
          isStreaming: false, // Always reset streaming on load
        })),
        selectedModel: state.selectedModel,
      }),
    }
  )
);

function parseToolUses(content: string): ToolUse[] {
  const tools: ToolUse[] = [];
  const patterns = [
    { regex: /📖\s*(?:Reading|Read|Leyendo)\s+(?:file\s+)?[`"]?([^`"\n]+)[`"]?/gi, type: "file_read" as const, label: "Leer archivo" },
    { regex: /✏️\s*(?:Writing|Write|Wrote|Escribiendo)\s+(?:to\s+)?[`"]?([^`"\n]+)[`"]?/gi, type: "file_write" as const, label: "Escribir archivo" },
    { regex: /▶️\s*(?:Running|Run|Executed|Ejecutando)\s+[`"]?([^`"\n]+)[`"]?/gi, type: "bash_command" as const, label: "Ejecutar comando" },
    { regex: /🔍\s*(?:Searching|Search|Found|Buscando)\s+[^`"\n]*[`"]?([^`"\n]+)[`"]?/gi, type: "search" as const, label: "Buscar" },
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.regex.exec(content)) !== null) {
      tools.push({
        type: pattern.type,
        label: pattern.label,
        detail: match[1]?.trim(),
        expanded: false,
      });
    }
  }

  return tools;
}
