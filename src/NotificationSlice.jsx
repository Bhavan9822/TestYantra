
// // src/NotificationSlice.js
// import { createSlice } from "@reduxjs/toolkit";

// const initialState = {
//   notifications: [],
//   unreadCount: 0,
// };

// // 🔧 Helper: persist to localStorage
// const persist = (notifications) => {
//   try {
//     localStorage.setItem("notifications", JSON.stringify(notifications));
//   } catch (e) {
//     console.warn("Notification persistence failed:", e);
//   }
// };

// const notificationSlice = createSlice({
//   name: "notifications",
//   initialState,
//   reducers: {
//     // ================= ADD (SOCKET) =================
//     addNotification: (state, action) => {
//       const payload = action.payload;

//       const notification = {
//         id: payload.id || `${Date.now()}-${Math.random()}`,
//         type: payload.type,
//         fromUserId: payload.fromUserId,
//         fromUsername: payload.fromUsername,
//         profilePhoto: payload.profilePhoto || null,
//         message: payload.message,
//         createdAt: payload.createdAt || new Date().toISOString(),
//         isRead: payload.isRead ?? false,
//       };

//       state.notifications.unshift(notification);

//       if (!notification.isRead) {
//         state.unreadCount += 1;
//       }

//       persist(state.notifications);
//     },

//     // ================= FROM LOGIN (pendingRequests) =================
//     setNotificationsFromPending: (state, action) => {
//       const notifications = action.payload.map((req) => ({
//         id: req._id,
//         type: "FOLLOW_REQUEST",
//         fromUserId: req._id,
//         fromUsername: req.username,
//         profilePhoto: req.profilePhoto || null,
//         message: `${req.username} sent you a follow request`,
//         createdAt: new Date().toISOString(),
//         isRead: false,
//       }));

//       state.notifications = notifications;
//       state.unreadCount = notifications.length;

//       persist(state.notifications);
//     },

//     // ================= MARK ONE READ =================
//     markAsRead: (state, action) => {
//       const n = state.notifications.find(
//         (item) => item.id === action.payload
//       );

//       if (n && !n.isRead) {
//         n.isRead = true;
//         state.unreadCount = Math.max(0, state.unreadCount - 1);
//         persist(state.notifications);
//       }
//     },

//     // ================= MARK ALL READ =================
//     markAllAsRead: (state) => {
//       state.notifications.forEach((n) => {
//         n.isRead = true;
//       });

//       state.unreadCount = 0;
//       persist(state.notifications);
//     },

//     // ================= DELETE ONE =================
//     deleteNotification: (state, action) => {
//       const index = state.notifications.findIndex(
//         (n) => n.id === action.payload
//       );

//       if (index !== -1) {
//         const wasUnread = !state.notifications[index].isRead;
//         state.notifications.splice(index, 1);

//         if (wasUnread) {
//           state.unreadCount = Math.max(0, state.unreadCount - 1);
//         }

//         persist(state.notifications);
//       }
//     },

//     // ================= CLEAR ALL =================
//     clearNotifications: (state) => {
//       state.notifications = [];
//       state.unreadCount = 0;
//       persist([]);
//     },

//     // ================= LOAD FROM STORAGE =================
//     loadNotificationsFromStorage: (state) => {
//       try {
//         const stored = localStorage.getItem("notifications");
//         if (!stored) return;

//         const notifications = JSON.parse(stored);

//         state.notifications = notifications;
//         state.unreadCount = notifications.filter(
//           (n) => !n.isRead
//         ).length;
//       } catch (e) {
//         console.warn("Failed to load notifications:", e);
//       }
//     },
//   },
// });

// // ================= EXPORTS =================
// export const {
//   addNotification,
//   setNotificationsFromPending,
//   markAsRead,
//   markAllAsRead,
//   deleteNotification,
//   clearNotifications,
//   loadNotificationsFromStorage,
// } = notificationSlice.actions;

