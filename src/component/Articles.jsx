// Articles.jsx
import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchPosts, fetchPostById } from '../ArticlesSlice'
import { useLocation } from 'react-router-dom'
import { useState } from 'react'
import { formatTime } from '../FormatTime'

const Articles = () => {
  let navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentUser } = useSelector((state) => state.auth);
  
  
  const { posts = [], loading = false, error = null } = useSelector((state) => state.articles || {});
  
  const location = useLocation();
  const newPostFromNav = location?.state?.newPost;
  const [fetchedNewPost, setFetchedNewPost] = useState(null);

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

  // Enhanced image helper function
  const getImageSrc = (photo) => {
    const defaultImage = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face";
    
    if (!photo) return defaultImage;

    if (typeof photo === 'string') {
      if (photo.startsWith('data:image/')) {
        return photo;
      }
      
      // If it's a Base64 string without data URL prefix
      const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
      const cleanPhoto = photo.replace(/\s/g, '');
      
      if (cleanPhoto.length > 100 && base64Regex.test(cleanPhoto)) {
        return `data:image/jpeg;base64,${cleanPhoto}`;
      }
      
      // If it's a URL
      if (photo.startsWith('http')) {
        return photo;
      }
      
      return defaultImage;
    }

    // If photo is an object (from database)
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
  };

  // Enhanced helper to get user data from post with better debugging
  const getUserFromPost = (post) => {
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
  };

  // Enhanced helper to get user's display name with multiple fallbacks
  const getUserDisplayName = (post) => {
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
    return 'Community Member';
  };

  // Enhanced helper to get user's profile photo
  const getUserProfilePhoto = (post) => {
    const user = getUserFromPost(post);
    return getImageSrc(user.profilePhoto || user.profilePhotoUrl || user.avatar || user.image || user.picture);
  };

  // Combine posts for display
  const topPost = fetchedNewPost || newPostFromNav || null;
  const combinedPosts = topPost
    ? [topPost, ...posts.filter(p => (p._id || p.id) !== (topPost._id || topPost.id))]
    : posts;

  // Debug: Log the first post to see its structure
  useEffect(() => {
    if (posts.length > 0) {
      console.log('First post structure for debugging:', posts[0]);
      console.log('User from first post:', getUserFromPost(posts[0]));
      console.log('Display name from first post:', getUserDisplayName(posts[0]));
    }
  }, [posts]);

  return (
    <main className="w-full overflow-scroll relative top-0 bg-gradient-to-b from-[rgb(151,222,246)] to-[rgb(210,137,228)]" id='main'>
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
            <div className='nav_icons'><i className="fa-regular fa-bell text-[25px] text-black" onClick={()=>{navigate("/notification")}}></i></div>
            <div className='nav_icons'><i className="fa-regular fa-circle-user text-[25px] text-black"></i></div>
            <div id='theme' className="border-2 border-black flex justify-center items-center h-[25px] w-[25px] rounded-full">
              <i className="fa-regular fa-moon text-[16px] text-black"></i>
            </div>
          </div>
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
              
              return (
                <div 
                  key={post._id || post.id} 
                  className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer border border-gray-200"
                  onClick={() => navigate(`/indarticle/${post._id || post.id}`)}
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
                            src={userProfilePhoto}
                            alt={userDisplayName}
                            className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
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
                        <div className="flex items-center space-x-1 text-sm">
                          <i className="far fa-heart"></i>
                          <span>{post.likes?.length || 0}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-sm">
                          <i className="far fa-comment"></i>
                          <span>{post.comments?.length || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Hover Effect */}
                  <div className="h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
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