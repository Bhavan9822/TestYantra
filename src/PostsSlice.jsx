// postsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = 'http://192.168.0.66:5000/api';

// Fetch posts async thunk
export const fetchPosts = createAsyncThunk(
  'posts/fetchPosts',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(
        `${API_BASE_URL}/posts`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch posts');
    }
  }
);

// Create post async thunk
export const createPost = createAsyncThunk(
  'posts/createPost',
  async (postData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post(
        `${API_BASE_URL}/posts`,
        postData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create post');
    }
  }
);

const postsSlice = createSlice({
  name: 'posts',
  initialState: {
    posts: [],
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
  },
  extraReducers: (builder) => {
    builder
      // Fetch Posts
      .addCase(fetchPosts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.loading = false;
        state.posts = action.payload.posts || [];
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create Post
      .addCase(createPost.pending, (state) => {
        state.createPostLoading = true;
        state.createPostError = null;
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.createPostLoading = false;
        state.posts.unshift(action.payload.post);
      })
      .addCase(createPost.rejected, (state, action) => {
        state.createPostLoading = false;
        state.createPostError = action.payload;
      });
  },
});

export const { clearPostsError, addPost } = postsSlice.actions;
export default postsSlice.reducer;