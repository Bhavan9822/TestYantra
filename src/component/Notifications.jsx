
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const searchRef = useRef(null);
  const [inp,setinp]=useState("")
  
  // Default profile image
  const userProfilePhoto = localStorage.getItem("profilePhoto") || "";
  const defaultImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23cbd5e1'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E"
  
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

        const message = (result?.message || '').toLowerCase();

        if (message.includes('already following')) {
          toast.info(`You are already following ${username}`);
        } else if (message.includes('pending') || message.includes('already sent')) {
          toast.info(`Follow request already sent to ${username}`);
        } else if (message.includes('yourself')) {
          toast.error("You can't follow yourself");
        } else {
          // Default success path
          toast.success(result?.message || `Follow request sent to ${username}`);
        }
      } catch (error) {
        console.error('Follow request failed:', error);
        // Normalize error to a string
        const errMsg = typeof error === 'string' ? error : (error?.message || '');
        const lower = errMsg.toLowerCase();

        if (lower.includes('not found') || lower.includes('does not exist')) {
          toast.error(`User "${username}" not found`);
        } else if (lower.includes('already following')) {
          toast.info(`You are already following ${username}`);
        } else if (lower.includes('pending') || lower.includes('already sent')) {
          toast.info(`Follow request already pending for ${username}`);
        } else if (lower.includes('yourself')) {
          toast.error("You can't follow yourself");
        } else {
          toast.error(errMsg || 'Failed to send follow request');
        }
      } finally {
        setinp('');
      }
    }
  const { currentUser } = useSelector((state) => state.auth || {});
  const defaultAvatar = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23cbd5e1'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E";
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
        <nav id='nav' className="fixed z-[1000] w-full h-auto md:h-[10vh] md:flex items-center bg-white rounded-[5px] shadow-[rgba(0,0,0,0.45)_0px_25px_20px_-20px] px-3 md:px-0 gap-2 md:gap-0 grid grid-cols-[auto_1fr_auto] grid-rows-1 py-1">
          <aside id='as1' className="col-span-1 row-start-1 col-start-1 min-w-0 md:flex-[30%] flex items-center">
            <h1 className="font-bold text-[20px] md:text-[35px] ml-2 md:ml-[30px] mt-0 md:mt-[12px] leading-none tracking-tight bg-gradient-to-r from-[rgb(0,98,255)] via-[rgb(128,0,119)] to-pink bg-clip-text text-transparent truncate max-w-[160px] md:max-w-none">
              SocialMedia
            </h1>
          </aside>
          
          <aside id='as2' className="col-span-1 col-start-2 row-start-1 flex justify-center items-center relative px-2 md:mt-0 min-w-0 md:flex-[30%]" ref={searchRef}>
            <form action="" onSubmit={handelfollowsubmit} className='flex items-center h-9 md:h-auto w-full max-w-[220px] md:w-auto md:max-w-none md:ml-[30px] mx-auto gap-1.5 md:gap-10 bg-gradient-to-r from-blue-50 to-purple-50 p-1 md:p-2 rounded-full border-2 border-gray-300 hover:border-blue-400 transition-colors'>
              <input 
                type="text" 
                value={inp}
                onChange={handelFollow} 
                placeholder='Search users...' 
                className='bg-transparent px-2 md:px-3 pl-3 md:pl-7 py-1 md:py-0 text-gray-700 text-sm placeholder-gray-400 focus:outline-none flex-1 min-w-0'
              />
              <button 
                type='submit'
                className='px-2 md:px-6 py-1 md:py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium rounded-full hover:from-blue-600 hover:to-purple-600 transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center gap-1 md:gap-2 whitespace-nowrap'
              >
                <i className="fa-solid fa-magnifying-glass text-xs md:text-sm"></i>
                <span className="hidden md:inline">Send</span>
              </button>
            </form>
          </aside>
          
          <aside id='as3' className="col-span-1 row-start-1 col-start-3 flex justify-end items-center gap-3 md:gap-[30px] min-w-0 md:flex-[40%] relative">
            {/* Menu toggle (mobile only) */}
            <button
              type="button"
              aria-label="Open menu"
              className="md:hidden p-2 rounded-md border border-gray-300 hover:bg-gray-100 active:bg-gray-200 transition"
              onClick={() => setIsMenuOpen((v) => !v)}
            >
              <i className="fa-solid fa-bars text-[20px] text-black"></i>
            </button>

            {/* Desktop icons (visible on md+) */}
            <div className="hidden md:flex gap-3 md:gap-[35px] pr-2 md:pr-[45px] nav_div items-center">
              <div className='nav_icons cursor-pointer hidden md:block'>
                <i className="fa-regular fa-house text-[20px] md:text-[25px] text-black" onClick={()=> navigate("/home")}></i>
              </div>
              <div className='nav_icons cursor-pointer hidden md:block'>
                <i 
                  className="fa-regular fa-square-plus text-[20px] md:text-[25px] text-black" 
                  onClick={() => navigate("/articles")}
                ></i>
              </div>
              <div className='hidden md:block'><NotificationBell /></div>
              <div className='nav_icons cursor-pointer hidden md:block'>
                <img 
                  src={userPhoto} 
                  alt="User Profile" 
                  className="w-7 h-7 md:w-[30px] md:h-[30px] rounded-full object-cover border border-gray-400"
                  onClick={()=>navigate('/profile')}
                  onError={(e) => { e.target.onerror = null; e.target.src = defaultAvatar; }}
                />
              </div>
            </div>

            {/* Dropdown menu (mobile only) */}
            {isMenuOpen && (
              <div className="md:hidden absolute right-2 top-full mt-2 bg-white rounded-lg shadow-lg p-2 flex flex-col gap-2 z-[1100] min-w-[180px]">
                <button
                  className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 text-left"
                  onClick={() => { setIsMenuOpen(false); navigate('/home'); }}
                >
                  <i className="fa-regular fa-house text-[18px] text-black"></i>
                  <span className="text-sm">Home</span>
                </button>
                <button
                  className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 text-left"
                  onClick={() => { setIsMenuOpen(false); navigate('/articles'); }}
                >
                  <i className="fa-regular fa-square-plus text-[18px] text-black"></i>
                  <span className="text-sm">Blog</span>
                </button>
                <div className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100">
                  <NotificationBell iconClassName="text-[16px]" badgeClassName="w-4 h-4 text-[10px]" />
                  <span className="text-sm">Notifications</span>
                </div>
                <button
                  className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 text-left"
                  onClick={() => { setIsMenuOpen(false); navigate('/profile'); }}
                >
                  <img 
                    src={userPhoto} 
                    alt="User Profile" 
                    className="w-5 h-5 rounded-full object-cover border border-gray-400"
                    onError={(e) => { e.target.onerror = null; e.target.src = defaultAvatar; }}
                  />
                  <span className="text-sm">Profile</span>
                </button>
              </div>
            )}
          </aside>
        </nav>
    <div className="pt-28 pb-12 px-4 md:px-8 lg:px-12">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* ================= HEADER ================= */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-3xl font-bold text-gray-900">Notifications</h2>

          <div className="flex flex-wrap gap-2">
            {unreadCount > 0 && (
              <button
                onClick={() => dispatch(markAllAsRead())}
                className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition"
              >
                Mark all as read
              </button>
            )}

            {notifications.length > 0 && (
              <button
                onClick={() => dispatch(clearNotifications())}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-full hover:bg-gray-300 transition"
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
        <div className="space-y-3 md:space-y-4">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 md:p-5 lg:p-6 rounded-2xl border flex flex-col sm:flex-row sm:items-start justify-between gap-4 sm:gap-5 bg-white/90 shadow-sm hover:shadow-md transition-all duration-200 ring-1 ring-transparent hover:ring-blue-100 ${
                !n.isRead ? "border-blue-200 bg-blue-50/60" : "border-gray-200"
              }`}
              onClick={() => handleClick(n)}
            >
              {/* LEFT */}
              <div className="flex-1 space-y-1">
                <p className="font-semibold text-gray-900">
                  {n.fromUsername || "Someone"}
                </p>

                <p className="text-gray-700 leading-relaxed">
                  {n.message || (n.type === 'ARTICLE_LIKED' ? `${n.fromUsername || 'Someone'} liked your article` : '')}
                </p>

                <p className="text-sm text-gray-500">
                  {formatTime(n.createdAt)}
                </p>

                {n.type === "FOLLOW_REQUEST" && (
                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAccept(n);
                      }}
                      disabled={loadingId === n.id}
                      className="px-4 py-2 bg-green-500 text-white rounded-full hover:bg-green-600 disabled:opacity-50 transition"
                    >
                      Accept
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReject(n);
                      }}
                      disabled={loadingId === n.id}
                      className="px-4 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 disabled:opacity-50 transition"
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
                className="self-start text-red-500 hover:text-red-700"
                title="Delete notification"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* ================= FOOTER ================= */}
        {notifications.length > 0 && (
          <div className="text-sm text-gray-600">
            Total: {notifications.length} | Unread: {unreadCount}
          </div>
        )}
      </div>
    </div>
    </main>
  );
};

export default Notifications;



