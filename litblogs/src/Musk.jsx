import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import './LitBlogs.css'; // Import your styles

const Musk = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null); // Track selected class (3, 5, or 7)
  const [classPosts, setClassPosts] = useState([]); // Posts for the selected class
  const dropdownRef = useRef(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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

  // Toggle dropdown
  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
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

  // Close dropdown when clicking outside
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

  return (
    <div className={`min-h-screen transition-all duration-500 ${darkMode ? 'bg-gradient-to-r from-slate-800 to-gray-950 text-gray-200' : 'bg-gradient-to-r from-indigo-100 to-pink-100 text-gray-900'}`}>
      {/* Navbar */}
      <nav className="navbar z-50 fixed top-4 left-1/2 transform -translate-x-1/2 w-auto bg-white/80 dark:bg-gray-800/80 backdrop-blur-md py-2 px-6 rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center gap-6 whitespace-nowrap">
          {/* Logo */}
          <Link to="/">
            <motion.img
              src="/logo.png"
              alt="Logo"
              className="h-8 transition-transform duration-300 cursor-pointer"
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
            <Link
              to="/tambellini"
              className={`text-gray-900 dark:text-white hover:${darkMode ? 'text-cyan-400' : 'text-blue-500'} transition-colors duration-300 text-sm md:text-base`}
            >
              Ms. Tambellini’s English 10
            </Link>
            <Link
              to="/musk"
              className={`text-gray-900 dark:text-white hover:${darkMode ? 'text-cyan-400' : 'text-blue-500'} transition-colors duration-300 text-sm md:text-base`}
            >
              Ms. Musk’s English 9
            </Link>
            <Link
              to="/help"
              className={`text-gray-900 dark:text-white hover:${darkMode ? 'text-cyan-400' : 'text-blue-500'} transition-colors duration-300 text-sm md:text-base`}
            >
              Help
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
                  <Link
                    to="/tambellini"
                    className="block px-4 py-2 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 truncate"
                  >
                    Ms. Tambellini’s 10 English
                  </Link>
                  <Link
                    to="/musk"
                    className="block px-4 py-2 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 truncate"
                  >
                    Ms. Musk’s 9 English
                  </Link>
                  <Link
                    to="/help"
                    className="block px-4 py-2 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 truncate"
                  >
                    Help
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sign In Icon */}
          <Link to="/sign-in">
            <motion.svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 448 512"
              className={`h-6 w-6 p-1 border-2 rounded-full cursor-pointer transition-all duration-300 ${
                darkMode
                  ? 'fill-white border-white hover:bg-gray-700'
                  : 'fill-gray-900 border-gray-900 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              whileHover={{ scale: 1.1 }}
            >
              <path d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zM178.3 304C79.8 304 0 383.8 0 482.3 0 498.7 13.3 512 29.7 512h388.6c16.4 0 29.7-13.3 29.7-29.7 0-98.5-79.8-178.3-178.3-178.3z" />
            </motion.svg>
          </Link>
        </div>
      </nav>

      {/* Toggle Dark Mode Button */}
      <motion.div
        className="absolute top-32 right-4 z-10"
        whileHover={{ scale: 1.1 }}
      >
        <button
          onClick={toggleDarkMode}
          className="bg-gray-800 text-white p-2.5 rounded-full shadow-lg transition-transform duration-300 hover:bg-gray-700"
        >
          {darkMode ? "Light Mode" : "Dark Mode"}
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
          Ms. Musk’s English 9
        </motion.h2>
        <motion.p
          className="text-gray-600 dark:text-gray-400 text-xl mb-8 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Engage with Ms. Musk’s English 9 class, a creative environment for learning and exploration.
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
      <footer className="bg-gray-200 dark:bg-gray-900 py-8 text-center text-gray-700 dark:text-gray-300">
        <p>&copy; 2025 Ms. Musk’s English 9. All Rights Reserved.</p>
      </footer>
    </div>
  );
};

export default Musk;