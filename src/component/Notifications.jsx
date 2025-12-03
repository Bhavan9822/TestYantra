import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { formatTime } from '../FormatTime';
import { 
  loadNotificationsFromStorage,
  markAsRead, 
  markAllAsRead, 
  deleteNotification,
  clearNotifications,
  selectAllNotifications,
  selectUnreadCount
} from '../NotificationSlice';

const Notifications = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Get current user from Redux
  const { currentUser } = useSelector((state) => state.auth);
  
  // Use notifications from Redux store with selectors
  const notifications = useSelector(selectAllNotifications);
  const unreadCount = useSelector(selectUnreadCount);
  
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedNotification, setSelectedNotification] = useState(null);

  const defaultImage = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSnnA_0pG5u9vFP1v9a2DKaqVMCEL_0-FXjkduD2ZzgSm14wJy-tcGygo_HZX_2bzMHF8I&usqp=CAU";

  // Robust image helper (matches Home/Articles logic)
  const getImageSrc = useCallback((photo) => {
    if (!photo) return defaultImage;

    if (typeof photo === 'string') {
      if (photo.startsWith('data:image/')) return photo;
      const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
      const cleanPhoto = photo.replace(/\s/g, '');
      if (cleanPhoto.length > 100 && base64Regex.test(cleanPhoto)) return `data:image/jpeg;base64,${cleanPhoto}`;
      if (photo.startsWith('http')) return photo;
      return defaultImage;
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

    return defaultImage;
  }, [defaultImage]);

  // Derive current user's photo using multiple possible fields
  const userPhoto = useMemo(() => getImageSrc(
    currentUser?.profilePhoto ||
    currentUser?.profilePhotoUrl ||
    currentUser?.avatar ||
    currentUser?.image ||
    currentUser?.picture ||
    currentUser?.profilePic
  ), [currentUser, getImageSrc]);

  // Load notifications from localStorage on component mount
  useEffect(() => {
    dispatch(loadNotificationsFromStorage());
  }, [dispatch]);

  // Filter notifications by tab
  const filteredNotifications = useMemo(() => {
    if (activeTab === 'all') {
      return notifications;
    } else if (activeTab === 'likes') {
      return notifications.filter(notif => notif.type === 'like');
    } else if (activeTab === 'comments') {
      return notifications.filter(notif => notif.type === 'comment');
    } else if (activeTab === 'follows') {
      return notifications.filter(notif => notif.type === 'follow');
    } else if (activeTab === 'mentions') {
      return notifications.filter(notif => notif.type === 'mention');
    }
    return notifications;
  }, [notifications, activeTab]);

  // Handle notification click
  const handleNotificationClick = useCallback((notification) => {
    // Mark as read if not already read
    if (!notification.read) {
      dispatch(markAsRead(notification.id));
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'like':
      case 'comment':
        if (notification.targetId) {
          navigate(`/article/${notification.targetId}`);
        }
        break;
      case 'follow':
        if (notification.actor) {
          navigate(`/profile/${notification.actor}`);
        }
        break;
      case 'mention':
        if (notification.targetId) {
          navigate(`/article/${notification.targetId}`);
        }
        break;
      case 'friend_request':
        setSelectedNotification(notification);
        break;
      default:
        // Do nothing or navigate to home
        navigate('/home');
        break;
    }
  }, [dispatch, navigate]);

  // Get notification icon
  const getNotificationIcon = useCallback((type) => {
    switch (type) {
      case 'like':
        return <i className="fas fa-heart text-red-500 text-xl"></i>;
      case 'comment':
        return <i className="fas fa-comment-dots text-blue-600 text-xl"></i>;
      case 'follow':
        return <i className="fas fa-user-plus text-green-600 text-xl"></i>;
      case 'mention':
        return <i className="fas fa-at text-pink-600 text-xl"></i>;
      case 'share':
        return <i className="fas fa-share text-purple-600 text-xl"></i>;
      case 'friend_request':
        return <i className="fas fa-user-friends text-yellow-600 text-xl"></i>;
      default:
        return <i className="fas fa-bell text-gray-600 text-xl"></i>;
    }
  }, []);

  // Get notification background color
  const getNotificationBgColor = useCallback((type) => {
    switch (type) {
      case 'like':
        return 'bg-red-100';
      case 'comment':
        return 'bg-blue-100';
      case 'follow':
        return 'bg-green-100';
      case 'mention':
        return 'bg-pink-100';
      case 'share':
        return 'bg-purple-100';
      case 'friend_request':
        return 'bg-yellow-100';
      default:
        return 'bg-gray-100';
    }
  }, []);

  // Get user display name for notification
  const getUserDisplayName = useCallback((notification) => {
    return notification.actorName || 'Someone';
  }, []);

  // Get article title for notification
  const getArticleTitle = useCallback((notification) => {
    return notification.articleTitle || 'Your post';
  }, []);

  // Get comment text for notification
  const getCommentText = useCallback((notification) => {
    return notification.commentText || '';
  }, []);

  // Handle mark all as read
  const handleMarkAllAsRead = useCallback(() => {
    dispatch(markAllAsRead());
  }, [dispatch]);

  // Handle delete notification
  const handleDeleteNotification = useCallback((e, notificationId) => {
    e.stopPropagation(); // Prevent triggering the notification click
    dispatch(deleteNotification(notificationId));
  }, [dispatch]);

  // Handle friend request action
  const handleFriendRequestAction = useCallback((notificationId, action) => {
    // Accept or decline friend request
    console.log(`Friend request ${action}:`, notificationId);
    
    // Remove the notification after action
    dispatch(deleteNotification(notificationId));
    setSelectedNotification(null);
    
    // Show feedback
    alert(`Friend request ${action === 'accept' ? 'accepted' : 'declined'}!`);
  }, [dispatch]);

  // Handle clear all notifications
  const handleClearAllNotifications = useCallback(() => {
    if (window.confirm('Are you sure you want to clear all notifications?')) {
      dispatch(clearNotifications());
    }
  }, [dispatch]);

  return (
    <>
      <main className="w-full overflow-scroll relative top-0 bg-gradient-to-b from-[rgb(151,222,246)] to-[rgb(210,137,228)] min-h-screen">
        <nav id='nav' className="fixed z-[1000] w-full h-[10vh] flex bg-white rounded-[5px] shadow-[rgba(0,0,0,0.45)_0px_25px_20px_-20px]">
          <aside id='as1' className="flex-[30%]">
            <h1 className="font-bold text-[35px] ml-[30px] mt-[12px] bg-gradient-to-r from-[rgb(0,98,255)] via-[rgb(128,0,119)] to-pink bg-clip-text text-transparent">SocialMedia</h1>
          </aside>
          <aside id='as2' className="flex-[30%] flex justify-center items-center">
            <div id='searchbar'>
              <input type="text" placeholder='Search...' className="border-2 border-black h-[40px] w-[30vw] rounded-[10px] pl-[15px] text-black" />
            </div>
            <i className="fa-solid fa-magnifying-glass relative top-[10px] right-[30px] h-[35px] w-[45px] rounded-tr-[10px] rounded-br-[10px] grid place-items-center text-black "></i>
          </aside>
          <aside id='as3' className="flex-[40%] flex justify-end items-center gap-[30px]">
            <div className="flex gap-[35px] pr-[45px] nav_div">
              <div className='nav_icons'><i className="fa-regular fa-house text-[25px] text-black" onClick={()=>navigate('/home')}></i></div>
              <div className='nav_icons'><i className="fa-regular fa-square-plus text-[25px] text-black" onClick={() => {navigate("/articles")}}></i></div>
              <div className='nav_icons relative'>
                <i className="fa-regular fa-bell text-[25px] text-black"></i>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <div className='nav_icons'>
                <img
                  src={userPhoto}
                  alt="User"
                  className="w-[30px] h-[30px] rounded-full object-cover border border-gray-400 cursor-pointer"
                  onClick={() => navigate('/profile')}
                  onError={(e) => { e.target.onerror = null; e.target.src = getImageSrc(null); }}
                />
              </div>
              <div id='theme' className="border-2 border-black flex justify-center items-center h-[25px] w-[25px] rounded-full">
                <i className="fa-regular fa-moon text-[16px] text-black"></i>
              </div>
            </div>
          </aside>
        </nav>

        <div className="max-w-4xl mx-auto px-6 py-10 pt-20" id='div_indarticle'>
          {/* Page Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-4xl font-extrabold text-gray-900">Notifications</h2>
              <p className="text-gray-600 mt-2">
                {unreadCount > 0 
                  ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                  : 'All caught up!'
                }
              </p>
            </div>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                >
                  Mark all as read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAllNotifications}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl w-fit mb-10 overflow-x-auto">
            <button
              className={`px-6 py-2 rounded-lg font-semibold transition whitespace-nowrap ${
                activeTab === 'all' ? 'bg-white shadow-sm' : 'text-gray-600 hover:bg-white hover:shadow-sm'
              }`}
              onClick={() => setActiveTab('all')}
              id="allTab"
            >
              All
            </button>
            <button
              className={`px-6 py-2 rounded-lg font-semibold transition whitespace-nowrap ${
                activeTab === 'likes' ? 'bg-white shadow-sm' : 'text-gray-600 hover:bg-white hover:shadow-sm'
              }`}
              onClick={() => setActiveTab('likes')}
              id="likesTab"
            >
              Likes
            </button>
            <button
              className={`px-6 py-2 rounded-lg font-semibold transition whitespace-nowrap ${
                activeTab === 'comments' ? 'bg-white shadow-sm' : 'text-gray-600 hover:bg-white hover:shadow-sm'
              }`}
              onClick={() => setActiveTab('comments')}
              id="commentsTab"
            >
              Comments
            </button>
            <button
              className={`px-6 py-2 rounded-lg font-semibold transition whitespace-nowrap ${
                activeTab === 'mentions' ? 'bg-white shadow-sm' : 'text-gray-600 hover:bg-white hover:shadow-sm'
              }`}
              onClick={() => setActiveTab('mentions')}
              id="mentionsTab"
            >
              Mentions
            </button>
            <button
              className={`px-6 py-2 rounded-lg font-semibold transition whitespace-nowrap ${
                activeTab === 'follows' ? 'bg-white shadow-sm' : 'text-gray-600 hover:bg-white hover:shadow-sm'
              }`}
              onClick={() => setActiveTab('follows')}
              id="followsTab"
            >
              Follows
            </button>
          </div>

          {/* Notifications List */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-10">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                <p className="text-gray-600">Loading notifications...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-16">
                <i className="fa-regular fa-bell-slash text-6xl text-gray-400 mb-4"></i>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No notifications</h3>
                <p className="text-gray-500">
                  {activeTab === 'all' 
                    ? "You're all caught up!" 
                    : `No ${activeTab} notifications`}
                </p>
              </div>
            ) : (
              filteredNotifications.map((notification) => {
                const userDisplayName = getUserDisplayName(notification);
                const articleTitle = getArticleTitle(notification);
                const commentText = getCommentText(notification);
                
                return (
                  <div
                    key={notification.id}
                    className={`notification bg-white rounded-2xl p-5 flex items-center justify-between shadow-sm border border-gray-100 transition-all duration-200 cursor-pointer hover:shadow-md ${
                      !notification.read ? 'border-l-4 border-l-blue-500' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="relative">
                        <div className="w-14 h-14 rounded-full overflow-hidden">
                          <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-lg font-bold">
                            {userDisplayName.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        {!notification.read && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-900">
                          <span className="hover:text-blue-600 transition-colors">
                            {userDisplayName}
                          </span>{' '}
                          <span className="font-normal text-gray-700">
                            {notification.message}
                          </span>
                        </p>
                        
                        {/* Show article title for like and comment notifications */}
                        {(notification.type === 'like' || notification.type === 'comment') && articleTitle && (
                          <p className="text-sm text-gray-500 mt-1 italic">
                            "{articleTitle}"
                          </p>
                        )}
                        
                        {/* Show comment preview for comment notifications */}
                        {notification.type === 'comment' && commentText && (
                          <p className="text-sm text-gray-500 mt-1">
                            "{commentText}"
                          </p>
                        )}
                        
                        <p className="text-sm text-gray-500 mt-2">
                          {formatTime(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 ${getNotificationBgColor(notification.type)} rounded-xl flex items-center justify-center ml-4`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <button
                        onClick={(e) => handleDeleteNotification(e, notification.id)}
                        className="ml-2 text-gray-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-gray-100"
                        title="Delete notification"
                      >
                        <i className="fas fa-times text-lg"></i>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Friend Request Modal */}
          {selectedNotification && selectedNotification.type === 'friend_request' && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-16 h-16 rounded-full overflow-hidden">
                    <div className="w-full h-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center text-white text-2xl font-bold">
                      {getUserDisplayName(selectedNotification).charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Friend Request</h3>
                    <p className="text-gray-600">{getUserDisplayName(selectedNotification)} wants to be your friend</p>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleFriendRequestAction(selectedNotification.id, 'accept')}
                    className="flex-1 bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition-colors font-semibold"
                  >
                    <i className="fas fa-check mr-2"></i>
                    Accept
                  </button>
                  <button
                    onClick={() => handleFriendRequestAction(selectedNotification.id, 'decline')}
                    className="flex-1 bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 transition-colors font-semibold"
                  >
                    <i className="fas fa-times mr-2"></i>
                    Decline
                  </button>
                </div>
                
                <button
                  onClick={() => setSelectedNotification(null)}
                  className="mt-4 w-full py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Maybe later
                </button>
              </div>
            </div>
          )}

          {/* Empty state when there are notifications but none match filter */}
          {notifications.length > 0 && filteredNotifications.length === 0 && activeTab !== 'all' && (
            <div className="text-center py-8">
              <p className="text-gray-500">
                No {activeTab} notifications. Try another tab.
              </p>
            </div>
          )}

          {/* Stats Footer */}
          {notifications.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex justify-between items-center text-sm text-gray-500">
                <div>
                  <span className="font-medium">{notifications.length}</span> total notifications
                </div>
                <div>
                  <span className="font-medium">{unreadCount}</span> unread
                </div>
                <div>
                  <span className="font-medium">
                    {notifications.filter(n => n.type === 'like').length}
                  </span> likes
                </div>
                <div>
                  <span className="font-medium">
                    {notifications.filter(n => n.type === 'comment').length}
                  </span> comments
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default Notifications;