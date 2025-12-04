import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = 'https://robo-1-qqhu.onrender.com/api';

// POST /api/follow/send-request with { targetUserId }
export const sendFollowRequest = createAsyncThunk(
  'users/sendFollowRequest',
  async (targetUserId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!targetUserId) return rejectWithValue('targetUserId required');

      const resp = await axios.post(
        `${API_BASE_URL}/follow/send-request`,
        { targetUserId },
        {
          headers: token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' },
          timeout: 10000,
        }
      );

      return { targetUserId, data: resp.data };
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to send follow request';
      return rejectWithValue(msg);
    }
  }
);

const usersSlice = createSlice({
  name: 'users',
  initialState: {
    users: [],
    followRequests: [],
    loading: false,
    error: null,
  },
  reducers: {
    followRequestReceived: (state, action) => {
      // payload expected: { actor, requestId, message, ... }
      state.followRequests.unshift(action.payload);

      // if we have the actor in the users list, mark their status accordingly
      try {
        const actor = action.payload?.actor;
        if (actor) {
          const idx = state.users.findIndex(u => u._id === actor._id || u.id === actor.id);
          if (idx !== -1) {
            state.users[idx].friendStatus = 'requested';
          }
        }
      } catch (e) {
        // ignore
      }
    },
    updateUserFollowStatus: (state, action) => {
      // payload: { userId, status }
      const { userId, status } = action.payload || {};
      if (!userId) return;
      const u = state.users.find(u => u._id === userId || u.id === userId);
      if (u) u.friendStatus = status;
    },
    setUsers: (state, action) => {
      state.users = action.payload || [];
    },
    clearError: (state) => { state.error = null; }
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendFollowRequest.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendFollowRequest.fulfilled, (state, action) => {
        state.loading = false;
        try {
          const id = action.payload?.targetUserId;
          const u = state.users.find(x => x._id === id || x.id === id);
          if (u) u.friendStatus = 'requested';
        } catch (e) {}
      })
      .addCase(sendFollowRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error?.message || 'Failed';
      });
  }
});

export const { followRequestReceived, updateUserFollowStatus, setUsers, clearError } = usersSlice.actions;
export default usersSlice.reducer;
