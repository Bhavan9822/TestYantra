
// !!!!!!!!!!!
// src/store/authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

/**
 * CONFIG
 * - BACKEND_BASE is the root domain where images/static files are served.
 * - API_BASE is the base for API endpoints.
 *
 * Update BACKEND_BASE if your uploads are served from a different domain.
 */
const BACKEND_BASE = 'https://robo-zv8u.onrender.com';
const API_BASE = `${BACKEND_BASE}/api`;

/**
 * AXIOS instance for API calls
 */
const api = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
  headers: {
    Accept: 'application/json',
  },
});

/**
 * Helper: Build full URL for profile photos.
 * - If photoPath is already a full URL or data URI -> return as-is
 * - If it's a relative path (e.g. "/uploads/abc.jpg" or "uploads/abc.jpg") -> prepend BACKEND_BASE
 */
const makeProfilePhotoUrl = (photoPath) => {
  if (!photoPath) return null;
  if (typeof photoPath !== 'string') return null;
  if (photoPath.startsWith('http') || photoPath.startsWith('data:')) return photoPath;
  // ensure leading slash
  const path = photoPath.startsWith('/') ? photoPath : `/${photoPath}`;
  return `${BACKEND_BASE}${path}`;
};

/**
 * Normalize user object returned from backend
 * - prefer profilePhotoUrl if provided by backend
 * - otherwise build a full url from profilePhoto (filename/path)
 */
const normalizeUser = (user) => {
  if (!user || typeof user !== 'object') return user;
  const copy = { ...user };

  // backend might return profilePhoto (filename) or profilePhotoUrl (full url) or null
  if (copy.profilePhotoUrl && typeof copy.profilePhotoUrl === 'string') {
    copy.profilePhotoUrl = makeProfilePhotoUrl(copy.profilePhotoUrl) || copy.profilePhotoUrl;
  } else if (copy.profilePhoto && typeof copy.profilePhoto === 'string') {
    // build full url from profilePhoto if needed
    copy.profilePhotoUrl = makeProfilePhotoUrl(copy.profilePhoto) || null;
  } else {
    copy.profilePhotoUrl = null;
  }

  return copy;
};

/**
 * registerUser thunk:
 * - Accepts userData: { username, email, password, profilePhoto }
 * - profilePhoto may be:
 *    1) a base64 string (data:image/...)  -> send as JSON (profilePhoto key)
 *    2) a File / Blob                     -> send as FormData (field "profilePhoto")
 *    3) undefined / null                  -> send without photo
 *
 * IMPORTANT: adjust backend to accept either JSON-base64 or multipart/form-data accordingly.
 */
