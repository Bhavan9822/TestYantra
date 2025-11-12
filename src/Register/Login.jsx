// import React from "react";
// import { useNavigate } from "react-router-dom";
// import { useFormik } from "formik";
// import { useDispatch, useSelector } from 'react-redux';
// import { loginUser, clearError } from "../Slice.jsx";

// // Icons (using Heroicons)
// const EmailIcon = () => (
//   <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
//   </svg>
// );

// const LockIcon = () => (
//   <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
//   </svg>
// );

// const Login = () => {
//   const navigate = useNavigate();
//   const dispatch = useDispatch();

//   // Get Redux state
//   const { loading, error, currentUser } = useSelector(state => state.user);

//   const formik = useFormik({
//     initialValues: {
//       email: "",
//       password: "",
//     },
//     validate: (values) => {
//       const errors = {};
//       if (!values.email) errors.email = "Email is required.";
//       if (!values.password) errors.password = "Password is required.";
//       return errors;
//     },
//     onSubmit: async (values, { setSubmitting }) => {
//       try {
//         // Clear previous errors
//         dispatch(clearError());
        
//         console.log('Login form submission started with values:', values);

//         // Dispatch the login action
//         const result = await dispatch(loginUser(values));
        
//         if (loginUser.fulfilled.match(result)) {
//           // Login successful - navigate to dashboard or home
//           console.log('Login successful, navigating...');
//           navigate("/dashboard"); // Adjust the route as needed
//         } else if (loginUser.rejected.match(result)) {
//           // Login failed - error is already set in state
//           console.error('Login failed:', result.error);
//         }
//       } catch (error) {
//         console.error('Unexpected error during login:', error);
//       } finally {
//         setSubmitting(false);
//       }
//     },
//   });

//   // Clear Redux error when user starts typing
//   const handleInputFocus = () => {
//     if (error) {
//       dispatch(clearError());
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6" id="logbg">
//       <div className="w-full max-w-md bg-white shadow-xl border border-gray-100 rounded-2xl overflow-hidden">
//         <div className="bg-gradient-to-r from-blue-600 to-purple-700 py-8 relative">
//           <div className="absolute inset-0 opacity-10">
//             <div className="absolute inset-0" style={{
//               backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
//               backgroundSize: '20px 20px'
//             }}></div>
//           </div>
//           <div className="relative z-10 text-center">
//             <h1 className="text-3xl font-bold text-white">Welcome Back!</h1>
//             <p className="text-blue-100 mt-2">Sign in to your account</p>
//           </div>
//         </div>

//         <div className="p-8">
//           {/* Display Redux error */}
//           {error && (
//             <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
//               <p className="text-red-700 text-sm flex items-center gap-2">
//                 <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
//                   <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
//                 </svg>
//                 <span className="font-medium">Login Error:</span> {error}
//               </p>
//               <p className="text-red-600 text-xs mt-1">
//                 {error.includes('Network') || error.includes('ERR_NETWORK') 
//                   ? "Cannot connect to server. Please check if the backend is running on port 5000."
//                   : "Please check your credentials and try again."
//                 }
//               </p>
//             </div>
//           )}

//           <form onSubmit={formik.handleSubmit} noValidate>
//             {/* Email Field with Icon */}
//             <div className="mb-5">
//               <label className="block text-lg font-semibold mb-3 text-gray-900">Email Address</label>
//               <div className="relative">
//                 <input
//                   name="email"
//                   id="email"
//                   value={formik.values.email}
//                   onChange={formik.handleChange}
//                   onBlur={formik.handleBlur}
//                   onFocus={handleInputFocus}
//                   type="email"
//                   className="w-full h-11 bg-gray-100 rounded-lg py-4 px-4 pl-4 pr-12 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300 border border-gray-200 transition-colors"
//                   placeholder="Enter your email address"
//                 />
//                 <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
//                   <EmailIcon />
//                 </div>
//               </div>
//               {formik.touched.email && formik.errors.email && (
//                 <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
//                   <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
//                     <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
//                   </svg>
//                   {formik.errors.email}
//                 </p>
//               )}
//             </div>

//             {/* Password Field with Icon */}
//             <div className="mb-6">
//               <label className="block text-lg font-semibold mb-3 text-gray-900">Password</label>
//               <div className="relative">
//                 <input
//                   name="password"
//                   id="password"
//                   type="password"
//                   value={formik.values.password}
//                   onChange={formik.handleChange}
//                   onBlur={formik.handleBlur}
//                   onFocus={handleInputFocus}
//                   className="w-full h-11 bg-gray-100 rounded-lg py-4 px-4 pl-4 pr-12 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300 border border-gray-200 transition-colors"
//                   placeholder="Enter your password"
//                   autoComplete="current-password"
//                 />
//                 <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
//                   <LockIcon />
//                 </div>
//               </div>
//               {formik.touched.password && formik.errors.password && (
//                 <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
//                   <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
//                     <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
//                   </svg>
//                   {formik.errors.password}
//                 </p>
//               )}
//             </div>

//             {/* Submit button */}
//             <div className="mb-4">
//               <button
//                 type="submit"
//                 disabled={loading || formik.isSubmitting}
//                 className="w-full bg-gradient-to-r from-blue-600 to-purple-700 text-white text-lg font-semibold py-4 rounded-lg hover:from-blue-700 hover:to-purple-800 transition disabled:opacity-60 flex items-center justify-center gap-2 shadow-md transform hover:scale-105 transition-transform duration-200"
//               >
//                 {loading || formik.isSubmitting ? (
//                   <>
//                     <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
//                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                     </svg>
//                     Signing In...
//                   </>
//                 ) : (
//                   <>
//                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
//                     </svg>
//                     Sign In
//                   </>
//                 )}
//               </button>
//             </div>
//           </form>

