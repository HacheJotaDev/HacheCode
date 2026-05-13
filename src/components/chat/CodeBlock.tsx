"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, FileCode2 } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Button } from "@/components/ui/button";

interface CodeBlockProps {
  language: string;
  code: string;
  filename?: string;
}

const LANG_MAP: Record<string, string> = {
  ts: "typescript",
  tsx: "tsx",
  js: "javascript",
  jsx: "jsx",
  py: "python",
  rb: "ruby",
  go: "go",
  rs: "rust",
  java: "java",
  sh: "bash",
  bash: "bash",
  zsh: "bash",
  sql: "sql",
  html: "html",
  css: "css",
  scss: "scss",
  json: "json",
  yaml: "yaml",
  yml: "yaml",
  md: "markdown",
  mdx: "mdx",
  dockerfile: "docker",
  makefile: "makefile",
  toml: "toml",
  xml: "xml",
  graphql: "graphql",
};

function getLanguage(lang: string): string {
  if (!lang) return "text";
  const lower = lang.toLowerCase();
  return LANG_MAP[lower] || lower;
}

export function CodeBlock({ language, code, filename }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const lang = getLanguage(language);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const textarea = document.createElement("textarea");
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="my-3 rounded-lg overflow-hidden border border-border bg-[#1a1b26]">
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#16171f] border-b border-border/50">
        <div className="flex items-center gap-2">
          <FileCode2 className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[11px] font-mono text-muted-foreground">
            {filename || lang}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-foreground"
          onClick={handleCopy}
        >
          <AnimatePresence mode="wait">
            {copied ? (
              <motion.div
                key="check"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Check className="h-3.5 w-3.5 text-emerald-500" />
              </motion.div>
            ) : (
              <motion.div
                key="copy"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Copy className="h-3.5 w-3.5" />
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </div>

      {/* Code */}
      <div className="code-block-pre border-0 rounded-none">
        <SyntaxHighlighter
          language={lang}
          style={oneDark}
          customStyle={{
            margin: 0,
            padding: "0.75rem 1rem",
            background: "transparent",
            fontSize: "0.8125rem",
            lineHeight: "1.6",
          }}
          codeTagProps={{
            style: {
              fontFamily: "var(--font-geist-mono)",
              fontSize: "0.8125rem",
            },
          }}
          showLineNumbers={code.split("\n").length > 3}
          lineNumberStyle={{
            minWidth: "2.5em",
            paddingRight: "1em",
            color: "oklch(0.45 0 0)",
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
