import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchPosts, createPost } from '../PostsSlice';
import { 
  searchUsers, 
  sendFriendRequest, 
  getFriends, 
  getChatMessages, 
  sendMessage,
  clearSearchResults,
  setActiveChat,
  closeSearchResults,
  addMessage
} from '../SearchSlice';

export const Home = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentUser } = useSelector((state) => state.auth);
  const { posts, loading, error, createPostLoading } = useSelector((state) => state.posts);
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
  
  const [showPostModal, setShowPostModal] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [postTitle, setPostTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [showChat, setShowChat] = useState(false);

  const searchRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Get user data
  const userPhoto = currentUser?.profilePhoto || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSnnA_0pG5u9vFP1v9a2DKaqVMCEL_0-FXjkduD2ZzgSm14wJy-tcGygo_HZX_2bzMHF8I&usqp=CAU";
  const userName = currentUser?.username || "User";
  const userEmail = currentUser?.email || "user@example.com";

  // Fetch data on component mount
  useEffect(() => {
    dispatch(fetchPosts());
    dispatch(getFriends());
  }, [dispatch]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        dispatch(closeSearchResults());
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dispatch]);

  // Scroll to bottom of chat when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Search functionality
  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.length > 2) {
      dispatch(searchUsers(query));
    } else {
      dispatch(clearSearchResults());
    }
  };

  // Friend request functionality
  const handleFriendRequest = async (userId) => {
    await dispatch(sendFriendRequest(userId));
  };

  // Chat functionality
  const handleOpenChat = async (friend) => {
    dispatch(setActiveChat(friend));
    setShowChat(true);
    await dispatch(getChatMessages(friend._id));
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !activeChat) return;

    const result = await dispatch(sendMessage({
      friendId: activeChat._id,
      message: messageInput.trim()
    }));

    if (result.type === 'search/sendMessage/fulfilled') {
      setMessageInput('');
    }
  };

  const handleCreatePost = async () => {
    if (!postContent.trim()) return;

    const result = await dispatch(createPost({
      title: postTitle.trim() || 'New Post',
      content: postContent.trim(),
      userId: currentUser?._id || currentUser?.id
    }));

    if (result.type === 'posts/createPost/fulfilled') {
      setPostContent('');
      setPostTitle('');
      setShowPostModal(false);
    }
  };

  const handleInputClick = () => {
    setShowPostModal(true);
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <>
      <main className="w-full overflow-scroll relative top-0 bg-gradient-to-b from-[rgb(151,222,246)] to-[rgb(210,137,228)]">
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
              
              {/* Search Results Dropdown */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-[10px] mt-1 shadow-lg max-h-60 overflow-y-auto z-50">
                  {searchResults.map((user) => (
                    <div key={user._id} className="p-3 border-b border-gray-200 hover:bg-gray-50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img 
                          src={user.profilePhoto || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSnnA_0pG5u9vFP1v9a2DKaqVMCEL_0-FXjkduD2ZzgSm14wJy-tcGygo_HZX_2bzMHF8I&usqp=CAU"} 
                          alt={user.username}
                          className="w-8 h-8 rounded-full object-cover"
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
              <div className='nav_icons'><i className="fa-regular fa-square-plus text-[25px] text-black" onClick={() => {navigate("/articles")}}></i></div>
              <div className='nav_icons'><i className="fa-regular fa-bell text-[25px] text-black" onClick={()=>{navigate("/notification")}}></i></div>
              <div className='nav_icons'>
                <img 
                  src={userPhoto} 
                  alt="User Profile" 
                  className="w-[25px] h-[25px] rounded-full object-cover border border-gray-400"
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
                  src={activeChat.profilePhoto || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSnnA_0pG5u9vFP1v9a2DKaqVMCEL_0-FXjkduD2ZzgSm14wJy-tcGygo_HZX_2bzMHF8I&usqp=CAU"} 
                  alt={activeChat.username}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <span className="font-semibold">{activeChat.username}</span>
              </div>
              <button 
                onClick={() => setShowChat(false)}
                className="text-white hover:text-gray-200"
              >
                <i className="fa-solid fa-times"></i>
              </button>
            </div>
            
            <div 
              ref={chatContainerRef}
              className="h-64 overflow-y-auto p-4 space-y-3"
            >
              {chatLoading ? (
                <div className="text-center">Loading messages...</div>
              ) : chatMessages.length === 0 ? (
                <div className="text-center text-gray-500">No messages yet. Start a conversation!</div>
              ) : (
                chatMessages.map((message) => (
                  <div
                    key={message._id}
                    className={`flex ${message.senderId === currentUser?._id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs p-3 rounded-2xl ${
                        message.senderId === currentUser?._id
                          ? 'bg-blue-500 text-white rounded-br-none'
                          : 'bg-gray-200 text-gray-800 rounded-bl-none'
                      }`}
                    >
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

        {/* Post Creation Modal (same as before) */}
        {showPostModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[2000] p-4">
            {/* ... post modal content ... */}
          </div>
        )}

        {/* Chats Section with Friends */}
        <section id='chats' className="rounded-[10px] w-[95%] h-[23vh] relative top-[90px] left-[35px] flex bg-white shadow-[rgba(100,100,111,0.2)_0px_7px_29px_0px]">
          <aside id='group_mem' className="flex-[80%] pt-[4px] flex flex-col gap-[5px] overflow-y-auto">
            {friends.length === 0 ? (
              <div className="text-center p-4 text-gray-500">
                No friends yet. Search for users to add friends!
              </div>
            ) : (
              friends.map((friend) => (
                <div 
                  key={friend._id} 
                  className='mem border border-black h-[50px] w-[270px] rounded-[10px] relative top-[5px] left-[20px] pl-[8px] pt-[3px] flex cursor-pointer hover:bg-gray-50'
                  onClick={() => handleOpenChat(friend)}
                >
                  <aside id='profile_img' className="h-[40px] w-[40px] rounded-full flex-[16%]">
                    <img 
                      src={friend.profilePhoto || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQonnb7k1iaYTAFlfztu7XfSXBRWpIZmOCkCg&s"} 
                      alt={friend.username} 
                      className="border border-gray-400 rounded-full h-[40px] w-[40px] object-cover" 
                    />
                  </aside>
                  <aside id='name_msg' className="flex-[54%] h-[40px] flex flex-col pl-[5px]">
                    <h2 className="text-[15px] font-medium">{friend.username}</h2>
                    <p className="text-[12px] text-gray-500">Click to chat</p>
                  </aside>
                  <aside id='time' className="flex-[30%] h-[40px] flex justify-center items-center font-['Courier_New',Courier,monospace]">
                    <p>Online</p>
                  </aside>
                </div>
              ))
            )}
          </aside>
          <aside id='archive_aside' className="flex-[20%] flex items-center pt-[80px] pl-[120px]">
            <button id='arch_btn' className="rounded-[10px] px-[30px] py-[8px] font-semibold text-[18px] text-white bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 cursor-pointer" onClick={()=>{navigate("/chat")}}>Archive</button>
          </aside>
        </section>

        {/* Rest of your existing sections remain the same */}
        <section id='cpost' className="rounded-[10px] bg-white relative top-[105px] w-[95%] left-[35px] h-[8vh] flex items-center pl-[10px]">
          <img src={userPhoto} alt="User" className="border border-gray-400 rounded-full h-[50px] w-[50px] object-cover" />
          <input 
            type="text" 
            placeholder="What's on your mind?" 
            className="border-2 border-gray-400 w-[82%] pl-[8px] ml-[20px] h-[40px] rounded-[10px] cursor-pointer"
            onClick={handleInputClick}
            readOnly
          />
          <button 
            className="rounded-[10px] ml-[20px] px-[25px] py-[8px] text-white cursor-pointer bg-gradient-to-r from-blue-500 to-purple-500"
            onClick={handleInputClick}
          >
            Create Post
          </button>
        </section>

        {/* ... rest of your home page sections ... */}

        
      </main>
    </>
  );
};