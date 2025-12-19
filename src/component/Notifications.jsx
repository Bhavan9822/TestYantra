
import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
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
import { sendFollowByUsername } from "../FollowSendSlice";
import NotificationBell from "./NotificationBell";
import { toast } from 'react-toastify';

const API_BASE = "https://robo-zv8u.onrender.com/api";

const Notifications = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const notifications = useSelector(selectAllNotifications);
  const unreadCount = useSelector(selectUnreadCount);

  const [loadingId, setLoadingId] = useState(null);

  const searchRef = useRef(null);
  const [inp,setinp]=useState("")
  
  // Default profile image
  const userProfilePhoto = localStorage.getItem("profilePhoto") || "";
  const defaultImage = "https://via.placeholder.com/30"
  
  const handelFollow=(e)=>{
      setinp(e.target.value);
    }
  const handelfollowsubmit = async (e) => {
      e.preventDefault();
      const username = inp.trim();
      
      if (!username) {
        toast.error('Please enter a username');
        return;
      }

      try {
        const result = await dispatch(sendFollowByUsername(username)).unwrap();
        
        if (result.success || result.message === 'Follow request sent successfully') {
          toast.success(`Follow request sent to ${username}`);
        } else if (result.message?.includes('already following') || result.error?.includes('already following')) {
          toast.info(`You are already following ${username}`);
        } else if (result.message?.includes('pending') || result.error?.includes('pending')) {
          toast.info(`Follow request already sent to ${username}`);
        } else {
          toast.success('Follow request sent successfully');
        }
      } catch (error) {
        console.error('Follow request failed:', error);
        
        if (error?.includes?.('not found') || error?.includes?.('does not exist')) {
          toast.error(`User "${username}" not found`);
        } else if (error?.includes?.('already following')) {
          toast.info(`You are already following ${username}`);
        } else if (error?.includes?.('pending')) {
          toast.info(`Follow request already pending for ${username}`);
        } else if (error?.includes?.('yourself')) {
          toast.error("You can't follow yourself");
        } else {
          toast.error(error || 'Failed to send follow request');
        }
      } finally {
        setinp('');
      }
    }
  const { currentUser } = useSelector((state) => state.auth || {});
  const defaultAvatar = 'https://www.svgrepo.com/show/446529/avatar.svg';
  const getImageSrc = useCallback((photo) => {
      if (!photo) return defaultAvatar;
  
      if (typeof photo === 'string') {
        if (photo.startsWith('data:image/')) return photo;
        if (photo.startsWith('http')) return photo;
        const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
        const cleanPhoto = photo.replace(/\s/g, '');
        if (cleanPhoto.length > 100 && base64Regex.test(cleanPhoto)) return `data:image/jpeg;base64,${cleanPhoto}`;
        return defaultAvatar;
      }
  
      try {
        if (photo.data && (photo.data instanceof Uint8Array || Array.isArray(photo.data))) {
          const bytes = photo.data;
          const uint8 = bytes instanceof Uint8Array ? bytes : Uint8Array.from(bytes);
          const binary = uint8.reduce((acc, byte) => acc + String.fromCharCode(byte), '');
          const b64 = btoa(binary);
          return `data:image/jpeg;base64,${b64}`;
        }
      } catch (e) {
        console.warn('Failed to process image object:', e);
      }
  
      return defaultAvatar;
    }, [defaultAvatar]);
  const userPhoto = useMemo(() => getImageSrc(
      currentUser?.profilePhoto ||
      currentUser?.profilePhotoUrl ||
      currentUser?.avatar ||
      currentUser?.image ||
      currentUser?.picture ||
      currentUser?.profilePic ||
      currentUser?.photoURL
    ), [currentUser, getImageSrc]);
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
    <main className="w-full overflow-scroll relative top-0 bg-gradient-to-b from-[rgb(151,222,246)] to-[rgb(210,137,228)] min-h-screen">
        {/* Navigation */}
        <nav id='nav' className="fixed z-[1000] w-full h-[10vh] flex bg-white rounded-[5px] shadow-[rgba(0,0,0,0.45)_0px_25px_20px_-20px]">
          <aside id='as1' className="flex-[30%]">
            <h1 className="font-bold text-[35px] ml-[30px] mt-[12px] bg-gradient-to-r from-[rgb(0,98,255)] via-[rgb(128,0,119)] to-pink bg-clip-text text-transparent">
              SocialMedia
            </h1>
          </aside>
          
          <aside id='as2' className="flex-[30%] flex justify-center items-center relative" ref={searchRef}>
            <form action="" onSubmit={handelfollowsubmit} className='flex items-center gap-10 bg-gradient-to-r from-blue-50 to-purple-50 p-2 rounded-full border-2 border-gray-300 hover:border-blue-400 transition-colors'>
              <input 
                type="text" 
                value={inp}
                onChange={handelFollow} 
                placeholder='Search users...' 
                className='bg-transparent px-17 pl-7 py-0 text-gray-700 placeholder-gray-400 focus:outline-none flex-1 min-w-0'
              />
              <button 
                type='submit'
                className='px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium rounded-full hover:from-blue-600 hover:to-purple-600 transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center gap-2 whitespace-nowrap'
              >
                <i className="fa-solid fa-magnifying-glass text-sm"></i>
                Send
              </button>
            </form>
          </aside>
          
          <aside id='as3' className="flex-[40%] flex justify-end items-center gap-[30px]">
            <div className="flex gap-[35px] pr-[45px] nav_div">
              <div className='nav_icons cursor-pointer'>
                <i className="fa-regular fa-house text-[25px] text-black" onClick={()=> navigate("/home")}></i>
              </div>
              <div className='nav_icons cursor-pointer'>
                <i 
                  className="fa-regular fa-square-plus text-[25px] text-black" 
                  onClick={() => navigate("/articles")}
                ></i>
              </div>
              <NotificationBell />
              <div className='nav_icons cursor-pointer'>
                <img 
                  src={userPhoto} 
                  alt="User Profile" 
                  className="w-[30px] h-[30px] rounded-full object-cover border border-gray-400"
                  onClick={()=>navigate('/profile')}
                  onError={(e) => { e.target.onerror = null; e.target.src = defaultAvatar; }}
                />
              </div>
              <div id='theme' className="border-2 border-black flex justify-center items-center h-[25px] w-[25px] rounded-full cursor-pointer">
                <i className="fa-regular fa-moon text-[16px] text-black"></i>
              </div>
            </div>
          </aside>
        </nav>
    <div>
      {/* ================= HEADER ================= */}
      <div className="flex justify-between mt-25 items-center mb-6">
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

              <p className="text-gray-700">
                {n.message || (n.type === 'ARTICLE_LIKED' ? `${n.fromUsername || 'Someone'} liked your article` : '')}
              </p>

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
    </main>
  );
};

export default Notifications;



