import React from "react";
import { Routes, Route } from "react-router-dom";
import { Provider } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import store from "./Store.jsx";
import Regisphoto from "./Register/Regisphoto.jsx";
import Login from "./Register/Login.jsx";
import  Home  from "./home/Home";
import 'react-toastify/dist/ReactToastify.css';
import Articles from "./component/Articles.jsx";
import IndArticle from "./component/IndArticle.jsx";
import Notifications from "./component/Notifications.jsx";
import ChatMessage from "./component/ChatMessage.jsx";
import Profile from "./component/Profile.jsx";

const App = () => {
  return (
    <Provider store={store}>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <Routes>
        <Route path="/" element={<Regisphoto />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<Profile/>} />
        <Route path="/home" element={<Home/>} />
        <Route path="/articles" element={<Articles/>} />
        <Route path="/indarticle" element={<IndArticle/>} />
        <Route path="/notification" element={<Notifications/>} />
        <Route path="/chat" element={<ChatMessage/>} />
      </Routes>
    </Provider>
  );
};
export default App;