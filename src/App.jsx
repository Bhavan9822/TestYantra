
import React, { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { Provider, useSelector } from "react-redux";
import { ToastContainer } from "react-toastify";
import store from "./Store.jsx";
import { connectSocket } from "./socket";

import Regisphoto from "./Register/Regisphoto.jsx";
import Login from "./Register/Login.jsx";
import Home from "./home/Home";
import Articles from "./component/Articles.jsx";
import IndArticle from "./component/IndArticle.jsx";
import Notifications from "./component/Notifications.jsx";
import Profile from "./component/Profile.jsx";

import "react-toastify/dist/ReactToastify.css";

/**
 * 🔔 Socket initializer component
 * This MUST be inside <Provider />
 */
const SocketInitializer = () => {
  const currentUser = useSelector((state) => state.auth.currentUser);

  useEffect(() => {
    if (!currentUser?._id) return;

    const token = localStorage.getItem("authToken");
    const socket = connectSocket(token);

    if (!socket) return;

    // If already connected
    if (socket.connected) {
      socket.emit("registerUser", currentUser._id);
      console.log("🔥 registerUser emitted (connected):", currentUser._id);
    }

    // If connection happens later
    socket.on("connect", () => {
      socket.emit("registerUser", currentUser._id);
      console.log("🔥 registerUser emitted (on connect):", currentUser._id);
    });

    return () => {
      socket.off("connect");
    };
  }, [currentUser?._id]);

  return null; // no UI
};

const App = () => {
  return (
    <Provider store={store}>
      {/* 🔔 Socket setup */}
      <SocketInitializer />

      {/* 🔔 Toasts */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        pauseOnHover
        draggable
      />

      {/* 🔁 Routes */}
      <Routes>
        <Route path="/register" element={<Regisphoto />} />
        <Route path="/" element={<Login />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/home" element={<Home />} />
        <Route path="/articles" element={<Articles />} />
        <Route path="/indarticle" element={<IndArticle />} />
        <Route path="/indarticle/:articleId" element={<IndArticle />} />
        <Route path="/notification" element={<Notifications />} />
      </Routes>
    </Provider>
  );
};

export default App;
