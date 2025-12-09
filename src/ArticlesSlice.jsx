// // ArticlesSlice.jsx
// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// import axios from 'axios';

// const API_BASE_URL = 'https://robo-1-qqhu.onrender.com/api';

// // Fetch articles
// export const fetchPosts = createAsyncThunk(
//   'articles/fetchPosts',
//   async (_, { rejectWithValue }) => {
//     try {
//       const token = localStorage.getItem('authToken');
//       console.log('ArticlesSlice: fetching posts - authToken present?', !!token, token ? `length=${token.length}` : 'no-token');
//       const response = await axios.get(`${API_BASE_URL}/articles`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       console.log('ArticlesSlice: fetchPosts response data', response.data);
//       return response.data;
//     } catch (error) {
//       console.error('ArticlesSlice: fetchPosts error', error?.response?.status, error?.response?.data || error.message);
//       const status = error?.response?.status;
//       const serverMsg = error.response?.data?.message || error.response?.data?.error;
//       if (status === 401) {
//         try {
//           localStorage.removeItem('authToken');
//           localStorage.removeItem('authUser');
//           console.warn('ArticlesSlice: auth token invalid - cleared localStorage and redirecting to /login');
//           window.location.href = '/login';
//         } catch (e) {
//           console.warn('ArticlesSlice: error during 401 handling', e);
//         }
//         return rejectWithValue(serverMsg || 'Invalid or expired token');
//       }
//       return rejectWithValue(serverMsg || error.message || 'Failed to fetch posts');
//     }
//   }
// );

// // Create article
// export const createPost = createAsyncThunk(
//   'articles/createPost',
//   async (postData, { rejectWithValue }) => {
//     try {
//       const token = localStorage.getItem('authToken');
//       console.log('ArticlesSlice: creating post - authToken present?', !!token, token ? `length=${token.length}` : 'no-token');
//       const response = await axios.post(`${API_BASE_URL}/articles`, postData, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//       });
//       console.log('ArticlesSlice: createPost response data', response.data);
//       return response.data;
//     } catch (error) {
//       console.error('ArticlesSlice: createPost error', error?.response?.status, error?.response?.data || error.message);
//       const status = error?.response?.status;
//       const serverMsg = error.response?.data?.message || error.response?.data?.error;
//       if (status === 401) {
//         try {
//           localStorage.removeItem('authToken');
//           localStorage.removeItem('authUser');
//           console.warn('ArticlesSlice: auth token invalid - cleared localStorage and redirecting to /login');
//           window.location.href = '/login';
//         } catch (e) {
//           console.warn('ArticlesSlice: error during 401 handling', e);
//         }
//         return rejectWithValue(serverMsg || 'Invalid or expired token');
//       }
//       return rejectWithValue(serverMsg || error.message || 'Failed to create post');
//     }
//   }
// );

// // Fetch single article by id
// export const fetchPostById = createAsyncThunk(
//   'articles/fetchPostById',
//   async (postId, { rejectWithValue }) => {
//     try {
//       const token = localStorage.getItem('authToken');
//       console.log('ArticlesSlice: fetching single post - authToken present?', !!token, token ? `length=${token.length}` : 'no-token');
//       const response = await axios.get(`${API_BASE_URL}/articles/${postId}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       console.log('ArticlesSlice: fetchPostById response data', response.data);
//       return response.data;
//     } catch (error) {
//       console.error('ArticlesSlice: fetchPostById error', error?.response?.status, error?.response?.data || error.message);
//       console.error('ArticlesSlice: fetchPostById request URL', error?.config?.url || 'unknown url');
//       const status = error?.response?.status;
//       const serverMsg = error.response?.data?.message || error.response?.data?.error;
//       if (status === 401) {
//         try {
//           localStorage.removeItem('authToken');
//           localStorage.removeItem('authUser');
//           console.warn('ArticlesSlice: auth token invalid (fetchPostById) - cleared localStorage and redirecting to /login');
//           window.location.href = '/login';
//         } catch (e) {
//           console.warn('ArticlesSlice: error during 401 handling', e);
//         }
//         return rejectWithValue(serverMsg || 'Invalid or expired token');
//       }
//       return rejectWithValue(serverMsg || error.message || 'Failed to fetch post');
//     }
//   }
// );

