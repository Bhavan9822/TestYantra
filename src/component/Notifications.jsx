
// // !!!!!!!!!!!!!!!!!!!!!!!

// // src/component/Notifications.jsx
// import React, { useEffect } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import {
//   loadNotificationsFromStorage,
//   markAsRead,
//   markAllAsRead,
//   deleteNotification,
//   clearNotifications,
//   selectAllNotifications,
//   selectUnreadCount,
// } from "../NotificationSlice";
// import { formatTime } from "../FormatTime";

// const Notifications = () => {
//   const dispatch = useDispatch();

//   const notifications = useSelector(selectAllNotifications);
//   const unreadCount = useSelector(selectUnreadCount);

//   // Load persisted notifications on mount
//   useEffect(() => {
//     dispatch(loadNotificationsFromStorage());
//   }, [dispatch]);

//   // Mark notification as read on click
//   const handleNotificationClick = (notification) => {
//     if (!notification.isRead) {
//       dispatch(markAsRead(notification.id));
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-100 p-6">
//       {/* ================= HEADER ================= */}
//       <div className="flex justify-between items-center mb-6">
//         <h2 className="text-3xl font-bold">Notifications</h2>

//         <div className="flex gap-2">
//           {unreadCount > 0 && (
//             <button
//               onClick={() => dispatch(markAllAsRead())}
//               className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
//             >
//               Mark all as read
//             </button>
//           )}

//           {notifications.length > 0 && (
//             <button
//               onClick={() => dispatch(clearNotifications())}
//               className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
//             >
//               Clear all
//             </button>
//           )}
//         </div>
//       </div>

//       {/* ================= EMPTY STATE ================= */}
//       {notifications.length === 0 && (
//         <p className="text-gray-600">No notifications</p>
//       )}

//       {/* ================= LIST ================= */}
//       <div className="space-y-3">
//         {notifications.map((n) => (
//           <div
//             key={n.id}
//             onClick={() => handleNotificationClick(n)}
//             className={`p-4 rounded border bg-white cursor-pointer flex justify-between items-center transition ${
//               !n.isRead ? "border-l-4 border-blue-500" : ""
//             }`}
//           >
//             <div className="flex-1">
//               {/* USER NAME */}
//               <p className="font-semibold text-gray-900">
//                 {n.fromUsername || "Someone"}
//               </p>

//               {/* MESSAGE */}
//               <p className="text-gray-700">{n.message}</p>

//               {/* TIME */}
//               <p className="text-sm text-gray-500">
//                 {formatTime(n.createdAt)}
//               </p>
//             </div>

//             {/* DELETE BUTTON */}
//             <button
//               onClick={(e) => {
//                 e.stopPropagation();
//                 dispatch(deleteNotification(n.id));
//               }}
//               className="ml-4 text-red-500 hover:text-red-700"
//               title="Delete notification"
//             >
//               ✕
//             </button>
//           </div>
//         ))}
//       </div>

//       {/* ================= FOOTER ================= */}
//       {notifications.length > 0 && (
//         <div className="mt-6 text-sm text-gray-600">
//           Total: {notifications.length} | Unread: {unreadCount}
//         </div>
//       )}
//     </div>
//   );
// };

// export default Notifications;



// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";

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

const API_BASE = "https://robo-zv8u.onrender.com/api";

const Notifications = () => {
  const dispatch = useDispatch();
  const notifications = useSelector(selectAllNotifications);
  const unreadCount = useSelector(selectUnreadCount);

  const [loadingId, setLoadingId] = useState(null);

  // ================= LOAD ON MOUNT =================
  useEffect(() => {
    dispatch(loadNotificationsFromStorage());
  }, [dispatch]);

  // ================= ACCEPT REQUEST =================
  const handleAccept = async (notification) => {
    try {
      setLoadingId(notification.id);

      const token = localStorage.getItem("authToken");

      await axios.post(
        `${API_BASE}/follow/accept-request`,
        { followerId: notification.fromUserId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // ✅ Remove FOLLOW_REQUEST notification instantly
      dispatch(deleteNotification(notification.id));
    } catch (err) {
      console.error("Accept follow request failed:", err);
      alert("Failed to accept follow request");
    } finally {
      setLoadingId(null);
    }
  };

  // ================= REJECT REQUEST =================
  const handleReject = async (notification) => {
    try {
      setLoadingId(notification.id);

      const token = localStorage.getItem("authToken");

      await axios.post(
        `${API_BASE}/follow/reject-request`,
        { followerId: notification.fromUserId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // ✅ Remove FOLLOW_REQUEST notification instantly
      dispatch(deleteNotification(notification.id));
    } catch (err) {
      console.error("Reject follow request failed:", err);
      alert("Failed to reject follow request");
    } finally {
      setLoadingId(null);
    }
  };

  // ================= MARK READ =================
  const handleClick = (n) => {
    if (!n.isRead) {
      dispatch(markAsRead(n.id));
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
            className={`p-4 rounded border bg-white flex justify-between items-start transition ${
              !n.isRead ? "border-l-4 border-blue-500" : ""
            }`}
            onClick={() => handleClick(n)}
          >
            {/* LEFT */}
            <div className="flex-1">
              <p className="font-semibold text-gray-900">
                {n.fromUsername || "Someone"}
              </p>

              <p className="text-gray-700">{n.message}</p>

              <p className="text-sm text-gray-500 mt-1">
                {formatTime(n.createdAt)}
              </p>

              {/* ✅ ACCEPT / REJECT BUTTONS */}
              {n.type === "FOLLOW_REQUEST" && (
                <div className="flex gap-3 mt-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAccept(n);
                    }}
                    disabled={loadingId === n.id}
                    className="px-4 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                  >
                    Accept
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReject(n);
                    }}
                    disabled={loadingId === n.id}
                    className="px-4 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>

            {/* DELETE */}
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



