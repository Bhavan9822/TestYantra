import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// ================= CONFIG =================
const API_BASE_URL = "https://robo-zv8u.onrender.com/api";

// ================= ADD COMMENT =================
export const addComment = createAsyncThunk(
  "comments/addComment",
  async ({ articleId, text }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("authToken");

      const response = await axios.post(
        `${API_BASE_URL}/articles/${articleId}/comment`,
        { text },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      return {
        articleId,
        comment: response.data.comment || response.data,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to add comment"
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
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // ================= ADD COMMENT =================
      .addCase(addComment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(addComment.fulfilled, (state) => {
        state.loading = false;
      })

      .addCase(addComment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default commentSlice.reducer;
