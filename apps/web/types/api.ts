/**
 * ============================
 * DBエンティティ（ER図そのまま）
 * ============================
 * Supabase / PostgreSQL のテーブル構造を
 * フロントエンド（TypeScript）で表現した型
 */

/**
 * 記事本体（posts テーブル）
 * Articles / Notes 両方で使われる中核データ
 */
export interface Post {
  id: string; // 記事ID（UUID, PK）
  slug: string; // URL用スラッグ（ユニーク）
  title: string; // 記事タイトル
  excerpt: string; // 一覧用の短い概要文
  content_md: string; // Markdown本文
  category: string; // 記事カテゴリ（projects / certifications / notes）
  published_date: string; // 公開日（YYYY-MM-DD）
  created_at: string; // 作成日時
  updated_at: string; // 更新日時
}

/**
 * タグ（tags テーブル）
 * 記事に付与される分類ラベル
 */
export interface Tag {
  id: string; // タグID（UUID）
  name: string; // 表示名
  slug: string; // URL用スラッグ
  created_at: string; // 作成日時
}

/**
 * 記事とタグの中間テーブル（post_tags）
 * 多対多（M:N）関係を表す
 */
export interface PostTag {
  post_id: string; // 記事ID（FK → posts.id）
  tag_id: string; // タグID（FK → tags.id）
  created_at: string; // 紐付け作成日時
}

/**
 * Notesツリー用ノード（note_nodes テーブル）
 * フォルダ or 記事リンクを表す
 */
export interface NoteNode {
  id: string; // ノードID
  parent_id: string | null; // 親ノードID（null = ルート）
  node_type: 'folder' | 'post'; // ノード種別
  slug: string; // URLパス用スラッグ
  title: string; // 表示タイトル
  sort_order: number; // 同階層内の並び順
  post_id: string | null; // 記事ノードの場合のみ posts.id
  created_at: string; // 作成日時
  updated_at: string; // 更新日時
}

/**
 * ============================
 * APIレスポンス用の型
 * ============================
 * DB構造をそのまま返さず、
 * UIで使いやすい形に整形したデータ
 */

/**
 * APIで返すタグ情報（最低限）
 * DBの Tag から created_at を省略
 */
export interface ApiTag {
  id: string; // タグID
  name: string; // 表示名
  slug: string; // URL用スラッグ
}

/**
 * タグ一覧 + 紐付いている記事数
 * タグ一覧ページやサイドバー用
 */
export interface TagWithCount extends ApiTag {
  count: number; // このタグが付いている記事数
}

/**
 * タグ一覧APIレスポンス
 */
export interface TagsResponse {
  items: TagWithCount[]; // タグ配列
}

/**
 * 記事一覧用の軽量データ
 * 一覧画面で必要な最小限の情報だけ持つ
 */
export interface PostSummary {
  id: string; // 記事ID
  slug: string; // URL用スラッグ
  title: string; // タイトル
  excerpt: string; // 概要
  category: string; // カテゴリ
  published_date: string; // 公開日
  tags: string[]; // タグslugの配列（一覧では軽量化）
}

/**
 * 記事詳細ページ用のデータ
 * 本文・タグ情報・Notesとの紐付けを含む
 */
export interface PostDetail {
  id: string; // 記事ID
  slug: string; // URL用スラッグ
  title: string; // タイトル
  excerpt: string; // 概要
  content_md: string; // Markdown本文
  category: string; // カテゴリ
  published_date: string; // 公開日
  tags: ApiTag[]; // タグ詳細（一覧より情報多め）
  note_node_id: string | null; // Notes上のノードID（未配置ならnull）
}

/**
 * 記事一覧APIレスポンス
 */
export interface PostsResponse {
  items: PostSummary[]; // 記事一覧
  total: number; // 総件数（ページネーション用）
}

/**
 * Notesのノードをクリックしたときのレスポンス
 * ノード情報 + 紐付く記事（あれば）
 */
export interface NoteContentResponse {
  node: NoteNode; // 選択されたノード
  post: Post | null; // 記事ノードならPost、フォルダならnull
}

/**
 * Notesツリー全体取得APIレスポンス
 * フロント側でツリー構築する前提
 */
export interface NotesTreeResponse {
  root: NoteNode | null; // ルートノード（null可）
  nodes: NoteNode[]; // 全ノード（フラット配列）
}
