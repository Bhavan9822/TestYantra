// ArticlesSlice.jsx
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = 'https://robo-1-qqhu.onrender.com/api';

// Fetch articles
export const fetchPosts = createAsyncThunk(
  'articles/fetchPosts',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      console.log('ArticlesSlice: fetching posts - authToken present?', !!token, token ? `length=${token.length}` : 'no-token');
      const response = await axios.get(`${API_BASE_URL}/articles`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('ArticlesSlice: fetchPosts response data', response.data);
      return response.data;
    } catch (error) {
      console.error('ArticlesSlice: fetchPosts error', error?.response?.status, error?.response?.data || error.message);
      const status = error?.response?.status;
      const serverMsg = error.response?.data?.message || error.response?.data?.error;
      if (status === 401) {
        try {
          localStorage.removeItem('authToken');
          localStorage.removeItem('authUser');
          console.warn('ArticlesSlice: auth token invalid - cleared localStorage and redirecting to /login');
          window.location.href = '/login';
        } catch (e) {
          console.warn('ArticlesSlice: error during 401 handling', e);
        }
        return rejectWithValue(serverMsg || 'Invalid or expired token');
      }
      return rejectWithValue(serverMsg || error.message || 'Failed to fetch posts');
    }
  }
);

// Create article
export const createPost = createAsyncThunk(
  'articles/createPost',
  async (postData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      console.log('ArticlesSlice: creating post - authToken present?', !!token, token ? `length=${token.length}` : 'no-token');
      const response = await axios.post(`${API_BASE_URL}/articles`, postData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      console.log('ArticlesSlice: createPost response data', response.data);
      return response.data;
    } catch (error) {
      console.error('ArticlesSlice: createPost error', error?.response?.status, error?.response?.data || error.message);
      const status = error?.response?.status;
      const serverMsg = error.response?.data?.message || error.response?.data?.error;
      if (status === 401) {
        try {
          localStorage.removeItem('authToken');
          localStorage.removeItem('authUser');
          console.warn('ArticlesSlice: auth token invalid - cleared localStorage and redirecting to /login');
          window.location.href = '/login';
        } catch (e) {
          console.warn('ArticlesSlice: error during 401 handling', e);
        }
        return rejectWithValue(serverMsg || 'Invalid or expired token');
      }
      return rejectWithValue(serverMsg || error.message || 'Failed to create post');
    }
  }
);

// Fetch single article by id
export const fetchPostById = createAsyncThunk(
  'articles/fetchPostById',
  async (postId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      console.log('ArticlesSlice: fetching single post - authToken present?', !!token, token ? `length=${token.length}` : 'no-token');
      const response = await axios.get(`${API_BASE_URL}/articles/${postId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('ArticlesSlice: fetchPostById response data', response.data);
      return response.data;
    } catch (error) {
      console.error('ArticlesSlice: fetchPostById error', error?.response?.status, error?.response?.data || error.message);
      console.error('ArticlesSlice: fetchPostById request URL', error?.config?.url || 'unknown url');
      const status = error?.response?.status;
      const serverMsg = error.response?.data?.message || error.response?.data?.error;
      if (status === 401) {
        try {
          localStorage.removeItem('authToken');
          localStorage.removeItem('authUser');
          console.warn('ArticlesSlice: auth token invalid (fetchPostById) - cleared localStorage and redirecting to /login');
          window.location.href = '/login';
        } catch (e) {
          console.warn('ArticlesSlice: error during 401 handling', e);
        }
        return rejectWithValue(serverMsg || 'Invalid or expired token');
      }
      return rejectWithValue(serverMsg || error.message || 'Failed to fetch post');
    }
  }
);

const articlesSlice = createSlice({
  name: 'articles',
  initialState: {
    posts: [],
    currentPost: null,
    loading: false,
    error: null,
    createPostLoading: false,
    createPostError: null,
  },
  reducers: {
    clearPostsError: (state) => {
      state.error = null;
      state.createPostError = null;
    },
    addPost: (state, action) => {
      state.posts.unshift(action.payload);
    },
    clearCurrentPost: (state) => {
      state.currentPost = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch posts
      .addCase(fetchPosts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.loading = false;
        // Handle different response structures
        state.posts = action.payload.posts || action.payload.articles || action.payload || [];
        console.log('ArticlesSlice: posts set to', state.posts);
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create post
      .addCase(createPost.pending, (state) => {
        state.createPostLoading = true;
        state.createPostError = null;
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.createPostLoading = false;
        const newPost = action.payload.post || action.payload.article || action.payload;
        if (newPost) {
          state.posts.unshift(newPost);
        }
      })
      .addCase(createPost.rejected, (state, action) => {
        state.createPostLoading = false;
        state.createPostError = action.payload;
      })
      // Fetch single post by ID
      .addCase(fetchPostById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPostById.fulfilled, (state, action) => {
        state.loading = false;
        const post = action.payload.post || action.payload.article || action.payload;
        state.currentPost = post || null;
      })
      .addCase(fetchPostById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearPostsError, addPost, clearCurrentPost } = articlesSlice.actions;
export default articlesSlice.reducer;

