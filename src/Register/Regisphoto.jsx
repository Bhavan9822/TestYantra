// !
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import { useDispatch, useSelector } from "react-redux";
import { registerUser } from "../Slice";
import  clearError  from "../Slice";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Cropper from "react-cropper";
import imageCompression from 'browser-image-compression';
import "../Style.css";

// Icons (using Heroicons) - Keep all your existing icons
function UserIcon() {
  return (
    <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function EyeOpenIcon() {
  return (
    <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function EyeClosedIcon() {
  return (
    <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );
}

const Regisphoto = () => {
  const [imagePreview, setImagePreview] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [originalImage, setOriginalImage] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showCpassword, setShowCpassword] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error, success } = useSelector((state) => state.auth);
  
  const fileInputRef = useRef(null);
  const cropperRef = useRef(null);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

  useEffect(() => {
    if (success) {
      setRegistrationSuccess(true);
      toast.success('Registration successful! Redirecting to login...');
      const timer = setTimeout(() => {
        navigate("/", { state: { registered: true } });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [success, navigate]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleCpasswordVisibility = () => setShowCpassword(!showCpassword);

  const formik = useFormik({
    initialValues: {
      profilePhoto: null,
      username: "",
      email: "",
      password: "",
      cpassword: "",
    },
    validate: (values) => {
      const errors = {};
      if (!values.username?.trim()) errors.username = "Full username is required.";
      if (!values.email?.trim()) errors.email = "Email is required.";
      else if (!emailRegex.test(values.email)) errors.email = "Enter a valid email.";
      if (!values.password) errors.password = "Password is required.";
      else if (!passwordRegex.test(values.password))
        errors.password = "Password must be 8+ chars, include upper, lower, digit and special char.";
      if (!values.cpassword) errors.cpassword = "Please confirm password.";
      else if (values.password !== values.cpassword) errors.cpassword = "Passwords do not match.";
      return errors;
    },
    onSubmit: async (values, { resetForm }) => {
      setRegistrationSuccess(false);

      // Send the Base64 string directly (already converted in handleCrop)
      const result = await dispatch(registerUser({
        username: values.username.trim(),
        email: values.email.trim(),
        password: values.password,
        profilePhoto: values.profilePhoto // This is already Base64 from handleCrop
      }));

      if (registerUser.fulfilled.match(result)) {
        resetForm();
        if (fileInputRef.current) fileInputRef.current.value = "";
        if (imagePreview) {
          try { URL.revokeObjectURL(imagePreview); } catch {}
          setImagePreview(null);
        }
        setOriginalImage(null);
        setShowCropper(false);
      }
    },
  });

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      formik.setFieldError("profilePhoto", "Please select an image file.");
      toast.error("Please select an image file.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      formik.setFieldError("profilePhoto", "Image must be smaller than 5 MB.");
      toast.error("Image must be smaller than 5 MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Compress the image before showing cropper to reduce upload size
    let compressedFile = file;
    try {
      const options = {
        maxSizeMB: 0.4,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
      };
      compressedFile = await imageCompression(file, options);
    } catch (err) {
      console.warn('Image compression failed, using original file', err);
      compressedFile = file;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setOriginalImage(event.target.result);
      setShowCropper(true);
    };
    reader.readAsDataURL(compressedFile);
  };

  const handleCrop = () => {
    if (cropperRef.current && cropperRef.current.cropper) {
      const cropper = cropperRef.current.cropper;
      const canvas = cropper.getCroppedCanvas({
        width: 200,
        height: 200,
        fillColor: "#fff",
        imageSmoothingEnabled: true,
        imageSmoothingQuality: "high",
      });

      if (!canvas) {
        console.error("Canvas is null - cannot crop image");
        toast.error("Failed to crop image");
        return;
      }

      // Convert canvas to Blob, compress it, then store as a File so backend receives multipart/form-data
      canvas.toBlob(async (blob) => {
        if (!blob) {
          console.error('Canvas toBlob produced null');
          toast.error('Failed to produce image blob');
          return;
        }

        try {
          // Compress the cropped blob to reduce payload
          const options = {
            maxSizeMB: 0.8,
            maxWidthOrHeight: 800,
            useWebWorker: true,
          };
          const compressedBlob = await imageCompression(blob, options);

          // Create a File from the blob so FormData can be used
          const fileName = `profile_${Date.now()}.png`;
          const file = new File([compressedBlob], fileName, { type: compressedBlob.type || 'image/png' });

          // Update preview using an object URL (more efficient than base64)
          try { if (imagePreview) URL.revokeObjectURL(imagePreview); } catch {}
          const objectUrl = URL.createObjectURL(file);
          setImagePreview(objectUrl);

          formik.setFieldValue("profilePhoto", file);
          formik.setFieldError("profilePhoto", undefined);
          setShowCropper(false);
          toast.success("Profile photo ready!");
        } catch (err) {
          console.warn('Error compressing cropped image, falling back to base64', err);
          // Fallback: use base64 (less ideal but ensures functionality)
          try {
            const base64Data = canvas.toDataURL('image/png', 0.9);
            setImagePreview(base64Data);
            formik.setFieldValue('profilePhoto', base64Data);
            formik.setFieldError('profilePhoto', undefined);
            setShowCropper(false);
            toast.success('Profile photo ready!');
          } catch (e) {
            console.error('Fallback conversion failed', e);
            toast.error('Failed to prepare profile photo');
          }
        }
      }, 'image/png', 0.95);
    }
  };

  const cancelCrop = () => {
    setShowCropper(false);
    setOriginalImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    formik.setFieldValue("profilePhoto", null);
  };

  const handleInputFocus = () => {
    if (error) {
      dispatch(clearError());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-300 to-purple-500 flex items-center justify-center p-6" id="bg">
      <ToastContainer position="top-right" autoClose={3000} />
      <div
        className="w-full max-w-lg shadow-xl border border-white/50 rounded-2xl overflow-hidden relative"
        style={{
          background: "rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(30px)",
          boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
        }}
      >
        <div className="relative z-10" id="id1">
          <div
            className="py-2 h-[130px] relative overflow-visible"
            id="id3"
            style={{
              background: "linear-gradient(135deg, rgba(59, 130, 246, 0.8) 0%, rgba(126, 58, 242, 0.8) 100%)",
            }}
          >
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                backgroundSize: "20px 20px",
              }}
            ></div>

            <div className="relative z-10" id="id2">
              <div className="absolute left-1/2 transform -translate-x-1/2 -bottom-55" id="photo">
                <div
                  className="w-28 h-28 rounded-full flex items-center justify-center border-4 border-white/50 shadow-2xl profile-avatar"
                  style={{
                    background: "rgba(243, 244, 246, 0.8)",
                    backdropFilter: "blur(10px)",
                    WebkitBackdropFilter: "blur(10px)",
                  }}
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="avatar" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <div
                      className="w-[40px] h-[40px] rounded-full flex items-center justify-center"
                      style={{
                        background: "rgba(243, 244, 246, 0.8)",
                        backdropFilter: "blur(10px)",
                        WebkitBackdropFilter: "blur(10px)",
                      }}
                    >
                      <CameraIcon />
                    </div>
                  )}
                </div>

                <div className="mt-9 text-center" id="upload">
                  <label
                    htmlFor="profilePhoto"
                    className="text-white h-[35px] font-semibold cursor-pointer inline-flex items-center gap-2 hover:bg-blue-700 transition-colors px-4 py-2 rounded-lg border border-white/20"
                    style={{
                      background: "rgba(37, 99, 235, 0.9)",
                      backdropFilter: "blur(10px)",
                      WebkitBackdropFilter: "blur(10px)",
                    }}
                  >
                    <span>Upload Photo</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <polyline points="17 8 12 3 7 8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <line x1="12" y1="3" x2="12" y2="15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </label>
                  <input
                    id="profilePhoto"
                    name="profilePhoto"
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-20 px-8 pb-8" id="id4">
            {registrationSuccess && (
              <div
                className="mb-4 p-3 border border-green-200 rounded-lg"
                style={{
                  background: "rgba(240, 253, 244, 0.8)",
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                }}
              >
                <p className="text-green-700 text-sm flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">Registration Successful!</span> Redirecting to login page...
                </p>
              </div>
            )}

            <form onSubmit={formik.handleSubmit} noValidate>
              <div className="mb-5">
                <label className="block text-lg font-semibold mb-3 text-white">Full Name</label>
                <div className="relative">
                  <input
                    name="username"
                    id="username"
                    value={formik.values.username}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    onFocus={handleInputFocus}
                    className="w-full h-11 rounded-lg py-2 px-4 pl-4 pr-12 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-white/50 transition-colors"
                    placeholder="Enter your full name"
                    style={{
                      background: "rgba(255, 255, 255, 0.6)",
                      backdropFilter: "blur(10px)",
                      WebkitBackdropFilter: "blur(10px)",
                    }}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <UserIcon />
                  </div>
                </div>
                {formik.touched.username && formik.errors.username && (
                  <p className="text-sm text-red-500 mt-2 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {formik.errors.username}
                  </p>
                )}
              </div>

              <div className="mb-5">
                <label className="block text-lg font-semibold mb-3 text-white">Email Address</label>
                <div className="relative">
                  <input
                    name="email"
                    id="email"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    onFocus={handleInputFocus}
                    type="email"
                    className="w-full h-11 rounded-lg py-4 px-4 pl-4 pr-12 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-white/50 transition-colors"
                    placeholder="Enter your email address"
                    style={{
                      background: "rgba(255, 255, 255, 0.6)",
                      backdropFilter: "blur(10px)",
                      WebkitBackdropFilter: "blur(10px)",
                    }}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <EmailIcon />
                  </div>
                </div>
                {formik.touched.email && formik.errors.email && (
                  <p className="text-sm text-red-500 mt-2 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {formik.errors.email}
                  </p>
                )}
              </div>

              <div className="mb-5">
                <label className="block text-lg font-semibold mb-3 text-white">Password</label>
                <div className="relative">
                  <input
                    name="password"
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    onFocus={handleInputFocus}
                    className="w-full h-11 rounded-lg py-4 px-4 pl-4 pr-12 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-white/50 transition-colors"
                    placeholder="Create password"
                    autoComplete="new-password"
                    style={{
                      background: "rgba(255, 255, 255, 0.6)",
                      backdropFilter: "blur(10px)",
                      WebkitBackdropFilter: "blur(10px)",
                    }}
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
                  <p className="text-sm text-red-500 mt-2 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {formik.errors.password}
                  </p>
                )}
              </div>

              <div className="mb-6">
                <label className="block text-lg font-semibold mb-3 text-white">Confirm Password</label>
                <div className="relative">
                  <input
                    name="cpassword"
                    id="cpassword"
                    type={showCpassword ? "text" : "password"}
                    value={formik.values.cpassword}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    onFocus={handleInputFocus}
                    className="w-full h-11 rounded-lg py-4 px-4 pl-4 pr-12 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-white/50 transition-colors"
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                    style={{
                      background: "rgba(255, 255, 255, 0.6)",
                      backdropFilter: "blur(10px)",
                      WebkitBackdropFilter: "blur(10px)",
                    }}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                      type="button"
                      onClick={toggleCpasswordVisibility}
                      className="text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                    >
                      {showCpassword ? <EyeClosedIcon /> : <EyeOpenIcon />}
                    </button>
                  </div>
                </div>
                {formik.touched.cpassword && formik.errors.cpassword && (
                  <p className="text-sm text-red-500 mt-2 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {formik.errors.cpassword}
                  </p>
                )}
              </div>

              <div className="mb-4">
                <button
                  type="submit"
                  disabled={loading || formik.isSubmitting || registrationSuccess}
                  className="w-full text-white text-lg font-semibold py-4 rounded-lg transition disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg transform hover:scale-105 transition-transform duration-200"
                  style={{
                    background: "linear-gradient(135deg, rgb(59, 130, 246) 0%, rgb(126, 58, 242) 100%)",
                    backdropFilter: "blur(10px)",
                    WebkitBackdropFilter: "blur(10px)",
                  }}
                >
                  {loading || formik.isSubmitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Registering...
                    </>
                  ) : registrationSuccess ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Registration Successful!
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                      Register
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="text-center text-sm text-white">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => navigate("/")}
                className="text-blue-800 font-semibold hover:underline transition-colors hover:text-blue-900"
              >
                Login here
              </button>
            </div>
          </div>
        </div>

        {showCropper && originalImage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 cropper-modal-overlay">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden cropper-modal-content">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">Crop Your Profile Picture</h3>
                <p className="text-sm text-gray-600 mt-1">Adjust the crop area and click Save when done</p>
              </div>

              <div className="p-4 max-h-[60vh] overflow-auto">
                <Cropper
                  ref={cropperRef}
                  src={originalImage}
                  style={{ height: 400, width: "100%" }}
                  aspectRatio={1}
                  guides={true}
                  background={false}
                  responsive={true}
                  autoCropArea={1}
                  checkOrientation={false}
                  viewMode={1}
                  minCropBoxHeight={100}
                  minCropBoxWidth={100}
                />
              </div>

              <div className="p-4 border-t border-gray-200 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={cancelCrop}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCrop}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Cropped Image
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
export default Regisphoto;