import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = 'https://robo-1-qqhu.onrender.com/api';

// Thunk: send follow request by username. Uses the search endpoint to resolve username -> id,
// then calls the friend request endpoint. This is a best-effort helper for front-end flows.
export const sendFollowByUsername = createAsyncThunk(
  'follow/sendByUsername',
  async (userName, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!userName || typeof userName !== 'string') return rejectWithValue('Username required');

      // Resolve username using POST search endpoint (body: { q })
      const searchResp = await axios.post(
        `${API_BASE_URL}/users/search`,
        { q: userName },
        {
          headers: token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' },
          timeout: 8000,
        }
      );

      const users = Array.isArray(searchResp.data) ? searchResp.data : (searchResp.data.users || []);
      // Find exact case-insensitive match
      const match = users.find(u => u && u.userName && String(u.userName).toLowerCase() === String(userName).toLowerCase());

      if (!match || !match._id) {
        return rejectWithValue('User not found');
      }

      const targetUserId = match._id;

      // Now call friend request endpoint (server expects follow/send-request)
      const resp = await axios.post(
        `${API_BASE_URL}/follow/send-request`,
        { targetUserId },
        {
          headers: token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' },
          timeout: 8000,
        }
      );

      return { targetUserId, result: resp.data };
    } catch (err) {
      const message = err?.response?.data?.message || err?.response?.data || err.message || 'Failed to send follow request';
      return rejectWithValue(message);
    }
  }
);

const followSlice = createSlice({
  name: 'follow',
  initialState: {
    loading: false,
    error: null,
    lastRequestedId: null,
    success: false,
  },
  reducers: {
    resetFollowState: (state) => {
      state.loading = false;
      state.error = null;
      state.lastRequestedId = null;
      state.success = false;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendFollowByUsername.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(sendFollowByUsername.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.lastRequestedId = action.payload?.targetUserId || null;
        state.success = true;
      })
      .addCase(sendFollowByUsername.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error?.message || 'Failed';
        state.success = false;
      });
  }
});

export const { resetFollowState } = followSlice.actions;

export const selectFollowState = (state) => state.follow || { loading: false, error: null, lastRequestedId: null, success: false };

export default followSlice.reducer;