//           {/* Forgot password and registration links */}
//           <div className="text-center space-y-3">
            
//             <div className="text-sm text-gray-700">
//               Don't have an account?{" "}
//               <button
//                 type="button"
//                 onClick={() => navigate("/register")}
//                 className="text-blue-600 font-semibold hover:underline transition-colors hover:text-blue-700"
//               >
//                 Register here
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Login;

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearError } from "../Slice.jsx";

// Icons (using Heroicons)
const EmailIcon = () => (
  <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const LockIcon = () => (
  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

// Eye icons for password toggle
const EyeOpenIcon = () => (
  <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeClosedIcon = () => (
  <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
);

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Toggle state for password visibility
  const [showPassword, setShowPassword] = useState(false);

  // Get Redux state
  const { loading, error, currentUser } = useSelector(state => state.user);

  // Toggle function
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validate: (values) => {
      const errors = {};
      if (!values.email) errors.email = "Email is required.";
      if (!values.password) errors.password = "Password is required.";
      return errors;
    },
    onSubmit: async (values, { setSubmitting }) => {
      try {
        // Clear previous errors
        dispatch(clearError());
        
        console.log('Login form submission started with values:', values);

        // Dispatch the login action
        const result = await dispatch(loginUser(values));
        
        if (loginUser.fulfilled.match(result)) {
          // Login successful - navigate to dashboard or home
          console.log('Login successful, navigating...');
          navigate("/dashboard"); // Adjust the route as needed
        } else if (loginUser.rejected.match(result)) {
          // Login failed - error is already set in state
          console.error('Login failed:', result.error);
        }
      } catch (error) {
        console.error('Unexpected error during login:', error);
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Clear Redux error when user starts typing
  const handleInputFocus = () => {
    if (error) {
      dispatch(clearError());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6" id="logbg">
      {/* Glass effect container */}
      <div className="w-full max-w-md bg-white/3 backdrop-blur-lg shadow-xl border border-white/30 rounded-2xl overflow-hidden relative">
        {/* Frosted glass overlay */}
        <div className="absolute inset-0 bg-white/3 backdrop-blur-sm"></div>
        
        {/* Content */}
        <div className="relative z-10">
          <div className="bg-gradient-to-r from-blue-600/80 to-purple-700/80 py-8 relative">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                backgroundSize: '20px 20px'
              }}></div>
            </div>
            <div className="relative z-10 text-center">
              <h1 className="text-3xl font-bold text-white">Welcome Back!</h1>
              <p className="text-blue-100 mt-2">Sign in to your account</p>
            </div>
          </div>

          <div className="p-8">
            {/* Display Redux error */}
            {error && (
              <div className="mb-4 p-3 bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">Login Error:</span> {error}
                </p>
                <p className="text-red-600 text-xs mt-1">
                  {error.includes('Network') || error.includes('ERR_NETWORK') 
                    ? "Cannot connect to server. Please check if the backend is running on port 5000."
                    : "Please check your credentials and try again."
                  }
                </p>
              </div>
            )}

            <form onSubmit={formik.handleSubmit} noValidate>
              {/* Email Field with Icon */}
              <div className="mb-5">
                <label className="block text-lg text-white font-semibold mb-3 text-gray-800">Email Address</label>
                <div className="relative">
                  <input
                    name="email"
                    id="email"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    onFocus={handleInputFocus}
                    type="email"
                    className="w-full h-11 bg-white/60 backdrop-blur-sm rounded-lg py-4 px-4 pl-4 pr-12 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-300 border border-white/50 transition-colors"
                    placeholder="Enter your email address"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <EmailIcon />
                  </div>
                </div>
                {formik.touched.email && formik.errors.email && (
                  <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {formik.errors.email}
                  </p>
                )}
              </div>

              {/* Password Field with Icon and Toggle */}
              <div className="mb-6">
                <label className="block text-lg text-white font-semibold mb-3 text-gray-800">Password</label>
                <div className="relative">
                  <input
                    name="password"
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    onFocus={handleInputFocus}
                    className="w-full h-11 bg-white/60 backdrop-blur-sm rounded-lg py-4 px-4 pl-4 pr-12 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-300 border border-white/50 transition-colors"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                    >
                      {showPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}
                    </button>
                  </div>
                </div>
                {formik.touched.password && formik.errors.password && (
                  <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {formik.errors.password}
                  </p>
                )}
              </div>

              {/* Submit button */}
              <div className="mb-4">
                <button
                  type="submit"
                  disabled={loading || formik.isSubmitting}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-800 text-white text-lg font-semibold py-4 rounded-lg hover:from-blue-700 hover:to-purple-800 transition disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg transform hover:scale-105 transition-transform duration-200 backdrop-blur-sm"
                >
                  {loading || formik.isSubmitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing In...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      Sign In
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Forgot password and registration links */}
            <div className="text-center space-y-3">
              <div className="text-sm text-white text-gray-800">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/register")}
                  className="text-blue-800 font-semibold hover:underline transition-colors hover:text-blue-900"
                >
                  Register here
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;