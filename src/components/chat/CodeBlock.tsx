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
    <div className="my-2.5 rounded-xl overflow-hidden border border-border/25 bg-[#1a1b26]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#16171f] border-b border-border/15">
        <div className="flex items-center gap-1.5">
          <FileCode2 className="h-3 w-3 text-muted-foreground/40" />
          <span className="text-[10px] font-mono text-muted-foreground/40">
            {filename || lang}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 rounded-md text-muted-foreground/30 hover:text-foreground"
          onClick={handleCopy}
        >
          <AnimatePresence mode="wait">
            {copied ? (
              <motion.div
                key="check"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.12 }}
              >
                <Check className="h-3 w-3 text-emerald-400" />
              </motion.div>
            ) : (
              <motion.div
                key="copy"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.12 }}
              >
                <Copy className="h-3 w-3" />
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </div>

      {/* Código */}
      <div className="code-block-pre border-0 rounded-none">
        <SyntaxHighlighter
          language={lang}
          style={oneDark}
          customStyle={{
            margin: 0,
            padding: "0.75rem 1rem",
            background: "transparent",
            fontSize: "0.8125rem",
            lineHeight: "1.7",
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
            color: "oklch(0.4 0 0 / 30%)",
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
