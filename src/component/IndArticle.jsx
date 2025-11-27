import React from 'react'
import { useNavigate } from 'react-router-dom';

const IndArticle = () => {
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
        {/* Nav Completed */}

        <div class="max-w-4xl mx-auto mt-8 px-6" id='div_indarticle'>

    {/* <!-- Back Button --> */}
    <a href="#" class="inline-block mb-8">
      <div class="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold px-6 py-3 rounded-full hover:shadow-lg transition transform hover:-translate-y-1" onClick={()=>navigate("/articles")}>
        ← Back to Articles
      </div>
    </a>

    {/* <!-- Article Title --> */}
    <h1 class="text-5xl font-extrabold text-gray-900 leading-tight mb-6">
      Getting Started with Modern Web Development
    </h1>

    {/* <!-- Author & Date --> */}
    <div class="flex items-center space-x-4 mb-8 pb-6 border-b border-gray-200">
      <div class="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
        MS
      </div>
      <div>
        <p class="font-bold text-gray-800">Maredi Shiva</p>
        <p class="text-gray-500">June 10, 2025</p>
      </div>
    </div>

    {/* <!-- Article Content --> */}
    <article class="prose prose-lg max-w-none text-gray-700">
      <h2 class="text-3xl font-bold mt-10 mb-4">Introduction to Modern Web Development</h2>
      <p class="text-lg leading-8">
        The landscape of web development has evolved dramatically over the past few years. With new frameworks, tools, and best practices emerging constantly, staying current is more important than ever.
      </p>

      <h2 class="text-3xl font-bold mt-12 mb-4">Key Technologies</h2>
      <p class="text-lg leading-8">
        Today’s web developers need to be familiar with a variety of technologies including <strong>React</strong>, <strong>TypeScript</strong>, and modern CSS frameworks. These tools enable us to build faster, more maintainable applications.
      </p>

      <p class="text-lg leading-8 mt-6">
        From component-based architecture to server-side rendering and static site generation, the possibilities are endless — and constantly improving.
      </p>

      {/* <!-- Add more paragraphs as needed --> */}
    </article>

    {/* <!-- Like & Comment Bar (Fixed at bottom on mobile, sticky on desktop) --> */}
    <div class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 md:static md:mt-12 md:border md:rounded-2xl md:shadow-lg">
      <div class="max-w-4xl mx-auto flex items-center justify-between">
        
        {/* <!-- Like Button --> */}
        <button id="likeBtn" class="like-btn flex items-center space-x-3 text-2xl font-bold transition-all duration-300 hover:scale-110">
          <i class="far fa-heart text-gray-600 transition"></i>
          <span id="likeCount" class="text-gray-800">1,847</span>
          <span class="text-gray-500 text-base ml-1">Likes</span>
        </button>

        {/* <!-- Comment Button --> */}
        <button class="flex items-center space-x-3 text-2xl font-bold text-gray-700 hover:text-blue-600 transition-all hover:scale-110">
          <i class="far fa-comment-dots"></i>
          <span>326</span>
          <span class="text-gray-500 text-base ml-1">Comments</span>
        </button>
      </div>
    </div>
    </div>
    </main>
  </>
}

export default IndArticle