// store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './Slice';
import articlesReducer from './ArticlesSlice'; // Make sure this name matches
import searchReducer from './SearchSlice';
import likeReducer from './LikeSlice';

const store = configureStore({
  reducer: {
    likes: likeReducer,
    auth: authReducer,
    articles: articlesReducer, // This should be 'articles' not 'posts'
    search: searchReducer,
  },
});
export default store;