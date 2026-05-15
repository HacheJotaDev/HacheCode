"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { User, AlertCircle, RotateCcw, Download, Maximize2, X } from "lucide-react";
import { CodeBlock } from "./CodeBlock";
import { ToolCallBlock } from "./ToolCallBlock";
import { TypingIndicator } from "./TypingIndicator";
import { useChatStore } from "@/store/chat-store";
import type { ChatMessage as ChatMessageType, ImageData } from "@/store/chat-store";
import { Button } from "@/components/ui/button";

interface ChatMessageProps {
  message: ChatMessageType;
  index: number;
}

// Image display component with expand and download
function MessageImage({ image, isUser }: { image: ImageData; isUser?: boolean }) {
  const [expanded, setExpanded] = useState(false);

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = image.url;
    link.download = image.alt || "hache-ia-image.png";
    link.click();
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`relative group rounded-xl overflow-hidden border border-border/20 ${
          image.isGenerated ? "max-w-sm" : "max-w-[200px]"
        }`}
      >
        <img
          src={image.url}
          alt={image.alt || "Imagen"}
          className={`w-full object-cover rounded-xl cursor-pointer transition-all duration-200 ${
            image.isGenerated ? "max-h-80" : "max-h-40"
          }`}
          onClick={() => setExpanded(true)}
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          <button
            onClick={() => setExpanded(true)}
            className="h-8 w-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-all"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
          <button
            onClick={handleDownload}
            className="h-8 w-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-all"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
        {image.isGenerated && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-purple-500/80 backdrop-blur-sm text-[9px] text-white font-medium">
            IA
          </div>
        )}
      </motion.div>

      {/* Expanded view modal */}
      {expanded && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setExpanded(false)}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="relative max-w-4xl max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={image.url}
              alt={image.alt || "Imagen"}
              className="max-w-full max-h-[85vh] object-contain rounded-2xl"
            />
            <button
              onClick={() => setExpanded(false)}
              className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-all"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
              <button
                onClick={handleDownload}
                className="px-4 py-2 rounded-xl bg-white/20 backdrop-blur-sm text-white text-xs font-medium hover:bg-white/30 transition-all flex items-center gap-2"
              >
                <Download className="h-3.5 w-3.5" />
                Descargar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}

// We need to create markdown components that have access to isStreaming
function createMarkdownComponents(isStreaming: boolean) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const components: Record<string, any> = {
    code({ className, children, ...props }: { className?: string; children?: React.ReactNode }) {
      const match = /language-(\w+)/.exec(className || "");
      const codeString = String(children).replace(/\n$/, "");
      if (match) {
        return <CodeBlock language={match[1]} code={codeString} showCopyButton={!isStreaming} />;
      }
      return (
        <code className="px-1.5 py-0.5 rounded-md bg-surface text-orange-accent/80 text-[13px] font-mono border border-border/20" {...props}>
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
      return <blockquote className="border-l-2 border-orange-accent/25 pl-3 my-2.5 text-muted-foreground/60">{children}</blockquote>;
    },
    a({ href, children }: { href?: string; children?: React.ReactNode }) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-orange-accent hover:text-orange-accent/80 underline underline-offset-2 decoration-orange-accent/25 transition-colors duration-150">
          {children}
        </a>
      );
    },
    // Image in markdown content
    img({ src, alt }: { src?: string; alt?: string }) {
      if (src) {
        return <MessageImage image={{ url: src, alt: alt || "" }} />;
      }
      return null;
    },
  };
  return components;
}

export function ChatMessage({ message, index }: ChatMessageProps) {
  const isUser = message.role === "user";
  const isWelcome = message.id === "welcome";
  const isError = message.isError;
  const isStreaming = !!message.isStreaming;
  const hasImages = message.images && message.images.length > 0;

  const markdownComponents = createMarkdownComponents(isStreaming);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.15), ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex gap-3.5 px-5 py-3"
    >
      {/* Avatar */}
      <div className="shrink-0 mt-0.5">
        {isUser ? (
          <div className="h-8 w-8 rounded-xl bg-surface-hover/80 border border-border/20 flex items-center justify-center">
            <User className="h-4 w-4 text-muted-foreground/40" />
          </div>
        ) : (
          <img
            src="/logo-hache-ia.png"
            alt="Hache IA"
            className="h-8 w-8 rounded-xl object-cover"
          />
        )}
      </div>

      {/* Contenido */}
      <div className="flex-1 min-w-0">
        {/* Nombre */}
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[11px] font-semibold text-foreground/60 tracking-wide">
            {isUser ? "Tú" : "Hache IA"}
          </span>
          {!isUser && !isWelcome && !isError && (
            <span className="text-[10px] text-muted-foreground/20 font-mono">
              {new Date(message.timestamp).toLocaleTimeString("es-ES", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>

        {/* Herramientas */}
        {message.toolUses && message.toolUses.length > 0 && (
          <div className="mb-2.5">
            {message.toolUses.map((tool, i) => (
              <ToolCallBlock key={i} tool={tool} />
            ))}
          </div>
        )}

        {/* Mensaje de error */}
        {isError && (
          <div className="rounded-xl border border-red-500/15 bg-red-500/4 px-4 py-3 mb-2">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-red-400/90 font-semibold mb-0.5">Error</p>
                <p className="text-xs text-red-400/60 leading-relaxed">{message.content}</p>
              </div>
              <RetryButton />
            </div>
          </div>
        )}

        {/* User images */}
        {isUser && hasImages && (
          <div className="flex flex-wrap gap-2 mb-2">
            {message.images!.map((img, i) => (
              <MessageImage key={i} image={img} isUser />
            ))}
          </div>
        )}

        {/* AI generated images */}
        {!isUser && hasImages && (
          <div className="flex flex-wrap gap-2 mb-2">
            {message.images!.map((img, i) => (
              <MessageImage key={i} image={img} />
            ))}
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
            <span className="inline-block h-4 w-0.5 bg-orange-accent animate-pulse ml-0.5 align-text-bottom rounded-full" />
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
      className="h-7 w-7 rounded-lg text-red-400/40 hover:text-red-400 hover:bg-red-400/8 shrink-0 transition-all duration-200"
      onClick={handleRetry}
      disabled={isStreaming}
    >
      <RotateCcw className="h-3 w-3" />
    </Button>
  );
}
