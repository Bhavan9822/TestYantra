



// // !!!!!!!!!!!!!!
// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// import axios from 'axios';

// // Use env var if provided, otherwise default to localhost for development
// const API_BASE_URL = 'http://192.168.0.100:5000/api';

// // Create axios instance
// const api = axios.create({
//   baseURL: API_BASE_URL,
//   timeout: 10000,
//   // Do not enable withCredentials by default to avoid CORS complexity; enable if backend requires cookies
// });

// // Add request interceptor for debugging
// api.interceptors.request.use(
//   (config) => {
//     console.log('🚀 Making request to:', config.url);
//     console.log('📦 Request method:', config.method);
//     console.log('🔧 Request headers:', config.headers);
//     return config;
//   },
//   (error) => {
//     console.error('❌ Request interceptor error:', error);
//     return Promise.reject(error);
//   }
// );

// // Add response interceptor for debugging
// api.interceptors.response.use(
//   (response) => {
//     console.log('✅ Response received:', response.status);
//     console.log('📄 Response data:', response.data);
//     return response;
//   },
//   (error) => {
//     console.error('❌ Response interceptor error:', error);
//     console.log('Error details:', {
//       message: error.message,
//       code: error.code,
//       response: error.response?.data,
//       status: error.response?.status
//     });
//     return Promise.reject(error);
//   }
// );

// // Register user async thunk
// export const registerUser = createAsyncThunk(
//   'auth/register',
//   async (userData, { rejectWithValue }) => {
//     try {
//       console.log('🔄 Sending registration request...');
//       console.log('📦 User data type:', userData instanceof FormData ? 'FormData' : typeof userData);

//       let payload;
//       let headers = {};

//       if (userData instanceof FormData) {
//         payload = userData;
//         // Don't set Content-Type for FormData - let browser set it with boundary
//         console.log('📋 FormData entries (component provided):');
//         for (const pair of userData.entries()) {
//           console.log(`   ${pair[0]}: ${pair[1] instanceof File ? `File(${pair[1].name})` : pair[1]}`);
//         }
//       } else {
//         // Check if we have a file to upload
//         if (userData.profilePhoto instanceof File) {
//           // Use FormData for file upload; include multiple common name fields so backend accepts any expected key
//           const formData = new FormData();
//           const usernameVal = userData.username || userData.fullName || '';
//           formData.append('username', usernameVal);
//           // Some backends expect fullName / name as well — append redundantly (server will ignore extras)
//           formData.append('fullName', usernameVal);
//           formData.append('name', usernameVal);
//           formData.append('email', userData.email || '');
//           formData.append('password', userData.password || '');
//           formData.append('profilePhoto', userData.profilePhoto);

//           payload = formData;
//           console.log('📁 Using FormData for file upload');
//           console.log('📋 FormData preview:');
//           for (const pair of formData.entries()) {
//             console.log('   ', pair[0], pair[1] instanceof File ? `File(${pair[1].name})` : pair[1]);
//           }
//         } else {
//           // Use JSON for regular registration
//           payload = {
//             username: userData.username || userData.fullName,
//             email: userData.email,
//             password: userData.password
//           };
//           headers['Content-Type'] = 'application/json';
//           console.log('📄 Using JSON payload');
//         }
//       }

//       const response = await api.post('/users/register', payload, { headers });
//       console.log('✅ Registration successful:', response.data);

//       // Normalize response to { user, token }
//       const data = response.data || {};
//       let user = data.user || data;
//       const token = data.token || null;

//       // If backend didn't return profile photo in the initial response, try fetching fresh user data
//       try {
//         const hasPhoto = user && (user.profilePhoto || user.profilePhotoUrl);
//         const userId = user?._id || user?.id;
//         if (!hasPhoto && userId) {
//           console.log('🔁 No profile photo in response; fetching full user object');
//           const userResp = await api.get(`/users/${userId}`);
//           const fresh = userResp.data || {};
//           user = fresh.user || fresh;
//           console.log('✅ Fetched user after register:', user);
//         }
//       } catch (e) {
//         console.warn('⚠️ Could not fetch fresh user after register:', e?.message || e);
//       }

