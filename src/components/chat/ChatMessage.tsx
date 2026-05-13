"use client";

import React from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bot, User, Sparkles } from "lucide-react";
import { CodeBlock } from "./CodeBlock";
import { ToolCallBlock } from "./ToolCallBlock";
import { TypingIndicator } from "./TypingIndicator";
import type { ChatMessage as ChatMessageType } from "@/store/chat-store";

interface ChatMessageProps {
  message: ChatMessageType;
  index: number;
}

export function ChatMessage({ message, index }: ChatMessageProps) {
  const isUser = message.role === "user";
  const isWelcome = message.id === "welcome";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.2), ease: "easeOut" }}
      className="flex gap-3.5 px-4 py-3"
    >
      {/* Avatar */}
      <div className="shrink-0 mt-0.5">
        {isUser ? (
          <div className="h-8 w-8 rounded-lg bg-surface-hover border border-border/40 flex items-center justify-center">
            <User className="h-4 w-4 text-muted-foreground/60" />
          </div>
        ) : isWelcome ? (
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-accent to-orange-600 flex items-center justify-center glow-orange-sm shadow-sm">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
        ) : (
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-accent/80 to-orange-600/80 flex items-center justify-center">
            <Bot className="h-4 w-4 text-white" />
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="flex-1 min-w-0">
        {/* Nombre */}
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-xs font-semibold text-foreground">
            {isUser ? "Tu" : "Claude Code"}
          </span>
          {!isUser && !isWelcome && (
            <span className="text-[10px] text-muted-foreground/30">
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

        {/* Mensaje */}
        {message.isStreaming && !message.content ? (
          <TypingIndicator />
        ) : isUser ? (
          <div className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
            {message.content}
          </div>
        ) : (
          <div className="markdown-content text-sm leading-relaxed text-foreground/85">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || "");
                  const codeString = String(children).replace(/\n$/, "");

                  if (match) {
                    return (
                      <CodeBlock
                        language={match[1]}
                        code={codeString}
                      />
                    );
                  }

                  return (
                    <code className="px-1.5 py-0.5 rounded-md bg-surface text-orange-accent/80 text-[13px] font-mono border border-border/30" {...props}>
                      {children}
                    </code>
                  );
                },
                pre({ children }) {
                  return <>{children}</>;
                },
                p({ children }) {
                  return <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>;
                },
                ul({ children }) {
                  return <ul className="mb-3 list-disc pl-5 space-y-1.5">{children}</ul>;
                },
                ol({ children }) {
                  return <ol className="mb-3 list-decimal pl-5 space-y-1.5">{children}</ol>;
                },
                li({ children }) {
                  return <li className="leading-relaxed">{children}</li>;
                },
                strong({ children }) {
                  return <strong className="font-semibold text-foreground">{children}</strong>;
                },
                h1({ children }) {
                  return <h1 className="text-lg font-bold mt-5 mb-2.5 text-foreground">{children}</h1>;
                },
                h2({ children }) {
                  return <h2 className="text-base font-semibold mt-4 mb-2 text-foreground">{children}</h2>;
                },
                h3({ children }) {
                  return <h3 className="text-sm font-semibold mt-3 mb-1.5 text-foreground">{children}</h3>;
                },
                blockquote({ children }) {
                  return (
                    <blockquote className="border-l-2 border-orange-accent/40 pl-3.5 my-3 text-muted-foreground/80">
                      {children}
                    </blockquote>
                  );
                },
                a({ href, children }) {
                  return (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-orange-accent hover:text-orange-accent/80 underline underline-offset-2 decoration-orange-accent/30"
                    >
                      {children}
                    </a>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </motion.div>
  );
}
