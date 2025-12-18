import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { updatePostOptimistically } from './ArticlesSlice';

const API_BASE_URL = 'https://robo-zv8u.onrender.com/api';

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

      // Return data that components can use if needed
      return {
        articleId, 
        comment: created
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