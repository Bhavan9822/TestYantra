// searchSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = 'http://192.168.0.66:5000/api';

// Search users async thunk
export const searchUsers = createAsyncThunk(
  'search/searchUsers',
  async (searchQuery, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(
        `${API_BASE_URL}/users/search?q=${encodeURIComponent(searchQuery)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Search failed');
    }
  }
);

// Send friend request async thunk
export const sendFriendRequest = createAsyncThunk(
  'search/sendFriendRequest',
  async (targetUserId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post(
        `${API_BASE_URL}/friends/request`,
        { targetUserId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send friend request');
    }
  }
);

// Get friends list async thunk
export const getFriends = createAsyncThunk(
  'search/getFriends',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(
        `${API_BASE_URL}/friends`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch friends');
    }
  }
);

// Get chat messages async thunk
export const getChatMessages = createAsyncThunk(
  'search/getChatMessages',
  async (friendId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(
        `${API_BASE_URL}/chat/${friendId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch messages');
    }
  }
);

// Send message async thunk
export const sendMessage = createAsyncThunk(
  'search/sendMessage',
  async ({ friendId, message }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post(
        `${API_BASE_URL}/chat/send`,
        { friendId, message },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send message');
    }
  }
);

const searchSlice = createSlice({
  name: 'search',
  initialState: {
    searchResults: [],
    searchLoading: false,
    searchError: null,
    friends: [],
    friendsLoading: false,
    friendsError: null,
    activeChat: null,
    chatMessages: [],
    chatLoading: false,
    chatError: null,
    showSearchResults: false,
    friendRequestLoading: false,
  },
  reducers: {
    clearSearchResults: (state) => {
      state.searchResults = [];
      state.showSearchResults = false;
    },
    setActiveChat: (state, action) => {
      state.activeChat = action.payload;
    },
    closeSearchResults: (state) => {
      state.showSearchResults = false;
    },
    addMessage: (state, action) => {
      state.chatMessages.push(action.payload);
    },
    clearChat: (state) => {
      state.activeChat = null;
      state.chatMessages = [];
    },
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
      // Send Friend Request
      .addCase(sendFriendRequest.pending, (state) => {
        state.friendRequestLoading = true;
      })
      .addCase(sendFriendRequest.fulfilled, (state, action) => {
        state.friendRequestLoading = false;
        // Update the user's status in search results
        const userIndex = state.searchResults.findIndex(user => user._id === action.payload.targetUserId);
        if (userIndex !== -1) {
          state.searchResults[userIndex].friendStatus = 'requested';
        }
      })
      .addCase(sendFriendRequest.rejected, (state) => {
        state.friendRequestLoading = false;
      })
      // Get Friends
      .addCase(getFriends.pending, (state) => {
        state.friendsLoading = true;
        state.friendsError = null;
      })
      .addCase(getFriends.fulfilled, (state, action) => {
        state.friendsLoading = false;
        state.friends = action.payload.friends || [];
      })
      .addCase(getFriends.rejected, (state, action) => {
        state.friendsLoading = false;
        state.friendsError = action.payload;
      })
      // Get Chat Messages
      .addCase(getChatMessages.pending, (state) => {
        state.chatLoading = true;
        state.chatError = null;
      })
      .addCase(getChatMessages.fulfilled, (state, action) => {
        state.chatLoading = false;
        state.chatMessages = action.payload.messages || [];
      })
      .addCase(getChatMessages.rejected, (state, action) => {
        state.chatLoading = false;
        state.chatError = action.payload;
      });
  },
});

export const { 
  clearSearchResults, 
  setActiveChat, 
  closeSearchResults, 
  addMessage, 
  clearChat 
} = searchSlice.actions;
export default searchSlice.reducer;