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

export interface ImageData {
  url: string; // base64 data URL or blob URL
  alt?: string;
  isGenerated?: boolean; // true if AI-generated image
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  toolUses?: ToolUse[];
  isStreaming?: boolean;
  isError?: boolean;
  images?: ImageData[]; // Attached images (user or AI-generated)
}

export interface ModelOption {
  id: string;
  name: string;
  description: string;
  supportsVision?: boolean;
  supportsImageGen?: boolean;
}

// Modelos disponibles de Hache IA
// 👑 = consume tokens de pago | sin corona = gratis ilimitado
export const MODELS: ModelOption[] = [
  // ── GRATIS ──
  { id: "hj-4-flash", name: "HJ-4 Flash", description: "GRATIS — Respuestas ultrarrápidas", supportsVision: false, supportsImageGen: false },
  { id: "hj-4.7-flash", name: "HJ-4.7 Flash", description: "GRATIS — Modelo nuevo, rápido y potente", supportsVision: true, supportsImageGen: false },
  { id: "hj-z1-flash", name: "HJ-Z1 Flash", description: "GRATIS — Razonamiento profundo", supportsVision: false, supportsImageGen: false },
  // ── DE PAGO 👑 ──
  { id: "hj-4-plus", name: "HJ-4 Plus 👑", description: "Mejor equilibrio entre velocidad e inteligencia", supportsVision: true, supportsImageGen: false },
  { id: "hj-4v-plus", name: "HJ-4V Plus 👑", description: "Vision: analiza imágenes", supportsVision: true, supportsImageGen: false },
  { id: "hj-4-long", name: "HJ-4 Long 👑", description: "Contexto largo hasta 128K tokens", supportsVision: false, supportsImageGen: false },
];

export interface PendingImage {
  dataUrl: string;
  name: string;
  file?: File;
}

export interface SessionContext {
  files: string[];
  totalTokens: number;
  maxTokens: number;
}

interface ChatState {
  messages: ChatMessage[];
  selectedModel: string;
  isStreaming: boolean;
  isGeneratingImage: boolean;
  sessionContext: SessionContext;
  sidebarOpen: boolean;
  contextPanelOpen: boolean;
  pendingImages: PendingImage[];

  addMessage: (message: Omit<ChatMessage, "id" | "timestamp">) => void;
  updateLastMessage: (content: string) => void;
  sendMessage: (content: string, images?: ImageData[]) => Promise<void>;
  setSelectedModel: (model: string) => void;
  setIsStreaming: (streaming: boolean) => void;
  toggleSidebar: () => void;
  toggleContextPanel: () => void;
  addContextFile: (file: string) => void;
  removeContextFile: (file: string) => void;
  updateTokenUsage: (tokens: number) => void;
  clearChat: () => void;
  addPendingImage: (image: PendingImage) => void;
  removePendingImage: (index: number) => void;
  clearPendingImages: () => void;
  generateImage: (prompt: string) => Promise<void>;
}