//       // Normalize before returning
//       user = normalizeUser(user);
//       return { user, token };

//     } catch (error) {
//       console.error('❌ Registration API Error:', error);
      
//       // Enhanced error logging
//       if (error.response) {
//         console.error('📊 Error response status:', error.response.status);
//         console.error('📋 Error response data:', error.response.data);
//         console.error('🔧 Error response headers:', error.response.headers);
//       } else if (error.request) {
//         console.error('🌐 No response received - request details:', error.request);
//       }
      
//       const errorMessage = error.response?.data?.error 
//         || error.response?.data?.message
//         || error.message
//         || 'Registration failed - please try again';

//       return rejectWithValue(errorMessage);
//     }
//   }
// );

// // Login user async thunk
// export const loginUser = createAsyncThunk(
//   'auth/login',
//   async (loginData, { rejectWithValue }) => {
//     try {
//       console.log('🔄 Attempting login for:', loginData.email);
      
//       const response = await api.post('/users/login', loginData, {
//         headers: {
//           'Content-Type': 'application/json',
//         }
//       });

//       console.log('✅ Login successful for:', loginData.email);
//       const data = response.data || {};
//       let user = data.user || data;
//       const token = data.token || null;

//       // If login response lacks profile photo, attempt to fetch full user
//       try {
//         const hasPhoto = user && (user.profilePhoto || user.profilePhotoUrl);
//         const userId = user?._id || user?.id;
//         if (!hasPhoto && userId) {
//           console.log('🔁 No profile photo in login response; fetching full user object');
//           const userResp = await api.get(`/users/${userId}`);
//           const fresh = userResp.data || {};
//           user = fresh.user || fresh;
//           console.log('✅ Fetched user after login:', user);
//         }
//       } catch (e) {
//         console.warn('⚠️ Could not fetch fresh user after login:', e?.message || e);
//       }

//       user = normalizeUser(user);
//       return { user, token };

//     } catch (error) {
//       console.error('❌ Login API Error:', error);
      
//       if (error.response) {
//         console.error('📊 Login error response:', error.response.data);
//         console.error('🔧 Login error status:', error.response.status);
//       }
      
//       let errorMessage = 'Login failed';
      
//       if (error.code === 'ERR_NETWORK') {
//         errorMessage = 'Cannot connect to server. Please check if the backend is running.';
//       } else if (error.response?.status === 401) {
//         errorMessage = 'Invalid email or password. Please try again.';
//       } else if (error.response?.status === 404) {
//         errorMessage = 'User not found. Please check your credentials.';
//       } else if (error.response?.status === 500) {
//         errorMessage = 'Server error. Please try again later.';
//       } else {
//         errorMessage = error.response?.data?.error 
//           || error.response?.data?.message
//           || error.message
//           || 'Login failed - please try again';
//       }

//       return rejectWithValue(errorMessage);
//     }
//   }
// );

// // Get all posts
// export const fetchPosts = createAsyncThunk(
//   'posts/fetchPosts',
//   async (_, { rejectWithValue }) => {
//     try {
//       console.log('🔄 Fetching posts...');
//       const response = await api.get('/posts');
//       console.log('✅ Posts fetched successfully');
//       return response.data;
//     } catch (error) {
//       console.error('❌ Fetch posts error:', error);
//       return rejectWithValue(error.response?.data?.error || 'Failed to fetch posts');
//     }
//   }
// );

// // Add new post
// export const addPost = createAsyncThunk(
//   'posts/addPost',
//   async (postData, { rejectWithValue }) => {
//     try {
//       console.log('🔄 Adding new post...');
//       const response = await api.post('/posts', postData, {
//         headers: {
//           'Content-Type': 'application/json',
//         }
//       });
//       console.log('✅ Post added successfully');
//       return response.data;
//     } catch (error) {
//       console.error('❌ Add post error:', error);
//       return rejectWithValue(error.response?.data?.error || 'Failed to add post');
//     }
//   }
// );

