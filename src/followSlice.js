import { createSlice } from '@reduxjs/toolkit';

const followSlice = createSlice({
  name: 'follow',
  initialState: {
    pendingRequests: [],
  },
  reducers: {
    addPendingRequest(state, action) {
      const request = action.payload;
      if (!state.pendingRequests.some(r => r._id === request._id)) {
        state.pendingRequests.push(request);
      }
    },
    removePendingRequest(state, action) {
      const requestId = action.payload;
      state.pendingRequests = state.pendingRequests.filter(r => r._id !== requestId);
    },
  },
});

export const { addPendingRequest, removePendingRequest } = followSlice.actions;
export default followSlice.reducer;
