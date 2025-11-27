import React from 'react'
import { useNavigate } from 'react-router-dom'

const Notifications = () => {
    let navigate = useNavigate()
  return <>
    <main className="w-full overflow-scroll relative top-0 bg-gradient-to-b from-[rgb(151,222,246)] to-[rgb(210,137,228)]">
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
              <div className='nav_icons'><i className="fa-regular fa-bell text-[25px] text-black"></i></div>
              <div className='nav_icons'><i className="fa-regular fa-circle-user text-[25px] text-black"></i></div>
              <div id='theme' className="border-2 border-black flex justify-center items-center h-[25px] w-[25px] rounded-full">
                <i className="fa-regular fa-moon text-[16px] text-black"></i>
              </div>
            </div>
          </aside>
        </nav>
        {/* Nav completed */}

        <div class="max-w-4xl mx-auto px-6 py-10" id='div_indarticle'>

    {/* <!-- Page Title --> */}
    <h2 class="text-4xl font-extrabold text-gray-900 mb-8">Notifications</h2>

    {/* <!-- Tabs --> */}
    <div class="flex space-x-1 bg-gray-100 p-1 rounded-xl w-fit mb-10">
      <button class="px-8 py-3 rounded-lg font-semibold transition tab-active" id="allTab">
        All
      </button>
      <button class="px-8 py-3 rounded-lg font-semibold text-gray-600 hover:bg-white hover:shadow-sm transition" id="likesTab">
        Likes
      </button>
    </div>

    {/* <!-- Notifications List --> */}
    <div class="space-y-4">

      {/* <!-- Like Notification --> */}
      <div class="notification bg-white rounded-2xl p-5 flex items-center justify-between shadow-sm border border-gray-100 transition-all duration-200 cursor-pointer">
        <div class="flex items-center space-x-5">
          <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="Sarah" class="w-14 h-14 rounded-full ring-4 ring-purple-100"/>
          <div>
            <p class="font-bold text-gray-900">
              Sarah_Wilson <span class="font-normal text-gray-700">liked your post</span>
            </p>
            <p class="text-sm text-gray-500">2h ago</p>
          </div>
        </div>
        <div class="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
          <i class="fas fa-heart text-red-500 text-xl"></i>
        </div>
      </div>

      {/* <!-- Comment Notification --> */}
      <div class="notification bg-white rounded-2xl p-5 flex items-center justify-between shadow-sm border border-gray-100 transition-all duration-200 cursor-pointer">
        <div class="flex items-center space-x-5">
          <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="Mike" class="w-14 h-14 rounded-full ring-4 ring-blue-100"/>
          <div>
            <p class="font-bold text-gray-900">
              mike_chen <span class="font-normal text-gray-700">commented on your post</span>
            </p>
            <p class="text-sm text-gray-500">4h ago</p>
          </div>
        </div>
        <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
          <i class="fas fa-comment-dots text-blue-600 text-xl"></i>
        </div>
      </div>

      {/* <!-- Follow Notification --> */}
      <div class="notification bg-white rounded-2xl p-5 flex items-center justify-between shadow-sm border border-gray-100 transition-all duration-200 cursor-pointer">
        <div class="flex items-center space-x-5">
          <img src="https://randomuser.me/api/portraits/women/68.jpg" alt="Emma" class="w-14 h-14 rounded-full ring-4 ring-green-100"/>
          <div>
            <p class="font-bold text-gray-900">
              emma_davis <span class="font-normal text-gray-700">started following you</span>
            </p>
            <p class="text-sm text-gray-500">6h ago</p>
          </div>
        </div>
        <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
          <i class="fas fa-user-plus text-green-600 text-xl"></i>
        </div>
      </div>

      

      {/* <!-- Mention Notification --> */}
      <div class="notification bg-white rounded-2xl p-5 flex items-center justify-between shadow-sm border border-gray-100 transition-all duration-200 cursor-pointer">
        <div class="flex items-center space-x-5">
          <img src="https://randomuser.me/api/portraits/women/22.jpg" alt="Alex" class="w-14 h-14 rounded-full ring-4 ring-pink-100"/>
          <div>
            <p class="font-bold text-gray-900">
              alex_turner <span class="font-normal text-gray-700">mentioned you in a comment</span>
            </p>
            <p class="text-sm text-gray-500">2d ago</p>
          </div>
        </div>
        <div class="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
          <i class="fas fa-at text-pink-600 text-xl"></i>
        </div>
      </div>
    </div>
    </div>

    </main>
  </>
}

export default Notifications