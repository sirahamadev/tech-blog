"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { ChevronRight, Folder, FileText, Code, Award } from "lucide-react"
import { cn } from "@/lib/utils"
import { buildTree, type TreeNode } from "@/lib/mock-data"

interface NotesTreeProps {
  onNavigate?: () => void
  currentPath?: string[]
}

const rootIcons: Record<string, React.ElementType> = {
  projects: Code,
  certifications: Award,
  notes: FileText,
}

function TreeItem({
  node,
  level = 0,
  onNavigate,
  currentPath,
  expandedIds,
  toggleExpanded,
}: {
  node: TreeNode
  level?: number
  onNavigate?: () => void
  currentPath?: string[]
  expandedIds: Set<string>
  toggleExpanded: (id: string) => void
}) {
  const children = buildTree(node.id)
  const hasChildren = children.length > 0
  const isExpanded = expandedIds.has(node.id)
  const isFolder = node.type === "folder"
  const Icon = level === 0 && isFolder ? rootIcons[node.name] || Folder : isFolder ? Folder : FileText

  const nodePath = getNodePath(node)
  const isActive = currentPath?.join("/") === nodePath.join("/")

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-1 rounded-md px-2 py-1.5 text-sm transition-colors",
          isActive ? "bg-accent text-accent-foreground" : "hover:bg-accent/50",
          level > 0 && "ml-3",
        )}
      >
        {hasChildren ? (
          <button
            onClick={() => toggleExpanded(node.id)}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded hover:bg-accent"
          >
            <ChevronRight className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-90")} />
          </button>
        ) : (
          <span className="w-5" />
        )}
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
        {isFolder ? (
          <span className="truncate font-medium">{node.name}</span>
        ) : (
          <Link href={`/notes/${nodePath.join("/")}`} className="flex-1 truncate" onClick={onNavigate}>
            {node.title || node.name}
          </Link>
        )}
      </div>
      {hasChildren && isExpanded && (
        <div className="ml-2 border-l border-border">
          {children.map((child) => (
            <TreeItem
              key={child.id}
              node={child}
              level={level + 1}
              onNavigate={onNavigate}
              currentPath={currentPath}
              expandedIds={expandedIds}
              toggleExpanded={toggleExpanded}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function getNodePath(node: TreeNode): string[] {
  const path: string[] = [node.name]
  let current = node
  const allNodes = buildTree(null).concat(
    buildTree(null).flatMap((n) => buildTree(n.id).concat(buildTree(n.id).flatMap((c) => buildTree(c.id)))),
  )

  while (current.parent_id) {
    const parent = allNodes.find((n) => n.id === current.parent_id)
    if (parent) {
      path.unshift(parent.name)
      current = parent
    } else {
      break
    }
  }

  return path
}

export function NotesTree({ onNavigate, currentPath }: NotesTreeProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    new Set(["root-projects", "root-certifications", "root-notes"]),
  )

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const rootNodes = buildTree(null)

  return (
    <div className="space-y-1">
      {rootNodes.map((node) => (
        <TreeItem
          key={node.id}
          node={node}
          onNavigate={onNavigate}
          currentPath={currentPath}
          expandedIds={expandedIds}
          toggleExpanded={toggleExpanded}
        />
      ))}
    </div>
  )
}
