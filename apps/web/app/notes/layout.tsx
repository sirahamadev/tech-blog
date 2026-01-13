import type React from "react"
import { NotesTree } from "@/components/notes/notes-tree"
import { NotesMobileDrawer } from "@/components/notes/notes-mobile-drawer"

export default function NotesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-1">
      {/* Desktop Sidebar - Notesページ内の要素として表示 */}
      <aside className="hidden h-[calc(100vh-3.5rem)] w-64 shrink-0 border-r border-border bg-sidebar lg:block sticky top-14">
        <div className="flex h-full flex-col">
          <div className="border-b border-sidebar-border p-4">
            <h2 className="font-semibold text-sidebar-foreground">Notes</h2>
            <p className="text-sm text-sidebar-foreground/60">ツリー構造で記事を探す</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <NotesTree />
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Trigger - Notesページ内のみで使用 */}
      <div className="fixed left-4 top-18 z-40 lg:hidden">
        <NotesMobileDrawer />
      </div>

      {/* Main Content */}
      <main className="flex-1">{children}</main>
    </div>
  )
}
