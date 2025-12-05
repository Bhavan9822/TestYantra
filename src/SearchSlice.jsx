import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { emitWithAck, connectSocket } from './socket';
import axios from 'axios';

const API_BASE_URL = 'https://robo-1-qqhu.onrender.com/api';

// Search users async thunk (via socket.io)
export const searchUsers = createAsyncThunk(
	'search/searchUsers',
	async (searchQuery, { rejectWithValue }) => {
		try {
			const token = localStorage.getItem('authToken');
			connectSocket(token);
			console.log(searchQuery);
			
			// Try socket-based search first (preferred)
			try {
				const res = await emitWithAck('users:search', { "targetUsername": searchQuery }, 8000);
				console.log('searchUsers: raw socket response for', searchQuery, res);
				const users = Array.isArray(res) ? res : (res?.users || res?.results || []);
				if (users && users.length) return { users };
				// fallthrough to HTTP fallback if no users returned
			} catch (socketErr) {
				console.warn('searchUsers: socket search failed, falling back to HTTP', socketErr?.message || socketErr);
			}

			// HTTP fallback: some backends may provide REST search
			try {
				const headers = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
				const resp = await axios.post(`${API_BASE_URL}/users/search`, { q: searchQuery }, { headers, timeout: 8000 });
				const users = Array.isArray(resp.data) ? resp.data : (resp.data?.users || resp.data?.results || []);
				console.log('searchUsers: HTTP fallback response', users);
				return { users };
			} catch (httpErr) {
				console.warn('searchUsers: HTTP fallback failed', httpErr?.response?.data || httpErr.message || httpErr);
				throw httpErr;
			}
		} catch (error) {
			const msg = (error && (error.message || error?.toString())) || 'Search failed';
			return rejectWithValue(msg);
		}
	}
);

// Send friend request async thunk (use follow/send-request)
export const sendFriendRequest = createAsyncThunk(
	'search/sendFriendRequest',
	async (payload, { rejectWithValue }) => {
		console.log(payload);
		
		try {
			const token = localStorage.getItem('authToken');
			// Use REST endpoint to send follow request
			const response = await axios.post(
				`${API_BASE_URL}/follow/send-request`,
				payload,
				{
					headers: token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' },
					timeout: 8000,
				}
			);
			return { targetUserId, data: response.data };
		} catch (error) {
			const msg = error?.response?.data?.message || (error && (error.message || error?.toString())) || 'Failed to send friend request';
			return rejectWithValue(msg);
		}
	}
);

// Get friends list async thunk (POST)
export const getFriends = createAsyncThunk(
	'search/getFriends',
	async (_, { rejectWithValue }) => {
		try {
			const token = localStorage.getItem('authToken');
			connectSocket(token);
			const res = await emitWithAck('friends:list', {}, 10000);
			// normalize to { friends }
			const friends = Array.isArray(res) ? res : (res?.friends || []);
			return { friends };
		} catch (error) {
			const msg = (error && (error.message || error?.toString())) || 'Failed to fetch friends';
			return rejectWithValue(msg);
		}
	}
);

// Get chat messages async thunk (POST)
export const getChatMessages = createAsyncThunk(
	'search/getChatMessages',
	async (friendId, { rejectWithValue }) => {
		try {
			const token = localStorage.getItem('authToken');
			connectSocket(token);
			const res = await emitWithAck('chat:messages', { friendId }, 10000);
			const messages = res?.messages || res || [];
			return { messages };
		} catch (error) {
			const msg = (error && (error.message || error?.toString())) || 'Failed to fetch messages';
			return rejectWithValue(msg);
		}
	}
);

// Send message async thunk
export const sendMessage = createAsyncThunk(
	'search/sendMessage',
	async ({ friendId, message }, { rejectWithValue }) => {
		try {
			const token = localStorage.getItem('authToken');
			connectSocket(token);
			const res = await emitWithAck('chat:send', { friendId, message }, 10000);
			return res;
		} catch (error) {
			const msg = (error && (error.message || error?.toString())) || 'Failed to send message';
			return rejectWithValue(msg);
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
		setLocalSearchResult: (state, action) => {
			const payload = action.payload;
			if (!payload) {
				state.searchResults = [];
				state.showSearchResults = false;
				return;
			}

			if (typeof payload === 'string') {
				const username = payload.trim();
				if (!username) {
					state.searchResults = [];
					state.showSearchResults = false;
					return;
				}
				const localUser = {
					_id: `local-${username}`,
					username,
					email: '',
					friendStatus: null,
					_local: true,
				};
				state.searchResults = [localUser];
				state.showSearchResults = true;
				return;
			}

			if (typeof payload === 'object') {
				const user = {
					_id: payload._id || payload.id || `local-${payload.username}`,
					username: payload.username || payload.name || '',
					email: payload.email || '',
					friendStatus: payload.friendStatus || null,
					_local: payload._local || false,
				};
				state.searchResults = [user];
				state.showSearchResults = true;
				return;
			}

			state.searchResults = [];
			state.showSearchResults = false;
		},
		sendFriendRequestLocal: (state, action) => {
			const targetId = action.payload;
			const idx = state.searchResults.findIndex(u => u._id === targetId);
			if (idx !== -1) {
				state.searchResults[idx].friendStatus = 'requested';
			}
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
			.addCase(searchUsers.pending, (state) => {
				state.searchLoading = true;
				state.searchError = null;
			})
			.addCase(searchUsers.fulfilled, (state, action) => {
				state.searchLoading = false;
				state.searchResults = action.payload?.users || action.payload || [];
				state.showSearchResults = true;
			})
			.addCase(searchUsers.rejected, (state, action) => {
				state.searchLoading = false;
				state.searchError = action.payload;
			})
			.addCase(sendFriendRequest.pending, (state) => {
				state.friendRequestLoading = true;
			})
			.addCase(sendFriendRequest.fulfilled, (state, action) => {
				state.friendRequestLoading = false;
				const userIndex = state.searchResults.findIndex(user => user._id === action.payload.targetUserId);
				if (userIndex !== -1) {
					state.searchResults[userIndex].friendStatus = 'requested';
				}
			})
			.addCase(sendFriendRequest.rejected, (state) => {
				state.friendRequestLoading = false;
			})
			.addCase(getFriends.pending, (state) => {
				state.friendsLoading = true;
				state.friendsError = null;
			})
			.addCase(getFriends.fulfilled, (state, action) => {
				state.friendsLoading = false;
				state.friends = action.payload?.friends || action.payload || [];
			})
			.addCase(getFriends.rejected, (state, action) => {
				state.friendsLoading = false;
				state.friendsError = action.payload;
			})
			.addCase(getChatMessages.pending, (state) => {
				state.chatLoading = true;
				state.chatError = null;
			})
			.addCase(getChatMessages.fulfilled, (state, action) => {
				state.chatLoading = false;
				state.chatMessages = action.payload?.messages || action.payload || [];
			})
			.addCase(getChatMessages.rejected, (state, action) => {
				state.chatLoading = false;
				state.chatError = action.payload;
			});
	},
});

export const {
	clearSearchResults,
	setLocalSearchResult,
	sendFriendRequestLocal,
	setActiveChat,
	closeSearchResults,
	addMessage,
	clearChat,
} = searchSlice.actions;
export default searchSlice.reducer;
