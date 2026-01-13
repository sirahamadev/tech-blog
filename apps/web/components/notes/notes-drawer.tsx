"use client"

import { useState } from "react"
import { BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { NotesTree } from "@/components/notes/notes-tree"

export function NotesDrawer() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <BookOpen className="h-4 w-4" />
          <span className="hidden sm:inline">Notes</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0">
        <SheetTitle className="sr-only">Notes ナビゲーション</SheetTitle>
        <div className="flex h-full flex-col">
          <div className="border-b border-border p-4">
            <h2 className="font-semibold">Notes</h2>
            <p className="text-sm text-muted-foreground">ツリー構造で記事を探す</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <NotesTree onNavigate={() => setOpen(false)} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