// // Like post
// export const likePost = createAsyncThunk(
//   'posts/likePost',
//   async (postId, { rejectWithValue }) => {
//     try {
//       console.log('🔄 Liking post:', postId);
//       const response = await api.post(`/likes/${postId}`, {
//         userId: 1 // You'll need to get this from auth state
//       }, {
//         headers: {
//           'Content-Type': 'application/json',
//         }
//       });
//       console.log('✅ Post liked successfully');
//       return response.data;
//     } catch (error) {
//       console.error('❌ Like post error:', error);
//       return rejectWithValue(error.response?.data?.error || 'Failed to like post');
//     }
//   }
// );

// // Add comment
// export const addComment = createAsyncThunk(
//   'posts/addComment',
//   async ({ postId, commentData }, { rejectWithValue }) => {
//     try {
//       console.log('🔄 Adding comment to post:', postId);
//       const response = await api.post(`/comments/${postId}`, commentData, {
//         headers: {
//           'Content-Type': 'application/json',
//         }
//       });
//       console.log('✅ Comment added successfully');
//       return response.data;
//     } catch (error) {
//       console.error('❌ Add comment error:', error);
//       return rejectWithValue(error.response?.data?.error || 'Failed to add comment');
//     }
//   }
// );

// // Helper: ensure user object has `profilePhotoUrl` that is a full URL
// const makeProfilePhotoUrl = (photoPath) => {
//   if (!photoPath) return null;
//   if (typeof photoPath !== 'string') return null;
//   // If it's already a full URL or data URL, return as-is
//   if (photoPath.startsWith('http') || photoPath.startsWith('data:')) return photoPath;
//   // Otherwise, prefix with API base so browser can load it
//   return `${API_BASE_URL}${photoPath.startsWith('/') ? '' : '/'}${photoPath}`;
// };

// const normalizeUser = (user) => {
//   if (!user || typeof user !== 'object') return user;
//   const copy = { ...user };
//   // backend might return profilePhoto as a path or filename
//   copy.profilePhotoUrl = makeProfilePhotoUrl(copy.profilePhoto) || copy.profilePhotoUrl || null;
//   return copy;
// };

// // Initialize currentUser from localStorage if available
// let initialUser = null;
// try {
//   const raw = localStorage.getItem('authUser');
//   if (raw) initialUser = normalizeUser(JSON.parse(raw));
// } catch (e) {
//   initialUser = null;
// }

// const authSlice = createSlice({
//   name: 'auth',
//   initialState: {
//     currentUser: initialUser,
//     loading: false,
//     error: null,
//     success: false,
//     isAuthenticated: !!localStorage.getItem('authToken'),
//     token: localStorage.getItem('authToken') || null,
//     posts: [],
//     postsLoading: false,
//     postsError: null,
//   },
//   reducers: {
//     clearError: (state) => {
//       state.error = null;
//       state.postsError = null;
//     },
//     clearSuccess: (state) => {
//       state.success = false;
//     },
//     logout: (state) => {
//       state.currentUser = null;
//       state.isAuthenticated = false;
//       state.success = false;
//       state.token = null;
//       state.error = null;
//       state.posts = [];
//       localStorage.removeItem('authToken');
//     },
//     resetAuthState: (state) => {
//       state.currentUser = null;
//       state.loading = false;
//       state.error = null;
//       state.success = false;
//       state.isAuthenticated = false;
//       state.token = null;
//       state.posts = [];
//       state.postsLoading = false;
//       state.postsError = null;
//       localStorage.removeItem('authToken');
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       // Register User
//       .addCase(registerUser.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//         state.success = false;
//         console.log('🔄 Registration pending...');
//       })
//       .addCase(registerUser.fulfilled, (state, action) => {
//         state.loading = false;
//         // Normalize user so UI can use `profilePhotoUrl`
//         state.currentUser = normalizeUser(action.payload.user);
//         state.success = true;
//         state.error = null;
//         state.isAuthenticated = true;
        
