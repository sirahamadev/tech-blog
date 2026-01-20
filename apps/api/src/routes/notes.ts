import { Hono } from 'hono';
import { supabase } from '../lib/supabase.js';
import type { NotesTreeResponse, NoteContentResponse, NoteNode } from '../types.js';

const app = new Hono();

/**
 * GET /notes/tree
 * Notes 用のツリー構造を取得するAPI
 *
 * - note_nodes をフラットな配列として返す
 * - root クエリが指定された場合は、そのノード配下のみを対象にする
 *
 * レスポンス形式：
 * {
 *   root: NoteNode | null,
 *   nodes: NoteNode[]
 * }
 */
app.get('/tree', async (c) => {
  const rootSlug = c.req.query('root');

  let rootNode: NoteNode | null = null;

  // note_nodes を sort_order 順で取得
  let query = supabase.from('note_nodes').select('*').order('sort_order', { ascending: true });

  /**
   * root が指定されている場合：
   * - slug からルートノードを特定する
   * - 見つからなければ 404
   */
  if (rootSlug) {
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

  // 全 note_nodes を取得
  const { data: allNodes, error: allError } = await query;

  if (allError) {
    return c.json({ error: allError.message }, 500);
  }

  let nodes: NoteNode[] = allNodes as NoteNode[];

  /**
   * root が指定されている場合は、
   * その配下のノード（子・孫…）のみを抽出する。
   *
   * parent_id を使って BFS（幅優先探索）で
   * ルート配下の全 descendant を集める。
   */
  if (rootNode) {
    const descendants: NoteNode[] = [];
    const queue = [rootNode.id];

    /**
     * parent_id ごとにノードをまとめておくことで、
     * 子ノード探索を高速化する
     */
    const nodesByParent: Record<string, NoteNode[]> = {};
    for (const n of nodes) {
      if (n.parent_id) {
        if (!nodesByParent[n.parent_id]) {
          nodesByParent[n.parent_id] = [];
        }
        nodesByParent[n.parent_id].push(n);
      }
    }

    // BFS（幅優先探索）
    let i = 0;
    while (i < queue.length) {
      const parentId = queue[i];
      i++;

      const children = nodesByParent[parentId] || [];
      descendants.push(...children);

      // 次に探索する親として子ノードの id を追加
      children.forEach((c) => queue.push(c.id));
    }

    nodes = descendants;
  }

  return c.json({
    root: rootNode,
    nodes,
  } as NotesTreeResponse);
});

/**
 * GET /notes/content/:id
 * Notes 上のノード詳細を取得するAPI
 *
 * - note_nodes を 1 件取得
 * - node_type = 'post' の場合のみ posts を結合して本文を返す
 *
 * レスポンス形式：
 * {
 *   node: NoteNode,
 *   post: Post | null
 * }
 */
app.get('/content/:id', async (c) => {
  const id = c.req.param('id');

  // note_nodes から対象ノードを取得
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

  /**
   * ノードが post タイプの場合のみ、
   * post_id を使って posts テーブルから本文を取得する
   */
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
