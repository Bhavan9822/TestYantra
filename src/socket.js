
// src/socket.js
import { io } from "socket.io-client";
import store from "./Store";
import { addNotification } from "./NotificationSlice";
import { incrementFollowers, incrementFollowing } from "./Slice";
import { updateArticleLikes } from "./ArticlesSlice";

// ================= CONFIG =================
const BACKEND_BASE = "https://robo-zv8u.onrender.com";
const SOCKET_PATH = "/socket.io";

let socket = null;
let registeredUserId = null;

// ================= GET SOCKET =================
function getSocket() {
  return socket;
}

// ================= REGISTER USER =================
function registerUserIfNeeded() {
  if (!socket || !socket.connected) return;

  const userId = store.getState()?.auth?.currentUser?._id;
  if (!userId || registeredUserId === userId) return;

  socket.emit("register", userId);
  registeredUserId = userId;
  console.log("🔥 socket registered:", userId);
}

// ================= CONNECT SOCKET =================
function connectSocket() {
  if (socket) return socket;

  socket = io(BACKEND_BASE, {
    path: SOCKET_PATH,
    transports: ["websocket"],
    auth: { token: localStorage.getItem("authToken") },
  });

  socket.on("connect", () => {
    console.log("✅ socket connected");
    registerUserIfNeeded();
  });

  socket.on("disconnect", () => {
    registeredUserId = null;
  });

  // ================= FOLLOW =================
  socket.on("followRequestReceived", (data) => {
    store.dispatch(
      addNotification({
        type: "FOLLOW_REQUEST",
        fromUserId: data.fromId,
        fromUsername: data.from,
        message: `${data.from} sent you a follow request`,
        createdAt: new Date().toISOString(),
        isRead: false,
      })
    );
  });

  socket.on("followRequestAccepted", (data) => {
    const myUserId = store.getState()?.auth?.currentUser?._id;

    store.dispatch(
      addNotification({
        type: "FOLLOW_ACCEPTED",
        fromUserId: data.byId,
        fromUsername: data.by,
        message: `${data.by} accepted your follow request`,
        createdAt: new Date().toISOString(),
        isRead: false,
      })
    );

    if (String(data.byId) === String(myUserId)) {
      store.dispatch(incrementFollowers());
    } else {
      store.dispatch(incrementFollowing());
    }
  });

  socket.on("followRequestRejected", (data) => {
    store.dispatch(
      addNotification({
        type: "FOLLOW_REJECTED",
        fromUserId: data.byId,
        fromUsername: data.by,
        message: `${data.by} rejected your follow request`,
        createdAt: new Date().toISOString(),
        isRead: false,
      })
    );
  });

  // ================= ❤️ ARTICLE LIKED (FRIEND LOGIC) =================
  socket.on("articleLiked", (data) => {
    console.log("❤️ articleLiked", data);

    // 🔁 Update likes count everywhere
    if (data.article?._id) {
      store.dispatch(
        updateArticleLikes({
          articleId: data.article._id,
          likes: data.article.likedBy,
          likesCount: data.article.likeCount ?? data.article.likedBy?.length,
        })
      );
    }

    // 🔔 Notification (NO ownership checks)
    store.dispatch(
      addNotification({
        id: Date.now(),
        type: "ARTICLE_LIKED",
        fromUserId: data.likedBy?._id || data.fromUserId,
        fromUsername:
          data.likedBy?.username ||
          data.likedBy ||
          "Someone",
        articleId: data.articleId || data.article?._id,
        message: `${
          data.likedBy?.username || data.likedBy || "Someone"
        } liked your article`,
        createdAt: new Date().toISOString(),
        isRead: false,
      })
    );
  });

  store.subscribe(registerUserIfNeeded);
  return socket;
}

// ================= DISCONNECT =================
function disconnectSocket() {
  socket?.disconnect();
  socket = null;
  registeredUserId = null;
}

// ================= HELPERS =================
function on(event, cb) {
  if (!socket) return () => {};
  socket.on(event, cb);
  return () => socket.off(event, cb);
}

function off(event, cb) {
  socket?.off(event, cb);
}

function emit(event, payload) {
  socket?.emit(event, payload);
}

export { connectSocket, disconnectSocket, getSocket, on, off, emit };