// const articlesSlice = createSlice({
//   name: 'articles',
//   initialState: {
//     posts: [],
//     currentPost: null,
//     loading: false,
//     error: null,
//     createPostLoading: false,
//     createPostError: null,
//   },
//   reducers: {
//     clearPostsError: (state) => {
//       state.error = null;
//       state.createPostError = null;
//     },
//     addPost: (state, action) => {
//       state.posts.unshift(action.payload);
//     },
//     clearCurrentPost: (state) => {
//       state.currentPost = null;
//     }
//   },
//   extraReducers: (builder) => {
//     builder
//       // Fetch posts
//       .addCase(fetchPosts.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(fetchPosts.fulfilled, (state, action) => {
//         state.loading = false;
//         // Handle different response structures
//         state.posts = action.payload.posts || action.payload.articles || action.payload || [];
//         console.log('ArticlesSlice: posts set to', state.posts);
//       })
//       .addCase(fetchPosts.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       })
//       // Create post
//       .addCase(createPost.pending, (state) => {
//         state.createPostLoading = true;
//         state.createPostError = null;
//       })
//       .addCase(createPost.fulfilled, (state, action) => {
//         state.createPostLoading = false;
//         const newPost = action.payload.post || action.payload.article || action.payload;
//         if (newPost) {
//           state.posts.unshift(newPost);
//         }
//       })
//       .addCase(createPost.rejected, (state, action) => {
//         state.createPostLoading = false;
//         state.createPostError = action.payload;
//       })
//       // Fetch single post by ID
//       .addCase(fetchPostById.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(fetchPostById.fulfilled, (state, action) => {
//         state.loading = false;
//         const post = action.payload.post || action.payload.article || action.payload;
//         state.currentPost = post || null;
//       })
//       .addCase(fetchPostById.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       });
//   },
// });

// export const { clearPostsError, addPost, clearCurrentPost } = articlesSlice.actions;
// export default articlesSlice.reducer;



// !!!!!

// ArticlesSlice.jsx
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = 'https://robo-zv8u.onrender.com/api';

// Enhanced debug logging
const log = (type, message, data = {}) => {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const styles = {
    success: 'color: #10B981; font-weight: bold;',
    error: 'color: #EF4444; font-weight: bold;',
    info: 'color: #3B82F6; font-weight: bold;',
    warning: 'color: #F59E0B; font-weight: bold;',
  };
  console.log(`%c[${timestamp}] ArticlesSlice ${type}:`, styles[type], message, data);
};

// ==================== ASYNC THUNKS ====================

// Fetch all articles
export const fetchPosts = createAsyncThunk(
  'articles/fetchPosts',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      log('info', 'Fetching articles', { tokenExists: !!token });

      const response = await axios.get(`${API_BASE_URL}/articles`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      log('success', 'Articles fetched successfully', {
        count: response.data?.length || response.data?.articles?.length || 0
      });
      
      // Handle different response structures
      return response.data?.articles || response.data || [];
    } catch (error) {
      log('error', 'Failed to fetch articles', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
      });

      const status = error?.response?.status;
      let serverMsg = error.response?.data?.message || 
                     error.response?.data?.error || 
                     error.message || 
                     'Failed to fetch posts';

      if (status === 401) {
        log('warning', 'Authentication failed, clearing tokens');
        try {
          localStorage.removeItem('authToken');
          localStorage.removeItem('authUser');
        } catch (e) {
          log('error', 'Error clearing localStorage', e);
        }
        return rejectWithValue('Session expired. Please login again.');
      }

      return rejectWithValue(serverMsg);
    }
  }
);

