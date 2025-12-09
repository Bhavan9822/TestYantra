

// !!!!!!!!!!!!!!!!!

// store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './Slice'; // This should be './features/auth/authSlice' or similar
import articlesReducer from './ArticlesSlice';
import searchReducer from './SearchSlice';
import likeReducer from './LikeSlice';
import commentReducer from './CommentSlice';
import notificationReducer from './NotificationSlice';
import followReducer from './FollowSendSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    articles: articlesReducer,
    search: searchReducer,
    likes: likeReducer,
    comments: commentReducer,
    notifications: notificationReducer,
    follow: followReducer,
  },
  
  // Optional middleware configuration
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['socket/connect'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['meta.arg', 'payload.timestamp'],
        // Ignore these paths in the state
        ignoredPaths: ['socket'],
      },
    }),
});

export default store;
export { store };