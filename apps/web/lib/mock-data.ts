// モックデータ - UIが想定するデータ構造

export type NodeType = "folder" | "post"

export interface TreeNode {
  id: string
  type: NodeType
  name: string
  parent_id: string | null
  sort_order: number
  // post専用フィールド
  title?: string
  excerpt?: string
  content_md?: string
  tags?: string[]
  category?: "projects" | "certifications" | "notes"
  date?: string
  slug?: string
}

// ツリー構造のモックデータ
export const mockTreeData: TreeNode[] = [
  // ルートフォルダ
  { id: "root-projects", type: "folder", name: "projects", parent_id: null, sort_order: 0 },
  { id: "root-certifications", type: "folder", name: "certifications", parent_id: null, sort_order: 1 },
  { id: "root-notes", type: "folder", name: "notes", parent_id: null, sort_order: 2 },

  // Projects配下
  {
    id: "projects-overview",
    type: "post",
    name: "overview",
    parent_id: "root-projects",
    sort_order: 0,
    title: "Projects Overview",
    excerpt: "個人プロジェクトや業務で取り組んだ開発の一覧です。",
    content_md:
      "# Projects Overview\n\nこのセクションでは、個人プロジェクトや業務で取り組んだ開発について紹介しています。\n\n## カテゴリ\n\n- Webアプリケーション\n- CLI ツール\n- ライブラリ・OSS貢献",
    tags: ["overview"],
    category: "projects",
    date: "2024-01-15",
    slug: "projects-overview",
  },
  { id: "projects-web", type: "folder", name: "web-apps", parent_id: "root-projects", sort_order: 1 },
  {
    id: "project-ecommerce",
    type: "post",
    name: "ecommerce-platform",
    parent_id: "projects-web",
    sort_order: 0,
    title: "ECサイト構築プロジェクト",
    excerpt: "Next.js + Stripeを使用したフルスタックECサイトの開発記録",
    content_md:
      "# ECサイト構築プロジェクト\n\n## 概要\n\nNext.js 14とStripeを使用したモダンなECサイトを構築しました。\n\n## 技術スタック\n\n- Next.js 14 (App Router)\n- TypeScript\n- Tailwind CSS\n- Stripe\n- Supabase\n\n## 主な機能\n\n```typescript\n// カート機能の実装例\nconst addToCart = async (productId: string) => {\n  const response = await fetch('/api/cart', {\n    method: 'POST',\n    body: JSON.stringify({ productId })\n  })\n  return response.json()\n}\n```\n\n## 学んだこと\n\n- Server Actionsの活用\n- Stripeの決済フロー\n- 在庫管理の設計",
    tags: ["Next.js", "TypeScript", "Stripe", "Supabase"],
    category: "projects",
    date: "2024-03-10",
    slug: "ecommerce-platform",
  },
  {
    id: "project-dashboard",
    type: "post",
    name: "analytics-dashboard",
    parent_id: "projects-web",
    sort_order: 1,
    title: "リアルタイム分析ダッシュボード",
    excerpt: "WebSocketを活用したリアルタイムデータ可視化ダッシュボード",
    content_md:
      "# リアルタイム分析ダッシュボード\n\n## 概要\n\nWebSocketを使用してリアルタイムでデータを可視化するダッシュボードを開発しました。",
    tags: ["React", "WebSocket", "D3.js", "Node.js"],
    category: "projects",
    date: "2024-02-20",
    slug: "analytics-dashboard",
  },

  // Certifications配下
  {
    id: "certs-overview",
    type: "post",
    name: "overview",
    parent_id: "root-certifications",
    sort_order: 0,
    title: "Certifications Overview",
    excerpt: "取得した資格の一覧と学習記録です。",
    content_md: "# Certifications Overview\n\n取得済みの資格と学習プロセスを記録しています。",
    tags: ["overview"],
    category: "certifications",
    date: "2024-01-10",
    slug: "certifications-overview",
  },
  { id: "certs-aws", type: "folder", name: "aws", parent_id: "root-certifications", sort_order: 1 },
  {
    id: "cert-saa",
    type: "post",
    name: "solutions-architect",
    parent_id: "certs-aws",
    sort_order: 0,
    title: "AWS Solutions Architect Associate",
    excerpt: "AWS SAA-C03の合格体験記と学習方法",
    content_md:
      "# AWS Solutions Architect Associate\n\n## 受験結果\n\n- スコア: 842/1000\n- 受験日: 2024年2月\n\n## 学習方法\n\n1. 公式ドキュメント精読\n2. ハンズオンラボ\n3. 模擬試験",
    tags: ["AWS", "資格", "クラウド"],
    category: "certifications",
    date: "2024-02-28",
    slug: "aws-solutions-architect",
  },
  {
    id: "cert-developer",
    type: "post",
    name: "developer-associate",
    parent_id: "certs-aws",
    sort_order: 1,
    title: "AWS Developer Associate",
    excerpt: "AWS DVA-C02の学習記録と試験対策",
    content_md: "# AWS Developer Associate\n\n## 学習内容\n\n- Lambda\n- API Gateway\n- DynamoDB\n- S3",
    tags: ["AWS", "資格", "開発"],
    category: "certifications",
    date: "2024-04-15",
    slug: "aws-developer-associate",
  },

  // Notes配下
  {
    id: "notes-overview",
    type: "post",
    name: "overview",
    parent_id: "root-notes",
    sort_order: 0,
    title: "Notes Overview",
    excerpt: "技術メモや学習ノートの一覧です。",
    content_md: "# Notes Overview\n\n日々の学習で得た知見やTipsをまとめています。",
    tags: ["overview"],
    category: "notes",
    date: "2024-01-05",
    slug: "notes-overview",
  },
  { id: "notes-typescript", type: "folder", name: "typescript", parent_id: "root-notes", sort_order: 1 },
  {
    id: "note-ts-tips",
    type: "post",
    name: "advanced-tips",
    parent_id: "notes-typescript",
    sort_order: 0,
    title: "TypeScript 実践Tips",
    excerpt: "業務で使えるTypeScriptの実践的なテクニック集",
    content_md:
      "# TypeScript 実践Tips\n\n## 型ガード\n\n```typescript\nfunction isString(value: unknown): value is string {\n  return typeof value === 'string'\n}\n```\n\n## Utility Types活用\n\n```typescript\ntype PartialPick<T, K extends keyof T> = Partial<Pick<T, K>> & Omit<T, K>\n```",
    tags: ["TypeScript", "Tips", "型システム"],
    category: "notes",
    date: "2024-03-25",
    slug: "typescript-advanced-tips",
  },
  { id: "notes-react", type: "folder", name: "react", parent_id: "root-notes", sort_order: 2 },
  {
    id: "note-react-patterns",
    type: "post",
    name: "design-patterns",
    parent_id: "notes-react",
    sort_order: 0,
    title: "Reactデザインパターン",
    excerpt: "再利用性の高いReactコンポーネント設計パターン",
    content_md:
      "# Reactデザインパターン\n\n## Compound Components\n\n親子間で状態を共有するパターン\n\n## Render Props\n\nロジックの再利用パターン",
    tags: ["React", "デザインパターン", "コンポーネント設計"],
    category: "notes",
    date: "2024-04-01",
    slug: "react-design-patterns",
  },
]

