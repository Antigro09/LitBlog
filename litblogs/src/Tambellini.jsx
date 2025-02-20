import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from './components/Navbar';
import './LitBlogs.css'; // Import your styles

const Tambellini = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null); // Track selected class (3, 5, or 7)
  const [classPosts, setClassPosts] = useState([]); // Posts for the selected class

  // Mock data for posts (you can replace this with actual data from an API)
  const classData = {
    3: [
      { title: "Class 3 - Post 1", content: "This is the first post for Class 3" },
      { title: "Class 3 - Post 2", content: "This is the second post for Class 3" },
    ],
    5: [
      { title: "Class 5 - Post 1", content: "This is the first post for Class 5" },
      { title: "Class 5 - Post 2", content: "This is the second post for Class 5" },
    ],
    7: [
      { title: "Class 7 - Post 1", content: "This is the first post for Class 7" },
      { title: "Class 7 - Post 2", content: "This is the second post for Class 7" },
    ],
  };

  // Handle class block click
  const handleClassClick = (classNumber) => {
    setSelectedClass(classNumber);
    setClassPosts(classData[classNumber]); // Set posts for the selected class
  };

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

  // Apply the dark mode class to the document when darkMode state changes
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
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

      {/* Toggle Dark Mode Button */}
      <motion.div
        className="absolute top-5 right-4 z-10"
        whileHover={{ scale: 1.1 }}
      >
        <button
          onClick={toggleDarkMode}
          className="bg-gray-800 text-white p-2 rounded-full shadow-lg"
        >
          {darkMode ? "🌞" : "🌙"}
        </button>
      </motion.div>

      {/* Content */}
      <section className="py-24 text-center overflow-visible">
        <motion.h2
          className="relative -top-2 text-5xl md:text-7xl font-bold mb-4 bg-gradient-text bg-clip-text text-transparent pt-2 pb-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Ms. Tambellini’s English 10
        </motion.h2>
        <motion.p
          className="text-gray-600 dark:text-gray-400 text-xl mb-8 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Engage with Ms. Tambellini’s English 10 class, a creative environment for learning and exploration.
        </motion.p>
      </section>

      {/* Class Blocks (3, 5, 7) */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-8 px-10 py-12 pt-3">
        {[3, 5, 7].map((classNumber) => (
          <motion.div
            key={classNumber}
            className="class-block bg-gray-200 dark:bg-gray-800 p-6 rounded-xl shadow-lg cursor-pointer"
            whileHover={{ scale: 1.05 }}
            onClick={() => handleClassClick(classNumber)}
          >
            <h3 className="text-2xl text-gray-900 dark:text-white font-semibold text-center">
              Class {classNumber}
            </h3>
          </motion.div>
        ))}
      </section>

      {/* Class Posts Section */}
      {selectedClass && (
        <section className="py-16 bg-gray-100 dark:bg-gray-900">
          <motion.h3
            className="text-4xl font-bold text-center text-gray-900 dark:text-white mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Posts for Class {selectedClass}
          </motion.h3>

          <div className="space-y-8 max-w-4xl mx-auto">
            {classPosts.map((post, index) => (
              <motion.div
                key={index}
                className="post bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg"
                whileHover={{
                  scale: 1.05,
                  transition: { duration: 0.1 } // Fast transition for hover
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  scale: { type: "spring", stiffness: 500, damping: 50 }, // Set transition for scaling
                  opacity: { duration: 0.8, delay: 0.4 },
                  y: { duration: 0.8, delay: 0.4 }
                }}
              >
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white">{post.title}</h4>
                <p className="text-gray-700 dark:text-gray-300 mt-4">{post.content}</p>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className={`mt-12 transition-all duration-300 ${darkMode ? 'bg-gray-900 text-gray-300' : 'bg-gradient-to-r from-gray-100 to-gray-100 text-gray-900'}`}>
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center md:text-left">
            {/* LitBlog Info */}
            <div>
              <h3 className="text-lg font-semibold mb-4">LitBlog</h3>
              <p className="text-gray-400">Connecting writers and readers worldwide</p>
            </div>
            {/* Resources */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-blue-400">Blog</a></li>
                <li><a href="#" className="hover:text-blue-400">Guides</a></li>
                <li><a href="#" className="hover:text-blue-400">Tutorials</a></li>
              </ul>
            </div>
            {/* Company */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-blue-400">About</a></li>
              </ul>
            </div>
          </div>
          {/* Copyright */}
          <div className="border-t border-gray-800 mt-8 pt-6 text-center text-gray-400">
            &copy; 2025 Ms. Tambellini’s English 10. All Rights Reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Tambellini;