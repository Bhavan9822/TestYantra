
// !!!!!!!!!!!!!!!!!!!!!!!!!!
// src/Store.jsx
import { configureStore } from "@reduxjs/toolkit";

// ================= REDUCERS =================
import authReducer from "./Slice"; // authSlice
import articlesReducer from "./ArticlesSlice";
import searchReducer from "./SearchSlice";
import likeReducer from "./LikeSlice";
import commentReducer from "./CommentSlice";
import notificationReducer from "./NotificationSlice";
import followSendReducer from "./FollowSendSlice";
import followAcceptReducer from "./FollowAcceptSlice";
import followRejectReducer from "./FollowRejectSlice";
import usersReducer from "./usersSlice";

// ================= ASYNC DISPATCH MIDDLEWARE =================
// Allows dispatching actions AFTER reducers finish (used for socket + login sync)
const asyncDispatchMiddleware = (store) => (next) => (action) => {
  let syncFinished = false;
  let actionQueue = [];

  const asyncDispatch = (asyncAction) => {
    actionQueue.push(asyncAction);
    if (syncFinished) {
      actionQueue.forEach(store.dispatch);
      actionQueue = [];
    }
  };

  const actionWithAsyncDispatch = {
    ...action,
    asyncDispatch,
  };

  next(actionWithAsyncDispatch);
  syncFinished = true;

  actionQueue.forEach(store.dispatch);
  actionQueue = [];
};

// ================= STORE =================
const store = configureStore({
  reducer: {
    auth: authReducer,
    articles: articlesReducer,
    search: searchReducer,
    likes: likeReducer,
    comments: commentReducer,

    // 🔔 Notifications (socket + localStorage)
    notifications: notificationReducer,

    // 👥 Follow flows
    followSend: followSendReducer,
    followAccept: followAcceptReducer,
    followReject: followRejectReducer,

    users: usersReducer,
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          "socket/connect",
          "socket/disconnect",
        ],
        ignoredActionPaths: [
          "meta.arg",
          "payload.timestamp",
        ],
        ignoredPaths: [
          "socket",
        ],
      },
    }).concat(asyncDispatchMiddleware),
});

export default store;
