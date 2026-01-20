import { Hono } from 'hono';
import { supabase } from '../lib/supabase.js';
import type { TagsResponse, TagWithCount } from '../types.js';

const app = new Hono();

/**
 * GET /tags
 * タグ一覧を取得するAPI
 *
 * - 各タグについて「紐づいている記事数（post数）」も返す
 * - Articles 画面のタグ一覧・絞り込みUI用
 */
app.get('/', async (c) => {
  /**
   * Supabase(PostgREST)では、
   * 「関連テーブルの件数をそのまま count する」ことが少し分かりづらい。
   *
   * ここでは以下の形で取得している：
   * - tags テーブルを起点に
   * - post_tags(count) を埋め込みで取得
   *
   * post_tags(count) は配列で返ってきて、
   * 例：[{ count: 3 }]
   * のような形になる。
   */
  const { data, error } = await supabase
    .from('tags')
    .select('id, name, slug, post_tags(count)')
    .order('name');

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  /**
   * DBの返却形式を、フロントで使いやすい TagWithCount に整形
   */
  const items: TagWithCount[] = data.map((tag: any) => ({
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
    // post_tags は配列なので、先頭要素の count を参照する
    count: tag.post_tags?.[0]?.count ?? 0,
  }));

  /**
   * count = 0 のタグを除外するかどうかは要件次第。
   * 現在は「存在するタグはすべて返す」方針にしている。
   */
  return c.json({ items } as TagsResponse);
});

export default app;
