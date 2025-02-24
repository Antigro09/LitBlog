import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import Navbar from './components/Navbar';
import ClassDetails from './components/ClassDetails';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [darkMode] = useState(() => {
    return JSON.parse(localStorage.getItem('darkMode')) ?? false;
  });
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [showClassForm, setShowClassForm] = useState(false);
  const [newClass, setNewClass] = useState({ name: '', description: '' });
  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);

  // Combine the useEffects
  useEffect(() => {
    // Load user info
    const storedUserInfo = localStorage.getItem('user_info');
    if (storedUserInfo) {
      setUserInfo(JSON.parse(storedUserInfo));
    }

    // Fetch dashboard data
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/sign-in');
      return;
    }

    const fetchData = async () => {
      try {
        const config = {
          headers: { Authorization: `Bearer ${token}` }
        };

        // Fetch teacher dashboard data
        const response = await axios.get('http://localhost:8000/api/teacher/dashboard', config);
        
        // Update state with teacher data
        setClasses(response.data.classes || []);
        setUserInfo(prev => ({
          ...prev,
          name: response.data.name
        }));
        setLoading(false);
      } catch (error) {
        setError(error.response?.data?.detail || 'Failed to load dashboard data');
        setLoading(false);
        if (error.response?.status === 401) {
          navigate('/sign-in');
        }
      }
    };

    fetchData();
  }, [navigate]);

  // Stats for the dashboard
  const stats = [
    {
      title: "Total Classes",
      value: classes?.length || 0,
      color: "from-blue-600 to-indigo-600",
      icon: "📚"
    },
    {
      title: "Total Students",
      value: classes?.reduce((acc, cls) => 
        acc + (cls.students?.length || 0), 0
      ) || 0,
      color: "from-emerald-500 to-teal-500",
      icon: "👥"
    },
    {
      title: "Active Today",
      value: "85%",
      color: "from-purple-600 to-pink-600",
      icon: "📊"
    },
    {
      title: "Average Engagement",
      value: "92%",
      color: "from-orange-500 to-yellow-500",
      icon: "⭐"
    }
  ];

  const createClass = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:8000/api/classes', newClass, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setClasses(prev => [...prev, response.data]);
      
      setShowClassForm(false);
      setNewClass({ name: '', description: '' });
    } catch (error) {
      console.error('Error creating class:', error);
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-slate-800 to-gray-950">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-slate-800 to-gray-950">
        <div className="text-red-500 text-xl">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-all duration-500 ${
      darkMode 
        ? 'bg-gradient-to-r from-slate-800 to-gray-950 text-gray-200' 
        : 'bg-gradient-to-r from-indigo-100 to-pink-100 text-gray-900'
    }`}>
      {/* Navbar */}
      <Navbar 
        userInfo={userInfo}
        onSignOut={handleSignOut}
        darkMode={darkMode}
        logo="./logo.png"
      />
      
      {/* Sidebar - Keep it fixed */}
      <motion.div 
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className="fixed left-0 top-0 h-full w-64 backdrop-blur-md bg-gray-50/40 dark:bg-gray-800/10 border-r border-white/10 dark:border-gray-700/10"
      >
        <div className="p-6">
          <motion.h2 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xl font-bold mb-8"
          >
            Welcome, {userInfo?.name}
          </motion.h2>
          
          {/* Navigation Items */}
          <nav className="space-y-2">
            {['Dashboard', 'Classes', 'Students', 'Analytics'].map((tab) => (
              <motion.button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`w-full text-left p-3 rounded-lg transition-all ${
                  activeTab === tab 
                    ? 'bg-blue-500/20 text-blue-500' 
                    : 'hover:bg-white/5'
                }`}
                whileHover={{ x: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                {tab}
              </motion.button>
            ))}
          </nav>
        </div>
      </motion.div>

      {/* Main Content - Add margin-left for sidebar and padding-top for navbar */}
      <div className="ml-64 pt-20">
        <motion.div 
          className="p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {activeTab === 'Dashboard' && (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {stats.map((stat, index) => (
                    <motion.div
                      key={stat.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-xl hover:shadow-2xl transition-all duration-300`}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-2xl">{stat.icon}</span>
                        <div className={`h-8 w-8 rounded-full bg-gradient-to-r ${stat.color} flex items-center justify-center`}>
                          <span className="text-white text-xs">+{index + 1}%</span>
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold mb-2">{stat.title}</h3>
                      <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {stat.value}
                      </p>
                    </motion.div>
                  ))}
                </div>

                {/* Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <motion.div
                    className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-xl`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
                    <div className="space-y-4">
                      {classes?.slice(0, 4).map((cls) => (
                        <div key={cls.id} className={`flex items-center gap-4 p-3 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}>
                          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white">
                            {cls.name?.[0] || '?'}
                          </div>
                          <div>
                            <h4 className="font-medium">{cls.name}</h4>
                            <p className="text-sm opacity-70">{cls.students?.length || 0} students</p>
                          </div>
                        </div>
                      )) || (
                        <div className="text-center text-gray-500">
                          No classes yet
                        </div>
                      )}
                    </div>
                  </motion.div>

                  <motion.div
                    className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-xl`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <motion.button
                        onClick={() => setShowClassForm(true)}
                        className="p-4 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Create New Class
                      </motion.button>
                      <motion.button
                        className="p-4 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        View Reports
                      </motion.button>
                      <motion.button
                        className="p-4 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Send Message
                      </motion.button>
                      <motion.button
                        className="p-4 rounded-lg bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-medium"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Schedule Event
                      </motion.button>
                    </div>
                  </motion.div>
                </div>
              </>
            )}

            {activeTab === 'Classes' && (
              <div className="space-y-6">
                {!selectedClass ? (
                  <>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold">My Classes</h2>
                      <motion.button
                        onClick={() => setShowClassForm(true)}
                        className="px-4 py-2 rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Create New Class
                      </motion.button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {classes?.map(cls => (
                        <motion.div 
                          key={cls.id}
                          className="p-6 rounded-lg backdrop-blur-md bg-white dark:bg-gray-800/10 border border-white/10 dark:border-gray-700/10 shadow-xl cursor-pointer"
                          whileHover={{ scale: 1.02 }}
                          onClick={() => setSelectedClass(cls)}
                        >
                          <h3 className="text-xl font-semibold mb-2">{cls.name}</h3>
                          <p className="mb-4 opacity-80">{cls.description}</p>
                          <div className="flex justify-between items-center">
                            <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-500">
                              Code: {cls.access_code || cls.joinCode || 'No code available'}
                            </span>
                            <span className="text-sm opacity-80">
                              {cls.students?.length || 0} students
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </>
                ) : (
                  <ClassDetails
                    classData={selectedClass}
                    darkMode={darkMode}
                    onBack={() => setSelectedClass(null)}
                  />
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>

      {/* Class Creation Modal */}
      <AnimatePresence>
        {showClassForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className={`p-6 rounded-lg backdrop-blur-md ${
                darkMode ? 'bg-gray-800/90' : 'bg-white/90'
              } shadow-xl w-full max-w-md`}
            >
              <h2 className="text-2xl font-bold mb-6">Create New Class</h2>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                createClass();
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Class Name</label>
                    <input
                      type="text"
                      value={newClass.name}
                      onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                      className={`w-full p-3 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300'
                      } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      placeholder="Enter class name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <textarea
                      value={newClass.description}
                      onChange={(e) => setNewClass({ ...newClass, description: e.target.value })}
                      className={`w-full p-3 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300'
                      } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      rows="4"
                      placeholder="Enter class description"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-4 mt-6">
                  <motion.button
                    type="button"
                    onClick={() => setShowClassForm(false)}
                    className={`px-4 py-2 rounded-lg ${
                      darkMode 
                        ? 'bg-gray-700 hover:bg-gray-600' 
                        : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    className="px-4 py-2 rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Create Class
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

export default TeacherDashboard;