//         // Persist user and token when available
//         try {
//           if (action.payload.user) localStorage.setItem('authUser', JSON.stringify(state.currentUser));
//           if (action.payload.token) localStorage.setItem('authToken', action.payload.token);
//         } catch (e) {}

//         console.log('✅ Registration completed successfully');
//       })
//       .addCase(registerUser.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//         state.success = false;
//         state.currentUser = null;
//         state.isAuthenticated = false;
//         console.log('❌ Registration failed:', action.payload);
//       })
//       // Login User
//       .addCase(loginUser.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//         state.success = false;
//       })
//       .addCase(loginUser.fulfilled, (state, action) => {
//         state.loading = false;
//         state.currentUser = normalizeUser(action.payload.user);
//         state.success = true;
//         state.error = null;
//         state.isAuthenticated = true;
//         // Persist user and token
//         try {
//           if (action.payload.user) localStorage.setItem('authUser', JSON.stringify(state.currentUser));
//           if (action.payload.token) localStorage.setItem('authToken', action.payload.token);
//         } catch (e) {}

//         console.log('✅ Login completed successfully');
//       })
//       .addCase(loginUser.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//         state.success = false;
//         state.currentUser = null;
//         state.isAuthenticated = false;
//         console.log('❌ Login failed:', action.payload);
//       })
//       // Fetch Posts
//       .addCase(fetchPosts.pending, (state) => {
//         state.postsLoading = true;
//         state.postsError = null;
//       })
//       .addCase(fetchPosts.fulfilled, (state, action) => {
//         state.postsLoading = false;
//         // Normalize posts: ensure post.user has profilePhotoUrl
//         const posts = Array.isArray(action.payload) ? action.payload : [];
//         state.posts = posts.map((p) => {
//           const post = { ...p };
//           if (post.user) post.user = normalizeUser(post.user);
//           return post;
//         });
//       })
//       .addCase(fetchPosts.rejected, (state, action) => {
//         state.postsLoading = false;
//         state.postsError = action.payload;
//       })
//       // Add Post
//       .addCase(addPost.fulfilled, (state, action) => {
//         // You might want to refetch posts or optimistically update
//         state.success = true;
//       })
//       // Like Post
//       .addCase(likePost.fulfilled, (state, action) => {
//         // Update posts state if needed
//         state.success = true;
//       })
//       // Add Comment
//       .addCase(addComment.fulfilled, (state, action) => {
//         // Update posts state if needed
//         state.success = true;
//       });
//   },
// });

// export const { clearError, clearSuccess, resetAuthState, logout } = authSlice.actions;
// export default authSlice.reducer;



// !!!!!!!!!!!!!

// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// import axios from 'axios';

// // API Base URL - Update this to match your backend
// const API_BASE_URL = 'https://robo-1-qqhu.onrender.com/api';

// // Create axios instance
// const api = axios.create({
//   baseURL: API_BASE_URL,
//   timeout: 60000, // Increased to 60 seconds for Render (cold starts can be slow)
//   headers: {
//     'Accept': 'application/json',
//   }
// });

// // Helper function to create full profile photo URL
// const makeProfilePhotoUrl = (photoPath) => {
//   if (!photoPath) return null;
//   if (typeof photoPath !== 'string') return null;
//   if (photoPath.startsWith('http') || photoPath.startsWith('data:')) return photoPath;
//   return `${API_BASE_URL}${photoPath.startsWith('/') ? '' : '/'}${photoPath}`;
// };

// // Helper function to normalize user object
// const normalizeUser = (user) => {
//   if (!user || typeof user !== 'object') return user;
//   const copy = { ...user };
//   copy.profilePhotoUrl = makeProfilePhotoUrl(copy.profilePhoto) || copy.profilePhotoUrl || null;
//   return copy;
// };

