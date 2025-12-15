
// !!!!!!!!!!!!!!!!!!!!!!!

// src/component/Notifications.jsx
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  loadNotificationsFromStorage,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearNotifications,
  selectAllNotifications,
  selectUnreadCount,
} from "../NotificationSlice";
import { formatTime } from "../FormatTime";

const Notifications = () => {
  const dispatch = useDispatch();

  const notifications = useSelector(selectAllNotifications);
  const unreadCount = useSelector(selectUnreadCount);

  // Load persisted notifications on mount
  useEffect(() => {
    dispatch(loadNotificationsFromStorage());
  }, [dispatch]);

  // Mark notification as read on click
  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      dispatch(markAsRead(notification.id));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Notifications</h2>

        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button
              onClick={() => dispatch(markAllAsRead())}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Mark all as read
            </button>
          )}

          {notifications.length > 0 && (
            <button
              onClick={() => dispatch(clearNotifications())}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* ================= EMPTY STATE ================= */}
      {notifications.length === 0 && (
        <p className="text-gray-600">No notifications</p>
      )}

      {/* ================= LIST ================= */}
      <div className="space-y-3">
        {notifications.map((n) => (
          <div
            key={n.id}
            onClick={() => handleNotificationClick(n)}
            className={`p-4 rounded border bg-white cursor-pointer flex justify-between items-center transition ${
              !n.isRead ? "border-l-4 border-blue-500" : ""
            }`}
          >
            <div className="flex-1">
              {/* USER NAME */}
              <p className="font-semibold text-gray-900">
                {n.fromUsername || "Someone"}
              </p>

              {/* MESSAGE */}
              <p className="text-gray-700">{n.message}</p>

              {/* TIME */}
              <p className="text-sm text-gray-500">
                {formatTime(n.createdAt)}
              </p>
            </div>

            {/* DELETE BUTTON */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                dispatch(deleteNotification(n.id));
              }}
              className="ml-4 text-red-500 hover:text-red-700"
              title="Delete notification"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* ================= FOOTER ================= */}
      {notifications.length > 0 && (
        <div className="mt-6 text-sm text-gray-600">
          Total: {notifications.length} | Unread: {unreadCount}
        </div>
      )}
    </div>
  );
};

export default Notifications;

