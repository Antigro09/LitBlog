import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import Loader from './components/Loader';
import Navbar from './components/Navbar';

const StudentHub = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [classCode, setClassCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('current');
  const [posts, setPosts] = useState([]);
  const [darkMode, setDarkMode] = useState(() => {
    return JSON.parse(localStorage.getItem('darkMode')) ?? false;
  });

  useEffect(() => {
    const storedUserInfo = localStorage.getItem('user_info');
    if (storedUserInfo) {
      setUserInfo(JSON.parse(storedUserInfo));
    }
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_info');
    localStorage.removeItem('class_info');
    setUserInfo(null);
    navigate('/');
  };

  useEffect(() => {
    fetchClasses();
    fetchUserPosts();
  }, []);

  const fetchClasses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8000/api/student/classes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClasses(response.data);
      setLoading(false);
    } catch (error) {
      setError('Failed to load classes');
      setLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8000/api/student/posts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPosts(response.data);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    }
  };

  const joinClass = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:8000/api/student/join-class', 
        { access_code: classCode },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      setShowJoinForm(false);
      setClassCode('');
      fetchClasses();
    } catch (error) {
      setError('Failed to join class');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-gray-900 dark:to-gray-800">
        <Loader />
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${darkMode ? 'bg-gradient-to-r from-slate-800 to-gray-950 text-gray-200' : 'bg-gradient-to-r from-indigo-100 to-pink-100 text-gray-900'}`}>
      <Navbar
        userInfo={userInfo}
        onSignOut={handleSignOut}
        darkMode={darkMode}
        logo="/logo.png"
      />
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-gray-50/60 dark:bg-gray-800/60 backdrop-blur-md min-h-screen p-4 border-r border-white/10">
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Navigation</h2>
            <div className="space-y-2">
              <button
                onClick={() => setActiveTab('current')}
                className={`w-full p-2 rounded-lg text-left transition-colors ${
                  activeTab === 'current' 
                    ? 'bg-blue-500 text-white' 
                    : 'hover:bg-white/5'
                }`}
              >
                Current Classes
              </button>
              <button
                onClick={() => setActiveTab('previous')}
                className={`w-full p-2 rounded-lg text-left transition-colors ${
                  activeTab === 'previous' 
                    ? 'bg-blue-500 text-white' 
                    : 'hover:bg-white/5'
                }`}
              >
                Previous Classes
              </button>
              <button
                onClick={() => setActiveTab('posts')}
                className={`w-full p-2 rounded-lg text-left transition-colors ${
                  activeTab === 'posts' 
                    ? 'bg-blue-500 text-white' 
                    : 'hover:bg-white/5'
                }`}
              >
                Post History
              </button>
            </div>
          </div>

          <motion.button
            onClick={() => setShowJoinForm(true)}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Join New Class
          </motion.button>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8 mt-16">
          {activeTab === 'current' && (
            <div>
              <h1 className="text-3xl font-bold mb-6">Current Classes</h1>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classes.map((cls) => (
                  <motion.div
                    key={cls.id}
                    className="p-6 rounded-lg backdrop-blur-md bg-white/70 border dark:bg-slate-800/60 border-white/10 shadow-xl"
                    whileHover={{ scale: 1.02 }}
                    onClick={() => navigate(`/class-feed/${cls.id}`)}
                  >
                    <h3 className="text-xl font-semibold mb-2">{cls.name}</h3>
                    <p className="mb-4 opacity-80">{cls.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm opacity-60">
                        Teacher: {cls.teacher_name}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'previous' && (
            <div>
              <h1 className="text-3xl font-bold mb-6">Previous Classes</h1>
              <p className="text-gray-500">No previous classes found.</p>
            </div>
          )}

          {activeTab === 'posts' && (
            <div>
              <h1 className="text-3xl font-bold mb-6">Post History</h1>
              <div className="space-y-4">
                {posts.map((post) => (
                  <motion.div
                    key={post.id}
                    className="p-6 rounded-lg backdrop-blur-md bg-gray-50/60 dark:bg-slate-800/60 border border-white/10 shadow-xl"
                    whileHover={{ scale: 1.01 }}
                  >
                    <h3 className="text-xl font-semibold mb-2">{post.title}</h3>
                    <p className="mb-4 opacity-80">{post.content}</p>
                    <div className="flex justify-between items-center text-sm opacity-60">
                      <span>Posted in: {post.class_name}</span>
                      <span>{new Date(post.created_at).toLocaleDateString()}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Join Class Modal */}
      <AnimatePresence>
        {showJoinForm && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
            >
              <h2 className="text-2xl font-bold mb-4">Join a Class</h2>
              <form onSubmit={joinClass}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Class Code</label>
                  <input
                    type="text"
                    value={classCode}
                    onChange={(e) => setClassCode(e.target.value)}
                    className="w-full p-3 rounded-lg border dark:bg-gray-700 dark:border-gray-600"
                    placeholder="Enter class code"
                    required
                  />
                </div>
                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => setShowJoinForm(false)}
                    className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Join Class
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StudentHub; 