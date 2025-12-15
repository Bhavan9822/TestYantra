
// src/NotificationSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  notifications: [],
  unreadCount: 0,
};

// 🔧 Helper: persist to localStorage
const persist = (notifications) => {
  try {
    localStorage.setItem("notifications", JSON.stringify(notifications));
  } catch (e) {
    console.warn("Notification persistence failed:", e);
  }
};

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    // ================= ADD (SOCKET) =================
    addNotification: (state, action) => {
      const payload = action.payload;

      const notification = {
        id: payload.id || `${Date.now()}-${Math.random()}`,
        type: payload.type,
        fromUserId: payload.fromUserId,
        fromUsername: payload.fromUsername,
        profilePhoto: payload.profilePhoto || null,
        message: payload.message,
        createdAt: payload.createdAt || new Date().toISOString(),
        isRead: payload.isRead ?? false,
      };

      state.notifications.unshift(notification);

      if (!notification.isRead) {
        state.unreadCount += 1;
      }

      persist(state.notifications);
    },

    // ================= FROM LOGIN (pendingRequests) =================
    setNotificationsFromPending: (state, action) => {
      const notifications = action.payload.map((req) => ({
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

    // ================= MARK ONE READ =================
    markAsRead: (state, action) => {
      const n = state.notifications.find(
        (item) => item.id === action.payload
      );

      if (n && !n.isRead) {
        n.isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
        persist(state.notifications);
      }
    },

    // ================= MARK ALL READ =================
    markAllAsRead: (state) => {
      state.notifications.forEach((n) => {
        n.isRead = true;
      });

      state.unreadCount = 0;
      persist(state.notifications);
    },

    // ================= DELETE ONE =================
    deleteNotification: (state, action) => {
      const index = state.notifications.findIndex(
        (n) => n.id === action.payload
      );

      if (index !== -1) {
        const wasUnread = !state.notifications[index].isRead;
        state.notifications.splice(index, 1);

        if (wasUnread) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }

        persist(state.notifications);
      }
    },

    // ================= CLEAR ALL =================
    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
      persist([]);
    },

    // ================= LOAD FROM STORAGE =================
    loadNotificationsFromStorage: (state) => {
      try {
        const stored = localStorage.getItem("notifications");
        if (!stored) return;

        const notifications = JSON.parse(stored);

        state.notifications = notifications;
        state.unreadCount = notifications.filter(
          (n) => !n.isRead
        ).length;
      } catch (e) {
        console.warn("Failed to load notifications:", e);
      }
    },
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

// ================= SELECTORS =================
export const selectAllNotifications = (state) =>
  state.notifications.notifications;

export const selectUnreadCount = (state) =>
  state.notifications.unreadCount;

export default notificationSlice.reducer;
