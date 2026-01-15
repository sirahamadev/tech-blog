import type {
  PostsResponse,
  PostDetail,
  TagsResponse,
  NotesTreeResponse,
  NoteContentResponse,
} from '../types/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    cache: options?.cache ?? 'no-store', // Default no-store for dev/freshness, can change later
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `API Error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export const api = {
  // Posts
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
    if (params?.category && params.category !== 'all')
      searchParams.set('category', params.category);
    if (params?.tag) searchParams.set('tag', params.tag);
    if (params?.q) searchParams.set('q', params.q);

    return fetchApi<PostsResponse>(`/posts?${searchParams.toString()}`);
  },

  getPostBySlug: async (slug: string) => {
    return fetchApi<PostDetail>(`/posts/${slug}`);
  },

  // Tags
  getTags: async () => {
    return fetchApi<TagsResponse>('/tags');
  },

  // Notes
  getNoteTree: async (root?: string) => {
    const query = root ? `?root=${root}` : '';
    return fetchApi<NotesTreeResponse>(`/notes/tree${query}`);
  },

  getNoteContent: async (id: string) => {
    return fetchApi<NoteContentResponse>(`/notes/content/${id}`);
  },
};
