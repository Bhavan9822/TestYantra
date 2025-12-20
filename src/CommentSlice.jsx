
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";

// ================= CONFIG =================
const API_BASE_URL = "https://robo-zv8u.onrender.com/api";

// ================= ADD COMMENT =================
/**
 * Post a comment to an article
 * 
 * Usage in component:
 * ```
 * dispatch(addComment({ articleId: "123", text: "Great post!" }))
 *   .unwrap()
 *   .then(() => toast.success("Comment posted"))
 *   .catch((error) => toast.error(error));
 * ```
 */
export const addComment = createAsyncThunk(
  "comments/addComment",
  async ({ articleId, text }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("authToken");

      if (!token) {
        return rejectWithValue("Authentication required");
      }

      console.log("📝 Posting comment:", { articleId, text });

      const response = await axios.post(
        `${API_BASE_URL}/articles/${articleId}/comment`,
        { text },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      console.log("✅ Comment posted successfully:", response.data);

      return {
        articleId,
        comment: response.data.comment || response.data,
      };
    } catch (error) {
      console.error("❌ Comment post failed:", error.response?.data || error.message);
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to add comment"
      );
    }
  }
);

// ================= SLICE =================
const commentSlice = createSlice({
  name: "comments",
  initialState: {
    loading: false,
    error: null,
    // Track loading per article to show spinner on specific article
    loadingArticles: {}, // { [articleId]: boolean }
  },
  reducers: {
    clearCommentError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ================= ADD COMMENT =================
      .addCase(addComment.pending, (state, action) => {
        const articleId = action.meta.arg.articleId;
        state.loading = true;
        state.loadingArticles[articleId] = true;
        state.error = null;
      })

      .addCase(addComment.fulfilled, (state, action) => {
        const articleId = action.payload.articleId;
        state.loading = false;
        state.loadingArticles[articleId] = false;
        // Toast shown by UI component after unwrap()
        console.log("✅ Comment added to Redux state");
      })

      .addCase(addComment.rejected, (state, action) => {
        const articleId = action.meta.arg.articleId;
        state.loading = false;
        state.loadingArticles[articleId] = false;
        state.error = action.payload;
        // Error toast shown by UI component after catch()
        console.error("❌ Comment failed:", action.payload);
      });
  },
});

// ================= EXPORTS =================
export const { clearCommentError } = commentSlice.actions;

// Export with alias for backward compatibility
export { addComment as postComment };

// Selectors
export const selectCommentLoading = (state) => state.comments?.loading || false;
export const selectCommentError = (state) => state.comments?.error || null;
export const selectIsCommentingArticle = (state, articleId) => 
  state.comments?.loadingArticles?.[articleId] || false;

// Additional selectors for article comments (returning empty arrays as comments are stored in articles)
export const selectCommentsForArticle = (state, articleId) => [];
export const selectCommentsMeta = (state, articleId) => ({ 
  hasMore: false, 
  page: 1, 
  perPage: 10 
});

export default commentSlice.reducer;
