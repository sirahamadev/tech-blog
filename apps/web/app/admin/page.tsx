"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ChevronRight,
  Folder,
  FileText,
  Plus,
  Trash2,
  Pencil,
  GripVertical,
  ArrowLeft,
  FolderPlus,
  FilePlus,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { mockTreeData, buildTree, type TreeNode } from "@/lib/mock-data"

export default function AdminPage() {
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null)
  const [treeData, setTreeData] = useState(mockTreeData)
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

  const handleNodeUpdate = (updatedNode: TreeNode) => {
    setTreeData((prev) => prev.map((node) => (node.id === updatedNode.id ? updatedNode : node)))
    setSelectedNode(updatedNode)
  }

  const handleAddNode = (parentId: string | null, type: "folder" | "post") => {
    const newId = `new-${Date.now()}`
    const siblings = treeData.filter((n) => n.parent_id === parentId)
    const newNode: TreeNode = {
      id: newId,
      type,
      name: type === "folder" ? "new-folder" : "new-post",
      parent_id: parentId,
      sort_order: siblings.length,
      ...(type === "post" && {
        title: "新しい記事",
        excerpt: "",
        content_md: "",
        tags: [],
        category:
          parentId === "root-projects" ? "projects" : parentId === "root-certifications" ? "certifications" : "notes",
        date: new Date().toISOString().split("T")[0],
        slug: `new-post-${Date.now()}`,
      }),
    }
    setTreeData((prev) => [...prev, newNode])
    setSelectedNode(newNode)
    if (parentId) {
      setExpandedIds((prev) => new Set([...prev, parentId]))
    }
  }

  const handleDeleteNode = (nodeId: string) => {
    // 子ノードも削除
    const idsToDelete = new Set<string>()
    const collectIds = (id: string) => {
      idsToDelete.add(id)
      treeData.filter((n) => n.parent_id === id).forEach((child) => collectIds(child.id))
    }
    collectIds(nodeId)

    setTreeData((prev) => prev.filter((n) => !idsToDelete.has(n.id)))
    if (selectedNode && idsToDelete.has(selectedNode.id)) {
      setSelectedNode(null)
    }
  }

  const rootNodes = buildTree(null)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-muted-foreground transition-colors hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="font-semibold">コンテンツ管理</h1>
          </div>
          <div className="flex items-center gap-2">
            <AddNodeDialog onAdd={handleAddNode} />
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-3.5rem)]">
        {/* Tree Panel */}
        <aside className="w-80 shrink-0 overflow-y-auto border-r border-border bg-muted/30 p-4">
          <div className="space-y-1">
            {rootNodes.map((node) => (
              <AdminTreeItem
                key={node.id}
                node={node}
                treeData={treeData}
                expandedIds={expandedIds}
                toggleExpanded={toggleExpanded}
                selectedId={selectedNode?.id}
                onSelect={setSelectedNode}
                onAdd={handleAddNode}
                onDelete={handleDeleteNode}
              />
            ))}
          </div>
        </aside>

        {/* Editor Panel */}
        <main className="flex-1 overflow-y-auto p-6">
          {selectedNode ? (
            <NodeEditor node={selectedNode} onUpdate={handleNodeUpdate} />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <div className="text-center">
                <FileText className="mx-auto h-12 w-12 opacity-50" />
                <p className="mt-4">左のツリーからノードを選択してください</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

// ツリーアイテムコンポーネント
function AdminTreeItem({
  node,
  treeData,
  expandedIds,
  toggleExpanded,
  selectedId,
  onSelect,
  onAdd,
  onDelete,
  level = 0,
}: {
  node: TreeNode
  treeData: TreeNode[]
  expandedIds: Set<string>
  toggleExpanded: (id: string) => void
  selectedId?: string
  onSelect: (node: TreeNode) => void
  onAdd: (parentId: string | null, type: "folder" | "post") => void
  onDelete: (nodeId: string) => void
  level?: number
}) {
  const children = treeData.filter((n) => n.parent_id === node.id).sort((a, b) => a.sort_order - b.sort_order)
  const hasChildren = children.length > 0
  const isExpanded = expandedIds.has(node.id)
  const isFolder = node.type === "folder"
  const isSelected = selectedId === node.id
  const isRoot = node.parent_id === null

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-1 rounded-md px-2 py-1.5 text-sm",
          isSelected ? "bg-accent text-accent-foreground" : "hover:bg-accent/50",
          level > 0 && "ml-4",
        )}
      >
        {/* Drag Handle */}
        <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-muted-foreground opacity-0 group-hover:opacity-100" />

        {/* Expand Toggle */}
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

        {/* Icon */}
        {isFolder ? (
          <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}

        {/* Name */}
        <button onClick={() => onSelect(node)} className="flex-1 truncate text-left">
          {node.title || node.name}
        </button>

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
              <Plus className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isFolder && (
              <>
                <DropdownMenuItem onClick={() => onAdd(node.id, "folder")}>
                  <FolderPlus className="mr-2 h-4 w-4" />
                  フォルダを追加
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAdd(node.id, "post")}>
                  <FilePlus className="mr-2 h-4 w-4" />
                  記事を追加
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={() => onSelect(node)}>
              <Pencil className="mr-2 h-4 w-4" />
              編集
            </DropdownMenuItem>
            {!isRoot && (
              <DropdownMenuItem onClick={() => onDelete(node.id)} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                削除
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="border-l border-border ml-4">
          {children.map((child) => (
            <AdminTreeItem
              key={child.id}
              node={child}
              treeData={treeData}
              expandedIds={expandedIds}
              toggleExpanded={toggleExpanded}
              selectedId={selectedId}
              onSelect={onSelect}
              onAdd={onAdd}
              onDelete={onDelete}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ノード編集フォーム
function NodeEditor({ node, onUpdate }: { node: TreeNode; onUpdate: (node: TreeNode) => void }) {
  const [formData, setFormData] = useState(node)
  const [tagInput, setTagInput] = useState("")

  // ノードが変更されたらフォームデータをリセット
  if (formData.id !== node.id) {
    setFormData(node)
  }

  const handleChange = (field: keyof TreeNode, value: string | string[]) => {
    const updated = { ...formData, [field]: value }
    setFormData(updated)
    onUpdate(updated)
  }

  const addTag = () => {
    if (tagInput && !formData.tags?.includes(tagInput)) {
      handleChange("tags", [...(formData.tags || []), tagInput])
      setTagInput("")
    }
  }

  const removeTag = (tag: string) => {
    handleChange("tags", formData.tags?.filter((t) => t !== tag) || [])
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{node.type === "folder" ? "フォルダ編集" : "記事編集"}</h2>
        <Badge variant="outline">{node.type}</Badge>
      </div>

      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">スラッグ名</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleChange("name", e.target.value)}
          placeholder="例: my-article"
        />
        <p className="text-xs text-muted-foreground">URLパスに使用される名前です</p>
      </div>

      {/* Post specific fields */}
      {node.type === "post" && (
        <>
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">タイトル</Label>
            <Input
              id="title"
              value={formData.title || ""}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="記事のタイトル"
            />
          </div>

          {/* Excerpt */}
          <div className="space-y-2">
            <Label htmlFor="excerpt">概要</Label>
            <Textarea
              id="excerpt"
              value={formData.excerpt || ""}
              onChange={(e) => handleChange("excerpt", e.target.value)}
              placeholder="記事の概要を入力..."
              rows={2}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">カテゴリ</Label>
            <Select value={formData.category || ""} onValueChange={(value) => handleChange("category", value)}>
              <SelectTrigger>
                <SelectValue placeholder="カテゴリを選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="projects">Projects</SelectItem>
                <SelectItem value="certifications">Certifications</SelectItem>
                <SelectItem value="notes">Notes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>タグ</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="タグを追加..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addTag()
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addTag}>
                追加
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {formData.tags?.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 hover:text-destructive"
                    aria-label={`${tag}を削除`}
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">本文 (Markdown)</Label>
            <Textarea
              id="content"
              value={formData.content_md || ""}
              onChange={(e) => handleChange("content_md", e.target.value)}
              placeholder="# 見出し&#10;&#10;本文を入力..."
              rows={15}
              className="font-mono text-sm"
            />
          </div>
        </>
      )}
    </div>
  )
}

// 新規追加ダイアログ
function AddNodeDialog({ onAdd }: { onAdd: (parentId: string | null, type: "folder" | "post") => void }) {
  const [open, setOpen] = useState(false)

  const handleAdd = (type: "folder" | "post") => {
    onAdd(null, type)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          新規追加
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新規ノードを追加</DialogTitle>
          <DialogDescription>ルートレベルに新しいフォルダまたは記事を追加します</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Button
            variant="outline"
            className="h-20 justify-start gap-4 bg-transparent"
            onClick={() => handleAdd("folder")}
          >
            <Folder className="h-8 w-8" />
            <div className="text-left">
              <p className="font-medium">フォルダ</p>
              <p className="text-sm text-muted-foreground">記事をグループ化するフォルダ</p>
            </div>
          </Button>
          <Button
            variant="outline"
            className="h-20 justify-start gap-4 bg-transparent"
            onClick={() => handleAdd("post")}
          >
            <FileText className="h-8 w-8" />
            <div className="text-left">
              <p className="font-medium">記事</p>
              <p className="text-sm text-muted-foreground">Markdown形式の記事</p>
            </div>
          </Button>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            キャンセル
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
