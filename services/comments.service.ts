import api from './api';

export const commentsService = {
  async create(post_id: number, message: string) {
    const res = await api.post('/api/comments', { post_id, message });
    return res.data;
  },

  async delete(id: number) {
    const res = await api.delete(`/api/comments/${id}`);
    return res.data;
  },
};
