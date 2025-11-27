import React from 'react'
import { useNavigate } from 'react-router-dom'

const Articles = () => {
  let navigate = useNavigate();
  return <>
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
              <div className='nav_icons'><i className="fa-regular fa-house text-[25px] text-black" onClick={()=>navigate('/home')}></i></div>
              <div className='nav_icons'><i className="fa-regular fa-square-plus text-[25px] text-black"></i></div>
              <div className='nav_icons'><i className="fa-regular fa-bell text-[25px] text-black" onClick={()=>{navigate("/notification")}}></i></div> 
              <div className='nav_icons'><i className="fa-regular fa-circle-user text-[25px] text-black"></i></div>
              <div id='theme' className="border-2 border-black flex justify-center items-center h-[25px] w-[25px] rounded-full">
                <i className="fa-regular fa-moon text-[16px] text-black"></i>
              </div>
            </div>
          </aside>
        </nav>
        {/* Nav Completed */}

        <section>
            <div id='h1'>
                <h1>All Articles</h1>
            </div>
        </section>
        <section>
            {/* <!-- Articles Grid --> */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" id='div1'>

      {/* <!-- Article Card 1 --> */}
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
        <div className="p-8 text-purple-900" onClick={()=>navigate("/indarticle")}>
          <h2 className="text-2xl font-bold mb-4">Getting started with modern web development</h2>
          <p className="text-black/90 leading-relaxed mb-6">
            The landscape of web development has evolved dramatically over the past few years. With new frameworks, tools, and best practices emerging constantly, staying current is more important than ever...
          </p>
          <div className="flex items-center justify-between mt-8">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                MS
              </div>
              <div>
                <p className="font-semibold">Maredi Shiva</p>
                <p className="text-sm text-white/105">June 10, 2025</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* <!-- Interaction Bar --> */}
        <div className="bg-black/5 backdrop-blur-md px-8 py-4 border-t border-white/20">
          <div className="flex items-center justify-between text-black">
            <button className="flex items-center space-x-2 hover:text-red-500 transition">
              <i className="far fa-heart"></i>
              <span className="font-medium">842</span>
            </button>
            <button className="flex items-center space-x-2 hover:text-blue-500 transition">
              <i className="far fa-comment-dots"></i>
              <span className="font-medium">126</span>
            </button>
          </div>
        </div>
      </div>

      {/* <!-- Article Card 2 --> */}
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
        <div className="p-8 text-purple-900" onClick={()=>navigate('/indarticle')}>
          <h2 className="text-2xl font-bold mb-4">Getting started with modern web development</h2>
          <p className="text-black/90 leading-relaxed mb-6">
            The landscape of web development has evolved dramatically over the past few years. With new frameworks, tools, and best practices emerging constantly, staying current is more important than ever...
          </p>
          <div className="flex items-center justify-between mt-8">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                MS
              </div>
              <div>
                <p className="font-semibold">Maredi Shiva</p>
                <p className="text-sm text-white/105">June 10, 2025</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-black/5 backdrop-blur-md px-8 py-4 border-t border-white/20">
          <div className="flex items-center justify-between text-black">
            <button className="flex items-center space-x-2 hover:text-red-500 transition">
              <i className="fas fa-heart text-red-500"></i>
              <span className="font-medium">1.2k</span>
            </button>
            <button className="flex items-center space-x-2 hover:text-blue-500 transition">
              <i className="far fa-comment-dots"></i>
              <span className="font-medium">89</span>
            </button>
          </div>
        </div>
      </div>

      {/* <!-- Article Card 3 --> */}
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
        <div className="p-8 text-purple-900" onClick={()=>navigate('/indarticle')}>
          <h2 className="text-2xl font-bold mb-4">Getting started with modern web development</h2>
          <p className="text-black/90 leading-relaxed mb-6">
            The landscape of web development has evolved dramatically over the past few years. With new frameworks, tools, and best practices emerging constantly, staying current is more important than ever...
          </p>
          <div className="flex items-center justify-between mt-8">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                MS
              </div>
              <div>
                <p className="font-semibold">Maredi Shiva</p>
                <p className="text-sm text-white/105">June 10, 2025</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-black/5 backdrop-blur-md px-8 py-4 border-t border-white/20">
          <div className="flex items-center justify-between text-black">
            <button className="flex items-center space-x-2 hover:text-red-500 transition">
              <i className="far fa-heart"></i>
              <span className="font-medium">589</span>
            </button>
            <button className="flex items-center space-x-2 hover:text-blue-500 transition">
              <i className="far fa-comment-dots"></i>
              <span className="font-medium">203</span>
            </button>
          </div>
        </div>
      </div>
    </div>
        </section>
    </main>
  </>
}
export default Articles