export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData, { rejectWithValue }) => {
    try {
      console.log('[auth] registerUser - sending register request');

      // Decide payload type
      const isBase64String =
        userData?.profilePhoto && typeof userData.profilePhoto === 'string' && userData.profilePhoto.startsWith('data:');
      const isFileLike =
        userData?.profilePhoto && (userData.profilePhoto instanceof File || userData.profilePhoto instanceof Blob);

      let response;
      if (isFileLike) {
        // Send as multipart/form-data
        const fd = new FormData();
        fd.append('username', userData.username);
        fd.append('email', userData.email);
        fd.append('password', userData.password);
        fd.append('profilePhoto', userData.profilePhoto); // file blob

        // Let the browser/axios set the correct multipart Content-Type (with boundary)
        response = await api.post('/users/register', fd);
      } else {
        // Send JSON. This covers plain registration and Base64 image strings
        const payload = {
          username: userData.username,
          email: userData.email,
          password: userData.password,
        };
        if (isBase64String) {
          payload.profilePhoto = userData.profilePhoto; // base64 string
        }

        response = await api.post('/users/register', payload, {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const data = response.data;
      // backend may return user inside data.user or directly data
      const user = normalizeUser(data.user || data);
      const token = data.token || null;

      return { user, token };
    } catch (error) {
      console.error('[auth] registerUser error:', error);

      let message = 'Registration failed - please try again';
      if (error.code === 'ERR_NETWORK') {
        message = `Cannot connect to server. Check backend at ${API_BASE}`;
      } else if (error.code === 'ECONNABORTED') {
        message = 'Request timed out. Please try again.';
      } else if (error.response) {
        message =
          error.response.data?.error ||
          error.response.data?.message ||
          `Server returned ${error.response.status}`;
      } else if (error.message) {
        message = error.message;
      }

      return rejectWithValue(message);
    }
  }
);

/**
 * loginUser thunk:
 * - Expects { email, password }
 * - Backend should return an object with token and user (or user fields at top-level)
 */
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (loginData, { rejectWithValue }) => {
    try {
      console.log('[auth] loginUser - attempting login for', loginData.email);

      const response = await api.post(
        '/users/login',
        { email: loginData.email, password: loginData.password },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const data = response.data;
      console.log('[auth] loginUser - raw response:', data);

      const user = normalizeUser(data.user || data);
      const token = data.token || null;

      return { user, token };
    } catch (error) {
      console.error('[auth] loginUser error:', error);

      let message = 'Login failed - please try again';
      if (error.code === 'ERR_NETWORK') {
        message = `Cannot connect to server. Check backend at ${API_BASE}`;
      } else if (error.response?.status === 401) {
        message = 'Invalid credentials';
      } else if (error.response?.status === 404) {
        message = 'User not found';
      } else if (error.response) {
        message = error.response.data?.message || `Server error (${error.response.status})`;
      } else if (error.message) {
        message = error.message;
      }

      return rejectWithValue(message);
    }
  }
);

/**
 * Initialize state from localStorage (hydrate)
 */
let initialUser = null;
let initialToken = null;
try {
  const storedUser = localStorage.getItem('authUser');
  const storedToken = localStorage.getItem('authToken');
  if (storedUser) initialUser = normalizeUser(JSON.parse(storedUser));
  if (storedToken) initialToken = storedToken;
} catch (e) {
  console.error('[auth] error reading localStorage', e);
  initialUser = null;
  initialToken = null;
}

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    currentUser: initialUser,
    token: initialToken,
    loading: false,
    error: null,
    success: false,
    isAuthenticated: !!initialToken,
  },
  reducers: {
    clearError(state) {
      state.error = null;
    },
    clearSuccess(state) {
      state.success = false;
    },
    logout(state) {
      state.currentUser = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.success = false;
      state.error = null;
      try {
        localStorage.removeItem('authUser');
        localStorage.removeItem('authToken');
      } catch (e) {
        console.error('[auth] error clearing localStorage', e);
      }
    },
    // optional: allow updating user (e.g. after profile edit)
    setCurrentUser(state, action) {
      const user = action.payload;
      state.currentUser = normalizeUser(user);
      try {
        localStorage.setItem('authUser', JSON.stringify(state.currentUser));
      } catch (e) {
        console.error('[auth] error saving authUser', e);
      }
    },
    setToken(state, action) {
      state.token = action.payload;
      state.isAuthenticated = !!action.payload;
      try {
        if (action.payload) localStorage.setItem('authToken', action.payload);
        else localStorage.removeItem('authToken');
      } catch (e) {
        console.error('[auth] error saving authToken', e);
      }
    },
  },
  extraReducers: (builder) => {
    // Register
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload.user || null;
        state.token = action.payload.token || null;
        state.isAuthenticated = !!action.payload.token;
        state.success = true;
        state.error = null;

        // persist
        try {
          if (action.payload.user) localStorage.setItem('authUser', JSON.stringify(action.payload.user));
          if (action.payload.token) localStorage.setItem('authToken', action.payload.token);
        } catch (e) {
          console.error('[auth] localStorage save error', e);
        }
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Registration failed';
        state.success = false;
        state.currentUser = null;
        state.token = null;
        state.isAuthenticated = false;
      });

    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload.user || null;
        state.token = action.payload.token || null;
        state.isAuthenticated = !!action.payload.token;
        state.success = true;
        state.error = null;

        // persist
        try {
          if (action.payload.user) localStorage.setItem('authUser', JSON.stringify(action.payload.user));
          if (action.payload.token) localStorage.setItem('authToken', action.payload.token);
        } catch (e) {
          console.error('[auth] localStorage save error', e);
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Login failed';
        state.success = false;
        state.currentUser = null;
        state.token = null;
        state.isAuthenticated = false;
      });
  },
});

export const { clearError, clearSuccess, logout, setCurrentUser, setToken } = authSlice.actions;
export default authSlice.reducer;

/**
 * Notes / Usage tips:
 * - Use `useSelector(state => state.auth.currentUser?.profilePhotoUrl)` in Navbar/ProfileCard.
 * - If backend returns profilePhoto as a filename (e.g. "uploads/abc.jpg") the helper will build a full URL using BACKEND_BASE.
 * - If the backend returns profilePhotoUrl as a full URL, it will be used as-is.
 * - If you prefer to store accessToken and refreshToken differently, adapt createAsyncThunk and reducers accordingly.
 */
