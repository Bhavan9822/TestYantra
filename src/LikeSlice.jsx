// LikeSlice.jsx - Minimal Like/Unlike functionality with optimistic UI
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_BASE_URL = 'https://robo-zv8u.onrender.com/api';

// ==================== ASYNC THUNK ====================
// Toggle like/unlike for an article
export const toggleLike = createAsyncThunk(
  'likes/toggleLike',
  async ({ articleId, userId }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        return rejectWithValue('Authentication required');
      }

      const response = await axios.put(
        `${API_BASE_URL}/articles/${articleId}/like`,
        { userId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      console.log('✅ Like toggled successfully:', response.data);
      const likedFlag = response.data?.liked ?? response.data?.isLiked ?? null;
      const msg = response.data?.message;

      // Return the full article from backend response for proper state sync
      return {
        articleId,
        liked: likedFlag,
        message: msg,
        article: response.data?.article || {
          _id: articleId,
          likeCount: response.data?.likeCount,
          likedBy: response.data?.likedBy || response.data?.likes || [],
        },
      };
    } catch (error) {
      console.error('❌ Like toggle failed:', error.response?.data || error.message);
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to toggle like'
      );
    }
  }
);

// ==================== SLICE ====================
const likeSlice = createSlice({
  name: 'likes',
  initialState: {
    // Track loading state per article
    loadingArticles: {}, // { [articleId]: boolean }
    error: null,
  },
  reducers: {
    // Optimistic UI update (dispatched BEFORE API call)
    optimisticToggleLike: (state, action) => {
      const { articleId } = action.payload;
      // Just mark as loading for UI feedback
      state.loadingArticles[articleId] = true;
    },
    
    // Revert optimistic update on failure
    revertOptimisticLike: (state, action) => {
      const { articleId } = action.payload;
      state.loadingArticles[articleId] = false;
    },
    
    // Clear error
    clearLikeError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(toggleLike.pending, (state, action) => {
        const articleId = action.meta.arg.articleId;
        state.loadingArticles[articleId] = true;
        state.error = null;
      })
      .addCase(toggleLike.fulfilled, (state, action) => {
        const { articleId, message } = action.payload;
        state.loadingArticles[articleId] = false;
        if (message === 'Article liked') {
          console.log('[LIKE] toast triggered', { articleId, message });
          toast.success('You liked this article ❤️');
        } else if (message === 'Article unliked') {
          console.log('[LIKE] toast triggered', { articleId, message });
          toast.info('You unliked this article');
        }
        // Don't store likes here - ArticlesSlice will handle it
      })
      .addCase(toggleLike.rejected, (state, action) => {
        const articleId = action.meta.arg.articleId;
        state.loadingArticles[articleId] = false;
        state.error = action.payload;
      });
  },
});

// ==================== EXPORTS ====================
export const { optimisticToggleLike, revertOptimisticLike, clearLikeError } = likeSlice.actions;

// Selectors
export const selectIsLiking = (state, articleId) => 
  state.likes?.loadingArticles?.[articleId] || false;
export const selectLikeError = (state) => state.likes?.error || null;

export default likeSlice.reducer;
