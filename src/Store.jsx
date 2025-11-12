import { configureStore } from '@reduxjs/toolkit';
import userReducer from './Slice.jsx';

export const store = configureStore({
  reducer: {
    user: userReducer,
  },
});

export default store;