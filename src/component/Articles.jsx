// Articles.jsx
import React, { useEffect, useCallback, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchPosts, fetchPostById, updateArticleLikes } from '../ArticlesSlice'
import { toggleLike, optimisticToggleLike, selectIsLiking } from '../LikeSlice'
import { useLocation } from 'react-router-dom'
import { useState } from 'react'
import { formatTime } from '../FormatTime'
import NotificationBell from './NotificationBell'
import { sendFollowRequest } from '../SearchSlice';

// ArticleCard component to properly use hooks
const ArticleCard = ({ post, postId, userDisplayName, userProfilePhoto, userInitials, userPhoto, defaultImage, currentUser, handleLikeClick, setSelectedPostId }) => {
  // Derive isLiked from article.likedBy instead of manually toggling
  const likedBy = post.likedBy || post.likes || [];
  const currentId = String(currentUser?._id || '');
  const hasLiked = likedBy.some(x => {
    const id = typeof x === 'object' ? (x._id || x.id || x.userId) : x;
    return String(id) === currentId;
  });
  const likeCount = post.likeCount ?? post.likesCount ?? likedBy.length ?? 0;
  const isLiking = useSelector((state) => selectIsLiking(state, postId));

  return (
    <div 
      className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer border border-gray-200"
      onClick={() => setSelectedPostId(postId)}
    >
      {/* Article Header with Gradient */}
      <div className="h-48 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors"></div>
        <div className="absolute bottom-4 left-6 right-6">
          <h2 className="text-xl font-bold text-white line-clamp-2 drop-shadow-lg">
            {post.title || 'Untitled Article'}
          </h2>
        </div>
      </div>

      {/* Article Content */}
      <div className="p-6">
        <p className="text-gray-700 leading-relaxed mb-4 line-clamp-3 min-h-[72px]">
          {post.content || 'No content available'}
        </p>

        {/* Author Info */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <img 
                src={`${userProfilePhoto}` || `${userPhoto}` || `${defaultImage}`}
                alt={userDisplayName}
                className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                onError={(e) => { e.target.onerror = null; e.target.src = userPhoto || defaultImage; }}
              />
              <div 
                className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-xs border-2 border-white shadow-sm"
                style={{ display: 'none' }}
              >
                {userInitials}
              </div>
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">{userDisplayName}</p>
              <p className="text-gray-500 text-xs">
                {post.createdAt ? formatTime(post.createdAt) : 'Recently'}
              </p>
            </div>
          </div>
          
          {/* Engagement Stats */}
          <div className="flex items-center space-x-3 text-gray-500">
            <button
              onClick={(e) => handleLikeClick(e, post)}
              disabled={isLiking}
              className={`like-button flex items-center gap-1 text-sm transition-all duration-200 ${
                hasLiked ? 'text-red-500' : 'text-gray-500'
              } hover:text-red-500 cursor-pointer ${hasLiked ? 'animate-heart-like' : ''}`}
              style={{ opacity: isLiking ? 0.6 : 1 }}
            >
              <i className={`fa${hasLiked ? '-solid' : '-regular'} fa-heart`}></i>
              <span>{likeCount}</span>
            </button>
            <div className="flex items-center space-x-1 text-sm">
              <i className="far fa-comment text-gray-500"></i>
              <span className="text-gray-600">{post.comments?.length || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hover Effect */}
      <div className="h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
    </div>
  );
};

const Articles = () => {
  let navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentUser } = useSelector((state) => state.auth);
  const defaultImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23cbd5e1'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E";

  const [inp,setinp]=useState("")
  const searchRef = useRef(null);
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

  // Enhanced image helper function (declare before use to avoid TDZ)
  const getImageSrc = useCallback((photo) => {
    if (!photo) return defaultImage;

    if (typeof photo === 'string') {
      const s = photo.trim();
      if (!s) return defaultImage;

      if (s.startsWith('data:image/')) return s;
      if (s.startsWith('http') || s.startsWith('blob:') || s.startsWith('/')) return s;

      // If it's a Base64 string without data URL prefix
      const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
      const cleanPhoto = s.replace(/\s/g, '');
      if (cleanPhoto.length > 100 && base64Regex.test(cleanPhoto)) {
        return `data:image/jpeg;base64,${cleanPhoto}`;
      }

      // Last resort: return as-is (handles relative server paths)
      return s;
    }

    // If photo is an object (from database)
    try {
      // Common Cloudinary / upload fields
      if (photo.url || photo.secure_url || photo.location || photo.path) {
        const url = photo.url || photo.secure_url || photo.location || photo.path;
        if (typeof url === 'string' && url.trim()) return url.trim();
      }

      // Some backends serialize Buffers as { data: { data: [...] } }
      const maybeData = photo.data || photo.buffer || photo._data || photo.dataBuffer;
      const raw = maybeData && (maybeData.data || maybeData);
      if (raw && (raw instanceof Uint8Array || Array.isArray(raw))) {
        const bytes = raw instanceof Uint8Array ? raw : Uint8Array.from(raw);
        const binary = bytes.reduce((acc, byte) => acc + String.fromCharCode(byte), '');
        const b64 = btoa(binary);
        return `data:image/jpeg;base64,${b64}`;
      }

      // Handle nested case: photo.data.data (Mongoose Buffer serialization)
      if (photo.data && photo.data.data && (Array.isArray(photo.data.data) || photo.data.data instanceof Uint8Array)) {
        const arr = photo.data.data instanceof Uint8Array ? photo.data.data : Uint8Array.from(photo.data.data);
        const binary = arr.reduce((acc, byte) => acc + String.fromCharCode(byte), '');
        const b64 = btoa(binary);
        return `data:image/jpeg;base64,${b64}`;
      }
    } catch (e) {
      console.warn('Failed to process image object:', e);
    }

    return defaultImage;
  }, []);

  // Derive a robust current user photo similar to Home.jsx
  const userPhoto = useMemo(() => getImageSrc(
    currentUser?.profilePhoto ||
    currentUser?.profilePhotoUrl ||
    currentUser?.avatar ||
    currentUser?.image ||
    currentUser?.picture ||
    currentUser?.profilePic
  ), [currentUser, getImageSrc]);
  
  const { posts = [], loading = false, error = null } = useSelector((state) => state.articles || {});
  
  const location = useLocation();
  const newPostFromNav = location?.state?.newPost;
  const [fetchedNewPost, setFetchedNewPost] = useState(null);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    console.log('Articles: Fetching posts on mount');
    dispatch(fetchPosts());
  }, [dispatch]);

  // If navigation passed a newPost which might not yet be in the list, fetch it by id
  useEffect(() => {
    let mounted = true;
    const id = newPostFromNav?._id || newPostFromNav?.id;
    
    if (id) {
      console.log('Articles: Fetching specific post by ID:', id);
      dispatch(fetchPostById(id)).then((res) => {
        if (!mounted) return;
        
        if (res.error) {
          console.warn('Articles: fetchPostById rejected', res.error);
          const status = res.error?.message || '';
          if (String(res.error).toLowerCase().includes('404') || String(res.error).toLowerCase().includes('not found')) {
            setFetchedNewPost(newPostFromNav);
          }
          return;
        }

        const payload = res.payload || null;
        const post = payload?.post || payload?.article || payload;
        if (post) {
          console.log('Articles: Successfully fetched post', post);
          setFetchedNewPost(post);
        } else {
          console.log('Articles: No post in payload, using nav state');
          setFetchedNewPost(newPostFromNav);
        }
      }).catch((e) => {
        console.warn('Articles: fetchPostById unexpected error', e);
        if (!mounted) return;
        setFetchedNewPost(newPostFromNav);
      });
    }
    return () => { mounted = false };
  }, [dispatch, newPostFromNav]);

  // When a post is selected (via click), navigate in an effect
  useEffect(() => {
    if (!selectedPostId) return;

    // perform navigation and then clear the selection
    navigate(`/indarticle/${selectedPostId}`);
    setSelectedPostId(null);
  }, [selectedPostId, navigate]);


  // Enhanced helper to get user data from post with better debugging
  const getUserFromPost = useCallback((post) => {
    console.log('Post user data structure:', {
      postId: post._id || post.id,
      user: post.user,
      author: post.author,
      postedBy: post.postedBy,
      fullPost: post
    });

    // Try different possible user data structures with nested checks
    if (post.user) {
      if (typeof post.user === 'object') {
        return post.user;
      }
    }
    
    if (post.author) {
      if (typeof post.author === 'object') {
        return post.author;
      }
    }
    
    if (post.postedBy) {
      if (typeof post.postedBy === 'object') {
        return post.postedBy;
      }
    }

    // Check for nested user structures
    if (post.userId && typeof post.userId === 'object') {
      return post.userId;
    }

    // If no user object found, return empty object
    return {};
  }, []);

  // Helper to get article owner ID
  const getArticleOwnerId = useCallback((post) => {
    const user = getUserFromPost(post);
    if (!user) return null;
    
    if (typeof user === 'string') return user;
    return user._id || user.id || user.userId || null;
  }, [getUserFromPost]);

  // Enhanced helper to get user's display name with multiple fallbacks
  const getUserDisplayName = useCallback((post) => {
    const user = getUserFromPost(post);
    
    console.log('User object for display name:', user);

    const userName = currentUser?.username || "User";
    // Try multiple possible username fields
    const username = `${userName}` || user.name || user.fullName || user.displayName || user.email;
    
    if (username) {
      return username;
    }

    // If no username found, check if user is a string (ID)
    if (typeof post.user === 'string' || typeof post.author === 'string' || typeof post.postedBy === 'string') {
      return 'User';
    }

    // Final fallback
    return 'Unknown';
  }, [currentUser, getUserFromPost]);

  // Enhanced helper to get user's profile photo — check many possible shapes
  const getUserProfilePhoto = useCallback((post) => {
    const user = getUserFromPost(post) || {};

    // Check common direct fields on the user object first
    const tryFields = [
      user.userProfilePhoto,
      user.userProfilePhotoUrl,
      user.profilePhoto,
      user.profilePhotoUrl,
      user.profile?.photo,
      user.profile?.photoURL,
      user.profile?.avatar,
      user.avatar,
      user.image,
      user.picture,
      user.profilePic,
      user.photoURL,
      user.photo,
      user.pictureUrl,
    ];

    for (const candidate of tryFields) {
      if (candidate) {
        const src = getImageSrc(candidate);
        if (src && src !== defaultImage) return src;
      }
    }

    // Check common upload response shapes on the user (Cloudinary-like)
    const urlFields = user.url || user.secure_url || user.location || user.path;
    if (urlFields && typeof urlFields === 'string') return urlFields;

    // Also accept article-level fields that some APIs attach directly to the post
    const postLevel = post.profilePhoto || post.userProfilePhoto || post.authorProfilePhoto || post.profile?.photo;
    if (postLevel) {
      const src = getImageSrc(postLevel);
      if (src && src !== defaultImage) return src;
    }

    // As last resort, fall back to the normalized userPhoto for the logged-in user
    return getImageSrc(user.profilePhoto || user.profilePhotoUrl || user.avatar || user.image || user.picture || user.photo || defaultImage);
  }, [getUserFromPost, getImageSrc]);

  // Filter to show only the logged-in user's posts
  const myPosts = useMemo(() => {
    if (!currentUser?._id || !Array.isArray(posts)) return [];
    return posts.filter((post) => {
      const authorId = 
        post.author?._id || 
        post.user?._id || 
        post.postedBy?._id || 
        post.userId;
      return authorId === currentUser._id;
    });
  }, [posts, currentUser]);

  // Combine posts for display (only user's own posts)
  const topPost = fetchedNewPost || newPostFromNav || null;
  const combinedPosts = useMemo(() => 
    topPost
      ? [topPost, ...myPosts.filter(p => (p._id || p.id) !== (topPost._id || topPost.id))]
      : myPosts,
    [topPost, myPosts]
  );

  // Handle like/unlike for articles
  const handleLikeClick = useCallback(async (e, post) => {
    e.stopPropagation();
    
    if (!currentUser?._id) {
      toast.error('Please login to like articles');
      navigate('/login');
      return;
    }

    const articleId = post._id || post.id;
    const likedBy = post.likedBy || post.likes || [];
    const currentId = String(currentUser._id);
    const hasLiked = likedBy.some(x => {
      const id = typeof x === 'object' ? (x._id || x.id || x.userId) : x;
      return String(id) === currentId;
    });
    
    // OPTIMISTIC UPDATE: toggle like state
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
      console.error('Like failed:', error);
      // Rollback to original state
      dispatch(updateArticleLikes({
        articleId,
        likes: likedBy,
        likesCount: likedBy.length,
      }));
    }
  }, [dispatch, currentUser, navigate]);



  // Debug: Log the first post to see its structure
  useEffect(() => {
    if (posts.length > 0) {
      console.log('First post structure for debugging:', posts[0]);
      console.log('User from first post:', getUserFromPost(posts[0]));
      console.log('Display name from first post:', getUserDisplayName(posts[0]));
    }
  }, [posts, getUserFromPost, getUserDisplayName]);

  return (
    <main className="w-full overflow-scroll relative top-0 bg-gradient-to-b from-[rgb(151,222,246)] to-[rgb(210,137,228)]" id='main'>
      <nav id='nav' className="fixed z-[1000] w-full h-auto md:h-[10vh] md:flex items-center bg-white rounded-[5px] shadow-[rgba(0,0,0,0.45)_0px_25px_20px_-20px] px-3 md:px-0 gap-2 md:gap-0 grid grid-cols-[auto_1fr_auto] grid-rows-1 py-1">
        <aside id='as1' className="col-span-1 row-start-1 col-start-1 min-w-0 md:flex-[30%] flex items-center">
          <h1 className="font-bold text-[20px] md:text-[35px] ml-2 md:ml-[30px] mt-0 md:mt-[12px] leading-none tracking-tight bg-gradient-to-r from-[rgb(0,98,255)] via-[rgb(128,0,119)] to-pink bg-clip-text text-transparent truncate max-w-[160px] md:max-w-none">SocialMedia</h1>
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
              <i className="fa-regular fa-house text-[20px] md:text-[25px] text-black" onClick={()=>navigate('/home')}></i>
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
                src={userPhoto}
                alt="User Profile" 
                className="w-7 h-7 md:w-[30px] md:h-[30px] rounded-full object-cover border border-gray-400"
                onClick={() => navigate('/profile')}
                onError={(e) => { e.target.onerror = null; e.target.src = getImageSrc(null); }}
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
                  alt="Me"
                  className="w-5 h-5 rounded-full object-cover border border-gray-300"
                  onError={(e) => { e.target.onerror = null; e.target.src = getImageSrc(null); }}
                />
                <span className="text-sm">Profile</span>
              </button>
            </div>
          )}
        </aside>
      </nav>

      {/* Main Content */}
      <div className="pt-24 pb-8 px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4 drop-shadow-lg">All Articles</h1>
          <p className="text-white/90 text-lg max-w-2xl mx-auto">
            Discover inspiring articles, insights, and perspectives from our vibrant community
          </p>
        </div>

        {/* Articles Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-4"></div>
              <p className="text-white text-xl">Loading articles...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-red-200 p-8 text-center max-w-md mx-auto">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-exclamation-triangle text-red-600 text-xl"></i>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to load articles</h3>
            <p className="text-gray-600 mb-4 text-sm">{String(error)}</p>
            <button
              onClick={() => dispatch(fetchPosts())}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-lg hover:opacity-90 transition-opacity"
            >
              Try Again
            </button>
          </div>
        ) : combinedPosts.length === 0 ? (
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl border-2 border-dashed border-white/30 p-12 text-center">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fa-regular fa-pen-to-square text-white text-3xl"></i>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">No articles yet</h3>
            <p className="text-white/80 mb-8 max-w-md mx-auto">
              Be the first to share your story and inspire the community with your unique perspective.
            </p>
            <button 
              onClick={() => navigate('/home')}
              className="bg-white text-purple-600 px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
            >
              Start Writing
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {combinedPosts.map((post) => {
              const userDisplayName = getUserDisplayName(post);
              const userProfilePhoto = getUserProfilePhoto(post);
              const userInitials = userDisplayName.slice(0, 2).toUpperCase();
              const postId = post._id || post.id;
              
              return (
                <ArticleCard
                  key={postId}
                  post={post}
                  postId={postId}
                  userDisplayName={userDisplayName}
                  userProfilePhoto={userProfilePhoto}
                  userInitials={userInitials}
                  userPhoto={userPhoto}
                  defaultImage={defaultImage}
                  currentUser={currentUser}
                  handleLikeClick={handleLikeClick}
                  setSelectedPostId={setSelectedPostId}
                />
              );
            })}
          </div>
        )}

        {/* Load More Section */}
        {combinedPosts.length > 0 && (
          <div className="text-center mt-12">
            <button 
              onClick={() => dispatch(fetchPosts())}
              className="bg-white/20 backdrop-blur-sm text-white px-8 py-3 rounded-lg border border-white/30 hover:bg-white/30 transition-all duration-300 font-medium inline-flex items-center space-x-2 hover:shadow-lg"
            >
              <i className="fa-solid fa-arrows-rotate"></i>
              <span>Load More Articles</span>
            </button>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button 
        onClick={() => navigate('/home')}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 z-50 flex items-center justify-center"
      >
        <i className="fa-solid fa-plus text-lg"></i>
      </button>
    </main>
  );
}

export default Articles;