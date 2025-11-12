import React from "react";
import { Routes, Route } from "react-router-dom";
import { Provider } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import store from "./Store.jsx";
import Regisphoto from "./Register/Regisphoto";
import Login from "./Register/Login";
import { Home } from "./Home/Home";
import 'react-toastify/dist/ReactToastify.css';

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
        <Route path="/register" element={<Regisphoto />} />
        <Route path="/home" element={<Home/>} />
      </Routes>
    </Provider>
  );
};

export default App;