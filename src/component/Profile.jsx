import React, { use } from 'react'
import { useNavigate } from 'react-router-dom'

const Profile = () => {
    // let navigate = useNavigate();
  return <>
    <main>
       <section>
          <nav className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 flex items-center justify-between shadow-md">
  
            {/* Left: Logo */}
            <h1 className="text-white font-bold text-2xl">
                Social<span className="text-green-300">Media</span>
            </h1>

            {/* Search Bar */}
            <div className="flex items-center bg-white w-80 rounded-full px-4 py-2 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" 
                className="w-6 h-6 text-gray-600">
                <path stroke="currentColor" strokeWidth="1.5" d="m21 21-3.5-3.5m0 0A7.5 7.5 0 1 0 7.5 15a7.5 7.5 0 0 0 10 0Z"/>
                </svg>
                <input
                type="text"
                placeholder="Search"
                className="ml-2 w-full outline-none text-gray-700"
                />
            </div>

            {/* Right Side Icons */}
            <div className="flex items-center gap-5 text-white">

                {/* Home Icon */}
                <div className="border border-white p-2 rounded-xl hover:bg-white/20 transition">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" 
                    className="w-6 h-6 stroke-current">
                    <path strokeWidth="1.5" d="M3 9.5 12 3l9 6.5V21H3V9.5Z"/>
                </svg>
                </div>

                {/* Add Icon */}
                <div className="border border-white p-2 rounded-xl hover:bg-white/20 transition">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" 
                    className="w-6 h-6 stroke-current">
                    <path strokeWidth="1.5" d="M12 4v16m-8-8h16"/>
                </svg>
                </div>

                {/* Notification Icon */}
                <div className="border border-white p-2 rounded-xl hover:bg-white/20 transition">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" 
                    className="w-6 h-6 stroke-current">
                    <path strokeWidth="1.5" d="M12 22a2 2 0 0 0 2-2H10a2 2 0 0 0 2 2Zm6-6v-5a6 6 0 1 0-12 0v5l-2 2v1h16v-1l-2-2Z"/>
                </svg>
                </div>

                {/* Profile Badge */}
                <div className="bg-white text-purple-700 font-bold px-3 py-1 rounded-full shadow">
                M
                </div>

                {/* Dark Mode Icon */}
                <div className="border border-white p-2 rounded-full hover:bg-white/20 transition">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                    className="w-6 h-6 fill-white">
                    <path d="M12 3a9 9 0 0 0 0 18c4.97 0 9-4.03 9-9 0-1.49-.36-2.89-1-4.12A7.5 7.5 0 0 1 12 3Z"/>
                </svg>
                </div>

            </div>

          </nav>
       </section>
        
        <section class="flex flex-col items-center justify-center mt-10 px-0  ">
               
                   <div>
                        <img src="https://www.svgrepo.com/show/446529/avatar.svg" alt=""className='w-28 h-28 rounded-full border-4 border-white shadow-1g' />

                   </div>
                     <h1 className='text-2xl font-semibold mt-3' >maredi shiva </h1>
                     <p className='text-gray-600 bg-gray-100 px-4 py-1 rounded-full mt-2'>maredishiva@gmail.com</p>
                     <div className='flex gap-2 mt-3 flex-wrap justify-center'>
                     <p className='bg-blue-100 px-3 py-1 rounded-full text-gray-700 flex items-center gap-1'>photographer📷</p>
                     <p className='bg-blue-100 px-3 py-1 rounded-full text-gray-700 flex items-center gap-1'>traveller 🌍</p>
                     <p className='bg-blue-100 px-3 py-1 rounded-full text-gray-700 flex items-center gap-1'>coffee lover☕</p>
                     </div>
                     <div className="flex justify-center gap-6 mt-6">
  <div className="bg-gray-100 w-24 h-20 rounded-xl flex flex-col items-center justify-center">
    <h3 className="font-bold text-xl">1,232</h3>
    <p className="text-xs">Posts</p>
  </div>

  <div className="bg-gray-100 w-24 h-20 rounded-xl flex flex-col items-center justify-center">
    <h3 className="font-bold text-xl">5.7k</h3>
    <p className="text-xs">Followers</p>
  </div>

  <div className="bg-gray-100 w-24 h-20 rounded-xl flex flex-col items-center justify-center">
    <h3 className="font-bold text-xl">900</h3>
    <p className="text-xs">Following</p>
  </div>
</div>
                    
               
                 <div className="w-full max-w-2xl mt-10 border rounded-xl p-3 flex items-center justify-center gap-2">
  <span className="text-xl">🖼️</span>
  <h3 className="font-semibold text-lg">Articles</h3>
</div>
          <div className="bg-blue-100 p-4 mt-4 rounded-lg flex justify-between items-center">
    <div className="w-2/3">
      <p className="font-semibold text-lg">
        Getting started with modern web development
      </p>
    </div>

    <div className="text-right w-1/3">
      <p className="font-semibold">Maredi Shiva</p>
      <p className="text-sm text-gray-600">June 10, 2025</p>
    </div>

    <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold ml-3">
      MS
    </div>
  </div>
        
  
        </section>
    </main>

  </>
}

export default Profile