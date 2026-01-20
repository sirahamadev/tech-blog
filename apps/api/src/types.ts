/**
 * posts テーブルに対応する型
 * 記事そのもの（中身）を表す
 */
export interface Post {
  id: string;
  slug: string; // URL用の一意な識別子
  title: string; // 記事タイトル
  excerpt: string; // 一覧用の抜粋文
  content_md: string; // Markdown形式の本文
  category: string; // 記事カテゴリ（Articles用）
  published_date: string; // 公開日
  created_at: string;
  updated_at: string;
}

/**
 * tags テーブルに対応する型
 * タグのマスタデータ
 */
export interface Tag {
  id: string;
  name: string; // 表示名
  slug: string; // URL / クエリ用識別子
  created_at: string;
}

/**
 * post_tags テーブルに対応する型
 * posts と tags の中間テーブル（多対多）
 */
export interface PostTag {
  post_id: string;
  tag_id: string;
  created_at: string;
}

/**
 * note_nodes テーブルに対応する型
 * Notes 画面用のツリー構造を表す
 */
export interface NoteNode {
  id: string;
  parent_id: string | null; // 親ノード（null の場合はルート）
  node_type: 'folder' | 'post'; // フォルダ or 記事ノード
  slug: string; // パス用識別子
  title: string; // 表示名
  sort_order: number; // 並び順
  post_id: string | null; // node_type='post' のときのみ posts.id が入る
  created_at: string;
  updated_at: string;
}

/* =========================
   API レスポンス用の型
   ========================= */

/**
 * APIで返すタグの最小単位
 * （PostDetail などで使用）
 */
export interface ApiTag {
  id: string;
  name: string;
  slug: string;
}

/**
 * タグ一覧API用の型
 * 各タグに「紐づく記事数」を持たせる
 */
export interface TagWithCount extends ApiTag {
  count: number;
}

/**
 * GET /tags のレスポンス
 */
export interface TagsResponse {
  items: TagWithCount[];
}

/**
 * 記事一覧（Articles）用のサマリー型
 * 一覧表示に必要な最低限の情報のみ持つ
 */
export interface PostSummary {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  published_date: string;
  /**
   * タグは一覧表示ではシンプルに string[] とする
   * （詳細画面では ApiTag[] を使用）
   */
  tags: string[];
}

/**
 * 記事詳細（Articles）用の型
 */
export interface PostDetail {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content_md: string;
  category: string;
  published_date: string;
  tags: ApiTag[]; // 詳細ではタグ情報をオブジェクトで返す
  note_node_id: string | null; // Notes 側に対応するノードID（あれば）
}

/**
 * GET /posts のレスポンス
 */
export interface PostsResponse {
  items: PostSummary[];
  total: number;
}

/**
 * GET /notes/content/:id のレスポンス
 */
export interface NoteContentResponse {
  node: NoteNode;
  post: Post | null;
}

/**
 * GET /notes/tree のレスポンス
 */
export interface NotesTreeResponse {
  root: NoteNode | null; // 指定されたルートノード
  nodes: NoteNode[]; // ルート配下のノード一覧（フラット）
}