const generateId = () => Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content: `Hola, soy **Hache IA**.

Tu asistente inteligente hecho por HacheJota

Puedo ayudarte a programar, responder preguntas, crear contenido, explicar temas, resolver problemas y mucho más.

- **Código y desarrollo**
- **Análisis de imágenes** — Adjunta una imagen y la analizo
- **Generación de imágenes** — Pídeme que genere una imagen
- **Ideas y creatividad**
- **Información y ayuda diaria**
- **Depuración y automatización**
- **Conversación natural con IA**

Solo escribe lo que necesites.`,
  timestamp: Date.now(),
};

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [WELCOME_MESSAGE],
      selectedModel: "hj-4-flash",
      isStreaming: false,
      isGeneratingImage: false,
      sessionContext: {
        files: [],
        totalTokens: 0,
        maxTokens: 200000,
      },
      sidebarOpen: false, // Start with sidebar closed — open directly in chat
      contextPanelOpen: false,
      pendingImages: [],

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

      sendMessage: async (content: string, images?: ImageData[]) => {
        const { messages, selectedModel, addMessage, setIsStreaming, clearPendingImages } = get();

        // Add user message with images
        addMessage({ role: "user", content, images: images && images.length > 0 ? images : undefined });
        addMessage({ role: "assistant", content: "", isStreaming: true });
        setIsStreaming(true);

        try {
          const apiMessages = messages
            .filter((m) => m.id !== "welcome" && m.role !== "system")
            .map((m) => {
              // If message has images, format as vision content (array of parts)
              if (m.images && m.images.length > 0 && m.role === "user") {
                const contentParts: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
                  { type: "text", text: m.content },
                ];
                for (const img of m.images) {
                  contentParts.push({
                    type: "image_url",
                    image_url: { url: img.url },
                  });
                }
                return { role: m.role as "user" | "assistant", content: contentParts };
              }
              return { role: m.role as "user" | "assistant", content: m.content };
            });

          // Add the current message (with images if any)
          if (images && images.length > 0) {
            const contentParts: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
              { type: "text", text: content },
            ];
            for (const img of images) {
              contentParts.push({
                type: "image_url",
                image_url: { url: img.url },
              });
            }
            apiMessages.push({ role: "user", content: contentParts });
          } else {
            apiMessages.push({ role: "user", content });
          }

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

          // Clear pending images after sending
          clearPendingImages();
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

      generateImage: async (prompt: string) => {
        const { addMessage, setIsStreaming } = get();

        // Add user message
        addMessage({ role: "user", content: `Genera una imagen: ${prompt}` });
        addMessage({ role: "assistant", content: "Generando imagen...", isStreaming: true });
        setIsStreaming(true);
        set({ isGeneratingImage: true });

        try {
          const response = await fetch("/api/image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: "Error generando imagen" }));
            throw new Error(errorData.error || "Error generando imagen");
          }

          const data = await response.json();
          const imageData = data.data?.[0];

          let imageUrl = "";
          if (imageData?.b64_json) {
            imageUrl = `data:image/png;base64,${imageData.b64_json}`;
          } else if (imageData?.url) {
            imageUrl = imageData.url;
          } else {
            throw new Error("No se recibió imagen");
          }

          // Update the assistant message with the generated image
          set((state) => {
            const msgs = [...state.messages];
            const lastIdx = msgs.length - 1;
            if (msgs[lastIdx]?.role === "assistant") {
              msgs[lastIdx] = {
                ...msgs[lastIdx],
                content: `Imagen generada: **${prompt}**`,
                isStreaming: false,
                isError: false,
                images: [{ url: imageUrl, alt: prompt, isGenerated: true }],
              };
            }
            return {
              messages: msgs,
              isStreaming: false,
              isGeneratingImage: false,
            };
          });
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : "Error generando imagen";
          set((state) => {
            const msgs = [...state.messages];
            const lastIdx = msgs.length - 1;
            if (msgs[lastIdx]?.role === "assistant") {
              msgs[lastIdx] = {
                ...msgs[lastIdx],
                content: `Error generando imagen: ${errorMsg}`,
                isStreaming: false,
                isError: true,
              };
            }
            return { messages: msgs, isStreaming: false, isGeneratingImage: false };
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
      clearChat: () => set({ messages: [WELCOME_MESSAGE], sessionContext: { ...get().sessionContext, totalTokens: 0 }, pendingImages: [] }),
      addPendingImage: (image) =>
        set((state) => ({
          pendingImages: [...state.pendingImages, image],
        })),
      removePendingImage: (index) =>
        set((state) => ({
          pendingImages: state.pendingImages.filter((_, i) => i !== index),
        })),
      clearPendingImages: () => set({ pendingImages: [] }),
    }),
    {
      name: "hache-ia-chat",
      partialize: (state) => ({
        messages: state.messages.map((m) => ({
          ...m,
          isStreaming: false,
          // Don't persist large base64 images - only keep text and a flag
          images: m.images?.map((img) => ({
            url: img.isGenerated ? "" : img.url.startsWith("data:") ? "" : img.url,
            alt: img.alt,
            isGenerated: img.isGenerated,
          })).filter((img) => img.url !== ""),
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
