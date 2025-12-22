
// Home.jsx - UPDATED VERSION
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  searchUsers,
  clearSearchResults,
  setShowSearchResults,
  addLocalSearchResult,
  sendFollowByUsername,
  updateUserFollowStatus,
  followRequestReceived,
  fetchAllUsers
} from '../usersSlice';
import  {  addToFollowing }  from '../Slice';
import { addToFollowers }  from '../Slice';
import NotificationBell from '../component/NotificationBell';
import { connectSocket, on as socketOn } from '../socket';
import { createPost, fetchPosts, injectAuthorUsername, updateArticleLikes } from '../ArticlesSlice';
import { toggleLike, optimisticToggleLike, selectIsLiking } from '../LikeSlice';
import { postComment, selectIsCommentingArticle } from '../CommentSlice';
import { formatTime } from '../FormatTime';
import { toast } from 'react-toastify';
import { sendFollowRequest } from '../SearchSlice';

// PostCard component to properly use hooks
const PostCard = ({ post, postId, userDisplayName, userProfilePhoto, userPhoto, currentUser, handleLikeClick, handleToggleCommentBox, handleSubmitComment, handleCommentChange, commentsVisible, showCommentBox, commentDraft, getCommentUserName, getCommentUserPhoto, handleShowMoreComments, isCommenting }) => {
  // Derive isLiked from article.likedBy instead of manually toggling
  const likedBy = post.likedBy || post.likes || [];
  const currentId = String(currentUser?._id || '');
  const hasLiked = likedBy.some(x => {
    const id = typeof x === 'object' ? (x._id || x.id || x.userId) : x;
    return String(id) === currentId;
  });
  const likeCount = post.likeCount ?? post.likesCount ?? likedBy.length ?? 0;
  const isLiking = useSelector((state) => selectIsLiking(state, postId));
  const commenting = useSelector((state) => selectIsCommentingArticle(state, postId)) || isCommenting;

  return (
    <article className="bg-white rounded-[15px] shadow-lg hover:shadow-xl transition-all duration-300">
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

        {/* Post Actions */}
        <div className="flex items-center gap-8 text-gray-600">
          <button
            onClick={(e) => handleLikeClick(e, post)}
            disabled={isLiking}
            className={`like-button flex items-center gap-2 transition-all duration-200 ${
              hasLiked ? 'text-red-500' : 'text-gray-600'
            } hover:text-red-500 cursor-pointer ${hasLiked ? 'animate-heart-like' : ''}`}
            style={{ opacity: isLiking ? 0.6 : 1 }}
          >
            <i className={`fa${hasLiked ? '-solid' : '-regular'} fa-heart text-xl`}></i>
            <span className="font-medium">{likeCount}</span>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleToggleCommentBox(postId); }}
            className="flex items-center gap-2 hover:text-blue-500 transition-colors cursor-pointer"
          >
            <i className="fa-regular fa-comment"></i>
            <span>{post.comments?.length || 0}</span>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleOpenShare(postId); }}
            className="flex items-center gap-2 hover:text-green-500 transition-colors cursor-pointer"
          >
            {/* <i className="fa-solid fa-share"></i> */}
          </button>
        </div>

        {/* Comments Section */}
        {(commentsVisible[postId] > 0 || showCommentBox) && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h5 className="font-semibold text-gray-700 mb-3">Comments</h5>
            {showCommentBox && (
              <form
                onClick={(e) => e.stopPropagation()}
                onSubmit={(e) => { e.preventDefault(); handleSubmitComment(postId); }}
                className="mb-4 space-y-2"
              >
                <textarea
                  value={commentDraft}
                  onChange={(e) => handleCommentChange(postId, e.target.value)}
                  placeholder="Write your comment..."
                  className="w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  disabled={commenting}
                />
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={!commentDraft?.trim() || commenting}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-60"
                  >
                    {commenting ? 'Posting...' : 'Post Comment'}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleToggleCommentBox(postId); }}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
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
                className="text-blue-500 text-sm font-medium mt-2 hover:text-blue-600 cursor-pointer"
              >
                Show more comments
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
};

