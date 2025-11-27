import { configureStore } from '@reduxjs/toolkit';
import authReducer from './Slice.jsx';
import postsReducer from './PostsSlice';
import searchReducer from './SearchSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    posts: postsReducer,
    search: searchReducer,
  },
});

export default store;