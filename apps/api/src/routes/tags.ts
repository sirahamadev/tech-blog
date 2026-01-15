import { Hono } from 'hono';
import { supabase } from '../lib/supabase.js';
import type { TagsResponse, TagWithCount } from '../types.js';

const app = new Hono();

app.get('/', async (c) => {
  // Get all tags with post count
  // Supabase (PostgREST) doesn't support count on related table easily in one query without RPC or complex embedding.
  // Standard way: select tags and count joined post_tags.
  // Query: select id, name, slug, post_tags(count) -> post_tags is array so it returns [{count:N}]? No.
  // Another way: .select('*, post_tags(count)')

  // Let's try .select('*, post_tags(count)')
  const { data, error } = await supabase
    .from('tags')
    .select('id, name, slug, post_tags(count)')
    .order('name');

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  const items: TagWithCount[] = data.map((tag: any) => ({
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
    count: tag.post_tags?.[0]?.count ?? 0, // supabase returns array for relation count usually [{count: N}]
  }));

  // Filter out tags with 0 posts if desired? Requirement doesn't specify, but usually "linked via post_tags" implies we want count.
  // If count is 0, it just returns 0.

  return c.json({ items } as TagsResponse);
});

export default app;
