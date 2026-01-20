import type React from 'react';
import { NotesTree } from '@/components/notes/notes-tree';
import { api } from '@/lib/api';

export default async function NotesLayout({ children }: { children: React.ReactNode }) {
  const { nodes } = await api.getNoteTree();

  return (
    <div className="flex flex-1">
      <aside className="h-[calc(100vh-3.5rem)] w-64 shrink-0 border-r border-border bg-sidebar sticky top-14">
        <div className="flex h-full flex-col">
          <div className="border-b border-sidebar-border p-4">
            <h2 className="font-semibold text-sidebar-foreground">Notes</h2>
            <p className="text-sm text-sidebar-foreground/60">ツリー構造で記事を探す</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <NotesTree nodes={nodes} />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1">{children}</main>
    </div>
  );
}
