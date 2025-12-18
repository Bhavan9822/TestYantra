import React, { useState, useMemo, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {  useDispatch } from 'react-redux';
import { selectUnreadCount } from '../NotificationSlice';
import { sendFollowRequest } from '../SearchSlice';
import { logout } from '../Slice';
import { toast } from 'react-toastify';


const Profile = () => {
  const { currentUser } = useSelector((state) => state.auth || {});
  const [isDark, setIsDark] = useState(false);
  const dispatch = useDispatch();

  const followersCount = currentUser?.followers?.length || 0;
  const followingCount = currentUser?.following?.length || 0;

  const navigate = useNavigate();
  const unreadCount = useSelector(selectUnreadCount) || 0;

  const searchRef = useRef(null);
  const [inp,setinp]=useState("")

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
        const result = await dispatch(sendFollowRequest({ targetUsername: username })).unwrap();
        
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

  // Logout functionality
  const handleLogout = () => {
    // Dispatch Redux logout action (clears Redux state and localStorage)
    dispatch(logout());
    
    // Clear any additional localStorage items
    localStorage.removeItem('userId');
    localStorage.removeItem('profilePhoto');
  
    
    // Navigate to login page
    navigate('/', { replace: true });
  }

  // Get data from Redux store
  const { posts = [], loading = false, error = null, createPostLoading = false } = useSelector((state) => state.articles || {});
  // const {  
  //     friends = [], 
  //   } = useSelector((state) => state.search || {});


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

  // Fallback while loading
  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl text-gray-600">Loading profile...</p>
      </div>
    );
  }

  const userName = useMemo(() => currentUser?.username || "User", [currentUser]);

  const { displayName, email, photoURL, bio = 'No bio yet', interests = [] } = currentUser;

  // ✅ Filter to show only MY posts (not friends' posts)
  const myPosts = useMemo(() => {
    if (!currentUser?._id || !Array.isArray(posts)) return [];
    return posts.filter(post => {
      const authorId = post.author?._id || post.user?._id || post.postedBy?._id || post.userId;
      return authorId === currentUser._id;
    });
  }, [posts, currentUser]);
  
  // Prefer server-provided articles/posts on the user object. Normalize shapes.
  const userArticlesRaw = currentUser.articles || currentUser.posts || myPosts;
  const postsCount = myPosts.length;

  const articles = (Array.isArray(userArticlesRaw) ? userArticlesRaw : []).map((a, i) => {
    const id = a._id || a.id || a.slug || `article-${i}`;
    const title = a.title || a.heading || a.name || 'Untitled Article';
    const date = a.createdAt ? new Date(a.createdAt).toLocaleDateString() : (a.date || 'Unknown date');
    const author = (a.author && (a.author.username || a.author.name)) || displayName || 'Unknown';
    const initials = (author || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0,3);
    return { id, title, date, author, initials };
  });
  const toggleTheme = () => setIsDark((v) => !v);

  return (
     <main className="w-full overflow-scroll relative top-0 bg-gradient-to-b from-[rgb(151,222,246)] to-[rgb(210,137,228)] min-h-screen">
        <nav id='nav' className="fixed z-[1000] w-full h-[10vh] flex bg-white rounded-[5px] shadow-[rgba(0,0,0,0.45)_0px_25px_20px_-20px]">
          <aside id='as1' className="flex-[30%]">
            <h1 className="font-bold text-[35px] ml-[30px] mt-[12px] bg-gradient-to-r from-[rgb(0,98,255)] via-[rgb(128,0,119)] to-pink bg-clip-text text-transparent">SocialMedia</h1>
          </aside>
          <aside id='as2' className="flex-[30%] flex justify-center items-center relative" ref={searchRef}>
            <form action="" onSubmit={handelfollowsubmit} className='flex items-center gap-2 bg-gradient-to-r from-blue-50 to-purple-50 p-2 rounded-full border-2 border-gray-300 hover:border-blue-400 transition-colors'>
              <input 
                type="text"                 value={inp}                onChange={handelFollow} 
                placeholder='Search users...' 
                className='bg-transparent px-4 py-2 text-gray-700 placeholder-gray-400 focus:outline-none flex-1 min-w-0'
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

      {/* Profile Section */}
      <section className="flex flex-col items-center justify-center mt-35 px-4">
        <div
          className="rounded-full h-40 w-40 p-[15px] shadow-2xl"
          style={{
            background: 'linear-gradient(90deg, rgba(59,130,246,1.28), rgba(255,69,0,0.18), rgba(124,158,237,0.22), rgba(219,39,119,1.18))',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            border: '1px solid rgba(255,255,255,0.12)'
          }}
        >
          <img
            src={userPhoto}
            alt="Profile"
            className="w-32 h-32 rounded-full object-cover bg-white/40"
            onError={(e) => { e.target.onerror = null; e.target.src = defaultAvatar; }}
          />
        </div>

        <h1 className="text-3xl font-bold mt-4 text-gray-800 dark:text-white">
          {userName || "Your Name"}
        </h1>

        <p className="text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-5 py-2 rounded-full mt-2 text-sm">
          {email}
        </p>

        <div className="flex gap-3 mt-5 flex-wrap justify-center">
          {interests.length > 0 && interests.map((interest, i) => (
            <span key={i} className="bg-blue-100 dark:bg-blue-900/30 text-gray-700 dark:text-blue-300 px-4 py-1.5 rounded-full text-sm flex items-center gap-1">
              {interest}
            </span>
          ))}
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-8 mt-8">
          <div className="bg-white dark:bg-blue-500 shadow-lg w-28 h-24 rounded-2xl flex flex-col items-center justify-center">
            {/* ✅ Shows only MY posts count, not all posts */}
            <h3 className="font-bold text-2xl text-gray-800 dark:text-white">{myPosts.length}</h3>
            <p className="text-xs text-gray-600 dark:text-gray-200">Posts</p>
          </div>
          <div className="bg-white dark:bg-purple-600 shadow-lg w-28 h-24 rounded-2xl flex flex-col items-center justify-center">
            <h3 className="font-bold text-2xl text-gray-800 dark:text-white">{followersCount}</h3>
            <p className="text-xs text-gray-600 dark:text-gray-200">Followers</p>
          </div>
          <div className="bg-white dark:bg-pink-600 shadow-lg w-28 h-24 rounded-2xl flex flex-col items-center justify-center">
            <h3 className="font-bold text-2xl text-gray-800 dark:text-white">{followingCount}</h3>
            <p className="text-xs text-gray-600 dark:text-gray-200">Following</p>
          </div>
        </div>

        {/* Logout Button */}
        <div id='logout' className="flex justify-center mt-8">
          <button
            onClick={handleLogout}
            className="px-8 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-full hover:from-red-600 hover:to-red-700 transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center gap-2 shadow-lg"
          >
            <i className="fa-solid fa-right-from-bracket"></i>
            Logout
          </button>
        </div>

        {/* Articles Section */}
        <div className="w-full max-w-4xl mt-12 px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center justify-center gap-3">
              <span className="text-3xl">Articles</span>
            </h2>
          </div>

          <div className="space-y-4">
            {articles.map(article => (
              <div
                key={article.id}
                onClick={() => navigate(`/indarticle/${article.id}`)}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition flex items-center justify-between cursor-pointer"
              >
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-800 dark:text-white">
                    {article.title}
                  </h3>
                  <div className="flex items-center gap-3 mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {/* <span>{article.author}</span> */}
                    {/* <span>•</span> */}
                    <span>{article.date}</span>
                  </div>
                </div>
                <img 
                  src={userPhoto} 
                  alt={userName}
                  className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
                  onError={(e) => { e.target.onerror = null; e.target.src = defaultAvatar; }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};

export default Profile;