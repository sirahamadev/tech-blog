import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

// Service role key is used for backend to bypass RLS if necessary,
// or standard access. Since this is a public API reading public data,
// anon key could work, but usually service role is safer/more powerful for backend APIs
// as long as we handle permissions code-side.
// Given the requirements "Do NOT access DB directly from Next.js",
// this API layer acts as the trusted backend.
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);
