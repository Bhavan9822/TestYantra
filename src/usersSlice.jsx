// usersSlice.js - Combine search and follow functionality
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { emitWithAck, connectSocket } from './socket';
import axios from 'axios';

const API_BASE_URL = 'https://robo-1-qqhu.onrender.com/api';

// Search users via socket.io (since no REST endpoint)
export const searchUsers = createAsyncThunk(
  'users/searchUsers',
  async (searchQuery, { rejectWithValue, getState }) => {
    try {
      const token = localStorage.getItem('authToken');
      connectSocket(token);
      
      // Try socket.io search first
      const res = await emitWithAck('users:search', { q: searchQuery }, 10000);
      
      // Normalize response
      let users = [];
      if (Array.isArray(res)) {
        users = res;
      } else if (res?.users) {
        users = res.users;
      } else if (res?.results) {
        users = res.results;
      }
      
      // If no results from socket, try local filtering from existing users
      if (!users.length) {
        const state = getState();
        const allUsers = state.users.users || [];
        const friends = state.search?.friends || [];
        
        // Combine all known users
        const knownUsers = [...allUsers, ...friends];
        
        // Filter locally
        users = knownUsers.filter(user => 
          user?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user?.name?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        
        // Remove duplicates
        const seen = new Set();
        users = users.filter(user => {
          const id = user._id || user.id;
          if (id && seen.has(id)) return false;
          seen.add(id);
          return true;
        });
      }
      
      // Add follow status to each user
      const enhancedUsers = users.map(user => {
        const followStatus = getState().users.followStatus[user._id || user.id] || 'none';
        return {
          ...user,
          followStatus,
          isCurrentUser: user._id === getState().auth?.currentUser?._id
        };
      });
      
      return { users: enhancedUsers };
    } catch (error) {
      console.warn('Socket search failed, falling back to local:', error);
      
      // Fallback to local filtering
      try {
        const state = getState();
        const allUsers = state.users.users || [];
        const friends = state.search?.friends || [];
        const knownUsers = [...allUsers, ...friends];
        
        const filtered = knownUsers.filter(user => 
          user?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user?.name?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        
        const seen = new Set();
        const uniqueUsers = filtered.filter(user => {
          const id = user._id || user.id;
          if (id && seen.has(id)) return false;
          seen.add(id);
          return true;
        });
        
        // Add follow status
        const enhancedUsers = uniqueUsers.map(user => {
          const followStatus = getState().users.followStatus[user._id || user.id] || 'none';
          return {
            ...user,
            followStatus,
            isCurrentUser: user._id === getState().auth?.currentUser?._id
          };
        });
        
        return { users: enhancedUsers };
      } catch (fallbackError) {
        return rejectWithValue('Search failed: ' + (error.message || 'Unknown error'));
      }
    }
  }
);

// Send follow request by userId
export const sendFollowRequest = createAsyncThunk(
  'users/sendFollowRequest',
  async (userId, { rejectWithValue, getState }) => {
    try {
      const token = localStorage.getItem('authToken');
      
      // Call the backend endpoint for follow requests
      const response = await axios.post(
        `${API_BASE_URL}/follow/send-request`,
        { userId },  // Backend expects userId
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 8000
        }
      );
      
      return { 
        success: true,
        targetUserId: userId,
        data: response.data 
      };
    } catch (error) {
      console.error('Follow request error:', error);
      
      // If REST fails, try socket.io as fallback
      try {
        const token = localStorage.getItem('authToken');
        connectSocket(token);
        
        const socketResult = await emitWithAck('follow:request', { 
          targetUserId: userId 
        }, 10000);
        
        return { 
          success: true,
          targetUserId: userId,
          data: socketResult,
          viaSocket: true
        };
      } catch (socketError) {
        return rejectWithValue(
          error.response?.data?.message || 
          error.message || 
          'Failed to send follow request'
        );
      }
    }
  }
);

// Send follow request by username (compatibility with existing code)
export const sendFollowByUsername = createAsyncThunk(
  'users/sendFollowByUsername',
  async (username, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      
      // First, try to find user by username via socket
      connectSocket(token);
      const searchRes = await emitWithAck('users:search', { q: username }, 10000);
      
      let users = [];
      if (Array.isArray(searchRes)) {
        users = searchRes;
      } else if (searchRes?.users) {
        users = searchRes.users;
      }
      
      // Find the user
      const user = users.find(u => 
        u.username?.toLowerCase() === username.toLowerCase()
      );
      
      if (!user) {
        return rejectWithValue('User not found');
      }
      
      // Send follow request to found user
      const response = await axios.post(
        `${API_BASE_URL}/follow/send-request`,
        { userId: user._id || user.id },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 8000
        }
      );
      
      return { 
        success: true,
        targetUserId: user._id || user.id,
        targetUsername: username,
        data: response.data 
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        'Failed to send follow request'
      );
    }
  }
);