// Create article
export const createPost = createAsyncThunk(
  'articles/createPost',
  async (postData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        log('error', 'No authentication token found');
        return rejectWithValue('Authentication required');
      }

      log('info', 'Creating article', { 
        titleLength: postData.title?.length,
        contentLength: postData.content?.length 
      });

      const response = await axios.post(`${API_BASE_URL}/articles`, postData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      log('success', 'Article created successfully', {
        id: response.data?._id || response.data?.id,
        title: response.data?.title
      });

      return response.data;
    } catch (error) {
      log('error', 'Failed to create article', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
      });

      const status = error?.response?.status;
      let serverMsg = error.response?.data?.message || 
                     error.response?.data?.error || 
                     error.message || 
                     'Failed to create post';

      if (status === 401) {
        log('warning', 'Authentication failed, clearing tokens');
        try {
          localStorage.removeItem('authToken');
          localStorage.removeItem('authUser');
        } catch (e) {
          log('error', 'Error clearing localStorage', e);
        }
        return rejectWithValue('Session expired. Please login again.');
      }

      return rejectWithValue(serverMsg);
    }
  }
);

// Fetch single article by ID
export const fetchArticleById = createAsyncThunk(
  'articles/fetchArticleById',
  async (articleId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        log('error', 'No authentication token found');
        return rejectWithValue('Authentication required');
      }

      log('info', 'Fetching article by ID', { articleId });

      const response = await axios.get(`${API_BASE_URL}/articles/${articleId}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      log('success', 'Article fetched successfully', {
        id: response.data?._id || response.data?.id,
        title: response.data?.title
      });

      return response.data;
    } catch (error) {
      log('error', 'Failed to fetch article', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        articleId
      });

      const status = error?.response?.status;
      let serverMsg = error.response?.data?.message || 
                     error.response?.data?.error || 
                     error.message || 
                     'Failed to fetch article';

      if (status === 401) {
        log('warning', 'Authentication failed, clearing tokens');
        try {
          localStorage.removeItem('authToken');
          localStorage.removeItem('authUser');
        } catch (e) {
          log('error', 'Error clearing localStorage', e);
        }
        return rejectWithValue('Session expired. Please login again.');
      }

      if (status === 404) {
        return rejectWithValue('Article not found');
      }

      return rejectWithValue(serverMsg);
    }
  }
);

// Add comment to article
export const createComment = createAsyncThunk(
  'articles/createComment',
  async ({ articleId, content }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        log('error', 'No authentication token found');
        return rejectWithValue('Authentication required');
      }

      if (!content?.trim()) {
        log('error', 'Comment content is empty');
        return rejectWithValue('Comment cannot be empty');
      }

      log('info', 'Creating comment', { articleId, contentLength: content.length });

      const response = await axios.post(
        `${API_BASE_URL}/articles/${articleId}/comments`,
        { content: content.trim() },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      log('success', 'Comment created successfully', {
        commentId: response.data?._id || response.data?.id,
        articleId
      });

      return { ...response.data, articleId };
    } catch (error) {
      log('error', 'Failed to create comment', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        articleId
      });

      const status = error?.response?.status;
      let serverMsg = error.response?.data?.message || 
                     error.response?.data?.error || 
                     error.message || 
                     'Failed to post comment';

      if (status === 401) {
        log('warning', 'Authentication failed, clearing tokens');
        try {
          localStorage.removeItem('authToken');
          localStorage.removeItem('authUser');
        } catch (e) {
          log('error', 'Error clearing localStorage', e);
        }
        return rejectWithValue('Session expired. Please login again.');
      }

      return rejectWithValue(serverMsg);
    }
  }
);

// Delete article
export const deletePost = createAsyncThunk(
  'articles/deletePost',
  async (articleId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        log('error', 'No authentication token found');
        return rejectWithValue('Authentication required');
      }

      log('info', 'Deleting article', { articleId });

      const response = await axios.delete(`${API_BASE_URL}/articles/${articleId}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      log('success', 'Article deleted successfully', { articleId });
      
      return { articleId, message: response.data?.message || 'Article deleted' };
    } catch (error) {
      log('error', 'Failed to delete article', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        articleId
      });

      const status = error?.response?.status;
      let serverMsg = error.response?.data?.message || 
                     error.response?.data?.error || 
                     error.message || 
                     'Failed to delete post';

      if (status === 401) {
        log('warning', 'Authentication failed, clearing tokens');
        try {
          localStorage.removeItem('authToken');
          localStorage.removeItem('authUser');
        } catch (e) {
          log('error', 'Error clearing localStorage', e);
        }
        return rejectWithValue('Session expired. Please login again.');
      }

      if (status === 403) {
        return rejectWithValue('You are not authorized to delete this article');
      }

      return rejectWithValue(serverMsg);
    }
  }
);

