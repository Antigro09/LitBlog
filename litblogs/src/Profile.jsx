import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from 'axios';
import Navbar from "./components/Navbar";
import Loader from "./components/Loader";

const Profile = () => {
  const [name, setName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bio, setBio] = useState("Share a little about yourself...");
  const [image, setImage] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode((prevDarkMode) => {
      const newDarkMode = !prevDarkMode;
      localStorage.setItem('darkMode', JSON.stringify(newDarkMode));
      return newDarkMode;
    });
  };

  // Load dark mode preference from localStorage
  useEffect(() => {
    const storedDarkMode = JSON.parse(localStorage.getItem('darkMode'));
    if (storedDarkMode !== null) {
      setDarkMode(storedDarkMode);
    } else {
      const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setDarkMode(systemPrefersDark);
    }
  }, []);

  // Apply the dark mode class to the document when darkMode changes
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Load user info and fetch posts
  useEffect(() => {
    const storedUserInfo = localStorage.getItem('user_info');
    if (storedUserInfo) {
      const parsedUserInfo = JSON.parse(storedUserInfo);
      setUserInfo(parsedUserInfo);
      
      // Use stored user info directly
      if (parsedUserInfo.first_name && parsedUserInfo.last_name) {
        setName(`${parsedUserInfo.first_name} ${parsedUserInfo.last_name}`);
        setFirstName(parsedUserInfo.first_name);
        setLastName(parsedUserInfo.last_name);
      } else if (parsedUserInfo.username) {
        setName(parsedUserInfo.username);
      }
      
      if (parsedUserInfo.bio) {
        setBio(parsedUserInfo.bio);
      }
      
      if (parsedUserInfo.profile_image) {
        setImage(parsedUserInfo.profile_image);
      }
      
      if (parsedUserInfo.cover_image) {
        setCoverImage(parsedUserInfo.cover_image);
      }
      
      // Fetch user's posts
      fetchUserPosts(parsedUserInfo);
      setLoading(false);
    } else {
      // Redirect to login if no user info
      navigate('/sign-in');
    }
  }, [navigate]);

  // Fetch user's posts
  const fetchUserPosts = async (user) => {
    if (!user) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/sign-in');
        return;
      }

      // Use the student posts endpoint from your backend
      const endpoint = user.role === "STUDENT" 
        ? 'http://localhost:8000/api/student/posts'
        : 'http://localhost:8000/api/teacher/posts';

      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data) {
        setUserPosts(response.data);
      }
    } catch (error) {
      console.error("Error fetching user posts:", error);
      setUserPosts([]);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Create preview for immediate feedback
    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result);
    };
    reader.readAsDataURL(file);
    
    // Upload to server
    if (isEditing) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/sign-in');
          return;
        }
        
        const response = await axios.post(
          'http://localhost:8000/api/user/upload-profile-image',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              'Authorization': `Bearer ${token}`
            },
            onUploadProgress: (progressEvent) => {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setUploadProgress(percentCompleted);
            }
          }
        );
        
        // Update user info in localStorage with new profile image
        const updatedUserInfo = { ...userInfo, profile_image: response.data.image_url };
        localStorage.setItem('user_info', JSON.stringify(updatedUserInfo));
        setUserInfo(updatedUserInfo);
        
        // Reset upload progress
        setTimeout(() => setUploadProgress(0), 1000);
      } catch (error) {
        console.error("Error uploading profile image:", error);
        // Keep the preview but show an error
        setError("Failed to upload profile image. Please try again.");
      }
    }
  };

  const handleCoverImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Create preview for immediate feedback
    const reader = new FileReader();
    reader.onloadend = () => {
      setCoverImage(reader.result);
    };
    reader.readAsDataURL(file);
    
    // Upload to server
    if (isEditing) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/sign-in');
          return;
        }
        
        const response = await axios.post(
          'http://localhost:8000/api/user/upload-cover-image',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              'Authorization': `Bearer ${token}`
            },
            onUploadProgress: (progressEvent) => {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setUploadProgress(percentCompleted);
            }
          }
        );
        
        // Update user info in localStorage with new cover image
        const updatedUserInfo = { ...userInfo, cover_image: response.data.image_url };
        localStorage.setItem('user_info', JSON.stringify(updatedUserInfo));
        setUserInfo(updatedUserInfo);
        
        // Reset upload progress
        setTimeout(() => setUploadProgress(0), 1000);
      } catch (error) {
        console.error("Error uploading cover image:", error);
        setError("Failed to upload cover image. Please try again.");
      }
    }
  };

  const saveProfileChanges = async () => {
    try {
      setSaving(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/sign-in');
        return;
      }
      
      // Prepare data to update
      const profileData = {
        bio: bio,
        first_name: firstName,
        last_name: lastName
      };
      
      // Send update to server
      await axios.post(
        'http://localhost:8000/api/user/update-profile',
        profileData,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      // Update local user info
      const updatedUserInfo = { 
        ...userInfo, 
        bio: bio,
        first_name: firstName,
        last_name: lastName
      };
      
      localStorage.setItem('user_info', JSON.stringify(updatedUserInfo));
      setUserInfo(updatedUserInfo);
      setName(`${firstName} ${lastName}`);
      
      // Exit edit mode
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving profile changes:", error);
      setError("Failed to save profile changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_info');
    localStorage.removeItem('class_info');
    setUserInfo(null);
    navigate('/');
  };

  if (loading) {
    return (
      <div className={`min-h-screen transition-all duration-500 ${darkMode ? 'bg-gradient-to-r from-slate-800 to-gray-950 text-gray-200' : 'bg-gradient-to-r from-indigo-100 to-pink-100 text-gray-900'}`}>
        <Navbar 
          userInfo={userInfo}
          onSignOut={handleSignOut}
          darkMode={darkMode}
          logo="./logo.png"
        />
        <div className="flex justify-center items-center h-screen">
          <Loader />
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-all duration-500 ${darkMode ? 'bg-gradient-to-r from-slate-800 to-gray-950 text-gray-200' : 'bg-gradient-to-r from-indigo-100 to-pink-100 text-gray-900'}`}>
      {/* Navbar */}
      <Navbar 
        userInfo={userInfo}
        onSignOut={handleSignOut}
        darkMode={darkMode}
        logo="./logo.png"
      />
      
      {/* Toggle Dark Mode Button */}
      <motion.div
        className="fixed top-5 right-4 z-10 transition-transform transform hover:scale-110"
        whileHover={{ scale: 1.1 }}
      >
        <button
          onClick={toggleDarkMode}
          className="bg-gray-800 text-white p-2 rounded-full shadow-lg"
        >
          {darkMode ? "🌞" : "🌙"}
        </button>
      </motion.div>
      
      {/* Error message if any */}
      {error && (
        <div className="fixed top-20 right-4 z-50 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg">
          {error}
          <button 
            className="ml-3 text-white"
            onClick={() => setError(null)}
          >
            ✕
          </button>
        </div>
      )}
      
      <main className="container mx-auto px-4 py-20">
        {/* Profile Header Card */}
        <motion.div 
          className={`rounded-xl shadow-xl overflow-hidden mb-10 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Cover Image */}
          <div className="h-64 w-full relative overflow-hidden">
            <img
              src={coverImage || "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&q=80"}
              alt="Cover"
              className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
            />
            {isEditing && (
              <label htmlFor="coverImageUpload" className="cursor-pointer absolute bottom-4 right-4 rounded-full bg-black/30 hover:bg-black/50 p-2 text-white">
                <input
                  type="file"
                  id="coverImageUpload"
                  accept="image/*"
                  onChange={handleCoverImageUpload}
                  className="hidden"
                />
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
                  <circle cx="12" cy="13" r="3"></circle>
                </svg>
              </label>
            )}
            
            {/* Upload Progress Indicator */}
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-center py-2">
                Uploading... {uploadProgress}%
                <div className="w-full mt-1 bg-gray-300 rounded-full h-1.5">
                  <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                </div>
              </div>
            )}
          </div>
          
          {/* Profile Info Section */}
          <div className="px-8 pb-8 relative">
            {/* Profile Pic and Info */}
            <div className="flex flex-col items-center text-center mb-6">
              {/* Profile Picture */}
              <div className="relative mb-6">
                <div className={`h-32 w-32 rounded-full overflow-hidden border-4 ${darkMode ? 'border-gray-700' : 'border-white'} shadow-lg mx-auto`}>
                  {image ? (
                    <img
                      src={typeof image === 'string' ? image : image}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center text-3xl font-bold ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-blue-100 text-blue-500'}`}>
                      {userInfo?.first_name?.[0] || userInfo?.username?.[0] || '?'}
                    </div>
                  )}
                </div>
                
                {isEditing && (
                  <div className="absolute bottom-0 right-0">
                    <label className={`cursor-pointer w-10 h-10 rounded-full flex items-center justify-center ${darkMode ? 'bg-gray-700' : 'bg-white'} border ${darkMode ? 'border-gray-600' : 'border-gray-200'} shadow-md`}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                        <circle cx="12" cy="13" r="4"></circle>
                      </svg>
                    </label>
                  </div>
                )}
                
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                    <div className="text-white text-sm font-bold">{uploadProgress}%</div>
                  </div>
                )}
              </div>
              
              {/* User Info - now centered */}
              <div className="text-center">
                {isEditing ? (
                  <div className="mb-4">
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className={`flex-1 p-2 rounded-lg border ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-800'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        placeholder="First Name"
                      />
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className={`flex-1 p-2 rounded-lg border ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-800'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        placeholder="Last Name"
                      />
                    </div>
                  </div>
                ) : (
                  <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    {name}
                  </h2>
                )}
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  @{userInfo?.username || 'username'}
                </p>
                
                {/* Role Badge */}
                <div className="mt-2">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                    userInfo?.role === "TEACHER" 
                      ? darkMode ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-800'
                      : userInfo?.role === "ADMIN"
                        ? darkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'
                        : darkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {userInfo?.role || 'STUDENT'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Bio Section */}
            <div className="mb-8">
              <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'} text-center`}>
                About Me
              </h3>
              {isEditing ? (
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className={`w-full p-4 rounded-lg border ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-800'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none`}
                  placeholder="Tell us about yourself..."
                  rows={4}
                />
              ) : (
                <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} text-center`}>{bio}</p>
              )}
            </div>
            
            {/* Stats Section */}
            <div className="grid grid-cols-3 gap-4 mb-6 text-center">
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-blue-50'}`}>
                <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{userPosts.length}</div>
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Posts</div>
              </div>
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-blue-50'}`}>
                <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>0</div>
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Followers</div>
              </div>
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-blue-50'}`}>
                <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>0</div>
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Following</div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <motion.button 
                className={`px-6 py-3 rounded-lg font-medium ${
                  darkMode 
                    ? isEditing ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700' 
                    : isEditing ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-500 hover:bg-blue-600'
                } text-white flex items-center justify-center`}
                onClick={isEditing ? saveProfileChanges : () => setIsEditing(true)}
                disabled={saving}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {saving ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                      {isEditing ? (
                        <path d="M5 13l4 4L19 7"></path>
                      ) : (
                        <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                      )}
                    </svg>
                    {isEditing ? "Save Changes" : "Edit Profile"}
                  </>
                )}
              </motion.button>
              
              {isEditing && (
                <motion.button 
                  className={`px-6 py-3 rounded-lg font-medium ${
                    darkMode 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-red-500 hover:bg-red-600'
                  } text-white flex items-center justify-center`}
                  onClick={() => setIsEditing(false)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Cancel
                </motion.button>
              )}
              
              {!isEditing && (
                <motion.button 
                  className={`px-6 py-3 rounded-lg font-medium ${
                    darkMode 
                      ? 'bg-gray-700 hover:bg-gray-600' 
                      : 'bg-gray-200 hover:bg-gray-300'
                  } text-${darkMode ? 'white' : 'gray-800'} flex items-center justify-center`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                    <polyline points="16 6 12 2 8 6"></polyline>
                    <line x1="12" y1="2" x2="12" y2="15"></line>
                  </svg>
                  Share Profile
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
        
        {/* Recent Posts Section */}
        <motion.div
          className={`rounded-xl shadow-xl overflow-hidden p-8 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Your Posts</h2>
          
          {userPosts.length === 0 ? (
            // Empty State
            <div className={`text-center py-12 px-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-blue-50'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={`mx-auto mb-4 ${darkMode ? 'text-gray-400' : 'text-blue-400'}`}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="12" y1="18" x2="12" y2="12"></line>
                <line x1="9" y1="15" x2="15" y2="15"></line>
              </svg>
              <h3 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>No Posts Yet</h3>
              <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Share your first literary creation with the community!</p>
              <Link to="/student-hub">
                <motion.button 
                  className={`px-6 py-3 rounded-lg font-medium ${
                    darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
                  } text-white`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Create Your First Post
                </motion.button>
              </Link>
            </div>
          ) : (
            // User posts list
            <div className="space-y-4">
              {userPosts.map(post => (
                <motion.div 
                  key={post.id}
                  className={`p-5 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} hover:shadow-md transition-shadow`}
                  whileHover={{ y: -2 }}
                >
                  <Link to={`/class/${post.class_id}/post/${post.id}`}>
                    <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      {post.title}
                    </h3>
                  </Link>
                  <div className="flex justify-between items-center">
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {new Date(post.created_at).toLocaleDateString()} • {post.class_name || 'Class'}
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        {post.likes || 0}
                      </span>
                      <span className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        {post.comments || 0}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>
      
      {/* Floating Action Button */}
      <motion.div 
        className="fixed bottom-8 right-8"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Link to="/student-hub">
          <button 
            className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center ${
              darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
            } text-white`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        </Link>
      </motion.div>
    </div>
  );
};

export default Profile;