// // Register user async thunk
// export const registerUser = createAsyncThunk(
//   'auth/register',
//   async (userData, { rejectWithValue }) => {
//     try {
//       console.log('🔄 Sending registration request...');
//       console.log('📍 API URL:', `${API_BASE_URL}/users/register`);
      
//       const formData = new FormData();
//       formData.append('username', userData.username);
//       formData.append('email', userData.email);
//       formData.append('password', userData.password);
      
//       if (userData.profilePhoto instanceof File) {
//         formData.append('profilePhoto', userData.profilePhoto);
//         console.log('📁 Including profile photo:', userData.profilePhoto.name, userData.profilePhoto.size, 'bytes');
//       }

//       console.log('📤 Sending FormData with:', {
//         username: userData.username,
//         email: userData.email,
//         hasPhoto: !!userData.profilePhoto
//       });

//       const response = await api.post('/users/register', formData, {
//         headers: {
//           'Content-Type': 'multipart/form-data',
//         },
//         // Add progress tracking for large files
//         onUploadProgress: (progressEvent) => {
//           const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
//           console.log(`📊 Upload progress: ${percentCompleted}%`);
//         }
//       });

//       console.log('✅ Registration successful:', response.data);

//       const data = response.data;
//       const user = normalizeUser(data.user || data);
//       const token = data.token || null;

//       return { user, token };

//     } catch (error) {
//       console.error('❌ Registration error:', error);
//       console.error('Error details:', {
//         message: error.message,
//         code: error.code,
//         response: error.response?.data,
//         status: error.response?.status,
//         url: error.config?.url
//       });
      
//       let errorMessage = 'Registration failed - please try again';
      
//       if (error.code === 'ECONNABORTED') {
//         errorMessage = 'Request timeout. The server took too long to respond. Please check your connection and try again.';
//       } else if (error.code === 'ERR_NETWORK') {
//         errorMessage = 'Cannot connect to server. Please check if backend is running at ' + API_BASE_URL;
//       } else if (error.response) {
//         errorMessage = error.response.data?.error 
//           || error.response.data?.message
//           || `Server error (${error.response.status})`;
//       } else {
//         errorMessage = error.message || 'Registration failed - please try again';
//       }

//       return rejectWithValue(errorMessage);
//     }
//   }
// );

// // Login user async thunk
// export const loginUser = createAsyncThunk(
//   'auth/login',
//   async (loginData, { rejectWithValue }) => {
//     try {
//       console.log('🔄 Attempting login for:', loginData.email);
      
//       const response = await api.post('/users/login', {
//         email: loginData.email,
//         password: loginData.password
//       }, {
//         headers: {
//           'Content-Type': 'application/json',
//         }
//       });

//       console.log('✅ Login successful');

//       const data = response.data;
//       const user = normalizeUser(data.user || data);
//       const token = data.token || null;

//       return { user, token };

//     } catch (error) {
//       console.error('❌ Login error:', error);
      
//       let errorMessage = 'Login failed';
      
//       if (error.code === 'ERR_NETWORK') {
//         errorMessage = 'Cannot connect to server. Please check if the backend is running.';
//       } else if (error.response?.status === 401) {
//         errorMessage = 'Invalid email or password. Please try again.';
//       } else if (error.response?.status === 404) {
//         errorMessage = 'User not found. Please check your credentials.';
//       } else if (error.response?.status === 500) {
//         errorMessage = 'Server error. Please try again later.';
//       } else {
//         errorMessage = error.response?.data?.error 
//           || error.response?.data?.message
//           || error.message
//           || 'Login failed - please try again';
//       }

//       return rejectWithValue(errorMessage);
//     }
//   }
// );

// // Initialize from localStorage
// let initialUser = null;
// let initialToken = null;

