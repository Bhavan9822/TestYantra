import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { connectSocket, emitWithAck } from './socket';

const API_BASE_URL = 'https://robo-1-qqhu.onrender.com/api';

// Thunk: send follow request by username. Uses the search endpoint to resolve username -> id,
// then calls the friend request endpoint. This is a best-effort helper for front-end flows.
export const sendFollowByUsername = createAsyncThunk(
  'follow/sendByUsername',
  async (userName, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!userName || typeof userName !== 'string') return rejectWithValue('Username required');

      connectSocket(token);

      // Try multiple search variants to be tolerant of backend event names/shape
      const searchVariants = [
        { event: 'users:search', payload: { q: userName } },
        { event: 'users:search', payload: { username: userName } },
        { event: 'users:find', payload: { username: userName } },
        { event: 'user:find', payload: { username: userName } },
        { event: 'user:find', payload: userName },
        { event: 'users:search', payload: userName },
      ];

      let users = [];
      const debugResponses = [];
      for (const v of searchVariants) {
        try {
          const resp = await emitWithAck(v.event, v.payload, 8000);
          debugResponses.push({ variant: v, resp });
          // normalize response into array of users
          if (!resp) continue;
          if (Array.isArray(resp)) {
            users = resp;
          } else if (Array.isArray(resp.users)) {
            users = resp.users;
          } else if (Array.isArray(resp.results)) {
            users = resp.results;
          } else if (resp.user) {
            users = Array.isArray(resp.user) ? resp.user : [resp.user];
          } else if (resp.data && Array.isArray(resp.data)) {
            users = resp.data;
          } else if (typeof resp === 'object') {
            // sometimes server returns an object keyed by id
            const maybeArray = Object.values(resp).filter(x => x && typeof x === 'object' && (x.username || x.name || x.email));
            if (maybeArray.length) users = maybeArray;
          }

          if (users.length) break; // stop when we have results
        } catch (e) {
          // ignore and try next variant
          continue;
        }
      }

      // Attempt to find a match using a sequence of strategies
      let match = null;

      // 1) exact username or name match (case-insensitive)
      match = users.find(u => {
        if (!u) return false;
        const uname = (u.username || u.name || u.email || '').toString();
        return uname.toLowerCase() === String(userName).toLowerCase();
      });

      // 2) exact email match
      if (!match) {
        match = users.find(u => (u.email || '').toString().toLowerCase() === String(userName).toLowerCase());
      }

      // 3) substring match (case-insensitive)
      if (!match) {
        match = users.find(u => {
          const uname = (u.username || u.name || u.email || '').toString().toLowerCase();
          return uname.includes(String(userName).toLowerCase());
        });
      }

      // 4) if server returned exactly one user, accept it as a best-effort match
      if (!match && users.length === 1) {
        match = users[0];
      }

      if (!match) {
        // Log socket responses so developer can paste them here for tuning
        console.log('sendFollowByUsername: no match found for', userName);
        console.log('sendFollowByUsername: socket responses:', JSON.stringify(debugResponses, null, 2));

        // As a fallback, try to POST to the follow endpoint with several username-shaped payloads
        const fallbackPayloads = [
          { username: userName },
          { userName },
          { targetUsername: userName },
          { target: userName },
        ];

        for (const p of fallbackPayloads) {
          try {
            const resp = await axios.post(
              `${API_BASE_URL}/follow/send-request`,
              p,
              {
                headers: token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' },
                timeout: 8000,
              }
            );
            // If server accepted a username-based request, return success
            if (resp && (resp.status === 200 || resp.status === 201)) {
              return { targetUserId: resp.data?.targetUserId || resp.data?.userId || null, result: resp.data };
            }
          } catch (e) {
            // log and try next payload
            console.log('sendFollowByUsername: fallback POST failed for payload', p, e?.response?.data || e.message || e);
            continue;
          }
        }

        return rejectWithValue('User not found');
      }

      // Extract id from common fields
      // Extract id from common fields, deeply if needed
      const targetUserId = match._id || match.id || match.userId || match._userId || match.uid || (match.user && (match.user._id || match.user.id)) || null;
      if (!targetUserId) {
        // Try POST by username as a fallback
        try {
          const resp = await axios.post(
            `${API_BASE_URL}/follow/send-request`,
            { username: userName },
            {
              headers: token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' },
              timeout: 8000,
            }
          );
          if (resp && (resp.status === 200 || resp.status === 201)) {
            return { targetUserId: resp.data?.targetUserId || resp.data?.userId || null, result: resp.data };
          }
        } catch (e) {
          console.debug('sendFollowByUsername: POST by username fallback failed', e?.response?.data || e.message || e);
        }
        return rejectWithValue('User id not available from search result');
      }

      // Now call REST endpoint to create follow request.
      // Some backends use different route/payload shapes; try several variants until one succeeds.
      const endpointVariants = [
        '/follow/send-request',
        '/follow/sendRequest',
        '/follow/request',
        '/follow/requests',
        '/follow/send',
        '/follow',
      ];

      // Candidate payloads to try for POST body
      const payloadCandidates = [];
      if (targetUserId) payloadCandidates.push({ targetUserId });
      payloadCandidates.push({ userId: targetUserId });
      payloadCandidates.push({ username: userName });
      payloadCandidates.push({ userName });
      payloadCandidates.push({ targetUsername: userName });
      payloadCandidates.push({ target: userName });

      let lastError = null;
      for (const ep of endpointVariants) {
        for (const p of payloadCandidates) {
          try {
            const url = `${API_BASE_URL}${ep}`;
            console.log('sendFollowByUsername: attempting POST', url, p);
            const resp = await axios.post(
              url,
              p,
              {
                headers: token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' },
                timeout: 8000,
              }
            );

            console.log('sendFollowByUsername: POST success', url, resp.status, resp.data);
            return { targetUserId: resp.data?.targetUserId || resp.data?.userId || targetUserId, result: resp.data };
          } catch (err) {
            lastError = err;
            // If 404, try next endpoint/payload; if other errors, log and also continue
            const status = err?.response?.status;
            console.log('sendFollowByUsername: POST attempt failed', { endpoint: ep, payload: p, status, data: err?.response?.data || err.message });
            // continue to next try
            continue;
          }
        }
      }

      // All attempts failed
      const errMsg = lastError?.response?.data?.message || lastError?.message || 'Failed to send follow request - no matching endpoint';
      return rejectWithValue(errMsg);
    } catch (err) {
      const message = (err && (err.message || err?.toString())) || 'Failed to send follow request';
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
