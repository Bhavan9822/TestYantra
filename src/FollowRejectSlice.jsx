// src/FollowRejectSlice.jsx
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE = "https://robo-zv8u.onrender.com/api";

// REJECT FOLLOW REQUEST
export const rejectFollowRequest = createAsyncThunk(
  "follow/reject",
  async (followerId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("authToken");

      const res = await axios.post(
        `${API_BASE}/follow/reject-request`,
        { followerId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Reject follow request failed"
      );
    }
  }
);

const followRejectSlice = createSlice({
  name: "followReject",
  initialState: {
    loading: false,
    error: null,
    success: false,
  },
  reducers: {
    resetRejectState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(rejectFollowRequest.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(rejectFollowRequest.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(rejectFollowRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetRejectState } = followRejectSlice.actions;
export default followRejectSlice.reducer;
