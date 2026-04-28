import api from './api';

export interface Post {
  id: number;
  caption: string;
  photo_video: string | null;
  tagline: string;
  tag_kategori: string;
  likes_count: number;
  repost_count: number;
  tag_location: string | null;
  is_liked: boolean;
  is_reposted: boolean;
  reposted_from_user_id: number | null;
  reposted_from_post_id: number | null;
  original_post: Partial<Post> | null;
  user: {
    id: number;
    name: string;
    profile_picture: string | null;
  } | null;
  comments: Comment[];
  comments_count: number;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: number;
  message: string;
  user: {
    id: number;
    name: string;
    profile_picture: string | null;
  };
  created_at: string;
}

export interface PostsResponse {
  data: Post[];
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  links?: any;
}

export interface CreatePostPayload {
  caption: string;
  tagline: string;
  tag_kategori: string;
  tag_location?: string;
  photo_video?: {
    uri: string;
    type: string;
    name: string;
  };
}

export const postsService = {
  async getAll(params?: {
    page?: number;
    search?: string;
    tag_kategori?: string;
    user_id?: number;
  }) {
    const res = await api.get('/api/posts', { params });
    return res.data as PostsResponse;
  },

  async getById(id: number) {
    const res = await api.get(`/api/posts/${id}`);
    return res.data as { data: Post };
  },

  async create(payload: CreatePostPayload) {
    const formData = new FormData();
    formData.append('caption', payload.caption);
    formData.append('tagline', payload.tagline);
    formData.append('tag_kategori', payload.tag_kategori);
    if (payload.tag_location) formData.append('tag_location', payload.tag_location);
    if (payload.photo_video) {
      formData.append('photo_video', payload.photo_video as any);
    }

    const res = await api.post('/api/posts', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  async update(id: number, payload: Partial<CreatePostPayload>) {
    const formData = new FormData();
    formData.append('_method', 'PUT');
    if (payload.caption) formData.append('caption', payload.caption);
    if (payload.tagline) formData.append('tagline', payload.tagline);
    if (payload.tag_kategori) formData.append('tag_kategori', payload.tag_kategori);
    if (payload.tag_location) formData.append('tag_location', payload.tag_location);
    if (payload.photo_video) formData.append('photo_video', payload.photo_video as any);

    const res = await api.post(`/api/posts/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  async delete(id: number) {
    const res = await api.delete(`/api/posts/${id}`);
    return res.data;
  },

  async like(id: number) {
    const res = await api.post(`/api/posts/${id}/like`);
    return res.data;
  },

  async repost(id: number) {
    const res = await api.post(`/api/posts/${id}/repost`);
    return res.data;
  },
};
