
// src/store/authSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { setNotificationsFromPending } from "./NotificationSlice";

/**
 * CONFIG
 */
const BACKEND_BASE = "https://robo-zv8u.onrender.com";
const API_BASE = `${BACKEND_BASE}/api`;

/**
 * AXIOS INSTANCE
 */
const api = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
  headers: {
    Accept: "application/json",
  },
});

/**
 * Helpers
 */
const makeProfilePhotoUrl = (photoPath) => {
  if (!photoPath || typeof photoPath !== "string") return null;
  if (photoPath.startsWith("http") || photoPath.startsWith("data:")) return photoPath;
  const path = photoPath.startsWith("/") ? photoPath : `/${photoPath}`;
  return `${BACKEND_BASE}${path}`;
};

const normalizeUser = (user) => {
  if (!user || typeof user !== "object") return user;

  const copy = { ...user };

  if (copy.profilePhotoUrl) {
    copy.profilePhotoUrl = makeProfilePhotoUrl(copy.profilePhotoUrl);
  } else if (copy.profilePhoto) {
    copy.profilePhotoUrl = makeProfilePhotoUrl(copy.profilePhoto);
  } else {
    copy.profilePhotoUrl = null;
  }

  // ✅ ENSURE ARRAYS EXIST (NO LOGIC CHANGE)
  copy.followers = Array.isArray(copy.followers) ? copy.followers : [];
  copy.following = Array.isArray(copy.following) ? copy.following : [];

  return copy;
};

/**
 * REGISTER USER
 */
export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (userData, { rejectWithValue }) => {
    try {
      const isBase64 =
        typeof userData?.profilePhoto === "string" &&
        userData.profilePhoto.startsWith("data:");
      const isFile =
        userData?.profilePhoto instanceof File ||
        userData?.profilePhoto instanceof Blob;

      let response;

      if (isFile) {
        const fd = new FormData();
        fd.append("username", userData.username);
        fd.append("email", userData.email);
        fd.append("password", userData.password);
        fd.append("profilePhoto", userData.profilePhoto);
        response = await api.post("/users/register", fd);
      } else {
        const payload = {
          username: userData.username,
          email: userData.email,
          password: userData.password,
        };
        if (isBase64) payload.profilePhoto = userData.profilePhoto;

        response = await api.post("/users/register", payload, {
          headers: { "Content-Type": "application/json" },
        });
      }

      const data = response.data;
      return {
        user: normalizeUser(data.user || data),
        token: data.token || null,
      };
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error.message ||
        "Registration failed";
      return rejectWithValue(message);
    }
  }
);

/**
 * LOGIN USER
 */
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (loginData, { rejectWithValue }) => {
    try {
      const response = await api.post(
        "/users/login",
        {
          email: loginData.email,
          password: loginData.password,
        },
        { headers: { "Content-Type": "application/json" } }
      );

      const data = response.data;
      return {
        user: normalizeUser(data.user || data),
        token: data.token || null,
      };
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error.message ||
        "Login failed";
      return rejectWithValue(message);
    }
  }
);

/**
 * HYDRATE FROM LOCALSTORAGE
 */
let initialUser = null;
let initialToken = null;

try {
  const storedUser = localStorage.getItem("authUser");
  const storedToken = localStorage.getItem("authToken");
  if (storedUser) initialUser = normalizeUser(JSON.parse(storedUser));
  if (storedToken) initialToken = storedToken;
} catch {
  initialUser = null;
  initialToken = null;
}

/**
 * SLICE
 */
const authSlice = createSlice({
  name: "auth",
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
      localStorage.removeItem("authUser");
      localStorage.removeItem("authToken");
    },
    setCurrentUser(state, action) {
      state.currentUser = normalizeUser(action.payload);
      localStorage.setItem("authUser", JSON.stringify(state.currentUser));
    },
    setToken(state, action) {
      state.token = action.payload;
      state.isAuthenticated = !!action.payload;
      if (action.payload) {
        localStorage.setItem("authToken", action.payload);
      } else {
        localStorage.removeItem("authToken");
      }
    },

    // ===============================
    // 🔥 ADDED: FOLLOW COUNTS ONLY
    // ===============================
    incrementFollowers(state, action) {
      if (!state.currentUser) return;
      if (!Array.isArray(state.currentUser.followers)) {
        state.currentUser.followers = [];
      }
      state.currentUser.followers.push(action.payload || "socket");
      localStorage.setItem("authUser", JSON.stringify(state.currentUser));
    },

    incrementFollowing(state, action) {
      if (!state.currentUser) return;
      if (!Array.isArray(state.currentUser.following)) {
        state.currentUser.following = [];
      }
      state.currentUser.following.push(action.payload || "socket");
      localStorage.setItem("authUser", JSON.stringify(state.currentUser));
    },

    // ===============================
    // 🔥 ADDED: UPDATE FOLLOWERS/FOLLOWING WITH USER DATA
    // ===============================
    // Adds user to followers or following array with full user data including username
    addToFollowers(state, action) {
      if (!state.currentUser) return;
      if (!Array.isArray(state.currentUser.followers)) {
        state.currentUser.followers = [];
      }
      const user = action.payload; // { _id, username, ... }
      // Avoid duplicates
      if (!state.currentUser.followers.some(f => f._id === user._id)) {
        state.currentUser.followers.push(user);
        localStorage.setItem("authUser", JSON.stringify(state.currentUser));
      }
    },

    addToFollowing(state, action) {
      if (!state.currentUser) return;
      if (!Array.isArray(state.currentUser.following)) {
        state.currentUser.following = [];
      }
      const user = action.payload; // { _id, username, ... }
      // Avoid duplicates
      if (!state.currentUser.following.some(f => f._id === user._id)) {
        state.currentUser.following.push(user);
        localStorage.setItem("authUser", JSON.stringify(state.currentUser));
      }
    },
  },
  extraReducers: (builder) => {
    // REGISTER
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = !!action.payload.token;
        state.success = true;

        if (action.payload.user) {
          localStorage.setItem("authUser", JSON.stringify(action.payload.user));
        }
        if (action.payload.token) {
          localStorage.setItem("authToken", action.payload.token);
        }
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // LOGIN
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = !!action.payload.token;
        state.success = true;

        if (action.payload.user) {
          localStorage.setItem("authUser", JSON.stringify(action.payload.user));
        }
        if (action.payload.token) {
          localStorage.setItem("authToken", action.payload.token);
        }

        const pendingRequests = action.payload.user?.pendingRequests || [];
        if (pendingRequests.length > 0 && action.meta?.asyncDispatch) {
          action.meta.asyncDispatch(
            setNotificationsFromPending(pendingRequests)
          );
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.currentUser = null;
        state.token = null;
        state.isAuthenticated = false;
      });
  },
});

export const {
  clearError,
  clearSuccess,
  logout,
  setCurrentUser,
  setToken,
  incrementFollowers,
  incrementFollowing,
  addToFollowers,
  addToFollowing,
} = authSlice.actions;

export default authSlice.reducer;