// try {
//   const storedUser = localStorage.getItem('authUser');
//   const storedToken = localStorage.getItem('authToken');
  
//   if (storedUser) initialUser = normalizeUser(JSON.parse(storedUser));
//   if (storedToken) initialToken = storedToken;
// } catch (e) {
//   console.error('Error loading from localStorage:', e);
//   initialUser = null;
//   initialToken = null;
// }

// const authSlice = createSlice({
//   name: 'auth',
//   initialState: {
//     currentUser: initialUser,
//     token: initialToken,
//     loading: false,
//     error: null,
//     success: false,
//     isAuthenticated: !!initialToken,
//   },
//   reducers: {
//     clearError: (state) => {
//       state.error = null;
//     },
//     clearSuccess: (state) => {
//       state.success = false;
//     },
//     logout: (state) => {
//       state.currentUser = null;
//       state.token = null;
//       state.isAuthenticated = false;
//       state.success = false;
//       state.error = null;
//       localStorage.removeItem('authToken');
//       localStorage.removeItem('authUser');
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       // Register User
//       .addCase(registerUser.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//         state.success = false;
//       })
//       .addCase(registerUser.fulfilled, (state, action) => {
//         state.loading = false;
//         state.currentUser = action.payload.user;
//         state.token = action.payload.token;
//         state.success = true;
//         state.error = null;
//         state.isAuthenticated = true;
        
//         // Persist to localStorage
//         try {
//           if (action.payload.user) {
//             localStorage.setItem('authUser', JSON.stringify(action.payload.user));
//           }
//           if (action.payload.token) {
//             localStorage.setItem('authToken', action.payload.token);
//           }
//         } catch (e) {
//           console.error('Error saving to localStorage:', e);
//         }
//       })
//       .addCase(registerUser.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//         state.success = false;
//         state.currentUser = null;
//         state.token = null;
//         state.isAuthenticated = false;
//       })
//       // Login User
//       .addCase(loginUser.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//         state.success = false;
//       })
//       .addCase(loginUser.fulfilled, (state, action) => {
//         state.loading = false;
//         state.currentUser = action.payload.user;
//         state.token = action.payload.token;
//         state.success = true;
//         state.error = null;
//         state.isAuthenticated = true;
        
//         // Persist to localStorage
//         try {
//           if (action.payload.user) {
//             localStorage.setItem('authUser', JSON.stringify(action.payload.user));
//           }
//           if (action.payload.token) {
//             localStorage.setItem('authToken', action.payload.token);
//           }
//         } catch (e) {
//           console.error('Error saving to localStorage:', e);
//         }
//       })
//       .addCase(loginUser.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//         state.success = false;
//         state.currentUser = null;
//         state.token = null;
//         state.isAuthenticated = false;
//       });
//   },
// });

// export const { clearError, clearSuccess, logout } = authSlice.actions;
// export default authSlice.reducer;


// !!!!!

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// API Base URL - Update this to match your backend
const API_BASE_URL = 'https://robo-1-qqhu.onrender.com/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Accept': 'application/json',
  }
});

// Helper function to create full profile photo URL
const makeProfilePhotoUrl = (photoPath) => {
  if (!photoPath) return null;
  if (typeof photoPath !== 'string') return null;
  if (photoPath.startsWith('http') || photoPath.startsWith('data:')) return photoPath;
  return `${API_BASE_URL}${photoPath.startsWith('/') ? '' : '/'}${photoPath}`;
};

// Helper function to normalize user object
const normalizeUser = (user) => {
  if (!user || typeof user !== 'object') return user;
  const copy = { ...user };
  copy.profilePhotoUrl = makeProfilePhotoUrl(copy.profilePhoto) || copy.profilePhotoUrl || null;
  return copy;
};

