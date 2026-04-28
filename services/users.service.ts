import api from './api';

export interface User {
  id: number;
  name: string;
  email: string;
  profile_picture: string | null;
  followers_count: number;
  following_count: number;
  posts_count: number;
  posts: any[];
  is_following: boolean;
  created_at: string;
}

export const usersService = {
  async getMe() {
    const res = await api.get('/api/user');
    return res.data as User;
  },

  async updateProfile(payload: {
    name?: string;
    profile_picture?: { uri: string; type: string; name: string };
  }) {
    const formData = new FormData();
    if (payload.name) formData.append('name', payload.name);
    if (payload.profile_picture) {
      formData.append('profile_picture', payload.profile_picture as any);
    }
    const res = await api.post('/api/user/update', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  async getById(id: number) {
    const res = await api.get(`/api/users/${id}`);
    return res.data as { data: User };
  },

  async follow(id: number) {
    const res = await api.post(`/api/users/${id}/follow`);
    return res.data;
  },
};
