
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = 'http://192.168.0.196:5000/api';

// Register user async thunk
export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      console.log('🔄 Sending registration request...');
      console.log('📦 Incoming userData type:', userData instanceof FormData ? 'FormData' : typeof userData);

      // If the caller already provided a FormData (e.g. from the component), use it directly.
      let payload;
      const headers = {}; // leave Content-Type unset for FormData so axios can set boundary

      if (userData instanceof FormData) {
        payload = userData;

        // Debug log FormData entries
        console.log('📋 FormData entries (component provided):');
        for (const pair of userData.entries()) {
          console.log(`   ${pair[0]}: ${pair[1] instanceof File ? `File(${pair[1].name})` : pair[1]}`);
        }
      } else {
        // Build FormData from plain object
        const formData = new FormData();
        Object.keys(userData).forEach((key) => {
          if (userData[key] !== null && userData[key] !== undefined) {
            if (userData[key] instanceof File) {
              console.log(`📁 Appending file: ${key} - ${userData[key].name}`);
            } else {
              console.log(`📝 Appending field: ${key} - ${userData[key]}`);
            }
            formData.append(key, userData[key]);
          }
        });

        payload = formData;

        console.log('📋 FormData contents (built in thunk):');
        for (let pair of formData.entries()) {
          console.log(`   ${pair[0]}: ${pair[1] instanceof File ? `File(${pair[1].name})` : pair[1]}`);
        }
      }

      const response = await axios.post(
        `${API_BASE_URL}/users/register`,
        payload,
        {
          headers, // do not set 'Content-Type' when payload is FormData
          timeout: 5000,
        }
      );

      console.log('✅ Registration successful:', response.data);
      return response.data;

    } catch (error) {
      console.error('❌ Registration API Error:', error);
      console.error('📊 Error response data:', error.response?.data);
      console.error('🔧 Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        headers: error.response?.headers
      });
      
      const errorMessage = error.response?.data?.error 
        || error.response?.data?.message
        || error.message
        || 'Registration failed - please try again';

      return rejectWithValue(errorMessage);
    }
  }
);

// Login user async thunk
export const loginUser = createAsyncThunk(
  'auth/login',
  async (loginData, { rejectWithValue }) => {
    try {
      console.log('🔄 Attempting login for:', loginData.email);
      
      const response = await axios.post(
        `${API_BASE_URL}/users/login`,
        loginData,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 5000,
        }
      );

      console.log('✅ Login successful for:', loginData.email);
      return response.data;

    } catch (error) {
      console.error('❌ Login API Error:', error);
      console.error('📊 Error response:', error.response?.data);
      
      // Handle different types of errors
      let errorMessage = 'Login failed';
      
      if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Cannot connect to server. Please check your connection.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Invalid email or password. Please try again.';
      } else if (error.response?.status === 404) {
        errorMessage = 'User not found. Please check your credentials.';
      } else {
        errorMessage = error.response?.data?.error 
          || error.response?.data?.message
          || error.message
          || 'Login failed - please try again';
      }

      return rejectWithValue(errorMessage);
    }
  }
);

// Validate user token (for persistent login)
export const validateUser = createAsyncThunk(
  'auth/validate',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No token found');
      }

      const response = await axios.get(
        `${API_BASE_URL}/users/validate`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      localStorage.removeItem('authToken');
      return rejectWithValue('Session expired. Please login again.');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    currentUser: null,
    loading: false,
    error: null,
    success: false,
    isAuthenticated: false,
    token: localStorage.getItem('authToken') || null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = false;
    },
    logout: (state) => {
      state.currentUser = null;
      state.isAuthenticated = false;
      state.success = false;
      state.token = null;
      state.error = null;
      localStorage.removeItem('authToken');
    },
    resetAuthState: (state) => {
      state.currentUser = null;
      state.loading = false;
      state.error = null;
      state.success = false;
      state.isAuthenticated = false;
      state.token = null;
      localStorage.removeItem('authToken');
    },
  },
  extraReducers: (builder) => {
    builder
      // Register User
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
        console.log('🔄 Registration pending...');
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload.user;
        state.token = action.payload.token;
        state.success = true;
        state.error = null;
        state.isAuthenticated = true;
        
        // Store token in localStorage
        if (action.payload.token) {
          localStorage.setItem('authToken', action.payload.token);
        }
        
        console.log('✅ Registration completed successfully');
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
        state.currentUser = null;
        state.isAuthenticated = false;
        state.token = null;
        console.log('❌ Registration failed:', action.payload);
      })
      // Login User
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload.user;
        state.token = action.payload.token;
        state.success = true;
        state.error = null;
        state.isAuthenticated = true;
        
        // Store token in localStorage
        if (action.payload.token) {
          localStorage.setItem('authToken', action.payload.token);
        }
        
        console.log('✅ Login completed successfully');
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
        state.currentUser = null;
        state.isAuthenticated = false;
        state.token = null;
        console.log('❌ Login failed:', action.payload);
      })
      // Validate User
      .addCase(validateUser.fulfilled, (state, action) => {
        state.currentUser = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(validateUser.rejected, (state) => {
        state.currentUser = null;
        state.isAuthenticated = false;
        state.token = null;
      });
  },
});

export const { clearError, clearSuccess, resetAuthState, logout } = authSlice.actions;
export default authSlice.reducer;