const Home = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Get data from Redux store
  const { currentUser } = useSelector((state) => state.auth);
  const { posts = [], loading = false, error = null, createPostLoading = false } = useSelector((state) => state.articles || {});
  const { 
    searchResults = [], 
    searchLoading = false, 
    showSearchResults = false,
    followLoading = false,
    followError = null
  } = useSelector((state) => state.users || {});
  
  const { 
    friends = [], 
    activeChat = null, 
    chatMessages = [], 
    chatLoading = false,
  } = useSelector((state) => state.search || {});

  const searchRef = useRef(null);
  const navInputRef = useRef(null);
  const chatContainerRef = useRef(null);
  const [inp,setinp]=useState("")
  const defaultImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23cbd5e1'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E";
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
      } else if ((result.message && result.message.includes('already following')) || (result.error && result.error.includes('already following'))) {
        toast.info(`You are already following ${username}`);
      } else if ((result.message && result.message.includes('pending')) || (result.error && result.error.includes('pending'))) {
        toast.info(`Follow request already sent to ${username}`);
      } else {
        toast.success('Follow request sent successfully');
      }
    } catch (error) {
      console.error('Follow request failed:', error);
      const errorMessage = typeof error === 'string' ? error : (error?.message || JSON.stringify(error));
      
      if (errorMessage.includes('not found') || errorMessage.includes('does not exist')) {
        toast.error(`User "${username}" not found`);
      } else if (errorMessage.includes('already following')) {
        toast.info(`You are already following ${username}`);
      } else if (errorMessage.includes('pending')) {
        toast.info(`Follow request already pending for ${username}`);
      } else if (errorMessage.includes('yourself')) {
        toast.error("You can't follow yourself");
      } else {
        toast.error(errorMessage || 'Failed to send follow request');
      }
    } finally {
      setinp('');
    }
  }
  const getImageSrc = useCallback((photo) => {
    // ... (keep your existing getImageSrc function)
    if (!photo) return defaultImage;

    if (typeof photo === 'string') {
      const s = photo.trim();
      if (!s) return defaultImage;
      if (s.startsWith('data:image/')) return s;
      if (s.startsWith('http') || s.startsWith('blob:') || s.startsWith('/')) return s;
      
      const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
      const cleanPhoto = s.replace(/\s/g, '');
      if (cleanPhoto.length > 100 && base64Regex.test(cleanPhoto)) {
        return `data:image/jpeg;base64,${cleanPhoto}`;
      }
      
      return s;
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

  // Get current user's photo
  const userPhoto = useMemo(() => getImageSrc(
    currentUser?.profilePhoto ||
    currentUser?.profilePhotoUrl ||
    currentUser?.avatar ||
    currentUser?.image ||
    currentUser?.picture ||
    currentUser?.profilePic
  ), [currentUser, getImageSrc]);
  
  const userProfilePhoto = userPhoto;
  const userName = useMemo(() => currentUser?.username || "User", [currentUser]);
  const userEmail = useMemo(() => currentUser?.email || "user@example.com", [currentUser]);

  // Helper function to resolve username by author ID
  const resolveUsernameById = useCallback((authorId) => {
    if (!authorId) return 'Unknown';
    
    // Check if it's the current user
    if (currentUser?._id === authorId) {
      return currentUser.username || 'User';
    }
    
    // Look in followers array
    if (Array.isArray(currentUser?.followers)) {
      const follower = currentUser.followers.find(f => f._id === authorId || f.userId === authorId);
      if (follower?.username) return follower.username;
    }
    
    // Look in following array
    if (Array.isArray(currentUser?.following)) {
      const following = currentUser.following.find(f => f._id === authorId || f.userId === authorId);
      if (following?.username) return following.username;
    }
    
    // Fallback
    return 'Unknown';
  }, [currentUser]);

  // Count only the logged-in user's posts (not friends' posts)
  const myPostsCount = useMemo(() => {
    if (!currentUser?._id || !Array.isArray(posts)) return 0;
    return posts.filter((post) => {
      const authorId =
        post.author?._id ||
        post.user?._id ||
        post.postedBy?._id ||
        post.userId;
      return authorId === currentUser._id;
    }).length;
  }, [posts, currentUser]);

  // State for UI
  const [searchQuery, setSearchQuery] = useState({
    targetUsername:""
  });
  // const [messageInput, setMessageInput] = useState('');
  // const [showChat, setShowChat] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [commentsVisible, setCommentsVisible] = useState({});
  const [commentDrafts, setCommentDrafts] = useState({});
  const [showCommentBox, setShowCommentBox] = useState({});
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharePostId, setSharePostId] = useState(null);
  const [debounceTimer, setDebounceTimer] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // ========== SEARCH AND FOLLOW REQUEST FUNCTIONALITY ==========

  // Handle search with debouncing
  const handleSearch = useCallback((query) => {
    console.log(query);
    
    const q = query || '';
    setSearchQuery((preVal)=>({...preVal,["targetUsername"]:q}));

    // Clear previous debounce timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // If query is empty, clear results
    if (!q) {
      dispatch(clearSearchResults());
      return;
    }

    // Set a new debounce timer
    const timer = setTimeout(() => {
      performSearch(q);
    }, 300); // 300ms debounce

    setDebounceTimer(timer);
  });

  // Perform the actual search
  const performSearch = useCallback(async (query) => {
    try {
      // Dispatch the search action via usersSlice
      console.log('performSearch query=', query);

      const resp = await dispatch(searchUsers(query)).unwrap();

      if (!resp || !resp.users || resp.users.length === 0) {
        // If server returned no users, add a local quick-follow suggestion using the typed username
        if (query && String(query).trim()) {
          console.log('[performSearch] no users found, adding local suggestion for', query);
          dispatch(addLocalSearchResult({ username: String(query).trim(), _local: true }));
          // ensure dropdown shows
          dispatch(setShowSearchResults(true));
        } else {
          toast.info('No users found');
        }
      }
    } catch (error) {
      console.error('Search failed:', error);
      // Show a local quick-action suggestion so user can still attempt follow-by-username
      try {
        dispatch(addLocalSearchResult({ username: query, _local: true }));
        toast.info('Search failed; showing quick follow option for entered username');
      } catch (e) {
        console.warn('Could not set local search result', e);
        toast.error('Search failed. Please try again.');
      }
    }
  }, [dispatch]);

  // Handle follow request
  const handleFollowRequest = useCallback(async (user) => {
    if (!user) {
      toast.error('Invalid user');
      return;
    }

    // Don't allow following yourself
    if (user._id === currentUser?._id) {
      toast.info("You can't follow yourself");
      return;
    }
    // If this is a local fallback search result (no server id), use username-based follow
    const isLocal = !!user._local || (typeof user._id === 'string' && user._id.startsWith('local-')) || !user._id;

    if (isLocal) {
      // show requested state locally
      try {
        dispatch(addLocalSearchResult({ ...user, friendStatus: 'requested', _local: true }));
      } catch (e) {
        // ignore
      }

      try {
        const res = await dispatch(sendFollowByUsername(user.username || (user._id || '').replace(/^local-/, ''))).unwrap();
        if (res && (res.success || res.targetUserId)) {
          toast.success('Follow request sent (by username)');
          setSearchQuery({
            "targetUsername":""
          });
          dispatch(clearSearchResults());
          return;
        }
      } catch (err) {
        console.error('Username follow failed:', err);
        // revert local UI
        try { dispatch(addLocalSearchResult({ ...user, friendStatus: 'none', _local: true })); } catch (e) {}
        toast.error(err || 'Failed to send follow request by username');
        return;
      }
    }

    // Optimistically update UI for server-backed user id
    dispatch(updateUserFollowStatus({ 
      userId: user._id, 
      status: 'requested' 
    }));
    try {
        await dispatch(
          sendFollowRequest({ targetUsername: user.username })
        ).unwrap();

        toast.success('Follow request sent successfully!');
      } catch (error) {
        console.error('Follow request failed:', error);

        dispatch(updateUserFollowStatus({ 
          userId: user._id, 
          status: 'none' 
        }));

        toast.error(error || 'Failed to send follow request');
      }

  }, [dispatch, currentUser]);

  // Handle follow by username (when user presses Enter on search)
  const handleFollowByUsername = useCallback(async (username) => {
    if (!username.trim()) {
      toast.error('Please enter a username');
      return;
    }

    try {
      const result = await dispatch(sendFollowByUsername(username.trim())).unwrap();
      
      if (result.success) {
        toast.success(`Follow request sent to ${username}`);
        setSearchQuery({
          targetUsername:""
        });
        dispatch(clearSearchResults());
      }
    } catch (error) {
      console.error('Follow by username failed:', error);
      toast.error(error || 'Failed to send follow request');
    }
  }, [dispatch]);

  // ========== SOCKET.IO INTEGRATION ==========

  useEffect(() => {
    // Fetch initial data
    console.log('Home: Fetching friends and posts');
    dispatch(fetchAllUsers());
    dispatch(fetchPosts());

    // Setup socket connection and listeners
    try {
      const token = localStorage.getItem('authToken');
      connectSocket(token);
      
      // Listen for incoming follow requests
      const offFollowRequest = socketOn('followRequestReceived', (payload) => {
        try {
          console.log('Received followRequestReceived via socket:', payload);
          
          // Update Redux state
          dispatch(followRequestReceived(payload));
          
          // Show toast notification
          toast.info(`New follow request from ${payload.sender?.username || 'someone'}`);
        } catch (e) {
          console.warn('Error handling followRequestReceived', e);
        }
      });

      // Listen for follow request acceptance
      const offFollowAccepted = socketOn('followRequestAccepted', (payload) => {
        try {
          console.log('Follow request accepted:', payload);
          
          // Update follow status
          if (payload.userId) {
            dispatch(updateUserFollowStatus({
              userId: payload.userId,
              status: 'following'
            }));
          }
          
          //  HELPER: Extract username from payload, searchResults, or use fallback
          const getUsername = (userId) => {
            // Try to get from searchResults first
            if (Array.isArray(searchResults)) {
              const found = searchResults.find(u => u._id === userId);
              if (found?.username) return found.username;
            }
            // Return null if not found (will be handled by caller)
            return null;
          };
          
          //  UPDATE FOLLOWER/FOLLOWING WITH USER DATA
          // If current user is the requester (User A), add followed user to their following list
          if (payload.requesterId === currentUser?._id && payload.targetUserId) {
            // Try to get username from payload or searchResults
            let username = payload.targetUser?.username || getUsername(payload.targetUserId);
            // Only dispatch if we have the username
            if (username) {
              dispatch(addToFollowing({
                _id: payload.targetUserId,
                username: username
              }));
              //  INJECT USERNAME INTO ARTICLES for instant display
              dispatch(injectAuthorUsername({
                userId: payload.targetUserId,
                username: username
              }));
            } else {
              console.warn('[followRequestAccepted] Could not resolve targetUser username');
            }
          }
          
          // If current user is the recipient (User B), add follower to their followers list
          if (payload.targetUserId === currentUser?._id && payload.requesterId) {
            // Try to get username from payload or searchResults
            let username = payload.requesterUser?.username || getUsername(payload.requesterId);
            // Only dispatch if we have the username
            if (username) {
              dispatch(addToFollowers({
                _id: payload.requesterId,
                username: username
              }));
              // 🔥 INJECT USERNAME INTO ARTICLES for instant display
              dispatch(injectAuthorUsername({
                userId: payload.requesterId,
                username: username
              }));
            } else {
              console.warn('[followRequestAccepted] Could not resolve requesterUser username');
            }
          }
          
          toast.success('Follow request accepted!');
        } catch (e) {
          console.warn('Error handling followRequestAccepted', e);
        }
      });

      return () => {
        // Cleanup socket listeners
        try { 
          if (offFollowRequest) offFollowRequest(); 
          if (offFollowAccepted) offFollowAccepted(); 
        } catch (e) {}
      };
    } catch (e) {
      console.error('Socket setup failed:', e);
    }
  }, [dispatch, currentUser]);

  // ========== UI HELPERS ==========

  // Get follow button text and styling based on status
  const getFollowButtonInfo = useCallback((user) => {
    if (!user || user._id === currentUser?._id) {
      return { text: '', disabled: true, className: 'hidden' };
    }

    const status = user.followStatus || 'none';
    
    switch (status) {
      case 'following':
        return {
          text: 'Following',
          disabled: true,
          className: 'px-3 py-1 bg-gray-200 text-gray-600 rounded-lg text-sm cursor-default'
        };
      
      case 'requested':
        return {
          text: 'Request Sent',
          disabled: true,
          className: 'px-3 py-1 bg-gray-300 text-gray-600 rounded-lg text-sm cursor-not-allowed'
        };
      
      case 'pending':
        return {
          text: 'Respond',
          disabled: false,
          className: 'px-3 py-1 bg-blue-100 text-blue-600 rounded-lg text-sm hover:bg-blue-200'
        };
      
      default: // 'none'
        return {
          text: 'Follow',
          disabled: false,
          className: 'px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg text-sm hover:opacity-90'
        };
    }
  }, [currentUser]);

  // Create post handlers (open modal, close modal, submit)
  const handleInputClick = useCallback(() => {
    setShowCreateModal(true);
  }, []);

  const handleCloseCreateModal = useCallback(() => {
    setShowCreateModal(false);
    setNewPostTitle('');
    setNewPostContent('');
  }, []);

  const handleCreatePost = useCallback(async (e) => {
    e.preventDefault();
    const title = (newPostTitle || '').trim();
    const content = (newPostContent || '').trim();
    if (!title || !content) {
      toast.error('Please provide both title and content');
      return;
    }

    try {
      // Dispatch createPost thunk; payload shape depends on your backend
      await dispatch(createPost({ title, content }));
      toast.success('Post created');
      handleCloseCreateModal();
      // Refresh posts
      dispatch(fetchPosts());
    } catch (err) {
      console.error('Failed to create post', err);
      toast.error('Failed to create post');
    }
  }, [dispatch, newPostTitle, newPostContent, handleCloseCreateModal]);

  // Handle like/unlike for posts
  const handleLikeClick = useCallback(async (e, post) => {
    e.stopPropagation();
    
    if (!currentUser?._id) {
      toast.error('Please login to like articles');
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
      toast.error('Failed to update like');
    }
  }, [dispatch, currentUser]);

  // Comment and share handlers
  const handleShowComments = useCallback((postId) => {
    setCommentsVisible((prev) => {
      const currentlyVisible = prev[postId] || 0;
      const nextCount = currentlyVisible > 0 ? 0 : 3; // toggle show first 3 or hide
      return { ...prev, [postId]: nextCount };
    });
  }, []);

  const handleToggleCommentBox = useCallback((postId) => {
    setShowCommentBox((prev) => ({ ...prev, [postId]: !prev[postId] }));
    setCommentsVisible((prev) => ({ ...prev, [postId]: prev[postId] || 3 }));
  }, []);

  const handleCommentChange = useCallback((postId, value) => {
    setCommentDrafts((prev) => ({ ...prev, [postId]: value }));
  }, []);

  const handleSubmitComment = useCallback(async (postId) => {
    const text = (commentDrafts[postId] || '').trim();
    if (!text) {
      toast.error('Please enter a comment');
      return;
    }

    try {
      await dispatch(postComment({ articleId: postId, text })).unwrap();
      toast.success('Comment posted');
      setCommentDrafts((prev) => ({ ...prev, [postId]: '' }));
      setShowCommentBox((prev) => ({ ...prev, [postId]: false }));
      dispatch(fetchPosts());
    } catch (error) {
      console.error('Failed to post comment', error);
      toast.error(error || 'Failed to post comment');
    }
  }, [commentDrafts, dispatch]);

  const handleShowMoreComments = useCallback((postId) => {
    setCommentsVisible((prev) => {
      const nextCount = (prev[postId] || 0) + 3; // show 3 more
      return { ...prev, [postId]: nextCount };
    });
  }, []);

  const handleOpenShare = useCallback((postId) => {
    setSharePostId(postId);
    setShowShareModal(true);
  }, []);

  const getCommentUserName = useCallback((comment) => {
    return (
      comment?.user?.username ||
      comment?.author?.username ||
      comment?.postedBy?.username ||
      comment?.username ||
      comment?.user?.email ||
      comment?.author?.email ||
      comment?.postedBy?.email ||
      comment?.email ||
      'Unknown'
    );
  }, []);

  const getCommentUserPhoto = useCallback((comment) => {
    const src =
      comment?.user?.profilePhoto ||
      comment?.author?.profilePhoto ||
      comment?.postedBy?.profilePhoto ||
      comment?.profilePhoto ||
      comment?.avatar ||
      comment?.image ||
      null;
    return getImageSrc(src);
  }, [getImageSrc]);

  // ========== RENDER FUNCTIONS ==========

  // Build postsData for rendering (safe fallback when helper functions are missing)
  const postsData = useMemo(() => {
    if (!Array.isArray(posts)) return [];
    return posts.map((post) => {
      const postId = post._id || post.id || post.postId || null;
      const userObj = post.user || post.author || post.postedBy || {};
      
      // Resolve username: try post.author.username first, then resolve by author ID
      const authorId = userObj._id || post.userId || null;
      const userDisplayName = userObj.username || resolveUsernameById(authorId);
      
      const userProfilePhoto = getImageSrc(
        userObj.userProfilePhoto || userObj.userProfilePhotoUrl || userObj.profilePhotoUrl || userObj.profilePhoto || userObj.avatar || post.userProfilePhoto || null
      );
      return { post, postId, userDisplayName, userProfilePhoto };
    });
  }, [posts, currentUser, getImageSrc, resolveUsernameById]);

  // Render search results dropdown
  const renderSearchResults = () => {
    if (!showSearchResults) return null;

    // If there are no server results but the user typed a username, show the typed username as a suggestion
    if ((Array.isArray(searchResults) && searchResults.length === 0) && searchQuery?.targetUsername) {
      const username = String(searchQuery.targetUsername).trim();
      if (!username) return null;
      return (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-[10px] mt-1 shadow-lg max-h-60 overflow-y-auto z-50">
          <div className="p-3 border-b border-gray-200 hover:bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 cursor-pointer">
              <img 
                src={{userProfilePhoto}}
                alt={username}
                className="w-8 h-8 rounded-full object-cover"
                onError={(e) => { e.target.onerror = null; e.target.src = defaultImage; }}
              />
              <div>
                <p className="font-semibold">{username}</p>
                <p className="text-sm text-gray-500">Search by username</p>
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); handleFollowByUsername(username); }}
              className={'px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg text-sm hover:opacity-90'}
            >
              Follow
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-[10px] mt-1 shadow-lg max-h-60 overflow-y-auto z-50">
        {searchResults.map((user, idx) => {
          const buttonInfo = getFollowButtonInfo(user);

          // Skip current user from results
          if (user._id === currentUser?._id || user.username === currentUser?.username) return null;

          // Determine a stable key and navigation id for local suggestions
          const keyId = user._id || user.username || `search-${idx}`;
          const isLocal = !!user._local || (typeof user._id === 'string' && user._id.startsWith('local-'));
          const routeId = isLocal ? (user.username || String(user._id || '').replace(/^local-/, '')) : user._id;

          return (
            <div key={`${keyId}-${idx}`} className="p-3 border-b border-gray-200 hover:bg-gray-50 flex items-center justify-between">
              <div 
                className="flex items-center gap-3 flex-1 cursor-pointer"
                onClick={() => {
                  // For local suggestions navigate using username fallback
                  if (routeId) navigate(`/profile/${routeId}`);
                }}
              >
                <img 
                  src={getImageSrc(user.profilePhotoUrl || user.profilePhoto || user.avatar || user.image)} 
                  alt={user.username || 'user'}
                  className="w-8 h-8 rounded-full object-cover"
                  onError={(e) => { e.target.onerror = null; e.target.src = defaultImage; }}
                />
                <div>
                  <p className="font-semibold">{user.username || (user._id || '').replace(/^local-/, '')}</p>
                  {user.name && (
                    <p className="text-sm text-gray-500">{user.name}</p>
                  )}
                </div>
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleFollowRequest(user);
                }}
                disabled={buttonInfo.disabled || followLoading}
                className={buttonInfo.className}
              >
                {followLoading && (user._id === currentUser?._id) ? 'Sending...' : buttonInfo.text}
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  // ========== MAIN COMPONENT RENDER ==========

  return (
    <>
      <main className="w-full overflow-x-hidden relative top-0 bg-gradient-to-b from-[rgb(151,222,246)] to-[rgb(210,137,228)] min-h-screen">
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
                <i className="fa-regular fa-house text-[20px] md:text-[25px] text-black"></i>
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
                  src={userProfilePhoto} 
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
                  onClick={() => { setIsMenuOpen(false); navigate('/'); }}
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
                    src={userProfilePhoto}
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

        {/* Create Post Section */}
        <section id='cpost' className="rounded-[10px] bg-white relative top-[80px] md:top-[105px] w-[92%] md:w-[95%] left-0 md:left-[35px] mx-4 md:mx-0 h-auto md:h-[8vh] flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-0 p-3 md:pl-[10px] shadow-[rgba(100,100,111,0.2)_0px_7px_29px_0px]">
          <img 
            src={userProfilePhoto} 
            alt="User" 
            className="border border-gray-400 rounded-full h-[50px] w-[50px] object-cover" 
            onError={(e) => { e.target.onerror = null; e.target.src = defaultImage; }}
          />
          <input 
            type="text" 
            placeholder="What's on your mind?" 
            className="border-2 border-gray-300 w-full md:w-[82%] pl-[15px] md:ml-[20px] h-[45px] rounded-[10px] cursor-pointer focus:outline-none focus:border-blue-500 transition-colors"
            onClick={handleInputClick}
            readOnly
          />
          <button 
            className="rounded-[10px] md:ml-[20px] px-[25px] py-[10px] text-white cursor-pointer bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transition-colors font-medium"
            onClick={handleInputClick}
          >
            Create Article
          </button>
        </section>

        {/* Main Content Section */}
        <section id='main_section' className="w-full h-full relative top-[20px] md:top-[120px] flex flex-col md:flex-row gap-4 md:gap-6 px-4 md:px-6">
          {/* Profile Card */}
          <aside id='view_profile' className="h-full w-full md:flex-[23%] mb-4 md:mb-0">
            <div id='profile_card' className="flex justify-center items-center flex-col w-full h-[43vh] bg-white rounded-[15px] shadow-[rgba(149,157,165,0.2)_0px_8px_24px] p-6">
              <div className="h-[85px] w-[85px] flex justify-center items-center rounded-full mb-4">
                <img src={userProfilePhoto} alt="Profile" className="border-2 border-gray-300 rounded-full h-full w-full object-cover" onError={(e) => { e.target.onerror = null; e.target.src = defaultImage; }} />
              </div>
              <h1 className="text-[25px] font-semibold text-black mb-1">{userName}</h1>
              <p className="italic text-gray-600 mb-6">{userEmail}</p>
              <div id='info' className="flex gap-6 mb-6 text-black">
                <aside className="flex justify-center items-center flex-col">
                  <h2 className="text-[20px] font-bold text-blue-600">{myPostsCount}</h2>
                  <p className="text-sm text-gray-600">Posts</p>
                </aside>
                <aside className="flex justify-center items-center flex-col">
                  <h2 className="text-[20px] font-bold text-purple-600">{currentUser?.followers?.length || 0}</h2>
                  <p className="text-sm text-gray-600">Followers</p>
                </aside>
                <aside className="flex justify-center items-center flex-col">
                  <h2 className="text-[20px] font-bold text-pink-600">{currentUser?.following?.length || 0}</h2>
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
          <section id='middle_posts' className="flex flex-col flex-1 md:flex-[52%] gap-6 h-auto md:h-[77vh] md:overflow-y-auto scrollbar-none overflow-x-hidden">
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
              postsData.map(({ post, postId, userDisplayName, userProfilePhoto }) => (
                <PostCard
                  key={postId}
                  post={post}
                  postId={postId}
                  userDisplayName={userDisplayName}
                  userProfilePhoto={userProfilePhoto}
                  userPhoto={userPhoto}
                  currentUser={currentUser}
                  handleLikeClick={handleLikeClick}
                  handleToggleCommentBox={handleToggleCommentBox}
                  handleSubmitComment={handleSubmitComment}
                  handleCommentChange={handleCommentChange}
                  commentsVisible={commentsVisible}
                  showCommentBox={showCommentBox[postId]}
                  commentDraft={commentDrafts[postId] || ''}
                  getCommentUserName={getCommentUserName}
                  getCommentUserPhoto={getCommentUserPhoto}
                  handleShowMoreComments={handleShowMoreComments}
                />
              ))
            )}
          </section>

          {/* Suggestions Sidebar */}
          <aside id='suggestions' className="bg-white rounded-[15px] w-full md:flex-[21%] h-min pb-6 shadow-lg mt-4 md:mt-0">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
              Suggestions
            </h2>
            <p className="text-gray-600 text-sm mt-1">People you may know</p>
          </div>

          <div className="p-4 space-y-3">
            {searchResults.slice(0, 4).map((user, idx) => {
              const buttonInfo = getFollowButtonInfo(user);
              if (user._id === currentUser?._id || user.username === currentUser?.username) return null;

              const keyId = user._id || user.username || `suggest-${idx}`;
              const isLocal = !!user._local || (typeof user._id === 'string' && user._id.startsWith('local-'));
              const routeId = isLocal ? (user.username || String(user._id || '').replace(/^local-/, '')) : user._id;

              return (
                <div key={`${keyId}-${idx}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <img 
                    src={getImageSrc(user.profilePhotoUrl || user.profilePhoto)} 
                    alt={user.username || 'user'} 
                    className="w-12 h-12 rounded-full object-cover border border-gray-300"
                    onError={(e) => { e.target.onerror = null; e.target.src = defaultImage; }}
                  />
                  <div className="flex-1 min-w-0" onClick={() => { if (routeId) navigate(`/profile/${routeId}`); }}>
                    <h3 className="font-semibold text-gray-800 truncate">{user.username || (user._id || '').replace(/^local-/, '')}</h3>
                    {user.name && (
                      <p className="text-gray-500 text-sm truncate">{user.name}</p>
                    )}
                  </div>
                  <button 
                    onClick={() => handleFollowRequest(user)}
                    disabled={buttonInfo.disabled || followLoading}
                    className={buttonInfo.className}
                  >
                    {buttonInfo.text}
                  </button>
                </div>
              );
            })}
            
            {searchResults.length === 0 && (
              <p className="text-gray-500 text-sm text-center p-4">
                Search for users to see suggestions
              </p>
            )}
          </div>
        </aside>
        </section>
      </main>
    </>
  );
};

export default Home;
