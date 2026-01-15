import { Hono } from 'hono';
import { supabase } from '../lib/supabase.js';
import type { NotesTreeResponse, NoteContentResponse, NoteNode } from '../types.js';

const app = new Hono();

// GET /tree
// Returns flat structure: { root: NoteNode | null, nodes: NoteNode[] }
app.get('/tree', async (c) => {
  const rootSlug = c.req.query('root');

  let rootNode: NoteNode | null = null;
  let query = supabase.from('note_nodes').select('*').order('sort_order', { ascending: true });

  if (rootSlug) {
    // 1. Find the root node by slug
    const { data: rootData, error: rootError } = await supabase
      .from('note_nodes')
      .select('*')
      .eq('slug', rootSlug)
      .single();

    if (rootError || !rootData) {
      return c.json({ error: 'Root node not found' }, 404);
    }
    rootNode = rootData as NoteNode;
  }

  const { data: allNodes, error: allError } = await query;

  if (allError) {
    return c.json({ error: allError.message }, 500);
  }

  let nodes: NoteNode[] = allNodes as NoteNode[];

  if (rootNode) {
    // Filter to get descendants of rootNode using BFS to gather all children IDs
    const descendants: NoteNode[] = [];
    const queue = [rootNode.id];

    // We iterate through allNodes to find children
    // Optimization: Pre-group by parent_id map
    const nodesByParent: Record<string, NoteNode[]> = {};
    for (const n of nodes) {
      if (n.parent_id) {
        if (!nodesByParent[n.parent_id]) nodesByParent[n.parent_id] = [];
        nodesByParent[n.parent_id].push(n);
      }
    }

    let i = 0;
    while (i < queue.length) {
      const parentId = queue[i];
      i++;
      const children = nodesByParent[parentId] || [];
      descendants.push(...children);
      children.forEach((c) => queue.push(c.id));
    }
    nodes = descendants;
  }

  return c.json({
    root: rootNode,
    nodes,
  } as NotesTreeResponse);
});

// GET /content/:id
// Returns merged node + post content
app.get('/content/:id', async (c) => {
  const id = c.req.param('id');

  const { data: nodeData, error: nodeError } = await supabase
    .from('note_nodes')
    .select('*')
    .eq('id', id)
    .single();

  if (nodeError || !nodeData) {
    return c.json({ error: 'Node not found' }, 404);
  }

  const node = nodeData as NoteNode;
  let post: any = null;

  if (node.node_type === 'post' && node.post_id) {
    const { data: postData, error: postError } = await supabase
      .from('posts')
      .select('*')
      .eq('id', node.post_id)
      .single();

    if (!postError) {
      post = postData;
    }
  }

  return c.json({
    node,
    post,
  } as NoteContentResponse);
});

export default app;
