import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import Navbar from './components/Navbar';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [darkMode] = useState(() => {
    return JSON.parse(localStorage.getItem('darkMode')) ?? false;
  });
  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
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

        // Fetch all users and classes
        const [usersResponse, classesResponse] = await Promise.all([
          axios.get('http://localhost:8000/api/users', config),
          axios.get('http://localhost:8000/api/classes', config)
        ]);

        setUsers(usersResponse.data);
        setClasses(classesResponse.data);
        setLoading(false);
      } catch (error) {
        setError(error.response?.data?.detail || 'Failed to load dashboard data');
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

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

  return (
    <div className={`min-h-screen transition-all duration-500 ${darkMode ? 'bg-gradient-to-r from-slate-800 to-gray-950 text-gray-200' : 'bg-gradient-to-r from-indigo-100 to-pink-100 text-gray-900'}`}>
      {/* Navbar */}
      <Navbar 
      userInfo={userInfo}
      onSignOut={handleSignOut}
      darkMode={darkMode}
      logo="./logo.png"
      />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

        {/* Users Section */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Users</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {users.map((user) => (
              <motion.div
                key={user.id}
                whileHover={{ scale: 1.02 }}
                className={`p-4 rounded-lg shadow-md ${
                  darkMode ? 'bg-gray-800' : 'bg-white'
                }`}
              >
                <h3 className="font-semibold">{user.username}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {user.email}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Role: {user.role}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Classes Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Classes</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {classes.map((class_) => (
              <motion.div
                key={class_.id}
                whileHover={{ scale: 1.02 }}
                className={`p-4 rounded-lg shadow-md ${
                  darkMode ? 'bg-gray-800' : 'bg-white'
                }`}
              >
                <h3 className="font-semibold">{class_.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Code: {class_.access_code}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Students: {class_.student_count}
                </p>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard; 