// src/FollowAcceptSlice.jsx
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE = "https://robo-zv8u.onrender.com/api";

// ACCEPT FOLLOW REQUEST
export const acceptFollowRequest = createAsyncThunk(
  "follow/accept",
  async (followerId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("authToken");

      const res = await axios.post(
        `${API_BASE}/follow/accept-request`,
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
        err.response?.data?.message || "Accept follow request failed"
      );
    }
  }
);

const followAcceptSlice = createSlice({
  name: "followAccept",
  initialState: {
    loading: false,
    error: null,
    success: false,
  },
  reducers: {
    resetAcceptState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(acceptFollowRequest.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(acceptFollowRequest.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(acceptFollowRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetAcceptState } = followAcceptSlice.actions;
export default followAcceptSlice.reducer;
