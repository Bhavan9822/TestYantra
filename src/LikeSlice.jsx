// LikeSlice.jsx
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { addLikeNotification } from './NotificationSlice';

const API_BASE_URL = 'https://robo-1-qqhu.onrender.com/api';

// Enhanced debug logging
const log = (type, message, data = {}) => {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const styles = {
    success: 'color: #10B981; font-weight: bold;',
    error: 'color: #EF4444; font-weight: bold;',
    info: 'color: #3B82F6; font-weight: bold;',
    warning: 'color: #F59E0B; font-weight: bold;',
  };
  console.log(`%c[${timestamp}] LikeSlice ${type}:`, styles[type], message, data);
};

// Toggle like/unlike for an article - Enhanced with better error handling
export const toggleLike = createAsyncThunk(
  'likes/toggleLike',
  async ({ articleId, userId, wasLikedBefore, articleOwnerId, articleTitle, currentUserName }, { rejectWithValue, getState, dispatch }) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        log('error', 'No authentication token found');
        return rejectWithValue('Authentication required');
      }

      if (!articleId || !userId) {
        log('error', 'Missing articleId or userId', { articleId, userId });
        return rejectWithValue('Article ID and User ID are required');
      }

      log('info', 'Toggling like', { articleId, userId, tokenLength: token.length, wasLikedBefore, articleOwnerId });

      // Get current state for debugging
      const state = getState();
      const currentStatus = state.likes?.articleLikes?.[articleId]?.isLikedByUser || false;
      log('info', 'Current like status before toggle', { currentStatus });

      // Try different payload formats based on common backend patterns
      const payloads = [
        { userId }, // Most common
        { userId, action: currentStatus ? 'unlike' : 'like' }, // With action field
        { userId, like: !currentStatus }, // With like boolean
      ];

      let lastError = null;
      
      // Try different payload formats
      for (const payload of payloads) {
        try {
          log('info', `Trying payload format:`, payload);
          
          const response = await axios.put(
            `${API_BASE_URL}/articles/${articleId}/like`,
            payload,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              timeout: 10000, // 10 second timeout
            }
          );

          log('success', 'Toggle like successful', {
            status: response.status,
            data: response.data,
            requestPayload: payload
          });

          // Prepare notification metadata
          const shouldNotify = !wasLikedBefore && articleOwnerId && userId !== articleOwnerId;
          const notificationData = {
            actor: userId,
            targetId: articleId,
            actorName: currentUserName || 'Someone',
            articleTitle: articleTitle || 'Your post',
            articleOwnerId: articleOwnerId
          };

          // Dispatch a notification action (best-effort, non-blocking)
          try {
            if (shouldNotify) dispatch(addLikeNotification(notificationData));
          } catch (e) {
            // swallow - shouldn't block the like flow
            console.warn('LikeSlice: failed to dispatch addLikeNotification', e);
          }

          // Return additional data for the component to handle notifications if needed
          return {
            ...response.data,
            _requestPayload: payload, // For debugging
            _shouldCreateNotification: shouldNotify,
            _notificationData: notificationData
          };
        } catch (err) {
          lastError = err;
          if (err.response?.status !== 500) {
            // If it's not a 500 error, continue with next payload format
            continue;
          }
          break; // If it's a 500 error, stop trying other formats
        }
      }

      // If all attempts failed, throw the last error
      if (lastError) {
        throw lastError;
      }

      throw new Error('All payload formats failed');

    } catch (error) {
      log('error', 'Toggle like failed', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method,
      });

      // Detailed error handling
      const status = error?.response?.status;
      let serverMsg = error.response?.data?.message || 
                     error.response?.data?.error || 
                     error.response?.data?.details ||
                     error.message;

      // Provide user-friendly messages
      if (status === 401) {
        log('warning', 'Authentication failed, clearing tokens');
        try {
          localStorage.removeItem('authToken');
          localStorage.removeItem('authUser');
          // Don't redirect automatically - let component handle it
        } catch (e) {
          log('error', 'Error clearing localStorage', e);
        }
        return rejectWithValue('Session expired. Please login again.');
      }

      if (status === 404) {
        return rejectWithValue('Article not found');
      }

      if (status === 500) {
        log('error', 'Server 500 error - Backend issue', error.response?.data);
        return rejectWithValue('Server error. Please try again.');
      }

      return rejectWithValue(serverMsg || 'Failed to toggle like');
    }
  }
);

