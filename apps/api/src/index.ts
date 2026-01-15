import 'dotenv/config';

import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { supabase } from './lib/supabase.js';
import postsRoute from './routes/posts.js';
import notesRoute from './routes/notes.js';
import tagsRoute from './routes/tags.js';

const app = new Hono();

app.get('/', (c) => c.text('Hello Hono!'));
app.get('/health', (c) => c.json({ status: 'ok' }));

// DB疎通（HTTP経由でSupabaseに問い合わせ）
app.get('/db', async (c) => {
  // テーブル未作成ならここはエラーになるので、先にDDL流すのがベスト
  const { data, error } = await supabase.from('posts').select('id').limit(1);

  if (error) return c.json({ ok: false, error: error.message }, 500);
  return c.json({ ok: true, data });
});

app.route('/posts', postsRoute);
app.route('/notes', notesRoute);
app.route('/tags', tagsRoute);

serve(
  {
    fetch: app.fetch,
    port: Number(process.env.PORT ?? 3001),
  },
  (info) => console.log(`Server is running on http://localhost:${info.port} (Updated)`),
);
