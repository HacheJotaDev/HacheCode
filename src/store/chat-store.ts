import { create } from "zustand";

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
}

export interface ModelOption {
  id: string;
  name: string;
  description: string;
}

export const MODELS: ModelOption[] = [
  { id: "claude-sonnet-4", name: "Claude Sonnet 4", description: "Best balance of speed & intelligence" },
  { id: "claude-opus-4-5", name: "Claude Opus 4.5", description: "Maximum intelligence" },
  { id: "claude-haiku-4-5", name: "Claude Haiku 4.5", description: "Fastest responses" },
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
  content: `Welcome to **Claude Code** — your AI-powered coding assistant in the browser.

I can help you with:

- 📝 **Writing code** — Generate, refactor, or debug code in any language
- 📂 **File operations** — Read, write, and navigate your project files
- 🔍 **Code search** — Find patterns, trace references, and understand codebases
- ▶️ **Run commands** — Execute shell commands and interpret results
- 🧠 **Architecture** — Design systems, plan features, and review decisions

Try asking me something like:
- *"Help me implement a REST API endpoint"*
- *"Explain the auth flow in this codebase"*
- *"Find and fix the bug in my React component"*
- *"Write unit tests for my utility functions"*

What would you like to work on?`,
  timestamp: Date.now(),
};

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [WELCOME_MESSAGE],
  selectedModel: "claude-sonnet-4",
  isStreaming: false,
  sessionContext: {
    files: [
      "src/bridge/bridgeApi.ts",
      "src/cli/transports/SSETransport.ts",
      "src/services/api/client.ts",
      "src/tools/AgentTool/index.ts",
    ],
    totalTokens: 2340,
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

    // Add user message
    addMessage({ role: "user", content });

    // Add empty assistant message for streaming
    addMessage({ role: "assistant", content: "", isStreaming: true });

    setIsStreaming(true);

    try {
      // Prepare messages for API (exclude welcome message)
      const apiMessages = messages
        .filter((m) => m.id !== "welcome" && m.role !== "system")
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));

      // Add the new user message
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to get response");
      }

      const data = await response.json();

      // Parse tool use indicators from content
      const parsedContent = data.content || "I couldn't generate a response.";
      const toolUses = parseToolUses(parsedContent);

      set((state) => {
        const msgs = [...state.messages];
        const lastIdx = msgs.length - 1;
        if (msgs[lastIdx]?.role === "assistant") {
          msgs[lastIdx] = {
            ...msgs[lastIdx],
            content: parsedContent,
            isStreaming: false,
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
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "An unexpected error occurred";
      set((state) => {
        const msgs = [...state.messages];
        const lastIdx = msgs.length - 1;
        if (msgs[lastIdx]?.role === "assistant") {
          msgs[lastIdx] = {
            ...msgs[lastIdx],
            content: `⚠️ **Error**: ${errorMsg}\n\nPlease try again or check your connection.`,
            isStreaming: false,
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
}));

// Parse tool-use style indicators from content
function parseToolUses(content: string): ToolUse[] {
  const tools: ToolUse[] = [];
  const patterns = [
    { regex: /📖\s*(?:Reading|Read)\s+(?:file\s+)?[`"]?([^`"\n]+)[`"]?/gi, type: "file_read" as const, label: "Read File" },
    { regex: /✏️\s*(?:Writing|Write|Wrote)\s+(?:to\s+)?[`"]?([^`"\n]+)[`"]?/gi, type: "file_write" as const, label: "Write File" },
    { regex: /▶️\s*(?:Running|Run|Executed)\s+[`"]?([^`"\n]+)[`"]?/gi, type: "bash_command" as const, label: "Run Command" },
    { regex: /🔍\s*(?:Searching|Search|Found)\s+[^`"\n]*[`"]?([^`"\n]+)[`"]?/gi, type: "search" as const, label: "Search" },
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