// // ================= SELECTORS =================
// export const selectAllNotifications = (state) =>
//   state.notifications.notifications;

// export const selectUnreadCount = (state) =>
//   state.notifications.unreadCount;

// export default notificationSlice.reducer;

// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

// import { createSlice } from "@reduxjs/toolkit";

// const initialState = {
//   notifications: [],
//   unreadCount: 0,
// };

// const persist = (notifications) => {
//   localStorage.setItem("notifications", JSON.stringify(notifications));
// };

// const notificationSlice = createSlice({
//   name: "notifications",
//   initialState,
//   reducers: {
//     // Build notifications from pending follow requests (used after login)
//     setNotificationsFromPending: (state, action) => {
//       const notifications = (action.payload || []).map((req) => ({
//         id: req._id || `${Date.now()}-${Math.random()}`,
//         type: "FOLLOW_REQUEST",
//         fromUserId: req._id,
//         fromUsername: req.username,
//         profilePhoto: req.profilePhoto || null,
//         message: `${req.username} sent you a follow request`,
//         createdAt: new Date().toISOString(),
//         isRead: false,
//       }));

//       state.notifications = notifications;
//       state.unreadCount = notifications.filter((n) => !n.isRead).length;
//       persist(state.notifications);
//     },
//     addNotification: (state, action) => {
//       const n = {
//         id: action.payload.id,
//         type: action.payload.type,
//         fromUserId: action.payload.fromUserId,
//         fromUsername: action.payload.fromUsername,
//         profilePhoto: action.payload.profilePhoto || null,
//         message: action.payload.message,
//         createdAt: action.payload.createdAt,
//         isRead: action.payload.isRead ?? false,
//       };

//       state.notifications.unshift(n);
//       if (!n.isRead) state.unreadCount += 1;
//       persist(state.notifications);
//     },

//     markAsRead: (state, action) => {
//       const n = state.notifications.find((i) => i.id === action.payload);
//       if (n && !n.isRead) {
//         n.isRead = true;
//         state.unreadCount--;
//         persist(state.notifications);
//       }
//     },

//     markAllAsRead: (state) => {
//       state.notifications.forEach((n) => (n.isRead = true));
//       state.unreadCount = 0;
//       persist(state.notifications);
//     },

//     deleteNotification: (state, action) => {
//       const idx = state.notifications.findIndex(
//         (n) => n.id === action.payload
//       );
//       if (idx !== -1) {
//         if (!state.notifications[idx].isRead) state.unreadCount--;
//         state.notifications.splice(idx, 1);
//         persist(state.notifications);
//       }
//     },

//     clearNotifications: (state) => {
//       state.notifications = [];
//       state.unreadCount = 0;
//       persist([]);
//     },

//     loadNotificationsFromStorage: (state) => {
//       const stored = localStorage.getItem("notifications");
//       if (!stored) return;
//       const parsed = JSON.parse(stored);
//       state.notifications = parsed;
//       state.unreadCount = parsed.filter((n) => !n.isRead).length;
//     },
//   },
// });

// export const {
//   addNotification,
//   setNotificationsFromPending,
//   markAsRead,
//   markAllAsRead,
//   deleteNotification,
//   clearNotifications,
//   loadNotificationsFromStorage,
// } = notificationSlice.actions;

// export const selectAllNotifications = (state) =>
//   state.notifications.notifications;

// export const selectUnreadCount = (state) =>
//   state.notifications.unreadCount;

// export default notificationSlice.reducer;


// !!!!!!!!!!!!!!!!!!!!!!!!!

// src/NotificationSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// ================= CONFIG =================
const API_BASE = "https://robo-zv8u.onrender.com/api";

// ================= ASYNC THUNKS =================

/**
 * ACCEPT FOLLOW REQUEST
 * payload: { requesterId }
 */
