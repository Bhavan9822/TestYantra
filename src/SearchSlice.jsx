
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE = "https://robo-zv8u.onrender.com/api";

/**
 * SEND FOLLOW REQUEST
 * expects payload: { targetUsername }
 */
export const sendFollowRequest = createAsyncThunk(
  "search/sendFollowRequest",
  async ({ targetUsername }, { rejectWithValue }) => {
    try {
      if (!targetUsername) {
        return rejectWithValue("targetUsername is required");
      }

      const token = localStorage.getItem("authToken");

      const headers = {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      };

      const resp = await axios.post(
        `${API_BASE}/follow/send-request`,
        { targetUsername },
        { headers, timeout: 10000 }
      );

      console.log("[sendFollowRequest] success:", resp.data);
      return resp.data;
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to send follow request";
      return rejectWithValue(message);
    }
  }
);

const searchSlice = createSlice({
  name: "search",
  initialState: {
    sendingFollow: false,
    sendFollowError: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(sendFollowRequest.pending, (state) => {
        state.sendingFollow = true;
        state.sendFollowError = null;
      })
      .addCase(sendFollowRequest.fulfilled, (state) => {
        state.sendingFollow = false;
      })
      .addCase(sendFollowRequest.rejected, (state, action) => {
        state.sendingFollow = false;
        state.sendFollowError =
          action.payload ||
          action.error?.message ||
          "Failed to send follow request";
      });
  },
});

export default searchSlice.reducer;
