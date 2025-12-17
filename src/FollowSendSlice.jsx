
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = "https://robo-zv8u.onrender.com/api";

export const sendFollowByUsername = createAsyncThunk(
  "follow/sendFollowByUsername",
  async (targetUsername, { rejectWithValue }) => {
    try {
      if (!targetUsername) {
        return rejectWithValue("Username is required");
      }

      const token = localStorage.getItem("authToken");

      const headers = {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      };

      const response = await axios.post(
        `${API_BASE_URL}/follow/send-request`,
        { targetUsername },
        { headers, timeout: 10000 }
      );

      console.log("[follow.sendFollowByUsername] success:", response.data);
      return response.data;
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to send follow request";
      return rejectWithValue(message);
    }
  }
);

const followSlice = createSlice({
  name: "follow",
  initialState: {
    loading: false,
    success: false,
    error: null,
  },
  reducers: {
    resetFollowState: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendFollowByUsername.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(sendFollowByUsername.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(sendFollowByUsername.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error =
          action.payload || action.error?.message || "Failed";
      });
  },
});

export const { resetFollowState } = followSlice.actions;

export const selectFollowState = (state) => state.follow;

export default followSlice.reducer;