// Alternative: Separate like and unlike functions
export const addLike = createAsyncThunk(
  'likes/addLike',
  async ({ articleId, userId, articleOwnerId, articleTitle, currentUserName }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      log('info', 'Adding like', { articleId, userId, articleOwnerId });

      const response = await axios.post(
        `${API_BASE_URL}/articles/${articleId}/like`,
        { userId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      log('success', 'Like added successfully', response.data);

      // Return additional data for notification
      return {
        ...response.data,
        _shouldCreateNotification: articleOwnerId && userId !== articleOwnerId,
        _notificationData: {
          actor: userId,
          targetId: articleId,
          actorName: currentUserName || 'Someone',
          articleTitle: articleTitle || 'Your post',
          articleOwnerId: articleOwnerId
        }
      };
    } catch (error) {
      log('error', 'Add like failed', error.response?.data);
      return rejectWithValue(error.response?.data || 'Failed to like article');
    }
  }
);

export const removeLike = createAsyncThunk(
  'likes/removeLike',
  async ({ articleId, userId }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      log('info', 'Removing like', { articleId, userId });

      const response = await axios.delete(
        `${API_BASE_URL}/articles/${articleId}/like`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          data: { userId }, // Some backends require data in DELETE
        }
      );

      log('success', 'Like removed successfully', response.data);
      return response.data;
    } catch (error) {
      log('error', 'Remove like failed', error.response?.data);
      
      // Try PUT method as fallback
      try {
        const token = localStorage.getItem('authToken');
        const response = await axios.put(
          `${API_BASE_URL}/articles/${articleId}/unlike`,
          { userId },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );
        
        log('success', 'Unlike via PUT successful', response.data);
        return response.data;
      } catch (secondError) {
        return rejectWithValue(secondError.response?.data || 'Failed to unlike article');
      }
    }
  }
);

// Get likes for an article
export const getArticleLikes = createAsyncThunk(
  'likes/getArticleLikes',
  async (articleId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      log('info', 'Getting article likes', { articleId });

      const response = await axios.get(
        `${API_BASE_URL}/articles/${articleId}/likes`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      log('success', 'Got article likes', response.data);
      return { articleId, likes: response.data };
    } catch (error) {
      log('error', 'Get article likes failed', error.response?.data);
      return rejectWithValue(error.response?.data || 'Failed to get likes');
    }
  }
);

