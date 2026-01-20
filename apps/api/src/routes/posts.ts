import { Hono } from 'hono';
import { supabase } from '../lib/supabase.js';
import type { PostSummary, PostDetail, ApiTag } from '../types.js';

const app = new Hono();

/* 最初に
・posts を起点に
・post_tags → tags を LEFT JOIN して
・各 post に紐づくタグを「全部」取る前提の SELECT を組み立てる

次に
・別の SELECT で
・指定タグを持つ post_id だけを抽出し
・その ID 群を
・WHERE posts.id IN (...) として 最初の SELECT に後付けする

結果として
・「タグ条件で絞られた posts」
・かつ「各 post に紐づく全タグ」を同時に満たせる */

/**
 * GET /posts
 * 記事一覧を取得するAPI
 * - category / tag / q（検索）による絞り込み
 * - ページネーション対応
 */
app.get('/', async (c) => {
  const category = c.req.query('category');
  const tag = c.req.query('tag');
  const q = c.req.query('q');
  const page = Number(c.req.query('page') || '1');
  const limit = Number(c.req.query('limit') || '20');

  // ページング用の範囲計算
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // posts を起点に、関連する tags（post_tags 経由）も一緒に取得
  let query = supabase
    .from('posts')
    .select('id, slug, title, excerpt, category, published_date, post_tags(tags(id, name, slug))', {
      count: 'exact',
    })
    .order('published_date', { ascending: false });

  // カテゴリ絞り込み
  if (category) {
    query = query.eq('category', category);
  }

  /**
   * タグ絞り込み（posts ↔ tags は多対多）
   *
   * Supabase(PostgREST)では、1クエリで deep filter を行うと
   * 「埋め込み tags が一致したものだけになる」など、
   * UI的に扱いづらい結果になることがある。
   *
   * そのため、以下の 2-step 方式を採用している：
   * 1. 指定タグを持つ post_id を post_tags から取得
   * 2. posts を id IN (...) で絞り込み
   *
   * これにより「該当する posts」かつ「各 post に紐づく全タグ」を返せる。
   */
  if (tag) {
    // Step 1: 指定されたタグを持つ post_id を取得
    const { data: tagData, error: tagError } = await supabase
      .from('post_tags')
      .select('post_id, tags!inner(slug)')
      .eq('tags.slug', tag);

    if (tagError) {
      return c.json({ error: tagError.message }, 500);
    }

    const postIds = tagData.map((row: any) => row.post_id);

    // 該当記事が1件もない場合は空配列を返す
    if (postIds.length === 0) {
      return c.json({ items: [], total: 0 });
    }

    // Step 2: posts を post_id で絞り込み
    query = query.in('id', postIds);
  }

  // フリーワード検索（タイトル / 抜粋 / 本文）
  if (q) {
    query = query.or(`title.ilike.%${q}%,excerpt.ilike.%${q}%,content_md.ilike.%${q}%`);
  }

  // ページング範囲を適用
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  /**
   * DBの返却形式を、フロントで使いやすい PostSummary に整形
   */
  const items: PostSummary[] = data.map((post: any) => {
    // post.post_tags は [{ tags: {...} }] の配列になっているため、
    // tags.name だけを取り出してフラットな配列にする
    const tags = post.post_tags.map((pt: any) => pt.tags?.name).filter(Boolean);

    return {
      id: post.id,
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      category: post.category,
      published_date: post.published_date,
      tags,
    };
  });

  return c.json({ items, total: count });
});

/**
 * GET /posts/:slug
 * 記事詳細を取得するAPI
 * - 記事本文
 * - 紐づくタグ一覧
 * - Notes 側に対応する note_node_id（あれば）
 */
app.get('/:slug', async (c) => {
  const slug = c.req.param('slug');

  // posts を起点に、tags と note_nodes を結合して取得
  const { data, error } = await supabase
    .from('posts')
    .select('*, post_tags(tags(id, name, slug)), note_nodes(id)')
    .eq('slug', slug)
    .single();

  if (error) {
    return c.json({ error: error.message }, 404);
  }

  // タグ情報をフラットな配列に変換
  const tags: ApiTag[] = data.post_tags.map((pt: any) => pt.tags).filter(Boolean);

  // note_nodes は配列で返るが、設計上 0 or 1 件のみ
  const noteNodeId = data.note_nodes?.[0]?.id ?? null;

  const postDetail: PostDetail = {
    id: data.id,
    slug: data.slug,
    title: data.title,
    excerpt: data.excerpt,
    content_md: data.content_md,
    category: data.category,
    published_date: data.published_date,
    tags,
    note_node_id: noteNodeId,
  };

  return c.json(postDetail);
});

export default app;
