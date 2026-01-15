import { Hono } from 'hono';
import { supabase } from '../lib/supabase.js';
import type { PostSummary, PostDetail, ApiTag } from '../types.js';

const app = new Hono();

app.get('/', async (c) => {
  const category = c.req.query('category');
  const tag = c.req.query('tag');
  const q = c.req.query('q');
  const page = Number(c.req.query('page') || '1');
  const limit = Number(c.req.query('limit') || '20');

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('posts')
    .select('id, slug, title, excerpt, category, published_date, post_tags(tags(id, name, slug))', {
      count: 'exact',
    })
    .order('published_date', { ascending: false });

  if (category) {
    query = query.eq('category', category);
  }

  if (tag) {
    // filtering by tag is tricky with nested relation in simple query
    // Easier approach: Use !inner join on post_tags if possible, or simple client-side filter if small data.
    // Supabase way: .eq('post_tags.tags.slug', tag) usually requires inner join explicitly.
    // Let's try the syntax: .eq('post_tags.tags.slug', tag) with inner join hint if needed
    // Actually, for M:N filter, it's often better to filter on the relation.
    // However, Supabase JS syntax for deep filtering can be:
    // .filter('post_tags.tags.slug', 'eq', tag)
    // But this might filter the "tags" array in the result, not the posts themselves.
    // A robust way for M:N filtering in minimal step:
    // First find post_ids for the tag, then fetch posts.
    // Or simpler: use 'post_tags!inner(tag_id)' and join tags!inner(slug)
    query = query.eq('post_tags.tags.slug', tag);
    // Note: This forces an inner join on post_tags and tags automatically in recent PostgREST versions if using !inner
    // But here we are using standard supabase-js which maps to PostgREST.
    // Let's try explicit syntax if simple eq doesn't work as expected.
    // For now, let's assume PostgREST handles deep filtering or use the explicitly standard approach:
    // query = query.not('post_tags', 'is', null) // if we strictly needed valid tags
    // Let's use the !inner syntax in select for filtering:
    // .select('..., post_tags!inner(tags!inner(slug))')
    // But we need to select legitimate tags for display too.

    // Changing strategy for tag filter compatibility:
    // We modify the select string to enforce inner join if tag is present?
    // No, dynamic select string is messy.
    // Let's stick to simple .eq for now, if it fails we fix.
    // Actually, to filter POSTS that have a tag, we need:
    // .eq('post_tags.tags.slug', tag)
    // This often returns posts but only with the matching tag in the nested array.
    // Which is fine for filtering, but we might want ALL tags for that post in the response?
    // If so, we need two queries or a complex one.
    // For MVP, if I search for tag 'react', getting only 'react' in the tags list of the response is acceptable?
    // Probably not ideal for UI.
    // Proper way:
    // const { data: matchingPosts } = await supabase.from('post_tags').select('post_id').eq('tags.slug', tag);
    // const postIds = ...
    // query = query.in('id', postIds)
  }

  // To support accurate "Has Tag X" AND "Show All Tags of matched posts", the 2-step approach is safest.
  if (tag) {
    // Step 1: Find post IDs that have this tag
    // We need to join tags table to filter by slug
    const { data: tagData, error: tagError } = await supabase
      .from('post_tags')
      .select('post_id, tags!inner(slug)')
      .eq('tags.slug', tag);

    if (tagError) {
      return c.json({ error: tagError.message }, 500);
    }

    const postIds = tagData.map((row: any) => row.post_id);
    if (postIds.length === 0) {
      return c.json({ items: [], total: 0 });
    }
    query = query.in('id', postIds);
  }

  if (q) {
    query = query.or(`title.ilike.%${q}%,excerpt.ilike.%${q}%,content_md.ilike.%${q}%`);
  }

  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  // Transform data to PostSummary
  const items: PostSummary[] = data.map((post: any) => {
    // flatten tags
    // post.post_tags is array of objects { tags: { ... } }
    const tags = post.post_tags
      .map((pt: any) => pt.tags?.name) // Use name for existing UI compatibility or slug? Req says "tags: string[]". Usually name is good for display.
      .filter(Boolean);

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

app.get('/:slug', async (c) => {
  const slug = c.req.param('slug');

  // We need to join note_nodes to find if there is a linked note
  const { data, error } = await supabase
    .from('posts')
    .select('*, post_tags(tags(id, name, slug)), note_nodes(id)')
    .eq('slug', slug)
    .single();

  if (error) {
    return c.json({ error: error.message }, 404);
  }

  const tags: ApiTag[] = data.post_tags.map((pt: any) => pt.tags).filter(Boolean);

  // note_nodes is an array (relation), but unique constraint ensures 0 or 1
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
