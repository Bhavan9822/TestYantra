// LikeSlice.jsx
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = 'https://robo-1-qqhu.onrender.com/api';

// Toggle like/unlike for an article
export const toggleLike = createAsyncThunk(
  'likes/toggleLike',
  async ({ articleId, userId }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      console.log('LikeSlice: Toggling like for article:', articleId);
      
      const response = await axios.put(
        `${API_BASE_URL}/articles/${articleId}/like`,
        { userId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      console.log('LikeSlice: Toggle like response:', response.data);
      return response.data;
    } catch (error) {
      console.error('LikeSlice: Toggle like error:', error?.response?.status, error?.response?.data || error.message);
      
      const status = error?.response?.status;
      const serverMsg = error.response?.data?.message || error.response?.data?.error;
      
      if (status === 401) {
        try {
          localStorage.removeItem('authToken');
          localStorage.removeItem('authUser');
          console.warn('LikeSlice: Auth token invalid - redirecting to login');
          window.location.href = '/login';
        } catch (e) {
          console.warn('LikeSlice: Error during 401 handling', e);
        }
        return rejectWithValue(serverMsg || 'Invalid or expired token');
      }
      
      return rejectWithValue(serverMsg || error.message || 'Failed to toggle like');
    }
  }
);

// Get likes for an article
export const getArticleLikes = createAsyncThunk(
  'likes/getArticleLikes',
  async (articleId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      console.log('LikeSlice: Getting likes for article:', articleId);
      
      const response = await axios.get(
        `${API_BASE_URL}/articles/${articleId}/likes`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      console.log('LikeSlice: Get likes response:', response.data);
      return { articleId, likes: response.data };
    } catch (error) {
      console.error('LikeSlice: Get likes error:', error?.response?.status, error?.response?.data || error.message);
      
      const status = error?.response?.status;
      const serverMsg = error.response?.data?.message || error.response?.data?.error;
      
      if (status === 401) {
        return rejectWithValue(serverMsg || 'Authentication required');
      }
      
      return rejectWithValue(serverMsg || error.message || 'Failed to get likes');
    }
  }
);

// Check if user has liked an article
export const checkUserLike = createAsyncThunk(
  'likes/checkUserLike',
  async ({ articleId, userId }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      console.log('LikeSlice: Checking like status for user:', userId, 'article:', articleId);
      
      const response = await axios.get(
        `${API_BASE_URL}/articles/${articleId}/likes/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      console.log('LikeSlice: Check like response:', response.data);
      return { articleId, userId, hasLiked: response.data.hasLiked };
    } catch (error) {
      console.error('LikeSlice: Check like error:', error?.response?.status, error?.response?.data || error.message);
      
      const status = error?.response?.status;
      const serverMsg = error.response?.data?.message || error.response?.data?.error;
      
      if (status === 401) {
        return rejectWithValue(serverMsg || 'Authentication required');
      }
      
      if (status === 404) {
        // Article or user not found - treat as not liked
        return { articleId, userId, hasLiked: false };
      }
      
      return rejectWithValue(serverMsg || error.message || 'Failed to check like status');
    }
  }
);

const likeSlice = createSlice({
  name: 'likes',
  initialState: {
    // Store likes status per article
    articleLikes: {},
    // Track which articles user has liked
    userLikes: {},
    // Loading states
    loading: false,
    error: null,
    // Track loading per article
    articleLoading: {},
    // Track like operations in progress
    likeOperations: {},
  },
  reducers: {
    clearLikeError: (state) => {
      state.error = null;
    },
    clearArticleLikes: (state, action) => {
      const articleId = action.payload;
      delete state.articleLikes[articleId];
      delete state.userLikes[articleId];
    },
    // Optimistically update like status (for immediate UI feedback)
    optimisticToggleLike: (state, action) => {
      const { articleId, userId, currentLikes } = action.payload;
      
      if (!state.articleLikes[articleId]) {
        state.articleLikes[articleId] = {
          likes: [],
          count: 0,
          isLikedByUser: false
        };
      }
      
      const articleLikes = state.articleLikes[articleId];
      const isCurrentlyLiked = articleLikes.likes.includes(userId);
      
      if (isCurrentlyLiked) {
        // Remove like
        articleLikes.likes = articleLikes.likes.filter(id => id !== userId);
        articleLikes.count = Math.max(0, articleLikes.count - 1);
        articleLikes.isLikedByUser = false;
      } else {
        // Add like
        articleLikes.likes.push(userId);
        articleLikes.count += 1;
        articleLikes.isLikedByUser = true;
      }
      
      // Update user likes map
      state.userLikes[articleId] = articleLikes.isLikedByUser;
    },
    // Sync with server data (after successful operation)
    syncLikeState: (state, action) => {
      const { articleId, likes, count, isLikedByUser } = action.payload;
      
      state.articleLikes[articleId] = {
        likes: likes || [],
        count: count || 0,
        isLikedByUser: isLikedByUser || false
      };
      
      state.userLikes[articleId] = isLikedByUser || false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Toggle like
      .addCase(toggleLike.pending, (state, action) => {
        const articleId = action.meta.arg.articleId;
        state.likeOperations[articleId] = true;
        state.error = null;
      })
      .addCase(toggleLike.fulfilled, (state, action) => {
        const articleId = action.meta.arg.articleId;
        const { likes, likeCount, hasLiked } = action.payload;
        
        state.articleLikes[articleId] = {
          likes: likes || [],
          count: likeCount || 0,
          isLikedByUser: hasLiked || false
        };
        
        state.userLikes[articleId] = hasLiked || false;
        state.likeOperations[articleId] = false;
        state.error = null;
      })
      .addCase(toggleLike.rejected, (state, action) => {
        const articleId = action.meta.arg.articleId;
        state.likeOperations[articleId] = false;
        state.error = action.payload;
      })
      
      // Get article likes
      .addCase(getArticleLikes.pending, (state, action) => {
        const articleId = action.meta.arg;
        state.articleLoading[articleId] = true;
        state.error = null;
      })
      .addCase(getArticleLikes.fulfilled, (state, action) => {
        const { articleId, likes } = action.payload;
        
        state.articleLikes[articleId] = {
          likes: Array.isArray(likes) ? likes : [],
          count: Array.isArray(likes) ? likes.length : 0,
          isLikedByUser: false // This will be updated by checkUserLike
        };
        
        state.articleLoading[articleId] = false;
        state.error = null;
      })
      .addCase(getArticleLikes.rejected, (state, action) => {
        const articleId = action.meta.arg;
        state.articleLoading[articleId] = false;
        state.error = action.payload;
      })
      
      // Check user like
      .addCase(checkUserLike.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkUserLike.fulfilled, (state, action) => {
        const { articleId, userId, hasLiked } = action.payload;
        
        if (!state.articleLikes[articleId]) {
          state.articleLikes[articleId] = {
            likes: [],
            count: 0,
            isLikedByUser: false
          };
        }
        
        state.articleLikes[articleId].isLikedByUser = hasLiked;
        state.userLikes[articleId] = hasLiked;
        state.loading = false;
        state.error = null;
      })
      .addCase(checkUserLike.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// Selectors
export const selectArticleLikes = (state, articleId) => 
  state.likes.articleLikes[articleId] || { likes: [], count: 0, isLikedByUser: false };

export const selectUserLikeStatus = (state, articleId) => 
  state.likes.userLikes[articleId] || false;

export const selectIsLiking = (state, articleId) => 
  state.likes.likeOperations[articleId] || false;

export const selectArticleLoading = (state, articleId) => 
  state.likes.articleLoading[articleId] || false;

export const selectLikeError = (state) => state.likes.error;

export const { 
  clearLikeError, 
  clearArticleLikes, 
  optimisticToggleLike, 
  syncLikeState 
} = likeSlice.actions;

export default likeSlice.reducer;