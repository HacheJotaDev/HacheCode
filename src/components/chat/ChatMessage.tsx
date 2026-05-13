"use client";

import React from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bot, User, Sparkles, AlertCircle, RotateCcw } from "lucide-react";
import { CodeBlock } from "./CodeBlock";
import { ToolCallBlock } from "./ToolCallBlock";
import { TypingIndicator } from "./TypingIndicator";
import { useChatStore } from "@/store/chat-store";
import type { ChatMessage as ChatMessageType } from "@/store/chat-store";
import { Button } from "@/components/ui/button";

const markdownComponents = {
  code({ className, children, ...props }: { className?: string; children?: React.ReactNode; [key: string]: unknown }) {
    const match = /language-(\w+)/.exec(className || "");
    const codeString = String(children).replace(/\n$/, "");
    if (match) {
      return <CodeBlock language={match[1]} code={codeString} />;
    }
    return (
      <code className="px-1.5 py-0.5 rounded-md bg-surface text-orange-accent/80 text-[13px] font-mono border border-border/25" {...props}>
        {children}
      </code>
    );
  },
  pre({ children }: { children?: React.ReactNode }) {
    return <>{children}</>;
  },
  p({ children }: { children?: React.ReactNode }) {
    return <p className="mb-2.5 last:mb-0 leading-relaxed">{children}</p>;
  },
  ul({ children }: { children?: React.ReactNode }) {
    return <ul className="mb-2.5 list-disc pl-5 space-y-1">{children}</ul>;
  },
  ol({ children }: { children?: React.ReactNode }) {
    return <ol className="mb-2.5 list-decimal pl-5 space-y-1">{children}</ol>;
  },
  li({ children }: { children?: React.ReactNode }) {
    return <li className="leading-relaxed">{children}</li>;
  },
  strong({ children }: { children?: React.ReactNode }) {
    return <strong className="font-semibold text-foreground/90">{children}</strong>;
  },
  h1({ children }: { children?: React.ReactNode }) {
    return <h1 className="text-lg font-bold mt-4 mb-2 text-foreground">{children}</h1>;
  },
  h2({ children }: { children?: React.ReactNode }) {
    return <h2 className="text-base font-semibold mt-3.5 mb-1.5 text-foreground">{children}</h2>;
  },
  h3({ children }: { children?: React.ReactNode }) {
    return <h3 className="text-sm font-semibold mt-3 mb-1.5 text-foreground">{children}</h3>;
  },
  blockquote({ children }: { children?: React.ReactNode }) {
    return <blockquote className="border-l-2 border-orange-accent/30 pl-3 my-2.5 text-muted-foreground/70">{children}</blockquote>;
  },
  a({ href, children }: { href?: string; children?: React.ReactNode }) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-orange-accent hover:text-orange-accent/80 underline underline-offset-2 decoration-orange-accent/30">
        {children}
      </a>
    );
  },
};

interface ChatMessageProps {
  message: ChatMessageType;
  index: number;
}

export function ChatMessage({ message, index }: ChatMessageProps) {
  const isUser = message.role === "user";
  const isWelcome = message.id === "welcome";
  const isError = message.isError;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.15), ease: "easeOut" }}
      className="flex gap-3 px-4 py-2.5"
    >
      {/* Avatar */}
      <div className="shrink-0 mt-0.5">
        {isUser ? (
          <div className="h-7 w-7 rounded-lg bg-surface-hover border border-border/30 flex items-center justify-center">
            <User className="h-3.5 w-3.5 text-muted-foreground/50" />
          </div>
        ) : isWelcome ? (
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-orange-accent to-orange-600 flex items-center justify-center glow-orange-sm">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
        ) : (
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-orange-accent/80 to-orange-600/80 flex items-center justify-center">
            <Bot className="h-3.5 w-3.5 text-white" />
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="flex-1 min-w-0">
        {/* Nombre */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-semibold text-foreground/70">
            {isUser ? "Tú" : "Hache Code"}
          </span>
          {!isUser && !isWelcome && !isError && (
            <span className="text-[10px] text-muted-foreground/25">
              {new Date(message.timestamp).toLocaleTimeString("es-ES", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>

        {/* Herramientas */}
        {message.toolUses && message.toolUses.length > 0 && (
          <div className="mb-2">
            {message.toolUses.map((tool, i) => (
              <ToolCallBlock key={i} tool={tool} />
            ))}
          </div>
        )}

        {/* Mensaje de error */}
        {isError && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2.5 mb-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-red-400/90 font-medium mb-0.5">Error</p>
                <p className="text-xs text-red-400/70 leading-relaxed">{message.content}</p>
              </div>
              <RetryButton />
            </div>
          </div>
        )}

        {/* Mensaje normal */}
        {!isError && message.isStreaming && !message.content ? (
          <TypingIndicator />
        ) : !isError && message.isStreaming && message.content ? (
          <div>
            <div className="markdown-content text-sm leading-relaxed text-foreground/80">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {message.content}
              </ReactMarkdown>
            </div>
            <span className="inline-block h-4 w-0.5 bg-orange-accent animate-pulse ml-0.5 align-text-bottom" />
          </div>
        ) : !isError && isUser ? (
          <div className="text-sm leading-relaxed text-foreground/85 whitespace-pre-wrap">
            {message.content}
          </div>
        ) : !isError ? (
          <div className="markdown-content text-sm leading-relaxed text-foreground/80">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}

function RetryButton() {
  const { messages, sendMessage, isStreaming } = useChatStore();
  const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");

  const handleRetry = () => {
    if (lastUserMessage && !isStreaming) {
      sendMessage(lastUserMessage.content);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-6 w-6 rounded-md text-red-400/50 hover:text-red-400 hover:bg-red-400/10 shrink-0"
      onClick={handleRetry}
      disabled={isStreaming}
    >
      <RotateCcw className="h-3 w-3" />
    </Button>
  );
}
