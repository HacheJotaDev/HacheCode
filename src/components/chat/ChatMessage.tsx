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
  const isAssistant = message.role === "assistant";
  const isWelcome = message.id === "welcome";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.3), ease: "easeOut" }}
      className={`flex gap-3 px-4 py-3 ${isUser ? "" : ""}`}
    >
      {/* Avatar */}
      <div className="shrink-0 mt-0.5">
        {isUser ? (
          <div className="h-7 w-7 rounded-lg bg-surface-hover border border-border flex items-center justify-center">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
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

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Name */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-foreground">
            {isUser ? "You" : "Claude Code"}
          </span>
          {isAssistant && !isWelcome && (
            <span className="text-[10px] text-muted-foreground/50">
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>

        {/* Tool uses */}
        {message.toolUses && message.toolUses.length > 0 && (
          <div className="mb-2">
            {message.toolUses.map((tool, i) => (
              <ToolCallBlock key={i} tool={tool} />
            ))}
          </div>
        )}

        {/* Message body */}
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
                    <code className={className} {...props}>
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
                  return <ul className="mb-3 list-disc pl-5 space-y-1">{children}</ul>;
                },
                ol({ children }) {
                  return <ol className="mb-3 list-decimal pl-5 space-y-1">{children}</ol>;
                },
                li({ children }) {
                  return <li className="leading-relaxed">{children}</li>;
                },
                strong({ children }) {
                  return <strong className="font-semibold text-foreground">{children}</strong>;
                },
                h1({ children }) {
                  return <h1 className="text-lg font-bold mt-4 mb-2 text-foreground">{children}</h1>;
                },
                h2({ children }) {
                  return <h2 className="text-base font-semibold mt-3 mb-2 text-foreground">{children}</h2>;
                },
                h3({ children }) {
                  return <h3 className="text-sm font-semibold mt-2 mb-1 text-foreground">{children}</h3>;
                },
                blockquote({ children }) {
                  return (
                    <blockquote className="border-l-2 border-orange-accent/50 pl-3 my-2 text-muted-foreground">
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
                      className="text-orange-accent hover:text-orange-accent/80 underline underline-offset-2"
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
