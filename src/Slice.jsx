
// Slice.jsx
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Dynamic API base URL
const API_BASE_URL = 'http://192.168.0.227:5000/api'

// Register user async thunk (unchanged as requested)
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
        "http://192.168.0.227:5000/api/users/register",
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

// GET all users async thunk (NEW)
export const fetchAllUsers = createAsyncThunk(
  'user/fetchAllUsers',
  async (_, { rejectWithValue }) => {
    try {
      console.log('Fetching all users from:', `${API_BASE_URL}/users`);
      
      const response = await axios.get(`${API_BASE_URL}/users`);
      
      console.log('Users fetched successfully:', response.data);
      return response.data;

    } catch (error) {
      console.error('Fetch Users API Error Details:', {
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

// Login user async thunk (UPDATED with local credential checking)
export const loginUser = createAsyncThunk(
  'user/login',
  async (loginData, { rejectWithValue, getState }) => {
    try {
      console.log('Login attempt with:', loginData);
      
      const state = getState();
      const allUsers = state.user.allUsers || [];
      
      console.log('Available users for checking:', allUsers);

      // Check if credentials match any user in the fetched list
      const matchedUser = allUsers.find(user => 
        user.email === loginData.email && user.password === loginData.password
      );

      if (matchedUser) {
        console.log('Credentials matched locally:', matchedUser);
        
        // Also make POST request to backend for additional verification/token
        try {
          const config = {
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: 3000,
          };

          const response = await axios.post(
            `${API_BASE_URL}/users/login`,
            loginData,
            config
          );

          console.log('Backend login successful:', response.data);
          return { ...matchedUser, token: response.data.token };
          
        } catch (postError) {
          console.warn('Backend login failed, but local credentials matched. Proceeding with login.');
          // Even if backend POST fails, proceed with login since local credentials matched
          return matchedUser;
        }
      } else {
        console.log('No matching user found in local data');
        return rejectWithValue("Invalid credentials. Please check your email and password.");
      }

    } catch (error) {
      console.error('Login Error Details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
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
    allUsers: [], // NEW: Store all users for credential checking
    loading: false,
    error: null,
    success: false,
    isAuthenticated: false,
    usersLoading: false, // NEW: Separate loading state for users fetch
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
      state.allUsers = [];
      state.loading = false;
      state.error = null;
      state.success = false;
      state.isAuthenticated = false;
      state.usersLoading = false;
    },
    logout: (state) => {
      state.currentUser = null;
      state.isAuthenticated = false;
      state.success = false;
    },
    // NEW: Manual setter for allUsers if needed
    setAllUsers: (state, action) => {
      state.allUsers = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Register User (unchanged)
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
      // Fetch All Users (NEW)
      .addCase(fetchAllUsers.pending, (state) => {
        state.usersLoading = true;
        state.error = null;
      })
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.usersLoading = false;
        state.allUsers = action.payload;
        state.error = null;
        console.log('Users fetch fulfilled:', action.payload);
      })
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.usersLoading = false;
        state.error = action.payload;
        console.log('Users fetch rejected:', action.payload);
      })
      // Login User (UPDATED)
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

export const { clearError, clearSuccess, resetUserState, logout, setAllUsers } = userSlice.actions;
export default userSlice.reducer;
