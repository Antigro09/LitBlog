import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import axios from 'axios';

const TeacherDashboard = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [classes, setClasses] = useState([]);
  const [showNewClassForm, setShowNewClassForm] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [newClassDescription, setNewClassDescription] = useState("");

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

  // Fetch teacher's classes
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/classes/teacher');
        setClasses(response.data);
      } catch (error) {
        console.error('Error fetching classes:', error);
      }
    };
    fetchClasses();
  }, []);

  const handleCreateClass = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:8000/api/classes', {
        name: newClassName,
        description: newClassDescription
      });
      setClasses([...classes, response.data]);
      setShowNewClassForm(false);
      setNewClassName("");
      setNewClassDescription("");
    } catch (error) {
      console.error('Error creating class:', error);
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowNewClassForm(true)}
            className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-teal-600 hover:bg-teal-500' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
          >
            Create New Class
          </motion.button>
        </div>

        {/* Class Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((class_) => (
            <motion.div
              key={class_.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-6 rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
            >
              <h3 className="text-xl font-semibold mb-2">{class_.name}</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{class_.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-sm">Access Code: {class_.access_code}</span>
                <Link
                  to={`/class/${class_.id}`}
                  className={`px-3 py-1 rounded ${darkMode ? 'bg-teal-600 hover:bg-teal-500' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
                >
                  View Class
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {/* New Class Modal */}
        {showNewClassForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 max-w-md w-full`}
            >
              <h2 className="text-2xl font-bold mb-4">Create New Class</h2>
              <form onSubmit={handleCreateClass}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Class Name</label>
                  <input
                    type="text"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={newClassDescription}
                    onChange={(e) => setNewClassDescription(e.target.value)}
                    className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                    rows="3"
                  />
                </div>
                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => setShowNewClassForm(false)}
                    className="px-4 py-2 rounded bg-gray-500 text-white hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-2 rounded ${darkMode ? 'bg-teal-600 hover:bg-teal-500' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
                  >
                    Create Class
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

export default TeacherDashboard; 