// Fetch all users (for local search fallback)
export const fetchAllUsers = createAsyncThunk(
  'users/fetchAllUsers',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      connectSocket(token);
      
      const res = await emitWithAck('users:list', {}, 10000);
      
      let users = [];
      if (Array.isArray(res)) {
        users = res;
      } else if (res?.users) {
        users = res.users;
      }
      
      return users;
    } catch (error) {
      return rejectWithValue('Failed to fetch users');
    }
  }
);

const usersSlice = createSlice({
  name: 'users',
  initialState: {
    // User lists
    users: [],
    searchResults: [],
    
    // Follow system
    followStatus: {}, // userId -> 'none' | 'requested' | 'following' | 'pending'
    followRequests: [], // Incoming follow requests
    
    // Loading states
    loading: false,
    searchLoading: false,
    followLoading: false,
    
    // Errors
    error: null,
    searchError: null,
    followError: null,
    
    // UI state
    showSearchResults: false,
    lastSearchedQuery: ''
  },
  reducers: {
    // Clear search results
    clearSearchResults: (state) => {
      state.searchResults = [];
      state.showSearchResults = false;
      state.searchError = null;
    },
    
    // Show/hide search results
    setShowSearchResults: (state, action) => {
      state.showSearchResults = action.payload;
    },
    
    // Update follow status for a user
    updateUserFollowStatus: (state, action) => {
      const { userId, status } = action.payload;
      state.followStatus[userId] = status;
      
      // Update in search results
      const userInResults = state.searchResults.find(user => user._id === userId);
      if (userInResults) {
        userInResults.followStatus = status;
      }
      
      // Update in users list
      const userInList = state.users.find(user => user._id === userId);
      if (userInList) {
        userInList.followStatus = status;
      }
    },
    
    // Handle incoming follow request via socket.io
    followRequestReceived: (state, action) => {
      const request = action.payload;
      state.followRequests.push(request);
      
      // If the sender is in search results, update their status
      if (request.senderId) {
        const senderInResults = state.searchResults.find(user => user._id === request.senderId);
        if (senderInResults) {
          senderInResults.followStatus = 'pending'; // They sent you a request
        }
      }
    },
    
    // Handle follow request acceptance
    followRequestAccepted: (state, action) => {
      const { requestId, userId } = action.payload;
      
      // Remove from requests
      state.followRequests = state.followRequests.filter(req => req._id !== requestId);
      
      // Update follow status
      state.followStatus[userId] = 'following';
      
      // Update in search results
      const userInResults = state.searchResults.find(user => user._id === userId);
      if (userInResults) {
        userInResults.followStatus = 'following';
      }
    },
    
    // Add a local search result (for when socket search fails)
    addLocalSearchResult: (state, action) => {
      const user = action.payload;
      if (!state.searchResults.some(u => u._id === user._id)) {
        state.searchResults.push({
          ...user,
          followStatus: state.followStatus[user._id] || 'none',
          isCurrentUser: false
        });
        state.showSearchResults = true;
      }
    },
    
    // Set last searched query
    setLastSearchedQuery: (state, action) => {
      state.lastSearchedQuery = action.payload;
    },
    
    // Reset state
    resetUsersState: (state) => {
      state.searchResults = [];
      state.searchLoading = false;
      state.searchError = null;
      state.showSearchResults = false;
      state.followLoading = false;
      state.followError = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Search Users
      .addCase(searchUsers.pending, (state) => {
        state.searchLoading = true;
        state.searchError = null;
      })
      .addCase(searchUsers.fulfilled, (state, action) => {
        state.searchLoading = false;
        state.searchResults = action.payload.users || [];
        state.showSearchResults = true;
      })
      .addCase(searchUsers.rejected, (state, action) => {
        state.searchLoading = false;
        state.searchError = action.payload;
      })
      
      // Send Follow Request
      .addCase(sendFollowRequest.pending, (state) => {
        state.followLoading = true;
        state.followError = null;
      })
      .addCase(sendFollowRequest.fulfilled, (state, action) => {
        state.followLoading = false;
        const userId = action.payload.targetUserId;
        state.followStatus[userId] = 'requested';
        
        // Update in search results
        const userIndex = state.searchResults.findIndex(user => user._id === userId);
        if (userIndex !== -1) {
          state.searchResults[userIndex].followStatus = 'requested';
        }
      })
      .addCase(sendFollowRequest.rejected, (state, action) => {
        state.followLoading = false;
        state.followError = action.payload;
      })
      
      // Send Follow by Username
      .addCase(sendFollowByUsername.pending, (state) => {
        state.followLoading = true;
        state.followError = null;
      })
      .addCase(sendFollowByUsername.fulfilled, (state, action) => {
        state.followLoading = false;
        const userId = action.payload.targetUserId;
        state.followStatus[userId] = 'requested';
      })
      .addCase(sendFollowByUsername.rejected, (state, action) => {
        state.followLoading = false;
        state.followError = action.payload;
      })
      
      // Fetch All Users
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.users = action.payload || [];
      });
  }
});

export const {
  clearSearchResults,
  setShowSearchResults,
  updateUserFollowStatus,
  followRequestReceived,
  followRequestAccepted,
  addLocalSearchResult,
  setLastSearchedQuery,
  resetUsersState
} = usersSlice.actions;

export default usersSlice.reducer;
