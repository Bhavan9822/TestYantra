// store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './Slice';
import articlesReducer from './ArticlesSlice'; // Make sure this name matches
import searchReducer from './SearchSlice';
import likeReducer from './LikeSlice';
import commentReducer from './CommentSlice';
import notificationReducer from './NotificationSlice';
import followReducer from './FollowSendSlice';

const store = configureStore({
  reducer: {
    comments: commentReducer,
    likes: likeReducer,
    notifications: notificationReducer,
    follow: followReducer,
    auth: authReducer,
    articles: articlesReducer, // This should be 'articles' not 'posts'
    search: searchReducer,
  },
});
export default store;