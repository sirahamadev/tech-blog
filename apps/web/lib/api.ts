import type {
  PostsResponse,
  PostDetail,
  TagsResponse,
  NotesTreeResponse,
  NoteContentResponse,
} from '../types/api';

import { headers } from 'next/headers';

/**
 * API のベースURL
 *
 * BFFパターン（Backend For Frontend）を採用しているため、
 * クライアントからは常に Next.js の Route Handler (/api/...) を呼び出す。
 * 外部APIのURLはサーバーサイド（Route Handler）でのみ使用し、ここには含めない。
 */
const API_BASE = '/api';

/**
 * サーバー実行時に「絶対URL」を組み立てるための origin を取得する
 *
 * 背景：
 * - ブラウザの fetch は "/api/..." のような相対URLでも動く
 * - しかし Server Component（Node.js側）では相対URLが解釈できず
 *   `Failed to parse URL from /api/...` が起きることがある
 *
 * 対策：
 * - リクエストヘッダの host / x-forwarded-proto から origin を作り、
 *   new URL(path, origin) で絶対URLに変換してから fetch する
 */
async function getRequestOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get('host');

  // ここが取れない場合の保険（開発時は基本 host が入る想定）
  if (!host) return 'http://localhost:3000';

  // Vercel/プロキシ環境では x-forwarded-proto が付く
  const proto = h.get('x-forwarded-proto') ?? 'http';
  return `${proto}://${host}`;
}

/**
 * API呼び出しの共通関数（型付き）
 *
 * 役割：
 * - fetch の呼び出しを共通化する
 * - HTTPエラー時に例外を投げる（呼び出し側で try/catch できる）
 * - レスポンス JSON を型Tとして返す（TypeScript上の契約）
 *
 * キャッシュについて：
 * - デフォルトは no-store（常に最新を取りに行く）
 * - 開発中は「更新したのに反映されない」問題を避けられる
 * - 本番では、用途に応じて force-cache / revalidate などに変更検討
 */
async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  // ブラウザ: /api/...（相対）でOK
  // サーバー: 絶対URLにしないと落ちることがあるので組み立てる
  const url =
    typeof window === 'undefined'
      ? new URL(`${API_BASE}${path}`, await getRequestOrigin()).toString()
      : `${API_BASE}${path}`;

  const res = await fetch(url, {
    ...options,
    /**
     * cache のデフォルトは no-store
     * - options.cache が指定されていればそれを優先
     * - 未指定なら no-store（開発/鮮度優先）
     *
     * ※ Next.js の fetch はキャッシュが絡むので、
     *   意図しない「古いデータ」が出るときはまずここを疑う
     */
    cache: options?.cache ?? 'no-store',
  });

  // 2xx以外はエラーとして扱う（UI側で握りつぶさず気づけるように）
  if (!res.ok) {
    // JSONエラー形式が返る想定だが、念のため失敗しても落とさない
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `API Error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

/**
 * APIクライアント（用途別に関数をまとめたもの）
 *
 * 使い方イメージ：
 * - Server Component から呼ぶ（推奨：初期表示に必要なデータ）
 * - Client Component から呼ぶ（ユーザー操作で再取得したい場合）
 *
 * ※ BFFパターンなので、クライアントに外部API URLは露出しない
 */
export const api = {
  /**
   * 記事一覧取得
   * - ページング、カテゴリ、タグ、検索クエリに対応
   * - category=all のときはクエリに含めない（API側の分岐を単純化）
   */
  getPosts: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    tag?: string;
    q?: string;
  }) => {
    const searchParams = new URLSearchParams();

    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));

    if (params?.category && params.category !== 'all') {
      searchParams.set('category', params.category);
    }

    if (params?.tag) searchParams.set('tag', params.tag);
    if (params?.q) searchParams.set('q', params.q);

    const qs = searchParams.toString();
    return fetchApi<PostsResponse>(`/posts${qs ? `?${qs}` : ''}`);
  },

  /**
   * 記事詳細取得（slug指定）
   */
  getPostBySlug: async (slug: string) => {
    return fetchApi<PostDetail>(`/posts/${slug}`);
  },

  /**
   * タグ一覧取得
   */
  getTags: async () => {
    return fetchApi<TagsResponse>('/tags');
  },

  /**
   * Notesツリー取得
   */
  getNoteTree: async () => fetchApi<NotesTreeResponse>('/notes/tree'),

  /**
   * Notesノードの内容取得
   * - node情報 + (postが紐づくなら)記事内容を返す想定
   */
  getNoteContent: async (id: string) => {
    return fetchApi<NoteContentResponse>(`/notes/content/${id}`);
  },
};
