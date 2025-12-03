import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { updatePostOptimistically } from './ArticlesSlice';
import { addCommentNotification } from './NotificationSlice';

const API_BASE_URL = 'https://robo-1-qqhu.onrender.com/api';

// Fetch paginated comments for an article (page starting at 1)
export const fetchComments = createAsyncThunk(
  'comments/fetchComments',
  async ({ articleId, page = 1, perPage = 5 }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      const resp = await axios.get(`${API_BASE_URL}/articles/${articleId}/comments`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        params: { page, limit: perPage }
      });

      // Normalize response: try several shapes
      const data = resp.data;
      const comments = Array.isArray(data) ? data : (data.comments || data.results || []);
      const total = data.total || data.count || comments.length;

      return { articleId, page, perPage, comments, total };
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message || 'Failed to fetch comments');
    }
  }
);

// Post a comment to an article
export const postComment = createAsyncThunk(
  'comments/postComment',
  async ({ articleId, content, articleOwnerId, articleTitle, currentUserName }, { rejectWithValue, getState, dispatch }) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return rejectWithValue('Authentication required');

      const resp = await axios.post(
        `${API_BASE_URL}/articles/${articleId}/comments`,
        { content },
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );

      const created = resp.data;

      // Update articles slice (optimistic) -- increment comments on the article
      try {
        const state = getState();
        const currentArticle = state.articles?.currentArticle;
        const posts = state.articles?.posts || [];
        const article = currentArticle || posts.find(p => (p._id || p.id) === articleId);
        
        if (article) {
          const currentComments = article.comments || [];
          dispatch(updatePostOptimistically({ 
            articleId, 
            postData: { 
              comments: [...currentComments, created]
            } 
          }));
        }
      } catch (e) {
        console.warn('Failed to update article optimistically:', e);
      }

      // Prepare notification metadata
      const shouldNotify = articleOwnerId && getState().auth?.currentUser?._id !== articleOwnerId;
      const notificationData = {
        actor: getState().auth?.currentUser?._id,
        targetId: articleId,
        actorName: currentUserName || 'Someone',
        articleTitle: articleTitle || 'Your article',
        articleOwnerId: articleOwnerId,
        commentText: content
      };

      // Dispatch notification (best-effort)
      try {
        if (shouldNotify) dispatch(addCommentNotification(notificationData));
      } catch (e) {
        console.warn('CommentSlice: failed to dispatch addCommentNotification', e);
      }

      // Return data that components can use if needed
      return {
        articleId, 
        comment: created,
        _shouldCreateNotification: shouldNotify,
        _notificationData: notificationData
      };
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message || 'Failed to post comment');
    }
  }
);