// Check if user has liked an article
export const checkUserLike = createAsyncThunk(
  'likes/checkUserLike',
  async ({ articleId, userId }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      log('info', 'Checking user like status', { articleId, userId });

      const response = await axios.get(
        `${API_BASE_URL}/articles/${articleId}/likes/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      log('success', 'User like status checked', response.data);
      return { articleId, userId, hasLiked: response.data.hasLiked };
    } catch (error) {
      const status = error?.response?.status;
      
      if (status === 404) {
        log('info', 'Like status not found (treating as not liked)');
        return { articleId, userId, hasLiked: false };
      }
      
      log('error', 'Check user like failed', error.response?.data);
      return rejectWithValue(error.response?.data || 'Failed to check like status');
    }
  }
);

const likeSlice = createSlice({
  name: 'likes',
  initialState: {
    articleLikes: {},
    userLikes: {},
    loading: false,
    error: null,
    articleLoading: {},
    likeOperations: {},
    lastUpdated: {}, // Track when each article was last updated
  },
  reducers: {
    clearLikeError: (state) => {
      state.error = null;
    },
    clearArticleLikes: (state, action) => {
      const articleId = action.payload;
      delete state.articleLikes[articleId];
      delete state.userLikes[articleId];
      delete state.lastUpdated[articleId];
    },
    clearAllLikes: (state) => {
      state.articleLikes = {};
      state.userLikes = {};
      state.lastUpdated = {};
      state.error = null;
    },
    optimisticToggleLike: (state, action) => {
      const { articleId, userId, currentLikes = [] } = action.payload;
      const timestamp = Date.now();
      
      if (!state.articleLikes[articleId]) {
        state.articleLikes[articleId] = {
          likes: [...currentLikes],
          count: currentLikes.length,
          isLikedByUser: currentLikes.includes(userId),
          lastUpdated: timestamp,
        };
      } else {
        const articleLikes = state.articleLikes[articleId];
        const isCurrentlyLiked = articleLikes.isLikedByUser;
        
        if (isCurrentlyLiked) {
          // Unlike
          articleLikes.count = Math.max(0, articleLikes.count - 1);
          articleLikes.isLikedByUser = false;
          articleLikes.likes = articleLikes.likes.filter(id => id !== userId);
        } else {
          // Like
          articleLikes.count += 1;
          articleLikes.isLikedByUser = true;
          if (!articleLikes.likes.includes(userId)) {
            articleLikes.likes.push(userId);
          }
        }
        articleLikes.lastUpdated = timestamp;
      }
      
      state.userLikes[articleId] = state.articleLikes[articleId].isLikedByUser;
      state.lastUpdated[articleId] = timestamp;
    },
    syncLikeState: (state, action) => {
      const { articleId, likes = [], count = 0, isLikedByUser = false } = action.payload;
      const timestamp = Date.now();
      
      state.articleLikes[articleId] = {
        likes: Array.isArray(likes) ? likes : [],
        count: Number(count) || 0,
        isLikedByUser: Boolean(isLikedByUser),
        lastUpdated: timestamp,
      };
      
      state.userLikes[articleId] = Boolean(isLikedByUser);
      state.lastUpdated[articleId] = timestamp;
    },
    // Handle offline mode or when API fails
    revertOptimisticUpdate: (state, action) => {
      const { articleId, userId, previousState } = action.payload;
      
      if (state.articleLikes[articleId]) {
        state.articleLikes[articleId] = {
          ...previousState,
          lastUpdated: Date.now(),
        };
        state.userLikes[articleId] = previousState.isLikedByUser;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Toggle like
      .addCase(toggleLike.pending, (state, action) => {
        const { articleId } = action.meta.arg;
        state.likeOperations[articleId] = true;
        state.error = null;
        log('info', 'Toggle like pending', { articleId });
      })
      .addCase(toggleLike.fulfilled, (state, action) => {
        const { articleId } = action.meta.arg;
        const payload = action.payload || {};
        
        // Extract data from various possible response formats
        const rawLikes = payload.likes || payload.article?.likes || [];
        const likes = Array.isArray(rawLikes) ? rawLikes : [];

        // Normalize likes to a list of userId strings where possible
        const normalizedLikes = likes.map(l => (typeof l === 'string' ? l : (l.userId || l._id || l.id || String(l))));

        // Compute count from payload if provided, otherwise fallback to normalizedLikes length
        const count = payload.likeCount ?? payload.count ?? payload.article?.likeCount ?? normalizedLikes.length;

        // Determine whether the requesting user has liked the article.
        // Prefer explicit flags from the server, but if missing derive from the likes array using userId from meta.
        let hasLiked = typeof payload.hasLiked !== 'undefined' ? payload.hasLiked
          : (typeof payload.isLiked !== 'undefined' ? payload.isLiked : payload.article?.hasLiked);

        const requesterUserId = action.meta?.arg?.userId;
        if (typeof hasLiked === 'undefined' || hasLiked === null) {
          hasLiked = requesterUserId ? normalizedLikes.includes(requesterUserId) : false;
        }

        const timestamp = Date.now();

        state.articleLikes[articleId] = {
          likes: normalizedLikes,
          count: Number(count) || 0,
          isLikedByUser: Boolean(hasLiked),
          lastUpdated: timestamp,
        };

        state.userLikes[articleId] = Boolean(hasLiked);
        state.likeOperations[articleId] = false;
        state.lastUpdated[articleId] = timestamp;
        state.error = null;

        log('success', 'Toggle like fulfilled', {
          articleId,
          count,
          hasLiked,
          likesCount: normalizedLikes.length,
        });
      })
      .addCase(toggleLike.rejected, (state, action) => {
        const { articleId } = action.meta.arg;
        state.likeOperations[articleId] = false;
        state.error = action.payload;
        
        log('error', 'Toggle like rejected', {
          articleId,
          error: action.payload,
        });
      })
      
      // Add like
      .addCase(addLike.pending, (state, action) => {
        const { articleId } = action.meta.arg;
        state.likeOperations[articleId] = true;
        state.error = null;
      })
      .addCase(addLike.fulfilled, (state, action) => {
        const { articleId } = action.meta.arg;
        const payload = action.payload || {};
        
        // Extract data from various possible response formats
        const rawLikes = payload.likes || payload.article?.likes || [];
        const likes = Array.isArray(rawLikes) ? rawLikes : [];
        const normalizedLikes = likes.map(l => (typeof l === 'string' ? l : (l.userId || l._id || l.id || String(l))));
        const count = payload.likeCount ?? payload.count ?? payload.article?.likeCount ?? normalizedLikes.length;
        
        const timestamp = Date.now();

        state.articleLikes[articleId] = {
          likes: normalizedLikes,
          count: Number(count) || 0,
          isLikedByUser: true, // Since this is addLike, user definitely liked it
          lastUpdated: timestamp,
        };

        state.userLikes[articleId] = true;
        state.likeOperations[articleId] = false;
        state.lastUpdated[articleId] = timestamp;
        state.error = null;
      })
      .addCase(addLike.rejected, (state, action) => {
        const { articleId } = action.meta.arg;
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
        const timestamp = Date.now();
        
        state.articleLikes[articleId] = {
          likes: Array.isArray(likes) ? likes : [],
          count: Array.isArray(likes) ? likes.length : 0,
          isLikedByUser: false, // Will be updated by checkUserLike
          lastUpdated: timestamp,
        };
        
        state.articleLoading[articleId] = false;
        state.error = null;
        state.lastUpdated[articleId] = timestamp;
      })
      .addCase(getArticleLikes.rejected, (state, action) => {
        const articleId = action.meta.arg;
        state.articleLoading[articleId] = false;
        state.error = action.payload;
      })
      
      // Check user like
      .addCase(checkUserLike.fulfilled, (state, action) => {
        const { articleId, hasLiked } = action.payload;
        
        if (!state.articleLikes[articleId]) {
          state.articleLikes[articleId] = {
            likes: [],
            count: 0,
            isLikedByUser: hasLiked,
            lastUpdated: Date.now(),
          };
        } else {
          state.articleLikes[articleId].isLikedByUser = hasLiked;
          state.articleLikes[articleId].lastUpdated = Date.now();
        }
        
        state.userLikes[articleId] = hasLiked;
        state.lastUpdated[articleId] = Date.now();
      });
  },
});

// Enhanced selectors
const DEFAULT_ARTICLE_LIKES = Object.freeze({
  likes: [],
  count: 0,
  isLikedByUser: false,
  lastUpdated: 0,
});

export const selectArticleLikes = (state, articleId) => {
  const articleMap = state?.likes?.articleLikes || {};
  return articleMap[articleId] || DEFAULT_ARTICLE_LIKES;
};

export const selectUserLikeStatus = (state, articleId) => 
  state?.likes?.userLikes?.[articleId] || false;

export const selectIsLiking = (state, articleId) => 
  state?.likes?.likeOperations?.[articleId] || false;

export const selectArticleLoading = (state, articleId) => 
  state?.likes?.articleLoading?.[articleId] || false;

export const selectLikeError = (state) => state?.likes?.error;

export const selectLastUpdated = (state, articleId) => 
  state?.likes?.lastUpdated?.[articleId] || 0;

export const selectLikeStats = (state) => ({
  totalArticles: Object.keys(state?.likes?.articleLikes || {}).length,
  likedArticles: Object.values(state?.likes?.userLikes || {}).filter(Boolean).length,
  pendingOperations: Object.values(state?.likes?.likeOperations || {}).filter(Boolean).length,
});

export const { 
  clearLikeError, 
  clearArticleLikes, 
  clearAllLikes,
  optimisticToggleLike, 
  syncLikeState,
  revertOptimisticUpdate,
} = likeSlice.actions;

export default likeSlice.reducer;