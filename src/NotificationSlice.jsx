import { createSlice } from '@reduxjs/toolkit';

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    items: [],
    unreadCount: 0,
  },
  reducers: {
    // Load notifications from localStorage on app start
    loadNotificationsFromStorage: (state) => {
      try {
        const savedNotifications = localStorage.getItem('notifications');
        if (savedNotifications) {
          const notifications = JSON.parse(savedNotifications);
          state.items = notifications;
          state.unreadCount = notifications.filter(n => !n.read).length;
        }
      } catch (e) {
        console.warn('Failed to load notifications from localStorage:', e);
      }
    },
    
    // Add notification for like action
    addLikeNotification: (state, action) => {
      const { actor, targetId, actorName, articleTitle } = action.payload;
      try { console.log('NotificationSlice: addLikeNotification called', action.payload); } catch (e) {}
      const notification = {
        id: Date.now().toString(),
        type: 'like',
        actor,
        actorName: actorName || 'Someone',
        targetId,
        targetType: 'article',
        message: `liked your post`,
        articleTitle: articleTitle || 'Your post',
        createdAt: new Date().toISOString(),
        read: false
      };
      state.items.unshift(notification);
      state.unreadCount += 1;
      
      // Persist to localStorage
      try {
        localStorage.setItem('notifications', JSON.stringify(state.items));
      } catch (e) {
        console.warn('Failed to save notifications to localStorage:', e);
      }
    },
    
    // Add notification for comment action
    addCommentNotification: (state, action) => {
      const { actor, targetId, actorName, articleTitle, commentText } = action.payload;
      try { console.log('NotificationSlice: addCommentNotification called', action.payload); } catch (e) {}
      const notification = {
        id: Date.now().toString(),
        type: 'comment',
        actor,
        actorName: actorName || 'Someone',
        targetId,
        targetType: 'article',
        message: `commented on your post`,
        articleTitle: articleTitle || 'Your post',
        commentText: commentText?.substring(0, 100) || '', // First 100 chars
        createdAt: new Date().toISOString(),
        read: false
      };
      state.items.unshift(notification);
      state.unreadCount += 1;
      
      // Persist to localStorage
      try {
        localStorage.setItem('notifications', JSON.stringify(state.items));
      } catch (e) {
        console.warn('Failed to save notifications to localStorage:', e);
      }
    },
    
    // Mark notification as read
    markAsRead: (state, action) => {
      const notificationId = action.payload;
      const notification = state.items.find(n => n.id === notificationId);
      if (notification && !notification.read) {
        notification.read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
        
        // Update localStorage
        try {
          localStorage.setItem('notifications', JSON.stringify(state.items));
        } catch (e) {
          console.warn('Failed to update localStorage:', e);
        }
      }
    },
    
    // Mark all as read
    markAllAsRead: (state) => {
      state.items.forEach(notification => {
        notification.read = true;
      });
      state.unreadCount = 0;
      
      // Update localStorage
      try {
        localStorage.setItem('notifications', JSON.stringify(state.items));
      } catch (e) {
        console.warn('Failed to update localStorage:', e);
      }
    },
    
    // Delete notification
    deleteNotification: (state, action) => {
      const notificationId = action.payload;
      const notification = state.items.find(n => n.id === notificationId);
      if (notification && !notification.read) {
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
      state.items = state.items.filter(n => n.id !== notificationId);
      
      // Update localStorage
      try {
        localStorage.setItem('notifications', JSON.stringify(state.items));
      } catch (e) {
        console.warn('Failed to update localStorage:', e);
      }
    },
    
    // Clear all notifications
    clearNotifications: (state) => {
      state.items = [];
      state.unreadCount = 0;
      
      // Clear localStorage
      try {
        localStorage.removeItem('notifications');
      } catch (e) {
        console.warn('Failed to clear localStorage:', e);
      }
    },
    
    // Reset on logout
    resetNotifications: (state) => {
      state.items = [];
      state.unreadCount = 0;
    }
  },
});

export const { 
  loadNotificationsFromStorage,
  addLikeNotification,
  addCommentNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearNotifications,
  resetNotifications
} = notificationSlice.actions;

export default notificationSlice.reducer;

// Selectors
export const selectAllNotifications = (state) => state.notifications?.items || [];
export const selectUnreadCount = (state) => state.notifications?.unreadCount || 0;
