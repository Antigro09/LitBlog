import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import axios from 'axios';

const ClassFeed = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [showNewPostForm, setShowNewPostForm] = useState(false);

  // Dark mode logic
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

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    localStorage.setItem('darkMode', JSON.stringify(!darkMode));
  };

  // Fetch posts
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/blogs');
        setPosts(response.data);
      } catch (error) {
        console.error('Error fetching posts:', error);
      }
    };
    fetchPosts();
  }, []);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:8000/api/blogs', {
        title: "New Post",
        content: newPost
      });
      setPosts([response.data, ...posts]);
      setShowNewPostForm(false);
      setNewPost("");
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  return (
    <div className={`min-h-screen transition-all duration-500 ${darkMode ? 'bg-gradient-to-r from-slate-800 to-gray-950 text-gray-200' : 'bg-gradient-to-r from-indigo-100 to-pink-100 text-gray-900'}`}>
      {/* Navbar */}
      <nav className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0">
                <img className="h-8 w-auto" src="/logo.png" alt="Logo" />
              </Link>
            </div>
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {darkMode ? "🌞" : "🌙"}
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Class Feed</h1>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowNewPostForm(true)}
            className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-teal-600 hover:bg-teal-500' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
          >
            New Post
          </motion.button>
        </div>

        {/* Posts Feed */}
        <div className="space-y-6">
          {posts.map((post) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-6 rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold">{post.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(post.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                  •••
                </button>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-4">{post.content}</p>
              <div className="flex items-center gap-4">
                <button className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400">
                  <span>👍</span> Like
                </button>
                <button className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400">
                  <span>💬</span> Comment
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* New Post Modal */}
        {showNewPostForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 max-w-md w-full`}
            >
              <h2 className="text-2xl font-bold mb-4">Create New Post</h2>
              <form onSubmit={handleCreatePost}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Content</label>
                  <textarea
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                    rows="4"
                    required
                  />
                </div>
                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => setShowNewPostForm(false)}
                    className="px-4 py-2 rounded bg-gray-500 text-white hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-2 rounded ${darkMode ? 'bg-teal-600 hover:bg-teal-500' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
                  >
                    Post
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassFeed; 