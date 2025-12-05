// // store.js
// import { configureStore } from '@reduxjs/toolkit';
// import authReducer from './Slice';
// import articlesReducer from './ArticlesSlice'; // Make sure this name matches
// import searchReducer from './SearchSlice';
// import likeReducer from './LikeSlice';
// import commentReducer from './CommentSlice';
// import notificationReducer from './NotificationSlice';
// import followReducer from './FollowSendSlice';
// import usersReducer from './usersSlice';

// const store = configureStore({
//   reducer: {
//     comments: commentReducer,
//     likes: likeReducer,
//     notifications: notificationReducer,
//     follow: followReducer,
//     users: usersReducer,
//     auth: authReducer,
//     articles: articlesReducer, // This should be 'articles' not 'posts'
//     search: searchReducer,
//   },
// });
// export default store;

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
import usersReducer from './usersSlice'; // NEW: Your users slice

const store = configureStore({
  reducer: {
    auth: authReducer,
    articles: articlesReducer,
    search: searchReducer,
    likes: likeReducer,
    comments: commentReducer,
    notifications: notificationReducer,
    follow: followReducer,
    users: usersReducer, // This is important for the new users slice
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