// Update article
export const updatePost = createAsyncThunk(
  'articles/updatePost',
  async ({ articleId, postData }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        log('error', 'No authentication token found');
        return rejectWithValue('Authentication required');
      }

      log('info', 'Updating article', { 
        articleId,
        titleLength: postData.title?.length,
        contentLength: postData.content?.length 
      });

      const response = await axios.put(
        `${API_BASE_URL}/articles/${articleId}`,
        postData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      log('success', 'Article updated successfully', {
        articleId,
        title: response.data?.title
      });

      return response.data;
    } catch (error) {
      log('error', 'Failed to update article', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        articleId
      });

      const status = error?.response?.status;
      let serverMsg = error.response?.data?.message || 
                     error.response?.data?.error || 
                     error.message || 
                     'Failed to update post';

      if (status === 401) {
        log('warning', 'Authentication failed, clearing tokens');
        try {
          localStorage.removeItem('authToken');
          localStorage.removeItem('authUser');
        } catch (e) {
          log('error', 'Error clearing localStorage', e);
        }
        return rejectWithValue('Session expired. Please login again.');
      }

      if (status === 403) {
        return rejectWithValue('You are not authorized to update this article');
      }

      return rejectWithValue(serverMsg);
    }
  }
);

// Alias for backward compatibility
export const fetchPostById = fetchArticleById;

// ==================== SLICE DEFINITION ====================

// Normalize article shape so each article has a consistent author object
// with `userProfilePhoto` populated when available from multiple server shapes.
const normalizeArticle = (raw) => {
  if (!raw || typeof raw !== 'object') return raw;
  const article = Array.isArray(raw) ? raw : { ...raw };

  // Determine user object from common fields
  const user = article.user || article.author || article.postedBy || null;

  const candidate = (u) => {
    if (!u || typeof u !== 'object') return null;
    return (
      u.userProfilePhoto || u.userProfilePhotoUrl ||
      u.profilePhoto || u.profilePhotoUrl ||
      u.photo || u.photoURL ||
      u.picture || u.avatar || u.image || null
    );
  };

  const userPhoto = candidate(user) || article.userProfilePhoto || article.profilePhoto || article.profilePhotoUrl || null;

  // Build a normalizedUser object
  const normalizedUser = user && typeof user === 'object' ? { ...user } : {};
  if (userPhoto) normalizedUser.userProfilePhoto = normalizedUser.userProfilePhoto || userPhoto;

  // Attach normalized user back to article under `user`
  const normalized = { ...article, user: normalizedUser };
  return normalized;
};