// Register user async thunk - FIXED FOR BASE64
export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      console.log('🔄 Sending registration request...');
      console.log('📍 API URL:', `${API_BASE_URL}/users/register`);
      console.log('📸 Profile photo type:', typeof userData.profilePhoto);
      
      // Send as JSON instead of FormData to handle Base64 string
      const payload = {
        username: userData.username,
        email: userData.email,
        password: userData.password,
      };

      // Only include profilePhoto if it exists and is a Base64 string
      if (userData.profilePhoto && typeof userData.profilePhoto === 'string') {
        payload.profilePhoto = userData.profilePhoto;
        console.log('📸 Including Base64 profile photo (length):', userData.profilePhoto.length);
      }

      console.log('📤 Sending JSON payload with:', {
        username: userData.username,
        email: userData.email,
        hasPhoto: !!userData.profilePhoto,
        photoType: typeof userData.profilePhoto
      });

      const response = await api.post('/users/register', payload, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log('✅ Registration successful:', response.data);

      const data = response.data;
      const user = normalizeUser(data.user || data);
      const token = data.token || null;

      return { user, token };

    } catch (error) {
      console.error('❌ Registration error:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      
      let errorMessage = 'Registration failed - please try again';
      
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout. The server took too long to respond. Please check your connection and try again.';
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Cannot connect to server. Please check if backend is running at ' + API_BASE_URL;
      } else if (error.response) {
        errorMessage = error.response.data?.error 
          || error.response.data?.message
          || `Server error (${error.response.status})`;
      } else {
        errorMessage = error.message || 'Registration failed - please try again';
      }

      return rejectWithValue(errorMessage);
    }
  }
);

// Login user async thunk (keep as is)
export const loginUser = createAsyncThunk(
  'auth/login',
  async (loginData, { rejectWithValue }) => {
    try {
      console.log('🔄 Attempting login for:', loginData.email);
      
      const response = await api.post('/users/login', {
        email: loginData.email,
        password: loginData.password
      }, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log('✅ Login successful');

      const data = response.data;
      const user = normalizeUser(data.user || data);
      const token = data.token || null;

      return { user, token };

    } catch (error) {
      console.error('❌ Login error:', error);
      
      let errorMessage = 'Login failed';
      
      if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Cannot connect to server. Please check if the backend is running.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Invalid email or password. Please try again.';
      } else if (error.response?.status === 404) {
        errorMessage = 'User not found. Please check your credentials.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
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

// Initialize from localStorage (keep as is)
let initialUser = null;
let initialToken = null;

try {
  const storedUser = localStorage.getItem('authUser');
  const storedToken = localStorage.getItem('authToken');
  
  if (storedUser) initialUser = normalizeUser(JSON.parse(storedUser));
  if (storedToken) initialToken = storedToken;
} catch (e) {
  console.error('Error loading from localStorage:', e);
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
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = false;
    },
    logout: (state) => {
      state.currentUser = null;
      state.token = null;
      state.isAuthenticated = false;
      state.success = false;
      state.error = null;
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
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
        state.currentUser = action.payload.user;
        state.token = action.payload.token;
        state.success = true;
        state.error = null;
        state.isAuthenticated = true;
        
        // Persist to localStorage
        try {
          if (action.payload.user) {
            localStorage.setItem('authUser', JSON.stringify(action.payload.user));
          }
          if (action.payload.token) {
            localStorage.setItem('authToken', action.payload.token);
          }
        } catch (e) {
          console.error('Error saving to localStorage:', e);
        }
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
        state.currentUser = null;
        state.token = null;
        state.isAuthenticated = false;
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
        
        // Persist to localStorage
        try {
          if (action.payload.user) {
            localStorage.setItem('authUser', JSON.stringify(action.payload.user));
          }
          if (action.payload.token) {
            localStorage.setItem('authToken', action.payload.token);
          }
        } catch (e) {
          console.error('Error saving to localStorage:', e);
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
        state.currentUser = null;
        state.token = null;
        state.isAuthenticated = false;
      });
  },
});

export const { clearError, clearSuccess, logout } = authSlice.actions;
export default authSlice.reducer;