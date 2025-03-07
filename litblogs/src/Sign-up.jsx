import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import './LitBlogs.css'; // Import any custom styles here
import axios from 'axios';
import Loader from './components/Loader';
import { GoogleOAuthProvider, GoogleLogin, useGoogleLogin } from '@react-oauth/google';

const SignUp = () => {
  const navigate = useNavigate();
  // State variables for form inputs
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const dropdownRef = useRef(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [role, setRole] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState(null);

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
  // Dark mode logic (same as previous)
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

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!firstName || !lastName || !email || !password || !confirmPassword || !role) {
      setErrorMessage("Please fill in all required fields.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const username = email.split('@')[0];
      const userData = {
        username: username,
        email: email,
        password: password,
        first_name: firstName,
        last_name: lastName,
        role: role,
        access_code: accessCode
      };

      console.log('Sending registration data:', userData);
      const response = await axios.post('http://localhost:8000/api/auth/register', userData);
      console.log('Registration response:', response.data);
      
      if (response.data.token) {
        // Store auth token
        localStorage.setItem('token', response.data.token);
        
        // Store user info
        const userInfo = {
          role: response.data.role,
          userId: response.data.id,
          username: response.data.username,
          firstName: response.data.first_name,
        };
        localStorage.setItem('user_info', JSON.stringify(userInfo));
        
        // For students, store class info
        if (response.data.role === 'STUDENT' && response.data.class_info) {
          const classInfo = {
            id: response.data.class_info.id,
            name: response.data.class_info.name,
            code: response.data.class_info.access_code
          };
          console.log('Storing class info:', classInfo);
          localStorage.setItem('class_info', JSON.stringify(classInfo));
        }
        
        setSuccessData({
          role: response.data.role,
          classInfo: response.data.class_info
        });
        console.log('Set success data:', {
          role: response.data.role,
          classInfo: response.data.class_info
        });
        
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error('Registration error:', error);
      setErrorMessage(error.response?.data?.detail || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Google Sign Up Handlers
  const handleGoogleSignUpSuccess = async (credentialResponse) => {
    try {
      const response = await axios.post('http://localhost:8000/api/auth/google-register', {
        token: credentialResponse.credential
      });
      localStorage.setItem('token', response.data.token);
      const userInfo = {
        role: response.data.role,
        userId: response.data.id,
        username: response.data.username,
        firstName: response.data.first_name,
      };
      localStorage.setItem('user_info', JSON.stringify(userInfo));

      if (response.data.role === 'STUDENT' && response.data.class_info) {
        navigate(`/class-feed/${response.data.class_info.id}`);
      } else if (response.data.role === 'TEACHER') {
        navigate('/teacher-dashboard');
      } else if (response.data.role === 'ADMIN') {
        navigate('/admin-dashboard');
      }
    } catch (error) {
      console.error('Google registration error:', error);
      setErrorMessage('Google registration failed');
    }
  };

  const handleGoogleSignUpFailure = (error) => {
    console.error('Google registration failed:', error);
    setErrorMessage('Google registration failed');
  };

  const googleSignUp = useGoogleLogin({
    onSuccess: handleGoogleSignUpSuccess,
    onError: handleGoogleSignUpFailure,
  });

  return (
    <GoogleOAuthProvider clientId="653922429771-qdjgvs7vkrcd7g4o2oea12t097ah4eog.apps.googleusercontent.com">
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
        <motion.div
          className="max-w-md w-full p-8 mb-16 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 mt-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Sign Up Form */}
          <motion.h2
            className="text-4xl font-semibold text-center mb-6 dark:bg-gray-800"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Sign Up
          </motion.h2>

          <form onSubmit={handleSubmit}>
            {/* First Name Input */}
            <motion.div
              className="mb-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <label htmlFor="firstName" className="block text-sm font-medium mb-2">First Name</label>
              <input
                id="firstName"
                type="text"
                className={`w-full p-4 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 transform focus:scale-105`}
                placeholder="Enter your first name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </motion.div>

            {/* Last Name Input */}
            <motion.div
              className="mb-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <label htmlFor="lastName" className="block text-sm font-medium mb-2">Last Name</label>
              <input
                id="lastName"
                type="text"
                className={`w-full p-4 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 transform focus:scale-105`}
                placeholder="Enter your last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </motion.div>

            {/* Email Input */}
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

            {/* Password Input */}
            <motion.div
              className="mb-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
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

            {/* Confirm Password Input */}
            <motion.div
              className="mb-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                className={`w-full p-4 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 transform focus:scale-105`}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </motion.div>

            <motion.div className="mb-4">
              <label htmlFor="role" className="block text-sm font-medium mb-2">Role</label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className={`w-full p-4 border rounded-lg ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
                required
              >
                <option value="">Select Role</option>
                <option value="STUDENT">Student</option>
                <option value="TEACHER">Teacher</option>
                <option value="ADMIN">Admin</option>
              </select>
            </motion.div>

            {(role === 'TEACHER' || role === 'ADMIN') && (
              <div>
                <label className="block text-sm font-medium mb-2">Access Code</label>
                <input
                  type="text"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  className={`w-full p-3 rounded-lg border ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300'
                  }`}
                  placeholder={`Enter ${role.toLowerCase()} access code`}
                  required
                />
              </div>
            )}

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
              className={`w-full p-4 mb-6 mt-6 text-white rounded-lg text-lg focus:outline-none ${darkMode ? 'bg-teal-700 hover:bg-teal-600' : 'bg-blue-600 hover:bg-blue-700'} transition-colors duration-300`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Sign Up
            </motion.button>
            {/* Google Sign Up Button */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <GoogleLogin
                buttonText={'Sign up with Google'}
                onSuccess={handleGoogleSignUpSuccess}
                onError={handleGoogleSignUpFailure}
                useOneTap
              />
              {/* Custom Google Sign Up Button */}
              <div className="mt-6 text-center">
                <p className="text-sm mb-4">Or sign up with:</p>
                <button
                  onClick={() => googleSignUp()}
                  className="w-full p-4 text-center text-white rounded-lg bg-red-600 hover:bg-red-700 transition-colors duration-300"
                >
                  Sign Up with Google
                </button>
              </div>
            </motion.div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm">
              Already have an account?{" "}
              <Link
                to="/sign-in"
                className={`text-blue-500 hover:text-blue-700 transition duration-300 ${darkMode ? 'hover:text-blue-400' : 'hover:text-blue-600'}`}
              >
                Sign In
              </Link>
            </p>
          </div>
        </motion.div>
        {/* Dark Mode Toggle Button */}
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

        {/* Success Modal */}
        <AnimatePresence>
          {showSuccessModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className={`${
                  darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
                } p-8 rounded-lg shadow-xl max-w-md w-full mx-4`}
              >
                <h2 className="text-2xl font-bold mb-4">Registration Successful!</h2>
                <p className="mb-6">
                  {successData?.role === 'STUDENT'
                    ? "You've been successfully registered as a student. Click below to go to your class hub!"
                    : successData?.role === 'TEACHER'
                    ? "You've been successfully registered as a teacher. Click below to access your dashboard!"
                    : "You've been successfully registered as an admin. Click below to access your dashboard!"}
                </p>
                {successData?.role === 'STUDENT' ? (
                  <Link 
                    to="/student-hub"
                    className={`block w-full p-4 text-center text-white rounded-lg ${
                      darkMode ? 'bg-teal-600 hover:bg-teal-500' : 'bg-blue-600 hover:bg-blue-700'
                    } transition-colors duration-300`}
                  >
                    Go to Student Hub
                  </Link>
                ) : successData?.role === 'TEACHER' ? (
                  <Link 
                    to="/teacher-dashboard"
                    className={`block w-full p-4 text-center text-white rounded-lg ${
                      darkMode ? 'bg-teal-600 hover:bg-teal-500' : 'bg-blue-600 hover:bg-blue-700'
                    } transition-colors duration-300`}
                  >
                    Go to Teacher Dashboard
                  </Link>
                ) : (
                  <Link 
                    to="/admin-dashboard"
                    className={`block w-full p-4 text-center text-white rounded-lg ${
                      darkMode ? 'bg-teal-600 hover:bg-teal-500' : 'bg-blue-600 hover:bg-blue-700'
                    } transition-colors duration-300`}
                  >
                    Go to Admin Dashboard
                  </Link>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </GoogleOAuthProvider>
  );
};

export default SignUp;
