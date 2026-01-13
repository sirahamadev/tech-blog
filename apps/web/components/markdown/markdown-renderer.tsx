"use client"

import { useMemo } from "react"

interface MarkdownRendererProps {
  content: string
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const html = useMemo(() => {
    // 簡易的なMarkdownパーサー（実際のプロジェクトではreact-markdownなどを使用）
    let result = content

    // コードブロック
    result = result.replace(
      /```(\w+)?\n([\s\S]*?)```/g,
      (_, lang, code) =>
        `<pre class="bg-muted rounded-lg p-4 overflow-x-auto my-4"><code class="text-sm font-mono">${escapeHtml(code.trim())}</code></pre>`,
    )

    // インラインコード
    result = result.replace(/`([^`]+)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')

    // 見出し
    result = result.replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-6 mb-2">$1</h3>')
    result = result.replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold mt-8 mb-3">$1</h2>')
    result = result.replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>')

    // リスト
    result = result.replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    result = result.replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal">$2</li>')

    // 段落
    result = result
      .split("\n\n")
      .map((para) => {
        if (
          para.startsWith("<h") ||
          para.startsWith("<pre") ||
          para.startsWith("<li") ||
          para.startsWith("<ul") ||
          para.startsWith("<ol")
        ) {
          return para
        }
        if (para.trim().startsWith("<li")) {
          return `<ul class="my-4 space-y-1">${para}</ul>`
        }
        return `<p class="text-muted-foreground leading-relaxed my-4">${para}</p>`
      })
      .join("")

    return result
  }, [content])

  return <div className="prose-custom" dangerouslySetInnerHTML={{ __html: html }} />
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}
