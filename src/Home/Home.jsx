
// Home.jsx
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  searchUsers, 
  sendFriendRequest, 
  getFriends, 
  getChatMessages, 
  sendMessage,
  clearSearchResults,
  setActiveChat,
  closeSearchResults
} from '../SearchSlice';
import { createPost, fetchPosts } from '../ArticlesSlice';
import { toggleLike, optimisticToggleLike, selectArticleLikes, selectIsLiking } from '../LikeSlice';
import { formatTime } from '../FormatTime';

const Home = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Get data from Redux store
  const { currentUser } = useSelector((state) => state.auth);
  const { posts = [], loading = false, error = null, createPostLoading = false } = useSelector((state) => state.articles || {});
  const { 
    searchResults, 
    searchLoading, 
    friends, 
    activeChat, 
    chatMessages, 
    chatLoading,
    showSearchResults,
    friendRequestLoading
  } = useSelector((state) => state.search);
  
  // Get like states for all posts at once
  const likeStates = useSelector((state) => {
    const states = {};
    posts.forEach(post => {
      const postId = post._id || post.id;
      states[postId] = selectArticleLikes(state, postId);
    });
    return states;
  });
  
  const likeOperations = useSelector((state) => state.likes?.likeOperations || {});

  const searchRef = useRef(null);
  const chatContainerRef = useRef(null);
  
  const defaultImage = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSnnA_0pG5u9vFP1v9a2DKaqVMCEL_0-FXjkduD2ZzgSm14wJy-tcGygo_HZX_2bzMHF8I&usqp=CAU";
  
  const getImageSrc = useCallback((photo) => {
    if (!photo) return defaultImage;

    if (typeof photo === 'string') {
      if (photo.startsWith('data:image/')) {
        return photo;
      }
      
      const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
      const cleanPhoto = photo.replace(/\s/g, '');
      
      if (cleanPhoto.length > 100 && base64Regex.test(cleanPhoto)) {
        return `data:image/jpeg;base64,${cleanPhoto}`;
      }
      
      if (photo.startsWith('http')) {
        return photo;
      }
      
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

  const userPhoto = useMemo(() => getImageSrc(currentUser?.profilePhotoUrl || currentUser?.profilePhoto), [currentUser, getImageSrc]);
  const userName = useMemo(() => currentUser?.username || "User", [currentUser]);
  const userEmail = useMemo(() => currentUser?.email || "user@example.com", [currentUser]);

  // State for UI
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [commentsVisible, setCommentsVisible] = useState({});
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharePostId, setSharePostId] = useState(null);

  useEffect(() => {
    console.log('Home: Fetching friends and posts');
    dispatch(getFriends());
    dispatch(fetchPosts());
  }, [dispatch]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        dispatch(closeSearchResults());
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dispatch]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Helper function to check if current user has liked a post
  const hasUserLikedPost = useCallback((post) => {
    if (!currentUser?._id) return false;
    
    const postId = post._id || post.id;
    
    // First, check the Redux like state
    if (likeStates[postId]?.isLikedByUser !== undefined) {
      return likeStates[postId].isLikedByUser;
    }
    
    // Fallback: Check post.likes array
    if (post.likes && Array.isArray(post.likes)) {
      return post.likes.some(like => 
        like === currentUser._id || 
        (like && like.userId === currentUser._id) ||
        (like && like._id === currentUser._id)
      );
    }
    
    return false;
  }, [currentUser?._id, likeStates]);

  // Helper function to get like count for a post
  const getLikeCount = useCallback((post) => {
    const postId = post._id || post.id;
    
    // First, check the Redux like state
    if (likeStates[postId]?.count !== undefined) {
      return likeStates[postId].count;
    }
    
    // Fallback: Check post.likes array
    if (post.likes && Array.isArray(post.likes)) {
      return post.likes.length;
    }
    
    return 0;
  }, [likeStates]);

  // Check if like operation is in progress for a post
  const isLikingPost = useCallback((postId) => {
    return likeOperations[postId] || false;
  }, [likeOperations]);

  // Search functionality
  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    if (query.length > 2) {
      dispatch(searchUsers(query));
    } else {
      dispatch(clearSearchResults());
    }
  }, [dispatch]);

  // Friend request functionality
  const handleFriendRequest = useCallback(async (userId) => {
    const result = await dispatch(sendFriendRequest(userId));
    if (result.type === 'search/sendFriendRequest/fulfilled') {
      alert('Follow request sent');
    } else {
      if (result.payload) alert(result.payload);
    }
  }, [dispatch]);

  // Chat functionality
  const handleOpenChat = useCallback(async (friend) => {
    dispatch(setActiveChat(friend));
    setShowChat(true);
    await dispatch(getChatMessages(friend._id));
  }, [dispatch]);

  const handleSendMessage = useCallback(async () => {
    if (!messageInput.trim() || !activeChat) return;

    const result = await dispatch(sendMessage({
      friendId: activeChat._id,
      message: messageInput.trim()
    }));

    if (result.type === 'search/sendMessage/fulfilled') {
      setMessageInput('');
    }
  }, [dispatch, activeChat, messageInput]);

  // Create post functionality
  const handleInputClick = useCallback(() => {
    setShowCreateModal(true);
  }, []);

  const handleCloseCreateModal = useCallback(() => {
    setShowCreateModal(false);
    setNewPostTitle('');
    setNewPostContent('');
  }, []);

  const handleCreatePost = useCallback(async (e) => {
    e && e.preventDefault();
    if (!newPostTitle.trim() || !newPostContent.trim()) {
      alert('Please enter a title and content for your post');
      return;
    }

    try {
      const result = await dispatch(createPost({ 
        title: newPostTitle.trim(), 
        content: newPostContent.trim() 
      }));
      
      if (result.type === 'articles/createPost/fulfilled') {
        handleCloseCreateModal();
        const createdPost = result.payload.post || result.payload.article || result.payload;
        dispatch(fetchPosts());
        navigate('/articles', { state: { newPost: createdPost } });
      } else {
        const msg = result.payload || 'Unable to create post';
        alert(msg);
      }
    } catch (err) {
      console.error('Create post failed', err);
      alert('Create post failed. Please try again.');
    }
  }, [dispatch, navigate, newPostTitle, newPostContent, handleCloseCreateModal]);

  // LIKE FUNCTIONALITY
  const handleToggleLike = useCallback(async (postId) => {
    if (!currentUser?._id) {
      alert('Please login to like posts');
      return;
    }

    try {
      // Get current likes for the post
      const post = posts.find(p => (p._id || p.id) === postId);
      const currentLikes = post?.likes || [];
      
      // Optimistic update for immediate UI feedback
      dispatch(optimisticToggleLike({ 
        articleId: postId, 
        userId: currentUser._id,
        currentLikes 
      }));
      
      // Send actual request to server
      const result = await dispatch(toggleLike({ 
        articleId: postId, 
        userId: currentUser._id 
      }));
      
      if (result.error) {
        console.error('Like toggle failed:', result.error);
      }
    } catch (err) {
      console.error('Error in handleToggleLike:', err);
    }
  }, [dispatch, currentUser?._id, posts, optimisticToggleLike, toggleLike]);

  // Comment functionality
  const handleShowComments = useCallback((postId) => {
    setCommentsVisible((prev) => {
      if (prev[postId]) return prev;
      const total = (posts.find((p) => (p._id || p.id) === postId)?.comments || []).length;
      return { ...prev, [postId]: Math.min(5, total) };
    });
  }, [posts]);

  const handleShowMoreComments = useCallback((postId) => {
    setCommentsVisible((prev) => {
      const current = prev[postId] || 0;
      const total = (posts.find((p) => (p._id || p.id) === postId)?.comments || []).length;
      const next = Math.min(total, current + 5);
      return { ...prev, [postId]: next };
    });
  }, [posts]);

  // Share functionality
  const handleOpenShare = useCallback((postId) => {
    setSharePostId(postId);
    setShowShareModal(true);
  }, []);

  const handleShareToUser = useCallback(async (targetUserId) => {
    alert('Share feature coming soon!');
    setShowShareModal(false);
    setSharePostId(null);
  }, []);

  // Helper to get user data from post
  const getUserFromPost = useCallback((post) => {
    if (post.user && typeof post.user === 'object') return post.user;
    if (post.author && typeof post.author === 'object') return post.author;
    if (post.postedBy && typeof post.postedBy === 'object') return post.postedBy;
    if (post.userId && typeof post.userId === 'object') return post.userId;
    return {};
  }, []);

  const getUserDisplayName = useCallback((post) => {
    const user = getUserFromPost(post);
    const username = user.username || user.name || user.fullName || user.displayName || user.email || 'Community Member';
    return username;
  }, [getUserFromPost]);

  const getUserProfilePhoto = useCallback((post) => {
    const user = getUserFromPost(post);
    return getImageSrc(user.profilePhoto || user.profilePhotoUrl || user.avatar || user.image || user.picture);
  }, [getUserFromPost, getImageSrc]);

  const getCommentUser = useCallback((comment) => {
    if (comment.user && typeof comment.user === 'object') return comment.user;
    if (comment.author && typeof comment.author === 'object') return comment.author;
    if (comment.commentedBy && typeof comment.commentedBy === 'object') return comment.commentedBy;
    return {};
  }, []);

  const getCommentUserName = useCallback((comment) => {
    const user = getCommentUser(comment);
    return user.username || user.name || user.fullName || user.displayName || user.email || 'User';
  }, [getCommentUser]);

  const getCommentUserPhoto = useCallback((comment) => {
    const user = getCommentUser(comment);
    return getImageSrc(user.profilePhoto || user.profilePhotoUrl || user.avatar || user.image);
  }, [getCommentUser, getImageSrc]);

  // Memoize posts data to prevent unnecessary re-renders
  const postsData = useMemo(() => posts.map(post => {
    const postId = post._id || post.id;
    return {
      post,
      postId,
      userDisplayName: getUserDisplayName(post),
      userProfilePhoto: getUserProfilePhoto(post),
      hasLiked: hasUserLikedPost(post),
      likeCount: getLikeCount(post),
      isLiking: isLikingPost(postId),
    };
  }), [posts, getUserDisplayName, getUserProfilePhoto, hasUserLikedPost, getLikeCount, isLikingPost]);

  return (
    <>
      <main className="w-full overflow-scroll relative top-0 bg-gradient-to-b from-[rgb(151,222,246)] to-[rgb(210,137,228)]">
        {/* Navigation */}
        <nav id='nav' className="fixed z-[1000] w-full h-[10vh] flex bg-white rounded-[5px] shadow-[rgba(0,0,0,0.45)_0px_25px_20px_-20px]">
          <aside id='as1' className="flex-[30%]">
            <h1 className="font-bold text-[35px] ml-[30px] mt-[12px] bg-gradient-to-r from-[rgb(0,98,255)] via-[rgb(128,0,119)] to-pink bg-clip-text text-transparent">SocialMedia</h1>
          </aside>
          <aside id='as2' className="flex-[30%] flex justify-center items-center relative" ref={searchRef}>
            <div id='searchbar' className="relative w-full">
              <input 
                type="text" 
                placeholder='Search users...' 
                className="border-2 border-black h-[40px] w-[30vw] rounded-[10px] pl-[15px] text-black"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
              <i className="fa-solid fa-magnifying-glass absolute right-3 top-1/2 transform -translate-y-1/2 text-black"></i>
              
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-[10px] mt-1 shadow-lg max-h-60 overflow-y-auto z-50">
                  {searchResults.map((user) => (
                    <div key={user._id} className="p-3 border-b border-gray-200 hover:bg-gray-50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img 
                          src={getImageSrc(user.profilePhotoUrl || user.profilePhoto)} 
                          alt={user.username}
                          className="w-8 h-8 rounded-full object-cover"
                          onError={(e) => e.target.src = defaultImage}
                        />
                        <div>
                          <p className="font-semibold">{user.username}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleFriendRequest(user._id)}
                        disabled={user.friendStatus === 'requested' || friendRequestLoading}
                        className={`px-3 py-1 rounded-lg text-sm ${
                          user.friendStatus === 'requested' 
                            ? 'bg-gray-300 text-gray-600 cursor-not-allowed' 
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                        }`}
                      >
                        {user.friendStatus === 'requested' ? 'Request Sent' : 'Add Friend'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {showSearchResults && searchLoading && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-[10px] mt-1 p-3 text-center">
                  <p>Searching...</p>
                </div>
              )}
            </div>
          </aside>
          <aside id='as3' className="flex-[40%] flex justify-end items-center gap-[30px]">
            <div className="flex gap-[35px] pr-[45px] nav_div">
              <div className='nav_icons'><i className="fa-regular fa-house text-[25px] text-black"></i></div>
              <div className='nav_icons'><i className="fa-regular fa-square-plus text-[25px] text-black" onClick={() => navigate("/articles")}></i></div>
              <div className='nav_icons'><i className="fa-regular fa-bell text-[25px] text-black" onClick={()=>navigate("/notification")}></i></div>
              <div className='nav_icons'>
                <img 
                  src={userPhoto} 
                  alt="User Profile" 
                  className="w-[25px] h-[25px] rounded-full object-cover border border-gray-400"
                  onClick={()=>navigate('/profile')}
                  onError={(e) => e.target.src = defaultImage}
                />
              </div>
              <div id='theme' className="border-2 border-black flex justify-center items-center h-[25px] w-[25px] rounded-full">
                <i className="fa-regular fa-moon text-[16px] text-black"></i>
              </div>
            </div>
          </aside>
        </nav>

        {/* Chat Modal */}
        {showChat && activeChat && (
          <div className="fixed bottom-4 right-4 w-80 h-96 bg-white rounded-2xl shadow-2xl z-[1000] border border-gray-300">
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-purple-500 rounded-t-2xl text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <img
                  src={getImageSrc(activeChat?.profilePhotoUrl || activeChat?.profilePhoto)}
                  alt={activeChat.username}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <span className="font-semibold">{activeChat.username}</span>
              </div>
              <button onClick={() => setShowChat(false)} className="text-white hover:text-gray-200">
                <i className="fa-solid fa-times"></i>
              </button>
            </div>
            
            <div ref={chatContainerRef} className="h-64 overflow-y-auto p-4 space-y-3">
              {chatLoading ? (
                <div className="text-center">Loading messages...</div>
              ) : chatMessages.length === 0 ? (
                <div className="text-center text-gray-500">No messages yet. Start a conversation!</div>
              ) : (
                chatMessages.map((message) => (
                  <div key={message._id} className={`flex ${message.senderId === currentUser?._id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs p-3 rounded-2xl ${message.senderId === currentUser?._id ? 'bg-blue-500 text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none'}`}>
                      <p>{message.content}</p>
                      <p className={`text-xs mt-1 ${message.senderId === currentUser?._id ? 'text-blue-100' : 'text-gray-500'}`}>
                        {formatTime(message.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="p-4 border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                  className="bg-blue-500 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-blue-600 disabled:opacity-50"
                >
                  <i className="fa-solid fa-paper-plane"></i>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Post Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[2600]">
            <div className="bg-white rounded-lg w-full max-w-2xl p-6 mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Create Article</h3>
                <button onClick={handleCloseCreateModal} className="text-gray-600 hover:text-gray-800">
                  <i className="fa-solid fa-times"></i>
                </button>
              </div>
              <form onSubmit={handleCreatePost} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={newPostTitle}
                    onChange={(e) => setNewPostTitle(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter a compelling title..."
                    maxLength={100}
                  />
                  <p className="text-xs text-gray-500 mt-1 text-right">{newPostTitle.length}/100</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                  <textarea
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 h-48 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Share your thoughts, ideas, or stories..."
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button 
                    type="button" 
                    onClick={handleCloseCreateModal}
                    className="px-6 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createPostLoading || !newPostTitle.trim() || !newPostContent.trim()}
                    className="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {createPostLoading ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Posting...
                      </span>
                    ) : (
                      'Post Article'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Chats Section */}
        <section id='chats' className="rounded-[10px] w-[95%] h-[23vh] relative top-[90px] left-[35px] flex bg-white shadow-[rgba(100,100,111,0.2)_0px_7px_29px_0px]">
          <aside id='group_mem' className="flex-[80%] pt-[4px] flex flex-col gap-[5px] overflow-y-auto">
            {friends.length === 0 ? (
              <div className="text-center p-4 text-gray-500">
                <i className="fa-regular fa-users text-2xl mb-2 opacity-50"></i>
                <p>No friends yet. Search for users to add friends!</p>
              </div>
            ) : (
              friends.map((friend) => (
                <div 
                  key={friend._id} 
                  className='mem border border-gray-300 h-[50px] w-[270px] rounded-[10px] relative top-[5px] left-[20px] pl-[8px] pt-[3px] flex cursor-pointer hover:bg-gray-50 transition-colors'
                  onClick={() => handleOpenChat(friend)}
                >
                  <aside id='profile_img' className="h-[40px] w-[40px] rounded-full flex-[16%]">
                    <img 
                      src={getImageSrc(friend.profilePhotoUrl || friend.profilePhoto)} 
                      alt={friend.username} 
                      className="border border-gray-400 rounded-full h-[40px] w-[40px] object-cover" 
                    />
                  </aside>
                  <aside id='name_msg' className="flex-[54%] h-[40px] flex flex-col pl-[5px]">
                    <h2 className="text-[15px] font-medium">{friend.username}</h2>
                    <p className="text-[12px] text-gray-500">Click to chat</p>
                  </aside>
                  <aside id='time' className="flex-[30%] h-[40px] flex justify-center items-center font-['Courier_New',Courier,monospace]">
                    <p className="text-green-500 text-sm">Online</p>
                  </aside>
                </div>
              ))
            )}
          </aside>
          <aside id='archive_aside' className="flex-[20%] flex items-center pt-[80px] pl-[120px]">
            <button 
              id='arch_btn' 
              className="rounded-[10px] px-[30px] py-[8px] font-semibold text-[18px] text-white bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 cursor-pointer hover:opacity-90 transition-opacity"
              onClick={()=>navigate("/chat")}
            >
              Archive
            </button>
          </aside>
        </section>

        {/* Create Post Section */}
        <section id='cpost' className="rounded-[10px] bg-white relative top-[105px] w-[95%] left-[35px] h-[8vh] flex items-center pl-[10px] shadow-[rgba(100,100,111,0.2)_0px_7px_29px_0px]">
          <img 
            src={userPhoto} 
            alt="User" 
            className="border border-gray-400 rounded-full h-[50px] w-[50px] object-cover" 
          />
          <input 
            type="text" 
            placeholder="What's on your mind?" 
            className="border-2 border-gray-300 w-[82%] pl-[15px] ml-[20px] h-[45px] rounded-[10px] cursor-pointer focus:outline-none focus:border-blue-500 transition-colors"
            onClick={handleInputClick}
            readOnly
          />
          <button 
            className="rounded-[10px] ml-[20px] px-[25px] py-[10px] text-white cursor-pointer bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transition-colors font-medium"
            onClick={handleInputClick}
          >
            Create Article
          </button>
        </section>

        {/* Main Content Section */}
        <section id='main_section' className="w-full h-full relative top-[120px] flex gap-6 px-6">
          {/* Profile Card */}
          <aside id='view_profile' className="h-full flex-[23%]">
            <div id='profile_card' className="flex justify-center items-center flex-col w-full h-[43vh] bg-white rounded-[15px] shadow-[rgba(149,157,165,0.2)_0px_8px_24px] p-6">
              <div className="h-[85px] w-[85px] flex justify-center items-center rounded-full mb-4">
                <img src={userPhoto} alt="Profile" className="border-2 border-gray-300 rounded-full h-full w-full object-cover" />
              </div>
              <h1 className="text-[25px] font-semibold text-black mb-1">{userName}</h1>
              <p className="italic text-gray-600 mb-6">{userEmail}</p>
              <div id='info' className="flex gap-6 mb-6 text-black">
                <aside className="flex justify-center items-center flex-col">
                  <h2 className="text-[20px] font-bold text-blue-600">{posts.length}</h2>
                  <p className="text-sm text-gray-600">Posts</p>
                </aside>
                <aside className="flex justify-center items-center flex-col">
                  <h2 className="text-[20px] font-bold text-purple-600">{friends.length}</h2>
                  <p className="text-sm text-gray-600">Followers</p>
                </aside>
                <aside className="flex justify-center items-center flex-col">
                  <h2 className="text-[20px] font-bold text-pink-600">{friends.length}</h2>
                  <p className="text-sm text-gray-600">Following</p>
                </aside>
              </div>
              <div 
                className="px-6 py-3 rounded-[10px] bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white cursor-pointer hover:opacity-90 transition-opacity font-medium"
                onClick={()=>navigate('/profile')}
              >
                <button>View Profile</button>
              </div>
            </div>
          </aside>

          {/* Posts Section */}
          <section id='middle_posts' className="flex flex-col flex-[52%] gap-6 h-[77vh] overflow-y-auto scrollbar-none overflow-x-hidden">
            {loading ? (
              <div className="flex justify-center items-center h-40 bg-white rounded-[15px] shadow-lg">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                <p className="ml-4 text-gray-600">Loading posts...</p>
              </div>
            ) : error ? (
              <div className="text-center p-8 bg-white rounded-[15px] shadow-lg">
                <i className="fa-solid fa-wifi text-4xl text-gray-400 mb-4"></i>
                <p className="text-gray-500 text-lg mb-4">Unable to load posts. Please check your connection.</p>
                <button 
                  onClick={() => dispatch(fetchPosts())}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center p-8 bg-white rounded-[15px] shadow-lg">
                <i className="fa-regular fa-file-lines text-4xl text-gray-400 mb-4"></i>
                <p className="text-gray-500 text-lg mb-4">No posts yet. Be the first to create a post!</p>
                <button 
                  onClick={handleInputClick}
                  className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition-opacity"
                >
                  Create First Post
                </button>
              </div>
            ) : (
              postsData.map(({ post, postId, userDisplayName, userProfilePhoto, hasLiked, likeCount, isLiking }) => (
                <article 
                  key={postId} 
                  className="bg-white rounded-[15px] shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <div className="p-6">
                    {/* Post Header */}
                    <div className="flex items-center gap-4 mb-4">
                      <img 
                        src={userProfilePhoto || userPhoto} 
                        alt={userDisplayName} 
                        className="w-12 h-12 rounded-full object-cover border border-gray-300" 
                        onError={(e) => e.target.src = userPhoto}
                      />
                      <div>
                        <h3 className="font-semibold text-gray-800">
                          {userDisplayName}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {post.createdAt ? formatTime(post.createdAt) : 'Recently'}
                        </p>
                      </div>
                    </div>

                    {/* Post Content */}
                    <div className="border border-gray-200 bg-gray-50 rounded-[12px] p-4 mb-4">
                      <h4 className="text-xl font-bold text-gray-800 mb-2">
                        {post.title || 'Untitled Post'}
                      </h4>
                      <p className="text-gray-700 leading-relaxed">
                        {post.content}
                      </p>
                    </div>

                    {/* Post Actions with Like Functionality */}
                    <div className="flex items-center gap-8 text-gray-600">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleToggleLike(postId); }}
                        disabled={!currentUser?._id || isLiking}
                        className={`flex items-center gap-2 transition-colors ${hasLiked ? 'text-red-500' : 'hover:text-red-500'} ${isLiking ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {isLiking ? (
                          <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <i className={`fa${hasLiked ? '-solid' : '-regular'} fa-heart`}></i>
                        )}
                        <span className={`font-medium ${hasLiked ? 'text-red-500' : ''}`}>
                          {likeCount > 0 ? likeCount : 'Like'}
                        </span>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleShowComments(postId); }}
                        className="flex items-center gap-2 hover:text-blue-500 transition-colors"
                      >
                        <i className="fa-regular fa-comment"></i>
                        <span>{post.comments?.length || 0}</span>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleOpenShare(postId); }}
                        className="flex items-center gap-2 hover:text-green-500 transition-colors"
                      >
                        <i className="fa-solid fa-share"></i>
                      </button>
                    </div>

                    {/* Comments Section */}
                    {commentsVisible[postId] > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h5 className="font-semibold text-gray-700 mb-3">Comments</h5>
                        <div className="space-y-3">
                          {(post.comments || []).slice(0, commentsVisible[postId]).map((comment, index) => {
                            const commentUserName = getCommentUserName(comment);
                            const commentUserPhoto = getCommentUserPhoto(comment);

                            return (
                              <div key={comment._id || index} className="flex gap-3 items-start">
                                <img 
                                  src={commentUserPhoto || userPhoto} 
                                  alt={commentUserName} 
                                  className="w-8 h-8 rounded-full object-cover flex-shrink-0" 
                                  onError={(e) => e.target.src = userPhoto}
                                />
                                <div className="flex-1">
                                  <p className="text-sm">
                                    <span className="font-semibold">{commentUserName}</span>{' '}
                                    {comment.content || comment.text || ''}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    {formatTime(comment.createdAt || comment.created_at || comment.date)}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {(post.comments || []).length > commentsVisible[postId] && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleShowMoreComments(postId); }}
                            className="text-blue-500 text-sm font-medium mt-2 hover:text-blue-600"
                          >
                            Show more comments
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              ))
            )}
          </section>

          {/* Suggestions Sidebar */}
          <aside id='suggestions' className="bg-white rounded-[15px] flex-[21%] h-min pb-6 shadow-lg">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                Suggestions
              </h2>
              <p className="text-gray-600 text-sm mt-1">People you may know</p>
            </div>

            <div className="p-4 space-y-3">
              {searchResults.slice(0, 4).map((user) => (
                <div key={user._id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <img 
                    src={getImageSrc(user.profilePhotoUrl || user.profilePhoto)} 
                    alt={user.username} 
                    className="w-12 h-12 rounded-full object-cover border border-gray-300"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 truncate">{user.username}</h3>
                    <p className="text-gray-500 text-sm truncate">3 mutual friends</p>
                  </div>
                  <button 
                    onClick={() => handleFriendRequest(user._id)}
                    disabled={user.friendStatus === 'requested' || friendRequestLoading}
                    className={`px-3 py-1 rounded-lg text-sm text-white transition-colors ${
                      user.friendStatus === 'requested' 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:opacity-90'
                    }`}
                  >
                    {user.friendStatus === 'requested' ? 'Sent' : 'Follow'}
                  </button>
                </div>
              ))}
              
              {searchResults.length === 0 && (
                <>
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                        <i className="fa-regular fa-user text-gray-400"></i>
                      </div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                        <div className="h-3 bg-gray-100 rounded w-16"></div>
                      </div>
                      <button className="px-3 py-1 rounded-lg text-sm bg-gray-200 text-gray-500 cursor-not-allowed">
                        Follow
                      </button>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Recent Activities */}
            <div className="mt-6 px-4">
              <h3 className="font-semibold text-gray-800 mb-3">Recent Activity</h3>
              <div className="space-y-3">
                {posts.slice(0, 3).map((post) => (
                  <div key={post._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <img 
                      src={getImageSrc(post.user?.profilePhotoUrl || post.user?.profilePhoto) || userPhoto} 
                      alt={post.user?.username || 'User'} 
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 truncate">
                        <span className="font-semibold">{getUserDisplayName(post)}</span> posted
                      </p>
                      <p className="text-xs text-gray-500">
                        {post.createdAt ? formatTime(post.createdAt) : 'Just now'}
                      </p>
                    </div>
                  </div>
                ))}
                {posts.length === 0 && (
                  <p className="text-gray-500 text-sm text-center p-4">No recent activity</p>
                )}
              </div>
            </div>
          </aside>
        </section>

        {/* Share Modal */}
        {showShareModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[2500]">
            <div className="bg-white rounded-lg w-full max-w-md mx-4">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold">Share Post</h3>
                <button 
                  onClick={() => { setShowShareModal(false); setSharePostId(null); }} 
                  className="text-gray-600 hover:text-gray-800"
                >
                  <i className="fa-solid fa-times"></i>
                </button>
              </div>
              <div className="max-h-72 overflow-y-auto p-4">
                {friends.length === 0 ? (
                  <div className="text-center py-8">
                    <i className="fa-regular fa-users text-3xl text-gray-400 mb-3"></i>
                    <p className="text-gray-500">No friends to share with.</p>
                  </div>
                ) : (
                  friends.map((friend) => (
                    <div key={friend._id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className="flex items-center gap-3">
                        <img 
                          src={getImageSrc(friend.profilePhotoUrl || friend.profilePhoto) || userPhoto} 
                          alt={friend.username} 
                          className="w-10 h-10 rounded-full object-cover" 
                        />
                        <div>
                          <div className="font-semibold">{friend.username}</div>
                          <div className="text-xs text-gray-500">{friend.email}</div>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleShareToUser(friend._id)} 
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                      >
                        Share
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
};

export default Home;