
// src/socket.js
import { io } from "socket.io-client";
import store from "./Store";
import { addNotification } from "./NotificationSlice";
import { incrementFollowers, incrementFollowing } from "./Slice";
import { updateArticleLikes, addCommentOptimistically } from "./ArticlesSlice";

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

  // ================= ❤️ ARTICLE LIKED (OWNER-ONLY) =================
  socket.on("articleLiked", (data) => {
    console.log("[SOCKET] articleLiked event received", data);

    // 🔁 Update likes count everywhere (if provided)
    if (data.article?._id) {
      store.dispatch(
        updateArticleLikes({
          articleId: data.article._id,
          likes: data.article.likedBy,
          likesCount: data.article.likeCount ?? data.article.likedBy?.length,
        })
      );
    } else if (data.articleId && (data.likes || data.likesCount !== undefined)) {
      store.dispatch(
        updateArticleLikes({
          articleId: data.articleId,
          likes: data.likes,
          likesCount: data.likesCount || (data.likes?.length || 0),
        })
      );
    }

    const state = store.getState();
    let myUserId = state?.auth?.currentUser?._id;
    if (!myUserId) {
      try {
        const storedUser = localStorage.getItem("authUser");
        if (storedUser) myUserId = JSON.parse(storedUser)?._id || null;
      } catch {}
    }
    const articleId = data.articleId || data.article?._id;

    const resolveOwnerIdFromStore = () => {
      if (!articleId) return null;
      const articlesState = state?.articles || {};
      const list = articlesState.posts || [];
      const currentArticle = articlesState.currentArticle;
      const candidate = (list.find((a) => (a._id || a.id) === articleId)) || currentArticle;
      if (!candidate) return null;
      const userObj = candidate.user || candidate.author || candidate.postedBy || candidate.userId || null;
      if (typeof userObj === "object") return userObj._id || userObj.id || userObj.userId || null;
      if (typeof userObj === "string") return userObj;
      return candidate.ownerId || candidate.authorId || null;
    };

    const ownerId = data.ownerId || resolveOwnerIdFromStore();
    const fromUserId = data.fromUserId || data.likedBy?._id;
    const isUnlike = data.liked === false || data.isLiked === false || data.message === 'Article unliked';

    if (!myUserId || !ownerId) {
      console.log("[SOCKET] Skip like notification: missing user/owner", { myUserId, ownerId });
      return;
    }
    if (isUnlike) {
      console.log("[SOCKET] Skip like notification: unlike event");
      return;
    }
    if (String(myUserId) !== String(ownerId)) {
      console.log("[SOCKET] Skip like notification: current user is not owner", { myUserId, ownerId });
      return;
    }
    if (fromUserId && String(fromUserId) === String(myUserId)) {
      console.log("[SOCKET] Skip like notification: liker is owner", { fromUserId, myUserId });
      return;
    }

    // Duplicate guard
    const existing = (state?.notifications?.notifications || []).find(
      (n) =>
        n.type === "ARTICLE_LIKED" &&
        String(n.fromUserId) === String(fromUserId) &&
        String(n.articleId) === String(articleId)
    );
    if (existing) {
      console.log("[SOCKET] Skip like notification: duplicate detected");
      return;
    }

    const fromUsername = data.fromUsername || data.likedBy?.username || data.likedBy || "Someone";
    const message = `${fromUsername} liked your article`;

    console.log("[NOTIFICATION] Article liked notification dispatched", {
      articleId: data.articleId,
      fromUserId,
      fromUsername,
    });

    store.dispatch(
      addNotification({
        type: "ARTICLE_LIKED",
        fromUserId,
        fromUsername,
        articleId,
        message,
        createdAt: new Date().toISOString(),
        isRead: false,
      })
    );
  });

  // ================= 💬 NEW COMMENT =================
  // Based on working friend's implementation - SIMPLIFIED and RELIABLE
  socket.on("newComment", (data) => {
    console.log("[SOCKET] newComment received", data);

    const state = store.getState();
    const myUserId = state?.auth?.currentUser?._id;

    if (!myUserId) {
      console.log("[SOCKET] Skip newComment: no current user in Redux");
      return;
    }

    // Extract from payload - TRUST it directly
    const commenterName = data.comment?.by || data.comment?.from || "Someone";
    const commenterId = data.comment?.by || data.comment?.from;
    const commentText = data.comment?.text || data.comment?.content || "";
    const articleId = data.articleId;

    if (!articleId) {
      console.log("[SOCKET] Skip newComment: missing articleId");
      return;
    }

    // Extract ID value if commenter is an object
    const commenterIdValue = typeof commenterId === "object" ? commenterId?._id : commenterId;
    const commenterNameValue = typeof commenterName === "object" ? commenterName?.username || commenterName?.name : commenterName;

    // ========== SELF-NOTIFICATION GUARD ==========
    // Never show notification to the commenter themselves
    if (commenterIdValue && String(myUserId) === String(commenterIdValue)) {
      console.log("[SOCKET] Skip newComment: self-notification prevented", { myUserId, commenterIdValue });
      return;
    }

    // ========== Add comment to top of article's comments ==========
    // Unshift comment to the article in Redux so it appears immediately
    store.dispatch(
      addCommentOptimistically({
        articleId,
        comment: data.comment,
      })
    );

    // ========== Dispatch notification ==========
    store.dispatch(
      addNotification({
        type: "ARTICLE_COMMENTED",
        fromUserId: commenterIdValue,
        fromUsername: commenterNameValue,
        articleId,
        message: `${commenterNameValue} commented: "${commentText}"`,
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





