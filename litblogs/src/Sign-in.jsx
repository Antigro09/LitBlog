import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import './LitBlogs.css'; // Import any custom styles here
import axios from 'axios';
import Loader from './components/Loader';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const dropdownRef = useRef(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  const toggleDarkMode = () => {
    setDarkMode((prevDarkMode) => {
      const newDarkMode = !prevDarkMode;
      localStorage.setItem('darkMode', JSON.stringify(newDarkMode));
      return newDarkMode;
    });
  };

  useEffect(() => {
    const storedDarkMode = JSON.parse(localStorage.getItem('darkMode'));
    if (storedDarkMode !== null) {
      setDarkMode(storedDarkMode);
    } else {
      const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setDarkMode(systemPrefersDark);
    }
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");
    
    try {
      const response = await axios.post('http://localhost:8000/api/auth/login', {
        email,
        password
      });

      // Check if the response indicates this is a Google account
      if (response.data.auth_type === 'google') {
        setErrorMessage("This account was created with Google. Please use the Google Sign-In button below.");
        setIsLoading(false);
        return;
      }

      // Store the token
      localStorage.setItem('token', response.data.access_token);
      
      // Store user info
      const userInfo = {
        role: response.data.role,
        userId: response.data.user_id,
        username: response.data.username,
        firstName: response.data.first_name,
      };
      localStorage.setItem('user_info', JSON.stringify(userInfo));
      
      // For students, store class info if available
      if (response.data.role === 'STUDENT' && response.data.class_info) {
        const classInfo = {
          id: response.data.class_info.id,
          name: response.data.class_info.name,
          code: response.data.class_info.access_code
        };
        localStorage.setItem('class_info', JSON.stringify(classInfo));
      }
      
      // Redirect based on role
      if (response.data.role === 'STUDENT') {
        navigate('/student-hub');
      } else if (response.data.role === 'TEACHER') {
        navigate('/teacher-dashboard');
      } else if (response.data.role === 'ADMIN') {
        navigate('/admin-dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Check if the error is related to Google authentication
      if (error.response?.status === 401 && 
          error.response?.data?.detail?.includes('Google')) {
        setErrorMessage("This account uses Google authentication. Please sign in with the Google button below.");
      } else {
        setErrorMessage(error.response?.data?.detail || "Login failed. Please check your email and password.");
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGoogleSuccess = async (response) => {
    try {
      setIsLoading(true);
      setErrorMessage("");
      
      const backendResponse = await axios.post('http://localhost:8000/api/auth/google-login', {
        token: response.credential
      });
      
      // Store the token
      localStorage.setItem('token', backendResponse.data.access_token);
      
      // Store user info
      const userInfo = {
        role: backendResponse.data.role,
        userId: backendResponse.data.id,
        username: backendResponse.data.username,
        firstName: backendResponse.data.first_name,
      };
      localStorage.setItem('user_info', JSON.stringify(userInfo));
      
      // For students, store class info if available
      if (backendResponse.data.role === 'STUDENT' && backendResponse.data.class_info) {
        const classInfo = {
          id: backendResponse.data.class_info.id,
          name: backendResponse.data.class_info.name,
          code: backendResponse.data.class_info.access_code
        };
        localStorage.setItem('class_info', JSON.stringify(classInfo));
      }
      
      // Redirect based on role
      if (backendResponse.data.role === 'STUDENT') {
        navigate('/student-hub');
      } else if (backendResponse.data.role === 'TEACHER') {
        navigate('/teacher-dashboard');
      } else if (backendResponse.data.role === 'ADMIN') {
        navigate('/admin-dashboard');
      }
    } catch (error) {
      console.error("Google Login Error:", error);
      
      // Check if the user needs to sign up first
      if (error.response?.status === 404) {
        setErrorMessage("Account not found. Please sign up with Google first.");
      } else {
        setErrorMessage(error.response?.data?.detail || "Google login failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

    // Missing implementation of handleGoogleFailure
  const handleGoogleFailure = (error) => {
    console.error('Google login error:', error);
    setErrorMessage('Google sign-in failed. Please try again.');
  };

return (
    <div className={`min-h-screen flex items-center justify-center transition-all duration-500 ${darkMode ? 'bg-gradient-to-r from-slate-800 to-gray-950 text-gray-200' : 'bg-gradient-to-r from-indigo-100 to-pink-100 text-gray-900'}`}>
      {/* Navbar */}
      <motion.nav 
        className="navbar z-50 fixed top-2 left-470 transform -translate-x-1/2 w-auto bg-white/80 dark:bg-gray-800/80 backdrop-blur-md py-2 px-6 rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="flex items-center gap-6 whitespace-nowrap">
          {/* Logo */}
          <Link to="/">
            <motion.img
              src="/logo.png"
              alt="Logo"
              className="h-8 transition-transform duration-300 hover:scale-110 cursor-pointer"
              whileHover={{ scale: 1.1 }}
            />
          </Link>

          {/* Links (Visible on Larger Screens) */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className={`text-gray-900 dark:text-white hover:${darkMode ? 'text-cyan-400' : 'text-blue-500'} transition-colors duration-300 text-sm md:text-base`}
            >
              Home
            </Link>
          </div>

          {/* Dropdown Menu (Visible on Smaller Screens) */}
          <div className="md:hidden relative" ref={dropdownRef}>
            <button
              onClick={toggleDropdown}
              className="text-gray-900 dark:text-white hover:text-blue-500 transition-colors duration-300 focus:outline-none"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-6 w-6 transition-transform duration-300 ${isDropdownOpen ? "rotate-90" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            {/* Dropdown Content */}
            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg py-2"
                >
                  <Link
                    to="/"
                    className="block px-4 py-2 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 truncate"
                  >
                    Home
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.nav>
      <GoogleOAuthProvider clientId="653922429771-qdjgvs7vkrcd7g4o2oea12t097ah4eog.apps.googleusercontent.com">
      <motion.div
        className="max-w-md w-full mt-16 mb-16 p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 top-5"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* Sign In Form */}
        <motion.h2
          className="text-4xl font-semibold text-center mb-6 dark:bg-gray-800"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Sign In
        </motion.h2>

        <form onSubmit={handleSubmit}>
          <motion.div
            className="mb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <label htmlFor="email" className="block text-sm font-medium mb-2">Email Address</label>
            <input
              id="email"
              type="email"
              className={`w-full p-4 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 transform focus:scale-105`}
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </motion.div>

          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <label htmlFor="password" className="block text-sm font-medium mb-2">Password</label>
            <input
              id="password"
              type="password"
              className={`w-full p-4 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 transform focus:scale-105`}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </motion.div>

          {errorMessage && (
            <motion.p
              className="text-red-500 text-sm text-center mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              {errorMessage}
            </motion.p>
          )}

          <motion.button
            type="submit"
            className={`w-full p-4 text-white rounded-lg text-lg focus:outline-none ${darkMode ? 'bg-teal-700 hover:bg-teal-600' : 'bg-blue-600 hover:bg-blue-700'} transition-colors duration-300`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Sign In
          </motion.button>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/forgot-password"
            className={`text-sm text-blue-500 hover:text-blue-700 transition duration-300 ${darkMode ? 'hover:text-blue-400' : 'hover:text-blue-600'}`}
          >
            Forgot Password?
          </Link>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm">
            Don't have an account?{" "}<Link
              to="/sign-up"
              className={`text-blue-500 hover:text-blue-700 transition duration-300 ${darkMode ? 'hover:text-blue-400' : 'hover:text-blue-600'}`}
            >
              Sign Up
            </Link>
          </p>
        </div>
        <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        >
          <div className="mt-6 text-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleFailure}
            />
          </div>
        </motion.div>
      </motion.div>
      </GoogleOAuthProvider>
      <motion.div
        className="absolute top-6 right-6 z-10"
        whileHover={{ scale: 1.1 }}
      >
        <button
          onClick={toggleDarkMode}
          className="bg-gray-800 text-white p-2 rounded-full shadow-lg"
        >
          {darkMode ? "🌞" : "🌙"}
        </button>
      </motion.div>

      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <Loader />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SignIn;
