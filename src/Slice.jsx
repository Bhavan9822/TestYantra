// Slice.jsx
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Dynamic API base URL
const API_BASE_URL = 'http://192.168.0.37:5000/api'

// Register user async thunk
export const registerUser = createAsyncThunk(
  'user/register',
  async (userData, { rejectWithValue }) => {
    try {
      console.log('Sending registration request to:', `${API_BASE_URL}/users/register`);
      console.log(userData)
      const formData = new FormData();
      
      // Append all user data to FormData
      Object.keys(userData).forEach(key => {
        if (userData[key] !== null && userData[key] !== undefined) {
          formData.append(key, userData[key]);
        }
      });

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
  
      };

      const response = await axios.post(
       "http://192.168.0.11:5000/api/users/register",
        formData,
        config
      );

      console.log('Registration successful:', response.data);
      return response.data;

    } catch (error) {
      console.error('Registration API Error Details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });

      const errorMessage = error.response?.data?.message 
        || error.response?.data?.error
        || error.message
        || 'Network error - cannot reach server';

      return rejectWithValue(errorMessage);
    }
  }
);

// Login user async thunk
export const loginUser = createAsyncThunk(
  'user/login',
  async (loginData, { rejectWithValue }) => {
    try {
      console.log('Sending login request to:', `${API_BASE_URL}/users/login`);
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      };

      const response = await axios.post(
        `${API_BASE_URL}/users/login`,
        loginData,
        config
      );

      console.log('Login successful:', response.data);
      return response.data;

    } catch (error) {
      console.error('Login API Error Details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });

      const errorMessage = error.response?.data?.message 
        || error.response?.data?.error
        || error.message
        || 'Network error - cannot reach server';

      return rejectWithValue(errorMessage);
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState: {
    currentUser: null,
    loading: false,
    error: null,
    success: false,
    isAuthenticated: false,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = false;
    },
    resetUserState: (state) => {
      state.currentUser = null;
      state.loading = false;
      state.error = null;
      state.success = false;
      state.isAuthenticated = false;
    },
    logout: (state) => {
      state.currentUser = null;
      state.isAuthenticated = false;
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Register User
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload;
        state.success = true;
        state.error = null;
        state.isAuthenticated = true;
        console.log('Registration fulfilled:', action.payload);
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
        state.currentUser = null;
        state.isAuthenticated = false;
        console.log('Registration rejected:', action.payload);
      })
      // Login User
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload;
        state.success = true;
        state.error = null;
        state.isAuthenticated = true;
        console.log('Login fulfilled:', action.payload);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
        state.currentUser = null;
        state.isAuthenticated = false;
        console.log('Login rejected:', action.payload);
      });
  },
});

export const { clearError, clearSuccess, resetUserState, logout } = userSlice.actions;
export default userSlice.reducer;
