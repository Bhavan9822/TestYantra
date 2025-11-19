import React from 'react'

export const Home = () => {
  return (
    <>
    <main>
      <nav id='nav'>
        <aside id='as1'>
          <h1>SocialMedia</h1>
        </aside>
        <aside id='as2'>
          <div id='searchbar'>
            <input type="text" placeholder='Search...' />
          </div>
            <i class="fa-solid fa-magnifying-glass"></i>
        </aside>
        <aside id='as3'>
          <div>
            <i class="fa-regular fa-house"></i>
            <i class="fa-solid fa-square-plus"></i>
            <i class="fa-regular fa-bell"></i>
            <i class="fa-solid fa-circle-user"></i>
            <div id='theme'><i class="fa-regular fa-moon"></i></div>
          </div>
        </aside>
      </nav>
      {/* !nav completed */}

      <section id='chats'>
          <aside id='group_mem'>
            <div class='mem'>
              <aside id='profile_img'>
                <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTZ1LRFe8GZvoJYoMLTrgEBMucouj93j-MdMg&s" alt="" />
              </aside>
              <aside id='name_msg'>
                <h2>Swathi</h2>
                <p>Hello</p>
              </aside>
              <aside id='time'>
                <p>11:40AM</p>
              </aside>
            </div>
            <div class='mem'>
              <aside id='profile_img'>
                <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTZ1LRFe8GZvoJYoMLTrgEBMucouj93j-MdMg&s" alt="" />
              </aside>
              <aside id='name_msg'>
                <h2>Bhavana</h2>
                <p>Hii</p>
              </aside>
              <aside id='time'>
                <p>12:30PM</p>
              </aside>
            </div>
            <div class='mem'>
              <aside id='profile_img'>
                <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTZ1LRFe8GZvoJYoMLTrgEBMucouj93j-MdMg&s" alt="" />
              </aside>
              <aside id='name_msg'>
                <h2>Nikil</h2>
                <p>Good Morning</p>
              </aside>
              <aside id='time'>
                <p>1:10PM</p>
              </aside>
            </div>
        </aside>
        <aside id='archive_aside'>
          <button id='arch_btn'>Archive</button>
        </aside>
      </section>

      <section id='main_section'>
        <aside id='view_profile'>
          <div id='profile_card'>
            <span id='pro_img'>
              <img src="https://i.pinimg.com/236x/46/b6/95/46b695ae39a246d8c50ee443e53fd7dc.jpg" alt="" />
            </span>
            <h1>Maredi Shiva</h1>
            <p>maredishiva@gmail.com</p>
            <div id='info'>
              <aside id='posts_as'>
                <h2>123</h2>
                <p>Posts</p>
              </aside>
              <aside id='followers_as'>
                <h2>420</h2>
                <p>Followers</p>
              </aside>
              <aside id='following_as'>
                <h2>90</h2>
                <p>Following</p>
              </aside>
            </div>
            <div id='btn_div'>
              <button>View Profile</button>
            </div>
          </div>
        </aside>
        <aside id='posts'>
          <article id='post_article'>
            <div id='post1'>
            <span id='post_img'>
              <img src="https://i.pinimg.com/236x/46/b6/95/46b695ae39a246d8c50ee443e53fd7dc.jpg" alt="" />
            </span>
            <span id='post_name_time'>
              <h2>Bhavana</h2>
              <p>11:15AM</p>
            </span>
          </div>
          <div>
            <h2>Web Development</h2>
            <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Perspiciatis enim animi quo doloremque! In deserunt earum quia beatae inventore totam deleniti impedit eos nemo facilis enim nostrum, dolor consequatur molestiae!</p>
          </div>
          <div>
            <i class="fa-regular fa-heart"></i>
            <i class="fa-regular fa-comment"></i>
            <i class="fa-solid fa-share"></i>
          </div>
          </article>
        </aside>
        <aside id='suggestions'></aside>
      </section>
      <summary></summary>
    </main>
      
    </>
  )
}