// 記事一覧を取得
export function getAllPosts(): TreeNode[] {
  return mockTreeData.filter((node) => node.type === "post" && node.tags?.[0] !== "overview")
}

// カテゴリでフィルタリング
export function getPostsByCategory(category: string): TreeNode[] {
  return getAllPosts().filter((node) => node.category === category)
}

// タグでフィルタリング
export function getPostsByTag(tag: string): TreeNode[] {
  return getAllPosts().filter((node) => node.tags?.includes(tag))
}

// 全タグを取得
export function getAllTags(): string[] {
  const tags = new Set<string>()
  getAllPosts().forEach((post) => {
    post.tags?.forEach((tag) => tags.add(tag))
  })
  return Array.from(tags).sort()
}

// ツリー構造を構築
export function buildTree(parentId: string | null = null): TreeNode[] {
  return mockTreeData.filter((node) => node.parent_id === parentId).sort((a, b) => a.sort_order - b.sort_order)
}

// パスからノードを取得
export function getNodeByPath(path: string[]): TreeNode | null {
  let currentParentId: string | null = null
  let targetNode: TreeNode | null = null

  for (const segment of path) {
    const node = mockTreeData.find((n) => n.parent_id === currentParentId && n.name === segment)
    if (!node) return null
    targetNode = node
    currentParentId = node.id
  }

  return targetNode
}

// パンくずを取得
export function getBreadcrumbs(nodeId: string): TreeNode[] {
  const breadcrumbs: TreeNode[] = []
  let currentNode = mockTreeData.find((n) => n.id === nodeId)

  while (currentNode) {
    breadcrumbs.unshift(currentNode)
    currentNode = mockTreeData.find((n) => n.id === currentNode?.parent_id)
  }

  return breadcrumbs
}

// カテゴリ情報
export const categoryInfo = {
  projects: {
    name: "Projects",
    description: "個人プロジェクトや業務での開発記録",
    icon: "Code",
  },
  certifications: {
    name: "Certifications",
    description: "取得した資格と学習プロセス",
    icon: "Award",
  },
  notes: {
    name: "Notes",
    description: "技術メモや学習ノート",
    icon: "FileText",
  },
} as const
