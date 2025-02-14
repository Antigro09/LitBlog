import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from 'axios';

const RoleSelection = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [darkMode] = useState(() => {
    return JSON.parse(localStorage.getItem('darkMode')) ?? false;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Get the token from localStorage (set this during login)
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      if (role === 'student') {
        // Verify class code
        const response = await axios.post('http://localhost:8000/api/verify-class-code', {
          code: code
        }, config);
        if (response.data.valid) {
          // Update user role and class enrollment
          await axios.post('http://localhost:8000/api/update-role', {
            role: 'student',
            classCode: code
          }, config);
          navigate('/class-feed');
        }
      } else if (role === 'teacher') {
        // Verify admin code
        const response = await axios.post('http://localhost:8000/api/verify-admin-code', {
          code: code
        }, config);
        if (response.data.valid) {
          // Update user role
          await axios.post('http://localhost:8000/api/update-role', {
            role: 'teacher'
          }, config);
          navigate('/teacher-dashboard');
        }
      }
    } catch (error) {
      setError(error.response?.data?.detail || 'Invalid code. Please try again.');
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center transition-all duration-500 ${
      darkMode ? 'bg-gradient-to-r from-slate-800 to-gray-950 text-gray-200' : 'bg-gradient-to-r from-indigo-100 to-pink-100 text-gray-900'
    }`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`w-full max-w-md p-8 rounded-lg shadow-lg ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        }`}
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Select Your Role</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className={`w-full p-3 rounded-lg border ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-blue-500`}
              required
            >
              <option value="">Select a role</option>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
          </div>

          {role && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6"
            >
              <label className="block text-sm font-medium mb-2">
                {role === 'student' ? 'Class Code' : 'Admin Code'}
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className={`w-full p-3 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-blue-500`}
                placeholder={role === 'student' ? 'Enter class code' : 'Enter admin code'}
                required
              />
            </motion.div>
          )}

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-500 text-sm text-center mb-4"
            >
              {error}
            </motion.p>
          )}

          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full p-3 rounded-lg text-white font-medium ${
              darkMode ? 'bg-teal-600 hover:bg-teal-500' : 'bg-blue-600 hover:bg-blue-700'
            } transition-colors duration-300`}
          >
            Continue
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default RoleSelection; 