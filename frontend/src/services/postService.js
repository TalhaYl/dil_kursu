import api from './api';

export const postService = {
    // Tüm yazıları getir
    getAllPosts() {
        return api.get('/posts');
    },

    // Belirli bir yazıyı getir
    getPostById(id) {
        return api.get(`/posts/${id}`);
    },

    // Yeni yazı ekle
    createPost(postData) {
        return api.post('/posts', postData);
    },

    // Yazıyı güncelle
    updatePost(id, postData) {
        return api.put(`/posts/${id}`, postData);
    },

    // Yazıyı sil
    deletePost(id) {
        return api.delete(`/posts/${id}`);
    }
}; 