export const acceptFollowRequest = createAsyncThunk(
  "notifications/acceptFollowRequest",
  async ({ requesterId }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("authToken");

      const res = await axios.post(
        `${API_BASE}/follow/accept-request`,
        { requesterId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // IMPORTANT:
      // Backend emits socket event → socket.js handles UI update
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message ||
          err.message ||
          "Failed to accept follow request"
      );
    }
  }
);

/**
 * REJECT FOLLOW REQUEST
 * payload: { requesterId }
 */
export const rejectFollowRequest = createAsyncThunk(
  "notifications/rejectFollowRequest",
  async ({ requesterId }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("authToken");

      const res = await axios.post(
        `${API_BASE}/follow/reject-request`,
        { requesterId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      return res.data;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message ||
          err.message ||
          "Failed to reject follow request"
      );
    }
  }
);

// ================= HELPERS =================
const persist = (notifications) => {
  localStorage.setItem("notifications", JSON.stringify(notifications));
};

// ================= SLICE =================
const notificationSlice = createSlice({
  name: "notifications",
  initialState: {
    notifications: [],
    unreadCount: 0,
    loading: false,
    error: null,
  },
  reducers: {
    // Build notifications from pending follow requests (after login)
    setNotificationsFromPending: (state, action) => {
      const notifications = (action.payload || []).map((req) => ({
        id: req._id,
        type: "FOLLOW_REQUEST",
        fromUserId: req._id,
        fromUsername: req.username,
        profilePhoto: req.profilePhoto || null,
        message: `${req.username} sent you a follow request`,
        createdAt: new Date().toISOString(),
        isRead: false,
      }));

      state.notifications = notifications;
      state.unreadCount = notifications.length;
      persist(state.notifications);
    },

    addNotification: (state, action) => {
      const n = {
        id: action.payload.id || `${Date.now()}-${Math.random()}`,
        type: action.payload.type,
        fromUserId: action.payload.fromUserId,
        fromUsername: action.payload.fromUsername,
        profilePhoto: action.payload.profilePhoto || null,
        message: action.payload.message,
        createdAt: action.payload.createdAt,
        isRead: action.payload.isRead ?? false,
      };

      state.notifications.unshift(n);
      if (!n.isRead) state.unreadCount += 1;
      persist(state.notifications);
    },

    markAsRead: (state, action) => {
      const n = state.notifications.find((i) => i.id === action.payload);
      if (n && !n.isRead) {
        n.isRead = true;
        state.unreadCount--;
        persist(state.notifications);
      }
    },

    markAllAsRead: (state) => {
      state.notifications.forEach((n) => (n.isRead = true));
      state.unreadCount = 0;
      persist(state.notifications);
    },

    deleteNotification: (state, action) => {
      const idx = state.notifications.findIndex(
        (n) => n.id === action.payload
      );
      if (idx !== -1) {
        if (!state.notifications[idx].isRead) state.unreadCount--;
        state.notifications.splice(idx, 1);
        persist(state.notifications);
      }
    },

    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
      persist([]);
    },

    loadNotificationsFromStorage: (state) => {
      const stored = localStorage.getItem("notifications");
      if (!stored) return;
      const parsed = JSON.parse(stored);
      state.notifications = parsed;
      state.unreadCount = parsed.filter((n) => !n.isRead).length;
    },
  },

  extraReducers: (builder) => {
    builder
      // ACCEPT
      .addCase(acceptFollowRequest.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(acceptFollowRequest.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(acceptFollowRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // REJECT
      .addCase(rejectFollowRequest.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(rejectFollowRequest.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(rejectFollowRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// ================= EXPORTS =================
export const {
  addNotification,
  setNotificationsFromPending,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearNotifications,
  loadNotificationsFromStorage,
} = notificationSlice.actions;

export const selectAllNotifications = (state) =>
  state.notifications.notifications;

export const selectUnreadCount = (state) =>
  state.notifications.unreadCount;

export default notificationSlice.reducer;

