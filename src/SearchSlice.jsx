import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { connectSocket, on as socketOn, off as socketOff } from './socket';

const API_BASE = 'https://robo-zv8u.onrender.com/api';

// POST /api/follow/send-request
export const sendFollowRequest = createAsyncThunk(
	'search/sendFollowRequest',
	async (targetUsername, { rejectWithValue }) => {
		console.log(targetUsername);
		
		try {

			const token = localStorage.getItem('authToken');
			const headers = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };

			console.log(targetUsername);
			const resp = await axios.post(`${API_BASE}/follow/send-request`, targetUsername, { headers, timeout: 10000 });
			console.log('[search.sendFollowRequest] REST response=', { status: resp.status, data: resp.data });
			return resp.data || { success: true };
		} catch (err) {
			const message = err?.response?.data?.message || err?.message || 'Failed to send follow request';
			return rejectWithValue(message);
		}
	}
);

// Start socket listeners for follow notifications
export const startSearchSocket = createAsyncThunk(
	'search/startSocket',
	async (_, { dispatch }) => {
		try {
			const token = localStorage.getItem('authToken');
			const socket = connectSocket(token);

			// Listen for followRequestReceived and dispatch into the slice
			const onFollowReceived = (payload) => {
				try {
					dispatch(addFollowNotification(payload));
				} catch (e) {
					console.warn('startSearchSocket: dispatch failed', e);
				}
			};

			if (socket) {
				socketOn('followRequestReceived', onFollowReceived);
			}

			// Return a cleanup function so consumers can unsubscribe if needed
			return () => {
				try {
					socketOff('followRequestReceived', onFollowReceived);
				} catch (e) {}
			};
		} catch (e) {
			console.warn('startSearchSocket failed', e);
			return null;
		}
	}
);

const initialState = {
	notifications: [],
	sendingFollow: false,
	sendFollowError: null,
};

const searchSlice = createSlice({
	name: 'search',
	initialState,
	reducers: {
		addFollowNotification(state, action) {
			// payload expected to be { sender: { username, _id, ... }, ... }
			const payload = action.payload;
			if (!payload) return;
			state.notifications.unshift({
				id: payload._id || `${Date.now()}-${Math.random()}`,
				type: 'follow_request',
				receivedAt: Date.now(),
				payload,
			});
		},
		clearNotifications(state) {
			state.notifications = [];
		},
		removeNotification(state, action) {
			const id = action.payload;
			state.notifications = state.notifications.filter(n => n.id !== id);
		},
	},
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
				state.sendFollowError = action.payload || action.error?.message || 'Failed to send follow request';
			});
	},
});

export const { addFollowNotification, clearNotifications, removeNotification } = searchSlice.actions;
export default searchSlice.reducer;
