export interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content_md: string;
  category: string;
  published_date: string;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface PostTag {
  post_id: string;
  tag_id: string;
  created_at: string;
}

export interface NoteNode {
  id: string;
  parent_id: string | null;
  node_type: 'folder' | 'post';
  slug: string;
  title: string;
  sort_order: number;
  post_id: string | null;
  created_at: string;
  updated_at: string;
}

// API Responses
export interface ApiTag {
  id: string;
  name: string;
  slug: string;
}

export interface TagWithCount extends ApiTag {
  count: number;
}

export interface TagsResponse {
  items: TagWithCount[];
}

export interface PostSummary {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  published_date: string;
  tags: string[]; // tag slugs or names? Request says string[] but Detail has object. Let's assume names or slugs for summary, but following best practice usually simple strings for tags list in summary is fine.
  // Wait, requirement said: "PostSummary: id, slug, title, excerpt, category, published_date, tags: string[]"
}

export interface PostDetail {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content_md: string;
  category: string;
  published_date: string;
  tags: ApiTag[];
  note_node_id: string | null;
}

export interface PostsResponse {
  items: PostSummary[];
  total: number;
}

export interface NoteContentResponse {
  node: NoteNode;
  post: Post | null;
}

export interface NotesTreeResponse {
  root: NoteNode | null;
  nodes: NoteNode[];
}
