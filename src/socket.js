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

  let userId = store.getState()?.auth?.currentUser?._id;
  // Safari can delay store hydration; fallback to localStorage
  if (!userId) {
    try {
      const storedUser = localStorage.getItem("authUser");
      if (storedUser) userId = JSON.parse(storedUser)?._id || null;
    } catch {}
  }

  if (!userId || registeredUserId === userId) return;

  socket.emit("register", userId);
  registeredUserId = userId;
  console.log("socket registered:", userId);
}

// ================= CONNECT SOCKET =================
function connectSocket() {
  if (socket) return socket;

  socket = io(BACKEND_BASE, {
    path: SOCKET_PATH,
    // Safari can block pure websocket; allow polling fallback and retries
    transports: ["websocket", "polling"],
    reconnectionAttempts: 5,
    reconnectionDelay: 500,
    withCredentials: true,
    auth: { token: localStorage.getItem("authToken") },
  });

  socket.on("connect", () => {
    console.log("socket connected");
    registerUserIfNeeded();
  });

  socket.on("disconnect", () => {
    registeredUserId = null;
  });

  // ================= FOLLOW =================
  socket.on("followRequestReceived", (data) => {
    const myUserId = store.getState()?.auth?.currentUser?._id;
    if (myUserId && String(data.fromId) === String(myUserId)) {
      console.log("[SOCKET] Skip followRequestReceived: self-notification", { myUserId, fromId: data.fromId });
      return;
    }

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

    if (myUserId && String(data.byId) === String(myUserId)) {
      console.log("[SOCKET] Skip followRequestAccepted: self-notification", { myUserId, byId: data.byId });
      return;
    }

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
    const myUserId = store.getState()?.auth?.currentUser?._id;
    if (myUserId && String(data.byId) === String(myUserId)) {
      console.log("[SOCKET] Skip followRequestRejected: self-notification", { myUserId, byId: data.byId });
      return;
    }

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

  // =================  ARTICLE LIKED (OWNER-ONLY) =================
  socket.on("articleLiked", (data) => {
    console.log("[SOCKET] articleLiked event received", data);

    //  Update likes count everywhere (if provided)
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

  // =================  NEW COMMENT / REPLY =================
  // Notify only intended recipients: article owner and parent comment author (for replies)
  socket.on("newComment", (data) => {
    console.log("[SOCKET] newComment received", data);

    const state = store.getState();
    let myUserId = state?.auth?.currentUser?._id;
    if (!myUserId) {
      try {
        const storedUser = localStorage.getItem("authUser");
        if (storedUser) myUserId = JSON.parse(storedUser)?._id || null;
      } catch {}
    }

    if (!myUserId) {
      console.log("[SOCKET] Skip newComment: no current user in Redux");
      return;
    }

    const articleId = data.articleId || data.comment?.articleId;
    if (!articleId) {
      console.log("[SOCKET] Skip newComment: missing articleId");
      return;
    }

    // Resolve article owner from store (re-using logic pattern from like handler)
    const resolveOwnerIdFromStore = () => {
      const articlesState = state?.articles || {};
      const list = articlesState.posts || [];
      const currentArticle = articlesState.currentArticle;
      const candidate = list.find((a) => (a._id || a.id) === articleId) || currentArticle;
      if (!candidate) return null;
      const userObj = candidate.user || candidate.author || candidate.postedBy || candidate.userId || null;
      if (typeof userObj === "object") return userObj._id || userObj.id || userObj.userId || null;
      if (typeof userObj === "string") return userObj;
      return candidate.ownerId || candidate.authorId || null;
    };

    const ownerId = data.ownerId || resolveOwnerIdFromStore();

    // Extract commenter details
    const commenterName =
      data.comment?.by ||
      data.comment?.from ||
      data.comment?.user?.username ||
      data.comment?.author?.username ||
      data.comment?.postedBy?.username ||
      "Someone";

    const commenterId =
      data.comment?.by ||
      data.comment?.from ||
      (typeof data.comment?.user === "object" ? data.comment?.user?._id : data.comment?.user) ||
      data.comment?.author?._id ||
      data.comment?.postedBy?._id;

    const commentText = data.comment?.text || data.comment?.content || "";

    const commenterIdValue = typeof commenterId === "object" ? commenterId?._id : commenterId;
    const commenterNameValue = typeof commenterName === "object" ? commenterName?.username || commenterName?.name : commenterName;

    // Parent comment / reply context
    const parent = data.comment?.parentComment || data.parentComment;
    const parentAuthorId =
      (typeof parent?.user === "object" ? parent?.user?._id : parent?.user) ||
      parent?.author?._id ||
      parent?.postedBy?._id ||
      data.comment?.replyToUserId ||
      data.replyToUserId ||
      null;

    const isReply = Boolean(parentAuthorId);

    // ========== SELF-NOTIFICATION GUARD ==========
    if (commenterIdValue && myUserId && String(myUserId) === String(commenterIdValue)) {
      console.log("[SOCKET] Skip newComment: self-notification prevented", { myUserId, commenterIdValue });
      return;
    }

    // ========== INTENDED RECIPIENT GUARD ==========
    // Notify only if current user is article owner OR parent comment author (for replies)
    const isOwnerRecipient = ownerId && String(myUserId) === String(ownerId);
    const isParentRecipient = parentAuthorId && String(myUserId) === String(parentAuthorId);
    if (!isOwnerRecipient && !isParentRecipient) {
      console.log("[SOCKET] Skip newComment: current user not intended recipient", { myUserId, ownerId, parentAuthorId });
      return;
    }

    // Add comment into article comments for intended recipients
    store.dispatch(
      addCommentOptimistically({
        articleId,
        comment: data.comment,
      })
    );

    const message = isReply
      ? `${commenterNameValue} replied: "${commentText}"`
      : `${commenterNameValue} commented: "${commentText}"`;

    store.dispatch(
      addNotification({
        type: "ARTICLE_COMMENTED",
        fromUserId: commenterIdValue,
        fromUsername: commenterNameValue,
        articleId,
        message,
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
