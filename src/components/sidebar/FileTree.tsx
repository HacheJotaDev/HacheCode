"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  FolderOpen,
  FileCode2,
  FileJson,
  FileType,
} from "lucide-react";

interface FileNode {
  name: string;
  type: "file" | "folder";
  children?: FileNode[];
}

const FILE_TREE_DATA: FileNode[] = [
  {
    name: "src",
    type: "folder",
    children: [
      {
        name: "bridge",
        type: "folder",
        children: [
          { name: "bridgeApi.ts", type: "file" },
          { name: "bridgeConfig.ts", type: "file" },
          { name: "codeSessionApi.ts", type: "file" },
        ],
      },
      {
        name: "cli",
        type: "folder",
        children: [
          {
            name: "transports",
            type: "folder",
            children: [
              { name: "SSETransport.ts", type: "file" },
              { name: "WebSocketTransport.ts", type: "file" },
            ],
          },
        ],
      },
      {
        name: "commands",
        type: "folder",
        children: [
          { name: "config", type: "folder", children: [] },
          { name: "model", type: "folder", children: [] },
          { name: "agents", type: "folder", children: [] },
        ],
      },
      {
        name: "components",
        type: "folder",
        children: [
          { name: "ModelPicker.tsx", type: "file" },
          { name: "Settings", type: "folder", children: [] },
        ],
      },
      {
        name: "services",
        type: "folder",
        children: [
          {
            name: "api",
            type: "folder",
            children: [
              { name: "client.ts", type: "file" },
              { name: "claude.ts", type: "file" },
              { name: "grove.ts", type: "file" },
            ],
          },
        ],
      },
      {
        name: "constants",
        type: "folder",
        children: [
          { name: "apiLimits.ts", type: "file" },
          { name: "oauth.ts", type: "file" },
        ],
      },
      {
        name: "utils",
        type: "folder",
        children: [
          {
            name: "model",
            type: "folder",
            children: [{ name: "providers.ts", type: "file" }],
          },
        ],
      },
      {
        name: "tools",
        type: "folder",
        children: [
          { name: "AgentTool", type: "folder", children: [] },
          { name: "BashTool", type: "folder", children: [] },
          { name: "FileTool", type: "folder", children: [] },
        ],
      },
    ],
  },
];

function getFileIcon(name: string) {
  if (name.endsWith(".tsx") || name.endsWith(".ts"))
    return <FileCode2 className="h-3.5 w-3.5 text-orange-accent/70" />;
  if (name.endsWith(".json"))
    return <FileJson className="h-3.5 w-3.5 text-orange-accent/70" />;
  if (name.endsWith(".md"))
    return <FileType className="h-3.5 w-3.5 text-orange-accent/70" />;
  return <File className="h-3.5 w-3.5 text-muted-foreground" />;
}

interface FileTreeItemProps {
  node: FileNode;
  depth: number;
  parentPath: string;
  activeFile?: string;
  onFileClick?: (path: string) => void;
}

function FileTreeItem({ node, depth, parentPath, activeFile, onFileClick }: FileTreeItemProps) {
  const [isOpen, setIsOpen] = useState(depth < 2);

  const fullPath = parentPath ? `${parentPath}/${node.name}` : node.name;

  const handleClick = () => {
    if (node.type === "folder") {
      setIsOpen(!isOpen);
    } else {
      onFileClick?.(fullPath);
    }
  };

  const isFolder = node.type === "folder";
  const isActive = activeFile === fullPath;

  return (
    <div>
      <motion.button
        onClick={handleClick}
        className={`flex items-center gap-1 w-full py-1 px-2 text-left text-xs rounded-md transition-colors duration-150
          ${isActive ? "bg-orange-accent/10 text-orange-accent" : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"}
        `}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        whileHover={{ x: 2 }}
        transition={{ duration: 0.15 }}
      >
        {isFolder ? (
          <>
            {isOpen ? (
              <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground/60" />
            ) : (
              <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/60" />
            )}
            {isOpen ? (
              <FolderOpen className="h-3.5 w-3.5 shrink-0 text-orange-accent/60" />
            ) : (
              <Folder className="h-3.5 w-3.5 shrink-0 text-orange-accent/40" />
            )}
          </>
        ) : (
          <>
            <span className="w-3 shrink-0" />
            {getFileIcon(node.name)}
          </>
        )}
        <span className="truncate font-mono">{node.name}</span>
      </motion.button>

      <AnimatePresence initial={false}>
        {isFolder && isOpen && node.children && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            {node.children.map((child) => (
              <FileTreeItem
                key={child.name}
                node={child}
                depth={depth + 1}
                parentPath={fullPath}
                activeFile={activeFile}
                onFileClick={onFileClick}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FileTree({ activeFile, onFileClick }: { activeFile?: string; onFileClick?: (path: string) => void }) {
  return (
    <div className="py-1">
      {FILE_TREE_DATA.map((node) => (
        <FileTreeItem
          key={node.name}
          node={node}
          depth={0}
          parentPath=""
          activeFile={activeFile}
          onFileClick={onFileClick}
        />
      ))}
    </div>
  );
}