const articlesSlice = createSlice({
  name: 'articles',
  initialState: {
    posts: [],
    currentArticle: null,
    loading: false,
    error: null,
    createPostLoading: false,
    createPostError: null,
    articleLoading: false,
    articleError: null,
    commentLoading: false,
    commentError: null,
    deleteLoading: false,
    deleteError: null,
    updateLoading: false,
    updateError: null,
    lastFetched: null,
  },
  reducers: {
    clearArticlesError: (state) => {
      state.error = null;
      state.createPostError = null;
      state.articleError = null;
      state.commentError = null;
      state.deleteError = null;
      state.updateError = null;
    },
    addPost: (state, action) => {
      state.posts.unshift(action.payload);
    },
    clearCurrentArticle: (state) => {
      state.currentArticle = null;
    },
    updatePostOptimistically: (state, action) => {
      const { articleId, postData } = action.payload;
      const index = state.posts.findIndex(p => (p._id || p.id) === articleId);
      if (index !== -1) {
        state.posts[index] = { ...state.posts[index], ...postData };
      }
      if (state.currentArticle && (state.currentArticle._id === articleId || state.currentArticle.id === articleId)) {
        state.currentArticle = { ...state.currentArticle, ...postData };
      }
    },
    addCommentOptimistically: (state, action) => {
      const { articleId, comment } = action.payload;
      if (state.currentArticle && (state.currentArticle._id === articleId || state.currentArticle.id === articleId)) {
        if (!state.currentArticle.comments) {
          state.currentArticle.comments = [];
        }
        state.currentArticle.comments.push(comment);
      }
      // Also update in posts list if the article is there
      const postIndex = state.posts.findIndex(p => (p._id || p.id) === articleId);
      if (postIndex !== -1) {
        if (!state.posts[postIndex].comments) {
          state.posts[postIndex].comments = [];
        }
        state.posts[postIndex].comments.push(comment);
      }
    },
    removePost: (state, action) => {
      const articleId = action.payload;
      state.posts = state.posts.filter(p => (p._id || p.id) !== articleId);
      if (state.currentArticle && (state.currentArticle._id === articleId || state.currentArticle.id === articleId)) {
        state.currentArticle = null;
      }
    },
    // Reset entire state (useful for logout)
    resetArticles: (state) => {
      state.posts = [];
      state.currentArticle = null;
      state.loading = false;
      state.error = null;
      state.createPostLoading = false;
      state.createPostError = null;
      state.articleLoading = false;
      state.articleError = null;
      state.commentLoading = false;
      state.commentError = null;
      state.deleteLoading = false;
      state.deleteError = null;
      state.updateLoading = false;
      state.updateError = null;
      state.lastFetched = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch all posts
      .addCase(fetchPosts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.loading = false;
        const raw = Array.isArray(action.payload) ? action.payload : [];
        // Normalize each article so author photo is available
        state.posts = raw.map((r) => normalizeArticle(r));
        state.lastFetched = Date.now();
        log('info', 'Posts updated in state (normalized)', { count: state.posts.length });

        // Debug: log first few normalized posts and their user.photo fields
        try {
          const samples = state.posts.slice(0, 5).map(p => ({
            id: p._id || p.id,
            userPreview: p.user ? {
              username: p.user.username || p.user.name || null,
              userProfilePhoto: p.user.userProfilePhoto || p.user.profilePhoto || p.user.photo || null,
              rawUser: p.user
            } : null
          }));
          console.log('ArticlesSlice: normalized post samples', samples);
        } catch (e) {
          console.warn('ArticlesSlice: failed to log post samples', e);
        }
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create post
      .addCase(createPost.pending, (state) => {
        state.createPostLoading = true;
        state.createPostError = null;
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.createPostLoading = false;
        const newPost = action.payload;
        if (newPost) {
          state.posts.unshift(normalizeArticle(newPost));
        }
      })
      .addCase(createPost.rejected, (state, action) => {
        state.createPostLoading = false;
        state.createPostError = action.payload;
      })
      
      // Fetch article by ID
      .addCase(fetchArticleById.pending, (state) => {
        state.articleLoading = true;
        state.articleError = null;
      })
      .addCase(fetchArticleById.fulfilled, (state, action) => {
        state.articleLoading = false;
        state.currentArticle = action.payload ? normalizeArticle(action.payload) : null;
      })
      .addCase(fetchArticleById.rejected, (state, action) => {
        state.articleLoading = false;
        state.articleError = action.payload;
      })
      
      // Create comment
      .addCase(createComment.pending, (state) => {
        state.commentLoading = true;
        state.commentError = null;
      })
      .addCase(createComment.fulfilled, (state, action) => {
        state.commentLoading = false;
        const { articleId, ...commentData } = action.payload;
        
        // Update current article if it's the one being commented on
        if (state.currentArticle && (state.currentArticle._id === articleId || state.currentArticle.id === articleId)) {
          if (!state.currentArticle.comments) {
            state.currentArticle.comments = [];
          }
          state.currentArticle.comments.push(commentData);
        }
        
        // Also update in posts list
        const postIndex = state.posts.findIndex(p => (p._id || p.id) === articleId);
        if (postIndex !== -1) {
          if (!state.posts[postIndex].comments) {
            state.posts[postIndex].comments = [];
          }
          state.posts[postIndex].comments.push(commentData);
        }
      })
      .addCase(createComment.rejected, (state, action) => {
        state.commentLoading = false;
        state.commentError = action.payload;
      })
      
      // Delete post
      .addCase(deletePost.pending, (state) => {
        state.deleteLoading = true;
        state.deleteError = null;
      })
      .addCase(deletePost.fulfilled, (state, action) => {
        state.deleteLoading = false;
        const { articleId } = action.payload;
        state.posts = state.posts.filter(p => (p._id || p.id) !== articleId);
        if (state.currentArticle && (state.currentArticle._id === articleId || state.currentArticle.id === articleId)) {
          state.currentArticle = null;
        }
      })
      .addCase(deletePost.rejected, (state, action) => {
        state.deleteLoading = false;
        state.deleteError = action.payload;
      })
      
      // Update post
      .addCase(updatePost.pending, (state) => {
        state.updateLoading = true;
        state.updateError = null;
      })
      .addCase(updatePost.fulfilled, (state, action) => {
        state.updateLoading = false;
        const updatedArticle = action.payload;
        const articleId = updatedArticle._id || updatedArticle.id;
        
        // Update in posts list
        const postIndex = state.posts.findIndex(p => (p._id || p.id) === articleId);
        if (postIndex !== -1) {
          state.posts[postIndex] = { ...state.posts[postIndex], ...updatedArticle };
        }
        
        // Update current article if it's the one being updated
        if (state.currentArticle && (state.currentArticle._id === articleId || state.currentArticle.id === articleId)) {
          state.currentArticle = { ...state.currentArticle, ...updatedArticle };
        }
      })
      .addCase(updatePost.rejected, (state, action) => {
        state.updateLoading = false;
        state.updateError = action.payload;
      });
  },
});

// ==================== ACTION EXPORTS ====================
export const { 
  clearArticlesError, 
  addPost, 
  clearCurrentArticle,
  updatePostOptimistically,
  addCommentOptimistically,
  removePost,
  resetArticles
} = articlesSlice.actions;

// ==================== SELECTORS ====================
export const selectAllPosts = (state) => state.articles.posts || [];
export const selectCurrentArticle = (state) => state.articles.currentArticle;
export const selectPostsLoading = (state) => state.articles.loading;
export const selectPostsError = (state) => state.articles.error;
export const selectCreatePostLoading = (state) => state.articles.createPostLoading;
export const selectCreatePostError = (state) => state.articles.createPostError;
export const selectArticleLoading = (state) => state.articles.articleLoading;
export const selectArticleError = (state) => state.articles.articleError;
export const selectCommentLoading = (state) => state.articles.commentLoading;
export const selectCommentError = (state) => state.articles.commentError;
export const selectDeleteLoading = (state) => state.articles.deleteLoading;
export const selectDeleteError = (state) => state.articles.deleteError;
export const selectUpdateLoading = (state) => state.articles.updateLoading;
export const selectUpdateError = (state) => state.articles.updateError;
export const selectPostById = (state, articleId) => 
  state.articles.posts.find(p => (p._id || p.id) === articleId);
export const selectLastFetched = (state) => state.articles.lastFetched;

// ==================== DEFAULT EXPORT ====================
export default articlesSlice.reducer;