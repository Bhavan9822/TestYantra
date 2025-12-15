
// src/socket.js
import { io } from "socket.io-client";
import store from "./Store";
import { addNotification } from "./NotificationSlice";

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

  const state = store.getState();
  const userId = state?.auth?.currentUser?._id;

  if (!userId) return;
  if (registeredUserId === userId) return;

  // backend expects "register"
  socket.emit("register", userId);
  registeredUserId = userId;

  console.log("🔥 socket register emitted:", userId);
}

// ================= CONNECT SOCKET =================
function connectSocket() {
  try {
    if (socket) return socket;

    socket = io(BACKEND_BASE, {
      path: SOCKET_PATH,
      transports: ["websocket"],
      auth: {
        token: localStorage.getItem("authToken"),
      },
    });

    // ---------- CONNECT ----------
    socket.on("connect", () => {
      console.log("✅ socket connected:", socket.id);
      registerUserIfNeeded();
    });

    // ---------- RECONNECT ----------
    socket.on("reconnect", () => {
      console.log("🔁 socket reconnected");
      registeredUserId = null;
      registerUserIfNeeded();
    });

    // ---------- DISCONNECT ----------
    socket.on("disconnect", (reason) => {
      console.log("⚠️ socket disconnected:", reason);
      registeredUserId = null;
    });

    socket.on("connect_error", (err) => {
      console.warn("❌ socket connect_error:", err?.message || err);
    });

    // ================= FOLLOW REQUEST RECEIVED =================
    socket.on("followRequestReceived", (data) => {
      console.log("🔔 followRequestReceived:", data);

      store.dispatch(
        addNotification({
          type: "FOLLOW_REQUEST",
          fromUserId: data.fromId,
          fromUsername: data.from, // ✅ UI USES THIS
          message: `🔔 Follow request from ${data.from}`,
          createdAt: new Date().toISOString(),
          isRead: false,
        })
      );
    });

    // ================= FOLLOW REQUEST ACCEPTED =================
    socket.on("followRequestAccepted", (data) => {
      console.log("✅ followRequestAccepted:", data);

      store.dispatch(
        addNotification({
          type: "FOLLOW_ACCEPTED",
          fromUserId: data.byId,
          fromUsername: data.by,
          message: `✅ ${data.by} accepted your follow request`,
          createdAt: new Date().toISOString(),
          isRead: false,
        })
      );
    });

    // ================= FOLLOW REQUEST REJECTED =================
    socket.on("followRequestRejected", (data) => {
      console.log("❌ followRequestRejected:", data);

      store.dispatch(
        addNotification({
          type: "FOLLOW_REJECTED",
          fromUserId: data.byId,
          fromUsername: data.by,
          message: `❌ ${data.by} rejected your follow request`,
          createdAt: new Date().toISOString(),
          isRead: false,
        })
      );
    });

    // 🔁 Watch login after socket already connected
    store.subscribe(() => {
      registerUserIfNeeded();
    });

    return socket;
  } catch (e) {
    console.warn("❌ socket connection failed:", e);
    return null;
  }
}

// ================= DISCONNECT =================
function disconnectSocket() {
  try {
    if (socket) {
      socket.disconnect();
      socket = null;
      registeredUserId = null;
    }
  } catch (e) {
    console.warn("❌ socket disconnect error:", e);
  }
}

// ================= HELPERS =================
function on(event, cb) {
  if (!socket) return () => {};
  socket.on(event, cb);
  return () => socket.off(event, cb);
}

function off(event, cb) {
  if (!socket) return;
  socket.off(event, cb);
}

function emit(event, payload) {
  if (!socket) return false;
  socket.emit(event, payload);
  return true;
}

// ================= EXPORTS =================
export {
  connectSocket,
  disconnectSocket,
  getSocket,
  on,
  off,
  emit,
};


