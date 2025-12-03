import React, { useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import NotificationBell from './NotificationBell'

const ChatMessage = () => {
    let navigate = useNavigate();
    const { currentUser } = useSelector((state) => state.auth || {});

    const defaultAvatar = 'https://randomuser.me/api/portraits/lego/1.jpg';

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
    }, []);

    const userPhoto = useMemo(() => getImageSrc(
      currentUser?.profilePhoto ||
      currentUser?.profilePhotoUrl ||
      currentUser?.avatar ||
      currentUser?.image ||
      currentUser?.picture ||
      currentUser?.profilePic ||
      currentUser?.photoURL
    ), [currentUser, getImageSrc]);
  return <>
    <main className="w-full overflow-scroll relative top-0 bg-gradient-to-b from-[rgb(151,222,246)] to-[rgb(210,137,228)] flex" id='main'>
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
              <div className='nav_icons'><i className="fa-regular fa-square-plus text-[25px] text-black" onClick={()=>navigate("/articles")}></i></div>
              <NotificationBell />
              <div className='nav_icons'>
                <img
                  src={userPhoto}
                  alt="User"
                  className="w-[25px] h-[25px] rounded-full object-cover border border-gray-400 cursor-pointer"
                  onClick={() => navigate('/profile')}
                  onError={(e) => { e.target.onerror = null; e.target.src = defaultAvatar; }}
                />
              </div>
              <div id='theme' className="border-2 border-black flex justify-center items-center h-[25px] w-[25px] rounded-full">
                <i className="fa-regular fa-moon text-[16px] text-black"></i>
              </div>
            </div>
          </aside>
        </nav>
        {/* Nav Completed */}

        {/* <!-- Sidebar --> */}
  <div class="w-96 bg-white border-r border-gray-200 flex flex-col" id='check'>

    {/* <!-- Gradient Header --> */}
    <div class="bg-gradient-to-r from-[rgb(170,77,194)] to-[rgb(88,205,244)] p-5 shadow-lg">
      <div class="flex items-center justify-between mb-4">
        <h1 class="text-2xl font-bold text-white">Messages</h1>
        <button class="text-white/90 hover:text-white">
          {/* <i class="fas fa-edit text-xl"></i> */}
        </button>
      </div>
      <div class="relative">
        <input type="text" placeholder="Search Here..." 
               class="w-full pl-12 pr-4 py-3 rounded-xl bg-white/20 backdrop-blur-md text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"/>
        <i class="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-white/80"></i>
      </div>
    </div>

    {/* <!-- Chat List --> */}
    <div class="flex-1 overflow-y-auto" >

      {/* <!-- Active Chat with Gradient Border --> */}
      <div class="chat-item bg-gradient-to-r from-[rgb(151,222,246)]/50 border-l-4 border-[rgb(111,214,248)] p-3 flex items-center cursor-pointer" id='active'>
        <div class="relative h-14 w-14" id='cimg'>
          <img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjTO9QYKBNmzohVe-lIaLBwQva3cnq75wDiraya-gmXNfCIdN629-m8PDUcWNjU_2DH98cxEYfB1NNjmzMy5o3mMBO3U8oCbqEluG0z4UI3MMujJDEX1np_5cgHjaWhv_9f7AsqYgkDNnY/w1600-h1600-p-k-no-nu/actress-gayathri-suresh-photos-hero-heroine-movie-teaser-launch+%25281%2529.jpg" class="h-14 w-14 ring-white online"/>
        </div>
        <div class="flex-1" id='cont'>
          <div class="flex justify-between items-start">
            <h3 class="font-bold text-gray-900 ">Dianne Jhonson</h3>
            <span class="text-xs text-gray-500">10:35 AM</span>
          </div>
          <p class="text-sm text-gray-600 truncate ">Ya, I'll be adding more team members to it.</p>
        </div>
        <div class="w-3 h-3 bg-purple-600 rounded-full shadow-lg"></div>
      </div>

      {/* <!-- Other chats --> */}
      <div class="chat-item p-4 flex items-center space-x-4 cursor-pointer">
        <img src="https://randomuser.me/api/portraits/women/68.jpg" class="w-14 h-14 rounded-full"/>
        <div class="flex-1">
          <h3 class="font-semibold">Lisa Roy</h3>
          <p class="text-sm text-gray-500">Hi, are you available tomorrow?</p>
        </div>
      </div>

      {/* <!-- Add more chats as needed --> */}
    </div>
  </div>

  {/* <!-- Main Chat Area --> */}
  <div class="flex-1 flex flex-col" id='chat_area'>

    {/* <!-- Chat Header with Gradient --> */}
    <div class="bg-gradient-to-r from-[rgb(88,205,244)] to-[rgb(170,77,194)] shadow-lg p-5 flex items-center justify-between text-white">
      <div class="flex items-center space-x-4">
      <img src={userPhoto} class="w-12 h-12 rounded-full ring-4 ring-white online"/>
        <div>
          <h2 class="font-bold text-lg">Dianne Jhonson</h2>
          <p class="text-sm opacity-90 text-green-700">Online</p>
        </div>
      </div>
      <div class="flex space-x-5 text-white/90">
        {/* <i class="fas fa-phone-alt cursor-pointer hover:text-white"></i> */}
        {/* <i class="fas fa-video cursor-pointer hover:text-white"></i> */}
        <i class="fas fa-ellipsis-v cursor-pointer hover:text-white"></i>
      </div>
    </div>

    {/* <!-- Messages --> */}
    <div class="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-200">

      <div class="text-center text-gray-500 text-sm">
        <span class="bg-white/80 backdrop-blur px-4 py-1 rounded-full">Yesterday</span>
      </div>

      {/* <!-- Incoming --> */}
      <div class="flex items-end space-x-3 max-w-lg">
        <img src="https://randomuser.me/api/portraits/women/44.jpg" class="w-9 h-9 rounded-full"/>
        <div class="bg-white rounded-2xl rounded-bl-none px-5 py-3 shadow-sm">
          Hi David, have you got the project report pdf?
        </div>
      </div>

      {/* <!-- Outgoing with Your Gradient --> */}
      <div class="flex justify-end">
        <div class="message-out rounded-2xl rounded-br-none px-6 py-3 shadow-lg max-w-md bg-blue-300">
          NO. I did not get it
        </div>
      </div>

      {/* <!-- File + Outgoing --> */}
      <div class="flex items-end space-x-3 max-w-lg">
        <img src="https://randomuser.me/api/portraits/women/44.jpg" class="w-9 h-9 rounded-full"/>
        <div class="bg-white border-2 border-dashed border-gray-300 rounded-2xl w-52 h-36 flex flex-col items-center justify-center hover:border-[rgb(151,222,246)] transition">
          <i class="fas fa-file-pdf text-5xl text-red-500 mb-2"></i>
          <p class="font-medium text-sm">project_report.pdf</p>
          <p class="text-xs text-gray-500">2.4 MB</p>
        </div>
      </div>

      <div class="flex justify-end">
        <div class="message-out rounded-2xl rounded-br-none px-6 py-3 shadow-lg bg-blue-300">
          Ok. Should I send it over email as well after filling the details.
        </div>
      </div>

    </div>

    {/* <!-- Input Area --> */}
    <div class="bg-white border-t border-gray-200 p-5">
      <div class="flex items-center space-x-4">
        <button class="text-gray-600 hover:text-purple-500 transition cursor-pointer"><i class="fas fa-paperclip text-2xl"></i></button>
        <input type="text" placeholder="Write Something..." 
               class="flex-1 px-6 py-4 rounded-full bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[rgb(151,222,246)] transition"/>
        <button class="text-gray-600 hover:text-purple-500 transition cursor-pointer"><i class="fas fa-image text-2xl"></i></button>
        <button class="text-gray-600 hover:text-purple-500 transition cursor-pointer"><i class="fas fa-smile text-2xl"></i></button>
        
        {/* <!-- Send Button with Your Gradient --> */}
        <button class="bg-gradient-to-r from-[rgb(70,198,241)] to-[rgb(166,51,195)] text-white w-12 h-12 rounded-full hover:shadow-xl transform hover:scale-110 transition shadow-lg flex items-center justify-center cursor-pointer">
          <i class="fas fa-paper-plane"></i>
        </button>
      </div>
    </div>

  </div>
    </main> 
  </>
}

export default ChatMessage