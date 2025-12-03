import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchArticleById, selectPostById, updatePostOptimistically } from '../ArticlesSlice';
import { fetchComments, postComment, selectCommentsForArticle, selectCommentsMeta } from '../CommentSlice';
import { optimisticToggleLike, selectArticleLikes, selectIsLiking, addLike, removeLike } from '../LikeSlice';
import { addLikeNotification, addCommentNotification } from '../NotificationSlice'; // Import notification actions
import NotificationBell from './NotificationBell';
import { formatTime } from '../FormatTime';

const IndArticle = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { articleId } = useParams();
  
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
  
  // Get like state for this article
  const likeState = useSelector((state) => selectArticleLikes(state, articleId));
  const isLiking = useSelector((state) => selectIsLiking(state, articleId));
  
  // Local state
  const [commentInput, setCommentInput] = useState('');
  const [showComments, setShowComments] = useState(true);
  const [localLikeState, setLocalLikeState] = useState({
    hasLiked: false,
    count: 0,
    isUpdating: false
  });

  // Static values
  const defaultImage = useMemo(() => "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSnnA_0pG5u9vFP1v9a2DKaqVMCEL_0-FXjkduD2ZzgSm14wJy-tcGygo_HZX_2bzMHF8I&usqp=CAU", []);

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

  // Update local like state when Redux likeState changes
  useEffect(() => {
    if (!likeState) return;

    const newHasLiked = Boolean(likeState.isLikedByUser);
    const newCount = Number(likeState.count || 0);

    setLocalLikeState(prev => {
      if (prev.hasLiked === newHasLiked && prev.count === newCount && !prev.isUpdating) {
        return prev;
      }
      return {
        hasLiked: newHasLiked,
        count: newCount,
        isUpdating: false
      };
    });

    // Mirror like state into the articles list/currentArticle so other views update
    try {
      const likesArray = Array.isArray(likeState.likes) ? likeState.likes : [];
      dispatch(updatePostOptimistically({ articleId, postData: { likes: likesArray } }));
    } catch (e) {
      console.warn('Failed to mirror like state to articles slice', e);
    }
  }, [likeState, dispatch, articleId]); // Depend on dispatch and articleId for safety

  // Update local like state when article data changes (use fetched article or fallback)
  useEffect(() => {
    const source = displayArticle;
    if (source && currentUser?._id && !localLikeState.isUpdating) {
      const hasLiked = source.likes?.some(like => 
        like === currentUser._id || 
        (like && (like.userId === currentUser._id || like._id === currentUser._id || like.id === currentUser._id))
      ) || false;
      
      const count = source.likes?.length || 0;
      
      setLocalLikeState(prev => {
        if (prev.hasLiked === hasLiked && prev.count === count) {
          return prev;
        }
        return {
          ...prev,
          hasLiked,
          count
        };
      });
    }
  }, [displayArticle, currentUser?._id, localLikeState.isUpdating]); // Controlled dependencies

  // Helper to get article owner ID
  const getArticleOwnerId = useCallback(() => {
    if (!displayArticle) return null;
    
    const user = displayArticle.user || displayArticle.author || displayArticle.postedBy || displayArticle.userId;
    if (!user) return null;
    
    if (typeof user === 'string') return user;
    return user._id || user.id || user.userId || null;
  }, [displayArticle]);

  // Handle like functionality with notifications
  const handleLikeToggle = useCallback(async () => {
    if (!currentUser?._id) {
      alert('Please login to like articles');
      navigate('/login');
      return;
    }

    if (!articleId || !displayArticle) return;

    const prev = { ...localLikeState };
    const newLiked = !prev.hasLiked;
    const newCount = Math.max(0, prev.count + (newLiked ? 1 : -1));

    // Get article owner ID
    const articleOwnerId = getArticleOwnerId();
    const isOwnArticle = articleOwnerId === currentUser._id;

    // Optimistic update (local)
    setLocalLikeState({
      hasLiked: newLiked,
      count: newCount,
      isUpdating: true
    });

    try {
      // Normalize current likes to array of userIds for optimistic reducer
      const currentLikesRaw = (displayArticle && displayArticle.likes) ? displayArticle.likes : [];
      const currentLikes = Array.isArray(currentLikesRaw)
        ? currentLikesRaw.map(l => (typeof l === 'string' ? l : (l.userId || l._id || l.id || l)))
        : [];

      // Determine whether we currently (according to redux or article) think user has liked
      const currentlyLiked = (likeState && typeof likeState.isLikedByUser !== 'undefined')
        ? Boolean(likeState.isLikedByUser)
        : (displayArticle && Array.isArray(displayArticle.likes) && displayArticle.likes.some(l => (typeof l === 'string' ? l === currentUser._id : (l.userId === currentUser._id || l._id === currentUser._id || l.id === currentUser._id))));

      dispatch(optimisticToggleLike({ 
        articleId, 
        userId: currentUser._id,
        currentLikes 
      }));

      if (currentlyLiked) {
        const res = await dispatch(removeLike({ articleId, userId: currentUser._id }));
        if (res.type && !res.type.endsWith('/fulfilled')) {
          // revert
          setLocalLikeState({ hasLiked: prev.hasLiked, count: prev.count, isUpdating: false });
          // alert('Failed to unlike. Please try again.');
        }
      } else {
        const res = await dispatch(addLike({ 
          articleId, 
          userId: currentUser._id,
          articleOwnerId: articleOwnerId,
          articleTitle: displayArticle.title || 'Your article',
          currentUserName: currentUser.username || currentUser.name || 'Someone'
        }));
        
        if (res.type && res.type.endsWith('/fulfilled')) {
          // Create notification only if liking someone else's article
          if (!isOwnArticle && res.payload?._shouldCreateNotification) {
            dispatch(addLikeNotification({
              actor: currentUser._id,
              targetId: articleId,
              actorName: currentUser.username || currentUser.name || 'Someone',
              articleTitle: displayArticle.title || 'Your article'
            }));
          }
        } else {
          setLocalLikeState({ hasLiked: prev.hasLiked, count: prev.count, isUpdating: false });
          // alert('Failed to like. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      // Revert on error
      setLocalLikeState({
        hasLiked: prev.hasLiked,
        count: prev.count,
        isUpdating: false
      });
      alert('An error occurred. Please try again.');
    }
  }, [articleId, currentUser, localLikeState, displayArticle, dispatch, navigate, getArticleOwnerId, likeState]);

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

  const userDisplayName = useMemo(() => {
    if (!author) return 'Anonymous';
    return author.username || author.name || author.fullName || author.displayName || author.email || 'Anonymous';
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

  // Toggle comments visibility
  const toggleComments = useCallback(() => {
    setShowComments(prev => !prev);
  }, []);

  // Handle comment input change
  const handleCommentChange = useCallback((e) => {
    setCommentInput(e.target.value);
  }, []);

  // Comments from comments slice (paginated)
  const comments = useSelector((state) => selectCommentsForArticle(state, articleId));
  const commentsMeta = useSelector((state) => selectCommentsMeta(state, articleId));

  // Load first page of comments when comments panel is opened or article changes
  useEffect(() => {
    if (!articleId) return;
    if (showComments) {
      dispatch(fetchComments({ articleId, page: 1, perPage: 5 }));
    }
  }, [articleId, showComments, dispatch]);

  const handleReadMore = useCallback(() => {
    const nextPage = (commentsMeta.page || 0) + 1;
    dispatch(fetchComments({ articleId, page: nextPage, perPage: commentsMeta.perPage || 5 }));
  }, [articleId, commentsMeta, dispatch]);

  // Handle comment submission with notifications
  const handleSubmitComment = useCallback(async (e) => {
    e.preventDefault();
    if (!commentInput.trim() || !currentUser?._id || !articleId || !displayArticle) {
      alert('Please enter a comment');
      return;
    }

    // Get article owner ID
    const articleOwnerId = getArticleOwnerId();
    const isOwnArticle = articleOwnerId === currentUser._id;

    try {
      const result = await dispatch(postComment({ 
        articleId, 
        content: commentInput.trim(),
        articleOwnerId: articleOwnerId,
        articleTitle: displayArticle.title || 'Your article',
        currentUserName: currentUser.username || currentUser.name || 'Someone'
      }));
      
      if (result.type && result.type.endsWith('/fulfilled')) {
        // Create notification only if commenting on someone else's article
        if (!isOwnArticle && result.payload?._shouldCreateNotification) {
          dispatch(addCommentNotification({
            actor: currentUser._id,
            targetId: articleId,
            actorName: currentUser.username || currentUser.name || 'Someone',
            articleTitle: displayArticle.title || 'Your article',
            commentText: commentInput.trim()
          }));
        }
        
        setCommentInput('');
        // Refresh comments first page to include newest
        dispatch(fetchComments({ articleId, page: 1, perPage: commentsMeta.perPage || 5 }));
        // Also refresh article data
        dispatch(fetchArticleById(articleId));
      } else {
        alert('Failed to post comment. Please try again.');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      alert('An error occurred. Please try again.');
    }
  }, [articleId, commentInput, currentUser, dispatch, commentsMeta.perPage, displayArticle, getArticleOwnerId]);

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
              <div id='theme' className="border-2 border-black flex justify-center items-center h-[25px] w-[25px] rounded-full">
                <i className="fa-regular fa-moon text-[16px] text-black"></i>
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
            <div id='theme' className="border-2 border-black flex justify-center items-center h-[25px] w-[25px] rounded-full">
              <i className="fa-regular fa-moon text-[16px] text-black"></i>
            </div>
          </div>
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

          {/** Prefer authoritative likeState from Redux if present, fall back to local optimistic state */}
          {(() => {
            const displayedHasLiked = likeState?.isLikedByUser ?? localLikeState.hasLiked;
            const displayedCount = (likeState && typeof likeState.count === 'number') ? likeState.count : localLikeState.count;
            const displayedIsUpdating = Boolean(isLiking) || Boolean(localLikeState.isUpdating);

            return (
              <button
                onClick={handleLikeToggle}
                disabled={!currentUser?._id || displayedIsUpdating}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 ${
                  displayedHasLiked 
                    ? 'text-red-500 hover:text-red-600 bg-red-50' 
                    : 'text-gray-600 hover:text-red-500 bg-gray-100'
                } ${displayedIsUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {displayedIsUpdating ? (
                  <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <i className={`fa${displayedHasLiked ? '-solid' : '-regular'} fa-heart`}></i>
                )}
                <span className={`font-medium ${displayedHasLiked ? 'text-red-500' : 'text-gray-700'}`}>
                  {displayedCount}
                </span>
              </button>
            );
          })()}
        </div>

        <article className="prose prose-lg max-w-none text-gray-700 mb-12">
            <div className="text-lg leading-8 whitespace-pre-wrap">
            {displayArticle?.content}
          </div>
        </article>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              Comments ({commentsMeta?.total || displayArticle?.comments?.length || 0})
            </h2>
            <div className="flex items-center gap-4">
              <button
                onClick={toggleComments}
                className="text-blue-500 hover:text-blue-600 transition-colors"
              >
                {showComments ? 'Hide' : 'Show'} Comments
              </button>
            </div>
          </div>

          {showComments && (
            <>
              {currentUser?._id && (
                <form onSubmit={handleSubmitComment} className="mb-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <img 
                        src={getImageSrc(currentUser.profilePhotoUrl || currentUser.profilePhoto)} 
                        alt={currentUser.username}
                        className="w-10 h-10 rounded-full object-cover"
                        onError={(e) => e.target.src = defaultImage}
                      />
                    </div>
                    <div className="flex-1">
                      <textarea
                        value={commentInput}
                        onChange={handleCommentChange}
                        placeholder="Add a comment..."
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        rows="3"
                        disabled={commentsMeta.loading}
                      />
                      <div className="flex justify-between items-center mt-2">
                        <p className="text-sm text-gray-500">
                          {commentsMeta.error && <span className="text-red-500">{String(commentsMeta.error)}</span>}
                        </p>
                        <button
                          type="submit"
                          disabled={commentsMeta.loading || !commentInput.trim()}
                          className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                        >
                          {commentsMeta.loading ? (
                            <span className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Posting...
                            </span>
                          ) : (
                            'Post Comment'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              )}

              <div className="space-y-6">
                {commentsMeta.loading && (comments.length === 0) ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-transparent mx-auto mb-3"></div>
                    Loading comments...
                  </div>
                ) : (
                  comments.length > 0 ? (
                    comments.map((comment) => {
                      const commentUser = comment.user || comment.author || comment.commentedBy || {};
                      const commentUserPhoto = getImageSrc(commentUser.profilePhotoUrl || commentUser.profilePhoto || commentUser.avatar || commentUser.image);
                      const commentUserName = commentUser.username || commentUser.name || commentUser.fullName || commentUser.displayName || commentUser.email || 'User';

                      return (
                        <div key={comment._id || comment.id} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                          <div className="flex-shrink-0">
                            <img 
                              src={commentUserPhoto} 
                              alt={commentUserName}
                              className="w-10 h-10 rounded-full object-cover"
                              onError={(e) => e.target.src = defaultImage}
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold text-gray-800">{commentUserName}</span>
                              <span className="text-gray-500 text-sm">{formatTime(comment.createdAt || comment.created_at || comment.date)}</span>
                            </div>
                            <p className="text-gray-700">{comment.content || comment.text}</p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <i className="fa-regular fa-comment-dots text-3xl mb-3 opacity-50"></i>
                      <p>No comments yet. Be the first to comment!</p>
                    </div>
                  )
                )}
              </div>

              {comments.length < (commentsMeta.total || 0) && (
                <div className="text-center mt-6">
                  <button
                    onClick={handleReadMore}
                    disabled={commentsMeta.loading}
                    className="px-6 py-2 bg-white border border-gray-200 rounded-lg hover:shadow-sm"
                  >
                    {commentsMeta.loading ? 'Loading...' : 'Read more'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </main>
  );
};

export default IndArticle;