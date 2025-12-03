
import React, { useState, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectUnreadCount } from '../NotificationSlice';

const Profile = () => {
  const { currentUser } = useSelector((state) => state.auth || {});
  const [isDark, setIsDark] = useState(false);

  const navigate = useNavigate();
  const unreadCount = useSelector(selectUnreadCount) || 0;

  // Get data from Redux store
  const { posts = [], loading = false, error = null, createPostLoading = false } = useSelector((state) => state.articles || {});
  const {  
      friends = [], 
    } = useSelector((state) => state.search || {});


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

  const { displayName, email, photoURL, bio = 'No bio yet', interests = [], followers = 5700, following = 900 } = currentUser;

  // Prefer server-provided articles/posts on the user object. Normalize shapes.
  const userArticlesRaw = currentUser.articles || currentUser.posts || [];
  const postsCount = currentUser.postsCount ?? userArticlesRaw.length;

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
            <h3 className="font-bold text-2xl text-gray-800 dark:text-white">{posts.length}</h3>
            <p className="text-xs text-gray-600 dark:text-gray-200">Posts</p>
          </div>
          <div className="bg-white dark:bg-purple-600 shadow-lg w-28 h-24 rounded-2xl flex flex-col items-center justify-center">
            <h3 className="font-bold text-2xl text-gray-800 dark:text-white">{friends.length}</h3>
            <p className="text-xs text-gray-600 dark:text-gray-200">Followers</p>
          </div>
          <div className="bg-white dark:bg-pink-600 shadow-lg w-28 h-24 rounded-2xl flex flex-col items-center justify-center">
            <h3 className="font-bold text-2xl text-gray-800 dark:text-white">{friends.length}</h3>
            <p className="text-xs text-gray-600 dark:text-gray-200">Following</p>
          </div>
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
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition flex items-center justify-between"
              >
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-800 dark:text-white">
                    {article.title}
                  </h3>
                  <div className="flex items-center gap-3 mt-2 text-sm text-gray-600 dark:text-gray-400">
                    <span>{article.author}</span>
                    <span>•</span>
                    <span>{article.date}</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                  {article.initials}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};

export default Profile;