import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchArticleById, selectPostById, updatePostOptimistically, updateArticleLikes } from '../ArticlesSlice';
import { toggleLike, optimisticToggleLike, selectIsLiking } from '../LikeSlice';

import NotificationBell from './NotificationBell';
import { formatTime } from '../FormatTime';
import { sendFollowRequest } from '../SearchSlice';
import { toast } from 'react-toastify';



const IndArticle = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { articleId } = useParams();
  const searchRef = useRef(null);
  

  const [inp,setinp]=useState("")
  const [isMenuOpen, setIsMenuOpen] = useState(false)
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
  
  // Get data from Redux store - use stable selectors
  const currentUser = useSelector((state) => state.auth.currentUser);
  const currentArticle = useSelector((state) => state.articles.currentArticle);
  const articleLoading = useSelector((state) => state.articles.articleLoading);
  const articleError = useSelector((state) => state.articles.articleError);
  const commentLoading = useSelector((state) => state.articles.commentLoading);
  const commentError = useSelector((state) => state.articles.commentError);
  // Fallback: attempt to read the article from the posts list if currentArticle is not set
  const fallbackArticle = useSelector((state) => selectPostById(state, articleId));
  // Cache the last known article so that transient list refreshes or empty fetch
  // responses don't immediately show "Not Found". This keeps the UI stable.
  const cachedArticleRef = useRef(null);

  // Prefer the fetched currentArticle, fall back to list-derived article, then use cached
  const displayArticleCandidate = currentArticle || fallbackArticle;

  useEffect(() => {
    if (displayArticleCandidate) {
      cachedArticleRef.current = displayArticleCandidate;
    }
  }, [displayArticleCandidate]);

  const displayArticle = displayArticleCandidate || cachedArticleRef.current;
  
  // Local state
  const isLiking = useSelector((state) => selectIsLiking(state, articleId));

  // Static values
  const defaultImage = useMemo(() => "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23cbd5e1'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E", []);

  // Memoized helper functions
  const getImageSrc = useCallback((photo) => {
    if (!photo) return defaultImage;

    if (typeof photo === 'string') {
      if (photo.startsWith('data:image/') || photo.startsWith('http')) {
        return photo;
      }
      
      const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
      const cleanPhoto = photo.replace(/\s/g, '');
      
      if (cleanPhoto.length > 100 && base64Regex.test(cleanPhoto)) {
        return `data:image/jpeg;base64,${cleanPhoto}`;
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

  // Fetch article data when component mounts or articleId changes
  useEffect(() => {
    if (articleId) {
      console.log('Fetching article:', articleId);
      dispatch(fetchArticleById(articleId));
    }
  }, [articleId, dispatch]); // Only depend on articleId and dispatch

  // Memoized author data (use cached/fetched article)
  const author = useMemo(() => {
    const article = displayArticle;
    if (!article) return null;

    if (article.user && typeof article.user === 'object') 
      return article.user;
    if (article.author && typeof article.author === 'object') 
      return article.author;
    if (article.postedBy && typeof article.postedBy === 'object') 
      return article.postedBy;
    if (article.userId && typeof article.userId === 'object') 
      return article.userId;
    
    return null;
  }, [displayArticle]);

  const userPhoto = useMemo(() => {
    if (!author) return defaultImage;
    const photo = author.profilePhotoUrl || author.profilePhoto || author.avatar || author.image;
    return getImageSrc(photo);
  }, [author, defaultImage, getImageSrc]);

  const userName = useMemo(() => currentUser?.username || "User", [currentUser]);
  const userDisplayName = useMemo(() => {
    if (!author) return 'Anonymous';
    return `${userName}` || author.name || author.fullName || author.displayName || author.email || 'Anonymous';
  }, [author]);

  // Derive current user's photo for nav/profile icon using multiple possible fields
  const currentUserPhoto = useMemo(() => getImageSrc(
    currentUser?.profilePhoto ||
    currentUser?.profilePhotoUrl ||
    currentUser?.avatar ||
    currentUser?.image ||
    currentUser?.picture ||
    currentUser?.profilePic
  ), [currentUser, getImageSrc]);

  // Format date function
  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'Recently';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return 'Recently';
    }
  }, []);





  // Handle like/unlike for this article with optimistic UI
  const handleLikeClick = useCallback(async (e) => {
    e.stopPropagation();
    if (!currentUser?._id || !articleId || !displayArticle) return;

    const likedBy = displayArticle.likedBy || displayArticle.likes || [];
    const currentId = String(currentUser._id);
    const hasLiked = likedBy.some(x => {
      const id = typeof x === 'object' ? (x._id || x.id || x.userId) : x;
      return String(id) === currentId;
    });

    // Optimistic update: toggle like state
    const newLikedBy = hasLiked
      ? likedBy.filter(x => {
          const id = typeof x === 'object' ? (x._id || x.id || x.userId) : x;
          return String(id) !== currentId;
        })
      : [...likedBy, currentUser._id];

    dispatch(updateArticleLikes({
      articleId,
      likes: newLikedBy,
      likesCount: newLikedBy.length,
    }));

    dispatch(optimisticToggleLike({ articleId }));

    try {
      const result = await dispatch(toggleLike({
        articleId,
        userId: currentUser._id,
      })).unwrap();

      // Update with backend response article
      dispatch(updateArticleLikes({
        articleId,
        article: result.article,
      }));
    } catch (error) {
      console.error('Like update failed:', error);
      // Rollback to original state
      dispatch(updateArticleLikes({
        articleId,
        likes: likedBy,
        likesCount: likedBy.length,
      }));
    }
  }, [dispatch, currentUser, articleId, displayArticle]);

  // Resolve article owner id from various possible shapes
  const getArticleOwnerId = useCallback(() => {
    const article = displayArticle;
    if (!article) return null;

    // Prefer user-like objects on the article
    let userObj = null;
    if (article.user && typeof article.user === 'object') userObj = article.user;
    else if (article.author && typeof article.author === 'object') userObj = article.author;
    else if (article.postedBy && typeof article.postedBy === 'object') userObj = article.postedBy;
    else if (article.userId && typeof article.userId === 'object') userObj = article.userId;

    if (userObj) {
      return userObj._id || userObj.id || userObj.userId || null;
    }

    // Fallback to string/primitive ids if userObj not present
    const primitiveId =
      (typeof article.user === 'string' ? article.user : null) ||
      (typeof article.author === 'string' ? article.author : null) ||
      (typeof article.postedBy === 'string' ? article.postedBy : null) ||
      (article.userId && typeof article.userId !== 'object' ? article.userId : null) ||
      article.authorId || article.ownerId || (article.createdBy && (article.createdBy.id || article.createdBy)) ||
      null;

    return primitiveId;
  }, [displayArticle]);









  // Loading state — show spinner only when nothing (not even cached) to render
  if (articleLoading && !displayArticle) {
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
                <div className='nav_icons'><i className="fa-regular fa-house text-[25px] text-black" onClick={()=>navigate("/home")}></i></div>
                <div className='nav_icons'><i className="fa-regular fa-square-plus text-[25px] text-black" onClick={()=>navigate('/articles')}></i></div>
                <NotificationBell />
                <div className='nav_icons'>
                  <img
                    src={currentUserPhoto}
                    alt="User"
                    className="w-[30px] h-[30px] rounded-full object-cover border border-gray-400 cursor-pointer"
                    onClick={()=>navigate('/profile')}
                    onError={(e) => { e.target.onerror = null; e.target.src = defaultImage; }}
                  />
                </div>
              <div id='theme' className="border-2 border-black flex justify-center items-center h-[25px] w-[25px] rounded-full">
                <i className="fa-regular fa-moon text-[16px] text-black"></i>
              </div>
            </div>
          </aside>
        </nav>

        <div className="max-w-4xl mx-auto mt-8 px-6 pt-20">
          <div className="flex justify-center items-center h-96">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
            <p className="ml-4 text-xl text-gray-700">Loading article...</p>
          </div>
        </div>
      </main>
    );
  }

  // Error / Not Found state — only show when there's nothing to display
  if (!displayArticle && !articleLoading) {
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
              <div className='nav_icons'><i className="fa-regular fa-house text-[25px] text-black" onClick={()=>navigate("/home")}></i></div>
              <div className='nav_icons'><i className="fa-regular fa-square-plus text-[25px] text-black" onClick={()=>navigate('/articles')}></i></div>
              <NotificationBell />
              <div className='nav_icons'>
                <img
                  src={currentUserPhoto}
                  alt="User"
                  className="w-[25px] h-[25px] rounded-full object-cover border border-gray-400 cursor-pointer"
                  onClick={()=>navigate('/profile')}
                  onError={(e) => { e.target.onerror = null; e.target.src = defaultImage; }}
                />
              </div>
             
            </div>
          </aside>
        </nav>

        <div className="max-w-4xl mx-auto mt-8 px-6 pt-20">
          <button 
            onClick={() => navigate("/articles")}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold px-6 py-3 rounded-full hover:shadow-lg transition transform hover:-translate-y-1 mb-8"
          >
            ← Back to Articles
          </button>
          
          <div className="text-center py-16">
            <i className="fa-solid fa-exclamation-circle text-6xl text-gray-400 mb-4"></i>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Article Not Found</h2>
              <p className="text-gray-600 mb-6">
                {articleError || "The article you're looking for doesn't exist or has been removed."}
              </p>
            <button 
              onClick={() => navigate("/articles")}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Browse All Articles
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full overflow-scroll relative top-0 bg-gradient-to-b from-[rgb(151,222,246)] to-[rgb(210,137,228)] min-h-screen" id='main'>
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
              <i className="fa-regular fa-house text-[20px] md:text-[25px] text-black" onClick={()=>navigate("/home")}></i>
            </div>
            <div className='nav_icons cursor-pointer hidden md:block'>
              <i 
                className="fa-regular fa-square-plus text-[20px] md:text-[25px] text-black" 
                onClick={() => navigate("/articles")}
              ></i>
            </div>
            <NotificationBell className="hidden md:block" />
            <div className='nav_icons cursor-pointer hidden md:block'>
              <img 
                src={currentUserPhoto}
                alt="User Profile" 
                className="w-7 h-7 md:w-[30px] md:h-[30px] rounded-full object-cover border border-gray-400"
                onClick={()=>navigate('/profile')}
                onError={(e) => { e.target.onerror = null; e.target.src = defaultImage; }}
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
                  src={currentUserPhoto}
                  alt="Me"
                  className="w-5 h-5 rounded-full object-cover border border-gray-300"
                  onError={(e) => { e.target.onerror = null; e.target.src = defaultImage; }}
                />
                <span className="text-sm">Profile</span>
              </button>
            </div>
          )}
        </aside>
      </nav>

      <div className="max-w-4xl mx-auto mt-8 px-6 pt-20" id='div_indarticle'>
        <button 
          onClick={() => navigate("/articles")}
          className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold px-6 py-3 rounded-full hover:shadow-lg transition transform hover:-translate-y-1 mb-8"
        >
          ← Back to Articles
        </button>

        <h1 className="text-5xl font-extrabold text-gray-900 leading-tight mb-6">
          {displayArticle?.title || 'Untitled Article'}
        </h1>

        <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-md">
              <img 
                src={userPhoto} 
                alt={userDisplayName}
                className="w-full h-full object-cover"
                onError={(e) => e.target.src = defaultImage}
              />
            </div>
            <div>
              <p className="font-bold text-gray-800">{userDisplayName}</p>
              <p className="text-gray-500">
                {formatDate(displayArticle?.createdAt || displayArticle?.created_at)}
                {displayArticle?.updatedAt !== displayArticle?.createdAt && 
                  ` • Updated ${formatDate(displayArticle?.updatedAt)}`
                }
              </p>
            </div>
          </div>
          {/* Engagement: Like */}
          <div className="flex items-center space-x-3 text-gray-600">
            {(() => {
              const likedBy = displayArticle?.likedBy || displayArticle?.likes || [];
              const currentId = String(currentUser?._id || '');
              const hasLiked = likedBy.some(x => {
                const id = typeof x === 'object' ? (x._id || x.id || x.userId) : x;
                return String(id) === currentId;
              });
              const likeCount = (displayArticle?.likeCount ?? displayArticle?.likesCount ?? likedBy.length ?? 0);
              return (
                <button
                  onClick={handleLikeClick}
                  disabled={isLiking}
                  className={`like-button flex items-center gap-2 transition-all duration-200 ${
                    hasLiked ? 'text-red-500' : 'text-gray-600'
                  } hover:text-red-500 cursor-pointer ${hasLiked ? 'animate-heart-like' : ''}`}
                  style={{ opacity: isLiking ? 0.6 : 1 }}
                >
                  <i className={`fa${hasLiked ? '-solid' : '-regular'} fa-heart text-xl`}></i>
                  <span className="font-medium">{likeCount}</span>
                </button>
              );
            })()}
          </div>
        </div>

        <article className="prose prose-lg max-w-none text-gray-700 mb-12">
            <div className="text-lg leading-8 whitespace-pre-wrap">
            {displayArticle?.content}
          </div>
        </article>
      </div>
    </main>
  );
};

export default IndArticle;