const commentsSlice = createSlice({
  name: 'comments',
  initialState: {
    byArticle: {}, // articleId -> { items: [], page: 0, perPage: 5, total: 0, loading: false, error: null }
  },
  reducers: {
    clearCommentsForArticle: (state, action) => {
      delete state.byArticle[action.payload];
    },
    // Add comment optimistically for immediate UI update
    addCommentOptimistically: (state, action) => {
      const { articleId, comment } = action.payload;
      state.byArticle[articleId] = state.byArticle[articleId] || { 
        items: [], 
        page: 0, 
        perPage: 5, 
        total: 0, 
        loading: false, 
        error: null 
      };
      
      // Prepend the new comment so it appears first
      if (comment) {
        state.byArticle[articleId].items = [comment, ...state.byArticle[articleId].items];
        state.byArticle[articleId].total = (state.byArticle[articleId].total || 0) + 1;
      }
    },
    // Clear all comments (useful for logout)
    clearAllComments: (state) => {
      state.byArticle = {};
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchComments.pending, (state, action) => {
        const { articleId } = action.meta.arg;
        state.byArticle[articleId] = state.byArticle[articleId] || { 
          items: [], 
          page: 0, 
          perPage: 5, 
          total: 0, 
          loading: false, 
          error: null 
        };
        state.byArticle[articleId].loading = true;
        state.byArticle[articleId].error = null;
      })
      .addCase(fetchComments.fulfilled, (state, action) => {
        const { articleId, page, perPage, comments, total } = action.payload;
        state.byArticle[articleId] = state.byArticle[articleId] || { 
          items: [], 
          page: 0, 
          perPage: 5, 
          total: 0, 
          loading: false, 
          error: null 
        };

        // If page == 1 replace, else append
        if (page === 1) {
          state.byArticle[articleId].items = comments;
        } else {
          // Filter out duplicates before appending
          const existingIds = new Set(state.byArticle[articleId].items.map(c => c._id || c.id));
          const newComments = comments.filter(c => !existingIds.has(c._id || c.id));
          state.byArticle[articleId].items = [...state.byArticle[articleId].items, ...newComments];
        }

        state.byArticle[articleId].page = page;
        state.byArticle[articleId].perPage = perPage;
        state.byArticle[articleId].total = total || state.byArticle[articleId].items.length;
        state.byArticle[articleId].loading = false;
        state.byArticle[articleId].error = null;
      })
      .addCase(fetchComments.rejected, (state, action) => {
        const { articleId } = action.meta.arg;
        state.byArticle[articleId] = state.byArticle[articleId] || { 
          items: [], 
          page: 0, 
          perPage: 5, 
          total: 0, 
          loading: false, 
          error: null 
        };
        state.byArticle[articleId].loading = false;
        state.byArticle[articleId].error = action.payload;
      })

      .addCase(postComment.pending, (state, action) => {
        const { articleId } = action.meta.arg;
        state.byArticle[articleId] = state.byArticle[articleId] || { 
          items: [], 
          page: 0, 
          perPage: 5, 
          total: 0, 
          loading: false, 
          error: null 
        };
        state.byArticle[articleId].loading = true;
        state.byArticle[articleId].error = null;
      })
      .addCase(postComment.fulfilled, (state, action) => {
        const { articleId, comment } = action.payload;
        state.byArticle[articleId] = state.byArticle[articleId] || { 
          items: [], 
          page: 0, 
          perPage: 5, 
          total: 0, 
          loading: false, 
          error: null 
        };

        // Only add if not already present (to avoid duplicates with optimistic updates)
        const existingIds = new Set(state.byArticle[articleId].items.map(c => c._id || c.id));
        if (comment && !existingIds.has(comment._id || comment.id)) {
          // Prepend the new comment so it appears first
          state.byArticle[articleId].items = [comment, ...state.byArticle[articleId].items];
          state.byArticle[articleId].total = (state.byArticle[articleId].total || 0) + 1;
        }

        state.byArticle[articleId].loading = false;
        state.byArticle[articleId].error = null;
      })
      .addCase(postComment.rejected, (state, action) => {
        const { articleId } = action.meta.arg;
        state.byArticle[articleId] = state.byArticle[articleId] || { 
          items: [], 
          page: 0, 
          perPage: 5, 
          total: 0, 
          loading: false, 
          error: null 
        };
        state.byArticle[articleId].loading = false;
        state.byArticle[articleId].error = action.payload;
      });
  }
});

export const { 
  clearCommentsForArticle, 
  addCommentOptimistically,
  clearAllComments 
} = commentsSlice.actions;

export const selectCommentsForArticle = (state, articleId) => 
  state.comments?.byArticle?.[articleId]?.items || [];

export const selectCommentsMeta = (state, articleId) => 
  state.comments?.byArticle?.[articleId] || { 
    items: [], 
    page: 0, 
    perPage: 5, 
    total: 0, 
    loading: false, 
    error: null 
  };

export const selectCommentsLoading = (state, articleId) => 
  state.comments?.byArticle?.[articleId]?.loading || false;

export const selectCommentsError = (state, articleId) => 
  state.comments?.byArticle?.[articleId]?.error || null;

export const selectHasMoreComments = (state, articleId) => {
  const meta = state.comments?.byArticle?.[articleId];
  if (!meta) return false;
  return meta.items.length < (meta.total || 0);
};

export default commentsSlice.reducer;