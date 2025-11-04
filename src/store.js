import { configureStore } from '@reduxjs/toolkit';
import exampleReducer from './slice';

export const store = configureStore({
  reducer: {
    example: exampleReducer, // you can add more slices later here
  },
});