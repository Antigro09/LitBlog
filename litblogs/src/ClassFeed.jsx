import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from 'axios';

const ClassFeed = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [classData, setClassData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    return JSON.parse(localStorage.getItem('darkMode')) ?? false;
  });
  const [newPost, setNewPost] = useState("");
  const [showNewPostForm, setShowNewPostForm] = useState(false);

  useEffect(() => {
    const loadClassFeed = async () => {
      try {
        const storedClassInfo = JSON.parse(localStorage.getItem('class_info'));
        if (storedClassInfo) {
          setClassData(storedClassInfo);
        }
        
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/sign-in');
          return;
        }

        const classResponse = await axios.get(`http://localhost:8000/api/classes/${classId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setClassData(classResponse.data);

        const postsResponse = await axios.get(`http://localhost:8000/api/classes/${classId}/posts`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPosts(postsResponse.data);
        setLoading(false);
      } catch (error) {
        if (error.response?.status === 403) {
          navigate('/sign-in');
        }
        setError(error.response?.data?.detail || 'Failed to load class data');
        setLoading(false);
      }
    };
    
    loadClassFeed();
  }, [classId, navigate]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:8000/api/classes/${classId}/posts`,
        {
          title: "New Post",
          content: newPost
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setPosts([response.data, ...posts]);
      setShowNewPostForm(false);
      setNewPost("");
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100'
      }`}>
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100'
      }`}>
        <div className="text-red-500 text-xl">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${
      darkMode ? 'bg-gradient-to-r from-slate-800 to-gray-950 text-white' : 'bg-gradient-to-r from-indigo-100 to-pink-100 text-gray-900'
    }`}>
      {/* Centered Navbar */}
      <div className="fixed top-0 left-0 right-0 flex justify-center z-50 p-4">
        <motion.nav 
          className="navbar w-auto bg-white/80 dark:bg-gray-800/80 backdrop-blur-md py-2 px-6 rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50"
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

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-6">
              <Link
                to="/"
                className={`text-gray-900 dark:text-white hover:${darkMode ? 'text-cyan-400' : 'text-blue-500'} transition-colors duration-300 text-sm md:text-base`}
              >
                Home
              </Link>
              <Link
                to="/tambellini"
                className={`text-gray-900 dark:text-white hover:${darkMode ? 'text-cyan-400' : 'text-blue-500'} transition-colors duration-300 text-sm md:text-base`}
              >
                Tambellini
              </Link>
              <Link
                to="/musk"
                className={`text-gray-900 dark:text-white hover:${darkMode ? 'text-cyan-400' : 'text-blue-500'} transition-colors duration-300 text-sm md:text-base`}
              >
                Musk
              </Link>
              <Link
                to="/help"
                className={`text-gray-900 dark:text-white hover:${darkMode ? 'text-cyan-400' : 'text-blue-500'} transition-colors duration-300 text-sm md:text-base`}
              >
                Help
              </Link>
            </div>

            {/* Dark Mode Toggle */}
            <motion.button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-full ${
                darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
              } transition-colors duration-300`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              {darkMode ? "🌞" : "🌙"}
            </motion.button>

            {/* Profile Icon */}
            <motion.div
              className="relative"
              whileHover={{ scale: 1.1 }}
            >
              <svg
                className={`w-8 h-8 ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </motion.div>

            {/* Sign Out Button */}
            <motion.button
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('class_info');
                navigate('/sign-in');
              }}
              className={`px-4 py-2 rounded-lg ${
                darkMode 
                  ? 'bg-red-600 hover:bg-red-500' 
                  : 'bg-red-500 hover:bg-red-600'
              } text-white transition-colors duration-300`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Sign Out
            </motion.button>
          </div>
        </motion.nav>
      </div>

      {/* Main Content - Fixed container width and padding */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
        {classData ? (
          <div className="space-y-6">
            <motion.h1 
              className="text-4xl font-bold mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {classData.name}
            </motion.h1>
            
            {/* New Post Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowNewPostForm(true)}
              className={`mb-6 px-6 py-3 rounded-lg ${
                darkMode ? 'bg-teal-600 hover:bg-teal-500' : 'bg-blue-600 hover:bg-blue-700'
              } text-white font-semibold shadow-lg flex items-center justify-center gap-2`}
            >
              <svg 
                className="w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 4v16m8-8H4" 
                />
              </svg>
              Create New Post
            </motion.button>
            
            {/* Posts Grid */}
            <div className="grid gap-6">
              {posts.map((post, index) => (
                <motion.div 
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className={`p-6 rounded-lg shadow-lg ${
                    darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'
                  } transition-colors duration-300`}
                >
                  <h2 className="text-xl font-semibold mb-4">{post.title}</h2>
                  <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {post.content}
                  </p>
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Posted by {post.author} on {new Date(post.created_at).toLocaleDateString()}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-xl">Loading class data...</p>
          </div>
        )}
      </div>

      {/* New Post Modal */}
      <AnimatePresence>
        {showNewPostForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`${
                darkMode ? 'bg-gray-800' : 'bg-white'
              } rounded-lg p-6 max-w-2xl w-full shadow-xl`}
            >
              <h2 className="text-2xl font-bold mb-4">Create New Post</h2>
              <form onSubmit={handleCreatePost}>
                <div className="mb-4">
                  <textarea
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    className={`w-full p-4 rounded-lg border ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    rows="6"
                    placeholder="What's on your mind?"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-4">
                  <motion.button
                    type="button"
                    onClick={() => setShowNewPostForm(false)}
                    className={`px-4 py-2 rounded-lg ${
                      darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    className={`px-4 py-2 rounded-lg text-white ${
                      darkMode ? 'bg-teal-600 hover:bg-teal-500' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Post
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClassFeed; 