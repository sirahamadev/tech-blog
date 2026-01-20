'use client';

import * as React from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Folder, FileText, Code, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NoteNode } from '@/types/api';

interface NotesTreeProps {
  nodes: NoteNode[];
  onNavigate?: () => void;
}

const rootIcons: Record<string, React.ElementType> = {
  projects: Code,
  certifications: Award,
  notes: FileText,
};

// Helper to get children for a parent
function getChildren(nodes: NoteNode[], parentId: string | null) {
  return nodes.filter((n) => n.parent_id === parentId).sort((a, b) => a.sort_order - b.sort_order);
}

function TreeItem({
  node,
  allNodes,
  level = 0,
  parentPath,
  onNavigate,
  expandedIds,
  toggleExpanded,
  currentPathname,
}: {
  node: NoteNode;
  allNodes: NoteNode[];
  level?: number;
  parentPath: string;
  onNavigate?: () => void;
  expandedIds: Set<string>;
  toggleExpanded: (id: string) => void;
  currentPathname: string;
}) {
  const children = getChildren(allNodes, node.id);
  const hasChildren = children.length > 0;
  const isExpanded = expandedIds.has(node.id);
  const isFolder = node.node_type === 'folder';

  // Icon logic
  const Icon =
    level === 0 && isFolder ? rootIcons[node.slug] || Folder : isFolder ? Folder : FileText;

  // URL path for this node: /notes/parent/child
  const href = `${parentPath}/${node.slug}`;

  // Active check: exact match or child path
  const isActive = currentPathname === href || currentPathname.startsWith(href + '/');

  return (
    <div>
      <div
        className={cn(
          'group flex items-center gap-1 rounded-md px-2 py-1.5 text-sm transition-colors',
          isActive ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50',
          level > 0 && 'ml-3',
        )}
      >
        {/* Toggle Button */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.preventDefault();
              toggleExpanded(node.id);
            }}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded hover:bg-accent"
          >
            <ChevronRight
              className={cn('h-4 w-4 transition-transform', isExpanded && 'rotate-90')}
            />
          </button>
        ) : (
          <span className="w-5" />
        )}

        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />

        <Link href={href} className="flex-1 truncate font-medium" onClick={onNavigate}>
          {node.title}
        </Link>
      </div>

      {hasChildren && isExpanded && (
        <div className="ml-2 border-l border-border">
          {children.map((child) => (
            <TreeItem
              key={child.id}
              node={child}
              allNodes={allNodes}
              level={level + 1}
              parentPath={href}
              onNavigate={onNavigate}
              expandedIds={expandedIds}
              toggleExpanded={toggleExpanded}
              currentPathname={currentPathname}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function NotesTree({ nodes, onNavigate }: NotesTreeProps) {
  const pathname = usePathname();

  // Initialize expanded state: open root folders by default
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    const roots = getChildren(nodes, null);
    roots.forEach((n) => {
      // Open immediate root folders
      if (n.node_type === 'folder') initial.add(n.id);
    });
    return initial;
  });

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const rootNodes = getChildren(nodes, null);

  return (
    <div className="space-y-1">
      {rootNodes.map((node) => (
        <TreeItem
          key={node.id}
          node={node}
          allNodes={nodes}
          parentPath="/notes"
          onNavigate={onNavigate}
          expandedIds={expandedIds}
          toggleExpanded={toggleExpanded}
          currentPathname={pathname}
        />
      ))}
    </div>
  );
}
